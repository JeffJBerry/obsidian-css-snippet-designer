/**
 * Ornamental tessellations drawn from traditional textile and tile motifs.
 *
 * Every tile here wraps on all four edges: shapes that cross a boundary are
 * repeated at the opposite corner so the repeat seam is invisible.
 */
import type { PatternBuilder } from './types';
import { atLeast, n } from './util';

/** Seigaiha - overlapping concentric wave crests, offset row to row. */
const seigaiha: PatternBuilder = (ctx) => {
	const r = atLeast(16, ctx.size * 1.2);
	const arc = (cx: number, cy: number, rad: number): string =>
		`M${n(cx - rad)} ${n(cy)}A${n(rad)} ${n(rad)} 0 0 1 ${n(cx + rad)} ${n(cy)}`;
	let d = '';
	for (const k of [1, 0.72, 0.46, 0.22]) {
		const rad = r * k;
		d += arc(r, r, rad) + arc(0, r * 2, rad) + arc(r * 2, r * 2, rad);
	}
	const body = `<path d='${d}' fill='none' stroke='${ctx.pStroke}' stroke-opacity='${ctx.fo(1)}' stroke-width='${n(Math.max(0.9, r * 0.055))}'/>`;
	return {
		bgImage: ctx.svgUrl(r * 2, r * 2, body),
		bgSize: `${r * 2}px ${r * 2}px`,
		bgPosition: '0 0',
	};
};

/** Shippou - the "seven treasures" lattice of interlocking circles. */
const shippou: PatternBuilder = (ctx) => {
	const s = atLeast(20, ctx.size * 1.6);
	const r = n(s / 2);
	const at = (cx: number, cy: number): string => `<circle cx='${cx}' cy='${cy}' r='${r}'/>`;
	const body = `<g fill='none' stroke='${ctx.pStroke}' stroke-opacity='${ctx.fo(1)}' stroke-width='1'>`
		+ at(0, 0) + at(s, 0) + at(0, s) + at(s, s) + `<circle cx='${r}' cy='${r}' r='${r}'/>`
		+ `</g>`;
	return {
		bgImage: ctx.svgUrl(s, s, body),
		bgSize: `${s}px ${s}px`,
		bgPosition: '0 0',
	};
};

/** Chevron - stacked zigzag bands. */
const chevron: PatternBuilder = (ctx) => {
	const w = atLeast(16, ctx.size * 1.2);
	const h = Math.round(w * 0.8);
	const d = `M0 ${n(h / 2)}L${n(w / 2)} 0L${w} ${n(h / 2)}`
		+ `M0 ${h}L${n(w / 2)} ${n(h / 2)}L${w} ${h}`;
	const body = `<path d='${d}' fill='none' stroke='${ctx.pStroke}' stroke-opacity='${ctx.fo(1)}' stroke-width='${n(Math.max(1.2, w * 0.13))}' stroke-linejoin='miter'/>`;
	return {
		bgImage: ctx.svgUrl(w, h, body),
		bgSize: `${w}px ${h}px`,
		bgPosition: '0 0',
	};
};

/** Basket weave - alternating quadrants of ruled thread. */
const basketWeave: PatternBuilder = (ctx) => {
	const s = atLeast(20, ctx.size * 1.6);
	const half = s / 2;
	const gap = half / 4;
	let d = '';
	for (let i = 1; i <= 3; i++) {
		const o = n(gap * i);
		const p = n(half + gap * i);
		d += `M0 ${o}H${n(half)}`;
		d += `M${n(half)} ${p}H${s}`;
		d += `M${p} 0V${n(half)}`;
		d += `M${o} ${n(half)}V${s}`;
	}
	const body = `<g fill='none' stroke='${ctx.pStroke}'>`
		+ `<path d='${d}' stroke-opacity='${ctx.fo(1)}' stroke-width='1'/>`
		+ `<path d='M0 ${n(half)}H${s}M${n(half)} 0V${s}' stroke-opacity='${ctx.fo(0.35)}' stroke-width='1'/>`
		+ `</g>`;
	return {
		bgImage: ctx.svgUrl(s, s, body),
		bgSize: `${s}px ${s}px`,
		bgPosition: '0 0',
	};
};

/** Argyle - offset diamond harlequin with the dashed cross lines. */
const argyle: PatternBuilder = (ctx) => {
	const w = atLeast(26, ctx.size * 2);
	const h = Math.round(w * 1.3);
	const diamond = (cx: number, cy: number): string =>
		`M${n(cx)} ${n(cy - h / 2)}L${n(cx + w / 2)} ${n(cy)}L${n(cx)} ${n(cy + h / 2)}L${n(cx - w / 2)} ${n(cy)}Z`;
	const body = `<path d='${diamond(w / 2, h / 2)}' fill='${ctx.pFill}' fill-opacity='${ctx.fo(0.3)}'/>`
		+ `<path d='${diamond(0, 0)}${diamond(w, 0)}${diamond(0, h)}${diamond(w, h)}' fill='${ctx.pFill}' fill-opacity='${ctx.fo(0.14)}'/>`
		+ `<path d='M0 0L${w} ${h}M${w} 0L0 ${h}' fill='none' stroke='${ctx.pStroke}' stroke-opacity='${ctx.fo(0.9)}' stroke-width='1' stroke-dasharray='4 4'/>`;
	return {
		bgImage: ctx.svgUrl(w, h, body),
		bgSize: `${w}px ${h}px`,
		bgPosition: '0 0',
	};
};

/** Greek key - the classic meander band, one spiral per tile. */
const greekKey: PatternBuilder = (ctx) => {
	const s = atLeast(24, ctx.size * 2);
	const u = s / 12;
	const p = (v: number): string => n(v * u);
	const d = `M0 ${p(12)}V0H${p(12)}`
		+ `M${p(2)} ${p(12)}V${p(2)}H${p(10)}V${p(10)}H${p(4)}V${p(4)}H${p(8)}V${p(8)}H${p(6)}`;
	const body = `<path d='${d}' fill='none' stroke='${ctx.pStroke}' stroke-opacity='${ctx.fo(1)}' stroke-width='${n(Math.max(1, u * 0.85))}' stroke-linecap='square'/>`;
	return {
		bgImage: ctx.svgUrl(s, s, body),
		bgSize: `${s}px ${s}px`,
		bgPosition: '0 0',
	};
};

/**
 * Stars and Stripes - authentic monochromatic United States flag with 13 vertical stripes and 50-star canton.
 */
const starsAndStripes: PatternBuilder = (ctx) => {
	// Large dimensions to fill background prominently
	const w = atLeast(364, ctx.size * 16);
	const h = atLeast(480, ctx.size * 21);
	const stripeW = w / 13;
	const cantonW = stripeW * 7;
	const cantonH = Math.round(h * 0.46);

	let body = '';

	// 1. 13 Vertical Stripes
	// Monochromatic polarity: White stripes (odd i: 1, 3, 5, 7, 9, 11) are LIGHT, Red stripes (even i: 0, 2, 4, 6, 8, 10, 12) are DARK
	for (let i = 0; i < 13; i++) {
		const x = i * stripeW;
		const y = i < 7 ? cantonH : 0;
		const height = i < 7 ? h - cantonH : h;
		const isWhiteStripe = i % 2 === 1;

		if (isWhiteStripe) {
			// White / light stripe
			body += `<rect x='${n(x)}' y='${n(y)}' width='${n(stripeW)}' height='${n(height)}' fill='${ctx.pFill}' fill-opacity='${ctx.fo(0.72)}'/>`;
		} else {
			// Red / dark stripe (monochromatic contrast scaled by user opacity)
			body += `<rect x='${n(x)}' y='${n(y)}' width='${n(stripeW)}' height='${n(height)}' fill='${ctx.isDark ? '#000000' : '#1e293b'}' fill-opacity='${ctx.fo(0.75)}'/>`;
			body += `<rect x='${n(x)}' y='${n(y)}' width='${n(stripeW)}' height='${n(height)}' fill='${ctx.pFill}' fill-opacity='${ctx.fo(0.06)}'/>`;
		}

		if (i > 0) {
			body += `<rect x='${n(x - 0.5)}' y='${n(y)}' width='1' height='${n(height)}' fill='${ctx.pStroke}' fill-opacity='${ctx.fo(0.25)}'/>`;
		}
	}

	// 2. Black Star Background (Canton / Union) scaled by user opacity
	body += `<rect x='0' y='0' width='${n(cantonW)}' height='${n(cantonH)}' fill='${ctx.isDark ? '#000000' : '#0f172a'}' fill-opacity='${ctx.fo(0.88)}'/>`;
	body += `<rect x='0' y='0' width='${n(cantonW)}' height='${n(cantonH)}' fill='none' stroke='${ctx.pStroke}' stroke-width='1.5' stroke-opacity='${ctx.fo(0.85)}'/>`;

	// 3. 50 Stars in the Black Canton (9 alternating rows: 5 rows of 6, 4 rows of 5)
	const padX = cantonW * 0.08;
	const padY = cantonH * 0.09;
	const starRad = Math.max(3, Math.min(stripeW * 0.28, (cantonH / 18) * 0.85));
	const starIn = starRad * 0.382;

	const calcStar = (rOut: number, rIn: number): string => {
		const pts: string[] = [];
		for (let i = 0; i < 10; i++) {
			const angle = -Math.PI / 2 + (i * Math.PI) / 5;
			const r = i % 2 === 0 ? rOut : rIn;
			pts.push(`${n(r * Math.cos(angle))},${n(r * Math.sin(angle))}`);
		}
		return pts.join(' ');
	};

	const starDef = `<defs><polygon id='us-star' points='${calcStar(starRad, starIn)}' fill='${ctx.pFill}' fill-opacity='${ctx.fo(0.95)}'/></defs>`;

	const dx6 = (cantonW - 2 * padX) / 5;
	const dy = (cantonH - 2 * padY) / 8;

	for (let r = 0; r < 9; r++) {
		const sy = padY + r * dy;
		const is6 = r % 2 === 0;
		const count = is6 ? 6 : 5;
		for (let c = 0; c < count; c++) {
			const sx = is6 ? padX + c * dx6 : padX + (c + 0.5) * dx6;
			body += `<use href='#us-star' x='${n(sx)}' y='${n(sy)}'/>`;
		}
	}

	// 4. Subtle perimeter border separating flag panels
	body += `<rect x='${n(w - 1)}' y='0' width='1' height='${h}' fill='${ctx.pStroke}' fill-opacity='${ctx.fo(0.35)}'/>`;
	body += `<rect x='0' y='${n(h - 1)}' width='${w}' height='1' fill='${ctx.pStroke}' fill-opacity='${ctx.fo(0.35)}'/>`;

	return {
		bgImage: ctx.svgUrl(w, h, body, '', starDef),
		bgSize: `${w}px ${h}px`,
		bgPosition: '0 0',
	};
};

/**
 * Peace sign - one large ring crossed by the three-branch mark, held dead
 * centre of the pane.
 *
 * A single composition rather than a tile: the square is scaled by the size
 * slider and pinned with `background-repeat: no-repeat`,
 * `background-position: center` and `background-attachment: fixed`, so one
 * outline floats centred and aspect-true while a note scrolls. It is stroked
 * rather than filled, so the pane shows through the ring, and the whole sign is
 * drawn at a fixed stroke weight so it stays a clean outline at any size.
 */
const peaceSign: PatternBuilder = (ctx) => {
	const s = 200;
	const pct = Math.round((ctx.size / 24) * 100);
	const c = s / 2;
	const r = s * 0.43;
	const leg = r * 0.707;
	const stroke = n(r * 0.13);
	const d = `M${n(c)} ${n(c - r)}V${n(c + r)}`
		+ `M${n(c)} ${n(c)}L${n(c - leg)} ${n(c + leg)}`
		+ `M${n(c)} ${n(c)}L${n(c + leg)} ${n(c + leg)}`;
	const body = `<circle cx='${n(c)}' cy='${n(c)}' r='${n(r)}' fill='none' stroke='${ctx.pStroke}' stroke-opacity='${ctx.fo(1)}' stroke-width='${stroke}'/>`
		+ `<path d='${d}' fill='none' stroke='${ctx.pStroke}' stroke-opacity='${ctx.fo(1)}' stroke-width='${stroke}' stroke-linecap='round' stroke-linejoin='round'/>`;
	return {
		bgImage: ctx.svgUrl(s, s, body),
		bgSize: `${pct}% ${pct}%`,
		bgPosition: 'center',
		bgRepeat: 'no-repeat',
		bgAttachment: 'fixed',
	};
};

/**
 * Centered cross - one large Latin cross held dead centre of the pane.
 *
 * Sized as a percentage of the pane and scaled by the size slider, so the cross
 * stays centred and aspect-true while the slider resizes it;
 * `background-repeat: no-repeat` keeps it single and
 * `background-attachment: fixed` pins it to the window while a note scrolls.
 */
const centeredCross: PatternBuilder = (ctx) => {
	const pct = Math.round((ctx.size / 24) * 100);
	const body = `<path d='M42 4H58V27H79V43H58V96H42V43H21V27H42Z' fill='${ctx.pFill}' fill-opacity='${ctx.fo(1)}'/>`;
	return {
		bgImage: ctx.svgUrl(100, 100, body),
		bgSize: `${pct}% ${pct}%`,
		bgPosition: 'center',
		bgRepeat: 'no-repeat',
		bgAttachment: 'fixed',
	};
};

export const GEOMETRIC_PATTERNS: Record<string, PatternBuilder> = {
	argyle,
	'basket-weave': basketWeave,
	'centered-cross': centeredCross,
	chevron,
	'greek-key': greekKey,
	'peace-sign': peaceSign,
	seigaiha,
	shippou,
	'stars-and-stripes': starsAndStripes,
};

