import { test } from 'node:test';
import assert from 'node:assert/strict';
import { STYLE_CONTROLS } from '../src/schema';
import { validateCss, formatIssues } from '../src/engine';

function assertValid(css: string, label: string): void {
	const result = validateCss(css);
	assert.ok(result.ok, `${label} produced malformed CSS:\n${formatIssues(result.issues)}`);
}

test('nav-box-enabled companionCss exists and is valid CSS', () => {
	const ctrl = STYLE_CONTROLS.find((c) => c.variable === '--nav-box-enabled');
	assert.ok(ctrl, 'Control --nav-box-enabled must exist');
	assert.ok(ctrl.companionCss, 'Control --nav-box-enabled must have companionCss');
	assertValid(ctrl.companionCss, 'nav-box companionCss');
});

test('nav-box companionCss targets core directory items 1 to 24 with nth-child', () => {
	const ctrl = STYLE_CONTROLS.find((c) => c.variable === '--nav-box-enabled');
	assert.ok(ctrl?.companionCss);

	for (let i = 1; i <= 24; i++) {
		assert.ok(
			ctrl.companionCss.includes(`:nth-child(${i})`),
			`Expected companionCss to target :nth-child(${i})`
		);
		assert.ok(
			ctrl.companionCss.includes(`--nav-box-item-${i}-bg`),
			`Expected companionCss to reference --nav-box-item-${i}-bg`
		);
	}
});

test('nav-box companionCss isolates subfolders and disables gradient bleeding', () => {
	const ctrl = STYLE_CONTROLS.find((c) => c.variable === '--nav-box-enabled');
	assert.ok(ctrl?.companionCss);

	// Ensures subfolders are specifically matched
	assert.ok(
		ctrl.companionCss.includes('.nav-folder-children .nav-folder-children'),
		'Expected subfolder selector .nav-folder-children .nav-folder-children'
	);
	assert.ok(
		ctrl.companionCss.includes('.tree-item-children'),
		'Expected tree item children selector'
	);

	// Ensures background-image: none !important is applied so gradient does not bleed
	assert.ok(
		ctrl.companionCss.includes('background-image: none !important'),
		'Expected background-image: none !important to prevent gradient bleeding into subfolders'
	);

	// Ensures subfolder display tokens are referenced
	assert.ok(
		ctrl.companionCss.includes('--nav-box-subfolder-bg-display'),
		'Expected --nav-box-subfolder-bg-display'
	);
	assert.ok(
		ctrl.companionCss.includes('--nav-box-subfolder-border-display'),
		'Expected --nav-box-subfolder-border-display'
	);
});

test('nav-box companionCss adheres to Obsidian selector scoping', () => {
	const ctrl = STYLE_CONTROLS.find((c) => c.variable === '--nav-box-enabled');
	assert.ok(ctrl?.companionCss);

	// Check that selectors are anchored to nav containers and not bare tags
	const lines = ctrl.companionCss.split('\n');
	for (const line of lines) {
		const trimmed = line.trim();
		if (trimmed.endsWith('{')) {
			const selector = trimmed.slice(0, -1).trim();
			// Must not be a bare tag like 'div {' or 'span {'
			assert.ok(
				selector.includes('.nav-') || selector.includes('.tree-item'),
				`Selector should be scoped: ${selector}`
			);
		}
	}
});

test('nav-box base rule applies surface fill and box properties to all nav items', () => {
	const ctrl = STYLE_CONTROLS.find((c) => c.variable === '--nav-box-enabled');
	assert.ok(ctrl?.companionCss);

	assert.ok(
		ctrl.companionCss.includes('background-color: var(--nav-box-bg-display, transparent) !important'),
		'Base rule must apply --nav-box-bg-display so surface fill renders'
	);
	assert.ok(
		ctrl.companionCss.includes('border: var(--nav-box-border-display, 1px solid transparent) !important'),
		'Base rule must apply --nav-box-border-display'
	);
	assert.ok(
		ctrl.companionCss.includes('margin: var(--nav-box-margin-display, 0px) !important'),
		'Base rule must apply --nav-box-margin-display'
	);
});
