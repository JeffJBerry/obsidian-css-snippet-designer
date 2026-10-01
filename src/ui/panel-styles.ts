/**
 * The designer panel's own stylesheet.
 *
 * Injected per-document rather than relying on `styles.css`, because popout
 * windows get their own `Document` and do not inherit the plugin stylesheet
 * Obsidian loads into the main window.
 */

import { EMBEDDED_FONT_CSS } from './embedded-fonts';

/**
 * Registers the embedded preview webfonts in a document once. Called when the
 * designer panel renders and before the live style tag is applied, so the
 * embedded family aliases resolve in every window the preview paints into.
 */
export function ensureEmbeddedFonts(doc: Document): void {
	if (doc.getElementById('css-designer-embedded-fonts')) return;
	const fontEl = doc.createElement('style');
	fontEl.id = 'css-designer-embedded-fonts';
	fontEl.textContent = EMBEDDED_FONT_CSS;
	doc.head.appendChild(fontEl);
}

export function ensureStylesInDocument(doc: Document): void {
	ensureEmbeddedFonts(doc);

	let styleEl = doc.getElementById('css-designer-ui-styles') as HTMLStyleElement | null;
	if (!styleEl) {
		styleEl = doc.createElement('style');
		styleEl.id = 'css-designer-ui-styles';
		doc.head.appendChild(styleEl);
	}
	styleEl.textContent = `

/* Preview cards must escape the clipping and blending the theme applies to
   real callouts and code blocks, so the shadow being previewed stays visible. */
.css-preview-unclipped {
    position: relative !important;
    overflow: visible !important;
    contain: none !important;
    mix-blend-mode: normal !important;
    isolation: auto !important;
    z-index: 2 !important;
}

.css-preview-unclipped-low {
    z-index: 1 !important;
}

/* Dynamic live-preview values are passed as custom properties and consumed
   here, so the preview widgets set no styles directly. */
.css-preview-dynamic-text {
    text-shadow: var(--cssd-text-shadow, none);
    -webkit-text-stroke: var(--cssd-text-stroke, unset);
    animation: var(--cssd-animation, none);
    transition: none;
}
.css-preview-dynamic-box {
    box-shadow: var(--cssd-box-shadow, none);
    outline: var(--cssd-outline, none);
    outline-offset: var(--cssd-outline-offset, 0);
    animation: var(--cssd-animation, none);
    transition: none;
}
.css-preview-leaf-positioned {
    position: relative;
    z-index: 2;
}

.css-designer-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    color: var(--text-normal);
    background-color: var(--background-primary);
    font-family: var(--font-interface);
    box-sizing: border-box;
    overflow: hidden;
    padding: 0;
}
.css-designer-container .css-designer-header {
    flex-shrink: 0;
    padding: 12px 16px 8px 16px;
    border-bottom: 1px solid var(--background-modifier-border);
}
.css-designer-body-wrap {
    display: flex;
    flex: 1 1 auto;
    min-height: 0;
    min-width: 0;
    overflow: hidden;
    position: relative;
    width: 100%;
}
.css-designer-content-pane {
    flex: 1 1 auto;
    min-width: 320px;
    overflow-y: auto;
    padding: 8px 16px 16px 16px;
    box-sizing: border-box;
    container-type: inline-size;
}
.css-designer-container .css-designer-title {
    margin: 0 0 var(--size-4-1, 4px) 0;
    font-size: var(--h2-size, 1.5em);
    font-weight: 600;
    color: var(--text-normal);
    font-family: var(--font-header, var(--font-interface));
}
.css-designer-container .css-designer-subtitle {
    margin: 0 0 var(--size-4-2, 8px) 0;
    font-size: var(--font-ui-small, 12px);
    color: var(--text-muted);
    line-height: var(--line-height-normal, 1.4);
}
.css-designer-container .css-designer-toolbar {
    display: flex;
    align-items: center;
    gap: var(--size-4-3, 12px);
    margin: var(--size-4-2, 8px) 0 0 0;
    flex-wrap: wrap;
}
.css-designer-container .css-toolbar-toggle-item {
    display: flex;
    align-items: center;
    gap: var(--size-4-2, 8px);
    background-color: var(--background-secondary);
    border: 1px solid var(--background-modifier-border);
    border-radius: var(--radius-m, 8px);
    padding: 6px 12px;
}
.css-designer-container .css-toolbar-toggle-item.mod-view-code {
    margin-left: auto;
}

/* Code Pane & Resizer */
.css-designer-code-resizer.is-hidden,
.css-designer-code-pane.is-hidden {
    display: none !important;
}

body.is-resizing-code-pane,
body.is-resizing-code-pane * {
    cursor: col-resize !important;
    user-select: none !important;
    -webkit-user-select: none !important;
}

.css-designer-code-resizer {
    flex: 0 0 6px;
    width: 6px;
    background-color: var(--background-modifier-border);
    cursor: col-resize;
    position: relative;
    transition: background-color 0.15s ease;
    user-select: none;
    -webkit-user-select: none;
    touch-action: none;
    z-index: 10;
}
.css-designer-code-resizer:hover,
.css-designer-code-resizer.is-dragging {
    background-color: var(--interactive-accent, var(--text-accent));
}
.css-designer-code-resizer::after {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    left: -6px;
    right: -6px;
    cursor: col-resize;
}
.css-designer-code-pane {
    flex: 0 0 auto;
    display: flex;
    flex-direction: column;
    background-color: var(--background-secondary);
    border-left: 1px solid var(--background-modifier-border);
    overflow: hidden;
    min-width: 260px;
    max-width: 80%;
    box-sizing: border-box;
}
.css-designer-code-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    background-color: var(--background-secondary-alt);
    border-bottom: 1px solid var(--background-modifier-border);
    flex-shrink: 0;
    gap: 8px;
}
.css-designer-code-title-wrap {
    display: flex;
    align-items: center;
    gap: 8px;
    overflow: hidden;
}
.css-designer-code-title {
    font-size: var(--font-ui-small, 12px);
    font-weight: 600;
    color: var(--text-normal);
    white-space: nowrap;
}
.css-designer-code-badge {
    font-size: var(--font-ui-smaller, 11px);
    color: var(--text-muted);
    background-color: var(--background-modifier-border);
    padding: 1px 6px;
    border-radius: var(--radius-s, 4px);
    font-family: var(--font-monospace);
    white-space: nowrap;
}
.css-designer-code-actions {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
}
.css-designer-code-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    font-size: var(--font-ui-smaller, 11px);
    font-weight: 500;
    border-radius: var(--radius-s, 4px);
    border: 1px solid var(--background-modifier-border);
    background-color: var(--interactive-normal);
    color: var(--text-normal);
    cursor: pointer;
    transition: background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease;
}
.css-designer-code-btn:hover {
    background-color: var(--interactive-hover);
    color: var(--text-accent);
}
.css-designer-code-btn.mod-copy {
    color: var(--text-accent);
}
.css-designer-code-btn.mod-close {
    padding: 4px 8px;
    color: var(--text-muted);
}
.css-designer-code-btn.mod-close:hover {
    color: var(--text-error, #e05252);
}
.css-designer-code-scroll {
    flex: 1 1 auto;
    overflow: auto;
    padding: 12px;
    background-color: var(--background-primary);
}
.css-designer-code-pre {
    margin: 0;
    padding: 0;
    background: transparent;
    border: none;
    font-family: var(--font-monospace);
    font-size: var(--code-size, 12px);
    line-height: var(--line-height-normal, 1.5);
    white-space: pre-wrap;
    word-break: break-all;
}
.css-designer-code-content {
    color: var(--code-normal, var(--text-normal));
    user-select: text;
    -webkit-user-select: text;
    cursor: text;
}

.css-designer-container .css-toolbar-label {
    font-size: var(--font-ui-small, 12px);
    font-weight: 600;
    color: var(--text-normal);
}
.css-designer-container .css-designer-status {
    font-size: var(--font-ui-smaller, 11px);
    color: var(--text-accent);
    font-family: var(--font-monospace);
    padding: 2px 6px;
    background-color: var(--background-secondary);
    border-radius: var(--radius-s, 4px);
    display: inline-block;
    margin-top: 4px;
}
.css-designer-container .css-designer-tabs {
    display: flex;
    align-items: flex-end;
    gap: 2px;
    background-color: var(--background-secondary);
    border-bottom: 1px solid var(--background-modifier-border);
    border-radius: var(--radius-m, 8px) var(--radius-m, 8px) 0 0;
    margin: 12px 0 16px 0;
    padding: 8px 8px 0 8px;
    overflow-x: auto;
    scrollbar-width: none;
    position: relative;
}
.css-designer-container .css-designer-tabs::-webkit-scrollbar {
    display: none;
}
.css-designer-container .css-tab-btn {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 7px 14px 8px 12px;
    font-size: 12px;
    font-weight: 500;
    font-family: var(--font-interface);
    color: var(--text-muted);
    background-color: transparent;
    border: 1px solid transparent;
    border-bottom: 1px solid var(--background-modifier-border);
    border-radius: 8px 8px 0 0;
    margin: 0;
    margin-bottom: -1px;
    cursor: pointer;
    transition: background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
    white-space: nowrap;
    user-select: none;
    box-sizing: border-box;
    line-height: 1.2;
    outline: none;
    box-shadow: none;
}
.css-designer-container .css-tab-btn:not(.is-active)::after {
    content: '';
    position: absolute;
    right: -2px;
    top: 25%;
    height: 50%;
    width: 1px;
    background-color: var(--background-modifier-border);
    opacity: 0.6;
    transition: opacity 0.15s ease;
    pointer-events: none;
}
.css-designer-container .css-tab-btn:hover::after,
.css-designer-container .css-tab-btn.is-active::after,
.css-designer-container .css-tab-btn:last-child::after {
    opacity: 0;
}
.css-designer-container .css-tab-btn:hover:not(.is-active) {
    color: var(--text-normal);
    background-color: var(--background-modifier-hover);
    border-color: transparent;
    border-bottom: 1px solid var(--background-modifier-border);
    border-radius: 8px 8px 0 0;
}
.css-designer-container .css-tab-btn.is-active {
    position: relative;
    z-index: 2;
    color: var(--text-accent) !important;
    background-color: var(--background-primary);
    border: 1px solid var(--background-modifier-border);
    border-bottom: 1px solid var(--background-primary);
    border-top: 2px solid var(--text-accent) !important;
    border-radius: 8px 8px 0 0;
    font-weight: 600;
    box-shadow: 0 -2px 6px rgba(0, 0, 0, 0.04);
}
.css-designer-container .css-tab-btn:focus-visible {
    outline: 2px solid var(--text-accent) !important;
    outline-offset: -2px;
}
.css-designer-container .css-tab-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 14px;
    height: 14px;
    color: var(--text-muted);
    opacity: 0.8;
    flex-shrink: 0;
    transition: color 0.15s ease, opacity 0.15s ease;
}
.css-designer-container .css-tab-icon svg {
    width: 14px;
    height: 14px;
}
.css-designer-container .css-tab-btn:hover:not(.is-active) .css-tab-icon {
    color: var(--text-normal);
    opacity: 1;
}
.css-designer-container .css-tab-btn.is-active .css-tab-icon {
    color: var(--text-accent) !important;
    opacity: 1;
}
.css-designer-container .css-tab-title {
    white-space: nowrap;
    letter-spacing: 0.01em;
}

/* Tab Navigation Dropdown (Visible on small / compressed views) */
.css-designer-container .css-designer-tab-dropdown-container {
    display: none;
    align-items: center;
    gap: 10px;
    background-color: var(--background-secondary);
    border: 1px solid var(--background-modifier-border);
    border-radius: var(--radius-m, 8px);
    margin: 12px 0 16px 0;
    padding: 8px 12px;
    box-sizing: border-box;
}

.css-designer-container .css-designer-tab-dropdown-container.mod-compact {
    padding: 6px 10px;
    margin: 8px 0 12px 0;
}

.css-designer-container .css-designer-tab-dropdown-label {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: var(--font-ui-small, 12px);
    font-weight: 600;
    color: var(--text-muted);
    white-space: nowrap;
    user-select: none;
    flex-shrink: 0;
}

.css-designer-container .css-tab-dropdown-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    color: var(--text-accent) !important;
}

.css-designer-container .css-tab-dropdown-icon svg {
    width: 14px;
    height: 14px;
}

.css-designer-container .css-designer-tab-select {
    flex: 1;
    min-width: 0;
    font-size: var(--font-ui-small, 12px);
    font-weight: 500;
    font-family: var(--font-interface);
    background-color: var(--background-primary);
    border: 1px solid var(--background-modifier-border);
    color: var(--text-normal);
    border-radius: var(--radius-s, 4px);
    padding: 5px 10px;
    cursor: pointer;
    box-shadow: none;
    outline: none;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.css-designer-container .css-designer-tab-select:focus,
.css-designer-container .css-designer-tab-select:hover {
    border-color: var(--text-accent) !important;
}

.css-designer-container .css-designer-tab-select option {
    background-color: var(--background-primary);
    color: var(--text-normal);
}

@container (max-width: 620px) {
    .css-designer-container .css-designer-tabs {
        display: none !important;
    }
    .css-designer-container .css-designer-tab-dropdown-container {
        display: flex !important;
    }
}

@media (max-width: 620px) {
    .css-designer-container .css-designer-tabs {
        display: none !important;
    }
    .css-designer-container .css-designer-tab-dropdown-container {
        display: flex !important;
    }
}

.css-designer-container.is-compressed .css-designer-tabs {
    display: none !important;
}

.css-designer-container.is-compressed .css-designer-tab-dropdown-container {
    display: flex !important;
}
.css-designer-container .css-designer-section {
    margin-bottom: var(--size-4-3, 12px);
    background-color: var(--background-secondary);
    border: 1px solid var(--background-modifier-border);
    border-radius: var(--radius-m, 8px);
    padding: 10px 14px;
}
.css-designer-container .css-ui-bg-hero,
.css-designer-container .css-ui-opacity-hero,
.css-designer-container .css-ui-layout-mods-section {
    background-color: var(--background-secondary) !important;
    border: 1px solid var(--background-modifier-border);
    box-shadow: none;
}
.css-designer-container .css-designer-section-title {
    margin: 0 0 var(--size-4-2, 8px) 0;
    font-size: var(--font-ui-medium, 13px);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-muted);
    font-weight: 700;
}
.css-designer-container .css-designer-subgroup {
    margin-bottom: var(--size-4-3, 14px);
}
.css-designer-container .css-designer-subgroup:last-child {
    margin-bottom: 0;
}
.css-designer-container .css-designer-subgroup:not(:first-child) {
    margin-top: var(--size-4-3, 14px);
    padding-top: var(--size-4-3, 12px);
    border-top: 1px solid var(--background-modifier-border);
}
.css-designer-container .css-designer-subgroup-title {
    margin: 0 0 var(--size-4-2, 8px) 0;
    font-size: var(--font-ui-smaller, 11px);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-accent);
    font-weight: 600;
}
/* Multi-column packing for the Colors and Typography tabs, whose controls are
   many small, independent rows. Colors uses three columns, Typography two. Wide
   feature rows (nav box, header gradient) and the tag preview span every column. */
.css-designer-container .css-control-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    column-gap: 18px;
    align-items: stretch;
}
.css-designer-container .css-control-grid > .css-feature-row,
.css-designer-container .css-control-grid > .css-feature-subcontrols,
.css-designer-container .css-control-grid > .css-tag-preview-box {
    grid-column: 1 / -1;
}
/* The Colors tab packs into three columns to use the width better; Typography
   keeps two. Declared before the compressed rule so compression still wins. */
.css-designer-container .css-control-grid.css-control-grid-3 {
    grid-template-columns: repeat(3, minmax(0, 1fr));
}
.css-designer-container.is-compressed .css-control-grid {
    grid-template-columns: minmax(0, 1fr);
}
/* Each grid row wraps its description onto its own full-width line beneath the
   control, so it reads in one or two lines instead of a narrow column. */
.css-designer-container .css-control-grid > .css-control-row {
    flex-wrap: wrap;
}
.css-designer-container .css-control-grid > .css-control-row > .css-control-desc-wide {
    flex: 1 1 100%;
    margin: 3px 0 0 0;
}
.css-designer-container .css-control-grid > .css-control-row .css-control-left {
    min-width: 140px;
}
.css-designer-container .css-control-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 0;
    border-bottom: 1px solid var(--background-modifier-border);
    gap: var(--size-4-3, 12px);
    transition: opacity 0.2s ease, filter 0.2s ease;
}
.css-designer-container .css-control-row:last-child {
    border-bottom: none;
}
.css-designer-container .css-control-row.is-disabled {
    opacity: 0.45;
    filter: grayscale(0.5);
}
.css-designer-container .css-control-row.is-disabled .css-control-input {
    pointer-events: none;
}
/* A colour swatch stays clickable on a switched-off row so clicking it can
   turn the row on and open the picker in one gesture. */
.css-designer-container .css-control-row.is-disabled .css-control-input .css-color-picker:not([disabled]) {
    pointer-events: auto;
    cursor: pointer;
}
.css-designer-container .css-control-row.css-feature-row.is-disabled {
    opacity: 0.8;
    filter: none;
}
.css-designer-container .css-control-row.css-feature-row.is-disabled .css-control-input,
.css-designer-container .css-control-row.css-feature-row .css-control-input,
.css-designer-container .css-control-row.is-disabled .css-boolean-toggle-wrap {
    pointer-events: auto;
}
.css-designer-container .css-control-left {
    display: flex;
    align-items: center;
    gap: var(--size-4-3, 12px);
    flex: 1;
    min-width: 180px;
}
.css-designer-container .css-control-toggle-wrap {
    display: flex;
    align-items: center;
}
.css-designer-container .css-control-label {
    display: flex;
    flex-direction: column;
    gap: 1px;
}
.css-designer-container .css-control-title {
    font-size: var(--font-ui-small, 13px);
    font-weight: 500;
    color: var(--text-normal);
}
.css-designer-container .css-control-token {
    font-size: 11px;
    color: var(--text-muted);
    font-family: var(--font-monospace);
    background: transparent;
    padding: 0;
}
.css-designer-container .css-control-input {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: var(--size-4-2, 8px);
    flex: 1.5;
}
.css-designer-container .css-color-picker {
    appearance: none;
    -webkit-appearance: none;
    border: 1px solid var(--background-modifier-border);
    border-radius: var(--radius-s, 4px);
    width: 36px;
    height: 28px;
    cursor: pointer;
    background-color: transparent;
    padding: 0;
}
.css-designer-container .css-color-picker.css-color-picker-mini {
    width: 26px;
    height: 22px;
}
/* A linked colour (e.g. the unfocused top bar following the focused one) is
   marked with a lock icon rather than a boxed row, so the list keeps its rhythm. */
.css-designer-container .css-control-link-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    color: var(--text-accent, #7c3aed);
}
.css-designer-container .css-control-link-badge .svg-icon {
    width: 16px;
    height: 16px;
}
.css-designer-container .css-gradient-picker-group {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin-right: 8px;
    background-color: var(--background-primary);
    border: 1px solid var(--background-modifier-border);
    border-radius: var(--radius-s, 4px);
    padding: 2px 6px;
}
.css-designer-container .css-gradient-picker-item {
    display: inline-flex;
    align-items: center;
    gap: 4px;
}
.css-designer-container .css-gradient-picker-label {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    color: var(--text-muted);
    letter-spacing: 0.05em;
}
.css-designer-container .css-select-input {
    background-color: var(--background-primary);
    color: var(--text-normal);
    border: 1px solid var(--background-modifier-border);
    border-radius: var(--radius-s, 4px);
    padding: 4px 8px;
    font-size: var(--font-ui-small, 12px);
    width: 100%;
    max-width: 280px;
    cursor: pointer;
}
.css-designer-container .css-select-input optgroup {
    background-color: var(--background-secondary, var(--background-primary));
    color: var(--text-accent);
    font-weight: 600;
    font-style: normal;
}
.css-designer-container .css-select-input option {
    background-color: var(--background-primary);
    color: var(--text-normal);
    font-weight: normal;
}
.css-designer-container .css-select-stepper {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    width: 100%;
    max-width: 320px;
    justify-content: flex-end;
}
.css-designer-container .css-select-stepper .css-select-input {
    flex: 1 1 auto;
    min-width: 0;
    max-width: 260px;
}
.css-designer-container .css-select-stepper .css-select-input option {
    font-size: 14px;
    padding: 3px 6px;
}
.css-designer-container .css-select-step-btn,
.css-designer-container .css-ui-bg-step-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
    width: 28px;
    height: 28px;
    padding: 0;
    border: 1px solid var(--background-modifier-border);
    border-radius: var(--radius-s, 4px);
    background-color: var(--background-secondary);
    color: var(--text-muted);
    box-shadow: none;
    cursor: pointer;
    transition: background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease;
}
.css-designer-container .css-select-step-btn:hover,
.css-designer-container .css-ui-bg-step-btn:hover {
    background-color: var(--background-modifier-hover);
    border-color: var(--interactive-accent);
    color: var(--text-accent);
}
.css-designer-container .css-select-step-btn:active,
.css-designer-container .css-ui-bg-step-btn:active {
    background-color: var(--background-modifier-active-hover, var(--background-modifier-hover));
}
.css-designer-container .css-select-step-btn:focus-visible,
.css-designer-container .css-ui-bg-step-btn:focus-visible {
    outline: 2px solid var(--interactive-accent);
    outline-offset: 1px;
}
.css-designer-container .css-select-step-btn:disabled,
.css-designer-container .css-ui-bg-step-btn:disabled {
    cursor: not-allowed;
    opacity: 0.5;
}
.css-designer-container .css-select-step-btn .svg-icon,
.css-designer-container .css-ui-bg-step-btn .svg-icon {
    width: 16px;
    height: 16px;
}
.css-font-picker-modal {
    max-width: 540px;
}
.css-font-suggest-item {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 6px 10px;
}
.css-font-suggest-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
}
.css-font-suggest-name {
    font-size: 15px;
    font-weight: 500;
    color: var(--text-normal);
}
.css-font-suggest-badge {
    font-size: 10px;
    padding: 1px 6px;
    border-radius: 10px;
    background-color: var(--background-modifier-border);
    color: var(--text-muted);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}
.css-font-suggest-sample {
    font-size: 12px;
    color: var(--text-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.css-designer-container .css-ui-bg-stepper {
    display: flex;
    align-items: center;
    gap: 6px;
    flex: 1 1 auto;
    max-width: 340px;
    justify-content: flex-end;
}
.css-designer-container .css-ui-bg-stepper select {
    flex: 1 1 auto;
    min-width: 140px;
    max-width: 260px;
}
@media (max-width: 500px) {
    .css-designer-container .css-ui-bg-pattern-row {
        flex-direction: column;
        align-items: stretch;
        gap: 8px;
    }
    .css-designer-container .css-ui-bg-stepper {
        max-width: 100%;
        justify-content: flex-start;
    }
    .css-designer-container .css-ui-bg-stepper select {
        flex: 1 1 auto;
        min-width: 0;
        max-width: none;
    }
}
.css-designer-container .css-range-slider {
    flex: 1;
    max-width: 180px;
    cursor: pointer;
    accent-color: var(--text-accent);
}
.css-designer-container .css-slider-readout {
    font-family: var(--font-monospace);
    font-size: 12px;
    color: var(--text-muted);
    min-width: 55px;
    text-align: right;
    font-variant-numeric: tabular-nums;
}
.css-designer-container .css-shadow-cards-grid {
    display: flex;
    flex-direction: column;
    gap: 8px;
}
.css-designer-container .css-shadow-card {
    background-color: var(--background-secondary);
    border: 1px solid var(--background-modifier-border);
    border-radius: var(--radius-m, 6px);
    padding: 8px 12px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    transition: border-color 0.15s ease;
    min-width: 0;
}
.css-designer-container .css-shadow-card.is-enabled {
    border-left: 3px solid var(--text-accent) !important;
}
.css-designer-container .css-shadow-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    min-height: 28px;
}
.css-designer-container .css-shadow-card-title-group {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
    flex: 1;
}
.css-designer-container .css-shadow-card-title {
    font-size: 13px;
    font-weight: 600;
    color: var(--text-normal);
}
.css-designer-container .css-shadow-card-desc {
    display: none;
}
.css-designer-container .css-shadow-card-warning {
    font-size: 10.5px;
    color: var(--text-warning, #e5a50a);
    line-height: 1.2;
}
.css-designer-container .css-shadow-card-actions {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
}
.css-designer-container .css-mode-pill-group {
    display: flex;
    gap: 4px;
}
.css-designer-container .css-mode-pill {
    font-size: 11px;
    padding: 2px 8px;
    border-radius: var(--radius-s, 4px);
    cursor: pointer;
    background-color: var(--background-primary);
    border: 1px solid var(--background-modifier-border);
    color: var(--text-muted);
    line-height: 1.4;
}
.css-designer-container .css-mode-pill.is-active {
    background-color: var(--text-accent) !important;
    color: var(--text-on-accent, #ffffff) !important;
    font-weight: 600;
}
/* Settings Menu - Align Section Backgrounds with Secondary Background */
.modal.mod-settings,
.modal.mod-settings .modal-content,
.modal.mod-settings .vertical-tabs-container,
.modal.mod-settings .vertical-tab-header,
.modal.mod-settings .vertical-tab-content-container,
.modal.mod-settings .vertical-tab-content,
.mod-settings .vertical-tab-content,
.vertical-tab-content,
.horizontal-tab-content,
.css-designer-settings-tab,
.modal.mod-settings .community-item,
.modal.mod-settings .modal-setting-nav-bar,
.modal.mod-settings .modal-setting-titlebar,
.modal.mod-settings .setting-item,
.modal.mod-settings .setting-item-heading,
.modal.mod-settings .vertical-tab-header-group,
.modal.mod-settings .vertical-tab-header-group-title,
.modal.mod-settings .vertical-tab-nav-item,
.vertical-tab-header-group,
.vertical-tab-header-group-title,
.vertical-tab-nav-item,
.setting-item,
.setting-item-heading {
    background-color: var(--background-secondary) !important;
}
.modal.mod-settings {
    --modal-background: var(--background-secondary) !important;
    --background-modifier-form-field: var(--background-secondary) !important;
    --background-modifier-form-field-hover: var(--background-secondary) !important;
    --search-bar-background: var(--background-secondary) !important;
    --setting-items-background: var(--background-secondary) !important;
}

/* Settings Menu Search Bars and Tabs (Core Plugins, Hotkeys, Community Plugins) */
.modal.mod-settings .vertical-tab-content:has(.search-input-container),
.modal.mod-settings .vertical-tab-content:has(.setting-group-search),
.modal.mod-settings .vertical-tab-content:has(.setting-group),
.modal.mod-settings .vertical-tab-content:has(input[type="search"]),
.modal.mod-settings .vertical-tab-content:has(.plugin-list-plugins),
.modal.mod-settings .vertical-tab-content:has(.hotkey-list-container),
.modal.mod-settings .vertical-tab-content:has(.installed-plugins-container),
.modal.mod-settings .vertical-tab-content:has(.mod-hotkey),
.vertical-tab-content:has(.search-input-container),
.vertical-tab-content:has(.setting-group-search),
.vertical-tab-content:has(.setting-group),
.vertical-tab-content:has(input[type="search"]),
.vertical-tab-content:has(.plugin-list-plugins),
.vertical-tab-content:has(.hotkey-list-container),
.vertical-tab-content:has(.installed-plugins-container),
.vertical-tab-content:has(.mod-hotkey),
.modal.mod-settings .plugin-list-plugins,
.modal.mod-settings .hotkey-list-container,
.modal.mod-settings .hotkey-settings-container,
.modal.mod-settings .hotkey-header-container,
.modal.mod-settings .hotkey-filter,
.modal.mod-settings .setting-filter-container,
.modal.mod-settings .installed-plugins-container,
.modal.mod-settings .setting-group,
.modal.mod-settings .setting-group-search,
.modal.mod-settings .setting-items,
.plugin-list-plugins,
.hotkey-list-container,
.hotkey-settings-container,
.hotkey-header-container,
.hotkey-filter,
.setting-filter-container,
.installed-plugins-container,
.setting-group,
.setting-group-search,
.setting-items {
    background: var(--background-secondary) !important;
    background-color: var(--background-secondary) !important;
}

/* Search Bar Fill - Search Tab and Settings Menu Search */
.workspace-leaf-content[data-type="search"] .search-input-container,
.workspace-leaf-content[data-type="search"] .search-input-container input,
.workspace-leaf-content[data-type="search"] .search-input-container input:hover,
.workspace-leaf-content[data-type="search"] .search-input-container input:focus,
.workspace-leaf-content[data-type="search"] input[type="search"],
.workspace-leaf-content[data-type="search"] input[type="search"]:hover,
.workspace-leaf-content[data-type="search"] input[type="search"]:focus {
    background-color: var(--search-bar-background, var(--background-secondary)) !important;
}

.modal.mod-settings .setting-group,
.modal.mod-settings .setting-group-search,
.modal.mod-settings .setting-items,
.vertical-tab-content .setting-group,
.vertical-tab-content .setting-group-search,
.vertical-tab-content .setting-items,
.setting-group,
.setting-group-search,
.setting-items,
.modal.mod-settings .search-input-container,
.modal.mod-settings .search-input-container input,
.modal.mod-settings .search-input-container input:hover,
.modal.mod-settings .search-input-container input:focus,
.modal.mod-settings input[type="search"],
.modal.mod-settings input[type="search"]:hover,
.modal.mod-settings input[type="search"]:focus,
.vertical-tab-header .search-input-container,
.vertical-tab-header .search-input-container input,
.vertical-tab-header .search-input-container input:hover,
.vertical-tab-header .search-input-container input:focus,
.vertical-tab-header input[type="search"],
.vertical-tab-header input[type="search"]:hover,
.vertical-tab-header input[type="search"]:focus,
.vertical-tab-content .search-input-container,
.vertical-tab-content .search-input-container input,
.vertical-tab-content .search-input-container input:hover,
.vertical-tab-content .search-input-container input:focus,
.vertical-tab-content input[type="search"],
.vertical-tab-content input[type="search"]:hover,
.vertical-tab-content input[type="search"]:focus {
    background: var(--background-secondary) !important;
    background-color: var(--background-secondary) !important;
}
/* Plugin UI & Settings Menu Toggle Switches - Accent Color in Both Positions & Darkened Off Button */
.css-designer-container .checkbox-container,
.css-tab-config-modal .checkbox-container,
.css-designer-settings-tab .checkbox-container,
.modal.mod-settings .checkbox-container,
.mod-settings .checkbox-container,
.vertical-tab-content .checkbox-container {
    background-color: var(--text-accent) !important;
    border-color: var(--text-accent) !important;
    transition: background-color 0.15s ease, border-color 0.15s ease;
}
.css-designer-container .checkbox-container:hover,
.css-tab-config-modal .checkbox-container:hover,
.css-designer-settings-tab .checkbox-container:hover,
.modal.mod-settings .checkbox-container:hover,
.mod-settings .checkbox-container:hover,
.vertical-tab-content .checkbox-container:hover {
    background-color: var(--interactive-accent-hover, var(--text-accent)) !important;
    border-color: var(--interactive-accent-hover, var(--text-accent)) !important;
    filter: brightness(1.12);
}
.checkbox-container input[type="checkbox"] {
    position: absolute !important;
    opacity: 0 !important;
    pointer-events: none !important;
    width: 0 !important;
    height: 0 !important;
    margin: 0 !important;
    padding: 0 !important;
    border: none !important;
    background: transparent !important;
    outline: none !important;
    box-shadow: none !important;
    appearance: none !important;
    -webkit-appearance: none !important;
}
.checkbox-container input[type="checkbox"]::before,
.checkbox-container input[type="checkbox"]::after {
    display: none !important;
    content: none !important;
    mask-image: none !important;
    -webkit-mask-image: none !important;
}
.css-designer-container .checkbox-container:after,
.css-designer-container .checkbox-container::after,
.css-tab-config-modal .checkbox-container:after,
.css-tab-config-modal .checkbox-container::after,
.css-designer-settings-tab .checkbox-container:after,
.css-designer-settings-tab .checkbox-container::after,
.modal.mod-settings .checkbox-container:after,
.modal.mod-settings .checkbox-container::after,
.mod-settings .checkbox-container:after,
.mod-settings .checkbox-container::after,
.vertical-tab-content .checkbox-container:after,
.vertical-tab-content .checkbox-container::after {
    transition: transform 0.15s ease-in-out, width 0.15s ease-in-out, background-color 0.15s ease-in-out;
}
.css-designer-container .checkbox-container:not(.is-enabled),
.css-tab-config-modal .checkbox-container:not(.is-enabled),
.css-designer-settings-tab .checkbox-container:not(.is-enabled),
.modal.mod-settings .checkbox-container:not(.is-enabled),
.mod-settings .checkbox-container:not(.is-enabled),
.vertical-tab-content .checkbox-container:not(.is-enabled) {
    background-color: var(--text-accent) !important;
    border-color: var(--text-accent) !important;
    --toggle-thumb-color: rgba(0, 0, 0, 0.45);
}
.css-designer-container .checkbox-container:not(.is-enabled):after,
.css-designer-container .checkbox-container:not(.is-enabled)::after,
.css-tab-config-modal .checkbox-container:not(.is-enabled):after,
.css-tab-config-modal .checkbox-container:not(.is-enabled)::after,
.css-designer-settings-tab .checkbox-container:not(.is-enabled):after,
.css-designer-settings-tab .checkbox-container:not(.is-enabled)::after,
.modal.mod-settings .checkbox-container:not(.is-enabled):after,
.modal.mod-settings .checkbox-container:not(.is-enabled)::after,
.mod-settings .checkbox-container:not(.is-enabled):after,
.mod-settings .checkbox-container:not(.is-enabled)::after,
.vertical-tab-content .checkbox-container:not(.is-enabled):after,
.vertical-tab-content .checkbox-container:not(.is-enabled)::after {
    background-color: rgba(0, 0, 0, 0.45) !important;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.35) !important;
}
.css-designer-container .checkbox-container.is-enabled,
.css-tab-config-modal .checkbox-container.is-enabled,
.css-designer-settings-tab .checkbox-container.is-enabled,
.modal.mod-settings .checkbox-container.is-enabled,
.mod-settings .checkbox-container.is-enabled,
.vertical-tab-content .checkbox-container.is-enabled {
    background-color: var(--text-accent) !important;
    border-color: var(--text-accent) !important;
    --toggle-thumb-color: var(--text-on-accent, #ffffff);
}
.css-designer-container .checkbox-container.is-enabled:after,
.css-designer-container .checkbox-container.is-enabled::after,
.css-tab-config-modal .checkbox-container.is-enabled:after,
.css-tab-config-modal .checkbox-container.is-enabled::after,
.css-designer-settings-tab .checkbox-container.is-enabled:after,
.css-designer-settings-tab .checkbox-container.is-enabled::after,
.modal.mod-settings .checkbox-container.is-enabled:after,
.modal.mod-settings .checkbox-container.is-enabled::after,
.mod-settings .checkbox-container.is-enabled:after,
.mod-settings .checkbox-container.is-enabled::after,
.vertical-tab-content .checkbox-container.is-enabled:after,
.vertical-tab-content .checkbox-container.is-enabled::after {
    background-color: var(--text-on-accent, #ffffff) !important;
}
.css-designer-container .css-shadow-card-preview {
    margin: 0;
    padding: 6px 10px;
    border-radius: var(--radius-s, 4px);
    background-color: var(--background-primary);
    border: 1px solid var(--background-modifier-border);
    text-align: center;
    font-weight: 600;
    font-size: 11px;
    color: var(--text-normal);
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease, transform 0.15s ease, filter 0.15s ease, font-weight 0.15s ease;
    overflow: visible;
}
.css-designer-container .css-shadow-card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
    gap: 6px 12px;
    padding-top: 6px;
    border-top: 1px solid var(--background-modifier-border);
}
.css-designer-container .css-shadow-grid-item {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
}
.css-designer-container .css-shadow-grid-item-label {
    font-size: 11px;
    color: var(--text-muted);
    display: flex;
    justify-content: space-between;
    align-items: center;
}
.css-designer-container .css-shadow-grid-item .css-range-slider {
    width: 100%;
    max-width: 100%;
    height: 14px;
    margin: 1px 0;
}
.css-designer-container .css-shadow-grid-item .css-slider-readout {
    font-family: var(--font-monospace);
    font-size: 11px;
    color: var(--text-normal);
    min-width: unset;
}
.css-designer-container .css-shadow-sub-section {
    background-color: var(--background-primary);
    border: 1px solid var(--background-modifier-border);
    border-radius: var(--radius-s, 4px);
    padding: 5px 8px;
    margin-top: 4px;
    display: flex;
    flex-direction: column;
    gap: 4px;
}
.css-designer-container .css-shadow-sub-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 22px;
}
.css-designer-container .css-shadow-sub-title {
    font-size: 11px;
    font-weight: 600;
    color: var(--text-normal);
    display: flex;
    align-items: center;
    gap: 4px;
}
.css-designer-container .css-anim-badge {
    font-size: 9px;
    font-weight: 700;
    font-family: var(--font-monospace);
    color: var(--text-on-accent, #ffffff);
    background-color: var(--interactive-accent);
    padding: 1px 5px;
    border-radius: var(--radius-s, 3px);
    letter-spacing: 0.05em;
}
.css-designer-container .obsidian-preview-headings-box {
    padding: 6px 10px;
    border-radius: var(--radius-s, 4px);
    background-color: var(--background-primary);
    border: 1px solid var(--background-modifier-border);
    text-align: left;
}
.css-designer-container .obsidian-preview-h1 {
    font-size: 1.2em;
    font-weight: 700;
    margin: 0 0 2px 0;
    font-family: var(--font-header, inherit);
    color: var(--text-normal);
}
.css-designer-container .obsidian-preview-h2 {
    font-size: 1.0em;
    font-weight: 600;
    margin: 0;
    color: var(--text-muted);
    font-family: var(--font-header, inherit);
}
.css-designer-container .obsidian-preview-body-box {
    padding: 6px 10px;
    border-radius: var(--radius-s, 4px);
    background-color: var(--background-primary);
    border: 1px solid var(--background-modifier-border);
    text-align: left;
}
.css-designer-container .obsidian-preview-p {
    font-size: 12px;
    line-height: 1.35;
    margin: 0;
    color: var(--text-normal);
    font-family: var(--font-text, inherit);
}
.css-designer-container .obsidian-preview-p .internal-link {
    color: var(--text-accent);
    text-decoration: underline;
    cursor: pointer;
}
.css-designer-container .obsidian-preview-callout {
    background-color: var(--background-primary-alt, rgba(124, 58, 237, 0.08));
    border-left: 3px solid var(--interactive-accent);
    border-radius: var(--radius-s, 4px);
    padding: 5px 8px;
    text-align: left;
    transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease, transform 0.15s ease, filter 0.15s ease, font-weight 0.15s ease;
    position: relative;
    overflow: visible;
}
.css-designer-container .obsidian-callout-title {
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 5px;
    margin-bottom: 2px;
    color: var(--interactive-accent);
    font-size: 11.5px;
}
.css-designer-container .obsidian-callout-content {
    font-size: 11px;
    color: var(--text-muted);
    line-height: 1.3;
}
.css-designer-container .obsidian-preview-codeblock {
    background-color: var(--background-primary-alt, #161616);
    border: 1px solid var(--background-modifier-border);
    border-radius: var(--radius-s, 4px);
    padding: 5px 8px;
    text-align: left;
    font-family: var(--font-monospace);
    margin: 0;
    transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease, transform 0.15s ease, filter 0.15s ease, font-weight 0.15s ease;
    position: relative;
    z-index: 1;
    overflow: visible;
}
.css-designer-container .obsidian-codeblock-header {
    display: flex;
    justify-content: space-between;
    font-size: 9px;
    color: var(--text-muted);
    margin-bottom: 2px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}
.css-designer-container .obsidian-codeblock-pre {
    margin: 0;
    font-size: 11px;
    line-height: 1.3;
    color: var(--text-normal);
}
.css-designer-container .obsidian-codeblock-pre .token-kw { color: #e06c75; font-weight: 600; }
.css-designer-container .obsidian-codeblock-pre .token-fn { color: #61afef; }
.css-designer-container .obsidian-codeblock-pre .token-class { color: #e5c07b; }
.css-designer-container .obsidian-codeblock-pre .token-var { color: #98c379; }
.css-designer-container .obsidian-preview-menu {
    background-color: var(--background-secondary);
    border: 1px solid var(--background-modifier-border);
    border-radius: var(--radius-m, 6px);
    padding: 6px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    max-width: 320px;
    margin: 0 auto;
    text-align: left;
}
.css-designer-container .obsidian-preview-menu-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 5px 10px;
    border-radius: var(--radius-s, 4px);
    font-size: 12px;
    color: var(--text-muted);
    transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease, transform 0.15s ease, filter 0.15s ease, font-weight 0.15s ease;
}
.css-designer-container .obsidian-preview-menu-item.is-hovered {
    color: var(--text-normal);
    background-color: var(--background-modifier-hover);
    font-weight: 500;
    position: relative;
    z-index: 5;
}
.css-designer-container .obsidian-preview-leaf {
    background-color: var(--background-primary);
    border: 1px solid var(--background-modifier-border);
    border-radius: var(--radius-s, 4px);
    overflow: visible;
    text-align: left;
    transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease, transform 0.15s ease, filter 0.15s ease, font-weight 0.15s ease;
}
.css-designer-container .obsidian-leaf-tabbar {
    display: flex;
    align-items: flex-end;
    background-color: var(--background-secondary);
    border-bottom: 1px solid var(--background-modifier-border);
    padding: 3px 6px 0 6px;
    gap: 3px;
}
.css-designer-container .obsidian-leaf-tab {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 2px 8px;
    font-size: 10.5px;
    border-radius: 4px 4px 0 0;
    color: var(--text-muted);
    border: 1px solid transparent;
    border-bottom: 1px solid var(--background-modifier-border);
    margin-bottom: -1px;
    background-color: transparent;
    transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease, transform 0.15s ease, filter 0.15s ease, font-weight 0.15s ease;
}
.css-designer-container .obsidian-leaf-tab.is-active {
    background-color: var(--background-primary);
    color: var(--text-normal);
    font-weight: 600;
    border: 1px solid var(--background-modifier-border);
    border-bottom: 1px solid var(--background-primary);
    border-top: 2px solid var(--text-faint, #9ca3af);
}
.css-designer-container .obsidian-leaf-body {
    padding: 4px 8px;
    font-size: 11px;
    color: var(--text-muted);
    line-height: 1.3;
}
/* Ribbon / sidebar icon buttons preview */
.css-designer-container .obsidian-preview-ribbon {
    display: flex;
    justify-content: center;
    gap: 6px;
    padding: 2px 0;
}
.css-designer-container .obsidian-preview-ribbon-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    font-size: 12px;
    border-radius: var(--radius-s, 4px);
    background-color: var(--background-primary);
    border: 1px solid var(--background-modifier-border);
}
/* File tree previews (arrows, text, row boxes) */
.css-designer-container .obsidian-preview-tree {
    display: flex;
    flex-direction: column;
    gap: 2px;
    text-align: left;
}
.css-designer-container .obsidian-preview-tree-row {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    color: var(--text-muted);
}
.css-designer-container .obsidian-preview-nav-text {
    color: var(--text-normal);
    border-radius: var(--radius-s, 3px);
}
.css-designer-container .obsidian-preview-nav-row {
    display: flex;
    align-items: center;
    padding: 3px 6px;
    font-size: 11px;
    color: var(--text-normal);
    border-radius: var(--radius-s, 4px);
    background-color: var(--background-primary);
    border: 1px solid var(--background-modifier-border);
}
.css-designer-container .obsidian-preview-nav-row.is-active {
    color: var(--text-accent);
    border-color: var(--interactive-accent);
}
/* Canvas card preview */
.css-designer-container .obsidian-preview-canvas {
    padding: 4px;
    border-radius: var(--radius-s, 4px);
    background-color: var(--background-primary);
    border: 1px solid var(--background-modifier-border);
}
.css-designer-container .obsidian-preview-canvas-card {
    padding: 5px 8px;
    border-radius: var(--radius-s, 4px);
    background-color: var(--background-secondary);
    border: 1px solid var(--background-modifier-border);
    text-align: left;
}
.css-designer-container .obsidian-preview-canvas-card-title {
    font-size: 11px;
    font-weight: 600;
    color: var(--text-normal);
    margin-bottom: 1px;
}
.css-designer-container .obsidian-preview-canvas-card-line {
    font-size: 10px;
    color: var(--text-muted);
}
/* Pane divider preview */
.css-designer-container .obsidian-preview-panes {
    display: flex;
    align-items: stretch;
    border-radius: var(--radius-s, 4px);
    overflow: hidden;
}
.css-designer-container .obsidian-preview-pane {
    flex: 1;
    padding: 6px 8px;
    font-size: 10.5px;
    color: var(--text-muted);
    background-color: var(--background-primary);
    text-align: center;
}
.css-designer-container .obsidian-preview-pane-divider {
    width: 2px;
    background-color: var(--background-modifier-border);
}
.css-designer-container .obsidian-preview-resizer-handle {
    width: 4px;
    background-color: var(--interactive-accent, #8a5cf5);
    cursor: col-resize;
    position: relative;
    z-index: 1;
}
.css-designer-container .css-designer-footer {
    display: flex;
    gap: var(--size-4-2, 8px);
    margin-top: var(--size-4-4, 16px);
    padding-top: var(--size-4-3, 12px);
    border-top: 1px solid var(--background-modifier-border);
    flex-wrap: wrap;
}
.css-designer-container .css-designer-footer button.mod-cta,
.css-designer-container button.mod-cta,
.css-designer-container .css-ui-quick-btn.mod-cta,
.css-tab-config-modal button.mod-cta,
.css-preset-modal button.mod-cta,
.modal button.mod-cta {
    background-color: var(--text-accent) !important;
    color: var(--text-on-accent, #ffffff) !important;
    border-color: var(--text-accent) !important;
}
.css-designer-container .css-designer-footer button.mod-cta:hover,
.css-designer-container button.mod-cta:hover,
.css-designer-container .css-ui-quick-btn.mod-cta:hover,
.css-tab-config-modal button.mod-cta:hover,
.css-preset-modal button.mod-cta:hover,
.modal button.mod-cta:hover {
    background-color: var(--interactive-accent-hover, var(--text-accent)) !important;
    border-color: var(--interactive-accent-hover, var(--text-accent)) !important;
    filter: brightness(1.12);
    opacity: 0.95;
}
.css-designer-container .css-designer-footer button.mod-cta:active,
.css-designer-container button.mod-cta:active,
.css-designer-container .css-ui-quick-btn.mod-cta:active {
    filter: brightness(0.95);
    transform: translateY(1px);
}
.css-designer-container .css-feature-row.is-clickable-label .css-control-label {
    cursor: pointer;
    user-select: none;
}
.css-designer-container .css-control-title-row {
    display: flex;
    align-items: center;
    gap: 8px;
}
.css-designer-container .css-control-desc {
    font-size: 11px;
    color: var(--text-muted);
    margin: 2px 0 3px 0;
    line-height: 1.35;
}
.css-designer-container .css-feature-status-badge {
    font-size: 10px;
    font-weight: 700;
    padding: 1px 6px;
    border-radius: var(--radius-s, 4px);
    background-color: var(--background-modifier-border);
    color: var(--text-muted);
    font-family: var(--font-monospace);
    letter-spacing: 0.05em;
    transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease, transform 0.15s ease, filter 0.15s ease, font-weight 0.15s ease;
}
.css-designer-container .css-feature-status-badge.is-active {
    background-color: var(--interactive-accent);
    color: var(--text-on-accent, #ffffff);
}
.css-designer-container .css-feature-preview-section {
    margin-bottom: var(--size-4-4, 16px);
}
.css-designer-container .css-feature-preview-box {
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding: 16px;
    background-color: var(--background-primary);
    border: 1px solid var(--background-modifier-border);
    border-radius: var(--radius-m, 8px);
    transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease, transform 0.15s ease, filter 0.15s ease, font-weight 0.15s ease;
}
.css-designer-container .css-feature-preview-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 14px;
}
.css-designer-container .css-feature-card {
    background-color: var(--background-secondary);
    border: 1px solid var(--background-modifier-border);
    border-radius: var(--radius-s, 6px);
    padding: 10px 12px;
    display: flex;
    flex-direction: column;
    gap: 6px;
}
.css-designer-container .css-feature-card-label {
    font-size: 11px;
    font-weight: 600;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
}
.css-designer-container .feature-preview-h1 {
    font-size: 1.3em;
    font-weight: 700;
    margin: 0;
    color: var(--text-normal);
    transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease, transform 0.15s ease, filter 0.15s ease, font-weight 0.15s ease;
}
.css-designer-container .feature-preview-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 11px;
    text-align: left;
}
.css-designer-container .feature-preview-table th,
.css-designer-container .feature-preview-table td {
    border: 1px solid var(--background-modifier-border);
    transition: padding 0.15s ease;
}
.css-designer-container .feature-preview-table th {
    background-color: var(--background-modifier-hover);
    font-weight: 600;
}
.css-designer-container .feature-preview-code {
    font-family: var(--font-monospace);
    font-size: 11px;
    background-color: var(--background-primary);
    border: 1px solid var(--background-modifier-border);
    border-radius: var(--radius-s, 4px);
    padding: 6px 10px;
    margin: 0;
    line-height: 1.4;
    transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease, transform 0.15s ease, filter 0.15s ease, font-weight 0.15s ease;
}
.css-designer-container .feature-preview-tree {
    display: flex;
    flex-direction: column;
    gap: 3px;
    font-size: 12px;
}
.css-designer-container .feature-preview-folder {
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--text-normal);
    transition: font-weight 0.15s ease;
}
.css-designer-container .feature-preview-file {
    display: flex;
    align-items: center;
    gap: 6px;
    padding-left: 18px;
    font-size: 11px;
    color: var(--text-muted);
}
.css-designer-container .feature-preview-width-box {
    background-color: var(--background-primary);
    border: 1px dashed var(--interactive-accent);
    border-radius: var(--radius-s, 4px);
    padding: 6px 10px;
    text-align: center;
    font-size: 11px;
    color: var(--text-muted);
    transition: width 0.2s ease, max-width 0.2s ease;
    box-sizing: border-box;
}
.css-designer-container .feature-preview-checkbox-box {
    display: flex;
    flex-direction: column;
    gap: 8px;
    background-color: var(--background-primary);
    border: 1px solid var(--background-modifier-border);
    border-radius: var(--radius-s, 4px);
    padding: 8px 12px;
}
.css-designer-container .feature-preview-task-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 11px;
    color: var(--text-normal);
}
.css-designer-container .feature-preview-task-item.is-checked span {
    text-decoration: var(--checklist-done-decoration, line-through);
    color: var(--text-muted);
}
.css-designer-container .feature-preview-checkbox-box input[type="checkbox"].task-list-item-checkbox {
    position: relative;
    cursor: pointer;
    margin: 0;
    vertical-align: middle;
}
.css-designer-container .feature-preview-glass-stage {
    position: relative;
    height: 105px;
    border-radius: var(--radius-m, 8px);
    overflow: hidden;
    background: #090d16;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 10px;
}
.css-designer-container .glass-stage-grid {
    position: absolute;
    inset: 0;
    background-image: linear-gradient(to right, rgba(255, 255, 255, 0.08) 1px, transparent 1px),
                      linear-gradient(to bottom, rgba(255, 255, 255, 0.08) 1px, transparent 1px);
    background-size: 16px 16px;
    pointer-events: none;
}
.css-designer-container .glass-stage-stripe-1 {
    position: absolute;
    width: 140%;
    height: 22px;
    background: linear-gradient(90deg, #ec4899, #f43f5e, #f97316);
    top: 20px;
    left: -20%;
    transform: rotate(-12deg);
    border-radius: 4px;
    box-shadow: 0 0 12px rgba(236, 72, 153, 0.5);
}
.css-designer-container .glass-stage-stripe-2 {
    position: absolute;
    width: 140%;
    height: 22px;
    background: linear-gradient(90deg, #06b6d4, #3b82f6, #8b5cf6);
    bottom: 18px;
    left: -20%;
    transform: rotate(8deg);
    border-radius: 4px;
    box-shadow: 0 0 12px rgba(6, 182, 212, 0.5);
}
.css-designer-container .glass-stage-text-ribbon {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 13px;
    font-weight: 800;
    letter-spacing: 0.2em;
    color: #ffffff;
    white-space: nowrap;
    text-shadow: 0 0 8px rgba(255, 255, 255, 0.6);
    pointer-events: none;
    z-index: 1;
}
.css-designer-container .glass-stage-pill {
    position: absolute;
    border-radius: 12px;
    font-size: 9px;
    font-weight: 700;
    padding: 2px 8px;
    pointer-events: none;
    z-index: 1;
}
.css-designer-container .glass-stage-pill-1 {
    background: #10b981;
    color: #ffffff;
    top: 8px;
    left: 12px;
}
.css-designer-container .glass-stage-pill-2 {
    background: #eab308;
    color: #000000;
    bottom: 8px;
    right: 12px;
}
.css-designer-container .feature-preview-glass-panel {
    position: relative;
    z-index: 3;
    padding: 10px 22px;
    border-radius: 10px;
    text-align: center;
    transition: background-color 0.15s ease, border-color 0.15s ease;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.45);
}
.css-designer-container .glass-panel-title {
    font-size: 13px;
    font-weight: 700;
    color: var(--text-normal);
}
.css-designer-container .glass-panel-desc {
    font-size: 11px;
    color: var(--text-muted);
    margin-top: 3px;
    font-family: var(--font-monospace);
}
.css-designer-container .css-feature-subcontrols {
    margin-top: 8px;
    padding: 10px 14px;
    background-color: var(--background-secondary);
    border: 1px solid var(--background-modifier-border);
    border-radius: var(--radius-m, 6px);
    display: flex;
    flex-direction: column;
    gap: 10px;
    transition: opacity 0.2s ease;
}
.css-designer-container .css-feature-subcontrols.is-disabled {
    opacity: 0.4;
    pointer-events: none;
}
.css-designer-container .css-subcontrol-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
}
.css-designer-container .css-subcontrol-item.is-disabled {
    opacity: 0.5;
}
.css-designer-container .css-subcontrol-label {
    display: flex;
    flex-direction: column;
    gap: 2px;
    font-size: 12px;
    font-weight: 500;
    color: var(--text-normal);
}
.css-designer-container .css-subcontrol-desc {
    font-size: 11px;
    color: var(--text-muted);
    font-weight: 400;
}
.css-designer-container .css-subcontrol-input-wrap {
    display: flex;
    align-items: center;
    gap: 8px;
}
.css-designer-container .css-subcontrol-value-badge {
    font-size: 11px;
    font-family: var(--font-monospace);
    color: var(--interactive-accent);
    min-width: 36px;
    text-align: right;
    font-weight: 600;
}

/* 3-Color Gradient Heading Controls */
.css-designer-container .css-3color-toggle-btn {
    font-size: 10px;
    font-weight: 600;
    padding: 2px 7px;
    border-radius: var(--radius-s, 4px);
    border: 1px solid var(--background-modifier-border);
    background-color: var(--background-secondary);
    color: var(--text-muted);
    cursor: pointer;
    transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease, transform 0.15s ease, filter 0.15s ease, font-weight 0.15s ease;
    white-space: nowrap;
    display: inline-flex;
    align-items: center;
    gap: 3px;
    user-select: none;
}
.css-designer-container .css-3color-toggle-btn:hover {
    color: var(--text-normal) !important;
    border-color: var(--text-accent) !important;
}
.css-designer-container .css-3color-toggle-btn.is-active {
    background-color: var(--text-accent) !important;
    color: var(--text-on-accent, #ffffff) !important;
    border-color: var(--text-accent) !important;
    font-weight: 600;
}
.css-designer-container .css-3color-toggle-btn.is-active:hover {
    background-color: var(--interactive-accent-hover, var(--text-accent)) !important;
    border-color: var(--interactive-accent-hover, var(--text-accent)) !important;
    color: var(--text-on-accent, #ffffff) !important;
    filter: brightness(1.12);
}

/* Feature Subcontrols, Heading Gradient & Glass Controls */
.css-designer-container .css-feature-section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: 0 0 var(--size-4-2, 8px) 0;
}
.css-designer-container .css-feature-section-header.is-clickable-label .css-section-header-left {
    cursor: pointer;
    user-select: none;
}
.css-designer-container .css-feature-section-header .css-designer-section-title {
    margin: 0;
}
.css-designer-container .css-section-header-left {
    display: flex;
    align-items: center;
    gap: 8px;
}
.css-designer-container .css-gradient-header-subcontrols {
    margin-top: 6px;
    margin-bottom: 8px;
    border-left: 3px solid var(--text-accent) !important;
    background-color: var(--background-secondary);
}
.css-designer-container .css-gradient-angle-presets {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 4px;
}
.css-designer-container .css-angle-preset-btn {
    font-size: 11px;
    font-weight: 500;
    padding: 3px 8px;
    border-radius: var(--radius-s, 4px);
    background-color: var(--background-primary);
    border: 1px solid var(--background-modifier-border);
    color: var(--text-muted);
    cursor: pointer;
    transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease, transform 0.15s ease, filter 0.15s ease, font-weight 0.15s ease;
}
.css-designer-container .css-angle-preset-btn:hover {
    color: var(--text-normal) !important;
    border-color: var(--text-accent) !important;
}
.css-designer-container .css-angle-preset-btn.is-active {
    background-color: var(--text-accent) !important;
    color: var(--text-on-accent, #ffffff) !important;
    border-color: var(--text-accent) !important;
    font-weight: 600;
}
.css-designer-container .css-angle-preset-btn.is-active:hover {
    background-color: var(--interactive-accent-hover, var(--text-accent)) !important;
    border-color: var(--interactive-accent-hover, var(--text-accent)) !important;
    color: var(--text-on-accent, #ffffff) !important;
    filter: brightness(1.12);
}
.css-designer-container .css-subcontrol-section-header {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 8px 0 2px 0;
    margin-top: 4px;
    border-top: 1px solid var(--background-modifier-border);
}
.css-designer-container .css-subcontrol-section-header.is-first {
    border-top: none;
    padding-top: 0;
    margin-top: 0;
}
.css-designer-container .css-section-header-title {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-accent);
}
.css-designer-container .css-section-header-desc {
    font-size: 11px;
    color: var(--text-muted);
}
.css-designer-container .css-nav-body-subcontrols,
.css-designer-container .css-nav-gradient-subcontrols {
    display: flex;
    flex-direction: column;
    gap: 10px;
    transition: opacity 0.2s ease;
}
.css-designer-container .css-nav-body-subcontrols.is-disabled,
.css-designer-container .css-nav-gradient-subcontrols.is-disabled {
    opacity: 0.45;
    pointer-events: none;
}
.css-designer-container .css-ui-glass-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
}
.css-designer-container .css-glass-subcontrols {
    margin-top: 6px;
    margin-bottom: 8px;
    border-left: 3px solid var(--text-accent) !important;
    background-color: var(--background-secondary);
}
.css-designer-container .css-glass-subcontrols.is-disabled {
    opacity: 0.75;
}
.css-designer-container .css-glass-subcontrols .css-slider {
    pointer-events: auto !important;
}
.css-designer-container .css-subcontrol-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
}
.css-designer-container .css-subcontrol-label {
    display: flex;
    flex-direction: column;
    gap: 2px;
    font-size: 12px;
    font-weight: 500;
    color: var(--text-normal);
}
.css-designer-container .css-subcontrol-desc {
    font-size: 11px;
    color: var(--text-muted);
    font-weight: normal;
}
.css-designer-container .css-subcontrol-input-wrap {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
}
.css-designer-container .css-subcontrol-value-badge {
    font-size: 11px;
    font-family: var(--font-monospace);
    color: var(--text-muted);
    min-width: 42px;
}
.css-designer-container .css-glass-tint-picker-item {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    transition: opacity 0.15s ease;
}
.css-designer-container .css-glass-tint-picker-item.is-disabled {
    opacity: 0.4;
    pointer-events: none;
}
.css-designer-container .css-glass-tint-hex {
    font-size: 11px;
    font-family: var(--font-monospace);
    color: var(--text-muted);
    cursor: pointer;
}
/* Live Tag Pills Preview Widget */
.css-designer-container .css-tag-preview-box {
    margin: 10px 0 16px 0;
}
.css-designer-container .css-tag-preview-card {
    background: var(--background-secondary);
    border: 1px solid var(--background-modifier-border);
    border-radius: var(--radius-m, 8px);
    padding: 14px 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
}
.css-designer-container .css-tag-preview-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}
.css-designer-container .css-tag-preview-title {
    font-size: 11px;
    font-weight: 600;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
}
.css-designer-container .css-tag-preview-badge {
    font-size: 11px;
    font-family: var(--font-monospace);
    color: var(--interactive-accent);
    background: var(--background-primary);
    padding: 2px 8px;
    border-radius: var(--radius-s, 4px);
    border: 1px solid var(--background-modifier-border);
}
.css-designer-container .css-tag-preview-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
    padding: 6px 0;
}
.css-designer-container .css-preview-tag-pill {
    font-size: var(--preview-tag-size, 11px);
    color: var(--preview-tag-color, #c084fc);
    background-color: var(--preview-tag-bg, #3b1a54);
    border-radius: var(--preview-tag-radius, 12px);
    padding: var(--preview-tag-padding-y, 2px) var(--preview-tag-padding-x, 8px);
    line-height: 1.2;
    display: inline-block;
    text-decoration: none;
    font-weight: 500;
    transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease, transform 0.15s ease, filter 0.15s ease, font-weight 0.15s ease;
}
.css-designer-container .css-preview-cm-tag-wrap {
    display: inline-flex;
    align-items: center;
    line-height: 1.2;
}
.css-designer-container .css-preview-cm-tag-wrap .cm-hashtag {
    font-size: var(--preview-tag-size, 11px);
    color: var(--preview-tag-color, #c084fc);
    background-color: var(--preview-tag-bg, #3b1a54);
    padding-top: var(--preview-tag-padding-y, 2px);
    padding-bottom: var(--preview-tag-padding-y, 2px);
    font-weight: 500;
    line-height: 1.2;
    display: inline-block;
    transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease, transform 0.15s ease, filter 0.15s ease, font-weight 0.15s ease;
}
.css-designer-container .css-preview-cm-begin {
    border-top-left-radius: var(--preview-tag-radius, 12px);
    border-bottom-left-radius: var(--preview-tag-radius, 12px);
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
    padding-left: var(--preview-tag-padding-x, 8px);
    padding-right: 0;
}
.css-designer-container .css-preview-cm-mid {
    border-radius: 0;
    padding-left: 0;
    padding-right: 0;
}
.css-designer-container .css-preview-cm-end {
    border-top-right-radius: var(--preview-tag-radius, 12px);
    border-bottom-right-radius: var(--preview-tag-radius, 12px);
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
    padding-right: var(--preview-tag-padding-x, 8px);
    padding-left: 0;
}

/* Navigation Tree Box & Gradient Preview and Controls */
.css-designer-container .css-nav-tree-preview-box {
    margin: 10px 0 16px 0;
}
.css-designer-container .css-nav-tree-preview-card {
    background: var(--background-secondary);
    border: 1px solid var(--background-modifier-border);
    border-radius: var(--radius-m, 8px);
    padding: 14px 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
}
.css-designer-container .css-nav-tree-preview-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid var(--background-modifier-border);
    padding-bottom: 8px;
}
.css-designer-container .css-nav-tree-preview-title {
    font-size: 12px;
    font-weight: 600;
    color: var(--text-normal);
}
.css-designer-container .css-nav-tree-preview-badge {
    font-size: 10.5px;
    font-weight: 600;
    color: var(--text-accent);
    background-color: var(--background-primary);
    border: 1px solid var(--background-modifier-border);
    border-radius: var(--radius-s, 4px);
    padding: 2px 8px;
    font-family: var(--font-monospace);
}
.css-designer-container .nav-tree-preview-content {
    display: flex;
    flex-direction: column;
    gap: 2px;
    font-size: var(--preview-nav-font-size, 13px);
}
.css-designer-container .nav-tree-preview-folder {
    display: flex;
    flex-direction: column;
}
.css-designer-container .nav-tree-preview-folder-title,
.css-designer-container .nav-tree-preview-file-title {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 5px 8px;
    color: var(--preview-nav-text-color, var(--text-muted));
    background-color: var(--preview-nav-box-bg, transparent);
    background-image: var(--preview-nav-box-gradient, none);
    border: var(--preview-nav-box-border, 1px solid transparent);
    border-radius: var(--preview-nav-box-radius, var(--radius-s, 4px));
    margin-top: var(--preview-nav-box-margin, 0px);
    margin-bottom: var(--preview-nav-box-margin, 0px);
    box-shadow: var(--preview-nav-box-shadow, none);
    cursor: pointer;
    transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease, transform 0.15s ease, filter 0.15s ease, font-weight 0.15s ease;
    user-select: none;
}
.css-designer-container .nav-tree-preview-card .nav-tree-preview-folder-title.is-item-1,
.css-designer-container .nav-tree-preview-card .nav-tree-preview-file-title.is-item-1 {
    background-color: var(--preview-nav-item-1-bg, var(--preview-nav-box-bg, transparent)) !important;
    border-color: var(--preview-nav-item-1-border, var(--preview-nav-box-border-color, transparent)) !important;
    background-image: none !important;
}
.css-designer-container .nav-tree-preview-card .nav-tree-preview-folder-title.is-item-2,
.css-designer-container .nav-tree-preview-card .nav-tree-preview-file-title.is-item-2 {
    background-color: var(--preview-nav-item-2-bg, var(--preview-nav-box-bg, transparent)) !important;
    border-color: var(--preview-nav-item-2-border, var(--preview-nav-box-border-color, transparent)) !important;
    background-image: none !important;
}
.css-designer-container .nav-tree-preview-card .nav-tree-preview-folder-title.is-item-3,
.css-designer-container .nav-tree-preview-card .nav-tree-preview-file-title.is-item-3 {
    background-color: var(--preview-nav-item-3-bg, var(--preview-nav-box-bg, transparent)) !important;
    border-color: var(--preview-nav-item-3-border, var(--preview-nav-box-border-color, transparent)) !important;
    background-image: none !important;
}
.css-designer-container .nav-tree-preview-card .nav-tree-preview-folder-title.is-item-4,
.css-designer-container .nav-tree-preview-card .nav-tree-preview-file-title.is-item-4 {
    background-color: var(--preview-nav-item-4-bg, var(--preview-nav-box-bg, transparent)) !important;
    border-color: var(--preview-nav-item-4-border, var(--preview-nav-box-border-color, transparent)) !important;
    background-image: none !important;
}
.css-designer-container .nav-tree-preview-card .nav-tree-preview-folder-title.is-item-5,
.css-designer-container .nav-tree-preview-card .nav-tree-preview-file-title.is-item-5 {
    background-color: var(--preview-nav-item-5-bg, var(--preview-nav-box-bg, transparent)) !important;
    border-color: var(--preview-nav-item-5-border, var(--preview-nav-box-border-color, transparent)) !important;
    background-image: none !important;
}
.css-designer-container .nav-tree-preview-card .nav-tree-preview-folder-title.is-item-6,
.css-designer-container .nav-tree-preview-card .nav-tree-preview-file-title.is-item-6 {
    background-color: var(--preview-nav-item-6-bg, var(--preview-nav-box-bg, transparent)) !important;
    border-color: var(--preview-nav-item-6-border, var(--preview-nav-box-border-color, transparent)) !important;
    background-image: none !important;
}
.css-designer-container .nav-tree-preview-card .nav-tree-preview-children .nav-tree-preview-folder-title,
.css-designer-container .nav-tree-preview-card .nav-tree-preview-children .nav-tree-preview-file-title {
    background-color: var(--preview-nav-subfolder-bg, transparent) !important;
    background-image: none !important;
    border: var(--preview-nav-subfolder-border, 1px solid transparent) !important;
    border-color: var(--preview-nav-subfolder-border-color, transparent) !important;
    margin-top: var(--preview-nav-subfolder-margin, 0px) !important;
    margin-bottom: var(--preview-nav-subfolder-margin, 0px) !important;
    box-shadow: var(--preview-nav-subfolder-shadow, none) !important;
}
.css-designer-container .css-nav-discrete-spectrum {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 8px 10px;
    background: var(--background-secondary);
    border: 1px solid var(--background-modifier-border);
    border-radius: var(--radius-m, 6px);
    margin: 8px 0;
    overflow-x: auto;
}
.css-designer-container .css-nav-discrete-spectrum.is-hidden {
    display: none !important;
}
.css-designer-container .css-nav-discrete-step {
    flex: 1;
    min-width: 28px;
    height: 24px;
    border-radius: var(--radius-s, 4px);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    font-weight: 600;
    color: var(--text-on-accent, #fff);
    border: 1px solid rgba(255, 255, 255, 0.2);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
    user-select: none;
}
.css-designer-container .css-heading-discrete-step {
    min-width: 44px;
    height: 28px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.5px;
}
.css-designer-container .css-heading-discrete-spectrum {
    background: var(--background-primary);
    margin: 8px 0 4px 0;
}
.css-designer-container .nav-tree-preview-folder-title:hover,
.css-designer-container .nav-tree-preview-file-title:hover {
    filter: brightness(1.08);
}
.css-designer-container .nav-tree-preview-folder-title.is-active,
.css-designer-container .nav-tree-preview-file-title.is-active {
    color: var(--preview-nav-active-color, var(--interactive-accent));
    font-weight: 600;
}
.css-designer-container .nav-tree-arrow {
    font-size: 9px;
    width: 12px;
    color: var(--text-muted);
}
.css-designer-container .nav-tree-folder-name,
.css-designer-container .nav-file-title-content {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
.css-designer-container .nav-tree-preview-children {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding-left: 18px;
    margin-left: 6px;
    border-left: 1px solid var(--preview-nav-guide-color, var(--background-modifier-border));
}
.css-designer-container .css-nav-box-subcontrols {
    margin-top: 6px;
    margin-bottom: 8px;
    border-left: 3px solid var(--text-accent) !important;
    background-color: var(--background-secondary);
}
.css-designer-container .css-nav-box-subcontrols.is-disabled,
.css-designer-container .css-nav-box-subcontrols.is-collapsed {
    display: none;
}
.css-designer-container .css-gradient-stops-row {
    display: flex;
    gap: 16px;
    align-items: center;
    flex-wrap: wrap;
}
.css-designer-container .css-gradient-stop-item {
    display: flex;
    align-items: center;
    gap: 8px;
}
.css-designer-container .css-stop-label {
    font-size: 11px;
    color: var(--text-muted);
    font-weight: 500;
}

/* Editor Spellcheck & Grammar Error Text Color Preservation */
::spelling-error,
*::spelling-error,
.theme-dark ::spelling-error,
.theme-dark::spelling-error,
.theme-light ::spelling-error,
.theme-light::spelling-error,
.cm-content ::spelling-error,
.cm-line ::spelling-error,
.cm-line::spelling-error,
.markdown-rendered ::spelling-error,
.markdown-source-view ::spelling-error {
    color: var(--text-normal) !important;
    -webkit-text-fill-color: var(--text-normal) !important;
    text-decoration-color: var(--spellcheck-underline-color, #e05252) !important;
}

/* Headings H1 & Inline Title - Spellcheck */
.cm-header-1::spelling-error,
.cm-header-1 ::spelling-error,
.HyperMD-header-1::spelling-error,
.HyperMD-header-1 ::spelling-error,
.cm-line.HyperMD-header-1 ::spelling-error,
.markdown-rendered h1::spelling-error,
.markdown-rendered h1 ::spelling-error,
.inline-title::spelling-error,
.inline-title ::spelling-error,
.cm-header-1.cm-spell-error,
.cm-header-1 .cm-spell-error,
.cm-header-1.cm-spellcheck,
.cm-header-1 .cm-spellcheck,
.cm-header-1.cm-spell-check,
.cm-header-1 .cm-spell-check,
.HyperMD-header-1 .cm-spell-error,
.HyperMD-header-1 .cm-spellcheck,
.HyperMD-header-1 .cm-spell-check,
.markdown-rendered h1 .cm-spell-error,
.markdown-rendered h1 .cm-spellcheck,
.markdown-rendered h1 .cm-spell-check,
.inline-title .cm-spell-error,
.inline-title .cm-spellcheck,
.inline-title .cm-spell-check {
    color: var(--h1-gradient-color, var(--h1-color, var(--inline-title-color, currentColor))) !important;
    -webkit-text-fill-color: var(--h1-gradient-color, var(--h1-color, var(--inline-title-color, currentColor))) !important;
    text-decoration-color: var(--spellcheck-underline-color, #e05252) !important;
}

/* Headings H2 - Spellcheck */
.cm-header-2::spelling-error,
.cm-header-2 ::spelling-error,
.HyperMD-header-2::spelling-error,
.HyperMD-header-2 ::spelling-error,
.cm-line.HyperMD-header-2 ::spelling-error,
.markdown-rendered h2::spelling-error,
.markdown-rendered h2 ::spelling-error,
.cm-header-2.cm-spell-error,
.cm-header-2 .cm-spell-error,
.cm-header-2.cm-spellcheck,
.cm-header-2 .cm-spellcheck,
.cm-header-2.cm-spell-check,
.cm-header-2 .cm-spell-check,
.HyperMD-header-2 .cm-spell-error,
.HyperMD-header-2 .cm-spellcheck,
.HyperMD-header-2 .cm-spell-check,
.markdown-rendered h2 .cm-spell-error,
.markdown-rendered h2 .cm-spellcheck,
.markdown-rendered h2 .cm-spell-check {
    color: var(--h2-gradient-color, var(--h2-color, currentColor)) !important;
    -webkit-text-fill-color: var(--h2-gradient-color, var(--h2-color, currentColor)) !important;
    text-decoration-color: var(--spellcheck-underline-color, #e05252) !important;
}

/* Headings H3 - Spellcheck */
.cm-header-3::spelling-error,
.cm-header-3 ::spelling-error,
.HyperMD-header-3::spelling-error,
.HyperMD-header-3 ::spelling-error,
.cm-line.HyperMD-header-3 ::spelling-error,
.markdown-rendered h3::spelling-error,
.markdown-rendered h3 ::spelling-error,
.cm-header-3.cm-spell-error,
.cm-header-3 .cm-spell-error,
.cm-header-3.cm-spellcheck,
.cm-header-3 .cm-spellcheck,
.cm-header-3.cm-spell-check,
.cm-header-3 .cm-spell-check,
.HyperMD-header-3 .cm-spell-error,
.HyperMD-header-3 .cm-spellcheck,
.HyperMD-header-3 .cm-spell-check,
.markdown-rendered h3 .cm-spell-error,
.markdown-rendered h3 .cm-spellcheck,
.markdown-rendered h3 .cm-spell-check {
    color: var(--h3-gradient-color, var(--h3-color, currentColor)) !important;
    -webkit-text-fill-color: var(--h3-gradient-color, var(--h3-color, currentColor)) !important;
    text-decoration-color: var(--spellcheck-underline-color, #e05252) !important;
}

/* Headings H4 - Spellcheck */
.cm-header-4::spelling-error,
.cm-header-4 ::spelling-error,
.HyperMD-header-4::spelling-error,
.HyperMD-header-4 ::spelling-error,
.cm-line.HyperMD-header-4 ::spelling-error,
.markdown-rendered h4::spelling-error,
.markdown-rendered h4 ::spelling-error,
.cm-header-4.cm-spell-error,
.cm-header-4 .cm-spell-error,
.cm-header-4.cm-spellcheck,
.cm-header-4 .cm-spellcheck,
.cm-header-4.cm-spell-check,
.cm-header-4 .cm-spell-check,
.HyperMD-header-4 .cm-spell-error,
.HyperMD-header-4 .cm-spellcheck,
.HyperMD-header-4 .cm-spell-check,
.markdown-rendered h4 .cm-spell-error,
.markdown-rendered h4 .cm-spellcheck,
.markdown-rendered h4 .cm-spell-check {
    color: var(--h4-gradient-color, var(--h4-color, currentColor)) !important;
    -webkit-text-fill-color: var(--h4-gradient-color, var(--h4-color, currentColor)) !important;
    text-decoration-color: var(--spellcheck-underline-color, #e05252) !important;
}

/* Headings H5 - Spellcheck */
.cm-header-5::spelling-error,
.cm-header-5 ::spelling-error,
.HyperMD-header-5::spelling-error,
.HyperMD-header-5 ::spelling-error,
.cm-line.HyperMD-header-5 ::spelling-error,
.markdown-rendered h5::spelling-error,
.markdown-rendered h5 ::spelling-error,
.cm-header-5.cm-spell-error,
.cm-header-5 .cm-spell-error,
.cm-header-5.cm-spellcheck,
.cm-header-5 .cm-spellcheck,
.cm-header-5.cm-spell-check,
.cm-header-5 .cm-spell-check,
.HyperMD-header-5 .cm-spell-error,
.HyperMD-header-5 .cm-spellcheck,
.HyperMD-header-5 .cm-spell-check,
.markdown-rendered h5 .cm-spell-error,
.markdown-rendered h5 .cm-spellcheck,
.markdown-rendered h5 .cm-spell-check {
    color: var(--h5-gradient-color, var(--h5-color, currentColor)) !important;
    -webkit-text-fill-color: var(--h5-gradient-color, var(--h5-color, currentColor)) !important;
    text-decoration-color: var(--spellcheck-underline-color, #e05252) !important;
}

/* Headings H6 - Spellcheck */
.cm-header-6::spelling-error,
.cm-header-6 ::spelling-error,
.HyperMD-header-6::spelling-error,
.HyperMD-header-6 ::spelling-error,
.cm-line.HyperMD-header-6 ::spelling-error,
.markdown-rendered h6::spelling-error,
.markdown-rendered h6 ::spelling-error,
.cm-header-6.cm-spell-error,
.cm-header-6 .cm-spell-error,
.cm-header-6.cm-spellcheck,
.cm-header-6 .cm-spellcheck,
.cm-header-6.cm-spell-check,
.cm-header-6 .cm-spell-check,
.HyperMD-header-6 .cm-spell-error,
.HyperMD-header-6 .cm-spellcheck,
.HyperMD-header-6 .cm-spell-check,
.markdown-rendered h6 .cm-spell-error,
.markdown-rendered h6 .cm-spellcheck,
.markdown-rendered h6 .cm-spell-check {
    color: var(--h6-gradient-color, var(--h6-color, currentColor)) !important;
    -webkit-text-fill-color: var(--h6-gradient-color, var(--h6-color, currentColor)) !important;
    text-decoration-color: var(--spellcheck-underline-color, #e05252) !important;
}

/* Generic Headings & Live Preview Heading Lines Fallback - Spellcheck */
.cm-header::spelling-error,
.cm-header ::spelling-error,
.HyperMD-header::spelling-error,
.HyperMD-header ::spelling-error,
.cm-header.cm-spell-error,
.cm-header .cm-spell-error,
.cm-header.cm-spellcheck,
.cm-header .cm-spellcheck,
.HyperMD-header .cm-spell-error,
.HyperMD-header .cm-spellcheck {
    color: currentColor !important;
    -webkit-text-fill-color: currentColor !important;
    text-decoration-color: var(--spellcheck-underline-color, #e05252) !important;
}

.cm-hmd-internal-link::spelling-error,
.cm-hmd-internal-link ::spelling-error,
a.internal-link::spelling-error,
a.internal-link ::spelling-error,
.cm-link::spelling-error,
.cm-link ::spelling-error,
a.external-link::spelling-error,
a.external-link ::spelling-error {
    color: var(--link-color, var(--text-accent)) !important;
    -webkit-text-fill-color: var(--link-color, var(--text-accent)) !important;
    text-decoration-color: var(--spellcheck-underline-color, #e05252) !important;
}

.cm-hashtag::spelling-error,
.cm-hashtag ::spelling-error,
a.tag::spelling-error,
a.tag ::spelling-error {
    color: var(--tag-color, var(--text-accent)) !important;
    -webkit-text-fill-color: var(--tag-color, var(--text-accent)) !important;
    text-decoration-color: var(--spellcheck-underline-color, #e05252) !important;
}

.cm-inline-code::spelling-error,
.cm-inline-code ::spelling-error,
code::spelling-error,
code ::spelling-error {
    color: var(--code-normal, var(--text-normal)) !important;
    -webkit-text-fill-color: var(--code-normal, var(--text-normal)) !important;
    text-decoration-color: var(--spellcheck-underline-color, #e05252) !important;
}

/* Grammar Error Preservation */
::grammar-error,
*::grammar-error,
.theme-dark ::grammar-error,
.theme-dark::grammar-error,
.theme-light ::grammar-error,
.theme-light::grammar-error,
.cm-content ::grammar-error,
.cm-line ::grammar-error,
.cm-line::grammar-error,
.markdown-rendered ::grammar-error,
.markdown-source-view ::grammar-error {
    color: var(--text-normal) !important;
    -webkit-text-fill-color: var(--text-normal) !important;
    text-decoration-color: var(--grammar-underline-color, #f59e0b) !important;
}

/* Headings H1 & Inline Title - Grammar */
.cm-header-1::grammar-error,
.cm-header-1 ::grammar-error,
.HyperMD-header-1::grammar-error,
.HyperMD-header-1 ::grammar-error,
.cm-line.HyperMD-header-1 ::grammar-error,
.markdown-rendered h1::grammar-error,
.markdown-rendered h1 ::grammar-error,
.inline-title::grammar-error,
.inline-title ::grammar-error {
    color: var(--h1-gradient-color, var(--h1-color, var(--inline-title-color, currentColor))) !important;
    -webkit-text-fill-color: var(--h1-gradient-color, var(--h1-color, var(--inline-title-color, currentColor))) !important;
    text-decoration-color: var(--grammar-underline-color, #f59e0b) !important;
}

/* Headings H2 - Grammar */
.cm-header-2::grammar-error,
.cm-header-2 ::grammar-error,
.HyperMD-header-2::grammar-error,
.HyperMD-header-2 ::grammar-error,
.cm-line.HyperMD-header-2 ::grammar-error,
.markdown-rendered h2::grammar-error,
.markdown-rendered h2 ::grammar-error {
    color: var(--h2-gradient-color, var(--h2-color, currentColor)) !important;
    -webkit-text-fill-color: var(--h2-gradient-color, var(--h2-color, currentColor)) !important;
    text-decoration-color: var(--grammar-underline-color, #f59e0b) !important;
}

/* Headings H3 - Grammar */
.cm-header-3::grammar-error,
.cm-header-3 ::grammar-error,
.HyperMD-header-3::grammar-error,
.HyperMD-header-3 ::grammar-error,
.cm-line.HyperMD-header-3 ::grammar-error,
.markdown-rendered h3::grammar-error,
.markdown-rendered h3 ::grammar-error {
    color: var(--h3-gradient-color, var(--h3-color, currentColor)) !important;
    -webkit-text-fill-color: var(--h3-gradient-color, var(--h3-color, currentColor)) !important;
    text-decoration-color: var(--grammar-underline-color, #f59e0b) !important;
}

/* Headings H4 - Grammar */
.cm-header-4::grammar-error,
.cm-header-4 ::grammar-error,
.HyperMD-header-4::grammar-error,
.HyperMD-header-4 ::grammar-error,
.cm-line.HyperMD-header-4 ::grammar-error,
.markdown-rendered h4::grammar-error,
.markdown-rendered h4 ::grammar-error {
    color: var(--h4-gradient-color, var(--h4-color, currentColor)) !important;
    -webkit-text-fill-color: var(--h4-gradient-color, var(--h4-color, currentColor)) !important;
    text-decoration-color: var(--grammar-underline-color, #f59e0b) !important;
}

/* Headings H5 - Grammar */
.cm-header-5::grammar-error,
.cm-header-5 ::grammar-error,
.HyperMD-header-5::grammar-error,
.HyperMD-header-5 ::grammar-error,
.cm-line.HyperMD-header-5 ::grammar-error,
.markdown-rendered h5::grammar-error,
.markdown-rendered h5 ::grammar-error {
    color: var(--h5-gradient-color, var(--h5-color, currentColor)) !important;
    -webkit-text-fill-color: var(--h5-gradient-color, var(--h5-color, currentColor)) !important;
    text-decoration-color: var(--grammar-underline-color, #f59e0b) !important;
}

/* Headings H6 - Grammar */
.cm-header-6::grammar-error,
.cm-header-6 ::grammar-error,
.HyperMD-header-6::grammar-error,
.HyperMD-header-6 ::grammar-error,
.cm-line.HyperMD-header-6 ::grammar-error,
.markdown-rendered h6::grammar-error,
.markdown-rendered h6 ::grammar-error {
    color: var(--h6-gradient-color, var(--h6-color, currentColor)) !important;
    -webkit-text-fill-color: var(--h6-gradient-color, var(--h6-color, currentColor)) !important;
    text-decoration-color: var(--grammar-underline-color, #f59e0b) !important;
}

/* Generic Headings - Grammar */
.cm-header::grammar-error,
.cm-header ::grammar-error,
.HyperMD-header::grammar-error,
.HyperMD-header ::grammar-error {
    color: currentColor !important;
    -webkit-text-fill-color: currentColor !important;
    text-decoration-color: var(--grammar-underline-color, #f59e0b) !important;
}

.cm-spell-error,
.cm-spellcheck,
.cm-spell-check {
    color: var(--text-normal) !important;
    -webkit-text-fill-color: var(--text-normal) !important;
    text-decoration-color: var(--spellcheck-underline-color, #e05252) !important;
}

/* --- UI Elements Tab Styles --- */
.css-designer-container .css-ui-bg-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
}
.css-designer-container .css-ui-bg-pattern-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    background-color: var(--background-secondary);
    border: 1px solid var(--background-modifier-border);
    border-radius: var(--radius-s, 6px);
    padding: 8px 12px;
    margin-top: 10px;
    margin-bottom: 2px;
}
.css-designer-container .css-ui-bg-pattern-row .css-ui-bg-label-group {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
}
.css-designer-container .css-ui-bg-pattern-row .css-ui-bg-label-title {
    font-size: 13px;
    font-weight: 700;
    color: var(--text-normal);
}
.css-designer-container .css-ui-bg-style-position {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.04em;
    color: var(--text-muted);
    white-space: nowrap;
}
.css-designer-container .css-ui-master-box,
.css-designer-container .css-ui-bg-field {
    background-color: var(--background-secondary);
    border: 1px solid var(--background-modifier-border);
    border-radius: var(--radius-m, 8px);
    padding: 14px 16px;
    margin: 12px 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
}
.css-designer-container .css-ui-bg-category-section {
    margin-top: 12px;
}
.css-designer-container .css-ui-bg-category-section.css-ui-bg-animated-section {
    margin-top: 16px;
    padding-top: 14px;
    border-top: 1px solid var(--background-modifier-border);
}
.css-designer-container .css-ui-bg-subheader {
    margin-bottom: 6px;
}
.css-designer-container .css-ui-bg-subheading {
    font-size: var(--font-ui-medium, 13px);
    font-weight: 600;
}
.css-designer-container .css-control-disclaimer-note.is-collapsed {
    display: none;
}
.css-designer-container .css-ui-bg-subcontrols.is-collapsed {
    display: none;
}
.css-designer-container .css-ui-bg-stepper.is-disabled {
    opacity: 0.45;
    pointer-events: none;
    filter: grayscale(0.5);
}
.css-designer-container .css-control-disclaimer-warning {
    margin-top: 4px;
    font-size: 11.5px;
    line-height: 1.35;
    color: var(--color-yellow, #eab308);
    background-color: rgba(var(--color-yellow-rgb, 234, 179, 8), 0.1);
    padding: 4px 8px;
    border-radius: var(--radius-s, 4px);
    border: 1px solid rgba(var(--color-yellow-rgb, 234, 179, 8), 0.25);
    display: inline-flex;
    align-items: center;
    gap: 4px;
}
.css-designer-container .css-ui-master-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 8px;
}
.css-designer-container .css-ui-master-title {
    font-size: 13px;
    font-weight: 700;
    color: var(--text-normal);
}
.css-designer-container .css-opacity-badge {
    display: inline-flex;
    align-items: center;
    padding: 3px 8px;
    border-radius: var(--radius-s, 4px);
    font-size: 11px;
    font-weight: 600;
    font-family: var(--font-monospace);
    background-color: var(--background-modifier-hover);
    color: var(--text-accent);
    border: 1px solid var(--background-modifier-border);
    flex-shrink: 0;
    white-space: nowrap;
    transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease, transform 0.2s ease, filter 0.2s ease, font-weight 0.2s ease;
}
.css-designer-container .css-opacity-badge.is-hidden {
    background-color: rgba(239, 68, 68, 0.18);
    color: #ef4444;
    border-color: rgba(239, 68, 68, 0.4);
    font-weight: 700;
}
.css-designer-container .css-ui-master-slider-row {
    display: flex;
    align-items: center;
    width: 100%;
}
.css-designer-container .css-ui-master-slider {
    flex: 1;
    height: 8px;
    accent-color: var(--text-accent) !important;
    cursor: pointer;
}
.css-designer-container .css-ui-master-slider:hover,
.css-designer-container .css-ui-master-slider:focus-visible {
    outline: 2px solid var(--text-accent) !important;
    outline-offset: 2px !important;
}
.css-designer-container .css-ui-master-actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
}
.css-designer-container .css-ui-quick-btn {
    font-size: 11px;
    padding: 4px 10px;
    border-radius: var(--radius-s, 4px);
    cursor: pointer;
}
.css-designer-container .css-ui-presets-container {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin: 10px 0;
}
.css-designer-container .css-ui-presets-label {
    font-size: 11px;
    font-weight: 600;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
}
.css-designer-container .css-ui-presets-row {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
}
.css-designer-container .css-ui-preset-pill {
    background-color: var(--background-secondary);
    border: 1px solid var(--background-modifier-border);
    border-radius: 16px;
    padding: 5px 12px;
    font-size: 11px;
    font-weight: 600;
    color: var(--text-normal);
    cursor: pointer;
    transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease, transform 0.15s ease, filter 0.15s ease, font-weight 0.15s ease;
}
.css-designer-container .css-ui-preset-pill:hover {
    background-color: var(--text-accent) !important;
    color: var(--text-on-accent, #ffffff) !important;
    border-color: var(--text-accent) !important;
    transform: translateY(-1px);
}
.css-designer-container .css-ui-global-row {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
    background-color: var(--background-secondary);
    border: 1px solid var(--background-modifier-border);
    border-radius: var(--radius-m, 8px);
    padding: 10px 14px;
    align-items: center;
    margin-top: 8px;
}
.css-designer-container .css-ui-global-item {
    display: flex;
    align-items: center;
    gap: 10px;
    flex: 1;
    min-width: 220px;
}
.css-designer-container .css-ui-global-label {
    font-size: 12px;
    font-weight: 500;
    color: var(--text-normal);
}

/* Individual UI Elements Grid & Cards */
.css-designer-container .css-ui-category-pills {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin: 12px 0 16px 0;
}
.css-designer-container .css-ui-category-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 12px;
    font-size: 11px;
    font-weight: 500;
    border-radius: 9999px;
    background-color: var(--background-secondary);
    border: 1px solid var(--background-modifier-border);
    color: var(--text-muted);
    cursor: pointer;
    transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}
.css-designer-container .css-ui-category-pill:hover {
    color: var(--text-normal);
    border-color: var(--text-accent);
}
.css-designer-container .css-ui-category-pill.is-active {
    background-color: var(--interactive-accent);
    border-color: var(--interactive-accent);
    color: var(--text-on-accent, #ffffff);
    font-weight: 600;
}
.css-designer-container .css-ui-category-group {
    margin-bottom: 24px;
    padding-bottom: 20px;
    border-bottom: 1px solid var(--background-modifier-border);
}
.css-designer-container .css-ui-category-group:last-child {
    border-bottom: none;
    margin-bottom: 0;
    padding-bottom: 0;
}
.css-designer-container .css-ui-category-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 12px;
}
.css-designer-container .css-ui-category-titlebox {
    display: flex;
    flex-direction: column;
    gap: 2px;
}
.css-designer-container .css-ui-category-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-normal);
}
.css-designer-container .css-ui-category-desc {
    font-size: 12px;
    color: var(--text-muted);
    margin: 0;
    line-height: 1.4;
}
.css-designer-container .css-ui-category-actions {
    display: flex;
    gap: 6px;
    flex-shrink: 0;
}
.css-designer-container .css-ui-category-btn {
    padding: 3px 8px;
    font-size: 11px;
    font-weight: 500;
    border-radius: var(--radius-s, 4px);
    background-color: var(--background-secondary);
    border: 1px solid var(--background-modifier-border);
    color: var(--text-muted);
    cursor: pointer;
    transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}
.css-designer-container .css-ui-category-btn:hover {
    color: var(--text-normal);
    border-color: var(--text-accent);
}
.css-designer-container .css-ui-element-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
    margin-top: 10px;
}
.css-designer-container.is-compressed .css-ui-element-grid {
    grid-template-columns: minmax(0, 1fr);
}
.css-designer-container .css-ui-element-card {
    background-color: var(--background-secondary);
    border: 1px solid var(--background-modifier-border);
    border-radius: var(--radius-m, 8px);
    padding: 12px 14px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    transition: border-color 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease, outline 0.2s ease, background-color 0.2s ease;
}
.css-designer-container .css-ui-element-card:hover,
.css-designer-container .css-ui-element-card:focus-within {
    border-color: var(--text-accent) !important;
    outline: 1px solid var(--text-accent) !important;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08), 0 0 0 1px var(--text-accent) !important;
}
.css-designer-container .css-ui-element-card.is-zero-opacity {
    border-color: rgba(239, 68, 68, 0.35);
    background-color: var(--background-secondary);
}
.css-designer-container .css-ui-element-card.is-zero-opacity:hover,
.css-designer-container .css-ui-element-card.is-zero-opacity:focus-within {
    border-color: var(--text-accent) !important;
    outline: 1px solid var(--text-accent) !important;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08), 0 0 0 1px var(--text-accent) !important;
.css-designer-container .css-ui-card-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    min-width: 0;
}
.css-designer-container .css-ui-card-titlebox {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
    flex: 1 1 auto;
}
.css-designer-container .css-ui-card-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--text-accent);
    flex-shrink: 0;
}
.css-designer-container .css-ui-card-title {
    font-size: 12px;
    font-weight: 600;
    color: var(--text-normal);
    line-height: 1.3;
    word-break: break-word;
}
.css-designer-container .css-ui-card-desc {
    margin: 0;
    font-size: 11px;
    color: var(--text-muted);
    line-height: 1.35;
}
.css-designer-container .css-ui-card-slider-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 4px;
    width: 100%;
}
.css-designer-container .css-ui-card-number {
    width: 52px;
    flex: 0 0 52px;
    min-width: 0;
    padding: 2px 4px;
    text-align: center;
    font-variant-numeric: tabular-nums;
    font-size: 11px;
    background-color: var(--background-primary);
    border: 1px solid var(--background-modifier-border);
    border-radius: var(--radius-s, 4px);
    color: var(--text-normal);
}
.css-designer-container .css-ui-card-number:focus {
    border-color: var(--text-accent) !important;
    outline: none;
}

.css-designer-container .css-ui-card-slider-row input[type='range'],
.css-designer-container .css-ui-card-slider {
    flex: 1 1 auto;
    min-width: 0;
    height: 8px;
    cursor: pointer;
    accent-color: var(--text-accent) !important;
}
.css-designer-container .css-ui-card-slider-row input[type='range']:hover,
.css-designer-container .css-ui-card-slider-row input[type='range']:focus-visible,
.css-designer-container .css-ui-card-slider:hover,
.css-designer-container .css-ui-card-slider:focus-visible {
    outline: 2px solid var(--text-accent) !important;
    outline-offset: 2px !important;
}
.css-designer-container .css-ui-card-actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 6px;
    margin-top: 2px;
}
.css-designer-container .css-ui-btn-tiny {
    padding: 2px 8px;
    font-size: 10px;
    font-weight: 600;
    border-radius: var(--radius-s, 4px);
    cursor: pointer;
    background-color: var(--background-secondary);
    border: 1px solid var(--background-modifier-border);
    color: var(--text-muted);
    transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease, transform 0.15s ease, filter 0.15s ease, font-weight 0.15s ease;
}
.css-designer-container .css-ui-btn-tiny:hover {
    color: var(--text-normal) !important;
    border-color: var(--text-accent) !important;
    background-color: var(--background-modifier-hover);
}
.css-designer-container .css-ui-card-bottom {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: 6px;
    border-top: 1px solid var(--background-modifier-border);
    font-size: 11px;
}
.css-designer-container .css-ui-card-hover-wrap {
    display: flex;
    align-items: center;
    gap: 6px;
}
.css-designer-container .css-ui-hover-label {
    font-size: 11px;
    color: var(--text-muted);
}

/* --- Presets Tab Styles --- */
.css-designer-container .css-presets-tab-container {
    display: flex;
    flex-direction: column;
    gap: var(--size-4-4, 16px);
}
.css-designer-container .css-presets-section-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
    margin-bottom: 12px;
}
.css-designer-container .css-presets-section-desc {
    margin: 4px 0 0 0;
    font-size: var(--font-ui-smaller, 12px);
    color: var(--text-muted);
}
.css-designer-container .css-save-preset-btn {
    font-size: var(--font-ui-smaller, 12px);
    font-weight: 500;
    padding: 5px 14px;
    white-space: nowrap;
    background-color: var(--text-accent) !important;
    color: var(--text-on-accent, #ffffff) !important;
    border: 1px solid var(--text-accent) !important;
    border-radius: var(--radius-s, 4px);
    cursor: pointer;
    box-shadow: var(--input-shadow, 0 1px 2px rgba(0, 0, 0, 0.1));
    transition: opacity 0.15s ease, filter 0.15s ease, background-color 0.15s ease, border-color 0.15s ease;
}
.css-designer-container .css-save-preset-btn:hover {
    background-color: var(--interactive-accent-hover, var(--text-accent)) !important;
    border-color: var(--interactive-accent-hover, var(--text-accent)) !important;
    filter: brightness(1.12);
    opacity: 0.95;
}
.css-designer-container .css-save-preset-btn:active {
    filter: brightness(0.95);
    transform: translateY(1px);
}
.css-designer-container .css-preset-empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 32px 16px;
    text-align: center;
    background-color: var(--background-secondary);
    border: 1px dashed var(--background-modifier-border);
    border-radius: var(--radius-m, 8px);
    color: var(--text-muted);
    gap: 8px;
}
.css-designer-container .css-preset-empty-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-accent);
}
.css-designer-container .css-preset-empty-icon svg {
    width: 24px;
    height: 24px;
}
.css-designer-container .css-preset-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
}
/* Widen to three columns once the panel has room. */
@container (min-width: 860px) {
    .css-designer-container .css-preset-grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
    }
}
.css-designer-container .css-preset-card {
    display: flex;
    flex-direction: column;
    background-color: var(--background-secondary);
    border: 1px solid var(--background-modifier-border);
    border-radius: var(--radius-l, 12px);
    overflow: hidden;
    cursor: pointer;
    transition: transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
}
.css-designer-container .css-preset-card:hover {
    border-color: var(--text-accent);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
.css-designer-container .css-preset-card-body {
    display: flex;
    flex-direction: column;
    flex: 1;
    padding: 12px 14px 14px 14px;
}
.css-designer-container .css-preset-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    min-height: 22px;
}
.css-designer-container .css-preset-card-title {
    margin: 0;
    font-size: var(--font-ui-medium, 14px);
    font-weight: 600;
    color: var(--text-normal);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.css-designer-container .css-preset-category-badge {
    display: inline-flex;
    align-items: center;
    font-size: 10px;
    font-weight: 600;
    padding: 2px 6px;
    border-radius: 999px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}
.css-designer-container .css-preset-category-badge.mod-dark {
    background-color: rgba(147, 51, 234, 0.18);
    color: #c084fc;
    border: 1px solid rgba(147, 51, 234, 0.35);
}
.css-designer-container .css-preset-category-badge.mod-light {
    background-color: rgba(245, 158, 11, 0.18);
    color: #fbbf24;
    border: 1px solid rgba(245, 158, 11, 0.35);
}
.css-designer-container .css-preset-card-desc {
    margin: 8px 0 12px 0;
    font-size: var(--font-ui-smaller, 12px);
    color: var(--text-muted);
    line-height: 1.45;
    flex: 1;
}
.css-designer-container .css-preset-card-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding-top: 10px;
    border-top: 1px solid var(--background-modifier-border);
}
.css-designer-container .css-preset-apply-btn {
    font-size: var(--font-ui-smaller, 12px);
    padding: 4px 12px;
    border-radius: var(--radius-s, 4px);
    background-color: var(--interactive-normal);
    color: var(--text-normal);
    cursor: pointer;
    transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease, transform 0.15s ease, filter 0.15s ease, font-weight 0.15s ease;
}
.css-designer-container .css-preset-apply-btn:hover {
    background-color: var(--interactive-accent);
    color: var(--text-on-accent);
}
.css-designer-container .css-preset-delete-btn {
    color: var(--text-muted);
    padding: 4px;
    border-radius: var(--radius-s, 4px);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
}
.css-designer-container .css-preset-delete-btn:hover {
    color: var(--text-error, #f87171);
    background-color: rgba(239, 68, 68, 0.15);
}
.css-designer-container .css-preset-card-header-actions {
    display: flex;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
}
.css-designer-container .css-preset-edit-btn {
    color: var(--text-muted);
    padding: 4px;
    border-radius: var(--radius-s, 4px);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
}
.css-designer-container .css-preset-edit-btn:hover {
    color: var(--text-accent, #7c3aed);
    background-color: rgba(var(--color-accent-rgb, 124, 58, 237), 0.15);
}
.css-designer-container .css-preset-preview {
    display: flex;
    height: 4px;
    width: 100%;
    overflow: hidden;
}
.css-designer-container .css-preset-preview-swatch {
    flex: 1 1 0;
    min-width: 0;
    background-color: var(--cssd-swatch-color, transparent);
}
.css-designer-container .css-preset-swatch-row {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
}
.css-designer-container .css-preset-swatch {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
    border-radius: 50%;
    border: 1px solid var(--background-modifier-border);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
    background-color: var(--cssd-swatch-color, transparent);
}
.css-designer-container .css-preset-restore-btn {
    font-size: var(--font-ui-smaller, 12px);
    padding: 4px 10px;
    border-radius: var(--radius-s, 4px);
    background: none;
    border: 1px solid var(--background-modifier-border);
    color: var(--text-muted);
    cursor: pointer;
    white-space: nowrap;
    align-self: flex-start;
}
.css-designer-container .css-preset-restore-btn:hover {
    color: var(--text-normal);
    border-color: var(--text-accent, #7c3aed);
}
/* Modals for presets */
.css-preset-modal .css-preset-modal-warning {
    padding: 12px 14px;
    background-color: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.3);
    border-radius: var(--radius-m, 6px);
    margin-bottom: 16px;
    color: var(--text-normal);
}
.css-preset-modal .css-preset-modal-subtext {
    margin-top: 8px;
    font-size: var(--font-ui-smaller, 12px);
    color: var(--text-muted);
}

/* ==========================================================================
   Layout Mods Section in UI Elements Tab
   ========================================================================== */

.css-designer-container .css-ui-layout-mods-section {
    background-color: var(--background-secondary);
    border: 1px solid var(--background-modifier-border);
    border-radius: var(--radius-m, 8px);
    padding: 14px 16px;
    margin-bottom: 24px;
}

.css-designer-container .css-ui-element-card.css-ui-layout-card {
    cursor: default;
    background-color: var(--background-secondary);
    border: 1px solid var(--background-modifier-border);
    border-radius: var(--radius-m, 8px);
    padding: 12px 14px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
}

.css-designer-container .css-ui-element-card.css-ui-layout-card:hover,
.css-designer-container .css-ui-element-card.css-ui-layout-card:focus-within {
    border-color: var(--text-accent) !important;
    outline: 1px solid var(--text-accent) !important;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08), 0 0 0 1px var(--text-accent) !important;
}

.css-designer-container .css-ui-element-card.css-ui-layout-card.is-active {
    border-color: var(--text-accent);
    background-color: rgba(var(--color-accent-rgb, 124, 58, 237), 0.05);
}

.css-designer-container .css-ui-layout-slider-wrap {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 4px;
    padding-top: 8px;
    border-top: 1px solid var(--background-modifier-border);
}

.css-designer-container .css-ui-layout-slider-wrap.is-hidden {
    display: none !important;
}

.css-designer-container .css-ui-layout-slider-label {
    font-size: 11px;
    font-weight: 500;
    color: var(--text-muted);
    flex-shrink: 0;
}

.css-designer-container .css-ui-layout-slider-wrap .css-control-slider {
    flex: 1;
    cursor: pointer;
    accent-color: var(--text-accent) !important;
}
`;
	doc.head.appendChild(styleEl);
}
