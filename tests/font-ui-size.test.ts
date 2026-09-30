import { test } from 'node:test';
import assert from 'node:assert/strict';
import { STYLE_CONTROLS } from '../src/schema';
import { buildGeneratedCss } from '../src/snippet/persist';
import { validateCss, formatIssues } from '../src/engine';
import type { ThemeTokenState } from '../src/css/ui-elements';

/**
 * "UI Font Size" in Typography > Font Families & Base Scale: scales the
 * interface chrome text (sidebars, tabs, ribbons, menus, status bar) by
 * rewriting Obsidian's interface size tokens, rather than note content which
 * "Base Font Size" (--font-text-size) already covers.
 */

function control() {
	const ctrl = STYLE_CONTROLS.find((c) => c.id === 'font-interface-size');
	assert.ok(ctrl, 'expected a "font-interface-size" STYLE_CONTROLS entry');
	return ctrl!;
}

function assertValid(css: string, label: string): void {
	const result = validateCss(css);
	assert.ok(result.ok, `${label} produced malformed CSS:\n${formatIssues(result.issues)}`);
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
	for (const [k, v] of Object.entries(overrides)) {
		darkTokens.set(k, v);
		lightTokens.set(k, v);
	}
	return { darkTokens, lightTokens, darkEnabled, lightEnabled };
}

test('font-interface-size is a Typography > Font & Base Scale slider', () => {
	const ctrl = control();
	assert.equal(ctrl.category, 'typography');
	assert.equal(ctrl.subcategory, 'Font & Base Scale');
	assert.equal(ctrl.type, 'slider');
	assert.equal(ctrl.variable, '--font-ui-size');
	assert.equal(ctrl.unit, 'px');
	assert.ok(ctrl.min !== undefined && ctrl.max !== undefined && ctrl.min < ctrl.max);
	assert.ok(parseFloat(ctrl.defaultDarkValue) >= (ctrl.min ?? 0));
	assert.ok(parseFloat(ctrl.defaultDarkValue) <= (ctrl.max ?? Infinity));
});

test('the default expands back to the stock interface size quartet', () => {
	const ctrl = control();
	// Obsidian stock is 12 / 13 / 15 / 20; anchoring to --font-ui-small at 13
	// means the default companion rule (12 / 13 / 15 / 20) changes nothing the
	// moment the plugin or its snippet is switched on.
	assert.equal(ctrl.defaultDarkValue, '13px');
	assert.equal(ctrl.defaultLightValue, '13px');
});

test('companionCss rebinds Obsidian interface size tokens instead of font-size', () => {
	const ctrl = control();
	assert.ok(ctrl.companionCss, 'must define companionCss');
	assertValid(ctrl.companionCss!, 'font-interface-size companionCss');

	// The tokens Obsidian's chrome actually consumes.
	assert.ok(
		ctrl.companionCss!.includes('--font-ui-small: var(--font-ui-size, 13px) !important;'),
		'must drive --font-ui-small from --font-ui-size',
	);
	assert.ok(
		ctrl.companionCss!.includes('--font-ui-medium: calc(var(--font-ui-size, 13px) + 2px) !important;'),
		'must derive --font-ui-medium',
	);
	assert.ok(ctrl.companionCss!.includes('--font-ui-smaller:'), 'must derive --font-ui-smaller');
	assert.ok(ctrl.companionCss!.includes('--font-ui-large:'), 'must derive --font-ui-large');

	// Regression guard: a raw font-size on body overrode the whole app's text,
	// which is what made text size jump when the plugin/snippet was toggled.
	assert.ok(
		!/font-size\s*:/.test(ctrl.companionCss!),
		'must not set font-size directly; rebind the interface size tokens',
	);
});

test('generated CSS carries the custom size and the rebinding, and validates', () => {
	const state = seedState({ '--font-ui-size': '19px' });
	const css = buildGeneratedCss(state);
	const result = validateCss(css);
	assert.ok(result.ok, `generated CSS malformed:\n${formatIssues(result.issues)}`);
	assert.match(css, /--font-ui-size: 19px;/);
	assert.match(css, /--font-ui-small: var\(--font-ui-size, 13px\) !important;/);
});
