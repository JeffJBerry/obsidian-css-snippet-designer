/**
 * Decorative glyph tiles.
 */
import type { PatternBuilder } from './types';
import { atLeast, n } from './util';

const hearts: PatternBuilder = (ctx) => {
	const s = Math.max(20, ctx.size);
	const body = `<path fill='${ctx.pFill}' fill-opacity='${ctx.fo(1)}' d='M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z'/>`;
	return { bgImage: ctx.svgUrl(24, 24, body), bgSize: `${s}px ${s}px`, bgPosition: 'center' };
};

const cats: PatternBuilder = (ctx) => {
	const s = Math.max(24, ctx.size);
	const body = `<path d='M8 12 L5 4 L14 8 C15.3 7.7 16.7 7.7 18 8 L27 4 L24 12 C26.5 15 26.5 19 24 23 C21 27 11 27 8 23 C5.5 19 5.5 15 8 12 Z'/>`
		+ `<circle cx='12' cy='16' r='1' fill='${ctx.pFill}' fill-opacity='${ctx.fo(1)}'/>`
		+ `<circle cx='20' cy='16' r='1' fill='${ctx.pFill}' fill-opacity='${ctx.fo(1)}'/>`
		+ `<path d='M14 19 L16 20.5 L18 19'/><path d='M6 18 L1 17 M6 20 L2 21 M26 18 L31 17 M26 20 L30 21'/>`;
	const attrs = `fill='none' stroke='${ctx.pStroke}' stroke-opacity='${ctx.fo(1)}' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'`;
	return { bgImage: ctx.svgUrl(32, 32, body, attrs), bgSize: `${s}px ${s}px`, bgPosition: 'center' };
};

/** Paw prints - a pad and four toes, wandering across the tile. */
const pawPrints: PatternBuilder = (ctx) => {
	const s = atLeast(48, ctx.size * 2.4);
	const paw = `<ellipse cx='0' cy='4.4' rx='6' ry='4.6'/>`
		+ `<ellipse cx='-6.2' cy='-2.6' rx='2.4' ry='3.2' transform='rotate(-22 -6.2 -2.6)'/>`
		+ `<ellipse cx='-2.2' cy='-6.4' rx='2.3' ry='3.1'/>`
		+ `<ellipse cx='2.2' cy='-6.4' rx='2.3' ry='3.1'/>`
		+ `<ellipse cx='6.2' cy='-2.6' rx='2.4' ry='3.2' transform='rotate(22 6.2 -2.6)'/>`;
	const place = (x: number, y: number, rot: number, k: number, o: number): string =>
		`<g transform='translate(${n(s * x)} ${n(s * y)}) rotate(${rot}) scale(${k})' fill='${ctx.pFill}' fill-opacity='${ctx.fo(o)}'>${paw}</g>`;
	const body = place(0.24, 0.26, -18, 1, 1) + place(0.62, 0.44, 14, 0.85, 0.75)
		+ place(0.38, 0.76, 28, 0.7, 0.6) + place(0.86, 0.84, -8, 0.55, 0.5);
	return { bgImage: ctx.svgUrl(s, s, body), bgSize: `${s}px ${s}px`, bgPosition: '0 0' };
};

/** Four-point sparkles at three sizes. */
const sparkleStars: PatternBuilder = (ctx) => {
	const s = atLeast(44, ctx.size * 2.2);
	const spark = `M0 -10C1 -3.6 3.6 -1 10 0C3.6 1 1 3.6 0 10C-1 3.6 -3.6 1 -10 0C-3.6 -1 -1 -3.6 0 -10Z`;
	const place = (x: number, y: number, k: number, rot: number, o: number): string =>
		`<path d='${spark}' fill='${ctx.pFill}' fill-opacity='${ctx.fo(o)}' transform='translate(${n(s * x)} ${n(s * y)}) rotate(${rot}) scale(${k})'/>`;
	const body = place(0.28, 0.3, 1, 0, 1) + place(0.72, 0.22, 0.5, 20, 0.7)
		+ place(0.58, 0.7, 0.8, -12, 0.85) + place(0.16, 0.82, 0.4, 8, 0.55)
		+ place(0.9, 0.62, 0.32, 0, 0.45);
	return { bgImage: ctx.svgUrl(s, s, body), bgSize: `${s}px ${s}px`, bgPosition: '0 0' };
};

/** Confetti - mixed rectangles, discs and ribbons at scattered angles. */
const confetti: PatternBuilder = (ctx) => {
	const s = atLeast(56, ctx.size * 2.8);
	const at = (x: number, y: number): string => `translate(${n(s * x)} ${n(s * y)})`;
	const body = `<g fill='${ctx.pFill}'>`
		+ `<rect x='-3' y='-1.5' width='6' height='3' rx='1' fill-opacity='${ctx.fo(1)}' transform='${at(0.16, 0.2)} rotate(28)'/>`
		+ `<rect x='-3' y='-1.5' width='6' height='3' rx='1' fill-opacity='${ctx.fo(0.6)}' transform='${at(0.7, 0.14)} rotate(-42)'/>`
		+ `<rect x='-3' y='-1.5' width='6' height='3' rx='1' fill-opacity='${ctx.fo(0.85)}' transform='${at(0.52, 0.62)} rotate(66)'/>`
		+ `<rect x='-3' y='-1.5' width='6' height='3' rx='1' fill-opacity='${ctx.fo(0.5)}' transform='${at(0.88, 0.8)} rotate(-14)'/>`
		+ `<circle r='2' fill-opacity='${ctx.fo(0.9)}' transform='${at(0.36, 0.44)}'/>`
		+ `<circle r='1.5' fill-opacity='${ctx.fo(0.55)}' transform='${at(0.82, 0.42)}'/>`
		+ `<circle r='1.8' fill-opacity='${ctx.fo(0.7)}' transform='${at(0.2, 0.86)}'/>`
		+ `</g>`
		+ `<g fill='none' stroke='${ctx.pStroke}' stroke-width='1.6' stroke-linecap='round'>`
		+ `<path d='M-4 0C-2 -3 2 3 4 0' stroke-opacity='${ctx.fo(0.8)}' transform='${at(0.62, 0.3)} rotate(18)'/>`
		+ `<path d='M-4 0C-2 -3 2 3 4 0' stroke-opacity='${ctx.fo(0.55)}' transform='${at(0.3, 0.7)} rotate(-36)'/>`
		+ `</g>`;
	return { bgImage: ctx.svgUrl(s, s, body), bgSize: `${s}px ${s}px`, bgPosition: '0 0' };
};

/** Music notes - a quaver and a beamed pair. */
const musicNotes: PatternBuilder = (ctx) => {
	const s = atLeast(48, ctx.size * 2.4);
	const quaver = `<ellipse cx='-4.6' cy='8' rx='4.6' ry='3.4' transform='rotate(-22 -4.6 8)' fill='${ctx.pFill}'/>`
		+ `<path d='M-0.4 7.2V-8' fill='none' stroke='${ctx.pStroke}' stroke-width='1.6'/>`
		+ `<path d='M-0.4 -8C3.8 -6.4 5.8 -3.8 4.8 0C4.6 -3 2.4 -4.8 -0.4 -5.4Z' fill='${ctx.pFill}'/>`;
	const beamed = `<ellipse cx='-7' cy='8' rx='4.4' ry='3.2' transform='rotate(-22 -7 8)' fill='${ctx.pFill}'/>`
		+ `<ellipse cx='7' cy='5' rx='4.4' ry='3.2' transform='rotate(-22 7 5)' fill='${ctx.pFill}'/>`
		+ `<path d='M-2.8 7.4V-8M11.2 4.4V-11' fill='none' stroke='${ctx.pStroke}' stroke-width='1.6'/>`
		+ `<path d='M-2.8 -8L11.2 -11V-6.6L-2.8 -3.6Z' fill='${ctx.pFill}'/>`;
	const place = (glyph: string, x: number, y: number, k: number, rot: number, o: number): string =>
		`<g transform='translate(${n(s * x)} ${n(s * y)}) rotate(${rot}) scale(${k})' fill-opacity='${ctx.fo(o)}' stroke-opacity='${ctx.fo(o)}'>${glyph}</g>`;
	const body = place(beamed, 0.3, 0.3, 0.9, -6, 1)
		+ place(quaver, 0.78, 0.62, 0.85, 10, 0.75)
		+ place(quaver, 0.18, 0.8, 0.6, -14, 0.55);
	return { bgImage: ctx.svgUrl(s, s, body), bgSize: `${s}px ${s}px`, bgPosition: '0 0' };
};

/**
 * Flappy Bird - a bottom-anchored side-scroller of green pipes over drifting
 * clouds and a bush-lined ground, painted as one tall tile that repeats
 * horizontally.
 *
 * `repeat-x` with the tile anchored to the bottom edge is what makes it read
 * as a sky: repeating vertically would stack horizons, and the hanging pipes
 * would be clipped mid-air. One pipe pair sits on a fixed flight line per tile
 * at a wide, equal spacing, so the corridor between the caps stays open enough
 * to imagine flying through. A cloud that crosses a side edge is redrawn on
 * the opposite edge, so the drifting cloudscape continues across the repeat
 * instead of restarting at every seam. Clouds sit in the two sky lanes either
 * side of the pipe, never behind it, so no cloud ghosts through the
 * translucent pipe body. The ground band is uniform and its scallop period
 * divides the tile width, so the grass tiles too.
 *
 * The cloud is painted as a literal white rather than the theme's paint,
 * because a green cloud would stop reading as a cloud. Everything else still
 * uses `pFill`/`pStroke`.
 */
const flappyBird: PatternBuilder = (ctx) => {
	const base = atLeast(44, Math.round(ctx.size * 1.5));
	const w = base * 6;
	const h = base * 26;
	const groundH = base * 1.5;
	const groundY = h - groundH;
	const grassH = base * 0.85;
	const pipeW = base * 1.1;
	const capW = pipeW * 1.34;
	const capH = base * 0.55;
	const gapH = base * 4;
	const gapY = groundY - base * 6;

	/** A literal colour folded with the user's opacity, for the cloud white. */
	const solid = (hex: string, mult = 1): string => {
		const r = parseInt(hex.slice(1, 3), 16);
		const g = parseInt(hex.slice(3, 5), 16);
		const b = parseInt(hex.slice(5, 7), 16);
		return `rgba(${r}, ${g}, ${b}, ${Math.min(1, ctx.op * mult).toFixed(3)})`;
	};

	/**
	 * A flat-bottomed cloud: three rounded humps over a straight base. Painted
	 * fill-only - no stroke - so neither the base nor the sides carry an
	 * outline and the cloud fades into the sky with no seam.
	 */
	const cloud = (cx: number, baseY: number, cw: number): string => {
		const ch = cw * 0.6;
		const d = `M${n(-cw * 0.5)} 0`
			+ `C${n(-cw * 0.5)} ${n(-ch * 0.85)} ${n(-cw * 0.28)} ${n(-ch * 1.05)} ${n(-cw * 0.14)} ${n(-ch * 0.62)}`
			+ `C${n(-cw * 0.06)} ${n(-ch * 1.2)} ${n(cw * 0.16)} ${n(-ch * 1.2)} ${n(cw * 0.24)} ${n(-ch * 0.66)}`
			+ `C${n(cw * 0.36)} ${n(-ch)} ${n(cw * 0.5)} ${n(-ch * 0.7)} ${n(cw * 0.5)} 0Z`;
		return `<path d='${d}' fill='${solid('#ffffff', 0.92)}' transform='translate(${n(cx)} ${n(baseY)})'/>`;
	};

	/** A cloud, plus a wrap-around copy when it crosses a side edge. */
	const placeCloud = (cx: number, baseY: number, cw: number): string => {
		const hw = cw * 0.5;
		let art = cloud(cx, baseY, cw);
		if (cx + hw > w) art += cloud(cx - w, baseY, cw);
		if (cx - hw < 0) art += cloud(cx + w, baseY, cw);
		return art;
	};
	// Clouds are kept to the two sky lanes either side of the pipe column
	// (pipe spans roughly 2.26-3.74 base units), so none sits behind a pipe.
	const clouds = placeCloud(base * 0.5, groundY - base * 13.5, base * 1.6)
		+ placeCloud(base * 1.0, groundY - base * 10, base * 0.9)
		+ placeCloud(base * 1.6, groundY - base * 17.5, base * 1.1)
		+ placeCloud(base * 4.6, groundY - base * 12, base * 1.4)
		+ placeCloud(base * 4.2, groundY - base * 16.5, base * 0.7)
		+ placeCloud(base * 5.7, groundY - base * 15.5, base * 1.4);

	const rect = (x: number, y: number, bw: number, bh: number, o: number, rx = 0): string =>
		bh <= 0 ? ''
			: `<rect x='${n(x)}' y='${n(y)}' width='${n(bw)}' height='${n(bh)}' rx='${n(rx)}' fill='${ctx.pFill}' fill-opacity='${ctx.fo(o)}' stroke='${ctx.pStroke}' stroke-opacity='${ctx.fo(1)}' stroke-width='1.6'/>`;

	/**
	 * One pipe pair: a column dropping from the frame and a column rising from
	 * the grass, their caps facing a shared gap. The body is drawn faint and
	 * the caps brighter, with a soft highlight down the left third, which is
	 * what reads as a lit cylinder rather than a flat bar.
	 */
	const pipe = (cx: number): string => {
		const gapTop = gapY - gapH / 2;
		const gapBot = gapY + gapH / 2;
		const bodyH = Math.max(0, gapTop - capH);
		const lowerTop = gapBot + capH;
		const lowerH = Math.max(0, groundY + grassH - lowerTop);
		const bodyRx = pipeW * 0.08;
		const highlight = (y: number, bh: number): string =>
			bh <= 0 ? ''
				: `<rect x='${n(cx - pipeW * 0.3)}' y='${n(y)}' width='${n(pipeW * 0.22)}' height='${n(bh)}' rx='${n(pipeW * 0.11)}' fill='${ctx.pFill}' fill-opacity='${ctx.fo(0.4)}'/>`;
		return rect(cx - pipeW / 2, 0, pipeW, bodyH, 0.7, bodyRx)
			+ highlight(0, bodyH)
			+ rect(cx - capW / 2, gapTop - capH, capW, capH, 0.82, capH * 0.22)
			+ rect(cx - pipeW / 2, lowerTop, pipeW, lowerH, 0.7, bodyRx)
			+ highlight(lowerTop, lowerH)
			+ rect(cx - capW / 2, gapBot, capW, capH, 0.82, capH * 0.22);
	};
	const pipes = pipe(w / 2);

	// Ground: a darker soil band under a brighter, scalloped grass edge. The
	// scallop period divides the tile width exactly, so the grass tiles too.
	// Fill the closed band, but stroke only the scalloped top - stroking the
	// shape's vertical tile edges would leave a 1px seam at every repeat.
	const period = base;
	const bump = base * 0.5;
	let grassTop = `M0 ${n(groundY)}`;
	for (let i = 0; i < 6; i++) grassTop += `q ${n(period / 2)} ${n(-bump)} ${n(period)} 0`;
	const ground = `<rect x='0' y='${n(groundY + grassH)}' width='${w}' height='${n(groundH - grassH)}' fill='${ctx.pFill}' fill-opacity='${ctx.fo(0.35)}'/>`
		+ `<path d='${grassTop}V${n(groundY + grassH)}H0Z' fill='${ctx.pFill}' fill-opacity='${ctx.fo(0.8)}'/>`
		+ `<path d='${grassTop}' fill='none' stroke='${ctx.pStroke}' stroke-opacity='${ctx.fo(0.9)}' stroke-width='1'/>`;

	return {
		bgImage: ctx.svgUrl(w, h, clouds + pipes + ground),
		bgSize: `${w}px ${h}px`,
		bgPosition: '0 100%',
		bgRepeat: 'repeat-x',
	};
};

/** Shared skull-and-crossbones geometry, laid out in a 64x64 tile. */
function skullEmblem(): { bones: string; skull: string; features: string } {
	const bone = `<rect x='-37' y='-2.3' width='74' height='4.6' rx='2.3'/>`
		+ `<circle cx='-35' cy='-2.9' r='2.9'/>`
		+ `<circle cx='-35' cy='2.9' r='2.9'/>`
		+ `<circle cx='35' cy='-2.9' r='2.9'/>`
		+ `<circle cx='35' cy='2.9' r='2.9'/>`;
	const bones = `<g transform='translate(50 74) rotate(26)'>${bone}</g>`
		+ `<g transform='translate(50 74) rotate(-26)'>${bone}</g>`;

	const skull = `M50 6C60 6 67.5 9.5 70.6 16C72.6 20.5 73 25.5 72.6 30`
		+ `C72.2 34 70.4 37.6 69.4 40.2C68.8 42 69 43.8 70.2 45.4`
		+ `C71.2 46.8 71.4 48.6 70.4 50.2C69 52.2 66.6 53 64.8 54.8`
		+ `C62.8 56.6 62 57.8 61 59`
		+ `L61 64.5Q59.36 67.5 57.72 64.5L57.72 59`
		+ `L56.32 59L56.32 64.5Q54.68 67.5 53.04 64.5L53.04 59`
		+ `L51.64 59L51.64 64.5Q50 67.5 48.36 64.5L48.36 59`
		+ `L46.96 59L46.96 64.5Q45.32 67.5 43.68 64.5L43.68 59`
		+ `L42.28 59L42.28 64.5Q40.64 67.5 39 64.5L39 59`
		+ `C38.8 57.8 37.4 56.6 35.2 54.8`
		+ `C33.4 53 31 52.2 29.6 50.2C28.6 48.6 28.8 46.8 29.8 45.4`
		+ `C31 43.8 31.2 42 30.6 40.2C29.6 37.6 27.8 34 27.4 30`
		+ `C27 25.5 27.4 20.5 29.4 16C32.5 9.5 40 6 50 6Z`;
	const features = `<rect x='30.4' y='28' width='16.4' height='14.2' rx='6.2' transform='rotate(9 38.6 35.1)'/>`
		+ `<rect x='53.2' y='28' width='16.4' height='14.2' rx='6.2' transform='rotate(-9 61.4 35.1)'/>`
		+ `<path d='M49.4 43.5C48.4 46.2 46.4 48.8 44.8 51C43.6 52.8 44.4 54.8 46.4 54.8L49.4 54.8Z'/>`
		+ `<path d='M50.6 43.5C51.6 46.2 53.6 48.8 55.2 51C56.4 52.8 55.6 54.8 53.6 54.8L50.6 54.8Z'/>`;
	return { bones, skull, features };
}

/**
 * Skull and crossbones - one large, centred pirate-flag emblem in a square
 * tile that repeats seamlessly in both directions.
 *
 * Everything is composited through a single mask and painted with one rect, so
 * the skull and the bone X read as one solid shape with a uniform edge instead
 * of stacking alpha where they overlap. The mask is a union: the bones and the
 * skull are painted white (white over white stays white), which hides the
 * crossing behind the jaw, and the eye sockets, nasal cavity and tooth notches
 * are then punched out in black so they open onto the page.
 */
const skullCrossbones: PatternBuilder = (ctx) => {
	const box = 100;
	const s = atLeast(60, ctx.size * 3);
	const { bones, skull, features } = skullEmblem();

	const mask = `<defs><mask id='skull-emblem' maskUnits='userSpaceOnUse' x='0' y='0' width='${box}' height='${box}'>`
		+ `<g fill='#fff'>${bones}<path d='${skull}'/></g>`
		+ `<g fill='#000'>${features}</g>`
		+ `</mask></defs>`;
	const body = `<rect x='0' y='0' width='${box}' height='${box}' fill='${ctx.pFill}' fill-opacity='${ctx.fo(1)}' mask='url(#skull-emblem)'/>`;

	return {
		bgImage: ctx.svgUrl(box, box, body, '', mask),
		bgSize: `${s}px ${s}px`,
		bgPosition: 'center',
	};
};

/**
 * Jolly Roger - the classic pirate flag: one solid skull and crossbones held
 * dead centre of the pane.
 *
 * The tile is a percentage of the pane scaled by the size slider, so the
 * emblem stays centred and aspect-true while the slider resizes it;
 * `background-repeat: no-repeat` keeps it single and
 * `background-attachment: fixed` pins it to the window while a long note
 * scrolls.
 */
const jollyRoger: PatternBuilder = (ctx) => {
	const box = 100;
	const pct = Math.round((ctx.size / 24) * 100);
	const { bones, skull, features } = skullEmblem();

	const mask = `<defs><mask id='jolly-roger' maskUnits='userSpaceOnUse' x='0' y='0' width='${box}' height='${box}'>`
		+ `<g fill='#fff'>${bones}<path d='${skull}'/></g>`
		+ `<g fill='#000'>${features}</g>`
		+ `</mask></defs>`;
	const body = `<rect x='0' y='0' width='${box}' height='${box}' fill='${ctx.pFill}' fill-opacity='${ctx.fo(1)}' mask='url(#jolly-roger)'/>`;

	return {
		bgImage: ctx.svgUrl(box, box, body, '', mask),
		bgSize: `${pct}% ${pct}%`,
		bgPosition: 'center',
		bgRepeat: 'no-repeat',
		bgAttachment: 'fixed',
	};
};

/**
 * Yin-yang - one taijitu emblem held dead centre of the pane.
 *
 * Painted as a single theme colour over the page. One evenodd path draws the
 * dark half and punches its own eye out as a hole; the opposite half is left
 * transparent and its eye is painted back in, so both halves and their dots
 * read as a taijitu on any background. The tile is a percentage of the pane
 * scaled by the size slider, so the emblem stays centred and aspect-true while
 * the slider resizes it; `background-repeat: no-repeat` keeps it single and
 * `background-attachment: fixed` pins it to the window while a long note
 * scrolls. The SVG's default `xMidYMid meet` keeps the disc round.
 */
const yinYang: PatternBuilder = (ctx) => {
	const box = 100;
	const pct = Math.round((ctx.size / 24) * 100);
	const r = 48;
	const lobe = r / 2;
	const eye = r / 4;
	const top = 50 - lobe;
	const bottom = 50 + lobe;

	// The dark half: down the left of the disc, then back up the S-curve.
	const half = `M50 ${n(50 - r)}`
		+ `A${r} ${r} 0 0 0 50 ${n(50 + r)}`
		+ `A${lobe} ${lobe} 0 0 1 50 50`
		+ `A${lobe} ${lobe} 0 0 0 50 ${n(50 - r)}Z`;
	// The eye of the dark half, carved out by evenodd.
	const eyeHole = `M50 ${n(top - eye)}`
		+ `A${eye} ${eye} 0 1 0 50 ${n(top + eye)}`
		+ `A${eye} ${eye} 0 1 0 50 ${n(top - eye)}Z`;
	const body = `<path d='${half} ${eyeHole}' fill='${ctx.pFill}' fill-opacity='${ctx.fo(1)}' fill-rule='evenodd'/>`
		+ `<circle cx='50' cy='${bottom}' r='${eye}' fill='${ctx.pFill}' fill-opacity='${ctx.fo(1)}'/>`;

	return {
		bgImage: ctx.svgUrl(box, box, body),
		bgSize: `${pct}% ${pct}%`,
		bgPosition: 'center',
		bgRepeat: 'no-repeat',
		bgAttachment: 'fixed',
	};
};

type Cell = [number, number];

/** The seven tetrominoes in spawn orientation, as [col, row] cells. */
const TETROMINOES: Cell[][] = [
	[[0, 0], [1, 0], [2, 0], [3, 0]], // I
	[[0, 0], [1, 0], [0, 1], [1, 1]], // O
	[[0, 0], [1, 0], [2, 0], [1, 1]], // T
	[[1, 0], [2, 0], [0, 1], [1, 1]], // S
	[[0, 0], [1, 0], [1, 1], [2, 1]], // Z
	[[0, 0], [0, 1], [1, 1], [2, 1]], // J
	[[2, 0], [0, 1], [1, 1], [2, 1]], // L
];

/** Rotate a piece clockwise by quarter turns and re-anchor its cells to (0,0). */
function rotatePiece(cells: Cell[], quarter: number): Cell[] {
	let out = cells;
	for (let i = 0; i < quarter; i++) {
		out = out.map(([x, y]) => [-y, x] as Cell);
	}
	const minX = Math.min(...out.map(([x]) => x));
	const minY = Math.min(...out.map(([, y]) => y));
	return out.map(([x, y]) => [x - minX, y - minY] as Cell);
}

/**
 * Tetris - the seven iconic tetrominoes falling, each clearly on its own.
 *
 * Placed on a 12x12 grid in a staggered cascade - each shape sits lower than
 * the last - so they read as pieces caught at different points of the fall
 * rather than in aligned rows. There is at least one empty cell between any two
 * shapes and a one-cell margin at the tile edge, which keeps them apart even
 * after the tile repeats. Every block is a beveled arcade cube - a
 * theme-coloured face with a light top-left edge and a dark bottom-right edge -
 * and nothing crosses the tile edge, so it tiles cleanly.
 */
const tetris: PatternBuilder = (ctx) => {
	const grid = 12;
	const s = atLeast(200, Math.round(ctx.size * 6));
	const u = s / grid;
	const bevel = u * 0.16;

	// [piece, quarter turns, col, row, shade] - one of each shape, stepped down.
	const placements: [number, number, number, number, number][] = [
		[2, 0, 1, 1, 1],
		[1, 0, 9, 2, 0.85],
		[3, 1, 6, 3, 0.68],
		[5, 0, 2, 5, 0.92],
		[0, 1, 9, 6, 0.6],
		[6, 0, 5, 7, 0.8],
		[4, 0, 1, 9, 0.72],
	];

	const block = (x: number, y: number, w: number, h: number): string =>
		`M${n(x)} ${n(y)}h${n(w)}v${n(h)}h-${n(w)}Z`;

	let faces = '';
	let highlights = '';
	let shadows = '';
	for (const [pi, q, col, row, o] of placements) {
		const piece = TETROMINOES[pi];
		if (!piece) continue;
		let d = '';
		for (const [x, y] of rotatePiece(piece, q)) {
			const px = (col + x) * u;
			const py = (row + y) * u;
			d += block(px, py, u, u);
			highlights += block(px, py, u, bevel) + block(px, py, bevel, u);
			shadows += block(px, py + u - bevel, u, bevel) + block(px + u - bevel, py, bevel, u);
		}
		faces += `<path d='${d}' fill='${ctx.pFill}' fill-opacity='${ctx.fo(o)}'/>`;
	}

	const tint = Math.min(1, ctx.op * 0.45).toFixed(3);
	const shade = `<path d='${shadows}' fill='rgba(0, 0, 0, ${tint})'/>`
		+ `<path d='${highlights}' fill='rgba(255, 255, 255, ${tint})'/>`;

	return {
		bgImage: ctx.svgUrl(s, s, faces + shade),
		bgSize: `${s}px ${s}px`,
		bgPosition: '0 0',
	};
};

export const PLAYFUL_PATTERNS: Record<string, PatternBuilder> = {
	cats,
	confetti,
	'flappy-bird': flappyBird,
	hearts,
	'jolly-roger': jollyRoger,
	'music-notes': musicNotes,
	'paw-prints': pawPrints,
	'skull-crossbones': skullCrossbones,
	'sparkle-stars': sparkleStars,
	tetris,
	'yin-yang': yinYang,
};
