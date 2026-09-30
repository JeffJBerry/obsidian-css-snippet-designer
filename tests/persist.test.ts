import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
	mergeIntoExisting,
	buildReducedMotionBlock,
	GENERATED_HEADER,
	FENCE_BEGIN,
	FENCE_END,
} from '../src/snippet/persist';
import { validateCss } from '../src/engine';

const GENERATED = `${GENERATED_HEADER}\n\n.theme-dark {\n  --x: 1;\n}\n`;

test('a fresh file is written fenced', () => {
	const out = mergeIntoExisting(null, GENERATED);
	assert.ok(out.startsWith(FENCE_BEGIN));
	assert.ok(out.trimEnd().endsWith(FENCE_END));
	assert.match(out, /--x: 1/);
});

test('hand-written css outside the fences survives a save', () => {
	const existing = `/* my own tweaks */\n.my-rule { color: red; }\n\n${FENCE_BEGIN}\nOLD GENERATED\n${FENCE_END}\n/* trailing note */\n`;
	const out = mergeIntoExisting(existing, GENERATED);
	assert.match(out, /my own tweaks/);
	assert.match(out, /\.my-rule \{ color: red; \}/);
	assert.match(out, /trailing note/);
	assert.doesNotMatch(out, /OLD GENERATED/);
	assert.match(out, /--x: 1/);
});

test('a user file with no fences is preserved and appended to', () => {
	const existing = '.hand-written { color: blue; }\n';
	const out = mergeIntoExisting(existing, GENERATED);
	assert.match(out, /\.hand-written \{ color: blue; \}/);
	assert.match(out, /--x: 1/);
	assert.ok(out.indexOf('.hand-written') < out.indexOf(FENCE_BEGIN));
});

test('an unfenced file from the previous build is replaced wholesale', () => {
	const legacy = `${GENERATED_HEADER}\n\n.theme-dark {\n  --old: 9;\n}\n`;
	const out = mergeIntoExisting(legacy, GENERATED);
	assert.doesNotMatch(out, /--old: 9/);
	assert.match(out, /--x: 1/);
});

test('repeated saves are stable', () => {
	const once = mergeIntoExisting(null, GENERATED);
	assert.equal(mergeIntoExisting(once, GENERATED), once);
	assert.equal(mergeIntoExisting(mergeIntoExisting(once, GENERATED), GENERATED), once);
});

test('reduced-motion block is emitted only when something animates', () => {
	assert.equal(buildReducedMotionBlock([]), '');
	const block = buildReducedMotionBlock(['.theme-dark .a', '.theme-dark .a', '.theme-light .b']);
	assert.match(block, /@media \(prefers-reduced-motion: reduce\)/);
	assert.match(block, /animation: none !important/);
	// duplicates collapse
	assert.equal(block.match(/\.theme-dark \.a/g)?.length, 1);
	assert.equal(validateCss(block).ok, true);
});

test('animations persist when unfocused without unfocused-pause rule', () => {
	const out = mergeIntoExisting(null, GENERATED);
	assert.doesNotMatch(out, /animation-play-state:\s*paused/);
	assert.doesNotMatch(out, /:not\(\.is-focused\)/);
});
