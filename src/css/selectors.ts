/**
 * Selector scoping helpers.
 */

/**
 * Split a comma-separated selector list at top-level commas only, ignoring commas
 * enclosed within parentheses (e.g. `:has(a, b)`, `:is(...)`, `:not(...)`),
 * attribute brackets (e.g. `[data-attr="a,b"]`), or quoted strings.
 */
export function splitSelectorList(rawSelector: string): string[] {
	const parts: string[] = [];
	let current = '';
	let parenDepth = 0;
	let bracketDepth = 0;
	let inSingleQuote = false;
	let inDoubleQuote = false;

	for (let i = 0; i < rawSelector.length; i++) {
		const char = rawSelector[i];
		const prev = i > 0 ? rawSelector[i - 1] : '';

		if (char === "'" && !inDoubleQuote && prev !== '\\') {
			inSingleQuote = !inSingleQuote;
			current += char;
		} else if (char === '"' && !inSingleQuote && prev !== '\\') {
			inDoubleQuote = !inDoubleQuote;
			current += char;
		} else if (!inSingleQuote && !inDoubleQuote) {
			if (char === '(') {
				parenDepth++;
				current += char;
			} else if (char === ')') {
				if (parenDepth > 0) parenDepth--;
				current += char;
			} else if (char === '[') {
				bracketDepth++;
				current += char;
			} else if (char === ']') {
				if (bracketDepth > 0) bracketDepth--;
				current += char;
			} else if (char === ',' && parenDepth === 0 && bracketDepth === 0) {
				const trimmed = current.trim();
				if (trimmed.length > 0) {
					parts.push(trimmed);
				}
				current = '';
			} else {
				current += char;
			}
		} else {
			current += char;
		}
	}

	const remaining = current.trim();
	if (remaining.length > 0) {
		parts.push(remaining);
	}

	return parts;
}

/**
 * Prefix each top-level comma-separated selector in `rawSelector` with `themeScope`, so
 * a rule authored once applies under `.theme-dark` or `.theme-light` only.
 */
export function scopeSelectors(themeScope: string, rawSelector: string): string {
	return splitSelectorList(rawSelector)
		.map((s) => `${themeScope} ${s}`)
		.join(',\n');
}

/**
 * Prefix every top-level rule in a whole CSS block with `themeScope`, so a
 * companion rule authored once can be emitted for the one theme that enables it.
 *
 * `.theme-dark` / `.theme-light` are classes Obsidian puts on `<body>`, so a
 * selector already anchored at `body` has to take the class on that same
 * compound (`body.theme-dark:not(.is-focused) …`). Prefixing it as an ancestor
 * would produce `.theme-dark body`, which matches nothing. Selectors anchored at
 * `html`, `:root` or a bare `*` cannot be scoped this way at all and are left
 * untouched, exactly as they are emitted today.
 *
 * Companion CSS carries no at-rules and no nesting, so a depth counter is enough
 * to find the top-level rules; anything between rules (comments, blank lines) is
 * passed through unchanged.
 */
export function scopeCssBlock(themeScope: string, css: string): string {
	let out = '';
	let prelude = '';
	let depth = 0;
	let ruleBody = '';

	for (const char of css) {
		if (depth === 0) {
			if (char === '{') {
				out += scopeRulePrelude(themeScope, prelude);
				prelude = '';
				ruleBody = '{';
				depth = 1;
			} else {
				prelude += char;
			}
			continue;
		}

		ruleBody += char;
		if (char === '{') {
			depth++;
		} else if (char === '}') {
			depth--;
			if (depth === 0) {
				out += ruleBody;
				ruleBody = '';
			}
		}
	}

	return out + prelude + ruleBody;
}

/**
 * Scope one rule's prelude, keeping any leading whitespace or comment that came
 * with it so the emitted block still reads like the source.
 */
function scopeRulePrelude(themeScope: string, prelude: string): string {
	// Consume leading whitespace and any leading `/* ... */` comments (possibly
	// several, possibly spanning multiple lines) before treating the rest as the
	// selector list. A naive "first non-whitespace, non-slash character" split
	// mistook a comment\'s own `/*` for the start of the selector text, corrupting
	// the comment and, if its body happened to contain an odd number of quote
	// characters, producing structurally invalid CSS.
	let index = 0;
	for (;;) {
		const rest = prelude.slice(index);
		const wsMatch = rest.match(/^\s+/);
		if (wsMatch) {
			index += wsMatch[0].length;
			continue;
		}
		if (rest.startsWith('/*')) {
			const end = rest.indexOf('*/');
			if (end === -1) {
				// Unterminated comment: treat the whole remainder as leading text
				// rather than guessing at a selector inside it.
				index = prelude.length;
			} else {
				index += end + 2;
			}
			continue;
		}
		break;
	}
	const leading = prelude.slice(0, index);
	const selectorList = prelude.slice(index).trim();
	if (!selectorList) return prelude;

	const scoped = splitSelectorList(selectorList)
		.map((selector) => scopeOneSelector(themeScope, selector))
		.join(',\n');
	return `${leading}${scoped} `;
}

/** `.theme-dark` lives on `<body>`, so where the selector starts decides how it attaches. */
function scopeOneSelector(themeScope: string, selector: string): string {
	if (/^(html|:root|\*)\b/.test(selector)) return selector;
	const bodyAnchored = selector.match(/^body\b(.*)$/s);
	if (bodyAnchored) return `body${themeScope}${bodyAnchored[1]}`;
	return `${themeScope} ${selector}`;
}

/**
 * Keep only the parts of `css` that can apply under `themeScope`.
 *
 * Some companion blocks are authored with their own `.theme-dark` and
 * `.theme-light` selectors - often both in the same selector list, as in
 * `.theme-dark .menu-item, .theme-light .menu-item { … }`. When only one theme
 * has moved off stock, the other theme's half restates what Obsidian already
 * does, and keeps that theme's custom properties alive in the snippet for
 * nothing. Filtering happens per selector rather than per rule so those shared
 * lists are split correctly; a rule left with no selectors is dropped, and a
 * selector naming neither theme applies to both and is always kept.
 */
export function filterCssBlockToMode(themeScope: string, css: string): string {
	const other = themeScope === '.theme-dark' ? '.theme-light' : '.theme-dark';
	let out = '';
	let prelude = '';
	let rule = '';
	let depth = 0;

	for (const char of css) {
		if (depth === 0) {
			if (char === '{') {
				depth = 1;
				rule = '{';
			} else {
				prelude += char;
			}
			continue;
		}
		rule += char;
		if (char === '{') depth++;
		else if (char === '}') {
			depth--;
			if (depth === 0) {
				const kept = keptSelectors(prelude, themeScope, other);
				if (kept) out += `${kept} ${rule}\n`;
				prelude = '';
				rule = '';
			}
		}
	}
	return out + prelude + rule;
}

/** The selectors in `prelude` that reach `themeScope`, or '' when none do. */
function keptSelectors(prelude: string, themeScope: string, other: string): string {
	const selectorList = prelude.replace(/\/\*[\s\S]*?\*\//g, '').trim();
	if (!selectorList) return '';
	const kept = splitSelectorList(selectorList).filter(
		(selector) => !(selector.includes(other) && !selector.includes(themeScope))
	);
	return kept.length > 0 ? kept.join(',\n') : '';
}
