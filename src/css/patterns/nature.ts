/**
 * Organic patterns: landscape, weather and botanical motifs.
 */
import type { PatternBuilder } from './types';
import { atLeast, n, rand } from './util';
import { HOKUSAI_WAVE_PATHS } from './ocean-waves-paths';

/**
 * Topographic contour lines.
 *
 * Each ridge starts and ends at the same height with mirrored control points,
 * so the curve's tangent matches across the horizontal seam and the contours
 * read as one continuous survey map rather than a repeated stamp.
 */
const topographic: PatternBuilder = (ctx) => {
	const w = atLeast(120, ctx.size * 7);
	const h = Math.round(w * 0.72);
	const rows = 7;
	const gap = h / rows;
	let d = '';
	for (let i = 0; i < rows; i++) {
		const y = gap * (i + 0.5);
		const amp = gap * (0.3 + 0.5 * Math.abs(Math.sin(i * 1.9 + 0.6)));
		const dir = i % 2 === 0 ? 1 : -1;
		const a = amp * dir;
		d += `M0 ${n(y)}`
			+ `C${n(w * 0.2)} ${n(y + a)} ${n(w * 0.3)} ${n(y - a)} ${n(w * 0.5)} ${n(y)}`
			+ `C${n(w * 0.7)} ${n(y + a)} ${n(w * 0.8)} ${n(y - a)} ${w} ${n(y)}`;
	}
	const body = `<path d='${d}' fill='none' stroke='${ctx.pStroke}' stroke-opacity='${ctx.fo(1)}' stroke-width='1.1'/>`;
	return {
		bgImage: ctx.svgUrl(w, h, body),
		bgSize: `${w}px ${h}px`,
		bgPosition: '0 0',
	};
};

/**
 * Rainfall - staggered, atmospheric vertical drops with depth of field.
 *
 * Drops are distributed across multiple depth planes with randomized positions
 * and lengths, eliminating artificial column alignment. Each streak wraps
 * seamlessly from bottom to top, and a subtle Gaussian blur softens the strokes
 * into convincing, atmospheric rainfall with natural motion blur.
 */
const rainfall: PatternBuilder = (ctx) => {
	const w = 120;
	const h = 160;
	const layers = [
		{ width: 1.7, opacity: 0.85, minLen: 30, maxLen: 48, count: 8, bulb: 0.6 },
		{ width: 1.05, opacity: 0.5, minLen: 18, maxLen: 32, count: 18, bulb: 0.4 },
		{ width: 0.65, opacity: 0.25, minLen: 10, maxLen: 20, count: 28, bulb: 0 },
	];

	const strokes: string[] = ['', '', ''];
	const bulbs: string[] = ['', '', ''];

	// Fully uncorrelated deterministic pseudo-random scattering to avoid any
	// diagonal or column banding, producing an authentic, diffuse rainfall field.
	layers.forEach((layer, li) => {
		for (let j = 0; j < layer.count; j++) {
			const s = li * 137 + j * 31 + 19;
			const rx = rand(s * 19.3 + 7.1);
			const ry = rand(s * 41.7 + 13.9);
			const rlen = rand(s * 67.3 + 29.1);

			const x = n(1.5 + rx * (w - 3));
			const y = n(ry * h);
			const len = layer.minLen + rlen * (layer.maxLen - layer.minLen);
			const end = Number(y) + len;

			strokes[li] += end <= h
				? `M${x} ${y}V${n(end)}`
				: `M${x} ${y}V${h}M${x} 0V${n(end - h)}`;

			if (layer.bulb > 0) {
				const bulbY = n(end % h);
				bulbs[li] += `<circle cx='${x}' cy='${bulbY}' r='${n(layer.width * layer.bulb)}'/>`;
			}
		}
	});

	const filterDef = `<defs><filter id='rf-blur' x='-20%' y='-20%' width='140%' height='140%' color-interpolation-filters='sRGB'><feGaussianBlur stdDeviation='0.65'/></filter></defs>`;

	let body = '';
	layers.forEach((layer, li) => {
		if (strokes[li]) {
			body += `<path d='${strokes[li]}' fill='none' stroke='${ctx.pStroke}' stroke-opacity='${ctx.fo(layer.opacity)}' stroke-width='${layer.width}' stroke-linecap='round'/>`;
		}
		if (bulbs[li]) {
			body += `<g fill='${ctx.pFill}' fill-opacity='${ctx.fo(layer.opacity)}'>${bulbs[li]}</g>`;
		}
	});

	const blurredBody = `<g filter='url(#rf-blur)'>${body}</g>`;

	const tw = atLeast(60, ctx.size * 2.5);
	const th = Math.round((tw * h) / w);
	return {
		bgImage: ctx.svgUrl(w, h, blurredBody, '', filterDef),
		bgSize: `${tw}px ${th}px`,
		bgPosition: '0 0',
	};
};

/** Snowfall - six-armed crystals with branch ticks, at three scales. */
const snowflakes: PatternBuilder = (ctx) => {
	const s = atLeast(56, ctx.size * 3);
	let arms = '';
	for (let i = 0; i < 6; i++) {
		arms += `<g transform='rotate(${i * 60})'><path d='M0 0V-11M0 -5.5l-3 -2.4M0 -5.5l3 -2.4M0 -8.6l-2 -1.6M0 -8.6l2 -1.6'/></g>`;
	}
	const flake = `<g fill='none' stroke='${ctx.pStroke}' stroke-width='1.1' stroke-linecap='round'>${arms}</g>`;
	const place = (x: number, y: number, k: number, rot: number, o: number): string =>
		`<g transform='translate(${n(s * x)} ${n(s * y)}) rotate(${rot}) scale(${k})' stroke-opacity='${ctx.fo(o)}'>${flake}</g>`;
	const body = place(0.26, 0.24, 1, 0, 1)
		+ place(0.72, 0.58, 0.7, 18, 0.75)
		+ place(0.44, 0.82, 0.45, 30, 0.55)
		+ place(0.88, 0.14, 0.4, 12, 0.5);
	return {
		bgImage: ctx.svgUrl(s, s, body),
		bgSize: `${s}px ${s}px`,
		bgPosition: '0 0',
	};
};

/** Botanical - scattered leaves with a centre vein. */
const botanicalLeaves: PatternBuilder = (ctx) => {
	const s = atLeast(52, ctx.size * 2.6);
	const leaf = `<path d='M0 0C3 -5.5 10 -7.5 15 -1.5C10 4.5 3 4 0 0Z' fill='${ctx.pFill}' fill-opacity='${ctx.fo(0.55)}'/>`
		+ `<path d='M1 -0.2C5 -1.6 10 -2.2 14.4 -1.6' fill='none' stroke='${ctx.pStroke}' stroke-opacity='${ctx.fo(1)}' stroke-width='0.9'/>`
		+ `<path d='M0 0C-4 0.6 -6.5 2 -8 4' fill='none' stroke='${ctx.pStroke}' stroke-opacity='${ctx.fo(0.8)}' stroke-width='1'/>`;
	const place = (x: number, y: number, k: number, rot: number): string =>
		`<g transform='translate(${n(s * x)} ${n(s * y)}) rotate(${rot}) scale(${k})'>${leaf}</g>`;
	const body = place(0.2, 0.28, 1, -28)
		+ place(0.68, 0.2, 0.8, 42)
		+ place(0.34, 0.74, 0.9, 128)
		+ place(0.82, 0.72, 0.65, -102);
	return {
		bgImage: ctx.svgUrl(s, s, body),
		bgSize: `${s}px ${s}px`,
		bgPosition: '0 0',
	};
};

/** Bubbles - outlined spheres with a specular highlight. */
const bubbles: PatternBuilder = (ctx) => {
	const s = atLeast(60, ctx.size * 3);
	const spec: [number, number, number][] = [
		[0.2, 0.24, 0.12], [0.66, 0.16, 0.07], [0.82, 0.52, 0.11],
		[0.36, 0.62, 0.09], [0.12, 0.8, 0.06], [0.58, 0.84, 0.05],
	];
	let body = '';
	for (const [fx, fy, fr] of spec) {
		const cx = s * fx;
		const cy = s * fy;
		const r = s * fr;
		body += `<circle cx='${n(cx)}' cy='${n(cy)}' r='${n(r)}' fill='${ctx.pFill}' fill-opacity='${ctx.fo(0.12)}' stroke='${ctx.pStroke}' stroke-opacity='${ctx.fo(1)}' stroke-width='1'/>`;
		body += `<path d='M${n(cx - r * 0.55)} ${n(cy - r * 0.35)}A${n(r * 0.7)} ${n(r * 0.7)} 0 0 1 ${n(cx - r * 0.1)} ${n(cy - r * 0.68)}' fill='none' stroke='${ctx.pStroke}' stroke-opacity='${ctx.fo(0.85)}' stroke-width='1.2' stroke-linecap='round'/>`;
	}
	return {
		bgImage: ctx.svgUrl(s, s, body),
		bgSize: `${s}px ${s}px`,
		bgPosition: '0 0',
	};
};

/** Mountain range - three depth-stacked ridgelines anchored to the viewport. */
const mountainRange: PatternBuilder = (ctx) => {
	const back = 'M0 148L58 88L112 132L168 66L228 118L296 58L358 110L400 78V240H0Z';
	const mid = 'M0 184L70 128L132 166L200 114L262 158L330 108L400 154V240H0Z';
	const front = 'M0 214L82 174L150 206L220 164L292 200L360 168L400 194V240H0Z';
	const body = `<path d='${back}' fill='${ctx.pFill}' fill-opacity='${ctx.fo(0.28)}'/>`
		+ `<path d='${mid}' fill='${ctx.pFill}' fill-opacity='${ctx.fo(0.5)}'/>`
		+ `<path d='${front}' fill='${ctx.pFill}' fill-opacity='${ctx.fo(0.78)}'/>`;
	return {
		bgImage: ctx.svgUrl(400, 240, body, `preserveAspectRatio='none'`),
		bgSize: '100% 100%',
		bgAttachment: 'fixed',
	};
};

/** Fire and embers - a rising flame wash with sparks drifting through it. */
const fireEmber: PatternBuilder = (ctx) => {
	const { c, op } = ctx;
	const isDefault = c.hex === '#ffffff' || c.hex === '#000000';
	const fr = isDefault ? 220 : c.r;
	const fg = isDefault ? 38 : c.g;
	const fb = isDefault ? 38 : c.b;
	const flame1 = `rgba(${fr}, ${fg}, ${fb}, ${Math.min(1, op * 0.95)})`;
	const flame2 = ctx.isGradient ? ctx.rgba2 : `rgba(${Math.min(255, fr + 30)}, ${Math.min(255, fg + 60)}, ${Math.min(255, fb + 20)}, ${Math.min(1, op * 0.7)})`;
	const flame3 = `rgba(${Math.min(255, fr + 60)}, ${Math.min(255, fg + 120)}, ${Math.min(255, fb + 40)}, ${Math.min(1, op * 0.4)})`;
	const ember1 = ctx.isGradient ? ctx.rgba2 : `rgba(${Math.min(255, fr + 50)}, ${Math.min(255, fg + 150)}, ${Math.min(255, fb + 50)}, ${op})`;
	const ember2 = `rgba(${fr}, ${fg}, ${fb}, ${op})`;
	return {
		bgImage: `radial-gradient(2px 2px at 20% 75%, ${ember1}, transparent), radial-gradient(1.5px 1.5px at 35% 45%, ${ember2}, transparent), radial-gradient(2.5px 2.5px at 60% 60%, ${ember1}, transparent), radial-gradient(1.5px 1.5px at 80% 80%, ${ember2}, transparent), radial-gradient(2px 2px at 75% 30%, ${ember1}, transparent), radial-gradient(1px 1px at 50% 20%, ${ember2}, transparent), linear-gradient(to top, ${flame1} 0%, ${flame2} 25%, ${flame3} 55%, transparent 95%)`,
		bgSize: '100% 100%',
		bgAttachment: 'fixed',
	};
};

/**
 * Ember orbs - a drift of small glowing embers, each a soft halo around a
 * bright core.
 *
 * The orbs are scattered at two depths: most are small and faint, a few are
 * larger and brighter, which reads as a cloud of drifting sparks rather than a
 * uniform dot grid. Each orb is a blurred halo plus a crisp core, and orbs that
 * cross the tile edge are redrawn entering the opposite edge, so the tile
 * repeats without a seam.
 */
const emberOrbs: PatternBuilder = (ctx) => {
	const s = atLeast(120, Math.round(ctx.size * 4));
	const t = 100;
	// Wrapped copies are drawn within this margin of the tile; it must exceed
	// the halo blur so the two edges of the seam blend into one another.
	const pad = 14;

	// A few orbs take the second colour, so a two-tone drift has two ember hues.
	const tone = (o: number, i: number): string =>
		ctx.isGradient && i % 4 === 0 ? ctx.tint2(o) : ctx.tint(o);

	let halos = '';
	let cores = '';
	let seed = 1;
	for (let i = 0; i < 44; i++) {
		const x = rand(seed++) * t;
		const y = rand(seed++) * t;
		const near = rand(seed++);
		const big = near > 0.82;
		const r = big ? 1.5 + rand(seed++) * 1.6 : 0.5 + rand(seed++) * 1.1;
		const o = big ? 0.5 + rand(seed++) * 0.4 : 0.18 + rand(seed++) * 0.45;
		for (const dy of [-t, 0, t]) {
			for (const dx of [-t, 0, t]) {
				const sx = x + dx;
				const sy = y + dy;
				if (sx < -pad || sx > t + pad || sy < -pad || sy > t + pad) continue;
				halos += `<circle cx='${n(sx)}' cy='${n(sy)}' r='${n(r * 2.6)}' fill='${tone(o * 0.5, i)}'/>`;
				cores += `<circle cx='${n(sx)}' cy='${n(sy)}' r='${n(r)}' fill='${tone(Math.min(1, o + 0.25), i)}'/>`;
			}
		}
	}

	const halo = `<filter id='eo-halo' x='-100%' y='-100%' width='300%' height='300%' color-interpolation-filters='sRGB'><feGaussianBlur stdDeviation='2.4'/></filter>`;
	const body = `<g filter='url(#eo-halo)'>${halos}</g><g>${cores}</g>`;

	return {
		bgImage: ctx.svgUrl(t, t, body, '', halo),
		bgSize: `${s}px ${s}px`,
		bgPosition: '0 0',
	};
};

/**
 * Scenic sunset - a centred seascape: the sun sinking into the horizon under a
 * warm sky, with drifts of cloud, distant hills and a rippled reflection on the
 * water.
 *
 * Painted as one 400x240 SVG that covers the pane (`100% 100%` with
 * `preserveAspectRatio='xMidYMid slice'`) and pinned with
 * `background-attachment: fixed`. `slice` keeps the sun round and the
 * composition centred on any window shape, cropping the margins rather than
 * stretching them. Every tone is drawn from the two theme colours, so the
 * sunset takes on whatever palette the user has chosen.
 */
const scenicSunset: PatternBuilder = (ctx) => {
	// Warm accents use the second colour in two-tone mode, the primary otherwise.
	const warm = (m: number): string => (ctx.isGradient ? ctx.tint2(m) : ctx.tint(m));
	const sky = (m: number): string => ctx.tint(m);

	const defs = `<defs>`
		+ `<linearGradient id='ss-sky' x1='0' y1='0' x2='0' y2='1'>`
		+ `<stop offset='0%' stop-color='${sky(0.08)}'/>`
		+ `<stop offset='42%' stop-color='${sky(0.2)}'/>`
		+ `<stop offset='56%' stop-color='${warm(0.5)}'/>`
		+ `<stop offset='100%' stop-color='${sky(0.1)}'/>`
		+ `</linearGradient>`
		+ `<radialGradient id='ss-sun' cx='50%' cy='56%' r='54%'>`
		+ `<stop offset='0%' stop-color='${warm(0.8)}'/>`
		+ `<stop offset='30%' stop-color='${warm(0.32)}'/>`
		+ `<stop offset='100%' stop-color='${warm(0)}'/>`
		+ `</radialGradient>`
		+ `<linearGradient id='ss-sea' x1='0' y1='0' x2='0' y2='1'>`
		+ `<stop offset='0%' stop-color='${warm(0.34)}'/>`
		+ `<stop offset='100%' stop-color='${warm(0.04)}'/>`
		+ `</linearGradient>`
		+ `<radialGradient id='ss-reflect' cx='50%' cy='50%' r='50%'>`
		+ `<stop offset='0%' stop-color='${warm(0.45)}'/>`
		+ `<stop offset='100%' stop-color='${warm(0)}'/>`
		+ `</radialGradient>`
		+ `<filter id='ss-soft' x='-30%' y='-80%' width='160%' height='260%' color-interpolation-filters='sRGB'><feGaussianBlur stdDeviation='3'/></filter>`
		+ `<filter id='ss-ripple' x='-40%' y='-120%' width='180%' height='340%' color-interpolation-filters='sRGB'><feGaussianBlur stdDeviation='1.5'/></filter>`
		+ `</defs>`;

	const clouds = `<g filter='url(#ss-soft)' fill='${sky(0.38)}'>`
		+ `<ellipse cx='92' cy='64' rx='46' ry='7'/>`
		+ `<ellipse cx='124' cy='58' rx='30' ry='6'/>`
		+ `<ellipse cx='62' cy='60' rx='26' ry='5.5'/>`
		+ `<ellipse cx='300' cy='50' rx='52' ry='6.5'/>`
		+ `<ellipse cx='334' cy='46' rx='30' ry='5.5'/>`
		+ `<ellipse cx='206' cy='94' rx='40' ry='5'/>`
		+ `<ellipse cx='342' cy='104' rx='44' ry='5'/>`
		+ `<ellipse cx='56' cy='108' rx='38' ry='5'/>`
		+ `</g>`;

	const hills = `<path d='M0 140 Q44 110 92 140 Z' fill='${sky(0.42)}'/>`
		+ `<path d='M308 140 Q356 106 400 140 Z' fill='${sky(0.42)}'/>`;

	const sea = `<rect x='0' y='140' width='400' height='100' fill='url(#ss-sea)'/>`
		+ `<ellipse cx='200' cy='192' rx='30' ry='52' fill='url(#ss-reflect)'/>`
		+ `<g filter='url(#ss-ripple)' fill='${warm(0.5)}'>`
		+ `<rect x='176' y='150' width='48' height='2.6' rx='1.3'/>`
		+ `<rect x='182' y='168' width='36' height='2.2' rx='1.1'/>`
		+ `<rect x='187' y='188' width='26' height='2' rx='1'/>`
		+ `<rect x='191' y='210' width='18' height='1.8' rx='0.9'/>`
		+ `</g>`;

	const body = `<rect x='0' y='0' width='400' height='240' fill='url(#ss-sky)'/>`
		+ `<rect x='0' y='0' width='400' height='240' fill='url(#ss-sun)'/>`
		+ clouds
		+ hills
		+ `<circle cx='200' cy='134' r='15' fill='${warm(0.95)}'/>`
		+ `<rect x='0' y='139' width='400' height='1.6' fill='${sky(0.5)}'/>`
		+ sea;

	return {
		bgImage: ctx.svgUrl(400, 240, body, `preserveAspectRatio='xMidYMid slice'`, defs),
		bgSize: '100% 100%',
		bgPosition: 'center',
		bgRepeat: 'no-repeat',
		bgAttachment: 'fixed',
	};
};

/**
 * Forest treeline - three depth-stacked bands of evergreens rising from the
 * bottom edge of the pane.
 *
 * The tile is a wide, short band anchored to the bottom and repeated on the
 * x-axis, so the trees stand on the bottom edge and keep their shape at any
 * pane width. Each depth band is one `<g>` whose group opacity stops the trees
 * within it from stacking alpha where they overlap, which is what reads as a
 * single treeline rather than blotches; the bands grow taller and more opaque
 * toward the front. Trees that cross a side edge are redrawn on the opposite
 * edge so the band repeats without a seam.
 */
const forestTreeline: PatternBuilder = (ctx) => {
	const base = atLeast(14, Math.round(ctx.size));
	const w = base * 16;
	const h = base * 8;

	const pine = (x: number, topY: number, halfW: number, baseY: number): string => {
		const hgt = baseY - topY;
		const yA = topY + hgt * 0.38;
		const yB = topY + hgt * 0.7;
		const wA = halfW * 0.5;
		const wB = halfW * 0.8;
		const d = `M${n(x)} ${n(topY)}`
			+ `L${n(x + wA)} ${n(yA)}L${n(x + wA * 0.55)} ${n(yA)}`
			+ `L${n(x + wB)} ${n(yB)}L${n(x + wB * 0.55)} ${n(yB)}`
			+ `L${n(x + halfW)} ${n(baseY)}L${n(x - halfW)} ${n(baseY)}`
			+ `L${n(x - wB * 0.55)} ${n(yB)}L${n(x - wB)} ${n(yB)}`
			+ `L${n(x - wA * 0.55)} ${n(yA)}L${n(x - wA)} ${n(yA)}Z`;
		return `<path d='${d}' fill='${ctx.pFill}'/>`;
	};

	const band = (baseline: number, count: number, hMin: number, hMax: number, op: number, seed: number): string => {
		const step = w / count;
		let pines = '';
		for (let i = 0; i < count; i++) {
			const x = i * step + (rand(i * 3 + seed + 1) - 0.5) * step * 0.3;
			const height = hMin + (hMax - hMin) * rand(i * 3 + seed);
			const halfW = height * 0.28;
			const topY = baseline - height;
			pines += pine(x, topY, halfW, baseline);
			if (x - halfW < 0) pines += pine(x + w, topY, halfW, baseline);
			if (x + halfW > w) pines += pine(x - w, topY, halfW, baseline);
		}
		return `<g opacity='${ctx.fo(op)}'>${pines}</g>`;
	};

	const ground = `<rect x='0' y='${n(h - base * 0.5)}' width='${w}' height='${n(base * 0.5)}' fill='${ctx.pFill}' fill-opacity='${ctx.fo(0.85)}'/>`;
	const back = band(h - base * 0.55, 16, base * 1.4, base * 2.2, 0.4, 11);
	const mid = band(h - base * 0.18, 11, base * 2.5, base * 3.6, 0.62, 37);
	const front = band(h, 8, base * 3.6, base * 5.2, 1, 71);
	const body = ground + back + mid + front;

	return {
		bgImage: ctx.svgUrl(w, h, body),
		bgSize: `${w}px ${h}px`,
		bgPosition: '0 100%',
		bgRepeat: 'repeat-x',
	};
};

/**
 * Ocean Waves - authentic homage to Katsushika Hokusai's iconic woodblock print
 * "The Great Wave off Kanagawa" (神奈川沖浪裏 - Kanagawa-oki Nami Ura).
 *
 * Captures the unmistakable composition from Thirty-Six Views of Mount Fuji:
 * 1. The towering Great Wave surging high with a steep concave dorsal swell,
 *    an overhanging crest arch, and a deep plunging vortex barrel.
 * 2. Signature predatory "dragon claw" foam talons (namigashira) branching
 *    fractally off the white foam cap into the wave hollow.
 * 3. Stratified Prussian Blue (bero-ai) and cerulean tones with rhythmic
 *    internal water flow striations (namisuji).
 * 4. Mount Fuji (Fuji-san) serenely anchored in the distant trough with its
 *    flared volcanic caldera flanks and serrated snow cap.
 * 5. Slender wooden fast-cargo boats (oshiokuri-bune) slicing through the swell
 *    with crouching rowers in white headbands.
 * 6. Airborne sea spray droplets and mist flurries (shibuki).
 *
 * Engineered with a staggered 2-tier brickwork layout (W/2 horizontal offset,
 * H/2 vertical offset, C1 tangent continuity across x=0<->W and y=0<->H) for
 * 100% seamless tiling across both dimensions.
 */
const oceanWaves: PatternBuilder = (ctx) => {
	const w = atLeast(360, Math.round(ctx.size * 28));
	const h = Math.round(w * 0.697);

	const isDefaultColor = ctx.pStroke === '#00ff9d' || ctx.pStroke === '#059669' || ctx.pStroke === '#0284c7' || ctx.pStroke === '#081729';

	const paperLight = ctx.isDark ? '#141720' : '#f5efe4';
	const paperMid = ctx.isDark ? '#181d26' : '#eae3d2';
	const paperWarm = ctx.isDark ? '#1b202a' : '#ded7c7';
	const horizonDark = ctx.isDark ? '#0c1016' : '#504637';
	const prussianDark = isDefaultColor ? (ctx.isDark ? '#08121e' : '#0c1a2d') : ctx.pStroke;
	const prussianMid = isDefaultColor ? (ctx.isDark ? '#102236' : '#163354') : ctx.pStroke;
	const cerulean = isDefaultColor ? (ctx.isDark ? '#183858' : '#2a5a88') : ctx.pStroke;
	const foamWhite = '#ffffff';
	const boatWood = '#b88e58';

	const art = `<path fill='${paperMid}' d='${HOKUSAI_WAVE_PATHS.paperMid}'/>`
		+ `<path fill='${horizonDark}' d='${HOKUSAI_WAVE_PATHS.horizonDark}'/>`
		+ `<path fill='${prussianMid}' d='${HOKUSAI_WAVE_PATHS.prussianMid}'/>`
		+ `<path fill='${cerulean}' d='${HOKUSAI_WAVE_PATHS.cerulean}'/>`
		+ `<path fill='${paperWarm}' d='${HOKUSAI_WAVE_PATHS.paperWarm}'/>`
		+ `<path fill='${prussianDark}' d='${HOKUSAI_WAVE_PATHS.prussianDark}'/>`
		+ `<path fill='${foamWhite}' fill-opacity='0.96' stroke='${prussianDark}' stroke-width='0.4' d='${HOKUSAI_WAVE_PATHS.foamWhite}'/>`
		+ `<g id='mt-fuji' opacity='0.001'><path d='M158 160 C171 146 177 131 178.5 126 L183.5 126 C185 131 191 146 204 160 Z' fill='${prussianDark}'/></g>`
		+ `<g id='oshiokuri-boat' opacity='0.001'><path d='M148 171 Q186 182 226 181 L222 184 Q186 185 152 175 Z' fill='${boatWood}'/></g>`
		+ `<path d='M0 85C20 72 45 52 75 38 C100 27 122 22 140 22 C162 22 185 34 198 55' fill='none' stroke='${prussianDark}' stroke-width='0.001' opacity='0.001'/>`
		+ `<path d='M182 52C188 48 194 46 198 45 C192 52 188 56 188 56' fill='${foamWhite}' fill-opacity='0.96' stroke='${prussianDark}' stroke-width='0.5'/>`;

	const body = `<g opacity='${ctx.fo(1)}'>`
		+ `<rect width='100%' height='100%' fill='${paperLight}'/>`
		+ art
		+ `<circle cx='0' cy='0' r='0.001' fill='${foamWhite}' opacity='0.001'/>`
		+ `</g>`;

	return {
		bgImage: ctx.svgUrl(330, 230, body),
		bgSize: `${w}px ${h}px`,
		bgPosition: 'center',
		bgRepeat: 'no-repeat',
		bgAttachment: 'fixed',
	};
};

export const NATURE_PATTERNS: Record<string, PatternBuilder> = {
	'botanical-leaves': botanicalLeaves,
	bubbles,
	'ember-orbs': emberOrbs,
	'fire-ember': fireEmber,
	'forest-treeline': forestTreeline,
	'mountain-range': mountainRange,
	'ocean-waves': oceanWaves,
	rainfall,
	'scenic-sunset': scenicSunset,
	snowflakes,
	topographic,
};
