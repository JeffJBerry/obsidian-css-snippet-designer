import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TAB_DEFINITIONS, STYLE_CONTROLS } from '../src/schema';
import { buildGeneratedCss } from '../src/snippet/persist';
import { validateCss, formatIssues } from '../src/engine';
import { generateCustomBackgroundCss, type ThemeTokenState } from '../src/css/ui-elements';

function createSeedState(overrides: Record<string, string> = {}): ThemeTokenState {
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

function assertValidCss(css: string, context: string): void {
	const result = validateCss(css);
	assert.ok(result.ok, `${context} produced invalid CSS:\n${formatIssues(result.issues)}`);
}

test('TAB_DEFINITIONS does not include the layout tab to keep UI streamlined', () => {
	const layoutTab = TAB_DEFINITIONS.find((t) => (t.id as string) === 'layout');
	assert.equal(layoutTab, undefined, 'Expected layout tab to not exist in TAB_DEFINITIONS');
});

test('Layout Mods controls are categorized under elements tab with subcategory Layout Mods', () => {
	const layoutMods = STYLE_CONTROLS.filter((c) => c.subcategory === 'Layout Mods');
	assert.equal(layoutMods.length, 6, 'Expected 6 Layout Mods controls');
	for (const ctrl of layoutMods) {
		assert.equal(ctrl.category, 'elements');
		if (ctrl.type === 'toggle') {
			assert.equal(ctrl.defaultDarkValue, 'false', `Control ${ctrl.id} default dark value must be 'false'`);
			assert.equal(ctrl.defaultLightValue, 'false', `Control ${ctrl.id} default light value must be 'false'`);
			assert.equal(ctrl.toggleTrueValue, 'true', `Control ${ctrl.id} toggleTrueValue must be 'true'`);
			assert.equal(ctrl.toggleFalseValue, 'false', `Control ${ctrl.id} toggleFalseValue must be 'false'`);
			assert.ok(ctrl.companionCss, `Control ${ctrl.id} must carry companion CSS`);
			assertValidCss(ctrl.companionCss, `Companion CSS for ${ctrl.id}`);
		}
	}
	const ids = layoutMods.map((c) => c.id);
	assert.ok(ids.includes('layout-vertical-tabs'));
	assert.ok(ids.includes('layout-vertical-tabs-width'));
	assert.ok(ids.includes('layout-autohide-statusbar'));
	assert.ok(ids.includes('layout-floating-statusbar'));
	assert.ok(ids.includes('layout-minimalism'));
	assert.ok(ids.includes('checkbox-style'));

	const widthSlider = STYLE_CONTROLS.find((c) => c.id === 'layout-vertical-tabs-width');
	assert.ok(widthSlider, 'Expected layout-vertical-tabs-width slider to exist');
	assert.equal(widthSlider.type, 'slider');
	assert.equal(widthSlider.defaultDarkValue, '32px');
	assert.equal(widthSlider.defaultLightValue, '32px');
	assert.equal(widthSlider.min, 24);
	assert.equal(widthSlider.max, 120);
	assert.equal(widthSlider.step, 1);
	assert.equal(widthSlider.unit, 'px');
});

test('vertical tabs, autohide statusbar, floating statusbar, and minimalism controls exist with valid companion CSS', () => {
	const verticalTabs = STYLE_CONTROLS.find((c) => c.id === 'layout-vertical-tabs');
	assert.ok(verticalTabs, 'Expected layout-vertical-tabs control');
	assert.ok(verticalTabs.companionCss?.includes('.workspace-tab-header-container'));
	assert.ok(verticalTabs.companionCss?.includes('writing-mode: vertical-rl'));
	assert.ok(verticalTabs.companionCss?.includes('.workspace-tab-header-inner-icon'));
	assert.ok(verticalTabs.companionCss?.includes('scrollbar-width: none'));
	assert.ok(verticalTabs.companionCss?.includes('::-webkit-scrollbar'));
	assert.ok(verticalTabs.companionCss?.includes('.workspace-tab-header-new-tab'));
	assert.ok(verticalTabs.companionCss?.includes('var(--tab-background-active)'));
	assert.ok(verticalTabs.companionCss?.includes('.sidebar-toggle-button.mod-right'));
	assert.ok(verticalTabs.companionCss?.includes('-webkit-app-region: drag'));
	assert.ok(verticalTabs.companionCss?.includes('var(--header-height'));
	assert.ok(verticalTabs.companionCss?.includes('.view-header-title-container'));
	assert.ok(verticalTabs.companionCss?.includes('.view-actions'));
	assert.ok(verticalTabs.companionCss?.includes('margin-left: var(--layout-vertical-tabs-width, 32px)'));
	assert.ok(verticalTabs.companionCss?.includes('scrollbar-color: transparent transparent'));
	assert.ok(verticalTabs.companionCss?.includes('--tab-indicator-color: transparent'));
	assert.ok(verticalTabs.companionCss?.includes('box-shadow: none !important'));
	assert.ok(verticalTabs.companionCss?.includes('font-size: var(--font-ui-size, 13px) !important'));
	assert.ok(verticalTabs.companionCss?.includes('.workspace-tab-header:not(.is-active) .workspace-tab-header-inner-close-button'));
	assert.ok(verticalTabs.companionCss?.includes('.workspace-tab-header:not(.is-active):hover .workspace-tab-header-inner-close-button'));
	assert.ok(verticalTabs.companionCss?.includes('z-index: 10000 !important'));
	// The rail must outrank the tab content (z-index 1) but stay below
	// Obsidian's tooltip/menu layers, or it paints over tab and nav hover
	// tooltips and clips their descriptive text.
	assert.ok(verticalTabs.companionCss?.includes('z-index: 10 !important'));
	assert.ok(!verticalTabs.companionCss?.includes('z-index: 9999 !important'));
	assert.ok(verticalTabs.companionCss?.includes('width: 32px !important'));
	assert.ok(verticalTabs.companionCss?.includes('height: 32px !important'));
	assert.ok(verticalTabs.companionCss?.includes('width: 18px !important'));
	assert.ok(verticalTabs.companionCss?.includes('.sidebar-toggle-button.mod-right *'));
	assert.ok(verticalTabs.companionCss?.includes('.workspace-tab-header-tab-list *'));

	const autohideStatus = STYLE_CONTROLS.find((c) => c.id === 'layout-autohide-statusbar');
	assert.ok(autohideStatus, 'Expected layout-autohide-statusbar control');
	assert.ok(autohideStatus.companionCss?.includes('.status-bar'));
	assert.ok(autohideStatus.companionCss?.includes('.status-bar::after'));
	assert.ok(autohideStatus.companionCss?.includes('.status-bar:hover'));
	assert.ok(!autohideStatus.companionCss?.includes('.app-container:hover .status-bar'));
	assert.ok(!autohideStatus.companionCss?.includes('body:hover'));
	assert.ok(autohideStatus.companionCss?.includes(':focus-within'));

	const floatingStatus = STYLE_CONTROLS.find((c) => c.id === 'layout-floating-statusbar');
	assert.ok(floatingStatus, 'Expected layout-floating-statusbar control');
	assert.ok(floatingStatus.companionCss?.includes('.status-bar'));

	const minimalism = STYLE_CONTROLS.find((c) => c.id === 'layout-minimalism');
	assert.ok(minimalism, 'Expected layout-minimalism control');
	assert.ok(minimalism.companionCss?.includes('.workspace-tab-header-container'));
	assert.ok(minimalism.companionCss?.includes('.titlebar'));
	assert.ok(minimalism.companionCss?.includes('.view-header'));
	assert.ok(minimalism.companionCss?.includes('.status-bar'));
	assert.ok(minimalism.companionCss?.includes('.status-bar-item'));
	assert.ok(minimalism.companionCss?.includes('border-radius: 9999px'));
	assert.ok(minimalism.companionCss?.includes('.workspace-tab-header.is-active'));
	assert.ok(minimalism.companionCss?.includes('button:not(.clickable-icon)'));
	assert.ok(minimalism.companionCss?.includes('.search-input-container'));
	assert.ok(minimalism.companionCss?.includes('.sidebar-toggle-button'));
	assert.ok(minimalism.companionCss?.includes('.workspace-ribbon.mod-left'));
	assert.ok(minimalism.companionCss?.includes('--ribbon-width'));
	assert.ok(minimalism.companionCss?.includes('.titlebar-button-container.mod-right'));
	assert.ok(minimalism.companionCss?.includes('.titlebar-button'));
	assert.ok(minimalism.companionCss?.includes('border-radius: var(--radius-s, 4px)'));
	assert.ok(minimalism.companionCss?.includes('.workspace-split.mod-left-split .workspace-tab-header-new-tab'));
	assert.ok(minimalism.companionCss?.includes('.workspace-tab-header-spacer'));
	assert.ok(minimalism.companionCss?.includes('.sidebar-toggle-button.mod-right'));
	assert.ok(minimalism.companionCss?.includes('.workspace-split.mod-left-split .workspace-tab-header-container'));
	assert.ok(minimalism.companionCss?.includes('.workspace-tabs.mod-top-left-space'));
	assert.ok(minimalism.companionCss?.includes('-webkit-app-region: no-drag'));
	assert.ok(minimalism.companionCss?.includes('.side-dock-actions'));
	assert.ok(minimalism.companionCss?.includes('margin-right: calc(var(--frame-right-space, 138px) + 8px)'));
	assert.ok(minimalism.companionCss?.includes('body.mod-windows .titlebar-button'));
	assert.ok(
		minimalism.companionCss?.includes('margin-top: 0 !important; margin-bottom: 0 !important;'),
		'must reset the tab strip inner vertical margins so the pill is not clipped'
	);
});

test('enabling layout mods produces valid generated stylesheet', () => {
	const layoutMods = STYLE_CONTROLS.filter((c) => c.subcategory === 'Layout Mods');

	// Enable every layout toggle and set width slider override
	const overrides: Record<string, string> = {};
	for (const ctrl of layoutMods) {
		if (ctrl.type === 'toggle') {
			overrides[ctrl.variable] = 'true';
		} else if (ctrl.type === 'slider') {
			overrides[ctrl.variable] = '48px';
		}
	}

	const state = createSeedState(overrides);
	const css = buildGeneratedCss(state);

	assertValidCss(css, 'Generated stylesheet with all layout mods enabled');
	assert.ok(css.includes('--layout-vertical-tabs-width: 48px'), 'Expected width slider token to be present');

	// Verify that each feature companion CSS is present in the output
	for (const ctrl of layoutMods) {
		if (ctrl.companionCss) {
			assert.ok(
				css.includes(ctrl.companionCss.trim().substring(0, 30)),
				`Expected generated CSS to include binding for ${ctrl.id}`
			);
		}
	}
});

test('seamless minimalism coordinates transparent titlebar, window controls, and status bar with custom background', () => {
	const state = createSeedState({
		'--ui-bg-enabled': 'true',
		'--ui-bg-style': 'matrix',
		'--ui-bg-scope': 'workspace',
		'--layout-minimalism': 'true',
	});
	const bgCss = generateCustomBackgroundCss('.theme-dark', state);
	assertValidCss(bgCss, 'generateCustomBackgroundCss with minimalism and workspace scope');

	// Background pattern attaches to app-container for full window coverage
	assert.ok(bgCss.includes('.app-container'), 'Custom background must target .app-container');

	// Titlebar and window controls must be transparent and clickable (no-drag)
	assert.ok(bgCss.includes('.titlebar-button-container'), 'Must target .titlebar-button-container');
	assert.ok(bgCss.includes('.titlebar-button-container.mod-right'), 'Must target .titlebar-button-container.mod-right');
	assert.ok(bgCss.includes('-webkit-app-region: no-drag'), 'Window controls must have no-drag in minimalism mode');
	assert.ok(bgCss.includes('pointer-events: auto'), 'Window controls must have pointer-events: auto in minimalism mode');

	// Status bar must be transparent, not solid background-secondary
	assert.ok(
		!bgCss.includes('.status-bar {\n  background-color: var(--background-secondary'),
		'Must not force solid background-secondary onto status bar in minimalism mode'
	);
});
