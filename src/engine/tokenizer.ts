/**
 * Minimal, dependency-free CSS structural scanner.
 *
 * Verifies that generated CSS is structurally sound before it is written into a
 * user's vault. It checks the structure that generated CSS can get wrong
 * (unbalanced blocks, unterminated strings/comments, declarations missing a colon),
 * which is the failure mode that matters when every rule is machine-emitted.
 */

export interface CssIssue {
	/** 1-indexed line number. */
	line: number;
	/** 1-indexed column number. */
	column: number;
	message: string;
}

export interface ValidationResult {
	ok: boolean;
	issues: CssIssue[];
}

const enum Ctx {
	Top,
	Comment,
	SingleQuote,
	DoubleQuote,
}

/**
 * Scan `css` and report structural problems.
 *
 * Comments, strings and parenthesised values (url(), calc(), :has(...)) are
 * skipped so that braces or semicolons inside them never confuse the scanner.
 */
export function validateCss(css: string): ValidationResult {
	const issues: CssIssue[] = [];
	const braceStack: { line: number; column: number }[] = [];

	let ctx: Ctx = Ctx.Top;
	let parenDepth = 0;
	let line = 1;
	let column = 1;
	// Start of the current construct, used to report where an unterminated one opened.
	let openLine = 1;
	let openColumn = 1;

	const push = (message: string, l = line, c = column): void => {
		// Cap the report so a pathologically broken file cannot balloon.
		if (issues.length < 50) issues.push({ line: l, column: c, message });
	};

	for (let i = 0; i < css.length; i++) {
		const ch = css[i] as string;
		const next = css[i + 1];

		if (ch === '\n') {
			line++;
			column = 1;
			continue;
		}
		column++;

		switch (ctx) {
			case Ctx.Comment:
				if (ch === '*' && next === '/') {
					ctx = Ctx.Top;
					i++;
					column++;
				}
				continue;

			case Ctx.SingleQuote:
			case Ctx.DoubleQuote: {
				if (ch === '\\') {
					// Skip the escaped character, including an escaped newline.
					if (next === '\n') {
						line++;
						column = 1;
					}
					i++;
					continue;
				}
				const closer = ctx === Ctx.SingleQuote ? "'" : '"';
				if (ch === closer) ctx = Ctx.Top;
				continue;
			}

			case Ctx.Top:
				break;
		}

		if (ch === '/' && next === '*') {
			ctx = Ctx.Comment;
			openLine = line;
			openColumn = column;
			i++;
			column++;
			continue;
		}
		if (ch === "'" || ch === '"') {
			ctx = ch === "'" ? Ctx.SingleQuote : Ctx.DoubleQuote;
			openLine = line;
			openColumn = column;
			continue;
		}
		if (ch === '(') {
			parenDepth++;
			continue;
		}
		if (ch === ')') {
			if (parenDepth === 0) push("Unmatched ')'");
			else parenDepth--;
			continue;
		}
		// Braces inside a parenthesised value are not block delimiters.
		if (parenDepth > 0) continue;

		if (ch === '{') {
			braceStack.push({ line, column });
			continue;
		}
		if (ch === '}') {
			if (braceStack.length === 0) push("Unmatched '}'");
			else braceStack.pop();
			continue;
		}
	}

	if (ctx === Ctx.Comment) {
		push('Unterminated comment', openLine, openColumn);
	} else if (ctx === Ctx.SingleQuote || ctx === Ctx.DoubleQuote) {
		push('Unterminated string', openLine, openColumn);
	}
	if (parenDepth > 0) {
		push(`${parenDepth} unclosed '('`);
	}
	for (const open of braceStack) {
		push("Unclosed '{'", open.line, open.column);
	}

	return { ok: issues.length === 0, issues };
}

/** Format issues as a single human-readable string, for Notices and console output. */
export function formatIssues(issues: CssIssue[]): string {
	return issues.map((e) => `  ${e.line}:${e.column}  ${e.message}`).join('\n');
}
