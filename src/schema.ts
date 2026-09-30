export type ControlType = 'color' | 'slider' | 'select' | 'toggle';

export type DesignerTabId = 'presets' | 'typography' | 'colors' | 'elements' | 'shadows';

export interface TabDefinition {
	id: DesignerTabId;
	label: string;
	icon: string;
	description: string;
}

export const TAB_DEFINITIONS: TabDefinition[] = [
	{ id: 'presets', label: 'Presets', icon: 'sparkles', description: 'Curated themes and saved styles for light and dark mode' },
	{ id: 'typography', label: 'Typography', icon: 'type', description: 'Fonts, heading scale, line height, paragraph rhythm' },
	{ id: 'colors', label: 'Colors', icon: 'palette', description: 'Base colors, heading text, component & markdown styling, editor styling, navigation tree, tables, scrollbars' },
	{ id: 'elements', label: 'UI Elements', icon: 'layout-grid', description: 'Adjust opacity of UI chrome down to zero for minimalist layouts, frosted glass, and feature enhancements' },
	{ id: 'shadows', label: 'Shadows & Outlines', icon: 'layers', description: 'Drop shadows, neon glows, animated outlines' },
];

export interface SelectOption {
	label: string;
	value: string;
	group?: string;
}

/**
 * Calculate the next wrapped index when cycling through a list of options.
 * If the current value is not found in options, stepping forward selects the first option,
 * while stepping backward selects the last option.
 */
export function getNextWrappedIndex<T extends { value: string }>(
	options: T[],
	currentValue: string,
	delta: number,
): number {
	const total = options.length;
	if (total === 0) return -1;
	const currentIndex = options.findIndex((opt) => opt.value === currentValue);
	if (currentIndex < 0) {
		return delta > 0 ? 0 : total - 1;
	}
	return (((currentIndex + delta) % total) + total) % total;
}

export interface ShadowElementConfig {
	id: string;
	label: string;
	description: string;
	warning?: string;
	selector: string;
	kind: 'text' | 'box';
	supportsOutline: boolean;
	defaultMode: 'shadow' | 'glow';
	defaultX: string;
	defaultY: string;
	defaultBlur: string;
	defaultSpread: string;
	defaultColorDark: string;
	defaultColorLight: string;
	defaultOpacityDark: string;
	defaultOpacityLight: string;
	defaultOutlineWidth?: string;
	defaultOutlineColorDark?: string;
	defaultOutlineColorLight?: string;
	defaultAnimStyle?: string;
	defaultAnimSpeed?: string;
	defaultAnimArea?: string;
	defaultGradientEnabled?: boolean;
	defaultGradientColorDark?: string;
	defaultGradientColorLight?: string;
	defaultGradientAnim?: boolean;
	defaultOutlineGradientEnabled?: boolean;
	defaultOutlineGradientColorDark?: string;
	defaultOutlineGradientColorLight?: string;
}

export const SHADOW_ANIMATION_OPTIONS: SelectOption[] = [
	{ label: 'None (Static)', value: 'none' },
	{ label: 'Soft Pulse / Breathing Glow', value: 'pulse' },
	{ label: 'Deep Atmospheric Breath', value: 'breathe' },
	{ label: 'Cyber Neon Flicker', value: 'neon' },
	{ label: 'Shimmer Wave Sweep', value: 'shimmer' },
	{ label: 'Aurora Flow Shift', value: 'aurora' },
	{ label: 'Heartbeat Pulse Rhythm', value: 'heartbeat' },
	{ label: 'Floating Levitation', value: 'float' },
	{ label: 'Outline Ring Pulse', value: 'outline-pulse' },
	{ label: 'Spectrum / Rainbow Cycle', value: 'color-cycle' },
	{ label: 'Clockwise Loading Sweep', value: 'loading-spin' },
];

export const CHECKBOX_STYLE_OPTIONS: SelectOption[] = [
	{ label: '✓ Check Mark', value: 'checkmark' },
	{ label: '⬛ Solid Fill', value: 'fill' },
	{ label: '✕ Mark', value: 'x' },
	{ label: '😊 Smiley Face', value: 'smiley' },
];

/**
 * Background patterns, grouped exactly as the picker renders them.
 *
 * Order is load-bearing: `populateSelectOptions` opens each `<optgroup>` the
 * first time it sees the group name, so groups run structural to decorative
 * and entries are alphabetical inside each one.
 */
export const BACKGROUND_PATTERN_OPTIONS: SelectOption[] = [
	// --- Grids & Drafting ---
	{ label: '▩ Cross-Hatch Shading', value: 'cross-hatch', group: 'Grids & Drafting' },
	{ label: '▨ Diagonal Stripes', value: 'diagonal-stripes', group: 'Grids & Drafting' },
	{ label: '• Dot Grid', value: 'dot-grid', group: 'Grids & Drafting' },
	{ label: '▦ Graph Paper', value: 'graph-paper', group: 'Grids & Drafting' },
	{ label: '⬡ Hexagon Honeycomb Grid', value: 'hexagon-grid', group: 'Grids & Drafting' },
	{ label: '📐 Isometric Drafting Grid', value: 'isometric-grid', group: 'Grids & Drafting' },
	{ label: '📄 Lined Notebook', value: 'lined-notebook', group: 'Grids & Drafting' },
	{ label: '∑ Math', value: 'math', group: 'Grids & Drafting' },
	{ label: '✚ Plus Mark Lattice', value: 'plus-grid', group: 'Grids & Drafting' },
	{ label: '⏺ Polka Dots', value: 'polka-dots', group: 'Grids & Drafting' },
	{ label: '🔺 Triangle Mesh Tessellation', value: 'triangle-mesh', group: 'Grids & Drafting' },
	// --- Geometric & Ornamental ---
	{ label: '◈ Argyle Diamonds', value: 'argyle', group: 'Geometric & Ornamental' },
	{ label: '🧺 Basket Weave', value: 'basket-weave', group: 'Geometric & Ornamental' },
	{ label: '✝️ Centered Cross', value: 'centered-cross', group: 'Geometric & Ornamental' },
	{ label: '▲ Chevron Zigzag Bands', value: 'chevron', group: 'Geometric & Ornamental' },
	{ label: '🏛️ Greek Key Meander', value: 'greek-key', group: 'Geometric & Ornamental' },
	{ label: '🌊 Seigaiha', value: 'seigaiha', group: 'Geometric & Ornamental' },
	{ label: '⚪ Shippou', value: 'shippou', group: 'Geometric & Ornamental' },
	{ label: '☮️ Simple Peace Sign', value: 'peace-sign', group: 'Geometric & Ornamental' },
	{ label: '🦅 Stars & Stripes', value: 'stars-and-stripes', group: 'Geometric & Ornamental' },
	// --- Art Deco ---
	{ label: '🏛️ Deco Arches', value: 'deco-arches', group: 'Art Deco' },
	{ label: '💎 Deco Diamond Trellis', value: 'deco-diamond', group: 'Art Deco' },
	{ label: '🪶 Deco Fan', value: 'deco-fan', group: 'Art Deco' },
	{ label: '🐚 Deco Scallop Scales', value: 'deco-scales', group: 'Art Deco' },
	{ label: '☀️ Deco Sunburst', value: 'deco-sunburst', group: 'Art Deco' },
	// --- Nature & Elements ---
	{ label: '🍃 Botanical Leaves', value: 'botanical-leaves', group: 'Nature & Elements' },
	{ label: '🫧 Bubbles & Spheres', value: 'bubbles', group: 'Nature & Elements' },
	{ label: '✨ Ember Orbs', value: 'ember-orbs', group: 'Nature & Elements' },
	{ label: '🔥 Fire & Glowing Embers', value: 'fire-ember', group: 'Nature & Elements' },
	{ label: '🌲 Forest Treeline', value: 'forest-treeline', group: 'Nature & Elements' },
	{ label: '🌊 Japanese Ocean Wave', value: 'ocean-waves', group: 'Nature & Elements' },
	{ label: '⛰️ Mountain Range Horizon', value: 'mountain-range', group: 'Nature & Elements' },
	{ label: '🌧️ Rainfall Streaks', value: 'rainfall', group: 'Nature & Elements' },
	{ label: '🌅 Scenic Sunset', value: 'scenic-sunset', group: 'Nature & Elements' },
	{ label: '❄️ Snowfall Crystals', value: 'snowflakes', group: 'Nature & Elements' },
	{ label: '🗺️ Topographic Contours', value: 'topographic', group: 'Nature & Elements' },
	// --- Cosmic & Atmospheric ---
	{ label: '🌌 Aurora Glow', value: 'aurora-glow', group: 'Cosmic & Atmospheric' },
	{ label: '✴️ Constellation Star Chart', value: 'constellation', group: 'Cosmic & Atmospheric' },
	{ label: '🌙 Moon Phases', value: 'moon-phases', group: 'Cosmic & Atmospheric' },
	{ label: '🪐 Nebula', value: 'nebula', group: 'Cosmic & Atmospheric' },
	{ label: '🛰️ Orbital Rings', value: 'orbit-rings', group: 'Cosmic & Atmospheric' },
	{ label: '🎨 Plasma Mesh Wash', value: 'plasma-mesh', group: 'Cosmic & Atmospheric' },
	{ label: '🌈 Rainbow Spectrum', value: 'rainbow', group: 'Cosmic & Atmospheric' },
	{ label: '🌀 Spiral Galaxy', value: 'spiral-galaxy', group: 'Cosmic & Atmospheric' },
	{ label: '🔦 Spotlight Vignette', value: 'radial-vignette', group: 'Cosmic & Atmospheric' },
	{ label: '✨ Starry Night Sky', value: 'starry-sky', group: 'Cosmic & Atmospheric' },
	{ label: '🎨 Van Gogh Starry Night', value: 'van-gogh-swirl', group: 'Cosmic & Atmospheric' },
	// --- Cyber & Tech ---
	{ label: '💻 Binary Rain', value: 'matrix-binary', group: 'Cyber & Tech' },
	{ label: '🔌 Circuit Traces', value: 'circuit-traces', group: 'Cyber & Tech' },
	{ label: '📺 CRT Scanlines', value: 'crt-scanlines', group: 'Cyber & Tech' },
	{ label: '🫧 Frutiger Aero', value: 'frutiger-aero', group: 'Cyber & Tech' },
	{ label: '🖥️ Hacker', value: 'hacker', group: 'Cyber & Tech' },
	{ label: '🟢 Matrix Rain', value: 'matrix-rain', group: 'Cyber & Tech' },
	{ label: '🖲️ Motherboard', value: 'motherboard', group: 'Cyber & Tech' },
	{ label: '🟩 Pixel Static Dither', value: 'pixel-static', group: 'Cyber & Tech' },
	{ label: '🌇 Synthwave Horizon Grid', value: 'synthwave-grid', group: 'Cyber & Tech' },
	{ label: '🎚️ Waveform Bars', value: 'waveform-bars', group: 'Cyber & Tech' },
	// --- Textures & Materials ---
	{ label: '🏁 Carbon Fibre Weave', value: 'carbon-fibre', group: 'Textures & Materials' },
	{ label: '🧵 Linen Weave', value: 'linen-weave', group: 'Textures & Materials' },
	{ label: '🏛️ Marble Veins', value: 'marble-veins', group: 'Textures & Materials' },
	{ label: '📜 Paper Grain', value: 'paper-grain', group: 'Textures & Materials' },
	{ label: '🪨 Stone Flagstone', value: 'stone-slate', group: 'Textures & Materials' },
	{ label: '🪵 Woodgrain', value: 'woodgrain', group: 'Textures & Materials' },
	// --- Playful & Decorative ---
	{ label: '🐱 Cat Faces & Whiskers', value: 'cats', group: 'Playful & Decorative' },
	{ label: '🎉 Confetti Scatter', value: 'confetti', group: 'Playful & Decorative' },
	{ label: '🐤 Flappy Bird Pipes', value: 'flappy-bird', group: 'Playful & Decorative' },
	{ label: '💖 Floating Hearts', value: 'hearts', group: 'Playful & Decorative' },
	{ label: '🏴‍☠️ Jolly Roger', value: 'jolly-roger', group: 'Playful & Decorative' },
	{ label: '🎵 Music Notes', value: 'music-notes', group: 'Playful & Decorative' },
	{ label: '🐾 Paw Prints', value: 'paw-prints', group: 'Playful & Decorative' },
	{ label: '☠️ Skull & Crossbones', value: 'skull-crossbones', group: 'Playful & Decorative' },
	{ label: '✨ Sparkle Stars', value: 'sparkle-stars', group: 'Playful & Decorative' },
	{ label: '🧱 Tetris Blocks', value: 'tetris', group: 'Playful & Decorative' },
	{ label: '☯️ Yin-Yang', value: 'yin-yang', group: 'Playful & Decorative' },
];

export const BACKGROUND_SCOPE_OPTIONS: SelectOption[] = [
	{ label: 'Note Editor & Reading View', value: 'editor' },
	{ label: 'Full Obsidian Workspace', value: 'workspace' },
	{ label: 'Side Panels Only', value: 'sidebars' },
	{ label: 'Left Panel Only', value: 'left-sidebar' },
	{ label: 'Right Panel Only', value: 'right-sidebar' },
];

export const BACKGROUND_MOTION_ANIMATION_OPTIONS: SelectOption[] = [
	{ label: 'None (Static)', value: 'none' },
	{ label: '🌧️ Vertical Rain Stream', value: 'rain-scroll' },
	{ label: '🌧️ Horizontal Rain Stream', value: 'horizontal-rain-scroll' },
	{ label: '⬅️ Seamless Horizontal Side-Scroll', value: 'side-scroll' },
	{ label: '🔄 Seamless Rotation (Clockwise)', value: 'rotate-cw' },
	{ label: '🔄 Seamless Rotation (Counter-Clockwise)', value: 'rotate-ccw' },
	{ label: '🌊 Floating Diagonal Drift', value: 'drift' },
	{ label: '✨ Ambient Pulse & Breathe', value: 'pulse' },
];

export const BACKGROUND_COLOR_ANIMATION_OPTIONS: SelectOption[] = [
	{ label: 'None (Static)', value: 'none' },
	{ label: '🌈 Rainbow Hue Cycle', value: 'rainbow-cycle' },
	{ label: '🔄 Rotating Gradient Angle', value: 'gradient-rotate' },
	{ label: '⚡ Dynamic Gradient Shift', value: 'gradient-shift' },
	{ label: '💡 Cyber Neon Glow Surge', value: 'neon-glow' },
];

export const BACKGROUND_ANIMATION_OPTIONS: SelectOption[] = [
	{ label: 'None (Static)', value: 'none' },
	{ label: '🌧️ Vertical Rain Stream', value: 'rain-scroll' },
	{ label: '🌧️ Horizontal Rain Stream', value: 'horizontal-rain-scroll' },
	{ label: '⬅️ Seamless Horizontal Side-Scroll', value: 'side-scroll' },
	{ label: '🔄 Seamless Rotation (Clockwise)', value: 'rotate-cw' },
	{ label: '🔄 Seamless Rotation (Counter-Clockwise)', value: 'rotate-ccw' },
	{ label: '🌈 Rainbow Hue Cycle', value: 'rainbow-cycle' },
	{ label: '🔄 Rotating Gradient Angle', value: 'gradient-rotate' },
	{ label: '✨ Ambient Pulse & Breathe', value: 'pulse' },
	{ label: '🌊 Floating Diagonal Drift', value: 'drift' },
	{ label: '⚡ Dynamic Gradient Shift', value: 'gradient-shift' },
	{ label: '💡 Cyber Neon Glow Surge', value: 'neon-glow' },
];

/**
 * An animated background style: an ordered set of pattern frames that the
 * background cycles through, flipbook style.
 *
 * This is not a pattern plus a motion animation - each style owns its own
 * sequence of frames, and the generator swaps `background-image` between them
 * at discrete steps (see `css-bg-flip` in the background generator). The
 * `--ui-bg-flipbook` token names the active style; `'none'` is static.
 */
/** One pose of an animated animal, drawn by an animal builder at `frame`. */
export interface AnimatedPatternFrame {
	style: string;
	frame: number;
}

export interface AnimatedPatternStyle {
	id: string;
	label: string;
	/** Frame poses of one creature, in the order they play. */
	frames: AnimatedPatternFrame[];
	/**
	 * Seconds each frame is held. Defaults to 0.5s - fine for an animal pose,
	 * far too slow for a rain effect, which needs a real frame rate.
	 */
	frameSeconds?: number;
}

/** The pose sequence of one animal: `count` consecutive frames of `style`. */
function poses(style: string, count: number): AnimatedPatternFrame[] {
	return Array.from({ length: count }, (_, frame) => ({ style, frame }));
}

export const ANIMATED_PATTERN_STYLES: AnimatedPatternStyle[] = [
	{ id: 'wink-face', label: '😉 Winking Face', frames: poses('anim-wink', 12), frameSeconds: 0.15 },
	{ id: 'puppy-wink', label: '🐶 Puppy Blep', frames: poses('anim-puppy', 10) },
	{ id: 'kitten-wink', label: '🐱 Kitten Blep', frames: poses('anim-kitten', 8) },
	// 22 frames = MATRIX_FRAMES. The fade is wide (FADE/BACK_FADE), so each step
	// moves the brightness only a few percent - the tail stays smooth without
	// needing a frame per pixel of travel.
	{ id: 'matrix-fall', label: '🟩 Matrix Rain', frames: poses('anim-matrix', 22), frameSeconds: 0.14 },
];



export interface StyleControl {
	id: string;
	label: string;
	description?: string;
	category: 'features' | 'colors' | 'typography' | 'elements';
	subcategory?: string;
	variable: string; // e.g. '--text-normal'
	type: ControlType;
	defaultDarkValue: string;
	defaultLightValue: string;
	icon?: string;
	syntaxHint?: string;
	// Slider props
	min?: number;
	max?: number;
	step?: number;
	unit?: string;
	// Select props
	options?: SelectOption[];
	// Toggle props
	toggleTrueValue?: string;
	toggleFalseValue?: string;
	// Companion CSS rule binding custom token to Obsidian DOM elements
	companionCss?: string;
}

export const FONT_OPTIONS: SelectOption[] = [
	// --- Modern Clean Sans-Serif ---
	{
		label: 'System Sans-Serif (OS Default)',
		value: 'system-ui, -apple-system, BlinkMacSystemFont, "Noto Sans", sans-serif',
		group: 'Sans-Serif',
	},
	{
		label: 'Inter (Obsidian Default Sans)',
		value: '"Inter", "Noto Sans", sans-serif',
		group: 'Sans-Serif',
	},
	{
		label: 'Roboto (Material Clean)',
		value: '"Roboto", "Noto Sans", sans-serif',
		group: 'Sans-Serif',
	},
	{
		label: 'Open Sans (Friendly Sans)',
		value: '"Open Sans", "Noto Sans", sans-serif',
		group: 'Sans-Serif',
	},
	{
		label: 'Lato (Balanced Sans)',
		value: '"Lato", "Open Sans", sans-serif',
		group: 'Sans-Serif',
	},
	{
		label: 'Nunito Sans (Avenir-Style Geometric)',
		value: '"Nunito Sans", "Nunito", sans-serif',
		group: 'Sans-Serif',
	},
	{
		label: 'Archivo Narrow (Condensed Geometric)',
		value: '"Archivo Narrow", "Liberation Sans Narrow", sans-serif',
		group: 'Sans-Serif',
	},
	{
		label: 'Montserrat (Geometric Display)',
		value: '"Montserrat", sans-serif',
		group: 'Sans-Serif',
	},
	{
		label: 'Ubuntu (Distinctive Modern)',
		value: '"Ubuntu", "Noto Sans", sans-serif',
		group: 'Sans-Serif',
	},
	{
		label: 'Jost (Futura-Style Geometric)',
		value: '"Jost", "Montserrat", sans-serif',
		group: 'Sans-Serif',
	},
	{
		label: 'Alegreya Sans (Humanist Sans)',
		value: '"Alegreya Sans", "Open Sans", sans-serif',
		group: 'Sans-Serif',
	},
	{
		label: 'Arimo (Arial-Metric Compatible)',
		value: '"Arimo", "Liberation Sans", sans-serif',
		group: 'Sans-Serif',
	},
	{
		label: 'Archivo Black (Heavy Display Sans)',
		value: '"Archivo Black", "Anton", sans-serif',
		group: 'Sans-Serif',
	},
	{
		label: 'Barlow Semi Condensed (Arial Narrow Style)',
		value: '"Barlow Semi Condensed", "Barlow", sans-serif',
		group: 'Sans-Serif',
	},
	{
		label: 'Varela Round (Rounded Sans)',
		value: '"Varela Round", "Nunito", sans-serif',
		group: 'Sans-Serif',
	},
	{
		label: 'Barlow (DIN-Style Variable Sans)',
		value: '"Barlow", "Archivo", sans-serif',
		group: 'Sans-Serif',
	},
	{
		label: 'Carlito (Calibri-Metric Compatible)',
		value: '"Carlito", "Open Sans", sans-serif',
		group: 'Sans-Serif',
	},
	{
		label: 'Cabin (Fluent Soft Sans)',
		value: '"Cabin", "Open Sans", sans-serif',
		group: 'Sans-Serif',
	},
	{
		label: 'Karla (Clean Screen Sans)',
		value: '"Karla", "Open Sans", sans-serif',
		group: 'Sans-Serif',
	},
	{
		label: 'Barlow Condensed (Condensed Display)',
		value: '"Barlow Condensed", "Barlow", sans-serif',
		group: 'Sans-Serif',
	},
	{
		label: 'Noto Sans (Universal Sans)',
		value: '"Noto Sans", sans-serif',
		group: 'Sans-Serif',
	},
	{
		label: 'Libre Franklin (Franklin Gothic-Style)',
		value: '"Libre Franklin", "Public Sans", sans-serif',
		group: 'Sans-Serif',
	},
	{
		label: 'Andika (Literacy Sans)',
		value: '"Andika", "Noto Sans", sans-serif',
		group: 'Sans-Serif',
	},
	{
		label: 'Archivo (Helvetica-Style Grotesque)',
		value: '"Archivo", "Arimo", sans-serif',
		group: 'Sans-Serif',
	},
	{
		label: 'Hind (Humanist Sans)',
		value: '"Hind", "Open Sans", sans-serif',
		group: 'Sans-Serif',
	},
	{
		label: 'Public Sans (Neutral Grotesque)',
		value: '"Public Sans", "Arimo", sans-serif',
		group: 'Sans-Serif',
	},
	{
		label: 'Anton (Impact-Style Condensed)',
		value: '"Anton", "Archivo Black", sans-serif',
		group: 'Sans-Serif',
	},
	{
		label: 'Noto Sans Thai (Thai Script)',
		value: '"Noto Sans Thai", "Noto Sans", sans-serif',
		group: 'Sans-Serif',
	},
	{
		label: 'Noto Sans Display (Display Sans)',
		value: '"Noto Sans Display", "Noto Sans", sans-serif',
		group: 'Sans-Serif',
	},
	{
		label: 'Noto Sans KR (Korean)',
		value: '"Noto Sans KR", "Noto Sans", sans-serif',
		group: 'Sans-Serif',
	},
	{
		label: 'Noto Sans TC (Traditional Chinese)',
		value: '"Noto Sans TC", "Noto Sans", sans-serif',
		group: 'Sans-Serif',
	},
	{
		label: 'Hanken Grotesk (Universal Sans)',
		value: '"Hanken Grotesk", "Arimo", sans-serif',
		group: 'Sans-Serif',
	},
	{
		label: 'Noto Sans SC (Simplified Chinese)',
		value: '"Noto Sans SC", "Noto Sans", sans-serif',
		group: 'Sans-Serif',
	},
	{
		label: 'Noto Sans Devanagari (Devanagari)',
		value: '"Noto Sans Devanagari", "Noto Sans", sans-serif',
		group: 'Sans-Serif',
	},
	{
		label: 'Fira Sans (Humanist Sans)',
		value: '"Fira Sans", "Open Sans", sans-serif',
		group: 'Sans-Serif',
	},
	{
		label: 'Atkinson Hyperlegible (Legible Screen Sans)',
		value: '"Atkinson Hyperlegible", "Noto Sans", sans-serif',
		group: 'Sans-Serif',
	},
	{
		label: 'Istok Web (Punchy Sans)',
		value: '"Istok Web", "Open Sans", sans-serif',
		group: 'Sans-Serif',
	},
	{
		label: 'Lexend (Readability Sans)',
		value: '"Lexend", "Noto Sans", sans-serif',
		group: 'Sans-Serif',
	},
	{
		label: 'Noto Sans JP (Japanese)',
		value: '"Noto Sans JP", "Noto Sans", sans-serif',
		group: 'Sans-Serif',
	},

	// --- Literary, Editorial & Bookish Serifs ---
	{
		label: 'Lora (Beloved Editorial Serif)',
		value: '"Lora", "Noto Serif", serif',
		group: 'Serif',
	},
	{
		label: 'Charis SIL (Charter-Style Book Serif)',
		value: '"Charis SIL", "Noto Serif", serif',
		group: 'Serif',
	},
	{
		label: 'Gelasio (Georgia-Metric Compatible)',
		value: '"Gelasio", "Noto Serif", serif',
		group: 'Serif',
	},
	{
		label: 'Libre Baskerville (Baskerville-Style Serif)',
		value: '"Libre Baskerville", "Noto Serif", serif',
		group: 'Serif',
	},
	{
		label: 'EB Garamond (Old-Style Book Serif)',
		value: '"EB Garamond", "Cardo", serif',
		group: 'Serif',
	},
	{
		label: 'Courier Prime (Typewriter Serif)',
		value: '"Courier Prime", "Bitter", serif',
		group: 'Serif',
	},
	{
		label: 'Playfair Display (Caslon-Style Display)',
		value: '"Playfair Display", "Cormorant Garamond", serif',
		group: 'Serif',
	},
	{
		label: 'Bodoni Moda (Didone Display)',
		value: '"Bodoni Moda", "Libre Bodoni", serif',
		group: 'Serif',
	},
	{
		label: 'Libre Bodoni (Didone Oldstyle)',
		value: '"Libre Bodoni", "Bodoni Moda", serif',
		group: 'Serif',
	},
	{
		label: 'Gentium Book Plus (Humanist Book Serif)',
		value: '"Gentium Book Plus", "Noto Serif", serif',
		group: 'Serif',
	},
	{
		label: 'Fraunces (Soft Display Serif)',
		value: '"Fraunces", "Noto Serif", serif',
		group: 'Serif',
	},
	{
		label: 'Caladea (Cambria-Metric Compatible)',
		value: '"Caladea", "Noto Serif", serif',
		group: 'Serif',
	},
	{
		label: 'Cormorant (Old-Style Serif)',
		value: '"Cormorant", "EB Garamond", serif',
		group: 'Serif',
	},
	{
		label: 'Source Serif 4 (Transitional Serif)',
		value: '"Source Serif 4", "Noto Serif", serif',
		group: 'Serif',
	},
	{
		label: 'Prata (Didone Display)',
		value: '"Prata", "Playfair Display", serif',
		group: 'Serif',
	},
	{
		label: 'Cardo (Classical Book Serif)',
		value: '"Cardo", "EB Garamond", serif',
		group: 'Serif',
	},
	{
		label: 'Spectral (Screen Serif)',
		value: '"Spectral", "Noto Serif", serif',
		group: 'Serif',
	},
	{
		label: 'Roboto Slab (Slab Serif)',
		value: '"Roboto Slab", "Bitter", serif',
		group: 'Serif',
	},
	{
		label: 'Gentium Plus (Book Serif)',
		value: '"Gentium Plus", "Noto Serif", serif',
		group: 'Serif',
	},
	{
		label: 'Noto Serif (Universal Serif)',
		value: '"Noto Serif", serif',
		group: 'Serif',
	},
	{
		label: 'Tinos (Times-Metric Compatible)',
		value: '"Tinos", "Liberation Serif", serif',
		group: 'Serif',
	},

	// --- Developer & Monospace PKM Fonts ---
	{
		label: 'Source Code Pro (Obsidian Default Monospace)',
		value: '"Source Code Pro", "Noto Sans Mono", monospace',
		group: 'Monospace',
	},
	{
		label: 'JetBrains Mono (Top Developer Monospace)',
		value: '"JetBrains Mono", "Noto Sans Mono", monospace',
		group: 'Monospace',
	},
	{
		label: 'Cascadia Code (Modern Terminal Mono)',
		value: '"Cascadia Code", "Cascadia Mono", monospace',
		group: 'Monospace',
	},
	{
		label: 'Fira Code (Ligature-Rich Programming)',
		value: '"Fira Code", "Noto Sans Mono", monospace',
		group: 'Monospace',
	},
	{
		label: 'IBM Plex Mono (Industrial PKM Mono)',
		value: '"IBM Plex Mono", "Noto Sans Mono", monospace',
		group: 'Monospace',
	},
	{
		label: 'Cousine (Courier-Metric Compatible)',
		value: '"Cousine", "Liberation Mono", monospace',
		group: 'Monospace',
	},
	{
		label: 'Space Mono (Screen Mono)',
		value: '"Space Mono", "Noto Sans Mono", monospace',
		group: 'Monospace',
	},
	{
		label: 'Noto Sans Mono (Clean Mono)',
		value: '"Noto Sans Mono", "DejaVu Sans Mono", monospace',
		group: 'Monospace',
	},

	// --- Script & Decorative ---
	{
		label: 'Caveat (Handwritten)',
		value: '"Caveat", cursive',
		group: 'Script & Decorative',
	},
	{
		label: 'Pacifico (Brush Script)',
		value: '"Pacifico", "Comic Neue", cursive',
		group: 'Script & Decorative',
	},
	{
		label: 'Comic Neue (Comic Sans Compatible)',
		value: '"Comic Neue", "Patrick Hand", cursive',
		group: 'Script & Decorative',
	},
	{
		label: 'Cinzel (Engraved Caps)',
		value: '"Cinzel", "Cinzel Decorative", serif',
		group: 'Script & Decorative',
	},
	{
		label: 'Great Vibes (Calligraphic Script)',
		value: '"Great Vibes", "Allura", cursive',
		group: 'Script & Decorative',
	},
	{
		label: 'Shadows Into Light (Casual Ink)',
		value: '"Shadows Into Light", cursive',
		group: 'Script & Decorative',
	},
	{
		label: 'Permanent Marker (Marker Felt-Style)',
		value: '"Permanent Marker", cursive',
		group: 'Script & Decorative',
	},
	{
		label: 'Patrick Hand (Notebook Hand)',
		value: '"Patrick Hand", cursive',
		group: 'Script & Decorative',
	},
	{
		label: 'Uncial Antiqua (Fantasy Display)',
		value: '"Uncial Antiqua", fantasy',
		group: 'Script & Decorative',
	},
	{
		label: 'Bebas Neue (Condensed Display)',
		value: '"Bebas Neue", "Oswald", sans-serif',
		group: 'Script & Decorative',
	},
	{
		label: 'Allura (Elegant Script)',
		value: '"Allura", "Great Vibes", cursive',
		group: 'Script & Decorative',
	},
	{
		label: 'Handlee (Print Handwriting)',
		value: '"Handlee", cursive',
		group: 'Script & Decorative',
	},
	{
		label: 'Dancing Script (Flowing Script)',
		value: '"Dancing Script", cursive',
		group: 'Script & Decorative',
	},
	{
		label: 'Kaushan Script (Sign Painter Script)',
		value: '"Kaushan Script", cursive',
		group: 'Script & Decorative',
	},
];

export const STYLE_CONTROLS: StyleControl[] = [
	// 1. Feature Toggles
	{
		id: 'readable-line-length',
		label: 'Constrain Line Width',
		category: 'features',
		variable: '--file-line-width',
		type: 'toggle',
		defaultDarkValue: '750px',
		defaultLightValue: '750px',
		toggleTrueValue: '750px',
		toggleFalseValue: '100%',
	},
	{
		id: 'h1-border',
		label: 'Header 1 Divider Line',
		category: 'features',
		variable: '--h1-border-bottom',
		type: 'toggle',
		defaultDarkValue: 'none',
		defaultLightValue: 'none',
		toggleTrueValue: '1px solid var(--background-modifier-border)',
		toggleFalseValue: 'none',
		companionCss: `
.markdown-rendered h1,
.inline-title,
.HyperMD-header-1,
.cm-line.HyperMD-header-1 {
  border-bottom: var(--h1-border-bottom) !important;
  padding-bottom: var(--h1-border-padding, 4px) !important;
}`,
	},
	{
		id: 'bold-folder-headers',
		label: 'Bold File Tree Folders',
		category: 'features',
		variable: '--nav-folder-weight',
		type: 'toggle',
		defaultDarkValue: '400',
		defaultLightValue: '400',
		toggleTrueValue: '700',
		toggleFalseValue: '400',
		companionCss: `
.nav-folder-title,
.nav-folder-title .nav-folder-title-content {
  font-weight: var(--nav-folder-weight) !important;
}`,
	},
	{
		id: 'glass-look',
		label: 'Frosted Glass Look',
		description: 'Translucent frosted glass with real-time blur across sidebars, tab headers, floating menus, and modals',
		category: 'features',
		variable: '--glass-enabled',
		type: 'toggle',
		defaultDarkValue: 'false',
		defaultLightValue: 'false',
		toggleTrueValue: 'true',
		toggleFalseValue: 'false',
	},
	{
		id: 'glass-opacity',
		label: 'Glass Background Opacity',
		description: 'Opacity of translucent glass surfaces (lower = more transparent, 0% = fully transparent)',
		category: 'features',
		variable: '--glass-opacity',
		type: 'slider',
		defaultDarkValue: '0.75',
		defaultLightValue: '0.80',
		min: 0,
		max: 1.0,
		step: 0.01,
		unit: '',
	},
	{
		id: 'glass-blur',
		label: 'Glass Blur Strength',
		description: 'Backdrop filter blur radius in pixels',
		category: 'features',
		variable: '--glass-blur',
		type: 'slider',
		defaultDarkValue: '48px',
		defaultLightValue: '48px',
		min: 0,
		max: 48,
		step: 1,
		unit: 'px',
	},
	{
		id: 'glass-tint-enabled',
		label: 'Glass Screen Tint',
		description: 'Enable custom color tinting for the transparent glass screen',
		category: 'features',
		variable: '--glass-tint-enabled',
		type: 'toggle',
		defaultDarkValue: 'false',
		defaultLightValue: 'false',
		toggleTrueValue: 'true',
		toggleFalseValue: 'false',
	},
	{
		id: 'glass-tint-color',
		label: 'Glass Tint Color',
		description: 'Color tint applied to translucent glass surfaces and transparent screen',
		category: 'features',
		variable: '--glass-tint-color',
		type: 'color',
		defaultDarkValue: '#7a3ee8',
		defaultLightValue: '#7a3ee8',
	},
	{
		id: 'checkbox-style',
		label: 'Task Checkbox Style',
		category: 'elements',
		subcategory: 'Layout Mods',
		variable: '--checkbox-style',
		type: 'select',
		icon: 'square-check',
		defaultDarkValue: 'checkmark',
		defaultLightValue: 'checkmark',
		options: CHECKBOX_STYLE_OPTIONS,
	},

	// --- Layout Mods (UI Elements Tab) ---
	{
		id: 'layout-vertical-tabs',
		label: 'Vertical Note Tabs',
		category: 'elements',
		subcategory: 'Layout Mods',
		variable: '--layout-vertical-tabs',
		type: 'toggle',
		icon: 'columns-2',
		defaultDarkValue: 'false',
		defaultLightValue: 'false',
		toggleTrueValue: 'true',
		toggleFalseValue: 'false',
		companionCss: `
.workspace-split.mod-root .workspace-tabs {
  position: relative !important;
  --tab-outline-color: transparent !important;
  --tab-divider-color: transparent !important;
  --tab-border-color-active: transparent !important;
  --tab-indicator-color: transparent !important;
  --tab-indicator-thickness: 0px !important;
  --tab-indicator-display: none !important;
  --tab-indicator-height: 0px !important;
  --tab-indicator-width: 0px !important;
  --tab-curve: 0px !important;
}
.workspace-split.mod-root .workspace-tabs .workspace-tab-container {
  margin-left: var(--layout-vertical-tabs-width, 32px) !important;
  width: calc(100% - var(--layout-vertical-tabs-width, 32px)) !important;
  height: 100% !important;
  overflow: hidden !important;
  position: relative !important;
  z-index: 1 !important;
}
.workspace-split.mod-root .workspace-tabs .view-header {
  -webkit-app-region: no-drag !important;
  app-region: no-drag !important;
}
.workspace-split.mod-root .workspace-tabs .view-header-title-container,
.workspace-split.mod-root .workspace-tabs .view-header-title {
  -webkit-app-region: drag !important;
  app-region: drag !important;
  cursor: grab !important;
}
.workspace-split.mod-root .workspace-tabs .view-header-left,
.workspace-split.mod-root .workspace-tabs .view-header-left *,
.workspace-split.mod-root .workspace-tabs .view-actions,
.workspace-split.mod-root .workspace-tabs .view-actions *,
.workspace-tab-header-tab-list,
.workspace-tab-header-tab-list *,
.sidebar-toggle-button.mod-right,
.sidebar-toggle-button.mod-right *,
.workspace-split.mod-root .workspace-tabs .workspace-tab-header-tab-list,
.workspace-split.mod-root .workspace-tabs .workspace-tab-header-tab-list *,
.workspace-split.mod-root .sidebar-toggle-button.mod-right,
.workspace-split.mod-root .sidebar-toggle-button.mod-right *,
.workspace-split.mod-root .workspace-tabs .sidebar-toggle-button.mod-right,
.workspace-split.mod-root .workspace-tabs .sidebar-toggle-button.mod-right *,
.workspace-split.mod-root .workspace-tab-header-container .sidebar-toggle-button.mod-right,
.workspace-split.mod-root .workspace-tab-header-container .sidebar-toggle-button.mod-right *,
.workspace-split.mod-root .workspace-tabs .workspace-tab-header-new-tab,
.workspace-split.mod-root .workspace-tabs .workspace-tab-header-new-tab *,
.workspace-split.mod-root .workspace-tabs .workspace-tab-header,
.workspace-split.mod-root .workspace-tabs .workspace-tab-header * {
  -webkit-app-region: no-drag !important;
  app-region: no-drag !important;
  pointer-events: auto !important;
}
.workspace-split.mod-root .workspace-tabs .view-actions {
  margin-right: 84px !important;
}
.workspace-split.mod-root .workspace-tabs.mod-top-right-space .view-actions,
.workspace-split.mod-root .workspace-tabs .workspace-tab-header-container.mod-top-right-space ~ .workspace-tab-container .view-actions {
  margin-right: calc(var(--titlebar-width, 138px) + 84px) !important;
}
.workspace-split.mod-root .workspace-tabs .view-header-title-container {
  padding-right: 188px !important;
}
.workspace-split.mod-root .workspace-tabs.mod-top-right-space .view-header-title-container,
.workspace-split.mod-root .workspace-tabs .workspace-tab-header-container.mod-top-right-space ~ .workspace-tab-container .view-header-title-container {
  padding-right: calc(var(--titlebar-width, 138px) + 188px) !important;
}
.workspace-split.mod-root .workspace-tabs .workspace-tab-header-container {
  position: absolute !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  height: var(--header-height, 40px) !important;
  max-height: var(--header-height, 40px) !important;
  padding: 0 !important;
  margin: 0 !important;
  border: none !important;
  background: transparent !important;
  overflow: visible !important;
  pointer-events: none !important;
  /* Sits above the tab content (z-index 1) but below Obsidian's tooltip and
     menu layers. At 9999 the opaque rail painted over tab/nav hover tooltips
     and clipped their descriptive text at the rail edge. */
  z-index: 10 !important;
  display: block !important;
}
.workspace-split.mod-root .workspace-tabs .workspace-tab-header-container::after {
  display: none !important;
}
.workspace-split.mod-root .workspace-tabs .workspace-tab-header-container::before {
  content: "" !important;
  position: absolute !important;
  top: 0 !important;
  left: 0 !important;
  width: var(--layout-vertical-tabs-width, 32px) !important;
  height: var(--header-height, 40px) !important;
  background-color: var(--tab-container-background) !important;
  border-right: 1px solid var(--background-modifier-border) !important;
  border-bottom: 1px solid var(--background-modifier-border) !important;
  box-sizing: border-box !important;
  pointer-events: none !important;
  z-index: 20 !important;
}
.workspace-split.mod-root .workspace-tabs .workspace-tab-header-container-inner {
  position: absolute !important;
  top: var(--header-height, 40px) !important;
  left: 0 !important;
  width: var(--layout-vertical-tabs-width, 32px) !important;
  bottom: 0 !important;
  height: calc(100vh - var(--header-height, 40px)) !important;
  max-height: calc(100vh - var(--header-height, 40px)) !important;
  background-color: var(--tab-container-background) !important;
  border-right: 1px solid var(--background-modifier-border) !important;
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  gap: 2px !important;
  padding: 6px 1px 40px 1px !important;
  margin: 0 !important;
  overflow-y: auto !important;
  overflow-x: hidden !important;
  scrollbar-width: none !important;
  scrollbar-color: transparent transparent !important;
  -ms-overflow-style: none !important;
  pointer-events: auto !important;
  box-sizing: border-box !important;
  z-index: 22 !important;
  -webkit-app-region: no-drag !important;
  app-region: no-drag !important;
}
/* Hide only the rail's own scrollbar, so nothing else in the app loses a
   scrollbar. */
.workspace-split.mod-root .workspace-tabs .workspace-tab-header-container-inner,
.workspace-split.mod-root .workspace-tabs .workspace-tab-header-container-inner * {
  scrollbar-width: none !important;
  scrollbar-color: transparent transparent !important;
  -ms-overflow-style: none !important;
}
.workspace-split.mod-root .workspace-tabs .workspace-tab-header-container-inner::-webkit-scrollbar,
.workspace-split.mod-root .workspace-tabs .workspace-tab-header-container-inner *::-webkit-scrollbar {
  display: none !important;
  width: 0 !important;
  height: 0 !important;
  background: transparent !important;
}
/* Up/down arrows for an over-filled rail. Rendered by the plugin on body with
   fixed positioning, then anchored over the rail via inline coordinates. */
.csi-vt-nav-arrow {
  position: fixed;
  z-index: 40;
  display: none;
  align-items: center;
  justify-content: center;
  /* Match the column's width and centre on it, so the arrows read as part of
     the rail rather than floating to one side. */
  width: calc(var(--layout-vertical-tabs-width, 32px) - 8px);
  height: 20px;
  padding: 0;
  transform: translateX(-50%);
  border: 1px solid var(--background-modifier-border);
  border-radius: var(--radius-s, 4px);
  background-color: var(--tab-container-background, var(--background-secondary));
  color: var(--text-muted);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  cursor: pointer;
}
.csi-vt-nav-arrow.is-visible {
  display: flex;
}
.csi-vt-nav-arrow:hover {
  color: var(--text-normal);
  background-color: var(--background-modifier-hover);
}
.csi-vt-nav-arrow svg {
  width: 14px;
  height: 14px;
}
.workspace-split.mod-root .workspace-tabs .workspace-tab-header,
.workspace-split.mod-root .workspace-tabs .workspace-tab-header.is-active,
.workspace-split.mod-root .workspace-tabs .workspace-tab-header:hover,
.workspace-split.mod-root .workspace-tabs .workspace-tab-header:focus,
.workspace-split.mod-root .workspace-tabs .workspace-tab-header:focus-visible,
.workspace-split.mod-root .workspace-tabs .workspace-tab-header-inner,
.workspace-split.mod-root .workspace-tabs .workspace-tab-header-inner-title {
  border: none !important;
  border-left: none !important;
  border-right: none !important;
  border-top: none !important;
  border-bottom: none !important;
  outline: none !important;
  box-shadow: none !important;
  text-decoration: none !important;
}
.workspace-split.mod-root .workspace-tabs .workspace-tab-header::before,
.workspace-split.mod-root .workspace-tabs .workspace-tab-header::after,
.workspace-split.mod-root .workspace-tabs .workspace-tab-header-inner::before,
.workspace-split.mod-root .workspace-tabs .workspace-tab-header-inner::after,
.workspace-split.mod-root .workspace-tabs .workspace-tab-header-inner-title::before,
.workspace-split.mod-root .workspace-tabs .workspace-tab-header-inner-title::after,
.workspace-split.mod-root .workspace-tabs .workspace-tab-header *::before,
.workspace-split.mod-root .workspace-tabs .workspace-tab-header *::after,
.workspace-split.mod-root .workspace-tabs .tab-indicator,
.workspace-split.mod-root .workspace-tabs .active-tab-indicator,
.workspace-split.mod-root .workspace-tabs .workspace-tab-header-indicator,
.workspace-split.mod-root .workspace-tabs .workspace-tab-header-bar,
.workspace-split.mod-root .workspace-tabs .workspace-tab-header-tab-bar {
  display: none !important;
  content: none !important;
  border: none !important;
  background: transparent !important;
  width: 0 !important;
  height: 0 !important;
  box-shadow: none !important;
}
.workspace-split.mod-root .workspace-tabs .workspace-tab-header {
  width: calc(var(--layout-vertical-tabs-width, 32px) - 4px) !important;
  max-width: calc(var(--layout-vertical-tabs-width, 32px) - 4px) !important;
  min-width: calc(var(--layout-vertical-tabs-width, 32px) - 4px) !important;
  height: auto !important;
  min-height: 48px !important;
  max-height: none !important;
  flex: 0 0 auto !important;
  border-radius: var(--radius-m, 8px) !important;
  margin: 1px 0 !important;
  padding: 10px 3px !important;
  gap: 6px !important;
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  justify-content: flex-start !important;
  box-sizing: border-box !important;
  overflow: visible !important;
  cursor: pointer !important;
  background-color: transparent;
  color: var(--text-muted) !important;
  transition: background-color 0.15s ease, color 0.15s ease !important;
  -webkit-app-region: no-drag !important;
  app-region: no-drag !important;
}
.workspace-split.mod-root .workspace-tabs .workspace-tab-header:hover {
  background-color: var(--background-modifier-hover) !important;
  color: var(--text-normal) !important;
}
.workspace-split.mod-root .workspace-tabs .workspace-tab-header.is-active {
  background-color: var(--tab-background-active) !important;
  color: var(--tab-text-color-active, var(--text-normal)) !important;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12) !important;
}
.workspace-split.mod-root .workspace-tabs .workspace-tab-header-inner {
  width: 100% !important;
  height: auto !important;
  max-height: none !important;
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  justify-content: flex-start !important;
  gap: 6px !important;
  overflow: visible !important;
  padding: 0 !important;
}
/* Obsidian also paints a hover/active background on the inner wrapper, which
   stacks a second inset box on top of the outer tab. Keep only the outer. */
.workspace-split.mod-root .workspace-tabs .workspace-tab-header-inner,
.workspace-split.mod-root .workspace-tabs .workspace-tab-header-inner:hover,
.workspace-split.mod-root .workspace-tabs .workspace-tab-header-inner:focus,
.workspace-split.mod-root .workspace-tabs .workspace-tab-header:hover .workspace-tab-header-inner,
.workspace-split.mod-root .workspace-tabs .workspace-tab-header.is-active .workspace-tab-header-inner {
  background-color: transparent !important;
  background-image: none !important;
  box-shadow: none !important;
}
.workspace-split.mod-root .workspace-tabs .workspace-tab-header-inner-icon {
  display: none !important;
}
.workspace-split.mod-root .workspace-tabs .workspace-tab-header-inner-title {
  writing-mode: vertical-rl !important;
  text-orientation: sideways !important;
  transform: none !important;
  text-align: left !important;
  white-space: nowrap !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  contain: paint !important;
  max-height: 200px !important;
  width: auto !important;
  max-width: calc(var(--layout-vertical-tabs-width, 32px) - 10px) !important;
  line-height: 1.2 !important;
  font-size: var(--font-ui-size, 13px) !important;
  letter-spacing: 0.02em !important;
  padding: 6px 0 !important;
  flex: 0 1 auto !important;
  pointer-events: auto !important;
}
.workspace-split.mod-root .workspace-tabs .workspace-tab-header-inner-close-button {
  -webkit-app-region: no-drag !important;
  app-region: no-drag !important;
  cursor: pointer !important;
  position: relative !important;
  z-index: 20 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  margin: 0 !important;
  padding: 1px !important;
  width: 16px !important;
  height: 16px !important;
  min-width: 16px !important;
  min-height: 16px !important;
  border-radius: var(--radius-s, 4px) !important;
  flex-shrink: 0 !important;
  transition: opacity 0.15s ease, background-color 0.15s ease !important;
}
.workspace-split.mod-root .workspace-tabs .workspace-tab-header.is-active .workspace-tab-header-inner-close-button {
  opacity: 0.7 !important;
  pointer-events: auto !important;
}
.workspace-split.mod-root .workspace-tabs .workspace-tab-header:not(.is-active) .workspace-tab-header-inner-close-button {
  opacity: 0 !important;
  pointer-events: none !important;
}
.workspace-split.mod-root .workspace-tabs .workspace-tab-header:not(.is-active):hover .workspace-tab-header-inner-close-button {
  opacity: 0.7 !important;
  pointer-events: auto !important;
}
.workspace-split.mod-root .workspace-tabs .workspace-tab-header-inner-close-button:hover {
  opacity: 1 !important;
  background-color: var(--background-modifier-hover) !important;
}
.workspace-split.mod-root .workspace-tabs .workspace-tab-header-inner-close-button svg {
  pointer-events: none !important;
  width: 11px !important;
  height: 11px !important;
}
.workspace-split.mod-root .workspace-tabs .workspace-tab-header-new-tab {
  position: absolute !important;
  top: 8px !important;
  left: calc((var(--layout-vertical-tabs-width, 32px) - 24px) / 2) !important;
  width: 24px !important;
  height: 24px !important;
  min-width: 24px !important;
  min-height: 24px !important;
  max-width: 24px !important;
  max-height: 24px !important;
  margin: 0 !important;
  padding: 0 !important;
  z-index: 25 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  border-radius: var(--radius-s, 4px) !important;
  color: var(--text-muted) !important;
  cursor: pointer !important;
  background-color: transparent !important;
  pointer-events: auto !important;
  -webkit-app-region: no-drag !important;
  app-region: no-drag !important;
  transition: background-color 0.15s ease, color 0.15s ease !important;
}
.workspace-split.mod-root .workspace-tabs .workspace-tab-header-new-tab:hover {
  color: var(--text-normal) !important;
  background-color: var(--background-modifier-hover) !important;
}
.workspace-split.mod-root .workspace-tabs .workspace-tab-header-new-tab .clickable-icon {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: 100% !important;
  height: 100% !important;
  margin: 0 !important;
  padding: 0 !important;
  pointer-events: auto !important;
}
.workspace-split.mod-root .workspace-tabs .workspace-tab-header-new-tab .clickable-icon svg {
  width: 14px !important;
  height: 14px !important;
  pointer-events: auto !important;
}
.workspace-tab-header-tab-list,
.workspace-tabs .workspace-tab-header-tab-list,
.workspace-split.mod-root .workspace-tabs .workspace-tab-header-tab-list {
  position: absolute !important;
  top: 4px !important;
  right: 44px !important;
  z-index: 10000 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: 32px !important;
  height: 32px !important;
  min-width: 32px !important;
  min-height: 32px !important;
  max-width: 32px !important;
  max-height: 32px !important;
  margin: 0 !important;
  padding: 4px !important;
  box-sizing: border-box !important;
  border-radius: var(--clickable-icon-radius, var(--radius-s, 4px)) !important;
  color: var(--text-muted) !important;
  cursor: pointer !important;
  background-color: transparent !important;
  transition: background-color 0.15s ease, color 0.15s ease !important;
  -webkit-app-region: no-drag !important;
  app-region: no-drag !important;
  pointer-events: auto !important;
}
.workspace-tab-header-tab-list:hover,
.workspace-tabs .workspace-tab-header-tab-list:hover,
.workspace-split.mod-root .workspace-tabs .workspace-tab-header-tab-list:hover {
  color: var(--text-normal) !important;
  background-color: var(--background-modifier-hover) !important;
}
.workspace-tab-header-tab-list svg,
.workspace-tabs .workspace-tab-header-tab-list svg,
.workspace-split.mod-root .workspace-tabs .workspace-tab-header-tab-list svg {
  display: block !important;
  pointer-events: auto !important;
  cursor: pointer !important;
  width: 18px !important;
  height: 18px !important;
  -webkit-app-region: no-drag !important;
  app-region: no-drag !important;
}
.sidebar-toggle-button.mod-right,
.workspace-split .sidebar-toggle-button.mod-right,
.workspace-tabs .sidebar-toggle-button.mod-right,
.workspace-split.mod-root .sidebar-toggle-button.mod-right,
.workspace-split.mod-root .workspace-tabs .sidebar-toggle-button.mod-right,
.workspace-split.mod-root .workspace-tab-header-container .sidebar-toggle-button.mod-right {
  position: absolute !important;
  top: 4px !important;
  right: 8px !important;
  z-index: 10000 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: 32px !important;
  height: 32px !important;
  min-width: 32px !important;
  min-height: 32px !important;
  max-width: 32px !important;
  max-height: 32px !important;
  margin: 0 !important;
  padding: 4px !important;
  box-sizing: border-box !important;
  border-radius: var(--clickable-icon-radius, var(--radius-s, 4px)) !important;
  color: var(--text-muted) !important;
  cursor: pointer !important;
  background-color: transparent !important;
  transition: background-color 0.15s ease, color 0.15s ease !important;
  -webkit-app-region: no-drag !important;
  app-region: no-drag !important;
  pointer-events: auto !important;
}
.sidebar-toggle-button.mod-right:hover,
.workspace-split .sidebar-toggle-button.mod-right:hover,
.workspace-tabs .sidebar-toggle-button.mod-right:hover,
.workspace-split.mod-root .sidebar-toggle-button.mod-right:hover,
.workspace-split.mod-root .workspace-tabs .sidebar-toggle-button.mod-right:hover,
.workspace-split.mod-root .workspace-tab-header-container .sidebar-toggle-button.mod-right:hover {
  color: var(--text-normal) !important;
  background-color: var(--background-modifier-hover) !important;
}
.sidebar-toggle-button.mod-right svg,
.workspace-split .sidebar-toggle-button.mod-right svg,
.workspace-tabs .sidebar-toggle-button.mod-right svg,
.workspace-split.mod-root .sidebar-toggle-button.mod-right svg,
.workspace-split.mod-root .workspace-tabs .sidebar-toggle-button.mod-right svg,
.workspace-split.mod-root .workspace-tab-header-container .sidebar-toggle-button.mod-right svg {
  display: block !important;
  pointer-events: auto !important;
  cursor: pointer !important;
  width: 18px !important;
  height: 18px !important;
  -webkit-app-region: no-drag !important;
  app-region: no-drag !important;
}
.workspace-tabs.mod-top-right-space .sidebar-toggle-button.mod-right,
.workspace-tab-header-container.mod-top-right-space .sidebar-toggle-button.mod-right,
.workspace-split.mod-root .workspace-tabs.mod-top-right-space .sidebar-toggle-button.mod-right,
.workspace-split.mod-root .workspace-tabs .workspace-tab-header-container.mod-top-right-space .sidebar-toggle-button.mod-right {
  right: calc(var(--titlebar-width, 138px) + 8px) !important;
}
.workspace-tabs.mod-top-right-space .workspace-tab-header-tab-list,
.workspace-tab-header-container.mod-top-right-space .workspace-tab-header-tab-list,
.workspace-split.mod-root .workspace-tabs.mod-top-right-space .workspace-tab-header-tab-list,
.workspace-split.mod-root .workspace-tabs .workspace-tab-header-container.mod-top-right-space .workspace-tab-header-tab-list {
  right: calc(var(--titlebar-width, 138px) + 44px) !important;
}
.workspace-split.mod-root .workspace-tabs .workspace-tab-header-spacer {
  display: none !important;
}
`,
	},
	{
		id: 'layout-vertical-tabs-width',
		label: 'Vertical Tabs Width',
		category: 'elements',
		subcategory: 'Layout Mods',
		variable: '--layout-vertical-tabs-width',
		type: 'slider',
		icon: 'move-horizontal',
		defaultDarkValue: '32px',
		defaultLightValue: '32px',
		min: 24,
		max: 120,
		step: 1,
		unit: 'px',
	},
	{
		id: 'layout-autohide-statusbar',
		label: 'Auto-Hide Status Bar',
		category: 'elements',
		subcategory: 'Layout Mods',
		variable: '--layout-autohide-statusbar',
		type: 'toggle',
		icon: 'activity',
		defaultDarkValue: 'false',
		defaultLightValue: 'false',
		toggleTrueValue: 'true',
		toggleFalseValue: 'false',
		companionCss: `
.status-bar {
  opacity: 0 !important;
  transform: translateY(100%) !important;
  transition: opacity 0.25s ease 0.15s, transform 0.25s ease 0.15s !important;
  pointer-events: none !important;
}
.status-bar::after,
.app-container .status-bar::after {
  content: "" !important;
  display: block !important;
  position: absolute !important;
  bottom: -14px !important;
  right: -18px !important;
  left: -40px !important;
  height: calc(100% + 54px) !important;
  pointer-events: auto !important;
  background: transparent !important;
  z-index: -1 !important;
}
.status-bar:hover,
.status-bar:focus-within {
  opacity: 1 !important;
  transform: translateY(0) !important;
  transition: opacity 0.2s ease, transform 0.2s ease !important;
  pointer-events: auto !important;
}
.status-bar:hover .status-bar-item,
.status-bar:focus-within .status-bar-item {
  pointer-events: auto !important;
}`,
	},
	{
		id: 'layout-floating-statusbar',
		label: 'Floating Pill Status Bar',
		category: 'elements',
		subcategory: 'Layout Mods',
		variable: '--layout-floating-statusbar',
		type: 'toggle',
		icon: 'circle-dot',
		defaultDarkValue: 'false',
		defaultLightValue: 'false',
		toggleTrueValue: 'true',
		toggleFalseValue: 'false',
		companionCss: `
.status-bar {
  position: fixed !important;
  bottom: 14px !important;
  right: 18px !important;
  background-color: var(--background-secondary) !important;
  border: 1px solid var(--background-modifier-border) !important;
  border-radius: var(--radius-l, 14px) !important;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.18) !important;
  padding: 3px 12px !important;
  z-index: 25 !important;
  max-width: max-content !important;
  backdrop-filter: blur(8px) !important;
  -webkit-backdrop-filter: blur(8px) !important;
}`,
	},
	{
		id: 'layout-minimalism',
		label: 'Seamless Minimalism',
		category: 'elements',
		subcategory: 'Layout Mods',
		variable: '--layout-minimalism',
		type: 'toggle',
		icon: 'sparkles',
		defaultDarkValue: 'false',
		defaultLightValue: 'false',
		toggleTrueValue: 'true',
		toggleFalseValue: 'false',
		companionCss: `
body {
  background-color: var(--background-primary) !important;
}
.app-container, .horizontal-main-container, .workspace, .workspace-split, .workspace-split.mod-root,
.workspace-tabs, .workspace-tab-container, .workspace-leaf, .workspace-leaf-content:not([data-type="canvas"]),
.workspace-leaf-content:not([data-type="canvas"]) .view-content, .markdown-source-view.mod-cm6,
.markdown-source-view.mod-cm6 .cm-scroller, .markdown-preview-view {
  background-color: transparent !important;
}
.titlebar, .titlebar-inner, body .titlebar, body .titlebar-inner, body:not(.is-focused) .titlebar,
body:not(.is-focused) .titlebar-inner,
body:not(.is-focused):not(.is-translucent):not(.is-hidden-frameless) .titlebar,
body:not(.is-focused):not(.is-translucent):not(.is-hidden-frameless) .titlebar-inner {
  background: transparent !important; border: none !important; box-shadow: none !important;
  -webkit-app-region: drag !important; app-region: drag !important; pointer-events: none !important;
}
.titlebar-button-container.mod-right, body .titlebar-button-container.mod-right,
body.mod-windows .titlebar-button-container.mod-right,
body:not(.is-focused) .titlebar-button-container.mod-right,
body:not(.is-focused):not(.is-translucent):not(.is-hidden-frameless) .titlebar-button-container.mod-right,
.workspace-tabs.mod-top-right-space .titlebar-button-container.mod-right,
.workspace-tab-header-container.mod-top-right-space .titlebar-button-container.mod-right {
  background: transparent !important; border: none !important; box-shadow: none !important;
  position: absolute !important; top: 0 !important; right: 0 !important; left: auto !important;
  width: calc(var(--titlebar-width, 138px)) !important;
  max-width: calc(var(--titlebar-width, 138px)) !important; height: 38px !important;
  display: flex !important; align-items: center !important; justify-content: flex-end !important;
  z-index: 50 !important; -webkit-app-region: no-drag !important; app-region: no-drag !important;
  pointer-events: auto !important;
}
.titlebar-button-container.mod-left, body .titlebar-button-container.mod-left {
  display: none !important; pointer-events: none !important;
}
.titlebar-button, body .titlebar-button, body.mod-windows .titlebar-button {
  background: transparent !important; border: none !important; box-shadow: none !important;
  border-radius: var(--radius-s, 4px) !important; width: 46px !important; height: 100% !important;
  min-height: 38px !important; display: inline-flex !important; align-items: center !important;
  justify-content: center !important; -webkit-app-region: no-drag !important;
  app-region: no-drag !important; pointer-events: auto !important; cursor: pointer !important;
  transition: background-color 0.15s ease, color 0.15s ease !important;
}
.titlebar-button *, .titlebar-button svg {
  -webkit-app-region: no-drag !important; app-region: no-drag !important;
  pointer-events: auto !important;
}
.titlebar-button:hover, body .titlebar-button:hover, body.mod-windows .titlebar-button:hover {
  background-color: var(--background-modifier-hover, rgba(128, 128, 128, 0.15)) !important;
}
.titlebar-button.mod-close:hover, body .titlebar-button.mod-close:hover,
body.mod-windows .titlebar-button.mod-close:hover {
  background-color: #e81123 !important; color: #ffffff !important;
}
.workspace-tab-header-spacer, .workspace-tabs.mod-top-right-space, .workspace-tabs.mod-top-left-space,
.workspace-tab-header-container.mod-top-right-space, .workspace-tab-header-container.mod-top-left-space,
.workspace-split.mod-left-split .workspace-tab-header-container,
.workspace-split.mod-left-split .workspace-tab-header-container-inner,
.workspace-split.mod-left-split .workspace-tab-header,
.workspace-split.mod-left-split .workspace-tab-header-inner, .workspace-split.mod-left-split .workspace-tabs,
.workspace-split.mod-left-split .nav-header, .workspace-split.mod-left-split .nav-buttons-container,
.workspace-split.mod-right-split .workspace-tab-header-container,
.workspace-split.mod-right-split .workspace-tab-header-container-inner,
.workspace-split.mod-right-split .workspace-tab-header,
.workspace-split.mod-right-split .workspace-tab-header-inner, .workspace-split.mod-right-split .workspace-tabs,
.workspace-ribbon-collapse-btn, .workspace-ribbon.mod-left .sidebar-toggle-button {
  background: transparent !important; border: none !important; box-shadow: none !important;
}
.workspace-tabs.mod-top-right-space::before, .workspace-tabs.mod-top-right-space::after,
.workspace-tabs.mod-top-left-space::before, .workspace-tabs.mod-top-left-space::after,
.workspace-tab-header-container.mod-top-right-space::before,
.workspace-tab-header-container.mod-top-right-space::after,
.workspace-tab-header-container.mod-top-left-space::before,
.workspace-tab-header-container.mod-top-left-space::after,
.workspace-split.mod-left-split .workspace-tab-header-container::before,
.workspace-split.mod-left-split .workspace-tab-header-container::after,
.workspace-split.mod-right-split .workspace-tab-header-container::before,
.workspace-split.mod-right-split .workspace-tab-header-container::after, .workspace-ribbon.mod-left::before,
.workspace-ribbon.mod-left::after, .workspace-ribbon-collapse-btn::before,
.workspace-ribbon-collapse-btn::after, .sidebar-toggle-button::before, .sidebar-toggle-button::after {
  display: none !important; background: transparent !important; pointer-events: none !important;
}
.workspace-tab-header-spacer {
  background: transparent !important; border: none !important; box-shadow: none !important;
  -webkit-app-region: drag !important; app-region: drag !important; pointer-events: auto !important;
}
.workspace-tab-header-new-tab, .workspace-tab-header-tab-list, .workspace-tab-header-container .clickable-icon,
.view-actions .clickable-icon, .sidebar-toggle-button, .sidebar-toggle-button.mod-left,
.sidebar-toggle-button.mod-right, .workspace-ribbon-collapse-btn {
  border-radius: var(--radius-s, 4px) !important;
}
.workspace-split.mod-root .workspace-tabs .workspace-tab-header-tab-list {
  position: absolute !important; top: 4px !important; right: 36px !important; left: auto !important;
  bottom: auto !important; z-index: 30 !important; display: flex !important;
  align-items: center !important; justify-content: center !important; width: 28px !important;
  height: 28px !important; padding: 0 !important; margin: 0 !important;
  border-radius: var(--radius-s, 4px) !important; background: transparent !important;
  border: 1px solid transparent !important; color: var(--text-muted) !important;
  cursor: pointer !important; -webkit-app-region: no-drag !important; app-region: no-drag !important;
  pointer-events: auto !important;
  transition: background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease !important;
}
.workspace-split.mod-root .workspace-tabs .workspace-tab-header-new-tab {
  position: absolute !important; top: 4px !important; right: 68px !important; left: auto !important;
  bottom: auto !important; z-index: 30 !important; display: flex !important;
  align-items: center !important; justify-content: center !important; width: 28px !important;
  height: 28px !important; padding: 0 !important; margin: 0 !important;
  border-radius: var(--radius-s, 4px) !important; background: transparent !important;
  border: 1px solid transparent !important; color: var(--text-muted) !important;
  cursor: pointer !important; -webkit-app-region: no-drag !important; app-region: no-drag !important;
  pointer-events: auto !important;
  transition: background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease !important;
}
.workspace-split.mod-root .workspace-tabs .workspace-tab-header-new-tab,
.workspace-split.mod-root .workspace-tabs .workspace-tab-header-new-tab *,
.workspace-split.mod-root .workspace-tabs .workspace-tab-header-tab-list,
.workspace-split.mod-root .workspace-tabs .workspace-tab-header-tab-list *, .workspace-tab-header,
.workspace-tab-header *, .workspace-tab-header-inner-close-button, .workspace-tab-header-inner-close-button * {
  -webkit-app-region: no-drag !important; app-region: no-drag !important;
  pointer-events: auto !important;
}
.workspace-split.mod-root .workspace-tabs .workspace-tab-header-new-tab:hover,
.workspace-split.mod-root .workspace-tabs .workspace-tab-header-tab-list:hover {
  background-color: var(--background-modifier-hover, rgba(128, 128, 128, 0.12)) !important;
  color: var(--text-normal) !important;
  border-color: var(--background-modifier-border, rgba(128, 128, 128, 0.15)) !important;
  border-radius: var(--radius-s, 4px) !important;
}
.workspace-split.mod-left-split .workspace-tab-header-new-tab,
.workspace-split.mod-left-split .workspace-tab-header-tab-list,
.workspace-split.mod-right-split .workspace-tab-header-new-tab,
.workspace-split.mod-right-split .workspace-tab-header-tab-list,
.workspace-ribbon .workspace-tab-header-new-tab, .workspace-ribbon .workspace-tab-header-tab-list,
.side-dock-ribbon .workspace-tab-header-new-tab, .side-dock-ribbon .workspace-tab-header-tab-list {
  display: none !important;
}
.sidebar-toggle-button, .sidebar-toggle-button.mod-left, .workspace-ribbon-collapse-btn,
.workspace-ribbon.mod-left .sidebar-toggle-button, .workspace-ribbon.mod-left .workspace-ribbon-collapse-btn,
.workspace-split.mod-left-split .sidebar-toggle-button,
.workspace-split.mod-left-split .sidebar-toggle-button.mod-left,
.workspace-split.mod-left-split .workspace-tab-header-container .sidebar-toggle-button,
.workspace-tabs.mod-top-left-space .sidebar-toggle-button.mod-left,
.workspace-tab-header-container.mod-top-left-space .sidebar-toggle-button.mod-left {
  border-radius: var(--radius-s, 4px) !important; width: 28px !important; height: 28px !important;
  min-width: 28px !important; min-height: 28px !important; max-width: 28px !important;
  max-height: 28px !important; padding: 0 !important; margin: 0 !important;
  display: inline-flex !important; align-items: center !important; justify-content: center !important;
  background: transparent !important; border: 1px solid transparent !important;
  color: var(--text-muted) !important; cursor: var(--cursor, pointer) !important;
  align-self: center !important;
  transition: background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease !important;
}
.sidebar-toggle-button:hover, .sidebar-toggle-button.mod-left:hover, .workspace-ribbon-collapse-btn:hover {
  background-color: var(--background-modifier-hover, rgba(128, 128, 128, 0.12)) !important;
  color: var(--text-normal) !important;
  border-color: var(--background-modifier-border, rgba(128, 128, 128, 0.15)) !important;
  border-radius: var(--radius-s, 4px) !important;
}
.sidebar-toggle-button svg, .workspace-ribbon-collapse-btn svg {
  width: 16px !important; height: 16px !important;
}
.workspace-tabs.mod-top-left-space .sidebar-toggle-button.mod-left,
.workspace-tab-header-container.mod-top-left-space .sidebar-toggle-button.mod-left {
  top: 5px !important; left: 8px !important;
}
.sidebar-toggle-button.mod-right, .workspace-split .sidebar-toggle-button.mod-right,
.workspace-tabs .sidebar-toggle-button.mod-right, .workspace-split.mod-root .sidebar-toggle-button.mod-right,
.workspace-split.mod-root .workspace-tabs .sidebar-toggle-button.mod-right,
.workspace-split.mod-root .workspace-tab-header-container .sidebar-toggle-button.mod-right,
.workspace-split.mod-right-split .sidebar-toggle-button,
.workspace-split.mod-right-split .workspace-tab-header-container .sidebar-toggle-button {
  position: absolute !important; top: 4px !important; right: 4px !important; left: auto !important;
  bottom: auto !important; z-index: 30 !important; width: 28px !important; height: 28px !important;
  min-width: 28px !important; min-height: 28px !important; max-width: 28px !important;
  max-height: 28px !important; margin: 0 !important; padding: 0 !important; display: flex !important;
  align-items: center !important; justify-content: center !important;
  border-radius: var(--radius-s, 4px) !important; background: transparent !important;
  border: 1px solid transparent !important; color: var(--text-muted) !important;
  cursor: var(--cursor, pointer) !important; -webkit-app-region: no-drag !important;
  app-region: no-drag !important; pointer-events: auto !important;
  transition: background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease !important;
}
.sidebar-toggle-button.mod-right:hover, .workspace-split .sidebar-toggle-button.mod-right:hover,
.workspace-split.mod-right-split .sidebar-toggle-button:hover {
  background-color: var(--background-modifier-hover, rgba(128, 128, 128, 0.12)) !important;
  color: var(--text-normal) !important;
  border-color: var(--background-modifier-border, rgba(128, 128, 128, 0.15)) !important;
  border-radius: var(--radius-s, 4px) !important;
}
:root {
  --ribbon-width: 36px !important;
}
.workspace-ribbon.mod-left, .side-dock-ribbon.mod-left, .workspace-ribbon:not(.mod-right) {
  width: 36px !important; min-width: 36px !important; max-width: 36px !important;
  box-sizing: border-box !important; padding: 5px 0 0 0 !important; margin: 0 !important;
  display: flex !important; flex-direction: column !important; align-items: center !important;
  justify-content: flex-start !important; background: transparent !important;
  border-right: none !important; box-shadow: none !important;
}
.workspace-ribbon.mod-left .workspace-ribbon-collapse-btn, .workspace-ribbon.mod-left .sidebar-toggle-button,
.side-dock-ribbon.mod-left .workspace-ribbon-collapse-btn, .side-dock-ribbon.mod-left .sidebar-toggle-button {
  position: relative !important; top: 0 !important; left: 0 !important; right: auto !important;
  bottom: auto !important; width: 28px !important; height: 28px !important;
  min-width: 28px !important; min-height: 28px !important; max-width: 28px !important;
  max-height: 28px !important; margin: 0 auto 8px auto !important; padding: 0 !important;
  display: flex !important; align-items: center !important; justify-content: center !important;
  align-self: center !important; border-radius: var(--radius-s, 4px) !important;
  flex-shrink: 0 !important;
}
.workspace-ribbon.mod-left .side-dock-actions, .side-dock-ribbon.mod-left .side-dock-actions {
  display: flex !important; flex-direction: column !important; align-items: center !important;
  width: 100% !important; padding: 0 !important; margin: 0 !important; gap: 6px !important;
  position: relative !important;
}
.workspace-ribbon.mod-left .side-dock-settings, .side-dock-ribbon.mod-left .side-dock-settings {
  display: flex !important; flex-direction: column !important; align-items: center !important;
  width: 100% !important; padding: 0 0 6px 0 !important; margin: 0 !important; gap: 6px !important;
  position: relative !important;
}
.workspace-ribbon.mod-left .clickable-icon:not(.workspace-ribbon-collapse-btn):not(.sidebar-toggle-button),
.side-dock-ribbon.mod-left .clickable-icon:not(.workspace-ribbon-collapse-btn):not(.sidebar-toggle-button),
.side-dock-ribbon-action {
  position: relative !important; top: 0 !important; left: 0 !important; width: 28px !important;
  height: 28px !important; min-width: 28px !important; min-height: 28px !important;
  max-width: 28px !important; max-height: 28px !important; padding: 0 !important;
  margin: 0 auto !important; border-radius: var(--radius-s, 4px) !important; display: flex !important;
  align-items: center !important; justify-content: center !important; align-self: center !important;
  flex-shrink: 0 !important; background: transparent !important;
  border: 1px solid transparent !important; color: var(--text-muted) !important;
  transition: background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease !important;
}
.workspace-ribbon.mod-left .clickable-icon:hover, .side-dock-ribbon.mod-left .clickable-icon:hover,
.side-dock-ribbon-action:hover {
  background-color: var(--background-modifier-hover, rgba(128, 128, 128, 0.12)) !important;
  color: var(--text-accent, var(--text-normal)) !important;
  border-color: var(--background-modifier-border, rgba(128, 128, 128, 0.15)) !important;
}
.workspace-ribbon.mod-left .clickable-icon.is-active, .side-dock-ribbon-action.is-active {
  background-color: var(--background-modifier-active-hover, rgba(128, 128, 128, 0.18)) !important;
  color: var(--text-accent) !important; border-color: var(--text-accent) !important;
}
.workspace-ribbon.mod-left .clickable-icon svg, .side-dock-ribbon.mod-left .clickable-icon svg,
.side-dock-ribbon-action svg {
  width: 16px !important; height: 16px !important; max-width: 16px !important;
  max-height: 16px !important; display: block !important; margin: auto !important;
  pointer-events: none !important;
}
.workspace-ribbon.mod-right, .side-dock-ribbon.mod-right {
  width: 36px !important; min-width: 36px !important; max-width: 36px !important;
  box-sizing: border-box !important; padding: 5px 0 0 0 !important; margin: 0 !important;
  display: flex !important; flex-direction: column !important; align-items: center !important;
  justify-content: flex-start !important; background: transparent !important;
  border-left: none !important; box-shadow: none !important;
}
.workspace-ribbon.mod-right .sidebar-toggle-button, .workspace-ribbon.mod-right .workspace-ribbon-collapse-btn,
.side-dock-ribbon.mod-right .sidebar-toggle-button, .side-dock-ribbon.mod-right .workspace-ribbon-collapse-btn {
  position: relative !important; top: 0 !important; left: 0 !important; width: 28px !important;
  height: 28px !important; min-width: 28px !important; min-height: 28px !important;
  max-width: 28px !important; max-height: 28px !important; margin: 0 auto 8px auto !important;
  padding: 0 !important; display: flex !important; align-items: center !important;
  justify-content: center !important; align-self: center !important;
  border-radius: var(--radius-s, 4px) !important; flex-shrink: 0 !important;
}
.workspace-ribbon.mod-right .side-dock-actions, .side-dock-ribbon.mod-right .side-dock-actions {
  display: flex !important; flex-direction: column !important; align-items: center !important;
  width: 100% !important; padding: 0 !important; margin: 0 !important; gap: 6px !important;
  position: relative !important;
}
.workspace-split.mod-left-split .workspace-tab-header-container,
.workspace-split.mod-right-split .workspace-tab-header-container {
  position: relative !important; height: 38px !important; min-height: 38px !important;
  max-height: 38px !important; padding: 4px 8px !important; gap: 4px !important;
  display: flex !important; align-items: center !important; background: transparent !important;
  border: none !important; box-sizing: border-box !important;
}
.workspace-split.mod-left-split .workspace-tab-header-inner-icon,
.workspace-split.mod-left-split .workspace-tab-header,
.workspace-split.mod-right-split .workspace-tab-header-inner-icon,
.workspace-split.mod-right-split .workspace-tab-header {
  border-radius: var(--radius-s, 4px) !important;
}
.workspace-sidedock-vault-profile, .workspace-drawer-vault-switcher, .workspace-drawer-vault-name,
.vault-switcher, .workspace-ribbon.mod-left .sidebar-profile, .nav-footer {
  background: transparent !important; border: none !important; box-shadow: none !important;
}
.workspace-sidedock-vault-profile:hover, .vault-switcher:hover, .workspace-drawer-vault-switcher:hover {
  background-color: var(--background-modifier-hover, rgba(128, 128, 128, 0.10)) !important;
  border-radius: 9999px !important;
}
.workspace-split.mod-root .workspace-tabs .workspace-tab-header-container {
  position: relative !important; background: transparent !important; border-bottom: none !important;
  box-shadow: none !important; height: 38px !important; min-height: 38px !important;
  padding: 4px 8px !important; margin-right: calc(var(--frame-right-space, 138px) + 8px) !important;
  gap: 4px !important; display: flex !important; align-items: center !important;
  -webkit-app-region: drag !important; app-region: drag !important;
}
.workspace-tab-header-container-inner {
  -webkit-app-region: drag !important; app-region: drag !important; min-width: 0 !important;
  flex: 0 1 auto !important;
  /* Obsidian's base inner carries a 6px top margin, a negative bottom margin
     and 1px top padding. At the 38px header height that pushed the 28px pill
     past the strip's content box, clipping its bottom edge. Reset the vertical
     box so the pill sits centred instead. */
  margin-top: 0 !important; margin-bottom: 0 !important;
  padding-top: 0 !important; padding-bottom: 0 !important;
  align-items: center !important;
}
.workspace-split.mod-root .workspace-tabs .workspace-tab-header-container-inner {
  margin-right: 92px !important;
}
.workspace-split.mod-right-split .workspace-tab-header-container-inner {
  margin-right: 36px !important;
}
.workspace-tabs.mod-top-right-space .workspace-tab-header-container,
.workspace-tab-header-container.mod-top-right-space,
.workspace-split.mod-right-split.mod-top-right-space .workspace-tab-header-container {
  padding-right: 8px !important; margin-right: calc(var(--frame-right-space, 138px) + 8px) !important;
  -webkit-app-region: drag !important; app-region: drag !important;
}
.workspace-tab-header-container {
  background: transparent !important; border-bottom: none !important; box-shadow: none !important;
  -webkit-app-region: drag !important; app-region: drag !important;
}
.workspace-tab-header-container::before, .workspace-tab-header-container::after {
  display: none !important;
}
.view-header {
  background: transparent !important; border-bottom: none !important; box-shadow: none !important;
  height: 36px !important; min-height: 36px !important; padding: 0 10px !important;
}
.view-header .view-actions {
  gap: 4px !important;
}
.view-actions .clickable-icon {
  border-radius: var(--radius-s, 4px) !important; width: 26px !important; height: 26px !important;
  padding: 3px !important;
}
.status-bar {
  background: transparent !important; border: none !important; box-shadow: none !important;
  height: 30px !important; min-height: 30px !important; padding: 2px 10px !important;
  gap: 6px !important; display: flex !important; align-items: center !important;
  justify-content: flex-end !important;
}
.status-bar::before, .status-bar::after, .workspace-tab-header.is-active::before,
.workspace-tab-header.is-active::after, .workspace-tab-header::before, .workspace-tab-header::after {
  display: none !important;
}
.status-bar-item {
  background-color: var(--background-modifier-hover, rgba(128, 128, 128, 0.08)) !important;
  border: 1px solid var(--background-modifier-border, rgba(128, 128, 128, 0.15)) !important;
  border-radius: 9999px !important; padding: 2px 10px !important; margin: 0 !important;
  height: 22px !important; line-height: 20px !important;
  font-size: var(--font-ui-smaller, 11px) !important;
  transition: background-color 0.15s ease, border-color 0.15s ease !important;
}
.status-bar-item:hover {
  background-color: var(--background-modifier-active-hover, rgba(128, 128, 128, 0.15)) !important;
  border-color: var(--text-accent) !important;
}
.workspace-tab-header {
  height: 28px !important; line-height: 28px !important; border-radius: 9999px !important;
  margin: 0 2px !important; padding: 0 12px !important; border: 1px solid transparent !important;
  background-color: transparent !important;
  transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease !important;
}
.workspace-tab-header:not(.is-active):hover {
  background-color: var(--background-modifier-hover, rgba(128, 128, 128, 0.08)) !important;
  border-color: var(--background-modifier-border, rgba(128, 128, 128, 0.15)) !important;
  border-radius: 9999px !important;
}
.workspace-tab-header.is-active {
  background-color: var(--background-modifier-hover, rgba(128, 128, 128, 0.15)) !important;
  border: 1px solid var(--background-modifier-border, rgba(128, 128, 128, 0.2)) !important;
  border-radius: 9999px !important; box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08) !important;
  color: var(--text-accent, var(--text-normal)) !important;
}
.workspace-tab-header-inner {
  padding: 0 !important; border-radius: 9999px !important; gap: 6px !important;
}
.workspace-tab-header-inner, .workspace-tab-header-inner:hover,
.workspace-tab-header:hover .workspace-tab-header-inner,
.workspace-tab-header.is-active .workspace-tab-header-inner,
.workspace-tab-header.is-active:hover .workspace-tab-header-inner, .workspace-tab-header-inner::before,
.workspace-tab-header-inner::after {
  background-color: transparent !important; background-image: none !important;
  box-shadow: none !important;
}
button:not(.clickable-icon), .mod-cta, button.mod-cta {
  border-radius: 9999px !important; padding: 4px 14px !important;
  transition: background-color 0.15s ease, border-color 0.15s ease, transform 0.1s ease !important;
}
button:not(.clickable-icon):active, .mod-cta:active {
  transform: scale(0.98) !important;
}
.nav-buttons-container .clickable-icon {
  border-radius: var(--radius-s, 4px) !important; width: 26px !important; height: 26px !important;
}
.search-input-container {
  border-radius: 9999px !important; padding: 0 !important;
}
.search-input-container input, .search-input-container input[type="search"],
.search-input-container input[type="text"] {
  border-radius: 9999px !important; padding-left: 36px !important;
  padding-inline-start: 36px !important; padding-right: 28px !important;
  padding-inline-end: 28px !important;
}
.tag, a.tag {
  border-radius: 9999px !important; padding: 2px 10px !important;
}
.nav-file-title, .nav-folder-title {
  border-radius: 9999px !important; padding: 2px 8px !important; margin: 1px 0 !important;
}
.workspace-split.mod-root {
  --divider-color: transparent !important;
  --workspace-leaf-border-color: var(--background-modifier-border, rgba(128, 128, 128, 0.12)) !important;
}
`,
	},

	// 2. Colors
	// --- Base Palette ---
	{
		id: 'text-normal',
		label: 'Body Text Color',
		category: 'colors',
		subcategory: 'Base Palette',
		variable: '--text-normal',
		type: 'color',
		defaultDarkValue: '#dadada',
		defaultLightValue: '#222222',
	},
	{
		id: 'text-accent',
		label: 'Accent Color',
		description: 'Accent for links, buttons, and active states',
		category: 'colors',
		subcategory: 'Base Palette',
		variable: '--text-accent',
		type: 'color',
		defaultDarkValue: '#a68af9',
		defaultLightValue: '#9873f7',
		companionCss: `
/* Surface the chosen accent to Obsidian's own variables. Obsidian derives
   --color-accent / --interactive-accent from the --accent-h/s/l triad, so
   --text-accent alone never recolours buttons, toggles, checkboxes, active
   tabs, sliders or focus rings. */
body {
  --color-accent: var(--text-accent) !important;
  --color-accent-1: var(--text-accent) !important;
  --color-accent-2: var(--text-accent) !important;
  --interactive-accent: var(--text-accent) !important;
  --interactive-accent-hover: var(--text-accent) !important;
}

/* Canvas Accent Alignment */
.workspace-leaf-content[data-type="canvas"],
.canvas-wrapper {
  --color-accent: var(--text-accent) !important;
  --shadow-border-accent: 0 0 0 2px var(--text-accent) !important;
}

/* Card Selection Highlight */
.workspace-leaf-content[data-type="canvas"] .canvas-node.is-selected:not(.is-themed) .canvas-node-container,
.workspace-leaf-content[data-type="canvas"] .canvas-node.is-focused:not(.is-themed) .canvas-node-container,
.canvas-wrapper .canvas-node.is-selected:not(.is-themed) .canvas-node-container,
.canvas-wrapper .canvas-node.is-focused:not(.is-themed) .canvas-node-container {
  border-color: var(--text-accent) !important;
  box-shadow: var(--shadow-stationary, 0px 0.5px 1px 0.5px rgba(0, 0, 0, 0.1)), 0 0 0 2px var(--text-accent) !important;
}

.workspace-leaf-content[data-type="canvas"] .canvas-node.is-selected.is-dragging .canvas-node-container,
.workspace-leaf-content[data-type="canvas"] .canvas-node.is-focused.is-dragging .canvas-node-container,
.canvas-wrapper .canvas-node.is-selected.is-dragging .canvas-node-container,
.canvas-wrapper .canvas-node.is-focused.is-dragging .canvas-node-container {
  box-shadow: var(--shadow-drag, 0px 2px 10px rgba(0, 0, 0, 0.1)), 0 0 0 2px var(--text-accent) !important;
}

.workspace-leaf-content[data-type="canvas"] .canvas-selection,
.canvas-wrapper .canvas-selection {
  border-color: var(--text-accent) !important;
}

/* Connection Nodes on Hover */
.workspace-leaf-content[data-type="canvas"] .canvas-node-connection-point::after,
.canvas-wrapper .canvas-node-connection-point::after {
  background-color: var(--text-accent) !important;
}

.workspace-leaf-content[data-type="canvas"] .canvas-node:hover .canvas-node-connection-point::after,
.canvas-wrapper .canvas-node:hover .canvas-node-connection-point::after,
.workspace-leaf-content[data-type="canvas"] .canvas-node-resizer:hover .canvas-node-connection-point::after,
.canvas-wrapper .canvas-node-resizer:hover .canvas-node-connection-point::after {
  opacity: 1 !important;
  background-color: var(--text-accent) !important;
}

.workspace-leaf-content[data-type="canvas"] .canvas-node-connection-point:hover::after,
.canvas-wrapper .canvas-node-connection-point:hover::after {
  background-color: var(--text-accent-hover, var(--text-accent)) !important;
} `,
	},
	{
		id: 'text-accent-2',
		label: 'Secondary Accent Color',
		description: 'Secondary accent for muted text and secondary icons',
		category: 'colors',
		subcategory: 'Base Palette',
		variable: '--text-accent-2',
		type: 'color',
		defaultDarkValue: '#a855f7',
		defaultLightValue: '#8b5cf6',
		companionCss: `
/* ==========================================================================
   Secondary Accent Alignment - UI Icons, Muted Text, Settings, Canvas, Search, Backlinks & Toggles
   ========================================================================== */

:root,
body,
.theme-dark,
.theme-light {
  --text-muted: var(--text-accent-2) !important;
  --text-faint: var(--text-accent-2) !important;
  --icon-color: var(--text-accent-2) !important;
  --icon-color-focused: var(--text-accent-2) !important;
  --nav-collapse-icon-color: var(--text-accent-2) !important;
  --collapse-icon-color: var(--text-accent-2) !important;
  --collapse-icon-color-collapsed: var(--text-accent-2) !important;
}

/* UI Icons */
.clickable-icon,
.workspace-tab-header-inner-icon,
.nav-action-button,
.ribbon-tab-header-icon,
.view-action,
.view-header-icon,
.status-bar-item .svg-icon,
svg.svg-icon {
  color: var(--text-accent-2) !important;
}

/* Grayed Out Text */
.text-muted,
.text-faint,
.metadata-property-key,
.metadata-property-key .svg-icon,
.search-result-file-match-count,
.tree-item-flair {
  color: var(--text-accent-2) !important;
}

/* Settings Icon */
.workspace-ribbon .clickable-icon[aria-label*="Settings" i],
.workspace-ribbon .clickable-icon[aria-label*="settings" i],
.workspace-ribbon svg.lucide-settings,
svg.lucide-settings,
.clickable-icon:has(svg.lucide-settings),
button[aria-label*="Settings" i] svg,
button[aria-label*="settings" i] svg {
  color: var(--text-accent-2) !important;
}

/* Canvas Icons */
.workspace-leaf-content[data-type="canvas"] .canvas-controls .clickable-icon,
.workspace-leaf-content[data-type="canvas"] .canvas-control-item,
.workspace-leaf-content[data-type="canvas"] .canvas-control-item svg,
.workspace-leaf-content[data-type="canvas"] .canvas-card-menu .clickable-icon,
.workspace-leaf-content[data-type="canvas"] .canvas-card-menu svg,
.workspace-leaf-content[data-type="canvas"] .canvas-node-toolbar .clickable-icon,
.workspace-leaf-content[data-type="canvas"] .canvas-node-toolbar svg,
.canvas-wrapper .canvas-controls .clickable-icon,
.canvas-wrapper .canvas-control-item,
.canvas-wrapper .canvas-control-item svg,
.canvas-wrapper .canvas-card-menu .clickable-icon,
.canvas-wrapper .canvas-card-menu svg,
.canvas-wrapper .canvas-node-toolbar .clickable-icon,
.canvas-wrapper .canvas-node-toolbar svg {
  color: var(--text-accent-2) !important;
}

/* Canvas Card Border (Unselected) */
.workspace-leaf-content[data-type="canvas"] .canvas-node:not(.is-selected):not(.is-themed) .canvas-node-container,
.canvas-wrapper .canvas-node:not(.is-selected):not(.is-themed) .canvas-node-container {
  border-color: var(--text-accent-2) !important;
}

/* Collapse Results & Search Icons */
.search-input-container svg,
.search-input-container .search-input-clear-button,
.search-input-container .clickable-icon,
.workspace-leaf-content[data-type="search"] .nav-action-button,
.workspace-leaf-content[data-type="search"] .clickable-icon,
.workspace-leaf-content[data-type="search"] .search-result-collapse-icon,
.workspace-leaf-content[data-type="search"] .tree-item-icon,
.collapse-icon,
.collapse-indicator,
.tree-item-icon.collapse-icon,
.nav-folder-collapse-indicator {
  color: var(--text-accent-2) !important;
}

/* Backlinks Word Count & Match Count */
.workspace-leaf-content[data-type="backlink"] .tree-item-flair,
.workspace-leaf-content[data-type="backlink"] .tree-item-flair-outer,
.workspace-leaf-content[data-type="backlink"] .search-result-file-match-count,
.backlink-pane .tree-item-flair,
.backlink-pane .tree-item-flair-outer,
.backlink-pane .search-result-file-match-count {
  color: var(--text-accent-2) !important;
  border-color: var(--text-accent-2) !important;
}

/* Toggle in ON Position */
.checkbox-container.is-enabled {
  background-color: var(--text-accent-2) !important;
}`,
	},
	{
		id: 'background-primary',
		label: 'Primary Background',
		description: 'Editor and reading view background',
		category: 'colors',
		subcategory: 'Base Palette',
		variable: '--background-primary',
		type: 'color',
		defaultDarkValue: '#1e1e1e',
		defaultLightValue: '#ffffff',
	},
	{
		id: 'background-secondary',
		label: 'Secondary Background',
		description: 'Sidebars, tabs, and modal background',
		category: 'colors',
		subcategory: 'Base Palette',
		variable: '--background-secondary',
		type: 'color',
		defaultDarkValue: '#262626',
		defaultLightValue: '#f6f6f6',
		companionCss: `
/* Settings Menu - Align Section Backgrounds with Secondary Background */
.modal.mod-settings,
.modal.mod-settings .modal-content,
.modal.mod-settings .vertical-tabs-container,
.modal.mod-settings .vertical-tab-header,
.modal.mod-settings .vertical-tab-content-container,
.modal.mod-settings .vertical-tab-content,
.mod-settings .vertical-tab-content,
.vertical-tab-content,
.horizontal-tab-content,
.css-designer-settings-tab,
.modal.mod-settings .community-item,
.modal.mod-settings .modal-setting-nav-bar,
.modal.mod-settings .modal-setting-titlebar,
.modal.mod-settings .setting-item,
.modal.mod-settings .setting-item-heading,
.modal.mod-settings .vertical-tab-header-group,
.modal.mod-settings .vertical-tab-header-group-title,
.modal.mod-settings .vertical-tab-nav-item,
.vertical-tab-header-group,
.vertical-tab-header-group-title,
.vertical-tab-nav-item,
.setting-item,
.setting-item-heading {
  background-color: var(--background-secondary) !important;
}
.modal.mod-settings {
  --modal-background: var(--background-secondary) !important;
  --background-modifier-form-field: var(--background-secondary) !important;
  --background-modifier-form-field-hover: var(--background-secondary) !important;
  --search-bar-background: var(--background-secondary) !important;
  --setting-items-background: var(--background-secondary) !important;
}

/* Settings Menu Search Bars and Tabs (Core Plugins, Hotkeys, Community Plugins) */
.modal.mod-settings .vertical-tab-content:has(.search-input-container),
.modal.mod-settings .vertical-tab-content:has(.setting-group-search),
.modal.mod-settings .vertical-tab-content:has(.setting-group),
.modal.mod-settings .vertical-tab-content:has(input[type="search"]),
.modal.mod-settings .vertical-tab-content:has(.plugin-list-plugins),
.modal.mod-settings .vertical-tab-content:has(.hotkey-list-container),
.modal.mod-settings .vertical-tab-content:has(.installed-plugins-container),
.modal.mod-settings .vertical-tab-content:has(.mod-hotkey),
.vertical-tab-content:has(.search-input-container),
.vertical-tab-content:has(.setting-group-search),
.vertical-tab-content:has(.setting-group),
.vertical-tab-content:has(input[type="search"]),
.vertical-tab-content:has(.plugin-list-plugins),
.vertical-tab-content:has(.hotkey-list-container),
.vertical-tab-content:has(.installed-plugins-container),
.vertical-tab-content:has(.mod-hotkey),
.modal.mod-settings .plugin-list-plugins,
.modal.mod-settings .hotkey-list-container,
.modal.mod-settings .hotkey-settings-container,
.modal.mod-settings .hotkey-header-container,
.modal.mod-settings .hotkey-filter,
.modal.mod-settings .setting-filter-container,
.modal.mod-settings .installed-plugins-container,
.modal.mod-settings .setting-group,
.modal.mod-settings .setting-group-search,
.modal.mod-settings .setting-items,
.plugin-list-plugins,
.hotkey-list-container,
.hotkey-settings-container,
.hotkey-header-container,
.hotkey-filter,
.setting-filter-container,
.installed-plugins-container,
.setting-group,
.setting-group-search,
.setting-items,
.modal.mod-settings .search-input-container,
.modal.mod-settings .search-input-container input,
.modal.mod-settings .search-input-container input:hover,
.modal.mod-settings .search-input-container input:focus,
.modal.mod-settings input[type="search"],
.modal.mod-settings input[type="search"]:hover,
.modal.mod-settings input[type="search"]:focus,
.vertical-tab-header .search-input-container,
.vertical-tab-header .search-input-container input,
.vertical-tab-header .search-input-container input:hover,
.vertical-tab-header .search-input-container input:focus,
.vertical-tab-header input[type="search"],
.vertical-tab-header input[type="search"]:hover,
.vertical-tab-header input[type="search"]:focus,
.vertical-tab-content .setting-group,
.vertical-tab-content .setting-group-search,
.vertical-tab-content .setting-items,
.vertical-tab-content .search-input-container,
.vertical-tab-content .search-input-container input,
.vertical-tab-content .search-input-container input:hover,
.vertical-tab-content .search-input-container input:focus,
.vertical-tab-content input[type="search"],
.vertical-tab-content input[type="search"]:hover,
.vertical-tab-content input[type="search"]:focus {
  background: var(--background-secondary) !important;
  background-color: var(--background-secondary) !important;
}`,
	},
	{
		id: 'titlebar-background-focused',
		label: 'Top Bar (Focused)',
		category: 'colors',
		subcategory: 'Base Palette',
		variable: '--titlebar-background-focused',
		type: 'color',
		defaultDarkValue: '#2e2e2e',
		defaultLightValue: '#f6f6f6',
	},
	{
		// Obsidian paints .titlebar from --titlebar-background and only swaps to
		// --titlebar-background-focused while body carries .is-focused, so a theme
		// that sets one and not the other greys out the moment the window blurs.
		// This keeps the frame one colour by aliasing the unfocused variable to the
		// focused one. Two things must stay untouched by that alias:
		//  - the glass/translucency layer, when it owns the frame (:not(.is-translucent));
		//  - frameless "seamless top bar" mode, which keeps .titlebar transparent on
		//    purpose so it blends into the window instead of showing a bar at all
		//    (:not(.is-hidden-frameless)). That rule is a plain class selector with no
		//    `body` in front of it, so this control's `body:not(...)` selectors have
		//    HIGHER specificity and would win over it on blur, repainting the
		//    seamless region solid instead of leaving it see-through. Excluding
		//    .is-hidden-frameless here is what every other rule touching .titlebar
		//    already does (glass.ts, translucency.ts, ui-elements.ts) -- this control
		//    just needs to follow the same pattern.
		id: 'titlebar-match-unfocused',
		label: 'Match Top Bar When Unfocused',
		category: 'colors',
		subcategory: 'Base Palette',
		variable: '--titlebar-match-unfocused',
		type: 'toggle',
		defaultDarkValue: 'true',
		defaultLightValue: 'true',
		toggleTrueValue: 'true',
		toggleFalseValue: 'false',
		companionCss: `
body:not(.is-focused):not(.is-translucent):not(.is-hidden-frameless) {
  --titlebar-background: var(--titlebar-background-focused) !important;
}
body:not(.is-focused):not(.is-translucent):not(.is-hidden-frameless) .titlebar,
body:not(.is-focused):not(.is-translucent):not(.is-hidden-frameless) .titlebar-inner,
body:not(.is-focused):not(.is-translucent):not(.is-hidden-frameless) .titlebar-button-container,
body:not(.is-focused):not(.is-translucent):not(.is-hidden-frameless) .titlebar-button-container.mod-right {
  background-color: var(--titlebar-background-focused) !important;
}`,
	},
	{
		id: 'titlebar-background',
		label: 'Top Bar (Unfocused)',
		category: 'colors',
		subcategory: 'Base Palette',
		variable: '--titlebar-background',
		type: 'color',
		defaultDarkValue: '#2e2e2e',
		defaultLightValue: '#f6f6f6',
	},

	// --- Buttons ---
	{
		id: 'interactive-hover',
		label: 'Button Hover Background',
		category: 'colors',
		subcategory: 'Buttons',
		variable: '--interactive-hover',
		type: 'color',
		defaultDarkValue: 'rgba(255, 255, 255, 0.08)',
		defaultLightValue: 'rgba(0, 0, 0, 0.05)',
		companionCss: `
body {
  --interactive-hover: var(--interactive-hover) !important;
}

button:not(.mod-cta):hover,
input[type="button"]:hover,
input[type="submit"]:hover,
.modal button:not(.mod-cta):hover,
.clickable-icon:hover,
.nav-action-button:hover,
.side-dock-ribbon-action:hover,
.sidebar-toggle-button:hover,
.view-action:hover,
.workspace-tab-header-inner-close-button:hover,
.css-designer-container button:not(.mod-cta):not(.is-active):hover {
  background-color: var(--interactive-hover) !important;
}`,
	},
	{
		id: 'interactive-accent-hover',
		label: 'Accent Button Hover',
		category: 'colors',
		subcategory: 'Buttons',
		variable: '--interactive-accent-hover',
		type: 'color',
		defaultDarkValue: '#906df8',
		defaultLightValue: '#8054f6',
		companionCss: `
body {
  --interactive-accent-hover: var(--interactive-accent-hover) !important;
  --text-accent-hover: var(--interactive-accent-hover) !important;
}

button.mod-cta:hover,
.mod-cta:hover,
.modal button.mod-cta:hover,
.css-designer-container button.mod-cta:hover,
.css-designer-container .css-preset-apply-btn:hover {
  background-color: var(--interactive-accent-hover) !important;
  border-color: var(--interactive-accent-hover) !important;
}`,
	},

	// --- Heading Text ---
	{
		id: 'gradient-headers',
		label: 'Heading Text',
		category: 'colors',
		subcategory: 'Heading Text',
		variable: '--header-gradient-enabled',
		type: 'toggle',
		defaultDarkValue: 'false',
		defaultLightValue: 'false',
		toggleTrueValue: 'true',
		toggleFalseValue: 'false',
		companionCss: `
.markdown-rendered h1,
.inline-title,
.HyperMD-header-1,
.cm-header-1 {
  color: var(--h1-gradient-color, var(--h1-color, currentColor)) !important;
  -webkit-text-fill-color: var(--h1-gradient-color, var(--h1-color, currentColor)) !important;
  background-image: none !important;
  -webkit-background-clip: border-box !important;
  background-clip: border-box !important;
}
.markdown-rendered h2,
.HyperMD-header-2,
.cm-header-2 {
  color: var(--h2-gradient-color, var(--h2-color, currentColor)) !important;
  -webkit-text-fill-color: var(--h2-gradient-color, var(--h2-color, currentColor)) !important;
  background-image: none !important;
  -webkit-background-clip: border-box !important;
  background-clip: border-box !important;
}
.markdown-rendered h3,
.HyperMD-header-3,
.cm-header-3 {
  color: var(--h3-gradient-color, var(--h3-color, currentColor)) !important;
  -webkit-text-fill-color: var(--h3-gradient-color, var(--h3-color, currentColor)) !important;
  background-image: none !important;
  -webkit-background-clip: border-box !important;
  background-clip: border-box !important;
}
.markdown-rendered h4,
.HyperMD-header-4,
.cm-header-4 {
  color: var(--h4-gradient-color, var(--h4-color, currentColor)) !important;
  -webkit-text-fill-color: var(--h4-gradient-color, var(--h4-color, currentColor)) !important;
  background-image: none !important;
  -webkit-background-clip: border-box !important;
  background-clip: border-box !important;
}
.markdown-rendered h5,
.HyperMD-header-5,
.cm-header-5 {
  color: var(--h5-gradient-color, var(--h5-color, currentColor)) !important;
  -webkit-text-fill-color: var(--h5-gradient-color, var(--h5-color, currentColor)) !important;
  background-image: none !important;
  -webkit-background-clip: border-box !important;
  background-clip: border-box !important;
}
.markdown-rendered h6,
.HyperMD-header-6,
.cm-header-6 {
  color: var(--h6-gradient-color, var(--h6-color, currentColor)) !important;
  -webkit-text-fill-color: var(--h6-gradient-color, var(--h6-color, currentColor)) !important;
  background-image: none !important;
  -webkit-background-clip: border-box !important;
  background-clip: border-box !important;
}`,
	},

	// --- Borders & Dividers ---
	{
		id: 'border-base',
		label: 'Borders & Dividers',
		category: 'colors',
		subcategory: 'Borders & Dividers',
		variable: '--background-modifier-border',
		type: 'color',
		defaultDarkValue: '#363636',
		defaultLightValue: '#e0e0e0',
	},
	{
		id: 'border-hover',
		label: 'Border Hover Glow',
		category: 'colors',
		subcategory: 'Borders & Dividers',
		variable: '--background-modifier-border-hover',
		type: 'color',
		defaultDarkValue: '#3f3f3f',
		defaultLightValue: '#d4d4d4',
	},
	{
		id: 'border-focus',
		label: 'Border Focus Accent',
		category: 'colors',
		subcategory: 'Borders & Dividers',
		variable: '--background-modifier-border-focus',
		type: 'color',
		defaultDarkValue: '#555555',
		defaultLightValue: '#bdbdbd',
	},
	{
		id: 'workspace-leaf-resizer',
		label: 'Workspace Leaf Resize Handle',
		category: 'colors',
		subcategory: 'Borders & Dividers',
		variable: '--workspace-leaf-resize-handle-color',
		type: 'color',
		defaultDarkValue: 'transparent',
		defaultLightValue: 'transparent',
		companionCss: `
.workspace-leaf-resize-handle,
.workspace-split > hr,
.workspace-split.mod-vertical > hr,
.workspace-split.mod-horizontal > hr,
hr.workspace-split-hr {
  background-color: var(--workspace-leaf-resize-handle-color) !important;
  border-color: var(--workspace-leaf-resize-handle-color) !important;
}`,
	},
	{
		id: 'workspace-leaf-resizer-hover',
		label: 'Workspace Leaf Resize Handle Hover',
		category: 'colors',
		subcategory: 'Borders & Dividers',
		variable: '--workspace-leaf-resize-handle-hover-color',
		type: 'color',
		defaultDarkValue: '#8a5cf5',
		defaultLightValue: '#8a5cf5',
		companionCss: `
.workspace-leaf-resize-handle:hover,
.workspace-leaf-resize-handle:active,
.workspace-split > hr:hover,
.workspace-split > hr:active,
hr.workspace-split-hr:hover,
hr.workspace-split-hr:active {
  background-color: var(--workspace-leaf-resize-handle-hover-color) !important;
  border-color: var(--workspace-leaf-resize-handle-hover-color) !important;
}`,
	},
	{
		id: 'workspace-leaf-border',
		label: 'Workspace Leaf Border',
		category: 'colors',
		subcategory: 'Borders & Dividers',
		variable: '--workspace-leaf-border-color',
		type: 'color',
		defaultDarkValue: '#363636',
		defaultLightValue: '#e0e0e0',
		companionCss: `
.workspace-leaf, .workspace-tabs {
  border-color: var(--workspace-leaf-border-color) !important;
}`,
	},
	{
		id: 'workspace-leaf-hover',
		label: 'Workspace Leaf Hover Border',
		category: 'colors',
		subcategory: 'Borders & Dividers',
		variable: '--workspace-leaf-hover-border-color',
		type: 'color',
		defaultDarkValue: '#3f3f3f',
		defaultLightValue: '#d4d4d4',
		companionCss: `
.workspace-leaf:hover, .workspace-tabs:hover {
  border-color: var(--workspace-leaf-hover-border-color) !important;
}`,
	},

	// --- Hover Highlights ---
	{
		id: 'hover-highlight',
		label: 'Hover Background Highlight',
		description: 'Hover tint for lists and buttons',
		category: 'colors',
		subcategory: 'Hover Highlights',
		variable: '--background-modifier-hover',
		type: 'color',
		defaultDarkValue: 'rgba(255, 255, 255, 0.15)',
		defaultLightValue: 'rgba(0, 0, 0, 0.067)',
		companionCss: `
/* Canvas Navigation Hover */
.workspace-leaf-content[data-type="canvas"] .canvas-controls,
.canvas-wrapper .canvas-controls {
  --interactive-hover: var(--background-modifier-hover);
}

.workspace-leaf-content[data-type="canvas"] .canvas-controls .canvas-control-item:hover,
.workspace-leaf-content[data-type="canvas"] .canvas-control-item:hover,
.workspace-leaf-content[data-type="canvas"] .canvas-controls .clickable-icon:hover,
.canvas-wrapper .canvas-controls .canvas-control-item:hover,
.canvas-wrapper .canvas-control-item:hover,
.canvas-wrapper .canvas-controls .clickable-icon:hover,
.canvas-controls .canvas-control-item:hover,
.canvas-control-item:hover,
.canvas-controls .clickable-icon:hover {
  background-color: var(--background-modifier-hover) !important;
}`,
	},

	// --- Checkboxes & Tasks ---
	{
		id: 'checkbox-color',
		label: 'Checkbox Fill Color',
		category: 'colors',
		subcategory: 'Checkboxes & Tasks',
		variable: '--checkbox-color',
		type: 'color',
		defaultDarkValue: '#8a5cf5',
		defaultLightValue: '#8a5cf5',
		companionCss: `
input[type="checkbox"].task-list-item-checkbox:checked,
.task-list-item-checkbox:checked,
.markdown-rendered input[type="checkbox"]:checked,
.cm-content input[type="checkbox"]:checked {
  background-color: var(--checkbox-color) !important;
  border-color: var(--checkbox-border-color, var(--checkbox-color)) !important;
}`,
	},
	{
		id: 'checkbox-border-color',
		label: 'Checkbox Border Color',
		category: 'colors',
		subcategory: 'Checkboxes & Tasks',
		variable: '--checkbox-border-color',
		type: 'color',
		defaultDarkValue: '#666666',
		defaultLightValue: '#ababab',
		companionCss: `
input[type="checkbox"].task-list-item-checkbox,
.task-list-item-checkbox,
.markdown-rendered input[type="checkbox"],
.cm-content input[type="checkbox"] {
  border-color: var(--checkbox-border-color) !important;
}`,
	},
	{
		id: 'checkbox-marker-color',
		label: 'Task Checkmark Color',
		category: 'colors',
		subcategory: 'Checkboxes & Tasks',
		variable: '--checkbox-marker-color',
		type: 'color',
		defaultDarkValue: '#ffffff',
		defaultLightValue: '#ffffff',
		companionCss: `
input[type="checkbox"].task-list-item-checkbox:checked::after,
.task-list-item-checkbox:checked::after,
.markdown-rendered input[type="checkbox"]:checked::after,
.cm-content input[type="checkbox"]:checked::after {
  background-color: var(--checkbox-marker-color) !important;
}`,
	},

	// --- Tables ---
	{
		id: 'table-header-bg',
		label: 'Table Header Background',
		category: 'colors',
		subcategory: 'Tables',
		variable: '--table-header-background',
		type: 'color',
		defaultDarkValue: '#262626',
		defaultLightValue: '#f6f6f6',
		companionCss: `
.markdown-rendered th,
.cm-table-widget th {
  background-color: var(--table-header-background) !important;
}`,
	},
	{
		id: 'table-row-alt-bg',
		label: 'Zebra Table Alt Row',
		category: 'colors',
		subcategory: 'Tables',
		variable: '--table-row-alt-background',
		type: 'color',
		defaultDarkValue: 'transparent',
		defaultLightValue: 'transparent',
		companionCss: `
.markdown-rendered tbody tr:nth-child(even),
.cm-table-widget tr:nth-child(even),
.cm-table-widget .cm-table-row:nth-child(even) {
  background-color: var(--table-row-alt-background) !important;
}`,
	},

	// --- Scrollbars ---
	{
		id: 'scrollbar-thumb-bg',
		label: 'Scrollbar Handle',
		category: 'colors',
		subcategory: 'Scrollbars',
		variable: '--scrollbar-thumb-bg',
		type: 'color',
		defaultDarkValue: 'rgba(255, 255, 255, 0.1)',
		defaultLightValue: 'rgba(0, 0, 0, 0.1)',
		companionCss: `
::-webkit-scrollbar-thumb {
  background-color: var(--scrollbar-thumb-bg) !important;
}`,
	},
	{
		id: 'scrollbar-active-thumb-bg',
		label: 'Scrollbar Active / Hover Handle',
		category: 'colors',
		subcategory: 'Scrollbars',
		variable: '--scrollbar-active-thumb-bg',
		type: 'color',
		defaultDarkValue: 'rgba(255, 255, 255, 0.2)',
		defaultLightValue: 'rgba(0, 0, 0, 0.2)',
		companionCss: `
::-webkit-scrollbar-thumb:hover,
::-webkit-scrollbar-thumb:active {
  background-color: var(--scrollbar-active-thumb-bg) !important;
}`,
	},

	// --- Tabs & Navigation Chrome ---
	{
		id: 'tab-bg-active',
		label: 'Active Tab Background',
		category: 'colors',
		subcategory: 'Tabs & Navigation',
		variable: '--tab-background-active',
		type: 'color',
		defaultDarkValue: '#1e1e1e',
		defaultLightValue: '#ffffff',
		companionCss: `
.workspace-tab-header.is-active {
  background-color: var(--tab-background-active) !important;
}
.workspace-split.mod-root .workspace-tab-header-container .workspace-tab-header.is-active::before,
.workspace-split.mod-root .workspace-tab-header-container .workspace-tab-header.is-active::after {
  box-shadow: inset 0 0 0 var(--tab-outline-width, 1px) var(--tab-outline-color, transparent), 0 0 0 calc(var(--tab-curve, 6px) * 4) var(--tab-background-active) !important;
}`,
	},
	{
		id: 'tab-text-active',
		label: 'Active Tab Text Color',
		category: 'colors',
		subcategory: 'Tabs & Navigation',
		variable: '--tab-text-color-active',
		type: 'color',
		defaultDarkValue: '#dadada',
		defaultLightValue: '#222222',
		companionCss: `
.workspace-tab-header.is-active .workspace-tab-header-inner-title {
  color: var(--tab-text-color-active) !important;
}`,
	},
	{
		id: 'tab-outline-color',
		label: 'Tab Outline & Curve Border',
		category: 'colors',
		subcategory: 'Tabs & Navigation',
		variable: '--tab-outline-color',
		type: 'color',
		defaultDarkValue: 'transparent',
		defaultLightValue: 'transparent',
		companionCss: `
.workspace-split.mod-root .workspace-tab-header.is-active,
.workspace-split.mod-root .workspace-tab-header.mod-active {
  box-shadow: 0 0 0 var(--tab-outline-width, 1px) var(--tab-outline-color) !important;
}
.workspace-split.mod-root .workspace-tab-header-container .workspace-tab-header.is-active::before,
.workspace-split.mod-root .workspace-tab-header-container .workspace-tab-header.is-active::after {
  box-shadow: inset 0 0 0 var(--tab-outline-width, 1px) var(--tab-outline-color), 0 0 0 calc(var(--tab-curve, 6px) * 4) var(--tab-background-active) !important;
}`,
	},
	{
		id: 'tab-icon-outline-color',
		label: 'Tab Icon Outline',
		category: 'colors',
		subcategory: 'Tabs & Navigation',
		variable: '--tab-icon-outline-color',
		type: 'color',
		defaultDarkValue: 'transparent',
		defaultLightValue: 'transparent',
		companionCss: `
.workspace-split.mod-left-split .workspace-tab-header.is-active,
.workspace-split.mod-left-split .workspace-tab-header.mod-active,
.workspace-split.mod-right-split .workspace-tab-header.is-active,
.workspace-split.mod-right-split .workspace-tab-header.mod-active,
.workspace-drawer .workspace-tab-header.is-active,
.workspace-drawer .workspace-tab-header.mod-active,
.mod-sidedock .workspace-tab-header.is-active,
.mod-sidedock .workspace-tab-header.mod-active {
  box-shadow: inset 0 0 0 var(--tab-outline-width, 1px) var(--tab-icon-outline-color) !important;
}`,
	},

	// --- Search Bar ---
	{
		id: 'search-bar-background',
		label: 'Search Bar Fill Color',
		category: 'colors',
		subcategory: 'Search Bar',
		variable: '--search-bar-background',
		type: 'color',
		defaultDarkValue: '#262626',
		defaultLightValue: '#f6f6f6',
		companionCss: `
.search-input-container,
.search-input-container input,
.search-input-container input:hover,
.search-input-container input:focus,
input[type="search"],
input[type="search"]:hover,
input[type="search"]:focus,
.workspace-leaf-content[data-type="search"] .search-input-container,
.workspace-leaf-content[data-type="search"] .search-input-container input,
.workspace-leaf-content[data-type="search"] .search-input-container input:hover,
.workspace-leaf-content[data-type="search"] .search-input-container input:focus,
.workspace-leaf-content[data-type="search"] input[type="search"],
.workspace-leaf-content[data-type="search"] input[type="search"]:hover,
.workspace-leaf-content[data-type="search"] input[type="search"]:focus {
  background-color: var(--search-bar-background, var(--background-secondary)) !important;
}

.modal.mod-settings .setting-group,
.modal.mod-settings .setting-group-search,
.modal.mod-settings .setting-items,
.vertical-tab-content .setting-group,
.vertical-tab-content .setting-group-search,
.vertical-tab-content .setting-items,
.setting-group,
.setting-group-search,
.setting-items,
.modal.mod-settings .search-input-container,
.modal.mod-settings .search-input-container input,
.modal.mod-settings .search-input-container input:hover,
.modal.mod-settings .search-input-container input:focus,
.modal.mod-settings input[type="search"],
.modal.mod-settings input[type="search"]:hover,
.modal.mod-settings input[type="search"]:focus,
.vertical-tab-header .search-input-container,
.vertical-tab-header .search-input-container input,
.vertical-tab-header .search-input-container input:hover,
.vertical-tab-header .search-input-container input:focus,
.vertical-tab-header input[type="search"],
.vertical-tab-header input[type="search"]:hover,
.vertical-tab-header input[type="search"]:focus,
.vertical-tab-content .search-input-container,
.vertical-tab-content .search-input-container input,
.vertical-tab-content .search-input-container input:hover,
.vertical-tab-content .search-input-container input:focus,
.vertical-tab-content input[type="search"],
.vertical-tab-content input[type="search"]:hover,
.vertical-tab-content input[type="search"]:focus {
  background: var(--background-secondary) !important;
  background-color: var(--background-secondary) !important;
}`,
	},

	// --- Navigation Tree ---
	{
		id: 'nav-box-enabled',
		label: 'Visible Boxes in Navigation Tree',
		description: 'Wrap file and folder rows in box containers',
		category: 'colors',
		subcategory: 'Navigation Tree',
		variable: '--nav-box-enabled',
		type: 'toggle',
		defaultDarkValue: 'false',
		defaultLightValue: 'false',
		toggleTrueValue: 'true',
		toggleFalseValue: 'false',
		companionCss: `
.workspace-leaf-content[data-type="file-explorer"] .nav-file-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-folder-title,
.nav-files-container .nav-file-title,
.nav-files-container .nav-folder-title,
.nav-files-container .tree-item-self,
.tree-item-self.nav-file-title,
.tree-item-self.nav-folder-title,
.nav-file-title,
.nav-folder-title {
  background-color: var(--nav-box-bg-display, transparent) !important;
  background-image: none !important;
  border: var(--nav-box-border-display, 1px solid transparent) !important;
  border-color: var(--nav-box-border-color-display, transparent) !important;
  border-radius: var(--nav-box-radius-display, var(--radius-s, 4px)) !important;
  margin: var(--nav-box-margin-display, 0px) !important;
  box-shadow: var(--nav-box-shadow-display, none);
  transition: background-color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease, filter 0.15s ease !important;
}
.workspace-leaf-content[data-type="file-explorer"] .nav-file-title:hover,
.workspace-leaf-content[data-type="file-explorer"] .nav-folder-title:hover,
.nav-files-container .nav-file-title:hover,
.nav-files-container .nav-folder-title:hover,
.nav-files-container .tree-item-self:hover,
.tree-item-self.nav-file-title:hover,
.tree-item-self.nav-folder-title:hover {
  filter: var(--nav-box-hover-filter, none);
}
.workspace-leaf-content[data-type="file-explorer"] .nav-file-title.is-active,
.workspace-leaf-content[data-type="file-explorer"] .nav-folder-title.is-active,
.nav-files-container .nav-file-title.is-active,
.nav-files-container .nav-folder-title.is-active,
.nav-files-container .tree-item-self.is-active,
.tree-item-self.nav-file-title.is-active,
.tree-item-self.nav-folder-title.is-active {
  box-shadow: var(--nav-box-active-shadow, none);
  filter: var(--nav-box-active-filter, none);
}

.workspace-leaf-content[data-type="file-explorer"] .nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(1) > .nav-folder-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(1) > .nav-file-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(1) > .tree-item-self,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > div > :nth-child(1) > .nav-folder-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > div > :nth-child(1) > .nav-file-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > div > :nth-child(1) > .tree-item-self,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > div > :nth-child(1).tree-item-self,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > .nav-folder-children > :nth-child(1) > .nav-folder-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > .nav-folder-children > :nth-child(1) > .nav-file-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > .nav-folder-children > :nth-child(1) > .tree-item-self,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > :nth-child(1) > .nav-folder-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > :nth-child(1) > .nav-file-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > :nth-child(1) > .tree-item-self,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > :nth-child(1).tree-item-self,
.nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(1) > .nav-folder-title,
.nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(1) > .nav-file-title,
.nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(1) > .tree-item-self,
.nav-files-container > div > :nth-child(1) > .nav-folder-title,
.nav-files-container > div > :nth-child(1) > .nav-file-title,
.nav-files-container > div > :nth-child(1) > .tree-item-self,
.nav-files-container > div > :nth-child(1).tree-item-self,
.nav-files-container > .nav-folder-children > :nth-child(1) > .nav-folder-title,
.nav-files-container > .nav-folder-children > :nth-child(1) > .nav-file-title,
.nav-files-container > .nav-folder-children > :nth-child(1) > .tree-item-self,
.nav-files-container > :nth-child(1) > .nav-folder-title,
.nav-files-container > :nth-child(1) > .nav-file-title,
.nav-files-container > :nth-child(1) > .tree-item-self,
.nav-files-container > :nth-child(1).tree-item-self {
  background-color: var(--nav-box-item-1-bg, var(--nav-box-bg-display, transparent)) !important;
  border-color: var(--nav-box-item-1-border, var(--nav-box-border-color-display, transparent)) !important;
  background-image: none !important;
}

.workspace-leaf-content[data-type="file-explorer"] .nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(2) > .nav-folder-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(2) > .nav-file-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(2) > .tree-item-self,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > div > :nth-child(2) > .nav-folder-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > div > :nth-child(2) > .nav-file-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > div > :nth-child(2) > .tree-item-self,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > div > :nth-child(2).tree-item-self,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > .nav-folder-children > :nth-child(2) > .nav-folder-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > .nav-folder-children > :nth-child(2) > .nav-file-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > .nav-folder-children > :nth-child(2) > .tree-item-self,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > :nth-child(2) > .nav-folder-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > :nth-child(2) > .nav-file-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > :nth-child(2) > .tree-item-self,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > :nth-child(2).tree-item-self,
.nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(2) > .nav-folder-title,
.nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(2) > .nav-file-title,
.nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(2) > .tree-item-self,
.nav-files-container > div > :nth-child(2) > .nav-folder-title,
.nav-files-container > div > :nth-child(2) > .nav-file-title,
.nav-files-container > div > :nth-child(2) > .tree-item-self,
.nav-files-container > div > :nth-child(2).tree-item-self,
.nav-files-container > .nav-folder-children > :nth-child(2) > .nav-folder-title,
.nav-files-container > .nav-folder-children > :nth-child(2) > .nav-file-title,
.nav-files-container > .nav-folder-children > :nth-child(2) > .tree-item-self,
.nav-files-container > :nth-child(2) > .nav-folder-title,
.nav-files-container > :nth-child(2) > .nav-file-title,
.nav-files-container > :nth-child(2) > .tree-item-self,
.nav-files-container > :nth-child(2).tree-item-self {
  background-color: var(--nav-box-item-2-bg, var(--nav-box-bg-display, transparent)) !important;
  border-color: var(--nav-box-item-2-border, var(--nav-box-border-color-display, transparent)) !important;
  background-image: none !important;
}

.workspace-leaf-content[data-type="file-explorer"] .nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(3) > .nav-folder-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(3) > .nav-file-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(3) > .tree-item-self,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > div > :nth-child(3) > .nav-folder-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > div > :nth-child(3) > .nav-file-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > div > :nth-child(3) > .tree-item-self,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > div > :nth-child(3).tree-item-self,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > .nav-folder-children > :nth-child(3) > .nav-folder-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > .nav-folder-children > :nth-child(3) > .nav-file-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > .nav-folder-children > :nth-child(3) > .tree-item-self,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > :nth-child(3) > .nav-folder-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > :nth-child(3) > .nav-file-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > :nth-child(3) > .tree-item-self,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > :nth-child(3).tree-item-self,
.nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(3) > .nav-folder-title,
.nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(3) > .nav-file-title,
.nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(3) > .tree-item-self,
.nav-files-container > div > :nth-child(3) > .nav-folder-title,
.nav-files-container > div > :nth-child(3) > .nav-file-title,
.nav-files-container > div > :nth-child(3) > .tree-item-self,
.nav-files-container > div > :nth-child(3).tree-item-self,
.nav-files-container > .nav-folder-children > :nth-child(3) > .nav-folder-title,
.nav-files-container > .nav-folder-children > :nth-child(3) > .nav-file-title,
.nav-files-container > .nav-folder-children > :nth-child(3) > .tree-item-self,
.nav-files-container > :nth-child(3) > .nav-folder-title,
.nav-files-container > :nth-child(3) > .nav-file-title,
.nav-files-container > :nth-child(3) > .tree-item-self,
.nav-files-container > :nth-child(3).tree-item-self {
  background-color: var(--nav-box-item-3-bg, var(--nav-box-bg-display, transparent)) !important;
  border-color: var(--nav-box-item-3-border, var(--nav-box-border-color-display, transparent)) !important;
  background-image: none !important;
}

.workspace-leaf-content[data-type="file-explorer"] .nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(4) > .nav-folder-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(4) > .nav-file-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(4) > .tree-item-self,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > div > :nth-child(4) > .nav-folder-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > div > :nth-child(4) > .nav-file-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > div > :nth-child(4) > .tree-item-self,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > div > :nth-child(4).tree-item-self,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > .nav-folder-children > :nth-child(4) > .nav-folder-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > .nav-folder-children > :nth-child(4) > .nav-file-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > .nav-folder-children > :nth-child(4) > .tree-item-self,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > :nth-child(4) > .nav-folder-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > :nth-child(4) > .nav-file-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > :nth-child(4) > .tree-item-self,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > :nth-child(4).tree-item-self,
.nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(4) > .nav-folder-title,
.nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(4) > .nav-file-title,
.nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(4) > .tree-item-self,
.nav-files-container > div > :nth-child(4) > .nav-folder-title,
.nav-files-container > div > :nth-child(4) > .nav-file-title,
.nav-files-container > div > :nth-child(4) > .tree-item-self,
.nav-files-container > div > :nth-child(4).tree-item-self,
.nav-files-container > .nav-folder-children > :nth-child(4) > .nav-folder-title,
.nav-files-container > .nav-folder-children > :nth-child(4) > .nav-file-title,
.nav-files-container > .nav-folder-children > :nth-child(4) > .tree-item-self,
.nav-files-container > :nth-child(4) > .nav-folder-title,
.nav-files-container > :nth-child(4) > .nav-file-title,
.nav-files-container > :nth-child(4) > .tree-item-self,
.nav-files-container > :nth-child(4).tree-item-self {
  background-color: var(--nav-box-item-4-bg, var(--nav-box-bg-display, transparent)) !important;
  border-color: var(--nav-box-item-4-border, var(--nav-box-border-color-display, transparent)) !important;
  background-image: none !important;
}

.workspace-leaf-content[data-type="file-explorer"] .nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(5) > .nav-folder-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(5) > .nav-file-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(5) > .tree-item-self,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > div > :nth-child(5) > .nav-folder-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > div > :nth-child(5) > .nav-file-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > div > :nth-child(5) > .tree-item-self,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > div > :nth-child(5).tree-item-self,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > .nav-folder-children > :nth-child(5) > .nav-folder-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > .nav-folder-children > :nth-child(5) > .nav-file-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > .nav-folder-children > :nth-child(5) > .tree-item-self,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > :nth-child(5) > .nav-folder-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > :nth-child(5) > .nav-file-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > :nth-child(5) > .tree-item-self,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > :nth-child(5).tree-item-self,
.nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(5) > .nav-folder-title,
.nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(5) > .nav-file-title,
.nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(5) > .tree-item-self,
.nav-files-container > div > :nth-child(5) > .nav-folder-title,
.nav-files-container > div > :nth-child(5) > .nav-file-title,
.nav-files-container > div > :nth-child(5) > .tree-item-self,
.nav-files-container > div > :nth-child(5).tree-item-self,
.nav-files-container > .nav-folder-children > :nth-child(5) > .nav-folder-title,
.nav-files-container > .nav-folder-children > :nth-child(5) > .nav-file-title,
.nav-files-container > .nav-folder-children > :nth-child(5) > .tree-item-self,
.nav-files-container > :nth-child(5) > .nav-folder-title,
.nav-files-container > :nth-child(5) > .nav-file-title,
.nav-files-container > :nth-child(5) > .tree-item-self,
.nav-files-container > :nth-child(5).tree-item-self {
  background-color: var(--nav-box-item-5-bg, var(--nav-box-bg-display, transparent)) !important;
  border-color: var(--nav-box-item-5-border, var(--nav-box-border-color-display, transparent)) !important;
  background-image: none !important;
}

.workspace-leaf-content[data-type="file-explorer"] .nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(6) > .nav-folder-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(6) > .nav-file-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(6) > .tree-item-self,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > div > :nth-child(6) > .nav-folder-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > div > :nth-child(6) > .nav-file-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > div > :nth-child(6) > .tree-item-self,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > div > :nth-child(6).tree-item-self,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > .nav-folder-children > :nth-child(6) > .nav-folder-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > .nav-folder-children > :nth-child(6) > .nav-file-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > .nav-folder-children > :nth-child(6) > .tree-item-self,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > :nth-child(6) > .nav-folder-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > :nth-child(6) > .nav-file-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > :nth-child(6) > .tree-item-self,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > :nth-child(6).tree-item-self,
.nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(6) > .nav-folder-title,
.nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(6) > .nav-file-title,
.nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(6) > .tree-item-self,
.nav-files-container > div > :nth-child(6) > .nav-folder-title,
.nav-files-container > div > :nth-child(6) > .nav-file-title,
.nav-files-container > div > :nth-child(6) > .tree-item-self,
.nav-files-container > div > :nth-child(6).tree-item-self,
.nav-files-container > .nav-folder-children > :nth-child(6) > .nav-folder-title,
.nav-files-container > .nav-folder-children > :nth-child(6) > .nav-file-title,
.nav-files-container > .nav-folder-children > :nth-child(6) > .tree-item-self,
.nav-files-container > :nth-child(6) > .nav-folder-title,
.nav-files-container > :nth-child(6) > .nav-file-title,
.nav-files-container > :nth-child(6) > .tree-item-self,
.nav-files-container > :nth-child(6).tree-item-self {
  background-color: var(--nav-box-item-6-bg, var(--nav-box-bg-display, transparent)) !important;
  border-color: var(--nav-box-item-6-border, var(--nav-box-border-color-display, transparent)) !important;
  background-image: none !important;
}

.workspace-leaf-content[data-type="file-explorer"] .nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(7) > .nav-folder-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(7) > .nav-file-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(7) > .tree-item-self,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > div > :nth-child(7) > .nav-folder-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > div > :nth-child(7) > .nav-file-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > div > :nth-child(7) > .tree-item-self,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > div > :nth-child(7).tree-item-self,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > .nav-folder-children > :nth-child(7) > .nav-folder-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > .nav-folder-children > :nth-child(7) > .nav-file-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > .nav-folder-children > :nth-child(7) > .tree-item-self,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > :nth-child(7) > .nav-folder-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > :nth-child(7) > .nav-file-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > :nth-child(7) > .tree-item-self,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > :nth-child(7).tree-item-self,
.nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(7) > .nav-folder-title,
.nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(7) > .nav-file-title,
.nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(7) > .tree-item-self,
.nav-files-container > div > :nth-child(7) > .nav-folder-title,
.nav-files-container > div > :nth-child(7) > .nav-file-title,
.nav-files-container > div > :nth-child(7) > .tree-item-self,
.nav-files-container > div > :nth-child(7).tree-item-self,
.nav-files-container > .nav-folder-children > :nth-child(7) > .nav-folder-title,
.nav-files-container > .nav-folder-children > :nth-child(7) > .nav-file-title,
.nav-files-container > .nav-folder-children > :nth-child(7) > .tree-item-self,
.nav-files-container > :nth-child(7) > .nav-folder-title,
.nav-files-container > :nth-child(7) > .nav-file-title,
.nav-files-container > :nth-child(7) > .tree-item-self,
.nav-files-container > :nth-child(7).tree-item-self {
  background-color: var(--nav-box-item-7-bg, var(--nav-box-bg-display, transparent)) !important;
  border-color: var(--nav-box-item-7-border, var(--nav-box-border-color-display, transparent)) !important;
  background-image: none !important;
}

.workspace-leaf-content[data-type="file-explorer"] .nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(8) > .nav-folder-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(8) > .nav-file-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(8) > .tree-item-self,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > div > :nth-child(8) > .nav-folder-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > div > :nth-child(8) > .nav-file-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > div > :nth-child(8) > .tree-item-self,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > div > :nth-child(8).tree-item-self,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > .nav-folder-children > :nth-child(8) > .nav-folder-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > .nav-folder-children > :nth-child(8) > .nav-file-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > .nav-folder-children > :nth-child(8) > .tree-item-self,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > :nth-child(8) > .nav-folder-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > :nth-child(8) > .nav-file-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > :nth-child(8) > .tree-item-self,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > :nth-child(8).tree-item-self,
.nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(8) > .nav-folder-title,
.nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(8) > .nav-file-title,
.nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(8) > .tree-item-self,
.nav-files-container > div > :nth-child(8) > .nav-folder-title,
.nav-files-container > div > :nth-child(8) > .nav-file-title,
.nav-files-container > div > :nth-child(8) > .tree-item-self,
.nav-files-container > div > :nth-child(8).tree-item-self,
.nav-files-container > .nav-folder-children > :nth-child(8) > .nav-folder-title,
.nav-files-container > .nav-folder-children > :nth-child(8) > .nav-file-title,
.nav-files-container > .nav-folder-children > :nth-child(8) > .tree-item-self,
.nav-files-container > :nth-child(8) > .nav-folder-title,
.nav-files-container > :nth-child(8) > .nav-file-title,
.nav-files-container > :nth-child(8) > .tree-item-self,
.nav-files-container > :nth-child(8).tree-item-self {
  background-color: var(--nav-box-item-8-bg, var(--nav-box-bg-display, transparent)) !important;
  border-color: var(--nav-box-item-8-border, var(--nav-box-border-color-display, transparent)) !important;
  background-image: none !important;
}

.workspace-leaf-content[data-type="file-explorer"] .nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(9) > .nav-folder-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(9) > .nav-file-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(9) > .tree-item-self,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > div > :nth-child(9) > .nav-folder-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > div > :nth-child(9) > .nav-file-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > div > :nth-child(9) > .tree-item-self,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > div > :nth-child(9).tree-item-self,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > .nav-folder-children > :nth-child(9) > .nav-folder-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > .nav-folder-children > :nth-child(9) > .nav-file-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > .nav-folder-children > :nth-child(9) > .tree-item-self,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > :nth-child(9) > .nav-folder-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > :nth-child(9) > .nav-file-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > :nth-child(9) > .tree-item-self,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > :nth-child(9).tree-item-self,
.nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(9) > .nav-folder-title,
.nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(9) > .nav-file-title,
.nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(9) > .tree-item-self,
.nav-files-container > div > :nth-child(9) > .nav-folder-title,
.nav-files-container > div > :nth-child(9) > .nav-file-title,
.nav-files-container > div > :nth-child(9) > .tree-item-self,
.nav-files-container > div > :nth-child(9).tree-item-self,
.nav-files-container > .nav-folder-children > :nth-child(9) > .nav-folder-title,
.nav-files-container > .nav-folder-children > :nth-child(9) > .nav-file-title,
.nav-files-container > .nav-folder-children > :nth-child(9) > .tree-item-self,
.nav-files-container > :nth-child(9) > .nav-folder-title,
.nav-files-container > :nth-child(9) > .nav-file-title,
.nav-files-container > :nth-child(9) > .tree-item-self,
.nav-files-container > :nth-child(9).tree-item-self {
  background-color: var(--nav-box-item-9-bg, var(--nav-box-bg-display, transparent)) !important;
  border-color: var(--nav-box-item-9-border, var(--nav-box-border-color-display, transparent)) !important;
  background-image: none !important;
}

.workspace-leaf-content[data-type="file-explorer"] .nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(10) > .nav-folder-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(10) > .nav-file-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(10) > .tree-item-self,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > div > :nth-child(10) > .nav-folder-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > div > :nth-child(10) > .nav-file-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > div > :nth-child(10) > .tree-item-self,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > div > :nth-child(10).tree-item-self,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > .nav-folder-children > :nth-child(10) > .nav-folder-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > .nav-folder-children > :nth-child(10) > .nav-file-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > .nav-folder-children > :nth-child(10) > .tree-item-self,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > :nth-child(10) > .nav-folder-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > :nth-child(10) > .nav-file-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > :nth-child(10) > .tree-item-self,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > :nth-child(10).tree-item-self,
.nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(10) > .nav-folder-title,
.nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(10) > .nav-file-title,
.nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(10) > .tree-item-self,
.nav-files-container > div > :nth-child(10) > .nav-folder-title,
.nav-files-container > div > :nth-child(10) > .nav-file-title,
.nav-files-container > div > :nth-child(10) > .tree-item-self,
.nav-files-container > div > :nth-child(10).tree-item-self,
.nav-files-container > .nav-folder-children > :nth-child(10) > .nav-folder-title,
.nav-files-container > .nav-folder-children > :nth-child(10) > .nav-file-title,
.nav-files-container > .nav-folder-children > :nth-child(10) > .tree-item-self,
.nav-files-container > :nth-child(10) > .nav-folder-title,
.nav-files-container > :nth-child(10) > .nav-file-title,
.nav-files-container > :nth-child(10) > .tree-item-self,
.nav-files-container > :nth-child(10).tree-item-self {
  background-color: var(--nav-box-item-10-bg, var(--nav-box-bg-display, transparent)) !important;
  border-color: var(--nav-box-item-10-border, var(--nav-box-border-color-display, transparent)) !important;
  background-image: none !important;
}

.workspace-leaf-content[data-type="file-explorer"] .nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(11) > .nav-folder-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(11) > .nav-file-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(11) > .tree-item-self,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > div > :nth-child(11) > .nav-folder-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > div > :nth-child(11) > .nav-file-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > div > :nth-child(11) > .tree-item-self,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > div > :nth-child(11).tree-item-self,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > .nav-folder-children > :nth-child(11) > .nav-folder-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > .nav-folder-children > :nth-child(11) > .nav-file-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > .nav-folder-children > :nth-child(11) > .tree-item-self,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > :nth-child(11) > .nav-folder-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > :nth-child(11) > .nav-file-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > :nth-child(11) > .tree-item-self,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > :nth-child(11).tree-item-self,
.nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(11) > .nav-folder-title,
.nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(11) > .nav-file-title,
.nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(11) > .tree-item-self,
.nav-files-container > div > :nth-child(11) > .nav-folder-title,
.nav-files-container > div > :nth-child(11) > .nav-file-title,
.nav-files-container > div > :nth-child(11) > .tree-item-self,
.nav-files-container > div > :nth-child(11).tree-item-self,
.nav-files-container > .nav-folder-children > :nth-child(11) > .nav-folder-title,
.nav-files-container > .nav-folder-children > :nth-child(11) > .nav-file-title,
.nav-files-container > .nav-folder-children > :nth-child(11) > .tree-item-self,
.nav-files-container > :nth-child(11) > .nav-folder-title,
.nav-files-container > :nth-child(11) > .nav-file-title,
.nav-files-container > :nth-child(11) > .tree-item-self,
.nav-files-container > :nth-child(11).tree-item-self {
  background-color: var(--nav-box-item-11-bg, var(--nav-box-bg-display, transparent)) !important;
  border-color: var(--nav-box-item-11-border, var(--nav-box-border-color-display, transparent)) !important;
  background-image: none !important;
}

.workspace-leaf-content[data-type="file-explorer"] .nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(12) > .nav-folder-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(12) > .nav-file-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(12) > .tree-item-self,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > div > :nth-child(12) > .nav-folder-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > div > :nth-child(12) > .nav-file-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > div > :nth-child(12) > .tree-item-self,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > div > :nth-child(12).tree-item-self,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > .nav-folder-children > :nth-child(12) > .nav-folder-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > .nav-folder-children > :nth-child(12) > .nav-file-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > .nav-folder-children > :nth-child(12) > .tree-item-self,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > :nth-child(12) > .nav-folder-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > :nth-child(12) > .nav-file-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > :nth-child(12) > .tree-item-self,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > :nth-child(12).tree-item-self,
.nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(12) > .nav-folder-title,
.nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(12) > .nav-file-title,
.nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(12) > .tree-item-self,
.nav-files-container > div > :nth-child(12) > .nav-folder-title,
.nav-files-container > div > :nth-child(12) > .nav-file-title,
.nav-files-container > div > :nth-child(12) > .tree-item-self,
.nav-files-container > div > :nth-child(12).tree-item-self,
.nav-files-container > .nav-folder-children > :nth-child(12) > .nav-folder-title,
.nav-files-container > .nav-folder-children > :nth-child(12) > .nav-file-title,
.nav-files-container > .nav-folder-children > :nth-child(12) > .tree-item-self,
.nav-files-container > :nth-child(12) > .nav-folder-title,
.nav-files-container > :nth-child(12) > .nav-file-title,
.nav-files-container > :nth-child(12) > .tree-item-self,
.nav-files-container > :nth-child(12).tree-item-self {
  background-color: var(--nav-box-item-12-bg, var(--nav-box-bg-display, transparent)) !important;
  border-color: var(--nav-box-item-12-border, var(--nav-box-border-color-display, transparent)) !important;
  background-image: none !important;
}

.workspace-leaf-content[data-type="file-explorer"] .nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(13) > .nav-folder-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(13) > .nav-file-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(13) > .tree-item-self,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > div > :nth-child(13) > .nav-folder-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > div > :nth-child(13) > .nav-file-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > div > :nth-child(13) > .tree-item-self,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > div > :nth-child(13).tree-item-self,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > .nav-folder-children > :nth-child(13) > .nav-folder-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > .nav-folder-children > :nth-child(13) > .nav-file-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > .nav-folder-children > :nth-child(13) > .tree-item-self,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > :nth-child(13) > .nav-folder-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > :nth-child(13) > .nav-file-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > :nth-child(13) > .tree-item-self,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > :nth-child(13).tree-item-self,
.nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(13) > .nav-folder-title,
.nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(13) > .nav-file-title,
.nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(13) > .tree-item-self,
.nav-files-container > div > :nth-child(13) > .nav-folder-title,
.nav-files-container > div > :nth-child(13) > .nav-file-title,
.nav-files-container > div > :nth-child(13) > .tree-item-self,
.nav-files-container > div > :nth-child(13).tree-item-self,
.nav-files-container > .nav-folder-children > :nth-child(13) > .nav-folder-title,
.nav-files-container > .nav-folder-children > :nth-child(13) > .nav-file-title,
.nav-files-container > .nav-folder-children > :nth-child(13) > .tree-item-self,
.nav-files-container > :nth-child(13) > .nav-folder-title,
.nav-files-container > :nth-child(13) > .nav-file-title,
.nav-files-container > :nth-child(13) > .tree-item-self,
.nav-files-container > :nth-child(13).tree-item-self {
  background-color: var(--nav-box-item-13-bg, var(--nav-box-bg-display, transparent)) !important;
  border-color: var(--nav-box-item-13-border, var(--nav-box-border-color-display, transparent)) !important;
  background-image: none !important;
}

.workspace-leaf-content[data-type="file-explorer"] .nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(14) > .nav-folder-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(14) > .nav-file-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(14) > .tree-item-self,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > div > :nth-child(14) > .nav-folder-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > div > :nth-child(14) > .nav-file-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > div > :nth-child(14) > .tree-item-self,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > div > :nth-child(14).tree-item-self,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > .nav-folder-children > :nth-child(14) > .nav-folder-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > .nav-folder-children > :nth-child(14) > .nav-file-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > .nav-folder-children > :nth-child(14) > .tree-item-self,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > :nth-child(14) > .nav-folder-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > :nth-child(14) > .nav-file-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > :nth-child(14) > .tree-item-self,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > :nth-child(14).tree-item-self,
.nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(14) > .nav-folder-title,
.nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(14) > .nav-file-title,
.nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(14) > .tree-item-self,
.nav-files-container > div > :nth-child(14) > .nav-folder-title,
.nav-files-container > div > :nth-child(14) > .nav-file-title,
.nav-files-container > div > :nth-child(14) > .tree-item-self,
.nav-files-container > div > :nth-child(14).tree-item-self,
.nav-files-container > .nav-folder-children > :nth-child(14) > .nav-folder-title,
.nav-files-container > .nav-folder-children > :nth-child(14) > .nav-file-title,
.nav-files-container > .nav-folder-children > :nth-child(14) > .tree-item-self,
.nav-files-container > :nth-child(14) > .nav-folder-title,
.nav-files-container > :nth-child(14) > .nav-file-title,
.nav-files-container > :nth-child(14) > .tree-item-self,
.nav-files-container > :nth-child(14).tree-item-self {
  background-color: var(--nav-box-item-14-bg, var(--nav-box-bg-display, transparent)) !important;
  border-color: var(--nav-box-item-14-border, var(--nav-box-border-color-display, transparent)) !important;
  background-image: none !important;
}

.workspace-leaf-content[data-type="file-explorer"] .nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(15) > .nav-folder-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(15) > .nav-file-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(15) > .tree-item-self,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > div > :nth-child(15) > .nav-folder-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > div > :nth-child(15) > .nav-file-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > div > :nth-child(15) > .tree-item-self,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > div > :nth-child(15).tree-item-self,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > .nav-folder-children > :nth-child(15) > .nav-folder-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > .nav-folder-children > :nth-child(15) > .nav-file-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > .nav-folder-children > :nth-child(15) > .tree-item-self,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > :nth-child(15) > .nav-folder-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > :nth-child(15) > .nav-file-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > :nth-child(15) > .tree-item-self,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > :nth-child(15).tree-item-self,
.nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(15) > .nav-folder-title,
.nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(15) > .nav-file-title,
.nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(15) > .tree-item-self,
.nav-files-container > div > :nth-child(15) > .nav-folder-title,
.nav-files-container > div > :nth-child(15) > .nav-file-title,
.nav-files-container > div > :nth-child(15) > .tree-item-self,
.nav-files-container > div > :nth-child(15).tree-item-self,
.nav-files-container > .nav-folder-children > :nth-child(15) > .nav-folder-title,
.nav-files-container > .nav-folder-children > :nth-child(15) > .nav-file-title,
.nav-files-container > .nav-folder-children > :nth-child(15) > .tree-item-self,
.nav-files-container > :nth-child(15) > .nav-folder-title,
.nav-files-container > :nth-child(15) > .nav-file-title,
.nav-files-container > :nth-child(15) > .tree-item-self,
.nav-files-container > :nth-child(15).tree-item-self {
  background-color: var(--nav-box-item-15-bg, var(--nav-box-bg-display, transparent)) !important;
  border-color: var(--nav-box-item-15-border, var(--nav-box-border-color-display, transparent)) !important;
  background-image: none !important;
}

.workspace-leaf-content[data-type="file-explorer"] .nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(16) > .nav-folder-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(16) > .nav-file-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(16) > .tree-item-self,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > div > :nth-child(16) > .nav-folder-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > div > :nth-child(16) > .nav-file-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > div > :nth-child(16) > .tree-item-self,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > div > :nth-child(16).tree-item-self,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > .nav-folder-children > :nth-child(16) > .nav-folder-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > .nav-folder-children > :nth-child(16) > .nav-file-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > .nav-folder-children > :nth-child(16) > .tree-item-self,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > :nth-child(16) > .nav-folder-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > :nth-child(16) > .nav-file-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > :nth-child(16) > .tree-item-self,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > :nth-child(16).tree-item-self,
.nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(16) > .nav-folder-title,
.nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(16) > .nav-file-title,
.nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(16) > .tree-item-self,
.nav-files-container > div > :nth-child(16) > .nav-folder-title,
.nav-files-container > div > :nth-child(16) > .nav-file-title,
.nav-files-container > div > :nth-child(16) > .tree-item-self,
.nav-files-container > div > :nth-child(16).tree-item-self,
.nav-files-container > .nav-folder-children > :nth-child(16) > .nav-folder-title,
.nav-files-container > .nav-folder-children > :nth-child(16) > .nav-file-title,
.nav-files-container > .nav-folder-children > :nth-child(16) > .tree-item-self,
.nav-files-container > :nth-child(16) > .nav-folder-title,
.nav-files-container > :nth-child(16) > .nav-file-title,
.nav-files-container > :nth-child(16) > .tree-item-self,
.nav-files-container > :nth-child(16).tree-item-self {
  background-color: var(--nav-box-item-16-bg, var(--nav-box-bg-display, transparent)) !important;
  border-color: var(--nav-box-item-16-border, var(--nav-box-border-color-display, transparent)) !important;
  background-image: none !important;
}

.workspace-leaf-content[data-type="file-explorer"] .nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(17) > .nav-folder-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(17) > .nav-file-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(17) > .tree-item-self,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > div > :nth-child(17) > .nav-folder-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > div > :nth-child(17) > .nav-file-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > div > :nth-child(17) > .tree-item-self,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > div > :nth-child(17).tree-item-self,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > .nav-folder-children > :nth-child(17) > .nav-folder-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > .nav-folder-children > :nth-child(17) > .nav-file-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > .nav-folder-children > :nth-child(17) > .tree-item-self,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > :nth-child(17) > .nav-folder-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > :nth-child(17) > .nav-file-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > :nth-child(17) > .tree-item-self,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > :nth-child(17).tree-item-self,
.nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(17) > .nav-folder-title,
.nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(17) > .nav-file-title,
.nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(17) > .tree-item-self,
.nav-files-container > div > :nth-child(17) > .nav-folder-title,
.nav-files-container > div > :nth-child(17) > .nav-file-title,
.nav-files-container > div > :nth-child(17) > .tree-item-self,
.nav-files-container > div > :nth-child(17).tree-item-self,
.nav-files-container > .nav-folder-children > :nth-child(17) > .nav-folder-title,
.nav-files-container > .nav-folder-children > :nth-child(17) > .nav-file-title,
.nav-files-container > .nav-folder-children > :nth-child(17) > .tree-item-self,
.nav-files-container > :nth-child(17) > .nav-folder-title,
.nav-files-container > :nth-child(17) > .nav-file-title,
.nav-files-container > :nth-child(17) > .tree-item-self,
.nav-files-container > :nth-child(17).tree-item-self {
  background-color: var(--nav-box-item-17-bg, var(--nav-box-bg-display, transparent)) !important;
  border-color: var(--nav-box-item-17-border, var(--nav-box-border-color-display, transparent)) !important;
  background-image: none !important;
}

.workspace-leaf-content[data-type="file-explorer"] .nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(18) > .nav-folder-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(18) > .nav-file-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(18) > .tree-item-self,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > div > :nth-child(18) > .nav-folder-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > div > :nth-child(18) > .nav-file-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > div > :nth-child(18) > .tree-item-self,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > div > :nth-child(18).tree-item-self,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > .nav-folder-children > :nth-child(18) > .nav-folder-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > .nav-folder-children > :nth-child(18) > .nav-file-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > .nav-folder-children > :nth-child(18) > .tree-item-self,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > :nth-child(18) > .nav-folder-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > :nth-child(18) > .nav-file-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > :nth-child(18) > .tree-item-self,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > :nth-child(18).tree-item-self,
.nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(18) > .nav-folder-title,
.nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(18) > .nav-file-title,
.nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(18) > .tree-item-self,
.nav-files-container > div > :nth-child(18) > .nav-folder-title,
.nav-files-container > div > :nth-child(18) > .nav-file-title,
.nav-files-container > div > :nth-child(18) > .tree-item-self,
.nav-files-container > div > :nth-child(18).tree-item-self,
.nav-files-container > .nav-folder-children > :nth-child(18) > .nav-folder-title,
.nav-files-container > .nav-folder-children > :nth-child(18) > .nav-file-title,
.nav-files-container > .nav-folder-children > :nth-child(18) > .tree-item-self,
.nav-files-container > :nth-child(18) > .nav-folder-title,
.nav-files-container > :nth-child(18) > .nav-file-title,
.nav-files-container > :nth-child(18) > .tree-item-self,
.nav-files-container > :nth-child(18).tree-item-self {
  background-color: var(--nav-box-item-18-bg, var(--nav-box-bg-display, transparent)) !important;
  border-color: var(--nav-box-item-18-border, var(--nav-box-border-color-display, transparent)) !important;
  background-image: none !important;
}

.workspace-leaf-content[data-type="file-explorer"] .nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(19) > .nav-folder-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(19) > .nav-file-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(19) > .tree-item-self,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > div > :nth-child(19) > .nav-folder-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > div > :nth-child(19) > .nav-file-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > div > :nth-child(19) > .tree-item-self,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > div > :nth-child(19).tree-item-self,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > .nav-folder-children > :nth-child(19) > .nav-folder-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > .nav-folder-children > :nth-child(19) > .nav-file-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > .nav-folder-children > :nth-child(19) > .tree-item-self,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > :nth-child(19) > .nav-folder-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > :nth-child(19) > .nav-file-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > :nth-child(19) > .tree-item-self,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > :nth-child(19).tree-item-self,
.nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(19) > .nav-folder-title,
.nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(19) > .nav-file-title,
.nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(19) > .tree-item-self,
.nav-files-container > div > :nth-child(19) > .nav-folder-title,
.nav-files-container > div > :nth-child(19) > .nav-file-title,
.nav-files-container > div > :nth-child(19) > .tree-item-self,
.nav-files-container > div > :nth-child(19).tree-item-self,
.nav-files-container > .nav-folder-children > :nth-child(19) > .nav-folder-title,
.nav-files-container > .nav-folder-children > :nth-child(19) > .nav-file-title,
.nav-files-container > .nav-folder-children > :nth-child(19) > .tree-item-self,
.nav-files-container > :nth-child(19) > .nav-folder-title,
.nav-files-container > :nth-child(19) > .nav-file-title,
.nav-files-container > :nth-child(19) > .tree-item-self,
.nav-files-container > :nth-child(19).tree-item-self {
  background-color: var(--nav-box-item-19-bg, var(--nav-box-bg-display, transparent)) !important;
  border-color: var(--nav-box-item-19-border, var(--nav-box-border-color-display, transparent)) !important;
  background-image: none !important;
}

.workspace-leaf-content[data-type="file-explorer"] .nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(20) > .nav-folder-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(20) > .nav-file-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(20) > .tree-item-self,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > div > :nth-child(20) > .nav-folder-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > div > :nth-child(20) > .nav-file-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > div > :nth-child(20) > .tree-item-self,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > div > :nth-child(20).tree-item-self,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > .nav-folder-children > :nth-child(20) > .nav-folder-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > .nav-folder-children > :nth-child(20) > .nav-file-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > .nav-folder-children > :nth-child(20) > .tree-item-self,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > :nth-child(20) > .nav-folder-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > :nth-child(20) > .nav-file-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > :nth-child(20) > .tree-item-self,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > :nth-child(20).tree-item-self,
.nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(20) > .nav-folder-title,
.nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(20) > .nav-file-title,
.nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(20) > .tree-item-self,
.nav-files-container > div > :nth-child(20) > .nav-folder-title,
.nav-files-container > div > :nth-child(20) > .nav-file-title,
.nav-files-container > div > :nth-child(20) > .tree-item-self,
.nav-files-container > div > :nth-child(20).tree-item-self,
.nav-files-container > .nav-folder-children > :nth-child(20) > .nav-folder-title,
.nav-files-container > .nav-folder-children > :nth-child(20) > .nav-file-title,
.nav-files-container > .nav-folder-children > :nth-child(20) > .tree-item-self,
.nav-files-container > :nth-child(20) > .nav-folder-title,
.nav-files-container > :nth-child(20) > .nav-file-title,
.nav-files-container > :nth-child(20) > .tree-item-self,
.nav-files-container > :nth-child(20).tree-item-self {
  background-color: var(--nav-box-item-20-bg, var(--nav-box-bg-display, transparent)) !important;
  border-color: var(--nav-box-item-20-border, var(--nav-box-border-color-display, transparent)) !important;
  background-image: none !important;
}

.workspace-leaf-content[data-type="file-explorer"] .nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(21) > .nav-folder-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(21) > .nav-file-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(21) > .tree-item-self,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > div > :nth-child(21) > .nav-folder-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > div > :nth-child(21) > .nav-file-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > div > :nth-child(21) > .tree-item-self,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > div > :nth-child(21).tree-item-self,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > .nav-folder-children > :nth-child(21) > .nav-folder-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > .nav-folder-children > :nth-child(21) > .nav-file-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > .nav-folder-children > :nth-child(21) > .tree-item-self,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > :nth-child(21) > .nav-folder-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > :nth-child(21) > .nav-file-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > :nth-child(21) > .tree-item-self,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > :nth-child(21).tree-item-self,
.nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(21) > .nav-folder-title,
.nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(21) > .nav-file-title,
.nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(21) > .tree-item-self,
.nav-files-container > div > :nth-child(21) > .nav-folder-title,
.nav-files-container > div > :nth-child(21) > .nav-file-title,
.nav-files-container > div > :nth-child(21) > .tree-item-self,
.nav-files-container > div > :nth-child(21).tree-item-self,
.nav-files-container > .nav-folder-children > :nth-child(21) > .nav-folder-title,
.nav-files-container > .nav-folder-children > :nth-child(21) > .nav-file-title,
.nav-files-container > .nav-folder-children > :nth-child(21) > .tree-item-self,
.nav-files-container > :nth-child(21) > .nav-folder-title,
.nav-files-container > :nth-child(21) > .nav-file-title,
.nav-files-container > :nth-child(21) > .tree-item-self,
.nav-files-container > :nth-child(21).tree-item-self {
  background-color: var(--nav-box-item-21-bg, var(--nav-box-bg-display, transparent)) !important;
  border-color: var(--nav-box-item-21-border, var(--nav-box-border-color-display, transparent)) !important;
  background-image: none !important;
}

.workspace-leaf-content[data-type="file-explorer"] .nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(22) > .nav-folder-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(22) > .nav-file-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(22) > .tree-item-self,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > div > :nth-child(22) > .nav-folder-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > div > :nth-child(22) > .nav-file-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > div > :nth-child(22) > .tree-item-self,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > div > :nth-child(22).tree-item-self,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > .nav-folder-children > :nth-child(22) > .nav-folder-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > .nav-folder-children > :nth-child(22) > .nav-file-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > .nav-folder-children > :nth-child(22) > .tree-item-self,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > :nth-child(22) > .nav-folder-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > :nth-child(22) > .nav-file-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > :nth-child(22) > .tree-item-self,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > :nth-child(22).tree-item-self,
.nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(22) > .nav-folder-title,
.nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(22) > .nav-file-title,
.nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(22) > .tree-item-self,
.nav-files-container > div > :nth-child(22) > .nav-folder-title,
.nav-files-container > div > :nth-child(22) > .nav-file-title,
.nav-files-container > div > :nth-child(22) > .tree-item-self,
.nav-files-container > div > :nth-child(22).tree-item-self,
.nav-files-container > .nav-folder-children > :nth-child(22) > .nav-folder-title,
.nav-files-container > .nav-folder-children > :nth-child(22) > .nav-file-title,
.nav-files-container > .nav-folder-children > :nth-child(22) > .tree-item-self,
.nav-files-container > :nth-child(22) > .nav-folder-title,
.nav-files-container > :nth-child(22) > .nav-file-title,
.nav-files-container > :nth-child(22) > .tree-item-self,
.nav-files-container > :nth-child(22).tree-item-self {
  background-color: var(--nav-box-item-22-bg, var(--nav-box-bg-display, transparent)) !important;
  border-color: var(--nav-box-item-22-border, var(--nav-box-border-color-display, transparent)) !important;
  background-image: none !important;
}

.workspace-leaf-content[data-type="file-explorer"] .nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(23) > .nav-folder-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(23) > .nav-file-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(23) > .tree-item-self,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > div > :nth-child(23) > .nav-folder-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > div > :nth-child(23) > .nav-file-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > div > :nth-child(23) > .tree-item-self,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > div > :nth-child(23).tree-item-self,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > .nav-folder-children > :nth-child(23) > .nav-folder-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > .nav-folder-children > :nth-child(23) > .nav-file-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > .nav-folder-children > :nth-child(23) > .tree-item-self,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > :nth-child(23) > .nav-folder-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > :nth-child(23) > .nav-file-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > :nth-child(23) > .tree-item-self,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > :nth-child(23).tree-item-self,
.nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(23) > .nav-folder-title,
.nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(23) > .nav-file-title,
.nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(23) > .tree-item-self,
.nav-files-container > div > :nth-child(23) > .nav-folder-title,
.nav-files-container > div > :nth-child(23) > .nav-file-title,
.nav-files-container > div > :nth-child(23) > .tree-item-self,
.nav-files-container > div > :nth-child(23).tree-item-self,
.nav-files-container > .nav-folder-children > :nth-child(23) > .nav-folder-title,
.nav-files-container > .nav-folder-children > :nth-child(23) > .nav-file-title,
.nav-files-container > .nav-folder-children > :nth-child(23) > .tree-item-self,
.nav-files-container > :nth-child(23) > .nav-folder-title,
.nav-files-container > :nth-child(23) > .nav-file-title,
.nav-files-container > :nth-child(23) > .tree-item-self,
.nav-files-container > :nth-child(23).tree-item-self {
  background-color: var(--nav-box-item-23-bg, var(--nav-box-bg-display, transparent)) !important;
  border-color: var(--nav-box-item-23-border, var(--nav-box-border-color-display, transparent)) !important;
  background-image: none !important;
}

.workspace-leaf-content[data-type="file-explorer"] .nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(24) > .nav-folder-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(24) > .nav-file-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(24) > .tree-item-self,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > div > :nth-child(24) > .nav-folder-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > div > :nth-child(24) > .nav-file-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > div > :nth-child(24) > .tree-item-self,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > div > :nth-child(24).tree-item-self,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > .nav-folder-children > :nth-child(24) > .nav-folder-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > .nav-folder-children > :nth-child(24) > .nav-file-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > .nav-folder-children > :nth-child(24) > .tree-item-self,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > :nth-child(24) > .nav-folder-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > :nth-child(24) > .nav-file-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > :nth-child(24) > .tree-item-self,
.workspace-leaf-content[data-type="file-explorer"] .nav-files-container > :nth-child(24).tree-item-self,
.nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(24) > .nav-folder-title,
.nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(24) > .nav-file-title,
.nav-files-container .nav-folder.mod-root > .nav-folder-children > :nth-child(24) > .tree-item-self,
.nav-files-container > div > :nth-child(24) > .nav-folder-title,
.nav-files-container > div > :nth-child(24) > .nav-file-title,
.nav-files-container > div > :nth-child(24) > .tree-item-self,
.nav-files-container > div > :nth-child(24).tree-item-self,
.nav-files-container > .nav-folder-children > :nth-child(24) > .nav-folder-title,
.nav-files-container > .nav-folder-children > :nth-child(24) > .nav-file-title,
.nav-files-container > .nav-folder-children > :nth-child(24) > .tree-item-self,
.nav-files-container > :nth-child(24) > .nav-folder-title,
.nav-files-container > :nth-child(24) > .nav-file-title,
.nav-files-container > :nth-child(24) > .tree-item-self,
.nav-files-container > :nth-child(24).tree-item-self {
  background-color: var(--nav-box-item-24-bg, var(--nav-box-bg-display, transparent)) !important;
  border-color: var(--nav-box-item-24-border, var(--nav-box-border-color-display, transparent)) !important;
  background-image: none !important;
}

.workspace-leaf-content[data-type="file-explorer"] .nav-folder-children .nav-folder-children .nav-file-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-folder-children .nav-folder-children .nav-folder-title,
.workspace-leaf-content[data-type="file-explorer"] .nav-folder-children .nav-folder-children .tree-item-self,
.workspace-leaf-content[data-type="file-explorer"] .tree-item-children .nav-file-title,
.workspace-leaf-content[data-type="file-explorer"] .tree-item-children .nav-folder-title,
.workspace-leaf-content[data-type="file-explorer"] .tree-item-children .tree-item-self,
.nav-files-container .nav-folder-children .nav-folder-children .nav-file-title,
.nav-files-container .nav-folder-children .nav-folder-children .nav-folder-title,
.nav-files-container .nav-folder-children .nav-folder-children .tree-item-self,
.nav-files-container .tree-item-children .nav-file-title,
.nav-files-container .tree-item-children .nav-folder-title,
.nav-files-container .tree-item-children .tree-item-self {
  background-color: var(--nav-box-subfolder-bg-display, transparent) !important;
  background-image: none !important;
  border: var(--nav-box-subfolder-border-display, 1px solid transparent) !important;
  border-color: var(--nav-box-subfolder-border-color-display, transparent) !important;
  margin-top: var(--nav-box-subfolder-margin-display, 0px) !important;
  margin-bottom: var(--nav-box-subfolder-margin-display, 0px) !important;
  box-shadow: var(--nav-box-subfolder-shadow-display, none);
}
`,
	},
	{
		id: 'nav-item-color',
		label: 'Nav Item Text Color',
		category: 'colors',
		subcategory: 'Navigation Tree',
		variable: '--nav-item-color',
		type: 'color',
		defaultDarkValue: '#b3b3b3',
		defaultLightValue: '#5c5c5c',
		companionCss: `
.theme-dark .nav-file-title, .theme-dark .nav-folder-title, .theme-dark .nav-file-title-content, .theme-dark .nav-folder-title-content,
.theme-light .nav-file-title, .theme-light .nav-folder-title, .theme-light .nav-file-title-content, .theme-light .nav-folder-title-content {
  color: var(--nav-item-color) !important;
}`,
	},
	{
		id: 'nav-item-hover-bg',
		label: 'Nav Item Hover Background',
		category: 'colors',
		subcategory: 'Navigation Tree',
		variable: '--nav-item-background-hover',
		type: 'color',
		defaultDarkValue: 'rgba(255, 255, 255, 0.067)',
		defaultLightValue: 'rgba(0, 0, 0, 0.067)',
		companionCss: `
.theme-dark .nav-file-title:hover, .theme-dark .nav-folder-title:hover,
.theme-light .nav-file-title:hover, .theme-light .nav-folder-title:hover {
  background-color: var(--nav-item-background-hover) !important;
}`,
	},
	{
		id: 'nav-item-active-bg',
		label: 'Nav Active Note Background',
		category: 'colors',
		subcategory: 'Navigation Tree',
		variable: '--nav-item-background-active',
		type: 'color',
		defaultDarkValue: 'rgba(255, 255, 255, 0.067)',
		defaultLightValue: 'rgba(0, 0, 0, 0.067)',
		companionCss: `
.theme-dark .nav-file-title.is-active,
.theme-light .nav-file-title.is-active {
  background-color: var(--nav-item-background-active) !important;
}`,
	},
	{
		id: 'nav-item-active-color',
		label: 'Nav Active Note Text Color',
		category: 'colors',
		subcategory: 'Navigation Tree',
		variable: '--nav-item-color-active',
		type: 'color',
		defaultDarkValue: '#dadada',
		defaultLightValue: '#222222',
		companionCss: `
.theme-dark .nav-file-title.is-active, .theme-dark .nav-file-title.is-active .nav-file-title-content,
.theme-light .nav-file-title.is-active, .theme-light .nav-file-title.is-active .nav-file-title-content {
  color: var(--nav-item-color-active) !important;
}`,
	},
	{
		id: 'nav-item-size',
		label: 'Nav Item Font Size',
		category: 'colors',
		subcategory: 'Navigation Tree',
		variable: '--nav-item-size',
		type: 'slider',
		defaultDarkValue: '13px',
		defaultLightValue: '13px',
		min: 10,
		max: 18,
		step: 0.5,
		unit: 'px',
		companionCss: `
.nav-file-title, .nav-folder-title {
  font-size: var(--nav-item-size) !important;
}`,
	},
	{
		id: 'nav-indentation-guide',
		label: 'Nav Indentation Guide Color',
		category: 'colors',
		subcategory: 'Navigation Tree',
		variable: '--nav-indentation-guide-color',
		type: 'color',
		defaultDarkValue: 'rgba(255, 255, 255, 0.12)',
		defaultLightValue: 'rgba(0, 0, 0, 0.12)',
		companionCss: `
.nav-folder-children {
  border-left-color: var(--nav-indentation-guide-color) !important;
}`,
	},

	// --- Editor ---
	{
		id: 'text-selection',
		label: 'Text Selection Background',
		category: 'colors',
		subcategory: 'Editor',
		variable: '--text-selection',
		type: 'color',
		defaultDarkValue: 'rgba(138, 92, 245, 0.33)',
		defaultLightValue: 'rgba(152, 115, 247, 0.2)',
		companionCss: `
::selection, .cm-selectionBackground, .cm-content ::selection {
  background-color: var(--text-selection) !important;
}`,
	},
	{
		id: 'text-highlight-bg',
		label: 'Highlighter Color',
		category: 'colors',
		subcategory: 'Editor',
		variable: '--text-highlight-bg',
		type: 'color',
		defaultDarkValue: 'rgba(255, 208, 0, 0.4)',
		defaultLightValue: 'rgba(255, 208, 0, 0.4)',
		companionCss: `
.markdown-rendered mark,
mark,
.cm-content .cm-highlight,
.cm-line.cm-highlight,
.cm-line .cm-highlight {
  background-color: var(--text-highlight-bg) !important;
}`,
	},
	{
		id: 'spellcheck-underline-color',
		label: 'Spellcheck Underline Color',
		category: 'colors',
		subcategory: 'Editor',
		variable: '--spellcheck-underline-color',
		type: 'color',
		defaultDarkValue: '#e05252',
		defaultLightValue: '#e05252',
		companionCss: `
/* Native spellcheck/grammar underlines: Reading View, source mode and inputs. */
::spelling-error,
*::spelling-error,
.theme-dark ::spelling-error,
.theme-dark::spelling-error,
.theme-light ::spelling-error,
.theme-light::spelling-error,
.cm-content ::spelling-error,
.cm-line ::spelling-error,
.cm-line::spelling-error,
.markdown-rendered ::spelling-error,
.markdown-source-view ::spelling-error,
::grammar-error,
*::grammar-error,
.cm-content ::grammar-error,
.cm-line ::grammar-error,
.cm-line::grammar-error,
.markdown-rendered ::grammar-error,
.markdown-source-view ::grammar-error {
  text-decoration: underline wavy var(--spellcheck-underline-color, #e05252) !important;
  text-decoration-color: var(--spellcheck-underline-color, #e05252) !important;
  -webkit-text-decoration-color: var(--spellcheck-underline-color, #e05252) !important;
}

/* Live Preview spellcheck tokens. */
.cm-spell-error,
.cm-spell-error *,
.cm-spellcheck,
.cm-spellcheck *,
.cm-spell-check,
.cm-spell-check * {
  text-decoration: underline wavy var(--spellcheck-underline-color, #e05252) !important;
  text-decoration-color: var(--spellcheck-underline-color, #e05252) !important;
  -webkit-text-decoration-color: var(--spellcheck-underline-color, #e05252) !important;
}

/* Headings, titles, links, tags and code set their own decoration, so only
   swap the underline colour and leave their styling otherwise intact. */
.cm-header-1::spelling-error, .cm-header-1 ::spelling-error,
.HyperMD-header-1::spelling-error, .HyperMD-header-1 ::spelling-error,
.markdown-rendered h1::spelling-error, .markdown-rendered h1 ::spelling-error,
.inline-title::spelling-error, .inline-title ::spelling-error,
.cm-header-2::spelling-error, .cm-header-2 ::spelling-error,
.HyperMD-header-2::spelling-error, .HyperMD-header-2 ::spelling-error,
.markdown-rendered h2::spelling-error, .markdown-rendered h2 ::spelling-error,
.cm-header-3::spelling-error, .cm-header-3 ::spelling-error,
.HyperMD-header-3::spelling-error, .HyperMD-header-3 ::spelling-error,
.markdown-rendered h3::spelling-error, .markdown-rendered h3 ::spelling-error,
.cm-header-4::spelling-error, .cm-header-4 ::spelling-error,
.HyperMD-header-4::spelling-error, .HyperMD-header-4 ::spelling-error,
.markdown-rendered h4::spelling-error, .markdown-rendered h4 ::spelling-error,
.cm-header-5::spelling-error, .cm-header-5 ::spelling-error,
.HyperMD-header-5::spelling-error, .HyperMD-header-5 ::spelling-error,
.markdown-rendered h5::spelling-error, .markdown-rendered h5 ::spelling-error,
.cm-header-6::spelling-error, .cm-header-6 ::spelling-error,
.HyperMD-header-6::spelling-error, .HyperMD-header-6 ::spelling-error,
.markdown-rendered h6::spelling-error, .markdown-rendered h6 ::spelling-error,
.cm-hmd-internal-link::spelling-error, .cm-hmd-internal-link ::spelling-error,
a.internal-link::spelling-error, a.internal-link ::spelling-error,
.cm-link::spelling-error, .cm-link ::spelling-error,
a.external-link::spelling-error, a.external-link ::spelling-error,
.cm-hashtag::spelling-error, .cm-hashtag ::spelling-error,
a.tag::spelling-error, a.tag ::spelling-error,
.cm-inline-code::spelling-error, .cm-inline-code ::spelling-error,
code::spelling-error, code ::spelling-error {
  text-decoration-color: var(--spellcheck-underline-color, #e05252) !important;
  -webkit-text-decoration-color: var(--spellcheck-underline-color, #e05252) !important;
}`,
	},
	{
		id: 'active-line-bg',
		label: 'Active Line Highlight',
		category: 'colors',
		subcategory: 'Editor',
		variable: '--active-line-bg',
		type: 'color',
		defaultDarkValue: 'transparent',
		defaultLightValue: 'transparent',
		companionCss: `
.cm-active, .cm-line.cm-active {
  background-color: var(--active-line-bg) !important;
}`,
	},
	{
		id: 'line-number-color',
		label: 'Line Number Gutter Color',
		category: 'colors',
		subcategory: 'Editor',
		variable: '--line-number-color',
		type: 'color',
		defaultDarkValue: '#666666',
		defaultLightValue: '#ababab',
		companionCss: `
.cm-gutterElement, .line-number {
  color: var(--line-number-color) !important;
}`,
	},
	{
		id: 'line-number-color-hover',
		label: 'Line Number Hover Color',
		category: 'colors',
		subcategory: 'Editor',
		variable: '--line-number-color-hover',
		type: 'color',
		defaultDarkValue: '#dadada',
		defaultLightValue: '#222222',
		companionCss: `
.cm-gutterElement:hover {
  color: var(--line-number-color-hover) !important;
}`,
	},
	{
		id: 'indentation-guide-color',
		label: 'Indentation Guide Color',
		category: 'colors',
		subcategory: 'Editor',
		variable: '--indentation-guide-color',
		type: 'color',
		defaultDarkValue: 'rgba(255, 255, 255, 0.12)',
		defaultLightValue: 'rgba(0, 0, 0, 0.12)',
		companionCss: `
.cm-indent, .cm-indent-guide {
  border-right-color: var(--indentation-guide-color) !important;
}`,
	},
	{
		id: 'indentation-guide-color-active',
		label: 'Active Scope Indent Guide',
		category: 'colors',
		subcategory: 'Editor',
		variable: '--indentation-guide-color-active',
		type: 'color',
		defaultDarkValue: 'rgba(255, 255, 255, 0.3)',
		defaultLightValue: 'rgba(0, 0, 0, 0.15)',
		companionCss: `
.cm-indent-guide.cm-active {
  border-right-color: var(--indentation-guide-color-active) !important;
}`,
	},
	{
		id: 'indentation-guide-width',
		label: 'Indentation Guide Width',
		category: 'colors',
		subcategory: 'Editor',
		variable: '--indentation-guide-width',
		type: 'slider',
		defaultDarkValue: '1px',
		defaultLightValue: '1px',
		min: 0.5,
		max: 4,
		step: 0.1,
		unit: 'px',
		companionCss: `
.cm-indent, .cm-indent-guide {
  border-right-width: var(--indentation-guide-width) !important;
}`,
	},

	// 3. Typography
	{
		id: 'font-header',
		label: 'Header Font',
		category: 'typography',
		subcategory: 'Font & Base Scale',
		variable: '--font-header',
		type: 'select',
		defaultDarkValue: 'inherit',
		defaultLightValue: 'inherit',
		options: [
			{ label: 'Match Body Font (Inherit)', value: 'inherit' },
			...FONT_OPTIONS,
		],
		companionCss: `
.inline-title,
.view-header-title,
.markdown-rendered h1,
.markdown-rendered h2,
.markdown-rendered h3,
.markdown-rendered h4,
.markdown-rendered h5,
.markdown-rendered h6,
.cm-header-1,
.cm-header-2,
.cm-header-3,
.cm-header-4,
.cm-header-5,
.cm-header-6 {
  font-family: var(--font-header) !important;
}`,
	},
	{
		id: 'font-text',
		label: 'Body Font',
		category: 'typography',
		subcategory: 'Font & Base Scale',
		variable: '--font-text',
		type: 'select',
		defaultDarkValue: 'system-ui, -apple-system, BlinkMacSystemFont, "Noto Sans", sans-serif',
		defaultLightValue: 'system-ui, -apple-system, BlinkMacSystemFont, "Noto Sans", sans-serif',
		options: FONT_OPTIONS,
		companionCss: `
.markdown-rendered p,
.markdown-rendered li,
.markdown-preview-view,
.cm-content,
.cm-line:not(.HyperMD-header) {
  font-family: var(--font-text) !important;
}`,
	},
	{
		id: 'font-interface',
		label: 'UI Font',
		category: 'typography',
		subcategory: 'Font & Base Scale',
		variable: '--font-interface',
		type: 'select',
		defaultDarkValue: 'system-ui, -apple-system, BlinkMacSystemFont, "Noto Sans", sans-serif',
		defaultLightValue: 'system-ui, -apple-system, BlinkMacSystemFont, "Noto Sans", sans-serif',
		options: FONT_OPTIONS,
		companionCss: `
body,
.app-container,
.workspace-leaf-header,
.workspace-tab-header,
.workspace-ribbon,
.side-dock-ribbon,
.nav-files-container,
.nav-folder-title,
.nav-file-title,
.status-bar,
.menu,
.modal,
.suggestion-container {
  font-family: var(--font-interface) !important;
}`,
	},
	{
		id: 'font-monospace',
		label: 'Monospace Font',
		category: 'typography',
		subcategory: 'Font & Base Scale',
		variable: '--font-monospace',
		type: 'select',
		defaultDarkValue: '"Source Code Pro", "Noto Sans Mono", monospace',
		defaultLightValue: '"Source Code Pro", "Noto Sans Mono", monospace',
		options: FONT_OPTIONS,
		companionCss: `
code,
kbd,
pre,
samp,
.cm-inline-code,
.cm-s-obsidian pre.HyperMD-codeblock,
.markdown-rendered code,
.markdown-rendered pre {
  font-family: var(--font-monospace) !important;
}`,
	},
	{
		id: 'font-text-size',
		label: 'Base Font Size',
		category: 'typography',
		subcategory: 'Font & Base Scale',
		variable: '--font-text-size',
		type: 'slider',
		defaultDarkValue: '16px',
		defaultLightValue: '16px',
		min: 10,
		max: 32,
		step: 0.1,
		unit: 'px',
		companionCss: `
.markdown-rendered,
.markdown-preview-view,
.cm-content,
.cm-line {
  font-size: var(--font-text-size) !important;
}`,
	},
	{
		id: 'font-interface-size',
		label: 'UI Font Size',
		category: 'typography',
		subcategory: 'Font & Base Scale',
		variable: '--font-ui-size',
		type: 'slider',
		// Obsidian paints its interface from a tier of design tokens rather than
		// one font-size, so the slider drives --font-ui-small and the companion
		// rule derives the other tiers from it. The default is Obsidian's own
		// stock small size, which expands back to the exact stock quartet
		// (12/13/15/20), so enabling the plugin is a no-op until the slider moves.
		defaultDarkValue: '13px',
		defaultLightValue: '13px',
		min: 10,
		max: 28,
		step: 0.5,
		unit: 'px',
		// Rewrite the interface size tokens instead of slamming `font-size` on
		// `body`. Obsidian's chrome already consumes these tokens, so the change
		// composes with themes and never cascades into note content, which keeps
		// its own --font-text-size.
		companionCss: `
body,
.app-container {
  --font-ui-smaller: calc(var(--font-ui-size, 13px) - 1px) !important;
  --font-ui-small: var(--font-ui-size, 13px) !important;
  --font-ui-medium: calc(var(--font-ui-size, 13px) + 2px) !important;
  --font-ui-large: calc(var(--font-ui-size, 13px) + 7px) !important;
}`,
	},
	{
		id: 'h1-size',
		label: 'Heading 1 Size (H1)',
		category: 'typography',
		subcategory: 'Heading Font Sizes',
		variable: '--h1-size',
		type: 'slider',
		defaultDarkValue: '1.618em',
		defaultLightValue: '1.618em',
		min: 1.0,
		max: 3.5,
		step: 0.05,
		unit: 'em',
		companionCss: `
.markdown-rendered h1,
.cm-header-1,
.HyperMD-header-1 {
  font-size: var(--h1-size) !important;
}`,
	},
	{
		id: 'h2-size',
		label: 'Heading 2 Size (H2)',
		category: 'typography',
		subcategory: 'Heading Font Sizes',
		variable: '--h2-size',
		type: 'slider',
		defaultDarkValue: '1.462em',
		defaultLightValue: '1.462em',
		min: 0.9,
		max: 3.0,
		step: 0.05,
		unit: 'em',
		companionCss: `
.markdown-rendered h2,
.cm-header-2,
.HyperMD-header-2 {
  font-size: var(--h2-size) !important;
}`,
	},
	{
		id: 'h3-size',
		label: 'Heading 3 Size (H3)',
		category: 'typography',
		subcategory: 'Heading Font Sizes',
		variable: '--h3-size',
		type: 'slider',
		defaultDarkValue: '1.318em',
		defaultLightValue: '1.318em',
		min: 0.8,
		max: 2.5,
		step: 0.05,
		unit: 'em',
		companionCss: `
.markdown-rendered h3,
.cm-header-3,
.HyperMD-header-3 {
  font-size: var(--h3-size) !important;
}`,
	},
	{
		id: 'h4-size',
		label: 'Heading 4 Size (H4)',
		category: 'typography',
		subcategory: 'Heading Font Sizes',
		variable: '--h4-size',
		type: 'slider',
		defaultDarkValue: '1.188em',
		defaultLightValue: '1.188em',
		min: 0.7,
		max: 2.2,
		step: 0.05,
		unit: 'em',
		companionCss: `
.markdown-rendered h4,
.cm-header-4,
.HyperMD-header-4 {
  font-size: var(--h4-size) !important;
}`,
	},
	{
		id: 'h5-size',
		label: 'Heading 5 Size (H5)',
		category: 'typography',
		subcategory: 'Heading Font Sizes',
		variable: '--h5-size',
		type: 'slider',
		defaultDarkValue: '1.076em',
		defaultLightValue: '1.076em',
		min: 0.6,
		max: 2.0,
		step: 0.05,
		unit: 'em',
		companionCss: `
.markdown-rendered h5,
.cm-header-5,
.HyperMD-header-5 {
  font-size: var(--h5-size) !important;
}`,
	},
	{
		id: 'h6-size',
		label: 'Heading 6 Size (H6)',
		category: 'typography',
		subcategory: 'Heading Font Sizes',
		variable: '--h6-size',
		type: 'slider',
		defaultDarkValue: '1.0em',
		defaultLightValue: '1.0em',
		min: 0.5,
		max: 1.8,
		step: 0.05,
		unit: 'em',
		companionCss: `
.markdown-rendered h6,
.cm-header-6,
.HyperMD-header-6 {
  font-size: var(--h6-size) !important;
}`,
	},

	// Typography: Text & Page Spacing (Rhythm, Margins & Letter Spacing)
	{
		id: 'line-height-normal',
		label: 'Line Height',
		category: 'typography',
		subcategory: 'Text & Page Spacing',
		variable: '--line-height-normal',
		type: 'slider',
		defaultDarkValue: '1.5',
		defaultLightValue: '1.5',
		min: 1.0,
		max: 2.2,
		step: 0.05,
		unit: '',
		companionCss: `
.markdown-rendered,
.markdown-preview-view,
.cm-content,
.cm-line {
  line-height: var(--line-height-normal) !important;
}`,
	},
	{
		id: 'p-spacing',
		label: 'Paragraph Spacing',
		category: 'typography',
		subcategory: 'Text & Page Spacing',
		variable: '--p-spacing',
		type: 'slider',
		defaultDarkValue: '1rem',
		defaultLightValue: '1rem',
		min: 0,
		max: 2.5,
		step: 0.1,
		unit: 'rem',
		companionCss: `
.markdown-rendered p,
.cm-line:not(.HyperMD-header) {
  margin-bottom: var(--p-spacing) !important;
}`,
	},
	{
		id: 'nav-name-spacing',
		label: 'Nav Item Vertical Spacing',
		category: 'typography',
		subcategory: 'Text & Page Spacing',
		variable: '--nav-item-spacing',
		type: 'slider',
		defaultDarkValue: '4px',
		defaultLightValue: '4px',
		min: 0,
		max: 16,
		step: 1,
		unit: 'px',
		companionCss: `
.nav-file-title,
.nav-folder-title {
  padding-top: var(--nav-item-spacing) !important;
  padding-bottom: var(--nav-item-spacing) !important;
}`,
	},
	{
		id: 'nav-name-letter-spacing',
		label: 'Nav Name Letter Spacing',
		category: 'typography',
		subcategory: 'Text & Page Spacing',
		variable: '--nav-item-letter-spacing',
		type: 'slider',
		defaultDarkValue: '0px',
		defaultLightValue: '0px',
		min: -1,
		max: 3,
		step: 0.1,
		unit: 'px',
		companionCss: `
.nav-file-title-content,
.nav-folder-title-content {
  letter-spacing: var(--nav-item-letter-spacing) !important;
}`,
	},
	{
		id: 'page-margin-spacing',
		label: 'Page Margin Spacing',
		category: 'typography',
		subcategory: 'Text & Page Spacing',
		variable: '--page-margin-x',
		type: 'slider',
		defaultDarkValue: '32px',
		defaultLightValue: '32px',
		min: 0,
		max: 120,
		step: 2,
		unit: 'px',
		companionCss: `
.markdown-source-view.mod-cm6 .cm-sizer,
.markdown-preview-view .markdown-preview-sizer {
  padding-inline: var(--page-margin-x) !important;
}`,
	},
	{
		id: 'letter-spacing-body',
		label: 'Body Letter Spacing',
		category: 'typography',
		subcategory: 'Text & Page Spacing',
		variable: '--letter-spacing-body',
		type: 'slider',
		defaultDarkValue: '0px',
		defaultLightValue: '0px',
		min: -1,
		max: 3,
		step: 0.1,
		unit: 'px',
		companionCss: `
.markdown-rendered p,
.cm-content .cm-line:not(.HyperMD-header) {
  letter-spacing: var(--letter-spacing-body) !important;
}`,
	},

	// ==========================================
	// CATEGORY: UI ELEMENTS
	// ==========================================
	{
		id: 'link-color',
		label: 'Internal Wiki Link Color',
		category: 'elements',
		variable: '--link-color',
		type: 'color',
		defaultDarkValue: '#a68af9',
		defaultLightValue: '#9873f7',
		companionCss: `
.cm-hmd-internal-link, a.internal-link {
  color: var(--link-color) !important;
}`,
	},
	{
		id: 'link-color-hover',
		label: 'Internal Link Hover Color',
		category: 'elements',
		variable: '--link-color-hover',
		type: 'color',
		defaultDarkValue: '#c5b6fc',
		defaultLightValue: '#ab8cf8',
		companionCss: `
.cm-hmd-internal-link:hover, a.internal-link:hover {
  color: var(--link-color-hover) !important;
}`,
	},
	{
		id: 'link-external-color',
		label: 'External Link Color',
		category: 'elements',
		variable: '--link-external-color',
		type: 'color',
		defaultDarkValue: '#a68af9',
		defaultLightValue: '#9873f7',
		companionCss: `
a.external-link, .cm-link {
  color: var(--link-external-color) !important;
}`,
	},
	{
		id: 'link-unresolved-color',
		label: 'Unresolved Link Color',
		category: 'elements',
		variable: '--link-unresolved-color',
		type: 'color',
		defaultDarkValue: '#666666',
		defaultLightValue: '#ababab',
		companionCss: `
.is-unresolved, .cm-hmd-internal-link.is-unresolved {
  color: var(--link-unresolved-color) !important;
  opacity: 0.7;
}`,
	},
	{
		id: 'tag-radius',
		label: 'Tag Roundness (Border Radius)',
		category: 'elements',
		subcategory: 'Tag Pills',
		variable: '--tag-radius',
		type: 'slider',
		defaultDarkValue: '4px',
		defaultLightValue: '4px',
		min: 0,
		max: 30,
		step: 1,
		unit: 'px',
		companionCss: `
.tag, a.tag {
  border-radius: var(--tag-radius) !important;
}
.cm-hashtag.cm-hashtag-begin {
  border-top-left-radius: var(--tag-radius) !important;
  border-bottom-left-radius: var(--tag-radius) !important;
  border-top-right-radius: 0 !important;
  border-bottom-right-radius: 0 !important;
  border-inline-end: none !important;
}
.cm-hashtag.cm-hashtag-end {
  border-top-right-radius: var(--tag-radius) !important;
  border-bottom-right-radius: var(--tag-radius) !important;
  border-top-left-radius: 0 !important;
  border-bottom-left-radius: 0 !important;
  border-inline-start: none !important;
}
.cm-hashtag:not(.cm-hashtag-begin):not(.cm-hashtag-end) {
  border-radius: 0 !important;
  border-inline-start: none !important;
  border-inline-end: none !important;
}
.cm-hashtag.cm-hashtag-begin.cm-hashtag-end {
  border-radius: var(--tag-radius) !important;
}`,
	},
	{
		id: 'tag-size',
		label: 'Tag Font Size',
		category: 'elements',
		subcategory: 'Tag Pills',
		variable: '--tag-size',
		type: 'slider',
		defaultDarkValue: '11px',
		defaultLightValue: '11px',
		min: 8,
		max: 18,
		step: 0.5,
		unit: 'px',
		companionCss: `
.tag, a.tag, .cm-hashtag {
  font-size: var(--tag-size) !important;
  line-height: 1.2 !important;
}`,
	},
	{
		id: 'tag-color',
		label: 'Tag Text Color',
		category: 'elements',
		subcategory: 'Tag Pills',
		variable: '--tag-color',
		type: 'color',
		defaultDarkValue: '#a68af9',
		defaultLightValue: '#9873f7',
		companionCss: `
.tag, a.tag, .cm-hashtag {
  color: var(--tag-color) !important;
}`,
	},
	{
		id: 'tag-background',
		label: 'Tag Background Color',
		category: 'elements',
		subcategory: 'Tag Pills',
		variable: '--tag-background',
		type: 'color',
		defaultDarkValue: 'rgba(138, 92, 245, 0.2)',
		defaultLightValue: 'rgba(152, 115, 247, 0.15)',
		companionCss: `
.tag, a.tag, .cm-hashtag {
  background-color: var(--tag-background) !important;
}`,
	},
	{
		id: 'tag-padding-x',
		label: 'Tag Horizontal Padding',
		category: 'elements',
		subcategory: 'Tag Pills',
		variable: '--tag-padding-x',
		type: 'slider',
		defaultDarkValue: '8px',
		defaultLightValue: '8px',
		min: 2,
		max: 20,
		step: 1,
		unit: 'px',
		companionCss: `
.tag, a.tag {
  padding-left: var(--tag-padding-x) !important;
  padding-right: var(--tag-padding-x) !important;
}
.cm-hashtag.cm-hashtag-begin {
  padding-inline-start: var(--tag-padding-x) !important;
  padding-inline-end: 0 !important;
}
.cm-hashtag.cm-hashtag-end {
  padding-inline-end: var(--tag-padding-x) !important;
  padding-inline-start: 0 !important;
}
.cm-hashtag:not(.cm-hashtag-begin):not(.cm-hashtag-end) {
  padding-inline-start: 0 !important;
  padding-inline-end: 0 !important;
}
.cm-hashtag.cm-hashtag-begin.cm-hashtag-end {
  padding-inline-start: var(--tag-padding-x) !important;
  padding-inline-end: var(--tag-padding-x) !important;
}`,
	},
	{
		id: 'tag-padding-y',
		label: 'Tag Vertical Padding',
		category: 'elements',
		subcategory: 'Tag Pills',
		variable: '--tag-padding-y',
		type: 'slider',
		defaultDarkValue: '2px',
		defaultLightValue: '2px',
		min: 0,
		max: 10,
		step: 1,
		unit: 'px',
		companionCss: `
.tag, a.tag {
  padding-top: var(--tag-padding-y) !important;
  padding-bottom: var(--tag-padding-y) !important;
}
.cm-hashtag {
  padding-top: var(--tag-padding-y) !important;
  padding-bottom: var(--tag-padding-y) !important;
}`,
	},
	{
		id: 'code-normal',
		label: 'Inline Code Text Color',
		category: 'elements',
		variable: '--code-normal',
		type: 'color',
		defaultDarkValue: '#dadada',
		defaultLightValue: '#222222',
		companionCss: `
code:not(pre code), .cm-inline-code {
  color: var(--code-normal) !important;
}`,
	},
	{
		id: 'code-background',
		label: 'Inline Code Background',
		category: 'elements',
		variable: '--code-background',
		type: 'color',
		defaultDarkValue: '#1a1a1a',
		defaultLightValue: '#f7f7f7',
		companionCss: `
code:not(pre code), .cm-inline-code {
  background-color: var(--code-background) !important;
}`,
	},
	{
		id: 'code-block-background',
		label: 'Code Block Background',
		category: 'elements',
		variable: '--code-block-background',
		type: 'color',
		defaultDarkValue: '#1a1a1a',
		defaultLightValue: '#f7f7f7',
		companionCss: `
pre:has(code), .HyperMD-codeblock, .cm-embed-block:has(pre) {
  background-color: var(--code-block-background) !important;
}`,
	},
	{
		id: 'code-block-text',
		label: 'Code Block Text Color',
		category: 'elements',
		variable: '--code-block-text',
		type: 'color',
		defaultDarkValue: '#dadada',
		defaultLightValue: '#222222',
		companionCss: `
.markdown-rendered pre:has(code),
.markdown-rendered pre:has(code) code,
.markdown-rendered pre code,
.cm-content .HyperMD-codeblock,
.cm-line.HyperMD-codeblock,
.cm-embed-block:has(pre) code {
  color: var(--code-block-text) !important;
  -webkit-text-fill-color: var(--code-block-text) !important;
}`,
	},
	{
		id: 'blockquote-border-color',
		label: 'Blockquote Border Color',
		category: 'elements',
		variable: '--blockquote-border-color',
		type: 'color',
		defaultDarkValue: '#8a5cf5',
		defaultLightValue: '#8a5cf5',
		companionCss: `
blockquote, .HyperMD-quote {
  border-left-color: var(--blockquote-border-color) !important;
}`,
	},
	{
		id: 'blockquote-border-thickness',
		label: 'Blockquote Bar Thickness',
		category: 'elements',
		variable: '--blockquote-border-thickness',
		type: 'slider',
		defaultDarkValue: '2px',
		defaultLightValue: '2px',
		min: 1,
		max: 10,
		step: 0.1,
		unit: 'px',
		companionCss: `
blockquote, .HyperMD-quote {
  border-left-width: var(--blockquote-border-thickness) !important;
}`,
	},
	{
		id: 'checkbox-size',
		label: 'Task Checkbox Size',
		category: 'elements',
		subcategory: 'Checkboxes & Tasks',
		variable: '--checkbox-size',
		type: 'slider',
		defaultDarkValue: '16px',
		defaultLightValue: '16px',
		min: 10,
		max: 26,
		step: 0.1,
		unit: 'px',
		companionCss: `
input[type="checkbox"].task-list-item-checkbox,
.task-list-item-checkbox,
.markdown-rendered input[type="checkbox"],
.cm-content input[type="checkbox"] {
  width: var(--checkbox-size) !important;
  height: var(--checkbox-size) !important;
}`,
	},
	{
		id: 'checkbox-radius',
		label: 'Task Checkbox Radius',
		category: 'elements',
		subcategory: 'Checkboxes & Tasks',
		variable: '--checkbox-radius',
		type: 'slider',
		defaultDarkValue: '4px',
		defaultLightValue: '4px',
		min: 0,
		max: 14,
		step: 0.1,
		unit: 'px',
		companionCss: `
input[type="checkbox"].task-list-item-checkbox,
.task-list-item-checkbox,
.markdown-rendered input[type="checkbox"],
.cm-content input[type="checkbox"] {
  border-radius: var(--checkbox-radius) !important;
}`,
	},
	{
		id: 'status-bar-background',
		label: 'Status Bar Background',
		category: 'elements',
		subcategory: 'Status Bar',
		variable: '--status-bar-background',
		type: 'color',
		defaultDarkValue: '#262626',
		defaultLightValue: '#f6f6f6',
		companionCss: `
body .status-bar,
.theme-dark .status-bar,
.theme-light .status-bar {
  background-color: var(--status-bar-background) !important;
}`,
	},
	{
		id: 'status-bar-text-color',
		label: 'Status Bar Text Color',
		category: 'elements',
		subcategory: 'Status Bar',
		variable: '--status-bar-text-color',
		type: 'color',
		defaultDarkValue: '#b3b3b3',
		defaultLightValue: '#5c5c5c',
		companionCss: `
body .status-bar,
body .status-bar *,
body .status-bar-item,
body .status-bar-item *,
.theme-dark .status-bar,
.theme-dark .status-bar *,
.theme-light .status-bar,
.theme-light .status-bar * {
  color: var(--status-bar-text-color) !important;
}`,
	},

	// --- Context Menus ---
	{
		id: 'menu-background',
		label: 'Menu Background Color',
		category: 'elements',
		subcategory: 'Context Menus',
		variable: '--menu-background',
		type: 'color',
		defaultDarkValue: '#262626',
		defaultLightValue: '#ffffff',
		companionCss: `
body:not(.is-translucent).theme-dark .menu, body:not(.is-translucent).theme-dark .suggestion-container,
body:not(.is-translucent).theme-light .menu, body:not(.is-translucent).theme-light .suggestion-container,
.theme-dark .menu, .theme-dark .suggestion-container,
.theme-light .menu, .theme-light .suggestion-container {
  background-color: var(--menu-background) !important;
}`,
	},
	{
		id: 'menu-border',
		label: 'Menu Border Color',
		category: 'elements',
		subcategory: 'Context Menus',
		variable: '--menu-border-color',
		type: 'color',
		defaultDarkValue: '#3f3f3f',
		defaultLightValue: '#d4d4d4',
		companionCss: `
.theme-dark .menu, .theme-dark .suggestion-container,
.theme-light .menu, .theme-light .suggestion-container {
  border-color: var(--menu-border-color) !important;
}`,
	},
	{
		id: 'menu-item-color',
		label: 'Menu Item Text Color',
		category: 'elements',
		subcategory: 'Context Menus',
		variable: '--menu-item-color',
		type: 'color',
		defaultDarkValue: '#dadada',
		defaultLightValue: '#222222',
		companionCss: `
.theme-dark .menu-item, .theme-dark .suggestion-item,
.theme-light .menu-item, .theme-light .suggestion-item {
  color: var(--menu-item-color) !important;
}`,
	},
	{
		id: 'menu-item-hover-bg',
		label: 'Menu Item Hover Background',
		category: 'elements',
		subcategory: 'Context Menus',
		variable: '--menu-item-background-hover',
		type: 'color',
		defaultDarkValue: 'rgba(255, 255, 255, 0.067)',
		defaultLightValue: 'rgba(0, 0, 0, 0.067)',
		companionCss: `
.theme-dark .menu-item:hover, .theme-dark .menu-item.is-selected, .theme-dark .menu-item.selected, .theme-dark .suggestion-item:hover, .theme-dark .suggestion-item.is-selected,
.theme-light .menu-item:hover, .theme-light .menu-item.is-selected, .theme-light .menu-item.selected, .theme-light .suggestion-item:hover, .theme-light .suggestion-item.is-selected {
  background-color: var(--menu-item-background-hover) !important;
}`,
	},
	{
		id: 'menu-item-hover-color',
		label: 'Menu Item Hover Text Color',
		category: 'elements',
		subcategory: 'Context Menus',
		variable: '--menu-item-color-hover',
		type: 'color',
		defaultDarkValue: '#dadada',
		defaultLightValue: '#222222',
		companionCss: `
.theme-dark .menu-item:hover, .theme-dark .menu-item.is-selected, .theme-dark .menu-item.selected, .theme-dark .suggestion-item:hover, .theme-dark .suggestion-item.is-selected,
.theme-light .menu-item:hover, .theme-light .menu-item.is-selected, .theme-light .menu-item.selected, .theme-light .suggestion-item:hover, .theme-light .suggestion-item.is-selected {
  color: var(--menu-item-color-hover) !important;
}`,
	},
	{
		id: 'menu-radius',
		label: 'Menu Corner Radius',
		category: 'elements',
		subcategory: 'Context Menus',
		variable: '--menu-radius',
		type: 'slider',
		defaultDarkValue: '6px',
		defaultLightValue: '6px',
		min: 0,
		max: 16,
		step: 1,
		unit: 'px',
		companionCss: `
.theme-dark .menu, .theme-dark .suggestion-container,
.theme-light .menu, .theme-light .suggestion-container {
  border-radius: var(--menu-radius) !important;
}`,
	},
	// --- Tabs & Navigation Chrome ---
	{
		id: 'tab-curve',
		label: 'Tab Bottom Slope Curve Radius',
		category: 'elements',
		subcategory: 'Tabs & Navigation',
		variable: '--tab-curve',
		type: 'slider',
		defaultDarkValue: '6px',
		defaultLightValue: '6px',
		min: 0,
		max: 16,
		step: 1,
		unit: 'px',
		companionCss: `
.workspace-split.mod-root .workspace-tab-header-container .workspace-tab-header.is-active::before,
.workspace-split.mod-root .workspace-tab-header-container .workspace-tab-header.is-active::after {
  width: calc(var(--tab-curve) * 2) !important;
  height: calc(var(--tab-curve) * 2) !important;
  box-shadow: inset 0 0 0 var(--tab-outline-width, 1px) var(--tab-outline-color, transparent), 0 0 0 calc(var(--tab-curve) * 4) var(--tab-background-active) !important;
}
.workspace-split.mod-root .workspace-tab-header-container .workspace-tab-header.is-active::before {
  left: calc(var(--tab-curve) * -2) !important;
  clip-path: inset(50% calc(var(--tab-curve) * -1) 0 50%) !important;
}
.workspace-split.mod-root .workspace-tab-header-container .workspace-tab-header.is-active::after {
  right: calc(var(--tab-curve) * -2) !important;
  clip-path: inset(50% 50% 0 calc(var(--tab-curve) * -1)) !important;
}`,
	},
	{
		id: 'tab-radius',
		label: 'Navigation Icon Corner Radius',
		category: 'elements',
		subcategory: 'Tabs & Navigation',
		variable: '--tab-radius',
		type: 'slider',
		defaultDarkValue: '8px',
		defaultLightValue: '8px',
		min: 0,
		max: 16,
		step: 1,
		unit: 'px',
		companionCss: `
.workspace-tab-header-inner {
  border-radius: var(--tab-radius) !important;
}`,
	},
	{
		id: 'callout-radius',
		label: 'Callout Corner Radius',
		category: 'colors',
		subcategory: 'Callouts',
		variable: '--callout-radius',
		type: 'slider',
		defaultDarkValue: '8px',
		defaultLightValue: '8px',
		min: 0,
		max: 24,
		step: 1,
		unit: 'px',
		companionCss: `
.callout {
  border-radius: var(--callout-radius) !important;
}`,
	},
	{
		id: 'callout-border-width',
		label: 'Callout Left Border Width',
		category: 'colors',
		subcategory: 'Callouts',
		variable: '--callout-border-width',
		type: 'slider',
		defaultDarkValue: '4px',
		defaultLightValue: '4px',
		min: 0,
		max: 12,
		step: 1,
		unit: 'px',
		companionCss: `
.callout {
  border-left-width: var(--callout-border-width) !important;
}`,
	},
	{
		id: 'callout-bg-opacity',
		label: 'Callout Background Opacity',
		category: 'colors',
		subcategory: 'Callouts',
		variable: '--callout-bg-opacity',
		type: 'slider',
		defaultDarkValue: '0.1',
		defaultLightValue: '0.1',
		min: 0,
		max: 1,
		step: 0.05,
		unit: '',
		companionCss: `
.callout {
  background-color: rgba(var(--callout-color), var(--callout-bg-opacity)) !important;
}`,
	},
	{
		id: 'callout-icon-size',
		label: 'Callout Icon Size',
		category: 'colors',
		subcategory: 'Callouts',
		variable: '--callout-icon-size',
		type: 'slider',
		defaultDarkValue: '18px',
		defaultLightValue: '18px',
		min: 12,
		max: 32,
		step: 1,
		unit: 'px',
		companionCss: `
.callout .callout-icon svg {
  width: var(--callout-icon-size) !important;
  height: var(--callout-icon-size) !important;
}`,
	},
	{
		id: 'callout-color-note',
		label: 'Note / Info / Todo Callouts',
		category: 'colors',
		subcategory: 'Callouts',
		variable: '--callout-color-note',
		type: 'color',
		defaultDarkValue: '#448AFF',
		defaultLightValue: '#448AFF',
	},
	{
		id: 'callout-color-tip',
		label: 'Tip / Hint / Abstract Callouts',
		category: 'colors',
		subcategory: 'Callouts',
		variable: '--callout-color-tip',
		type: 'color',
		defaultDarkValue: '#00BFA5',
		defaultLightValue: '#00BFA5',
	},
	{
		id: 'callout-color-success',
		label: 'Success / Done Callouts',
		category: 'colors',
		subcategory: 'Callouts',
		variable: '--callout-color-success',
		type: 'color',
		defaultDarkValue: '#44CF6C',
		defaultLightValue: '#44CF6C',
	},
	{
		id: 'callout-color-question',
		label: 'Question / Help / FAQ Callouts',
		category: 'colors',
		subcategory: 'Callouts',
		variable: '--callout-color-question',
		type: 'color',
		defaultDarkValue: '#E0B300',
		defaultLightValue: '#E0B300',
	},
	{
		id: 'callout-color-warning',
		label: 'Warning / Caution Callouts',
		category: 'colors',
		subcategory: 'Callouts',
		variable: '--callout-color-warning',
		type: 'color',
		defaultDarkValue: '#FF9100',
		defaultLightValue: '#FF9100',
	},
	{
		id: 'callout-color-danger',
		label: 'Danger / Failure / Bug Callouts',
		category: 'colors',
		subcategory: 'Callouts',
		variable: '--callout-color-danger',
		type: 'color',
		defaultDarkValue: '#FF5252',
		defaultLightValue: '#FF5252',
	},
	{
		id: 'callout-color-example',
		label: 'Example Callouts',
		category: 'colors',
		subcategory: 'Callouts',
		variable: '--callout-color-example',
		type: 'color',
		defaultDarkValue: '#A855F7',
		defaultLightValue: '#A855F7',
	},
	{
		id: 'callout-color-quote',
		label: 'Quote / Cite Callouts',
		category: 'colors',
		subcategory: 'Callouts',
		variable: '--callout-color-quote',
		type: 'color',
		defaultDarkValue: '#9E9E9E',
		defaultLightValue: '#9E9E9E',
	},
	{
		id: 'graph-node',
		label: 'Resolved Node Color',
		category: 'colors',
		subcategory: 'Graph View',
		variable: '--graph-node',
		type: 'color',
		defaultDarkValue: '#b3b3b3',
		defaultLightValue: '#8a8a8a',
	},
	{
		id: 'graph-node-unresolved',
		label: 'Unresolved Node Color',
		category: 'colors',
		subcategory: 'Graph View',
		variable: '--graph-node-unresolved',
		type: 'color',
		defaultDarkValue: '#5a5a5a',
		defaultLightValue: '#c7c7c7',
	},
	{
		id: 'graph-node-focused',
		label: 'Focused / Selected Node Color',
		category: 'colors',
		subcategory: 'Graph View',
		variable: '--graph-node-focused',
		type: 'color',
		defaultDarkValue: '#a68af9',
		defaultLightValue: '#9873f7',
	},
	{
		id: 'graph-node-tag',
		label: 'Tag Node Color',
		category: 'colors',
		subcategory: 'Graph View',
		variable: '--graph-node-tag',
		type: 'color',
		defaultDarkValue: '#e0af68',
		defaultLightValue: '#b5883a',
	},
	{
		id: 'graph-node-attachment',
		label: 'Attachment Node Color',
		category: 'colors',
		subcategory: 'Graph View',
		variable: '--graph-node-attachment',
		type: 'color',
		defaultDarkValue: '#4fb3bf',
		defaultLightValue: '#2f8f9b',
	},
	{
		id: 'graph-line',
		label: 'Edge / Line Color',
		category: 'colors',
		subcategory: 'Graph View',
		variable: '--graph-line',
		type: 'color',
		defaultDarkValue: '#4b5563',
		defaultLightValue: '#d1d5db',
	},
	{
		id: 'graph-text',
		label: 'Node Label Text Color',
		category: 'colors',
		subcategory: 'Graph View',
		variable: '--graph-text',
		type: 'color',
		defaultDarkValue: '#b3b3b3',
		defaultLightValue: '#4b5563',
	},
	{
		id: 'graph-controls-width',
		label: 'Graph Controls Panel Width',
		category: 'colors',
		subcategory: 'Graph View',
		variable: '--graph-controls-width',
		type: 'slider',
		defaultDarkValue: '260px',
		defaultLightValue: '260px',
		min: 180,
		max: 420,
		step: 10,
		unit: 'px',
	},
];

// Dedicated configuration for the "Shadows & Outlines" Tab
export const SHADOW_ELEMENTS: ShadowElementConfig[] = [
	{
		id: 'headings',
		label: 'Headings & Document Titles',
		description: 'Note headings, titles, and view headers',
		selector: '.inline-title, .view-header-title, .workspace-tab-header.is-active .workspace-tab-header-inner-title, .markdown-rendered h1, .markdown-rendered h2, .markdown-rendered h3, .markdown-rendered h4, .markdown-rendered h5, .markdown-rendered h6, .HyperMD-header, .HyperMD-header-1, .HyperMD-header-2, .HyperMD-header-3, .HyperMD-header-4, .HyperMD-header-5, .HyperMD-header-6, .cm-line.HyperMD-header, .cm-header, .cm-header-1, .cm-header-2, .cm-header-3, .cm-header-4, .cm-header-5, .cm-header-6',
		kind: 'text',
		supportsOutline: true,
		defaultMode: 'glow',
		defaultX: '0px',
		defaultY: '0px',
		defaultBlur: '12px',
		defaultSpread: '0px',
		defaultColorDark: '#7c3aed',
		defaultColorLight: '#6d28d9',
		defaultOpacityDark: '0.6',
		defaultOpacityLight: '0.4',
		defaultOutlineWidth: '0px',
		defaultOutlineColorDark: '#7c3aed',
		defaultOutlineColorLight: '#6d28d9',
		defaultAnimStyle: 'none',
		defaultAnimSpeed: '2.5s',
		defaultGradientEnabled: false,
		defaultGradientColorDark: '#ec4899',
		defaultGradientColorLight: '#db2777',
		defaultGradientAnim: false,
		defaultOutlineGradientEnabled: false,
		defaultOutlineGradientColorDark: '#ec4899',
		defaultOutlineGradientColorLight: '#db2777',
	},
	{
		id: 'body-text',
		label: 'Body Text & Paragraphs',
		description: 'Body text, paragraphs, and lists',
		selector: '.markdown-rendered p, .markdown-rendered li:not(:has(h1, h2, h3, h4, h5, h6)), .markdown-rendered blockquote:not(.callout) p, .markdown-rendered table td, .cm-line:not(.HyperMD-header):not(.cm-header):not([class*="HyperMD-header"]):not([class*="cm-header"])',
		kind: 'text',
		supportsOutline: false,
		defaultMode: 'shadow',
		defaultX: '0px',
		defaultY: '1px',
		defaultBlur: '4px',
		defaultSpread: '0px',
		defaultColorDark: '#000000',
		defaultColorLight: '#000000',
		defaultOpacityDark: '0.3',
		defaultOpacityLight: '0.15',
		defaultAnimStyle: 'none',
		defaultAnimSpeed: '3.0s',
		defaultGradientEnabled: false,
		defaultGradientColorDark: '#4f46e5',
		defaultGradientColorLight: '#4338ca',
		defaultGradientAnim: false,
	},
	{
		id: 'callouts',
		label: 'Callout Boxes',
		description: 'Callout boxes and block quotes',
		selector: '.callout, .markdown-rendered .callout, .markdown-source-view.mod-cm6 .callout, .cm-embed-block .callout, .cm-embed-block.cm-callout > .callout, .cm-callout > .callout',
		kind: 'box',
		supportsOutline: true,
		defaultMode: 'shadow',
		defaultX: '0px',
		defaultY: '4px',
		defaultBlur: '14px',
		defaultSpread: '0px',
		defaultColorDark: '#000000',
		defaultColorLight: '#000000',
		defaultOpacityDark: '0.35',
		defaultOpacityLight: '0.12',
		defaultOutlineWidth: '2px',
		defaultOutlineColorDark: '#7c3aed',
		defaultOutlineColorLight: '#6d28d9',
		defaultAnimStyle: 'none',
		defaultAnimSpeed: '2.5s',
		defaultGradientEnabled: false,
		defaultGradientColorDark: '#06b6d4',
		defaultGradientColorLight: '#0891b2',
		defaultGradientAnim: false,
		defaultOutlineGradientEnabled: false,
		defaultOutlineGradientColorDark: '#06b6d4',
		defaultOutlineGradientColorLight: '#0891b2',
	},
	{
		id: 'codeblocks',
		label: 'Code Blocks',
		description: 'Fenced code blocks',
		warning: '⚠️ Note: This effect renders per line, potentially causing some visual bugs.',
		selector: '.markdown-rendered div[class*="block-language-"], .markdown-rendered .code-block-wrap, .markdown-rendered pre:not([class*="block-language-"] pre):not(.code-block-wrap pre), .cm-embed-block:has(pre), .cm-embed-block:has(div[class*="block-language-"]), .cm-embed-block:has(.code-block-wrap), .HyperMD-codeblock',
		kind: 'box',
		supportsOutline: true,
		defaultMode: 'shadow',
		defaultX: '0px',
		defaultY: '3px',
		defaultBlur: '12px',
		defaultSpread: '0px',
		defaultColorDark: '#000000',
		defaultColorLight: '#000000',
		defaultOpacityDark: '0.35',
		defaultOpacityLight: '0.1',
		defaultOutlineWidth: '2px',
		defaultOutlineColorDark: '#7c3aed',
		defaultOutlineColorLight: '#6d28d9',
		defaultAnimStyle: 'none',
		defaultAnimSpeed: '3.0s',
		defaultGradientEnabled: false,
		defaultGradientColorDark: '#10b981',
		defaultGradientColorLight: '#059669',
		defaultGradientAnim: false,
		defaultOutlineGradientEnabled: false,
		defaultOutlineGradientColorDark: '#10b981',
		defaultOutlineGradientColorLight: '#059669',
	},
	{
		id: 'active-leaf',
		label: 'Active Workspace Leaf / Pane',
		description: 'Focused editor pane',
		selector: '.workspace-split.mod-root .workspace-tabs.mod-active, .workspace-split.mod-root .workspace-leaf.mod-active',
		kind: 'box',
		supportsOutline: true,
		defaultMode: 'glow',
		defaultX: '0px',
		defaultY: '0px',
		defaultBlur: '16px',
		defaultSpread: '2px',
		defaultColorDark: '#7c3aed',
		defaultColorLight: '#6d28d9',
		defaultOpacityDark: '0.4',
		defaultOpacityLight: '0.25',
		defaultOutlineWidth: '2px',
		defaultOutlineColorDark: '#7c3aed',
		defaultOutlineColorLight: '#6d28d9',
		defaultAnimStyle: 'none',
		defaultAnimSpeed: '3.0s',
		defaultGradientEnabled: false,
		defaultGradientColorDark: '#8b5cf6',
		defaultGradientColorLight: '#7c3aed',
		defaultGradientAnim: false,
		defaultOutlineGradientEnabled: false,
		defaultOutlineGradientColorDark: '#8b5cf6',
		defaultOutlineGradientColorLight: '#7c3aed',
	},
	{
		id: 'nav-icons',
		label: 'Navigation & Ribbon Icons',
		description: 'Ribbon and sidebar icons',
		selector: '.workspace-ribbon .clickable-icon, .nav-buttons-container .clickable-icon, .nav-action-button, .nav-header .clickable-icon, .view-action',
		kind: 'box',
		supportsOutline: true,
		defaultMode: 'glow',
		defaultX: '0px',
		defaultY: '0px',
		defaultBlur: '8px',
		defaultSpread: '0px',
		defaultColorDark: '#7c3aed',
		defaultColorLight: '#6d28d9',
		defaultOpacityDark: '0.5',
		defaultOpacityLight: '0.35',
		defaultOutlineWidth: '1px',
		defaultOutlineColorDark: '#7c3aed',
		defaultOutlineColorLight: '#6d28d9',
		defaultAnimStyle: 'none',
		defaultAnimSpeed: '2.5s',
		defaultGradientEnabled: false,
		defaultGradientColorDark: '#ec4899',
		defaultGradientColorLight: '#db2777',
		defaultGradientAnim: false,
		defaultOutlineGradientEnabled: false,
		defaultOutlineGradientColorDark: '#ec4899',
		defaultOutlineGradientColorLight: '#db2777',
	},
	{
		id: 'nav-text',
		label: 'Navigation Item Text',
		description: 'Note and folder names in the sidebar',
		selector: '.nav-file-title-content, .nav-folder-title-content',
		kind: 'text',
		supportsOutline: true,
		defaultMode: 'glow',
		defaultX: '0px',
		defaultY: '0px',
		defaultBlur: '8px',
		defaultSpread: '0px',
		defaultColorDark: '#7c3aed',
		defaultColorLight: '#6d28d9',
		defaultOpacityDark: '0.5',
		defaultOpacityLight: '0.3',
		defaultOutlineWidth: '0px',
		defaultOutlineColorDark: '#7c3aed',
		defaultOutlineColorLight: '#6d28d9',
		defaultAnimStyle: 'none',
		defaultAnimSpeed: '2.5s',
		defaultGradientEnabled: false,
		defaultGradientColorDark: '#ec4899',
		defaultGradientColorLight: '#db2777',
		defaultGradientAnim: false,
		defaultOutlineGradientEnabled: false,
		defaultOutlineGradientColorDark: '#ec4899',
		defaultOutlineGradientColorLight: '#db2777',
	},
	{
		id: 'nav-item-box',
		label: 'Navigation Item Boxes',
		description: 'Clickable row around each top-level note/folder',
		selector: '.workspace-leaf-content[data-type="file-explorer"] .nav-file-title:not(.tree-item-children *, .nav-folder-children *), .workspace-leaf-content[data-type="file-explorer"] .nav-folder-title:not(.tree-item-children *, .nav-folder-children *), .nav-files-container .nav-file-title:not(.tree-item-children *, .nav-folder-children *), .nav-files-container .nav-folder-title:not(.tree-item-children *, .nav-folder-children *), .nav-file-title:not(.tree-item-children *, .nav-folder-children *), .nav-folder-title:not(.tree-item-children *, .nav-folder-children *)',
		kind: 'box',
		supportsOutline: true,
		defaultMode: 'shadow',
		defaultX: '0px',
		defaultY: '2px',
		defaultBlur: '6px',
		defaultSpread: '0px',
		defaultColorDark: '#000000',
		defaultColorLight: '#000000',
		defaultOpacityDark: '0.25',
		defaultOpacityLight: '0.1',
		defaultOutlineWidth: '1px',
		defaultOutlineColorDark: '#7c3aed',
		defaultOutlineColorLight: '#6d28d9',
		defaultAnimStyle: 'none',
		defaultAnimSpeed: '2.5s',
		defaultGradientEnabled: false,
		defaultGradientColorDark: '#06b6d4',
		defaultGradientColorLight: '#0891b2',
		defaultGradientAnim: false,
		defaultOutlineGradientEnabled: false,
		defaultOutlineGradientColorDark: '#06b6d4',
		defaultOutlineGradientColorLight: '#0891b2',
	},
	{
		id: 'canvas-cards',
		label: 'Canvas Cards',
		description: 'Canvas note and file cards; connection edges are SVG and not covered',
		selector: '.canvas-node-container',
		kind: 'box',
		supportsOutline: true,
		defaultMode: 'shadow',
		defaultX: '0px',
		defaultY: '4px',
		defaultBlur: '14px',
		defaultSpread: '0px',
		defaultColorDark: '#000000',
		defaultColorLight: '#000000',
		defaultOpacityDark: '0.35',
		defaultOpacityLight: '0.12',
		defaultOutlineWidth: '2px',
		defaultOutlineColorDark: '#7c3aed',
		defaultOutlineColorLight: '#6d28d9',
		defaultAnimStyle: 'none',
		defaultAnimSpeed: '2.5s',
		defaultGradientEnabled: false,
		defaultGradientColorDark: '#06b6d4',
		defaultGradientColorLight: '#0891b2',
		defaultGradientAnim: false,
		defaultOutlineGradientEnabled: false,
		defaultOutlineGradientColorDark: '#06b6d4',
		defaultOutlineGradientColorLight: '#0891b2',
	},
	{
		// .workspace-leaf / .workspace-tabs / .workspace-split.mod-root are the
		// same pane elements "Workspace & Pane Outlines" (UI_ELEMENTS, opacity-only)
		// already treats as border-only, and .workspace-ribbon / the sidebar splits
		// / .workspace-drawer are what "Sidebar Boundary Dividers" treats the same
		// way -- both are already-thin dividers, so a glow/outline here highlights
		// an actual line rather than wrapping a filled content box.
		//
		// Panes sit edge-to-edge with no gap, so an outward glow/shadow on
		// .workspace-leaf can be clipped by the neighbouring pane or by workspace
		// overflow; the outline (drawn inset, offset -1px) is not affected and
		// stays visible either way.
		id: 'pane-dividers',
		label: 'Pane & Navigation Dividers',
		description: 'Divider lines between panes, tabs, and the sidebar',
		selector: '.workspace-leaf, .workspace-tabs, .workspace-split.mod-root, .workspace-leaf-content, .workspace-ribbon, .workspace-split.mod-left-split, .workspace-split.mod-right-split, .workspace-drawer',
		kind: 'box',
		supportsOutline: true,
		defaultMode: 'glow',
		defaultX: '0px',
		defaultY: '0px',
		defaultBlur: '6px',
		defaultSpread: '0px',
		defaultColorDark: '#7c3aed',
		defaultColorLight: '#6d28d9',
		defaultOpacityDark: '0.35',
		defaultOpacityLight: '0.25',
		defaultOutlineWidth: '1px',
		defaultOutlineColorDark: '#7c3aed',
		defaultOutlineColorLight: '#6d28d9',
		defaultAnimStyle: 'none',
		defaultAnimSpeed: '2.5s',
		defaultGradientEnabled: false,
		defaultGradientColorDark: '#ec4899',
		defaultGradientColorLight: '#db2777',
		defaultGradientAnim: false,
		defaultOutlineGradientEnabled: false,
		defaultOutlineGradientColorDark: '#ec4899',
		defaultOutlineGradientColorLight: '#db2777',
	},
	{
		id: 'workspace-leaf-resizer-hover',
		label: 'Workspace Leaf Resize Handle Hover',
		description: 'Resize handles between panes when hovered or dragged',
		selector: '.workspace-leaf-resize-handle:hover, .workspace-leaf-resize-handle:active, .workspace-split > hr:hover, .workspace-split > hr:active, hr.workspace-split-hr:hover, hr.workspace-split-hr:active',
		kind: 'box',
		supportsOutline: true,
		defaultMode: 'glow',
		defaultX: '0px',
		defaultY: '0px',
		defaultBlur: '8px',
		defaultSpread: '0px',
		defaultColorDark: '#8a5cf5',
		defaultColorLight: '#8a5cf5',
		defaultOpacityDark: '0.6',
		defaultOpacityLight: '0.45',
		defaultOutlineWidth: '1px',
		defaultOutlineColorDark: '#8a5cf5',
		defaultOutlineColorLight: '#7c3aed',
		defaultAnimStyle: 'none',
		defaultAnimSpeed: '2.5s',
		defaultGradientEnabled: false,
		defaultGradientColorDark: '#ec4899',
		defaultGradientColorLight: '#db2777',
		defaultGradientAnim: false,
		defaultOutlineGradientEnabled: false,
		defaultOutlineGradientColorDark: '#ec4899',
		defaultOutlineGradientColorLight: '#db2777',
	},
];

// Dedicated configuration for the "UI Elements" (Minimalist Opacity & Layout) Tab
export interface UIElementConfig {
	id: string;
	label: string;
	description?: string;
	selector: string;
	category: 'borders' | 'navigation' | 'chrome' | 'editor';
	icon: string;
	defaultOpacityDark: string;
	defaultOpacityLight: string;
	/**
	 * Whether reveal-on-hover is offered at all. The generator honours this, so an
	 * element set to `false` emits no hover rule and its card hides the toggle
	 * rather than showing a control that does nothing.
	 */
	supportsHoverReveal: boolean;
	kind?: 'element' | 'border';
	/**
	 * Selector list whose `:hover` restores full opacity, for elements whose own
	 * selector is a container the pointer is nearly always inside. Defaults to
	 * `selector`. Keep it tight: a trigger like `.workspace-split` is true
	 * whenever the cursor is over any pane or sidebar, which cancels the slider.
	 */
	hoverTrigger?: string;
	/**
	 * Id of the card whose element contains this one. `opacity` multiplies down
	 * the tree, so a child can never exceed its parent; the card reports the
	 * effective value rather than a figure the user cannot actually see.
	 */
	parentId?: string;
	/** Shown on the card when the control cannot apply in every environment. */
	platformNote?: string;
}

export const UI_ELEMENTS: UIElementConfig[] = [
	// --- 1. BORDERS, DIVIDERS & OUTLINES ---
	{
		id: 'tab-outlines',
		label: 'Tab Outlines & Curves',
		selector: '.workspace-tab-header',
		category: 'borders',
		icon: 'layout',
		kind: 'border',
		defaultOpacityDark: '1.0',
		defaultOpacityLight: '1.0',
		supportsHoverReveal: true,
	},
	{
		id: 'sidebar-borders',
		label: 'Sidebar Boundary Dividers',
		selector: '.workspace-ribbon, .workspace-split.mod-left-split, .workspace-split.mod-right-split, .workspace-drawer',
		category: 'borders',
		icon: 'separator-vertical',
		kind: 'border',
		defaultOpacityDark: '1.0',
		defaultOpacityLight: '1.0',
		supportsHoverReveal: true,
	},
	{
		id: 'resize-handles',
		label: 'Pane Resizers & Split Dividers',
		selector: '.workspace-leaf-resize-handle, .workspace-split > hr, .workspace-split.mod-vertical > hr, .workspace-split.mod-horizontal > hr, hr.workspace-split-hr',
		category: 'borders',
		icon: 'columns-2',
		// Was falling through to the generic opacity path, which fades a transparent
		// hit target: the visible line is a border, so this belongs to the border kind.
		kind: 'border',
		defaultOpacityDark: '1.0',
		defaultOpacityLight: '1.0',
		supportsHoverReveal: true,
	},
	{
		id: 'property-borders',
		label: 'Frontmatter & Table Borders',
		selector: '.metadata-property, .markdown-rendered table, .markdown-rendered th, .markdown-rendered td',
		category: 'borders',
		icon: 'table',
		kind: 'border',
		defaultOpacityDark: '1.0',
		defaultOpacityLight: '1.0',
		supportsHoverReveal: true,
	},

	// --- 2. NAVIGATION, RIBBONS & SIDEBARS ---
	{
		id: 'ribbon-icons',
		label: 'Ribbon Navigation Icons',
		selector: '.workspace-ribbon .clickable-icon, .side-dock-ribbon-action, .workspace-ribbon .workspace-ribbon-collapse-btn',
		category: 'navigation',
		icon: 'navigation',
		defaultOpacityDark: '1.0',
		defaultOpacityLight: '1.0',
		supportsHoverReveal: true,
	},
	{
		id: 'left-ribbon',
		label: 'Left Ribbon Dock',
		selector: '.workspace-ribbon.mod-left, .side-dock-ribbon.mod-left, .workspace-ribbon:not(.mod-right)',
		category: 'navigation',
		icon: 'sidebar',
		defaultOpacityDark: '1.0',
		defaultOpacityLight: '1.0',
		supportsHoverReveal: true,
	},
	{
		id: 'right-ribbon',
		label: 'Right Ribbon Dock',
		selector: '.workspace-ribbon.mod-right, .side-dock-ribbon.mod-right',
		category: 'navigation',
		icon: 'sidebar',
		defaultOpacityDark: '1.0',
		defaultOpacityLight: '1.0',
		supportsHoverReveal: true,
	},
	{
		id: 'sidebar-tab-icons',
		parentId: 'left-sidebar',
		label: 'Sidebar Tab Header Icons',
		selector: '.workspace-split.mod-left-split .workspace-tab-header-inner-icon, .workspace-split.mod-right-split .workspace-tab-header-inner-icon, .workspace-drawer .workspace-tab-header-inner-icon',
		category: 'navigation',
		icon: 'folder-tree',
		defaultOpacityDark: '1.0',
		defaultOpacityLight: '1.0',
		supportsHoverReveal: true,
	},
	{
		id: 'nav-action-buttons',
		label: 'Sidebar Action & Tool Buttons',
		selector: '.nav-buttons-container, .nav-action-button, .nav-header .clickable-icon, .view-actions, .view-action',
		category: 'navigation',
		icon: 'wrench',
		defaultOpacityDark: '1.0',
		defaultOpacityLight: '1.0',
		supportsHoverReveal: true,
	},
	{
		id: 'left-sidebar',
		label: 'Left Sidebar (whole panel)',
		selector: '.workspace-split.mod-left-split, .workspace-drawer.mod-left',
		category: 'navigation',
		icon: 'panel-left',
		hoverTrigger: '.workspace-split.mod-left-split .workspace-tab-header-container, .workspace-split.mod-left-split .nav-header, .workspace-drawer.mod-left .workspace-drawer-header',
		defaultOpacityDark: '1.0',
		defaultOpacityLight: '1.0',
		supportsHoverReveal: true,
	},
	{
		id: 'right-sidebar',
		label: 'Right Sidebar (whole panel)',
		selector: '.workspace-split.mod-right-split, .workspace-drawer.mod-right',
		category: 'navigation',
		icon: 'panel-right',
		hoverTrigger: '.workspace-split.mod-right-split .workspace-tab-header-container, .workspace-split.mod-right-split .nav-header, .workspace-drawer.mod-right .workspace-drawer-header',
		defaultOpacityDark: '1.0',
		defaultOpacityLight: '1.0',
		supportsHoverReveal: true,
	},

	// --- 3. WINDOW & WORKSPACE CHROME ---
	{
		id: 'titlebar',
		label: 'Window Titlebar & Frame',
		selector: '.titlebar, .titlebar-inner',
		category: 'chrome',
		icon: 'app-window',
		defaultOpacityDark: '1.0',
		defaultOpacityLight: '1.0',
		supportsHoverReveal: true,
	},
	{
		id: 'window-controls',
		platformNote: 'Frameless windows only — with the native OS window frame these buttons are drawn by the system and CSS cannot reach them.',
		label: 'Window Action Controls',
		selector: '.titlebar-button-container, .titlebar-button, .titlebar-button-container.mod-right',
		category: 'chrome',
		icon: 'minimize-2',
		defaultOpacityDark: '1.0',
		defaultOpacityLight: '1.0',
		supportsHoverReveal: true,
	},
	{
		id: 'tab-headers',
		label: 'Tab Headers (Note Tabs)',
		selector: '.workspace-tab-header-container',
		category: 'chrome',
		icon: 'layout',
		defaultOpacityDark: '1.0',
		defaultOpacityLight: '1.0',
		supportsHoverReveal: true,
	},
	{
		id: 'view-header',
		label: 'View Header & Actions Bar',
		selector: '.view-header',
		category: 'chrome',
		icon: 'panel-top',
		defaultOpacityDark: '1.0',
		defaultOpacityLight: '1.0',
		supportsHoverReveal: true,
	},
	{
		id: 'status-bar',
		label: 'Status Bar',
		selector: '.status-bar',
		category: 'chrome',
		icon: 'info',
		defaultOpacityDark: '1.0',
		defaultOpacityLight: '1.0',
		supportsHoverReveal: true,
	},
	{
		id: 'scrollbars',
		label: 'Scrollbars',
		selector: '::-webkit-scrollbar, .cm-scroller::-webkit-scrollbar, *::-webkit-scrollbar-thumb, *::-webkit-scrollbar-track',
		category: 'chrome',
		icon: 'sliders-vertical',
		defaultOpacityDark: '1.0',
		defaultOpacityLight: '1.0',
		supportsHoverReveal: true,
	},

	// --- 4. EDITOR & NOTE CANVAS ---
	{
		id: 'editor-gutters',
		label: 'Line Numbers & Gutter',
		selector: '.cm-gutters, .cm-lineNumbers',
		category: 'editor',
		icon: 'list-ordered',
		defaultOpacityDark: '1.0',
		defaultOpacityLight: '1.0',
		supportsHoverReveal: true,
	},
	{
		id: 'fold-indicators',
		parentId: 'editor-gutters',
		label: 'Fold & Collapse Indicators',
		selector: '.cm-foldGutter, .cm-foldGutter .cm-gutterElement, .cm-gutter-fold, .cm-fold-indicator, .heading-collapse-indicator, .collapse-indicator, .nav-folder-collapse-indicator, .tree-item-icon.collapse-icon, .collapse-icon',
		category: 'editor',
		icon: 'chevron-down',
		defaultOpacityDark: '1.0',
		defaultOpacityLight: '1.0',
		supportsHoverReveal: true,
	},
	{
		id: 'inline-title',
		label: 'Note Inline Title',
		selector: '.inline-title',
		category: 'editor',
		icon: 'heading',
		defaultOpacityDark: '1.0',
		defaultOpacityLight: '1.0',
		supportsHoverReveal: true,
	},
	{
		id: 'metadata-container',
		label: 'Note Properties / Frontmatter',
		selector: '.metadata-container, .metadata-properties',
		category: 'editor',
		icon: 'table-properties',
		defaultOpacityDark: '1.0',
		defaultOpacityLight: '1.0',
		supportsHoverReveal: true,
	},
	{
		id: 'active-line',
		label: 'Active Line Highlight',
		selector: '.cm-activeLine, .cm-activeLineGutter',
		category: 'editor',
		icon: 'highlighter',
		defaultOpacityDark: '1.0',
		defaultOpacityLight: '1.0',
		// Fades the background wash only, and the generator emits no hover form for
		// it — offering the toggle would promise behaviour that never arrives.
		supportsHoverReveal: false,
	},
	{
		id: 'embedded-backlinks',
		label: 'Embedded Backlinks in Footer',
		selector: '.embedded-backlinks, .embedded-backlinks .backlink-pane',
		category: 'editor',
		icon: 'link-2',
		defaultOpacityDark: '1.0',
		defaultOpacityLight: '1.0',
		supportsHoverReveal: true,
	},
];

