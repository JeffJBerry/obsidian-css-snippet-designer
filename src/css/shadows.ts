/**
 * Box/text shadow composition and keyframe animation generation.
 */
import type { ShadowElementConfig } from '../schema';
import { hexToRgba, parsePx } from './color';

export function computeShadowString(
	id: string,
	tokenMap: Map<string, string>,
	kind: 'text' | 'box',
	phase: 'base' | 'pulse' | 'deep' | 'flicker' | 'shimmer-left' | 'shimmer-right' | 'swap' = 'base'
): string {
	const isEnabled = tokenMap.get(`--sh-${id}-enabled`) === 'true';
	if (!isEnabled) return 'none';

	const baseX = parsePx(tokenMap.get(`--sh-${id}-x`), 0);
	const baseY = parsePx(tokenMap.get(`--sh-${id}-y`), 0);
	let baseBlur = parsePx(tokenMap.get(`--sh-${id}-blur`), 10);
	let baseSpread = parsePx(tokenMap.get(`--sh-${id}-spread`), 0);
	const colorHex1 = tokenMap.get(`--sh-${id}-color`) ?? '#7c3aed';
	const colorHex2 = tokenMap.get(`--sh-${id}-gradient-color`) ?? '#ec4899';
	const isGrad = tokenMap.get(`--sh-${id}-gradient-enabled`) === 'true';
	const isOutlineGrad = tokenMap.get(`--sh-${id}-outline-gradient-enabled`) === 'true';
	const isOutlineOn = tokenMap.get(`--sh-${id}-outline-enabled`) === 'true';
	const outlineWidth = parsePx(tokenMap.get(`--sh-${id}-outline-width`), 2);
	const outlineGradCol = tokenMap.get(`--sh-${id}-outline-gradient-color`) ?? '#ec4899';

	let baseOpacity = parseFloat(tokenMap.get(`--sh-${id}-opacity`) ?? '0.4');
	if (isNaN(baseOpacity)) baseOpacity = 0.4;

	let col1 = colorHex1;
	let col2 = colorHex2;
	let x1 = baseX;
	let y1 = baseY;
	let x2 = -baseX;
	let y2 = -baseY;
	let op1 = baseOpacity;
	let op2 = Math.max(0.05, baseOpacity * 0.85);

	if (phase === 'pulse') {
		baseBlur = Math.round(baseBlur * 1.5);
		baseSpread += 3;
		op1 = Math.min(1.0, op1 * 1.3);
		op2 = Math.min(1.0, op2 * 1.3);
	} else if (phase === 'deep') {
		baseBlur = Math.round(baseBlur * 2.2);
		baseSpread += 5;
		op1 = Math.min(1.0, op1 * 1.4);
		op2 = Math.min(1.0, op2 * 1.4);
	} else if (phase === 'flicker') {
		baseBlur = Math.max(1, Math.round(baseBlur * 0.4));
		baseSpread = Math.max(0, baseSpread - 1);
		op1 = Math.max(0.05, op1 * 0.25);
		op2 = Math.max(0.05, op2 * 0.25);
	} else if (phase === 'shimmer-left') {
		x1 = -Math.max(4, Math.round(baseBlur * 0.8));
		x2 = Math.max(4, Math.round(baseBlur * 0.8));
		baseBlur = Math.round(baseBlur * 1.2);
	} else if (phase === 'shimmer-right') {
		x1 = Math.max(4, Math.round(baseBlur * 0.8));
		x2 = -Math.max(4, Math.round(baseBlur * 0.8));
		baseBlur = Math.round(baseBlur * 1.4);
		op1 = Math.min(1.0, op1 * 1.2);
		op2 = Math.min(1.0, op2 * 1.2);
	} else if (phase === 'swap') {
		col1 = colorHex2;
		col2 = colorHex1;
	}

	const rgba1 = hexToRgba(col1, op1);
	const rgba2 = hexToRgba(col2, op2);

	const mode = tokenMap.get(`--sh-${id}-mode`) ?? 'shadow';
	const isGlow = mode === 'glow' || (baseX === 0 && baseY === 0);

	const shadowParts: string[] = [];

	if (kind === 'text') {
		if (isGlow) {
			// CSS text-shadow lacks a 'spread' radius property.
			// A single blur layer dilutes significantly at glyph boundaries.
			// Build a 4-tier concentric text glow:
			// 1. Core: tight, saturated inner glow hugging the letter stroke
			// 2. Mid: body glow providing volume and intensity
			// 3. Halo: primary aura matching the configured blur radius
			// 4. Bloom: diffuse ambient atmospheric bloom
			const coreBlur = baseBlur === 0 ? 0 : Math.max(1, Math.round(baseBlur * 0.15));
			const midBlur = baseBlur === 0 ? 0 : Math.max(2, Math.round(baseBlur * 0.45));
			const bloomBlur = baseBlur === 0 ? 0 : Math.round(baseBlur * 1.8);

			if (isGrad) {
				const coreRgba = hexToRgba(col1, Math.min(1.0, op1 * 1.3));
				const midRgba = hexToRgba(col1, op1);
				const haloRgba = hexToRgba(col2, Math.max(0.05, op2 * 0.85));
				const bloomRgba = hexToRgba(col2, Math.max(0.05, op2 * 0.45));

				shadowParts.push(`${x1}px ${y1}px ${coreBlur}px ${coreRgba}`);
				shadowParts.push(`${x1}px ${y1}px ${midBlur}px ${midRgba}`);
				shadowParts.push(`${x1}px ${y1}px ${baseBlur}px ${haloRgba}`);
				shadowParts.push(`${x1}px ${y1}px ${bloomBlur}px ${bloomRgba}`);
			} else {
				const coreRgba = hexToRgba(col1, Math.min(1.0, op1 * 1.3));
				const midRgba = hexToRgba(col1, op1);
				const haloRgba = hexToRgba(col1, Math.max(0.05, op1 * 0.75));
				const bloomRgba = hexToRgba(col1, Math.max(0.05, op1 * 0.4));

				shadowParts.push(`${x1}px ${y1}px ${coreBlur}px ${coreRgba}`);
				shadowParts.push(`${x1}px ${y1}px ${midBlur}px ${midRgba}`);
				shadowParts.push(`${x1}px ${y1}px ${baseBlur}px ${haloRgba}`);
				shadowParts.push(`${x1}px ${y1}px ${bloomBlur}px ${bloomRgba}`);
			}
		} else {
			shadowParts.push(`${x1}px ${y1}px ${baseBlur}px ${rgba1}`);
			if (isGrad) {
				const blur2 = Math.round(baseBlur * 1.3);
				const offset2X = x2 === 0 ? 3 : x2;
				const offset2Y = y2 === 0 ? -3 : y2;
				shadowParts.push(`${offset2X}px ${offset2Y}px ${blur2}px ${rgba2}`);
			}
		}
	} else {
		if (isGlow) {
			const blur2 = Math.round(baseBlur * 1.6);
			const spread2 = baseSpread + 2;
			shadowParts.push(`${x1}px ${y1}px ${baseBlur}px ${baseSpread}px ${rgba1}`);
			if (isGrad) {
				shadowParts.push(`${x1}px ${y1}px ${blur2}px ${spread2}px ${rgba2}`);
			} else {
				const bloomRgba = hexToRgba(col1, Math.max(0.05, op1 * 0.4));
				shadowParts.push(`${x1}px ${y1}px ${blur2}px ${spread2}px ${bloomRgba}`);
			}
		} else {
			shadowParts.push(`${x1}px ${y1}px ${baseBlur}px ${baseSpread}px ${rgba1}`);
			if (isGrad) {
				const blur2 = Math.round(baseBlur * 1.3);
				const offset2X = x2 === 0 ? 3 : x2;
				const offset2Y = y2 === 0 ? -3 : y2;
				shadowParts.push(`${offset2X}px ${offset2Y}px ${blur2}px ${baseSpread}px ${rgba2}`);
			}
		}
	}

	if (kind === 'box' && isOutlineOn && isOutlineGrad && outlineWidth > 0) {
		const outlineRgba2 = hexToRgba(outlineGradCol, Math.min(1.0, op1 * 0.9));
		shadowParts.push(`0px 0px 0px ${outlineWidth + 1}px ${outlineRgba2}`);
	}

	return shadowParts.join(', ');
}

export function generateKeyframeBlock(
	el: ShadowElementConfig,
	tokenMap: Map<string, string>,
	scopeKey: string
): { keyframeName: string; css: string; hint: string; timingFunction?: string } | null {
	const isEnabled = tokenMap.get(`--sh-${el.id}-enabled`) === 'true';
	if (!isEnabled) return null;

	const animStyle = tokenMap.get(`--sh-${el.id}-anim-style`) ?? 'none';
	const gradientAnim = tokenMap.get(`--sh-${el.id}-gradient-anim`) === 'true';
	const isGrad = tokenMap.get(`--sh-${el.id}-gradient-enabled`) === 'true';
	const isOutlineOn = tokenMap.get(`--sh-${el.id}-outline-enabled`) === 'true';
	const outlineWidth = parsePx(tokenMap.get(`--sh-${el.id}-outline-width`), 2);
	const outlineColor = tokenMap.get(`--sh-${el.id}-outline-color`) ?? '#7c3aed';
	const isOutlineGrad = tokenMap.get(`--sh-${el.id}-outline-gradient-enabled`) === 'true';
	const defaultOutGradCol = scopeKey === 'themedark' ? (el.defaultOutlineGradientColorDark ?? '#06b6d4') : (el.defaultOutlineGradientColorLight ?? '#0891b2');
	const outlineGradCol = tokenMap.get(`--sh-${el.id}-outline-gradient-color`) ?? defaultOutGradCol;

	if (animStyle === 'none' && !gradientAnim) {
		return null;
	}

	const keyframeName = `sh-anim-${el.id}-${scopeKey}`;
	const isText = el.kind === 'text';
	const shadowProp = isText ? 'text-shadow' : 'box-shadow';

	const shadowBase = computeShadowString(el.id, tokenMap, el.kind, 'base');
	const shadowPulse = computeShadowString(el.id, tokenMap, el.kind, 'pulse');
	const shadowDeep = computeShadowString(el.id, tokenMap, el.kind, 'deep');
	const shadowFlicker = computeShadowString(el.id, tokenMap, el.kind, 'flicker');
	const shadowShimmerL = computeShadowString(el.id, tokenMap, el.kind, 'shimmer-left');
	const shadowShimmerR = computeShadowString(el.id, tokenMap, el.kind, 'shimmer-right');
	const shadowSwap = isGrad ? computeShadowString(el.id, tokenMap, el.kind, 'swap') : shadowPulse;

	let outBase = '';
	let outPulse = '';
	let outDeep = '';
	let outFlicker = '';
	let outSwap = '';

	if (isOutlineOn && outlineWidth > 0) {
		const pulseColor = isOutlineGrad ? outlineGradCol : outlineColor;
		if (!isText) {
			outBase = `outline: ${outlineWidth}px solid ${outlineColor};\n    outline-offset: -1px;`;
			outPulse = `outline: ${outlineWidth}px solid ${pulseColor};\n    outline-offset: -1px;`;
			outDeep = `outline: ${outlineWidth}px solid ${pulseColor};\n    outline-offset: -1px;`;
			outFlicker = `outline: ${outlineWidth}px solid ${hexToRgba(pulseColor, 0.3)};\n    outline-offset: -1px;`;
			outSwap = `outline: ${outlineWidth}px solid ${isOutlineGrad ? outlineColor : pulseColor};\n    outline-offset: -1px;`;
		} else {
			outBase = `-webkit-text-stroke: ${outlineWidth}px ${outlineColor};`;
			outPulse = `-webkit-text-stroke: ${outlineWidth}px ${pulseColor};`;
			outDeep = `-webkit-text-stroke: ${outlineWidth}px ${pulseColor};`;
			outFlicker = `-webkit-text-stroke: ${outlineWidth}px ${hexToRgba(pulseColor, 0.3)};`;
			outSwap = `-webkit-text-stroke: ${outlineWidth}px ${isOutlineGrad ? outlineColor : pulseColor};`;
		}
	}

	let keyframeContent = '';
	let timingFunction: string | undefined = undefined;
	const effectiveStyle = animStyle === 'none' ? 'aurora' : animStyle;

	switch (effectiveStyle) {
		case 'pulse': {
			const midShadow = gradientAnim && isGrad ? shadowSwap : shadowPulse;
			keyframeContent = `
  0%, 100% {
    ${shadowProp}: ${shadowBase};
    ${outBase}
  }
  50% {
    ${shadowProp}: ${midShadow};
    ${outPulse}
  }`;
			break;
		}
		case 'breathe': {
			const midShadow = gradientAnim && isGrad ? shadowSwap : shadowDeep;
			keyframeContent = `
  0%, 100% {
    ${shadowProp}: ${shadowBase};
    ${outBase}
  }
  50% {
    ${shadowProp}: ${midShadow};
    ${outDeep}
  }`;
			break;
		}
		case 'neon': {
			keyframeContent = `
  0%, 19%, 21%, 23%, 25%, 54%, 56%, 100% {
    ${shadowProp}: ${shadowBase};
    ${outBase}
  }
  20%, 24%, 55% {
    ${shadowProp}: ${shadowFlicker};
    ${outFlicker}
  }`;
			break;
		}
		case 'shimmer': {
			keyframeContent = `
  0% {
    ${shadowProp}: ${shadowShimmerL};
    ${outBase}
  }
  50% {
    ${shadowProp}: ${shadowShimmerR};
    ${outPulse}
  }
  100% {
    ${shadowProp}: ${shadowShimmerL};
    ${outBase}
  }`;
			break;
		}
		case 'aurora': {
			keyframeContent = `
  0%, 100% {
    ${shadowProp}: ${shadowBase};
    ${outBase}
  }
  33% {
    ${shadowProp}: ${shadowPulse};
    ${outPulse}
  }
  66% {
    ${shadowProp}: ${shadowSwap};
    ${outSwap}
  }`;
			break;
		}
		case 'heartbeat': {
			keyframeContent = `
  0%, 28%, 70%, 100% {
    ${shadowProp}: ${shadowBase};
    ${outBase}
  }
  14% {
    ${shadowProp}: ${shadowPulse};
    ${outPulse}
  }
  42% {
    ${shadowProp}: ${shadowDeep};
    ${outDeep}
  }`;
			break;
		}
		case 'float': {
			const canTranslate = el.id === 'headings' || el.id === 'callouts' || el.id === 'codeblocks';
			if (canTranslate) {
				keyframeContent = `
  0%, 100% {
    transform: translate3d(0, 0, 0);
  }
  50% {
    transform: translate3d(0, -4px, 0);
  }`;
			} else {
				keyframeContent = `
  0%, 100% {
    ${shadowProp}: ${shadowBase};
    ${outBase}
  }
  50% {
    ${shadowProp}: ${shadowPulse};
    ${outPulse}
  }`;
			}
			break;
		}
		case 'outline-pulse': {
			const pulseColor = isOutlineGrad ? outlineGradCol : outlineColor;
			if (isOutlineOn && !isText) {
				keyframeContent = `
  0%, 100% {
    outline: ${outlineWidth}px solid ${outlineColor};
    outline-offset: -1px;
    ${shadowProp}: ${shadowBase};
  }
  50% {
    outline: ${outlineWidth + 3}px solid ${pulseColor};
    outline-offset: 2px;
    ${shadowProp}: ${shadowPulse};
  }`;
			} else if (isOutlineOn && isText) {
				keyframeContent = `
  0%, 100% {
    -webkit-text-stroke: ${outlineWidth}px ${outlineColor};
    ${shadowProp}: ${shadowBase};
  }
  50% {
    -webkit-text-stroke: ${outlineWidth + 2}px ${pulseColor};
    ${shadowProp}: ${shadowPulse};
  }`;
			} else {
				keyframeContent = `
  0%, 100% {
    ${shadowProp}: ${shadowBase};
  }
  50% {
    ${shadowProp}: ${shadowDeep};
  }`;
			}
			break;
		}
		case 'color-cycle': {
			keyframeContent = `
  0% {
    filter: hue-rotate(0deg);
  }
  100% {
    filter: hue-rotate(360deg);
  }`;
			break;
		}
		case 'loading-spin': {
			timingFunction = 'linear';
			const animAreaStr = tokenMap.get(`--sh-${el.id}-anim-area`) ?? '35%';
			const parsedArea = parseFloat(animAreaStr.replace('%', ''));
			const areaPercent = isNaN(parsedArea) ? 35 : Math.max(10, Math.min(100, parsedArea));
			const arcSpan = (areaPercent / 100) * 2 * Math.PI;

			const baseX = parsePx(tokenMap.get(`--sh-${el.id}-x`), 0);
			const baseY = parsePx(tokenMap.get(`--sh-${el.id}-y`), 0);
			const baseBlur = parsePx(tokenMap.get(`--sh-${el.id}-blur`), 10);
			const baseSpread = parsePx(tokenMap.get(`--sh-${el.id}-spread`), 0);
			const colorHex1 = tokenMap.get(`--sh-${el.id}-color`) ?? '#7c3aed';
			const colorHex2 = tokenMap.get(`--sh-${el.id}-gradient-color`) ?? '#ec4899';
			let baseOpacity = parseFloat(tokenMap.get(`--sh-${el.id}-opacity`) ?? '0.4');
			if (isNaN(baseOpacity)) baseOpacity = 0.4;

			const offsetMag = Math.round(Math.sqrt(baseX * baseX + baseY * baseY));
			const radius = Math.max(offsetMag, Math.round(baseBlur * 0.75 + baseSpread), 8);

			const steps = 16;
			const frames: string[] = [];

			for (let k = 0; k <= steps; k++) {
				const pct = (k / steps) * 100;
				const theta = (k / steps) * 2 * Math.PI;

				const angles = [
					theta,
					theta - arcSpan * 0.45,
					theta - arcSpan * 0.85,
				];

				const shadowParts: string[] = [];

				for (const [s, ang] of angles.entries()) {
					const sx = Math.round(radius * Math.sin(ang) * 10) / 10;
					const sy = Math.round(-radius * Math.cos(ang) * 10) / 10;

					let col = colorHex1;
					let op = baseOpacity;
					let bl = baseBlur;
					let sp = baseSpread;

					if (s === 0) {
						col = colorHex1;
						op = Math.min(1.0, baseOpacity * 1.35);
						bl = Math.max(2, Math.round(baseBlur * 0.8));
						sp = baseSpread + 2;
					} else if (s === 1) {
						col = isGrad ? colorHex2 : colorHex1;
						op = Math.max(0.05, baseOpacity * 0.8);
						bl = Math.round(baseBlur * 1.3);
						sp = baseSpread + 1;
					} else {
						col = isGrad ? colorHex2 : colorHex1;
						op = Math.max(0.02, baseOpacity * 0.3);
						bl = Math.round(baseBlur * 1.8);
						sp = Math.max(0, baseSpread);
					}

					const rgba = hexToRgba(col, op);
					if (isText) {
						shadowParts.push(`${sx}px ${sy}px ${bl}px ${rgba}`);
					} else {
						shadowParts.push(`${sx}px ${sy}px ${bl}px ${sp}px ${rgba}`);
					}
				}

				const formattedPct = Number(pct.toFixed(2)).toString();
				const outRule = outBase ? `\n    ${outBase}` : '';
				frames.push(`  ${formattedPct}% {\n    ${shadowProp}: ${shadowParts.join(', ')};${outRule}\n  }`);
			}

			keyframeContent = '\n' + frames.join('\n');
			break;
		}
		default:
			return null;
	}

	// A `will-change` hint only earns its keep where the animated property is one
	// the compositor can actually take over. `color-cycle` animates a filter and
	// `float` a transform, so both are worth promoting; the rest animate shadow
	// and outline, which repaint either way, and promoting them would burn video
	// memory on every heading in a long note for nothing.
	let hint = '';
	if (animStyle === 'color-cycle') {
		hint = 'filter';
	} else if (animStyle === 'float' && (el.id === 'headings' || el.id === 'callouts' || el.id === 'codeblocks')) {
		hint = 'transform';
	}

	const css = `@keyframes ${keyframeName} {${keyframeContent}\n}`;
	return { keyframeName, css, hint, timingFunction };
}
