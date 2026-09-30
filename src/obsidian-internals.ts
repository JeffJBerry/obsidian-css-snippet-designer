/**
 * Narrow, feature-detected access to Obsidian internals.
 *
 * Obsidian exposes no public API for reloading or enabling CSS snippets, so
 * the snippet manager on `app.customCss` is the only route. Confining it to
 * this module means there is exactly one place to audit or update when
 * Obsidian changes, instead of an untyped cast in the middle of the view.
 */
import type { App } from 'obsidian';

interface CustomCssManager {
	requestLoadSnippets?: () => Promise<void> | void;
	setCssEnabledStatus?: (snippetName: string, enabled: boolean) => void;
	readSnippets?: (requestLoad?: boolean) => Promise<void> | void;
	/**
	 * Snippet path -> file contents. Obsidian caches each snippet's text and
	 * drops the entry only when its own file watcher reports a change. We write
	 * through the low-level vault adapter, which the watcher can miss, so
	 * `loadSnippets` would keep re-applying the previous bytes and the design
	 * would snap back the moment the plugin is switched off. Clearing the entry
	 * first is what makes `requestLoadSnippets` actually reread the file.
	 */
	csscache?: Map<string, string>;
}

function getCustomCssManager(app: App): CustomCssManager | null {
	const candidate = (app as App & { customCss?: unknown }).customCss;
	return typeof candidate === 'object' && candidate !== null ? candidate : null;
}

/**
 * Ask Obsidian to re-read the snippets folder and enable `snippetName`.
 * Returns false when the internal API is unavailable, so callers can tell the
 * user to enable the snippet themselves rather than failing silently.
 */
export async function reloadAndEnableSnippet(app: App, snippetName: string): Promise<boolean> {
	const manager = getCustomCssManager(app);
	if (!manager) return false;
	try {
		// Drop the cached copy of this snippet before asking for a reload,
		// otherwise `loadSnippets` serves the bytes it cached on the last watcher
		// event and never sees the file we just wrote.
		const snippetPath = `${app.vault.configDir}/snippets/${snippetName}.css`;
		manager.csscache?.delete(snippetPath);
		// Refresh the folder listing as well: a brand-new snippet is not in
		// Obsidian's cached name list, so `loadSnippets` would not look for it.
		await manager.readSnippets?.(true);
		await manager.requestLoadSnippets?.();
		manager.setCssEnabledStatus?.(snippetName, true);
		return true;
	} catch (err) {
		console.warn('[CSS Snippet Designer] Could not refresh snippets:', err);
		return false;
	}
}

/**
 * Switch Obsidian's active base theme.
 *
 * `changeTheme` is likewise undocumented; a no-op fallback keeps the designer
 * usable if it ever disappears.
 */
export function changeTheme(app: App, theme: 'obsidian' | 'moonstone'): void {
	const fn = (app as App & { changeTheme?: (t: string) => void }).changeTheme;
	if (typeof fn === 'function') {
		try {
			fn.call(app, theme);
		} catch (err) {
			console.warn('[CSS Snippet Designer] Could not change theme:', err);
		}
	}
}

const ILLEGIBLE_SYMBOL_FONT_REGEX = /\b(symbol|symbols|dingbats?|wingdings?|webdings?|marlett|mdl2|fluent\s*icons?|icons?|assets|math|braille|chess|hieroglyphs?|music|keystrokes?|strokes?|fontawesome|font\s*awesome|material\s*icons?|glyphicons?|entypo|icomoon)\b|olfsimple|qtquick/i;

// Catches comma-separated point size lists in legacy bitmap font names, e.g. "8,10,12,14,18,24" or "10,12,15"
const BITMAP_POINT_SIZES_REGEX = /\b\d+,\d+(?:,\d+)*\b/;

const KNOWN_SYMBOL_EXACT = new Set([
	// Symbol, Dingbat & Icon fonts
	'webdings',
	'wingdings',
	'wingdings 2',
	'wingdings 3',
	'symbol',
	'symbols',
	'mt extra',
	'marlett',
	'ms outlook',
	'bookshelf symbol 7',
	'ms reference specialty',
	'zwadobef',
	'segoe ui symbol',
	'segoe ui emoji',
	'segoe ui historic',
	'segoe mdl2 assets',
	'segoe fluent icons',
	'holo mdl2 assets',
	'holomdl2 assets',
	'cambria math',
	'fontawesome',
	'font awesome',

	// Legacy raster / bitmap fonts
	'small fonts',
	'modern',
	'roman',
	'script',

	// Extreme novelty / illegible decorative fonts
	'blackadder itc',
	'blackadder',
	'chiller',
	'gigi',
	'goudy stout',
	'herculanum',
	'jokerman',
	'luminari',
	'old english text mt',
	'old english',
	'parchment',
	'playbill',
	'ravie',
	'trattatello',
	'zapfino',

	// Obscure non-Latin script fallbacks illegible for notes/UI
	'javanese text',
	'microsoft himalaya',
	'microsoft new tai lue',
	'microsoft phagspa',
	'microsoft tai le',
	'microsoft uighur',
	'microsoft yi baiti',
	'mongolian baiti',
	'mv boli',
	'myanmar text',
	'tibetan machine uni',

	// Framework / device / property leakage
	'lg display-regular',
	'lg display',
]);

/**
 * Checks whether a font name corresponds to a symbol, dingbat, icon, legacy bitmap,
 * or illegible font unsuitable for notes and UI.
 */
export function isIllegibleSymbolFont(fontName: string): boolean {
	const trimmed = fontName.trim();
	if (!trimmed || trimmed.startsWith('@')) {
		// Windows vertical rotated fonts start with '@' and are illegible in horizontal UI
		return true;
	}
	const norm = trimmed.toLowerCase();
	if (KNOWN_SYMBOL_EXACT.has(norm)) {
		return true;
	}
	if (BITMAP_POINT_SIZES_REGEX.test(norm)) {
		return true;
	}
	// Also check base name after stripping font weights and style suffixes (e.g. "Chiller Regular", "Microsoft Uighur Bold")
	const base = norm
		.replace(/\s*\([^)]*\)/g, '')
		.replace(/&.*/g, '')
		.replace(/\b(regular|bold|italic|oblique|light|medium|semibold|semi-bold|demibold|demi|black|heavy|thin|extrabold|extra-bold|extralight|extra-light|ultrabold|ultra-bold|ultralight|ultra-light|condensed|cond|extended|ext)\b/gi, '')
		.replace(/\s+/g, ' ')
		.trim();
	if (base && KNOWN_SYMBOL_EXACT.has(base)) {
		return true;
	}
	return ILLEGIBLE_SYMBOL_FONT_REGEX.test(norm) || (base ? ILLEGIBLE_SYMBOL_FONT_REGEX.test(base) : false);
}

let cachedSystemFonts: string[] | null = null;
let systemFontsPromise: Promise<string[]> | null = null;

/**
 * Retrieve installed system fonts using Obsidian's internal `get-fonts` Electron binding,
 * with standard `queryLocalFonts` as a web fallback.
 * Results and in-flight operations are cached so multiple calls share a single discovery.
 */
export function getSystemFonts(): Promise<string[]> {
	if (cachedSystemFonts) {
		return Promise.resolve(cachedSystemFonts);
	}
	if (systemFontsPromise) {
		return systemFontsPromise;
	}

	systemFontsPromise = (async () => {
		// 1. Obsidian Electron native module (`get-fonts`)
		try {
			const win = typeof window !== 'undefined' ? (window as unknown as { require?: (mod: string) => { getFonts?: () => Promise<string[]> } }) : undefined;
			if (win && typeof win.require === 'function') {
				const gf = win.require('get-fonts');
				if (gf && typeof gf.getFonts === 'function') {
					const fonts = await gf.getFonts();
					if (Array.isArray(fonts) && fonts.length > 0) {
						return Array.from(new Set(fonts))
							.filter((f) => !isIllegibleSymbolFont(f))
							.sort((a, b) => a.localeCompare(b));
					}
				}
			}
		} catch {
			// Fallback below
		}

		// 2. Standard Web API `queryLocalFonts` fallback
		try {
			const win = typeof window !== 'undefined' ? (window as unknown as { queryLocalFonts?: () => Promise<Array<{ family: string }>> }) : undefined;
			if (win && typeof win.queryLocalFonts === 'function') {
				const localFonts = await win.queryLocalFonts();
				if (Array.isArray(localFonts) && localFonts.length > 0) {
					return Array.from(new Set(localFonts.map((f) => f.family)))
						.filter((f) => !isIllegibleSymbolFont(f))
						.sort((a, b) => a.localeCompare(b));
				}
			}
		} catch {
			// Fallback below
		}

		return [];
	})().then((fonts) => {
		cachedSystemFonts = fonts;
		return fonts;
	});

	return systemFontsPromise;
}

/** Reset cached system fonts (primarily for automated testing). */
export function resetCachedSystemFontsForTest(): void {
	cachedSystemFonts = null;
	systemFontsPromise = null;
}
