/**
 * Numeric helpers shared by the pattern builders.
 *
 * Pattern geometry is emitted straight into percent-encoded SVG, so trimming
 * float noise here measurably shortens every generated `url()`.
 */

/** Round to two decimals and drop trailing zeroes. */
export function n(value: number): string {
	return String(Math.round(value * 100) / 100);
}

/** Clamp a derived dimension to a sane minimum. */
export function atLeast(min: number, value: number): number {
	return Math.max(min, Math.round(value));
}

/**
 * Deterministic 0-1 pseudo-random from an integer seed.
 *
 * Patterns must be byte-identical across renders (the CSS is written into the
 * user's vault), so scattered elements are placed with this rather than
 * `Math.random`.
 */
export function rand(seed: number): number {
	const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
	return x - Math.floor(x);
}
