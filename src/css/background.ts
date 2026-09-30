/**
 * Procedural background pattern generation.
 *
 * This module resolves colour, opacity and animation into a `PatternContext`
 * and hands it to the builder registered for the requested style. The drawing
 * itself lives in `./patterns/*`, one module per picker category.
 */
import { parseColorDetails } from './color';
import { PATTERN_BUILDERS } from './patterns';
import { ANIMATED_ANIMAL_PATTERNS } from './patterns/animals';
import { matrixRain } from './patterns/matrix';
import type { PatternBuilder, PatternContext, PatternResult } from './patterns/types';

const FALLBACK_STYLE = 'dot-grid';

/** Animated builders that are not animals: flipbook-only, never in the picker. */
const ANIMATED_EFFECT_PATTERNS: Record<string, PatternBuilder> = {
	'anim-matrix': matrixRain,
};

/**
 * Style ids a background can name: the picker's patterns plus the animated
 * builders, which exist only as flipbook frames and are not listed.
 */
export function isKnownBackgroundPattern(style: string): boolean {
	return Object.prototype.hasOwnProperty.call(PATTERN_BUILDERS, style)
		|| Object.prototype.hasOwnProperty.call(ANIMATED_ANIMAL_PATTERNS, style)
		|| Object.prototype.hasOwnProperty.call(ANIMATED_EFFECT_PATTERNS, style);
}

/**
 * Convert a CSS gradient angle in degrees to SVG linearGradient coordinate percentages.
 *
 * Follows standard CSS linear-gradient geometry:
 * - 0° is bottom-to-top (pointing up)
 * - 90° is left-to-right
 * - 135° is top-left to bottom-right (matching the SVG diagonal baseline)
 * - 180° is top-to-bottom
 * - 270° is right-to-left
 */
export function gradientAngleToCoords(angleDeg: number): { x1: string; y1: string; x2: string; y2: string } {
	const rad = (angleDeg * Math.PI) / 180;
	const s = Math.sin(rad);
	const c = Math.cos(rad);
	const halfLen = (Math.abs(s) + Math.abs(c)) / 2;
	const dx = s * halfLen;
	const dy = -c * halfLen;
	const x1 = Math.round((0.5 - dx) * 1000) / 10;
	const y1 = Math.round((0.5 - dy) * 1000) / 10;
	const x2 = Math.round((0.5 + dx) * 1000) / 10;
	const y2 = Math.round((0.5 + dy) * 1000) / 10;
	return {
		x1: `${x1}%`,
		y1: `${y1}%`,
		x2: `${x2}%`,
		y2: `${y2}%`,
	};
}

export function getBackgroundPatternCss(
	style: string,
	size: number,
	opacity: number,
	colorStr: string,
	isDark: boolean,
	isGradient: boolean = false,
	color2Str?: string,
	animMode: string = 'none',
	gradAngle: number = 135,
	frame: number = 0,
): PatternResult {
	const ctx = buildPatternContext(size, opacity, colorStr, isDark, isGradient, color2Str, animMode, gradAngle, frame);
	const build = PATTERN_BUILDERS[style]
		?? ANIMATED_ANIMAL_PATTERNS[style]
		?? ANIMATED_EFFECT_PATTERNS[style]
		?? PATTERN_BUILDERS[FALLBACK_STYLE];
	if (!build) {
		// Unreachable while the fallback is registered; keeps the type honest.
		return {
			bgImage: `radial-gradient(${ctx.rgba} 1.5px, transparent 1.5px)`,
			bgSize: `${ctx.sizePx} ${ctx.sizePx}`,
			bgPosition: '0 0',
		};
	}
	return build(ctx);
}

function buildPatternContext(
	size: number,
	opacity: number,
	colorStr: string,
	isDark: boolean,
	isGradient: boolean,
	color2Str: string | undefined,
	animMode: string,
	gradAngle: number = 135,
	frame: number = 0,
): PatternContext {
	const c = parseColorDetails(colorStr, opacity);
	const defaultColor2 = isDark ? '#a855f7' : '#9333ea';
	const c2 = parseColorDetails((color2Str && color2Str.trim()) ? color2Str : defaultColor2, opacity);
	const op = c.opacity;

	// A pure white or black pick is the "untouched" default, so pattern art
	// falls back to a theme accent rather than rendering as a flat grey wash.
	const isDefault = colorStr.toLowerCase() === '#ffffff' || colorStr.toLowerCase() === '#000000';
	const isDefault2 = !color2Str || color2Str.toLowerCase() === '#ffffff' || color2Str.toLowerCase() === '#000000';
	const p1 = isDefault ? (isDark ? '#00ff9d' : '#059669') : c.hex;
	const p2 = isDefault2 ? (isDark ? '#a855f7' : '#7c3aed') : c2.hex;

	const svgDefs = buildGradientDefs(op, p1, p2, isDark, isGradient, animMode, gradAngle);
	const paint = svgDefs ? 'url(#pgrad)' : c.hex;

	const ctx: PatternContext = {
		frame,
		size,
		sizePx: `${size}px`,
		op,
		isDark,
		isGradient,
		gradAngle,
		c,
		c2,
		rgba: c.rgba,
		rgba2: c2.rgba,
		p1,
		p2,
		svgDefs,
		pStroke: paint,
		pFill: paint,
		fo: (mult = 1) => (svgDefs ? String(Math.min(1, mult)) : (op * mult).toFixed(3)),
		tint: (mult = 1) => `rgba(${c.r}, ${c.g}, ${c.b}, ${Math.min(1, op * mult).toFixed(3)})`,
		tint2: (mult = 1) => `rgba(${c2.r}, ${c2.g}, ${c2.b}, ${Math.min(1, op * mult).toFixed(3)})`,
		svgUrl: (width, height, body, rootAttrs = '', extraDefs = '') => {
			const attrs = rootAttrs ? ` ${rootAttrs}` : '';
			const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}' viewBox='0 0 ${width} ${height}'${attrs}>`
				+ `${svgDefs}${extraDefs}${body}</svg>`;
			return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
		},
	};
	return ctx;
}

/**
 * Build the `<defs>` that carry an animated or two-tone paint.
 *
 * Everything downstream then paints with `url(#pgrad)` and expresses element
 * opacity as a multiplier, because the gradient stops already carry the user's
 * opacity - that is what keeps one builder working in flat, gradient and
 * animated modes without branching.
 */
function buildGradientDefs(
	op: number,
	p1: string,
	p2: string,
	isDark: boolean,
	isGradient: boolean,
	animMode: string,
	gradAngle: number = 135,
): string {
	if (!isGradient) {
		return '';
	}
	const coords = gradientAngleToCoords(gradAngle);
	return `<defs><linearGradient id='pgrad' x1='${coords.x1}' y1='${coords.y1}' x2='${coords.x2}' y2='${coords.y2}'>`
		+ `<stop offset='0%' stop-color='${p1}' stop-opacity='${op}'/>`
		+ `<stop offset='100%' stop-color='${p2}' stop-opacity='${op}'/>`
		+ `</linearGradient></defs>`;
}
