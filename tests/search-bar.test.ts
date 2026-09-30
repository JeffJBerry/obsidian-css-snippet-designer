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

test('search-bar-background control exists with correct metadata matching secondary background defaults', () => {
	const ctrl = STYLE_CONTROLS.find((c) => c.variable === '--search-bar-background');
	assert.ok(ctrl, 'Control --search-bar-background must exist');
	assert.equal(ctrl.id, 'search-bar-background');
	assert.equal(ctrl.label, 'Search Bar Fill Color');
	assert.equal(ctrl.category, 'colors');
	assert.equal(ctrl.subcategory, 'Search Bar');
	assert.equal(ctrl.type, 'color');
	assert.equal(ctrl.defaultDarkValue, '#262626');
	assert.equal(ctrl.defaultLightValue, '#f6f6f6');
});

test('search-bar-background defaults match background-secondary defaults', () => {
	const searchCtrl = STYLE_CONTROLS.find((c) => c.variable === '--search-bar-background');
	const bgSecondaryCtrl = STYLE_CONTROLS.find((c) => c.variable === '--background-secondary');
	assert.ok(searchCtrl && bgSecondaryCtrl);
	assert.equal(searchCtrl.defaultDarkValue, bgSecondaryCtrl.defaultDarkValue, 'Dark default must match secondary background');
	assert.equal(searchCtrl.defaultLightValue, bgSecondaryCtrl.defaultLightValue, 'Light default must match secondary background');
});

test('search-bar-background is positioned in Colors tab directly under Tabs & Navigation', () => {
	const tabOutlineIdx = STYLE_CONTROLS.findIndex((c) => c.variable === '--tab-icon-outline-color');
	const searchBarIdx = STYLE_CONTROLS.findIndex((c) => c.variable === '--search-bar-background');
	const navBoxIdx = STYLE_CONTROLS.findIndex((c) => c.variable === '--nav-box-enabled');

	assert.ok(tabOutlineIdx !== -1, 'Control --tab-icon-outline-color must exist');
	assert.ok(searchBarIdx !== -1, 'Control --search-bar-background must exist');
	assert.ok(navBoxIdx !== -1, 'Control --nav-box-enabled must exist');

	assert.equal(searchBarIdx, tabOutlineIdx + 1, 'Search Bar section must be positioned right after Tabs & Navigation');
	assert.equal(navBoxIdx, searchBarIdx + 1, 'Navigation Tree must follow Search Bar');
});

test('search-bar-background companionCss is valid and targets search tab and settings search', () => {
	const ctrl = STYLE_CONTROLS.find((c) => c.variable === '--search-bar-background');
	assert.ok(ctrl?.companionCss, 'Control --search-bar-background must have companionCss');
	assertValid(ctrl.companionCss, 'search-bar-background companionCss');

	assert.ok(ctrl.companionCss.includes('.search-input-container'), 'Must target .search-input-container');
	assert.ok(ctrl.companionCss.includes('.search-input-container input'), 'Must target .search-input-container input');
	assert.ok(ctrl.companionCss.includes('input[type="search"]'), 'Must target input[type="search"]');
	assert.ok(ctrl.companionCss.includes('.workspace-leaf-content[data-type="search"] .search-input-container'), 'Must target search tab search bar');
	assert.ok(ctrl.companionCss.includes('.modal.mod-settings .search-input-container'), 'Must target settings menu search bar');
	assert.ok(ctrl.companionCss.includes('.vertical-tab-header .search-input-container'), 'Must target vertical tab header search bar');
	assert.ok(ctrl.companionCss.includes('.vertical-tab-content .search-input-container'), 'Must target vertical tab content search bar');
	assert.ok(ctrl.companionCss.includes('.setting-group-search'), 'Must target .setting-group-search to eliminate gray rectangle');
	assert.ok(ctrl.companionCss.includes('background-color: var(--search-bar-background, var(--background-secondary)) !important'), 'Must apply var(--search-bar-background) with var(--background-secondary) fallback');
});

test('background-secondary companionCss aligns settings menu sections with secondary background', () => {
	const ctrl = STYLE_CONTROLS.find((c) => c.variable === '--background-secondary');
	assert.ok(ctrl?.companionCss, 'Control --background-secondary must have companionCss');
	assertValid(ctrl.companionCss, 'background-secondary companionCss');

	assert.ok(ctrl.companionCss.includes('.modal.mod-settings'), 'Must target .modal.mod-settings');
	assert.ok(ctrl.companionCss.includes('.modal.mod-settings .setting-item'), 'Must target .setting-item');
	assert.ok(ctrl.companionCss.includes('.modal.mod-settings .setting-item-heading'), 'Must target .setting-item-heading');
	assert.ok(ctrl.companionCss.includes('.modal.mod-settings .vertical-tab-header-group'), 'Must target .vertical-tab-header-group');
	assert.ok(ctrl.companionCss.includes('.modal.mod-settings .search-input-container'), 'Must target settings search bar');
	assert.ok(ctrl.companionCss.includes('.vertical-tab-header .search-input-container'), 'Must target vertical tab header search bar');
	assert.ok(ctrl.companionCss.includes('.vertical-tab-content .search-input-container'), 'Must target vertical tab content search bar');
	assert.ok(ctrl.companionCss.includes('.plugin-list-plugins'), 'Must target Core Plugins tab container');
	assert.ok(ctrl.companionCss.includes('.hotkey-list-container'), 'Must target Hotkeys tab container');
	assert.ok(ctrl.companionCss.includes('.installed-plugins-container'), 'Must target Community Plugins tab container');
	assert.ok(ctrl.companionCss.includes('.setting-group-search'), 'Must target .setting-group-search');
	assert.ok(ctrl.companionCss.includes('.setting-group'), 'Must target .setting-group');
	assert.ok(ctrl.companionCss.includes('.setting-items'), 'Must target .setting-items');
	assert.ok(ctrl.companionCss.includes('--setting-items-background: var(--background-secondary) !important;'), 'Must set --setting-items-background');
	assert.ok(ctrl.companionCss.includes('.modal.mod-settings .vertical-tab-content:has(.search-input-container)'), 'Must target tabs with search bars');
	assert.ok(ctrl.companionCss.includes('background-color: var(--background-secondary) !important'), 'Must apply var(--background-secondary)');
});

test('search-bar-background emits valid CSS in generated stylesheet', () => {
	const state = createBaseState();
	state.darkTokens.set('--search-bar-background', '#181818');
	state.lightTokens.set('--search-bar-background', '#f5f5f5');

	const generated = buildGeneratedCss(state);
	assertValid(generated, 'buildGeneratedCss with search-bar-background');

	assert.ok(
		generated.includes('--search-bar-background: #181818;'),
		'Generated dark theme must include --search-bar-background'
	);
	assert.ok(
		generated.includes('--search-bar-background: #f5f5f5;'),
		'Generated light theme must include --search-bar-background'
	);
	assert.ok(
		generated.includes('.search-input-container'),
		'Generated stylesheet must include companion CSS targeting .search-input-container'
	);
	assert.ok(
		generated.includes('.workspace-leaf-content[data-type="search"] .search-input-container'),
		'Generated stylesheet must include companion CSS targeting search tab search bar'
	);
	assert.ok(
		generated.includes('.modal.mod-settings .search-input-container'),
		'Generated stylesheet must include companion CSS targeting settings search bar'
	);
	assert.ok(
		generated.includes('.vertical-tab-content .search-input-container'),
		'Generated stylesheet must include companion CSS targeting vertical tab content search bar'
	);
	assert.ok(
		generated.includes('.setting-group-search'),
		'Generated stylesheet must include companion CSS targeting .setting-group-search'
	);
});

test('background-secondary emits valid CSS aligning settings sections in generated stylesheet', () => {
	// A control still sitting on its stock value writes nothing, so the colour is
	// moved off default here to ask the question the test means to ask.
	const state = createBaseState();
	state.darkTokens.set('--background-secondary', '#123456');
	state.lightTokens.set('--background-secondary', '#123456');
	const generated = buildGeneratedCss(state);
	assertValid(generated, 'buildGeneratedCss with background-secondary companion');

	assert.ok(
		generated.includes('.modal.mod-settings'),
		'Generated stylesheet must include .modal.mod-settings rule'
	);
	assert.ok(
		generated.includes('.modal.mod-settings .setting-item'),
		'Generated stylesheet must include .setting-item rule'
	);
	assert.ok(
		generated.includes('.modal.mod-settings .search-input-container'),
		'Generated stylesheet must include settings search-input-container rule'
	);
	assert.ok(
		generated.includes('.plugin-list-plugins'),
		'Generated stylesheet must include Core plugins tab container rule'
	);
	assert.ok(
		generated.includes('.hotkey-list-container'),
		'Generated stylesheet must include Hotkeys tab container rule'
	);
	assert.ok(
		generated.includes('.installed-plugins-container'),
		'Generated stylesheet must include Community plugins tab container rule'
	);
	assert.ok(
		generated.includes('.setting-group-search'),
		'Generated stylesheet must include .setting-group-search'
	);
	assert.ok(
		generated.includes('background-color: var(--background-secondary) !important;'),
		'Generated stylesheet must align settings sections with var(--background-secondary)'
	);
});

