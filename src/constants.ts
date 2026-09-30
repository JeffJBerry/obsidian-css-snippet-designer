/**
 * Identifiers shared across modules.
 *
 * These live in their own module so that `settings.ts` and `view.ts` can both
 * reference them without importing each other, which would form a cycle
 * (settings -> view -> main -> settings) and leave `DEFAULT_SETTINGS`
 * depending on evaluation order at module load.
 * Defines view identifiers, default snippet names, and live preview DOM element IDs.
 */

export const VIEW_TYPE_CSS_DESIGNER = 'css-snippet-designer-view';

/** Snippet this build writes by default. */
export const DEFAULT_SNIPPET_NAME = 'designer-output';

/** Snippet written by the original build, read once so existing work carries over. */
export const LEGACY_SNIPPET_NAME = 'designer-output';

export const LIVE_STYLE_ID = 'snippet-designer-live';
export const LIVE_VARS_STYLE_ID = 'snippet-designer-live-vars';
export const LIVE_COMPANION_STYLE_ID = 'snippet-designer-live-companion';

/** Cascade layer the generated snippet declares its rules in. */
export const CSS_LAYER_NAME = 'css-snippet-designer';
