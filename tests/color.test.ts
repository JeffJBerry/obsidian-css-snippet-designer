import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseHexRgb, interpolateHexColor, hexToRgba, parsePx } from '../src/css/color';

test('parses 6-digit hex', () => {
	assert.deepEqual(parseHexRgb('#ff8000'), { r: 255, g: 128, b: 0 });
});

test('interpolation hits both endpoints', () => {
	assert.equal(interpolateHexColor('#000000', '#ffffff', 0).toLowerCase(), '#000000');
	assert.equal(interpolateHexColor('#000000', '#ffffff', 1).toLowerCase(), '#ffffff');
});

test('interpolation midpoint is between the endpoints', () => {
	const mid = parseHexRgb(interpolateHexColor('#000000', '#ffffff', 0.5));
	assert.ok(mid.r > 100 && mid.r < 155, `midpoint red was ${mid.r}`);
});

test('hexToRgba emits an rgba triple with the given alpha', () => {
	assert.match(hexToRgba('#ff8000', 0.5), /^rgba\(255,\s*128,\s*0,\s*0?\.5\)$/);
});

test('parses 3-digit shorthand hex', () => {
	assert.deepEqual(parseHexRgb('#fff'), { r: 255, g: 255, b: 255 });
	assert.deepEqual(parseHexRgb('#000'), { r: 0, g: 0, b: 0 });
	assert.deepEqual(parseHexRgb('#f00'), { r: 255, g: 0, b: 0 });
});

test('hexToRgba handles 3-digit shorthand hex', () => {
	assert.match(hexToRgba('#fff', 0.8), /^rgba\(255,\s*255,\s*255,\s*0?\.8\)$/);
	assert.match(hexToRgba('#000', 1), /^rgba\(0,\s*0,\s*0,\s*1\)$/);
});

test('parsePx falls back when the value is absent or unparseable', () => {
	assert.equal(parsePx('12px', 0), 12);
	assert.equal(parsePx(undefined, 7), 7);
});

