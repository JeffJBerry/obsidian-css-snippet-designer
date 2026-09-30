import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
	CURATED_DARK_PRESETS,
	CURATED_LIGHT_PRESETS,
	backgroundTokens,
	presetBackdrop,
	presetPreviewColors,
} from '../src/presets';
import type { CuratedPreset, UserSavedPreset } from '../src/presets';
import { BACKGROUND_PATTERN_OPTIONS, TAB_DEFINITIONS } from '../src/schema';
import { validateCss, formatIssues } from '../src/engine';
import { isKnownBackgroundPattern } from '../src/css/background';
import { generateCustomBackgroundCss } from '../src/css/ui-elements';
import type { ThemeTokenState } from '../src/css/ui-elements';

test('TAB_DEFINITIONS puts presets at index 0 on the far left', () => {
	assert.equal(TAB_DEFINITIONS[0]?.id, 'presets');
	assert.equal(TAB_DEFINITIONS[0]?.label, 'Presets');
	assert.equal(TAB_DEFINITIONS[0]?.icon, 'sparkles');
});

test('curated dark presets have complete metadata and preview swatches', () => {
	assert.ok(CURATED_DARK_PRESETS.length >= 4);
	for (const preset of CURATED_DARK_PRESETS) {
		assert.ok(preset.id.length > 0);
		assert.ok(preset.name.length > 0);
		assert.ok(preset.description.length > 0 && preset.description.length <= 100);
		assert.equal(preset.category, 'dark');
		assert.equal(preset.targetTheme, 'obsidian');
		assert.ok(preset.previewColors.length >= 3);
		assert.ok(preset.darkTokens && Object.keys(preset.darkTokens).length > 0);
	}
});

test('curated light presets have complete metadata and preview swatches', () => {
	assert.ok(CURATED_LIGHT_PRESETS.length >= 2);
	for (const preset of CURATED_LIGHT_PRESETS) {
		assert.ok(preset.id.length > 0);
		assert.ok(preset.name.length > 0);
		assert.ok(preset.description.length > 0 && preset.description.length <= 100);
		assert.equal(preset.category, 'light');
		assert.equal(preset.targetTheme, 'moonstone');
		assert.ok(preset.previewColors.length >= 3);
		assert.ok(preset.lightTokens && Object.keys(preset.lightTokens).length > 0);
	}
});

test('a curated preset previews the primary, secondary and accent colours it actually applies', () => {
	for (const preset of [...CURATED_DARK_PRESETS, ...CURATED_LIGHT_PRESETS]) {
		const tokens = (preset.category === 'dark' ? preset.darkTokens : preset.lightTokens) ?? {};
		const colors = presetPreviewColors(preset);
		assert.equal(colors.length, 4);
		assert.equal(colors[0], tokens['--background-primary'], `${preset.id} primary background swatch`);
		assert.equal(colors[1], tokens['--background-secondary'], `${preset.id} secondary background swatch`);
		assert.equal(colors[2], tokens['--text-accent'], `${preset.id} accent swatch`);
		assert.equal(
			colors[3],
			tokens['--text-accent-2'] ?? tokens['--text-accent'],
			`${preset.id} secondary accent swatch`
		);
	}
});

test('a user-saved preset keeps the palette it captured', () => {
	const saved: UserSavedPreset = {
		id: 'u1',
		name: 'Mine',
		savedAt: 1,
		darkTokens: { '--background-primary': '#000000', '--text-accent': '#ffffff' },
		lightTokens: {},
		previewColors: ['#000000', '#ffffff', '#888888'],
	};
	assert.deepEqual(presetPreviewColors(saved), ['#000000', '#ffffff', '#888888']);
});

test('all curated presets generate syntactically valid CSS token blocks', () => {
	for (const preset of CURATED_DARK_PRESETS) {
		let css = '.theme-dark {\n';
		if (preset.darkTokens) {
			for (const [k, v] of Object.entries(preset.darkTokens)) {
				css += `  ${k}: ${v};\n`;
			}
		}
		css += '}\n';
		const result = validateCss(css);
		assert.equal(result.ok, true, `Preset ${preset.name} dark CSS invalid: ${JSON.stringify(result.issues)}`);
	}

	for (const preset of CURATED_LIGHT_PRESETS) {
		let css = '.theme-light {\n';
		if (preset.lightTokens) {
			for (const [k, v] of Object.entries(preset.lightTokens)) {
				css += `  ${k}: ${v};\n`;
			}
		}
		css += '}\n';
		const result = validateCss(css);
		assert.equal(result.ok, true, `Preset ${preset.name} light CSS invalid: ${JSON.stringify(result.issues)}`);
	}
});

const ALL_CURATED: CuratedPreset[] = [...CURATED_DARK_PRESETS, ...CURATED_LIGHT_PRESETS];

test('curated themes have valid canvas backdrops when specified', () => {
	for (const preset of ALL_CURATED) {
		if (!preset.background) continue;
		assert.ok(preset.background.style, `${preset.name} has empty backdrop style`);
	}
});

test('backdrops name a pattern the picker actually offers', () => {
	const listed = new Set(BACKGROUND_PATTERN_OPTIONS.map((o) => o.value));
	for (const preset of ALL_CURATED) {
		const style = preset.background?.style;
		if (!style) continue;
		// Two independent checks: the builder registry, and the visible picker.
		// A style missing from either would silently fall back to dot-grid.
		assert.ok(isKnownBackgroundPattern(style), `${preset.name} names an unregistered pattern "${style}"`);
		assert.ok(listed.has(style), `${preset.name} names "${style}", which the picker does not list`);
	}
});

test('backdrop sizing and opacity stay inside the slider ranges', () => {
	for (const preset of ALL_CURATED) {
		const bg = preset.background;
		if (!bg) continue;
		assert.ok(bg.size >= 8 && bg.size <= 200, `${preset.name} tile size ${bg.size} is off the slider`);
		// Backdrop opacity must stay within the slider bounds (0.01 - 1.0).
		assert.ok(bg.opacity > 0 && bg.opacity <= 1.0, `${preset.name} backdrop opacity ${bg.opacity} is off the slider`);
		assert.match(bg.color, /^#[0-9a-f]{6}$/i, `${preset.name} backdrop colour is not a hex value`);
		if (bg.color2) assert.match(bg.color2, /^#[0-9a-f]{6}$/i, `${preset.name} second backdrop colour is not a hex value`);
	}
});

test('the expander emits exactly the tokens the background generator reads', () => {
	const tokens = backgroundTokens({ style: 'seigaiha', size: 22, opacity: 0.22, color: '#f472b6', color2: '#db2777' });
	assert.deepEqual(tokens, {
		'--ui-bg-enabled': 'true',
		'--ui-bg-flipbook': 'none',
		'--ui-bg-flipbook-enabled': 'true',
		'--ui-bg-style': 'seigaiha',
		'--ui-bg-scope': 'editor',
		'--ui-bg-size': '22px',
		'--ui-bg-opacity': '0.22',
		'--ui-bg-color': '#f472b6',
		'--ui-bg-gradient': 'true',
		'--ui-bg-color-2': '#db2777',
		'--ui-bg-motion-animation': 'none',
		'--ui-bg-color-animation': 'none',
		'--ui-bg-animation': 'none',
	});

	const solid = backgroundTokens({ style: 'dot-grid', size: 24, opacity: 0.16, color: '#4f46e5' });
	assert.equal(solid['--ui-bg-gradient'], 'false');
	assert.equal(solid['--ui-bg-color-2'], '#4f46e5');
});

test('every curated backdrop renders valid background css', () => {
	for (const preset of ALL_CURATED) {
		if (!preset.background) continue;
		const mode = preset.category === 'light' ? '.theme-light' : '.theme-dark';
		const tokens = new Map(Object.entries(backgroundTokens(preset.background)));
		const state: ThemeTokenState = {
			darkTokens: mode === '.theme-dark' ? tokens : new Map(),
			lightTokens: mode === '.theme-light' ? tokens : new Map(),
			darkEnabled: new Map(),
			lightEnabled: new Map(),
		};
		const css = generateCustomBackgroundCss(mode, state);
		assert.match(css, /background-image:/, `${preset.name} produced no background layer`);
		const result = validateCss(css);
		assert.ok(result.ok, `${preset.name} produced malformed background CSS:\n${formatIssues(result.issues)}`);
	}
});

test('a user-saved preset leaves its captured --ui-bg-* tokens untouched', () => {
	const userPreset: UserSavedPreset = {
		id: 'user-preset-1',
		name: 'Glass Window',
		savedAt: 1,
		darkTokens: { '--ui-bg-enabled': 'true', '--ui-bg-style': 'rainfall' },
		lightTokens: {},
		previewColors: ['#15171c', '#82ac95', '#82ac95', '#232731'],
	};
	// `undefined` means applyPreset must neither expand nor clear the backdrop:
	// the captured tokens already describe it, and forcing `--ui-bg-enabled`
	// off here is what used to strip a saved preset's pattern.
	assert.equal(presetBackdrop(userPreset), undefined);
});

test('a curated preset without a backdrop asks applyPreset to switch the background off', () => {
	const curated: CuratedPreset = {
		id: 'no-backdrop',
		name: 'No Backdrop',
		description: 'A palette that declares no canvas pattern.',
		category: 'dark',
		targetTheme: 'obsidian',
		previewColors: ['#000000', '#ffffff', '#888888'],
		darkTokens: { '--background-primary': '#000000' },
	};
	assert.equal(presetBackdrop(curated), null);
});

test('a curated preset with a backdrop returns it for token expansion', () => {
	const background = { style: 'rainfall', size: 34, opacity: 0.04, color: '#82ac95' };
	const curated: CuratedPreset = {
		id: 'with-backdrop',
		name: 'With Backdrop',
		description: 'A palette that declares a canvas pattern.',
		category: 'dark',
		targetTheme: 'obsidian',
		previewColors: ['#000000', '#ffffff', '#888888'],
		darkTokens: { '--background-primary': '#000000' },
		background,
	};
	assert.deepEqual(presetBackdrop(curated), background);
});

test('UserSavedPreset structure supports preserving enabled states', () => {
	const userPreset = {
		id: 'user-preset-123',
		name: 'Custom Theme',
		savedAt: Date.now(),
		darkTokens: { '--text-accent': '#a855f7', '--font-family': 'Inter' },
		lightTokens: { '--text-accent': '#7c3aed', '--font-family': 'Inter' },
		darkEnabled: { '--text-accent': true, '--font-family': false },
		lightEnabled: { '--text-accent': true, '--font-family': true },
		previewColors: ['#1e1e1e', '#a855f7', '#a855f7', '#363636'],
	};

	assert.equal(userPreset.darkEnabled['--font-family'], false);
	assert.equal(userPreset.darkEnabled['--text-accent'], true);
	assert.equal(userPreset.lightEnabled['--font-family'], true);
});

test('presets with nav-box-enabled explicitly define solid body style and non-purple borders', () => {
	for (const preset of ALL_CURATED) {
		const tokens = preset.darkTokens ?? preset.lightTokens;
		if (!tokens || tokens['--nav-box-enabled'] !== 'true') continue;
		if (tokens['--nav-box-body-style']) {
			assert.notEqual(tokens['--nav-box-body-style'], 'gradient', `${preset.name} should not default to a gradient nav-box`);
		}
		if (tokens['--nav-box-border-color']) {
			assert.notEqual(tokens['--nav-box-border-color'], '#7c3aed', `${preset.name} has purple nav-box border`);
		}
	}
});

