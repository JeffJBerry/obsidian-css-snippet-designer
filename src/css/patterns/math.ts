/**
 * Mathematical formulas, equations, constants, and geometric sketches.
 *
 * Renders an academic chalkboard / notebook aesthetic with iconic formulas
 * from calculus, physics, geometry, algebra, and quantum mechanics.
 */
import type { PatternBuilder } from './types';

interface MathFormula {
	text: string;
	x: number;
	y: number;
	size: number;
	op: number;
	bold?: boolean;
	italic?: boolean;
}

const FORMULAS: readonly MathFormula[] = [
	// --- Top Row / Section ---
	{ text: 'eⁱᵠ = cos φ + i sin φ', x: 24, y: 38, size: 15, op: 0.85, italic: true },
	{ text: '∇ × B = μ₀J + μ₀ε₀ ∂E/∂t', x: 240, y: 40, size: 13.5, op: 0.75 },
	{ text: 'E = mc²', x: 490, y: 42, size: 18, op: 0.95, bold: true, italic: true },
	{ text: '∫ e⁻ˣ² dx = √π', x: 175, y: 72, size: 15, op: 0.8 },
	{ text: 'lim┬(x→0) (sin x / x) = 1', x: 355, y: 76, size: 13, op: 0.7 },
	{ text: 'π ≈ 3.14159', x: 425, y: 98, size: 12, op: 0.55 },

	// --- Second Row / Section ---
	{ text: 'iℏ ∂ψ/∂t = Ĥψ', x: 28, y: 122, size: 16, op: 0.9, bold: true, italic: true },
	{ text: 'a² + b² = c²', x: 236, y: 132, size: 15, op: 0.85, bold: true, italic: true },
	{ text: '∑ₙ₌₁^∞ 1/n² = π²/6', x: 380, y: 124, size: 14, op: 0.8 },
	{ text: 'S = k ln Ω', x: 495, y: 148, size: 15, op: 0.85, italic: true },
	{ text: '∀x ∈ ℝ, eˣ &gt; 0', x: 110, y: 152, size: 11.5, op: 0.5 },
	{ text: '∂f/∂x', x: 330, y: 154, size: 12.5, op: 0.55, italic: true },

	// --- Middle Section ---
	{ text: 'x = (-b ± √(b² - 4ac)) / 2a', x: 25, y: 188, size: 14, op: 0.85, italic: true },
	{ text: 'eⁱᵖ + 1 = 0', x: 275, y: 192, size: 18, op: 0.95, bold: true, italic: true },
	{ text: '∮ E · dA = Q / ε₀', x: 435, y: 196, size: 14, op: 0.75 },
	{ text: 'λ = h / p', x: 120, y: 228, size: 14.5, op: 0.8, italic: true },
	{ text: 'Δx · Δp ≥ ℏ/2', x: 235, y: 242, size: 14, op: 0.8 },
	{ text: 'det(A - λI) = 0', x: 415, y: 240, size: 13.5, op: 0.75 },
	{ text: '√2 ≈ 1.414', x: 40, y: 236, size: 11.5, op: 0.5 },
	{ text: 'ℏ ≈ 1.055×10⁻³⁴', x: 505, y: 226, size: 11, op: 0.45 },

	// --- Fourth Row / Section ---
	{ text: 'F = G (m₁m₂ / r²)', x: 30, y: 292, size: 14.5, op: 0.85, italic: true },
	{ text: 'f(x) = (1/σ√2π) e^(-(x-μ)²/2σ²)', x: 220, y: 298, size: 12.5, op: 0.7 },
	{ text: 'sin²θ + cos²θ = 1', x: 440, y: 300, size: 14.5, op: 0.85, italic: true },
	{ text: 'φ = (1 + √5)/2 ≈ 1.618', x: 75, y: 338, size: 13, op: 0.75 },
	{ text: 'd/dx [eˣ] = eˣ', x: 285, y: 348, size: 14, op: 0.8, italic: true },
	{ text: '∇²V = -ρ/ε₀', x: 470, y: 348, size: 13.5, op: 0.75 },
	{ text: '∃ ε &gt; 0', x: 395, y: 322, size: 12, op: 0.5 },

	// --- Bottom Section ---
	{ text: 'c ≈ 3×10⁸ m/s', x: 35, y: 378, size: 11.5, op: 0.5 },
	{ text: 'ζ(s) = ∑ₙ₌₁^∞ n⁻ˢ', x: 175, y: 382, size: 13.5, op: 0.7, italic: true },
	{ text: 'ds² = -c²dt² + dx² + dy² + dz²', x: 370, y: 384, size: 13, op: 0.65 },
	{ text: 'A = πr²', x: 535, y: 382, size: 12.5, op: 0.6, italic: true },
];

export const math: PatternBuilder = (ctx) => {
	const svgW = 600;
	const svgH = 400;

	// Scale tile size proportionally with the pattern slider
	const sWidth = Math.max(300, Math.round(ctx.size * 18));
	const sHeight = Math.round((sWidth * svgH) / svgW);

	// Font styling: serif mathematics stack
	const style = `<style>text{font-family:'Cambria Math','STIX Two Math','Latin Modern Math','KaTeX_Main','Times New Roman','DejaVu Serif',serif;fill:${ctx.pFill};user-select:none;}</style>`;

	// Build SVG text elements for equations
	let textElements = '';
	for (const f of FORMULAS) {
		const weight = f.bold ? " font-weight='bold'" : '';
		const fontStyle = f.italic ? " font-style='italic'" : '';
		textElements += `<text x='${f.x}' y='${f.y}' font-size='${f.size}' fill-opacity='${ctx.fo(f.op)}'${weight}${fontStyle}>${f.text}</text>`;
	}

	// Geometric diagram sketches (chalkboard sketches with 2D bounds for gradient compatibility)
	// 1. Right triangle next to Pythagorean theorem (x: 200..225, y: 115..135)
	const rightTriangle = `<path d='M195 135 L225 135 L225 115 Z' fill='none' stroke='${ctx.pStroke}' stroke-opacity='${ctx.fo(0.7)}' stroke-width='1.2'/>`
		+ `<path d='M218 135 V128 H225' fill='none' stroke='${ctx.pStroke}' stroke-opacity='${ctx.fo(0.5)}' stroke-width='0.8'/>`
		+ `<text x='208' y='144' font-size='9' fill-opacity='${ctx.fo(0.6)}' font-style='italic'>a</text>`
		+ `<text x='229' y='127' font-size='9' fill-opacity='${ctx.fo(0.6)}' font-style='italic'>b</text>`
		+ `<text x='205' y='121' font-size='9' fill-opacity='${ctx.fo(0.6)}' font-style='italic'>c</text>`;

	// 2. Parabola with coordinate axes (x: 95..125, y: 80..105)
	const parabola = `<path d='M95 95 H125 M110 80 V105' fill='none' stroke='${ctx.pStroke}' stroke-opacity='${ctx.fo(0.45)}' stroke-width='0.9'/>`
		+ `<path d='M99 87 Q110 102 121 87' fill='none' stroke='${ctx.pStroke}' stroke-opacity='${ctx.fo(0.75)}' stroke-width='1.2'/>`
		+ `<text x='112' y='86' font-size='8' fill-opacity='${ctx.fo(0.55)}' font-style='italic'>y=x²</text>`;

	// 3. Unit circle arc & angle theta (x: 350, y: 220)
	const unitCircle = `<circle cx='345' cy='225' r='12' fill='none' stroke='${ctx.pStroke}' stroke-opacity='${ctx.fo(0.4)}' stroke-width='0.9'/>`
		+ `<path d='M345 225 L354 217' fill='none' stroke='${ctx.pStroke}' stroke-opacity='${ctx.fo(0.65)}' stroke-width='1'/>`
		+ `<path d='M351 225 A6 6 0 0 0 350 221' fill='none' stroke='${ctx.pStroke}' stroke-opacity='${ctx.fo(0.55)}' stroke-width='0.8'/>`
		+ `<text x='353' y='224' font-size='8' fill-opacity='${ctx.fo(0.6)}' font-style='italic'>θ</text>`;

	// 4. Bell curve / Gaussian distribution sketch (x: 175..205, y: 290..305)
	const bellCurve = `<path d='M170 305 H206 M188 288 V306' fill='none' stroke='${ctx.pStroke}' stroke-opacity='${ctx.fo(0.4)}' stroke-width='0.8'/>`
		+ `<path d='M172 304 C180 304 183 291 188 291 C193 291 196 304 204 304' fill='none' stroke='${ctx.pStroke}' stroke-opacity='${ctx.fo(0.7)}' stroke-width='1.1'/>`;

	const svgBody = style + textElements + rightTriangle + parabola + unitCircle + bellCurve;

	return {
		bgImage: ctx.svgUrl(svgW, svgH, svgBody),
		bgSize: `${sWidth}px ${sHeight}px`,
		bgPosition: '0 0',
	};
};
