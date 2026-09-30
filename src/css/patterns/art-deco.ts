/**
 * Art Deco patterns drawn from 1920s architecture, Gatsby ornamental palmettes,
 * stepped skyscraper setbacks, and luxury geometric motifs.
 *
 * Every tile wraps seamlessly on all four edges and scales via ctx.size.
 */
import type { PatternBuilder } from './types';
import { atLeast, n } from './util';

/**
 * Deco Arches - Chrysler Crown.
 *
 * Inspired by the iconic tiered lancet arches of the Chrysler Building crown.
 * Alternating rows of tiered pointed parabolic arches with radiating ray flutes
 * and central vertical spines.
 */
const decoArches: PatternBuilder = (ctx) => {
	const w = atLeast(36, ctx.size * 2);
	const h = Math.round(w * 1.25);
	const halfW = w / 2;
	const halfH = h / 2;

	// Pointed arch path generator with apex at (cx, cy - archH) and base at cy
	const arch = (cx: number, cy: number, spanW: number, archH: number): string => {
		const hw = spanW / 2;
		const ctrlY = cy - archH * 0.75;
		const ctrlXOffset = hw * 0.2;
		return `M${n(cx - hw)} ${n(cy)}`
			+ `Q${n(cx - hw + ctrlXOffset)} ${n(ctrlY)} ${n(cx)} ${n(cy - archH)}`
			+ `Q${n(cx + hw - ctrlXOffset)} ${n(ctrlY)} ${n(cx + hw)} ${n(cy)}`;
	};

	let d = '';
	let fills = '';

	// Tier ratios for concentric nested arches
	const tiers = [
		{ wRatio: 1.0, hRatio: 1.0, op: 0.12 },
		{ wRatio: 0.76, hRatio: 0.76, op: 0.08 },
		{ wRatio: 0.52, hRatio: 0.52, op: 0.14 },
		{ wRatio: 0.28, hRatio: 0.28, op: 0.22 },
	];

	// Arch centers: Center 1 at (halfW, h) rising to peak at y=0
	// Centers 2 & 3 at (0, halfH) and (w, halfH) rising to peak at y=0, and (0, h+halfH)
	const centers = [
		{ cx: halfW, cy: h },
		{ cx: halfW, cy: 0 },
		{ cx: 0, cy: halfH },
		{ cx: w, cy: halfH },
		{ cx: 0, cy: h + halfH },
		{ cx: w, cy: h + halfH },
		{ cx: 0, cy: -halfH },
		{ cx: w, cy: -halfH },
	];

	for (const { cx, cy } of centers) {
		for (const tier of tiers) {
			const spanW = w * tier.wRatio;
			const archH = halfH * tier.hRatio;
			d += arch(cx, cy, spanW, archH);
		}
		// Vertical spine
		d += `M${n(cx)} ${n(cy)}V${n(cy - halfH)}`;
		// Radiating sunburst flutes
		const hw = halfW * 0.5;
		d += `M${n(cx)} ${n(cy)}L${n(cx - hw)} ${n(cy - halfH * 0.65)}`;
		d += `M${n(cx)} ${n(cy)}L${n(cx + hw)} ${n(cy - halfH * 0.65)}`;
		// Stepped inner base fill
		const innerSpan = w * 0.28;
		const innerH = halfH * 0.28;
		fills += `<path d='${arch(cx, cy, innerSpan, innerH)}Z' fill='${ctx.pFill}' fill-opacity='${ctx.fo(0.18)}'/>`;
	}

	const body = fills
		+ `<path d='${d}' fill='none' stroke='${ctx.pStroke}' stroke-opacity='${ctx.fo(0.9)}' stroke-width='${n(Math.max(0.8, w * 0.035))}' stroke-linecap='round' stroke-linejoin='round'/>`;

	return {
		bgImage: ctx.svgUrl(w, h, body),
		bgSize: `${w}px ${h}px`,
		bgPosition: '0 0',
	};
};

/**
 * Deco Diamond Trellis.
 *
 * Grand Gatsby interlocking diamond lattice with double-ruled frames,
 * interior stepped lozenges, and corner cross-tie accents.
 */
const decoDiamond: PatternBuilder = (ctx) => {
	const w = atLeast(32, ctx.size * 2);
	const h = Math.round(w * 1.5);
	const halfW = w / 2;
	const halfH = h / 2;
	const inset = Math.max(2.5, Math.round(w * 0.12));
	const insetH = Math.round(inset * 1.5);

	const diamond = (cx: number, cy: number, dw: number, dh: number): string =>
		`M${n(cx)} ${n(cy - dh)}L${n(cx + dw)} ${n(cy)}L${n(cx)} ${n(cy + dh)}L${n(cx - dw)} ${n(cy)}Z`;

	// Outer primary diamonds
	const outerCenter = diamond(halfW, halfH, halfW, halfH);
	const outerCorners = diamond(0, 0, halfW, halfH)
		+ diamond(w, 0, halfW, halfH)
		+ diamond(0, h, halfW, halfH)
		+ diamond(w, h, halfW, halfH);

	// Inset secondary diamonds
	const innerCenter = diamond(halfW, halfH, halfW - inset, halfH - insetH);
	const innerCorners = diamond(0, 0, halfW - inset, halfH - insetH)
		+ diamond(w, 0, halfW - inset, halfH - insetH)
		+ diamond(0, h, halfW - inset, halfH - insetH)
		+ diamond(w, h, halfW - inset, halfH - insetH);

	// Core stepped lozenge
	const coreW = halfW * 0.35;
	const coreH = halfH * 0.35;
	const coreCenter = diamond(halfW, halfH, coreW, coreH);
	const coreCorners = diamond(0, 0, coreW, coreH)
		+ diamond(w, 0, coreW, coreH)
		+ diamond(0, h, coreW, coreH)
		+ diamond(w, h, coreW, coreH);

	// Cross-tie bars at edge vertices (x-shaped & tick accents)
	const tick = Math.max(2, w * 0.08);
	const ticks = `M${n(halfW - tick)} 0H${n(halfW + tick)}M${n(halfW - tick)} ${h}H${n(halfW + tick)}`
		+ `M0 ${n(halfH - tick)}V${n(halfH + tick)}M${w} ${n(halfH - tick)}V${n(halfH + tick)}`
		+ `M${n(halfW)} ${n(halfH - tick)}V${n(halfH + tick)}M${n(halfW - tick)} ${n(halfH)}H${n(halfW + tick)}`;

	const body = `<path d='${outerCenter}${outerCorners}' fill='${ctx.pFill}' fill-opacity='${ctx.fo(0.08)}'/>`
		+ `<path d='${coreCenter}${coreCorners}' fill='${ctx.pFill}' fill-opacity='${ctx.fo(0.25)}'/>`
		+ `<path d='${outerCenter}${outerCorners}' fill='none' stroke='${ctx.pStroke}' stroke-opacity='${ctx.fo(0.95)}' stroke-width='${n(Math.max(1, w * 0.038))}'/>`
		+ `<path d='${innerCenter}${innerCorners}' fill='none' stroke='${ctx.pStroke}' stroke-opacity='${ctx.fo(0.6)}' stroke-width='${n(Math.max(0.7, w * 0.025))}'/>`
		+ `<path d='${coreCenter}${coreCorners}' fill='none' stroke='${ctx.pStroke}' stroke-opacity='${ctx.fo(0.85)}' stroke-width='${n(Math.max(0.8, w * 0.03))}'/>`
		+ `<path d='${ticks}' fill='none' stroke='${ctx.pStroke}' stroke-opacity='${ctx.fo(0.9)}' stroke-width='${n(Math.max(1, w * 0.035))}'/>`;

	return {
		bgImage: ctx.svgUrl(w, h, body),
		bgSize: `${w}px ${h}px`,
		bgPosition: '0 0',
	};
};

/**
 * Deco Fan - Gatsby Palmette.
 *
 * The classic 1920s Art Deco fan / peacock feather / palmette motif.
 * Overlapping upward-radiating fluted fans in an alternating brick layout.
 */
const decoFan: PatternBuilder = (ctx) => {
	const w = atLeast(36, ctx.size * 2.2);
	const h = Math.round(w * 0.7);
	const r = w / 2;

	// Builds one fan centered at (cx, cy) radiating upward
	const buildFan = (cx: number, cy: number): { arcs: string; rays: string; fills: string } => {
		let arcs = '';
		let rays = '';
		let fills = '';

		// Concentric arcs
		const radii = [r, r * 0.78, r * 0.56, r * 0.34, r * 0.16];
		for (let i = 0; i < radii.length; i++) {
			const rad = radii[i]!;
			arcs += `M${n(cx - rad)} ${n(cy)}A${n(rad)} ${n(rad)} 0 0 1 ${n(cx + rad)} ${n(cy)}`;
		}

		// Smallest inner fan fill
		const innerR = r * 0.34;
		fills += `<path d='M${n(cx - innerR)} ${n(cy)}A${n(innerR)} ${n(innerR)} 0 0 1 ${n(cx + innerR)} ${n(cy)}Z' fill='${ctx.pFill}' fill-opacity='${ctx.fo(0.22)}'/>`;

		// Fluted rays fanning out at angles from 15deg to 165deg
		const angles = [25, 45, 65, 80, 90, 100, 115, 135, 155];
		for (const deg of angles) {
			const rad = (deg * Math.PI) / 180;
			const cos = Math.cos(rad);
			const sin = Math.sin(rad);
			const xStart = cx + r * 0.16 * cos;
			const yStart = cy - r * 0.16 * sin;
			const xEnd = cx + r * cos;
			const yEnd = cy - r * sin;
			rays += `M${n(xStart)} ${n(yStart)}L${n(xEnd)} ${n(yEnd)}`;
		}

		return { arcs, rays, fills };
	};

	// Center 1 at bottom-center: (r, h) radiating up into tile
	// Center 2 at top-center: (r, 0)
	// Center 3 at mid-height edges: (0, h/2) and (w, h/2)
	// Center 4 at top and bottom corners
	const fanCenters = [
		{ cx: r, cy: h },
		{ cx: r, cy: 0 },
		{ cx: 0, cy: h / 2 },
		{ cx: w, cy: h / 2 },
		{ cx: 0, cy: -h / 2 },
		{ cx: w, cy: -h / 2 },
		{ cx: 0, cy: h + h / 2 },
		{ cx: w, cy: h + h / 2 },
	];

	let allArcs = '';
	let allRays = '';
	let allFills = '';

	for (const { cx, cy } of fanCenters) {
		const f = buildFan(cx, cy);
		allArcs += f.arcs;
		allRays += f.rays;
		allFills += f.fills;
	}

	const body = allFills
		+ `<path d='${allArcs}' fill='none' stroke='${ctx.pStroke}' stroke-opacity='${ctx.fo(0.95)}' stroke-width='${n(Math.max(0.9, w * 0.032))}'/>`
		+ `<path d='${allRays}' fill='none' stroke='${ctx.pStroke}' stroke-opacity='${ctx.fo(0.65)}' stroke-width='${n(Math.max(0.6, w * 0.022))}' stroke-linecap='round'/>`;

	return {
		bgImage: ctx.svgUrl(w, h, body),
		bgSize: `${w}px ${h}px`,
		bgPosition: '0 0',
	};
};

/**
 * Deco Scallop Scales.
 *
 * Fluted bronze fish-scale tiles from 1920s decorative grills.
 * Staggered overlapping scales with fine radiating interior ribs.
 */
const decoScales: PatternBuilder = (ctx) => {
	const w = atLeast(28, ctx.size * 1.8);
	const h = Math.round(w * 0.65);
	const r = w / 2;

	// Generates a fluted scallop scale centered at cx with arched apex reaching cy - h
	const buildScale = (cx: number, cy: number): { border: string; flutes: string; fill: string } => {
		const leftX = cx - r;
		const rightX = cx + r;
		const topY = cy - h;

		// Arch path: curved top arc, vertical/slanted sides
		const border = `M${n(leftX)} ${n(cy)}C${n(leftX)} ${n(topY)} ${n(rightX)} ${n(topY)} ${n(rightX)} ${n(cy)}`;

		// Radiating interior ribs from bottom anchor (cx, cy) to top arch
		let flutes = '';
		for (let i = 1; i <= 5; i++) {
			const frac = i / 6;
			const targetX = leftX + frac * w;
			// Height on elliptical arc
			const normX = (frac - 0.5) * 2; // -1 to 1
			const arcY = topY + (1 - Math.sqrt(Math.max(0, 1 - normX * normX))) * (h * 0.5);
			flutes += `M${n(cx)} ${n(cy)}L${n(targetX)} ${n(arcY)}`;
		}

		const fill = `<path d='${border}Z' fill='${ctx.pFill}' fill-opacity='${ctx.fo(0.12)}'/>`;
		return { border, flutes, fill };
	};

	const scaleCenters = [
		{ cx: r, cy: h },
		{ cx: r, cy: 0 },
		{ cx: 0, cy: h / 2 },
		{ cx: w, cy: h / 2 },
		{ cx: 0, cy: -h / 2 },
		{ cx: w, cy: -h / 2 },
		{ cx: 0, cy: h + h / 2 },
		{ cx: w, cy: h + h / 2 },
	];

	let allBorders = '';
	let allFlutes = '';
	let allFills = '';

	for (const { cx, cy } of scaleCenters) {
		const s = buildScale(cx, cy);
		allBorders += s.border;
		allFlutes += s.flutes;
		allFills += s.fill;
	}

	const body = allFills
		+ `<path d='${allBorders}' fill='none' stroke='${ctx.pStroke}' stroke-opacity='${ctx.fo(0.95)}' stroke-width='${n(Math.max(0.9, w * 0.038))}' stroke-linecap='round'/>`
		+ `<path d='${allFlutes}' fill='none' stroke='${ctx.pStroke}' stroke-opacity='${ctx.fo(0.6)}' stroke-width='${n(Math.max(0.6, w * 0.022))}' stroke-linecap='round'/>`;

	return {
		bgImage: ctx.svgUrl(w, h, body),
		bgSize: `${w}px ${h}px`,
		bgPosition: '0 0',
	};
};

/**
 * Deco Sunburst - Radiant Sol.
 *
 * Symmetrical 1920s skyscraper sunburst panel.
 * Radiating geometric triangular rays and stepped diamond core.
 */
const decoSunburst: PatternBuilder = (ctx) => {
	const s = atLeast(40, ctx.size * 2.5);
	const half = s / 2;

	const diamond = (cx: number, cy: number, d: number): string =>
		`M${n(cx)} ${n(cy - d)}L${n(cx + d)} ${n(cy)}L${n(cx)} ${n(cy + d)}L${n(cx - d)} ${n(cy)}Z`;

	// Center sunburst stepped core
	const core = diamond(half, half, half * 0.35)
		+ diamond(half, half, half * 0.2)
		+ diamond(half, half, half * 0.08);

	// Corner stepped cores (meeting across repeat)
	const cornerCores = diamond(0, 0, half * 0.25)
		+ diamond(s, 0, half * 0.25)
		+ diamond(0, s, half * 0.25)
		+ diamond(s, s, half * 0.25);

	// Radiating beam rays from center to perimeter
	let rays = '';
	let filledRays = '';
	const rayCount = 16;
	for (let i = 0; i < rayCount; i++) {
		const angle = (i * 2 * Math.PI) / rayCount;
		const nextAngle = ((i + 0.5) * 2 * Math.PI) / rayCount;
		const rStart = half * 0.35;
		const rEnd = half * 1.42; // reach corner perimeter

		const x1 = half + Math.cos(angle) * rStart;
		const y1 = half + Math.sin(angle) * rStart;
		const x2 = half + Math.cos(angle) * rEnd;
		const y2 = half + Math.sin(angle) * rEnd;

		rays += `M${n(x1)} ${n(y1)}L${n(x2)} ${n(y2)}`;

		// Alternating solid ray facets
		if (i % 2 === 0) {
			const x3 = half + Math.cos(nextAngle) * rEnd;
			const y3 = half + Math.sin(nextAngle) * rEnd;
			filledRays += `<polygon points='${n(half)},${n(half)} ${n(x2)},${n(y2)} ${n(x3)},${n(y3)}' fill='${ctx.pFill}' fill-opacity='${ctx.fo(0.15)}'/>`;
		}
	}

	// Perimeter enclosing frame
	const frame = `M0 0H${s}V${s}H0Z`;

	const body = filledRays
		+ `<path d='${core}${cornerCores}' fill='${ctx.pFill}' fill-opacity='${ctx.fo(0.22)}'/>`
		+ `<path d='${core}${cornerCores}' fill='none' stroke='${ctx.pStroke}' stroke-opacity='${ctx.fo(0.95)}' stroke-width='${n(Math.max(1, s * 0.025))}'/>`
		+ `<path d='${rays}' fill='none' stroke='${ctx.pStroke}' stroke-opacity='${ctx.fo(0.7)}' stroke-width='${n(Math.max(0.7, s * 0.018))}' stroke-linecap='round'/>`
		+ `<path d='${frame}' fill='none' stroke='${ctx.pStroke}' stroke-opacity='${ctx.fo(0.4)}' stroke-width='${n(Math.max(0.8, s * 0.02))}'/>`;

	return {
		bgImage: ctx.svgUrl(s, s, body),
		bgSize: `${s}px ${s}px`,
		bgPosition: '0 0',
	};
};
export const ART_DECO_PATTERNS: Record<string, PatternBuilder> = {
	'deco-arches': decoArches,
	'deco-diamond': decoDiamond,
	'deco-fan': decoFan,
	'deco-scales': decoScales,
	'deco-sunburst': decoSunburst,
};

