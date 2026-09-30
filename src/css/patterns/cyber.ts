/**
 * Screens, circuitry and retro-futurist grids.
 */
import type { PatternBuilder } from './types';
import { motherboard } from './motherboard';
import { atLeast, n, rand } from './util';

/** Falling binary rain, with a bright head cell and a decaying trail per column. */
const matrixBinary: PatternBuilder = (ctx) => {
	const colCount = 9;
	const rowCount = 15;
	const colWidth = 20;
	const rowHeight = 18;
	const svgW = colCount * colWidth;
	const svgH = rowCount * rowHeight;
	const headOffsets = [2, 11, 5, 13, 0, 8, 3, 10, 6];
	const trailLengths = [8, 9, 7, 9, 8, 7, 8, 9, 8];
	const op = ctx.op;

	let textElements = '';
	for (let col = 0; col < colCount; col++) {
		const x = col * colWidth + 10;
		const head = headOffsets[col] ?? 0;
		const trailLen = trailLengths[col] ?? 8;
		for (let row = 0; row < rowCount; row++) {
			const y = row * rowHeight + 14;
			const dist = (head - row + rowCount) % rowCount;
			let charOp = 0;
			if (dist === 0) {
				charOp = Math.min(1, op * 0.95);
			} else if (dist < trailLen) {
				charOp = op * Math.max(0.04, 0.85 * Math.pow(0.72, dist));
			} else if ((col * 7 + row * 13) % 5 === 0) {
				charOp = op * 0.08;
			}

			if (charOp > 0.01) {
				const bit = ((col * 17 + row * 31 + (col ^ row)) % 7 > 2) ? '1' : '0';
				const weight = dist === 0 ? " font-weight='bold'" : '';
				textElements += `<text x='${x}' y='${y}' fill-opacity='${charOp.toFixed(3)}'${weight}>${bit}</text>`;
			}
		}
	}

	const style = `<style>text{font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;font-size:11px;text-anchor:middle;fill:${ctx.pFill};}</style>`;
	const sWidth = Math.max(90, Math.round(ctx.size * 4));
	return {
		bgImage: ctx.svgUrl(svgW, svgH, style + textElements),
		bgSize: `${sWidth}px ${Math.round(sWidth * 1.5)}px`,
		bgPosition: '0 0',
	};
};

/** Iconic Matrix code glyphs: half-width & full-width Katakana, numerals, Latin letters, and symbols. */
const MATRIX_GLYPHS = [
	'ｦ', 'ｱ', 'ｳ', 'ｴ', 'ｵ', 'ｶ', 'ｷ', 'ｹ', 'ｺ', 'ｻ', 'ｼ', 'ｽ', 'ｾ', 'ｿ', 'ﾀ', 'ﾂ', 'ﾃ', 'ﾅ', 'ﾆ', 'ﾇ', 'ﾈ', 'ﾊ', 'ﾋ', 'ﾎ', 'ﾏ', 'ﾐ', 'ﾑ', 'ﾒ', 'ﾓ', 'ﾔ', 'ﾕ', 'ﾗ', 'ﾘ', 'ﾜ', 'ﾝ', 'ﾁ', 'ﾄ', 'ﾉ', 'ﾍ', 'ﾖ', 'ﾙ', 'ﾛ',
	'カ', 'テ', 'ネ', 'ポ', 'ワ', 'マ', 'シ', '日',
	'0', '1', '2', '3', '4', '5', '7', '8', '9',
	'A', 'B', 'C', 'D', 'H', 'K', 'M', 'O', 'R', 'T', 'V', 'X', 'Y', 'Z',
	'+', '-', '*', '=', ':', '|', '¦', '╌', '᛬', '∷', '⌽',
];

/**
 * Authentic Matrix Digital Rain cascade.
 *
 * Staggered columns of falling Japanese Katakana, Arabic numerals, Latin
 * letters, and pictorial symbols. A blazing white/mint leading head glyph
 * strikes downwards followed by an exponentially decaying phosphor trail,
 * with horizontally mirrored glyphs matching the film's signature aesthetic.
 */
const matrixRain: PatternBuilder = (ctx) => {
	const colCount = 16;
	const rowCount = 24;
	const colWidth = 18;
	const rowHeight = 20;
	const svgW = colCount * colWidth;
	const svgH = rowCount * rowHeight;
	const headOffsets = [3, 19, 7, 14, 0, 21, 10, 5, 17, 1, 12, 23, 8, 16, 4, 11];
	const trailLengths = [14, 18, 11, 16, 13, 17, 12, 15, 19, 11, 16, 14, 17, 12, 15, 13];

	let textElements = '';
	for (let col = 0; col < colCount; col++) {
		const x = col * colWidth + Math.round(colWidth / 2);
		const head = headOffsets[col] ?? 0;
		const trailLen = trailLengths[col] ?? 14;
		const isForeground = col % 2 === 0;

		for (let row = 0; row < rowCount; row++) {
			const y = row * rowHeight + 15;
			const dist = (head - row + rowCount) % rowCount;

			let decay = 0;
			if (dist === 0) {
				decay = 0.95;
			} else if (dist < trailLen) {
				decay = Math.max(0.18, 0.88 * Math.pow(0.92, dist) * (isForeground ? 1 : 0.82));
			} else if ((col * 11 + row * 17) % 7 === 0) {
				decay = 0.08;
			}

			if (decay >= 0.02) {
				const glyphIdx = (col * 37 + row * 41 + dist * 13 + (col ^ row)) % MATRIX_GLYPHS.length;
				const glyph = MATRIX_GLYPHS[glyphIdx] ?? '0';
				const isMirrored = (col * 19 + row * 23) % 5 === 0;
				const xPos = isMirrored ? -x : x;
				const mirrorAttr = isMirrored ? " transform='scale(-1, 1)'" : '';

				if (dist === 0) {
					textElements += `<text x='${xPos}' y='${y}' fill-opacity='${ctx.fo(0.95)}' font-weight='bold'${mirrorAttr}>${glyph}</text>`;
				} else {
					textElements += `<text x='${xPos}' y='${y}' fill-opacity='${ctx.fo(decay)}'${mirrorAttr}>${glyph}</text>`;
				}
			}
		}
	}

	const style = `<style>text{font-family:'MS Gothic','Yu Gothic','Hiragino Kaku Gothic ProN',Meiryo,ui-monospace,SFMono-Regular,Consolas,monospace;font-size:12px;text-anchor:middle;fill:${ctx.pFill};}</style>`;
	const sWidth = Math.max(140, Math.round(ctx.size * 6));
	const sHeight = Math.round((sWidth * svgH) / svgW);
	return {
		bgImage: ctx.svgUrl(svgW, svgH, style + textElements),
		bgSize: `${sWidth}px ${sHeight}px`,
		bgPosition: '0 0',
	};
};

/**
 * Synthwave horizon: a perspective floor grid under a slitted sun.
 *
 * Rows are spaced quadratically toward the vanishing point and the sun's bands
 * widen as they fall, which is what sells the depth at a single 100% x 100%
 * paint rather than an actual 3D transform.
 */
const synthwaveGrid: PatternBuilder = (ctx) => {
	const w = 400;
	const h = 300;
	const horizon = 150;
	let floor = '';
	for (let x = -400; x <= 800; x += 50) {
		floor += `M200 ${horizon}L${x} ${h}`;
	}
	for (let i = 1; i <= 9; i++) {
		const y = horizon + (h - horizon) * Math.pow(i / 9, 2.1);
		floor += `M0 ${n(y)}H${w}`;
	}
	let sun = '';
	for (let i = 0; i < 7; i++) {
		const y = 74 + i * 12;
		const band = 3 + i * 1.4;
		sun += `<rect x='130' y='${n(y)}' width='140' height='${n(band)}'/>`;
	}
	const body = `<defs><clipPath id='sun'><circle cx='200' cy='104' r='60'/></clipPath></defs>`
		+ `<circle cx='200' cy='104' r='60' fill='${ctx.pFill}' fill-opacity='${ctx.fo(0.22)}'/>`
		+ `<g clip-path='url(#sun)' fill='${ctx.pFill}' fill-opacity='${ctx.fo(0.9)}'><rect x='130' y='40' width='140' height='34'/>${sun}</g>`
		+ `<path d='M0 ${horizon}H${w}' fill='none' stroke='${ctx.pStroke}' stroke-opacity='${ctx.fo(1)}' stroke-width='2'/>`
		+ `<path d='${floor}' fill='none' stroke='${ctx.pStroke}' stroke-opacity='${ctx.fo(0.65)}' stroke-width='1.2'/>`;
	return {
		bgImage: ctx.svgUrl(w, h, body, `preserveAspectRatio='none'`),
		bgSize: '100% 100%',
		bgAttachment: 'fixed',
	};
};

/** CRT scanlines - a bright raster line over a fainter trailing one. */
const crtScanlines: PatternBuilder = (ctx) => {
	const h = Math.max(3, Math.round(ctx.size / 5));
	const bar = Math.max(0.8, h * 0.32);
	const body = `<rect width='100' height='${n(bar)}' fill='${ctx.pFill}' fill-opacity='${ctx.fo(1)}'/>`
		+ `<rect y='${n(bar)}' width='100' height='${n(bar * 0.6)}' fill='${ctx.pFill}' fill-opacity='${ctx.fo(0.35)}'/>`;
	return {
		bgImage: ctx.svgUrl(100, h, body, `preserveAspectRatio='none'`),
		bgSize: `100% ${h}px`,
		bgPosition: '0 0',
	};
};

/** Audio waveform - mirrored bars with rounded caps. */
const waveformBars: PatternBuilder = (ctx) => {
	const bars = 18;
	const barW = 4;
	const gap = 4;
	const w = bars * (barW + gap);
	const h = 80;
	let body = '';
	for (let i = 0; i < bars; i++) {
		const amp = 0.14 + 0.86 * Math.abs(Math.sin(i * 0.9) * 0.6 + Math.sin(i * 2.3) * 0.4);
		const len = (h * 0.86) * amp;
		const x = i * (barW + gap) + gap / 2;
		body += `<rect x='${n(x)}' y='${n((h - len) / 2)}' width='${barW}' height='${n(len)}' rx='${barW / 2}'`
			+ ` fill='${ctx.pFill}' fill-opacity='${ctx.fo(0.45 + 0.55 * amp)}'/>`;
	}
	body += `<rect y='${h / 2 - 0.4}' width='${w}' height='0.8' fill='${ctx.pFill}' fill-opacity='${ctx.fo(0.3)}'/>`;
	const tw = atLeast(120, ctx.size * 6);
	return {
		bgImage: ctx.svgUrl(w, h, body),
		bgSize: `${tw}px ${Math.round((tw * h) / w)}px`,
		bgPosition: '0 0',
	};
};

/** Pixel static - a deterministic dither field of lit cells. */
const pixelStatic: PatternBuilder = (ctx) => {
	const cells = 12;
	const cell = 4;
	const s = cells * cell;
	let body = '';
	for (let y = 0; y < cells; y++) {
		for (let x = 0; x < cells; x++) {
			const v = rand(y * cells + x + 1);
			if (v < 0.55) continue;
			const level = v > 0.9 ? 1 : v > 0.76 ? 0.55 : 0.25;
			body += `<rect x='${x * cell}' y='${y * cell}' width='${cell}' height='${cell}' fill-opacity='${ctx.fo(level)}'/>`;
		}
	}
	const tw = atLeast(48, ctx.size * 2);
	return {
		bgImage: ctx.svgUrl(s, s, `<g fill='${ctx.pFill}'>${body}</g>`),
		bgSize: `${tw}px ${tw}px`,
		bgPosition: '0 0',
	};
};

/**
 * Circuit traces - clean, thin PCB traces, surface-mount components, and vias
 * routed with 45-degree chamfers.
 *
 * Edge ports align across opposing boundaries (x=0 <-> x=96 and y=0 <-> y=96)
 * so the tile repeats seamlessly without seam cuts or clipping artifacts.
 */
const circuitTraces: PatternBuilder = (ctx) => {
	const s = 96;

	// Helper for routing traces
	const trace = (d: string, width: number, opacity: number): string =>
		`<path d='${d}' fill='none' stroke='${ctx.pStroke}' stroke-opacity='${ctx.fo(opacity)}' stroke-width='${n(width)}' stroke-linecap='round' stroke-linejoin='round'/>`;

	// Circular via with annular ring and center hole
	const via = (x: number, y: number): string =>
		`<circle cx='${x}' cy='${y}' r='1.6' fill='none' stroke='${ctx.pStroke}' stroke-opacity='${ctx.fo(0.85)}' stroke-width='0.7'/>`
		+ `<circle cx='${x}' cy='${y}' r='0.6' fill='${ctx.pFill}' fill-opacity='${ctx.fo(0.95)}'/>`;

	// Surface mount 2-pad component (e.g. 0402 resistor or capacitor)
	const smd = (cx: number, cy: number, horizontal: boolean): string => {
		if (horizontal) {
			return `<rect x='${cx - 2.2}' y='${cy - 1.2}' width='1.8' height='2.4' rx='0.4' fill='${ctx.pFill}' fill-opacity='${ctx.fo(0.7)}'/>`
				+ `<rect x='${cx + 0.4}' y='${cy - 1.2}' width='1.8' height='2.4' rx='0.4' fill='${ctx.pFill}' fill-opacity='${ctx.fo(0.7)}'/>`;
		}
		return `<rect x='${cx - 1.2}' y='${cy - 2.2}' width='2.4' height='1.8' rx='0.4' fill='${ctx.pFill}' fill-opacity='${ctx.fo(0.7)}'/>`
			+ `<rect x='${cx - 1.2}' y='${cy + 0.4}' width='2.4' height='1.8' rx='0.4' fill='${ctx.pFill}' fill-opacity='${ctx.fo(0.7)}'/>`;
	};

	// Primary (top copper) signal traces (thinner: 0.85px)
	// Every boundary edge has matching coordinate entries and exits:
	//   Left x=0: y in {12, 32, 52, 72, 88} <-> Right x=96: y in {12, 32, 52, 72, 88}
	//   Top y=0:  x in {12, 32, 52, 72, 88} <-> Bottom y=96: x in {12, 32, 52, 72, 88}
	const primaryTraces = [
		// Top bus: connects (0, 12) to (96, 12)
		'M0 12H24L32 20H44L52 12H96',
		// Upper-left feed to chip
		'M0 32H16L24 24H32L38 30V38.5',
		// Upper-right feed to chip
		'M52 38.5V30L58 24H68L76 32H96',
		// Top vertical entries
		'M12 0V16L18 22V36',
		'M32 0V14L26 20H20',
		'M52 0V10L48 14V38.5',
		'M72 0V14L78 20H84',
		'M88 0V24L80 32V42',
		// Mid horizontal feeds
		'M0 52H16L22 46H34L38.5 48',
		'M57.5 48H62L68 44H80L86 52H96',
		// Mid vertical lines
		'M18 50V60L12 66V76',
		'M80 54V64L86 70V82',
		// Lower horizontal feeds
		'M0 72H16L24 64H34L38.5 53.5',
		'M57.5 53.5L62 58H72L78 64H96',
		// Chip bottom pin feeds
		'M44.2 57.5V66L38 72H28',
		'M48 57.5V74L54 80H66',
		'M51.8 57.5V64L58 70H70',
		// Bottom bus: connects (0, 88) to (96, 88)
		'M0 88H24L32 80H44L52 88H96',
		// Bottom vertical exits
		'M12 76V96',
		'M32 80V96',
		'M52 80V96',
		'M72 80V96',
		'M88 72V96',
	].join('');

	// Secondary (bottom copper) plane - internal routes connecting vias
	const secondaryTraces = [
		'M20 20V26L26 32H34',
		'M62 26V34L68 40H76',
		'M22 66H30L36 72V80',
		'M60 66H68L74 72V80',
		'M48 22H56L62 28',
		'M34 68H44L48 72',
		'M18 36H24L30 42',
		'M84 20V28L78 34',
	].join('');

	// Central microchip (clean QFN package)
	const chip = `<rect x='41' y='41' width='14' height='14' rx='1.8' fill='${ctx.pFill}' fill-opacity='${ctx.fo(0.12)}' stroke='${ctx.pStroke}' stroke-opacity='${ctx.fo(0.85)}' stroke-width='0.8'/>`
		+ `<circle cx='44' cy='44' r='0.8' fill='${ctx.pFill}' fill-opacity='${ctx.fo(0.9)}'/>`
		+ `<rect x='44' y='44' width='8' height='8' rx='0.8' fill='${ctx.pFill}' fill-opacity='${ctx.fo(0.2)}'/>`;

	// Chip pins
	const chipPins = [
		`<rect x='43.5' y='38.5' width='1.4' height='2.5' rx='0.3'/>`,
		`<rect x='47.3' y='38.5' width='1.4' height='2.5' rx='0.3'/>`,
		`<rect x='51.1' y='38.5' width='1.4' height='2.5' rx='0.3'/>`,
		`<rect x='43.5' y='55' width='1.4' height='2.5' rx='0.3'/>`,
		`<rect x='47.3' y='55' width='1.4' height='2.5' rx='0.3'/>`,
		`<rect x='51.1' y='55' width='1.4' height='2.5' rx='0.3'/>`,
		`<rect x='38.5' y='43.5' width='2.5' height='1.4' rx='0.3'/>`,
		`<rect x='38.5' y='47.3' width='2.5' height='1.4' rx='0.3'/>`,
		`<rect x='38.5' y='51.1' width='2.5' height='1.4' rx='0.3'/>`,
		`<rect x='55' y='43.5' width='2.5' height='1.4' rx='0.3'/>`,
		`<rect x='55' y='47.3' width='2.5' height='1.4' rx='0.3'/>`,
		`<rect x='55' y='51.1' width='2.5' height='1.4' rx='0.3'/>`,
	].join('');
	const pinsGroup = `<g fill='${ctx.pFill}' fill-opacity='${ctx.fo(0.75)}'>${chipPins}</g>`;

	// Vias at trace junctions
	const viaList: [number, number][] = [
		[20, 20], [34, 32], [62, 26], [76, 40],
		[22, 66], [36, 80], [60, 66], [74, 80],
		[48, 22], [62, 28], [28, 72], [70, 70],
		[18, 36], [80, 42], [84, 20], [86, 70],
		[44, 20], [52, 12],
	];
	let vias = '';
	for (const [vx, vy] of viaList) {
		vias += via(vx, vy);
	}

	// SMD discrete components
	const components = smd(28, 12, true)
		+ smd(68, 12, true)
		+ smd(28, 88, true)
		+ smd(68, 88, true)
		+ smd(18, 55, false)
		+ smd(80, 59, false);

	const body = trace(secondaryTraces, 0.65, 0.35)
		+ trace(primaryTraces, 0.85, 0.85)
		+ chip
		+ pinsGroup
		+ components
		+ vias;

	const tw = atLeast(64, Math.round(ctx.size * 4));
	return {
		bgImage: ctx.svgUrl(s, s, body),
		bgSize: `${tw}px ${tw}px`,
		bgPosition: '0 0',
	};
};

/**
 * Hacker terminal - authentic programming text, exploit commands, memory dumps,
 * and nested shell routines cascading down a cyber workstation screen.
 */
interface HackerTerminalLine {
	text: string;
	op: number;
	indent?: number;
	bold?: boolean;
}

const HACKER_TERMINAL_LINES: HackerTerminalLine[] = [
	{ text: 'root@kali:~# cat << "EOF" > /tmp/payload.c', op: 0.95, indent: 0, bold: true },
	{ text: '#include <sys/mman.h>', op: 0.65, indent: 0 },
	{ text: 'struct target_frame {', op: 0.75, indent: 0 },
	{ text: 'uint64_t canary; // 0xdeadbeefc001cafe', op: 0.65, indent: 1 },
	{ text: 'uint64_t saved_rbp;', op: 0.6, indent: 1 },
	{ text: 'uint64_t ret_addr; // RIP overwrite', op: 0.7, indent: 1 },
	{ text: '};', op: 0.75, indent: 0 },
	{ text: 'int inject(void *addr, size_t len) {', op: 0.8, indent: 0 },
	{ text: 'void *rwx = mmap(0, 4096, 7, 34, -1, 0);', op: 0.8, indent: 1 },
	{ text: 'if (mprotect(addr, len, 7) != 0) {', op: 0.75, indent: 1 },
	{ text: 'perror("[-] mprotect failure");', op: 0.5, indent: 2 },
	{ text: 'return -1;', op: 0.5, indent: 2 },
	{ text: '}', op: 0.75, indent: 1 },
	{ text: 'for (size_t i = 0; i < len; i += 8) {', op: 0.75, indent: 1 },
	{ text: '*(uint64_t *)((uint8_t *)rwx + i) = 0x9090909090909090;', op: 0.65, indent: 2 },
	{ text: '}', op: 0.75, indent: 1 },
	{ text: 'memcpy(rwx, "\\x31\\xc0\\x48\\xbb...\\x50", 28);', op: 0.75, indent: 1 },
	{ text: 'return ((int (*)(void))rwx)();', op: 0.7, indent: 1 },
	{ text: '}', op: 0.8, indent: 0 },
	{ text: '❯ ./exploit --target kernel --bypass-kaslr --leak', op: 0.95, indent: 0, bold: true },
	{ text: '[*] KASLR base: 0xffffffff81000000 | canary: 0xdeadbeefc001cafe', op: 0.65, indent: 1 },
	{ text: '[+] Constructing ROP execution chain:', op: 0.8, indent: 1 },
	{ text: '|-- [0x00] pop rdi; ret (0xffffffff8105c312)', op: 0.55, indent: 2 },
	{ text: '|-- [0x08] prepare_kernel_cred(0) -> root creds', op: 0.55, indent: 2 },
	{ text: '\\-- [0x10] commit_creds() -> sys_execve("/bin/sh")', op: 0.65, indent: 2 },
	{ text: '[+] Injecting shellcode payload into target PID...', op: 0.85, indent: 1 },
	{ text: '[SUCCESS] OVERFLOW TRIGGERED: UID=0(root) GID=0(root)', op: 0.95, indent: 1, bold: true },
	{ text: 'root@pwned:~# echo "ACCESS GRANTED" > /dev/pts/0', op: 0.95, indent: 0, bold: true },
	{ text: 'flag{h4ck_th3_pl4n3t_z3r0_d4y_sh3ll}█', op: 1.0, indent: 0, bold: true },
];

const hacker: PatternBuilder = (ctx) => {
	const svgW = 680;
	const lineHeight = 18;
	const rowCount = HACKER_TERMINAL_LINES.length;
	const svgH = rowCount * lineHeight;

	let textElements = '';
	for (let i = 0; i < rowCount; i++) {
		const item = HACKER_TERMINAL_LINES[i];
		if (!item) continue;
		const indentPx = (item.indent ?? 0) * 22;
		const x = 16 + indentPx;
		const y = i * lineHeight + 14;
		const escaped = item.text
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;');
		const weight = item.bold ? " font-weight='bold'" : '';
		textElements += `<text x='${x}' y='${y}' fill-opacity='${ctx.fo(item.op)}'${weight}>${escaped}</text>`;
	}

	const style = `<style>text{font-family:'JetBrains Mono','Fira Code','Cascadia Code',ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;font-size:11.5px;letter-spacing:1.2px;white-space:pre;fill:${ctx.pFill};}</style>`;
	const sWidth = Math.max(340, Math.round(ctx.size * 18));
	const sHeight = Math.round((sWidth * svgH) / svgW);
	return {
		bgImage: ctx.svgUrl(svgW, svgH, style + textElements),
		bgSize: `${sWidth}px ${sHeight}px`,
		bgPosition: '0 0',
	};
};

/**
 * Frutiger Aero - the iconic mid-2000s glossy aqua tech aesthetic.
 *
 * Blended seamless design featuring multi-stop radial and linear aero gradients,
 * sweeping aerodynamic aurora ribbons with C1 horizontal tangents, vertical
 * boundary wave weaves for seamless 2D tiling, soft liquid bokeh orbs with
 * ambient glowing halos and specular highlights, and integrated eco-tendril streamlines.
 */
const frutigerAero: PatternBuilder = (ctx) => {
	const w = atLeast(160, ctx.size * 5);
	const h = Math.round(w * 0.75);

	// Palette resolution with full gradient and dark/light support
	const isDefaultColor = ctx.pStroke === '#00ff9d' || ctx.pStroke === '#059669';
	const color1 = isDefaultColor ? (ctx.isDark ? '#38bdf8' : '#0284c7') : ctx.p1;
	const color2 = isDefaultColor ? (ctx.isDark ? '#34d399' : '#059669') : ctx.p2;
	const glowColor = isDefaultColor ? (ctx.isDark ? '#7dd3fc' : '#38bdf8') : ctx.p1;

	// Blended SVG defs: radial glass orbs, ambient liquid halos, and flowing ribbon gradients
	const defs = `<defs>`
		+ `<radialGradient id='fa-orb' cx='35%' cy='35%' r='65%'>`
		+ `<stop offset='0%' stop-color='#ffffff' stop-opacity='${ctx.fo(0.85)}'/>`
		+ `<stop offset='25%' stop-color='${glowColor}' stop-opacity='${ctx.fo(0.45)}'/>`
		+ `<stop offset='70%' stop-color='${color1}' stop-opacity='${ctx.fo(0.18)}'/>`
		+ `<stop offset='100%' stop-color='${color1}' stop-opacity='${ctx.fo(0.04)}'/>`
		+ `</radialGradient>`
		+ `<radialGradient id='fa-halo' cx='50%' cy='50%' r='50%'>`
		+ `<stop offset='0%' stop-color='${glowColor}' stop-opacity='${ctx.fo(0.20)}'/>`
		+ `<stop offset='60%' stop-color='${color1}' stop-opacity='${ctx.fo(0.06)}'/>`
		+ `<stop offset='100%' stop-color='${color1}' stop-opacity='0'/>`
		+ `</radialGradient>`
		+ `<linearGradient id='fa-ribbon' x1='0%' y1='0%' x2='100%' y2='100%'>`
		+ `<stop offset='0%' stop-color='${color1}' stop-opacity='${ctx.fo(0.15)}'/>`
		+ `<stop offset='50%' stop-color='${color2}' stop-opacity='${ctx.fo(0.12)}'/>`
		+ `<stop offset='100%' stop-color='${color1}' stop-opacity='${ctx.fo(0.15)}'/>`
		+ `</linearGradient>`
		+ `</defs>`;

	// --- 1. Primary Sweeping Aurora Ribbon (Continuous in X) ---
	const yA = h * 0.38;
	const dx = w * 0.22;

	const topA = `M0 ${n(yA)}`
		+ `C${n(dx)} ${n(yA - h * 0.18)} ${n(w * 0.40)} ${n(h * 0.12)} ${n(w * 0.58)} ${n(h * 0.32)}`
		+ `C${n(w * 0.72)} ${n(h * 0.48)} ${n(w - dx)} ${n(yA + h * 0.12)} ${w} ${n(yA)}`;

	const bottomA = `L${w} ${n(yA + h * 0.14)}`
		+ `C${n(w - dx)} ${n(yA + h * 0.24)} ${n(w * 0.72)} ${n(h * 0.62)} ${n(w * 0.58)} ${n(h * 0.46)}`
		+ `C${n(w * 0.40)} ${n(h * 0.26)} ${n(dx)} ${n(yA - h * 0.04)} 0 ${n(yA + h * 0.14)}Z`;

	// --- 2. Secondary Harmonic Counter-Ribbon ---
	const yB = h * 0.68;
	const topB = `M0 ${n(yB)}`
		+ `C${n(dx)} ${n(yB + h * 0.14)} ${n(w * 0.35)} ${n(h * 0.88)} ${n(w * 0.52)} ${n(h * 0.72)}`
		+ `C${n(w * 0.68)} ${n(h * 0.56)} ${n(w - dx)} ${n(yB - h * 0.10)} ${w} ${n(yB)}`;

	const bottomB = `L${w} ${n(yB + h * 0.12)}`
		+ `C${n(w - dx)} ${n(yB + h * 0.02)} ${n(w * 0.68)} ${n(h * 0.68)} ${n(w * 0.52)} ${n(h * 0.84)}`
		+ `C${n(w * 0.35)} ${n(h * 0.98)} ${n(dx)} ${n(yB + h * 0.24)} 0 ${n(yB + h * 0.12)}Z`;

	// --- 3. Vertical Seam Weaves (Seamless Y repeat across boundaries) ---
	const waveY_bottom = `M${n(w * 0.20)} ${h}`
		+ `C${n(w * 0.35)} ${n(h - h * 0.12)} ${n(w * 0.50)} ${n(h - h * 0.10)} ${n(w * 0.65)} ${h}`;
	const waveY_top = `M${n(w * 0.20)} 0`
		+ `C${n(w * 0.35)} ${n(h * 0.12)} ${n(w * 0.50)} ${n(h * 0.10)} ${n(w * 0.65)} 0`;

	// Ribbon fills and highlight strokes
	const ribbons = `<path d='${topA}${bottomA}' fill='url(#fa-ribbon)'/>`
		+ `<path d='${topB}${bottomB}' fill='url(#fa-ribbon)'/>`
		+ `<path d='${topA}' fill='none' stroke='${glowColor}' stroke-opacity='${ctx.fo(0.42)}' stroke-width='${n(Math.max(1.2, w * 0.012))}'/>`
		+ `<path d='${topB}' fill='none' stroke='${glowColor}' stroke-opacity='${ctx.fo(0.35)}' stroke-width='${n(Math.max(1.0, w * 0.010))}'/>`
		+ `<path d='${waveY_bottom}${waveY_top}' fill='none' stroke='${color1}' stroke-opacity='${ctx.fo(0.22)}' stroke-width='${n(Math.max(1.0, w * 0.010))}'/>`;

	// Diffuse atmospheric glow underlays along wave crests
	const glows = `<path d='${topA}' fill='none' stroke='${color1}' stroke-opacity='${ctx.fo(0.10)}' stroke-width='${n(Math.max(12, w * 0.07))}' stroke-linecap='round'/>`
		+ `<path d='${topB}' fill='none' stroke='${color1}' stroke-opacity='${ctx.fo(0.08)}' stroke-width='${n(Math.max(8, w * 0.05))}' stroke-linecap='round'/>`;

	// --- 4. Soft Liquid Bokeh Orbs ---
	const liquidOrb = (cx: number, cy: number, r: number): string => {
		const haloR = n(r * 1.6);
		return `<circle cx='${n(cx)}' cy='${n(cy)}' r='${haloR}' fill='url(#fa-halo)'/>`
			+ `<circle cx='${n(cx)}' cy='${n(cy)}' r='${n(r)}' fill='url(#fa-orb)' stroke='${glowColor}' stroke-opacity='${ctx.fo(0.4)}' stroke-width='0.75'/>`
			+ `<ellipse cx='${n(cx - r * 0.32)}' cy='${n(cy - r * 0.32)}' rx='${n(r * 0.35)}' ry='${n(r * 0.20)}' transform='rotate(-30 ${n(cx - r * 0.32)} ${n(cy - r * 0.32)})' fill='#ffffff' fill-opacity='${ctx.fo(0.65)}'/>`;
	};

	const orbs = liquidOrb(w * 0.28, h * 0.44, w * 0.075)
		+ liquidOrb(w * 0.72, h * 0.38, w * 0.055)
		+ liquidOrb(w * 0.48, h * 0.74, w * 0.060)
		+ liquidOrb(w * 0.14, h * 0.70, w * 0.038)
		+ liquidOrb(w * 0.88, h * 0.68, w * 0.035)
		+ liquidOrb(w * 0.42, h * 0.18, w * 0.032);

	// --- 5. Integrated Eco-Tendril Streamlines ---
	const tendril = (x: number, y: number, scale: number, rot: number): string =>
		`<g transform='translate(${n(x)} ${n(y)}) rotate(${rot}) scale(${n(scale)})'>`
		+ `<path d='M0 0 C-6 -8 -4 -20 4 -28 C12 -20 14 -8 0 0' fill='${color2}' fill-opacity='${ctx.fo(0.28)}' stroke='${color2}' stroke-opacity='${ctx.fo(0.55)}' stroke-width='1.2'/>`
		+ `<path d='M0 0 C0 -8 2 -18 4 -28' fill='none' stroke='#ffffff' stroke-opacity='${ctx.fo(0.45)}' stroke-width='0.8'/>`
		+ `<path d='M-2 -6 C-10 -12 -8 -22 -1 -26 C4 -20 5 -10 -2 -6' fill='${color2}' fill-opacity='${ctx.fo(0.20)}' stroke='${color2}' stroke-opacity='${ctx.fo(0.45)}' stroke-width='1.0'/>`
		+ `</g>`;

	const ecoLeaves = tendril(w * 0.56, h * 0.54, w * 0.0055, 38)
		+ tendril(w * 0.82, h * 0.26, w * 0.0042, -24);

	// --- 6. Soft Optical Star Glints ---
	const sparkle = (x: number, y: number, s: number): string =>
		`<path d='M${n(x)} ${n(y - s)} Q${n(x)} ${n(y)} ${n(x + s)} ${n(y)} Q${n(x)} ${n(y)} ${n(x)} ${n(y + s)} Q${n(x)} ${n(y)} ${n(x - s)} ${n(y)} Q${n(x)} ${n(y)} ${n(x)} ${n(y - s)}Z' fill='#ffffff' fill-opacity='${ctx.fo(0.85)}'/>`;

	const glints = sparkle(w * 0.26, h * 0.41, 4.5)
		+ sparkle(w * 0.58, h * 0.32, 3.5)
		+ sparkle(w * 0.70, h * 0.35, 3.0);

	const body = glows + ribbons + orbs + ecoLeaves + glints;

	return {
		bgImage: ctx.svgUrl(w, h, body, '', defs),
		bgSize: `${w}px ${h}px`,
		bgPosition: '0 0',
	};
};

export const CYBER_PATTERNS: Record<string, PatternBuilder> = {
	'circuit-traces': circuitTraces,
	'crt-scanlines': crtScanlines,
	'frutiger-aero': frutigerAero,
	hacker,
	'matrix-binary': matrixBinary,
	'matrix-rain': matrixRain,
	motherboard,
	'pixel-static': pixelStatic,
	'synthwave-grid': synthwaveGrid,
	'waveform-bars': waveformBars,
};
