import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ANIMATED_PATTERN_STYLES } from '../src/schema';
import { getBackgroundPatternCss, isKnownBackgroundPattern } from '../src/css/background';
import { MATRIX_FRAMES } from '../src/css/patterns/matrix';
import { validateCss } from '../src/engine';
import { generateCustomBackgroundCss } from '../src/css/ui-elements';
import type { ThemeTokenState } from '../src/css/ui-elements';

function flipbookCss(flipbook: string, style: string, extra: Record<string, string> = {}): string {
	const tokens = new Map<string, string>(
		Object.entries({
			'--ui-bg-enabled': 'true',
			'--ui-bg-scope': 'workspace',
			'--ui-bg-size': '24px',
			'--ui-bg-opacity': '0.5',
			'--ui-bg-color': '#38bdf8',
			'--ui-bg-style': style,
			'--ui-bg-flipbook': flipbook,
			...extra,
		}),
	);
	const state: ThemeTokenState = {
		darkTokens: tokens,
		lightTokens: new Map(),
		darkEnabled: new Map(),
		lightEnabled: new Map(),
	};
	return generateCustomBackgroundCss('.theme-dark', state);
}

test('every animated style owns a sequence of real animal frames', () => {
	assert.ok(ANIMATED_PATTERN_STYLES.length > 0);
	const ids = new Set<string>();
	for (const style of ANIMATED_PATTERN_STYLES) {
		assert.ok(style.id.length > 0, 'animated style id must not be empty');
		assert.ok(!ids.has(style.id), `duplicate animated style id "${style.id}"`);
		ids.add(style.id);
		assert.ok(style.label.length > 0, `${style.id} has no label`);
		assert.ok(style.frames.length >= 2, `${style.id} needs at least two frames to cycle`);
		for (const frame of style.frames) {
			assert.ok(isKnownBackgroundPattern(frame.style), `${style.id} names unregistered builder "${frame.style}"`);
			assert.ok(
				Number.isInteger(frame.frame) && frame.frame >= 0,
				`${style.id} has a bad frame index ${frame.frame}`,
			);
		}
	}
});

test('matrix rain holds its characters still and sweeps the colour down', () => {
	const style = ANIMATED_PATTERN_STYLES.find((s) => s.id === 'matrix-fall');
	assert.ok(style, 'the matrix-fall style is missing');
	assert.equal(style.frames.length, MATRIX_FRAMES, 'matrix frame count must equal the sweep frames');
	const frame = (i: number, opacity = 0.6, tint = '#00ff41'): string => {
		const raw = getBackgroundPatternCss('anim-matrix', 72, opacity, tint, true, false, undefined, 'none', 135, i).bgImage;
		return decodeURIComponent(/data:image\/svg\+xml,(.*)"\)$/.exec(raw)?.[1] ?? '');
	};
	const frames = Array.from({ length: MATRIX_FRAMES }, (_, i) => frame(i));
	assert.equal(new Set(frames).size, MATRIX_FRAMES, 'every matrix frame should differ');
	assert.equal(frame(MATRIX_FRAMES), frames[0], 'the frame past the last must equal frame 0 for a clean loop');
	// Nothing is painted behind the letters, and the whole palette follows the
	// tint picker instead of a hardcoded green.
	assert.ok(!frame(0).includes('<rect'), 'the matrix should paint no background');
	const red = frame(0, 0.6, '#ff0000');
	assert.ok(red.includes("fill='#ff0000'"), 'the trail should be the chosen tint');
	assert.ok(red.includes("fill='#ff8c8c'"), 'the flash should be a lighter tint');
	assert.ok(red.includes("fill='#990000'"), 'the far sheet should be a darker tint');
	assert.ok(!frame(0, 0.6, '#ff0000').includes('#00ff41'), 'no green should survive a retint');
	// A repeated attribute makes the SVG unparseable, which blanks the pane.
	for (const tag of frames[0]!.matchAll(/<[a-z][^>]*>/g)) {
		const names = [...tag[0].matchAll(/([a-zA-Z-]+)=/g)].map((a) => a[1]);
		assert.equal(new Set(names).size, names.length, `duplicate attribute in ${tag[0].slice(0, 90)}`);
	}
	// The characters never move: the same columns are painted in every frame.
	const cols = (svg: string): string[] =>
		[...new Set([...svg.matchAll(/<text x='([\d.]+)'/g)].map((m) => m[1] as string))].sort((a, b) => parseFloat(a) - parseFloat(b));
	assert.deepEqual(cols(frames[0]!), cols(frames[Math.floor(MATRIX_FRAMES / 2)]!), 'columns must not move');
	// ...and the bright band travels DOWN the rows, which is the whole effect.
	const rowOfBrightest = (svg: string, x: string): number => {
		const cells = [...svg.matchAll(/<text x='([\d.]+)' y='([\d.]+)' fill-opacity='([\d.]+)'/g)]
			.filter((m) => m[1] === x)
			.map((m) => ({ y: parseFloat(m[2] as string), o: parseFloat(m[3] as string) }));
		return cells.reduce((a, b) => (b.o > a.o ? b : a), { y: NaN, o: -1 }).y;
	};
	const fell = cols(frames[0]!).some(
		(x) => rowOfBrightest(frames[10]!, x) > rowOfBrightest(frames[0]!, x),
	);
	assert.ok(fell, 'the bright band should fall down a column');
});

test('both layers render together, flipbook in front, when their Areas differ', () => {
	const css = flipbookCss('wink-face', 'yin-yang', {
		'--ui-bg-scope': 'workspace',
		'--ui-bg-flipbook-scope': 'editor',
	});
	// One composed layer list: the animated image first (front), the pattern
	// behind it.
	assert.match(
		css,
		/background-image: var\(--css-bg-flip\), url\("data:image\/svg/,
		'the pattern and the animation were not composed together',
	);
	// No second pass may overwrite the pattern with the flipbook alone.
	assert.ok(
		!css.includes('background-image: var(--css-bg-flip) !important'),
		'a separate flipbook pass clobbered the pattern',
	);
	// And it is painted exactly once: no doubling.
	const painted = css.match(/background-image:[^;]*var\(--css-bg-flip\)/g) || [];
	assert.equal(painted.length, 1, `the flipbook is painted ${painted.length} times`);
});

test('the winking-face style is a single centered, non-repeating animation', () => {
	const css = flipbookCss('wink-face', 'dot-grid', { '--ui-bg-scope': 'editor' });
	assert.ok(css.includes('var(--css-bg-flip)'), 'the face layer is missing');
	assert.match(css, /@keyframes css-bg-flip/, 'the wink keyframes are missing');
	assert.ok(css.includes('background-repeat: no-repeat'), 'the face must not tile');
	assert.ok(/background-position: center/.test(css), 'the face must be centered');
});

test('the X/Y offset nudges the animated layer from its centre', () => {
	const base = flipbookCss('wink-face', 'yin-yang');
	const moved = flipbookCss('wink-face', 'yin-yang', {
		'--ui-bg-flipbook-offset-x': '40',
		'--ui-bg-flipbook-offset-y': '-20',
	});
	assert.notEqual(moved, base, 'the offset did not change the output');
	assert.ok(
		/background-position: calc\(50% \+ 40vw\) calc\(50% - 20vh\)/.test(moved),
		'the offset was not applied relative to centre',
	);
});

test('a flipbook overlays the static pattern with its own discrete animation', () => {
	for (const animated of ANIMATED_PATTERN_STYLES) {
		const css = flipbookCss(animated.id, 'dot-grid');
		const result = validateCss(css);
		assert.ok(result.ok, `${animated.id} produced invalid css: ${JSON.stringify(result.issues)}`);
		assert.match(css, /@property --css-bg-flip/, `${animated.id} did not register the flip custom property`);
		assert.match(css, /@keyframes css-bg-flip/, `${animated.id} did not emit flip keyframes`);
		assert.match(css, /animation:[^;]*css-bg-flip[^;]*steps\(1, end\)/, `${animated.id} is not a stepped flipbook`);
		assert.ok(css.includes('var(--css-bg-flip)'), `${animated.id} does not paint from the flip property`);
		// Untethered: turning the overlay off changes the output...
		assert.notEqual(css, flipbookCss('none', 'dot-grid'), `${animated.id} produced the same css as no overlay`);
		// ...and the underlying Pattern Style still reaches the stylesheet.
		assert.notEqual(css, flipbookCss(animated.id, 'seigaiha'), `${animated.id} ignored the static pattern`);
	}
});

test('the overlay has its own sub-toggle, independent of the pattern', () => {
	const withOverlay = flipbookCss('wink-face', 'yin-yang');

	// Overlay off: the flip layer must vanish while the pattern stays.
	const overlayOff = flipbookCss('wink-face', 'yin-yang', { '--ui-bg-flipbook-enabled': 'false' });
	assert.ok(!overlayOff.includes('var(--css-bg-flip)'), 'overlay sub-toggle did not remove the flip layer');
	assert.ok(!overlayOff.includes('@keyframes css-bg-flip'), 'overlay sub-toggle did not remove the flip keyframes');
	assert.ok(overlayOff.includes('data:image/svg'), 'switching the overlay off removed the pattern too');
	assert.notEqual(overlayOff, withOverlay, 'overlay sub-toggle did not change the output');
});

test('the overlay sub-toggle applies to every Area setting', () => {
	for (const scope of ['editor', 'workspace', 'sidebars']) {
		const withOverlay = flipbookCss('wink-face', 'dot-grid', { '--ui-bg-scope': scope });
		assert.ok(withOverlay.includes('var(--css-bg-flip)'), `${scope}: overlay layer missing`);

		const overlayOff = flipbookCss('wink-face', 'dot-grid', {
			'--ui-bg-scope': scope,
			'--ui-bg-flipbook-enabled': 'false',
		});
		assert.ok(!overlayOff.includes('var(--css-bg-flip)'), `${scope}: overlay sub-toggle was ignored`);
	}
});

test('the overlay speed slider retimes only the flipbook', () => {
	// Twelve wink frames at 0.15s each -> a 1.8s cycle at 1x.
	const base = flipbookCss('wink-face', 'dot-grid');
	assert.match(base, /animation: css-bg-flip 1\.8s steps\(1, end\)/, 'base flipbook duration should be 1.8s for twelve frames');

	const fast = flipbookCss('wink-face', 'dot-grid', { '--ui-bg-flipbook-speed': '2' });
	assert.match(fast, /animation: css-bg-flip 0\.9s steps\(1, end\)/, 'doubling the overlay speed should halve its duration');

	// The shared Animation Speed slider belongs to the pattern's own effects and
	// must not retime the flipbook.
	const sharedSpeed = flipbookCss('wink-face', 'dot-grid', { '--ui-bg-animation-speed': '3' });
	assert.match(sharedSpeed, /animation: css-bg-flip 1\.8s steps\(1, end\)/, 'the shared speed slider leaked into the flipbook');
});

test('the animated pattern renders with the base background switched off', () => {
	const css = flipbookCss('wink-face', 'yin-yang', {
		'--ui-bg-enabled': 'false',
		'--ui-bg-scope': 'workspace',
		'--ui-bg-flipbook-scope': 'workspace',
	});
	assert.ok(css.includes('@keyframes css-bg-flip'), 'the flipbook did not render');
	assert.ok(/background-image: var\(--css-bg-flip\)/.test(css), 'the flipbook layer is missing');
	// The base pattern must not leak in: its image would appear as a background.
	assert.ok(
		!/background-image: url\("data:image\/svg/.test(css),
		'the base pattern was painted while its master toggle was off',
	);
	// Painted once: no doubling.
	const painted = css.match(/background-image:[^;]*var\(--css-bg-flip\)/g) || [];
	assert.equal(painted.length, 1, `the flipbook is painted ${painted.length} times`);
});

test('the animated pattern has fully independent size, opacity, colour and Area', () => {
	const opts = { '--ui-bg-flipbook-scope': 'editor' };
	const base = flipbookCss('wink-face', 'yin-yang', opts);
	assert.ok(base.includes('@keyframes css-bg-flip'), 'the flipbook pass was not emitted');
	assert.ok(base.includes('data:image/svg'), 'the base pattern was dropped');

	const independent: Array<[string, string]> = [
		['--ui-bg-flipbook-size', '60px'],
		['--ui-bg-flipbook-opacity', '0.9'],
		['--ui-bg-flipbook-color', '#ff0000'],
	];
	for (const [key, value] of independent) {
		const changed = flipbookCss('wink-face', 'yin-yang', { ...opts, [key]: value });
		assert.notEqual(changed, base, `${key} did not affect the flipbook output`);
	}
});

test('workspace scope paints a single fixed flipbook backdrop for the whole window', () => {
	const css = flipbookCss('wink-face', 'yin-yang', { '--ui-bg-scope': 'workspace' });
	// One fixed backdrop for the whole window (the panes go transparent), not a
	// copy per nested content layer.
	const backdropMarker = '.theme-dark .app-container::before';
	assert.ok(css.includes(backdropMarker), 'the fixed workspace backdrop was not emitted');
	assert.match(
		css,
		/background-image: var\(--css-bg-flip\), url\("data:image\/svg/,
		'the backdrop did not compose the animation over the pattern',
	);
	// Exactly one rule paints the flipbook: no doubling.
	const painted = css.match(/background-image:[^;]*var\(--css-bg-flip\)/g) || [];
	assert.equal(painted.length, 1, `the flipbook is painted ${painted.length} times`);
});
