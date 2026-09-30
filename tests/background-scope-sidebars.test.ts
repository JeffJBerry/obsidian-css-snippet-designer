import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BACKGROUND_SCOPE_OPTIONS } from '../src/schema';
import { generateCustomBackgroundCss, type ThemeTokenState } from '../src/css/ui-elements';
import { buildGeneratedCss } from '../src/snippet/persist';
import { validateCss, formatIssues } from '../src/engine';

/**
 * "Side Panels Only" (--ui-bg-scope: 'sidebars') is a third Custom Background
 * scope, alongside 'editor' and 'workspace': the pattern paints the left/right
 * sidebars (file explorer, search, backlinks, etc. and their drawer/ribbon
 * equivalents) while the main note editor and floating UI (menus,
 * popovers, the settings modal) are left solid, exactly as if the feature
 * were off there.
 */

function makeState(overrides: Record<string, string> = {}): ThemeTokenState {
	const darkTokens = new Map<string, string>();
	const lightTokens = new Map<string, string>();
	const darkEnabled = new Map<string, boolean>();
	const lightEnabled = new Map<string, boolean>();
	const base: Record<string, string> = {
		'--ui-bg-enabled': 'true',
		'--ui-bg-style': 'dot-grid',
		'--ui-bg-scope': 'sidebars',
		'--ui-bg-size': '24px',
		'--ui-bg-opacity': '0.35',
		'--ui-bg-color': '#ffffff',
		'--ui-bg-gradient': 'false',
		'--ui-bg-motion-animation': 'none',
		'--ui-bg-color-animation': 'none',
		...overrides,
	};
	for (const [k, v] of Object.entries(base)) {
		darkTokens.set(k, v);
		lightTokens.set(k, v);
	}
	return { darkTokens, lightTokens, darkEnabled, lightEnabled };
}

function assertValid(css: string, label: string): void {
	const result = validateCss(css);
	assert.ok(result.ok, `${label} produced malformed CSS:\n${formatIssues(result.issues)}`);
}

test('BACKGROUND_SCOPE_OPTIONS offers a "Side Panels Only" choice', () => {
	const opt = BACKGROUND_SCOPE_OPTIONS.find((o) => o.value === 'sidebars');
	assert.ok(opt, 'expected a BACKGROUND_SCOPE_OPTIONS entry with value "sidebars"');
	assert.equal(opt!.label, 'Side Panels Only');
});

test('sidebars scope (static pattern): side panels get the pattern, main editor and menus stay solid', () => {
	const state = makeState();
	const css = generateCustomBackgroundCss('.theme-dark', state);
	assertValid(css, 'sidebars scope static CSS');

	// Side panel containers receive the pattern image (dot-grid renders as a
	// radial-gradient rather than a url() image).
	assert.match(
		css,
		/\.workspace-split\.mod-left-split[^{]*\{[^}]*background-image: radial-gradient/,
		'left split must receive the background pattern image'
	);
	assert.match(
		css,
		/\.workspace-split\.mod-right-split[^{]*\{[^}]*background-image: radial-gradient/,
		'right split must receive the background pattern image'
	);

	// Main editor content is explicitly kept solid without the pattern.
	assert.match(
		css,
		/\.workspace-leaf-content\[data-type="markdown"\] \.view-content[^{]*\{[^}]*background-image: none/,
		'main editor view-content must be explicitly protected from the pattern'
	);

	// Menus and the settings modal stay solid, never painted with the pattern.
	assert.match(
		css,
		/\.theme-dark \.menu,[\s\S]*?\{[^}]*background-image: none/,
		'menus must stay solid without the pattern'
	);
	assert.ok(!/\.theme-dark \.menu[^-][\s\S]{0,400}background-image: url/.test(css), 'menus must not receive the pattern image');
});

test('sidebars scope (static pattern): nested sidebar content is forced transparent so the pattern is actually visible', () => {
	// Regression test: the pattern is painted on the OUTER split/drawer/ribbon
	// container, which sits behind its nested tabs/leaf/view-content/nav
	// elements. Obsidian gives those nested elements their own opaque
	// secondary background by default, which visually hides a parent's
	// background unless they are explicitly forced transparent. Static
	// patterns (no motion/color animation - the common case) return before
	// ever reaching the transparency pass that only ran for layered
	// animations, so previously only the ribbon (which has no nested content
	// to cover it) actually showed the pattern; the file explorer and
	// backlinks/linked-mentions pane stayed solid.
	const state = makeState();
	const css = generateCustomBackgroundCss('.theme-dark', state);
	assertValid(css, 'sidebars scope static CSS');

	for (const selector of [
		'.workspace-split.mod-left-split .nav-files-container',
		'.workspace-split.mod-left-split .workspace-leaf-content',
		'.workspace-split.mod-right-split .backlink-pane',
		'.backlink-pane .search-result-container',
	]) {
		const needle = `.theme-dark ${selector}`;
		assert.ok(css.includes(needle), `expected static CSS to mention ${needle}`);
		// The selector may sit anywhere in a long comma-separated selector
		// list, so find the declaration block that actually follows it
		// rather than checking a fixed window of characters.
		const idx = css.indexOf(needle);
		const openBrace = css.indexOf('{', idx);
		const closeBrace = css.indexOf('}', openBrace);
		const declarations = css.slice(openBrace, closeBrace);
		assert.match(
			declarations,
			/background-color: transparent !important;/,
			`${needle}'s rule must set background-color: transparent so the parent's pattern shows through`
		);
	}
});

test('sidebars scope (layered animation): animated pattern renders on the side panels, not the editor', () => {
	const state = makeState({ '--ui-bg-motion-animation': 'pulse' });
	const css = generateCustomBackgroundCss('.theme-dark', state);
	assertValid(css, 'sidebars scope layered-animation CSS');

	// The animated ::before layer is pinned to the side split/drawer containers.
	assert.ok(css.includes('.workspace-split.mod-left-split::before'), 'must paint the left split ::before layer');
	assert.ok(css.includes('.workspace-split.mod-right-split::before'), 'must paint the right split ::before layer');
	assert.ok(css.includes('@keyframes css-bg-pulse'), 'must include the pulse keyframes');

	// The split/drawer ::before layers must NOT be suppressed like they are
	// for the 'editor' scope, since here they are the paint target.
	assert.ok(
		!css.includes('.workspace-split.mod-left-split::before,\ntheme-dark .workspace-split.mod-right-split::before {\n  display: none'),
		'sidebar ::before layers must not be suppressed while painting them'
	);

	// Main editor leaf is not turned into a paint target.
	assert.ok(
		!css.includes('.workspace-leaf-content[data-type="markdown"]::before'),
		'main editor leaf must not gain an animated pattern layer'
	);
});

test('BACKGROUND_SCOPE_OPTIONS offers "Left Panel Only" and "Right Panel Only" choices', () => {
	const leftOpt = BACKGROUND_SCOPE_OPTIONS.find((o) => o.value === 'left-sidebar');
	assert.ok(leftOpt, 'expected a BACKGROUND_SCOPE_OPTIONS entry with value "left-sidebar"');
	assert.equal(leftOpt!.label, 'Left Panel Only');

	const rightOpt = BACKGROUND_SCOPE_OPTIONS.find((o) => o.value === 'right-sidebar');
	assert.ok(rightOpt, 'expected a BACKGROUND_SCOPE_OPTIONS entry with value "right-sidebar"');
	assert.equal(rightOpt!.label, 'Right Panel Only');
});

test('left panel only scope: left panel gets pattern, right panel and editor stay solid', () => {
	const state = makeState({ '--ui-bg-scope': 'left-sidebar' });
	const css = generateCustomBackgroundCss('.theme-dark', state);
	assertValid(css, 'left-sidebar scope CSS');

	assert.match(
		css,
		/\.workspace-split\.mod-left-split[^{]*\{[^}]*background-image: radial-gradient/,
		'left split must receive the pattern'
	);
	assert.match(
		css,
		/\.workspace-split\.mod-right-split[^{]*\{[^}]*background-image: none/,
		'right split must be protected with background-image: none'
	);
	assert.match(
		css,
		/\.workspace-leaf-content\[data-type="markdown"\] \.view-content[^{]*\{[^}]*background-image: none/,
		'editor must be protected with background-image: none'
	);
});

test('right panel only scope: right panel gets pattern, left panel and editor stay solid', () => {
	const state = makeState({ '--ui-bg-scope': 'right-sidebar' });
	const css = generateCustomBackgroundCss('.theme-dark', state);
	assertValid(css, 'right-sidebar scope CSS');

	assert.match(
		css,
		/\.workspace-split\.mod-right-split[^{]*\{[^}]*background-image: radial-gradient/,
		'right split must receive the pattern'
	);
	assert.match(
		css,
		/\.workspace-split\.mod-left-split[^{]*\{[^}]*background-image: none/,
		'left split must be protected with background-image: none'
	);
	assert.match(
		css,
		/\.workspace-leaf-content\[data-type="markdown"\] \.view-content[^{]*\{[^}]*background-image: none/,
		'editor must be protected with background-image: none'
	);
});

test('animated flipbook in left panel only scope targets left panel', () => {
	const state = makeState({
		'--ui-bg-enabled': 'false',
		'--ui-bg-flipbook': 'wink-face',
		'--ui-bg-flipbook-enabled': 'true',
		'--ui-bg-flipbook-scope': 'left-sidebar',
	});
	const css = generateCustomBackgroundCss('.theme-dark', state);
	assertValid(css, 'flipbook in left-sidebar scope');

	assert.ok(css.includes('.workspace-split.mod-left-split::before'), 'must paint the left split ::before layer');
	assert.ok(!css.includes('.workspace-split.mod-right-split::before {\n  content: ""'), 'must not paint right split ::before layer');
});

test('end-to-end buildGeneratedCss validates with sidebars scope', () => {
	const state = makeState();
	const css = buildGeneratedCss(state);
	assertValid(css, 'buildGeneratedCss with sidebars scope');
});

