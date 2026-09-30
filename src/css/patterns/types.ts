/**
 * Shared contract for procedural background pattern builders.
 *
 * Every builder receives a fully resolved {@link PatternContext} and returns
 * the four background longhands the generator needs. Builders stay pure: no
 * Obsidian imports, no view state, colours and sizing arrive pre-computed.
 */

export interface PatternResult {
	bgImage: string;
	bgSize: string;
	bgPosition?: string;
	bgAttachment?: string;
	/** `background-repeat`; defaults to `repeat` when omitted. */
	bgRepeat?: string;
}

export interface PatternColor {
	r: number;
	g: number;
	b: number;
	hex: string;
	rgba: string;
	opacity: number;
}

export interface PatternContext {
	/** Animation frame index for builders that draw movement; 0 otherwise. */
	frame: number;
	/** Raw tile size from the slider, in px. */
	size: number;
	/** `${size}px`, precomputed for the common case. */
	sizePx: string;
	/** Opacity clamped to 0.01-1. */
	op: number;
	isDark: boolean;
	isGradient: boolean;
	/** Gradient angle in degrees (0-360), defaulting to 135. */
	gradAngle: number;
	/** Primary colour; `rgba` already carries `op`. */
	c: PatternColor;
	/** Secondary colour, used in two-tone mode. */
	c2: PatternColor;
	rgba: string;
	rgba2: string;
	/** Solid hex for pattern art, falling back to a theme accent. */
	p1: string;
	p2: string;
	/** `<defs>` carrying the animated / gradient paint, or `''`. */
	svgDefs: string;
	/** Paint for strokes: a hex, or `url(#pgrad)` when a gradient is active. */
	pStroke: string;
	/** Paint for fills: a hex, or `url(#pgrad)` when a gradient is active. */
	pFill: string;
	/**
	 * Opacity for one SVG element. A gradient paint already carries the user's
	 * opacity in its stops, so under a gradient this is a plain 0-1 multiplier
	 * and otherwise it folds `op` in.
	 */
	fo(mult?: number): string;
	/** `rgba()` built from the primary colour with an opacity multiplier. */
	tint(mult?: number): string;
	/** `rgba()` built from the secondary colour with an opacity multiplier. */
	tint2(mult?: number): string;
	/**
	 * Wrap SVG markup in a `url("data:image/svg+xml,...")` background-image.
	 * The active `<defs>` are injected automatically; `extraDefs` is appended
	 * for builders that need their own filters, masks or clip paths.
	 */
	svgUrl(width: number, height: number, body: string, rootAttrs?: string, extraDefs?: string): string;
}

export type PatternBuilder = (ctx: PatternContext) => PatternResult;
