/**
 * The pattern registry.
 *
 * Builders are grouped by the same categories the picker shows, so the module
 * a pattern lives in always matches the optgroup a user found it under.
 */
import type { PatternBuilder } from './types';
import { ART_DECO_PATTERNS } from './art-deco';
import { COSMIC_PATTERNS } from './cosmic';
import { CYBER_PATTERNS } from './cyber';
import { GEOMETRIC_PATTERNS } from './geometric';
import { GRID_PATTERNS } from './grids';
import { NATURE_PATTERNS } from './nature';
import { PLAYFUL_PATTERNS } from './playful';
import { TEXTURE_PATTERNS } from './textures';

export const PATTERN_BUILDERS: Record<string, PatternBuilder> = {
	...GRID_PATTERNS,
	...GEOMETRIC_PATTERNS,
	...ART_DECO_PATTERNS,
	...NATURE_PATTERNS,
	...COSMIC_PATTERNS,
	...CYBER_PATTERNS,
	...TEXTURE_PATTERNS,
	...PLAYFUL_PATTERNS,
};

export type { PatternBuilder, PatternContext, PatternResult } from './types';
