/**
 * Generators for UI chrome opacity and custom background CSS.
 *
 * These take an explicit `ThemeTokenState` rather than the view, so they stay
 * unit-testable without constructing an Obsidian workspace.
 */
import { UI_ELEMENTS, ANIMATED_PATTERN_STYLES } from '../schema';
import type { StyleControl } from '../schema';
import { getBackgroundPatternCss } from './background';
import { parseColorDetails } from './color';
import type { PatternResult } from './patterns/types';
import { scopeSelectors, splitSelectorList } from './selectors';

/** The four token maps the view holds; passed structurally. */
export interface ThemeTokenState {
	darkTokens: Map<string, string>;
	lightTokens: Map<string, string>;
	darkEnabled: Map<string, boolean>;
	lightEnabled: Map<string, boolean>;
}

/**
 * Vertical travel for one cycle of the rain animation.
 *
 * The loop has to land on a whole number of tiles or the pattern visibly jumps
 * when the keyframe restarts, so the distance is derived from the tile's own
 * height rather than a fixed value. Patterns sized in percentages or `auto`
 * have no tile height to snap to and keep the old constant.
 */
function rainScrollDistance(bgSize: string): number {
	const vertical = bgSize.trim().split(/\s+/)[1] ?? '';
	const match = /^([\d.]+)px$/.exec(vertical);
	const tile = match ? parseFloat(match[1] ?? '') : NaN;
	if (!isFinite(tile) || tile <= 0) return 800;
	return Math.max(1, Math.round(600 / tile)) * tile;
}

/**
 * Horizontal travel for one cycle of a horizontal scroll animation.
 *
 * Snaps to a whole number of tiles based on width so the pattern loops
 * seamlessly - a partial tile would visibly jump when the keyframe restarts.
 */
function horizontalScrollDistance(bgSize: string): number {
	const horizontal = bgSize.trim().split(/\s+/)[0] ?? '';
	const match = /^([\d.]+)px$/.exec(horizontal);
	const tile = match ? parseFloat(match[1] ?? '') : NaN;
	if (!isFinite(tile) || tile <= 0) return 800;
	return Math.max(1, Math.round(600 / tile)) * tile;
}

/**
 * Whether a pattern's `background-size` is expressed in px on both axes.
 *
 * The animated modes slide their layer with a `transform`, which means the
 * overlay has to be drawn larger than the leaf so the translation never
 * exposes what is behind it. Growing the box rescales a tile sized in
 * percentages, so only px-sized patterns can take that path.
 */
function hasPxTile(bgSize: string): boolean {
	const parts = bgSize.trim().split(/\s+/);
	const px = /^([\d.]+)px$/;
	const mx = px.exec(parts[0] ?? '');
	const my = px.exec(parts[1] ?? parts[0] ?? '');
	if (!mx || !my) return false;
	const x = parseFloat(mx[1] ?? '');
	const y = parseFloat(my[1] ?? '');
	return isFinite(x) && isFinite(y) && x > 0 && y > 0;
}

/**
 * The pre-transform path: paint the animated pattern straight onto the scroll
 * container. Only reached by patterns `hasPxTile` rejects.
 */
interface PaintOverlay {
	image: string;
	size: string;
	repeat: string;
	position?: string;
	/** Per-layer `background-blend-mode` list, only when a layer needs one. */
	blend?: string;
}

/**
 * Compose several background layers, top-most first, into one `PaintOverlay`.
 * Returns `undefined` for a single layer so callers keep the plain
 * `pattern.bgImage` path untouched.
 */
function composeBackground(
	layers: { image: string; size: string; repeat: string; position?: string; blend?: string }[],
): PaintOverlay | undefined {
	if (layers.length <= 1) return undefined;
	const overlay: PaintOverlay = {
		image: layers.map((l) => l.image).join(', '),
		size: layers.map((l) => l.size).join(', '),
		repeat: layers.map((l) => l.repeat).join(', '),
	};
	if (layers.some((l) => l.position)) {
		overlay.position = layers.map((l) => l.position ?? '0 0').join(', ');
	}
	if (layers.some((l) => l.blend && l.blend !== 'normal')) {
		overlay.blend = layers.map((l) => l.blend ?? 'normal').join(', ');
	}
	return overlay;
}

function directPaintRule(
	selectors: string,
	pattern: PatternResult,
	animSpec: string,
	staticFilter: string = '',
	overlay?: PaintOverlay,
	baseDecl: string = '',
	baseImage: string = '',
): string {
	const repeat = pattern.bgRepeat ?? 'repeat';
	let out = `${selectors} {\n`;
	out += `  background-image: ${overlay ? overlay.image : (baseImage || pattern.bgImage)} !important;\n`;
	out += `  background-size: ${overlay ? overlay.size : pattern.bgSize} !important;\n`;
	out += `  background-repeat: ${overlay ? overlay.repeat : repeat} !important;\n`;
	out += baseDecl;
	if (overlay) {
		if (overlay.blend) {
			out += `  background-blend-mode: ${overlay.blend} !important;\n`;
		}
		if (overlay.position) {
			out += `  background-position: ${overlay.position} !important;\n`;
		}
	} else if (pattern.bgPosition) {
		out += `  background-position: ${pattern.bgPosition} !important;\n`;
	}
	out += `  animation: ${animSpec} !important;\n`;
	if (pattern.bgAttachment) {
		out += `  background-attachment: ${overlay ? `scroll, ${pattern.bgAttachment}` : pattern.bgAttachment} !important;\n`;
	}
	if (staticFilter) {
		out += `  filter: ${staticFilter} !important;\n`;
	}
	out += `}\n`;
	return out;
}

/** Clone a token state, applying overrides to both mode maps. */
function withTokenOverrides(
	state: ThemeTokenState,
	overrides: Record<string, string>,
): ThemeTokenState {
	const darkTokens = new Map(state.darkTokens);
	const lightTokens = new Map(state.lightTokens);
	for (const [key, value] of Object.entries(overrides)) {
		darkTokens.set(key, value);
		lightTokens.set(key, value);
	}
	return { darkTokens, lightTokens, darkEnabled: state.darkEnabled, lightEnabled: state.lightEnabled };
}

/**
 * Render the Custom Backgrounds pattern and the Animated Pattern Style.
 *
 * The two are fully independent: the flipbook has its own Area, size, opacity,
 * colour, gradient and motion/colour animations. When both share the same Area
 * the flipbook rides on top of the pattern as an extra background layer; when
 * it names a different Area it is rendered by a second, self-contained pass.
 */
export function generateCustomBackgroundCss(
	mode: '.theme-dark' | '.theme-light',
	state: ThemeTokenState,
	animatedSelectors?: string[],
): string {
	const tokenMap = mode === '.theme-dark' ? state.darkTokens : state.lightTokens;
	const baseEnabled = tokenMap.get('--ui-bg-enabled') === 'true';

	const scope = tokenMap.get('--ui-bg-scope') ?? 'editor';
	const flipbookId = tokenMap.get('--ui-bg-flipbook') ?? 'none';
	const flipbookEnabled = (tokenMap.get('--ui-bg-flipbook-enabled') ?? 'true') !== 'false';
	const flipbookScope = tokenMap.get('--ui-bg-flipbook-scope') ?? scope;
	const flipbookActive = flipbookId !== 'none' && flipbookEnabled;
	// Whenever the base background is on, the flipbook is composed onto it as the
	// TOP background layer, so both render and the animation sits IN FRONT of the
	// pattern - even when their Areas differ, which otherwise let a second
	// flipbook pass overwrite the pattern where the two overlapped. Only with the
	// base switched off does the flipbook fall back to its own Area.
	const composeFlipbook = flipbookActive && baseEnabled;

	let css = '';
	if (baseEnabled) {
		// The base pass only reads `--ui-bg-flipbook` when it composes the
		// flipbook, so the override matters only when it actually changes the
		// value. Skipping the clone otherwise keeps the token maps from being
		// copied on every rebuild (they run on a live-preview cadence).
		const overrideFlipbook = composeFlipbook ? flipbookId : 'none';
		const patternState = (tokenMap.get('--ui-bg-flipbook') ?? 'none') === overrideFlipbook
			? state
			: withTokenOverrides(state, { '--ui-bg-flipbook': overrideFlipbook });
		css += generateBackgroundPass(mode, patternState, animatedSelectors, false, composeFlipbook);
	}
	if (flipbookActive && !composeFlipbook) {
		const flipbookState = withTokenOverrides(state, {
			'--ui-bg-enabled': 'true',
			'--ui-bg-scope': flipbookScope,
			// The flipbook is a pure frame swap; it does not borrow the base
			// pattern's motion/colour effects.
			'--ui-bg-motion-animation': 'none',
			'--ui-bg-color-animation': 'none',
			'--ui-bg-animation-speed': tokenMap.get('--ui-bg-flipbook-speed') ?? '1',
		});
		css += generateBackgroundPass(mode, flipbookState, animatedSelectors, true, false);
	}
	return css;
}

function generateBackgroundPass(
	mode: '.theme-dark' | '.theme-light',
	state: ThemeTokenState,
	animatedSelectors: string[] | undefined,
	asFlipbook: boolean,
	composeFlipbook: boolean,
): string {
	const tokenMap = mode === '.theme-dark' ? state.darkTokens : state.lightTokens;
	const isEnabled = tokenMap.get('--ui-bg-enabled') === 'true';
	if (!isEnabled) return '';

	const style = tokenMap.get('--ui-bg-style') ?? 'dot-grid';
	const scope = tokenMap.get('--ui-bg-scope') ?? 'editor';
	const size = parseInt(tokenMap.get('--ui-bg-size') ?? '24px', 10) || 24;
	const opacity = parseFloat(tokenMap.get('--ui-bg-opacity') ?? '0.35');
	const isDark = mode === '.theme-dark';
	const defaultColor = isDark ? '#ffffff' : '#000000';
	const defaultColor2 = isDark ? '#a855f7' : '#9333ea';
	const color1 = tokenMap.get('--ui-bg-color') ?? defaultColor;
	const isGradient = tokenMap.get('--ui-bg-gradient') === 'true';
	const color2 = tokenMap.get('--ui-bg-color-2') ?? defaultColor2;
	const angleRaw = tokenMap.get('--ui-bg-gradient-angle') ?? '135deg';
	const gradAngle = parseInt(angleRaw, 10) || 135;
	const MOTION_ANIMATIONS = new Set(['rain-scroll', 'horizontal-rain-scroll', 'side-scroll', 'rotate-cw', 'rotate-ccw', 'drift', 'pulse']);
	const COLOR_ANIMATIONS = new Set(['rainbow-cycle', 'gradient-rotate', 'gradient-shift', 'neon-glow']);

	let motionAnim = tokenMap.get('--ui-bg-motion-animation');
	let colorAnim = tokenMap.get('--ui-bg-color-animation');

	if (!motionAnim && !colorAnim) {
		const legacy = tokenMap.get('--ui-bg-animation') ?? (tokenMap.get('--ui-bg-animate') === 'true' ? 'rainbow-cycle' : 'none');
		if (MOTION_ANIMATIONS.has(legacy)) {
			motionAnim = legacy;
			colorAnim = 'none';
		} else if (COLOR_ANIMATIONS.has(legacy)) {
			motionAnim = 'none';
			colorAnim = legacy;
		} else {
			motionAnim = 'none';
			colorAnim = 'none';
		}
	} else {
		if (!motionAnim) {
			const legacy = tokenMap.get('--ui-bg-animation');
			motionAnim = (legacy && MOTION_ANIMATIONS.has(legacy)) ? legacy : 'none';
		}
		if (!colorAnim) {
			const legacy = tokenMap.get('--ui-bg-animation');
			colorAnim = (legacy && COLOR_ANIMATIONS.has(legacy)) ? legacy : 'none';
		}
	}

	if (!motionAnim || !MOTION_ANIMATIONS.has(motionAnim)) motionAnim = 'none';
	if (!colorAnim || !COLOR_ANIMATIONS.has(colorAnim)) colorAnim = 'none';

	// The flipbook owns its own appearance tokens, so it never borrows the base
	// pattern's size, opacity, colour or gradient.
	const flipbookId = tokenMap.get('--ui-bg-flipbook') ?? 'none';
	const flipbook = ANIMATED_PATTERN_STYLES.find((s) => s.id === flipbookId) ?? null;
	const flipbookEnabled = (tokenMap.get('--ui-bg-flipbook-enabled') ?? 'true') !== 'false';
	const flipbookSize = parseInt(tokenMap.get('--ui-bg-flipbook-size') ?? `${size}px`, 10) || size;
	const flipOpacityRaw = parseFloat(tokenMap.get('--ui-bg-flipbook-opacity') ?? '');
	const flipbookOpacity = isFinite(flipOpacityRaw) ? flipOpacityRaw : opacity;
	const flipbookColor1 = tokenMap.get('--ui-bg-flipbook-color') ?? color1;
	const flipbookGradient = (tokenMap.get('--ui-bg-flipbook-gradient') ?? (isGradient ? 'true' : 'false')) === 'true';
	const flipbookColor2 = tokenMap.get('--ui-bg-flipbook-color-2') ?? color2;
	const flipbookAngle = parseInt(tokenMap.get('--ui-bg-flipbook-gradient-angle') ?? `${gradAngle}deg`, 10) || gradAngle;
	const flipbookFrames = flipbook
		? flipbook.frames.map((frame) =>
				getBackgroundPatternCss(frame.style, flipbookSize, flipbookOpacity, flipbookColor1, isDark, flipbookGradient, flipbookColor2, 'none', flipbookAngle, frame.frame),
			)
		: [];
	// X/Y offset nudges the whole animated layer FROM THE CENTRE of its pane, in
	// viewport units so it can be pushed right across the page on any screen.
	const flipOffsetX = parseFloat(tokenMap.get('--ui-bg-flipbook-offset-x') ?? '0') || 0;
	const flipOffsetY = parseFloat(tokenMap.get('--ui-bg-flipbook-offset-y') ?? '0') || 0;
	const offsetTerm = (v: number, unit: string): string => (v < 0 ? `- ${Math.abs(v)}${unit}` : `+ ${v}${unit}`);
	const flipbookOffset = flipOffsetX !== 0 || flipOffsetY !== 0
		? `calc(50% ${offsetTerm(flipOffsetX, 'vw')}) calc(50% ${offsetTerm(flipOffsetY, 'vh')})`
		: '';

	// Animation speed is a multiplier over each keyframe's base duration, so one
	// slider retimes every mode. Absent or malformed tokens fall back to 1x.
	const rawSpeed = parseFloat(tokenMap.get('--ui-bg-animation-speed') ?? '1');
	const animSpeed = isFinite(rawSpeed) && rawSpeed > 0 ? Math.min(10, Math.max(0.1, rawSpeed)) : 1;
	const dur = (base: number): string => `${Math.round((base / animSpeed) * 100) / 100}s`;
	// The flipbook has its own speed so its frame rate can be tuned without
	// retiming the pattern's motion/colour effects.
	const rawFlipSpeed = parseFloat(tokenMap.get('--ui-bg-flipbook-speed') ?? '1');
	const flipSpeed = isFinite(rawFlipSpeed) && rawFlipSpeed > 0 ? Math.min(10, Math.max(0.1, rawFlipSpeed)) : 1;
	const flipDur = (base: number): string => `${Math.round((base / flipSpeed) * 100) / 100}s`;

	const svgAnimMode = colorAnim !== 'none' ? colorAnim : (motionAnim === 'pulse' ? 'pulse' : 'none');
	// In an asFlipbook pass the frame sequence IS this pass's background: the
	// base "pattern" is the first frame and the painted image is the animated
	// custom property.
	const pattern = asFlipbook && flipbookFrames[0]
		? flipbookFrames[0]
		: getBackgroundPatternCss(style, size, opacity, color1, isDark, isGradient, color2, svgAnimMode, gradAngle);
	const repeat = pattern.bgRepeat ?? 'repeat';
	const paintImage = asFlipbook ? 'var(--css-bg-flip)' : pattern.bgImage;
	// The offset shifts the frame sequence when it is this pass's own background.
	if (asFlipbook && flipbookOffset) {
		pattern.bgPosition = flipbookOffset;
	}

	// The flipbook frame image is carried by a registered custom property so the
	// paint rule can keep its `!important` and still be driven by the animation.
	// Its keyframes are emitted here, ahead of every paint path.
	const shouldUseFlipbook = Boolean(flipbookFrames[0]) && (asFlipbook || (composeFlipbook && flipbook !== null && flipbookEnabled));
	const flipbookLayer = composeFlipbook && flipbook && flipbookEnabled && flipbookFrames[0]
		? {
				image: 'var(--css-bg-flip)',
				size: flipbookFrames[0].bgSize,
				repeat: flipbookFrames[0].bgRepeat ?? 'repeat',
				position: flipbookOffset || flipbookFrames[0].bgPosition || undefined,
			}
		: null;
	let flipbookKeyframes = '';
	let flipbookAnimSpec = '';
	if (shouldUseFlipbook && flipbookFrames.length > 1) {
		const frameCount = flipbookFrames.length;
		const stops = flipbookFrames
			.map((frame, i) => `  ${Math.round((i / frameCount) * 100)}% { --css-bg-flip: ${frame.bgImage}; }`)
			.join('\n');
		flipbookKeyframes += `@property --css-bg-flip {\n  syntax: "<image>";\n  inherits: false;\n  initial-value: linear-gradient(transparent, transparent);\n}\n`;
		flipbookKeyframes += `@keyframes css-bg-flip {\n${stops}\n  100% { --css-bg-flip: ${flipbookFrames[0]!.bgImage}; }\n}\n`;
		// Each style holds its frame for its own slice (0.5s by default, far
		// shorter for a rain effect that needs a real frame rate).
		const frameSeconds = flipbook?.frameSeconds ?? 0.5;
		flipbookAnimSpec = `css-bg-flip ${flipDur(frameSeconds * frameCount)} steps(1, end) infinite`;
	}
	const flipbookBaseDecl = shouldUseFlipbook && flipbookFrames[0] ? `  --css-bg-flip: ${flipbookFrames[0].bgImage};\n` : '';

	// The pattern layer, or - in a flipbook pass - the frame sequence.
	const patternLayer = { image: paintImage, size: pattern.bgSize, repeat, position: pattern.bgPosition };

	// Comprehensive selectors for Editor vs Full Obsidian Workspace across all tabs
	let selectors = '';
	let targetLeaf = '';
	let transparentContent = '';
	let beforeSelectors = '';

	const notUtilityLeaves = ':not([data-type="css-snippet-designer-view"]):not([data-type="file-explorer"]):not([data-type="search"]):not([data-type="bookmarks"]):not([data-type="outline"]):not([data-type="tag"]):not([data-type="backlink"]):not([data-type="outgoing-link"]):not([data-type="all-properties"])';
	const isMinimalism = tokenMap.get('--layout-minimalism') === 'true';

	if (scope === 'workspace') {
		if (isMinimalism) {
			selectors = `${mode}.app-container,\n${mode} .app-container,\n${mode} .empty-state-container,\n${mode} .workspace-leaf-content[data-type="canvas"] .canvas-background,\n${mode} .workspace-leaf-content[data-type="bases"] .bases-view,\n${mode} .workspace-leaf-content[data-type="bases-query"] .bases-view,\n${mode} .workspace-leaf-content[data-type="graph"] .view-content`;

			targetLeaf = `${mode}.app-container,\n${mode} .app-container,\n${mode} .empty-state-container,\n${mode} .workspace-leaf-content[data-type="canvas"],\n${mode} .workspace-leaf-content[data-type="bases"],\n${mode} .workspace-leaf-content[data-type="bases-query"],\n${mode} .workspace-leaf-content[data-type="graph"]`;

			transparentContent = `${mode} .workspace-split.mod-root .workspace-leaf-content${notUtilityLeaves} .view-content,\n${mode} .markdown-source-view.mod-cm6 .cm-scroller,\n${mode} .markdown-preview-view,\n${mode} .workspace-leaf-content[data-type="canvas"] .canvas-wrapper,\n${mode} .workspace-leaf-content[data-type="canvas"] .canvas,\n${mode} .workspace-leaf-content[data-type="bases"] .bases-view,\n${mode} .workspace-leaf-content[data-type="bases-query"] .bases-view,\n${mode} .workspace-leaf-content[data-type="graph"] .view-content,\n${mode} .workspace-leaf-content[data-type="graph"] canvas`;

			beforeSelectors = `${mode}.app-container::before,\n${mode} .app-container::before,\n${mode} .empty-state-container::before,\n${mode} .workspace-leaf-content[data-type="canvas"]::before,\n${mode} .workspace-leaf-content[data-type="bases"]::before,\n${mode} .workspace-leaf-content[data-type="bases-query"]::before,\n${mode} .workspace-leaf-content[data-type="graph"]::before`;
		} else {
			selectors = `${mode} .workspace-split.mod-root .workspace-leaf-content${notUtilityLeaves},\n${mode} .workspace-split.mod-root .workspace-tabs .workspace-leaf-content${notUtilityLeaves},\n${mode} .markdown-source-view.mod-cm6 .cm-scroller,\n${mode} .markdown-preview-view,\n${mode} .workspace-split.mod-root .workspace-tab-container,\n${mode} .empty-state-container,\n${mode} .workspace-leaf-content[data-type="canvas"] .canvas-background,\n${mode} .workspace-leaf-content[data-type="bases"] .bases-view,\n${mode} .workspace-leaf-content[data-type="bases-query"] .bases-view,\n${mode} .workspace-leaf-content[data-type="graph"] .view-content`;

			targetLeaf = `${mode} .workspace-split.mod-root .workspace-leaf-content${notUtilityLeaves},\n${mode} .workspace-split.mod-root .workspace-tabs .workspace-leaf-content${notUtilityLeaves},\n${mode} .empty-state-container,\n${mode} .workspace-leaf-content[data-type="canvas"],\n${mode} .workspace-leaf-content[data-type="bases"],\n${mode} .workspace-leaf-content[data-type="bases-query"],\n${mode} .workspace-leaf-content[data-type="graph"]`;

			transparentContent = `${mode} .workspace-split.mod-root .workspace-leaf-content${notUtilityLeaves} .view-content,\n${mode} .markdown-source-view.mod-cm6 .cm-scroller,\n${mode} .markdown-preview-view,\n${mode} .workspace-leaf-content[data-type="canvas"] .canvas-wrapper,\n${mode} .workspace-leaf-content[data-type="canvas"] .canvas,\n${mode} .workspace-leaf-content[data-type="bases"] .bases-view,\n${mode} .workspace-leaf-content[data-type="bases-query"] .bases-view,\n${mode} .workspace-leaf-content[data-type="graph"] .view-content,\n${mode} .workspace-leaf-content[data-type="graph"] canvas`;

			beforeSelectors = `${mode} .workspace-split.mod-root .workspace-leaf-content${notUtilityLeaves}::before,\n${mode} .workspace-split.mod-root .workspace-tabs .workspace-leaf-content${notUtilityLeaves}::before,\n${mode} .empty-state-container::before,\n${mode} .workspace-leaf-content[data-type="canvas"]::before,\n${mode} .workspace-leaf-content[data-type="bases"]::before,\n${mode} .workspace-leaf-content[data-type="bases-query"]::before,\n${mode} .workspace-leaf-content[data-type="graph"]::before`;
		}
	} else {
		selectors = `${mode} .workspace-leaf-content[data-type="markdown"] .view-content,\n${mode} .markdown-source-view.mod-cm6 .cm-scroller,\n${mode} .markdown-preview-view,\n${mode} .workspace-leaf-content[data-type="canvas"] .canvas-background,\n${mode} .workspace-leaf-content[data-type="bases"] .bases-view,\n${mode} .workspace-leaf-content[data-type="bases-query"] .bases-view,\n${mode} .workspace-leaf-content[data-type="graph"] .view-content`;

		targetLeaf = `${mode} .workspace-leaf-content[data-type="markdown"],\n${mode} .workspace-leaf-content[data-type="canvas"],\n${mode} .workspace-leaf-content[data-type="bases"],\n${mode} .workspace-leaf-content[data-type="bases-query"],\n${mode} .workspace-leaf-content[data-type="graph"]`;

		transparentContent = `${mode} .workspace-leaf-content[data-type="markdown"] .view-content,\n${mode} .markdown-source-view.mod-cm6 .cm-scroller,\n${mode} .markdown-preview-view,\n${mode} .workspace-leaf-content[data-type="canvas"] .canvas-wrapper,\n${mode} .workspace-leaf-content[data-type="canvas"] .canvas,\n${mode} .workspace-leaf-content[data-type="bases"] .bases-view,\n${mode} .workspace-leaf-content[data-type="bases-query"] .bases-view,\n${mode} .workspace-leaf-content[data-type="graph"] .view-content,\n${mode} .workspace-leaf-content[data-type="graph"] canvas`;

		beforeSelectors = `${mode} .workspace-leaf-content[data-type="markdown"]::before,\n${mode} .workspace-leaf-content[data-type="canvas"]::before,\n${mode} .workspace-leaf-content[data-type="bases"]::before,\n${mode} .workspace-leaf-content[data-type="bases-query"]::before,\n${mode} .workspace-leaf-content[data-type="graph"]::before`;
	}

	const bgFallback = isDark ? '#262626' : '#ffffff';
	const isWorkspace = scope === 'workspace';
	const isSidebarsOnly = scope === 'sidebars';
	const isLeftSidebarOnly = scope === 'left-sidebar' || scope === 'left' || scope === 'left-panel';
	const isRightSidebarOnly = scope === 'right-sidebar' || scope === 'right' || scope === 'right-panel';
	const isAnySidebar = isSidebarsOnly || isLeftSidebarOnly || isRightSidebarOnly;
	const isGlassActive = tokenMap.get('--glass-enabled') === 'true';
	// A flipbook is animated even without a motion/colour effect, and - because
	// its frames are a single centred image rather than a transparent tile - it
	// must ride on ONE layer per pane. Treating it as animated routes it through
	// the layered/backdrop paths (a single ::before / fixed backdrop) instead of
	// the static path, which paints the nested content elements and would show
	// the image several times over.
	const hasAnimation = motionAnim !== 'none' || colorAnim !== 'none' || shouldUseFlipbook;
	const canTranslate = hasPxTile(pattern.bgSize);
	const isDirectPaint = !canTranslate && (motionAnim === 'rain-scroll' || motionAnim === 'horizontal-rain-scroll' || motionAnim === 'side-scroll' || motionAnim === 'drift');
	const isLayeredBefore = hasAnimation && !isDirectPaint;

	const leftSplitTargets = [
		`${mode} .workspace-split.mod-left-split`,
		`${mode} .workspace-drawer.mod-left`,
	].join(',\n');

	const rightSplitTargets = [
		`${mode} .workspace-split.mod-right-split`,
		`${mode} .workspace-drawer.mod-right`,
	].join(',\n');

	const sideSplitTargets = [
		leftSplitTargets,
		rightSplitTargets,
	].join(',\n');

	const leftPanelTargets = [
		leftSplitTargets,
		`${mode} .workspace-ribbon.mod-left`,
		`${mode} .side-dock-ribbon.mod-left`,
	].join(',\n');

	const rightPanelTargets = [
		rightSplitTargets,
		`${mode} .workspace-ribbon.mod-right`,
		`${mode} .side-dock-ribbon.mod-right`,
	].join(',\n');

	const sidePanelTargets = [
		leftPanelTargets,
		rightPanelTargets,
	].join(',\n');

	const leftPanelBeforeSelectors = [
		`${mode} .workspace-split.mod-left-split::before`,
		`${mode} .workspace-drawer.mod-left::before`,
	].join(',\n');

	const rightPanelBeforeSelectors = [
		`${mode} .workspace-split.mod-right-split::before`,
		`${mode} .workspace-drawer.mod-right::before`,
	].join(',\n');

	const sidePanelBeforeSelectors = [
		leftPanelBeforeSelectors,
		rightPanelBeforeSelectors,
	].join(',\n');

	const leftPanelSubContent = [
		`${mode} .workspace-split.mod-left-split .workspace-tabs`,
		`${mode} .workspace-split.mod-left-split .workspace-tab-container`,
		`${mode} .workspace-split.mod-left-split .workspace-leaf`,
		`${mode} .workspace-split.mod-left-split .workspace-leaf-content`,
		`${mode} .workspace-split.mod-left-split .view-content`,
		`${mode} .workspace-split.mod-left-split .view-header`,
		`${mode} .workspace-split.mod-left-split .nav-header`,
		`${mode} .workspace-split.mod-left-split .nav-buttons-container`,
		`${mode} .workspace-split.mod-left-split .nav-files-container`,
		`${mode} .workspace-drawer.mod-left .workspace-tabs`,
		`${mode} .workspace-drawer.mod-left .workspace-tab-container`,
		`${mode} .workspace-drawer.mod-left .workspace-leaf`,
		`${mode} .workspace-drawer.mod-left .workspace-leaf-content`,
		`${mode} .workspace-drawer.mod-left .view-content`,
		`${mode} .workspace-drawer.mod-left .nav-header`,
		`${mode} .workspace-drawer.mod-left .nav-buttons-container`,
		`${mode} .workspace-split.mod-left-split .workspace-leaf-content[data-type="file-explorer"]`,
		`${mode} .workspace-split.mod-left-split .workspace-leaf-content[data-type="file-explorer"] .view-content`,
		`${mode} .workspace-split.mod-left-split .workspace-leaf-content[data-type="file-explorer"] .nav-header`,
		`${mode} .workspace-split.mod-left-split .workspace-leaf-content[data-type="file-explorer"] .nav-buttons-container`,
		`${mode} .workspace-split.mod-left-split .workspace-leaf-content[data-type="file-explorer"] .nav-files-container`,
		`${mode} .workspace-drawer.mod-left .workspace-leaf-content[data-type="file-explorer"]`,
		`${mode} .workspace-drawer.mod-left .workspace-leaf-content[data-type="file-explorer"] .view-content`,
		`${mode} .workspace-drawer.mod-left .workspace-leaf-content[data-type="file-explorer"] .nav-header`,
		`${mode} .workspace-drawer.mod-left .workspace-leaf-content[data-type="file-explorer"] .nav-buttons-container`,
		`${mode} .workspace-drawer.mod-left .workspace-leaf-content[data-type="file-explorer"] .nav-files-container`,
		`${mode} .workspace-split.mod-left-split .workspace-leaf-content[data-type="search"]`,
		`${mode} .workspace-split.mod-left-split .workspace-leaf-content[data-type="search"] .view-content`,
		`${mode} .workspace-split.mod-left-split .workspace-leaf-content[data-type="bookmarks"]`,
		`${mode} .workspace-split.mod-left-split .workspace-leaf-content[data-type="bookmarks"] .view-content`,
	].join(',\n');

	const rightPanelSubContent = [
		`${mode} .workspace-split.mod-right-split .workspace-tabs`,
		`${mode} .workspace-split.mod-right-split .workspace-tab-container`,
		`${mode} .workspace-split.mod-right-split .workspace-leaf`,
		`${mode} .workspace-split.mod-right-split .workspace-leaf-content`,
		`${mode} .workspace-split.mod-right-split .view-content`,
		`${mode} .workspace-split.mod-right-split .view-header`,
		`${mode} .workspace-split.mod-right-split .nav-header`,
		`${mode} .workspace-split.mod-right-split .nav-buttons-container`,
		`${mode} .workspace-split.mod-right-split .backlink-pane`,
		`${mode} .workspace-split.mod-right-split .embedded-backlinks`,
		`${mode} .workspace-drawer.mod-right .workspace-tabs`,
		`${mode} .workspace-drawer.mod-right .workspace-tab-container`,
		`${mode} .workspace-drawer.mod-right .workspace-leaf`,
		`${mode} .workspace-drawer.mod-right .workspace-leaf-content`,
		`${mode} .workspace-drawer.mod-right .view-content`,
		`${mode} .workspace-drawer.mod-right .nav-header`,
		`${mode} .workspace-drawer.mod-right .nav-buttons-container`,
		`${mode} .workspace-split.mod-right-split .workspace-leaf-content[data-type="backlink"]`,
		`${mode} .workspace-split.mod-right-split .workspace-leaf-content[data-type="backlink"] .view-content`,
		`${mode} .workspace-split.mod-right-split .workspace-leaf-content[data-type="backlink"] .view-header`,
		`${mode} .workspace-split.mod-right-split .workspace-leaf-content[data-type="backlink"] .backlink-pane`,
		`${mode} .workspace-split.mod-right-split .workspace-leaf-content[data-type="outline"]`,
		`${mode} .workspace-split.mod-right-split .workspace-leaf-content[data-type="outline"] .view-content`,
		`${mode} .workspace-split.mod-right-split .workspace-leaf-content[data-type="outgoing-link"]`,
		`${mode} .workspace-split.mod-right-split .workspace-leaf-content[data-type="outgoing-link"] .view-content`,
		`${mode} .workspace-split.mod-right-split .workspace-leaf-content[data-type="tag"]`,
		`${mode} .workspace-split.mod-right-split .workspace-leaf-content[data-type="tag"] .view-content`,
		`${mode} .workspace-split.mod-right-split .workspace-leaf-content[data-type="all-properties"]`,
		`${mode} .workspace-split.mod-right-split .workspace-leaf-content[data-type="all-properties"] .view-content`,
		`${mode} .backlink-pane`,
		`${mode} .embedded-backlinks`,
		`${mode} .backlink-pane .search-result-container`,
		`${mode} .backlink-pane .search-results-children`,
	].join(',\n');

	const sidePanelSubContent = [
		leftPanelSubContent,
		rightPanelSubContent,
		`${mode} .workspace-leaf-content[data-type="file-explorer"]`,
		`${mode} .workspace-leaf-content[data-type="file-explorer"] .view-content`,
		`${mode} .workspace-leaf-content[data-type="file-explorer"] .nav-header`,
		`${mode} .workspace-leaf-content[data-type="file-explorer"] .nav-buttons-container`,
		`${mode} .workspace-leaf-content[data-type="file-explorer"] .nav-files-container`,
		`${mode} .workspace-leaf-content[data-type="backlink"]`,
		`${mode} .workspace-leaf-content[data-type="backlink"] .view-content`,
		`${mode} .workspace-leaf-content[data-type="backlink"] .view-header`,
		`${mode} .workspace-leaf-content[data-type="backlink"] .backlink-pane`,
		`${mode} .workspace-leaf-content[data-type="outline"]`,
		`${mode} .workspace-leaf-content[data-type="outline"] .view-content`,
		`${mode} .workspace-leaf-content[data-type="outgoing-link"]`,
		`${mode} .workspace-leaf-content[data-type="outgoing-link"] .view-content`,
		`${mode} .workspace-leaf-content[data-type="tag"]`,
		`${mode} .workspace-leaf-content[data-type="tag"] .view-content`,
		`${mode} .workspace-leaf-content[data-type="all-properties"]`,
		`${mode} .workspace-leaf-content[data-type="all-properties"] .view-content`,
		`${mode} .backlink-pane`,
		`${mode} .embedded-backlinks`,
		`${mode} .backlink-pane .search-result-container`,
		`${mode} .backlink-pane .search-results-children`,
	].join(',\n');

	// Side Panels repurpose the side-panel selector sets above as the
	// primary paint target: the shared static/direct-paint/layered pipeline
	// below always paints `selectors`/`targetLeaf`/`beforeSelectors`, so
	// pointing those at the side panels (instead of the editor content) is
	// enough to make every animation mode work for this scope too, with no
	// separate copy of that pipeline.
	if (isSidebarsOnly) {
		selectors = sidePanelTargets;
		targetLeaf = sideSplitTargets;
		transparentContent = sidePanelSubContent;
		beforeSelectors = sidePanelBeforeSelectors;
	} else if (isLeftSidebarOnly) {
		selectors = leftPanelTargets;
		targetLeaf = leftSplitTargets;
		transparentContent = leftPanelSubContent;
		beforeSelectors = leftPanelBeforeSelectors;
	} else if (isRightSidebarOnly) {
		selectors = rightPanelTargets;
		targetLeaf = rightSplitTargets;
		transparentContent = rightPanelSubContent;
		beforeSelectors = rightPanelBeforeSelectors;
	}

	// Frosted glass makes every nested content layer transparent, so a pattern
	// painted on both a container and the content inside it would stack twice
	// and read darker (the fixed/floating patterns double outright, tiled ones
	// just darken). While glass is active the nested layers are dropped from
	// the paint target, leaving the outer container as the single layer.
	const glassNestedLayers = new Set([
		`${mode} .markdown-preview-view`,
		`${mode} .markdown-source-view.mod-cm6 .cm-scroller`,
		`${mode} .workspace-leaf-content[data-type="canvas"] .canvas-background`,
		`${mode} .workspace-split.mod-root .workspace-tab-container`,
		`${mode} .workspace-leaf-content[data-type="canvas"] .canvas-wrapper`,
		`${mode} .workspace-leaf-content[data-type="bases"] .bases-view`,
		`${mode} .workspace-leaf-content[data-type="bases-query"] .bases-view`,
		`${mode} .workspace-leaf-content[data-type="graph"] .view-content`,
	]);
	const paintSelectors = isGlassActive
		? selectors.split(',\n').filter((entry) => !glassNestedLayers.has(entry.trim())).join(',\n')
		: selectors;

	// Shared "keep it solid, no pattern" chrome protection for menus, popovers,
	// dropdowns, and the settings modal - identical whether the pattern itself
	// is confined to the editor or to the side panels, since in both cases
	// this floating chrome should never show it.
	/**
	 * What floating chrome needs when the pattern is confined to the editor or
	 * to the side panels.
	 *
	 * Obsidian renders menus, popovers, prompts and modals at the top of the
	 * document rather than inside the containers these scopes paint, and nothing
	 * in these scopes clears their background - so the long "keep it solid"
	 * block below was restating Obsidian's own values across a few hundred
	 * selectors. One `background-image: none` stays as a cheap guarantee for the
	 * case where a popover is rendered inside a painted view after all. The full
	 * block is still used by the workspace scope, which deliberately paints the
	 * pattern onto menus and therefore needs the sub-menu and control exceptions.
	 */
	const floatingChromeNoPattern =
		`/* Floating chrome never shows the pattern, and stays above the painted layers */\n` +
		`${mode} .menu,\n` +
		`${mode} .suggestion-container,\n` +
		`${mode} .popover,\n` +
		`${mode} .hover-popover,\n` +
		`${mode} .prompt,\n` +
		`${mode} .modal,\n` +
		`${mode} .modal-container,\n` +
		`${mode} .bases-toolbar-menu {\n` +
		`  background-image: none !important;\n` +
		// The painted leaves isolate their own stacking context, so a menu
		// rendered inside one - a canvas menu, for instance - needs saying that
		// it still sits on top.
		`  z-index: 1000 !important;\n` +
		`  opacity: 1 !important;\n` +
		`}\n` +
		// Kept from the long block this replaces: Obsidian's settings toggles are
		// a styled container wrapping a visually hidden native checkbox, and the
		// task-checkbox rules elsewhere in the snippet can otherwise bring that
		// input back into view. This is the part of that block that did work
		// rather than restating a colour.
		`/* Toggle switches: keep the native checkbox input invisible */\n` +
		`${mode} .checkbox-container input[type="checkbox"] {\n` +
		`  position: absolute !important;\n` +
		`  opacity: 0 !important;\n` +
		`  pointer-events: none !important;\n` +
		`  width: 0 !important;\n` +
		`  height: 0 !important;\n` +
		`  border: none !important;\n` +
		`  background: transparent !important;\n` +
		`  box-shadow: none !important;\n` +
		`}\n` +
		`${mode} .checkbox-container input[type="checkbox"]::before,\n` +
		`${mode} .checkbox-container input[type="checkbox"]::after {\n` +
		`  display: none !important;\n` +
		`  content: none !important;\n` +
		`  mask-image: none !important;\n` +
		`  -webkit-mask-image: none !important;\n` +
		`}\n`;

	const chromeProtectionNoPattern =
		`/* Menus and overlays keep solid background without pattern */\n` +
		`${mode} .menu,\n` +
		`${mode} .suggestion-container,\n` +
		`${mode} .popover,\n` +
		`${mode} .hover-popover,\n` +
		`${mode} .modal-container,\n` +
		`${mode} .modal,\n` +
		`${mode} .prompt,\n` +
		`${mode} .tooltip,\n` +
		`${mode} .notice,\n` +
		`${mode} .bases-toolbar-menu {\n` +
		`  background-color: var(--menu-background, var(--background-secondary, ${bgFallback})) !important;\n` +
		`  opacity: 1 !important;\n` +
		`  z-index: 1000 !important;\n` +
		`  background-image: none !important;\n` +
		`}\n` +
		`/* Sub-menus keep solid secondary background without pattern */\n` +
		`${mode} .menu ~ .menu,\n` +
		`${mode} .menu + .menu,\n` +
		`${mode} .menu:not(:first-of-type),\n` +
		`${mode} .menu:nth-of-type(n+2),\n` +
		`${mode} .menu .menu,\n` +
		`${mode} .menu-item .menu,\n` +
		`${mode} .menu-item > .menu,\n` +
		`${mode} .menu.sub-menu,\n` +
		`${mode} .menu.mod-sub-menu,\n` +
		`${mode} .menu.mod-submenu,\n` +
		`${mode} .menu.submenu,\n` +
		`${mode} .sub-menu,\n` +
		`${mode} .submenu,\n` +
		`${mode} .menu-submenu,\n` +
		`${mode} .menu-sub-menu,\n` +
		`${mode} [class*="submenu"],\n` +
		`${mode} [class*="sub-menu"],\n` +
		`${mode} [data-is-submenu],\n` +
		`${mode} [data-submenu],\n` +
		`${mode} .modal-container ~ .menu,\n` +
		`${mode} .modal-container ~ .popover,\n` +
		`${mode} .modal-container ~ .popover .menu,\n` +
		`${mode} .popover ~ .popover,\n` +
		`${mode} .popover:not(:first-of-type),\n` +
		`${mode} .dropdown-menu {\n` +
		`  background: var(--background-secondary, ${bgFallback}) !important;\n` +
		`  background-color: var(--background-secondary, ${bgFallback}) !important;\n` +
		`  opacity: 1 !important;\n` +
		`  z-index: 1000 !important;\n` +
		`  background-image: none !important;\n` +
		`}\n` +
		`/* Dropdown buttons, select controls, and settings inputs keep solid secondary background */\n` +
		`${mode} .dropdown,\n` +
		`${mode} select.dropdown,\n` +
		`${mode} select,\n` +
		`${mode} .dropdown-button,\n` +
		`${mode} [class*="dropdown"],\n` +
		`${mode} select:focus,\n` +
		`${mode} .setting-item-control select,\n` +
		`${mode} .setting-item-control .dropdown,\n` +
		`${mode} .setting-item-control button,\n` +
		`${mode} .setting-item-control .dropdown-button,\n` +
		`${mode} .setting-item-control [class*="dropdown"],\n` +
		`${mode} .setting-item-control .clickable-icon,\n` +
		`${mode} .setting-item-control input:not([type="checkbox"]):not([type="radio"]),\n` +
		`${mode} .setting-item-control .slider,\n` +
		`${mode} .setting-item-control .extra-setting-button,\n` +
		`${mode} .modal select,\n` +
		`${mode} .modal .dropdown,\n` +
		`${mode} .modal.mod-settings select,\n` +
		`${mode} .modal.mod-settings .dropdown,\n` +
		`${mode} .modal button,\n` +
		`${mode} .modal .clickable-icon,\n` +
		`${mode} .modal-container select,\n` +
		`${mode} .modal-container .dropdown,\n` +
		`${mode} .modal-container button,\n` +
		`${mode} .canvas-controls,\n` +
		`${mode} .canvas-control-group,\n` +
		`${mode} .canvas-control-item,\n` +
		`${mode} .canvas-card-menu,\n` +
		`${mode} .canvas-node-toolbar,\n` +
		`${mode} .canvas-wrapper .dropdown,\n` +
		`${mode} .canvas-wrapper select,\n` +
		`${mode} .canvas-wrapper button,\n` +
		`${mode} .canvas-wrapper .clickable-icon {\n` +
		`  background: var(--background-secondary, ${bgFallback}) !important;\n` +
		`  background-color: var(--background-secondary, ${bgFallback}) !important;\n` +
		`  background-image: none !important;\n` +
		`  opacity: 1 !important;\n` +
		`  z-index: auto !important;\n` +
		`}\n` +
		`/* Toggle switches: ensure native checkbox input remains strictly invisible and unstyled */\n` +
		`${mode} .checkbox-container input[type="checkbox"] {\n` +
		`  position: absolute !important;\n` +
		`  opacity: 0 !important;\n` +
		`  pointer-events: none !important;\n` +
		`  width: 0 !important;\n` +
		`  height: 0 !important;\n` +
		`  border: none !important;\n` +
		`  background: transparent !important;\n` +
		`  box-shadow: none !important;\n` +
		`}\n` +
		`${mode} .checkbox-container input[type="checkbox"]::before,\n` +
		`${mode} .checkbox-container input[type="checkbox"]::after {\n` +
		`  display: none !important;\n` +
		`  content: none !important;\n` +
		`  mask-image: none !important;\n` +
		`  -webkit-mask-image: none !important;\n` +
		`}\n` +
		`/* Settings dialog, modals, and canvas settings keep solid secondary background */\n` +
		`${mode} .modal-container,\n` +
		`${mode} .modal,\n` +
		`${mode} .modal-content,\n` +
		`${mode} .modal.mod-sidebar-layout,\n` +
		`${mode} .modal.mod-settings,\n` +
		`${mode} .vertical-tabs-container,\n` +
		`${mode} .vertical-tab-header,\n` +
		`${mode} .vertical-tab-header-group,\n` +
		`${mode} .vertical-tab-header-group-title,\n` +
		`${mode} .vertical-tab-nav-item,\n` +
		`${mode} .vertical-tab-content-container,\n` +
		`${mode} .vertical-tab-content,\n` +
		`${mode} .horizontal-tab-content,\n` +
		`${mode} .setting-item,\n` +
		`${mode} .setting-item-heading,\n` +
		`${mode} .setting-item-info,\n` +
		`${mode} .setting-item-control,\n` +
		`${mode} .setting-item-name,\n` +
		`${mode} .setting-item-description,\n` +
		`${mode} .search-input-container,\n` +
		`${mode} .search-input-container input,\n` +
		`${mode} input[type="search"],\n` +
		`${mode} .plugin-list-plugins,\n` +
		`${mode} .hotkey-list-container,\n` +
		`${mode} .hotkey-settings-container,\n` +
		`${mode} .hotkey-header-container,\n` +
		`${mode} .hotkey-filter,\n` +
		`${mode} .setting-filter-container,\n` +
		`${mode} .installed-plugins-container,\n` +
		`${mode} .setting-group,\n` +
		`${mode} .setting-group-search,\n` +
		`${mode} .setting-items {\n` +
		`  background: var(--background-secondary, ${bgFallback}) !important;\n` +
		`  background-color: var(--background-secondary, ${bgFallback}) !important;\n` +
		`  background-image: none !important;\n` +
		`}\n`;

	// The side panels are part of the "Full Obsidian Workspace" area, so in the
	// direct-paint modes they carry the SAME composed layers as the centre - the
	// flipbook overlay included - and obey the pattern sub-toggle.
	const sidePanelBg = composeBackground([
		...(flipbookLayer ? [flipbookLayer] : []),
		patternLayer,
	]);

	let navigationAndMenuProtection = '';

	if (isWorkspace) {
		navigationAndMenuProtection +=
			`/* Full Workspace: Side panels & navigation base */\n` +
			`${sidePanelTargets} {\n` +
			(!isGlassActive ? `  background-color: var(--background-secondary, ${bgFallback}) !important;\n` : '') +
			(!isLayeredBefore
				? (sidePanelBg
						? `  background-image: ${sidePanelBg.image} !important;\n` +
						  `  background-size: ${sidePanelBg.size} !important;\n` +
						  `  background-repeat: ${sidePanelBg.repeat} !important;\n` +
						  (sidePanelBg.position ? `  background-position: ${sidePanelBg.position} !important;\n` : '')
						: `  background-image: ${patternLayer.image} !important;\n` +
						  `  background-size: ${patternLayer.size} !important;\n` +
						  `  background-repeat: ${patternLayer.repeat} !important;\n` +
						  (patternLayer.position ? `  background-position: ${patternLayer.position} !important;\n` : '')) +
				  flipbookBaseDecl +
				  (flipbookAnimSpec ? `  animation: ${flipbookAnimSpec} !important;\n` : '') +
				  (pattern.bgAttachment ? `  background-attachment: ${pattern.bgAttachment} !important;\n` : '')
				: '') +
			`}\n` +
			`${sidePanelSubContent} {\n` +
			`  background-color: transparent !important;\n` +
			`  background-image: none !important;\n` +
			`}\n` +
			`/* Full Workspace: Menus and overlays render background pattern */\n` +
			`${mode} .menu,\n` +
			`${mode} .suggestion-container,\n` +
			`${mode} .popover,\n` +
			`${mode} .hover-popover,\n` +
			`${mode} .prompt,\n` +
			`${mode} .bases-toolbar-menu {\n` +
			`  background-color: var(--menu-background, var(--background-secondary, ${bgFallback})) !important;\n` +
			`  background-image: ${paintImage} !important;\n` +
			`  background-size: ${pattern.bgSize} !important;\n` +
			`  background-repeat: ${repeat} !important;\n` +
			(pattern.bgPosition ? `  background-position: ${pattern.bgPosition} !important;\n` : '') +
			`  opacity: 1 !important;\n` +
			`  z-index: 1000 !important;\n` +
			`}\n` +
			`/* Full Workspace: Sub-menus keep solid secondary background without pattern */\n` +
			`${mode} .menu ~ .menu,\n` +
			`${mode} .menu + .menu,\n` +
			`${mode} .menu:not(:first-of-type),\n` +
			`${mode} .menu:nth-of-type(n+2),\n` +
			`${mode} .menu .menu,\n` +
			`${mode} .menu-item .menu,\n` +
			`${mode} .menu-item > .menu,\n` +
			`${mode} .menu.sub-menu,\n` +
			`${mode} .menu.mod-sub-menu,\n` +
			`${mode} .menu.mod-submenu,\n` +
			`${mode} .menu.submenu,\n` +
			`${mode} .sub-menu,\n` +
			`${mode} .submenu,\n` +
			`${mode} .menu-submenu,\n` +
			`${mode} .menu-sub-menu,\n` +
			`${mode} [class*="submenu"],\n` +
			`${mode} [class*="sub-menu"],\n` +
			`${mode} [data-is-submenu],\n` +
			`${mode} [data-submenu],\n` +
			`${mode} .modal-container ~ .menu,\n` +
			`${mode} .modal-container ~ .popover,\n` +
			`${mode} .modal-container ~ .popover .menu,\n` +
			`${mode} .modal-container .menu,\n` +
			`${mode} .modal .menu,\n` +
			`${mode} .popover ~ .popover,\n` +
			`${mode} .popover:not(:first-of-type),\n` +
			`${mode} .canvas-wrapper .menu,\n` +
			`${mode} .canvas-controls .menu,\n` +
			`${mode} .canvas-card-menu .menu,\n` +
			`${mode} .canvas-node-toolbar .menu,\n` +
			`${mode} .canvas-menu,\n` +
			`${mode} .dropdown-menu {\n` +
			`  background: var(--background-secondary, ${bgFallback}) !important;\n` +
			`  background-color: var(--background-secondary, ${bgFallback}) !important;\n` +
			`  background-image: none !important;\n` +
			`  opacity: 1 !important;\n` +
			`}\n` +
			`/* Full Workspace: Dropdown buttons, select controls, and settings inputs keep solid secondary background */\n` +
			`${mode} .dropdown,\n` +
			`${mode} select.dropdown,\n` +
			`${mode} select,\n` +
			`${mode} .dropdown-button,\n` +
			`${mode} [class*="dropdown"],\n` +
			`${mode} select:focus,\n` +
			`${mode} .setting-item-control select,\n` +
			`${mode} .setting-item-control .dropdown,\n` +
			`${mode} .setting-item-control button,\n` +
			`${mode} .setting-item-control .dropdown-button,\n` +
			`${mode} .setting-item-control [class*="dropdown"],\n` +
			`${mode} .setting-item-control .clickable-icon,\n` +
			`${mode} .setting-item-control input:not([type="checkbox"]):not([type="radio"]),\n` +
			`${mode} .setting-item-control .slider,\n` +
			`${mode} .setting-item-control .extra-setting-button,\n` +
			`${mode} .modal select,\n` +
			`${mode} .modal .dropdown,\n` +
			`${mode} .modal.mod-settings select,\n` +
			`${mode} .modal.mod-settings .dropdown,\n` +
			`${mode} .modal button,\n` +
			`${mode} .modal .clickable-icon,\n` +
			`${mode} .modal-container select,\n` +
			`${mode} .modal-container .dropdown,\n` +
			`${mode} .modal-container button,\n` +
			`${mode} .canvas-controls,\n` +
			`${mode} .canvas-control-group,\n` +
			`${mode} .canvas-control-item,\n` +
			`${mode} .canvas-card-menu,\n` +
			`${mode} .canvas-node-toolbar,\n` +
			`${mode} .canvas-wrapper .dropdown,\n` +
			`${mode} .canvas-wrapper select,\n` +
			`${mode} .canvas-wrapper button,\n` +
			`${mode} .canvas-wrapper .clickable-icon {\n` +
			`  background: var(--background-secondary, ${bgFallback}) !important;\n` +
			`  background-color: var(--background-secondary, ${bgFallback}) !important;\n` +
			`  background-image: none !important;\n` +
			`  opacity: 1 !important;\n` +
			`}\n` +
			`/* Toggle switches: ensure native checkbox input remains strictly invisible and unstyled */\n` +
			`${mode} .checkbox-container input[type="checkbox"] {\n` +
			`  position: absolute !important;\n` +
			`  opacity: 0 !important;\n` +
			`  pointer-events: none !important;\n` +
			`  width: 0 !important;\n` +
			`  height: 0 !important;\n` +
			`  border: none !important;\n` +
			`  background: transparent !important;\n` +
			`  box-shadow: none !important;\n` +
			`}\n` +
			`${mode} .checkbox-container input[type="checkbox"]::before,\n` +
			`${mode} .checkbox-container input[type="checkbox"]::after {\n` +
			`  display: none !important;\n` +
			`  content: none !important;\n` +
			`  mask-image: none !important;\n` +
			`  -webkit-mask-image: none !important;\n` +
			`}\n` +
			`/* Full Workspace: Settings dialog, modals, and canvas settings keep solid secondary background without pattern */\n` +
			`${mode} .modal-container,\n` +
			`${mode} .modal,\n` +
			`${mode} .modal-content,\n` +
			`${mode} .modal.mod-sidebar-layout,\n` +
			`${mode} .modal.mod-settings,\n` +
			`${mode} .vertical-tabs-container,\n` +
			`${mode} .vertical-tab-header,\n` +
			`${mode} .vertical-tab-header-group,\n` +
			`${mode} .vertical-tab-header-group-title,\n` +
			`${mode} .vertical-tab-nav-item,\n` +
			`${mode} .vertical-tab-content-container,\n` +
			`${mode} .vertical-tab-content,\n` +
			`${mode} .horizontal-tab-content,\n` +
			`${mode} .setting-item,\n` +
			`${mode} .setting-item-heading,\n` +
			`${mode} .setting-item-info,\n` +
			`${mode} .setting-item-control,\n` +
			`${mode} .setting-item-name,\n` +
			`${mode} .setting-item-description,\n` +
			`${mode} .search-input-container,\n` +
			`${mode} .search-input-container input,\n` +
			`${mode} input[type="search"],\n` +
			`${mode} .plugin-list-plugins,\n` +
			`${mode} .hotkey-list-container,\n` +
			`${mode} .hotkey-settings-container,\n` +
			`${mode} .hotkey-header-container,\n` +
			`${mode} .hotkey-filter,\n` +
			`${mode} .setting-filter-container,\n` +
			`${mode} .installed-plugins-container,\n` +
			`${mode} .setting-group,\n` +
			`${mode} .setting-group-search,\n` +
			`${mode} .setting-items {\n` +
			`  background: var(--background-secondary, ${bgFallback}) !important;\n` +
			`  background-color: var(--background-secondary, ${bgFallback}) !important;\n` +
			`  background-image: none !important;\n` +
			`}\n`;
	} else if (isAnySidebar) {
		const baseScope = tokenMap.get('--ui-bg-scope') ?? 'editor';
		// If this is a flipbook pass and base background is also active on editor/workspace,
		// don't overwrite editor background with background-image: none.
		const shouldProtectEditor = !asFlipbook || !isEnabled || (baseScope !== 'editor' && baseScope !== 'workspace');
		if (shouldProtectEditor) {
			navigationAndMenuProtection +=
				`/* Side Panels: Main editor content keeps solid background without pattern */\n` +
				`${mode} .workspace-leaf-content[data-type="markdown"] .view-content,\n` +
				`${mode} .markdown-source-view.mod-cm6 .cm-scroller,\n` +
				`${mode} .markdown-preview-view,\n` +
				`${mode} .workspace-leaf-content[data-type="canvas"] .canvas-background,\n` +
				`${mode} .workspace-leaf-content[data-type="canvas"] .canvas-wrapper,\n` +
				`${mode} .workspace-leaf-content[data-type="bases"] .bases-view,\n` +
				`${mode} .workspace-leaf-content[data-type="bases-query"] .bases-view,\n` +
				`${mode} .workspace-leaf-content[data-type="graph"] .view-content,\n` +
				`${mode} .empty-state-container {\n` +
				`  background-color: var(--background-primary) !important;\n` +
				`  background-image: none !important;\n` +
				`}\n`;
		}

		if (isLeftSidebarOnly) {
			navigationAndMenuProtection +=
				`/* Left Panel Only: Right sidebar keeps solid background without pattern */\n` +
				`${rightPanelTargets} {\n` +
				`  background-color: var(--background-secondary, ${bgFallback}) !important;\n` +
				`  background-image: none !important;\n` +
				`}\n`;
		} else if (isRightSidebarOnly) {
			navigationAndMenuProtection +=
				`/* Right Panel Only: Left sidebar keeps solid background without pattern */\n` +
				`${leftPanelTargets} {\n` +
				`  background-color: var(--background-secondary, ${bgFallback}) !important;\n` +
				`  background-image: none !important;\n` +
				`}\n`;
		}

		// The pattern is painted directly on the sidebar's own split/drawer/
		// ribbon container (via `selectors`, below), which sits behind its
		// tabs, leaf, and view content. Those nested layers keep Obsidian's
		// own opaque secondary background by default, which visually covers
		// the pattern - the ribbon is the only side panel with no such
		// nested content, which is why it was the only one showing it. This
		// has to live in navigationAndMenuProtection (built once, ahead of
		// the static / direct-paint / layered branches below) rather than
		// the layered-only transparency pass further down, since static
		// patterns - the common case - return before ever reaching that pass.
		navigationAndMenuProtection +=
			`/* Side Panels: sidebar content panes stay transparent so the pattern painted on the split/drawer container shows through */\n` +
			`${transparentContent} {\n` +
			`  background-color: transparent !important;\n` +
			`  background-image: none !important;\n` +
			`}\n`;
		navigationAndMenuProtection += floatingChromeNoPattern;
	} else {
		// Kept. Unlike the floating-chrome block, this one carries
		// `body:not(.is-focused)` variants of every selector, which is the
		// signature of a real focus-state bug rather than defensive copying -
		// Obsidian repaints these surfaces when the window loses focus. Verifying
		// its removal would mean reproducing Obsidian's own unfocused rules, so
		// it stays until someone can check it against the running app.
		if (!isGlassActive && !isMinimalism) {
			navigationAndMenuProtection +=
				`/* Editor Only: Side panels keep solid background without pattern */\n` +
				`${mode} .workspace-split.mod-left-split,\n` +
				`${mode} .workspace-split.mod-right-split,\n` +
				`${mode} .workspace-drawer.mod-left,\n` +
				`${mode} .workspace-drawer.mod-right,\n` +
				`${mode} .workspace-ribbon.mod-left,\n` +
				`${mode} .workspace-ribbon.mod-right,\n` +
				`${mode} .side-dock-ribbon.mod-left,\n` +
				`${mode} .side-dock-ribbon.mod-right,\n` +
				`${mode} .workspace-leaf-content[data-type="file-explorer"],\n` +
				`${mode} .workspace-leaf-content[data-type="search"],\n` +
				`${mode} .workspace-leaf-content[data-type="bookmarks"],\n` +
				`${mode} .workspace-leaf-content[data-type="outline"],\n` +
				`${mode} .workspace-leaf-content[data-type="tag"],\n` +
				`${mode} .workspace-leaf-content[data-type="backlink"],\n` +
				`${mode} .workspace-leaf-content[data-type="outgoing-link"],\n` +
				`${mode} .workspace-leaf-content[data-type="all-properties"],\n` +
				`${mode} .workspace-leaf-content[data-type="file-explorer"] .view-content,\n` +
				`${mode} .workspace-leaf-content[data-type="file-explorer"] .nav-header,\n` +
				`${mode} .workspace-leaf-content[data-type="file-explorer"] .nav-buttons-container,\n` +
				`${mode} .workspace-leaf-content[data-type="file-explorer"] .nav-files-container,\n` +
				`${mode} .workspace-leaf-content[data-type="backlink"] .view-content,\n` +
				`${mode} .workspace-leaf-content[data-type="backlink"] .backlink-pane,\n` +
				`${mode} .workspace-split.mod-left-split .workspace-leaf-content,\n` +
				`${mode} .workspace-split.mod-left-split .view-content,\n` +
				`${mode} .workspace-split.mod-left-split .nav-header,\n` +
				`${mode} .workspace-split.mod-left-split .nav-buttons-container,\n` +
				`${mode} .workspace-split.mod-right-split .workspace-leaf-content,\n` +
				`${mode} .workspace-split.mod-right-split .view-content,\n` +
				`${mode} .workspace-split.mod-right-split .nav-header,\n` +
				`${mode} .workspace-split.mod-right-split .nav-buttons-container,\n` +
				`${mode} .workspace-drawer.mod-left .nav-header,\n` +
				`${mode} .workspace-drawer.mod-left .nav-buttons-container,\n` +
				`${mode} .workspace-drawer.mod-right .nav-header,\n` +
				`${mode} .workspace-drawer.mod-right .nav-buttons-container,\n` +
				`body${mode}:not(.is-focused) .workspace-leaf-content[data-type="file-explorer"] .nav-header,\n` +
				`body${mode}:not(.is-focused) .workspace-leaf-content[data-type="file-explorer"] .nav-buttons-container,\n` +
				`body${mode}:not(.is-focused) .workspace-split.mod-left-split .nav-header,\n` +
				`body${mode}:not(.is-focused) .workspace-split.mod-left-split .nav-buttons-container,\n` +
				`body${mode}:not(.is-focused) .workspace-split.mod-right-split .nav-header,\n` +
				`body${mode}:not(.is-focused) .workspace-split.mod-right-split .nav-buttons-container {\n` +
				`  background: var(--background-secondary, ${bgFallback}) !important;\n` +
				`  background-color: var(--background-secondary, ${bgFallback}) !important;\n` +
				`  background-image: none !important;\n` +
				`}\n`;
		}
		navigationAndMenuProtection += floatingChromeNoPattern;
	}

	const suppressedSplitBefore: string[] = [];
	if (!isLayeredBefore) {
		suppressedSplitBefore.push(
			`${mode} .workspace-split.mod-left-split::before`,
			`${mode} .workspace-split.mod-right-split::before`,
			`${mode} .workspace-drawer.mod-left::before`,
			`${mode} .workspace-drawer.mod-right::before`,
		);
	} else if (isLeftSidebarOnly) {
		suppressedSplitBefore.push(
			`${mode} .workspace-split.mod-right-split::before`,
			`${mode} .workspace-drawer.mod-right::before`,
		);
	} else if (isRightSidebarOnly) {
		suppressedSplitBefore.push(
			`${mode} .workspace-split.mod-left-split::before`,
			`${mode} .workspace-drawer.mod-left::before`,
		);
	} else if (!isWorkspace && !isSidebarsOnly) {
		suppressedSplitBefore.push(
			`${mode} .workspace-split.mod-left-split::before`,
			`${mode} .workspace-split.mod-right-split::before`,
			`${mode} .workspace-drawer.mod-left::before`,
			`${mode} .workspace-drawer.mod-right::before`,
		);
	}

	const suppressedBeforeList = [
		...suppressedSplitBefore,
		`${mode} .workspace-leaf-content[data-type="file-explorer"]::before`,
		`${mode} .workspace-leaf-content[data-type="search"]::before`,
		`${mode} .workspace-leaf-content[data-type="bookmarks"]::before`,
		`${mode} .workspace-leaf-content[data-type="outline"]::before`,
		`${mode} .workspace-leaf-content[data-type="tag"]::before`,
		`${mode} .workspace-leaf-content[data-type="backlink"]::before`,
		`${mode} .workspace-leaf-content[data-type="word-count"]::before`,
		`${mode} .backlink-pane::before`,
		`${mode} .embedded-backlinks::before`,
		`${mode} .workspace-leaf-content[data-type="outgoing-link"]::before`,
		`${mode} .workspace-leaf-content[data-type="all-properties"]::before`,
		`${mode} .menu::before`,
		`${mode} .menu ~ .menu::before`,
		`${mode} .menu + .menu::before`,
		`${mode} .menu .menu::before`,
		`${mode} .menu-item .menu::before`,
		`${mode} .menu-item > .menu::before`,
		`${mode} .menu.sub-menu::before`,
		`${mode} .menu.mod-sub-menu::before`,
		`${mode} .menu.mod-submenu::before`,
		`${mode} .menu.submenu::before`,
		`${mode} .sub-menu::before`,
		`${mode} .submenu::before`,
		`${mode} .menu-submenu::before`,
		`${mode} .menu-sub-menu::before`,
		`${mode} [class*="submenu"]::before`,
		`${mode} [class*="sub-menu"]::before`,
		`${mode} .modal-container .menu::before`,
		`${mode} .modal .menu::before`,
		`${mode} .canvas-wrapper .menu::before`,
		`${mode} .dropdown::before`,
		`${mode} select.dropdown::before`,
		`${mode} select::before`,
		`${mode} .dropdown-button::before`,
		`${mode} [class*="dropdown"]::before`,
		`${mode} .setting-item-control select::before`,
		`${mode} .setting-item-control .dropdown::before`,
		`${mode} .setting-item-control button::before`,
		`${mode} .modal::before`,
		`${mode} .modal-container::before`,
		`${mode} .modal.mod-sidebar-layout::before`,
		`${mode} .modal.mod-settings::before`,
		`${mode} .modal.mod-settings .vertical-tab-content::before`,
		`${mode} .vertical-tabs-container::before`,
		`${mode} .vertical-tab-header::before`,
		`${mode} .vertical-tab-content-container::before`,
		`${mode} .vertical-tab-content::before`,
		`${mode} .setting-item::before`,
		`${mode} .setting-item-control::before`,
		`${mode} .canvas-controls::before`,
		`${mode} .canvas-control-group::before`,
		`${mode} .canvas-card-menu::before`,
		`${mode} .canvas-node-toolbar::before`,
		`${mode} .canvas-menu::before`,
		`${mode} .suggestion-container::before`,
		`${mode} .prompt::before`,
	].join(',\n');

	// The ::before layer only exists for animations that ride on a pseudo-element.
	// A static pattern paints the container directly, so there is nothing to
	// suppress and this list was several dozen selectors of pure ballast.
	const beforeSuppression = isLayeredBefore
		? `/* Suppress pseudo-element layers on utility leaves and menus so content stays in front */\n` +
		  `${suppressedBeforeList} {\n` +
		  `  display: none !important;\n` +
		  `}\n`
		: '';

	const sharedProtection =
		beforeSuppression +
		`/* Foreground UI items protection: text, folders, and icons stay in front */\n` +
		`${mode} .nav-files-container,\n` +
		`${mode} .nav-folder,\n` +
		`${mode} .nav-folder-children,\n` +
		`${mode} .nav-folder-title,\n` +
		`${mode} .nav-file-title,\n` +
		`${mode} .tree-item-self,\n` +
		`${mode} .tree-item-inner,\n` +
		`${mode} .menu-item,\n` +
		`${mode} .suggestion-item {\n` +
		`  position: relative !important;\n` +
		`  z-index: 1 !important;\n` +
		`  opacity: 1 !important;\n` +
		`}\n` +
		`${mode} .menu-item:hover,\n` +
		`${mode} .menu-item.is-selected,\n` +
		`${mode} .menu-item.selected,\n` +
		`${mode} .suggestion-item:hover,\n` +
		`${mode} .suggestion-item.is-selected {\n` +
		`  background-color: var(--menu-item-background-hover, var(--background-modifier-hover)) !important;\n` +
		`}\n` +
		`${mode} .nav-file-title:hover,\n` +
		`${mode} .nav-folder-title:hover,\n` +
		`${mode} .tree-item-self:hover,\n` +
		`${mode} .nav-file-title.is-active,\n` +
		`${mode} .tree-item-self.is-active {\n` +
		`  background-color: var(--nav-item-background-hover, var(--background-modifier-hover)) !important;\n` +
		`}\n` +
		`/* CSS Snippet Designer View protection */\n` +
		`${mode} .workspace-leaf-content[data-type="css-snippet-designer-view"],\n` +
		`${mode} .workspace-leaf-content[data-type="css-snippet-designer-view"] .view-content,\n` +
		`${mode} .workspace-leaf-content[data-type="css-snippet-designer-view"] .css-snippet-designer-root {\n` +
		`  background-color: var(--background-primary) !important;\n` +
		`  opacity: 1 !important;\n` +
		`  background-image: none !important;\n` +
		`}\n` +
		`${mode} .workspace-leaf-content[data-type="css-snippet-designer-view"]::before {\n` +
		`  display: none !important;\n` +
		`}\n` +
		`/* Chrome header, tabs, and status bar protection */\n` +
		`${mode} .workspace-tab-header-container,\n` +
		`${mode} .workspace-tab-header,\n` +
		`${mode} .workspace-tab-header-inner,\n` +
		`${mode} .titlebar,\n` +
		`${mode} .status-bar {\n` +
		`  opacity: 1 !important;\n` +
		`}\n` +
		(isMinimalism
			? `/* Seamless top bar, window controls & status bar in minimalism mode */\n` +
			  `${mode} .titlebar,\n` +
			  `${mode} .titlebar-inner {\n` +
			  `  border: none !important;\n` +
			  `  background: transparent !important;\n` +
			  `  background-color: transparent !important;\n` +
			  `  background-image: none !important;\n` +
			  `  -webkit-app-region: drag !important;\n` +
			  `  app-region: drag !important;\n` +
			  `  pointer-events: none !important;\n` +
			  `}\n` +
			  `${mode} .titlebar-button-container.mod-right,\n` +
			  `${mode} .workspace-split.mod-left-split .workspace-tab-header-container,\n` +
			  `${mode} .workspace-split.mod-right-split .workspace-tab-header-container {\n` +
			  `  border: none !important;\n` +
			  `  background: transparent !important;\n` +
			  `  background-color: transparent !important;\n` +
			  `  background-image: none !important;\n` +
			  `}\n` +
			  `${mode} .titlebar-button-container.mod-right {\n` +
			  `  position: absolute !important;\n` +
			  `  top: 0 !important;\n` +
			  `  right: 0 !important;\n` +
			  `  left: auto !important;\n` +
			  `  width: calc(var(--titlebar-width, 138px)) !important;\n` +
			  `  max-width: calc(var(--titlebar-width, 138px)) !important;\n` +
			  `  height: 38px !important;\n` +
			  `  display: flex !important;\n` +
			  `  align-items: center !important;\n` +
			  `  justify-content: flex-end !important;\n` +
			  `  z-index: 50 !important;\n` +
			  `  -webkit-app-region: no-drag !important;\n` +
			  `  app-region: no-drag !important;\n` +
			  `  pointer-events: auto !important;\n` +
			  `}\n` +
			  `${mode} .titlebar-button-container.mod-left {\n` +
			  `  display: none !important;\n` +
			  `  pointer-events: none !important;\n` +
			  `}\n` +
			  `${mode} .titlebar-button {\n` +
			  `  background: transparent !important;\n` +
			  `  background-color: transparent !important;\n` +
			  `  border: none !important;\n` +
			  `  box-shadow: none !important;\n` +
			  `  width: 46px !important;\n` +
			  `  height: 100% !important;\n` +
			  `  min-height: 38px !important;\n` +
			  `  display: inline-flex !important;\n` +
			  `  align-items: center !important;\n` +
			  `  justify-content: center !important;\n` +
			  `  -webkit-app-region: no-drag !important;\n` +
			  `  app-region: no-drag !important;\n` +
			  `  pointer-events: auto !important;\n` +
			  `  cursor: pointer !important;\n` +
			  `}\n` +
			  `${mode} .titlebar-button *,\n` +
			  `${mode} .titlebar-button svg {\n` +
			  `  -webkit-app-region: no-drag !important;\n` +
			  `  app-region: no-drag !important;\n` +
			  `  pointer-events: auto !important;\n` +
			  `}\n` +
			  `${mode} .status-bar::before {\n` +
			  `  display: none !important;\n` +
			  `}\n` +
			  `${mode} .status-bar {\n` +
			  `  background: transparent !important;\n` +
			  `  background-color: transparent !important;\n` +
			  `  background-image: none !important;\n` +
			  `  border-top: none !important;\n` +
			  `  border: none !important;\n` +
			  `}\n`
			: `/* Seamless top bar in frameless window mode */\n` +
			  `${mode} .is-hidden-frameless .titlebar {\n` +
			  `  border: none !important;\n` +
			  `  background: transparent !important;\n` +
			  `}\n` +
			  `${mode} .status-bar::before {\n` +
			  `  display: none !important;\n` +
			  `}\n` +
			  `${mode} .status-bar {\n` +
			  `  background-color: var(--status-bar-background, var(--background-secondary, ${bgFallback})) !important;\n` +
			  `  background-image: none !important;\n` +
			  `}\n`) +
		`${mode} .status-bar-item {\n` +
		`  background-image: none !important;\n` +
		`}\n` +
		`/* Canvas nodes and in-editor controls protection */\n` +
		`${mode} .canvas-control-group,\n` +
		`${mode} .canvas-controls,\n` +
		`${mode} .canvas-card-menu,\n` +
		`${mode} .canvas-node-toolbar {\n` +
		`  background: var(--background-secondary, ${bgFallback}) !important;\n` +
		`  background-color: var(--background-secondary, ${bgFallback}) !important;\n` +
		`  background-image: none !important;\n` +
		`  z-index: 2 !important;\n` +
		`  opacity: 1 !important;\n` +
		`}\n` +
		`/* Canvas Navigation Hover */\n` +
		`${mode} .workspace-leaf-content[data-type="canvas"] .canvas-controls,\n` +
		`${mode} .canvas-wrapper .canvas-controls {\n` +
		`  --interactive-hover: var(--background-modifier-hover);\n` +
		`}\n` +
		`${mode} .workspace-leaf-content[data-type="canvas"] .canvas-controls .canvas-control-item:hover,\n` +
		`${mode} .workspace-leaf-content[data-type="canvas"] .canvas-control-item:hover,\n` +
		`${mode} .workspace-leaf-content[data-type="canvas"] .canvas-controls .clickable-icon:hover,\n` +
		`${mode} .canvas-wrapper .canvas-controls .canvas-control-item:hover,\n` +
		`${mode} .canvas-wrapper .canvas-control-item:hover,\n` +
		`${mode} .canvas-wrapper .canvas-controls .clickable-icon:hover,\n` +
		`${mode} .canvas-controls .canvas-control-item:hover,\n` +
		`${mode} .canvas-control-item:hover,\n` +
		`${mode} .canvas-controls .clickable-icon:hover {\n` +
		`  background-color: var(--background-modifier-hover) !important;\n` +
		`}\n` +
		`/* Canvas node cards never show the pattern. The pattern lives on\n` +
		`   .canvas-background behind the cards, and each card keeps its own solid\n` +
		`   fill so nothing bleeds through its (sometimes translucent) content. */\n` +
		`${mode} .canvas-node-container,\n` +
		`${mode} .canvas-node-content {\n` +
		`  position: relative !important;\n` +
		`  z-index: 2 !important;\n` +
		`  opacity: 1 !important;\n` +
		`  background-color: var(--background-primary) !important;\n` +
		`  background-image: none !important;\n` +
		`}\n` +
		`/* A card embeds a note, and the note's own preview/editor layer is one of\n` +
		`   the pattern's paint targets. Clear it on that nested layer too, or the\n` +
		`   pattern draws on top of the card content. */\n` +
		`${mode} .canvas-node-content .markdown-preview-view,\n` +
		`${mode} .canvas-node-content .markdown-rendered,\n` +
		`${mode} .canvas-node-content .markdown-embed-content,\n` +
		`${mode} .canvas-node-content .markdown-source-view.mod-cm6,\n` +
		`${mode} .canvas-node-content .markdown-source-view.mod-cm6 .cm-scroller,\n` +
		`${mode} .canvas-node-content .cm-editor,\n` +
		`${mode} .canvas-node-content .cm-content {\n` +
		`  background-color: var(--background-primary) !important;\n` +
		`  background-image: none !important;\n` +
		`}\n` +
		`${mode} .callout,\n` +
		`${mode} .cm-embed-block,\n` +
		`${mode} .markdown-rendered pre,\n` +
		`${mode} .markdown-rendered table,\n` +
		`${mode} .metadata-container,\n` +
		`${mode} .cm-panels,\n` +
		`${mode} .cm-tooltip {\n` +
		`  position: relative !important;\n` +
		`  z-index: 1 !important;\n` +
		`  opacity: 1 !important;\n` +
		`}\n`;

	navigationAndMenuProtection += sharedProtection;

	let css = '';

	// 1. Static pattern mode (no motion/colour animation). A flipbook takes the
	// animated paths instead, so it is excluded here even without a motion or
	// colour effect.
	if (motionAnim === 'none' && colorAnim === 'none' && !shouldUseFlipbook) {
		const staticOverlay = composeBackground([
			...(flipbookLayer ? [flipbookLayer] : []),
			patternLayer,
		]);
		css += `${paintSelectors} {\n`;
		if (isAnySidebar && !isGlassActive) {
			css += `  background-color: var(--background-secondary, ${bgFallback}) !important;\n`;
		}
		if (staticOverlay) {
			css += `  background-image: ${staticOverlay.image} !important;\n`;
			css += `  background-size: ${staticOverlay.size} !important;\n`;
			css += `  background-repeat: ${staticOverlay.repeat} !important;\n`;
		} else {
			css += `  background-image: ${patternLayer.image} !important;\n`;
			css += `  background-size: ${patternLayer.size} !important;\n`;
			css += `  background-repeat: ${patternLayer.repeat} !important;\n`;
		}
		if (staticOverlay ? staticOverlay.position : patternLayer.position) {
			css += `  background-position: ${staticOverlay ? staticOverlay.position : patternLayer.position} !important;\n`;
		}
		if (flipbookAnimSpec) {
			css += flipbookBaseDecl;
			css += `  animation: ${flipbookAnimSpec} !important;\n`;
		}
		if (pattern.bgAttachment) {
			css += `  background-attachment: ${pattern.bgAttachment} !important;\n`;
		}
		css += `}\n`;
		if (flipbookAnimSpec && animatedSelectors) {
			animatedSelectors.push(paintSelectors);
			if (isWorkspace) {
				// The side panels run the same flipbook in workspace scope, so
				// reduced motion has to switch them off too.
				animatedSelectors.push(sidePanelTargets);
			}
		}
		css += flipbookKeyframes;
		css += navigationAndMenuProtection;
		return css;
	}

	const animSpecs: string[] = [];
	const willChangeSet = new Set<string>();
	let staticFilter = '';
	let padTop = 0;
	let padLeft = 0;
	let padRight = 0;
	let isRotating = false;

	// The flipbook's keyframes were built above; here the overlay simply joins
	// the layer's animation list alongside any motion/colour effect the pattern
	// itself uses.
	css += flipbookKeyframes;
	if (flipbookAnimSpec) {
		animSpecs.push(flipbookAnimSpec);
	}

	// Build Motion Animation keyframes
	if (motionAnim === 'rain-scroll') {
		const distance = rainScrollDistance(pattern.bgSize);
		animSpecs.push(`css-bg-rain ${dur(12)} linear infinite`);
		if (canTranslate) {
			padTop = distance;
			willChangeSet.add('transform');
			css += `@keyframes css-bg-rain {\n  0% { transform: translate3d(0, 0, 0); }\n  100% { transform: translate3d(0, ${distance}px, 0); }\n}\n`;
		} else {
			css += `@keyframes css-bg-rain {\n  0% { background-position: 0 0; }\n  100% { background-position: 0 ${distance}px; }\n}\n`;
		}
	} else if (motionAnim === 'horizontal-rain-scroll') {
		const distance = horizontalScrollDistance(pattern.bgSize);
		animSpecs.push(`css-bg-horizontal-rain ${dur(12)} linear infinite`);
		if (canTranslate) {
			padLeft = distance;
			willChangeSet.add('transform');
			css += `@keyframes css-bg-horizontal-rain {\n  0% { transform: translate3d(0, 0, 0); }\n  100% { transform: translate3d(${distance}px, 0, 0); }\n}\n`;
		} else {
			css += `@keyframes css-bg-horizontal-rain {\n  0% { background-position: 0 0; }\n  100% { background-position: ${distance}px 0; }\n}\n`;
		}
	} else if (motionAnim === 'side-scroll') {
		// The mirror of the horizontal rain: the layer slides left, so it is
		// oversized on the trailing right edge instead of the left.
		const distance = horizontalScrollDistance(pattern.bgSize);
		animSpecs.push(`css-bg-side-scroll ${dur(12)} linear infinite`);
		if (canTranslate) {
			padRight = distance;
			willChangeSet.add('transform');
			css += `@keyframes css-bg-side-scroll {\n  0% { transform: translate3d(0, 0, 0); }\n  100% { transform: translate3d(-${distance}px, 0, 0); }\n}\n`;
		} else {
			css += `@keyframes css-bg-side-scroll {\n  0% { background-position: 0 0; }\n  100% { background-position: -${distance}px 0; }\n}\n`;
		}
	} else if (motionAnim === 'rotate-cw' || motionAnim === 'rotate-ccw') {
		// The tile spins about the pane centre, so the layer is a square sized to
		// the viewport diagonal - the most any leaf inside the window can need -
		// and centred with negative margins rather than a translate, because
		// under reduced motion the transform is dropped and the layer must still
		// cover the pane. Clipped by the leaf's `overflow: clip`.
		const ccw = motionAnim === 'rotate-ccw';
		isRotating = true;
		animSpecs.push(`${ccw ? 'css-bg-rotate-ccw' : 'css-bg-rotate'} ${dur(20)} linear infinite`);
		willChangeSet.add('transform');
		css += `@keyframes ${ccw ? 'css-bg-rotate-ccw' : 'css-bg-rotate'} {\n  0% { transform: rotate(0deg); }\n  100% { transform: rotate(${ccw ? '-360' : '360'}deg); }\n}\n`;
	} else if (motionAnim === 'drift') {
		animSpecs.push(`css-bg-drift ${dur(24)} ease-in-out infinite`);
		if (canTranslate) {
			padTop = 80;
			padLeft = 60;
			willChangeSet.add('transform');
			css += `@keyframes css-bg-drift {\n  0%, 100% { transform: translate3d(0, 0, 0); }\n  50% { transform: translate3d(60px, 80px, 0); }\n}\n`;
		} else {
			css += `@keyframes css-bg-drift {\n  0% { background-position: 0 0; }\n  50% { background-position: 60px 80px; }\n  100% { background-position: 0 0; }\n}\n`;
		}
	} else if (motionAnim === 'pulse') {
		animSpecs.push(`css-bg-pulse ${dur(4)} ease-in-out infinite`);
		willChangeSet.add('opacity');
		willChangeSet.add('transform');
		css += `@keyframes css-bg-pulse {\n  0%, 100% { opacity: 0.95; transform: scale(1); }\n  50% { opacity: 0.25; transform: scale(0.995); }\n}\n`;
	}

	// Build Color Animation keyframes
	if (colorAnim === 'rainbow-cycle') {
		animSpecs.push(`css-bg-rainbow ${dur(10)} linear infinite`);
		willChangeSet.add('filter');
		css += `@keyframes css-bg-rainbow {\n  0% { filter: hue-rotate(0deg); }\n  100% { filter: hue-rotate(360deg); }\n}\n`;
	} else if (colorAnim === 'gradient-shift') {
		animSpecs.push(`css-bg-gradient-shift ${dur(8)} ease-in-out infinite`);
		willChangeSet.add('filter');
		css += `@keyframes css-bg-gradient-shift {\n  0% { filter: hue-rotate(0deg) brightness(1); }\n  50% { filter: hue-rotate(80deg) brightness(1.25); }\n  100% { filter: hue-rotate(0deg) brightness(1); }\n}\n`;
	} else if (colorAnim === 'neon-glow') {
		animSpecs.push(`css-bg-neon ${dur(3)} ease-in-out infinite`);
		willChangeSet.add('opacity');
		staticFilter = `brightness(1.25) drop-shadow(0 0 3px ${isGradient ? color2 : color1})`;
		css += `@keyframes css-bg-neon {\n  0%, 100% { opacity: 0.85; }\n  50% { opacity: 1; }\n  75% { opacity: 0.6; }\n}\n`;
	}

	// Rotating gradient angle: a CSS gradient layer whose angle is a registered
	// custom property, spun by keyframes. A CSS animation (rather than an SMIL
	// animation baked into the SVG) keeps it inside the reduced-motion block
	// and under the animation-speed slider. The layer is blended over the
	// pattern so the rotating sweep never hides it.
	const gradientRotate = colorAnim === 'gradient-rotate';
	if (gradientRotate) {
		animSpecs.push(`css-bg-angle ${dur(8)} linear infinite`);
		css += `@property --css-bg-angle {\n  syntax: "<angle>";\n  inherits: false;\n  initial-value: 0deg;\n}\n`;
		css += `@keyframes css-bg-angle {\n  from { --css-bg-angle: 0deg; }\n  to { --css-bg-angle: 360deg; }\n}\n`;
	}
	const angleLayer = gradientRotate
		? `linear-gradient(var(--css-bg-angle), ${parseColorDetails(color1, opacity).rgba}, ${parseColorDetails(color2, opacity).rgba})`
		: '';
	const paintOverlay = composeBackground([
		...(flipbookLayer ? [flipbookLayer] : []),
		...(angleLayer
			? [{ image: angleLayer, size: '100% 100%', repeat: 'no-repeat', position: '0 0', blend: 'overlay' }]
			: []),
		patternLayer,
	]);

	// 'Full Obsidian Workspace' gets a single fixed backdrop for the whole
	// window instead of a layer per pane. Per-pane layers repeat full-bleed art
	// in every pane and each runs its own animation instance, so translation,
	// rotation and pulse never read as one seamless motion across the
	// workspace. One fixed layer on `.app-container`, with the workspace subtree
	// lifted above it and made transparent, keeps the whole window on a single
	// continuous, synchronised animation.
	if (isWorkspace) {
		const translating = padTop > 0 || padLeft > 0 || padRight > 0;
		const backdropPane = [
			`${mode} .workspace-split`,
			`${mode} .workspace-split.mod-root`,
			`${mode} .workspace-split.mod-left-split`,
			`${mode} .workspace-split.mod-right-split`,
			`${mode} .workspace-drawer`,
			`${mode} .workspace-tabs`,
			`${mode} .workspace-tab-container`,
			`${mode} .workspace-leaf`,
			`${mode} .workspace-leaf-content`,
			`${mode} .view-content`,
			`${mode} .markdown-source-view`,
			`${mode} .markdown-source-view.mod-cm6`,
			`${mode} .cm-editor`,
			`${mode} .cm-scroller`,
			`${mode} .markdown-preview-view`,
			`${mode} .markdown-rendered`,
			`${mode} .empty-state-container`,
			`${mode} .workspace-leaf-content[data-type="canvas"] .canvas-background`,
			`${mode} .workspace-leaf-content[data-type="canvas"] .canvas-wrapper`,
			`${mode} .workspace-leaf-content[data-type="canvas"] .canvas`,
			`${mode} .workspace-leaf-content[data-type="bases"] .bases-view`,
			`${mode} .workspace-leaf-content[data-type="bases-query"] .bases-view`,
			`${mode} .workspace-leaf-content[data-type="graph"] .view-content`,
			`${mode} .workspace-leaf-content[data-type="graph"] canvas`,
			`${mode} .nav-files-container`,
			`${mode} .backlink-pane`,
			`${mode} .embedded-backlinks`,
			`${mode} .backlink-pane .search-result-container`,
			`${mode} .backlink-pane .search-results-children`,
		].join(',\n');

		css += `/* Full Workspace backdrop: one fixed layer behind the whole window */\n`;
		// `isolation` makes the app root a stacking context so the backdrop can
		// sit at a NEGATIVE z-index: above the app's own background, but behind
		// every pane, titlebar and control. Nothing in the workspace is covered
		// or re-stacked, and no chrome has to be raised - only the panes are
		// made transparent so the backdrop shows through.
		css += `${mode} .app-container {\n  position: relative !important;\n  isolation: isolate !important;\n}\n`;
		css += `${mode} .horizontal-main-container,\n${mode} .workspace {\n  background-color: transparent !important;\n}\n`;
		css += `${backdropPane} {\n  background-color: transparent !important;\n  background-image: none !important;\n}\n`;
		css += chromeProtectionNoPattern;
		css += sharedProtection;

		// The window drag region is a *transparent* titlebar layered over the tab
		// strip, so an opaque titlebar would hide the tab strip, sidebar toggles
		// and window controls drawn in it. Keep the titlebar transparent and make
		// the tab header container opaque instead (as the glass layer does): the
		// backdrop is hidden there while the chrome stays visible through the
		// titlebar.
		css += `/* Full Workspace: solid tab bar over the backdrop */\n`;
		css += `${mode} .workspace-tab-header-container {\n  background-color: var(--tab-container-background, var(--background-secondary, ${bgFallback})) !important;\n}\n`;

		css += `${mode} .app-container::before {\n`;
		css += `  content: "" !important;\n`;
		css += `  position: fixed !important;\n`;
		if (isRotating) {
			css += `  top: 50% !important;\n  left: 50% !important;\n  width: 142vmax !important;\n  height: 142vmax !important;\n  margin: -71vmax 0 0 -71vmax !important;\n`;
		} else if (translating) {
			const edge = (px: number): string => (px > 0 ? `-${px}px` : '0');
			css += `  inset: ${edge(padTop)} ${edge(padRight)} 0 ${edge(padLeft)} !important;\n`;
		} else {
			css += `  inset: 0 !important;\n`;
		}
		css += `  pointer-events: none !important;\n`;
		css += `  z-index: -1 !important;\n`;
		css += flipbookBaseDecl;
		css += `  background-image: ${paintOverlay ? paintOverlay.image : paintImage} !important;\n`;
		css += `  background-size: ${paintOverlay ? paintOverlay.size : pattern.bgSize} !important;\n`;
		css += `  background-repeat: ${paintOverlay ? paintOverlay.repeat : repeat} !important;\n`;
		if (paintOverlay?.blend) {
			css += `  background-blend-mode: ${paintOverlay.blend} !important;\n`;
		}
		if (paintOverlay ? paintOverlay.position : pattern.bgPosition) {
			css += `  background-position: ${paintOverlay ? paintOverlay.position : pattern.bgPosition} !important;\n`;
		}
		if (staticFilter) {
			css += `  filter: ${staticFilter} !important;\n`;
		}
		if (willChangeSet.size > 0) {
			css += `  will-change: ${Array.from(willChangeSet).join(', ')} !important;\n`;
		}
		css += `  backface-visibility: hidden !important;\n`;
		if (animSpecs.length > 0) {
			css += `  animation: ${animSpecs.join(', ')} !important;\n`;
		}
		css += `}\n`;

		if (animatedSelectors) animatedSelectors.push(`${mode} .app-container::before`);
		return css;
	}

	// Percentage-sized patterns that require background-position scrolling use direct paint
	if (!canTranslate && (motionAnim === 'rain-scroll' || motionAnim === 'horizontal-rain-scroll' || motionAnim === 'side-scroll' || motionAnim === 'drift')) {
		const directSelectors = isWorkspace ? `${paintSelectors},\n${sidePanelTargets}` : paintSelectors;
		if (animatedSelectors) animatedSelectors.push(directSelectors);
		let directCss = css + directPaintRule(directSelectors, pattern, animSpecs.join(', '), staticFilter, paintOverlay, flipbookBaseDecl, paintImage);
		if (isAnySidebar && !isGlassActive) {
			directCss += `${selectors} {\n  background-color: var(--background-secondary, ${bgFallback}) !important;\n}\n`;
		}
		return directCss + navigationAndMenuProtection;
	}

	// Layered animations render on a ::before pinned to the non-scrolling leaf
	// frame, with z-index isolation so note text is NEVER discolored.
	const isTranslating = padTop > 0 || padLeft > 0 || padRight > 0;
	const targetLeafBg = isAnySidebar && !isGlassActive ? `var(--background-secondary, ${bgFallback})` : 'var(--background-primary)';

	css += `${targetLeaf} {\n  position: relative !important;\n  background-color: ${targetLeafBg} !important;\n  contain: paint !important;\n  isolation: isolate !important;\n`;
	if (isTranslating || isRotating) {
		css += `  overflow: clip !important;\n`;
	}
	css += `}\n`;
	const leafContentSelectors = targetLeaf
		.split(',\n')
		.map((s) => `${s} > .view-content,\n${s} > .canvas-wrapper`)
		.join(',\n');
	css += `${leafContentSelectors} {\n  position: relative !important;\n  z-index: 1 !important;\n}\n`;

	if (isWorkspace) {
		css += `${sideSplitTargets} {\n  position: relative !important;\n  background-color: var(--background-secondary, ${bgFallback}) !important;\n  contain: paint !important;\n  isolation: isolate !important;\n`;
		if (isTranslating || isRotating) {
			css += `  overflow: clip !important;\n`;
		}
		css += `}\n`;
	}

	css += `${mode} .view-header {\n  position: relative !important;\n  z-index: 2 !important;\n  background-color: var(--background-primary) !important;\n}\n`;
	css += `${transparentContent} {\n  background-color: transparent !important;\n}\n`;
	if (isWorkspace) {
		// 'sidebars' scope already gets this from navigationAndMenuProtection,
		// which (unlike this spot) is also reached by the static and
		// direct-paint return paths above.
		css += `${sidePanelSubContent} {\n  background-color: transparent !important;\n  background-image: none !important;\n}\n`;
	}
	css += navigationAndMenuProtection;

	const allBefore = isWorkspace ? `${beforeSelectors},\n${sidePanelBeforeSelectors}` : beforeSelectors;

	css += `${allBefore} {\n`;
	css += `  content: "" !important;\n`;
	css += `  position: absolute !important;\n`;
	if (isRotating) {
		// A viewport-diagonal square centred on the pane; rotating it always
		// covers the leaf. Centred with margins (not a translate) so reduced
		// motion, which strips the animation and thus the transform, still
		// leaves the layer in place.
		css += `  top: 50% !important;\n`;
		css += `  left: 50% !important;\n`;
		css += `  width: 142vmax !important;\n`;
		css += `  height: 142vmax !important;\n`;
		css += `  margin: -71vmax 0 0 -71vmax !important;\n`;
	} else {
		const edge = (px: number): string => (px > 0 ? `-${px}px` : '0');
		css += isTranslating
			? `  inset: ${edge(padTop)} ${edge(padRight)} 0 ${edge(padLeft)} !important;\n`
			: `  inset: 0 !important;\n`;
	}
	css += `  pointer-events: none !important;\n`;
	css += `  z-index: 0 !important;\n`;
	css += flipbookBaseDecl;
	css += `  background-image: ${paintOverlay ? paintOverlay.image : paintImage} !important;\n`;
	css += `  background-size: ${paintOverlay ? paintOverlay.size : pattern.bgSize} !important;\n`;
	css += `  background-repeat: ${paintOverlay ? paintOverlay.repeat : repeat} !important;\n`;
	if (paintOverlay?.blend) {
		css += `  background-blend-mode: ${paintOverlay.blend} !important;\n`;
	}
	if (paintOverlay ? paintOverlay.position : pattern.bgPosition) {
		css += `  background-position: ${paintOverlay ? paintOverlay.position : pattern.bgPosition} !important;\n`;
	}
	if (pattern.bgAttachment && !isTranslating && !isRotating) {
		css += `  background-attachment: ${paintOverlay ? `scroll, ${pattern.bgAttachment}` : pattern.bgAttachment} !important;\n`;
	}
	if (staticFilter) {
		css += `  filter: ${staticFilter} !important;\n`;
	}
	if (willChangeSet.size > 0) {
		css += `  will-change: ${Array.from(willChangeSet).join(', ')} !important;\n`;
	}
	css += `  backface-visibility: hidden !important;\n`;
	if (animSpecs.length > 0) {
		css += `  animation: ${animSpecs.join(', ')} !important;\n`;
	}
	css += `}\n`;

	if (animatedSelectors) animatedSelectors.push(allBefore);

	return css;
}

/**
 * Dedicated Tab: UI Elements (Minimalist Opacity & Distraction-Free Layout)
 */

export function generateUIElementCss(mode: '.theme-dark' | '.theme-light', state: ThemeTokenState): string {
	const tokenMap = mode === '.theme-dark' ? state.darkTokens : state.lightTokens;
	const transDuration = tokenMap.get('--ui-transition-duration') ?? '0.25s';
	let css = '';

	for (const el of UI_ELEMENTS) {
		const opacityVal = tokenMap.get(`--ui-${el.id}-opacity`) ?? (mode === '.theme-dark' ? el.defaultOpacityDark : el.defaultOpacityLight);
		const opNum = parseFloat(opacityVal);

		// Only generate override rules if opacity is reduced below full (1.0)
		// as to not flood the stylesheet / code view with redundant CSS with no visual effect.
		if (isNaN(opNum) || opNum >= 1.0) continue;

		// Opt-in, not opt-out: an unset token means off. Previously `!== 'false'`
		// made hover reveal active for every element, and for container-shaped
		// selectors the pointer is nearly always inside the trigger — which
		// restored full opacity and made the slider look broken.
		const isHoverReveal = el.supportsHoverReveal && tokenMap.get(`--ui-${el.id}-hover-reveal`) === 'true';
		// Reveal follows a tight trigger where the element itself is a container.
		const hoverBase = el.hoverTrigger ?? el.selector;

		if (el.id === 'scrollbars') {
			// Chromium / WebKit scrollbars do not support the `opacity` CSS property.
			// Implement Chromium-compatible transparency and hide handling.
			if (opNum === 0) {
				if (!isHoverReveal) {
					css += `${mode} ::-webkit-scrollbar,\n`;
					css += `${mode} .cm-scroller::-webkit-scrollbar {\n`;
					css += `  display: none !important;\n`;
					css += `  width: 0 !important;\n`;
					css += `  height: 0 !important;\n`;
					css += `  background: transparent !important;\n`;
					css += `}\n`;
					css += `${mode} *::-webkit-scrollbar-thumb,\n`;
					css += `${mode} .cm-scroller::-webkit-scrollbar-thumb {\n`;
					css += `  background: transparent !important;\n`;
					css += `  visibility: hidden !important;\n`;
					css += `}\n`;
					css += `${mode} *::-webkit-scrollbar-track,\n`;
					css += `${mode} .cm-scroller::-webkit-scrollbar-track {\n`;
					css += `  background: transparent !important;\n`;
					css += `}\n`;
					// Scoped to actual scroll containers rather than `*`: a universal
					// rule also strips scrollbars from the designer panel itself.
					css += `${mode} .cm-scroller,\n`;
					css += `${mode} .markdown-preview-view,\n`;
					css += `${mode} .workspace-leaf-content,\n`;
					css += `${mode} .nav-files-container,\n`;
					css += `${mode} .view-content {\n`;
					css += `  scrollbar-width: none !important;\n`;
					css += `}\n`;
				} else {
					css += `${mode} *::-webkit-scrollbar-thumb,\n`;
					css += `${mode} .cm-scroller::-webkit-scrollbar-thumb {\n`;
					css += `  background-color: transparent !important;\n`;
					css += `  border-color: transparent !important;\n`;
					css += `  box-shadow: none;\n`;
					css += `  transition: background-color ${transDuration} ease !important;\n`;
					css += `}\n`;
					css += `${mode} *::-webkit-scrollbar-track,\n`;
					css += `${mode} .cm-scroller::-webkit-scrollbar-track {\n`;
					css += `  background-color: transparent !important;\n`;
					css += `}\n`;
					css += `${mode} *:hover::-webkit-scrollbar-thumb,\n`;
					css += `${mode} .cm-scroller:hover::-webkit-scrollbar-thumb {\n`;
					css += `  background-color: var(--scrollbar-thumb-hover-bg, var(--scrollbar-thumb-bg, rgba(128, 128, 128, 0.7))) !important;\n`;
					css += `  visibility: visible !important;\n`;
					css += `}\n`;
				}
			} else {
				const pct = Math.round(opNum * 100);
				css += `${mode} *::-webkit-scrollbar-thumb,\n`;
				css += `${mode} .cm-scroller::-webkit-scrollbar-thumb {\n`;
				css += `  background-color: color-mix(in srgb, var(--scrollbar-thumb-bg, rgba(128, 128, 128, 0.6)) ${pct}%, transparent) !important;\n`;
				css += `  border-color: transparent !important;\n`;
				css += `  box-shadow: none;\n`;
				css += `  transition: background-color ${transDuration} ease !important;\n`;
				css += `}\n`;
				css += `${mode} *::-webkit-scrollbar-track,\n`;
				css += `${mode} .cm-scroller::-webkit-scrollbar-track {\n`;
				css += `  background-color: transparent !important;\n`;
				css += `}\n`;
				if (isHoverReveal) {
					css += `${mode} *:hover::-webkit-scrollbar-thumb,\n`;
					css += `${mode} .cm-scroller:hover::-webkit-scrollbar-thumb {\n`;
					css += `  background-color: var(--scrollbar-thumb-hover-bg, var(--scrollbar-thumb-bg, rgba(128, 128, 128, 0.8))) !important;\n`;
					css += `}\n`;
				}
			}
			continue;
		}

		if (el.kind === 'border') {
			const pct = Math.round(opNum * 100);
			const colorVal = opNum === 0 ? 'transparent' : `color-mix(in srgb, var(--background-modifier-border, #333) ${pct}%, transparent)`;

			if (el.id === 'tab-outlines') {
				css += `${scopeSelectors(mode, el.selector)} {\n`;
				css += `  --tab-outline-color: ${colorVal} !important;\n`;
				css += `  border-color: ${colorVal} !important;\n`;
				css += `  transition: border-color ${transDuration} ease !important;\n`;
				css += `}\n`;
				css += `${mode} .workspace-tab-header-container .workspace-tab-header.is-active::before,\n`;
				css += `${mode} .workspace-tab-header-container .workspace-tab-header.is-active::after {\n`;
				css += opNum === 0
					? `  box-shadow: 0 0 0 calc(var(--tab-curve, 6px) * 4) var(--tab-background-active) !important;\n`
					: `  box-shadow: inset 0 0 0 var(--tab-outline-width, 1px) ${colorVal}, 0 0 0 calc(var(--tab-curve, 6px) * 4) var(--tab-background-active) !important;\n`;
				css += `  transition: box-shadow 0.2s ease !important;\n`;
				css += `}\n`;
				if (isHoverReveal) {
					css += `${mode} .workspace-tab-header-container:hover .workspace-tab-header,\n`;
					css += `${mode} .workspace-tab-header:hover {\n`;
					css += `  --tab-outline-color: var(--background-modifier-border) !important;\n`;
					css += `  border-color: var(--background-modifier-border) !important;\n`;
					css += `}\n`;
					css += `${mode} .workspace-tab-header-container:hover .workspace-tab-header.is-active::before,\n`;
					css += `${mode} .workspace-tab-header-container:hover .workspace-tab-header.is-active::after {\n`;
					css += `  box-shadow: inset 0 0 0 var(--tab-outline-width, 1px) var(--background-modifier-border), 0 0 0 calc(var(--tab-curve, 6px) * 4) var(--tab-background-active) !important;\n`;
					css += `}\n`;
				}
			} else if (el.id === 'sidebar-borders') {
				css += `${scopeSelectors(mode, el.selector)} {\n`;
				css += `  border-right-color: ${colorVal} !important;\n`;
				css += `  border-left-color: ${colorVal} !important;\n`;
				css += `  transition: border-color ${transDuration} ease !important;\n`;
				css += `}\n`;
				if (isHoverReveal) {
					css += `${splitSelectorList(hoverBase).map((sel) => `${mode} ${sel}:hover`).join(',\n')} {\n`;
					css += `  border-right-color: var(--background-modifier-border) !important;\n`;
					css += `  border-left-color: var(--background-modifier-border) !important;\n`;
					css += `}\n`;
				}
			} else {
				// General border kind (e.g. property-borders)
				const scopedSel = scopeSelectors(mode, el.selector);
				css += `${scopedSel} {\n`;
				css += `  border-color: ${colorVal} !important;\n`;
				css += `  transition: border-color ${transDuration} ease !important;\n`;
				css += `}\n`;
				if (isHoverReveal) {
					const rawParts = splitSelectorList(hoverBase);
					const hoverTargets = rawParts.map((s) => `${mode} ${s}:hover`);
					css += `${hoverTargets.join(',\n')} {\n`;
					css += `  border-color: var(--background-modifier-border) !important;\n`;
					css += `}\n`;
				}
			}
			continue;
		}

		if (el.id === 'active-line') {
			// `opacity` here would dim the line's text along with the wash. Fade the
			// background instead, which is what "Active Line Highlight" means.
			const pct = Math.round(opNum * 100);
			const scopedSel = scopeSelectors(mode, el.selector);
			css += `${scopedSel} {\n`;
			css += opNum === 0
				? `  background-color: transparent !important;\n`
				: `  background-color: color-mix(in srgb, var(--active-line-bg, var(--background-modifier-hover)) ${pct}%, transparent) !important;\n`;
			css += `  transition: background-color ${transDuration} ease !important;\n`;
			css += `}\n`;
			continue;
		}

		const scopedSel = scopeSelectors(mode, el.selector);
		css += `${scopedSel} {\n`;
		css += `  opacity: ${opacityVal} !important;\n`;
		css += `  transition: opacity ${transDuration} ease !important;\n`;
		if (opNum === 0 && !isHoverReveal) {
			css += `  pointer-events: none !important;\n`;
		}
		css += `}\n`;

		if (isHoverReveal) {
			const rawParts = splitSelectorList(hoverBase);

			const hoverTargets: string[] = [];
			for (const s of rawParts) {
				hoverTargets.push(`${mode} ${s}:hover`);
				// Preserve opacity when interacting with or focusing inside editable containers
				if (el.id === 'metadata-container' || el.id === 'inline-title') {
					hoverTargets.push(`${mode} ${s}:focus-within`);
				}
			}

			// Add parent header hover trigger for utility button clusters
			if (el.id === 'nav-action-buttons') {
				hoverTargets.push(`${mode} .nav-header:hover .nav-buttons-container`);
				hoverTargets.push(`${mode} .view-header:hover .view-actions`);
			}

			css += `${hoverTargets.join(',\n')} {\n`;
			css += `  opacity: 1 !important;\n`;
			css += `  pointer-events: auto !important;\n`;
			css += `}\n`;
		}

		// Synchronize active tab bottom slope curves with tab-headers element
		if (el.id === 'tab-headers') {
			if (opNum === 0 && !isHoverReveal) {
				css += `${mode} .workspace-tab-header-container .workspace-tab-header.is-active::before,\n`;
				css += `${mode} .workspace-tab-header-container .workspace-tab-header.is-active::after {\n`;
				css += `  display: none !important;\n`;
				css += `  pointer-events: none !important;\n`;
				css += `}\n`;
			} else {
				css += `${mode} .workspace-tab-header-container .workspace-tab-header.is-active::before,\n`;
				css += `${mode} .workspace-tab-header-container .workspace-tab-header.is-active::after {\n`;
				css += `  opacity: ${opacityVal} !important;\n`;
				css += `  transition: opacity ${transDuration} ease, box-shadow 0.2s ease !important;\n`;
				css += `}\n`;
			}
			if (isHoverReveal) {
				css += `${mode} .workspace-tab-header-container:hover .workspace-tab-header.is-active::before,\n`;
				css += `${mode} .workspace-tab-header-container:hover .workspace-tab-header.is-active::after {\n`;
				css += `  display: block !important;\n`;
				css += `  opacity: 1 !important;\n`;
				css += `  pointer-events: auto !important;\n`;
				css += `}\n`;
			}
		}
	}

	return css;
}

export function isCompanionRuleActive(ctrl: StyleControl, state: ThemeTokenState, targetMode?: '.theme-dark' | '.theme-light'): boolean {
	if (!ctrl.companionCss) return false;

	const isModeActive = (mode: '.theme-dark' | '.theme-light'): boolean => {
		const enabledMap = mode === '.theme-dark' ? state.darkEnabled : state.lightEnabled;
		const tokenMap = mode === '.theme-dark' ? state.darkTokens : state.lightTokens;
		const isEnabled = enabledMap.get(ctrl.variable) ?? false;
		if (!isEnabled) return false;

		if (ctrl.type === 'toggle') {
			const val = tokenMap.get(ctrl.variable) ?? (mode === '.theme-dark' ? ctrl.defaultDarkValue : ctrl.defaultLightValue);
			const trueVal = ctrl.toggleTrueValue ?? 'true';
			return val === trueVal;
		}
		const val = tokenMap.get(ctrl.variable) ?? (mode === '.theme-dark' ? ctrl.defaultDarkValue : ctrl.defaultLightValue);
		if (!val || val === 'transparent' || val === 'none') {
			return false;
		}
		return true;
	};

	if (targetMode) {
		return isModeActive(targetMode);
	}

	return isModeActive('.theme-dark') || isModeActive('.theme-light');
}
