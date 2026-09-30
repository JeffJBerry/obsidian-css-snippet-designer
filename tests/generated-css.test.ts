import { test } from 'node:test';
import assert from 'node:assert/strict';
import { STYLE_CONTROLS, SHADOW_ELEMENTS, UI_ELEMENTS, SHADOW_ANIMATION_OPTIONS } from '../src/schema';
import { buildGeneratedCss, mergeIntoExisting } from '../src/snippet/persist';
import { computeShadowString } from '../src/css/shadows';
import { generateCustomBackgroundCss, type ThemeTokenState } from '../src/css/ui-elements';
import { validateCss, formatIssues } from '../src/engine';

/**
 * Build a token state the way the view seeds it on open, so the generators run
 * against realistic input rather than an empty map.
 */
function seedState(overrides: Record<string, string> = {}): ThemeTokenState {
	const darkTokens = new Map<string, string>();
	const lightTokens = new Map<string, string>();
	const darkEnabled = new Map<string, boolean>();
	const lightEnabled = new Map<string, boolean>();

	for (const ctrl of STYLE_CONTROLS) {
		darkTokens.set(ctrl.variable, ctrl.defaultDarkValue);
		lightTokens.set(ctrl.variable, ctrl.defaultLightValue);
		darkEnabled.set(ctrl.variable, true);
		lightEnabled.set(ctrl.variable, true);
	}
	for (const el of UI_ELEMENTS) {
		darkTokens.set(`--ui-${el.id}-opacity`, el.defaultOpacityDark);
		lightTokens.set(`--ui-${el.id}-opacity`, el.defaultOpacityLight);
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

test('default state generates valid css', () => {
	assertValid(buildGeneratedCss(seedState()), 'defaults');
});

test('every shadow element generates valid css when enabled', () => {
	for (const el of SHADOW_ELEMENTS) {
		const state = seedState({
			[`--sh-${el.id}-enabled`]: 'true',
			[`--sh-${el.id}-outline-enabled`]: 'true',
		});
		assertValid(buildGeneratedCss(state), `shadow element "${el.id}"`);
	}
});

test('every animation style generates valid css', () => {
	const el = SHADOW_ELEMENTS[0];
	assert.ok(el);
	for (const anim of SHADOW_ANIMATION_OPTIONS) {
		const state = seedState({
			[`--sh-${el.id}-enabled`]: 'true',
			[`--sh-${el.id}-anim-style`]: anim.value,
		});
		assertValid(buildGeneratedCss(state), `animation "${anim.value}"`);
	}
});

test('glass, custom backgrounds and ui opacity generate valid css', () => {
	assertValid(buildGeneratedCss(seedState({ '--glass-enabled': 'true' })), 'glass');
	assertValid(
		buildGeneratedCss(seedState({ '--ui-bg-enabled': 'true', '--ui-bg-style': 'dot-grid' })),
		'custom background',
	);
	assertValid(buildGeneratedCss(seedState({ '--ui-master-opacity': '0.4' })), 'ui opacity');
});

test('an animated element emits a reduced-motion escape hatch', () => {
	const el = SHADOW_ELEMENTS[0];
	assert.ok(el);
	const css = buildGeneratedCss(
		seedState({ [`--sh-${el.id}-enabled`]: 'true', [`--sh-${el.id}-anim-style`]: 'pulse' }),
	);
	assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
	assert.match(css, /animation: none !important/);
});

test('animated state does not pause when unfocused so animations persist', () => {
	const el = SHADOW_ELEMENTS[0];
	assert.ok(el);
	const css = buildGeneratedCss(
		seedState({ [`--sh-${el.id}-enabled`]: 'true', [`--sh-${el.id}-anim-style`]: 'pulse' }),
	);
	assert.doesNotMatch(css, /animation-play-state:\s*paused/);

	// The point of this test is that losing focus must not stop an animation.
	// A blanket ban on `:not(.is-focused)` stood in for that, but the titlebar
	// frame link legitimately targets the blurred window, so assert the real
	// invariant instead: no blur-scoped rule may touch `animation`.
	for (const rule of css.split('}')) {
		if (!rule.includes(':not(.is-focused)')) continue;
		assert.doesNotMatch(
			rule,
			/(^|[\s;{])animation(-[a-z-]+)?\s*:/,
			`a rule scoped to the blurred window changes animation:\n${rule}}`,
		);
	}
});

test('a state with no animation emits no reduced-motion block', () => {
	const css = buildGeneratedCss(seedState());
	assert.doesNotMatch(css, /prefers-reduced-motion/);
});

test('loading-spin animation generates valid css with linear timing', () => {
	const boxEl = SHADOW_ELEMENTS.find((e) => e.kind === 'box');
	const textEl = SHADOW_ELEMENTS.find((e) => e.kind === 'text');
	assert.ok(boxEl);
	assert.ok(textEl);

	for (const el of [boxEl, textEl]) {
		const state = seedState({
			[`--sh-${el.id}-enabled`]: 'true',
			[`--sh-${el.id}-anim-style`]: 'loading-spin',
		});
		const css = buildGeneratedCss(state);
		assertValid(css, `loading-spin for ${el.id}`);
		assert.match(css, /animation: sh-anim-[a-z-]+ ([\d.]+s) linear infinite !important;/);
	}
});

test('generation is deterministic', () => {
	assert.equal(buildGeneratedCss(seedState()), buildGeneratedCss(seedState()));
});

test('a full generated snippet survives the fencing round-trip intact', () => {
	const css = buildGeneratedCss(seedState({ '--glass-enabled': 'true' }));
	const file = mergeIntoExisting('/* mine */\n.x { color: red; }\n', css);
	assertValid(file, 'merged file');
	assert.match(file, /\/\* mine \*\//);
	assert.equal(mergeIntoExisting(file, css), file);
});

test('gradient-headers companionCss exists, validates, and scopes correctly', () => {
	const ctrl = STYLE_CONTROLS.find((c) => c.variable === '--header-gradient-enabled');
	assert.ok(ctrl, 'Control --header-gradient-enabled must exist');
	assert.ok(ctrl.companionCss, 'Control --header-gradient-enabled must have companionCss');
	assertValid(ctrl.companionCss, 'gradient-headers companionCss');

	// Scoped selectors
	assert.ok(ctrl.companionCss.includes('.inline-title'), 'Expected .inline-title');
	assert.ok(ctrl.companionCss.includes('.markdown-rendered h1'), 'Expected .markdown-rendered h1');
	assert.ok(ctrl.companionCss.includes('.HyperMD-header-1'), 'Expected .HyperMD-header-1');
	assert.ok(ctrl.companionCss.includes('.cm-header-1'), 'Expected .cm-header-1');

	// Solid color properties without display: inline-block layout trap
	assert.ok(!ctrl.companionCss.includes('display: inline-block'), 'Must not force display: inline-block');

	for (let i = 1; i <= 6; i++) {
		assert.ok(ctrl.companionCss.includes(`.markdown-rendered h${i}`));
		assert.ok(ctrl.companionCss.includes(`--h${i}-gradient-color`));
		assert.ok(ctrl.companionCss.includes(`-webkit-text-fill-color: var(--h${i}-gradient-color`));
	}
});

test('gradient-headers emits valid CSS when enabled in generated stylesheet', () => {
	const state = seedState({
		'--header-gradient-enabled': 'true',
		'--header-gradient-from': '#a855f7',
		'--header-gradient-to': '#ec4899',
		'--h1-gradient-color': '#a855f7',
		'--h2-gradient-color': '#b651e3',
		'--h3-gradient-color': '#c44dcf',
		'--h4-gradient-color': '#d249bb',
		'--h5-gradient-color': '#e045a7',
		'--h6-gradient-color': '#ec4899',
	});

	const css = buildGeneratedCss(state);
	assertValid(css, 'buildGeneratedCss with gradient-headers active');
	assert.ok(css.includes('.markdown-rendered h1'), 'Expected generated CSS to include heading rules');
	assert.ok(css.includes('--h1-gradient-color'), 'Expected generated CSS to include --h1-gradient-color');
});

test('headings & document titles compute multi-tier concentric text glow', () => {
	const headingEl = SHADOW_ELEMENTS.find((el) => el.id === 'headings');
	assert.ok(headingEl, 'Headings element config must exist');
	assert.equal(headingEl.kind, 'text', 'Headings must be text kind');
	assert.equal(headingEl.defaultMode, 'glow', 'Headings default mode must be glow');

	// Verify selector covers Live Preview heading level classes and active tab titles
	assert.ok(headingEl.selector.includes('.HyperMD-header-1'), 'Selector must include .HyperMD-header-1');
	assert.ok(headingEl.selector.includes('.HyperMD-header-6'), 'Selector must include .HyperMD-header-6');
	assert.ok(headingEl.selector.includes('.cm-line.HyperMD-header'), 'Selector must include .cm-line.HyperMD-header');
	assert.ok(headingEl.selector.includes('.workspace-tab-header.is-active .workspace-tab-header-inner-title'), 'Selector must include active tab inner title');

	// Verify computeShadowString produces 4-layer luminous glow in glow mode
	const tokenMap = new Map<string, string>([
		['--sh-headings-enabled', 'true'],
		['--sh-headings-mode', 'glow'],
		['--sh-headings-blur', '12px'],
		['--sh-headings-color', '#7c3aed'],
		['--sh-headings-opacity', '0.6'],
		['--sh-headings-gradient-enabled', 'false'],
	]);

	const glowStr = computeShadowString('headings', tokenMap, 'text', 'base');
	const layers = glowStr.split(/(?<=\)),\s*/);
	assert.equal(layers.length, 4, 'Text glow must produce 4 concentric layers (core, mid, halo, bloom)');
	// Core (12 * 0.15 = 2px)
	assert.ok(layers[0]?.startsWith('0px 0px 2px'), `Layer 0 core should have 2px blur, got ${layers[0]}`);
	// Mid (12 * 0.45 = 5px)
	assert.ok(layers[1]?.startsWith('0px 0px 5px'), `Layer 1 mid should have 5px blur, got ${layers[1]}`);
	// Halo (12px)
	assert.ok(layers[2]?.startsWith('0px 0px 12px'), `Layer 2 halo should have 12px blur, got ${layers[2]}`);
	// Bloom (12 * 1.8 = 22px)
	assert.ok(layers[3]?.startsWith('0px 0px 22px'), `Layer 3 bloom should have 22px blur, got ${layers[3]}`);

	// Gradient glow produces 4 layers with both colors
	tokenMap.set('--sh-headings-gradient-enabled', 'true');
	tokenMap.set('--sh-headings-gradient-color', '#ec4899');
	const gradGlowStr = computeShadowString('headings', tokenMap, 'text', 'base');
	const gradLayers = gradGlowStr.split(/(?<=\)),\s*/);
	assert.equal(gradLayers.length, 4, 'Gradient text glow must produce 4 concentric layers');
	// Core & Mid use col1 (rgb(124, 58, 237))
	assert.ok(gradLayers[0]?.includes('124, 58, 237'), 'Core layer must use color 1');
	assert.ok(gradLayers[1]?.includes('124, 58, 237'), 'Mid layer must use color 1');
	// Halo & Bloom use col2 (rgb(236, 72, 153))
	assert.ok(gradLayers[2]?.includes('236, 72, 153'), 'Halo layer must use color 2');
	assert.ok(gradLayers[3]?.includes('236, 72, 153'), 'Bloom layer must use color 2');
});

test('glow mode honours the x and y offsets', () => {
	const text = new Map<string, string>([
		['--sh-headings-enabled', 'true'],
		['--sh-headings-mode', 'glow'],
		['--sh-headings-x', '10px'],
		['--sh-headings-y', '20px'],
		['--sh-headings-blur', '12px'],
		['--sh-headings-color', '#7c3aed'],
		['--sh-headings-opacity', '0.6'],
		['--sh-headings-gradient-enabled', 'false'],
	]);
	const textGlow = computeShadowString('headings', text, 'text', 'base');
	assert.ok(textGlow.startsWith('10px 20px'), `text glow must be offset, got ${textGlow}`);

	const box = new Map<string, string>([
		['--sh-callouts-enabled', 'true'],
		['--sh-callouts-mode', 'glow'],
		['--sh-callouts-x', '-6px'],
		['--sh-callouts-y', '8px'],
		['--sh-callouts-blur', '10px'],
		['--sh-callouts-spread', '2px'],
		['--sh-callouts-color', '#000000'],
		['--sh-callouts-opacity', '0.5'],
	]);
	const boxGlow = computeShadowString('callouts', box, 'box', 'base');
	assert.ok(boxGlow.startsWith('-6px 8px'), `box glow must be offset, got ${boxGlow}`);
});

test('headings glow emits valid CSS with un-clipped overflow companion rules', () => {
	const state = seedState({
		'--sh-headings-enabled': 'true',
		'--sh-headings-mode': 'glow',
		'--sh-headings-blur': '16px',
		'--sh-headings-color': '#a855f7',
		'--sh-headings-opacity': '0.7',
	});

	const css = buildGeneratedCss(state);
	assertValid(css, 'Headings glow CSS stylesheet');
	assert.ok(css.includes('text-shadow: 0px 0px'), 'Generated CSS must include text-shadow glow');
	assert.ok(css.includes('overflow: visible !important'), 'Generated CSS must fix overflow containment for headings');
	assert.ok(css.includes('.view-header-title-container'), 'Generated CSS must un-clip view header container');
	assert.ok(css.includes('.view-header-title'), 'Generated CSS must un-clip view header title');
});

test('body-text shadow/glow only targets body elements and excludes headings and root containers', () => {
	const bodyTextEl = SHADOW_ELEMENTS.find((el) => el.id === 'body-text');
	assert.ok(bodyTextEl, 'body-text shadow element must exist');

	// Ensure container selectors that would leak text-shadow to headings are excluded
	assert.ok(!bodyTextEl.selector.includes('.markdown-preview-view'), 'Must not target .markdown-preview-view');
	assert.ok(!bodyTextEl.selector.includes('.cm-content'), 'Must not target .cm-content');

	// Ensure Live Preview excludes heading lines
	assert.ok(bodyTextEl.selector.includes(':not(.HyperMD-header)'), 'Must exclude .HyperMD-header lines');
	assert.ok(bodyTextEl.selector.includes(':not(.cm-header)'), 'Must exclude .cm-header lines');

	// Generate CSS with body-text shadow enabled
	const state = seedState({
		'--sh-body-text-enabled': 'true',
		'--sh-body-text-blur': '8px',
		'--sh-body-text-color': '#3b82f6',
		'--sh-body-text-opacity': '0.6',
	});

	const css = buildGeneratedCss(state);
	assertValid(css, 'Body text shadow CSS stylesheet');
	assert.ok(css.includes('text-shadow:'), 'Must generate text-shadow rule');

	// Verify that text-shadow is NOT applied directly to root containers
	assert.ok(!css.includes('.markdown-preview-view {\n  text-shadow'), 'Must not apply text-shadow to .markdown-preview-view');
	assert.ok(!css.includes('.cm-content {\n  text-shadow'), 'Must not apply text-shadow to .cm-content');
});

test('spellcheck-underline-color companionCss covers native and Live Preview errors', () => {
	const ctrl = STYLE_CONTROLS.find((c) => c.variable === '--spellcheck-underline-color');
	assert.ok(ctrl, 'Control --spellcheck-underline-color must exist');
	assert.ok(ctrl.companionCss, 'Control --spellcheck-underline-color must have companionCss');
	assertValid(ctrl.companionCss, 'spellcheck-underline-color companionCss');

	// Native pseudo-elements and Live Preview tokens.
	assert.ok(ctrl.companionCss.includes('::spelling-error'), 'Must cover ::spelling-error');
	assert.ok(ctrl.companionCss.includes('::grammar-error'), 'Must cover ::grammar-error');
	assert.ok(ctrl.companionCss.includes('.cm-spell-error'), 'Must cover .cm-spell-error');
	assert.ok(ctrl.companionCss.includes('.cm-spellcheck'), 'Must cover .cm-spellcheck');

	// Token-owned text (headings, links, tags, code) so a theme's own decoration
	// cannot keep the default colour.
	for (let i = 1; i <= 6; i++) {
		assert.ok(ctrl.companionCss.includes(`.markdown-rendered h${i}::spelling-error`), `Expected h${i} coverage`);
	}
	assert.ok(ctrl.companionCss.includes('a.internal-link::spelling-error'), 'Must cover internal links');
	assert.ok(ctrl.companionCss.includes('a.tag::spelling-error'), 'Must cover tags');
	assert.ok(ctrl.companionCss.includes('code::spelling-error'), 'Must cover inline code');

	// The colour is driven by the token, with a fallback.
	assert.ok(
		ctrl.companionCss.includes('text-decoration-color: var(--spellcheck-underline-color, #e05252) !important;'),
		'Must bind the underline colour to --spellcheck-underline-color',
	);
});

test('spellcheck-underline-color emits valid CSS in generated stylesheet', () => {
	const state = seedState({ '--spellcheck-underline-color': '#123456' });
	const css = buildGeneratedCss(state);
	assertValid(css, 'buildGeneratedCss with spellcheck-underline-color');
	assert.match(css, /--spellcheck-underline-color: #123456;/);
	assert.ok(
		css.includes('text-decoration-color: var(--spellcheck-underline-color, #e05252) !important;'),
		'Generated CSS must emit the underline rule',
	);
});

test('the redundant spellcheck-color-preserve toggle is removed from the schema', () => {
	assert.equal(
		STYLE_CONTROLS.some((c) => c.variable === '--spellcheck-color-preserve'),
		false,
		'--spellcheck-color-preserve must no longer be a control',
	);
});

test('text-accent companionCss exists, validates, and aligns canvas selection and connection points', () => {
	const ctrl = STYLE_CONTROLS.find((c) => c.variable === '--text-accent');
	assert.ok(ctrl, 'Control --text-accent must exist');
	assert.ok(ctrl.companionCss, 'Control --text-accent must have companionCss');
	assertValid(ctrl.companionCss, 'text-accent companionCss');

	// Canvas wrapper and root scoping
	assert.ok(ctrl.companionCss.includes('.workspace-leaf-content[data-type="canvas"]'), 'Must scope to canvas leaf');
	assert.ok(ctrl.companionCss.includes('.canvas-wrapper'), 'Must scope to canvas wrapper');

	// Selection highlight
	assert.ok(ctrl.companionCss.includes('.canvas-node.is-selected:not(.is-themed) .canvas-node-container'), 'Must style selected node container');
	assert.ok(ctrl.companionCss.includes('.canvas-node.is-focused:not(.is-themed) .canvas-node-container'), 'Must style focused node container');
	assert.ok(ctrl.companionCss.includes('.canvas-selection'), 'Must style marquee canvas-selection');
	assert.ok(ctrl.companionCss.includes('--shadow-border-accent'), 'Must align --shadow-border-accent with --text-accent');

	// Obsidian's own accent variables, so buttons/toggles/active states follow
	assert.ok(ctrl.companionCss.includes('--color-accent: var(--text-accent) !important;'), 'Must map --color-accent');
	assert.ok(ctrl.companionCss.includes('--interactive-accent: var(--text-accent) !important;'), 'Must map --interactive-accent');
	assert.ok(ctrl.companionCss.includes('--interactive-accent-hover: var(--text-accent) !important;'), 'Must map --interactive-accent-hover');

	// Hover connection points/nodes
	assert.ok(ctrl.companionCss.includes('.canvas-node-connection-point::after'), 'Must style connection point node');
	assert.ok(ctrl.companionCss.includes('.canvas-node:hover .canvas-node-connection-point::after'), 'Must show connection node on card hover');
	assert.ok(ctrl.companionCss.includes('.canvas-node-resizer:hover .canvas-node-connection-point::after'), 'Must show connection node on resizer hover');
	assert.ok(ctrl.companionCss.includes('.canvas-node-connection-point:hover::after'), 'Must style connection node direct hover');
});

test('text-accent emits valid CSS with canvas selection highlight and hover nodes in generated stylesheet', () => {
	const state = seedState({
		'--text-accent': '#10b981',
	});

	const css = buildGeneratedCss(state);
	assertValid(css, 'buildGeneratedCss with text-accent active');
	assert.ok(css.includes('.canvas-node.is-selected'), 'Generated CSS must include canvas node selection rule');
	assert.ok(css.includes('.canvas-node-connection-point::after'), 'Generated CSS must include canvas connection point rule');
	assert.ok(css.includes('--color-accent: var(--text-accent) !important;'), 'Generated CSS must align canvas --color-accent');
	assert.ok(css.includes('--interactive-accent: var(--text-accent) !important;'), 'Generated CSS must map Obsidian --interactive-accent');
});

test('text-accent-2 is positioned directly under text-accent in Base Palette', () => {
	const accentIdx = STYLE_CONTROLS.findIndex((c) => c.variable === '--text-accent');
	const secondaryIdx = STYLE_CONTROLS.findIndex((c) => c.variable === '--text-accent-2');
	assert.ok(accentIdx !== -1, 'Control --text-accent must exist');
	assert.ok(secondaryIdx !== -1, 'Control --text-accent-2 must exist');
	assert.equal(secondaryIdx, accentIdx + 1, 'Secondary accent must be positioned directly after primary accent');
	const secondaryCtrl = STYLE_CONTROLS[secondaryIdx];
	assert.ok(secondaryCtrl, 'secondaryCtrl must exist');
	assert.equal(secondaryCtrl.subcategory, 'Base Palette');
	assert.equal(secondaryCtrl.category, 'colors');
});

test('text-accent-2 companionCss exists, validates, and aligns secondary accent elements', () => {
	const ctrl = STYLE_CONTROLS.find((c) => c.variable === '--text-accent-2');
	assert.ok(ctrl, 'Control --text-accent-2 must exist');
	assert.ok(ctrl.companionCss, 'Control --text-accent-2 must have companionCss');
	assertValid(ctrl.companionCss, 'text-accent-2 companionCss');

	// Tokens
	assert.ok(ctrl.companionCss.includes('--text-muted: var(--text-accent-2) !important;'), 'Must map --text-muted');
	assert.ok(ctrl.companionCss.includes('--icon-color: var(--text-accent-2) !important;'), 'Must map --icon-color');

	// UI Icons
	assert.ok(ctrl.companionCss.includes('.clickable-icon'), 'Must style clickable-icon');
	assert.ok(ctrl.companionCss.includes('svg.svg-icon'), 'Must style svg.svg-icon');

	// Grayed out text
	assert.ok(ctrl.companionCss.includes('.text-muted'), 'Must style .text-muted');

	// Settings icon
	assert.ok(ctrl.companionCss.includes('svg.lucide-settings'), 'Must style settings icon');

	// Canvas icons and unselected card border
	assert.ok(ctrl.companionCss.includes('.canvas-controls .clickable-icon'), 'Must style canvas controls');
	assert.ok(ctrl.companionCss.includes('.canvas-control-item'), 'Must style canvas control item');
	assert.ok(ctrl.companionCss.includes('.canvas-node:not(.is-selected):not(.is-themed) .canvas-node-container'), 'Must style unselected canvas card border');

	// Collapse & search icons
	assert.ok(ctrl.companionCss.includes('.search-input-container svg'), 'Must style search input icon');
	assert.ok(ctrl.companionCss.includes('.search-result-collapse-icon'), 'Must style search result collapse icon');
	assert.ok(ctrl.companionCss.includes('.collapse-icon'), 'Must style collapse icon');

	// Backlinks word count & flair
	assert.ok(ctrl.companionCss.includes('.workspace-leaf-content[data-type="backlink"] .tree-item-flair'), 'Must style backlink flair');
	assert.ok(ctrl.companionCss.includes('.search-result-file-match-count'), 'Must style search match count');

	// Toggle in ON position
	assert.ok(ctrl.companionCss.includes('.checkbox-container.is-enabled'), 'Must style toggle in ON position');
});

test('text-accent-2 emits valid CSS in generated stylesheet', () => {
	const state = seedState({
		'--text-accent-2': '#a855f7',
	});

	const css = buildGeneratedCss(state);
	assertValid(css, 'buildGeneratedCss with text-accent-2 active');
	assert.ok(css.includes('.checkbox-container.is-enabled'), 'Generated CSS must include toggle enabled rule');
	assert.ok(css.includes('--icon-color: var(--text-accent-2) !important;'), 'Generated CSS must include --icon-color rule');
	assert.ok(css.includes('.canvas-control-item'), 'Generated CSS must include canvas control rule');
});

test('text-highlight-bg is in colors tab under Editor subcategory with valid companionCss', () => {
	const ctrl = STYLE_CONTROLS.find((c) => c.variable === '--text-highlight-bg');
	assert.ok(ctrl, 'text-highlight-bg must exist');
	assert.equal(ctrl.category, 'colors', 'Must be in colors tab');
	assert.equal(ctrl.subcategory, 'Editor', 'Must be in Editor subcategory');
	assert.equal(ctrl.type, 'color', 'Must be a color control');
	assert.ok(ctrl.companionCss, 'Must define companionCss');

	const result = validateCss(ctrl.companionCss);
	assert.ok(result.ok, `companionCss must be valid CSS: ${formatIssues(result.issues)}`);
	assert.ok(ctrl.companionCss.includes('var(--text-highlight-bg)'), 'Must bind --text-highlight-bg');
	assert.ok(ctrl.companionCss.includes('mark'), 'Must style mark elements in Reading View');
	assert.ok(ctrl.companionCss.includes('.cm-highlight'), 'Must style .cm-highlight in Live Preview');

	const state = seedState({
		'--text-highlight-bg': '#ffdd00',
	});
	const css = buildGeneratedCss(state);
	assertValid(css, 'buildGeneratedCss with text-highlight-bg');
	assert.ok(css.includes('--text-highlight-bg: #ffdd00;'), 'Must emit token in theme block');
	assert.ok(css.includes('var(--text-highlight-bg) !important;'), 'Must emit companion rule');
});

test('code-block-text is in elements under code-block-background with valid companionCss', () => {
	const bgIdx = STYLE_CONTROLS.findIndex((c) => c.variable === '--code-block-background');
	const textIdx = STYLE_CONTROLS.findIndex((c) => c.variable === '--code-block-text');

	assert.ok(bgIdx !== -1, '--code-block-background must exist');
	assert.ok(textIdx !== -1, '--code-block-text must exist');
	assert.equal(textIdx, bgIdx + 1, 'code-block-text must be placed directly under code-block-background');

	const ctrl = STYLE_CONTROLS[textIdx];
	assert.ok(ctrl);
	assert.equal(ctrl.category, 'elements', 'Must be in elements category');
	assert.equal(ctrl.type, 'color', 'Must be a color control');
	assert.ok(ctrl.companionCss, 'Must define companionCss');

	const result = validateCss(ctrl.companionCss);
	assert.ok(result.ok, `companionCss must be valid CSS: ${formatIssues(result.issues)}`);
	assert.ok(ctrl.companionCss.includes('var(--code-block-text)'), 'Must bind --code-block-text');
	assert.ok(ctrl.companionCss.includes('.markdown-rendered pre'), 'Must style Reading View codeblocks');
	assert.ok(ctrl.companionCss.includes('.HyperMD-codeblock'), 'Must style Live Preview codeblocks');

	const state = seedState({
		'--code-block-text': '#00ff88',
	});
	const css = buildGeneratedCss(state);
	assertValid(css, 'buildGeneratedCss with code-block-text');
	assert.ok(css.includes('--code-block-text: #00ff88;'), 'Must emit token in theme block');
	assert.ok(css.includes('var(--code-block-text) !important;'), 'Must emit companion rule');
});
test('header gradient tokens persist when unrelated toggles are disabled', () => {
	const state = seedState({
		'--header-gradient-enabled': 'false',
		'--header-gradient-style': 'gradient',
		'--header-gradient-from': '#ff0000',
		'--header-gradient-to': '#0000ff',
		'--header-solid-color': '#ff00ff',
		'--h1-gradient-color': '#ff0000',
		'--h6-gradient-color': '#0000ff',
	});

	// Unrelated toggles turned off
	state.darkEnabled.set('--h1-border', false);
	state.darkEnabled.set('--sh-cards-enabled', false);
	// When header-gradient-enabled is false, h1-color should NOT be forced to currentColor
	state.darkEnabled.set('--h1-color', false);

	const css = buildGeneratedCss(state);
	assertValid(css, 'buildGeneratedCss with unrelated toggles disabled');

	// The gradient is switched off, so its rules are not emitted and the colours
	// they would have read are not written either: nothing in the snippet
	// resolves them. The values are not lost - they live in the designer's own
	// persisted state (`settings.tokenState`), which is what restores a design.
	assert.ok(!css.includes('--header-gradient-from:'), 'A switched-off gradient must not write its colours');
	assert.ok(!css.includes('--h1-gradient-color:'), 'A switched-off gradient must not write per-heading colours');

	// Must NOT output --h1-color: currentColor !important
	assert.ok(!css.includes('--h1-color: currentColor'), 'Must not emit --h1-color: currentColor when disabled');
});

test('per-heading gradient colours are written once the gradient is switched on', () => {
	// `--header-gradient-from` / `-to` are what the designer mixes the per-heading
	// colours *from*; the rules read the mixed result, so that is what the
	// snippet has to carry.
	const off = buildGeneratedCss(seedState({
		'--header-gradient-enabled': 'false',
		'--h1-gradient-color': '#ff0000',
	}));
	assert.ok(!off.includes('--h1-gradient-color:'), 'Nothing reads it while the gradient is off');

	const on = seedState({
		'--header-gradient-enabled': 'true',
		'--header-gradient-style': 'gradient',
		'--h1-gradient-color': '#ff0000',
		'--h6-gradient-color': '#0000ff',
	});
	const css = buildGeneratedCss(on);
	assertValid(css, 'buildGeneratedCss with the gradient on');
	assert.ok(css.includes('--h1-gradient-color: #ff0000;'), 'Must write --h1-gradient-color when in use');
	assert.ok(css.includes('--h6-gradient-color: #0000ff;'), 'Must write --h6-gradient-color when in use');
});

test('canvas navigation hover matches hover background highlight in schema companionCss and generated stylesheet', () => {
	const ctrl = STYLE_CONTROLS.find((c) => c.variable === '--background-modifier-hover');
	assert.ok(ctrl, 'Control --background-modifier-hover must exist');
	assert.equal(ctrl.id, 'hover-highlight', 'Control ID must be hover-highlight');
	assert.ok(ctrl.companionCss, 'hover-highlight must have companionCss');
	assertValid(ctrl.companionCss, 'hover-highlight companionCss');

	// Check that companionCss styles canvas navigation controls
	assert.ok(ctrl.companionCss.includes('.canvas-control-item:hover'), 'Must style .canvas-control-item:hover');
	assert.ok(ctrl.companionCss.includes('.canvas-controls'), 'Must target .canvas-controls');
	assert.ok(
		ctrl.companionCss.includes('background-color: var(--background-modifier-hover) !important;'),
		'Must apply --background-modifier-hover to canvas navigation hover'
	);

	// Check that custom background protection includes canvas navigation hover rule
	const bgState = seedState({
		'--ui-bg-enabled': 'true',
		'--background-modifier-hover': 'rgba(255, 255, 255, 0.15)',
	});
	const bgCss = generateCustomBackgroundCss('.theme-dark', bgState);
	assertValid(bgCss, 'generateCustomBackgroundCss output');
	assert.ok(bgCss.includes('.canvas-control-item:hover'), 'Custom background CSS must style .canvas-control-item:hover');
	assert.ok(
		bgCss.includes('background-color: var(--background-modifier-hover) !important;'),
		'Custom background CSS must apply --background-modifier-hover to canvas navigation'
	);

	// Check full generated stylesheet
	const state = seedState({
		'--background-modifier-hover': 'rgba(255, 255, 255, 0.15)',
	});
	const fullCss = buildGeneratedCss(state);
	assertValid(fullCss, 'buildGeneratedCss output');
	assert.ok(
		fullCss.includes('.canvas-control-item:hover'),
		'Full generated stylesheet must style .canvas-control-item:hover'
	);
	assert.ok(
		fullCss.includes('background-color: var(--background-modifier-hover) !important;'),
		'Full generated stylesheet must include canvas navigation hover style'
	);
});

test('toggle switches in settings menu and UI are protected from checkbox styling and input opacity overrides', () => {
	const state = seedState({
		'--checkbox-style': 'checkmark',
		'--checkbox-color': '#000000',
		'--checkbox-border-color': '#00ff00',
		'--checkbox-size': '16px',
		'--ui-bg-enabled': 'true',
		'--ui-bg-scope': 'workspace',
	});

	const fullCss = buildGeneratedCss(state);
	assertValid(fullCss, 'buildGeneratedCss output');

	// Ensure bare input[type="checkbox"] is NEVER emitted
	const bareCheckboxRegex = /(?:^|[\n,}])\s*input\[type=["']?checkbox["']?\](?:\s*[:{,])/m;
	assert.ok(
		!bareCheckboxRegex.test(fullCss),
		'Generated stylesheet must never emit bare input[type="checkbox"] selectors'
	);

	// Ensure setting-item-control input rule excludes checkboxes
	assert.ok(
		fullCss.includes('.setting-item-control input:not([type="checkbox"]):not([type="radio"])'),
		'Setting inputs must exclude checkbox and radio inputs'
	);

	// Ensure toggle container inputs are explicitly protected as invisible
	assert.ok(
		fullCss.includes('.checkbox-container input[type="checkbox"]'),
		'Generated CSS must include protective rule for .checkbox-container input'
	);
	assert.ok(
		fullCss.includes('.checkbox-container input[type="checkbox"]::after'),
		'Generated CSS must suppress ::after on .checkbox-container input'
	);
});

test('stock Obsidian reset defaults match stock theme values and disable text-accent-2', () => {
	const indentGuide = STYLE_CONTROLS.find((c) => c.variable === '--indentation-guide-color-active');
	assert.ok(indentGuide, '--indentation-guide-color-active must exist');
	assert.equal(indentGuide.defaultDarkValue, 'rgba(255, 255, 255, 0.3)', 'Indent guide active must be neutral in dark mode, not purple');

	const textAccent = STYLE_CONTROLS.find((c) => c.variable === '--text-accent');
	assert.ok(textAccent, '--text-accent must exist');
	assert.equal(textAccent.defaultDarkValue, '#a68af9', 'Default dark text-accent must match Obsidian stock --color-accent-1');

	const checkbox = STYLE_CONTROLS.find((c) => c.variable === '--checkbox-color');
	assert.ok(checkbox, '--checkbox-color must exist');
	assert.equal(checkbox.defaultDarkValue, '#8a5cf5', 'Default dark checkbox-color must match Obsidian stock interactive accent');

	// Simulate clean reset state where --text-accent-2 is disabled
	const state = seedState();
	state.darkEnabled.set('--text-accent-2', false);
	state.lightEnabled.set('--text-accent-2', false);

	const css = buildGeneratedCss(state);
	assertValid(css, 'buildGeneratedCss with stock defaults');
	assert.ok(
		!css.includes('--text-muted: var(--text-accent-2)'),
		'Generated CSS must NOT override --text-muted with text-accent-2 when disabled'
	);
	assert.ok(
		!css.includes('--icon-color: var(--text-accent-2)'),
		'Generated CSS must NOT override --icon-color with text-accent-2 when disabled'
	);
	assert.ok(
		!css.includes('.clickable-icon,'),
		'Generated CSS must NOT override clickable-icon with text-accent-2 when disabled'
	);
});

