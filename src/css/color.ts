/**
 * Colour parsing and interpolation helpers.
 *
 * Pure functions: no Obsidian API, no view state. Safe to unit test directly.
 */

function normalizeHex(hex: string | undefined): string | null {
	if (!hex || !hex.startsWith('#')) return null;
	let clean = hex.slice(1).trim();
	if (clean.length === 3) {
		clean = clean.split('').map((c) => c + c).join('');
	}
	if (clean.length !== 6 || !/^[0-9a-fA-F]{6}$/.test(clean)) {
		return null;
	}
	return clean;
}

export function parseHexRgb(hex: string): { r: number; g: number; b: number } {
	const clean = normalizeHex(hex);
	if (!clean) {
		return { r: 124, g: 58, b: 237 };
	}
	const r = parseInt(clean.slice(0, 2), 16) || 0;
	const g = parseInt(clean.slice(2, 4), 16) || 0;
	const b = parseInt(clean.slice(4, 6), 16) || 0;
	return { r, g, b };
}

export function interpolateHexColor(color1: string, color2: string, factor: number): string {
	const f = Math.max(0, Math.min(1, factor));
	const c1 = parseHexRgb(color1);
	const c2 = parseHexRgb(color2);
	const r = Math.round(c1.r + (c2.r - c1.r) * f);
	const g = Math.round(c1.g + (c2.g - c1.g) * f);
	const b = Math.round(c1.b + (c2.b - c1.b) * f);
	return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

export function parsePx(val: string | undefined, fallback: number = 0): number {
	if (!val) return fallback;
	const m = val.match(/^-?[\d.]+/);
	return m ? parseFloat(m[0]) : fallback;
}

export function hexToRgba(hex: string | undefined, opacity: number): string {
	const clean = normalizeHex(hex);
	const op = isNaN(opacity) ? 0.4 : opacity;
	if (!clean) {
		return `rgba(124, 58, 237, ${op})`;
	}
	const r = parseInt(clean.slice(0, 2), 16) || 0;
	const g = parseInt(clean.slice(2, 4), 16) || 0;
	const b = parseInt(clean.slice(4, 6), 16) || 0;
	return `rgba(${r}, ${g}, ${b}, ${op})`;
}

export function parseColorDetails(colorStr: string, opacity: number): { r: number; g: number; b: number; hex: string; rgba: string; opacity: number } {
	let c = (colorStr || '').trim();
	const op = Math.max(0.01, Math.min(1, opacity));
	let r = 128, g = 128, b = 128;
	let hex = '#808080';

	if (c.startsWith('#')) {
		let clean = c.slice(1);
		if (clean.length === 3) {
			clean = clean.split('').map((char) => char + char).join('');
		}
		if (clean.length === 6) {
			r = parseInt(clean.slice(0, 2), 16) || 0;
			g = parseInt(clean.slice(2, 4), 16) || 0;
			b = parseInt(clean.slice(4, 6), 16) || 0;
			hex = `#${clean}`;
		}
	} else if (c.startsWith('rgba(') || c.startsWith('rgb(')) {
		const m = c.match(/\(([^)]+)\)/);
		if (m && m[1]) {
			const parts = m[1].split(',').map((p) => parseInt(p.trim(), 10) || 0);
			r = Math.min(255, Math.max(0, parts[0] ?? 0));
			g = Math.min(255, Math.max(0, parts[1] ?? 0));
			b = Math.min(255, Math.max(0, parts[2] ?? 0));
			hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
		}
	}

	return {
		r,
		g,
		b,
		hex,
		rgba: `rgba(${r}, ${g}, ${b}, ${op})`,
		opacity: op,
	};
}
