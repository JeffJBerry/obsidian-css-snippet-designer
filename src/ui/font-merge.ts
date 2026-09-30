/**
 * Pure font-option helpers: normalise family names and merge the system font
 * list into a catalogue without adding weight/width/subfamily variants of a
 * family the catalogue already lists.
 *
 * Kept free of Obsidian imports so it can be unit-tested directly.
 */
import type { SelectOption } from '../schema';
import { isIllegibleSymbolFont } from '../obsidian-internals';

/** Options arrays already merged in this session, so a re-render does not re-add. */
const systemFontsMergedOptions = new WeakSet<SelectOption[]>();

const GENERIC_CSS_FALLBACKS = new Set([
	'sans-serif',
	'serif',
	'monospace',
	'cursive',
	'fantasy',
	'system-ui',
	'-apple-system',
	'blinkmacsystemfont',
]);

/**
 * Tokens that name a weight, width, style or subfamily rather than a family.
 * Windows and macOS expose many of these as separate "families" ("Sitka Text",
 * "Segoe UI Variable Display", "Bahnschrift Light SemiCondensed"), which the
 * picker then looked like duplicates of the base family.
 */
const VARIANT_TOKENS =
	/\b(light|thin|regular|book|normal|medium|bold|black|heavy|italic|oblique|roman|condensed|cond|extended|ext|demibold|demi|text|display|small|banner|heading|subheading|caption|poster|compressed|variable|ui|extra[a-z]*|ultra[a-z]*|semi[a-z]*)\b/gi;

/**
 * Collapse a font name to its base family so variants compare equal:
 * "Sitka Text" -> "sitka", "Segoe UI Variable Display" -> "segoe",
 * "Bahnschrift Light SemiCondensed" -> "bahnschrift".
 */
export function fontFamilyKey(name: string): string {
	return name
		.replace(/\s*\([^)]*\)/g, '')
		.replace(/&.*/g, '')
		.toLowerCase()
		.replace(/[_-]+/g, ' ')
		.replace(VARIANT_TOKENS, ' ')
		.replace(/\b\d{3,4}\b/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

/** Every family name (and base-family key) the given options already cover. */
export function extractExistingFontNames(options: SelectOption[]): Set<string> {
	const names = new Set<string>();

	for (const opt of options) {
		names.add(opt.label.toLowerCase().trim());

		// Extract from label (e.g. "Palatino / Palatino Linotype (Humanist Book Serif)")
		const cleanLabel = opt.label.replace(/\s*\([^)]*\)/g, '').trim();
		for (const part of cleanLabel.split('/')) {
			const p = part.trim().toLowerCase();
			if (p) {
				names.add(p);
				const key = fontFamilyKey(p);
				if (key) names.add(key);
			}
		}

		// Extract from CSS value fallback stack
		for (const raw of opt.value.split(',')) {
			const cleaned = raw.trim().replace(/^['"]|['"]$/g, '').toLowerCase();
			if (cleaned && !GENERIC_CSS_FALLBACKS.has(cleaned)) {
				names.add(cleaned);
				const key = fontFamilyKey(cleaned);
				if (key) names.add(key);
			}
		}
	}

	return names;
}

/**
 * Installed families that only duplicate a style the catalogue already offers,
 * so the merge never surfaces them. Matched on {@link fontFamilyKey}.
 */
const EXCLUDED_SYSTEM_FONT_KEYS = new Set<string>([
	'courier new',
	'menlo',
	'chalkboard',
	'chalkboard se',
	'snell roundhand',
	'mingliu mscs extb',
	'mingliu hkscs extb',
	'niagara engraved',
	'poppins',
	'nunito',
	'arial unicode ms',
	'din',
	'lucida sans unicode',
	'segoe',
	'merriweather',
	'crimson pro',
	'cinzel',
	'playfair',
	'bodoni 72 smallcaps',
	'inconsolata',
	'hack',
	'sf mono',
	'sfmono',
	'andale mono',
]);

/**
 * Merges system fonts into a font options array exactly once, filtering out
 * illegible symbol fonts and deduplicating both against existing presets and
 * within the system font batch.
 */
export function mergeSystemFontsIntoOptions(options: SelectOption[], sysFonts: string[]): boolean {
	if (systemFontsMergedOptions.has(options) || sysFonts.length === 0) {
		return false;
	}

	const existingNames = extractExistingFontNames(options);
	let added = false;

	for (const fontName of sysFonts) {
		if (isIllegibleSymbolFont(fontName)) {
			continue;
		}

		const clean = fontName.trim();
		if (!clean) continue;

		const lower = clean.toLowerCase();
		const key = fontFamilyKey(clean);

		// Never surface a family that only duplicates one already offered.
		if (EXCLUDED_SYSTEM_FONT_KEYS.has(lower) || (key && EXCLUDED_SYSTEM_FONT_KEYS.has(key))) {
			continue;
		}

		// Skip if the family (or a weight/width/subfamily variant of it) is
		// already in the list - covers curated fonts and this batch alike.
		if (existingNames.has(lower) || (key && existingNames.has(key))) {
			continue;
		}

		options.push({
			label: clean,
			value: `"${clean}", sans-serif`,
			group: 'System Fonts',
		});

		existingNames.add(lower);
		if (key) existingNames.add(key);
		added = true;
	}

	systemFontsMergedOptions.add(options);
	return added;
}
