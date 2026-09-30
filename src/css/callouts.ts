/**
 * Per-type callout accent color generation.
 *
 * Obsidian keys every callout's accent off `--callout-color`, a bare
 * `R, G, B` triplet (no `rgb()` wrapper) set per `[data-callout="type"]` and
 * consumed by Obsidian's own core CSS as `rgb(var(--callout-color))` /
 * `rgba(var(--callout-color), alpha)`. A hex string plugged into that slot
 * (what a plain `type: 'color'` control stores) would make those `rgb()` /
 * `rgba()` calls invalid, so — like `generateCheckboxStyleRules` — this is a
 * bespoke generator rather than a declarative `companionCss` string: it reads
 * the raw hex tokens directly and re-emits them in the triplet form Obsidian
 * expects.
 *
 * Types are grouped the way stock Obsidian already groups their default
 * colors, so one picker covers every alias that would otherwise render
 * identically.
 */
import { parseHexRgb } from './color';

interface CalloutColorGroup {
	/** Token key holding the hex color chosen for this group. */
	variable: string;
	/** `data-callout` values this group's color applies to. */
	types: string[];
}

export const CALLOUT_COLOR_GROUPS: CalloutColorGroup[] = [
	{ variable: '--callout-color-note', types: ['note', 'info', 'todo'] },
	{ variable: '--callout-color-tip', types: ['tip', 'hint', 'important', 'abstract', 'summary', 'tldr'] },
	{ variable: '--callout-color-success', types: ['success', 'check', 'done'] },
	{ variable: '--callout-color-question', types: ['question', 'help', 'faq'] },
	{ variable: '--callout-color-warning', types: ['warning', 'caution', 'attention'] },
	{ variable: '--callout-color-danger', types: ['danger', 'error', 'failure', 'fail', 'missing', 'bug'] },
	{ variable: '--callout-color-example', types: ['example'] },
	{ variable: '--callout-color-quote', types: ['quote', 'cite'] },
];

/**
 * Emits `--callout-color` overrides for every enabled per-type group.
 * The global radius / border-width / background-opacity / icon-size controls
 * are plain px & opacity values with no format mismatch, so those still go
 * through the normal declarative `companionCss` path in schema.ts.
 */
export function generateCalloutCss(
	mode: '.theme-dark' | '.theme-light',
	tokenMap: Map<string, string>,
	enabledMap: Map<string, boolean>,
): string {
	let css = '';

	for (const group of CALLOUT_COLOR_GROUPS) {
		if (!(enabledMap.get(group.variable) ?? false)) continue;
		const hex = tokenMap.get(group.variable);
		if (!hex) continue;
		const { r, g, b } = parseHexRgb(hex);
		const selector = group.types.map((t) => `${mode} .callout[data-callout="${t}"]`).join(',\n');
		css += `${selector} {\n  --callout-color: ${r}, ${g}, ${b} !important;\n}\n`;
	}

	return css;
}
