import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BACKGROUND_PATTERN_OPTIONS, BACKGROUND_ANIMATION_OPTIONS } from '../src/schema';
import { getBackgroundPatternCss, isKnownBackgroundPattern } from '../src/css/background';
import { PATTERN_BUILDERS } from '../src/css/patterns';
import { validateCss, formatIssues } from '../src/engine';
import { generateCustomBackgroundCss } from '../src/css/ui-elements';
import type { ThemeTokenState } from '../src/css/ui-elements';

const VALUES = BACKGROUND_PATTERN_OPTIONS.map((o) => o.value);

test('every listed pattern has a builder, and every builder is listed', () => {
	const registered = Object.keys(PATTERN_BUILDERS);
	for (const value of VALUES) {
		assert.ok(isKnownBackgroundPattern(value), `no builder registered for "${value}"`);
	}
	for (const key of registered) {
		assert.ok(VALUES.includes(key), `builder "${key}" is not offered in the picker`);
	}
	assert.equal(new Set(VALUES).size, VALUES.length, 'duplicate pattern value in the picker');
});

test('picker groups run in blocks and are alphabetical inside each block', () => {
	const seen = new Set<string>();
	let group: string | undefined;
	let previous = '';
	for (const option of BACKGROUND_PATTERN_OPTIONS) {
		assert.ok(option.group, `"${option.value}" has no group, so it would render ungrouped`);
		if (option.group !== group) {
			assert.ok(!seen.has(option.group), `group "${option.group}" is split into two blocks`);
			seen.add(option.group);
			group = option.group;
			previous = '';
		}
		// Sort on the label without its leading icon, which is what a reader scans.
		const key = option.label.replace(/^[^A-Za-z0-9]+/, '').toLowerCase();
		assert.ok(key >= previous, `"${option.label}" is out of order inside "${group}"`);
		previous = key;
	}
});

test('every pattern emits usable, valid css in each colour and animation mode', () => {
	const modes = BACKGROUND_ANIMATION_OPTIONS.map((o) => o.value);
	for (const value of VALUES) {
		for (const isDark of [true, false]) {
			for (const isGradient of [true, false]) {
				for (const anim of modes) {
					const p = getBackgroundPatternCss(value, 24, 0.45, isDark ? '#ffffff' : '#000000', isDark, isGradient, '#a855f7', anim);
					const label = `${value} (dark=${isDark} gradient=${isGradient} anim=${anim})`;
					assert.ok(p.bgImage.length > 0, `${label} produced no background-image`);
					assert.ok(p.bgSize.length > 0, `${label} produced no background-size`);
					assert.doesNotMatch(
						`${p.bgImage}${p.bgSize}${p.bgPosition ?? ''}`,
						/NaN|undefined|Infinity/,
						`${label} leaked a non-finite value`,
					);
					const css = `.x {\n  background-image: ${p.bgImage};\n  background-size: ${p.bgSize};\n}\n`;
					const result = validateCss(css);
					assert.ok(result.ok, `${label} produced malformed CSS:\n${formatIssues(result.issues)}`);
				}
			}
		}
	}
});

test('embedded svg tiles are balanced and carry a viewBox', () => {
	for (const value of VALUES) {
		for (const isGradient of [true, false]) {
			const p = getBackgroundPatternCss(value, 24, 0.5, '#38bdf8', true, isGradient, '#f472b6', 'none');
			for (const raw of p.bgImage.match(/data:image\/svg\+xml,[^"]+/g) ?? []) {
				const svg = decodeURIComponent(raw.slice('data:image/svg+xml,'.length));
				const opened = (svg.match(/<[a-zA-Z]/g) ?? []).length;
				const closed = (svg.match(/<\/[a-zA-Z]/g) ?? []).length + (svg.match(/\/>/g) ?? []).length;
				assert.equal(opened, closed, `${value} emitted unbalanced SVG markup`);
				assert.match(svg, /viewBox=/, `${value} emitted an SVG without a viewBox`);
			}
		}
	}
});

test('an unknown style falls back to the default pattern rather than throwing', () => {
	const fallback = getBackgroundPatternCss('not-a-pattern', 24, 0.4, '#ffffff', true);
	const dots = getBackgroundPatternCss('dot-grid', 24, 0.4, '#ffffff', true);
	assert.deepEqual(fallback, dots);
});


/** Decode the SVG a pattern embeds, or '' when it emits plain CSS gradients. */
function svgFor(style: string, size = 24): string {
	const p = getBackgroundPatternCss(style, size, 0.6, '#38bdf8', true);
	const raw = /data:image\/svg\+xml,([^"]+)/.exec(p.bgImage);
	return raw?.[1] ? decodeURIComponent(raw[1]) : '';
}

test('rainfall draws nothing but vertical strokes', () => {
	const svg = svgFor('rainfall');
	const paths = [...svg.matchAll(/<path d='([^']+)'/g)].map((m) => m[1] ?? '');
	assert.ok(paths.length > 0, 'rainfall emitted no drop paths');
	for (const d of paths) {
		// A drop is only ever "move, then fall": any L, H, C or arc means the
		// column has picked up a lean and the rain is no longer vertical.
		assert.match(d, /^(M[\d.]+ [\d.]+V[\d.]+)+$/, `rainfall drop is not vertical: ${d}`);
	}
});

test('rainfall embeds a subtle blur filter and staggered drop coordinates for seamless atmospheric depth', () => {
	const svg = svgFor('rainfall');
	// Must embed Gaussian blur filter for atmospheric softness
	assert.match(svg, /<feGaussianBlur stdDeviation='[\d.]+'\/>/, 'rainfall must include Gaussian blur filter');
	assert.match(svg, /filter='url\(#rf-blur\)'/, 'rainfall body must be rendered through blur filter');

	// Extract unique X coordinates of all drops
	const paths = [...svg.matchAll(/<path d='([^']+)'/g)].map((m) => m[1] ?? '');
	const xCoords = new Set<string>();
	for (const path of paths) {
		const matches = path.matchAll(/M([\d.]+) [\d.]+/g);
		for (const m of matches) {
			if (m[1]) xCoords.add(m[1]);
		}
	}
	// Instead of 13 rigid columns, drops are staggered across many distinct X coordinates
	assert.ok(xCoords.size >= 25, `Expected at least 25 staggered X coordinates, found ${xCoords.size}`);
});


test('matrix-rain embeds authentic Katakana, Arabic numerals, Latin letters, symbols, and mirrored glyphs', () => {
	const svg = svgFor('matrix-rain');
	assert.ok(svg.length > 0, 'matrix-rain emitted no SVG');
	// Katakana
	assert.match(svg, /[ｦ-ﾝ]/, 'matrix-rain is missing Katakana characters');
	// Arabic numerals
	assert.match(svg, /[0-9]/, 'matrix-rain is missing Arabic numerals');
	// Latin letters
	assert.match(svg, /[A-Z]/, 'matrix-rain is missing Latin letters');
	// Pictorial symbols
	assert.match(svg, /[+\-*=:|¦╌᛬∷⌽]/, 'matrix-rain is missing pictorial symbols');
	// Mirrored glyphs
	assert.match(svg, /transform='scale\(-1,\s*1\)'/, 'matrix-rain is missing mirrored glyphs');
	// Bold head glyphs
	assert.match(svg, /font-weight='bold'/, 'matrix-rain is missing bold head glyphs');
});

test('hacker embeds authentic terminal commands, exploit code, memory dumps, and terminal cursor', () => {
	const svg = svgFor('hacker');
	assert.ok(svg.length > 0, 'hacker emitted no SVG');
	assert.match(svg, /root@kali:~#/, 'hacker is missing terminal root prompt');
	assert.match(svg, /mmap|syscall|execve/, 'hacker is missing system call programming code');
	assert.match(svg, /0x[0-9a-fA-F]+/, 'hacker is missing hex memory dump addresses');
	assert.match(svg, /OVERFLOW|exploit|canary/, 'hacker is missing security / exploit text');
	assert.match(svg, /█/, 'hacker is missing the terminal cursor block');
});

test('stars-and-stripes embeds 13 vertical stripes, union canton, and 50 stars', () => {
	const svg = svgFor('stars-and-stripes', 24);
	assert.ok(svg.length > 0, 'stars-and-stripes emitted no SVG');

	// Vertical stripes & dividers: at least 20 rect elements
	const rects = [...svg.matchAll(/<rect [^>]+>/g)];
	assert.ok(rects.length >= 20, `expected at least 20 stripe/divider rects, got ${rects.length}`);

	// Star definition in defs
	assert.match(svg, /<polygon id='us-star'/, 'missing us-star polygon definition');

	// Exactly 50 stars in the union canton via <use>
	const stars = [...svg.matchAll(/<use href='#us-star'/g)];
	assert.equal(stars.length, 50, `expected exactly 50 stars in the canton, got ${stars.length}`);
});

test('spiral-galaxy renders an authentic face-on Milky Way SBbc barred spiral', () => {
	const p = getBackgroundPatternCss('spiral-galaxy', 24, 0.6, '#38bdf8', true);
	assert.equal(p.bgRepeat, 'no-repeat', 'galaxy should not repeat across the window');
	assert.equal(p.bgPosition, 'center', 'galaxy should be held dead centre of the pane');
	assert.equal(p.bgAttachment, 'fixed', 'galaxy should stay fixed as the note scrolls');
	assert.equal(p.bgSize, '100% 100%', 'default size slider should scale galaxy to pane bounds');

	const svg = svgFor('spiral-galaxy', 24);
	assert.ok(svg.length > 0, 'spiral-galaxy emitted no SVG');

	// Galactic core definition in defs
	assert.match(svg, /<radialGradient id='gal-core'/, 'missing gal-core radial gradient definition');

	// Central stellar bar and core glow
	assert.match(svg, /<ellipse[^>]+transform='rotate\(28/, 'missing rotated central stellar bar bulge');

	// Logarithmic spiral arms and stars (dense stellar populations >= 1000 stars)
	const circles = [...svg.matchAll(/<circle [^>]+>/g)];
	assert.ok(circles.length >= 1000, `expected dense starfield and starry arms (>= 1000 stars), got ${circles.length}`);

	// 3D spherical core with off-center focal point and radial glow
	assert.match(svg, /<radialGradient id='gal-core-3d'[^>]*fx='46%' fy='44%'/, 'missing 3D spherical core gradient');

	// 2D cross spikes must be removed (no flat 2D rect spikes)
	const spikes = [...svg.matchAll(/<rect [^>]+>/g)];
	assert.equal(spikes.length, 0, `expected no 2D cross spikes, found ${spikes.length}`);

	// Volumetric soft nebular mist filters and cloud layers
	assert.match(svg, /<filter id='gal-cloud-blur'/, 'missing gal-cloud-blur filter definition');
	assert.match(svg, /<feGaussianBlur stdDeviation='10'/, 'missing Gaussian blur on cloud layer');
	assert.match(svg, /<g filter='url\(#gal-cloud-blur\)'>/, 'missing blurred cloud layer group');
	assert.match(svg, /<g filter='url\(#gal-deep-blur\)'>/, 'missing deep volumetric nebula body group');
});

test('spiral-galaxy colors star-forming H II knots in secondary hue in two-tone gradient mode', () => {
	const p = getBackgroundPatternCss('spiral-galaxy', 24, 0.6, '#38bdf8', true, true, '#f472b6');
	const raw = /data:image\/svg\+xml,([^"]+)/.exec(p.bgImage);
	const svg = raw?.[1] ? decodeURIComponent(raw[1]) : '';
	assert.ok(svg.length > 0, 'spiral-galaxy emitted no SVG in gradient mode');

	// Knots along the arms take the secondary hue rgba(244, 114, 182, ...)
	assert.match(svg, /fill='rgba\(244,\s*114,\s*182,/, 'missing secondary hue star-forming H II knots');
});

test('two-tone gradient mode angle adjusts linearGradient coordinates', () => {
	// Default 135deg (top-left to bottom-right)
	const p135 = getBackgroundPatternCss('dot-grid', 24, 0.5, '#38bdf8', true, true, '#f472b6', 'none', 135);
	assert.match(decodeURIComponent(p135.bgImage), /x1='0%' y1='0%' x2='100%' y2='100%'/, '135deg did not produce diagonal coordinates');

	// 90deg (horizontal: left-to-right)
	const p90 = getBackgroundPatternCss('dot-grid', 24, 0.5, '#38bdf8', true, true, '#f472b6', 'none', 90);
	assert.match(decodeURIComponent(p90.bgImage), /x1='0%' y1='50%' x2='100%' y2='50%'/, '90deg did not produce horizontal coordinates');

	// 180deg (vertical: top-to-bottom)
	const p180 = getBackgroundPatternCss('dot-grid', 24, 0.5, '#38bdf8', true, true, '#f472b6', 'none', 180);
	assert.match(decodeURIComponent(p180.bgImage), /x1='50%' y1='0%' x2='50%' y2='100%'/, '180deg did not produce vertical coordinates');

	// 0deg (vertical: bottom-to-top)
	const p0 = getBackgroundPatternCss('dot-grid', 24, 0.5, '#38bdf8', true, true, '#f472b6', 'none', 0);
	assert.match(decodeURIComponent(p0.bgImage), /x1='50%' y1='100%' x2='50%' y2='0%'/, '0deg did not produce bottom-to-top coordinates');

	// 270deg (horizontal: right-to-left)
	const p270 = getBackgroundPatternCss('dot-grid', 24, 0.5, '#38bdf8', true, true, '#f472b6', 'none', 270);
	assert.match(decodeURIComponent(p270.bgImage), /x1='100%' y1='50%' x2='0%' y2='50%'/, '270deg did not produce right-to-left coordinates');
});

test('generateCustomBackgroundCss respects --ui-bg-gradient-angle token', () => {
	const css90 = backgroundCssFor({
		'--ui-bg-gradient': 'true',
		'--ui-bg-color-2': '#f472b6',
		'--ui-bg-gradient-angle': '90deg',
	});
	assert.match(decodeURIComponent(css90), /x1='0%' y1='50%' x2='100%' y2='50%'/);
});

function backgroundCssFor(overrides: Record<string, string>): string {
	const tokens = new Map<string, string>(Object.entries({
		'--ui-bg-enabled': 'true',
		'--ui-bg-scope': 'editor',
		'--ui-bg-size': '24px',
		'--ui-bg-opacity': '0.5',
		'--ui-bg-color': '#38bdf8',
		...overrides,
	}));
	const state: ThemeTokenState = {
		darkTokens: tokens,
		lightTokens: new Map(),
		darkEnabled: new Map(),
		lightEnabled: new Map(),
	};
	return generateCustomBackgroundCss('.theme-dark', state);
}

test('the rain animation scrolls by a whole number of tiles', () => {
	const css = backgroundCssFor({ '--ui-bg-style': 'rainfall', '--ui-bg-animation': 'rain-scroll' });
	const tile = /background-size: \d+px ([\d.]+)px/.exec(css);
	const travel = /100% \{ transform: translate3d\(0, ([\d.]+)px, 0\); \}/.exec(css);
	assert.ok(tile?.[1] && travel?.[1], 'could not read the tile height or the scroll distance');
	const tileHeight = Number(tile[1]);
	const distance = Number(travel[1]);
	assert.ok(distance > 0, 'the rain animation does not travel');
	// A partial tile means the pattern visibly jumps when the keyframe restarts.
	assert.equal(distance % tileHeight, 0, `scroll distance ${distance} is not a multiple of the ${tileHeight}px tile`);
});

test('horizontal rain scrolls a whole number of tiles', () => {
	const css = backgroundCssFor({ '--ui-bg-style': 'rainfall', '--ui-bg-animation': 'horizontal-rain-scroll' });
	const tile = /background-size: ([\d.]+)px/.exec(css);
	const match = /100% \{ transform: translate3d\(([\d.]+)px, 0, 0\); \}/.exec(css);
	assert.ok(tile?.[1] && match?.[1], 'could not read the tile width or the horizontal scroll distance');
	const tileWidth = Number(tile[1]);
	const distance = Number(match[1]);
	assert.ok(distance > 0, 'the horizontal rain animation does not travel');
	assert.equal(distance % tileWidth, 0, `horizontal scroll distance ${distance} is not a multiple of the ${tileWidth}px tile`);
});

test('the rain overlay is oversized by exactly its travel, on the leading edge only', () => {
	const css = backgroundCssFor({ '--ui-bg-style': 'rainfall', '--ui-bg-animation': 'rain-scroll' });
	const travel = /100% \{ transform: translate3d\(0, ([\d.]+)px, 0\); \}/.exec(css);
	assert.ok(travel?.[1], 'could not read the scroll distance');
	// The layer only ever moves down, so it needs headroom above and nowhere
	// else; padding all four sides would cost video memory for nothing.
	assert.match(css, new RegExp(`inset: -${travel[1]}px 0 0 0 !important;`));
	assert.match(css, /overflow: clip !important;/);
});

test('the horizontal rain overlay is oversized by exactly its travel, on the leading edge only', () => {
	const css = backgroundCssFor({ '--ui-bg-style': 'rainfall', '--ui-bg-animation': 'horizontal-rain-scroll' });
	const travel = /100% \{ transform: translate3d\(([\d.]+)px, 0, 0\); \}/.exec(css);
	assert.ok(travel?.[1], 'could not read the horizontal scroll distance');
	// The layer only ever moves right, so it needs headroom on the left and nowhere else
	assert.match(css, new RegExp(`inset: 0 0 0 -${travel[1]}px !important;`));
	assert.match(css, /overflow: clip !important;/);
});

test('a px-tiled pattern slides on the compositor, never on background-position', () => {
	for (const anim of ['rain-scroll', 'horizontal-rain-scroll', 'side-scroll', 'drift']) {
		const css = backgroundCssFor({ '--ui-bg-style': 'rainfall', '--ui-bg-animation': anim });
		const keyframes = css.slice(css.indexOf('@keyframes'), css.indexOf('\n}\n', css.indexOf('@keyframes')));
		assert.ok(!keyframes.includes('background-position'), `${anim} still animates background-position`);
		assert.ok(keyframes.includes('translate3d'), `${anim} does not translate`);
	}
});

test('the side-scroll overlay is oversized by exactly its travel, on the trailing edge only', () => {
	const css = backgroundCssFor({ '--ui-bg-style': 'flappy-bird', '--ui-bg-animation': 'side-scroll' });
	const travel = /100% \{ transform: translate3d\(-([\d.]+)px, 0, 0\); \}/.exec(css);
	assert.ok(travel?.[1], 'could not read the side-scroll distance');
	// The layer only ever moves left, so it needs headroom on the right and nowhere else
	assert.match(css, new RegExp(`inset: 0 -${travel[1]}px 0 0 !important;`));
	assert.match(css, /overflow: clip !important;/);
});

test('the side-scroll travels a whole number of seamless tiles', () => {
	const css = backgroundCssFor({ '--ui-bg-style': 'flappy-bird', '--ui-bg-animation': 'side-scroll' });
	const tile = /background-size: ([\d.]+)px/.exec(css);
	const travel = /100% \{ transform: translate3d\(-([\d.]+)px, 0, 0\); \}/.exec(css);
	assert.ok(tile?.[1] && travel?.[1], 'could not read the tile width or the scroll distance');
	const tileWidth = Number(tile[1]);
	const distance = Number(travel[1]);
	assert.ok(distance > 0, 'the side-scroll does not travel');
	// A partial tile means the pattern visibly jumps when the keyframe restarts.
	assert.equal(distance % tileWidth, 0, `side-scroll distance ${distance} is not a multiple of the ${tileWidth}px tile`);
});

test('flappy-bird is a bottom-anchored horizontal band', () => {
	const p = getBackgroundPatternCss('flappy-bird', 30, 0.7, '#5aa81f', false, false, '#f2c53d');
	assert.equal(p.bgRepeat, 'repeat-x');
	assert.equal(p.bgPosition, '0 100%');
	assert.match(p.bgSize, /^[\d.]+px [\d.]+px$/);
});

test('every animated layer is promoted exactly once, naming what it animates', () => {
	const cases: Record<string, string> = {
		'rain-scroll': 'transform',
		'horizontal-rain-scroll': 'transform',
		'side-scroll': 'transform',
		'rotate-cw': 'transform',
		'rotate-ccw': 'transform',
		drift: 'transform',
		pulse: 'opacity, transform',
		'neon-glow': 'opacity',
		'rainbow-cycle': 'filter',
		'gradient-shift': 'filter',
	};
	for (const [anim, hint] of Object.entries(cases)) {
		const css = backgroundCssFor({ '--ui-bg-style': 'rainfall', '--ui-bg-animation': anim });
		assert.match(css, new RegExp(`will-change: ${hint} !important;`), `${anim} is not promoted as ${hint}`);
		assert.equal((css.match(/will-change:/g) ?? []).length, 1, `${anim} promotes more than one layer`);
	}
});

test('rotation spins a viewport-diagonal layer clockwise', () => {
	const css = backgroundCssFor({ '--ui-bg-style': 'dot-grid', '--ui-bg-motion-animation': 'rotate-cw' });
	assert.match(css, /@keyframes css-bg-rotate \{\n  0% \{ transform: rotate\(0deg\); \}\n  100% \{ transform: rotate\(360deg\); \}\n\}/);
	assert.match(css, /width: 142vmax !important;/);
	assert.match(css, /height: 142vmax !important;/);
	// Centred with margins, not a translate: reduced motion drops the transform
	// and the layer must still cover the pane.
	assert.match(css, /margin: -71vmax 0 0 -71vmax !important;/);
	assert.ok(!/@keyframes css-bg-rotate[\s\S]*?translate/.test(css), 'rotation relies on a translate for centring');
	assert.match(css, /animation: css-bg-rotate 20s linear infinite !important;/);

	// Counter-clockwise mirrors the angle and the keyframe name.
	const ccw = backgroundCssFor({ '--ui-bg-style': 'dot-grid', '--ui-bg-motion-animation': 'rotate-ccw' });
	assert.match(ccw, /@keyframes css-bg-rotate-ccw \{\n  0% \{ transform: rotate\(0deg\); \}\n  100% \{ transform: rotate\(-360deg\); \}\n\}/);
	assert.match(ccw, /animation: css-bg-rotate-ccw 20s linear infinite !important;/);
	assert.match(ccw, /width: 142vmax !important;/);
});

test('the animation speed slider retimes every animated layer', () => {
	const faster = backgroundCssFor({
		'--ui-bg-style': 'rainfall',
		'--ui-bg-motion-animation': 'rain-scroll',
		'--ui-bg-animation-speed': '2',
	});
	assert.match(faster, /animation: css-bg-rain 6s linear infinite !important;/);

	const slower = backgroundCssFor({
		'--ui-bg-style': 'rainfall',
		'--ui-bg-motion-animation': 'rain-scroll',
		'--ui-bg-animation-speed': '0.5',
	});
	assert.match(slower, /animation: css-bg-rain 24s linear infinite !important;/);
});

test('rotating gradient angle spins a registered custom property over a blended layer', () => {
	const css = backgroundCssFor({
		'--ui-bg-color-animation': 'gradient-rotate',
		'--ui-bg-color-2': '#f472b6',
	});
	assert.match(css, /@property --css-bg-angle \{\n  syntax: "<angle>";\n  inherits: false;\n  initial-value: 0deg;\n\}/);
	assert.match(css, /@keyframes css-bg-angle \{\n  from \{ --css-bg-angle: 0deg; \}\n  to \{ --css-bg-angle: 360deg; \}\n\}/);
	assert.match(css, /animation: css-bg-angle 8s linear infinite !important;/);
	assert.match(
		css,
		/background-image: linear-gradient\(var\(--css-bg-angle\), rgba\(56, 189, 248, [^)]+\), rgba\(244, 114, 182, [^)]+\)\), /,
	);
	assert.match(css, /background-blend-mode: overlay, normal !important;/);

	// The shared speed slider retimes it like every other layer.
	const fast = backgroundCssFor({ '--ui-bg-color-animation': 'gradient-rotate', '--ui-bg-animation-speed': '2' });
	assert.match(fast, /animation: css-bg-angle 4s linear infinite !important;/);
});

test('mix and match motion animation and color animation concurrently', () => {
	// 1. Rain scroll + rainbow cycle
	const rainRainbow = backgroundCssFor({
		'--ui-bg-style': 'rainfall',
		'--ui-bg-motion-animation': 'rain-scroll',
		'--ui-bg-color-animation': 'rainbow-cycle',
	});
	assert.match(rainRainbow, /@keyframes css-bg-rain/);
	assert.match(rainRainbow, /@keyframes css-bg-rainbow/);
	assert.match(rainRainbow, /animation: css-bg-rain 12s linear infinite, css-bg-rainbow 10s linear infinite !important;/);
	assert.match(rainRainbow, /will-change: transform, filter !important;/);

	// 2. Drift + neon glow
	const driftNeon = backgroundCssFor({
		'--ui-bg-style': 'rainfall',
		'--ui-bg-motion-animation': 'drift',
		'--ui-bg-color-animation': 'neon-glow',
	});
	assert.match(driftNeon, /@keyframes css-bg-drift/);
	assert.match(driftNeon, /@keyframes css-bg-neon/);
	assert.match(driftNeon, /animation: css-bg-drift 24s ease-in-out infinite, css-bg-neon 3s ease-in-out infinite !important;/);
	assert.match(driftNeon, /filter: brightness\(1\.25\) drop-shadow\(0 0 3px [^)]+\) !important;/);
	assert.match(driftNeon, /will-change: transform, opacity !important;/);

	// 3. Motion alone
	const motionOnly = backgroundCssFor({
		'--ui-bg-style': 'rainfall',
		'--ui-bg-motion-animation': 'horizontal-rain-scroll',
		'--ui-bg-color-animation': 'none',
	});
	assert.match(motionOnly, /@keyframes css-bg-horizontal-rain/);
	assert.ok(!motionOnly.includes('@keyframes css-bg-rainbow'));
	assert.match(motionOnly, /will-change: transform !important;/);

	// 4. Color alone
	const colorOnly = backgroundCssFor({
		'--ui-bg-style': 'rainfall',
		'--ui-bg-motion-animation': 'none',
		'--ui-bg-color-animation': 'gradient-shift',
	});
	assert.match(colorOnly, /@keyframes css-bg-gradient-shift/);
	assert.ok(!colorOnly.includes('translate3d'));
	assert.match(colorOnly, /will-change: filter !important;/);
});

test('the neon glow is a static filter, not an animated blur', () => {
	const css = backgroundCssFor({ '--ui-bg-style': 'rainfall', '--ui-bg-animation': 'neon-glow' });
	// A drop-shadow inside keyframes re-blurs the whole leaf every frame.
	const keyframes = css.slice(css.indexOf('@keyframes'), css.indexOf('\n}\n', css.indexOf('@keyframes')));
	assert.ok(!keyframes.includes('drop-shadow'), 'the neon keyframes still animate a blur');
	assert.ok(!keyframes.includes('filter'), 'the neon keyframes still animate a filter');
	assert.match(css, /filter: brightness\(1\.25\) drop-shadow\(0 0 3px [^)]+\) !important;/);
});

test('a viewport-sized pattern keeps the background-position path', () => {
	const css = backgroundCssFor({ '--ui-bg-style': 'aurora-glow', '--ui-bg-animation': 'rain-scroll' });
	// Nothing to oversize the box by, so the old path stays.
	assert.match(css, /100% \{ background-position: 0 800px; \}/);
	assert.ok(!css.includes('inset: -'), 'a percentage-sized pattern must not be oversized');
});

test('every pattern produces valid css at 1% opacity', () => {
	for (const value of VALUES) {
		const css = backgroundCssFor({ '--ui-bg-style': value, '--ui-bg-opacity': '0.01' });
		assert.ok(css.length > 0, `${value} failed to generate CSS at 1% opacity`);
		const result = validateCss(css);
		assert.ok(result.ok, `${value} produced malformed CSS at 1% opacity:\n${formatIssues(result.issues)}`);
	}
});

test('enabling animations protects menus, dropdowns, and menu items from transparency', () => {
	const animatedCss = backgroundCssFor({
		'--ui-bg-style': 'stars-and-stripes',
		'--ui-bg-animation': 'rain-scroll',
	});

	// Menus and dropdowns must retain solid background and full opacity
	assert.match(animatedCss, /\.theme-dark \.menu/);
	assert.match(animatedCss, /\.theme-dark \.menu-item/);
	assert.match(animatedCss, /\.theme-dark \.suggestion-container/);
	// The editor and side-panel scopes no longer restate Obsidian's own menu
	// colour - verified in Chromium against an Obsidian-shaped DOM: with that
	// declaration gone the menus keep `--menu-background` from Obsidian itself,
	// and nothing gains the pattern. What the plugin still has to say is that
	// the pattern stops at floating UI and that UI stays on top of the
	// painted, isolated leaves.
	assert.match(animatedCss, /\.menu[^{]*\{[^}]*background-image: none !important;/);
	assert.match(animatedCss, /\.menu[^{]*\{[^}]*z-index: 1000 !important;/);
	assert.match(animatedCss, /opacity: 1 !important;/);

	// Navigation sidebars and file explorer must have explicit solid background and no pattern pseudo-element
	assert.match(animatedCss, /\.theme-dark \.workspace-split\.mod-left-split/);
	assert.match(animatedCss, /\.theme-dark \.workspace-leaf-content\[data-type="file-explorer"\]/);
	assert.match(animatedCss, /\.workspace-leaf-content\[data-type="file-explorer"\]::before/);
	assert.match(animatedCss, /display: none !important;/);

	const directPaintCss = backgroundCssFor({
		'--ui-bg-style': 'aurora-glow',
		'--ui-bg-animation': 'rain-scroll',
	});
	assert.match(directPaintCss, /\.theme-dark \.menu/);
	assert.match(directPaintCss, /\.menu[^{]*\{[^}]*background-image: none !important;/);
});

test('workspace scope paints one fixed backdrop across the whole window', () => {
	const workspaceCss = backgroundCssFor({
		'--ui-bg-style': 'stars-and-stripes',
		'--ui-bg-scope': 'workspace',
		'--ui-bg-animation': 'rain-scroll',
	});

	// A single fixed layer on the app root, not one layer per pane.
	assert.match(workspaceCss, /\.theme-dark \.app-container::before \{/);
	assert.match(workspaceCss, /\.theme-dark \.app-container::before \{[\s\S]*position: fixed !important;/);
	assert.match(workspaceCss, /\.theme-dark \.app-container::before \{[\s\S]*background-image: url\(/);
	assert.match(workspaceCss, /\.theme-dark \.app-container::before \{[\s\S]*animation: [^;]*css-bg-rain/);

	// The app root is an isolated stacking context and the backdrop sits at a
	// negative z-index, behind every pane and control, so nothing is covered.
	assert.match(workspaceCss, /\.theme-dark \.app-container \{[\s\S]*isolation: isolate !important;/);
	assert.match(workspaceCss, /\.theme-dark \.app-container::before \{[\s\S]*z-index: -1 !important;/);
	assert.match(workspaceCss, /\.workspace-split\.mod-left-split[\s\S]*background-color: transparent !important;/);

	// Exactly one animation declaration: no per-pane layer can duplicate or
	// desync the motion.
	assert.equal((workspaceCss.match(/animation: /g) ?? []).length, 1);

	// Plugin view, tabs, and canvas nodes are protected
	assert.match(workspaceCss, /\.workspace-leaf-content\[data-type="css-snippet-designer-view"\]/);
	assert.match(workspaceCss, /\.workspace-tab-header/);
	assert.match(workspaceCss, /\.canvas-node-container/);

	// Overlay elements stay solid instead of duplicating the pattern.
	assert.match(workspaceCss, /\.menu[\s\S]*background-image: none !important;/);

	// Foreground items stay elevated
	assert.match(workspaceCss, /\.menu-item[\s\S]*opacity: 1 !important;/);
	assert.match(workspaceCss, /\.nav-file-title[\s\S]*opacity: 1 !important;/);
});

test('canvas node cards never receive the background pattern', () => {
	for (const scope of ['editor', 'workspace'] as const) {
		const css = backgroundCssFor({ '--ui-bg-style': 'synthwave-grid', '--ui-bg-scope': scope });

		// The pattern paints the dedicated canvas background element...
		assert.ok(
			css.includes('.theme-dark .workspace-leaf-content[data-type="canvas"] .canvas-background'),
			`${scope}: must paint .canvas-background`,
		);
		// ...never the canvas wrapper that contains the node cards.
		assert.ok(
			!css.includes('.theme-dark .workspace-leaf-content[data-type="canvas"] .canvas-wrapper'),
			`${scope}: pattern must not paint .canvas-wrapper`,
		);

		// Cards are explicitly cleared and kept solid so the pattern cannot read
		// through their (sometimes translucent) content.
		const cardBlock = /\.theme-dark \.canvas-node-container,\n\.theme-dark \.canvas-node-content \{([\s\S]*?)\}/.exec(css);
		assert.ok(cardBlock, `${scope}: expected a canvas node card protection block`);
		const body = cardBlock![1] ?? '';
		assert.ok(body.includes('background-image: none !important;'), `${scope}: cards must clear the pattern`);
		assert.ok(
			body.includes('background-color: var(--background-primary) !important;'),
			`${scope}: cards must stay solid`,
		);

		// A card embeds a note, and the note's preview/editor layer is one of the
		// pattern's own paint targets, so it has to be cleared on that layer too.
		assert.ok(
			css.includes('.theme-dark .canvas-node-content .markdown-preview-view,'),
			`${scope}: embedded note preview must be cleared`,
		);
		assert.ok(
			css.includes('.theme-dark .canvas-node-content .markdown-source-view.mod-cm6 .cm-scroller,'),
			`${scope}: embedded note editor must be cleared`,
		);
	}
});

test('editor scope suppresses background pattern on side panels and menus', () => {
	const editorCss = backgroundCssFor({
		'--ui-bg-style': 'stars-and-stripes',
		'--ui-bg-scope': 'editor',
		'--ui-bg-animation': 'rain-scroll',
	});

	assert.match(editorCss, /\.workspace-split\.mod-left-split[\s\S]*background-image: none !important;/);
	assert.match(editorCss, /\.menu[\s\S]*background-image: none !important;/);
});

test('sub-menus, dropdown buttons, and settings menus never render custom background pattern', () => {
	for (const scope of ['workspace', 'editor'] as const) {
		for (const animation of ['rain-scroll', 'none'] as const) {
			const css = backgroundCssFor({
				'--ui-bg-style': 'matrix-rain',
				'--ui-bg-scope': scope,
				'--ui-bg-animation': animation,
			});

			// Dropdowns, selects and the settings dialog live in Obsidian's
			// top-level modal container, not inside anything these scopes paint.
			// A Chromium run over an Obsidian-shaped DOM confirmed that with the
			// old block gone not one element gains the pattern, focused or
			// unfocused, in any scope - so these now assert the thing that
			// matters rather than a restatement of Obsidian's own colours. The
			// workspace scope, which deliberately paints menus, keeps the full
			// block and is checked below.
			if (scope === 'workspace') {
				assert.match(css, /\.dropdown[\s\S]*background-image: none !important;/);
				assert.match(css, /\.setting-item-control select[\s\S]*background-image: none !important;/);
				assert.match(css, /\.setting-item-control select[\s\S]*background-color: var\(--background-secondary/);
			}

			// Sub-menus. The workspace scope paints menus on purpose, so it needs
			// the nested-menu exceptions spelled out. The other scopes cover every
			// menu, sub-menu included, with one `.menu` selector - a sub-menu is
			// still an element with class `menu`.
			if (scope === 'workspace') {
				assert.match(css, /\.menu ~ \.menu[\s\S]*background-image: none !important;/);
				assert.match(css, /\.menu ~ \.menu[\s\S]*background-color: var\(--background-secondary/);
				assert.match(css, /\.menu \.menu[\s\S]*background-image: none !important;/);
				assert.match(css, /\.menu\.sub-menu[\s\S]*background-image: none !important;/);
				assert.match(css, /\.menu\.mod-sub-menu[\s\S]*background-image: none !important;/);
			}
			// `.modal-container .menu` and `.canvas-wrapper .menu` only ever appeared
			// in the pseudo-element suppression list, which a static pattern no
			// longer emits because it creates no ::before layer to suppress. What
			// the test is really after is that menus and canvas UI never carry
			// the pattern, so it asks the rules that actually do that.
			assert.match(css, /\.menu[^{]*\{[^}]*background-image: none !important;/);
			assert.match(css, /\.canvas-(card-menu|node-toolbar|controls)[^{]*\{[^}]*background-image: none !important;/);

			// The settings dialog. The workspace scope paints the window behind it
			// and so has to name every surface inside it; the other scopes cannot
			// reach it at all - Obsidian renders it in a top-level modal container
			// - which a Chromium run over an Obsidian-shaped DOM confirmed for
			// every scope, animation and focus state. There they are covered by
			// the one `.modal` / `.modal-container` guard, asserted below.
			if (scope === 'workspace') {
				assert.match(css, /\.modal\.mod-settings[\s\S]*background-image: none !important;/);
				assert.match(css, /\.modal\.mod-settings[\s\S]*background-color: var\(--background-secondary/);
				assert.match(css, /\.vertical-tab-content[^{]*\{[^}]*background-image: none !important;/);
				assert.match(css, /\.modal\.mod-settings \.dropdown[\s\S]*background-image: none !important;/);
				assert.match(css, /\.modal\.mod-settings select[\s\S]*background-image: none !important;/);
				assert.match(css, /\.modal\.mod-sidebar-layout[\s\S]*background-image: none !important;/);
				assert.match(css, /\.vertical-tabs-container[\s\S]*background-image: none !important;/);
			} else {
				assert.match(css, /\.modal[^{]*\{[^}]*background-image: none !important;/);
				assert.match(css, /\.modal-container[^{]*\{[^}]*background-image: none !important;/);
			}

			// Modals must NEVER have background-image: url(...)
			assert.ok(!css.match(/\.modal:not\(\.mod-settings\)[\s\S]*background-image: url\(/));
		}
	}
});

test('workspace scope runs one synchronised animation instead of one per pane', () => {
	const matrixAnimatedCss = backgroundCssFor({
		'--ui-bg-style': 'matrix-rain',
		'--ui-bg-scope': 'workspace',
		'--ui-bg-animation': 'rain-scroll',
	});

	// The single backdrop carries the animation...
	assert.match(matrixAnimatedCss, /\.theme-dark \.app-container::before \{[\s\S]*animation: [^;]*css-bg-rain/);

	// ...and the panes are transparent so it shows through, with no
	// pseudo-element of their own to restart or duplicate the motion.
	assert.match(matrixAnimatedCss, /\.workspace-split\.mod-left-split[\s\S]*background-color: transparent !important;/);
	assert.ok(!/\.workspace-split\.mod-left-split::before \{[\s\S]*animation:/.test(matrixAnimatedCss));
	assert.ok(!/\.workspace-split\.mod-right-split::before \{[\s\S]*animation:/.test(matrixAnimatedCss));
	assert.equal((matrixAnimatedCss.match(/animation: /g) ?? []).length, 1);

	// Foreground items stay in front
	assert.match(matrixAnimatedCss, /\.nav-file-title[\s\S]*z-index: 1 !important;/);
});

test('canvas controls and left ribbon preserve native layout without forced relative positioning', () => {
	const matrixCss = backgroundCssFor({
		'--ui-bg-style': 'matrix-rain',
		'--ui-bg-scope': 'workspace',
		'--ui-bg-animation': 'rain-scroll',
	});

	// Canvas controls must not have position: relative forced (would stretch across canvas)
	assert.doesNotMatch(matrixCss, /\.canvas-controls[^{]*\{[^}]*position:\s*relative/);
	assert.doesNotMatch(matrixCss, /\.canvas-control-group[^{]*\{[^}]*position:\s*relative/);
	assert.match(matrixCss, /\.canvas-controls[^{]*\{[^}]*z-index:\s*2\s*!important;/);

	// Workspace ribbon must not receive overflow: clip or contain: paint (would collapse ribbon icons)
	assert.doesNotMatch(matrixCss, /\.workspace-ribbon\.mod-left[^{]*\{[^}]*contain:\s*paint/);
	assert.doesNotMatch(matrixCss, /\.workspace-ribbon\.mod-left[^{]*\{[^}]*overflow:\s*clip/);
	assert.doesNotMatch(matrixCss, /\.workspace-ribbon\.mod-left[^{]*\{[^}]*position:\s*relative/);

	// Neither canvas nor ribbon should have destructive wildcard relative child rules
	assert.doesNotMatch(matrixCss, /\.workspace-ribbon\.mod-left\s*>\s*\*[^\{]*\{[^}]*position:\s*relative/);
	assert.doesNotMatch(matrixCss, /\[data-type="canvas"\]\s*>\s*\*[^\{]*\{[^}]*position:\s*relative/);
});

test('workspace backdrop replaces the right-pane layer and the status bar stays solid', () => {
	const matrixCss = backgroundCssFor({
		'--ui-bg-style': 'matrix-rain',
		'--ui-bg-scope': 'workspace',
		'--ui-bg-animation': 'rain-scroll',
	});

	// Status bar must NOT render the background pattern
	assert.match(matrixCss, /\.status-bar[\s\S]*background-image: none !important;/);
	assert.doesNotMatch(matrixCss, /\.status-bar[^{]*\{[^}]*background-image:\s*url\(/);
	assert.doesNotMatch(matrixCss, /\.status-bar-item\.plugin-word-count/);

	// Right pane content is transparent so the single fixed backdrop shows through.
	assert.match(matrixCss, /\.workspace-split\.mod-right-split[\s\S]*background-color: transparent !important;/);
	assert.match(matrixCss, /\.backlink-pane[\s\S]*background-color: transparent !important;/);
	assert.match(matrixCss, /\.backlink-pane[\s\S]*background-image: none !important;/);

	// Exactly one animated layer for the whole window, on the app root.
	assert.match(matrixCss, /\.theme-dark \.app-container::before \{[\s\S]*animation: [^;]*css-bg-rain/);
	assert.ok(!/\.workspace-split\.mod-right-split::before \{[\s\S]*animation:/.test(matrixCss));
	assert.equal((matrixCss.match(/animation: /g) ?? []).length, 1);

	// Backlinks tab must NOT have a background pattern url applied directly to it
	assert.doesNotMatch(matrixCss, /\.workspace-leaf-content\[data-type="backlink"\][^{]*\{[^}]*background-image:\s*url\(/);
});

test('workspace rotation spins one layer for the whole window', () => {
	const css = backgroundCssFor({
		'--ui-bg-style': 'dot-grid',
		'--ui-bg-scope': 'workspace',
		'--ui-bg-motion-animation': 'rotate-cw',
	});

	assert.match(css, /\.theme-dark \.app-container::before \{[\s\S]*animation: [^;]*css-bg-rotate/);
	assert.match(css, /\.theme-dark \.app-container::before \{[\s\S]*width: 142vmax !important;/);
	assert.equal((css.match(/animation: /g) ?? []).length, 1);
});

test('workspace backdrop keeps the top bar legible without hiding its icons', () => {
	const css = backgroundCssFor({
		'--ui-bg-style': 'matrix-rain',
		'--ui-bg-scope': 'workspace',
		'--ui-bg-motion-animation': 'rain-scroll',
	});

	// The tab strip behind the transparent titlebar is opaque, so the pattern is
	// hidden there and the tab/sidebar/window-control icons stay visible.
	assert.match(css, /\.theme-dark \.workspace-tab-header-container \{\n  background-color: var\(--tab-container-background/);

	// The titlebar itself must stay transparent: it is the drag layer drawn over
	// the tab strip, so an opaque titlebar would cover those icons.
	assert.doesNotMatch(css, /\.theme-dark \.titlebar\s*\{[^}]*background-color:/);

	// The pattern layer sits behind the UI and never intercepts the pointer.
	assert.match(css, /\.theme-dark \.app-container::before \{[\s\S]*?pointer-events: none !important;/);
});

test('art deco pattern suite embeds authentic motifs and px-tile dimensions', () => {
	const artDecoStyles = ['deco-arches', 'deco-diamond', 'deco-fan', 'deco-scales', 'deco-sunburst'];

	for (const style of artDecoStyles) {
		const p = getBackgroundPatternCss(style, 24, 0.5, '#d4af37', true);
		assert.match(p.bgSize, /^\d+px \d+px$/, `${style} did not emit a px-tile dimension`);
		const svg = svgFor(style, 24);
		assert.ok(svg.length > 0, `${style} emitted no SVG`);
		assert.match(svg, /viewBox=/, `${style} missing viewBox`);
	}

	// deco-arches: pointed parabolic curves and vertical spine
	const archesSvg = svgFor('deco-arches', 24);
	assert.match(archesSvg, /Q[\d.\s]+/, 'deco-arches missing quadratic bezier arch curves');
	assert.match(archesSvg, /V[\d.]+/, 'deco-arches missing vertical spines');

	// deco-diamond: double-ruled diamond paths and tick accents
	const diamondSvg = svgFor('deco-diamond', 24);
	assert.match(diamondSvg, /M[\d.\s-]+L[^Z]+Z/, 'deco-diamond missing closed diamond lozenges');
	assert.match(diamondSvg, /H[\d.]+/, 'deco-diamond missing horizontal cross-tie ticks');

	// deco-fan: concentric arcs, radiating rays, and palmette fills
	const fanSvg = svgFor('deco-fan', 24);
	assert.match(fanSvg, /A[\d.\s]+/, 'deco-fan missing concentric circular/elliptical arcs');
	assert.match(fanSvg, /L[\d.\s]+/, 'deco-fan missing radiating ray lines');

	// deco-scales: fluted scallop curves and interior ribs
	const scalesSvg = svgFor('deco-scales', 24);
	assert.match(scalesSvg, /C[\d.\s]+/, 'deco-scales missing cubic bezier scallop arches');
	assert.match(scalesSvg, /L[\d.\s]+/, 'deco-scales missing interior fluting ribs');

	// deco-sunburst: diamond core, radiating polygon beam rays
	const sunburstSvg = svgFor('deco-sunburst', 24);
	assert.match(sunburstSvg, /<polygon points=/, 'deco-sunburst missing alternating solid ray facets');
	assert.match(sunburstSvg, /M[\d.\s]+L[\d.\s]+/, 'deco-sunburst missing radiating ray lines');
});

test('nature-inspired textures embed authentic organic geometry and px-tile dimensions', () => {
	const natureTextures = ['linen-weave', 'marble-veins', 'stone-slate', 'woodgrain'];

	for (const style of natureTextures) {
		const p = getBackgroundPatternCss(style, 24, 0.5, '#c5a059', true);
		assert.match(p.bgSize, /^\d+px \d+px$/, `${style} did not emit a px-tile dimension`);
		const svg = svgFor(style, 24);
		assert.ok(svg.length > 0, `${style} emitted no SVG`);
		assert.match(svg, /viewBox=/, `${style} missing viewBox`);
	}

	// linen-weave: yarn crowns and interwoven fiber guides
	const linenSvg = svgFor('linen-weave', 24);
	assert.match(linenSvg, /<rect x=/, 'linen-weave missing yarn crown rects');
	assert.match(linenSvg, /M0 [\d.]+H[\d.]+M[\d.]+ 0V[\d.]+/, 'linen-weave missing warp/weft guidelines');

	// marble-veins: meandering cubic curves and cloudy mineral strokes
	const marbleSvg = svgFor('marble-veins', 24);
	assert.match(marbleSvg, /C[\d.\s]+/, 'marble-veins missing meandering cubic bezier veins');
	assert.match(marbleSvg, /stroke-opacity='0\.0\d+'/, 'marble-veins missing cloudy mineral wash layer');

	// stone-slate: polygonal flagstone slabs, mortar joint outlines, and cleft markings
	const stoneSvg = svgFor('stone-slate', 24);
	assert.match(stoneSvg, /M0 0H[\d.]+L[^Z]+Z/, 'stone-slate missing polygonal stone slab paths');
	assert.match(stoneSvg, /stroke-linejoin='round'/, 'stone-slate missing rounded mortar joint strokes');

	// woodgrain: knot rings, parabolic cathedral growth curves, and longitudinal fibers
	const woodSvg = svgFor('woodgrain', 24);
	assert.match(woodSvg, /<ellipse cx=/, 'woodgrain missing central heartwood knot ellipses');
	assert.match(woodSvg, /C[\d.\s]+/, 'woodgrain missing curved cathedral growth rings');
	assert.match(woodSvg, /M[\d.\s]+0C[\d.\s]+/, 'woodgrain missing longitudinal timber fibers');
});

test('frutiger-aero pattern embeds glossy aqua orbs, aurora waves, and optical glints', () => {
	const p = getBackgroundPatternCss('frutiger-aero', 24, 0.5, '#38bdf8', true);
	assert.match(p.bgSize, /^\d+px \d+px$/, 'frutiger-aero did not emit a px-tile dimension');
	const svg = svgFor('frutiger-aero', 24);
	assert.ok(svg.length > 0, 'frutiger-aero emitted no SVG');
	assert.match(svg, /viewBox=/, 'frutiger-aero missing viewBox');

	// Blended gradients: radial orb gradient, ambient liquid halo, and linear ribbon gradient
	assert.match(svg, /<radialGradient id='fa-orb'/, 'frutiger-aero missing radial orb gradient');
	assert.match(svg, /<radialGradient id='fa-halo'/, 'frutiger-aero missing liquid halo gradient');

	// Glossy glass orbs: ambient halos, glass bodies, and specular crescent highlights
	assert.match(svg, /<circle cx=/, 'frutiger-aero missing glass orb circles');
	assert.match(svg, /<ellipse cx='[\d.]+' cy='[\d.]+' rx='[\d.]+' ry='[\d.]+' transform='rotate\(-30/, 'frutiger-aero missing glossy specular highlights');

	// Aerodynamic aurora ribbons and 2D wave weaves
	assert.match(svg, /<path d='M0 [\d.]+C[^Z]+Z'/, 'frutiger-aero missing flowing aurora ribbon');

	// Integrated eco-tendril streamlines
	assert.match(svg, /M0 0 C-6 -8 -4 -20 4 -28/, 'frutiger-aero missing eco-tendril streamlines');
});

test('ocean-waves pattern embeds Japanese ukiyo-e wave crests, foam claws, and spray droplets', () => {
	const p = getBackgroundPatternCss('ocean-waves', 24, 0.5, '#0284c7', true);
	assert.match(p.bgSize, /^\d+px \d+px$/, 'ocean-waves did not emit a px-tile dimension');
	assert.strictEqual(p.bgPosition, 'center', 'ocean-waves should render in the center');
	assert.strictEqual(p.bgRepeat, 'no-repeat', 'ocean-waves should be non-tiled');
	assert.strictEqual(p.bgAttachment, 'fixed', 'ocean-waves should be fixed background');
	const svg = svgFor('ocean-waves', 24);
	assert.ok(svg.length > 0, 'ocean-waves emitted no SVG');
	assert.match(svg, /viewBox=/, 'ocean-waves missing viewBox');

	// Swell contours and concentric water striations (namisuji)
	assert.match(svg, /<path d='M-?[\d.]+\s+[\d.]+C/, 'ocean-waves missing wave swell paths');

	// Authentic Great Wave off Kanagawa elements: Mount Fuji and Oshiokuri-bune cargo boat
	assert.match(svg, /id='mt-fuji'/, 'ocean-waves missing Mount Fuji element');
	assert.match(svg, /id='oshiokuri-boat'/, 'ocean-waves missing Oshiokuri cargo boat element');

	// Dragon claw talons (namigashira) and flying sea spray droplets (shibuki beads)
	assert.match(svg, /<path d='M-?[\d.]+\s+[\d.]+C[^']*' fill='#ffffff' fill-opacity='[^']+' stroke='#/, 'ocean-waves missing dragon claw talons');
	assert.match(svg, /<circle cx='[^']+' cy='[^']+' r='[^']+' fill='#ffffff'/, 'ocean-waves missing spray droplet circles');

	// Opacity slider controls the entire artwork
	const pLow = getBackgroundPatternCss('ocean-waves', 24, 0.2, '#0284c7', true);
	assert.ok(decodeURIComponent(pLow.bgImage).includes("opacity='0.200'"), 'ocean-waves should apply opacity 0.2');
	const pHigh = getBackgroundPatternCss('ocean-waves', 24, 0.8, '#0284c7', true);
	assert.ok(decodeURIComponent(pHigh.bgImage).includes("opacity='0.800'"), 'ocean-waves should apply opacity 0.8');
});

test('math pattern embeds iconic mathematical formulas, typography, and diagram sketches', () => {
	const svg = svgFor('math', 24);
	assert.ok(svg.length > 0, 'math emitted no SVG');
	assert.match(svg, /viewBox='0 0 600 400'/, 'math missing viewBox');

	// Key mathematical formulas
	assert.match(svg, /E = mc²/, 'math missing mass-energy equivalence');
	assert.match(svg, /eⁱᵖ \+ 1 = 0/, "math missing Euler's identity");
	assert.match(svg, /a² \+ b² = c²/, 'math missing Pythagorean theorem');
	assert.match(svg, /iℏ ∂ψ\/∂t = Ĥψ/, 'math missing Schrödinger equation');
	assert.match(svg, /∫ e⁻ˣ² dx = √π/, 'math missing Gaussian integral');
	assert.match(svg, /x = \(-b ± √\(b² - 4ac\)\) \/ 2a/, 'math missing quadratic formula');
	assert.match(svg, /S = k ln Ω/, 'math missing Boltzmann entropy formula');

	// Chalkboard sketches / diagrams
	assert.match(svg, /y=x²/, 'math missing coordinate axes sketch');
	assert.match(svg, /font-style='italic'>θ<\/text>/, 'math missing unit circle angle theta');

	// Responsive tile scaling with slider
	const pSmall = getBackgroundPatternCss('math', 16, 0.5, '#ffffff', true);
	assert.match(pSmall.bgSize, /300px 200px/, 'math should clamp to minimum 300px width');
	const pLarge = getBackgroundPatternCss('math', 32, 0.5, '#ffffff', true);
	assert.match(pLarge.bgSize, /576px 384px/, 'math should scale proportionally with slider');
});

test('circuit-traces uses thin strokes and aligns seamlessly across opposing tile boundaries', () => {
	const svg = svgFor('circuit-traces', 24);
	assert.ok(svg.length > 0, 'circuit-traces emitted no SVG');
	assert.match(svg, /viewBox='0 0 96 96'/, 'circuit-traces missing viewBox');

	// Thinner circuit traces: stroke-width <= 0.85
	assert.match(svg, /stroke-width='0.85'/, 'circuit-traces missing thin primary copper traces');
	assert.doesNotMatch(svg, /stroke-width='1.4'/, 'circuit-traces should not use old thick 1.4px strokes');

	// Seamless boundary alignment: horizontal bus paths at y in {12, 32, 52, 72, 88}
	assert.match(svg, /M0 12H/, 'circuit-traces missing left entry at y=12');
	assert.match(svg, /H96/, 'circuit-traces missing right exit at y=12');
	assert.match(svg, /M0 32H/, 'circuit-traces missing left entry at y=32');
	assert.match(svg, /M0 52H/, 'circuit-traces missing left entry at y=52');
	assert.match(svg, /M0 72H/, 'circuit-traces missing left entry at y=72');
	assert.match(svg, /M0 88H/, 'circuit-traces missing left entry at y=88');

	// Seamless boundary alignment: vertical bus paths at x in {12, 32, 52, 72, 88}
	assert.match(svg, /M12 0V/, 'circuit-traces missing top entry at x=12');
	assert.match(svg, /V96/, 'circuit-traces missing bottom exit');
	assert.match(svg, /M32 0V/, 'circuit-traces missing top entry at x=32');
	assert.match(svg, /M52 0V/, 'circuit-traces missing top entry at x=52');
	assert.match(svg, /M72 0V/, 'circuit-traces missing top entry at x=72');
	assert.match(svg, /M88 0V/, 'circuit-traces missing top entry at x=88');

	// Refined central chip and vias
	assert.match(svg, /<rect x='41' y='41' width='14' height='14'/, 'circuit-traces missing central QFN microchip');
	assert.match(svg, /<circle cx='20' cy='20' r='1.6'/, 'circuit-traces missing junction via');
});


/**
 * A static pattern paints its containers directly. The pseudo-element
 * suppression list exists to stop the plugin's own animated ::before layer from
 * covering menus and utility panes - so with no such layer in play it was
 * several dozen selectors telling the browser to hide something that was never
 * created.
 */
test('pseudo-element suppression is emitted only for animations that use a ::before layer', () => {
	const staticCss = backgroundCssFor({ '--ui-bg-style': 'dot-grid' });
	assert.ok(
		!staticCss.includes('/* Suppress pseudo-element layers'),
		'a static pattern creates no ::before layer, so there is nothing to suppress'
	);

	const layeredCss = backgroundCssFor({
		'--ui-bg-style': 'dot-grid',
		'--ui-bg-motion-animation': 'drift',
	});
	assert.ok(
		layeredCss.includes('/* Suppress pseudo-element layers'),
		'an animation riding on ::before still has to keep that layer off menus'
	);
});

test('dropping the suppression list does not cost a static pattern its protection', () => {
	const css = backgroundCssFor({ '--ui-bg-style': 'dot-grid' });
	assert.match(css, /\.menu[^{]*\{[^}]*background-image: none !important;/, 'menus stay clear of the pattern');
	assert.match(
		css,
		/\.canvas-(card-menu|node-toolbar|controls)[^{]*\{[^}]*background-image: none !important;/,
		'canvas elements stay clear of the pattern'
	);
	assert.match(css, /background-image: radial-gradient/, 'and the pattern itself is still painted');
});

/**
 * The editor and side-panel scopes paint containers inside the note views.
 * Obsidian renders menus, popovers, prompts and the settings dialog at the top
 * of the document, so the pattern cannot reach them - which is why those scopes
 * carry one short guard rather than the several-hundred-selector block the
 * workspace scope needs, where menus are painted deliberately.
 *
 * This was checked by rendering both versions in Chromium against a DOM shaped
 * like Obsidian's, in every scope, animation and focus state: no element gained
 * the pattern. The parts of that block which turned out to do real work - the
 * stacking order for menus inside painted leaves, and keeping the native
 * checkbox behind Obsidian's toggle switches hidden - were kept, and are
 * asserted here so they are not lost to a later tidy-up.
 */
test('the scoped guard keeps what the long UI block was actually for', () => {
	for (const scope of ['editor', 'sidebars'] as const) {
		const css = backgroundCssFor({ '--ui-bg-style': 'dot-grid', '--ui-bg-scope': scope });

		assert.match(css, /\.menu[^{]*\{[^}]*background-image: none !important;/, `${scope}: menus must not carry the pattern`);
		assert.match(css, /\.menu[^{]*\{[^}]*z-index: 1000 !important;/, `${scope}: menus must stay above the painted, isolated leaves`);
		assert.match(
			css,
			/\.checkbox-container input\[type="checkbox"\][^{]*\{[^}]*opacity: 0 !important;/,
			`${scope}: the native checkbox behind a settings toggle must stay hidden`
		);
		assert.match(css, /\.modal-container[^{]*\{[^}]*background-image: none !important;/, `${scope}: modals must not carry the pattern`);

		// And the restatements of Obsidian's own colours are gone.
		assert.ok(
			!/\.setting-item-control select/.test(css),
			`${scope}: settings controls are unreachable here and need no rule`
		);
	}
});

test('the workspace scope keeps the full block, because it paints menus on purpose', () => {
	const css = backgroundCssFor({ '--ui-bg-style': 'dot-grid', '--ui-bg-scope': 'workspace' });
	assert.match(css, /\.setting-item-control select/, 'workspace still spells out the settings controls');
	assert.match(css, /\.menu ~ \.menu/, 'workspace still spells out the nested-menu exceptions');
});
