import { test } from 'node:test';
import assert from 'node:assert/strict';
import { STYLE_CONTROLS, UI_ELEMENTS, SHADOW_ELEMENTS } from '../src/schema';
import { buildGeneratedCss, buildCompanionBindings } from '../src/snippet/persist';
import { scopeCssBlock, filterCssBlockToMode } from '../src/css/selectors';
import { validateCss, formatIssues } from '../src/engine';
import type { ThemeTokenState } from '../src/css/ui-elements';

/**
 * The snippet is an output, not a store: it carries what the design renders and
 * nothing else. A freshly reset design enables nothing, so it should produce
 * almost no CSS. What the designer needs in order to restore a design - including
 * settings for features that are switched off - lives in `settings.tokenState`.
 *
 * These tests pin the properties that keep that true, because the failure they
 * guard against is silent: the file simply grows again.
 */

function stockState(overrides: Record<string, string> = {}): ThemeTokenState {
	const darkTokens = new Map<string, string>();
	const lightTokens = new Map<string, string>();
	const darkEnabled = new Map<string, boolean>();
	const lightEnabled = new Map<string, boolean>();

	// resetModeToDefaults() marks every control enabled, which is what made the
	// old generator write the whole schema back out.
	for (const ctrl of STYLE_CONTROLS) {
		darkTokens.set(ctrl.variable, ctrl.defaultDarkValue);
		lightTokens.set(ctrl.variable, ctrl.defaultLightValue);
		darkEnabled.set(ctrl.variable, true);
		lightEnabled.set(ctrl.variable, true);
	}
	for (const el of UI_ELEMENTS) {
		darkTokens.set(`--ui-${el.id}-opacity`, el.defaultOpacityDark);
		lightTokens.set(`--ui-${el.id}-opacity`, el.defaultOpacityLight);
	}
	for (const el of SHADOW_ELEMENTS) {
		for (const tokens of [darkTokens, lightTokens]) {
			tokens.set(`--sh-${el.id}-enabled`, 'false');
			tokens.set(`--sh-${el.id}-outline-enabled`, 'false');
			tokens.set(`--sh-${el.id}-color`, '#ff00ff');
			tokens.set(`--sh-${el.id}-blur`, '12px');
		}
	}
	for (const tokens of [darkTokens, lightTokens]) {
		tokens.set('--ui-bg-enabled', 'false');
		tokens.set('--glass-enabled', 'false');
	}
	for (const [key, value] of Object.entries(overrides)) {
		darkTokens.set(key, value);
		lightTokens.set(key, value);
	}
	return { darkTokens, lightTokens, darkEnabled, lightEnabled };
}

/**
 * The custom properties declared in the `.theme-dark {}` / `.theme-light {}`
 * blocks. Properties set inside a companion rule are a different thing: those
 * are Obsidian's own (`--color-accent`, `--callout-color`), handed to it on the
 * elements it reads them from.
 */
function propertiesDeclaredIn(css: string): Set<string> {
	const declared = new Set<string>();
	for (const mode of ['.theme-dark', '.theme-light']) {
		const start = css.indexOf(`${mode} {`);
		if (start < 0) continue;
		const end = css.indexOf('\n}', start);
		for (const match of css.slice(start, end).matchAll(/^\s*(--[A-Za-z0-9_-]+)\s*:/gm)) {
			const name = match[1];
			if (name) declared.add(name);
		}
	}
	return declared;
}

function propertiesReadIn(css: string): Set<string> {
	const read = new Set<string>();
	for (const match of css.matchAll(/var\(\s*(--[A-Za-z0-9_-]+)/g)) {
		const name = match[1];
		if (name) read.add(name);
	}
	return read;
}

test('a design left entirely at stock defaults produces a near-empty snippet', () => {
	const css = buildGeneratedCss(stockState());
	const lines = css.split('\n').length;
	assert.ok(
		lines < 400,
		`A design that changes nothing should not produce a large stylesheet; got ${lines} lines`
	);
	assert.ok(validateCss(css).ok, 'stock-default snippet must still be valid CSS');
});

test('no custom property is written that nothing reads and nothing changed', () => {
	const css = buildGeneratedCss(stockState({ '--text-accent': '#abcdef' }));
	const read = propertiesReadIn(css);
	const byVariable = new Map(STYLE_CONTROLS.map((c) => [c.variable, c] as const));

	const orphans: string[] = [];
	for (const name of propertiesDeclaredIn(css)) {
		if (read.has(name)) continue;
		const ctrl = byVariable.get(name);
		if (!ctrl) {
			orphans.push(`${name} (belongs to no control)`);
			continue;
		}
		const atStock =
			ctrl.type === 'toggle'
				? ctrl.defaultDarkValue !== (ctrl.toggleTrueValue ?? 'true')
				: true;
		// A control moved off its stock value is legitimately written even when
		// only Obsidian reads it.
		const dark = css.includes(`${name}: ${ctrl.defaultDarkValue};`);
		const light = css.includes(`${name}: ${ctrl.defaultLightValue};`);
		if (atStock && (dark || light) && ctrl.type !== 'toggle') {
			orphans.push(`${name} (unread and still at its stock value)`);
		}
	}
	assert.deepEqual(orphans, [], `unread properties found:\n${orphans.join('\n')}`);
});

test('a switched-off feature contributes neither rules nor settings', () => {
	const css = buildGeneratedCss(stockState());
	for (const el of SHADOW_ELEMENTS) {
		assert.ok(
			!css.includes(`--sh-${el.id}-color:`),
			`a disabled shadow (${el.id}) must not write the colour it would have used`
		);
	}
	assert.ok(!css.includes('--nav-box-bg-display:'), 'disabled nav boxes must not write display tokens');
	assert.ok(!css.includes('--glass-blur:'), 'disabled glass must not write its blur');
});

test('a feature wanted by one theme only is scoped to that theme', () => {
	const state = stockState();
	// Off in dark, on in light.
	state.lightTokens.set('--nav-item-color', '#123456');

	const bindings = buildCompanionBindings(state);
	assert.ok(bindings.length > 0, 'the light-only change must still emit its rule');
	assert.ok(
		!/^\.nav-file-title\b/m.test(bindings),
		'the rule must not be emitted unscoped where only one theme asked for it'
	);
});

test('a block that states more than its token keeps applying to both themes', () => {
	// nav-box carries flat declarations (a transition, background-image: none)
	// that were in force in both themes. Narrowing it would silently change the
	// theme that never switched it on, so it stays unscoped.
	const state = stockState();
	state.lightTokens.set('--nav-box-enabled', 'true');

	const bindings = buildCompanionBindings(state);
	assert.ok(bindings.includes('.nav-file-title'), 'nav-box rules must still be emitted');
	assert.ok(
		!bindings.includes('.theme-light .nav-file-title'),
		'a block with theme-independent declarations must not be narrowed to one theme'
	);
});

test('theme scoping attaches to body rather than descending from it', () => {
	const scoped = scopeCssBlock('.theme-dark', 'body:not(.is-focused) .titlebar {\n  color: red;\n}');
	assert.ok(
		scoped.includes('body.theme-dark:not(.is-focused) .titlebar'),
		`.theme-dark is a class on body, so it must compound with it; got: ${scoped}`
	);
	assert.ok(!scoped.includes('.theme-dark body'), '.theme-dark body would match nothing');
});

test('every companion block survives theme scoping as valid CSS', () => {
	for (const ctrl of STYLE_CONTROLS) {
		if (!ctrl.companionCss) continue;
		for (const scope of ['.theme-dark', '.theme-light']) {
			const result = validateCss(scopeCssBlock(scope, ctrl.companionCss.trim()));
			assert.ok(result.ok, `${ctrl.id} scoped to ${scope} is malformed:\n${formatIssues(result.issues)}`);
		}
	}
});

test('customising anything still reaches the snippet', () => {
	const css = buildGeneratedCss(stockState({ '--text-accent': '#ff0000' }));
	assert.ok(css.includes('--text-accent: #ff0000;'), 'a changed colour must be written');
});

/**
 * The four blocks that used to be emitted unconditionally. Between them they
 * were 213 of the 259 lines a stock design produced - none of it responding to
 * anything the user had touched. Each now has to be asked for.
 */
test('blocks that restate Obsidian defaults are not emitted at stock', () => {
	const css = buildGeneratedCss(stockState());
	assert.ok(!css.includes('task-list-item-checkbox'), 'checkbox markers redraw what Obsidian already draws');
	assert.ok(!css.includes('--callout-color:'), 'callout groups sit on Obsidian\'s own accents');
	assert.ok(!css.includes('.vertical-tab-content .checkbox-container'), 'settings toggles need no protection here');
});

test('each gated block returns the moment its own setting changes', () => {
	const cases: Array<[string, Record<string, string>, string]> = [
		['checkbox style', { '--checkbox-style': 'x' }, 'task-list-item-checkbox'],
		['checkbox marker colour', { '--checkbox-marker-color': '#ff0000' }, 'task-list-item-checkbox'],
		['checkbox size', { '--checkbox-size': '20px' }, 'task-list-item-checkbox'],
		['accent colour', { '--text-accent': '#ff0000' }, '.vertical-tab-content .checkbox-container'],
		['a callout colour', { '--callout-color-warning': '#ff0000' }, '--callout-color:'],
	];
	for (const [label, overrides, marker] of cases) {
		const css = buildGeneratedCss(stockState(overrides));
		assert.ok(css.includes(marker), `changing ${label} must bring back its rules`);
		assert.ok(validateCss(css).ok, `changing ${label} must still produce valid CSS`);
	}
});

test('changing one callout group does not drag in the other seven', () => {
	const css = buildGeneratedCss(stockState({ '--callout-color-warning': '#ff0000' }));
	const types = new Set([...css.matchAll(/data-callout="([a-z]+)"/g)].map((m) => m[1]));
	assert.deepEqual(
		[...types].sort(),
		['attention', 'caution', 'warning'],
		'only the group that changed, and its aliases, should be emitted'
	);
});

test('touching something unrelated leaves every gated block shut', () => {
	const css = buildGeneratedCss(stockState({ '--text-normal': '#abcdef' }));
	for (const marker of ['task-list-item-checkbox', '--callout-color:']) {
		assert.ok(!css.includes(marker), `an unrelated colour change must not emit ${marker}`);
	}
});

test('a theme carries no custom property only the other theme reads', () => {
	// Only light is customised here. Nothing in the dark block should exist to
	// serve a rule that can only match under `.theme-light`.
	const state = stockState();
	state.lightTokens.set('--nav-item-color', '#123456');
	state.lightTokens.set('--menu-item-color', '#654321');

	const css = buildGeneratedCss(state);
	const darkStart = css.indexOf('.theme-dark {');
	const darkBlock = css.slice(darkStart, css.indexOf('\n}', darkStart));
	assert.ok(!darkBlock.includes('--nav-item-color'), 'dark must not carry a colour only light reads');
	assert.ok(!darkBlock.includes('--menu-item-color'), 'dark must not carry a colour only light reads');

	const lightStart = css.indexOf('.theme-light {');
	const lightBlock = css.slice(lightStart, css.indexOf('\n}', lightStart));
	assert.ok(lightBlock.includes('--nav-item-color: #123456;'), 'light must still carry what it reads');
});

test('a block listing both themes in one selector list is split, not duplicated', () => {
	const state = stockState();
	state.lightTokens.set('--menu-item-color', '#654321');

	const bindings = buildCompanionBindings(state);
	assert.ok(bindings.includes('.theme-light .menu-item'), 'the customised theme keeps its selectors');
	assert.ok(
		!bindings.includes('.theme-dark .menu-item'),
		'the theme still on stock must not get a selector restating what Obsidian does'
	);
});

test('filtering a self-scoped block never leaves the other theme behind', () => {
	for (const ctrl of STYLE_CONTROLS) {
		if (!ctrl.companionCss || !/\.theme-(dark|light)/.test(ctrl.companionCss)) continue;
		for (const scope of ['.theme-dark', '.theme-light']) {
			const other = scope === '.theme-dark' ? '.theme-light' : '.theme-dark';
			const out = filterCssBlockToMode(scope, ctrl.companionCss.trim());
			assert.ok(validateCss(out).ok, `${ctrl.id} filtered to ${scope} must be valid CSS`);
			for (const match of out.matchAll(/([^{}]+)\{/g)) {
				for (const selector of (match[1] ?? '').split(',')) {
					const trimmed = selector.trim();
					if (!trimmed) continue;
					assert.ok(
						!(trimmed.includes(other) && !trimmed.includes(scope)),
						`${ctrl.id} filtered to ${scope} leaked an ${other} selector: ${trimmed}`
					);
				}
			}
		}
	}
});

/**
 * One mode is designed at a time. Switching modes resets the one being left
 * behind - the designer asks before doing it - so the snippet carries CSS for
 * the mode in hand and little else. These pin the generator side of that: the
 * reset mode has to fall silent, and the mode in hand has to keep everything.
 */
test('a mode left at defaults contributes almost nothing beside a designed one', () => {
	const state = stockState();
	// The mode in hand carries a real design.
	state.lightTokens.set('--text-accent', '#0055ff');
	state.lightTokens.set('--background-secondary', '#e6ecf8');
	state.lightTokens.set('--nav-item-color', '#5a6b8c');

	const css = buildGeneratedCss(state);

	const darkStart = css.indexOf('.theme-dark {');
	const darkBlock = css.slice(darkStart, css.indexOf('\n}', darkStart));
	const darkDeclarations = darkBlock.split('\n').filter((l) => l.trim().startsWith('--'));
	assert.ok(
		darkDeclarations.length <= 5,
		`the mode left at defaults should be nearly silent, wrote ${darkDeclarations.length}: ${darkDeclarations.join(' ')}`
	);

	// Whatever it does still write has to be something a rule reads in this mode.
	// Two sources qualify: the toggles that ship switched on (`--file-line-width`,
	// the titlebar link), and the few companion blocks that say things beyond
	// their own token - `text-accent` sets a flat `opacity`, for instance - which
	// are therefore emitted unscoped and apply in both modes, so both modes have
	// to supply what they read.
	const readInThisMode = new Set<string>();
	for (const match of css.matchAll(/var\(\s*(--[A-Za-z0-9_-]+)/g)) {
		if (match[1]) readInThisMode.add(match[1]);
	}
	for (const declaration of darkDeclarations) {
		const name = declaration.trim().split(':')[0] ?? '';
		assert.ok(
			/--file-line-width|--titlebar-/.test(name) || readInThisMode.has(name),
			`the reset mode wrote ${name}, which nothing reads`
		);
	}

	// And nothing of the designed mode was lost.
	assert.ok(css.includes('--text-accent: #0055ff;'), 'the mode being designed keeps its colours');
	assert.ok(css.includes('.theme-light .nav-file-title'), 'and its scoped rules');
});

test('resetting the mode being left is what shrinks the snippet', () => {
	// Where the saving actually is. A colour control is emitted as one rule that
	// reads `var(--x)`, with each mode's block supplying its own value, so
	// designing both modes costs no more rules than designing one. The per-mode
	// generators are the opposite: a background pattern, a shadow and the glass
	// layer each produce a whole block per mode, and that is what doubles.
	const designFeatures = (tokens: Map<string, string>): void => {
		tokens.set('--ui-bg-enabled', 'true');
		tokens.set('--ui-bg-style', 'dot-grid');
		tokens.set('--ui-bg-scope', 'editor');
		tokens.set('--sh-headings-enabled', 'true');
		tokens.set('--glass-enabled', 'true');
	};

	const both = stockState();
	designFeatures(both.darkTokens);
	designFeatures(both.lightTokens);
	const bothLines = buildGeneratedCss(both).split('\n').length;

	// The same design with the other mode reset - what a confirmed switch leaves.
	const one = stockState();
	designFeatures(one.lightTokens);
	const oneLines = buildGeneratedCss(one).split('\n').length;

	assert.ok(
		oneLines < bothLines * 0.75,
		`designing one mode should cost markedly less than two (${oneLines} vs ${bothLines})`
	);
});
