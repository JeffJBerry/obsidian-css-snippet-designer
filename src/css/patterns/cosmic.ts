/**
 * Cosmic and atmospheric washes.
 *
 * The full-bleed members of this group use `background-attachment: fixed` so
 * the wash stays put while the note scrolls, which is what keeps a single
 * 100% x 100% gradient from smearing down a long document.
 */
import type { PatternBuilder } from './types';
import { atLeast, n, rand } from './util';

const auroraGlow: PatternBuilder = (ctx) => {
	const { c, c2, op } = ctx;
	const colorA = ctx.rgba;
	const colorB = ctx.isGradient
		? ctx.rgba2
		: `rgba(${Math.round(c.r * 0.4 + c.g * 0.6)}, ${Math.round(c.g * 0.3 + c.b * 0.7)}, ${Math.round(c.b * 0.5 + c.r * 0.5)}, ${op * 0.75})`;
	const colorC = ctx.isGradient
		? `rgba(${Math.round(c2.r * 0.7 + c.r * 0.3)}, ${Math.round(c2.g * 0.7 + c.g * 0.3)}, ${Math.round(c2.b * 0.7 + c.b * 0.3)}, ${op * 0.6})`
		: `rgba(${Math.round(c.b * 0.5 + c.r * 0.5)}, ${Math.round(c.r * 0.4 + c.g * 0.6)}, ${Math.round(c.g * 0.3 + c.b * 0.7)}, ${op * 0.6})`;
	return {
		bgImage: `radial-gradient(at 0% 0%, ${colorA} 0px, transparent 55%), radial-gradient(at 100% 10%, ${colorB} 0px, transparent 50%), radial-gradient(at 50% 100%, ${colorC} 0px, transparent 50%)`,
		bgSize: '100% 100%',
		bgAttachment: 'fixed',
	};
};

const nebula: PatternBuilder = (ctx) => {
	const { c, c2, op } = ctx;
	const core = ctx.rgba;
	const dust = ctx.isGradient
		? ctx.rgba2
		: `rgba(${Math.min(255, c.r + 50)}, ${Math.max(0, c.g - 30)}, ${Math.min(255, c.b + 50)}, ${op * 0.75})`;
	const rim = ctx.isGradient
		? `rgba(${Math.round(c2.r * 0.8)}, ${Math.round(c2.g * 0.8)}, ${Math.round(c2.b * 0.8)}, ${op * 0.5})`
		: `rgba(${Math.round(c.r * 0.7)}, ${Math.round(c.g * 0.7)}, ${Math.round(c.b * 0.7)}, ${op * 0.5})`;
	return {
		bgImage: `radial-gradient(ellipse at 20% 25%, ${core} 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, ${dust} 0%, transparent 45%), radial-gradient(ellipse at 50% 75%, ${dust} 0%, transparent 50%), radial-gradient(ellipse at 85% 80%, ${rim} 0%, transparent 40%)`,
		bgSize: '100% 100%',
		bgAttachment: 'fixed',
	};
};

/** Six-stop mesh wash - softer and more saturated than the aurora. */
const plasmaMesh: PatternBuilder = (ctx) => {
	const a = ctx.tint(1);
	const b = ctx.isGradient ? ctx.tint2(0.9) : ctx.tint(0.7);
	const d = ctx.isGradient ? ctx.tint2(0.55) : ctx.tint(0.45);
	return {
		bgImage: `radial-gradient(at 12% 18%, ${a} 0px, transparent 45%), `
			+ `radial-gradient(at 78% 8%, ${b} 0px, transparent 42%), `
			+ `radial-gradient(at 92% 62%, ${a} 0px, transparent 40%), `
			+ `radial-gradient(at 44% 52%, ${d} 0px, transparent 48%), `
			+ `radial-gradient(at 20% 88%, ${b} 0px, transparent 44%), `
			+ `radial-gradient(at 68% 96%, ${d} 0px, transparent 40%)`,
		bgSize: '100% 100%',
		bgAttachment: 'fixed',
	};
};

const starrySky: PatternBuilder = (ctx) => {
	const { c, op } = ctx;
	const brightStar = ctx.isGradient ? ctx.rgba2 : `rgba(${c.r}, ${c.g}, ${c.b}, ${Math.min(1, op * 1.5)})`;
	const mediumStar = `rgba(${c.r}, ${c.g}, ${c.b}, ${op * 0.75})`;
	return {
		bgImage: `radial-gradient(1.5px 1.5px at 15% 20%, ${brightStar}, transparent), radial-gradient(1px 1px at 35% 65%, ${mediumStar}, transparent), radial-gradient(2px 2px at 70% 30%, ${brightStar}, transparent), radial-gradient(1px 1px at 80% 75%, ${mediumStar}, transparent), radial-gradient(1.5px 1.5px at 50% 85%, ${brightStar}, transparent), radial-gradient(1px 1px at 90% 15%, ${mediumStar}, transparent)`,
		bgSize: `${ctx.size * 3}px ${ctx.size * 2}px`,
		bgPosition: '0 0, 20px 30px, 50px 10px, 10px 40px, 35px 25px, 60px 50px',
	};
};

/** Star chart - graded stars joined into constellation figures. */
const constellation: PatternBuilder = (ctx) => {
	const s = atLeast(120, ctx.size * 7);
	const stars: [number, number, number][] = [
		[0.08, 0.14, 1.9], [0.22, 0.28, 1.2], [0.34, 0.12, 2.4], [0.46, 0.3, 1.4],
		[0.6, 0.1, 1.6], [0.78, 0.22, 2.2], [0.92, 0.36, 1.3],
		[0.12, 0.56, 1.5], [0.28, 0.7, 2.3], [0.44, 0.58, 1.2], [0.56, 0.78, 1.7],
		[0.72, 0.62, 2.5], [0.86, 0.8, 1.4], [0.64, 0.44, 1.1], [0.2, 0.9, 1.6],
	];
	const links: [number, number][] = [
		[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6],
		[7, 8], [8, 9], [9, 13], [13, 11], [11, 12], [10, 11], [8, 14],
	];
	let lineD = '';
	for (const [a, b] of links) {
		const sa = stars[a];
		const sb = stars[b];
		if (!sa || !sb) continue;
		lineD += `M${n(s * sa[0])} ${n(s * sa[1])}L${n(s * sb[0])} ${n(s * sb[1])}`;
	}
	let dots = '';
	for (const [fx, fy, r] of stars) {
		dots += `<circle cx='${n(s * fx)}' cy='${n(s * fy)}' r='${r}'/>`;
	}
	const body = `<path d='${lineD}' fill='none' stroke='${ctx.pStroke}' stroke-opacity='${ctx.fo(0.35)}' stroke-width='0.8'/>`
		+ `<g fill='${ctx.pFill}' fill-opacity='${ctx.fo(1)}'>${dots}</g>`;
	return {
		bgImage: ctx.svgUrl(s, s, body),
		bgSize: `${s}px ${s}px`,
		bgPosition: '0 0',
	};
};

/** Lunar cycle - five phases per row, offset row to row. */
const moonPhases: PatternBuilder = (ctx) => {
	const u = atLeast(22, ctx.size * 1.4);
	const r = u * 0.26;
	const w = u * 5;
	const h = u * 2;
	const solid = (cx: number, cy: number, path: string): string =>
		`<path d='${path}' fill='${ctx.pFill}' fill-opacity='${ctx.fo(1)}' transform='translate(${n(cx)} ${n(cy)})'/>`;
	const gibbous = `M0 ${n(-r)}A${n(r)} ${n(r)} 0 0 1 0 ${n(r)}A${n(r * 0.42)} ${n(r)} 0 0 0 0 ${n(-r)}Z`;
	const half = `M0 ${n(-r)}A${n(r)} ${n(r)} 0 0 1 0 ${n(r)}Z`;
	const crescent = `M0 ${n(-r)}A${n(r)} ${n(r)} 0 0 1 0 ${n(r)}A${n(r * 0.62)} ${n(r)} 0 0 1 0 ${n(-r)}Z`;
	const row = (oy: number, ox: number): string =>
		`<circle cx='${n(ox + u * 0.5)}' cy='${n(oy)}' r='${n(r)}' fill='${ctx.pFill}' fill-opacity='${ctx.fo(1)}'/>`
		+ solid(ox + u * 1.5, oy, gibbous)
		+ solid(ox + u * 2.5, oy, half)
		+ solid(ox + u * 3.5, oy, crescent)
		+ `<circle cx='${n(ox + u * 4.5)}' cy='${n(oy)}' r='${n(r)}' fill='none' stroke='${ctx.pStroke}' stroke-opacity='${ctx.fo(0.7)}' stroke-width='1'/>`;
	const body = row(u * 0.5, 0) + row(u * 1.5, u * 0.5) + row(u * 1.5, -u * 4.5);
	return {
		bgImage: ctx.svgUrl(w, h, body),
		bgSize: `${n(w)}px ${n(h)}px`,
		bgPosition: '0 0',
	};
};

/** Orbital rings - concentric tracks with bodies riding on them. */
const orbitRings: PatternBuilder = (ctx) => {
	const s = atLeast(80, ctx.size * 4.5);
	const cx = s / 2;
	const rings: [number, number, number][] = [[0.2, 40, 2.2], [0.32, 200, 1.6], [0.44, 300, 1.9]];
	let body = `<circle cx='${n(cx)}' cy='${n(cx)}' r='${n(s * 0.055)}' fill='${ctx.pFill}' fill-opacity='${ctx.fo(1)}'/>`;
	for (const [fr, deg, dot] of rings) {
		const r = s * fr;
		const rad = (deg * Math.PI) / 180;
		body += `<circle cx='${n(cx)}' cy='${n(cx)}' r='${n(r)}' fill='none' stroke='${ctx.pStroke}' stroke-opacity='${ctx.fo(0.6)}' stroke-width='1'/>`;
		body += `<circle cx='${n(cx + r * Math.cos(rad))}' cy='${n(cx + r * Math.sin(rad))}' r='${dot}' fill='${ctx.pFill}' fill-opacity='${ctx.fo(1)}'/>`;
	}
	return {
		bgImage: ctx.svgUrl(s, s, body),
		bgSize: `${s}px ${s}px`,
		bgPosition: '0 0',
	};
};

const rainbow: PatternBuilder = (ctx) => ({
	bgImage: `linear-gradient(135deg, rgba(239, 68, 68, ${ctx.op}) 0%, rgba(249, 115, 22, ${ctx.op}) 14%, rgba(234, 179, 8, ${ctx.op}) 28%, rgba(34, 197, 94, ${ctx.op}) 42%, rgba(6, 182, 212, ${ctx.op}) 56%, rgba(59, 130, 246, ${ctx.op}) 70%, rgba(168, 85, 247, ${ctx.op}) 84%, rgba(236, 72, 153, ${ctx.op}) 100%)`,
	bgSize: '100% 100%',
	bgAttachment: 'fixed',
});

const radialVignette: PatternBuilder = (ctx) => ({
	bgImage: `radial-gradient(ellipse at center, transparent 35%, ${ctx.isGradient ? ctx.rgba2 : ctx.rgba} 100%)`,
	bgSize: '100% 100%',
	bgAttachment: 'fixed',
});

/**
 * Van Gogh swirls - impasto brush strokes flowing in bands across a night sky.
 *
 * The stroke direction comes from a flow field built from sine and cosine of
 * the tile coordinates, so it is exactly periodic and the bands line up across
 * the seam; strokes that run off one edge are redrawn entering from the
 * opposite one. Length, bend, width and opacity are jittered from a
 * deterministic seed, so the sky reads as hand-painted but never changes
 * between renders.
 */
const vanGoghSwirl: PatternBuilder = (ctx) => {
	const s = atLeast(160, Math.round(ctx.size * 5));
	const cols = 12;
	const u = s / cols;

	// A periodic flow field, so the bands line up across the seam.
	const flow = (x: number, y: number): number =>
		0.6 + Math.sin((x / s) * Math.PI * 2) + Math.cos((y / s) * Math.PI * 2);

	/**
	 * One paint dab: a lens tapering to a point at each end, bowed to one side
	 * so it curves like a loaded brush. Returned with its bounds so a dab that
	 * spills over an edge can be repeated entering the opposite edge.
	 */
	const dab = (x1: number, y1: number, x2: number, y2: number, w: number, bow: number): { d: string; minX: number; maxX: number; minY: number; maxY: number } => {
		const dx = x2 - x1;
		const dy = y2 - y1;
		const len = Math.hypot(dx, dy) || 1;
		const px = -dy / len;
		const py = dx / len;
		const mx = (x1 + x2) / 2;
		const my = (y1 + y2) / 2;
		const c1x = mx + px * (w + bow);
		const c1y = my + py * (w + bow);
		const c2x = mx - px * (w - bow);
		const c2y = my - py * (w - bow);
		return {
			d: `M${n(x1)} ${n(y1)}Q${n(c1x)} ${n(c1y)} ${n(x2)} ${n(y2)}Q${n(c2x)} ${n(c2y)} ${n(x1)} ${n(y1)}Z`,
			minX: Math.min(x1, x2, c1x, c2x),
			maxX: Math.max(x1, x2, c1x, c2x),
			minY: Math.min(y1, y2, c1y, c2y),
			maxY: Math.max(y1, y2, c1y, c2y),
		};
	};

	// Five opacity bands; each becomes a single fill path, so the whole sky
	// costs five elements instead of a couple of hundred.
	const bands = [
		{ o: 0.16, d: '' },
		{ o: 0.32, d: '' },
		{ o: 0.5, d: '' },
		{ o: 0.7, d: '' },
		{ o: 0.92, d: '' },
	];

	let seed = 1;
	for (let gy = 0; gy < cols; gy++) {
		for (let gx = 0; gx < cols; gx++) {
			const bx = (gx + 0.5) * u + (rand(seed++) - 0.5) * u * 0.7;
			const by = (gy + 0.5) * u + (rand(seed++) - 0.5) * u * 0.7;
			const a = flow(bx, by) + (rand(seed++) - 0.5) * 0.45;
			const len = u * (0.6 + rand(seed++) * 0.9);
			// A loaded brush is uneven: mostly broad marks, with a few slim ones.
			const w = u * (0.2 + rand(seed++) * 0.55);
			const bow = (rand(seed++) - 0.5) * u * 1.1;
			const band = Math.min(4, Math.floor(rand(seed++) * 5));

			const hx = Math.cos(a) * len * 0.5;
			const hy = Math.sin(a) * len * 0.5;
			const x1 = bx - hx;
			const y1 = by - hy;
			const x2 = bx + hx;
			const y2 = by + hy;
			const base = dab(x1, y1, x2, y2, w, bow);

			const b = bands[band];
			if (!b) continue;
			const xs = [0];
			if (base.minX < 0) xs.push(s);
			if (base.maxX > s) xs.push(-s);
			const ys = [0];
			if (base.minY < 0) ys.push(s);
			if (base.maxY > s) ys.push(-s);
			for (const ox of xs) {
				for (const oy of ys) {
					b.d += ox === 0 && oy === 0 ? base.d : dab(x1 + ox, y1 + oy, x2 + ox, y2 + oy, w, bow).d;
				}
			}
		}
	}

	let paintField = '';
	for (const b of bands) {
		if (b.d) paintField += `<path d='${b.d}' fill='${ctx.pFill}' fill-opacity='${ctx.fo(b.o)}'/>`;
	}

	const body = paintField;

	return {
		bgImage: ctx.svgUrl(s, s, body, '', ''),
		bgSize: `${s}px ${s}px`,
		bgPosition: '0 0',
	};
};

/**
 * Spiral galaxy - an authentic face-on Milky Way held dead centre of the pane:
 * an SBbc barred spiral featuring an elongated central stellar bar, two major
 * logarithmic-spiral arms (Perseus and Scutum-Centaurus) launching from the bar
 * tips, the Sagittarius minor arm, the Orion-Cygnus spur (home to our Solar
 * System), and brilliant star-forming H II nebulae, adrift in a dense starfield.
 *
 * The central bar is angled at ~28° across the nucleus, flanked by an elliptical
 * bulge glow and stippled star beads. The major arms are stippled as hundreds of
 * small discs along an `r = r0*e^(k*theta)` curve, heavier and brighter toward
 * the core, so the density gradient itself reads as the glow rather than a
 * hard-edged shape; each stippled bead also casts a wide, faint underglow so the
 * arm resolves as luminous gas instead of a dotted line, and a dark dust rift
 * runs along its inner leading edge. The Orion-Cygnus spur branches between the
 * Sagittarius and Perseus arms at ~26,000 light-years out, marked by a bright
 * Solar System beacon. In two-tone mode, star-forming H II knots in the
 * secondary hue stud the arms. Two filaments spiral out of the nucleus, bright
 * field stars carry four-point diffraction spikes, and compact globular
 * clusters of pinprick companions sit in the outer halo. Positions are
 * jittered from a deterministic seed so the galaxy renders identically every
 * time. The tile is a percentage of the pane scaled by the size slider, so one
 * galaxy stays centred and aspect-true while the slider resizes it;
 * `background-repeat: no-repeat` keeps it single and
 * `background-attachment: fixed` pins it to the window while a note scrolls.
 */
/**
 * Spiral galaxy - an authentic face-on Milky Way held dead centre of the pane:
 * an SBbc barred spiral featuring an elongated central stellar bar, two major
 * logarithmic-spiral arms (Perseus and Scutum-Centaurus) launching from the bar
 * tips, the Sagittarius minor arm, the Orion-Cygnus spur (home to our Solar
 * System), and brilliant star-forming H II nebulae, adrift in a dense starfield.
 *
 * The central bar is angled at ~28° across the nucleus, flanked by an elliptical
 * bulge glow and stippled star beads. The major arms are rendered as continuous
 * luminous gas ribbons with smooth gradient falloff, overlaid with dense
 * stardust and brilliant star-forming H II emission knots (Carina, Eagle, Orion)
 * that take the secondary hue in two-tone mode. The Orion-Cygnus spur branches
 * between the Sagittarius and Perseus arms at ~26,000 light-years out, marked
 * by a bright Solar System beacon star. Inner filaments unwind from the core,
 * foreground field stars carry four-point diffraction spikes, and compact
 * globular clusters of pinprick companions sit in the outer halo. Positions are
 * jittered from a deterministic seed so the galaxy renders identically every
 * time. The tile is a percentage of the pane scaled by the size slider, so one
 * galaxy stays centred and aspect-true while the slider resizes it;
 * `background-repeat: no-repeat` keeps it single and
 * `background-attachment: fixed` pins it to the window while a note scrolls.
 */
const spiralGalaxy: PatternBuilder = (ctx) => {
	const s = 500;
	const pct = Math.round((ctx.size / 24) * 100);
	const c = s / 2;
	const rMax = s * 0.44;
	const rBar = s * 0.088;
	const barAngle = (28 * Math.PI) / 180;
	const thetaMax = Math.PI * 2 * 1.6;
	const k = Math.log(rMax / rBar) / thetaMax;

	const o = (m: number): string => Math.min(1, ctx.op * m).toFixed(3);
	const knotFill = ctx.isGradient ? ctx.tint2(0.9) : ctx.pFill;
	const starTint2 = ctx.isGradient ? ctx.tint2(0.85) : ctx.pFill;

	// --- 1. SUBTLE 3D VOLUMETRIC GLOWS & MIST (SOFT AMBIENT BACKGROUND) ---
	const coreDefs = `<defs>`
		+ `<filter id='gal-cloud-blur' x='-30%' y='-30%' width='160%' height='160%' color-interpolation-filters='sRGB'>`
		+ `<feGaussianBlur stdDeviation='10'/>`
		+ `</filter>`
		+ `<filter id='gal-deep-blur' x='-40%' y='-40%' width='180%' height='180%' color-interpolation-filters='sRGB'>`
		+ `<feGaussianBlur stdDeviation='18'/>`
		+ `</filter>`
		+ `<radialGradient id='gal-core-3d' cx='48%' cy='46%' r='52%' fx='46%' fy='44%'>`
		+ `<stop offset='0%' stop-color='${ctx.c.hex}' stop-opacity='${o(0.95)}'/>`
		+ `<stop offset='18%' stop-color='${ctx.c.hex}' stop-opacity='${o(0.7)}'/>`
		+ `<stop offset='40%' stop-color='${ctx.c.hex}' stop-opacity='${o(0.35)}'/>`
		+ `<stop offset='70%' stop-color='${ctx.c.hex}' stop-opacity='${o(0.08)}'/>`
		+ `<stop offset='100%' stop-color='${ctx.c.hex}' stop-opacity='0'/>`
		+ `</radialGradient>`
		+ `<radialGradient id='gal-core' cx='50%' cy='50%' r='50%'>`
		+ `<stop offset='0%' stop-color='${ctx.c.hex}' stop-opacity='${o(0.85)}'/>`
		+ `<stop offset='30%' stop-color='${ctx.c.hex}' stop-opacity='${o(0.4)}'/>`
		+ `<stop offset='70%' stop-color='${ctx.c.hex}' stop-opacity='${o(0.08)}'/>`
		+ `<stop offset='100%' stop-color='${ctx.c.hex}' stop-opacity='0'/>`
		+ `</radialGradient>`
		+ `<radialGradient id='gal-bar' cx='50%' cy='50%' r='50%'>`
		+ `<stop offset='0%' stop-color='${ctx.c.hex}' stop-opacity='${o(0.7)}'/>`
		+ `<stop offset='35%' stop-color='${ctx.c.hex}' stop-opacity='${o(0.3)}'/>`
		+ `<stop offset='75%' stop-color='${ctx.c.hex}' stop-opacity='${o(0.06)}'/>`
		+ `<stop offset='100%' stop-color='${ctx.c.hex}' stop-opacity='0'/>`
		+ `</radialGradient>`
		+ `</defs>`;

	// Diffuse ambient disk & core bulge glow (soft and ethereal, not rigid)
	const ambientGlow = `<circle cx='${n(c)}' cy='${n(c)}' r='${n(rMax * 1.08)}' fill='url(#gal-core)' fill-opacity='0.25'/>`
		+ `<circle cx='${n(c)}' cy='${n(c)}' r='${n(rMax * 0.58)}' fill='url(#gal-core-3d)' fill-opacity='0.45'/>`
		+ `<ellipse cx='${n(c)}' cy='${n(c)}' rx='${n(rBar * 1.55)}' ry='${n(rBar * 0.65)}' transform='rotate(28 ${n(c)} ${n(c)})' fill='url(#gal-bar)' fill-opacity='0.6'/>`
		+ `<circle cx='${n(c)}' cy='${n(c)}' r='${n(rBar * 0.65)}' fill='url(#gal-core-3d)'/>`
		+ `<circle cx='${n(c)}' cy='${n(c)}' r='${n(rBar * 0.28)}' fill='url(#gal-core-3d)' fill-opacity='0.9'/>`;

	// --- 2. GENTLE NEBULAR MIST (SOFT BACKGROUND, NOT PRONOUNCED TRACKS) ---
	let armMistDeep = '';
	let armMistSoft = '';
	const numArmSteps = 60;
	for (let arm = 0; arm < 2; arm++) {
		const armOffset = arm * Math.PI;
		let pDeep = '';
		let pSoft = '';
		for (let i = 0; i <= numArmSteps; i++) {
			const t = i / numArmSteps;
			const theta = t * thetaMax;
			const r = rBar * Math.exp(k * theta);
			const angle = barAngle + armOffset + theta;
			const x = c + r * Math.cos(angle);
			const y = c + r * Math.sin(angle);
			const cmd = i === 0 ? 'M' : 'L';
			pDeep += `${cmd}${n(x)} ${n(y)}`;
			pSoft += `${cmd}${n(x)} ${n(y)}`;
		}
		armMistDeep += `<path d='${pDeep}' fill='none' stroke='${ctx.pStroke}' stroke-opacity='${ctx.fo(0.12)}' stroke-width='42' stroke-linecap='round'/>`;
		armMistSoft += `<path d='${pSoft}' fill='none' stroke='${ctx.pStroke}' stroke-opacity='${ctx.fo(0.15)}' stroke-width='22' stroke-linecap='round'/>`;
	}

	// Minor arms mist
	for (let arm = 0; arm < 2; arm++) {
		const minorOffset = arm * Math.PI + 0.85;
		let mPath = '';
		for (let i = 0; i <= 30; i++) {
			const t = i / 30;
			const theta = t * (Math.PI * 1.1);
			const r = (rBar * 1.15) * Math.exp(k * 0.9 * theta);
			const angle = barAngle + minorOffset + theta;
			const x = c + r * Math.cos(angle);
			const y = c + r * Math.sin(angle);
			mPath += `${i === 0 ? 'M' : 'L'}${n(x)} ${n(y)}`;
		}
		armMistSoft += `<path d='${mPath}' fill='none' stroke='${ctx.pStroke}' stroke-opacity='${ctx.fo(0.08)}' stroke-width='16' stroke-linecap='round'/>`;
	}

	// --- 3. DENSE REALISTIC STAR POPULATIONS (OVER 1,500 STARS) ---
	let starsFaint = '';
	let starsMid = '';
	let starsBright = '';
	let starsAccent = '';
	let starGlows = '';

	const addStar = (x: number, y: number, r: number, oLevel: number, isSec = false): void => {
		const sTag = `<circle cx='${n(x)}' cy='${n(y)}' r='${n(r)}'/>`;
		if (isSec) {
			starsAccent += sTag;
		} else if (oLevel < 0.42) {
			starsFaint += sTag;
		} else if (oLevel < 0.78) {
			starsMid += sTag;
		} else {
			starsBright += sTag;
		}
	};

	// A. Central Bulge & Nuclear Star Cluster (High Density)
	const cosB = Math.cos(barAngle);
	const sinB = Math.sin(barAngle);
	for (let i = 0; i < 220; i++) {
		const seed = i * 29 + 101;
		const radFrac = Math.pow(rand(seed), 1.8);
		const dist = (rand(seed + 1) - 0.5) * 2 * rBar * 1.1 * radFrac;
		const perp = (rand(seed + 2) - 0.5) * 2 * (rBar * 0.55) * (1 - Math.abs(dist) / (rBar * 1.2));
		const bx = c + dist * cosB - perp * sinB;
		const by = c + dist * sinB + perp * cosB;
		const br = 0.35 + rand(seed + 3) * 1.1 * (1 - radFrac * 0.5);
		const bo = 0.4 + (1 - radFrac * 0.7) * (0.35 + rand(seed + 4) * 0.25);
		addStar(bx, by, br, bo);
	}

	// B. Dense Spiral Arm Stars (Natural Density Wave Distribution)
	for (let arm = 0; arm < 2; arm++) {
		const armOffset = arm * Math.PI;
		const numArmStars = 380;
		for (let sIdx = 0; sIdx < numArmStars; sIdx++) {
			const seed = sIdx * 37 + arm * 2381;
			const t = Math.pow(rand(seed), 0.85);
			const theta = t * thetaMax;
			const r = rBar * Math.exp(k * theta);
			const angle = barAngle + armOffset + theta;

			// Natural dispersion across arm width using Box-Muller Gaussian approximation
			const armSigma = (12 + t * 24);
			const u1 = Math.max(0.0001, rand(seed + 1));
			const u2 = rand(seed + 2);
			const normDisp = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
			const armDisp = normDisp * armSigma * 0.5;

			const sx = c + r * Math.cos(angle) - Math.sin(angle) * armDisp;
			const sy = c + r * Math.sin(angle) + Math.cos(angle) * armDisp;

			const distFactor = Math.abs(armDisp) / armSigma;
			const sr = 0.35 + rand(seed + 3) * (1.25 - t * 0.45);
			const so = Math.max(0.2, (0.88 - t * 0.38 - distFactor * 0.3) * (0.45 + rand(seed + 4) * 0.55));
			const isSec = ctx.isGradient && rand(seed + 5) < 0.12 && t > 0.1 && t < 0.8;

			addStar(sx, sy, sr, so, isSec);

			if (sIdx % 42 === 0) {
				starGlows += `<circle cx='${n(sx)}' cy='${n(sy)}' r='${n(sr * 3.5)}' fill='${ctx.pFill}' fill-opacity='${ctx.fo(0.18)}'/>`;
			}
		}
	}

	// C. Inter-Arm Galactic Disk Stars
	for (let i = 0; i < 280; i++) {
		const seed = i * 47 + 5003;
		const rFrac = Math.sqrt(rand(seed));
		const r = rBar * 0.8 + rFrac * (rMax - rBar * 0.8);
		const a = rand(seed + 1) * Math.PI * 2;
		const x = c + r * Math.cos(a);
		const y = c + r * Math.sin(a);
		const sr = 0.3 + rand(seed + 2) * 0.8;
		const so = (0.2 + rand(seed + 3) * 0.45) * (1 - (r / rMax) * 0.4);
		addStar(x, y, sr, so);
	}

	// D. Star-Forming H II Nebulae & Open Star Clusters
	let nebulae = '';
	for (let arm = 0; arm < 2; arm++) {
		for (let cl = 0; cl < 8; cl++) {
			const cSeed = cl * 53 + arm * 881 + 9001;
			const ct = 0.15 + (cl / 8) * 0.72;
			const cTheta = ct * thetaMax;
			const cR = rBar * Math.exp(k * cTheta);
			const cAngle = barAngle + arm * Math.PI + cTheta + (rand(cSeed) - 0.5) * 0.08;
			const cx = c + cR * Math.cos(cAngle);
			const cy = c + cR * Math.sin(cAngle);

			const kr = 1.8 + rand(cSeed + 1) * 2.2;
			nebulae += `<circle cx='${n(cx)}' cy='${n(cy)}' r='${n(kr * 2.5)}' fill='${knotFill}' fill-opacity='${ctx.fo(0.18)}'/>`
				+ `<circle cx='${n(cx)}' cy='${n(cy)}' r='${n(kr * 1.3)}' fill='${knotFill}' fill-opacity='${ctx.fo(0.45)}'/>`
				+ `<circle cx='${n(cx)}' cy='${n(cy)}' r='${n(kr)}' fill='${knotFill}' fill-opacity='${ctx.fo(0.85)}'/>`;

			for (let cs = 0; cs < 5; cs++) {
				const csSeed = cSeed + cs * 13;
				const csa = rand(csSeed) * Math.PI * 2;
				const csr = rand(csSeed + 1) * kr * 2.0;
				addStar(cx + csr * Math.cos(csa), cy + csr * Math.sin(csa), 0.4 + rand(csSeed + 2) * 0.6, 0.8, ctx.isGradient);
			}
		}
	}

	// E. Background & Foreground Field Stars
	for (let i = 0; i < 200; i++) {
		const seed = i * 19 + 7001;
		const x = rand(seed) * s;
		const y = rand(seed + 1) * s;
		const rr = 0.35 + rand(seed + 2) * 0.95;
		const ro = 0.15 + rand(seed + 3) * 0.55;
		addStar(x, y, rr, ro);
	}

	// F. Halo Globular Clusters (11 clusters with spherical stellar swarms)
	let haloClusters = '';
	for (let i = 0; i < 11; i++) {
		const a = rand(i * 23 + 7001) * Math.PI * 2;
		const r = s * (0.34 + rand(i * 29 + 7002) * 0.13);
		const gx = c + r * Math.cos(a);
		const gy = c + r * Math.sin(a);
		const gSize = 1.4 + rand(i * 31 + 7003) * 1.2;
		haloClusters += `<circle cx='${n(gx)}' cy='${n(gy)}' r='${n(gSize * 3.2)}' fill='${ctx.pFill}' fill-opacity='${ctx.fo(0.16)}'/>`
			+ `<circle cx='${n(gx)}' cy='${n(gy)}' r='${n(gSize * 1.6)}' fill='${ctx.pFill}' fill-opacity='${ctx.fo(0.4)}'/>`
			+ `<circle cx='${n(gx)}' cy='${n(gy)}' r='${n(gSize)}' fill='${ctx.pFill}' fill-opacity='${ctx.fo(0.85)}'/>`;
		for (let j = 0; j < 6; j++) {
			const sa = rand(i * 41 + j * 17 + 7005) * Math.PI * 2;
			const sr = gSize * (1.0 + rand(i * 43 + j * 19 + 7006) * 2.2);
			addStar(gx + sr * Math.cos(sa), gy + sr * Math.sin(sa), 0.45, 0.5);
		}
	}

	// G. Solar System (Sol) Beacon Star on the Orion Spur
	const orionAngle = barAngle + 1.62;
	const orionR = s * 0.245;
	const sunX = c + orionR * Math.cos(orionAngle);
	const sunY = c + orionR * Math.sin(orionAngle);
	const sunBeacon = `<circle cx='${n(sunX)}' cy='${n(sunY)}' r='8' fill='${ctx.pFill}' fill-opacity='${ctx.fo(0.18)}'/>`
		+ `<circle cx='${n(sunX)}' cy='${n(sunY)}' r='4' fill='${ctx.pFill}' fill-opacity='${ctx.fo(0.5)}'/>`
		+ `<circle cx='${n(sunX)}' cy='${n(sunY)}' r='1.6' fill='${ctx.pFill}' fill-opacity='${ctx.fo(1.0)}'/>`;

	// --- 4. ASSEMBLE GROUPS ---
	const starGroups = `<g fill='${ctx.pFill}' fill-opacity='${ctx.fo(0.32)}'>${starsFaint}</g>`
		+ `<g fill='${ctx.pFill}' fill-opacity='${ctx.fo(0.65)}'>${starsMid}</g>`
		+ `<g fill='${ctx.pFill}' fill-opacity='${ctx.fo(0.92)}'>${starsBright}</g>`
		+ (starsAccent ? `<g fill='${starTint2}' fill-opacity='${ctx.fo(0.85)}'>${starsAccent}</g>` : '');

	const body = ambientGlow
		+ `<g filter='url(#gal-deep-blur)'>${armMistDeep}</g>`
		+ `<g filter='url(#gal-cloud-blur)'>${armMistSoft}</g>`
		+ starGlows
		+ nebulae
		+ haloClusters
		+ starGroups
		+ sunBeacon;

	return {
		bgImage: ctx.svgUrl(s, s, body, '', coreDefs),
		bgSize: `${pct}% ${pct}%`,
		bgPosition: 'center',
		bgRepeat: 'no-repeat',
		bgAttachment: 'fixed',
	};
};

export const COSMIC_PATTERNS: Record<string, PatternBuilder> = {
	'aurora-glow': auroraGlow,
	constellation,
	'moon-phases': moonPhases,
	nebula,
	'orbit-rings': orbitRings,
	'plasma-mesh': plasmaMesh,
	'radial-vignette': radialVignette,
	rainbow,
	'spiral-galaxy': spiralGalaxy,
	'starry-sky': starrySky,
	'van-gogh-swirl': vanGoghSwirl,
};
