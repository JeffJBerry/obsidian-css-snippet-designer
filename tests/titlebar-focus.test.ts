import { test } from 'node:test';
import assert from 'node:assert/strict';
import { STYLE_CONTROLS } from '../src/schema';
import { buildGeneratedCss } from '../src/snippet/persist';
import { validateCss } from '../src/engine';
import type { ThemeTokenState } from '../src/css/ui-elements';

const MATCH = '--titlebar-match-unfocused';
const FOCUSED = '--titlebar-background-focused';
const UNFOCUSED = '--titlebar-background';

/**
 * Obsidian paints `.titlebar` from --titlebar-background and only swaps to
 * --titlebar-background-focused while `body.is-focused` is set. A palette that
 * names one and not the other greys out on blur, which is the defect this
 * feature exists to prevent -- so these tests assert on the EMITTED CSS, not on
 * schema metadata, which would pass even if nothing reached the stylesheet.
 */
function state(tokens: Record<string, string>, enabledOverrides: Record<string, boolean> = {}): ThemeTokenState {
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
	for (const [k, v] of Object.entries(tokens)) {
		darkTokens.set(k, v);
		lightTokens.set(k, v);
	}
	for (const [k, v] of Object.entries(enabledOverrides)) {
		darkEnabled.set(k, v);
		lightEnabled.set(k, v);
	}
	return { darkTokens, lightTokens, darkEnabled, lightEnabled };
}

test('the unfocused frame link is a real control that defaults to on', () => {
	const ctrl = STYLE_CONTROLS.find((c) => c.variable === MATCH);
	assert.ok(ctrl, 'no control owns the unfocused frame link');
	assert.equal(ctrl.type, 'toggle');
	assert.equal(ctrl.defaultDarkValue, 'true', 'a frame that greys out on blur must not be the default');
	assert.equal(ctrl.defaultLightValue, 'true');
	assert.ok(ctrl.companionCss, 'the link needs DOM bindings, not just a token');
});

test('the link pins the blurred titlebar to the focused colour', () => {
	const css = buildGeneratedCss(state({ [MATCH]: 'true', [FOCUSED]: '#123456' }));

	// The variable alias covers anything else reading --titlebar-background,
	// including third-party themes.
	assert.match(
		css,
		/body:not\(\.is-focused\):not\(\.is-translucent\):not\(\.is-hidden-frameless\)\s*\{[^}]*--titlebar-background:\s*var\(--titlebar-background-focused\)\s*!important/,
		'blurred body does not alias --titlebar-background to the focused colour',
	);

	// And the element rules cover Obsidian's own `.titlebar` background rule,
	// which wins on specificity over a bare variable change in some builds.
	for (const sel of ['.titlebar', '.titlebar-inner', '.titlebar-button-container']) {
		assert.ok(
			css.includes(`body:not(.is-focused):not(.is-translucent):not(.is-hidden-frameless) ${sel}`),
			`${sel} is not pinned while the window is blurred`,
		);
	}
});

test('turning the link off leaves the separate unfocused colour alone', () => {
	const css = buildGeneratedCss(state({ [MATCH]: 'false', [FOCUSED]: '#123456' }));
	assert.ok(
		!css.includes('body:not(.is-focused):not(.is-translucent):not(.is-hidden-frameless) .titlebar'),
		'the link still emits its override after being switched off',
	);
});

test('the link never fights the translucency layer for the frame', () => {
	const css = buildGeneratedCss(state({ [MATCH]: 'true', [FOCUSED]: '#123456' }));
	const linkRules = css
		.split('\n')
		.filter((l) => l.startsWith('body:not(.is-focused)'));
	assert.ok(linkRules.length > 0);
	for (const rule of linkRules) {
		assert.ok(
			rule.includes(':not(.is-translucent)'),
			`"${rule}" would override the glass frame, which owns the titlebar when transparency is on`,
		);
	}
});

/**
 * Regression for a real bug: a frameless/"seamless top bar" window keeps
 * `.titlebar` transparent via a plain class selector with no `body` in front
 * of it (see ui-elements.ts / glass.ts / translucency.ts). This control's
 * `body:not(...)` selectors carry an extra type selector, so without the
 * `:not(.is-hidden-frameless)` guard they OUTRANK that rule on specificity and
 * repaint the seamless region solid on blur -- which is exactly what happened
 * before this exclusion was added.
 */
test('the link never outranks the frameless seamless titlebar rule', () => {
	const css = buildGeneratedCss(state({ [MATCH]: 'true', [FOCUSED]: '#123456' }));
	const linkRules = css
		.split('\n')
		.filter((l) => l.startsWith('body:not(.is-focused)') && l.includes('.titlebar'));
	assert.ok(linkRules.length > 0, 'expected at least one blur-scoped .titlebar rule');
	for (const rule of linkRules) {
		assert.ok(
			rule.includes(':not(.is-hidden-frameless)'),
			`"${rule}" has higher specificity than the frameless-seamless .titlebar rule and would override it on blur`,
		);
	}
});

test('a disabled link control emits nothing, so it cannot strand a half-applied override', () => {
	const css = buildGeneratedCss(
		state({ [MATCH]: 'true', [FOCUSED]: '#123456' }, { [MATCH]: false }),
	);
	assert.ok(!css.includes('body:not(.is-focused):not(.is-translucent):not(.is-hidden-frameless) .titlebar'));
});

test('the emitted snippet stays valid CSS with the link on', () => {
	const result = validateCss(buildGeneratedCss(state({ [MATCH]: 'true', [FOCUSED]: '#123456' })));
	assert.equal(result.ok, true, JSON.stringify(result.issues));
});

test('both frame colours are still independently addressable controls', () => {
	// The link must not have been implemented by deleting the capability.
	assert.ok(STYLE_CONTROLS.some((c) => c.variable === FOCUSED && c.type === 'color'));
	assert.ok(STYLE_CONTROLS.some((c) => c.variable === UNFOCUSED && c.type === 'color'));
});
