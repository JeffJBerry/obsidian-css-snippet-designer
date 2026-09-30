/**
 * Pure decision logic for the vertical-tab rail's up/down arrows. Kept apart
 * from `vertical-tabs-nav.ts` (which imports Obsidian and touches the DOM) so
 * it can be unit-tested without the Obsidian module.
 */

export interface NavArrowState {
	up: boolean;
	down: boolean;
}

/**
 * Which arrows should be usable at a given scroll position. Both are false when
 * the content fits (nothing to page through).
 */
export function navArrowState(scrollTop: number, clientHeight: number, scrollHeight: number): NavArrowState {
	const maxScroll = scrollHeight - clientHeight;
	if (maxScroll <= 1) return { up: false, down: false };
	return { up: scrollTop > 1, down: scrollTop < maxScroll - 1 };
}
