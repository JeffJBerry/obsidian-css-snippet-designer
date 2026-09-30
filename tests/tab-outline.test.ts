import { test } from 'node:test';
import assert from 'node:assert/strict';
import { STYLE_CONTROLS } from '../src/schema';
import { validateCss, formatIssues } from '../src/engine';
import { buildGeneratedCss } from '../src/snippet/persist';
import type { ThemeTokenState } from '../src/css/ui-elements';

function assertValid(css: string, label: string): void {
	const result = validateCss(css);
	assert.ok(result.ok, `${label} produced malformed CSS:\n${formatIssues(result.issues)}`);
}

function createBaseState(): ThemeTokenState {
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
	return { darkTokens, lightTokens, darkEnabled, lightEnabled };
}

test('tab-outline-color companionCss is scoped to workspace-split.mod-root', () => {
	const ctrl = STYLE_CONTROLS.find((c) => c.variable === '--tab-outline-color');
	assert.ok(ctrl, 'Control --tab-outline-color must exist');
	assert.ok(ctrl.companionCss, 'Control --tab-outline-color must have companionCss');
	assertValid(ctrl.companionCss, 'tab-outline-color companionCss');

	assert.ok(
		ctrl.companionCss.includes('.workspace-split.mod-root .workspace-tab-header.is-active'),
		'Expected tab outline to target .workspace-split.mod-root'
	);
	assert.ok(
		!ctrl.companionCss.startsWith('.workspace-tab-header.is-active {') &&
		!ctrl.companionCss.includes('\n.workspace-tab-header.is-active {'),
		'Tab outline must not use un-scoped .workspace-tab-header.is-active'
	);
});

test('tab-icon-outline-color control exists and applies internal outline to sidebar tab icons', () => {
	const ctrl = STYLE_CONTROLS.find((c) => c.variable === '--tab-icon-outline-color');
	assert.ok(ctrl, 'Control --tab-icon-outline-color must exist');
	assert.equal(ctrl.type, 'color');
	assert.equal(ctrl.defaultDarkValue, 'transparent');
	assert.equal(ctrl.defaultLightValue, 'transparent');
	assert.ok(ctrl.companionCss, 'Control --tab-icon-outline-color must have companionCss');
	assertValid(ctrl.companionCss, 'tab-icon-outline-color companionCss');

	assert.ok(
		ctrl.companionCss.includes('box-shadow: inset 0 0 0'),
		'Expected tab icon outline to use inset box-shadow'
	);

	// Must target sidebar tabs strictly without leaking onto mod-root document tabs
	assert.ok(
		ctrl.companionCss.includes('.workspace-split.mod-left-split .workspace-tab-header.is-active') &&
		ctrl.companionCss.includes('.workspace-split.mod-right-split .workspace-tab-header.is-active') &&
		ctrl.companionCss.includes('.mod-sidedock .workspace-tab-header.is-active'),
		'Expected tab icon outline to target sidebar tabs'
	);
	assert.ok(
		!ctrl.companionCss.includes('mod-root'),
		'Tab icon outline must not reference mod-root or match mod-root tabs'
	);
});

test('tab-icon-outline-color emits valid CSS when color configured in generated stylesheet', () => {
	const state = createBaseState();
	state.darkTokens.set('--tab-icon-outline-color', '#a855f7');
	state.lightTokens.set('--tab-icon-outline-color', '#9333ea');
	state.darkTokens.set('--tab-outline-color', '#7c3aed');
	state.lightTokens.set('--tab-outline-color', '#6d28d9');

	const generated = buildGeneratedCss(state);
	assertValid(generated, 'buildGeneratedCss with tab-icon-outline-color configured');

	assert.ok(
		generated.includes('box-shadow: inset 0 0 0 var(--tab-outline-width, 1px) var(--tab-icon-outline-color'),
		'Generated stylesheet should include tab-icon-outline companion CSS with inset box-shadow'
	);
});

test('titlebar-background-focused control exists under secondary background in Base Palette', () => {
	const ctrl = STYLE_CONTROLS.find((c) => c.variable === '--titlebar-background-focused');
	assert.ok(ctrl, 'Control --titlebar-background-focused must exist');
	assert.equal(ctrl.id, 'titlebar-background-focused');
	assert.equal(ctrl.category, 'colors');
	assert.equal(ctrl.subcategory, 'Base Palette');
	assert.equal(ctrl.type, 'color');
	assert.equal(ctrl.defaultDarkValue, '#2e2e2e');
	assert.equal(ctrl.defaultLightValue, '#f6f6f6');

	// Ensure it is positioned directly under background-secondary
	const secondaryIdx = STYLE_CONTROLS.findIndex((c) => c.variable === '--background-secondary');
	const titlebarIdx = STYLE_CONTROLS.findIndex((c) => c.variable === '--titlebar-background-focused');
	assert.ok(secondaryIdx !== -1, 'Control --background-secondary must exist');
	assert.equal(titlebarIdx, secondaryIdx + 1, 'Control --titlebar-background-focused must be positioned right after --background-secondary');
});

test('titlebar-background-focused operates as a pure token without intrusive companionCss overlay', () => {
	const ctrl = STYLE_CONTROLS.find((c) => c.variable === '--titlebar-background-focused');
	assert.ok(ctrl, 'Control --titlebar-background-focused must exist');
	// Must not have companionCss to avoid rendering an opaque bar that covers UI elements (tabs, icons)
	assert.equal(ctrl.companionCss, undefined, 'Control --titlebar-background-focused must not define companionCss');
});

test('titlebar-background-focused emits valid CSS in generated stylesheet without covering UI elements', () => {
	const state = createBaseState();
	state.darkTokens.set('--titlebar-background-focused', '#3a3a3a');
	state.lightTokens.set('--titlebar-background-focused', '#e5e5e5');

	const generated = buildGeneratedCss(state);
	assertValid(generated, 'buildGeneratedCss with titlebar-background-focused');

	assert.ok(
		generated.includes('--titlebar-background-focused: #3a3a3a;'),
		'Generated dark theme must include --titlebar-background-focused'
	);
	assert.ok(
		generated.includes('--titlebar-background-focused: #e5e5e5;'),
		'Generated light theme must include --titlebar-background-focused'
	);
	assert.ok(
		!generated.includes('body.is-focused .titlebar {'),
		'Generated stylesheet must not include intrusive companion CSS that overlays .titlebar'
	);
});


