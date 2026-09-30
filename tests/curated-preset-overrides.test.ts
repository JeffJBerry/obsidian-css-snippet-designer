import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
	backgroundTokens,
	CURATED_DARK_PRESETS,
	CURATED_LIGHT_PRESETS,
	effectiveCuratedPresets,
	presetBackgroundFromTokens,
} from '../src/presets';
import type { CuratedPresetOverride, PresetBackground } from '../src/presets';

/**
 * Covers the presets-tab "temporary trash and save" tools: per-id overrides
 * and deletions layered onto the built-in curated lists, without ever
 * mutating CURATED_DARK_PRESETS/CURATED_LIGHT_PRESETS themselves - those
 * arrays are asserted against directly in tests/presets.test.ts, so a bug
 * that let the merge write through to the originals would silently poison
 * every other preset test that runs after this one in the same process.
 */

function snapshot<T>(value: T): T {
	return JSON.parse(JSON.stringify(value));
}

test('with no overrides or deletions, the effective list is identical in content to the raw list', () => {
	const effective = effectiveCuratedPresets(CURATED_DARK_PRESETS, undefined, undefined);
	assert.deepEqual(effective, CURATED_DARK_PRESETS);
	assert.notEqual(effective, CURATED_DARK_PRESETS, 'should be a new array, not the same reference');
});

test('a deleted id is absent from the effective list but still present in the raw array', () => {
	const before = snapshot(CURATED_DARK_PRESETS);
	const targetId = CURATED_DARK_PRESETS[0]!.id;

	const effective = effectiveCuratedPresets(CURATED_DARK_PRESETS, undefined, [targetId]);

	assert.equal(effective.find((p) => p.id === targetId), undefined);
	assert.equal(effective.length, CURATED_DARK_PRESETS.length - 1);
	assert.deepEqual(CURATED_DARK_PRESETS, before, 'raw array must be untouched by a deletion');
});

test('an override replaces name, description, colors and previewColors without touching the raw preset', () => {
	const before = snapshot(CURATED_DARK_PRESETS);
	const target = CURATED_DARK_PRESETS[0]!;

	const overrides: Record<string, CuratedPresetOverride> = {
		[target.id]: {
			name: 'My Renamed Theme',
			description: 'A description I wrote myself.',
			darkTokens: { '--background-primary': '#000000' },
			previewColors: ['#000000', '#111111', '#222222', '#333333'],
		},
	};

	const effective = effectiveCuratedPresets(CURATED_DARK_PRESETS, overrides, undefined);
	const merged = effective.find((p) => p.id === target.id);

	assert.ok(merged);
	assert.equal(merged!.name, 'My Renamed Theme');
	assert.equal(merged!.description, 'A description I wrote myself.');
	assert.deepEqual(merged!.darkTokens, { '--background-primary': '#000000' });
	assert.deepEqual(merged!.previewColors, ['#000000', '#111111', '#222222', '#333333']);

	// Unrelated fields carry over from the base preset untouched.
	assert.equal(merged!.category, target.category);
	assert.equal(merged!.targetTheme, target.targetTheme);
	assert.deepEqual(merged!.background, target.background);

	assert.deepEqual(CURATED_DARK_PRESETS, before, 'raw array must be untouched by an override');
	assert.notEqual(merged, target, 'the effective entry must be a new object, not the original preset');
});

test('an override that only sets a name leaves description and tokens falling back to the base preset', () => {
	const target = CURATED_DARK_PRESETS[0]!;
	const overrides: Record<string, CuratedPresetOverride> = {
		[target.id]: { name: 'Just A Rename' },
	};

	const effective = effectiveCuratedPresets(CURATED_DARK_PRESETS, overrides, undefined);
	const merged = effective.find((p) => p.id === target.id)!;

	assert.equal(merged.name, 'Just A Rename');
	assert.equal(merged.description, target.description);
	assert.deepEqual(merged.darkTokens, target.darkTokens);
});

test('overriding a light preset never invents a darkTokens field it never had', () => {
	const target = CURATED_LIGHT_PRESETS[0]!;
	assert.equal(target.darkTokens, undefined, 'test assumption: light presets carry lightTokens only');

	const overrides: Record<string, CuratedPresetOverride> = {
		[target.id]: { lightTokens: { '--background-primary': '#ffffff' } },
	};
	const effective = effectiveCuratedPresets(CURATED_LIGHT_PRESETS, overrides, undefined);
	const merged = effective.find((p) => p.id === target.id)!;

	assert.deepEqual(merged.lightTokens, { '--background-primary': '#ffffff' });
	assert.equal(merged.darkTokens, undefined);
});

test('an id with both an override and a deletion is dropped, not merged', () => {
	const target = CURATED_DARK_PRESETS[0]!;
	const overrides: Record<string, CuratedPresetOverride> = {
		[target.id]: { name: 'Should Not Appear' },
	};
	const effective = effectiveCuratedPresets(CURATED_DARK_PRESETS, overrides, [target.id]);
	assert.equal(effective.find((p) => p.id === target.id), undefined);
});

test('deletions and overrides for one category never affect the other', () => {
	const darkTarget = CURATED_DARK_PRESETS[0]!;
	const lightTarget = CURATED_LIGHT_PRESETS[0]!;
	const overrides: Record<string, CuratedPresetOverride> = {
		[darkTarget.id]: { name: 'Dark Only Rename' },
	};
	const deletedIds = [darkTarget.id];

	const effectiveLight = effectiveCuratedPresets(CURATED_LIGHT_PRESETS, overrides, deletedIds);
	assert.equal(effectiveLight.length, CURATED_LIGHT_PRESETS.length);
	assert.equal(effectiveLight.find((p) => p.id === lightTarget.id)!.name, lightTarget.name);
});

test('a live backdrop round-trips through tokens and back', () => {
	const simple: PresetBackground = { style: 'dot-grid', size: 24, opacity: 0.35, color: '#ffffff' };
	assert.deepEqual(presetBackgroundFromTokens(new Map(Object.entries(backgroundTokens(simple)))), simple);

	const full: PresetBackground = {
		style: 'seigaiha',
		size: 22,
		opacity: 0.24,
		color: '#f9a8d4',
		color2: '#7c3aed',
		scope: 'workspace',
		motionAnimation: 'side-scroll',
		angle: 200,
	};
	assert.deepEqual(presetBackgroundFromTokens(new Map(Object.entries(backgroundTokens(full)))), full);
});

test('a disabled background captures as an explicit "no backdrop" instead of a style', () => {
	const tokens = new Map(Object.entries({ ...backgroundTokens({ style: 'dot-grid', size: 24, opacity: 0.35, color: '#fff' }), '--ui-bg-enabled': 'false' }));
	assert.equal(presetBackgroundFromTokens(tokens), null);
});

test('overwriting a preset replaces its base backdrop with the captured one', () => {
	const target = CURATED_DARK_PRESETS[0]!;
	const captured: PresetBackground = { style: 'paper-grain', size: 30, opacity: 0.2, color: '#d4af37' };
	const overrides: Record<string, CuratedPresetOverride> = {
		[target.id]: { darkTokens: { '--background-primary': '#000000' }, background: captured },
	};

	const merged = effectiveCuratedPresets(CURATED_DARK_PRESETS, overrides, undefined).find((p) => p.id === target.id)!;
	assert.deepEqual(merged.background, captured);
});

test('a null backdrop override clears the base backdrop', () => {
	const target = CURATED_DARK_PRESETS.find((p) => Boolean(p.background))!;
	assert.ok(target?.background, 'test assumption: at least one dark preset carries a backdrop');
	const overrides: Record<string, CuratedPresetOverride> = {
		[target.id]: { background: null },
	};

	const merged = effectiveCuratedPresets(CURATED_DARK_PRESETS, overrides, undefined).find((p) => p.id === target.id)!;
	assert.equal(merged.background, undefined);
});
