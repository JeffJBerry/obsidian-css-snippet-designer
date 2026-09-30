/**
 * Material textures.
 *
 * Organic and tactile surfaces including paper grain, carbon fibre,
 * natural linen fabric, Carrara marble veins, flagstone slate, and hardwood grain.
 */
import type { PatternBuilder, PatternContext } from './types';
import { atLeast, n } from './util';

/** Shared noise plumbing: a stitched turbulence field used as a mask. */
function grain(ctx: PatternContext, id: string, size: number, frequency: string, octaves: number, gamma: number): {
	defs: string;
	body: string;
} {
	const defs = `<filter id='${id}' x='0' y='0' width='100%' height='100%'>`
		+ `<feTurbulence type='fractalNoise' baseFrequency='${frequency}' numOctaves='${octaves}' stitchTiles='stitch'/>`
		+ `<feColorMatrix type='saturate' values='0'/>`
		// Gamma pushes the midtones down so the mask reads as tooth rather than
		// an even 50% grey; alpha is flattened so only luminance drives it.
		+ `<feComponentTransfer>`
		+ `<feFuncR type='gamma' exponent='${gamma}'/><feFuncG type='gamma' exponent='${gamma}'/><feFuncB type='gamma' exponent='${gamma}'/>`
		+ `<feFuncA type='discrete' tableValues='1'/>`
		+ `</feComponentTransfer>`
		+ `</filter>`
		+ `<mask id='${id}m'><rect width='${size}' height='${size}' filter='url(#${id})'/></mask>`;
	const body = `<rect width='${size}' height='${size}' fill='${ctx.pFill}' fill-opacity='${ctx.fo(1)}' mask='url(#${id}m)'/>`;
	return { defs, body };
}

/** Paper grain - fine isotropic tooth, the way uncoated stock scatters light. */
const paperGrain: PatternBuilder = (ctx) => {
	const s = 180;
	const freq = Math.min(1.2, Math.max(0.25, 16 / Math.max(6, ctx.size))).toFixed(2);
	const { defs, body } = grain(ctx, 'pg', s, freq, 4, 2.4);
	return {
		bgImage: ctx.svgUrl(s, s, body, '', defs),
		bgSize: `${s}px ${s}px`,
		bgPosition: '0 0',
	};
};

/** Carbon fibre - the 2x2 twill with a highlight along each tow. */
const carbonFibre: PatternBuilder = (ctx) => {
	const u = atLeast(6, ctx.size / 2);
	const s = u * 2;
	const cell = (x: number, y: number, strong: boolean): string => {
		let ribs = '';
		for (let i = 1; i <= 2; i++) {
			const o = (u * i) / 3;
			ribs += strong ? `M${x} ${n(y + o)}H${x + u}` : `M${n(x + o)} ${y}V${y + u}`;
		}
		return `<rect x='${x}' y='${y}' width='${u}' height='${u}' fill='${ctx.pFill}' fill-opacity='${ctx.fo(strong ? 0.5 : 0.22)}'/>`
			+ `<path d='${ribs}' fill='none' stroke='${ctx.pStroke}' stroke-opacity='${ctx.fo(strong ? 0.7 : 0.4)}' stroke-width='${n(Math.max(0.5, u * 0.08))}'/>`;
	};
	const body = cell(0, 0, true) + cell(u, u, true) + cell(u, 0, false) + cell(0, u, false);
	return {
		bgImage: ctx.svgUrl(s, s, body),
		bgSize: `${s}px ${s}px`,
		bgPosition: '0 0',
	};
};

/**
 * Linen Weave - natural unbleached flax fabric.
 *
 * Rich interlaced warp and weft yarns with organic slub thickness variations,
 * alternating cross-ply density, and tangible textile tooth.
 */
const linenWeave: PatternBuilder = (ctx) => {
	const s = atLeast(16, ctx.size);
	const count = 6;
	const step = s / count;
	const halfStep = step / 2;

	let yarnFills = '';
	let threads = '';

	for (let i = 0; i < count; i++) {
		for (let j = 0; j < count; j++) {
			const x = i * step;
			const y = j * step;
			const isWarpOver = (i + j) % 2 === 0;

			// Crown of the over-yarn segment
			if (isWarpOver) {
				// Vertical yarn on top
				const padX = step * 0.15;
				yarnFills += `<rect x='${n(x + padX)}' y='${n(y)}' width='${n(step - padX * 2)}' height='${n(step)}' rx='1' fill='${ctx.pFill}' fill-opacity='${ctx.fo(0.24)}'/>`;
			} else {
				// Horizontal yarn on top
				const padY = step * 0.15;
				yarnFills += `<rect x='${n(x)}' y='${n(y + padY)}' width='${n(step)}' height='${n(step - padY * 2)}' rx='1' fill='${ctx.pFill}' fill-opacity='${ctx.fo(0.16)}'/>`;
			}
		}

		// Continuous fiber guidelines through the center of each yarn
		const pos = i * step + halfStep;
		threads += `M0 ${n(pos)}H${s}M${n(pos)} 0V${s}`;
		// Secondary offset micro-fibers
		const sub1 = pos - step * 0.22;
		const sub2 = pos + step * 0.22;
		threads += `M0 ${n(sub1)}H${s}M0 ${n(sub2)}H${s}M${n(sub1)} 0V${s}M${n(sub2)} 0V${s}`;
	}

	const body = yarnFills
		+ `<path d='${threads}' fill='none' stroke='${ctx.pStroke}' stroke-opacity='${ctx.fo(0.55)}' stroke-width='${n(Math.max(0.6, s * 0.025))}'/>`;

	return {
		bgImage: ctx.svgUrl(s, s, body),
		bgSize: `${s}px ${s}px`,
		bgPosition: '0 0',
	};
};

/**
 * Marble Veins - authentic Carrara / Calacatta white marble.
 *
 * Soft luminous alabaster stone ground with dispersed, meandering diagonal
 * calcite veins, feathery tributary fissures, and diffused smoky breccia clouds.
 * Engineered with matching boundary coordinates and C1 continuous tangents
 * for 100% seamless repeat in tiled mode across both axes without criss-crossing.
 */
const marbleVeins: PatternBuilder = (ctx) => {
	const w = atLeast(140, ctx.size * 5);
	const h = Math.round(w * 0.75);

	// When user color is default, use authentic marble charcoal/graphite palette instead of fallback green
	const isDefaultColor = ctx.pStroke === '#00ff9d' || ctx.pStroke === '#059669';
	const baseFill = ctx.isDark ? '#0f172a' : '#ffffff';
	const veinColor = isDefaultColor ? (ctx.isDark ? '#cbd5e1' : '#475569') : ctx.pStroke;
	const veinSubtle = isDefaultColor ? (ctx.isDark ? '#94a3b8' : '#64748b') : ctx.pStroke;
	const cloudColor = isDefaultColor ? (ctx.isDark ? '#64748b' : '#94a3b8') : ctx.pStroke;

	// Seamless diagonal boundary coordinates (P_L at x=0, yA; P_R at x=w, yA; P_T at xA, y=0; P_B at xA, y=h)
	const yA = h * 0.48;
	const xA = w * 0.52;

	// Boundary tangent control offsets ensuring C1 smoothness across seams
	const mx = w * 0.12;
	const my = h * 0.08;
	const kx = w * 0.10;
	const ky = h * 0.14;

	const p1 = { x: w * 0.24, y: h * 0.22 };
	const p2 = { x: w * 0.78, y: h * 0.74 };

	// Primary diagonal vein - Segment A (left edge to top edge)
	const segA = `M0 ${n(yA)}`
		+ `C${n(mx)} ${n(yA - my)} ${n(p1.x - w * 0.08)} ${n(p1.y + h * 0.06)} ${n(p1.x)} ${n(p1.y)}`
		+ `C${n(p1.x + w * 0.08)} ${n(p1.y - h * 0.06)} ${n(xA - kx)} ${n(ky)} ${n(xA)} 0`;

	// Primary diagonal vein - Segment B (bottom edge to right edge)
	const segB = `M${n(xA)} ${h}`
		+ `C${n(xA + kx)} ${n(h - ky)} ${n(p2.x - w * 0.09)} ${n(p2.y + h * 0.05)} ${n(p2.x)} ${n(p2.y)}`
		+ `C${n(p2.x + w * 0.09)} ${n(p2.y - h * 0.05)} ${n(w - mx)} ${n(yA + my)} ${w} ${n(yA)}`;

	const mainVein = `${segA}${segB}`;

	// Delicate tributary branches branching into the open stone field
	const branchA1 = `M${n(p1.x)} ${n(p1.y)}C${n(w * 0.20)} ${n(h * 0.16)} ${n(w * 0.14)} ${n(h * 0.14)} ${n(w * 0.08)} ${n(h * 0.11)}`;
	const hairA1 = `M${n(w * 0.14)} ${n(h * 0.14)}C${n(w * 0.13)} ${n(h * 0.10)} ${n(w * 0.11)} ${n(h * 0.08)} ${n(w * 0.09)} ${n(h * 0.06)}`;

	const branchB1 = `M${n(p2.x)} ${n(p2.y)}C${n(w * 0.84)} ${n(h * 0.80)} ${n(w * 0.89)} ${n(h * 0.84)} ${n(w * 0.95)} ${n(h * 0.88)}`;
	const hairB1 = `M${n(w * 0.89)} ${n(h * 0.84)}C${n(w * 0.91)} ${n(h * 0.81)} ${n(w * 0.93)} ${n(h * 0.78)} ${n(w * 0.96)} ${n(h * 0.76)}`;

	const branchB2 = `M${n(w * 0.60)} ${n(h * 0.88)}C${n(w * 0.63)} ${n(h * 0.91)} ${n(w * 0.66)} ${n(h * 0.93)} ${n(w * 0.70)} ${n(h * 0.95)}`;

	const branches = `${branchA1}${branchB1}${branchB2}`;
	const hairlines = `${hairA1}${hairB1}`;

	// Dispersed, whisper-faint wisps drifting in the spacious negative expanses
	const wisp1 = `M${n(w * 0.62)} ${n(h * 0.40)}C${n(w * 0.70)} ${n(h * 0.32)} ${n(w * 0.80)} ${n(h * 0.28)} ${n(w * 0.91)} ${n(h * 0.22)}`;
	const wisp1Hair = `M${n(w * 0.80)} ${n(h * 0.28)}C${n(w * 0.85)} ${n(h * 0.24)} ${n(w * 0.88)} ${n(h * 0.18)} ${n(w * 0.92)} ${n(h * 0.15)}`;

	const wisp2 = `M${n(w * 0.07)} ${n(h * 0.80)}C${n(w * 0.16)} ${n(h * 0.75)} ${n(w * 0.25)} ${n(h * 0.71)} ${n(w * 0.36)} ${n(h * 0.62)}`;
	const wisp2Hair = `M${n(w * 0.25)} ${n(h * 0.71)}C${n(w * 0.29)} ${n(h * 0.77)} ${n(w * 0.33)} ${n(h * 0.82)} ${n(w * 0.38)} ${n(h * 0.85)}`;

	const wisps = `${wisp1}${wisp2}`;
	const wispHairs = `${wisp1Hair}${wisp2Hair}`;

	// 1. Polished Marble Slab Ground
	const baseSlab = `<rect width='${w}' height='${h}' fill='${baseFill}' fill-opacity='${ctx.fo(0.85)}'/>`;

	// 2. Broad diffused breccia cloud halos (soft smoky wash underlays)
	const clouds = `<path d='${mainVein}' fill='none' stroke='${cloudColor}' stroke-opacity='${ctx.fo(0.06)}' stroke-width='${n(Math.max(14, w * 0.10))}' stroke-linecap='round'/>`
		+ `<path d='${mainVein}' fill='none' stroke='${cloudColor}' stroke-opacity='${ctx.fo(0.10)}' stroke-width='${n(Math.max(7, w * 0.048))}' stroke-linecap='round'/>`
		+ `<path d='${wisps}' fill='none' stroke='${cloudColor}' stroke-opacity='${ctx.fo(0.06)}' stroke-width='${n(Math.max(4, w * 0.028))}' stroke-linecap='round'/>`;

	// 3. Dispersed wisps, branches and hairline fractures
	const fissures = `<path d='${wisps}' fill='none' stroke='${veinSubtle}' stroke-opacity='${ctx.fo(0.22)}' stroke-width='${n(Math.max(0.7, w * 0.007))}' stroke-linecap='round'/>`
		+ `<path d='${wispHairs}' fill='none' stroke='${veinSubtle}' stroke-opacity='${ctx.fo(0.15)}' stroke-width='${n(Math.max(0.5, w * 0.005))}' stroke-linecap='round'/>`
		+ `<path d='${branches}' fill='none' stroke='${veinSubtle}' stroke-opacity='${ctx.fo(0.32)}' stroke-width='${n(Math.max(0.8, w * 0.008))}' stroke-linecap='round'/>`
		+ `<path d='${hairlines}' fill='none' stroke='${veinSubtle}' stroke-opacity='${ctx.fo(0.20)}' stroke-width='${n(Math.max(0.5, w * 0.005))}' stroke-linecap='round'/>`;

	// 4. Primary calcite vein core
	const mainVeinCore = `<path d='${mainVein}' fill='none' stroke='${veinColor}' stroke-opacity='${ctx.fo(0.25)}' stroke-width='${n(Math.max(2.0, w * 0.016))}' stroke-linecap='round'/>`
		+ `<path d='${mainVein}' fill='none' stroke='${veinColor}' stroke-opacity='${ctx.fo(0.48)}' stroke-width='${n(Math.max(0.9, w * 0.008))}' stroke-linecap='round'/>`;

	const body = baseSlab + clouds + fissures + mainVeinCore;

	return {
		bgImage: ctx.svgUrl(w, h, body),
		bgSize: `${w}px ${h}px`,
		bgPosition: '0 0',
	};
};

/**
 * Stone Flagstone - natural slate paving.
 *
 * Interlocking organic polygonal flagstones with natural cleft mortar joints,
 * varied stone face opacities, and chiseled cleavage grain.
 */
const stoneSlate: PatternBuilder = (ctx) => {
	const w = atLeast(48, ctx.size * 2.6);
	const h = Math.round(w * 0.8);

	// Coordinated edge nodes ensure 100% seamless repeat across all 4 boundaries:
	// Left/Right: yA = h * 0.3, yB = h * 0.72
	// Top/Bottom: xA = w * 0.35, xB = w * 0.72
	const yA = h * 0.3;
	const yB = h * 0.72;
	const xA = w * 0.35;
	const xB = w * 0.72;

	// Internal junction nodes
	const n1 = { x: w * 0.35, y: h * 0.34 };
	const n2 = { x: w * 0.72, y: h * 0.28 };
	const n3 = { x: w * 0.38, y: h * 0.70 };
	const n4 = { x: w * 0.75, y: h * 0.72 };

	// Flagstone polygonal stone faces
	const s1 = `M0 0H${n(xA)}L${n(n1.x)} ${n(n1.y)}L0 ${n(yA)}Z`;
	const s2 = `M${n(xA)} 0H${n(xB)}L${n(n2.x)} ${n(n2.y)}L${n(n1.x)} ${n(n1.y)}Z`;
	const s3 = `M${n(xB)} 0H${w}V${n(yA)}L${n(n2.x)} ${n(n2.y)}Z`;
	const s4 = `M${n(n1.x)} ${n(n1.y)}L${n(n2.x)} ${n(n2.y)}L${n(n4.x)} ${n(n4.y)}L${n(n3.x)} ${n(n3.y)}Z`;
	const s5 = `M0 ${n(yA)}L${n(n1.x)} ${n(n1.y)}L${n(n3.x)} ${n(n3.y)}L0 ${n(yB)}Z`;
	const s6 = `M${w} ${n(yA)}V${n(yB)}L${n(n4.x)} ${n(n4.y)}L${n(n2.x)} ${n(n2.y)}Z`;
	const s7 = `M0 ${n(yB)}L${n(n3.x)} ${n(n3.y)}L${n(xA)} ${h}H0Z`;
	const s8 = `M${n(n3.x)} ${n(n3.y)}L${n(n4.x)} ${n(n4.y)}L${n(xB)} ${h}H${n(xA)}Z`;
	const s9 = `M${n(n4.x)} ${n(n4.y)}L${w} ${n(yB)}V${h}H${n(xB)}Z`;

	// Varied tonal fills for individual stone slabs
	const fills = `<path d='${s1}${s9}' fill='${ctx.pFill}' fill-opacity='${ctx.fo(0.12)}'/>`
		+ `<path d='${s2}${s7}' fill='${ctx.pFill}' fill-opacity='${ctx.fo(0.18)}'/>`
		+ `<path d='${s3}${s5}' fill='${ctx.pFill}' fill-opacity='${ctx.fo(0.08)}'/>`
		+ `<path d='${s4}' fill='${ctx.pFill}' fill-opacity='${ctx.fo(0.24)}'/>`
		+ `<path d='${s6}${s8}' fill='${ctx.pFill}' fill-opacity='${ctx.fo(0.15)}'/>`;

	// Mortar cleft joint network
	const joints = `M0 0H${w}V${h}H0Z`
		+ `M${n(xA)} 0L${n(n1.x)} ${n(n1.y)}L0 ${n(yA)}`
		+ `M${n(xB)} 0L${n(n2.x)} ${n(n2.y)}L${n(n1.x)} ${n(n1.y)}L${n(n3.x)} ${n(n3.y)}L0 ${n(yB)}`
		+ `M${w} ${n(yA)}L${n(n2.x)} ${n(n2.y)}L${n(n4.x)} ${n(n4.y)}L${n(n3.x)} ${n(n3.y)}L${n(xA)} ${h}`
		+ `M${w} ${n(yB)}L${n(n4.x)} ${n(n4.y)}L${n(xB)} ${h}`;

	// Subtle chisel cleft streaks across stone faces
	const chisel = `M${n(w * 0.1)} ${n(h * 0.12)}H${n(w * 0.22)}`
		+ `M${n(w * 0.45)} ${n(h * 0.12)}H${n(w * 0.6)}`
		+ `M${n(w * 0.42)} ${n(h * 0.45)}H${n(w * 0.65)}`
		+ `M${n(w * 0.12)} ${n(h * 0.52)}H${n(w * 0.28)}`
		+ `M${n(w * 0.8)} ${n(h * 0.52)}H${n(w * 0.92)}`
		+ `M${n(w * 0.45)} ${n(h * 0.88)}H${n(w * 0.65)}`;

	const body = fills
		+ `<path d='${joints}' fill='none' stroke='${ctx.pStroke}' stroke-opacity='${ctx.fo(0.95)}' stroke-width='${n(Math.max(1.2, w * 0.026))}' stroke-linejoin='round'/>`
		+ `<path d='${chisel}' fill='none' stroke='${ctx.pStroke}' stroke-opacity='${ctx.fo(0.35)}' stroke-width='${n(Math.max(0.6, w * 0.012))}' stroke-linecap='round'/>`;

	return {
		bgImage: ctx.svgUrl(w, h, body),
		bgSize: `${w}px ${h}px`,
		bgPosition: '0 0',
	};
};

/**
 * Woodgrain - luxury hardwood timber with seamless cathedral growth rings.
 *
 * Longitudinal grain fibers flowing smoothly with zero seams across tile repeats,
 * enclosed central heartwood cathedral flame loops, early/latewood contrast,
 * and fine medullary rays. 100% seamlessly tileable in both X and Y.
 */
const woodgrain: PatternBuilder = (ctx) => {
	const w = atLeast(64, ctx.size * 3.5);
	const h = Math.round(w * 1.8);
	const knotX = w * 0.5;
	const knotY = h * 0.5;

	// 1. Subtle warm wood base tone
	const base = `<rect width='${w}' height='${h}' fill='${ctx.pFill}' fill-opacity='${ctx.fo(0.08)}'/>`;

	// 2. Central heartwood knot & enclosed cathedral flame loops
	// Because these are closed loops contained within [0.18h, 0.82h], they never cross tile boundaries
	const flameLoops = [
		{ rw: w * 0.06, rh: h * 0.06, op: 0.85, strokeW: 1.2 },
		{ rw: w * 0.12, rh: h * 0.13, op: 0.70, strokeW: 1.0 },
		{ rw: w * 0.18, rh: h * 0.21, op: 0.55, strokeW: 0.9 },
		{ rw: w * 0.25, rh: h * 0.29, op: 0.40, strokeW: 0.8 },
	];

	// Central solid kernel
	let knotSvg = `<ellipse cx='${n(knotX)}' cy='${n(knotY)}' rx='${n(w * 0.035)}' ry='${n(h * 0.028)}' fill='${ctx.pFill}' fill-opacity='${ctx.fo(0.25)}'/>`;

	let flamePaths = '';
	for (const { rw, rh, op, strokeW } of flameLoops) {
		// Teardrop flame loop: peaks at top, bulges smoothly at sides, rounds at bottom
		const topY = knotY - rh;
		const botY = knotY + rh;
		const path = `M${n(knotX)} ${n(topY)}`
			+ `C${n(knotX - rw * 0.7)} ${n(topY + rh * 0.4)} ${n(knotX - rw)} ${n(knotY + rh * 0.4)} ${n(knotX)} ${n(botY)}`
			+ `C${n(knotX + rw)} ${n(knotY + rh * 0.4)} ${n(knotX + rw * 0.7)} ${n(topY + rh * 0.4)} ${n(knotX)} ${n(topY)}Z`;
		flamePaths += `<path d='${path}' fill='none' stroke='${ctx.pStroke}' stroke-opacity='${ctx.fo(op)}' stroke-width='${n(Math.max(0.7, w * 0.015 * strokeW))}' stroke-linejoin='round'/>`;
	}

	// 3. Flowing longitudinal timber fibers with 100% vertical & horizontal seamlessness:
	// Every fiber enters at (x, 0) with vertical tangent, bows smoothly around the center knot,
	// and exits at (x, h) with vertical tangent. The edge fibers at x=0 and x=w have zero bow.
	const fiberCount = 14;
	let fiberPaths = '';
	let ringFills = '';

	for (let i = 0; i <= fiberCount; i++) {
		const startX = (i / fiberCount) * w;
		const normX = (startX - knotX) / knotX; // -1 at left edge, 0 at center, 1 at right edge

		// Bow deflection outward around knot:
		// Math.sin(norm * PI) ensures bow is EXACTLY 0 at x=0 and x=w (seamless X repeat)
		const bowDirection = normX < 0 ? -1 : 1;
		const bowMagnitude = w * 0.12 * Math.sin(Math.PI * (i / fiberCount)) * (1 - Math.min(1, Math.abs(normX) * 0.65));
		const midX = startX + bowDirection * bowMagnitude;

		// Gentle organic timber ripple
		const ripple = Math.sin(normX * 5) * (w * 0.015) * Math.sin(Math.PI * (i / fiberCount));
		const q1X = startX + ripple;
		const q3X = startX - ripple;

		// C1-continuous cubic curves starting and ending purely vertically
		const fiberD = `M${n(startX)} 0`
			+ `C${n(startX)} ${n(h * 0.2)} ${n(q1X)} ${n(h * 0.32)} ${n(midX)} ${n(knotY)}`
			+ `C${n(midX)} ${n(h * 0.68)} ${n(q3X)} ${n(h * 0.8)} ${n(startX)} ${h}`;

		const isDenseRing = i % 3 === 0;
		const strokeOp = isDenseRing ? 0.85 : 0.55;
		const strokeWidth = isDenseRing ? Math.max(0.9, w * 0.018) : Math.max(0.6, w * 0.012);

		fiberPaths += `<path d='${fiberD}' fill='none' stroke='${ctx.pStroke}' stroke-opacity='${ctx.fo(strokeOp)}' stroke-width='${n(strokeWidth)}' stroke-linecap='round'/>`;

		// Subtle earlywood growth band fills between alternating fibers
		if (i % 2 === 1 && i < fiberCount) {
			const nextX = ((i + 1) / fiberCount) * w;
			const nextNorm = (nextX - knotX) / knotX;
			const nextBow = (nextNorm < 0 ? -1 : 1) * w * 0.12 * Math.sin(Math.PI * ((i + 1) / fiberCount)) * (1 - Math.min(1, Math.abs(nextNorm) * 0.65));
			const nextMid = nextX + nextBow;
			const bandD = `M${n(startX)} 0`
				+ `C${n(startX)} ${n(h * 0.2)} ${n(q1X)} ${n(h * 0.32)} ${n(midX)} ${n(knotY)}`
				+ `C${n(midX)} ${n(h * 0.68)} ${n(q3X)} ${n(h * 0.8)} ${n(startX)} ${h}`
				+ `H${n(nextX)}`
				+ `C${n(nextX)} ${n(h * 0.8)} ${n(nextMid)} ${n(h * 0.68)} ${n(nextMid)} ${n(knotY)}`
				+ `C${n(nextMid)} ${n(h * 0.32)} ${n(nextX)} ${n(h * 0.2)} ${n(nextX)} 0Z`;
			ringFills += `<path d='${bandD}' fill='${ctx.pFill}' fill-opacity='${ctx.fo(0.05)}'/>`;
		}
	}

	// 4. Fine medullary ray flecks oriented along the grain
	let rays = '';
	const rayPoints = [
		{ x: w * 0.14, y: h * 0.18, len: 0.04 },
		{ x: w * 0.22, y: h * 0.78, len: 0.05 },
		{ x: w * 0.78, y: h * 0.22, len: 0.04 },
		{ x: w * 0.86, y: h * 0.72, len: 0.05 },
		{ x: w * 0.38, y: h * 0.12, len: 0.035 },
		{ x: w * 0.62, y: h * 0.88, len: 0.04 },
	];
	for (const { x, y, len } of rayPoints) {
		rays += `M${n(x)} ${n(y)}V${n(y + h * len)}`;
	}

	const body = base
		+ ringFills
		+ knotSvg
		+ flamePaths
		+ fiberPaths
		+ `<path d='${rays}' fill='none' stroke='${ctx.pStroke}' stroke-opacity='${ctx.fo(0.4)}' stroke-width='${n(Math.max(0.6, w * 0.012))}' stroke-linecap='round'/>`;

	return {
		bgImage: ctx.svgUrl(w, h, body),
		bgSize: `${w}px ${h}px`,
		bgPosition: '0 0',
	};
};

export const TEXTURE_PATTERNS: Record<string, PatternBuilder> = {
	'carbon-fibre': carbonFibre,
	'linen-weave': linenWeave,
	'marble-veins': marbleVeins,
	'paper-grain': paperGrain,
	'stone-slate': stoneSlate,
	woodgrain,
};
