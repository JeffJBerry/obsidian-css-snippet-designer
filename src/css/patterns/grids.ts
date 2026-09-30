/**
 * Structural patterns: grids, rules and drafting lattices.
 */
import type { PatternBuilder } from './types';
import { math } from './math';
import { atLeast, n } from './util';

const dotGrid: PatternBuilder = (ctx) => {
	if (ctx.svgDefs) {
		const body = `<circle cx='${n(ctx.size / 2)}' cy='${n(ctx.size / 2)}' r='1.5' fill='${ctx.pFill}'/>`;
		return {
			bgImage: ctx.svgUrl(ctx.size, ctx.size, body),
			bgSize: `${ctx.sizePx} ${ctx.sizePx}`,
			bgPosition: '0 0',
		};
	}
	return {
		bgImage: `radial-gradient(${ctx.rgba} 1.5px, transparent 1.5px)`,
		bgSize: `${ctx.sizePx} ${ctx.sizePx}`,
		bgPosition: '0 0',
	};
};

const graphPaper: PatternBuilder = (ctx) => {
	if (ctx.svgDefs) {
		const body = `<path d='M${ctx.size} 0 L0 0 0 ${ctx.size}' fill='none' stroke='${ctx.pStroke}' stroke-width='1'/>`;
		return {
			bgImage: ctx.svgUrl(ctx.size, ctx.size, body),
			bgSize: `${ctx.sizePx} ${ctx.sizePx}`,
			bgPosition: '0 0',
		};
	}
	return {
		bgImage: `linear-gradient(${ctx.rgba} 1px, transparent 1px), linear-gradient(90deg, ${ctx.rgba} 1px, transparent 1px)`,
		bgSize: `${ctx.sizePx} ${ctx.sizePx}`,
		bgPosition: '0 0, 0 0',
	};
};

const hexagonGrid: PatternBuilder = (ctx) => {
	const body = `<path d='M13.99 9.25l13 7.5v15l-13 7.5L1 31.75v-15l12.99-7.5zM3 17.9v12.7l10.99 6.34 11-6.35V17.9l-11-6.34L3 17.9zM0 15l12.98-7.5V0h-2v6.35L0 12.69v2.3zm0 18.5L12.98 41v8h-2v-6.85L0 35.81v-2.3zM15 0v7.5L27.99 15H28v-2.31h-.01L17 6.35V0h-2zm0 49v-8l12.99-7.5H28v2.31h-.01L17 42.15V49h-2z' fill='${ctx.pFill}' fill-opacity='${ctx.fo(1)}' fill-rule='nonzero'/>`;
	const hexWidth = Math.max(16, ctx.size);
	const hexHeight = Math.round(hexWidth * 1.75);
	return {
		bgImage: ctx.svgUrl(28, 49, body),
		bgSize: `${hexWidth}px ${hexHeight}px`,
		bgPosition: '0 0',
	};
};

/** Equilateral triangle tessellation - two mirrored rows per tile. */
const triangleMesh: PatternBuilder = (ctx) => {
	const a = atLeast(14, ctx.size * 1.6);
	const h = Math.round(a * 0.8660254);
	const d = `M0 0H${a}M0 ${h}H${a}`
		+ `M0 ${h}L${n(a / 2)} 0L${a} ${h}`
		+ `M0 ${h}L${n(a / 2)} ${h * 2}L${a} ${h}`;
	const body = `<path d='${d}' fill='none' stroke='${ctx.pStroke}' stroke-opacity='${ctx.fo(1)}' stroke-width='1'/>`;
	return {
		bgImage: ctx.svgUrl(a, h * 2, body),
		bgSize: `${a}px ${h * 2}px`,
		bgPosition: '0 0',
	};
};

const isometricGrid: PatternBuilder = (ctx) => {
	const isoHeight = Math.round(ctx.size * 1.732);
	if (ctx.svgDefs) {
		const d = `M0 0L${ctx.size} ${Math.round(ctx.size * 0.577)}M${ctx.size} 0L0 ${Math.round(ctx.size * 0.577)}M${n(ctx.size / 2)} 0L${n(ctx.size / 2)} ${isoHeight}`;
		const body = `<path d='${d}' fill='none' stroke='${ctx.pStroke}' stroke-width='1'/>`;
		return {
			bgImage: ctx.svgUrl(ctx.size, isoHeight, body),
			bgSize: `${ctx.sizePx} ${isoHeight}px`,
			bgPosition: '0 0',
		};
	}
	return {
		bgImage: `linear-gradient(30deg, ${ctx.rgba} 1px, transparent 1px), linear-gradient(150deg, ${ctx.rgba} 1px, transparent 1px), linear-gradient(90deg, ${ctx.rgba} 1px, transparent 1px)`,
		bgSize: `${ctx.sizePx} ${isoHeight}px`,
		bgPosition: '0 0, 0 0, 0 0',
	};
};

/** Fine 45 degree hatching in both directions, as on a technical section cut. */
const crossHatch: PatternBuilder = (ctx) => {
	const s = atLeast(10, ctx.size);
	const h = s / 2;
	const d = `M0 0L${s} ${s}M0 ${s}L${s} 0`
		+ `M0 ${n(h)}L${n(h)} 0M${n(h)} ${s}L${s} ${n(h)}`
		+ `M0 ${n(h)}L${n(h)} ${s}M${n(h)} 0L${s} ${n(h)}`;
	const body = `<path d='${d}' fill='none' stroke='${ctx.pStroke}' stroke-opacity='${ctx.fo(1)}' stroke-width='0.85'/>`;
	return {
		bgImage: ctx.svgUrl(s, s, body),
		bgSize: `${s}px ${s}px`,
		bgPosition: '0 0',
	};
};

/** Offset lattice of small plus marks - the quietest grid in the set. */
const plusGrid: PatternBuilder = (ctx) => {
	const s = atLeast(16, ctx.size);
	const a = Math.max(3, s * 0.16);
	const plus = (x: number, y: number): string =>
		`M${n(x - a)} ${n(y)}H${n(x + a)}M${n(x)} ${n(y - a)}V${n(y + a)}`;
	const d = plus(0, 0) + plus(s, 0) + plus(0, s) + plus(s, s) + plus(s / 2, s / 2);
	const body = `<path d='${d}' fill='none' stroke='${ctx.pStroke}' stroke-opacity='${ctx.fo(1)}' stroke-width='1.2' stroke-linecap='round'/>`;
	return {
		bgImage: ctx.svgUrl(s, s, body),
		bgSize: `${s}px ${s}px`,
		bgPosition: '0 0',
	};
};

/** Staggered two-weight dots - a lighter, more decorative dot grid. */
const polkaDots: PatternBuilder = (ctx) => {
	const s = atLeast(16, ctx.size);
	const rBig = n(s * 0.11);
	const rSmall = n(s * 0.06);
	const corners = [[0, 0], [s, 0], [0, s], [s, s]]
		.map(([x, y]) => `<circle cx='${x}' cy='${y}' r='${rBig}'/>`)
		.join('');
	const body = `<g fill='${ctx.pFill}' fill-opacity='${ctx.fo(1)}'>${corners}`
		+ `<circle cx='${n(s / 2)}' cy='${n(s / 2)}' r='${rSmall}' fill-opacity='${ctx.fo(0.6)}'/></g>`;
	return {
		bgImage: ctx.svgUrl(s, s, body),
		bgSize: `${s}px ${s}px`,
		bgPosition: '0 0',
	};
};

const linedNotebook: PatternBuilder = (ctx) => {
	const lineSpacing = Math.max(16, ctx.size);
	if (ctx.svgDefs) {
		// A zero-height <line> has a degenerate bounding box, which makes an
		// objectBoundingBox gradient paint invalid and drops the rule entirely,
		// so the rule is drawn as a 1px rect instead.
		const body = `<rect y='${lineSpacing - 1}' width='100' height='1' fill='${ctx.pFill}'/>`;
		return {
			// The rule spans the full column width, so the tile stretches
			// horizontally instead of letterboxing its 100-unit viewBox.
			bgImage: ctx.svgUrl(100, lineSpacing, body, `preserveAspectRatio='none'`),
			bgSize: `100% ${lineSpacing}px`,
		};
	}
	return {
		bgImage: `repeating-linear-gradient(transparent, transparent ${lineSpacing - 1}px, ${ctx.rgba} ${lineSpacing - 1}px, ${ctx.rgba} ${lineSpacing}px)`,
		bgSize: `100% ${lineSpacing}px`,
	};
};

const diagonalStripes: PatternBuilder = (ctx) => {
	if (ctx.svgDefs) {
		const body = `<line x1='0' y1='${ctx.size}' x2='${ctx.size}' y2='0' stroke='${ctx.pStroke}' stroke-width='1.5'/>`;
		return {
			bgImage: ctx.svgUrl(ctx.size, ctx.size, body),
			bgSize: `${ctx.sizePx} ${ctx.sizePx}`,
			bgPosition: '0 0',
		};
	}
	return {
		bgImage: `repeating-linear-gradient(45deg, ${ctx.rgba}, ${ctx.rgba} 1px, transparent 0, transparent ${ctx.sizePx})`,
		bgSize: 'auto',
	};
};

export const GRID_PATTERNS: Record<string, PatternBuilder> = {
	'cross-hatch': crossHatch,
	'diagonal-stripes': diagonalStripes,
	'dot-grid': dotGrid,
	'graph-paper': graphPaper,
	'hexagon-grid': hexagonGrid,
	'isometric-grid': isometricGrid,
	'lined-notebook': linedNotebook,
	'math': math,
	'plus-grid': plusGrid,
	'polka-dots': polkaDots,
	'triangle-mesh': triangleMesh,
};
