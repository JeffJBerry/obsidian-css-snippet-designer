import { test } from 'node:test';
import assert from 'node:assert/strict';
import { UI_ELEMENTS, STYLE_CONTROLS } from '../src/schema';
import { generateUIElementCss, generateCustomBackgroundCss, type ThemeTokenState } from '../src/css/ui-elements';
import { generateGlassCss } from '../src/css/glass';
import { buildGeneratedCss } from '../src/snippet/persist';
import { validateCss, formatIssues } from '../src/engine';

function makeState(overrides: Record<string, string> = {}): ThemeTokenState {
	const darkTokens = new Map<string, string>();
	const lightTokens = new Map<string, string>();
	const darkEnabled = new Map<string, boolean>();
	const lightEnabled = new Map<string, boolean>();

	for (const el of UI_ELEMENTS) {
		darkTokens.set(`--ui-${el.id}-opacity`, el.defaultOpacityDark);
		lightTokens.set(`--ui-${el.id}-opacity`, el.defaultOpacityLight);
		darkTokens.set(`--ui-${el.id}-hover-reveal`, el.supportsHoverReveal ? 'true' : 'false');
		lightTokens.set(`--ui-${el.id}-hover-reveal`, el.supportsHoverReveal ? 'true' : 'false');
	}

	for (const [k, v] of Object.entries(overrides)) {
		darkTokens.set(k, v);
		lightTokens.set(k, v);
	}

	return { darkTokens, lightTokens, darkEnabled, lightEnabled };
}

function assertValid(css: string, label: string): void {
	const result = validateCss(css);
	assert.ok(result.ok, `${label} produced malformed CSS:\n${formatIssues(result.issues)}`);
}

test('all 23 UI elements generate valid CSS at 0% opacity (Zen Mode)', () => {
	assert.equal(UI_ELEMENTS.length, 23, 'Must have exactly 23 UI elements configured');
	for (const el of UI_ELEMENTS) {
		const state = makeState({ [`--ui-${el.id}-opacity`]: '0' });
		const css = generateUIElementCss('.theme-dark', state);
		assertValid(css, `UI element ${el.id} at 0% opacity`);
		assert.ok(css.length > 0, `Expected CSS for element ${el.id} at 0% opacity`);
	}
});

test('all 23 UI elements generate valid CSS at 50% opacity (Ghost Mode)', () => {
	for (const el of UI_ELEMENTS) {
		const state = makeState({ [`--ui-${el.id}-opacity`]: '0.5' });
		const css = generateUIElementCss('.theme-dark', state);
		assertValid(css, `UI element ${el.id} at 50% opacity`);
		assert.ok(css.length > 0, `Expected CSS for element ${el.id} at 50% opacity`);
	}
});

test('border elements isolate border transparency without setting opacity on child elements or icons', () => {
	const borderElements = UI_ELEMENTS.filter((el) => el.kind === 'border');
	assert.ok(borderElements.length >= 4, 'Must have at least 4 border elements');

	// Test tab-outlines at 0%
	const tabState = makeState({ '--ui-tab-outlines-opacity': '0' });
	const tabCss = generateUIElementCss('.theme-dark', tabState);
	assertValid(tabCss, 'tab-outlines 0%');
	assert.ok(tabCss.includes('--tab-outline-color: transparent !important;'), 'tab-outlines 0% clears tab-outline-color');
	assert.ok(tabCss.includes('box-shadow: 0 0 0 calc(var(--tab-curve, 6px) * 4) var(--tab-background-active) !important;'), 'tab-outlines 0% removes tab outline box-shadow');

	// Test sidebar-borders at 50%
	const sideState = makeState({ '--ui-sidebar-borders-opacity': '0.5' });
	const sideCss = generateUIElementCss('.theme-dark', sideState);
	assertValid(sideCss, 'sidebar-borders 50%');
	assert.ok(sideCss.includes('color-mix(in srgb, var(--background-modifier-border, #333) 50%, transparent)'), 'sidebar-borders uses color-mix');

	// Test property-borders at 0%
	const propState = makeState({ '--ui-property-borders-opacity': '0' });
	const propCss = generateUIElementCss('.theme-dark', propState);
	assertValid(propCss, 'property-borders 0%');
	assert.ok(propCss.includes('border-color: transparent !important;'), 'property-borders 0% clears border-color');
});

test('at full 1.0 opacity, no redundant override rules are emitted', () => {
	const state = makeState();
	const css = generateUIElementCss('.theme-dark', state);
	assert.equal(css, '', 'Expected no override CSS when all elements are at full 1.0 opacity');

	// Also when explicitly set to "1" or "1.0"
	const stateWithOne = makeState({ '--ui-status-bar-opacity': '1' });
	assert.equal(generateUIElementCss('.theme-dark', stateWithOne), '');
});

test('scrollbars at 0% without hover reveal emit display:none and scrollbar-width:none', () => {
	const state = makeState({
		'--ui-scrollbars-opacity': '0',
		'--ui-scrollbars-hover-reveal': 'false',
	});
	const css = generateUIElementCss('.theme-dark', state);
	assertValid(css, 'scrollbars 0% without hover');
	assert.ok(css.includes('display: none !important;'), 'Must hide scrollbars');
	assert.ok(css.includes('scrollbar-width: none !important;'), 'Must set scrollbar-width: none');
});

test('scrollbars at 0% with hover reveal clear background and reveal on hover', () => {
	const state = makeState({
		'--ui-scrollbars-opacity': '0',
		'--ui-scrollbars-hover-reveal': 'true',
	});
	const css = generateUIElementCss('.theme-dark', state);
	assertValid(css, 'scrollbars 0% with hover reveal');
	assert.ok(css.includes('background-color: transparent !important;'), 'Thumb should be transparent at rest');
	assert.ok(css.includes('*:hover::-webkit-scrollbar-thumb'), 'Must reveal on hover');
});

test('scrollbars at partial opacity use color-mix for smooth translucency', () => {
	const state = makeState({
		'--ui-scrollbars-opacity': '0.35',
	});
	const css = generateUIElementCss('.theme-dark', state);
	assertValid(css, 'scrollbars partial opacity');
	assert.ok(css.includes('color-mix(in srgb, var(--scrollbar-thumb-bg'), 'Must use color-mix on thumb');
	assert.ok(css.includes('35%'), 'Must use 35% in color-mix');
});

test('fold indicators selector covers CodeMirror 6 and tree collapse icons', () => {
	const foldEl = UI_ELEMENTS.find((el) => el.id === 'fold-indicators');
	assert.ok(foldEl, 'fold-indicators element must exist');
	assert.ok(foldEl.selector.includes('.cm-foldGutter'), 'Must cover .cm-foldGutter');
	assert.ok(foldEl.selector.includes('.cm-gutter-fold'), 'Must cover .cm-gutter-fold');
	assert.ok(foldEl.selector.includes('.heading-collapse-indicator'), 'Must cover heading collapse indicator');
	assert.ok(foldEl.selector.includes('.tree-item-icon.collapse-icon'), 'Must cover file tree collapse icon');
});

test('resize-handles selector covers Obsidian split dividers', () => {
	const resizeEl = UI_ELEMENTS.find((el) => el.id === 'resize-handles');
	assert.ok(resizeEl, 'resize-handles element must exist');
	assert.ok(resizeEl.selector.includes('.workspace-leaf-resize-handle'), 'Must cover .workspace-leaf-resize-handle');
	assert.ok(resizeEl.selector.includes('.workspace-split.mod-vertical > hr'), 'Must cover .workspace-split.mod-vertical > hr');
	assert.ok(resizeEl.selector.includes('.workspace-split.mod-horizontal > hr'), 'Must cover .workspace-split.mod-horizontal > hr');
});

test('nav-action-buttons hover reveal covers parent headers', () => {
	const state = makeState({
		'--ui-nav-action-buttons-opacity': '0',
		'--ui-nav-action-buttons-hover-reveal': 'true',
	});
	const css = generateUIElementCss('.theme-dark', state);
	assertValid(css, 'nav-action-buttons hover reveal');
	assert.ok(css.includes('.nav-header:hover .nav-buttons-container'), 'Must reveal when hovering nav-header');
	assert.ok(css.includes('.view-header:hover .view-actions'), 'Must reveal when hovering view-header');
});

test('interactive containers preserve visibility with :focus-within', () => {
	const state = makeState({
		'--ui-metadata-container-opacity': '0',
		'--ui-metadata-container-hover-reveal': 'true',
		'--ui-inline-title-opacity': '0',
		'--ui-inline-title-hover-reveal': 'true',
	});
	const css = generateUIElementCss('.theme-dark', state);
	assertValid(css, 'focus-within preservation');
	assert.ok(css.includes('.metadata-container:focus-within'), 'metadata-container must support :focus-within');
	assert.ok(css.includes('.inline-title:focus-within'), 'inline-title must support :focus-within');
});

test('UI Elements Opacity overrides are placed AFTER Custom Backgrounds in generated stylesheet', () => {
	const state = makeState({
		'--ui-bg-enabled': 'true',
		'--ui-bg-style': 'dot-grid',
		'--ui-left-sidebar-opacity': '0.3',
	});
	const css = buildGeneratedCss(state);
	assertValid(css, 'buildGeneratedCss with custom background and UI opacity');

	const bgIndex = css.indexOf('/* Custom Backgrounds & Canvas Patterns */');
	const uiIndex = css.indexOf('/* UI Elements Opacity & Minimalist Layout Overrides */');

	assert.ok(bgIndex !== -1, 'Must include custom background comment');
	assert.ok(uiIndex !== -1, 'Must include UI elements opacity comment');
	assert.ok(uiIndex > bgIndex, 'UI Elements Opacity block must appear AFTER Custom Backgrounds in cascade order');
});

test('titlebar schema entry isolates titlebar and does not capture mod-top-right-space tabs', () => {
	const titlebarEl = UI_ELEMENTS.find((el) => el.id === 'titlebar');
	assert.ok(titlebarEl, 'titlebar element must exist in UI_ELEMENTS');
	assert.ok(!titlebarEl.selector.includes('mod-top-right-space'), 'titlebar selector must not capture .workspace-tabs.mod-top-right-space');
	assert.ok(titlebarEl.selector.includes('.titlebar'), 'titlebar selector must include .titlebar');
});

test('UI elements and background generator preserves tab header and ribbon pseudo-elements and sets frameless titlebar seamless', () => {
	const state = makeState();
	// The frameless rule rides on an active design, so enable one control:
	// that is the "designer has something switched on" the real view always is.
	state.darkEnabled.set('--text-normal', true);
	state.lightEnabled.set('--text-normal', true);
	const bgCss = generateCustomBackgroundCss('.theme-dark', state);
	const fullCss = buildGeneratedCss(state);
	assertValid(fullCss, 'buildGeneratedCss with default state');

	// Tab curve fillets and ribbon top block must not be suppressed
	assert.ok(!bgCss.includes('.workspace-tab-header::before'), 'Tab header ::before must not be suppressed in bg');
	assert.ok(!bgCss.includes('.workspace-tab-header-container::before'), 'Tab container ::before must not be suppressed in bg');
	assert.ok(!bgCss.includes('.workspace-ribbon.mod-left::before'), 'Ribbon ::before must not be suppressed in bg');
	assert.ok(!fullCss.includes('.workspace-tab-header::before {\n  display: none'), 'Tab header ::before must not be hidden');
	assert.ok(!fullCss.includes('.workspace-ribbon.mod-left::before {\n  display: none'), 'Ribbon ::before must not be hidden');

	// Frameless window mode titlebar must be borderless and transparent
	assert.ok(fullCss.includes('.is-hidden-frameless .titlebar'), 'Must include frameless titlebar rule');
	assert.ok(fullCss.includes('border: none !important;'), 'Must remove border on frameless titlebar');
});

test('a fully-disabled design emits no frameless titlebar rule, so reset leaves the user theme untouched', () => {
	const state = makeState();
	const fullCss = buildGeneratedCss(state);
	assert.ok(
		!fullCss.includes('.is-hidden-frameless .titlebar'),
		'with nothing enabled the snippet must carry no rules at all'
	);
	assertValid(fullCss, 'fully-disabled design');
});

test('sidebar action bar (.nav-header and .nav-buttons-container) maintains uniform opacity and background both focused and unfocused', () => {
	const glassTokens = new Map<string, string>([
		['--glass-enabled', 'true'],
		['--glass-opacity', '0.75'],
		['--glass-blur', '48px'],
	]);
	const glassCss = generateGlassCss('.theme-dark', glassTokens);
	assertValid(glassCss, 'generateGlassCss with glass enabled');

	// Must include .nav-header and .nav-buttons-container in sidebars and docks rule
	assert.ok(glassCss.includes('.workspace-split.mod-left-split .nav-header'), 'glassCss must cover left split .nav-header');
	assert.ok(glassCss.includes('.workspace-split.mod-left-split .nav-buttons-container'), 'glassCss must cover left split .nav-buttons-container');
	assert.ok(glassCss.includes('body.theme-dark:not(.is-focused) .workspace-split.mod-left-split .nav-header'), 'glassCss must cover unfocused left split .nav-header');
	assert.ok(glassCss.includes('body.theme-dark:not(.is-focused) .workspace-split.mod-left-split .nav-buttons-container'), 'glassCss must cover unfocused left split .nav-buttons-container');

	// Unfocused transparent rules must NOT strip sidebars to transparent
	assert.ok(
		glassCss.includes('body.theme-dark:not(.is-focused) .workspace-split:not(.mod-left-split):not(.mod-right-split) .workspace-tabs'),
		'unfocused workspace-tabs must be scoped away from left and right splits'
	);

	// Custom background side panel protection must cover nav-header both focused and unfocused
	const bgState = makeState({
		'--ui-bg-enabled': 'true',
		'--ui-bg-style': 'matrix',
		'--ui-bg-scope': 'editor',
	});
	const bgCss = generateCustomBackgroundCss('.theme-dark', bgState);
	assertValid(bgCss, 'generateCustomBackgroundCss with editor scope');
	assert.ok(bgCss.includes('.workspace-leaf-content[data-type="file-explorer"] .nav-header'), 'bgCss must protect file explorer .nav-header');
	assert.ok(bgCss.includes('.workspace-split.mod-left-split .nav-header'), 'bgCss must protect left split .nav-header');
	assert.ok(bgCss.includes('body.theme-dark:not(.is-focused) .workspace-split.mod-left-split .nav-header'), 'bgCss must protect unfocused left split .nav-header');
	assert.ok(bgCss.includes('body.theme-dark:not(.is-focused) .workspace-leaf-content[data-type="file-explorer"] .nav-header'), 'bgCss must protect unfocused file explorer .nav-header');
});

test('frosted glass clears the same shells when the window is unfocused as when it is focused', () => {
	const glassTokens = new Map<string, string>([
		['--glass-enabled', 'true'],
		['--glass-opacity', '0.6'],
		['--glass-blur', '48px'],
	]);
	const glassCss = generateGlassCss('.theme-dark', glassTokens);
	assertValid(glassCss, 'generateGlassCss with glass enabled');

	// Obsidian only paints its opaque fallbacks while the window is blurred. A
	// shell cleared in the focused list but missing from the unfocused list
	// regains that background on blur, so the glass opacity stops applying to
	// it. Every focused clear must therefore have an unfocused twin.
	for (const sel of [
		'.nav-files-container',
		'.nav-folder-children',
		'.cm-gutters',
		'.cm-gutter',
		'.cm-lineNumbers',
		'.markdown-rendered',
		'.markdown-reading-view',
		'.workspace-leaf-content[data-type="canvas"]',
		'.canvas-wrapper',
		'.canvas',
		'.canvas-background',
		'.workspace-leaf-content[data-type="bases"]',
		'.bases-view',
		'.bases-container',
		'.workspace-leaf-content[data-type="graph"]',
		'.sidebar-toggle-button',
	]) {
		assert.ok(glassCss.includes(`.theme-dark ${sel}`), `focused shell ${sel} should be cleared`);
		assert.ok(
			glassCss.includes(`body.theme-dark:not(.is-focused) ${sel}`),
			`unfocused shell ${sel} must also be cleared, or glass opacity is lost on blur`,
		);
	}

	// The ribbon paints its own glass surface, so it needs an explicit unfocused
	// rule that outranks Obsidian's blurred fallback rather than relying on the
	// focused selector that Obsidian's own `body:not(.is-focused)` rule can beat.
	assert.ok(
		glassCss.includes('body.theme-dark:not(.is-focused) .workspace-ribbon'),
		'ribbon must reassert its glass background while unfocused',
	);
});

test('glass never paints a side-dock leaf with the editor background', () => {
	const glassTokens = new Map<string, string>([
		['--glass-enabled', 'true'],
		['--glass-opacity', '0.6'],
		['--glass-blur', '48px'],
	]);
	const glassCss = generateGlassCss('.theme-dark', glassTokens);
	assertValid(glassCss, 'generateGlassCss with glass enabled');

	// A side-dock leaf has no `.mod-sidedock` of its own - Obsidian adds that to
	// the split - so any selector keyed on the LEAF can leak the editor
	// background into a sidebar. The `.mod-active` form was the culprit: it
	// outranked the "Sidebars & Docks" rule and darkened the pane on click.
	assert.ok(
		!glassCss.includes('.theme-dark .workspace-leaf:not(.mod-sidedock) .workspace-leaf-content'),
		'glass must not paint side-dock leaves through a leaf-level .mod-sidedock guard',
	);
	assert.ok(
		!glassCss.includes('.theme-dark .workspace-leaf.mod-active:not(.mod-sidedock) .workspace-leaf-content'),
		'a focused side-dock leaf must not receive the editor background',
	);

	// The editor surface is still painted, but only inside the root split.
	assert.ok(
		glassCss.includes('.theme-dark .workspace-split.mod-root .workspace-leaf-content'),
		'the editor leaf-content must keep its glass background',
	);
	assert.ok(
		glassCss.includes('.theme-dark .workspace-split.mod-root .workspace-leaf.mod-active .workspace-leaf-content'),
		'the active editor leaf must be pinned to that same background',
	);

	// Sidebars keep their own rule in both focus states, unchanged by activation.
	assert.ok(glassCss.includes('.theme-dark .workspace-split.mod-left-split .workspace-leaf-content'));
	assert.ok(
		glassCss.includes('body.theme-dark:not(.is-focused) .workspace-split.mod-left-split .workspace-leaf-content'),
	);
});

test('the frosted glass opacity slider drives every surface it paints', () => {
	const at = (opacity: string) =>
		generateGlassCss(
			'.theme-dark',
			new Map<string, string>([
				['--glass-enabled', 'true'],
				['--glass-opacity', opacity],
				['--glass-blur', '48px'],
			]),
		);

	const lower = at('0.6');
	const full = at('1.0');

	// Note the sidebars/titlebar use a compressed scale of the same slider, so
	// both surfaces must still move as the value moves.
	assert.ok(lower.includes('color-mix(in srgb, var(--background-primary) 60%, transparent)'));
	assert.ok(full.includes('color-mix(in srgb, var(--background-primary) 100%, transparent)'));
	assert.ok(lower.includes('color-mix(in srgb, var(--background-secondary) 15%, transparent)'));
	assert.ok(full.includes('color-mix(in srgb, var(--background-secondary) 25%, transparent)'));

	// The value is pinned for the focused and unfocused states alike, from one
	// shared block, so neither state can drift from the slider.
	const sharedBlock = lower.slice(
		lower.indexOf(
			'body.theme-dark,\nbody.theme-dark.is-translucent,\nbody.theme-dark.is-focused,\nbody.theme-dark:not(.is-focused) {',
		),
	);
	assert.ok(sharedBlock.startsWith('body.theme-dark,'), 'expected the shared focused/unfocused variable block');
	const sharedDeclarations = sharedBlock.slice(0, sharedBlock.indexOf('}'));
	assert.ok(
		sharedDeclarations.includes('--glass-opacity: 0.6 !important'),
		'glass opacity must be pinned for focused and unfocused alike',
	);
});

test('seamless top bar retains tab container background and avoids unfocused transparent strip', () => {
	const glassTokens = new Map<string, string>([
		['--glass-enabled', 'true'],
		['--glass-opacity', '0.75'],
		['--glass-blur', '48px'],
	]);
	const glassCss = generateGlassCss('.theme-dark', glassTokens);
	assertValid(glassCss, 'generateGlassCss with glass enabled');

	// .workspace-tab-header-container must be explicitly styled with --tab-container-background both focused and unfocused
	assert.ok(
		glassCss.includes('.workspace-tab-header-container'),
		'glassCss must include .workspace-tab-header-container'
	);
	assert.ok(
		glassCss.includes('body.theme-dark:not(.is-focused) .workspace-tab-header-container'),
		'glassCss must include unfocused .workspace-tab-header-container'
	);
	assert.ok(
		glassCss.includes('--tab-container-background'),
		'glassCss must use --tab-container-background'
	);

	// Unfocused reset list must NOT include .workspace-tab-header-container
	assert.ok(
		!glassCss.includes('body.theme-dark:not(.is-focused) .workspace-split:not(.mod-left-split):not(.mod-right-split) .workspace-tab-header-container'),
		'unfocused reset list must NOT strip .workspace-tab-header-container to transparent'
	);
});

test('vault profile and switcher remain transparent both focused and unfocused', () => {
	const glassTokens = new Map<string, string>([
		['--glass-enabled', 'true'],
		['--glass-opacity', '0.75'],
		['--glass-blur', '48px'],
	]);
	const glassCss = generateGlassCss('.theme-dark', glassTokens);
	assertValid(glassCss, 'generateGlassCss with glass enabled');

	// Must cover vault profile, switcher, and vault name both focused and unfocused
	assert.ok(glassCss.includes('.workspace-sidedock-vault-profile'), 'Must cover .workspace-sidedock-vault-profile');
	assert.ok(glassCss.includes('.workspace-drawer-vault-switcher'), 'Must cover .workspace-drawer-vault-switcher');
	assert.ok(glassCss.includes('.workspace-drawer-vault-name'), 'Must cover .workspace-drawer-vault-name');
	assert.ok(
		glassCss.includes('body.theme-dark:not(.is-focused) .workspace-sidedock-vault-profile'),
		'Must cover unfocused .workspace-sidedock-vault-profile'
	);
	assert.ok(
		glassCss.includes('body.theme-dark:not(.is-focused) .workspace-drawer-vault-switcher'),
		'Must cover unfocused .workspace-drawer-vault-switcher'
	);
	assert.ok(
		glassCss.includes('body.theme-dark:not(.is-focused) .workspace-drawer-vault-name'),
		'Must cover unfocused .workspace-drawer-vault-name'
	);

	// When glass is enabled, custom background generator must NOT stamp solid background on side panels
	const glassBgState = makeState({
		'--ui-bg-enabled': 'true',
		'--ui-bg-style': 'matrix',
		'--ui-bg-scope': 'editor',
		'--glass-enabled': 'true',
	});
	const glassBgCss = generateCustomBackgroundCss('.theme-dark', glassBgState);
	assertValid(glassBgCss, 'generateCustomBackgroundCss with glass enabled');
	assert.ok(
		!glassBgCss.includes('.workspace-split.mod-left-split {\n  background: var(--background-secondary'),
		'Must not force solid background-secondary onto .workspace-split.mod-left-split when glass is active'
	);
	assert.ok(
		!glassBgCss.includes('body.theme-dark:not(.is-focused) .workspace-split.mod-left-split,'),
		'Must not stamp unfocused solid background on .workspace-split.mod-left-split'
	);
});

test('UI elements do not carry redundant descriptions', () => {
	assert.equal(UI_ELEMENTS.length, 23);
	for (const el of UI_ELEMENTS) {
		assert.equal(
			el.description,
			undefined,
			`UI element ${el.id} should not have redundant description`
		);
	}
});

test('Feature controls do not carry descriptions', () => {
	const featureControlIds = ['readable-line-length', 'h1-border', 'bold-folder-headers', 'gradient-headers'];
	for (const id of featureControlIds) {
		const ctrl = STYLE_CONTROLS.find((c) => c.id === id);
		assert.ok(ctrl, `Control ${id} must exist in STYLE_CONTROLS`);
		assert.equal(
			ctrl?.description,
			undefined,
			`Feature control ${id} should not have a description`
		);
	}
	const headingCtrl = STYLE_CONTROLS.find((c) => c.id === 'gradient-headers');
	assert.equal(headingCtrl?.label, 'Heading Text', 'gradient-headers label should be Heading Text');
	assert.equal(headingCtrl?.subcategory, 'Heading Text', 'gradient-headers subcategory should be Heading Text');
});

test('UI elements at opacity < 1.0 emit CSS rules', () => {
	for (const el of UI_ELEMENTS) {
		const state = makeState({
			[`--ui-${el.id}-opacity`]: '0.4',
		});
		const css = generateUIElementCss('.theme-dark', state);
		assertValid(css, `UI element ${el.id} with reduced opacity`);
		assert.ok(css.length > 0, `UI element ${el.id} with reduced opacity must emit CSS rules`);
	}
});

test('UI elements at default 1.0 opacity emit zero CSS rules', () => {
	for (const el of UI_ELEMENTS) {
		const state = makeState({
			[`--ui-${el.id}-opacity`]: '1.0',
		});
		const css = generateUIElementCss('.theme-dark', state);
		assert.equal(css, '', `UI element ${el.id} at 1.0 opacity must emit zero CSS rules`);
	}
});

test('buildGeneratedCss does not flood code view with UI element tokens at default 1.0 opacity', () => {
	const state = makeState();
	// Default state: all elements at 1.0 opacity
	const generated = buildGeneratedCss(state);
	for (const el of UI_ELEMENTS) {
		assert.ok(
			!generated.includes(`--ui-${el.id}-opacity:`),
			`Code view should not contain default token --ui-${el.id}-opacity`
		);
		assert.ok(
			!generated.includes(`--ui-${el.id}-hover-reveal:`),
			`Code view should not contain default token --ui-${el.id}-hover-reveal`
		);
	}
});

test('buildGeneratedCss includes tokens only for UI elements with opacity < 1.0', () => {
	const state = makeState({
		'--ui-left-ribbon-opacity': '0.3',
		'--ui-status-bar-opacity': '1.0',
	});
	const generated = buildGeneratedCss(state);
	// The rule carries the value; the matching custom property is only a record
	// of it, so it is no longer written. What has to hold is that the customized
	// element is actually dimmed and the one left at full opacity is untouched.
	assert.match(
		generated,
		/ribbon[^{]*\{[^}]*opacity: 0\.3 !important/,
		'Customized element left-ribbon should be dimmed by an emitted rule'
	);
	assert.ok(
		!generated.includes('--ui-status-bar-opacity:'),
		'Default element status-bar must not have its opacity token emitted'
	);
	assert.ok(
		!generated.includes('--ui-left-ribbon-opacity:'),
		'The opacity record is redundant once the rule states the value'
	);
});
