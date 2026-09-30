import { test } from 'node:test';
import assert from 'node:assert/strict';
import { navArrowState } from '../src/vertical-tabs-nav-state';

test('no arrows are offered when the rail fits', () => {
	assert.deepEqual(navArrowState(0, 400, 400), { up: false, down: false });
	assert.deepEqual(navArrowState(0, 400, 380), { up: false, down: false });
});

test('both arrows are offered in the middle of an over-filled rail', () => {
	assert.deepEqual(navArrowState(100, 400, 900), { up: true, down: true });
	assert.deepEqual(navArrowState(250, 400, 900), { up: true, down: true });
});

test('the up arrow is disabled at the very top', () => {
	assert.deepEqual(navArrowState(0, 400, 900), { up: false, down: true });
});

test('the down arrow is disabled at the very bottom', () => {
	assert.deepEqual(navArrowState(500, 400, 900), { up: true, down: false });
});

test('a one pixel overflow still counts as scrollable', () => {
	assert.deepEqual(navArrowState(0, 400, 402), { up: false, down: true });
});
