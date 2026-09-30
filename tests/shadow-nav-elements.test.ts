import { test } from 'node:test';
import assert from 'node:assert/strict';
import { STYLE_CONTROLS, SHADOW_ELEMENTS, UI_ELEMENTS } from '../src/schema';
import { buildGeneratedCss } from '../src/snippet/persist';
import { validateCss, formatIssues } from '../src/engine';
import { SHADOW_PREVIEW_TARGETS } from '../src/ui/widgets';
import type { ThemeTokenState } from '../src/css/ui-elements';

/**
 * Six Shadows & Outlines targets: navigation icons, navigation text, the row
 * boxes around that text, Canvas cards, and the thin divider lines around
 * panes and the sidebar/ribbon.
 *
 * Earlier additions -- a Navigation Indent Guide, a whole-pane Graph View glow,
 * Navigation Collapse Arrows, and the Active Tab pill -- were removed on request;
 * this file no longer covers them.
 *
 * Canvas connection lines are SVG without a documented stable per-line class,
 * so canvas-cards targets only the cards, not the lines between them. This
 * test file holds that limit in place: a future edit that quietly starts
 * targeting canvas edges with a guessed selector (one that would silently do
 * nothing, or worse, hit the wrong element) should fail here.
 */
const NEW_IDS = [
	'nav-icons',
	'nav-text',
	'nav-item-box',
	'canvas-cards',
	'pane-dividers',
	'workspace-leaf-resizer-hover',
] as const;

/** These selector lists are plain comma-separated classes, no nested commas. */
function splitTop(selector: string): string[] {
	return selector.split(',').map((s) => s.trim());
}

function elementById(id: string) {
	const el = SHADOW_ELEMENTS.find((e) => e.id === id);
	assert.ok(el, `no SHADOW_ELEMENTS entry for "${id}"`);
	return el!;
}

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

test('all new elements exist with unique ids', () => {
	for (const id of NEW_IDS) elementById(id);
	const ids = SHADOW_ELEMENTS.map((e) => e.id);
	assert.equal(ids.length, new Set(ids).size, 'duplicate id in SHADOW_ELEMENTS');
});

test('every new element supports outline, like the existing box/text elements do', () => {
	for (const id of NEW_IDS) {
		assert.equal(elementById(id).supportsOutline, true, `${id} should offer an outline, same as the rest of the tab`);
	}
});

test('icon and text elements use the kind that actually renders on them', () => {
	// box-shadow renders on icon buttons and row containers; text-shadow (and
	// -webkit-text-stroke for outline) is what actually paints on glyphs.
	assert.equal(elementById('nav-icons').kind, 'box');
	assert.equal(elementById('nav-item-box').kind, 'box');
	assert.equal(elementById('canvas-cards').kind, 'box');
	assert.equal(elementById('pane-dividers').kind, 'box');
	assert.equal(elementById('workspace-leaf-resizer-hover').kind, 'box');
	assert.equal(elementById('nav-text').kind, 'text');
});

test('nav-text targets the label span, not the whole clickable row', () => {
	// Text-shadow on a row container would shadow nothing (rows have no direct
	// text node); it has to land on the *-content span Obsidian renders the
	// label into.
	const sel = elementById('nav-text').selector;
	assert.match(sel, /nav-file-title-content/);
	assert.match(sel, /nav-folder-title-content/);
});

test('nav-item-box targets the row, not the label span', () => {
	const sel = elementById('nav-item-box').selector;
	assert.match(sel, /(?<!-title-content)\.nav-file-title\b/);
	assert.match(sel, /(?<!-title-content)\.nav-folder-title\b/);
});

test('pane-dividers reuses the exact selectors the opacity-only border controls already treat as thin dividers', () => {
	// "Sidebar Boundary Dividers" (UI_ELEMENTS, kind: 'border') and pane selectors
	// establish these classes as border-only elements. Reusing them means the
	// glow/outline lands on an actual thin line rather than a filled content box.
	assert.equal(UI_ELEMENTS.find((e) => e.id === 'pane-borders'), undefined, 'expected "pane-borders" to be removed');
	const sidebarBorders = UI_ELEMENTS.find((e) => e.id === 'sidebar-borders');
	assert.ok(sidebarBorders, 'expected "sidebar-borders" UI_ELEMENTS entry to exist');

	const sel = elementById('pane-dividers').selector;
	const paneParts = ['.workspace-leaf', '.workspace-tabs', '.workspace-split.mod-root', '.workspace-leaf-content'];
	for (const part of paneParts) {
		assert.ok(sel.includes(part), `pane-dividers is missing "${part}"`);
	}
	for (const part of splitTop(sidebarBorders!.selector)) {
		assert.ok(sel.includes(part), `pane-dividers is missing "${part}" from Sidebar Boundary Dividers`);
	}
});

test('the removed indent-guide, graph-view, nav-arrows, and scrollbar-active-thumb elements are actually gone', () => {
	assert.equal(SHADOW_ELEMENTS.find((e) => e.id === 'nav-indent-line'), undefined);
	assert.equal(SHADOW_ELEMENTS.find((e) => e.id === 'graph-view'), undefined);
	assert.equal(SHADOW_ELEMENTS.find((e) => e.id === 'nav-arrows'), undefined);
	assert.equal(SHADOW_ELEMENTS.find((e) => e.id === 'scrollbar-active-thumb'), undefined);
	assert.equal(UI_ELEMENTS.find((e) => e.id === 'pane-borders'), undefined);
});

test('canvas-cards documents why connection lines are not covered', () => {
	const desc = elementById('canvas-cards').description.toLowerCase();
	assert.match(desc, /connection|edge|line/, 'should explain that edges are not covered, not silently under-deliver');
});

test('canvas-cards reuses the exact selector the glass/translucency layers already treat as the real Canvas node box', () => {
	// glass.ts and ui-elements.ts both target this class for the same DOM node;
	// a different guess here would style something the rest of the plugin
	// does not, which is exactly how a silent no-op selector slips in.
	assert.equal(elementById('canvas-cards').selector, '.canvas-node-container');
});

test('workspace-leaf-resizer-hover targets hover and active states of split and leaf resize handles', () => {
	const sel = elementById('workspace-leaf-resizer-hover').selector;
	assert.match(sel, /\.workspace-leaf-resize-handle:hover/);
	assert.match(sel, /\.workspace-leaf-resize-handle:active/);
	assert.match(sel, /\.workspace-split > hr:hover/);
});

test('every shadow element has a live preview target, so no card preview is empty', () => {
	for (const el of SHADOW_ELEMENTS) {
		const target = SHADOW_PREVIEW_TARGETS[el.id];
		assert.ok(target, `${el.id} has no preview target, so its card preview would render nothing`);
		assert.ok(target.selector.trim().length > 0, `${el.id} preview target has an empty selector`);
		assert.equal(
			target.text,
			el.kind === 'text',
			`${el.id} preview must use a ${el.kind} effect to match its generated CSS`,
		);
	}
	assert.equal(
		Object.keys(SHADOW_PREVIEW_TARGETS).length,
		SHADOW_ELEMENTS.length,
		'preview target map and shadow catalogue must not drift apart',
	);
});

for (const id of NEW_IDS) {
	test(`"${id}" generates valid CSS with shadow, outline, gradient and animation all on`, () => {
		const el = elementById(id);
		const state = seedState({
			[`--sh-${id}-enabled`]: 'true',
			[`--sh-${id}-outline-enabled`]: 'true',
			[`--sh-${id}-gradient-enabled`]: 'true',
			[`--sh-${id}-outline-gradient-enabled`]: 'true',
			[`--sh-${id}-anim-style`]: 'pulse',
		});
		const css = buildGeneratedCss(state);
		const result = validateCss(css);
		assert.ok(result.ok, `"${id}" produced malformed CSS:\n${formatIssues(result.issues)}`);

		// And it actually reached the stylesheet under the element's own selector,
		// scoped per theme mode -- not just "valid CSS" from some unrelated rule.
		const firstSelector = el.selector.split(',')[0]!.trim();
		assert.ok(
			css.includes(`.theme-dark ${firstSelector}`) || css.includes(`.theme-light ${firstSelector}`),
			`"${id}" enabled, but its selector never appears in the generated stylesheet`,
		);

		const shadowProp = el.kind === 'text' ? 'text-shadow' : 'box-shadow';
		assert.match(css, new RegExp(`${shadowProp}:`), `"${id}" enabled a shadow but emitted no ${shadowProp}`);

		if (el.kind === 'text') {
			assert.match(css, /-webkit-text-stroke:/, `"${id}" enabled outline but text elements should stroke, not outline`);
		} else {
			assert.match(css, /outline:/, `"${id}" enabled outline but emitted no outline property`);
		}

		// Animation on replaces the static declaration with a keyframe reference.
		assert.match(css, new RegExp(`animation: sh-anim-${id}-`), `"${id}" enabled pulse animation but no matching keyframe animation was applied`);
	});
}

test('every new element still respects the reduced-motion escape hatch when animated', () => {
	const state = seedState({
		'--sh-nav-icons-enabled': 'true',
		'--sh-nav-icons-anim-style': 'pulse',
	});
	const css = buildGeneratedCss(state);
	assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
});

test('nav-item-box glow and shadow renders and is not overridden by nav-box companion CSS when Visible Boxes is enabled', () => {
	const navBoxCtrl = STYLE_CONTROLS.find((c) => c.variable === '--nav-box-enabled');
	assert.ok(navBoxCtrl?.companionCss, 'nav-box companionCss must exist');

	// nav-box-enabled companionCss must not declare box-shadow with !important,
	// which would override nav-item-box glow/shadow and suppress CSS keyframe animations.
	assert.doesNotMatch(
		navBoxCtrl.companionCss,
		/box-shadow:[^;]+!important/,
		'nav-box-enabled companionCss must not declare box-shadow with !important'
	);

	// Test static shadow with Visible Boxes enabled
	const staticState = seedState({
		'--nav-box-enabled': 'true',
		'--sh-nav-item-box-enabled': 'true',
		'--sh-nav-item-box-color': '#7c3aed',
		'--sh-nav-item-box-mode': 'glow',
	});
	const staticCss = buildGeneratedCss(staticState);
	assert.ok(validateCss(staticCss).ok, 'static combined CSS must be valid');
	assert.ok(
		staticCss.includes('.theme-dark .workspace-leaf-content[data-type="file-explorer"] .nav-file-title'),
		'nav-item-box must target file explorer leaf items'
	);
	assert.match(staticCss, /box-shadow:[^;]+!important/, 'nav-item-box should emit !important on static box-shadow');

	// Test animated shadow with Visible Boxes enabled
	const animState = seedState({
		'--nav-box-enabled': 'true',
		'--sh-nav-item-box-enabled': 'true',
		'--sh-nav-item-box-anim-style': 'pulse',
	});
	const animCss = buildGeneratedCss(animState);
	assert.ok(validateCss(animCss).ok, 'animated combined CSS must be valid');
	assert.match(animCss, /animation: sh-anim-nav-item-box-themedark/, 'nav-item-box animation must be emitted');
});

test('workspace-leaf-resizer-hover emits 20ms transition delay on hover and 0s on active', () => {
	const state = seedState({
		'--sh-workspace-leaf-resizer-hover-enabled': 'true',
	});
	const css = buildGeneratedCss(state);
	assert.ok(validateCss(css).ok);
	assert.match(css, /transition-delay: 20ms !important/);
	assert.match(css, /\.workspace-leaf-resize-handle:active[\s\S]*?transition-delay: 0s !important/);
});

