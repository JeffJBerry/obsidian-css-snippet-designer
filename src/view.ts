import { ItemView, WorkspaceLeaf, debounce, Notice, ToggleComponent, setIcon } from 'obsidian';
import { SnippetEngine, validateCss, formatIssues } from './engine';
import { buildGeneratedCss, buildCompanionBindings, mergeIntoExisting, containmentFixes, overflowCompanions, buildReducedMotionBlock, emitsCheckboxStyling, emitsToggleSwitchProtection, customisedCalloutGroups, collectReferencedProperties } from './snippet/persist';
import { reloadAndEnableSnippet, changeTheme, getSystemFonts } from './obsidian-internals';
import { interpolateHexColor } from './css/color';
import { computeShadowString, generateKeyframeBlock } from './css/shadows';

import { generateCheckboxStyleRules } from './css/checkbox';
import { generateGlassCss } from './css/glass';
import { generateCalloutCss } from './css/callouts';
import { ensureStylesInDocument, ensureEmbeddedFonts } from './ui/panel-styles';
import { previewFontFamily } from './ui/widgets';
import { scopeSelectors } from './css/selectors';
import {
	generateCustomBackgroundCss,
	generateUIElementCss,
} from './css/ui-elements';
import { SaveSnippetModal, ConfirmActionModal } from './ui/modals';
import { renderCategoryTab, renderColorsTab, renderElementsTab, renderShadowsTab } from './ui/tabs';
import { renderPresetsTab } from './ui/presets-tab';
import { backgroundTokens, presetBackdrop, presetBackgroundFromTokens, presetPaletteColors, CURATED_DARK_PRESETS, CURATED_LIGHT_PRESETS } from './presets';
import type { CuratedPreset, UserSavedPreset, CuratedPresetOverride } from './presets';

import {
	VIEW_TYPE_CSS_DESIGNER,
	DEFAULT_SNIPPET_NAME,
	LEGACY_SNIPPET_NAME,
	LIVE_STYLE_ID,
	LIVE_VARS_STYLE_ID,
	LIVE_COMPANION_STYLE_ID,
} from './constants';
import {
	STYLE_CONTROLS,
	StyleControl,
	SHADOW_ELEMENTS,
	ShadowElementConfig,
	DesignerTabId,
	TAB_DEFINITIONS,
	UI_ELEMENTS,
} from './schema';
import type CssSnippetDesignerPlugin from './main';
import type { PersistedTokenState } from './settings';
import { applyDesktopTranslucency, DesktopMaterial } from './translucency';

/**
 * Family tokens whose live value is rewritten to the embedded preview alias when
 * the chosen family ships with the plugin. The exported snippet keeps the real
 * family name; only the on-screen preview renders with the embedded face, so a
 * font that isn't installed still visibly applies while designing.
 */
const FONT_FAMILY_TOKENS = new Set(['--font-header', '--font-text', '--font-interface', '--font-monospace']);

/** Index of every control that owns a custom property, for stock-value comparisons. */
const CONTROL_BY_VARIABLE = new Map(STYLE_CONTROLS.map((c) => [c.variable, c] as const));

const TOKEN_VALUE_REGEX = new Map<string, RegExp>();

/**
 * Cached matcher for one control's declaration inside a token block.
 *
 * `extractBlockTokens` scans every control against a block, so compiling a
 * fresh `RegExp` each time meant hundreds of allocations per import. Variables
 * are static, so the compiled (and escaped) pattern is reused.
 */
function tokenValueRegex(variable: string): RegExp {
	let regex = TOKEN_VALUE_REGEX.get(variable);
	if (!regex) {
		const escaped = variable.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
		regex = new RegExp(`${escaped}\\s*:\\s*([^;!]+)(?:\\s*!important)?;`);
		TOKEN_VALUE_REGEX.set(variable, regex);
	}
	return regex;
}

export {
	VIEW_TYPE_CSS_DESIGNER,
	DEFAULT_SNIPPET_NAME,
	LEGACY_SNIPPET_NAME,
} from './constants';

export class CssDesignerPopoutView extends ItemView {
	public plugin: CssSnippetDesignerPlugin;
	public engine: SnippetEngine | null = null;
	public statusEl: HTMLElement | null = null;
	public currentSnippetName: string = DEFAULT_SNIPPET_NAME;

	// Dual-Mode token stores (Light Mode vs Dark Mode)
	public darkTokens: Map<string, string> = new Map();
	public lightTokens: Map<string, string> = new Map();
	public darkEnabled: Map<string, boolean> = new Map();
	public lightEnabled: Map<string, boolean> = new Map();

	// Master toolbar & tab states
	public livePreviewActive: boolean = true;
	public activeMode: '.theme-dark' | '.theme-light' = '.theme-dark';
	public activeTab: DesignerTabId = 'typography';

	// Performance optimization & frame-throttling state
	public liveUpdateRafId: number | null = null;
	public pendingVarsOnly: boolean = true;
	public pendingStatusText: string | null = null;
	public cachedCompanionRules: string | null = null;
	public cachedVarsCss: string | null = null;
	public cachedTargetDocs: Document[] | null = null;
	public lastTranslucencyOn: boolean | null = null;
	public lastTranslucencyMaterial: DesktopMaterial | null = null;
	public lastTranslucencyDocsCount: number = 0;
	public lastTranslucencyIsLight: boolean | null = null;

	// Persistent UI Shell elements
	private headerEl: HTMLElement | null = null;
	private tabsBarEl: HTMLElement | null = null;
	private tabButtons: Map<DesignerTabId, HTMLButtonElement> = new Map();
	private dropdownContainerEl: HTMLElement | null = null;
	private tabDropdownSelect: HTMLSelectElement | null = null;
	private tabDropdownIcon: HTMLElement | null = null;
	public panelContainer: HTMLElement | null = null;
	private footerEl: HTMLElement | null = null;
	private modeToggleComp: ToggleComponent | null = null;
	/**
	 * `ToggleComponent.setValue` fires `onChange`, so every programmatic move of
	 * the mode toggle has to be marked or it would ask the user to confirm a
	 * switch it made itself.
	 */
	private isSyncingModeToggle = false;
	private modeLabelEl: HTMLElement | null = null;
	private resetBtnEl: HTMLButtonElement | null = null;
	private shouldRebuildShell: boolean = false;

	// View Code pane & resizer elements
	public isCodeViewOpen: boolean = false;
	public codePaneWidth: number = 420;
	private viewCodeToggleComp: ToggleComponent | null = null;
	private bodyWrapEl: HTMLElement | null = null;
	private mainPaneEl: HTMLElement | null = null;
	private codeResizerEl: HTMLElement | null = null;
	private codePaneEl: HTMLElement | null = null;
	private codeContentEl: HTMLElement | null = null;
	private codeLineCountEl: HTMLElement | null = null;
	private codePaneUpdateTimer: number | null = null;

	public invalidateCompanionCache(): void {
		this.cachedCompanionRules = null;
		this.cachedVarsCss = null;
	}

	public invalidateVarsCache(): void {
		this.cachedVarsCss = null;
	}

	public invalidateDocsCache(): void {
		this.cachedTargetDocs = null;
	}

	public getDarkTokens(): Map<string, string> {
		return this.darkTokens;
	}

	public getLightTokens(): Map<string, string> {
		return this.lightTokens;
	}

	public scheduleLiveStyleUpdate(varsOnly: boolean = true): void {
		if (!varsOnly) {
			this.pendingVarsOnly = false;
		}
		if (this.liveUpdateRafId !== null) return;
		this.liveUpdateRafId = window.requestAnimationFrame(() => {
			this.liveUpdateRafId = null;
			const onlyVars = this.pendingVarsOnly;
			this.pendingVarsOnly = true;
			this.updateLiveStyleTag(onlyVars);
			if (this.pendingStatusText) {
				this.updateStatus(this.pendingStatusText);
				this.pendingStatusText = null;
			}
		});
	}

	public queueStatusUpdate(text: string): void {
		this.pendingStatusText = text;
		if (this.liveUpdateRafId === null) {
			this.updateStatus(text);
			this.pendingStatusText = null;
		}
	}

	constructor(leaf: WorkspaceLeaf, plugin: CssSnippetDesignerPlugin) {
		super(leaf);
		this.plugin = plugin;
	}

	onSettingsChanged(): void {
		const visible = TAB_DEFINITIONS.filter((t) => this.plugin.settings?.visibleTabs?.[t.id] ?? true);
		if (visible.length > 0 && visible[0] && !visible.some((t) => t.id === this.activeTab)) {
			this.activeTab = visible[0].id;
		}
		this.shouldRebuildShell = true;
		this.renderUI(true);
	}

	override onResize(): void {
		super.onResize();
		this.updateCompressedState();
	}

	public updateCompressedState(): void {
		const targetEl = this.mainPaneEl ?? this.contentEl;
		const width = targetEl.clientWidth || this.contentEl.clientWidth;
		if (width > 0) {
			this.contentEl.toggleClass('is-compressed', width <= 620);
		}
	}

	getViewType(): string {
		return VIEW_TYPE_CSS_DESIGNER;
	}

	getDisplayText(): string {
		return 'CSS Snippet Designer';
	}

	getIcon(): string {
		return 'palette';
	}

	getSnippetOutputPath(snippetName: string = this.currentSnippetName): string {
		const cleanName = (snippetName || DEFAULT_SNIPPET_NAME).replace(/\.css$/i, '');
		return `${this.app.vault.configDir}/snippets/${cleanName}.css`;
	}

	getSnippetsFolder(): string {
		return `${this.app.vault.configDir}/snippets`;
	}

	async onOpen(): Promise<void> {
		const targetDoc = this.containerEl?.ownerDocument ?? document;
		ensureStylesInDocument(targetDoc);

		// Pre-warm system fonts in the background so typography tab switches are instantaneous
		void getSystemFonts();

		// 1. Detect current Obsidian vault theme (Light or Dark)
		const isObsidianLight = document.body.classList.contains('theme-light');
		this.activeMode = isObsidianLight ? '.theme-light' : '.theme-dark';

		// 2. Seed initial values for both Dark Mode and Light Mode
		for (const ctrl of STYLE_CONTROLS) {
			this.darkTokens.set(ctrl.variable, ctrl.defaultDarkValue);
			this.lightTokens.set(ctrl.variable, ctrl.defaultLightValue);
			this.darkEnabled.set(ctrl.variable, true);
			this.lightEnabled.set(ctrl.variable, true);
		}
		this.darkEnabled.set('--text-accent-2', false);
		this.lightEnabled.set('--text-accent-2', false);

		this.darkTokens.set('--h1-border-padding', '0px');
		this.lightTokens.set('--h1-border-padding', '0px');
		this.darkEnabled.set('--h1-border-padding', true);
		this.lightEnabled.set('--h1-border-padding', true);

		this.darkTokens.set('--header-gradient-bg', 'none');
		this.lightTokens.set('--header-gradient-bg', 'none');
		this.darkEnabled.set('--header-gradient-bg', true);
		this.lightEnabled.set('--header-gradient-bg', true);

		this.darkTokens.set('--header-gradient-clip', 'border-box');
		this.lightTokens.set('--header-gradient-clip', 'border-box');
		this.darkEnabled.set('--header-gradient-clip', true);
		this.lightEnabled.set('--header-gradient-clip', true);

		this.darkTokens.set('--header-gradient-fill', 'currentColor');
		this.lightTokens.set('--header-gradient-fill', 'currentColor');
		this.darkEnabled.set('--header-gradient-fill', true);
		this.lightEnabled.set('--header-gradient-fill', true);

		this.darkTokens.set('--header-gradient-from', '#a855f7');
		this.lightTokens.set('--header-gradient-from', '#7c3aed');
		this.darkEnabled.set('--header-gradient-from', true);
		this.lightEnabled.set('--header-gradient-from', true);

		this.darkTokens.set('--header-gradient-to', '#ec4899');
		this.lightTokens.set('--header-gradient-to', '#db2777');
		this.darkEnabled.set('--header-gradient-to', true);
		this.lightEnabled.set('--header-gradient-to', true);

		this.darkTokens.set('--header-gradient-3color-enabled', 'false');
		this.lightTokens.set('--header-gradient-3color-enabled', 'false');
		this.darkEnabled.set('--header-gradient-3color-enabled', true);
		this.lightEnabled.set('--header-gradient-3color-enabled', true);

		this.darkTokens.set('--header-gradient-via', '#06b6d4');
		this.lightTokens.set('--header-gradient-via', '#0891b2');
		this.darkEnabled.set('--header-gradient-via', true);
		this.lightEnabled.set('--header-gradient-via', true);

		this.darkTokens.set('--header-gradient-angle', '135deg');
		this.lightTokens.set('--header-gradient-angle', '135deg');
		this.darkEnabled.set('--header-gradient-angle', true);
		this.lightEnabled.set('--header-gradient-angle', true);

		this.darkTokens.set('--header-gradient-start-pos', '0%');
		this.lightTokens.set('--header-gradient-start-pos', '0%');
		this.darkEnabled.set('--header-gradient-start-pos', true);
		this.lightEnabled.set('--header-gradient-start-pos', true);

		this.darkTokens.set('--header-gradient-end-pos', '100%');
		this.lightTokens.set('--header-gradient-end-pos', '100%');
		this.darkEnabled.set('--header-gradient-end-pos', true);
		this.lightEnabled.set('--header-gradient-end-pos', true);

		this.darkTokens.set('--header-gradient-progressive', 'false');
		this.lightTokens.set('--header-gradient-progressive', 'false');
		this.darkEnabled.set('--header-gradient-progressive', true);
		this.darkTokens.set('--glass-tint-enabled', 'false');
		this.lightTokens.set('--glass-tint-enabled', 'false');
		this.darkEnabled.set('--glass-tint-enabled', true);
		this.lightEnabled.set('--glass-tint-enabled', true);

		this.darkTokens.set('--glass-tint-color', '#7c3aed');
		this.lightTokens.set('--glass-tint-color', '#7c3aed');
		this.darkEnabled.set('--glass-tint-color', true);
		this.lightEnabled.set('--glass-tint-color', true);

		const defaultHPositions = ['0%', '20%', '40%', '60%', '80%', '100%'];
		for (let i = 1; i <= 6; i++) {
			const pos = defaultHPositions[i - 1] ?? '0%';
			this.darkTokens.set(`--h${i}-gradient-pos`, pos);
			this.lightTokens.set(`--h${i}-gradient-pos`, pos);
			this.darkEnabled.set(`--h${i}-gradient-pos`, true);
			this.lightEnabled.set(`--h${i}-gradient-pos`, true);

			this.darkTokens.set(`--h${i}-gradient-bg`, 'none');
			this.lightTokens.set(`--h${i}-gradient-bg`, 'none');
			this.darkEnabled.set(`--h${i}-gradient-bg`, true);
			this.lightEnabled.set(`--h${i}-gradient-bg`, true);
		}

		// Seed initial values for Shadow Elements
		for (const el of SHADOW_ELEMENTS) {
			this.seedShadowElementDefaults(el);
		}

		// Seed initial values for UI Elements (Minimalist Opacity)
		this.seedUIElementDefaults();

		// Seed initial values for Nav Box Visible Containers & Gradient
		this.seedNavBoxDefaults();

		// Seed initial values for Heading Gradient & Solid Progression
		this.seedHeaderGradientDefaults();

		// 3. Initialize the design-token engine
		try {
			this.engine = new SnippetEngine();
			for (const ctrl of STYLE_CONTROLS) {
				this.engine.setToken('.theme-dark', ctrl.variable, ctrl.defaultDarkValue);
				this.engine.setToken('.theme-light', ctrl.variable, ctrl.defaultLightValue);
			}
			this.engine.setToken('.theme-dark', '--ui-master-opacity', '1.0');
			this.engine.setToken('.theme-light', '--ui-master-opacity', '1.0');
			this.engine.setToken('.theme-dark', '--ui-transition-duration', '0.25s');
			this.engine.setToken('.theme-light', '--ui-transition-duration', '0.25s');
			for (const el of UI_ELEMENTS) {
				this.engine.setToken('.theme-dark', `--ui-${el.id}-opacity`, el.defaultOpacityDark);
				this.engine.setToken('.theme-light', `--ui-${el.id}-opacity`, el.defaultOpacityLight);
			}
			this.engine.setToken('.theme-dark', '--ui-bg-enabled', 'false');
			this.engine.setToken('.theme-light', '--ui-bg-enabled', 'false');
			this.engine.setToken('.theme-dark', '--h1-border-padding', '0px');
			this.engine.setToken('.theme-light', '--h1-border-padding', '0px');
			this.engine.setToken('.theme-dark', '--header-gradient-bg', 'none');
			this.engine.setToken('.theme-light', '--header-gradient-bg', 'none');
			this.engine.setToken('.theme-dark', '--header-gradient-clip', 'border-box');
			this.engine.setToken('.theme-light', '--header-gradient-clip', 'border-box');
			this.engine.setToken('.theme-dark', '--header-gradient-fill', 'currentColor');
			this.engine.setToken('.theme-light', '--header-gradient-fill', 'currentColor');
			this.engine.setToken('.theme-dark', '--header-gradient-from', '#a855f7');
			this.engine.setToken('.theme-light', '--header-gradient-from', '#7c3aed');
			this.engine.setToken('.theme-dark', '--header-gradient-to', '#ec4899');
			this.engine.setToken('.theme-light', '--header-gradient-to', '#db2777');
			this.engine.setToken('.theme-dark', '--header-gradient-3color-enabled', 'false');
			this.engine.setToken('.theme-light', '--header-gradient-3color-enabled', 'false');
			this.engine.setToken('.theme-dark', '--header-gradient-via', '#06b6d4');
			this.engine.setToken('.theme-light', '--header-gradient-via', '#0891b2');
			this.engine.setToken('.theme-dark', '--header-gradient-angle', '135deg');
			this.engine.setToken('.theme-light', '--header-gradient-angle', '135deg');
			this.engine.setToken('.theme-dark', '--header-gradient-start-pos', '0%');
			this.engine.setToken('.theme-light', '--header-gradient-start-pos', '0%');
			this.engine.setToken('.theme-dark', '--header-gradient-end-pos', '100%');
			this.engine.setToken('.theme-light', '--header-gradient-end-pos', '100%');
			this.engine.setToken('.theme-dark', '--header-gradient-progressive', 'false');
			this.engine.setToken('.theme-light', '--header-gradient-progressive', 'false');
			for (let i = 1; i <= 6; i++) {
				const pos = defaultHPositions[i - 1] ?? '0%';
				this.engine.setToken('.theme-dark', `--h${i}-gradient-pos`, pos);
				this.engine.setToken('.theme-light', `--h${i}-gradient-pos`, pos);
				this.engine.setToken('.theme-dark', `--h${i}-gradient-bg`, 'var(--header-gradient-bg)');
				this.engine.setToken('.theme-light', `--h${i}-gradient-bg`, 'var(--header-gradient-bg)');
			}
			this.engine.setToken('.theme-dark', '--glass-tint-enabled', 'false');
			this.engine.setToken('.theme-light', '--glass-tint-enabled', 'false');
			this.engine.setToken('.theme-dark', '--glass-tint-color', '#7c3aed');
			this.engine.setToken('.theme-light', '--glass-tint-color', '#7c3aed');
			this.seedNavBoxEngineDefaults();
		} catch (err) {
			console.error('Failed to initialize SnippetEngine:', err);
		}

		// 4. Restore the design.
		//
		// The editor's own copy comes back first, because it is complete: the
		// snippet carries only what the current design actually renders, so a
		// colour configured for a feature that is switched off lives on here and
		// nowhere else. The snippet is then read over the top, which keeps a
		// hand-edited file (or one copied in from another vault) authoritative
		// for everything it does specify.
		this.applyPersistedTokenState();

		this.currentSnippetName = this.plugin.settings?.lastSnippetName || DEFAULT_SNIPPET_NAME;
		try {
			const snippetPath = this.getSnippetOutputPath(this.currentSnippetName);
			if (await this.app.vault.adapter.exists(snippetPath)) {
				const existingCss = await this.app.vault.adapter.read(snippetPath);
				this.parseExistingSnippet(existingCss);
			} else if (this.currentSnippetName !== LEGACY_SNIPPET_NAME) {
				const fallbackPath = this.getSnippetOutputPath(LEGACY_SNIPPET_NAME);
				if (await this.app.vault.adapter.exists(fallbackPath)) {
					const existingCss = await this.app.vault.adapter.read(fallbackPath);
					this.parseExistingSnippet(existingCss);
				}
			}
		} catch (err) {
			console.warn(`Could not read existing snippet (${this.currentSnippetName}.css):`, err);
		}

		this.updateNavBoxTokens();

		// 5. Render event-driven UI
		this.renderUI();

		// 6. Broadcast live style injection to all windows
		this.updateLiveStyleTag();

		// 6b. Make the backing snippet match the state we just restored. A
		// generator change (a control's companion rule being rewritten, a new
		// token) would otherwise leave the live preview and the saved CSS out of
		// step until the next edit, so the design would visibly snap when the
		// designer or the plugin is switched off.
		await this.reconcileSnippetWithState();

		// 7. Auto-detect theme mode changes in Obsidian
		this.registerEvent(
			this.app.workspace.on('css-change', () => {
				const isLight = document.body.classList.contains('theme-light');
				const newMode = isLight ? '.theme-light' : '.theme-dark';
				if (this.activeMode !== newMode) {
					this.activeMode = newMode;
					this.renderUI();
					this.updateLiveStyleTag();
				}
			})
		);

		// 8. Invalidate document cache on workspace layout change
		this.registerEvent(
			this.app.workspace.on('layout-change', () => {
				this.invalidateDocsCache();
			})
		);
	}

	public seedShadowElementDefaults(el: ShadowElementConfig, targetMode?: '.theme-dark' | '.theme-light'): void {
		if (!targetMode || targetMode === '.theme-dark') {
			// Dark mode defaults
			this.darkTokens.set(`--sh-${el.id}-enabled`, 'false');
			this.darkTokens.set(`--sh-${el.id}-mode`, el.defaultMode);
			this.darkTokens.set(`--sh-${el.id}-x`, el.defaultX);
			this.darkTokens.set(`--sh-${el.id}-y`, el.defaultY);
			this.darkTokens.set(`--sh-${el.id}-blur`, el.defaultBlur);
			this.darkTokens.set(`--sh-${el.id}-spread`, el.defaultSpread);
			this.darkTokens.set(`--sh-${el.id}-color`, el.defaultColorDark);
			this.darkTokens.set(`--sh-${el.id}-opacity`, el.defaultOpacityDark);
			this.darkTokens.set(`--sh-${el.id}-outline-enabled`, 'false');
			this.darkTokens.set(`--sh-${el.id}-outline-width`, el.defaultOutlineWidth ?? '2px');
			this.darkTokens.set(`--sh-${el.id}-outline-color`, el.defaultOutlineColorDark ?? '#7c3aed');
			this.darkTokens.set(`--sh-${el.id}-anim-style`, el.defaultAnimStyle ?? 'none');
			this.darkTokens.set(`--sh-${el.id}-anim-speed`, el.defaultAnimSpeed ?? '2.5s');
			this.darkTokens.set(`--sh-${el.id}-anim-area`, el.defaultAnimArea ?? '35%');
			this.darkTokens.set(`--sh-${el.id}-gradient-enabled`, el.defaultGradientEnabled ? 'true' : 'false');
			this.darkTokens.set(`--sh-${el.id}-gradient-color`, el.defaultGradientColorDark ?? '#ec4899');
			this.darkTokens.set(`--sh-${el.id}-gradient-anim`, el.defaultGradientAnim ? 'true' : 'false');
			this.darkTokens.set(`--sh-${el.id}-outline-gradient-enabled`, el.defaultOutlineGradientEnabled ? 'true' : 'false');
			this.darkTokens.set(`--sh-${el.id}-outline-gradient-color`, el.defaultOutlineGradientColorDark ?? '#ec4899');
		}

		if (!targetMode || targetMode === '.theme-light') {
			// Light mode defaults
			this.lightTokens.set(`--sh-${el.id}-enabled`, 'false');
			this.lightTokens.set(`--sh-${el.id}-mode`, el.defaultMode);
			this.lightTokens.set(`--sh-${el.id}-x`, el.defaultX);
			this.lightTokens.set(`--sh-${el.id}-y`, el.defaultY);
			this.lightTokens.set(`--sh-${el.id}-blur`, el.defaultBlur);
			this.lightTokens.set(`--sh-${el.id}-spread`, el.defaultSpread);
			this.lightTokens.set(`--sh-${el.id}-color`, el.defaultColorLight);
			this.lightTokens.set(`--sh-${el.id}-opacity`, el.defaultOpacityLight);
			this.lightTokens.set(`--sh-${el.id}-outline-enabled`, 'false');
			this.lightTokens.set(`--sh-${el.id}-outline-width`, el.defaultOutlineWidth ?? '2px');
			this.lightTokens.set(`--sh-${el.id}-outline-color`, el.defaultOutlineColorLight ?? '#6d28d9');
			this.lightTokens.set(`--sh-${el.id}-anim-style`, el.defaultAnimStyle ?? 'none');
			this.lightTokens.set(`--sh-${el.id}-anim-speed`, el.defaultAnimSpeed ?? '2.5s');
			this.lightTokens.set(`--sh-${el.id}-anim-area`, el.defaultAnimArea ?? '35%');
			this.lightTokens.set(`--sh-${el.id}-gradient-enabled`, el.defaultGradientEnabled ? 'true' : 'false');
			this.lightTokens.set(`--sh-${el.id}-gradient-color`, el.defaultGradientColorLight ?? '#db2777');
			this.lightTokens.set(`--sh-${el.id}-gradient-anim`, el.defaultGradientAnim ? 'true' : 'false');
			this.lightTokens.set(`--sh-${el.id}-outline-gradient-enabled`, el.defaultOutlineGradientEnabled ? 'true' : 'false');
			this.lightTokens.set(`--sh-${el.id}-outline-gradient-color`, el.defaultOutlineGradientColorLight ?? '#db2777');
		}
	}

	public seedUIElementDefaults(targetMode?: '.theme-dark' | '.theme-light'): void {
		if (!targetMode || targetMode === '.theme-dark') {
			// Master and global tokens
			this.darkTokens.set('--ui-master-opacity', '1.0');
			this.darkTokens.set('--ui-transition-duration', '0.25s');
			// Off by default: reveal-on-hover is opt-in per element, so a slider does
			// what it says instead of being cancelled the moment the pointer lands.
			this.darkTokens.set('--ui-global-hover-reveal', 'false');

			// Per-element tokens
			for (const el of UI_ELEMENTS) {
				this.darkTokens.set(`--ui-${el.id}-opacity`, el.defaultOpacityDark);
				this.darkTokens.set(`--ui-${el.id}-hover-reveal`, 'false');
			}

			// Custom Background tokens
			this.darkTokens.set('--ui-bg-enabled', 'false');
			this.darkTokens.set('--ui-bg-style', 'dot-grid');
			this.darkTokens.set('--ui-bg-scope', 'editor');
			this.darkTokens.set('--ui-bg-size', '24px');
			this.darkTokens.set('--ui-bg-opacity', '0.35');
			this.darkTokens.set('--ui-bg-color', '#ffffff');
			this.darkTokens.set('--ui-bg-color-2', '#a855f7');
			this.darkTokens.set('--ui-bg-gradient', 'false');
			this.darkTokens.set('--ui-bg-gradient-angle', '135deg');
			this.darkTokens.set('--ui-bg-motion-animation', 'none');
			this.darkTokens.set('--ui-bg-color-animation', 'none');
			this.darkTokens.set('--ui-bg-animation-speed', '1');
			this.darkTokens.set('--ui-bg-animation', 'none');
		}

		if (!targetMode || targetMode === '.theme-light') {
			// Master and global tokens
			this.lightTokens.set('--ui-master-opacity', '1.0');
			this.lightTokens.set('--ui-transition-duration', '0.25s');
			// Off by default: reveal-on-hover is opt-in per element, so a slider does
			// what it says instead of being cancelled the moment the pointer lands.
			this.lightTokens.set('--ui-global-hover-reveal', 'false');

			// Per-element tokens
			for (const el of UI_ELEMENTS) {
				this.lightTokens.set(`--ui-${el.id}-opacity`, el.defaultOpacityLight);
				this.lightTokens.set(`--ui-${el.id}-hover-reveal`, 'false');
			}

			// Custom Background tokens
			this.lightTokens.set('--ui-bg-enabled', 'false');
			this.lightTokens.set('--ui-bg-style', 'dot-grid');
			this.lightTokens.set('--ui-bg-scope', 'editor');
			this.lightTokens.set('--ui-bg-size', '24px');
			this.lightTokens.set('--ui-bg-opacity', '0.35');
			this.lightTokens.set('--ui-bg-color', '#000000');
			this.lightTokens.set('--ui-bg-color-2', '#9333ea');
			this.lightTokens.set('--ui-bg-gradient', 'false');
			this.lightTokens.set('--ui-bg-gradient-angle', '135deg');
			this.lightTokens.set('--ui-bg-motion-animation', 'none');
			this.lightTokens.set('--ui-bg-color-animation', 'none');
			this.lightTokens.set('--ui-bg-animation-speed', '1');
			this.lightTokens.set('--ui-bg-animation', 'none');
		}
	}

	public getActiveTokenMap(): Map<string, string> {
		return this.activeMode === '.theme-dark' ? this.darkTokens : this.lightTokens;
	}

	public getActiveEnabledMap(): Map<string, boolean> {
		return this.activeMode === '.theme-dark' ? this.darkEnabled : this.lightEnabled;
	}

	public updateHeaderGradientTokens(targetMode?: '.theme-dark' | '.theme-light'): void {
		const modes: ('.theme-dark' | '.theme-light')[] = targetMode ? [targetMode] : ['.theme-dark', '.theme-light'];
		for (const mode of modes) {
			const tokenMap = mode === '.theme-dark' ? this.darkTokens : this.lightTokens;
			const enabledMap = mode === '.theme-dark' ? this.darkEnabled : this.lightEnabled;
			const isEnabled = (enabledMap.get('--header-gradient-enabled') ?? true) &&
				tokenMap.get('--header-gradient-enabled') === 'true';
			const style = tokenMap.get('--header-gradient-style') ?? 'gradient';
			const isSolid = style === 'solid';
			const defaultAccent = tokenMap.get('--text-accent') ?? (mode === '.theme-dark' ? '#d4af37' : '#2563eb');
			const defaultAccent2 = tokenMap.get('--text-accent-2') ?? defaultAccent;
			const fromColor = tokenMap.get('--header-gradient-from') ?? defaultAccent;
			const toColor = tokenMap.get('--header-gradient-to') ?? defaultAccent2;
			const is3Color = tokenMap.get('--header-gradient-3color-enabled') === 'true';
			const viaColor = tokenMap.get('--header-gradient-via') ?? defaultAccent;
			const solidColor = tokenMap.get('--header-solid-color') ?? defaultAccent;

			tokenMap.set('--header-gradient-style', style);
			tokenMap.set('--header-solid-color', solidColor);
			tokenMap.set('--header-gradient-from', fromColor);
			tokenMap.set('--header-gradient-to', toColor);
			tokenMap.set('--header-gradient-via', viaColor);
			tokenMap.set('--header-gradient-3color-enabled', is3Color ? 'true' : 'false');

			enabledMap.set('--header-gradient-style', true);
			enabledMap.set('--header-solid-color', true);
			enabledMap.set('--header-gradient-from', true);
			enabledMap.set('--header-gradient-to', true);
			enabledMap.set('--header-gradient-via', true);
			enabledMap.set('--header-gradient-3color-enabled', true);

			// Compute solid colors across H1 through H6
			for (let i = 1; i <= 6; i++) {
				const pct = Math.round(((i - 1) / 5) * 100);
				const hColor = isSolid ? solidColor : this.getHeaderGradientColorAt(pct, mode);
				const hBg = isEnabled ? `linear-gradient(${hColor}, ${hColor})` : 'none';

				// Always preserve the computed heading color values
				tokenMap.set(`--h${i}-gradient-color`, hColor);
				tokenMap.set(`--h${i}-gradient-bg`, hBg);
				tokenMap.set(`--h${i}-color`, hColor);
				tokenMap.set(`--h${i}-gradient-pos`, `${pct}%`);

				// Only inject heading color overrides into live vars when enabled
				enabledMap.set(`--h${i}-gradient-color`, isEnabled);
				enabledMap.set(`--h${i}-gradient-bg`, isEnabled);
				enabledMap.set(`--h${i}-color`, isEnabled);
				enabledMap.set(`--h${i}-gradient-pos`, isEnabled);

				if (this.engine) {
					this.engine.setToken(mode, `--h${i}-gradient-color`, isEnabled ? hColor : 'currentColor');
					this.engine.setToken(mode, `--h${i}-gradient-bg`, hBg);
					this.engine.setToken(mode, `--h${i}-color`, isEnabled ? hColor : 'currentColor');
					this.engine.setToken(mode, `--h${i}-gradient-pos`, `${pct}%`);
				}
			}

			if (this.engine) {
				this.engine.setToken(mode, '--header-gradient-style', style);
				this.engine.setToken(mode, '--header-solid-color', solidColor);
				this.engine.setToken(mode, '--header-gradient-from', fromColor);
				this.engine.setToken(mode, '--header-gradient-to', toColor);
				this.engine.setToken(mode, '--header-gradient-via', viaColor);
				this.engine.setToken(mode, '--header-gradient-3color-enabled', is3Color ? 'true' : 'false');
			}
		}
	}

	public seedHeaderGradientDefaults(targetMode?: '.theme-dark' | '.theme-light'): void {
		const seedForMode = (
			tokenMap: Map<string, string>,
			enabledMap: Map<string, boolean>,
			isDark: boolean
		) => {
			const defaultAccent = tokenMap.get('--text-accent') ?? (isDark ? '#d4af37' : '#2563eb');
			const defaultAccent2 = tokenMap.get('--text-accent-2') ?? defaultAccent;
			if (!tokenMap.has('--header-gradient-enabled')) tokenMap.set('--header-gradient-enabled', 'false');
			if (!tokenMap.has('--header-gradient-style')) tokenMap.set('--header-gradient-style', 'solid');
			if (!tokenMap.has('--header-gradient-from')) tokenMap.set('--header-gradient-from', defaultAccent);
			if (!tokenMap.has('--header-gradient-to')) tokenMap.set('--header-gradient-to', defaultAccent2);
			if (!tokenMap.has('--header-gradient-via')) tokenMap.set('--header-gradient-via', defaultAccent);
			if (!tokenMap.has('--header-gradient-3color-enabled')) tokenMap.set('--header-gradient-3color-enabled', 'false');
			if (!tokenMap.has('--header-solid-color')) tokenMap.set('--header-solid-color', defaultAccent);

			enabledMap.set('--header-gradient-enabled', true);
			enabledMap.set('--header-gradient-style', true);
			enabledMap.set('--header-gradient-from', true);
			enabledMap.set('--header-gradient-to', true);
			enabledMap.set('--header-gradient-via', true);
			enabledMap.set('--header-gradient-3color-enabled', true);
			enabledMap.set('--header-solid-color', true);

			const isEnabled = tokenMap.get('--header-gradient-enabled') === 'true';
			for (let i = 1; i <= 6; i++) {
				const pct = Math.round(((i - 1) / 5) * 100);
				tokenMap.set(`--h${i}-gradient-pos`, `${pct}%`);
				enabledMap.set(`--h${i}-gradient-pos`, isEnabled);
				enabledMap.set(`--h${i}-gradient-color`, isEnabled);
				enabledMap.set(`--h${i}-gradient-bg`, isEnabled);
				enabledMap.set(`--h${i}-color`, isEnabled);
			}
		};

		if (targetMode === '.theme-dark' || !targetMode) {
			seedForMode(this.darkTokens, this.darkEnabled, true);
		}
		if (targetMode === '.theme-light' || !targetMode) {
			seedForMode(this.lightTokens, this.lightEnabled, false);
		}
	}

	public seedNavBoxDefaults(targetMode?: '.theme-dark' | '.theme-light'): void {
		const seedForMode = (
			tokenMap: Map<string, string>,
			enabledMap: Map<string, boolean>,
			isDark: boolean
		) => {
			tokenMap.set('--nav-box-enabled', 'false');
			tokenMap.set('--nav-box-outline-enabled', 'true');
			tokenMap.set('--nav-box-outline-style', 'solid');
			tokenMap.set('--nav-box-outline-gradient-from', isDark ? '#a855f7' : '#7c3aed');
			tokenMap.set('--nav-box-outline-gradient-to', isDark ? '#ec4899' : '#db2777');
			tokenMap.set('--nav-box-outline-gradient-via', isDark ? '#06b6d4' : '#0891b2');
			tokenMap.set('--nav-box-outline-gradient-3color-enabled', 'false');
			tokenMap.set('--nav-box-outline-gradient-angle', '180deg');
			tokenMap.set('--nav-box-outline-gradient-start-pos', '0%');
			tokenMap.set('--nav-box-outline-gradient-end-pos', '100%');
			tokenMap.set('--nav-box-border-color', isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)');
			tokenMap.set('--nav-box-border-color-display', isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)');
			tokenMap.set('--nav-box-border-width', '1px');
			tokenMap.set('--nav-box-radius', '6px');
			tokenMap.set('--nav-box-body-enabled', 'true');
			tokenMap.set('--nav-box-body-style', 'solid');
			tokenMap.set('--nav-box-gradient-enabled', 'false');
			tokenMap.set('--nav-box-gradient-from', isDark ? '#7c3aed' : '#6d28d9');
			tokenMap.set('--nav-box-gradient-to', isDark ? '#ec4899' : '#db2777');
			tokenMap.set('--nav-box-gradient-via', isDark ? '#06b6d4' : '#0891b2');
			tokenMap.set('--nav-box-gradient-3color-enabled', 'false');
			tokenMap.set('--nav-box-gradient-angle', '180deg');
			tokenMap.set('--nav-box-gradient-start-pos', '0%');
			tokenMap.set('--nav-box-bg', isDark ? '#1e1e2e' : '#f4f4f5');
			tokenMap.set('--nav-box-gradient-bg', 'none');
			tokenMap.set('--nav-box-bg-display', isDark ? '#7c3aed' : '#6d28d9');
			tokenMap.set('--nav-box-gradient-display', 'none');
			tokenMap.set('--nav-box-border-display', '1px solid transparent');
			tokenMap.set('--nav-box-radius-display', 'var(--radius-s, 4px)');
			tokenMap.set('--nav-box-margin-display', '0px');
			tokenMap.set('--nav-box-shadow-display', 'none');
			tokenMap.set('--nav-box-hover-filter', 'none');
			tokenMap.set('--nav-box-active-shadow', 'none');
			tokenMap.set('--nav-box-active-filter', 'none');
			tokenMap.set('--nav-box-gradient-progressive', 'true');

			tokenMap.set('--nav-box-subfolders-enabled', 'false');
			tokenMap.set('--nav-box-gradient-steps', '8');
			tokenMap.set('--nav-box-subfolder-bg', isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)');
			tokenMap.set('--nav-box-subfolder-border', isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)');
			tokenMap.set('--nav-box-subfolder-bg-display', 'transparent');
			tokenMap.set('--nav-box-subfolder-border-display', '1px solid transparent');
			tokenMap.set('--nav-box-subfolder-border-color-display', 'transparent');
			tokenMap.set('--nav-box-subfolder-margin-display', '0px');
			tokenMap.set('--nav-box-subfolder-shadow-display', 'none');

			for (let i = 1; i <= 24; i++) {
				tokenMap.set(`--nav-box-item-${i}-bg`, 'transparent');
				tokenMap.set(`--nav-box-item-${i}-border`, 'transparent');
				enabledMap.set(`--nav-box-item-${i}-bg`, true);
				enabledMap.set(`--nav-box-item-${i}-border`, true);
			}

			const defaultNavPositions = [0, 20, 40, 60, 80, 100];
			for (let i = 1; i <= 6; i++) {
				tokenMap.set(`--nav-box-l${i}-gradient-pos`, `${defaultNavPositions[i - 1]}%`);
				tokenMap.set(`--nav-box-l${i}-gradient-bg`, 'none');
				tokenMap.set(`--nav-box-l${i}-bg`, 'transparent');
				tokenMap.set(`--nav-box-outline-l${i}-gradient-pos`, `${defaultNavPositions[i - 1]}%`);
				tokenMap.set(`--nav-box-l${i}-border-color`, isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)');
				enabledMap.set(`--nav-box-l${i}-gradient-pos`, true);
				enabledMap.set(`--nav-box-l${i}-gradient-bg`, true);
				enabledMap.set(`--nav-box-l${i}-bg`, true);
				enabledMap.set(`--nav-box-outline-l${i}-gradient-pos`, true);
				enabledMap.set(`--nav-box-l${i}-border-color`, true);
			}

			enabledMap.set('--nav-box-enabled', true);
			enabledMap.set('--nav-box-subfolders-enabled', true);
			enabledMap.set('--nav-box-gradient-steps', true);
			enabledMap.set('--nav-box-subfolder-bg', true);
			enabledMap.set('--nav-box-subfolder-border', true);
			enabledMap.set('--nav-box-subfolder-bg-display', true);
			enabledMap.set('--nav-box-subfolder-border-display', true);
			enabledMap.set('--nav-box-subfolder-border-color-display', true);
			enabledMap.set('--nav-box-subfolder-margin-display', true);
			enabledMap.set('--nav-box-subfolder-shadow-display', true);
			enabledMap.set('--nav-box-outline-enabled', true);
			enabledMap.set('--nav-box-outline-style', true);
			enabledMap.set('--nav-box-outline-gradient-from', true);
			enabledMap.set('--nav-box-outline-gradient-to', true);
			enabledMap.set('--nav-box-outline-gradient-via', true);
			enabledMap.set('--nav-box-outline-gradient-3color-enabled', true);
			enabledMap.set('--nav-box-outline-gradient-angle', true);
			enabledMap.set('--nav-box-outline-gradient-start-pos', true);
			enabledMap.set('--nav-box-outline-gradient-end-pos', true);
			enabledMap.set('--nav-box-border-color', true);
			enabledMap.set('--nav-box-border-color-display', true);
			enabledMap.set('--nav-box-border-width', true);
			enabledMap.set('--nav-box-radius', true);
			enabledMap.set('--nav-box-body-enabled', true);
			enabledMap.set('--nav-box-body-style', true);
			enabledMap.set('--nav-box-gradient-enabled', true);
			enabledMap.set('--nav-box-gradient-from', true);
			enabledMap.set('--nav-box-gradient-to', true);
			enabledMap.set('--nav-box-gradient-via', true);
			enabledMap.set('--nav-box-gradient-3color-enabled', true);
			enabledMap.set('--nav-box-gradient-angle', true);
			enabledMap.set('--nav-box-gradient-start-pos', true);
			enabledMap.set('--nav-box-gradient-end-pos', true);
			enabledMap.set('--nav-box-bg', true);
			enabledMap.set('--nav-box-gradient-bg', true);
			enabledMap.set('--nav-box-bg-display', true);
			enabledMap.set('--nav-box-gradient-display', true);
			enabledMap.set('--nav-box-border-display', true);
			enabledMap.set('--nav-box-radius-display', true);
			enabledMap.set('--nav-box-margin-display', true);
			enabledMap.set('--nav-box-shadow-display', true);
			enabledMap.set('--nav-box-hover-filter', true);
			enabledMap.set('--nav-box-active-shadow', true);
			enabledMap.set('--nav-box-active-filter', true);
			enabledMap.set('--nav-box-gradient-progressive', true);
		};

		if (!targetMode || targetMode === '.theme-dark') {
			seedForMode(this.darkTokens, this.darkEnabled, true);
		}
		if (!targetMode || targetMode === '.theme-light') {
			seedForMode(this.lightTokens, this.lightEnabled, false);
		}
	}

	public seedNavBoxEngineDefaults(targetMode?: '.theme-dark' | '.theme-light'): void {
		if (!this.engine) return;
		const modes: ('.theme-dark' | '.theme-light')[] = targetMode ? [targetMode] : ['.theme-dark', '.theme-light'];
		for (const mode of modes) {
			const isDark = mode === '.theme-dark';
			this.engine.setToken(mode, '--nav-box-enabled', 'false');
			this.engine.setToken(mode, '--nav-box-subfolders-enabled', 'false');
			this.engine.setToken(mode, '--nav-box-gradient-steps', '8');
			this.engine.setToken(mode, '--nav-box-subfolder-bg', isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)');
			this.engine.setToken(mode, '--nav-box-subfolder-border', isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)');
			this.engine.setToken(mode, '--nav-box-subfolder-bg-display', 'transparent');
			this.engine.setToken(mode, '--nav-box-subfolder-border-display', '1px solid transparent');
			this.engine.setToken(mode, '--nav-box-subfolder-border-color-display', 'transparent');
			this.engine.setToken(mode, '--nav-box-subfolder-margin-display', '0px');
			this.engine.setToken(mode, '--nav-box-subfolder-shadow-display', 'none');
			for (let i = 1; i <= 24; i++) {
				this.engine.setToken(mode, `--nav-box-item-${i}-bg`, 'transparent');
				this.engine.setToken(mode, `--nav-box-item-${i}-border`, 'transparent');
			}
			this.engine.setToken(mode, '--nav-box-outline-enabled', 'true');
			this.engine.setToken(mode, '--nav-box-outline-style', 'solid');
			this.engine.setToken(mode, '--nav-box-outline-gradient-from', isDark ? '#a855f7' : '#7c3aed');
			this.engine.setToken(mode, '--nav-box-outline-gradient-to', isDark ? '#ec4899' : '#db2777');
			this.engine.setToken(mode, '--nav-box-outline-gradient-via', isDark ? '#06b6d4' : '#0891b2');
			this.engine.setToken(mode, '--nav-box-outline-gradient-3color-enabled', 'false');
			this.engine.setToken(mode, '--nav-box-outline-gradient-angle', '180deg');
			this.engine.setToken(mode, '--nav-box-outline-gradient-start-pos', '0%');
			this.engine.setToken(mode, '--nav-box-outline-gradient-end-pos', '100%');
			this.engine.setToken(mode, '--nav-box-border-color', isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)');
			this.engine.setToken(mode, '--nav-box-border-color-display', isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)');
			this.engine.setToken(mode, '--nav-box-border-width', '1px');
			this.engine.setToken(mode, '--nav-box-radius', '6px');
			this.engine.setToken(mode, '--nav-box-body-enabled', 'true');
			this.engine.setToken(mode, '--nav-box-body-style', 'solid');
			this.engine.setToken(mode, '--nav-box-gradient-enabled', 'false');
			this.engine.setToken(mode, '--nav-box-gradient-from', isDark ? '#7c3aed' : '#6d28d9');
			this.engine.setToken(mode, '--nav-box-gradient-to', isDark ? '#ec4899' : '#db2777');
			this.engine.setToken(mode, '--nav-box-gradient-via', isDark ? '#06b6d4' : '#0891b2');
			this.engine.setToken(mode, '--nav-box-gradient-3color-enabled', 'false');
			this.engine.setToken(mode, '--nav-box-gradient-angle', '180deg');
			this.engine.setToken(mode, '--nav-box-gradient-start-pos', '0%');
			this.engine.setToken(mode, '--nav-box-gradient-end-pos', '100%');
			this.engine.setToken(mode, '--nav-box-bg', isDark ? '#1e1e2e' : '#f4f4f5');
			this.engine.setToken(mode, '--nav-box-gradient-bg', 'none');
			this.engine.setToken(mode, '--nav-box-bg-display', isDark ? '#7c3aed' : '#6d28d9');
			this.engine.setToken(mode, '--nav-box-gradient-display', 'none');
			this.engine.setToken(mode, '--nav-box-border-display', '1px solid transparent');
			this.engine.setToken(mode, '--nav-box-radius-display', 'var(--radius-s, 4px)');
			this.engine.setToken(mode, '--nav-box-margin-display', '0px');
			this.engine.setToken(mode, '--nav-box-shadow-display', 'none');
			this.engine.setToken(mode, '--nav-box-hover-filter', 'none');
			this.engine.setToken(mode, '--nav-box-active-shadow', 'none');
			this.engine.setToken(mode, '--nav-box-active-filter', 'none');
			this.engine.setToken(mode, '--nav-box-gradient-progressive', 'true');

			const defaultNavPositions = [0, 20, 40, 60, 80, 100];
			for (let i = 1; i <= 6; i++) {
				this.engine.setToken(mode, `--nav-box-l${i}-gradient-pos`, `${defaultNavPositions[i - 1]}%`);
				this.engine.setToken(mode, `--nav-box-l${i}-gradient-bg`, 'none');
				this.engine.setToken(mode, `--nav-box-l${i}-bg`, 'transparent');
				this.engine.setToken(mode, `--nav-box-outline-l${i}-gradient-pos`, `${defaultNavPositions[i - 1]}%`);
				this.engine.setToken(mode, `--nav-box-l${i}-border-color`, isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)');
			}
		}
	}

	public updateNavBoxTokens(): void {
		const tokenMap = this.getActiveTokenMap();
		const enabledMap = this.getActiveEnabledMap();
		const isBoxEnabled = (enabledMap.get('--nav-box-enabled') ?? true) &&
			tokenMap.get('--nav-box-enabled') === 'true';
		const isOutlineEnabled = tokenMap.get('--nav-box-outline-enabled') !== 'false';
		const isBodyEnabled = tokenMap.get('--nav-box-body-enabled') !== 'false';

		const isDark = this.activeMode === '.theme-dark';

		// Outline configuration
		const isOutlineStyleGradient = tokenMap.get('--nav-box-outline-style') === 'gradient';
		const outlineFromColor = tokenMap.get('--nav-box-outline-gradient-from') ?? tokenMap.get('--text-accent') ?? (isDark ? '#a855f7' : '#7c3aed');
		const outlineToColor = tokenMap.get('--nav-box-outline-gradient-to') ?? tokenMap.get('--text-accent-2') ?? tokenMap.get('--text-accent') ?? (isDark ? '#ec4899' : '#db2777');
		const outlineIs3Color = tokenMap.get('--nav-box-outline-gradient-3color-enabled') === 'true';
		const outlineViaColor = tokenMap.get('--nav-box-outline-gradient-via') ?? (isDark ? '#06b6d4' : '#0891b2');
		const outlineAngleRaw = tokenMap.get('--nav-box-outline-gradient-angle') ?? '180deg';
		const outlineAngle = outlineAngleRaw.endsWith('deg') ? outlineAngleRaw : `${outlineAngleRaw}deg`;
		const outlineStartPosRaw = tokenMap.get('--nav-box-outline-gradient-start-pos') ?? '0%';
		const outlineStartPos = parseInt(outlineStartPosRaw, 10) || 0;
		const outlineEndPosRaw = tokenMap.get('--nav-box-outline-gradient-end-pos') ?? '100%';
		const outlineEndPos = parseInt(outlineEndPosRaw, 10) || 100;

		const borderColor = tokenMap.get('--nav-box-border-color') ?? (isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)');
		const borderWidthRaw = tokenMap.get('--nav-box-border-width') ?? '1px';
		const borderWidth = borderWidthRaw.endsWith('px') ? borderWidthRaw : `${borderWidthRaw}px`;
		const radiusRaw = tokenMap.get('--nav-box-radius') ?? '6px';
		const radius = radiusRaw.endsWith('px') ? radiusRaw : `${radiusRaw}px`;

		const defaultNavPositions = [0, 20, 40, 60, 80, 100];
		const outlineNavPositions: number[] = [];
		for (let i = 1; i <= 6; i++) {
			const fallbackPos = defaultNavPositions[i - 1] ?? 0;
			const posRaw = tokenMap.get(`--nav-box-outline-l${i}-gradient-pos`) ?? `${fallbackPos}%`;
			const posNum = Math.max(0, Math.min(100, parseInt(posRaw, 10) || fallbackPos));
			outlineNavPositions.push(posNum);
			tokenMap.set(`--nav-box-outline-l${i}-gradient-pos`, `${posNum}%`);
			enabledMap.set(`--nav-box-outline-l${i}-gradient-pos`, true);
		}

		let activeBorderColor = borderColor;
		if (isBoxEnabled && isOutlineEnabled) {
			activeBorderColor = isOutlineStyleGradient ? outlineFromColor : borderColor;
		}

		const borderDisplay = (isBoxEnabled && isOutlineEnabled)
			? `${borderWidth} solid ${activeBorderColor}`
			: '1px solid transparent';
		const borderColorDisplay = (isBoxEnabled && isOutlineEnabled)
			? activeBorderColor
			: 'transparent';

		for (let i = 1; i <= 6; i++) {
			let lBorderCol = 'transparent';
			if (isBoxEnabled && isOutlineEnabled) {
				if (isOutlineStyleGradient) {
					lBorderCol = this.getNavBoxOutlineGradientColorAt(outlineNavPositions[i - 1] ?? 0);
				} else {
					lBorderCol = borderColor;
				}
			}
			tokenMap.set(`--nav-box-l${i}-border-color`, lBorderCol);
			enabledMap.set(`--nav-box-l${i}-border-color`, true);
		}

		// Body configuration
		const isBodyStyleGradient = tokenMap.get('--nav-box-body-style') === 'gradient';
		const fromColor = tokenMap.get('--nav-box-gradient-from') ?? tokenMap.get('--text-accent') ?? (isDark ? '#7c3aed' : '#6d28d9');
		const toColor = tokenMap.get('--nav-box-gradient-to') ?? tokenMap.get('--text-accent-2') ?? tokenMap.get('--text-accent') ?? (isDark ? '#ec4899' : '#db2777');
		const is3Color = tokenMap.get('--nav-box-gradient-3color-enabled') === 'true';
		const viaColor = tokenMap.get('--nav-box-gradient-via') ?? (isDark ? '#06b6d4' : '#0891b2');

		const angleRaw = tokenMap.get('--nav-box-gradient-angle') ?? '180deg';
		const angle = angleRaw.endsWith('deg') ? angleRaw : `${angleRaw}deg`;
		const startPosRaw = tokenMap.get('--nav-box-gradient-start-pos') ?? '0%';
		const startPos = parseInt(startPosRaw, 10) || 0;
		const endPosRaw = tokenMap.get('--nav-box-gradient-end-pos') ?? '100%';
		const endPos = parseInt(endPosRaw, 10) || 100;
		const midPos = Math.round((startPos + endPos) / 2);

		let bodySolidColor = tokenMap.get('--nav-box-bg');
		if (!bodySolidColor || bodySolidColor === 'transparent' || bodySolidColor.startsWith('rgba(255, 255, 255, 0.0') || bodySolidColor.startsWith('rgba(0, 0, 0, 0.0')) {
			bodySolidColor = isDark ? '#1e1e2e' : '#f4f4f5';
			tokenMap.set('--nav-box-bg', bodySolidColor);
			enabledMap.set('--nav-box-bg', true);
		}

		const gradBgVal = (isBoxEnabled && isBodyEnabled && isBodyStyleGradient)
			? (is3Color
				? `linear-gradient(${angle}, ${fromColor} ${startPos}%, ${viaColor} ${midPos}%, ${toColor} ${endPos}%)`
				: `linear-gradient(${angle}, ${fromColor} ${startPos}%, ${toColor} ${endPos}%)`)
			: 'none';

		const bgDisplay = (isBoxEnabled && isBodyEnabled)
			? (isBodyStyleGradient ? fromColor : bodySolidColor)
			: 'transparent';

		const radiusDisplay = isBoxEnabled ? radius : 'var(--radius-s, 4px)';
		const marginDisplay = isBoxEnabled ? '2px 0' : '0px';
		const shadowDisplay = (isBoxEnabled && isBodyEnabled) ? '0 1px 3px rgba(0, 0, 0, 0.12)' : 'none';
		const hoverFilter = isBoxEnabled ? 'brightness(1.08)' : 'none';
		const accentColor = tokenMap.get('--text-accent') ?? (isDark ? '#7c3aed' : '#6d28d9');
		const activeShadow = isBoxEnabled
			? `0 0 0 1px ${accentColor}, 0 2px 6px rgba(0, 0, 0, 0.2)`
			: 'none';
		const activeFilter = isBoxEnabled ? 'brightness(1.15)' : 'none';

		tokenMap.set('--nav-box-outline-enabled', isOutlineEnabled ? 'true' : 'false');
		tokenMap.set('--nav-box-outline-style', isOutlineStyleGradient ? 'gradient' : 'solid');
		tokenMap.set('--nav-box-outline-gradient-from', outlineFromColor);
		tokenMap.set('--nav-box-outline-gradient-to', outlineToColor);
		tokenMap.set('--nav-box-outline-gradient-via', outlineViaColor);
		tokenMap.set('--nav-box-outline-gradient-3color-enabled', outlineIs3Color ? 'true' : 'false');
		tokenMap.set('--nav-box-outline-gradient-angle', outlineAngle);
		tokenMap.set('--nav-box-outline-gradient-start-pos', `${outlineStartPos}%`);
		tokenMap.set('--nav-box-outline-gradient-end-pos', `${outlineEndPos}%`);
		tokenMap.set('--nav-box-border-color', borderColor);
		tokenMap.set('--nav-box-border-color-display', borderColorDisplay);
		tokenMap.set('--nav-box-border-width', borderWidth);
		tokenMap.set('--nav-box-radius', radius);
		tokenMap.set('--nav-box-body-enabled', isBodyEnabled ? 'true' : 'false');
		tokenMap.set('--nav-box-body-style', isBodyStyleGradient ? 'gradient' : 'solid');
		tokenMap.set('--nav-box-gradient-enabled', (isBodyEnabled && isBodyStyleGradient) ? 'true' : 'false');
		tokenMap.set('--nav-box-gradient-angle', angle);
		tokenMap.set('--nav-box-gradient-bg', gradBgVal);
		tokenMap.set('--nav-box-gradient-display', gradBgVal);
		tokenMap.set('--nav-box-bg', bodySolidColor);
		tokenMap.set('--nav-box-bg-display', bgDisplay);
		tokenMap.set('--nav-box-border-display', borderDisplay);
		tokenMap.set('--nav-box-radius-display', radiusDisplay);
		tokenMap.set('--nav-box-margin-display', marginDisplay);
		tokenMap.set('--nav-box-shadow-display', shadowDisplay);
		tokenMap.set('--nav-box-hover-filter', hoverFilter);
		tokenMap.set('--nav-box-active-shadow', activeShadow);
		tokenMap.set('--nav-box-active-filter', activeFilter);
		tokenMap.set('--nav-box-gradient-progressive', 'true');

		// Subfolders configuration
		const isSubfoldersEnabled = tokenMap.get('--nav-box-subfolders-enabled') === 'true';
		const stepCountRaw = parseInt(tokenMap.get('--nav-box-gradient-steps') ?? '8', 10);
		const stepCount = Math.max(3, Math.min(24, isNaN(stepCountRaw) ? 8 : stepCountRaw));

		const subfolderBg = (isBoxEnabled && isSubfoldersEnabled && isBodyEnabled)
			? (tokenMap.get('--nav-box-subfolder-bg') ?? (isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)'))
			: 'transparent';
		const subfolderBorder = (isBoxEnabled && isSubfoldersEnabled && isOutlineEnabled)
			? (tokenMap.get('--nav-box-subfolder-border') ?? borderColor)
			: 'transparent';
		const subfolderBorderDisplay = (isBoxEnabled && isSubfoldersEnabled && isOutlineEnabled)
			? `${borderWidth} solid ${subfolderBorder}`
			: '1px solid transparent';
		const subfolderMargin = (isBoxEnabled && isSubfoldersEnabled) ? marginDisplay : '0px';
		const subfolderShadow = (isBoxEnabled && isSubfoldersEnabled && isBodyEnabled) ? shadowDisplay : 'none';

		tokenMap.set('--nav-box-subfolders-enabled', isSubfoldersEnabled ? 'true' : 'false');
		tokenMap.set('--nav-box-gradient-steps', stepCount.toString());
		tokenMap.set('--nav-box-subfolder-bg-display', subfolderBg);
		tokenMap.set('--nav-box-subfolder-border-display', subfolderBorderDisplay);
		tokenMap.set('--nav-box-subfolder-border-color-display', subfolderBorder);
		tokenMap.set('--nav-box-subfolder-margin-display', subfolderMargin);
		tokenMap.set('--nav-box-subfolder-shadow-display', subfolderShadow);

		enabledMap.set('--nav-box-subfolders-enabled', true);
		enabledMap.set('--nav-box-gradient-steps', true);
		enabledMap.set('--nav-box-subfolder-bg-display', true);
		enabledMap.set('--nav-box-subfolder-border-display', true);
		enabledMap.set('--nav-box-subfolder-border-color-display', true);
		enabledMap.set('--nav-box-subfolder-margin-display', true);
		enabledMap.set('--nav-box-subfolder-shadow-display', true);

		// Calculate discrete solid colors for core directory items (1..24)
		for (let i = 1; i <= 24; i++) {
			let itemBg = 'transparent';
			let itemBorder = 'transparent';

			if (isBoxEnabled) {
				// Discrete solid body color along vertical gradient or uniform solid
				if (isBodyEnabled) {
					if (isBodyStyleGradient) {
						const pct = Math.min(100, Math.round(((i - 1) / Math.max(1, stepCount - 1)) * 100));
						itemBg = this.getNavBoxGradientColorAt(pct);
					} else {
						itemBg = bodySolidColor;
					}
				}

				// Discrete outline border color along gradient or uniform solid
				if (isOutlineEnabled) {
					if (isOutlineStyleGradient) {
						const pct = Math.min(100, Math.round(((i - 1) / Math.max(1, stepCount - 1)) * 100));
						itemBorder = this.getNavBoxOutlineGradientColorAt(pct);
					} else {
						itemBorder = borderColor;
					}
				}
			}

			tokenMap.set(`--nav-box-item-${i}-bg`, itemBg);
			tokenMap.set(`--nav-box-item-${i}-border`, itemBorder);
			enabledMap.set(`--nav-box-item-${i}-bg`, true);
			enabledMap.set(`--nav-box-item-${i}-border`, true);
		}

		const navPositions: number[] = [];
		for (let i = 1; i <= 6; i++) {
			const fallbackPos = defaultNavPositions[i - 1] ?? 0;
			const posRaw = tokenMap.get(`--nav-box-l${i}-gradient-pos`) ?? `${fallbackPos}%`;
			const posNum = Math.max(0, Math.min(100, parseInt(posRaw, 10) || fallbackPos));
			navPositions.push(posNum);
			tokenMap.set(`--nav-box-l${i}-gradient-pos`, `${posNum}%`);
			enabledMap.set(`--nav-box-l${i}-gradient-pos`, true);
		}

		for (let i = 1; i <= 6; i++) {
			let lBg = 'none';
			let lCol = 'transparent';
			if (isBoxEnabled && isBodyEnabled) {
				if (isBodyStyleGradient) {
					const curPos = navPositions[i - 1] ?? 0;
					const solidColor = this.getNavBoxGradientColorAt(curPos);
					lBg = `linear-gradient(${solidColor}, ${solidColor})`;
					lCol = solidColor;
				} else {
					lBg = 'none';
					lCol = bodySolidColor;
				}
			}
			tokenMap.set(`--nav-box-l${i}-gradient-bg`, lBg);
			tokenMap.set(`--nav-box-l${i}-bg`, lCol);
			enabledMap.set(`--nav-box-l${i}-gradient-bg`, true);
			enabledMap.set(`--nav-box-l${i}-bg`, true);
		}

		enabledMap.set('--nav-box-outline-enabled', true);
		enabledMap.set('--nav-box-outline-style', true);
		enabledMap.set('--nav-box-outline-gradient-from', true);
		enabledMap.set('--nav-box-outline-gradient-to', true);
		enabledMap.set('--nav-box-outline-gradient-via', true);
		enabledMap.set('--nav-box-outline-gradient-3color-enabled', true);
		enabledMap.set('--nav-box-outline-gradient-angle', true);
		enabledMap.set('--nav-box-outline-gradient-start-pos', true);
		enabledMap.set('--nav-box-outline-gradient-end-pos', true);
		enabledMap.set('--nav-box-border-color', true);
		enabledMap.set('--nav-box-border-color-display', true);
		enabledMap.set('--nav-box-border-width', true);
		enabledMap.set('--nav-box-radius', true);
		enabledMap.set('--nav-box-body-enabled', true);
		enabledMap.set('--nav-box-body-style', true);
		enabledMap.set('--nav-box-gradient-enabled', true);
		enabledMap.set('--nav-box-gradient-angle', true);
		enabledMap.set('--nav-box-gradient-bg', true);
		enabledMap.set('--nav-box-gradient-display', true);
		enabledMap.set('--nav-box-bg', true);
		enabledMap.set('--nav-box-bg-display', true);
		enabledMap.set('--nav-box-border-display', true);
		enabledMap.set('--nav-box-radius-display', true);
		enabledMap.set('--nav-box-margin-display', true);
		enabledMap.set('--nav-box-shadow-display', true);
		enabledMap.set('--nav-box-hover-filter', true);
		enabledMap.set('--nav-box-active-shadow', true);
		enabledMap.set('--nav-box-active-filter', true);
		enabledMap.set('--nav-box-gradient-progressive', true);

		if (this.engine) {
			this.engine.setToken(this.activeMode, '--nav-box-enabled', isBoxEnabled ? 'true' : 'false');
			this.engine.setToken(this.activeMode, '--nav-box-subfolders-enabled', isSubfoldersEnabled ? 'true' : 'false');
			this.engine.setToken(this.activeMode, '--nav-box-gradient-steps', stepCount.toString());
			this.engine.setToken(this.activeMode, '--nav-box-subfolder-bg-display', subfolderBg);
			this.engine.setToken(this.activeMode, '--nav-box-subfolder-border-display', subfolderBorderDisplay);
			this.engine.setToken(this.activeMode, '--nav-box-subfolder-border-color-display', subfolderBorder);
			this.engine.setToken(this.activeMode, '--nav-box-subfolder-margin-display', subfolderMargin);
			this.engine.setToken(this.activeMode, '--nav-box-subfolder-shadow-display', subfolderShadow);

			for (let i = 1; i <= 24; i++) {
				this.engine.setToken(this.activeMode, `--nav-box-item-${i}-bg`, tokenMap.get(`--nav-box-item-${i}-bg`) ?? 'transparent');
				this.engine.setToken(this.activeMode, `--nav-box-item-${i}-border`, tokenMap.get(`--nav-box-item-${i}-border`) ?? 'transparent');
			}

			this.engine.setToken(this.activeMode, '--nav-box-outline-enabled', isOutlineEnabled ? 'true' : 'false');
			this.engine.setToken(this.activeMode, '--nav-box-outline-style', isOutlineStyleGradient ? 'gradient' : 'solid');
			this.engine.setToken(this.activeMode, '--nav-box-outline-gradient-from', outlineFromColor);
			this.engine.setToken(this.activeMode, '--nav-box-outline-gradient-to', outlineToColor);
			this.engine.setToken(this.activeMode, '--nav-box-outline-gradient-via', outlineViaColor);
			this.engine.setToken(this.activeMode, '--nav-box-outline-gradient-3color-enabled', outlineIs3Color ? 'true' : 'false');
			this.engine.setToken(this.activeMode, '--nav-box-outline-gradient-angle', outlineAngle);
			this.engine.setToken(this.activeMode, '--nav-box-outline-gradient-start-pos', `${outlineStartPos}%`);
			this.engine.setToken(this.activeMode, '--nav-box-outline-gradient-end-pos', `${outlineEndPos}%`);
			this.engine.setToken(this.activeMode, '--nav-box-border-color', borderColor);
			this.engine.setToken(this.activeMode, '--nav-box-border-color-display', borderColorDisplay);
			this.engine.setToken(this.activeMode, '--nav-box-border-width', borderWidth);
			this.engine.setToken(this.activeMode, '--nav-box-radius', radius);
			this.engine.setToken(this.activeMode, '--nav-box-body-enabled', isBodyEnabled ? 'true' : 'false');
			this.engine.setToken(this.activeMode, '--nav-box-body-style', isBodyStyleGradient ? 'gradient' : 'solid');
			this.engine.setToken(this.activeMode, '--nav-box-gradient-enabled', (isBodyEnabled && isBodyStyleGradient) ? 'true' : 'false');
			this.engine.setToken(this.activeMode, '--nav-box-gradient-from', fromColor);
			this.engine.setToken(this.activeMode, '--nav-box-gradient-to', toColor);
			this.engine.setToken(this.activeMode, '--nav-box-gradient-via', viaColor);
			this.engine.setToken(this.activeMode, '--nav-box-gradient-3color-enabled', is3Color ? 'true' : 'false');
			this.engine.setToken(this.activeMode, '--nav-box-gradient-angle', angle);
			this.engine.setToken(this.activeMode, '--nav-box-gradient-start-pos', `${startPos}%`);
			this.engine.setToken(this.activeMode, '--nav-box-gradient-end-pos', `${endPos}%`);
			this.engine.setToken(this.activeMode, '--nav-box-bg', bodySolidColor);
			this.engine.setToken(this.activeMode, '--nav-box-gradient-bg', gradBgVal);
			this.engine.setToken(this.activeMode, '--nav-box-gradient-display', gradBgVal);
			this.engine.setToken(this.activeMode, '--nav-box-bg-display', bgDisplay);
			this.engine.setToken(this.activeMode, '--nav-box-border-display', borderDisplay);
			this.engine.setToken(this.activeMode, '--nav-box-radius-display', radiusDisplay);
			this.engine.setToken(this.activeMode, '--nav-box-margin-display', marginDisplay);
			this.engine.setToken(this.activeMode, '--nav-box-shadow-display', shadowDisplay);
			this.engine.setToken(this.activeMode, '--nav-box-hover-filter', hoverFilter);
			this.engine.setToken(this.activeMode, '--nav-box-active-shadow', activeShadow);
			this.engine.setToken(this.activeMode, '--nav-box-active-filter', activeFilter);
			this.engine.setToken(this.activeMode, '--nav-box-gradient-progressive', 'true');
			for (let i = 1; i <= 6; i++) {
				this.engine.setToken(this.activeMode, `--nav-box-l${i}-gradient-pos`, `${navPositions[i - 1]}%`);
				this.engine.setToken(this.activeMode, `--nav-box-l${i}-gradient-bg`, tokenMap.get(`--nav-box-l${i}-gradient-bg`) ?? gradBgVal);
				this.engine.setToken(this.activeMode, `--nav-box-l${i}-bg`, tokenMap.get(`--nav-box-l${i}-bg`) ?? 'transparent');
				this.engine.setToken(this.activeMode, `--nav-box-outline-l${i}-gradient-pos`, `${outlineNavPositions[i - 1]}%`);
				this.engine.setToken(this.activeMode, `--nav-box-l${i}-border-color`, tokenMap.get(`--nav-box-l${i}-border-color`) ?? 'transparent');
			}
		}
	}

	public getNavBoxOutlineGradientColorAt(pct: number): string {
		const tokenMap = this.getActiveTokenMap();
		const isDark = this.activeMode === '.theme-dark';
		const fromCol = tokenMap.get('--nav-box-outline-gradient-from') ?? tokenMap.get('--text-accent') ?? (isDark ? '#a855f7' : '#7c3aed');
		const toCol = tokenMap.get('--nav-box-outline-gradient-to') ?? tokenMap.get('--text-accent-2') ?? tokenMap.get('--text-accent') ?? (isDark ? '#ec4899' : '#db2777');
		const is3Col = tokenMap.get('--nav-box-outline-gradient-3color-enabled') === 'true';
		const viaCol = tokenMap.get('--nav-box-outline-gradient-via') ?? (isDark ? '#06b6d4' : '#0891b2');
		const factor = Math.max(0, Math.min(100, pct)) / 100;
		if (is3Col) {
			return factor < 0.5
				? interpolateHexColor(fromCol, viaCol, factor * 2)
				: interpolateHexColor(viaCol, toCol, (factor - 0.5) * 2);
		}
		return interpolateHexColor(fromCol, toCol, factor);
	}

	public getNavBoxGradientColorAt(pct: number): string {
		const tokenMap = this.getActiveTokenMap();
		const isDark = this.activeMode === '.theme-dark';
		const fromCol = tokenMap.get('--nav-box-gradient-from') ?? tokenMap.get('--text-accent') ?? (isDark ? '#7c3aed' : '#6d28d9');
		const toCol = tokenMap.get('--nav-box-gradient-to') ?? tokenMap.get('--text-accent-2') ?? tokenMap.get('--text-accent') ?? (isDark ? '#ec4899' : '#db2777');
		const is3Col = tokenMap.get('--nav-box-gradient-3color-enabled') === 'true';
		const viaCol = tokenMap.get('--nav-box-gradient-via') ?? (isDark ? '#06b6d4' : '#0891b2');
		const factor = Math.max(0, Math.min(100, pct)) / 100;
		if (is3Col) {
			return factor < 0.5
				? interpolateHexColor(fromCol, viaCol, factor * 2)
				: interpolateHexColor(viaCol, toCol, (factor - 0.5) * 2);
		}
		return interpolateHexColor(fromCol, toCol, factor);
	}

	public getHeaderGradientColorAt(pct: number, mode?: '.theme-dark' | '.theme-light'): string {
		const targetMode = mode ?? this.activeMode;
		const tokenMap = targetMode === '.theme-dark' ? this.darkTokens : this.lightTokens;
		const defaultAccent = tokenMap.get('--text-accent') ?? (targetMode === '.theme-dark' ? '#d4af37' : '#2563eb');
		const defaultAccent2 = tokenMap.get('--text-accent-2') ?? defaultAccent;
		const fromCol = tokenMap.get('--header-gradient-from') ?? defaultAccent;
		const toCol = tokenMap.get('--header-gradient-to') ?? defaultAccent2;
		const is3Col = tokenMap.get('--header-gradient-3color-enabled') === 'true';
		const viaCol = tokenMap.get('--header-gradient-via') ?? defaultAccent;
		const factor = Math.max(0, Math.min(100, pct)) / 100;
		if (is3Col) {
			return factor < 0.5
				? interpolateHexColor(fromCol, viaCol, factor * 2)
				: interpolateHexColor(viaCol, toCol, (factor - 0.5) * 2);
		}
		return interpolateHexColor(fromCol, toCol, factor);
	}

	public parseExistingSnippet(css: string): void {
		const darkMatch = css.match(/\.theme-dark\s*\{([^}]+)\}/);
		if (darkMatch && darkMatch[1]) {
			this.extractBlockTokens(darkMatch[1], this.darkTokens, this.darkEnabled, '.theme-dark');
		}

		const lightMatch = css.match(/\.theme-light\s*\{([^}]+)\}/);
		if (lightMatch && lightMatch[1]) {
			this.extractBlockTokens(lightMatch[1], this.lightTokens, this.lightEnabled, '.theme-light');
		}

		const rootMatch = css.match(/:root\s*\{([^}]+)\}/);
		if (rootMatch && rootMatch[1] && !darkMatch && !lightMatch) {
			this.extractBlockTokens(rootMatch[1], this.darkTokens, this.darkEnabled, '.theme-dark');
			this.extractBlockTokens(rootMatch[1], this.lightTokens, this.lightEnabled, '.theme-light');
		}

		if (this.darkTokens.get('--glass-enabled') === 'true') {
			this.darkTokens.set('--tab-curve', '0px');
			this.darkEnabled.set('--tab-curve', true);
		}
		if (this.lightTokens.get('--glass-enabled') === 'true') {
			this.lightTokens.set('--tab-curve', '0px');
			this.lightEnabled.set('--tab-curve', true);
		}
	}

	public extractBlockTokens(
		blockContent: string,
		tokenMap: Map<string, string>,
		enabledMap: Map<string, boolean>,
		scope: string,
	): void {
		for (const ctrl of STYLE_CONTROLS) {
			const match = blockContent.match(tokenValueRegex(ctrl.variable));
			if (match && match[1]) {
				const val = match[1].trim();
				tokenMap.set(ctrl.variable, val);
				enabledMap.set(ctrl.variable, true);
				if (this.engine) {
					this.engine.setToken(scope, ctrl.variable, val);
				}
				if (ctrl.id === 'glass-look' || ctrl.variable === '--glass-enabled') {
					if (val === 'true') {
						tokenMap.set('--tab-curve', '0px');
						enabledMap.set('--tab-curve', true);
						if (this.engine) {
							this.engine.setToken(scope, '--tab-curve', '0px');
						}
					}
				}
				if (ctrl.id === 'h1-border') {
					const paddingVal = val === 'none' ? '0px' : '4px';
					tokenMap.set('--h1-border-padding', paddingVal);
					enabledMap.set('--h1-border-padding', true);
					if (this.engine) {
						this.engine.setToken(scope, '--h1-border-padding', paddingVal);
					}
				}
			}
		}

		// Also extract any --sh- tokens (shadows, outlines, animations, gradients)
		const shRegex = /(--sh-[a-z0-9-]+)\s*:\s*([^;!]+)(?:!important)?;/g;
		let shMatch;
		while ((shMatch = shRegex.exec(blockContent)) !== null) {
			const varName = shMatch[1];
			const val = shMatch[2]?.trim();
			if (varName && val) {
				tokenMap.set(varName, val);
			}
		}

		// Also extract any --ui- tokens (UI Element opacities, master opacity, hover reveal)
		const uiRegex = /(--ui-[a-z0-9-]+)\s*:\s*([^;!]+)(?:!important)?;/g;
		let uiMatch;
		while ((uiMatch = uiRegex.exec(blockContent)) !== null) {
			const varName = uiMatch[1];
			const val = uiMatch[2]?.trim();
			if (varName && val) {
				tokenMap.set(varName, val);
			}
		}

		// Also extract any heading gradient tokens (--header-gradient-*, --header-solid-color, --h[1-6]-gradient-*, --h[1-6]-color)
		const hgRegex = /(--(?:header-(?:gradient|solid)|h[1-6]-(?:gradient|color))-[a-z0-9-]+|--header-solid-color|--h[1-6]-color)\s*:\s*([^;!]+)(?:!important)?;/g;
		let hgMatch;
		while ((hgMatch = hgRegex.exec(blockContent)) !== null) {
			const varName = hgMatch[1];
			const val = hgMatch[2]?.trim();
			if (varName && val) {
				tokenMap.set(varName, val);
				enabledMap.set(varName, true);
				if (this.engine) {
					this.engine.setToken(scope, varName, val);
				}
			}
		}

		// Also extract any nav box tokens (--nav-box-*)
		const nbRegex = /(--nav-box-[a-z0-9-]+)\s*:\s*([^;!]+)(?:!important)?;/g;
		let nbMatch;
		while ((nbMatch = nbRegex.exec(blockContent)) !== null) {
			const varName = nbMatch[1];
			const val = nbMatch[2]?.trim();
			if (varName && val) {
				tokenMap.set(varName, val);
				enabledMap.set(varName, true);
				if (this.engine) {
					this.engine.setToken(scope, varName, val);
				}
			}
		}
		this.invalidateVarsCache();
	}

	public switchTab(tabId: DesignerTabId): void {
		if (this.activeTab === tabId && this.panelContainer && this.panelContainer.children.length > 0) return;
		this.activeTab = tabId;
		this.updateActiveTabState();
		this.renderActiveTabContent(true);
	}

	private updateActiveTabState(): void {
		const visibleTabs = TAB_DEFINITIONS.filter(
			(tab) => this.plugin?.settings?.visibleTabs?.[tab.id] ?? true
		);
		const effectiveTabs = visibleTabs.length > 0 ? visibleTabs : TAB_DEFINITIONS;
		const activeTabDef = effectiveTabs.find((t) => t.id === this.activeTab) ?? effectiveTabs[0];

		for (const [id, btn] of this.tabButtons) {
			btn.toggleClass('is-active', this.activeTab === id);
		}

		if (this.tabDropdownSelect && this.tabDropdownSelect.value !== this.activeTab) {
			this.tabDropdownSelect.value = this.activeTab;
		}

		if (this.tabDropdownIcon && activeTabDef) {
			this.tabDropdownIcon.empty();
			setIcon(this.tabDropdownIcon, activeTabDef.icon);
		}

		this.syncModeToggle();

		if (this.viewCodeToggleComp) {
			this.viewCodeToggleComp.setValue(this.isCodeViewOpen);
		}

		if (this.modeLabelEl) {
			this.modeLabelEl.setText(this.activeMode === '.theme-dark' ? '🌙 Dark Mode' : '☀️ Light Mode');
		}

	}

	private renderActiveTabContent(resetScroll: boolean = false): void {
		if (!this.panelContainer) return;

		if (resetScroll) {
			this.contentEl.scrollTop = 0;
			if (this.mainPaneEl) this.mainPaneEl.scrollTop = 0;
			if (this.containerEl) this.containerEl.scrollTop = 0;
		}

		this.panelContainer.empty();

		if (this.activeTab === 'presets') {
			renderPresetsTab(this, this.panelContainer);
		} else if (this.activeTab === 'shadows') {
			renderShadowsTab(this, this.panelContainer);
		} else if (this.activeTab === 'elements') {
			renderElementsTab(this, this.panelContainer);
		} else if (this.activeTab === 'colors') {
			renderColorsTab(this, this.panelContainer);
		} else {
			renderCategoryTab(this, this.panelContainer, this.activeTab);
		}
	}

	public renderUI(resetScroll: boolean = false): void {
		const { contentEl } = this;
		this.updateCompressedState();

		const needsShellBuild =
			this.shouldRebuildShell ||
			!this.panelContainer ||
			!this.headerEl ||
			!contentEl.contains(this.panelContainer);

		if (needsShellBuild) {
			this.shouldRebuildShell = false;
			contentEl.empty();
			contentEl.addClass('css-designer-container');
			const initialAccent2 = this.getActiveTokenMap().get('--text-accent-2') ?? (this.activeMode === '.theme-dark' ? '#a855f7' : '#8b5cf6');
			contentEl.style.setProperty('--text-accent-2', initialAccent2);
			this.tabButtons.clear();

			// 1. Master Mode & Preview Toolbar
			this.headerEl = contentEl.createDiv({ cls: 'css-designer-header' });
			const toolbarEl = this.headerEl.createDiv({ cls: 'css-designer-toolbar' });

			// Theme Mode Toggle (Light Mode vs Dark Mode)
			const modeToggleBox = toolbarEl.createDiv({ cls: 'css-toolbar-toggle-item' });
			this.modeLabelEl = modeToggleBox.createSpan({
				text: this.activeMode === '.theme-dark' ? '🌙 Dark Mode' : '☀️ Light Mode',
				cls: 'css-toolbar-label',
			});
			this.modeToggleComp = new ToggleComponent(modeToggleBox)
				.setValue(this.activeMode === '.theme-dark')
				.setTooltip('Toggle between light mode (off) and dark mode (on)')
				.onChange((isDark) => {
					if (this.isSyncingModeToggle) return;
					const target: '.theme-dark' | '.theme-light' = isDark ? '.theme-dark' : '.theme-light';
					if (target === this.activeMode) return;

					// One mode is designed at a time, so the snippet only ever
					// carries CSS for that one. The mode being left behind goes
					// back to stock, which is what keeps the other mode's rules out
					// of the file - and is also why this asks first.
					const leaving = this.activeMode;
					const leavingName = leaving === '.theme-dark' ? 'Dark' : 'Light';
					const enteringName = isDark ? 'Dark' : 'Light';

					new ConfirmActionModal(
						this.app,
						`Switch to ${enteringName} Mode?`,
						`Only one mode is designed at a time, so the snippet carries CSS for that mode alone. `
							+ `Switching resets your ${leavingName} Mode design to Obsidian's defaults and takes its CSS out of the snippet. `
							+ `This cannot be undone.`,
						`Switch and reset ${leavingName}`,
						() => this.commitModeSwitch(target),
						// The toggle has already moved under the pointer; put it back.
						() => this.syncModeToggle(),
					).open();
				});
			this.statusEl = null;

			// View Code Toggle (Top Right)
			const viewCodeBox = toolbarEl.createDiv({ cls: 'css-toolbar-toggle-item mod-view-code' });
			viewCodeBox.createSpan({ text: '💻 View Code', cls: 'css-toolbar-label' });
			this.viewCodeToggleComp = new ToggleComponent(viewCodeBox)
				.setValue(this.isCodeViewOpen)
				.setTooltip('Toggle active CSS snippet code pane on the right')
				.onChange((isOpen) => {
					this.setCodeViewOpen(isOpen);
				});

			// 2. Main Body Wrap (Content Pane + Resizer + Code Pane)
			this.bodyWrapEl = contentEl.createDiv({ cls: 'css-designer-body-wrap' });
			this.mainPaneEl = this.bodyWrapEl.createDiv({ cls: 'css-designer-content-pane' });

			// 3. TAB NAVIGATION BAR
			const isCompact = this.plugin?.settings?.compactTabs ?? false;
			const showIcons = this.plugin?.settings?.showTabIcons ?? true;
			this.tabsBarEl = this.mainPaneEl.createDiv({
				cls: `css-designer-tabs ${isCompact ? 'mod-compact' : ''}`,
			});

			const visibleTabs = TAB_DEFINITIONS.filter(
				(tab) => this.plugin?.settings?.visibleTabs?.[tab.id] ?? true
			);
			const effectiveTabs = visibleTabs.length > 0 ? visibleTabs : TAB_DEFINITIONS;

			if (!effectiveTabs.some((t) => t.id === this.activeTab) && effectiveTabs[0]) {
				this.activeTab = effectiveTabs[0].id;
			}

			for (const tab of effectiveTabs) {
				const isActive = this.activeTab === tab.id;
				const tabBtn = this.tabsBarEl.createEl('button', {
					cls: `css-tab-btn ${isActive ? 'is-active' : ''} ${isCompact ? 'mod-compact' : ''}`,
				});
				if (showIcons) {
					const iconSpan = tabBtn.createSpan({ cls: 'css-tab-icon' });
					setIcon(iconSpan, tab.icon);
				}
				tabBtn.createSpan({ cls: 'css-tab-title', text: tab.label });

				tabBtn.addEventListener('click', () => {
					this.switchTab(tab.id);
				});
				this.tabButtons.set(tab.id, tabBtn);
			}

			// Tab Navigation Dropdown (collapsed mode for compressed / small views)
			this.dropdownContainerEl = this.mainPaneEl.createDiv({
				cls: `css-designer-tab-dropdown-container ${isCompact ? 'mod-compact' : ''}`,
			});
			const dropdownLabel = this.dropdownContainerEl.createDiv({
				cls: 'css-designer-tab-dropdown-label',
			});
			const activeTabDef = effectiveTabs.find((t) => t.id === this.activeTab) ?? effectiveTabs[0];
			if (showIcons && activeTabDef) {
				this.tabDropdownIcon = dropdownLabel.createSpan({ cls: 'css-tab-dropdown-icon' });
				setIcon(this.tabDropdownIcon, activeTabDef.icon);
			} else {
				this.tabDropdownIcon = null;
			}
			dropdownLabel.createSpan({ text: 'Tab:' });

			this.tabDropdownSelect = this.dropdownContainerEl.createEl('select', {
				cls: 'dropdown css-designer-tab-select',
			});
			this.tabDropdownSelect.setAttribute('aria-label', 'Select navigation tab');
			for (const tab of effectiveTabs) {
				const optionEl = this.tabDropdownSelect.createEl('option', {
					value: tab.id,
					text: tab.label,
				});
				if (tab.id === this.activeTab) {
					optionEl.selected = true;
				}
			}
			this.tabDropdownSelect.addEventListener('change', () => {
				if (this.tabDropdownSelect) {
					this.switchTab(this.tabDropdownSelect.value as DesignerTabId);
				}
			});

			// 4. ACTIVE TAB CONTENT
			this.panelContainer = this.mainPaneEl.createDiv({ cls: 'css-designer-tab-panel' });

			// 5. Footer with Actions
			this.footerEl = this.mainPaneEl.createDiv({ cls: 'css-designer-footer' });
			const saveNowBtn = this.footerEl.createEl('button', {
				text: 'Save CSS snippet',
				cls: 'mod-cta',
			});
			saveNowBtn.addEventListener('click', () => {
				new SaveSnippetModal(this.app, this, this.currentSnippetName).open();
			});

			this.resetBtnEl = this.footerEl.createEl('button', {
				text: 'Reset defaults',
			});
			this.resetBtnEl.addEventListener('click', () => {
				this.resetAllToTheme();
			});

			// 6. Right-side Resizable Code Pane & Resizer
			this.codeResizerEl = this.bodyWrapEl.createDiv({
				cls: `css-designer-code-resizer ${this.isCodeViewOpen ? '' : 'is-hidden'}`,
			});
			this.codePaneEl = this.bodyWrapEl.createDiv({
				cls: `css-designer-code-pane ${this.isCodeViewOpen ? '' : 'is-hidden'}`,
			});
			this.codePaneEl.style.width = `${this.codePaneWidth}px`;
			this.renderCodePane(this.codePaneEl);
			this.initCodeResizer(this.codeResizerEl, this.codePaneEl);
		}

		this.updateActiveTabState();
		this.renderActiveTabContent(resetScroll);
		if (this.isCodeViewOpen) {
			this.updateActiveCodeSnippet();
		}
	}

	public setCodeViewOpen(isOpen: boolean): void {
		this.isCodeViewOpen = isOpen;
		if (this.viewCodeToggleComp && this.viewCodeToggleComp.getValue() !== isOpen) {
			this.viewCodeToggleComp.setValue(isOpen);
		}
		if (this.codeResizerEl) {
			this.codeResizerEl.toggleClass('is-hidden', !isOpen);
		}
		if (this.codePaneEl) {
			this.codePaneEl.toggleClass('is-hidden', !isOpen);
			if (isOpen) {
				this.codePaneEl.style.width = `${this.codePaneWidth}px`;
			}
		}
		this.updateCompressedState();
		if (!isOpen && this.codePaneUpdateTimer !== null) {
			window.clearTimeout(this.codePaneUpdateTimer);
			this.codePaneUpdateTimer = null;
		}
		if (isOpen) {
			this.updateActiveCodeSnippet();
		}
	}

	/**
	 * Coalesce code-pane rebuilds during rapid edits.
	 *
	 * `buildGeneratedCss` regenerates the whole stylesheet (including every SVG
	 * pattern), so calling it on each animation frame while dragging a slider
	 * burns the main thread. The pane is a read-only mirror of the saved
	 * snippet, so a short delay costs nothing visible while the persisted file
	 * stays exact.
	 */
	public scheduleCodePaneUpdate(): void {
		if (!this.isCodeViewOpen || this.codePaneUpdateTimer !== null) return;
		this.codePaneUpdateTimer = window.setTimeout(() => {
			this.codePaneUpdateTimer = null;
			this.updateActiveCodeSnippet();
		}, 120);
	}

	public updateActiveCodeSnippet(): void {
		if (!this.isCodeViewOpen || !this.codeContentEl) return;
		const generatedCss = buildGeneratedCss(this);
		this.codeContentEl.textContent = generatedCss;
		if (this.codeLineCountEl) {
			const lines = generatedCss.split('\n').length;
			this.codeLineCountEl.setText(`${lines} lines`);
		}
	}

	private renderCodePane(container: HTMLElement): void {
		container.empty();

		// Header
		const header = container.createDiv({ cls: 'css-designer-code-header' });
		const titleWrap = header.createDiv({ cls: 'css-designer-code-title-wrap' });
		const iconSpan = titleWrap.createSpan({ cls: 'css-designer-code-icon' });
		setIcon(iconSpan, 'code');
		titleWrap.createSpan({ text: 'Active CSS Snippet', cls: 'css-designer-code-title' });
		this.codeLineCountEl = titleWrap.createSpan({ cls: 'css-designer-code-badge' });

		const actions = header.createDiv({ cls: 'css-designer-code-actions' });
		const copyBtn = actions.createEl('button', {
			cls: 'css-designer-code-copy-btn mod-cta',
			attr: { type: 'button', 'aria-label': 'Copy active CSS to clipboard' },
		});
		const copyIcon = copyBtn.createSpan({ cls: 'css-designer-copy-icon' });
		setIcon(copyIcon, 'copy');
		const copyText = copyBtn.createSpan({ text: 'Copy Code' });

		copyBtn.addEventListener('click', () => {
			void (async () => {
				const css = buildGeneratedCss(this);
				try {
					await navigator.clipboard.writeText(css);
					copyBtn.addClass('is-copied');
					copyIcon.empty();
					setIcon(copyIcon, 'check');
					copyText.setText('Copied!');
					new Notice('Active CSS snippet copied to clipboard');
					window.setTimeout(() => {
						copyBtn.removeClass('is-copied');
						copyIcon.empty();
						setIcon(copyIcon, 'copy');
						copyText.setText('Copy code');
					}, 1800);
				} catch {
					new Notice('Failed to copy to clipboard');
				}
			})();
		});

		const closeBtn = actions.createEl('button', {
			cls: 'css-designer-code-close-btn',
			attr: { type: 'button', 'aria-label': 'Close code panel' },
		});
		setIcon(closeBtn, 'x');
		closeBtn.addEventListener('click', () => {
			this.setCodeViewOpen(false);
		});

		// Code display block
		const scrollWrap = container.createDiv({ cls: 'css-designer-code-scroll' });
		const pre = scrollWrap.createEl('pre', { cls: 'css-designer-code-pre' });
		this.codeContentEl = pre.createEl('code', { cls: 'css-designer-code-content' });
	}

	private initCodeResizer(resizerEl: HTMLElement, codePaneEl: HTMLElement): void {
		let startX = 0;
		let startWidth = 0;
		let isDragging = false;

		const doc = resizerEl.ownerDocument;
		const win = doc.defaultView || window;

		const doResize = (clientX: number) => {
			const dx = startX - clientX;
			const newWidth = startWidth + dx;
			const minW = 240;
			const maxW = Math.max(minW, (win.innerWidth || 800) - 340);
			const clamped = Math.max(minW, Math.min(newWidth, maxW));
			codePaneEl.style.width = `${clamped}px`;
			this.codePaneWidth = clamped;
			this.updateCompressedState();
		};

		const stopDrag = () => {
			if (!isDragging) return;
			isDragging = false;
			doc.body.removeClass('is-resizing-code-pane');
			resizerEl.removeClass('is-dragging');
			doc.removeEventListener('mousemove', onMouseMove);
			doc.removeEventListener('mouseup', stopDrag);
			win.removeEventListener('blur', stopDrag);
		};

		const onMouseMove = (e: MouseEvent) => {
			if (!isDragging) return;
			doResize(e.clientX);
		};

		// Pointer events with pointer capture for smooth, rock-solid dragging
		resizerEl.addEventListener('pointerdown', (e: PointerEvent) => {
			e.preventDefault();
			e.stopPropagation();
			isDragging = true;
			startX = e.clientX;
			startWidth = codePaneEl.getBoundingClientRect().width || codePaneEl.offsetWidth;
			try {
				resizerEl.setPointerCapture(e.pointerId);
			} catch {
				// ignore if pointer capture unsupported
			}
			doc.body.addClass('is-resizing-code-pane');
			resizerEl.addClass('is-dragging');

			doc.addEventListener('mousemove', onMouseMove);
			doc.addEventListener('mouseup', stopDrag);
			win.addEventListener('blur', stopDrag);
		});

		resizerEl.addEventListener('pointermove', (e: PointerEvent) => {
			if (!isDragging) return;
			doResize(e.clientX);
		});

		resizerEl.addEventListener('pointerup', (e: PointerEvent) => {
			if (!isDragging) return;
			try {
				if (resizerEl.hasPointerCapture(e.pointerId)) {
					resizerEl.releasePointerCapture(e.pointerId);
				}
			} catch {
				// ignore
			}
			stopDrag();
		});

		resizerEl.addEventListener('pointercancel', (e: PointerEvent) => {
			if (!isDragging) return;
			try {
				if (resizerEl.hasPointerCapture(e.pointerId)) {
					resizerEl.releasePointerCapture(e.pointerId);
				}
			} catch {
				// ignore
			}
			stopDrag();
		});

		// Fallback for mousedown in case pointer events aren't supported in test environments
		resizerEl.addEventListener('mousedown', (e: MouseEvent) => {
			if (isDragging) return;
			e.preventDefault();
			e.stopPropagation();
			isDragging = true;
			startX = e.clientX;
			startWidth = codePaneEl.getBoundingClientRect().width || codePaneEl.offsetWidth;
			doc.addEventListener('mousemove', onMouseMove);
			doc.addEventListener('mouseup', stopDrag);
			win.addEventListener('blur', stopDrag);
			doc.body.addClass('is-resizing-code-pane');
			resizerEl.addClass('is-dragging');
		});
	}

	public onTokenChange(ctrl: StyleControl, value: string): void {
		const tokenMap = this.getActiveTokenMap();
		const enabledMap = this.getActiveEnabledMap();
		tokenMap.set(ctrl.variable, value);

		if (ctrl.variable.startsWith('--header-gradient-') || ctrl.variable.startsWith('--header-solid-') || ctrl.variable.startsWith('--h1-gradient-')) {
			this.updateHeaderGradientTokens();
		}
		if (ctrl.variable.includes('nav-box')) {
			this.updateNavBoxTokens();
		}
		if (ctrl.variable === '--background-secondary') {
			tokenMap.set('--search-bar-background', value);
			if (this.engine) {
				this.engine.setToken(this.activeMode, '--search-bar-background', value);
			}
		}

		// While the frames are linked, the unfocused colour is not an independent
		// setting: it tracks the focused one so the window never greys out on blur.
		// The token is mirrored as well as the companion rule so that the exported
		// snippet is self-consistent and the swatch shows the colour in force.
		const framesLinked = (tokenMap.get('--titlebar-match-unfocused') ?? 'true') !== 'false';
		if (ctrl.variable === '--titlebar-background-focused' && framesLinked) {
			tokenMap.set('--titlebar-background', value);
			enabledMap.set('--titlebar-background', true);
			if (this.engine) {
				this.engine.setToken(this.activeMode, '--titlebar-background', value);
			}
		}
		let relinkedFrames = false;
		if (ctrl.variable === '--titlebar-match-unfocused') {
			if (framesLinked) {
				const focused = tokenMap.get('--titlebar-background-focused');
				if (focused) {
					tokenMap.set('--titlebar-background', focused);
					enabledMap.set('--titlebar-background', true);
					if (this.engine) {
						this.engine.setToken(this.activeMode, '--titlebar-background', focused);
					}
				}
			}
			// The unfocused swatch is locked while linked, so the row has to be
			// rebuilt for its disabled state and value to reflect the new mode.
			relinkedFrames = true;
		}

		const isEnabled = enabledMap.get(ctrl.variable) ?? true;
		if (isEnabled) {
			enabledMap.set(ctrl.variable, true);
			if (this.engine) {
				this.engine.setToken(this.activeMode, ctrl.variable, value);
			}
			const affectsCompanion = ctrl.id === 'checkbox-style' || ctrl.id.startsWith('callout-color-') || ctrl.category === 'features' || !!ctrl.companionCss;
			if (affectsCompanion) {
				this.invalidateCompanionCache();
				this.scheduleLiveStyleUpdate(false);
			} else {
				this.scheduleLiveStyleUpdate(true);
			}
		}

		this.invalidateVarsCache();
		if (ctrl.variable === '--text-accent-2' && this.contentEl) {
			this.contentEl.style.setProperty('--text-accent-2', value);
		}
		this.queueStatusUpdate(`Updated ${ctrl.variable} in ${this.activeMode}`);
		this.debouncedSave();

		if (relinkedFrames) {
			this.renderActiveTabContent(false);
		}
	}

	/**
	 * Whether the live variable block should declare `name`.
	 *
	 * Mirrors the saved snippet's elision so the live preview and the file agree:
	 * a property is written when a companion rule reads it, when a control has
	 * been moved off its stock value, or when it belongs to no control (an
	 * implicit binding). Left at stock, a control contributes nothing, which is
	 * what lets a reset clear the CSS while every enable toggle stays on.
	 */
	private isLiveTokenKept(
		name: string,
		value: string,
		mode: '.theme-dark' | '.theme-light',
		referenced: ReadonlySet<string>,
	): boolean {
		if (referenced.has(name)) return true;
		const ctrl = CONTROL_BY_VARIABLE.get(name);
		if (!ctrl) return false;
		if (ctrl.type === 'toggle') return value === (ctrl.toggleTrueValue ?? 'true');
		const stock = mode === '.theme-dark' ? ctrl.defaultDarkValue : ctrl.defaultLightValue;
		return value !== stock;
	}

	public updateLiveStyleTag(varsOnly: boolean = false): void {
		const targetDocs = this.getAllTargetDocuments();

		if (!this.livePreviewActive) {
			for (const doc of targetDocs) {
				const oldEl = doc.getElementById(LIVE_STYLE_ID);
				if (oldEl) oldEl.textContent = '';
				const varsEl = doc.getElementById(LIVE_VARS_STYLE_ID);
				if (varsEl) varsEl.textContent = '';
				const compEl = doc.getElementById(LIVE_COMPANION_STYLE_ID);
				if (compEl) compEl.textContent = '';
			}
			return;
		}

		// The embedded preview fonts must exist in every document the live style
		// tag paints into, otherwise a selected family's alias cannot resolve.
		for (const doc of targetDocs) {
			ensureEmbeddedFonts(doc);
		}

		// 0. Ensure --tab-curve is locked to 0px only when frosted glass is active for that mode
		const isDarkGlassActive = this.darkTokens.get('--glass-enabled') === 'true';
		const isLightGlassActive = this.lightTokens.get('--glass-enabled') === 'true';
		if (isDarkGlassActive) {
			this.darkTokens.set('--tab-curve', '0px');
			this.darkEnabled.set('--tab-curve', true);
		}
		if (isLightGlassActive) {
			this.lightTokens.set('--tab-curve', '0px');
			this.lightEnabled.set('--tab-curve', true);
		}

		// 3. Companion, structural, and animated rules. Built before the variable
		// block so that block can be narrowed to the properties these rules read -
		// the same minimality the saved snippet uses.
		if (!varsOnly || this.cachedCompanionRules === null) {
			let companionRules = '/* Feature DOM Bindings */\n';
			// The saved snippet and the live preview share one builder. Deciding
			// this here independently meant the two could disagree, so closing the
			// designer (or disabling the plugin) visibly changed the result until
			// they were reconciled by hand.
			companionRules += buildCompanionBindings(this);

			// Checkbox Style rules. The same predicates the snippet uses, so the
			// preview cannot show styling the saved file will not contain.
			companionRules += '\n/* Task Checkbox Marker Styles */\n';
			if (emitsCheckboxStyling(this, '.theme-dark')) {
				companionRules += generateCheckboxStyleRules('.theme-dark', this.darkTokens);
			}
			if (emitsCheckboxStyling(this, '.theme-light')) {
				companionRules += generateCheckboxStyleRules('.theme-light', this.lightTokens);
			}

			// Callout accent colors
			companionRules += '\n/* Callout Accent Colors */\n';
			companionRules += generateCalloutCss('.theme-dark', this.darkTokens, customisedCalloutGroups(this, '.theme-dark'));
			companionRules += generateCalloutCss('.theme-light', this.lightTokens, customisedCalloutGroups(this, '.theme-light'));

			// Shadows, Glows & Outlines from SHADOW_ELEMENTS
			const animatedSelectors: string[] = [];
			companionRules += '\n/* Shadows, Glows & Outlines Overrides */\n';
			for (const el of SHADOW_ELEMENTS) {
				// Dark Mode
				const isDarkOn = this.darkTokens.get(`--sh-${el.id}-enabled`) === 'true';
				const isDarkOutlineOn = this.darkTokens.get(`--sh-${el.id}-outline-enabled`) === 'true';

				if (isDarkOn || isDarkOutlineOn) {
					const animBlock = generateKeyframeBlock(el, this.darkTokens, 'themedark');
					if (animBlock) {
						companionRules += `${animBlock.css}\n`;
					}

					let ruleBody = '';
					if (isDarkOn) {
						const shadow = computeShadowString(el.id, this.darkTokens, el.kind, 'base');
						const imp = animBlock ? '' : ' !important';
						ruleBody += el.kind === 'text' ? `text-shadow: ${shadow}${imp};\n  ` : `box-shadow: ${shadow}${imp};\n  `;
					}
					if (isDarkOutlineOn && el.supportsOutline) {
						const width = this.darkTokens.get(`--sh-${el.id}-outline-width`) ?? '2px';
						const color = this.darkTokens.get(`--sh-${el.id}-outline-color`) ?? '#7c3aed';
						const outImp = animBlock ? '' : ' !important';
						if (el.kind === 'text') {
							ruleBody += `-webkit-text-stroke: ${width} ${color}${outImp};\n  `;
						} else {
							ruleBody += `outline: ${width} solid ${color}${outImp};\n  outline-offset: -1px${outImp};\n  `;
						}
					}
					if (animBlock) {
						const speed = this.darkTokens.get(`--sh-${el.id}-anim-speed`) ?? '2.5s';
						const timing = animBlock.timingFunction ?? 'ease-in-out';
						if (animBlock.hint) {
							ruleBody += `will-change: ${animBlock.hint};\n  backface-visibility: hidden;\n  `;
						}
						ruleBody += `animation: ${animBlock.keyframeName} ${speed} ${timing} infinite !important;\n  `;
					}
					ruleBody += containmentFixes(el.id);
					const scopedDark = scopeSelectors('.theme-dark', el.selector);
					if (animBlock) animatedSelectors.push(scopedDark);
					companionRules += `${scopedDark} {\n  ${ruleBody.trim()}\n}\n`;

					companionRules += overflowCompanions(el.id, '.theme-dark');
					if (el.id === 'active-leaf' && isDarkOutlineOn) {
						const isDarkGlass = this.darkTokens.get('--glass-enabled') === 'true';
						if (!isDarkGlass) {
							const width = this.darkTokens.get(`--sh-${el.id}-outline-width`) ?? '2px';
							const color = this.darkTokens.get(`--sh-${el.id}-outline-color`) ?? '#7c3aed';
							companionRules += `.theme-dark .workspace-split.mod-root .workspace-tab-header-container .workspace-tab-header.is-active::before,\n.theme-dark .workspace-split.mod-root .workspace-tab-header-container .workspace-tab-header.is-active::after {\n  box-shadow: inset 0 0 0 ${width} ${color}, 0 0 0 calc(var(--tab-curve, 6px) * 4) var(--tab-background-active) !important;\n}\n`;
						}
					}
				}

				// Light Mode
				const isLightOn = this.lightTokens.get(`--sh-${el.id}-enabled`) === 'true';
				const isLightOutlineOn = this.lightTokens.get(`--sh-${el.id}-outline-enabled`) === 'true';

				if (isLightOn || isLightOutlineOn) {
					const animBlock = generateKeyframeBlock(el, this.lightTokens, 'themelight');
					if (animBlock) {
						companionRules += `${animBlock.css}\n`;
					}

					let ruleBody = '';
					if (isLightOn) {
						const shadow = computeShadowString(el.id, this.lightTokens, el.kind, 'base');
						const imp = animBlock ? '' : ' !important';
						ruleBody += el.kind === 'text' ? `text-shadow: ${shadow}${imp};\n  ` : `box-shadow: ${shadow}${imp};\n  `;
					}
					if (isLightOutlineOn && el.supportsOutline) {
						const width = this.lightTokens.get(`--sh-${el.id}-outline-width`) ?? '2px';
						const color = this.lightTokens.get(`--sh-${el.id}-outline-color`) ?? '#6d28d9';
						const outImp = animBlock ? '' : ' !important';
						if (el.kind === 'text') {
							ruleBody += `-webkit-text-stroke: ${width} ${color}${outImp};\n  `;
						} else {
							ruleBody += `outline: ${width} solid ${color}${outImp};\n  outline-offset: -1px${outImp};\n  `;
						}
					}
					if (animBlock) {
						const speed = this.lightTokens.get(`--sh-${el.id}-anim-speed`) ?? '2.5s';
						const timing = animBlock.timingFunction ?? 'ease-in-out';
						if (animBlock.hint) {
							ruleBody += `will-change: ${animBlock.hint};\n  backface-visibility: hidden;\n  `;
						}
						ruleBody += `animation: ${animBlock.keyframeName} ${speed} ${timing} infinite !important;\n  `;
					}
					ruleBody += containmentFixes(el.id);
					const scopedLight = scopeSelectors('.theme-light', el.selector);
					if (animBlock) animatedSelectors.push(scopedLight);
					companionRules += `${scopedLight} {\n  ${ruleBody.trim()}\n}\n`;

					companionRules += overflowCompanions(el.id, '.theme-light');
					if (el.id === 'active-leaf' && isLightOutlineOn) {
						const isLightGlass = this.lightTokens.get('--glass-enabled') === 'true';
						if (!isLightGlass) {
							const width = this.lightTokens.get(`--sh-${el.id}-outline-width`) ?? '2px';
							const color = this.lightTokens.get(`--sh-${el.id}-outline-color`) ?? '#6d28d9';
							companionRules += `.theme-light .workspace-split.mod-root .workspace-tab-header-container .workspace-tab-header.is-active::before,\n.theme-light .workspace-split.mod-root .workspace-tab-header-container .workspace-tab-header.is-active::after {\n  box-shadow: inset 0 0 0 ${width} ${color}, 0 0 0 calc(var(--tab-curve, 6px) * 4) var(--tab-background-active) !important;\n}\n`;
						}
					}
				}
			}

			// Append Frosted Glass rules
			companionRules += generateGlassCss('.theme-dark', this.darkTokens);
			companionRules += generateGlassCss('.theme-light', this.lightTokens);

			// Append Custom Backgrounds & Canvas Patterns
			companionRules += '\n/* Custom Backgrounds & Canvas Patterns */\n';
			companionRules += generateCustomBackgroundCss('.theme-dark', this, animatedSelectors);
			companionRules += generateCustomBackgroundCss('.theme-light', this, animatedSelectors);

			// Append UI Elements Opacity & Minimalist Layout Overrides
			companionRules += '\n/* UI Elements Opacity & Minimalist Layout Overrides */\n';
			companionRules += generateUIElementCss('.theme-dark', this);
			companionRules += generateUIElementCss('.theme-light', this);

			// Append Settings & UI Toggle Switches
			if (emitsToggleSwitchProtection(this)) {
			companionRules += '\n/* Settings & UI Toggle Switches */\n';
			companionRules += `.checkbox-container input[type="checkbox"] {\n` +
				`  position: absolute !important;\n` +
				`  opacity: 0 !important;\n` +
				`  pointer-events: none !important;\n` +
				`  width: 0 !important;\n` +
				`  height: 0 !important;\n` +
				`  margin: 0 !important;\n` +
				`  padding: 0 !important;\n` +
				`  border: none !important;\n` +
				`  background: transparent !important;\n` +
				`  outline: none !important;\n` +
				`  box-shadow: none !important;\n` +
				`  appearance: none !important;\n` +
				`  -webkit-appearance: none !important;\n` +
				`}\n` +
				`.checkbox-container input[type="checkbox"]::before,\n` +
				`.checkbox-container input[type="checkbox"]::after {\n` +
				`  display: none !important;\n` +
				`  content: none !important;\n` +
				`  mask-image: none !important;\n` +
				`  -webkit-mask-image: none !important;\n` +
				`}\n` +
				`.modal.mod-settings .checkbox-container,\n` +
				`.mod-settings .checkbox-container,\n` +
				`.vertical-tab-content .checkbox-container {\n` +
				`  background-color: var(--text-accent) !important;\n` +
				`  border-color: var(--text-accent) !important;\n` +
				`  transition: background-color 0.15s ease, border-color 0.15s ease;\n` +
				`}\n` +
				`.modal.mod-settings .checkbox-container:hover,\n` +
				`.mod-settings .checkbox-container:hover,\n` +
				`.vertical-tab-content .checkbox-container:hover {\n` +
				`  background-color: var(--interactive-accent-hover, var(--text-accent)) !important;\n` +
				`  border-color: var(--interactive-accent-hover, var(--text-accent)) !important;\n` +
				`  filter: brightness(1.12);\n` +
				`}\n` +
				`.modal.mod-settings .checkbox-container:after,\n` +
				`.modal.mod-settings .checkbox-container::after,\n` +
				`.mod-settings .checkbox-container:after,\n` +
				`.mod-settings .checkbox-container::after,\n` +
				`.vertical-tab-content .checkbox-container:after,\n` +
				`.vertical-tab-content .checkbox-container::after {\n` +
				`  transition: transform 0.15s ease-in-out, width 0.15s ease-in-out, background-color 0.15s ease-in-out;\n` +
				`}\n` +
				`.modal.mod-settings .checkbox-container:not(.is-enabled),\n` +
				`.mod-settings .checkbox-container:not(.is-enabled),\n` +
				`.vertical-tab-content .checkbox-container:not(.is-enabled) {\n` +
				`  background-color: var(--text-accent) !important;\n` +
				`  border-color: var(--text-accent) !important;\n` +
				`  --toggle-thumb-color: rgba(0, 0, 0, 0.45);\n` +
				`}\n` +
				`.modal.mod-settings .checkbox-container:not(.is-enabled):after,\n` +
				`.modal.mod-settings .checkbox-container:not(.is-enabled)::after,\n` +
				`.mod-settings .checkbox-container:not(.is-enabled):after,\n` +
				`.mod-settings .checkbox-container:not(.is-enabled):after,\n` +
				`.vertical-tab-content .checkbox-container:not(.is-enabled):after,\n` +
				`.vertical-tab-content .checkbox-container:not(.is-enabled)::after {\n` +
				`  background-color: rgba(0, 0, 0, 0.45) !important;\n` +
				`  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.35) !important;\n` +
				`}\n` +
				`.modal.mod-settings .checkbox-container.is-enabled,\n` +
				`.mod-settings .checkbox-container.is-enabled,\n` +
				`.vertical-tab-content .checkbox-container.is-enabled {\n` +
				`  background-color: var(--text-accent) !important;\n` +
				`  border-color: var(--text-accent) !important;\n` +
				`  --toggle-thumb-color: var(--text-on-accent, #ffffff);\n` +
				`}\n` +
				`.modal.mod-settings .checkbox-container.is-enabled:after,\n` +
				`.modal.mod-settings .checkbox-container.is-enabled::after,\n` +
				`.mod-settings .checkbox-container.is-enabled:after,\n` +
				`.mod-settings .checkbox-container.is-enabled:after,\n` +
				`.vertical-tab-content .checkbox-container.is-enabled:after,\n` +
				`.vertical-tab-content .checkbox-container.is-enabled::after {\n` +
				`  background-color: var(--text-on-accent, #ffffff) !important;\n` +
				`}\n`;
			}

			companionRules += buildReducedMotionBlock(animatedSelectors);
			this.cachedCompanionRules = companionRules;
		}
		const companionRules = this.cachedCompanionRules ?? '';

		// 1. Build or reuse cached variable declarations
		let fullVarsCss = this.cachedVarsCss;
		if (fullVarsCss === null) {
			// Narrow the variable block to the properties the companion rules
			// actually read, plus controls moved off stock, exactly as the saved
			// snippet does. Without this the live preview emitted every enabled
			// stock value with `!important` and overrode the user's own theme even
			// on a freshly reset design.
			const refDark = collectReferencedProperties(companionRules, '.theme-dark');
			const refLight = collectReferencedProperties(companionRules, '.theme-light');
			let darkRules = '.theme-dark {\n';
			let hasDark = false;
			for (const [varName, isEnabled] of this.darkEnabled) {
				if (!isEnabled) continue;
				const val = this.darkTokens.get(varName);
				if (val && this.isLiveTokenKept(varName, val, '.theme-dark', refDark)) {
					const emitVal = FONT_FAMILY_TOKENS.has(varName) ? previewFontFamily(val) : val;
					darkRules += `  ${varName}: ${emitVal} !important;\n`;
					hasDark = true;
				}
			}
			for (const [varName, val] of this.darkTokens) {
				if (this.darkEnabled.has(varName)) continue;
				if (!this.isLiveTokenKept(varName, val, '.theme-dark', refDark)) continue;
				if (varName.startsWith('--nav-box-')) {
					darkRules += `  ${varName}: ${val} !important;\n`;
					hasDark = true;
				} else if (varName.startsWith('--ui-')) {
					if (varName.startsWith('--ui-bg-')) {
						if (this.darkTokens.get('--ui-bg-enabled') === 'true') {
							darkRules += `  ${varName}: ${val} !important;\n`;
							hasDark = true;
						}
					} else if (varName === '--ui-master-opacity') {
						if (val !== '1.0' && val !== '1') {
							darkRules += `  ${varName}: ${val} !important;\n`;
							hasDark = true;
						}
					} else if (varName === '--ui-transition-duration') {
						if (val !== '0.25s' && val !== '0.25') {
							darkRules += `  ${varName}: ${val} !important;\n`;
							hasDark = true;
						}
					} else if (varName === '--ui-global-hover-reveal') {
						if (val === 'true') {
							darkRules += `  ${varName}: ${val} !important;\n`;
							hasDark = true;
						}
					} else {
						const elMatch = varName.match(/^--ui-([a-z0-9-]+)-(opacity|hover-reveal)$/);
						if (elMatch) {
							const elId = elMatch[1];
							const elOp = parseFloat(this.darkTokens.get(`--ui-${elId}-opacity`) ?? '1');
							if (!isNaN(elOp) && elOp < 1.0) {
								darkRules += `  ${varName}: ${val} !important;\n`;
								hasDark = true;
							}
						}
					}
				}
			}
			darkRules += '}\n\n';

			let lightRules = '.theme-light {\n';
			let hasLight = false;
			for (const [varName, isEnabled] of this.lightEnabled) {
				if (!isEnabled) continue;
				const val = this.lightTokens.get(varName);
				if (val && this.isLiveTokenKept(varName, val, '.theme-light', refLight)) {
					const emitVal = FONT_FAMILY_TOKENS.has(varName) ? previewFontFamily(val) : val;
					lightRules += `  ${varName}: ${emitVal} !important;\n`;
					hasLight = true;
				}
			}
			for (const [varName, val] of this.lightTokens) {
				if (this.lightEnabled.has(varName)) continue;
				if (!this.isLiveTokenKept(varName, val, '.theme-light', refLight)) continue;
				if (varName.startsWith('--nav-box-')) {
					lightRules += `  ${varName}: ${val} !important;\n`;
					hasLight = true;
				} else if (varName.startsWith('--ui-')) {
					if (varName.startsWith('--ui-bg-')) {
						if (this.lightTokens.get('--ui-bg-enabled') === 'true') {
							lightRules += `  ${varName}: ${val} !important;\n`;
							hasLight = true;
						}
					} else if (varName === '--ui-master-opacity') {
						if (val !== '1.0' && val !== '1') {
							lightRules += `  ${varName}: ${val} !important;\n`;
							hasLight = true;
						}
					} else if (varName === '--ui-transition-duration') {
						if (val !== '0.25s' && val !== '0.25') {
							lightRules += `  ${varName}: ${val} !important;\n`;
							hasLight = true;
						}
					} else if (varName === '--ui-global-hover-reveal') {
						if (val === 'true') {
							lightRules += `  ${varName}: ${val} !important;\n`;
							hasLight = true;
						}
					} else {
						const elMatch = varName.match(/^--ui-([a-z0-9-]+)-(opacity|hover-reveal)$/);
						if (elMatch) {
							const elId = elMatch[1];
							const elOp = parseFloat(this.lightTokens.get(`--ui-${elId}-opacity`) ?? '1');
							if (!isNaN(elOp) && elOp < 1.0) {
								lightRules += `  ${varName}: ${val} !important;\n`;
								hasLight = true;
							}
						}
					}
				}
			}
			lightRules += '}\n\n';

			const darkAccent2 = this.darkTokens.get('--text-accent-2') ?? '#a855f7';
			const lightAccent2 = this.lightTokens.get('--text-accent-2') ?? '#8b5cf6';
			const panelVars = `\n/* Plugin UI Secondary Accent Binding */\n.theme-dark .css-designer-container { --text-accent-2: ${darkAccent2}; }\n.theme-light .css-designer-container { --text-accent-2: ${lightAccent2}; }\n`;

			fullVarsCss = '/* Snippet Designer Live Variables */\n\n' + (hasDark ? darkRules : '') + (hasLight ? lightRules : '') + panelVars;
			this.cachedVarsCss = fullVarsCss;
		}

		// 2. Inject variables into all active window documents
		for (const doc of targetDocs) {
			let varsEl = doc.getElementById(LIVE_VARS_STYLE_ID) as HTMLStyleElement | null;
			if (!varsEl) {
				varsEl = doc.createElement('style');
				varsEl.id = LIVE_VARS_STYLE_ID;
				doc.head.appendChild(varsEl);
			}
			if (varsEl.textContent !== fullVarsCss) {
				varsEl.textContent = fullVarsCss;
			}
		}

		if (this.contentEl) {
			const activeAccent2 = this.getActiveTokenMap().get('--text-accent-2') ?? (this.activeMode === '.theme-dark' ? '#a855f7' : '#8b5cf6');
			this.contentEl.style.setProperty('--text-accent-2', activeAccent2);
		}

		// 4. Companion, structural, and animated rules were built above so the
		// variable block could be narrowed to the properties they read.
		if (this.cachedCompanionRules !== null) {
			for (const doc of targetDocs) {
				let compEl = doc.getElementById(LIVE_COMPANION_STYLE_ID) as HTMLStyleElement | null;
				if (!compEl) {
					compEl = doc.createElement('style');
					compEl.id = LIVE_COMPANION_STYLE_ID;
					doc.head.appendChild(compEl);
				}
				if (compEl.textContent !== companionRules) {
					compEl.textContent = companionRules;
				}
			}
		}
		// 5. Update native Desktop Translucency on Electron window only if state changed
		const isDarkGlass = this.darkTokens.get('--glass-enabled') === 'true';
		const isLightGlass = this.lightTokens.get('--glass-enabled') === 'true';
		const isLight = document.body.classList.contains('theme-light');
		const isCurrentThemeGlass = isLight ? isLightGlass : isDarkGlass;
		const isTranslucencyOn = isCurrentThemeGlass && (this.plugin.settings?.desktopTranslucency ?? true);
		const material = this.plugin.settings?.desktopMaterial ?? 'acrylic';
		if (
			this.lastTranslucencyOn !== isTranslucencyOn ||
			this.lastTranslucencyMaterial !== material ||
			this.lastTranslucencyDocsCount !== targetDocs.length ||
			this.lastTranslucencyIsLight !== isLight
		) {
			this.lastTranslucencyOn = isTranslucencyOn;
			this.lastTranslucencyMaterial = material;
			this.lastTranslucencyDocsCount = targetDocs.length;
			this.lastTranslucencyIsLight = isLight;
			applyDesktopTranslucency(isTranslucencyOn, material, targetDocs);
		}

		if (this.isCodeViewOpen) {
			this.scheduleCodePaneUpdate();
		}
	}

	public getAllTargetDocuments(): Document[] {
		if (this.cachedTargetDocs && this.cachedTargetDocs.length > 0) {
			const allValid = this.cachedTargetDocs.every((d) => d.defaultView !== null);
			if (allValid) {
				return this.cachedTargetDocs;
			}
		}

		const docs: Set<Document> = new Set();
		if (typeof window !== 'undefined' && window.document) {
			docs.add(window.document);
		}
		const popoutDoc = this.containerEl?.ownerDocument;
		if (popoutDoc) {
			docs.add(popoutDoc);
		}
		try {
			this.app.workspace.iterateAllLeaves((leaf) => {
				const d = leaf.view?.containerEl?.ownerDocument;
				if (d) docs.add(d);
			});
		} catch {
			/* Non-fatal: a leaf without a document is simply skipped. */
		}
		const res = Array.from(docs);
		this.cachedTargetDocs = res;
		return res;
	}

	public debouncedSave = debounce(async () => {
		await this.persistToDisk();
	}, 600);

	public async saveSnippetAs(snippetName: string): Promise<void> {
		const cleanName = (snippetName || DEFAULT_SNIPPET_NAME).replace(/\.css$/i, '').trim();
		this.currentSnippetName = cleanName;
		if (this.plugin.settings) {
			this.plugin.settings.lastSnippetName = cleanName;
			await this.plugin.saveSettings();
		}
		await this.persistToDisk(cleanName);
		await this.saveCurrentAsPreset(cleanName, false);
		new Notice(`Saved CSS snippet to .obsidian/snippets/${cleanName}.css and activated`);
	}

	/** Move the toggle to match `activeMode` without it reading as a user action. */
	private syncModeToggle(): void {
		if (!this.modeToggleComp) return;
		this.isSyncingModeToggle = true;
		try {
			this.modeToggleComp.setValue(this.activeMode === '.theme-dark');
		} finally {
			this.isSyncingModeToggle = false;
		}
		if (this.modeLabelEl) {
			this.modeLabelEl.setText(this.activeMode === '.theme-dark' ? '🌙 Dark Mode' : '☀️ Light Mode');
		}
	}

	/**
	 * Carry out a confirmed mode switch: the mode being left goes back to stock
	 * so its rules leave the snippet, and the designer follows Obsidian into the
	 * mode now being edited.
	 */
	private commitModeSwitch(target: '.theme-dark' | '.theme-light'): void {
		const leaving = this.activeMode;
		if (leaving === target) return;

		this.resetModeToDefaults(leaving);
		this.activeMode = target;
		changeTheme(this.app, target === '.theme-dark' ? 'obsidian' : 'moonstone');

		this.syncModeToggle();
		this.renderUI();
		this.updateLiveStyleTag();
		this.debouncedSave();
		new Notice(
			`Now editing ${target === '.theme-dark' ? 'Dark' : 'Light'} Mode - `
				+ `${leaving === '.theme-dark' ? 'Dark' : 'Light'} Mode reset to defaults`,
		);
	}

	/**
	 * Strip every applied rule so the vault falls back to the user's own theme.
	 *
	 * `resetModeToDefaults` restores the designer's stock values but leaves every
	 * control switched on. Those stock values are the plugin's idea of stock,
	 * which need not match the theme the user actually has enabled, so leaving
	 * them emitting is not a reset to their theme. Switching every control off
	 * after the reset is what guarantees nothing is emitted and the active theme
	 * shows through untouched; the toggles are meant to be re-enabled by hand.
	 */
	public resetAllToTheme(): void {
		// Both themes, not just the one on screen: the snippet carries both, so
		// resetting one alone would leave the other still overriding the theme.
		this.resetModeToDefaults('.theme-dark');
		this.resetModeToDefaults('.theme-light');
		for (const key of this.darkEnabled.keys()) this.darkEnabled.set(key, false);
		for (const key of this.lightEnabled.keys()) this.lightEnabled.set(key, false);
		this.invalidateCompanionCache();
		this.invalidateVarsCache();

		// Strip the applied CSS and persist BEFORE rebuilding the panel. Clearing
		// state and then re-rendering first meant a fault in any control's render
		// (a control that assumes an enabled state) aborted the handler before the
		// live style tags and the snippet were touched, so the old design stayed
		// applied and the file kept its old bytes - which read as "reset did
		// nothing". The panel rebuild is now best-effort and cannot strand them.
		this.updateLiveStyleTag();
		if (this.isCodeViewOpen) this.updateActiveCodeSnippet();
		this.debouncedSave();

		try {
			this.renderUI();
		} catch (err) {
			console.error('[CSS Snippet Designer] Could not refresh the panel after reset:', err);
		}
		new Notice('Reset to Obsidian defaults - reverted to your theme');
	}

	public resetModeToDefaults(mode: '.theme-dark' | '.theme-light'): void {
		const tokenMap = mode === '.theme-dark' ? this.darkTokens : this.lightTokens;
		const enabledMap = mode === '.theme-dark' ? this.darkEnabled : this.lightEnabled;
		const isDark = mode === '.theme-dark';
		for (const ctrl of STYLE_CONTROLS) {
			const defaultVal = isDark ? ctrl.defaultDarkValue : ctrl.defaultLightValue;
			tokenMap.set(ctrl.variable, defaultVal);
			enabledMap.set(ctrl.variable, true);
			if (this.engine) {
				this.engine.setToken(mode, ctrl.variable, defaultVal);
			}
		}
		// Secondary Accent must remain disabled on default reset so Obsidian stock chrome/icons are not overridden
		enabledMap.set('--text-accent-2', false);
		tokenMap.set('--h1-border-padding', '0px');
		enabledMap.set('--h1-border-padding', true);
		const defaultGradAccent = isDark ? '#d4af37' : '#2563eb';
		tokenMap.set('--header-gradient-from', defaultGradAccent);
		enabledMap.set('--header-gradient-from', true);
		tokenMap.set('--header-gradient-to', defaultGradAccent);
		enabledMap.set('--header-gradient-to', true);
		tokenMap.set('--header-gradient-3color-enabled', 'false');
		enabledMap.set('--header-gradient-3color-enabled', true);
		tokenMap.set('--header-gradient-via', defaultGradAccent);
		enabledMap.set('--header-gradient-via', true);
		tokenMap.set('--header-gradient-angle', '135deg');
		enabledMap.set('--header-gradient-angle', true);

		tokenMap.set('--header-gradient-start-pos', '0%');
		enabledMap.set('--header-gradient-start-pos', true);

		tokenMap.set('--header-gradient-end-pos', '100%');
		enabledMap.set('--header-gradient-end-pos', true);

		tokenMap.set('--header-gradient-progressive', 'false');
		enabledMap.set('--header-gradient-progressive', true);

		const resetHPositions = ['0%', '20%', '40%', '60%', '80%', '100%'];
		for (let i = 1; i <= 6; i++) {
			const pos = resetHPositions[i - 1] ?? '0%';
			tokenMap.set(`--h${i}-gradient-pos`, pos);
			enabledMap.set(`--h${i}-gradient-pos`, true);
		}

		if (this.engine) {
			this.engine.setToken(mode, '--h1-border-padding', '0px');
			this.engine.setToken(mode, '--header-gradient-enabled', 'false');
			this.engine.setToken(mode, '--header-gradient-style', 'solid');
			this.engine.setToken(mode, '--header-solid-color', defaultGradAccent);
			this.engine.setToken(mode, '--header-gradient-from', defaultGradAccent);
			this.engine.setToken(mode, '--header-gradient-to', defaultGradAccent);
			this.engine.setToken(mode, '--header-gradient-3color-enabled', 'false');
			this.engine.setToken(mode, '--header-gradient-via', defaultGradAccent);
			for (let i = 1; i <= 6; i++) {
				const pct = resetHPositions[i - 1] ?? '0%';
				this.engine.setToken(mode, `--h${i}-gradient-pos`, pct);
				this.engine.setToken(mode, `--h${i}-gradient-color`, 'currentColor');
				this.engine.setToken(mode, `--h${i}-gradient-bg`, 'none');
				this.engine.setToken(mode, `--h${i}-color`, 'currentColor');
			}
		}

		this.seedHeaderGradientDefaults(mode);
		this.updateHeaderGradientTokens();
		this.seedNavBoxDefaults(mode);
		this.seedNavBoxEngineDefaults(mode);
		this.updateNavBoxTokens();

		for (const el of SHADOW_ELEMENTS) {
			this.seedShadowElementDefaults(el, mode);
			if (this.engine) {
				this.engine.setToken(mode, `--sh-${el.id}-enabled`, 'false');
				this.engine.setToken(mode, `--sh-${el.id}-mode`, el.defaultMode);
				this.engine.setToken(mode, `--sh-${el.id}-x`, el.defaultX);
				this.engine.setToken(mode, `--sh-${el.id}-y`, el.defaultY);
				this.engine.setToken(mode, `--sh-${el.id}-blur`, el.defaultBlur);
				this.engine.setToken(mode, `--sh-${el.id}-spread`, el.defaultSpread);
				this.engine.setToken(mode, `--sh-${el.id}-color`, isDark ? el.defaultColorDark : el.defaultColorLight);
				this.engine.setToken(mode, `--sh-${el.id}-opacity`, isDark ? el.defaultOpacityDark : el.defaultOpacityLight);
				this.engine.setToken(mode, `--sh-${el.id}-outline-enabled`, 'false');
				this.engine.setToken(mode, `--sh-${el.id}-outline-width`, el.defaultOutlineWidth ?? '2px');
				this.engine.setToken(mode, `--sh-${el.id}-outline-color`, isDark ? (el.defaultOutlineColorDark ?? '#7c3aed') : (el.defaultOutlineColorLight ?? '#6d28d9'));
				this.engine.setToken(mode, `--sh-${el.id}-anim-style`, el.defaultAnimStyle ?? 'none');
				this.engine.setToken(mode, `--sh-${el.id}-anim-speed`, el.defaultAnimSpeed ?? '2.5s');
				this.engine.setToken(mode, `--sh-${el.id}-anim-area`, el.defaultAnimArea ?? '35%');
				this.engine.setToken(mode, `--sh-${el.id}-gradient-enabled`, el.defaultGradientEnabled ? 'true' : 'false');
				this.engine.setToken(mode, `--sh-${el.id}-gradient-color`, isDark ? (el.defaultGradientColorDark ?? '#ec4899') : (el.defaultGradientColorLight ?? '#db2777'));
				this.engine.setToken(mode, `--sh-${el.id}-gradient-anim`, el.defaultGradientAnim ? 'true' : 'false');
				this.engine.setToken(mode, `--sh-${el.id}-outline-gradient-enabled`, el.defaultOutlineGradientEnabled ? 'true' : 'false');
				this.engine.setToken(mode, `--sh-${el.id}-outline-gradient-color`, isDark ? (el.defaultOutlineGradientColorDark ?? '#ec4899') : (el.defaultOutlineGradientColorLight ?? '#db2777'));
			}
		}

		tokenMap.set('--glass-enabled', 'false');
		tokenMap.set('--glass-opacity', isDark ? '0.75' : '0.80');
		tokenMap.set('--glass-blur', '48px');
		tokenMap.set('--glass-tint-enabled', 'false');
		tokenMap.set('--glass-tint-color', '#7c3aed');
		tokenMap.set('--tab-curve', '6px');
		enabledMap.set('--glass-enabled', true);
		enabledMap.set('--glass-opacity', true);
		enabledMap.set('--glass-blur', true);
		enabledMap.set('--glass-tint-enabled', true);
		enabledMap.set('--glass-tint-color', true);
		enabledMap.set('--tab-curve', true);

		if (this.engine) {
			this.engine.setToken(mode, '--glass-enabled', 'false');
			this.engine.setToken(mode, '--glass-opacity', isDark ? '0.75' : '0.80');
			this.engine.setToken(mode, '--glass-blur', '48px');
			this.engine.setToken(mode, '--glass-tint-enabled', 'false');
			this.engine.setToken(mode, '--glass-tint-color', '#7c3aed');
			this.engine.setToken(mode, '--tab-curve', '6px');
		}

		this.seedUIElementDefaults(mode);
		// The animated flipbook is gated on its own tokens, not on the base
		// background, so clearing `--ui-bg-enabled` alone leaves the
		// `--css-bg-flip` animation running after a reset. Switch the section's
		// master toggle off too, or reset leaves "Animated Backgrounds" on.
		tokenMap.set('--ui-bg-flipbook', 'none');
		enabledMap.set('--ui-bg-flipbook', true);
		tokenMap.set('--ui-bg-flipbook-enabled', 'false');
		enabledMap.set('--ui-bg-flipbook-enabled', true);
		if (this.engine) {
			this.engine.setToken(mode, '--ui-bg-flipbook', 'none');
			this.engine.setToken(mode, '--ui-bg-flipbook-enabled', 'false');
			this.engine.setToken(mode, '--ui-master-opacity', '1.0');
			this.engine.setToken(mode, '--ui-transition-duration', '0.25s');
			for (const el of UI_ELEMENTS) {
				this.engine.setToken(mode, `--ui-${el.id}-opacity`, isDark ? el.defaultOpacityDark : el.defaultOpacityLight);
			}
			this.engine.setToken(mode, '--ui-bg-enabled', 'false');
		}

		for (const doc of this.getAllTargetDocuments()) {
			// Only if this plugin added it; the class is Obsidian's own.
			if (doc.body.dataset.cssDesignerOwnsTranslucent === 'true') {
				doc.body.classList.remove('is-translucent');
				delete doc.body.dataset.cssDesignerOwnsTranslucent;
			}
			doc.getElementById('css-snippet-designer-translucency-fix')?.remove();
			doc.documentElement.style.removeProperty('--glass-blur');
			doc.documentElement.style.removeProperty('--tab-curve');
			doc.documentElement.style.removeProperty('--glass-opacity');
			doc.documentElement.style.removeProperty('--glass-tint-enabled');
			doc.documentElement.style.removeProperty('--glass-tint-color');
		}

		this.lastTranslucencyOn = null;
		this.lastTranslucencyMaterial = null;
		this.lastTranslucencyDocsCount = 0;
		this.lastTranslucencyIsLight = null;
		this.invalidateCompanionCache();
		this.invalidateVarsCache();
	}

	public applyPreset(preset: CuratedPreset | UserSavedPreset): void {
		const targetTheme = (preset as CuratedPreset).targetTheme;
		const category = (preset as CuratedPreset).category;
		// A preset for the other mode moves the designer there, which is a mode
		// switch like any other: the mode being left goes back to stock so the
		// snippet keeps carrying one mode's CSS. Applying a preset already warns
		// that it replaces the current controls.
		const previousMode = this.activeMode;

		if (targetTheme === 'moonstone' || category === 'light') {
			if (this.activeMode !== '.theme-light') {
				this.activeMode = '.theme-light';
				changeTheme(this.app, 'moonstone');
			}
		} else if (targetTheme === 'obsidian' || category === 'dark') {
			if (this.activeMode !== '.theme-dark') {
				this.activeMode = '.theme-dark';
				changeTheme(this.app, 'obsidian');
			}
		}

		if (previousMode !== this.activeMode) {
			this.resetModeToDefaults(previousMode);
			this.syncModeToggle();
		}

		// Reset active mode to clean defaults first so stale customizations don't bleed through
		this.resetModeToDefaults(this.activeMode);

		const userSaved = preset as UserSavedPreset;

		// Apply dark tokens if present
		if (preset.darkTokens) {
			for (const [k, v] of Object.entries(preset.darkTokens)) {
				this.darkTokens.set(k, v);
				const isEnabled = userSaved.darkEnabled ? (userSaved.darkEnabled[k] ?? true) : true;
				this.darkEnabled.set(k, isEnabled);
				if (this.engine) this.engine.setToken('.theme-dark', k, v);
			}
		}

		// Apply light tokens if present
		if (preset.lightTokens) {
			for (const [k, v] of Object.entries(preset.lightTokens)) {
				this.lightTokens.set(k, v);
				const isEnabled = userSaved.lightEnabled ? (userSaved.lightEnabled[k] ?? true) : true;
				this.lightEnabled.set(k, isEnabled);
				if (this.engine) this.engine.setToken('.theme-light', k, v);
			}
		}

		// Ensure --text-accent-2 falls back to the preset's --text-accent if not explicitly defined
		if (preset.darkTokens && !preset.darkTokens['--text-accent-2'] && preset.darkTokens['--text-accent']) {
			this.darkTokens.set('--text-accent-2', preset.darkTokens['--text-accent']);
			this.darkEnabled.set('--text-accent-2', true);
			if (this.engine) this.engine.setToken('.theme-dark', '--text-accent-2', preset.darkTokens['--text-accent']);
		}
		if (preset.lightTokens && !preset.lightTokens['--text-accent-2'] && preset.lightTokens['--text-accent']) {
			this.lightTokens.set('--text-accent-2', preset.lightTokens['--text-accent']);
			this.lightEnabled.set('--text-accent-2', true);
			if (this.engine) this.engine.setToken('.theme-light', '--text-accent-2', preset.lightTokens['--text-accent']);
		}

		// A palette that names only the focused frame colour would grey out on blur,
		// because Obsidian falls back to its own --titlebar-background there. Mirror
		// the focused colour so the frame is one colour in both states.
		if (preset.darkTokens && !preset.darkTokens['--titlebar-background'] && preset.darkTokens['--titlebar-background-focused']) {
			this.darkTokens.set('--titlebar-background', preset.darkTokens['--titlebar-background-focused']);
			this.darkEnabled.set('--titlebar-background', true);
			if (this.engine) this.engine.setToken('.theme-dark', '--titlebar-background', preset.darkTokens['--titlebar-background-focused']);
		}
		if (preset.lightTokens && !preset.lightTokens['--titlebar-background'] && preset.lightTokens['--titlebar-background-focused']) {
			this.lightTokens.set('--titlebar-background', preset.lightTokens['--titlebar-background-focused']);
			this.lightEnabled.set('--titlebar-background', true);
			if (this.engine) this.engine.setToken('.theme-light', '--titlebar-background', preset.lightTokens['--titlebar-background-focused']);
		}

		// Ensure --search-bar-background falls back to the preset's --background-secondary if not explicitly defined
		if (preset.darkTokens && !preset.darkTokens['--search-bar-background'] && preset.darkTokens['--background-secondary']) {
			this.darkTokens.set('--search-bar-background', preset.darkTokens['--background-secondary']);
			this.darkEnabled.set('--search-bar-background', true);
			if (this.engine) this.engine.setToken('.theme-dark', '--search-bar-background', preset.darkTokens['--background-secondary']);
		}
		if (preset.lightTokens && !preset.lightTokens['--search-bar-background'] && preset.lightTokens['--background-secondary']) {
			this.lightTokens.set('--search-bar-background', preset.lightTokens['--background-secondary']);
			this.lightEnabled.set('--search-bar-background', true);
			if (this.engine) this.engine.setToken('.theme-light', '--search-bar-background', preset.lightTokens['--background-secondary']);
		}

		// A curated theme carries its canvas backdrop as a design decision rather
		// than nine raw tokens, so it is expanded here. It lands on the mode the
		// preset just switched to, which is the only mode its palette describes.
		//
		// A user-saved preset returns `undefined`: it captured its own `--ui-bg-*`
		// tokens (including `--ui-bg-enabled`), so re-stating or clearing the
		// background here would fight the token pass above. Only a curated theme
		// gets a backdrop expansion or an explicit switch-off.
		const backdrop = presetBackdrop(preset);
		if (backdrop !== undefined) {
			const isLightMode = this.activeMode === '.theme-light';
			const modeTokens = isLightMode ? this.lightTokens : this.darkTokens;
			const modeEnabled = isLightMode ? this.lightEnabled : this.darkEnabled;
			if (backdrop) {
				for (const [k, v] of Object.entries(backgroundTokens(backdrop))) {
					modeTokens.set(k, v);
					modeEnabled.set(k, true);
					if (this.engine) this.engine.setToken(this.activeMode, k, v);
				}
			} else {
				modeTokens.set('--ui-bg-enabled', 'false');
				modeEnabled.set('--ui-bg-enabled', true);
				if (this.engine) this.engine.setToken(this.activeMode, '--ui-bg-enabled', 'false');
			}
		}

		// Harmonize nav-box tokens so presets never inherit stale purple gradients
		// or mismatched outline colors from default resets.
		const isLightMode = this.activeMode === '.theme-light';
		const modeTokens = isLightMode ? this.lightTokens : this.darkTokens;
		const modeEnabled = isLightMode ? this.lightEnabled : this.darkEnabled;
		const activePresetTokens = isLightMode ? preset.lightTokens : preset.darkTokens;

		if (activePresetTokens) {
			const isNavBoxEnabled = modeTokens.get('--nav-box-enabled') === 'true';
			if (isNavBoxEnabled) {
				if (!activePresetTokens['--nav-box-body-style'] && !activePresetTokens['--nav-box-gradient-enabled']) {
					modeTokens.set('--nav-box-body-style', 'solid');
					modeTokens.set('--nav-box-gradient-enabled', 'false');
					modeEnabled.set('--nav-box-body-style', true);
					modeEnabled.set('--nav-box-gradient-enabled', true);
					if (this.engine) {
						this.engine.setToken(this.activeMode, '--nav-box-body-style', 'solid');
						this.engine.setToken(this.activeMode, '--nav-box-gradient-enabled', 'false');
					}
				}
				if (!activePresetTokens['--nav-box-outline-style']) {
					modeTokens.set('--nav-box-outline-style', 'solid');
					modeEnabled.set('--nav-box-outline-style', true);
					if (this.engine) this.engine.setToken(this.activeMode, '--nav-box-outline-style', 'solid');
				}
				if (!activePresetTokens['--nav-box-border-color']) {
					const fallbackBorder = modeTokens.get('--background-modifier-border') ?? (isLightMode ? '#e0e0e0' : '#333333');
					modeTokens.set('--nav-box-border-color', fallbackBorder);
					modeEnabled.set('--nav-box-border-color', true);
					if (this.engine) this.engine.setToken(this.activeMode, '--nav-box-border-color', fallbackBorder);
				}
				if (!activePresetTokens['--nav-box-bg']) {
					const fallbackBg = modeTokens.get('--background-secondary') ?? (isLightMode ? '#f4f4f5' : '#1e1e2e');
					modeTokens.set('--nav-box-bg', fallbackBg);
					modeEnabled.set('--nav-box-bg', true);
					if (this.engine) this.engine.setToken(this.activeMode, '--nav-box-bg', fallbackBg);
				}
			}

			// Harmonize header gradient tokens so presets never inherit stale purple/pink gradients
			const isHeaderGradEnabled = modeTokens.get('--header-gradient-enabled') === 'true';
			if (isHeaderGradEnabled) {
				if (!activePresetTokens['--header-gradient-from']) {
					const fallbackFrom = modeTokens.get('--text-accent') ?? (isLightMode ? '#2563eb' : '#d4af37');
					modeTokens.set('--header-gradient-from', fallbackFrom);
					modeEnabled.set('--header-gradient-from', true);
					if (this.engine) this.engine.setToken(this.activeMode, '--header-gradient-from', fallbackFrom);
				}
				if (!activePresetTokens['--header-gradient-to']) {
					const fallbackTo = modeTokens.get('--text-accent-2') ?? modeTokens.get('--header-gradient-from') ?? (isLightMode ? '#1d4ed8' : '#aa7c11');
					modeTokens.set('--header-gradient-to', fallbackTo);
					modeEnabled.set('--header-gradient-to', true);
					if (this.engine) this.engine.setToken(this.activeMode, '--header-gradient-to', fallbackTo);
				}
				if (!activePresetTokens['--header-solid-color']) {
					const fallbackSolid = modeTokens.get('--header-gradient-from') ?? modeTokens.get('--text-accent') ?? (isLightMode ? '#2563eb' : '#d4af37');
					modeTokens.set('--header-solid-color', fallbackSolid);
					modeEnabled.set('--header-solid-color', true);
					if (this.engine) this.engine.setToken(this.activeMode, '--header-solid-color', fallbackSolid);
				}
			}
		}

		this.updateHeaderGradientTokens();
		this.updateNavBoxTokens();
		this.invalidateCompanionCache();
		this.invalidateVarsCache();
		this.renderUI(false);
		this.updateLiveStyleTag();
		this.debouncedSave();
		new Notice(`Applied preset: ${preset.name}`);
	}

	public async saveCurrentAsPreset(name: string, showNotice: boolean = true): Promise<void> {
		const clean = name.trim();
		if (!clean) return;

		const darkTokensObj: Record<string, string> = {};
		this.darkTokens.forEach((v, k) => {
			darkTokensObj[k] = v;
		});

		const lightTokensObj: Record<string, string> = {};
		this.lightTokens.forEach((v, k) => {
			lightTokensObj[k] = v;
		});

		const darkEnabledObj: Record<string, boolean> = {};
		this.darkEnabled.forEach((v, k) => {
			darkEnabledObj[k] = v;
		});

		const lightEnabledObj: Record<string, boolean> = {};
		this.lightEnabled.forEach((v, k) => {
			lightEnabledObj[k] = v;
		});

		const isDark = this.activeMode === '.theme-dark';
		const activeMap = isDark ? this.darkTokens : this.lightTokens;
		// Primary Background, Secondary Background, Accent Color, Secondary
		// Accent Color - the same four slots every preset card previews.
		const previewColors = presetPaletteColors(activeMap, isDark);

		const newPreset: UserSavedPreset = {
			id: `user-preset-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
			name: clean,
			savedAt: Date.now(),
			snippetFileName: `${clean}.css`,
			darkTokens: darkTokensObj,
			lightTokens: lightTokensObj,
			darkEnabled: darkEnabledObj,
			lightEnabled: lightEnabledObj,
			previewColors,
		};

		if (!this.plugin.settings) return;
		if (!Array.isArray(this.plugin.settings.savedPresets)) {
			this.plugin.settings.savedPresets = [];
		}

		const filtered = this.plugin.settings.savedPresets.filter(
			(p) => p.name.toLowerCase() !== clean.toLowerCase()
		);
		this.plugin.settings.savedPresets = [newPreset, ...filtered];
		await this.plugin.saveSettings();

		if (this.activeTab === 'presets') {
			this.renderUI(false);
		}
		if (showNotice) {
			new Notice(`Saved preset "${clean}" to Presets list`);
		}
	}

	public async deleteUserPreset(presetId: string): Promise<void> {
		if (!this.plugin.settings) return;
		const target = (this.plugin.settings.savedPresets || []).find((p) => p.id === presetId);
		this.plugin.settings.savedPresets = (this.plugin.settings.savedPresets || []).filter(
			(p) => p.id !== presetId
		);
		await this.plugin.saveSettings();
		this.renderUI(false);
		new Notice(`Deleted preset "${target?.name || 'preset'}"`);
	}

	/**
	 * Overwrites a curated preset's name, description, and colors with the
	 * designer's current live state, saved as a per-id override rather than
	 * rewriting `presets.ts` itself (that's source code, not user data - it
	 * can't be safely edited from a running plugin, and any change would be
	 * lost the moment the plugin updates). `preset` is the already-merged
	 * (base + prior override) preset the card is showing, so re-overwriting
	 * an already-customized preset starts from its current displayed name
	 * and description rather than the original.
	 */
	public async overwriteCuratedPreset(preset: CuratedPreset, name: string, description: string): Promise<void> {
		if (!this.plugin.settings) return;
		const clean = name.trim() || preset.name;
		const cleanDesc = description.trim();

		const darkTokensObj: Record<string, string> = {};
		this.darkTokens.forEach((v, k) => {
			darkTokensObj[k] = v;
		});
		const lightTokensObj: Record<string, string> = {};
		this.lightTokens.forEach((v, k) => {
			lightTokensObj[k] = v;
		});

		// Capture the token map for the mode this preset actually describes, not
		// whichever mode the user happens to be viewing: a dark preset is saved
		// from the dark state and re-applied in dark mode, so its preview and
		// backdrop must come from the same map.
		const isLightPreset = preset.category === 'light';
		const presetMap = isLightPreset ? this.lightTokens : this.darkTokens;

		const override: CuratedPresetOverride = {
			name: clean,
			description: cleanDesc || preset.description,
			previewColors: presetPaletteColors(presetMap, !isLightPreset),
			// Save the background as it looks now so the base preset's backdrop
			// is not re-applied over the captured `--ui-bg-*` tokens (which is
			// what made an overwrite snap back to the old pattern/colors).
			background: presetBackgroundFromTokens(presetMap),
		};
		// Only capture the token map(s) this preset actually carries - a
		// dark-category preset never defined lightTokens, and overwriting it
		// shouldn't invent a light half it never had.
		if (preset.darkTokens) override.darkTokens = darkTokensObj;
		if (preset.lightTokens) override.lightTokens = lightTokensObj;

		this.plugin.settings.curatedPresetOverrides = {
			...(this.plugin.settings.curatedPresetOverrides ?? {}),
			[preset.id]: override,
		};
		await this.plugin.saveSettings();
		if (this.activeTab === 'presets') {
			this.renderUI(false);
		}
		new Notice(`Overwrote preset "${clean}" with your current styling`);
	}

	/** Removes a curated preset from the Presets tab without touching the others. */
	public async deleteCuratedPreset(preset: CuratedPreset): Promise<void> {
		if (!this.plugin.settings) return;
		const existing = this.plugin.settings.deletedCuratedPresetIds ?? [];
		if (!existing.includes(preset.id)) {
			this.plugin.settings.deletedCuratedPresetIds = [...existing, preset.id];
			await this.plugin.saveSettings();
		}
		if (this.activeTab === 'presets') {
			this.renderUI(false);
		}
		new Notice(`Removed preset "${preset.name}"`);
	}

	/** Undoes every override/deletion for one curated category (dark or light). */
	public async restoreCuratedPresets(category: 'dark' | 'light'): Promise<void> {
		if (!this.plugin.settings) return;
		const base = category === 'dark' ? CURATED_DARK_PRESETS : CURATED_LIGHT_PRESETS;
		const ids = new Set(base.map((p) => p.id));

		const overrides = { ...(this.plugin.settings.curatedPresetOverrides ?? {}) };
		for (const id of Object.keys(overrides)) {
			if (ids.has(id)) delete overrides[id];
		}
		this.plugin.settings.curatedPresetOverrides = overrides;
		this.plugin.settings.deletedCuratedPresetIds = (this.plugin.settings.deletedCuratedPresetIds ?? []).filter(
			(id) => !ids.has(id)
		);
		await this.plugin.saveSettings();
		if (this.activeTab === 'presets') {
			this.renderUI(false);
		}
		new Notice(`Restored official ${category} presets`);
	}

	public async persistToDisk(targetName?: string): Promise<void> {
		const cleanName = (targetName || this.currentSnippetName || DEFAULT_SNIPPET_NAME)
			.replace(/\.css$/i, '')
			.trim();
		try {
			const generated = buildGeneratedCss(this);

			// A structural problem here means a generator bug. Surface it loudly,
			// but still write, so the user never loses work to a failed save.
			const validation = validateCss(generated);
			if (!validation.ok) {
				console.error(
					`[CSS Snippet Designer] Generated CSS is malformed:\n${formatIssues(validation.issues)}`,
				);
				new Notice('Generated CSS has structural problems - see the developer console.');
			}

			const snippetsFolder = this.getSnippetsFolder();
			if (!(await this.app.vault.adapter.exists(snippetsFolder))) {
				await this.app.vault.adapter.mkdir(snippetsFolder);
			}

			// Read first so anything the user hand-wrote outside the fences survives.
			const snippetPath = this.getSnippetOutputPath(cleanName);
			const existing = (await this.app.vault.adapter.exists(snippetPath))
				? await this.app.vault.adapter.read(snippetPath)
				: null;
			await this.app.vault.adapter.write(snippetPath, mergeIntoExisting(existing, generated));

			// Keep the editor's own copy in step with the file so a deactivated
			// plugin can restore the design even if the snippet never loaded.
			this.persistTokenState();

			const refreshed = await reloadAndEnableSnippet(this.app, cleanName);
			this.updateStatus(
				refreshed
					? `Persisted to ${snippetPath} at ${new Date().toLocaleTimeString()}`
					: `Saved ${snippetPath} - enable it under Appearance > CSS snippets`,
			);
		} catch (err) {
			console.error(`Failed to write ${cleanName}.css:`, err);
			this.updateStatus('Error saving snippet to disk');
		}
	}

	/**
	 * Bring the snippet on disk in line with the restored state.
	 *
	 * The file is this editor's backing document: if a generator changed shape
	 * since it was last written, the live preview and the saved CSS would fight
	 * until the next edit. Rewrite the fenced block only when the regenerated
	 * output actually differs, so opening the designer is not a write every time.
	 */
	public async reconcileSnippetWithState(): Promise<void> {
		const cleanName = (this.currentSnippetName || DEFAULT_SNIPPET_NAME).replace(/\.css$/i, '');
		const snippetPath = this.getSnippetOutputPath(cleanName);
		try {
			const existing = (await this.app.vault.adapter.exists(snippetPath))
				? await this.app.vault.adapter.read(snippetPath)
				: null;
			const desired = mergeIntoExisting(existing, buildGeneratedCss(this));
			if (desired !== existing) {
				await this.persistToDisk();
			}
		} catch (err) {
			console.warn(`[CSS Snippet Designer] Could not reconcile ${cleanName}.css:`, err);
		}
	}

	/**
	 * Mirror the live token state into plugin settings.
	 *
	 * The snippet is what ships, but it is also the only place the design lived,
	 * so a snippet that failed to write - or that Obsidian refused to reload -
	 * silently threw the user's typography away the moment the plugin was turned
	 * off. Keeping a copy in `data.json` means the editor can always restore its
	 * own last state and rewrite the snippet to match.
	 */
	public persistTokenState(): void {
		if (!this.plugin?.settings) return;
		const toObject = <T>(map: Map<string, T>): Record<string, T> => {
			const out: Record<string, T> = {};
			for (const [key, value] of map) out[key] = value;
			return out;
		};
		this.plugin.settings.tokenState = {
			dark: toObject(this.darkTokens),
			light: toObject(this.lightTokens),
			darkEnabled: toObject(this.darkEnabled),
			lightEnabled: toObject(this.lightEnabled),
		};
		// Fire-and-forget: `saveData` serialises the whole settings object, and
		// callers are already debounced, so awaiting it here would only stall the
		// control's frame.
		void this.plugin.saveData(this.plugin.settings);
	}

	/** Re-apply the token state saved by {@link persistTokenState}, if any. */
	public applyPersistedTokenState(): void {
		const saved: PersistedTokenState | undefined = this.plugin?.settings?.tokenState;
		if (!saved) return;
		const restore = (
			tokens: Map<string, string>,
			enabled: Map<string, boolean>,
			values: Record<string, string>,
			flags: Record<string, boolean>,
			scope: '.theme-dark' | '.theme-light',
		): void => {
			for (const [key, value] of Object.entries(values)) {
				tokens.set(key, value);
				if (this.engine) this.engine.setToken(scope, key, value);
			}
			for (const [key, value] of Object.entries(flags)) {
				enabled.set(key, value);
			}
		};
		restore(this.darkTokens, this.darkEnabled, saved.dark, saved.darkEnabled, '.theme-dark');
		restore(this.lightTokens, this.lightEnabled, saved.light, saved.lightEnabled, '.theme-light');
		for (const ctrl of STYLE_CONTROLS) {
			if (!this.darkEnabled.has(ctrl.variable)) this.darkEnabled.set(ctrl.variable, true);
			if (!this.lightEnabled.has(ctrl.variable)) this.lightEnabled.set(ctrl.variable, true);
		}
	}

	public updateStatus(text: string): void {
		if (this.statusEl) {
			this.statusEl.setText(text);
		}
	}

	async onClose(): Promise<void> {
		// Drop any queued debounced save before flushing explicitly below, so a
		// save scheduled moments before close cannot fire after teardown and write
		// the snippet a second time.
		this.debouncedSave.cancel();

		if (this.liveUpdateRafId !== null) {
			cancelAnimationFrame(this.liveUpdateRafId);
			this.liveUpdateRafId = null;
		}

		if (this.codePaneUpdateTimer !== null) {
			window.clearTimeout(this.codePaneUpdateTimer);
			this.codePaneUpdateTimer = null;
		}

		// Flush any pending changes to disk before disposing the engine
		try {
			await this.persistToDisk();
		} catch (err) {
			console.warn('[CSS Snippet Designer] Could not flush persistToDisk on close:', err);
		}

		// Leave the generated CSS applied. The design is not the editor's private
		// preview: it is the user's styling, and it has to survive closing the
		// view (or disabling the plugin) exactly like the snippet does. Tearing
		// these down here is what made the whole app snap back to stock the
		// moment the designer was dismissed. Only the transient preview keyframes
		// belong to the editor and are safe to drop.
		for (const doc of this.getAllTargetDocuments()) {
			doc.querySelectorAll('style[id^="css-designer-preview-kf-"]').forEach((s) => s.remove());
		}

		if (this.engine) {
			this.engine.dispose();
			this.engine = null;
		}
	}
}

export { CssDesignerPopoutView as CssDesignerItemView };
