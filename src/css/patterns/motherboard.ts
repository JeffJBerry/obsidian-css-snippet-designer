/**
 * The PCB motherboard tile.
 *
 * A single hand-tuned board layout: processor socket, chipset, VRM chokes,
 * memory slots, expansion slots, mounting holes and a CMOS battery, stitched
 * together by routed bus traces and vias. The artwork is drawn once into a
 * `<defs>` group and instanced at all nine neighbouring tile offsets, so any
 * run that reaches an edge gets its missing half from the adjacent tile and the
 * repeat stays seamless without matching every trace to a boundary by hand.
 *
 * Each depth is emitted as one `<path>` with many subpaths. A lone horizontal
 * or vertical run has a degenerate bounding box and would drop out of an
 * `objectBoundingBox` gradient, so each group mixes orientations to keep the
 * combined box two-dimensional.
 */
import type { PatternBuilder } from './types';
import { n } from './util';

export const motherboard: PatternBuilder = (ctx) => {
	const s = 160;

	const trace = (d: string, width: number, opacity: number): string =>
		`<path d='${d}' fill='none' stroke='${ctx.pStroke}' stroke-opacity='${ctx.fo(opacity)}' stroke-width='${n(width)}' stroke-linecap='round' stroke-linejoin='round'/>`;

	const via = (x: number, y: number, r: number, o: number): string =>
		`<circle cx='${n(x)}' cy='${n(y)}' r='${n(r)}' fill='none' stroke='${ctx.pStroke}' stroke-opacity='${ctx.fo(o)}' stroke-width='1'/>`
		+ `<circle cx='${n(x)}' cy='${n(y)}' r='${n(r * 0.4)}' fill='${ctx.pFill}' fill-opacity='${ctx.fo(o)}' stroke='none'/>`;

	const cap = (x: number, y: number, r: number): string =>
		`<circle cx='${n(x)}' cy='${n(y)}' r='${n(r)}' fill='${ctx.pFill}' fill-opacity='${ctx.fo(0.16)}' stroke='${ctx.pStroke}' stroke-opacity='${ctx.fo(0.85)}' stroke-width='0.9'/>`
		+ `<path d='M${n(x - r * 0.55)} ${n(y)}H${n(x + r * 0.55)}M${n(x)} ${n(y - r * 0.55)}V${n(y + r * 0.55)}' stroke='${ctx.pStroke}' stroke-opacity='${ctx.fo(0.7)}' stroke-width='0.8'/>`;

	const choke = (x: number): string =>
		`<rect x='${n(x - 6)}' y='6' width='12' height='12' rx='2' fill='${ctx.pFill}' fill-opacity='${ctx.fo(0.12)}' stroke='${ctx.pStroke}' stroke-opacity='${ctx.fo(0.8)}' stroke-width='1'/>`
		+ `<circle cx='${n(x)}' cy='12' r='3.4' fill='none' stroke='${ctx.pStroke}' stroke-opacity='${ctx.fo(0.9)}' stroke-width='1.1'/>`;

	const ramSlot = (x: number): string =>
		`<rect x='${n(x)}' y='30' width='9' height='110' rx='1.5' fill='${ctx.pFill}' fill-opacity='${ctx.fo(0.1)}' stroke='${ctx.pStroke}' stroke-opacity='${ctx.fo(0.85)}' stroke-width='1'/>`
		+ `<rect x='${n(x + 2.5)}' y='36' width='4' height='98' fill='${ctx.pFill}' fill-opacity='${ctx.fo(0.18)}' stroke='none'/>`
		+ `<rect x='${n(x - 2)}' y='26' width='13' height='5' rx='1' fill='${ctx.pFill}' fill-opacity='${ctx.fo(0.25)}' stroke='${ctx.pStroke}' stroke-opacity='${ctx.fo(0.7)}' stroke-width='0.8'/>`
		+ `<rect x='${n(x - 2)}' y='139' width='13' height='5' rx='1' fill='${ctx.pFill}' fill-opacity='${ctx.fo(0.25)}' stroke='${ctx.pStroke}' stroke-opacity='${ctx.fo(0.7)}' stroke-width='0.8'/>`;

	const pcie = (y: number, x1: number): string =>
		`<rect x='16' y='${n(y)}' width='${n(x1 - 16)}' height='7' rx='1.5' fill='${ctx.pFill}' fill-opacity='${ctx.fo(0.1)}' stroke='${ctx.pStroke}' stroke-opacity='${ctx.fo(0.85)}' stroke-width='1'/>`
		+ `<rect x='20' y='${n(y + 2.2)}' width='${n(x1 - 24)}' height='2.6' fill='${ctx.pFill}' fill-opacity='${ctx.fo(0.18)}' stroke='none'/>`;

	let art = '';

	// --- Traces, drawn first so the components sit on top of them. ---

	// Faint back plane: fine fill across the whole board.
	let faint = '';
	for (let i = 0; i < 8; i++) {
		const y = 18 + i * 18;
		faint += `M0 ${y}H22L34 ${y + 12}H58`;
	}
	for (let i = 0; i < 7; i++) {
		const x = 22 + i * 20;
		faint += `M${x} 0V14L${x + 12} 26V44`;
	}
	faint += 'M0 64H12L24 76V104M0 96H8L20 108M148 64H160M150 100H160';
	art += trace(faint, 0.7, 0.32);

	// Mid plane: local routing around the socket and the memory channel.
	let mid = '';
	for (let i = 0; i < 5; i++) {
		const y = 58 + i * 8;
		mid += `M50 ${y}H38L28 ${y - 10}`;
	}
	for (let i = 0; i < 4; i++) {
		const x = 62 + i * 12;
		mid += `M${x} 50V28`;
	}
	for (let i = 0; i < 4; i++) {
		const x = 114 + i * 2.6;
		mid += `M${x} 40V150`;
	}
	for (let i = 0; i < 3; i++) {
		const y = 128 + i * 4;
		mid += `M104 ${y}H160`;
	}
	mid += 'M140 30H152L160 22M140 44H150L158 36';
	art += trace(mid, 1.0, 0.55);

	// Main plane: pronounced buses from the socket to memory, chipset and slots.
	let main = '';
	for (let i = 0; i < 6; i++) {
		const y = 60 + i * 8;
		main += `M110 ${y}H118L126 ${y + 7}`;
	}
	for (let i = 0; i < 5; i++) {
		const x = 56 + i * 9;
		main += `M${x} 50V42L46 42`;
	}
	main += 'M46 26H58V18M46 34H64V18';
	for (let i = 0; i < 4; i++) {
		const y = 114 + i * 2.5;
		main += `M20 ${y}H140`;
	}
	main += 'M18 46V96L10 104V140M26 46V90L18 98V126';
	art += trace(main, 1.6, 0.9);

	// --- Vias, stitched through the open channels. ---
	const boxes: [number, number, number, number][] = [
		[54, 2, 120, 32],
		[14, 14, 50, 50],
		[46, 46, 114, 114],
		[120, 22, 154, 148],
		[12, 118, 110, 160],
		[2, 2, 14, 14],
		[146, 2, 158, 14],
		[2, 146, 14, 158],
		[146, 146, 158, 158],
	];
	const blocked = (x: number, y: number): boolean =>
		boxes.some(([x0, y0, x1, y1]) => x > x0 && x < x1 && y > y0 && y < y1);
	for (let ix = 1; ix < 20; ix++) {
		for (let iy = 1; iy < 20; iy++) {
			if ((ix * 7 + iy * 13) % 5 !== 0) continue;
			const x = ix * 8;
			const y = iy * 8;
			if (blocked(x, y)) continue;
			art += via(x, y, 1.5, 0.6);
		}
	}

	// --- Components. ---

	// Chipset: a small BGA package with its die outline.
	art += `<rect x='18' y='18' width='28' height='28' rx='3' fill='${ctx.pFill}' fill-opacity='${ctx.fo(0.12)}' stroke='${ctx.pStroke}' stroke-opacity='${ctx.fo(0.9)}' stroke-width='1.4'/>`;
	for (let ix = 0; ix < 4; ix++) {
		for (let iy = 0; iy < 4; iy++) {
			art += `<circle cx='${n(23 + ix * 6)}' cy='${n(23 + iy * 6)}' r='0.7' fill='${ctx.pFill}' fill-opacity='${ctx.fo(0.4)}' stroke='none'/>`;
		}
	}
	art += `<rect x='26' y='26' width='12' height='12' rx='1' fill='none' stroke='${ctx.pStroke}' stroke-opacity='${ctx.fo(0.5)}' stroke-width='0.8'/>`;

	// VRM row along the top edge, with decoupling capacitors beneath.
	for (const x of [64, 80, 96, 112]) art += choke(x);
	for (const x of [72, 88, 104]) art += cap(x, 26, 2.2);

	// Processor socket: package, retention frame, pin field and core die.
	art += `<rect x='50' y='50' width='60' height='60' rx='4' fill='${ctx.pFill}' fill-opacity='${ctx.fo(0.08)}' stroke='${ctx.pStroke}' stroke-opacity='${ctx.fo(0.9)}' stroke-width='1.6'/>`
		+ `<rect x='56' y='56' width='48' height='48' rx='2' fill='none' stroke='${ctx.pStroke}' stroke-opacity='${ctx.fo(0.5)}' stroke-width='0.8'/>`
		+ `<path d='M58 58L66 58L58 66Z' fill='${ctx.pFill}' fill-opacity='${ctx.fo(0.7)}' stroke='none'/>`;
	for (let ix = 0; ix < 6; ix++) {
		for (let iy = 0; iy < 6; iy++) {
			if (ix >= 2 && ix <= 3 && iy >= 2 && iy <= 3) continue;
			art += `<circle cx='${n(64 + ix * 7)}' cy='${n(64 + iy * 7)}' r='0.6' fill='${ctx.pFill}' fill-opacity='${ctx.fo(0.35)}' stroke='none'/>`;
		}
	}
	let core = '';
	for (let i = 0; i < 6; i++) {
		const a = (Math.PI / 3) * i - Math.PI / 6;
		core += `${i === 0 ? 'M' : 'L'}${n(80 + 4 * Math.cos(a))} ${n(80 + 4 * Math.sin(a))}`;
	}
	art += `<rect x='74' y='74' width='12' height='12' rx='1' fill='${ctx.pFill}' fill-opacity='${ctx.fo(0.12)}' stroke='${ctx.pStroke}' stroke-opacity='${ctx.fo(0.8)}' stroke-width='0.9'/>`
		+ `<path d='${core}Z' fill='${ctx.pFill}' fill-opacity='${ctx.fo(0.25)}' stroke='${ctx.pStroke}' stroke-opacity='${ctx.fo(1)}' stroke-width='0.9' stroke-linejoin='round'/>`;

	// Memory slots and expansion slots.
	for (const x of [126, 140]) art += ramSlot(x);
	art += pcie(124, 104) + pcie(138, 84);

	// CMOS battery and the corner mounting holes.
	art += `<circle cx='26' cy='154' r='5' fill='${ctx.pFill}' fill-opacity='${ctx.fo(0.14)}' stroke='${ctx.pStroke}' stroke-opacity='${ctx.fo(0.85)}' stroke-width='1.2'/>`
		+ `<path d='M22 154H30M26 150V158' stroke='${ctx.pStroke}' stroke-opacity='${ctx.fo(0.6)}' stroke-width='0.9'/>`;
	for (const [x, y] of [[8, 8], [152, 8], [8, 152], [152, 152]]) {
		art += `<circle cx='${x}' cy='${y}' r='4' fill='none' stroke='${ctx.pStroke}' stroke-opacity='${ctx.fo(0.8)}' stroke-width='1.6'/>`
			+ `<circle cx='${x}' cy='${y}' r='2' fill='${ctx.pFill}' fill-opacity='${ctx.fo(0.2)}' stroke='none'/>`;
	}

	let instances = '';
	for (const dx of [-1, 0, 1]) {
		for (const dy of [-1, 0, 1]) {
			instances += `<use href='#mb' x='${dx * s}' y='${dy * s}'/>`;
		}
	}

	const size = Math.max(96, Math.round(ctx.size * 5));
	return {
		bgImage: ctx.svgUrl(s, s, instances, `fill='none' stroke='${ctx.pStroke}' stroke-linecap='round' stroke-linejoin='round'`, `<defs><g id='mb'>${art}</g></defs>`),
		bgSize: `${size}px ${size}px`,
		bgPosition: '0 0',
	};
};
