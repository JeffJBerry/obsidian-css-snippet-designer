/**
 * "Digital rain" for the Animated Pattern Style flipbook.
 *
 * The characters never move. They sit on a fixed grid, hold their value for a
 * few frames and then switch, and the falling is entirely carried by the COLOUR
 * - a pale flash with a long, smoothly fading bell behind it sweeps down each
 * column, lifting whatever glyph it passes, and stray glyphs twinkle for a
 * frame or two on the way. No tile slides and no glyphs translate, so the only
 * thing that moves between frames is brightness, which the eye reads as
 * perfectly smooth rain.
 *
 * The trail is deliberately long on both sheets: the film's streams are mostly
 * tail, with only the leading glyph at full brightness.
 *
 * Behind sits a second sheet of rain: the same shape of streak, smaller, a few
 * shades deeper and lightly defocused. Same rain, further back - rather than a
 * board of text filling the gap between the streaks.
 *
 * Paint is derived entirely from the pattern tint: the trail IS that colour,
 * the flash is it mixed toward white, and the far sheet is it scaled down. No
 * background is painted at all - only the letters - so the effect sits on
 * whatever the pane already shows.
 */
import type { PatternBuilder } from './types';
import { atLeast, n, rand } from './util';

/** Rows on the foreground grid. */
export const MATRIX_ROWS = 14;
/** Frames of the sweep; the style requests this many and loops on it. */
export const MATRIX_FRAMES = 22;
/** Columns across the tile, packed in far enough to fill the field. */
const MATRIX_COLS = 6;
/** Columns sit this many glyph-widths apart. */
const COL_PITCH = 2.4;
/** Width of the near fade, in rows. Wide = a long visible tail. */
const FADE = 6.4;
/**
 * How the palette is derived from the chosen tint: the trail IS the tint, the
 * flash is mixed toward white, and the far sheet is that same tint scaled down.
 * One colour selector therefore drives the whole effect, and nothing here is
 * hardcoded - including the background, which is simply not painted.
 */
const FLASH_MIX = 0.55;
const FAR_SHADE = 0.6;
/** How much dimmer the far sheet sits than the near one. */
const BACK_VEIL = 0.95;
/**
 * The far sheet's own grid and streaks. Its fade is set even wider than the
 * near one's, because a distant stream should show more tail, not less.
 */
const BACK_SCALE = 1.5;
const BACK_COLS = 4;
const BACK_FADE = 7;
const BACK_PHASE = [0, 13, 6, 17];
const BACK_TRAIL = [15, 11, 17, 13];
const BACK_DEPTH = [1, 0.85, 1, 0.85];
/**
 * Weighted glyph pool: the five half-width Katakana dominate, the digits come
 * next, and Latin letters and symbols stay sparse so they read as glitches
 * rather than as text.
 */
const POOL = [
	...Array<string>(8).fill('ﾊﾋﾌﾍﾎ'),
	...Array<string>(2).fill('0123456789'),
	'*+=:.<>|',
	'AEHIMRTXZ',
].join('');
/**
 * Per-column start row, tiles the sweep travels per loop, trail length and
 * depth. The starts are spread unevenly and two columns run at double speed, so
 * the streams stagger rather than falling as one wall.
 */
const PHASE = [0, 9, 3, 12, 6, 2];
const TURNS = [1, 1, 2, 1, 1, 2];
const TRAIL = [13, 9, 11, 12, 9, 13];
const DEPTH = [1, 0.82, 1, 0.82, 1, 0.82];
/** Frames a glyph holds its value before switching. */
const GLYPH_HOLD = 5;
/** Frames a sparkle pattern holds before the twinkles move. */
const TWINKLE_HOLD = 3;

/** SVG text content, so the pool's angle brackets do not open a bogus tag. */
function esc(ch: string): string {
	return ch === '<' ? '&lt;' : ch === '>' ? '&gt;' : ch;
}

/** `#rgb`/`#rrggbb` to channels, so shades can be derived from the tint. */
function toRgb(hex: string): [number, number, number] {
	const h = hex.replace('#', '');
	const full = h.length === 3 ? h.split('').map((ch) => ch + ch).join('') : h;
	const v = parseInt(full, 16);
	return Number.isFinite(v) ? [(v >> 16) & 255, (v >> 8) & 255, v & 255] : [0, 255, 65];
}

/** Channels back to a short hex, keeping the emitted markup compact. */
function toHex(r: number, g: number, b: number): string {
	return `#${[r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('')}`;
}

/**
 * The glyph in one cell. It depends only on the "hold" step, never on the
 * sweep, so a character keeps its place on the grid and merely changes value
 * now and then - the film's occasional flicker. `salt` keeps two sheets from
 * drawing the same characters in the same cells.
 */
function glyph(col: number, row: number, hold: number, salt: number): string {
	const gi = (col * 41 + row * 23 + hold * 11 + ((col + salt) * hold) % 5) % POOL.length;
	return esc(POOL[gi] ?? '0');
}

export const matrixRain: PatternBuilder = (ctx) => {
	const f = Math.floor(ctx.frame) % MATRIX_FRAMES;
	// The art is a fixed green on hardcoded black, so it cannot lean on the
	// paint system's `fo()` (which defers to a gradient's stops). Folding the
	// pattern opacity in directly is what makes the Opacity slider bite - for
	// the black backdrop as well as the glyphs.
	const op = Math.max(0.01, Math.min(1, ctx.op));
	const hold = Math.floor(f / GLYPH_HOLD) % Math.ceil(MATRIX_FRAMES / GLYPH_HOLD);
	const twinkle = Math.floor(f / TWINKLE_HOLD) % Math.ceil(MATRIX_FRAMES / TWINKLE_HOLD);
	// A deliberately large tile with a deliberately SMALL glyph: the tile is the
	// repeating unit, so a big one with small, widely spaced text reads as a
	// much larger field that repeats rarely. Scales with the flipbook Size.
	const cell = atLeast(18, ctx.size * 0.6);
	// Rounded so the tile is a whole number of pixels wide: a fractional tile
	// leaves a hairline seam where it repeats.
	const pitch = Math.round(cell * COL_PITCH);
	const w = pitch * MATRIX_COLS;
	const h = cell * MATRIX_ROWS;
	const font = cell * 0.8;
	const group = (fill: string, size: number, content: string, extra = ''): string =>
		`<g font-family='monospace' font-size='${n(size)}' text-anchor='middle' fill='${fill}'${extra}>${content}</g>`;
	// One filter over the whole far sheet, which is what puts it behind.
	const defs = `<defs><filter id='mxblur' x='-20%' y='-20%' width='140%' height='140%'>`
		+ `<feGaussianBlur stdDeviation='${n(Math.max(0.4, cell * 0.022))}'/></filter></defs>`;
	// No backdrop is painted: only the letters are drawn, on transparent black,
	// so the pane shows through and the whole palette follows the tint picker.
	const [cr, cg, cb] = toRgb(ctx.p1);
	const GREEN = ctx.p1;
	const HEAD = toHex(cr + (255 - cr) * FLASH_MIX, cg + (255 - cg) * FLASH_MIX, cb + (255 - cb) * FLASH_MIX);
	const BACK = toHex(cr * FAR_SHADE, cg * FAR_SHADE, cb * FAR_SHADE);
	let body = '';

	// 1. The far sheet: its own streaks, smaller and deeper in tone, drawn first
	// so they sit behind. Same fade, same flash - just further off.
	const backCell = cell / BACK_SCALE;
	const backRows = Math.round(MATRIX_ROWS * BACK_SCALE);
	const backPitch = w / BACK_COLS;
	const backFont = backCell * 0.8;
	let back = '';
	for (let c = 0; c < BACK_COLS; c++) {
		const head = ((BACK_PHASE[c] ?? 0) + backRows * (f / MATRIX_FRAMES)) % backRows;
		const headRow = Math.round(head) % backRows;
		const run = BACK_TRAIL[c] ?? 12;
		const depth = BACK_DEPTH[c] ?? 1;
		for (let row = 0; row < backRows; row++) {
			const open = `<text x='${n(backPitch * (c + 0.5))}' y='${n(backCell * (row + 0.78))}' fill-opacity='`;
			const ch = glyph(c, row, hold, 5);
			const d = (headRow - row + backRows) % backRows;
			if (d === 0) {
				back += `${open}${(op * 0.72 * BACK_VEIL * depth).toFixed(2)}' font-weight='bold'>${ch}</text>`;
			} else if (d < run) {
				const t = ((head - row) % backRows + backRows) % backRows;
				const alpha = depth * 0.62 * Math.exp(-Math.pow(t / BACK_FADE, 2)) * BACK_VEIL;
				back += `${open}${(op * Math.max(0.03, alpha)).toFixed(2)}'>${ch}</text>`;
			}
		}
	}
	body += group(BACK, backFont, back, " filter='url(#mxblur)'");

	// 2. The near sheet, on top. The sweep head leads the drop, so the trail
	// decays UPWARD behind it; a fractional head is what lets brightness slide
	// between whole rows.
	let trail = '';
	let heads = '';
	for (let c = 0; c < MATRIX_COLS; c++) {
		const head = ((PHASE[c] ?? 0) + (TURNS[c] ?? 1) * MATRIX_ROWS * (f / MATRIX_FRAMES)) % MATRIX_ROWS;
		const headRow = Math.round(head) % MATRIX_ROWS;
		const run = TRAIL[c] ?? 11;
		const depth = DEPTH[c] ?? 1;
		for (let row = 0; row < MATRIX_ROWS; row++) {
			const open = `<text x='${n(pitch * c + pitch / 2)}' y='${n(cell * (row + 0.78))}' fill-opacity='`;
			const ch = glyph(c, row, hold, 0);
			// `d` picks the lit rows off the whole-row head, so a column always
			// has its flash; `t` is the true fractional distance, which is what
			// makes every glyph on the way cross-fade instead of jumping.
			const d = (headRow - row + MATRIX_ROWS) % MATRIX_ROWS;
			if (d === 0) {
				heads += `${open}${(op * 0.95 * depth).toFixed(2)}' font-weight='bold'>${ch}</text>`;
			} else if (d < run) {
				const t = ((head - row) % MATRIX_ROWS + MATRIX_ROWS) % MATRIX_ROWS;
				// One smooth bell rather than a core-plus-halo `max()`, whose
				// kink showed up as a step in the trail. Capped just under the
				// head so the flash always stays the brightest glyph.
				const alpha = depth * 0.88 * Math.exp(-Math.pow(t / FADE, 2));
				// Stray glyphs catch the light for a frame or two: the twinkle.
				// Capped under the head so the flash always stays the brightest.
				if (rand(c * 31 + row * 17 + twinkle * 13) > 0.87) {
					heads += `${open}${(op * Math.min(0.78 * depth, alpha * 1.5)).toFixed(2)}' font-weight='bold'>${ch}</text>`;
				} else {
					trail += `${open}${(op * Math.max(0.03, alpha)).toFixed(2)}'>${ch}</text>`;
				}
			} else if ((c * 11 + row * 17) % 19 === 0) {
				trail += `${open}${(op * 0.03).toFixed(2)}'>${ch}</text>`;
			}
		}
	}
	body += group(GREEN, font, trail) + group(HEAD, font, heads);
	return { bgImage: ctx.svgUrl(w, h, body, '', defs), bgSize: `${w}px ${h}px`, bgPosition: '0 0', bgRepeat: 'repeat' };
};
