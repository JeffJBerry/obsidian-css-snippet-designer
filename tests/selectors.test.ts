import { test } from 'node:test';
import assert from 'node:assert/strict';
import { splitSelectorList, scopeSelectors } from '../src/css/selectors';

test('splits simple comma-separated selectors', () => {
	const result = splitSelectorList('.a, .b, .c');
	assert.deepEqual(result, ['.a', '.b', '.c']);
});

test('handles whitespace and empty segments gracefully', () => {
	const result = splitSelectorList('  .a  ,  .b  ,  ');
	assert.deepEqual(result, ['.a', '.b']);
});

test('does not split on commas inside parentheses (:has, :is, :not, :where)', () => {
	const selector = '.markdown-rendered li:not(:has(h1, h2, h3, h4, h5, h6)), .cm-line';
	const result = splitSelectorList(selector);
	assert.deepEqual(result, [
		'.markdown-rendered li:not(:has(h1, h2, h3, h4, h5, h6))',
		'.cm-line',
	]);
});

test('does not split on commas inside attribute selector brackets', () => {
	const selector = 'div[data-val="a,b,c"], span[title="hello, world"]';
	const result = splitSelectorList(selector);
	assert.deepEqual(result, [
		'div[data-val="a,b,c"]',
		'span[title="hello, world"]',
	]);
});

test('does not split on commas inside quotes', () => {
	const selector = 'div:lang("en, fr"), span';
	const result = splitSelectorList(selector);
	assert.deepEqual(result, ['div:lang("en, fr")', 'span']);
});

test('scopes complex schema selector without fracturing pseudo-classes', () => {
	const schemaSelector = '.markdown-rendered p, .markdown-rendered li:not(:has(h1, h2, h3, h4, h5, h6)), .markdown-rendered blockquote:not(.callout) p, .markdown-rendered table td, .cm-line:not(.HyperMD-header):not(.cm-header):not([class*="HyperMD-header"]):not([class*="cm-header"])';
	const scoped = scopeSelectors('.theme-dark', schemaSelector);

	// Ensure no bare heading selectors were emitted
	assert.ok(!scoped.includes('.theme-dark h2'), 'Must not leak bare .theme-dark h2 selector');
	assert.ok(!scoped.includes('.theme-dark h3'), 'Must not leak bare .theme-dark h3 selector');
	assert.ok(!scoped.includes('.theme-dark h4'), 'Must not leak bare .theme-dark h4 selector');
	assert.ok(!scoped.includes('.theme-dark h5'), 'Must not leak bare .theme-dark h5 selector');

	// Ensure the :has(...) pseudo-class stayed intact
	assert.ok(scoped.includes('.theme-dark .markdown-rendered li:not(:has(h1, h2, h3, h4, h5, h6))'));
});
