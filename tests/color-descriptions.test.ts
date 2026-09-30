import { test } from 'node:test';
import assert from 'node:assert/strict';
import { STYLE_CONTROLS } from '../src/schema';

test('colors tab controls omit redundant descriptions and keep informative ones', () => {
	const colorControls = STYLE_CONTROLS.filter((c) => c.category === 'colors');
	assert.equal(colorControls.length, 67, 'Expected 67 color controls');

	const expectedWithDesc = new Map<string, string>([
		['text-accent', 'Accent for links, buttons, and active states'],
		['text-accent-2', 'Secondary accent for muted text and secondary icons'],
		['background-primary', 'Editor and reading view background'],
		['background-secondary', 'Sidebars, tabs, and modal background'],
		['hover-highlight', 'Hover tint for lists and buttons'],
		['nav-box-enabled', 'Wrap file and folder rows in box containers'],
	]);

	const controlsWithDesc = colorControls.filter((c) => c.description !== undefined);
	assert.equal(controlsWithDesc.length, 6, 'Exactly 6 color controls should have descriptions');

	for (const ctrl of colorControls) {
		if (expectedWithDesc.has(ctrl.id)) {
			assert.equal(
				ctrl.description,
				expectedWithDesc.get(ctrl.id),
				`Expected description for ${ctrl.id}`
			);
		} else {
			assert.equal(
				ctrl.description,
				undefined,
				`Control ${ctrl.id} should not have a redundant description`
			);
		}
	}
});

test('tag pills controls do not carry redundant descriptions', () => {
	const tagControls = STYLE_CONTROLS.filter((c) => c.subcategory === 'Tag Pills');
	assert.equal(tagControls.length, 6, 'Expected 6 tag pills controls');

	for (const ctrl of tagControls) {
		assert.equal(
			ctrl.description,
			undefined,
			`Control ${ctrl.id} in Tag Pills should not have redundant description`
		);
	}
});

test('checkboxes and tasks controls do not carry redundant descriptions', () => {
	const checkboxControls = STYLE_CONTROLS.filter((c) => c.subcategory === 'Checkboxes & Tasks');
	assert.equal(checkboxControls.length, 5, 'Expected 5 checkboxes & tasks controls');

	for (const ctrl of checkboxControls) {
		assert.equal(
			ctrl.description,
			undefined,
			`Control ${ctrl.id} in Checkboxes & Tasks should not have redundant description`
		);
	}
});

test('general elements, status bar, tabs & navigation, and context menus controls do not carry redundant descriptions', () => {
	const targetSubcategories = ['Status Bar', 'Context Menus', 'Tabs & Navigation'];
	const subControls = STYLE_CONTROLS.filter((c) => c.subcategory && targetSubcategories.includes(c.subcategory));
	for (const ctrl of subControls) {
		assert.equal(
			ctrl.description,
			undefined,
			`Control ${ctrl.id} in ${ctrl.subcategory} should not have redundant description`
		);
	}

	const generalControls = STYLE_CONTROLS.filter((c) => c.category === 'elements' && !c.subcategory);
	for (const ctrl of generalControls) {
		assert.equal(
			ctrl.description,
			undefined,
			`Control ${ctrl.id} in General Elements should not have redundant description`
		);
	}
});


