import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateCss } from '../src/engine';

test('accepts well-formed css', () => {
	assert.equal(validateCss('.a { color: red; }').ok, true);
	assert.equal(validateCss('').ok, true);
	assert.equal(validateCss('@media (min-width: 10px) { .a { color: red; } }').ok, true);
});

test('braces inside strings, comments and url() do not confuse the scanner', () => {
	assert.equal(validateCss('.a::after { content: "}"; }').ok, true);
	assert.equal(validateCss(".a::after { content: '{{{'; }").ok, true);
	assert.equal(validateCss('/* } } } */ .a { color: red; }').ok, true);
	assert.equal(validateCss('.a { background: url(data:image/svg+xml;utf8,<svg/>); }').ok, true);
});

test('modern selectors parse', () => {
	assert.equal(validateCss('.cm-embed-block:has(> .callout) { overflow: visible; }').ok, true);
	assert.equal(validateCss('.a:not([class*="x"] pre) { color: red; }').ok, true);
});

test('reports unbalanced braces with a location', () => {
	const r = validateCss('.a { color: red;');
	assert.equal(r.ok, false);
	assert.equal(r.issues[0]?.message, "Unclosed '{'");
	assert.equal(r.issues[0]?.line, 1);
});

test('reports stray closing brace', () => {
	const r = validateCss('.a { color: red; } }');
	assert.equal(r.ok, false);
	assert.match(r.issues[0]?.message ?? '', /Unmatched/);
});

test('reports unterminated comment and string', () => {
	assert.match(validateCss('.a { /* oops }').issues[0]?.message ?? '', /Unterminated comment/);
	assert.match(validateCss('.a::after { content: "oops }').issues[0]?.message ?? '', /Unterminated string/);
});

test('line numbers advance across newlines', () => {
	const r = validateCss('.a {\n  color: red;\n');
	assert.equal(r.ok, false);
	assert.equal(r.issues[0]?.line, 1);
});
