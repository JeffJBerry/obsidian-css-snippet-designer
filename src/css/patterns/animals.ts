/**
 * Animated animal builders.
 *
 * These are deliberately NOT offered in the pattern picker: they exist only as
 * frames for the Animated Pattern Style flipbooks, so one creature can be drawn
 * in a few poses and the generator cycles through them. Each builder reads
 * `ctx.frame` and draws the next pose of the same animal, which is what makes
 * the flipbook read as movement rather than as unrelated tiles.
 */
import type { PatternBuilder } from './types';
import { atLeast, n } from './util';

const POSE_COUNT = 4;

function pose(ctx: { frame: number }, count: number = POSE_COUNT): number {
	const f = Math.floor(ctx.frame) % count;
	return f < 0 ? f + count : f;
}

/** A small bird beating its wings as it hovers. */
const bird: PatternBuilder = (ctx) => {
	const s = atLeast(48, ctx.size * 2);
	const f = pose(ctx);
	const wing = [-34, -8, 28, -8][f] ?? 0;
	const bob = [0, -2, 0, 2][f] ?? 0;
	const cx = s / 2;
	const cy = s / 2 + bob;
	const bodyR = s * 0.2;
	const wingShape = `<ellipse cx='0' cy='0' rx='${n(s * 0.13)}' ry='${n(s * 0.045)}'/>`;
	const body =
		`<g transform='translate(${n(cx)} ${n(cy)})' fill='${ctx.pFill}' fill-opacity='${ctx.fo(1)}' stroke='${ctx.pStroke}' stroke-opacity='${ctx.fo(0.85)}' stroke-width='1.2' stroke-linejoin='round'>`
		+ `<g transform='translate(${n(-bodyR * 0.5)} 0) rotate(${wing})'>${wingShape}</g>`
		+ `<g transform='translate(${n(-bodyR * 0.5)} 0) rotate(${-wing})'>${wingShape}</g>`
		+ `<path d='M${n(-bodyR)} 0 L${n(-bodyR - s * 0.1)} ${n(-s * 0.06)} L${n(-bodyR - s * 0.1)} ${n(s * 0.06)} Z'/>`
		+ `<ellipse cx='0' cy='0' rx='${n(bodyR)}' ry='${n(s * 0.12)}'/>`
		+ `<circle cx='${n(bodyR * 0.72)}' cy='${n(-s * 0.05)}' r='${n(s * 0.075)}'/>`
		+ `<path d='M${n(bodyR * 1.42)} ${n(-s * 0.05)} l${n(s * 0.08)} ${n(s * 0.025)} l${n(-s * 0.08)} ${n(s * 0.025)} Z'/>`
		+ `<circle cx='${n(bodyR * 0.8)}' cy='${n(-s * 0.065)}' r='1.5' fill='${ctx.pStroke}' stroke='none'/>`
		+ `</g>`;
	return { bgImage: ctx.svgUrl(s, s, body), bgSize: `${s}px ${s}px`, bgPosition: '0 0' };
};

/** A cat mid-stride: legs and tail swing through the walk cycle. */
const cat: PatternBuilder = (ctx) => {
	const s = atLeast(52, ctx.size * 2.1);
	const f = pose(ctx);
	const swing = [1, 0, -1, 0][f] ?? 0;
	const tailSway = [24, 6, -24, -6][f] ?? 0;
	const cx = s / 2;
	const cy = s * 0.54;
	const bodyW = s * 0.3;
	const legLen = s * 0.18;
	const legSwing = swing * s * 0.06;
	const leg = (x: number, dx: number): string => `<path d='M${n(x)} ${n(s * 0.08)} L${n(x + dx)} ${n(s * 0.08 + legLen)}'/>`;
	const body =
		`<g transform='translate(${n(cx)} ${n(cy)})' fill='${ctx.pFill}' fill-opacity='${ctx.fo(1)}' stroke='${ctx.pStroke}' stroke-opacity='${ctx.fo(0.85)}' stroke-width='1.3' stroke-linecap='round' stroke-linejoin='round'>`
		+ `<path d='M${n(-bodyW * 0.9)} ${n(s * 0.02)} Q${n(-bodyW * 1.5)} ${n(-s * 0.12)} ${n(-bodyW * 1.35 + tailSway * 0.1)} ${n(-s * 0.22)}' fill='none'/>`
		+ leg(-bodyW * 0.7, -legSwing)
		+ leg(-bodyW * 0.4, legSwing)
		+ leg(bodyW * 0.4, legSwing)
		+ leg(bodyW * 0.7, -legSwing)
		+ `<ellipse cx='0' cy='0' rx='${n(bodyW)}' ry='${n(s * 0.11)}'/>`
		+ `<circle cx='${n(bodyW * 1.05)}' cy='${n(-s * 0.12)}' r='${n(s * 0.095)}'/>`
		+ `<path d='M${n(bodyW * 0.86)} ${n(-s * 0.19)} l${n(-s * 0.02)} ${n(-s * 0.08)} l${n(s * 0.06)} ${n(s * 0.04)} Z'/>`
		+ `<path d='M${n(bodyW * 1.15)} ${n(-s * 0.19)} l${n(s * 0.02)} ${n(-s * 0.08)} l${n(-s * 0.06)} ${n(s * 0.04)} Z'/>`
		+ `<circle cx='${n(bodyW * 0.98)}' cy='${n(-s * 0.13)}' r='1.6' fill='${ctx.pStroke}' stroke='none'/>`
		+ `<circle cx='${n(bodyW * 1.2)}' cy='${n(-s * 0.13)}' r='1.6' fill='${ctx.pStroke}' stroke='none'/>`
		+ `</g>`;
	return { bgImage: ctx.svgUrl(s, s, body), bgSize: `${s}px ${s}px`, bgPosition: '0 0' };
};

/** A fish flicking its tail as it swims. */
const fish: PatternBuilder = (ctx) => {
	const s = atLeast(48, ctx.size * 2);
	const f = pose(ctx);
	const tail = [-28, 0, 28, 0][f] ?? 0;
	const bob = [0, -2, 0, 2][f] ?? 0;
	const cx = s / 2;
	const cy = s / 2 + bob;
	const body =
		`<g transform='translate(${n(cx)} ${n(cy)})' fill='${ctx.pFill}' fill-opacity='${ctx.fo(1)}' stroke='${ctx.pStroke}' stroke-opacity='${ctx.fo(0.85)}' stroke-width='1.2' stroke-linejoin='round'>`
		+ `<g transform='translate(${n(-s * 0.22)} 0) rotate(${tail})'><path d='M0 0 L${n(-s * 0.15)} ${n(-s * 0.12)} L${n(-s * 0.15)} ${n(s * 0.12)} Z'/></g>`
		+ `<path d='M${n(-s * 0.02)} ${n(-s * 0.1)} L${n(s * 0.08)} ${n(-s * 0.2)} L${n(s * 0.16)} ${n(-s * 0.07)} Z'/>`
		+ `<ellipse cx='0' cy='0' rx='${n(s * 0.24)}' ry='${n(s * 0.12)}'/>`
		+ `<circle cx='${n(s * 0.16)}' cy='${n(-s * 0.02)}' r='1.7' fill='${ctx.pStroke}' stroke='none'/>`
		+ `</g>`;
	return { bgImage: ctx.svgUrl(s, s, body), bgSize: `${s}px ${s}px`, bgPosition: '0 0' };
};

/** A rabbit hopping, ears trailing the arc. */
const bunny: PatternBuilder = (ctx) => {
	const s = atLeast(48, ctx.size * 2);
	const f = pose(ctx);
	const hop = [0, -s * 0.1, -s * 0.16, -s * 0.06][f] ?? 0;
	const earTilt = [8, 0, -8, 0][f] ?? 0;
	const cx = s / 2;
	const cy = s * 0.6 + hop;
	const body =
		`<g transform='translate(${n(cx)} ${n(cy)})' fill='${ctx.pFill}' fill-opacity='${ctx.fo(1)}' stroke='${ctx.pStroke}' stroke-opacity='${ctx.fo(0.85)}' stroke-width='1.2' stroke-linejoin='round'>`
		+ `<ellipse cx='${n(-s * 0.04)}' cy='${n(s * 0.02)}' rx='${n(s * 0.16)}' ry='${n(s * 0.11)}'/>`
		+ `<ellipse cx='${n(-s * 0.13)}' cy='${n(s * 0.11)}' rx='${n(s * 0.05)}' ry='${n(s * 0.04)}'/>`
		+ `<g transform='translate(${n(s * 0.12)} ${n(-s * 0.04)}) rotate(${earTilt})'>`
		+ `<ellipse cx='${n(-s * 0.03)}' cy='${n(-s * 0.12)}' rx='${n(s * 0.026)}' ry='${n(s * 0.1)}'/>`
		+ `<ellipse cx='${n(s * 0.03)}' cy='${n(-s * 0.13)}' rx='${n(s * 0.026)}' ry='${n(s * 0.1)}'/>`
		+ `<circle cx='0' cy='0' r='${n(s * 0.09)}'/>`
		+ `<circle cx='${n(-s * 0.03)}' cy='${n(-s * 0.02)}' r='1.5' fill='${ctx.pStroke}' stroke='none'/>`
		+ `<circle cx='${n(s * 0.03)}' cy='${n(-s * 0.02)}' r='1.5' fill='${ctx.pStroke}' stroke='none'/>`
		+ `</g>`
		+ `</g>`;
	return { bgImage: ctx.svgUrl(s, s, body), bgSize: `${s}px ${s}px`, bgPosition: '0 0' };
};

/** A single centered face that winks its right eye. */
const wink: PatternBuilder = (ctx) => {
	const s = atLeast(64, ctx.size * 3);
	const N = 12;
	const f = pose(ctx, N);
	const cx = s / 2;
	const cy = s / 2;
	const r = s * 0.34;
	const eyeX = r * 0.42;
	const eyeY = cy - r * 0.26;
	const eyeR = r * 0.15;
	const stroke = Math.max(1.6, r * 0.1);
	const line = `stroke='${ctx.pStroke}' stroke-opacity='${ctx.fo(1)}' stroke-width='${n(stroke)}' stroke-linecap='round' fill='none'`;
	// Twelve steps: the wink eases shut across the first half, holds for two
	// frames, then springs back open. `shut` drives the eye, while `smirk` and
	// `widen` let the mouth and the watching eye keep moving through the hold, so
	// every frame is distinct and the face itself never shifts.
	const shut = [0, 0.05, 0.15, 0.32, 0.55, 0.78, 0.93, 1, 1, 0.86, 0.5, 0.14];
	const smirk = [0, 0.03, 0.1, 0.22, 0.4, 0.6, 0.8, 0.9, 0.85, 0.6, 0.3, 0.07];
	const widen = [0, 0.02, 0.04, 0.07, 0.1, 0.13, 0.15, 0.16, 0.15, 0.11, 0.06, 0.02];
	const w = shut[f] ?? 0;
	const s2 = smirk[f] ?? 0;
	const wide = widen[f] ?? 0;
	// One eye is the filled lens between two curved lids pinned at the corners.
	// `top` is the upper lid's height above the centre; `bottom` is the lower
	// lid's signed offset from it (positive below, negative above). A round open
	// eye has top 1 and bottom 1, while a wink is a crescent whose lower lid has
	// swung up past the centre. Morphing those two numbers alone turns open into
	// shut without swapping shapes.
	const eye = (ex: number, top: number, bottom: number): string => {
		const c1x = ex - eyeR * 0.28;
		const c2x = ex + eyeR * 0.28;
		const lx = ex - eyeR;
		const rx = ex + eyeR;
		const up = top * eyeR * 1.333;
		const down = bottom * eyeR * 1.333;
		return `<path d='M${n(lx)} ${n(eyeY)}`
			+ ` C${n(c1x)} ${n(eyeY - up)} ${n(c2x)} ${n(eyeY - up)} ${n(rx)} ${n(eyeY)}`
			+ ` C${n(c2x)} ${n(eyeY + down)} ${n(c1x)} ${n(eyeY + down)} ${n(lx)} ${n(eyeY)} Z'`
			+ ` fill='${ctx.pStroke}' fill-opacity='${ctx.fo(1)}'/>`;
	};
	// The winking lid pair starts at a full round eye (thickness 2, no rise) and
	// ends as a shallow crescent lifted clear of the centre (thickness 0.6,
	// rise 0.6).
	const winkThickness = 2 - 1.4 * w;
	const winkRise = 0.6 * w;
	const rightTop = winkRise + winkThickness / 2;
	const rightBottom = -(winkRise - winkThickness / 2);
	// The watching eye stays fully open, widening a touch as it reacts.
	const leftEye = eye(cx - eyeX, 1 + wide, 1 + wide);
	const rightEye = eye(cx + eyeX, rightTop, rightBottom);
	const body =
		`<circle cx='${n(cx)}' cy='${n(cy)}' r='${n(r)}' fill='${ctx.pFill}' fill-opacity='${ctx.fo(0.18)}' stroke='${ctx.pStroke}' stroke-opacity='${ctx.fo(0.9)}' stroke-width='${n(Math.max(1.6, r * 0.09))}'/>`
		+ leftEye
		+ rightEye
		// The smile lifts on the winking side and peaks with the wink.
		+ `<path d='M${n(cx - r * 0.34)} ${n(cy + r * 0.28)} Q${n(cx + r * 0.06 * s2)} ${n(cy + r * (0.62 - 0.22 * s2))} ${n(cx + r * 0.34)} ${n(cy + r * (0.28 - 0.16 * s2))}' ${line}/>`;
	// Centered, never tiled: one face in the middle of the pane.
	return { bgImage: ctx.svgUrl(s, s, body), bgSize: `${s}px ${s}px`, bgPosition: 'center', bgRepeat: 'no-repeat' };
};

/**
 * Blink phase: the eyes stay open right through the cycle and blink once on the
 * last frame, so no frame ever shows a face with the eyes gone.
 */
function blink(f: number, count: number): 'open' | 'half' {
	return f === count - 1 ? 'half' : 'open';
}

/** Both eyes, blinking together. A half-blink is a lid at the eye's midline. */
function blinkEyes(
	phase: 'open' | 'half',
	cx: number,
	cy: number,
	dx: number,
	eyeR: number,
	line: string,
	solid: string,
): string {
	const eye = (x: number): string =>
		phase === 'open'
			? `<circle cx='${n(x)}' cy='${n(cy)}' r='${n(eyeR)}' ${solid}/>`
			: `<path d='M${n(x - eyeR)} ${n(cy)} Q${n(x)} ${n(cy - eyeR * 0.7)} ${n(x + eyeR)} ${n(cy)}' ${line}/>`;
	return eye(cx - dx) + eye(cx + dx);
}

/**
 * A cute puppy: a small, circular head with two floppy ears that tuck against
 * it and are filled solid on top of the head.
 * Brows, a muzzle and a small filled blep. Ten frames: a gentle body sway with
 * the ears flapping, a twice-per-loop tongue pant and one blink.
 */
const puppy: PatternBuilder = (ctx) => {
	const s = atLeast(72, ctx.size * 3.2);
	const N = 10;
	const f = pose(ctx, N);
	const cx = s / 2;
	const r = s * 0.24;
	const tau = Math.PI * 2;
	const wave = (cycles: number, phase = 0): number => Math.sin((tau * cycles * f) / N + phase);
	// The head stays put; only the ears flap (one cycle per loop, so frame 9
	// flows straight back into frame 0) and the tongue pants faster. The offsets
	// differ so no two frames are identical.
	const cy = s * 0.52;
	const flap = wave(1, Math.PI / 4) * r * 0.12;
	// A plain circular head.
	const rx = r;
	const ry = r;
	const dx = r * 0.34;
	const eyeY = cy - r * 0.04;
	const eyeR = r * 0.19;
	const stroke = `stroke='${ctx.pStroke}' stroke-opacity='${ctx.fo(0.95)}' stroke-width='${n(Math.max(1.8, r * 0.11))}' stroke-linecap='round' stroke-linejoin='round' fill='none'`;
	const thin = `stroke='${ctx.pStroke}' stroke-opacity='${ctx.fo(0.7)}' stroke-width='${n(Math.max(1.2, r * 0.055))}' stroke-linecap='round' fill='none'`;
	const solid = `fill='${ctx.pStroke}' fill-opacity='${ctx.fo(1)}'`;
	// Small floppy ears that tuck against the head. Each ear is filled SOLID and
	// drawn ON TOP of the translucent head, so it reads as an opaque lobe while
	// the slight overlap keeps it part of the face.
	const ear = (side: number): string => {
		const a = `${n(cx + side * rx * 0.82)} ${n(cy - ry * 0.58)}`;
		const b = `${n(cx + side * rx * 0.9)} ${n(cy + ry * 0.3)}`;
		const o1 = `${n(cx + side * (rx * 1.44 + flap))} ${n(cy - ry * 0.52)}`;
		const o2 = `${n(cx + side * (rx * 1.36 + flap))} ${n(cy + ry * 0.7)}`;
		const i1 = `${n(cx + side * rx * 0.86)} ${n(cy - ry * 0.06)}`;
		return `<path d='M${a} C${o1} ${o2} ${b} Q${i1} ${a} Z' fill='${ctx.pFill}' fill-opacity='${ctx.fo(1)}' stroke='${ctx.pStroke}' stroke-opacity='${ctx.fo(0.95)}' stroke-width='${n(Math.max(1.8, r * 0.1))}' stroke-linejoin='round'/>`;
	};
	const head = `<circle cx='${n(cx)}' cy='${n(cy)}' r='${n(r)}' fill='${ctx.pFill}' fill-opacity='${ctx.fo(0.18)}' stroke='${ctx.pStroke}' stroke-opacity='${ctx.fo(0.95)}' stroke-width='${n(Math.max(1.8, r * 0.1))}'/>`;
	// Small tongue blep, panting twice per loop.
	const tongueLen = r * (0.1 + 0.05 * wave(2, Math.PI / 3));
	const ty = cy + r * 0.52;
	const tongue = tongueLen > 1
		? `<path d='M${n(cx - r * 0.1)} ${n(ty)} q0 ${n(tongueLen)} ${n(r * 0.1)} ${n(tongueLen)} q${n(r * 0.1)} 0 ${n(r * 0.1)} ${n(-tongueLen)} Z' fill='${ctx.pFill}' fill-opacity='${ctx.fo(1)}' stroke='${ctx.pStroke}' stroke-opacity='${ctx.fo(0.95)}' stroke-width='${n(Math.max(1.8, r * 0.11))}' stroke-linejoin='round'/>`
			+ `<path d='M${n(cx)} ${n(ty + r * 0.02)} v${n(tongueLen * 0.55)}' ${thin}/>`
		: '';
	const brows =
		`<path d='M${n(cx - dx - eyeR)} ${n(eyeY - r * 0.32)} Q${n(cx - dx)} ${n(eyeY - r * 0.46)} ${n(cx - dx + eyeR)} ${n(eyeY - r * 0.32)}' ${thin}/>`
		+ `<path d='M${n(cx + dx - eyeR)} ${n(eyeY - r * 0.32)} Q${n(cx + dx)} ${n(eyeY - r * 0.46)} ${n(cx + dx + eyeR)} ${n(eyeY - r * 0.32)}' ${thin}/>`;
	const features =
		brows
		+ blinkEyes(blink(f, N), cx, eyeY, dx, eyeR, stroke, solid)
		// A rounded muzzle marks the dog's snout (an outline, so it never layers).
		+ `<ellipse cx='${n(cx)}' cy='${n(cy + r * 0.33)}' rx='${n(r * 0.38)}' ry='${n(r * 0.25)}' fill='none' stroke='${ctx.pStroke}' stroke-opacity='${ctx.fo(0.45)}' stroke-width='${n(Math.max(1.2, r * 0.05))}'/>`
		+ `<ellipse cx='${n(cx)}' cy='${n(cy + r * 0.25)}' rx='${n(r * 0.1)}' ry='${n(r * 0.075)}' ${solid}/>`
		+ `<path d='M${n(cx)} ${n(cy + r * 0.33)} V${n(cy + r * 0.42)}' ${thin}/>`
		+ `<path d='M${n(cx)} ${n(cy + r * 0.42)} Q${n(cx - r * 0.13)} ${n(cy + r * 0.52)} ${n(cx - r * 0.24)} ${n(cy + r * 0.42)}' ${thin}/>`
		+ `<path d='M${n(cx)} ${n(cy + r * 0.42)} Q${n(cx + r * 0.13)} ${n(cy + r * 0.52)} ${n(cx + r * 0.24)} ${n(cy + r * 0.42)}' ${thin}/>`
		+ `<circle cx='${n(cx - r * 0.66)}' cy='${n(cy + r * 0.14)}' r='${n(r * 0.03)}' ${solid}/>`
		+ `<circle cx='${n(cx + r * 0.66)}' cy='${n(cy + r * 0.14)}' r='${n(r * 0.03)}' ${solid}/>`;
	const body = head + ear(-1) + ear(1) + features + tongue;
	return { bgImage: ctx.svgUrl(s, s, body), bgSize: `${s}px ${s}px`, bgPosition: 'center', bgRepeat: 'no-repeat' };
};

/**
 * A cute kitten. The head and ears are ONE silhouette path - a single
 * translucent fill with no seams or overlaps - and the ears are broad and
 * upright so they read as part of the head. Eight frames: the tongue pokes out
 * (with angry brows) and back again, and the eyes blink once.
 */
const kitten: PatternBuilder = (ctx) => {
	const s = atLeast(72, ctx.size * 3.2);
	const f = pose(ctx, 8);
	const cx = s / 2;
	const cy = s * 0.56;
	const r = s * 0.28;
	const dx = r * 0.4;
	const eyeY = cy - r * 0.04;
	const eyeR = r * 0.17;
	const stroke = `stroke='${ctx.pStroke}' stroke-opacity='${ctx.fo(0.95)}' stroke-width='${n(Math.max(1.8, r * 0.11))}' stroke-linecap='round' stroke-linejoin='round' fill='none'`;
	const thin = `stroke='${ctx.pStroke}' stroke-opacity='${ctx.fo(0.7)}' stroke-width='${n(Math.max(1.2, r * 0.055))}' stroke-linecap='round' fill='none'`;
	const solid = `fill='${ctx.pStroke}' fill-opacity='${ctx.fo(1)}'`;
	const headFill = `fill='${ctx.pFill}' fill-opacity='${ctx.fo(0.18)}' stroke='${ctx.pStroke}' stroke-opacity='${ctx.fo(0.95)}' stroke-width='${n(Math.max(1.8, r * 0.1))}' stroke-linejoin='round'`;
	// Head and both ears as one outline: a round head with two broad, outward
	// cat ears on the upper sides, like the classic cat face.
	const lox = cx - r * 0.899;
	const loy = cy - r * 0.438;
	const lix = cx - r * 0.309;
	const liy = cy - r * 0.951;
	const rix = cx + r * 0.309;
	const riy = cy - r * 0.951;
	const rox = cx + r * 0.899;
	const roy = cy - r * 0.438;
	const ltx = cx - r * 0.94;
	const lty = cy - r * 1.24;
	const rtx = cx + r * 0.94;
	const rty = cy - r * 1.24;
	// Round each ear tip with a short quadratic so the ears read soft, not spiky.
	const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
	const rt = 0.74;
	const la1 = `${n(lerp(lox, ltx, rt))} ${n(lerp(loy, lty, rt))}`;
	const la2 = `${n(lerp(ltx, lix, rt))} ${n(lerp(lty, liy, rt))}`;
	const ra1 = `${n(lerp(rix, rtx, rt))} ${n(lerp(riy, rty, rt))}`;
	const ra2 = `${n(lerp(rtx, rox, rt))} ${n(lerp(rty, roy, rt))}`;
	const silhouette =
		`<path d='M${n(lox)} ${n(loy)} L${la1} Q${n(ltx)} ${n(lty)} ${la2} L${n(lix)} ${n(liy)} A${n(r)} ${n(r)} 0 0 1 ${n(rix)} ${n(riy)} L${ra1} Q${n(rtx)} ${n(rty)} ${ra2} L${n(rox)} ${n(roy)} A${n(r)} ${n(r)} 0 1 1 ${n(lox)} ${n(loy)} Z' ${headFill}/>`;
	const innerEar = (side: number): string =>
		`<path d='M${n(cx + side * r * 0.6)} ${n(cy - r * 0.72)} L${n(cx + side * r * 0.78)} ${n(cy - r * 0.96)}' ${thin}/>`;
	const whisker = (side: number): string =>
		`<path d='M${n(cx + side * r * 0.5)} ${n(cy + r * 0.14)} L${n(cx + side * r * 0.94)} ${n(cy + r * 0.04)} M${n(cx + side * r * 0.52)} ${n(cy + r * 0.22)} L${n(cx + side * r * 1.0)} ${n(cy + r * 0.24)} M${n(cx + side * r * 0.5)} ${n(cy + r * 0.3)} L${n(cx + side * r * 0.92)} ${n(cy + r * 0.44)}' ${thin}/>`;
	// Eight frames: the tongue is out (and the brows are angry) on frames 2-5.
	const tongueLens = [0, r * 0.13, r * 0.22, r * 0.3, r * 0.26, r * 0.29, r * 0.17, 0];
	const tongueLen = tongueLens[f] ?? 0;
	const isBlep = f >= 2 && f <= 5;
	const ty = cy + r * 0.44;
	const tongue = tongueLen > 1
		? `<path d='M${n(cx - r * 0.11)} ${n(ty)} q0 ${n(tongueLen)} ${n(r * 0.11)} ${n(tongueLen)} q${n(r * 0.11)} 0 ${n(r * 0.11)} ${n(-tongueLen)}' ${stroke}/>`
			+ `<path d='M${n(cx)} ${n(ty + r * 0.06)} v${n(Math.max(0, tongueLen - r * 0.12))}' ${thin}/>`
		: '';
	const brow = (side: number): string => {
		if (isBlep) {
			// Angry: the inner end drops toward the nose.
			return `<path d='M${n(cx + side * (dx + eyeR * 1.15))} ${n(cy - r * 0.42)} L${n(cx + side * (dx - eyeR * 0.55))} ${n(cy - r * 0.22)}' ${stroke}/>`;
		}
		return `<path d='M${n(cx + side * (dx + eyeR))} ${n(eyeY - r * 0.32)} Q${n(cx + side * dx)} ${n(eyeY - r * 0.46)} ${n(cx + side * (dx - eyeR))} ${n(eyeY - r * 0.32)}' ${thin}/>`;
	};
	const body =
		silhouette
		+ innerEar(-1) + innerEar(1)
		+ whisker(-1) + whisker(1)
		+ brow(-1) + brow(1)
		+ blinkEyes(blink(f, 8), cx, eyeY, dx, eyeR, stroke, solid)
		// Nose, then the classic cat mouth: a short drop from the nose into a "w".
		+ `<path d='M${n(cx - r * 0.1)} ${n(cy + r * 0.14)} L${n(cx + r * 0.1)} ${n(cy + r * 0.14)} L${n(cx)} ${n(cy + r * 0.26)} Z' ${solid}/>`
		+ `<path d='M${n(cx)} ${n(cy + r * 0.26)} V${n(cy + r * 0.34)}' ${thin}/>`
		+ `<path d='M${n(cx - r * 0.28)} ${n(cy + r * 0.32)} Q${n(cx - r * 0.14)} ${n(cy + r * 0.46)} ${n(cx)} ${n(cy + r * 0.32)} Q${n(cx + r * 0.14)} ${n(cy + r * 0.46)} ${n(cx + r * 0.28)} ${n(cy + r * 0.32)}' ${thin}/>`
		+ tongue;
	return { bgImage: ctx.svgUrl(s, s, body), bgSize: `${s}px ${s}px`, bgPosition: 'center', bgRepeat: 'no-repeat' };
};

export const ANIMATED_ANIMAL_PATTERNS: Record<string, PatternBuilder> = {
	'anim-bird': bird,
	'anim-cat': cat,
	'anim-fish': fish,
	'anim-bunny': bunny,
	'anim-wink': wink,
	'anim-puppy': puppy,
	'anim-kitten': kitten,
};
