/**
 * Per-tab section renderers for the designer panel.
 */
import { Notice, setIcon, ToggleComponent, DropdownComponent } from 'obsidian';
import type { CssDesignerPopoutView } from '../view';
import {
	STYLE_CONTROLS,
	SHADOW_ELEMENTS,
	SHADOW_ANIMATION_OPTIONS,
	UI_ELEMENTS,
	BACKGROUND_PATTERN_OPTIONS,
	BACKGROUND_SCOPE_OPTIONS,
	BACKGROUND_MOTION_ANIMATION_OPTIONS,
	BACKGROUND_COLOR_ANIMATION_OPTIONS,
	ANIMATED_PATTERN_STYLES,
} from '../schema';
import type { StyleControl, DesignerTabId, UIElementConfig } from '../schema';
import { createControlRow, createHeaderGradientControlRow, createNavBoxControlRow } from './controls';
import {
	buildTagPreviewWidget,
	buildShadowPreviewWidget,
	createShadowSlider,
	populateSelectOptions,
	updateTagPreviewWidget,
	updateShadowPreview,
} from './widgets';
import { renderLayoutModsSection } from './layout-tab';

export function renderCategoryTab(view: CssDesignerPopoutView, container: HTMLElement, category: DesignerTabId): void {
	const catControls = STYLE_CONTROLS.filter((c) => c.category === category);
	const hasSubcategories = catControls.some((c) => !!c.subcategory);
	// Colors and Typography are long runs of small, independent rows, so they
	// pack into two columns; the other tabs keep the full-width stack.
	const useGrid = category === 'colors' || category === 'typography';

	if (hasSubcategories) {
		const subcategories = new Map<string, StyleControl[]>();
		for (const ctrl of catControls) {
			const defaultSub = category === 'colors' ? 'Base Palette' : 'General';
			const sub = ctrl.subcategory ?? defaultSub;
			if (!subcategories.has(sub)) {
				subcategories.set(sub, []);
			}
			subcategories.get(sub)!.push(ctrl);
		}

		for (const [subName, controls] of subcategories) {
			const sectionEl = container.createDiv({ cls: 'css-designer-section' });
			if (subName === 'Heading Text') {
				for (const ctrl of controls) {
					if (ctrl.id === 'gradient-headers') {
						createHeaderGradientControlRow(view, sectionEl, ctrl);
					} else {
						createControlRow(view, sectionEl, ctrl);
					}
				}
				continue;
			}
			sectionEl.createEl('h3', { text: subName, cls: 'css-designer-section-title' });
			// The Colors and Typography tabs are long runs of small, independent
			// rows, so they pack them into two columns; other tabs keep the stack.
			const rowHost = useGrid
				? sectionEl.createDiv({ cls: 'css-control-grid' })
				: sectionEl;

			for (const ctrl of controls) {
				if (ctrl.id === 'nav-box-enabled') {
					createNavBoxControlRow(view, rowHost, ctrl);
				} else if (ctrl.id === 'gradient-headers') {
					createHeaderGradientControlRow(view, rowHost, ctrl);
				} else {
					createControlRow(view, rowHost, ctrl);
				}
			}
		}
	} else {
		const sectionEl = container.createDiv({ cls: 'css-designer-section' });
		const rowHost = useGrid
			? sectionEl.createDiv({ cls: 'css-control-grid' })
			: sectionEl;
		for (const ctrl of catControls) {
			if (ctrl.id === 'nav-box-enabled') {
				createNavBoxControlRow(view, rowHost, ctrl);
			} else if (ctrl.id === 'gradient-headers') {
				createHeaderGradientControlRow(view, rowHost, ctrl);
			} else {
				createControlRow(view, rowHost, ctrl);
			}
		}
	}
}

interface ColorTabSubsection {
	title: string;
	controlIds: string[];
}

interface ColorTabSection {
	title?: string;
	isHeaderGradient?: boolean;
	isTagPills?: boolean;
	subsections?: ColorTabSubsection[];
	controlIds?: string[];
}

const COLOR_TAB_SECTIONS: ColorTabSection[] = [
	{
		title: 'Base Palette',
		controlIds: [
			'text-normal',
			'text-accent',
			'text-accent-2',
			'background-primary',
			'background-secondary',
			'titlebar-background-focused',
			'titlebar-match-unfocused',
			'titlebar-background',
		],
	},
	{
		title: 'Buttons & Interface',
		subsections: [
			{
				title: 'Buttons',
				controlIds: [
					'interactive-hover',
					'interactive-accent-hover',
				],
			},
			{
				title: 'Status Bar',
				controlIds: [
					'status-bar-background',
					'status-bar-text-color',
				],
			},
			{
				title: 'Scrollbars',
				controlIds: [
					'scrollbar-thumb-bg',
					'scrollbar-active-thumb-bg',
				],
			},
		],
	},
	{
		isHeaderGradient: true,
	},
	{
		title: 'Borders & Dividers',
		controlIds: [
			'border-base',
			'border-hover',
			'border-focus',
			'workspace-leaf-resizer',
			'workspace-leaf-resizer-hover',
			'workspace-leaf-border',
			'workspace-leaf-hover',
		],
	},
	{
		title: 'Navigation',
		subsections: [
			{
				title: 'Navigation Tree',
				controlIds: [
					'nav-box-enabled',
					'nav-item-color',
					'nav-item-hover-bg',
					'nav-item-active-bg',
					'nav-item-active-color',
					'nav-item-size',
					'nav-indentation-guide',
				],
			},
			{
				title: 'Tabs',
				controlIds: [
					'tab-bg-active',
					'tab-text-active',
					'tab-outline-color',
					'tab-icon-outline-color',
					'tab-curve',
					'tab-radius',
				],
			},
			{
				title: 'Search Bar',
				controlIds: [
					'search-bar-background',
				],
			},
		],
	},
	{
		title: 'Editor',
		controlIds: [
			'text-selection',
			'text-highlight-bg',
			'spellcheck-underline-color',
			'active-line-bg',
			'line-number-color',
			'line-number-color-hover',
			'indentation-guide-color',
			'indentation-guide-color-active',
			'indentation-guide-width',
			'hover-highlight',
		],
	},
	{
		title: 'Checkboxes & Tasks',
		controlIds: [
			'checkbox-color',
			'checkbox-border-color',
			'checkbox-marker-color',
			'checkbox-size',
			'checkbox-radius',
		],
	},
	{
		title: 'Markdown Elements',
		subsections: [
			{
				title: 'Links',
				controlIds: [
					'link-color',
					'link-color-hover',
					'link-external-color',
					'link-unresolved-color',
				],
			},
			{
				title: 'Code & Code Blocks',
				controlIds: [
					'code-normal',
					'code-background',
					'code-block-background',
					'code-block-text',
				],
			},
			{
				title: 'Blockquotes',
				controlIds: [
					'blockquote-border-color',
					'blockquote-border-thickness',
				],
			},
		],
	},
	{
		title: 'Tag Pills',
		isTagPills: true,
		controlIds: [
			'tag-radius',
			'tag-size',
			'tag-color',
			'tag-background',
			'tag-padding-x',
			'tag-padding-y',
		],
	},
	{
		title: 'Callouts',
		subsections: [
			{
				title: 'Callout Style',
				controlIds: [
					'callout-radius',
					'callout-border-width',
					'callout-bg-opacity',
					'callout-icon-size',
				],
			},
			{
				title: 'Callout Colors',
				controlIds: [
					'callout-color-note',
					'callout-color-tip',
					'callout-color-success',
					'callout-color-question',
					'callout-color-warning',
					'callout-color-danger',
					'callout-color-example',
					'callout-color-quote',
				],
			},
		],
	},
	{
		title: 'Context Menus',
		controlIds: [
			'menu-background',
			'menu-border',
			'menu-item-color',
			'menu-item-hover-bg',
			'menu-item-hover-color',
			'menu-radius',
		],
	},
	{
		title: 'Tables',
		controlIds: [
			'table-header-bg',
			'table-row-alt-bg',
		],
	},
	{
		title: 'Graph View',
		controlIds: [
			'graph-node',
			'graph-node-unresolved',
			'graph-node-focused',
			'graph-node-tag',
			'graph-node-attachment',
			'graph-line',
			'graph-text',
			'graph-controls-width',
		],
	},
];

export function renderColorsTab(view: CssDesignerPopoutView, container: HTMLElement): void {
	const ctrlMap = new Map<string, StyleControl>();
	for (const ctrl of STYLE_CONTROLS) {
		ctrlMap.set(ctrl.id, ctrl);
	}

	for (const sec of COLOR_TAB_SECTIONS) {
		const sectionEl = container.createDiv({ cls: 'css-designer-section' });

		if (sec.isHeaderGradient) {
			const ctrl = ctrlMap.get('gradient-headers');
			if (ctrl) {
				createHeaderGradientControlRow(view, sectionEl, ctrl);
			}
			continue;
		}

		if (sec.title) {
			sectionEl.createEl('h3', { text: sec.title, cls: 'css-designer-section-title' });
		}

		if (sec.subsections && sec.subsections.length > 0) {
			for (const sub of sec.subsections) {
				const subEl = sectionEl.createDiv({ cls: 'css-designer-subgroup' });
				subEl.createEl('h4', { text: sub.title, cls: 'css-designer-subgroup-title' });
				const rowHost = subEl.createDiv({ cls: 'css-control-grid css-control-grid-3' });
				for (const ctrlId of sub.controlIds) {
					const ctrl = ctrlMap.get(ctrlId);
					if (ctrl) {
						if (ctrl.id === 'nav-box-enabled') {
							createNavBoxControlRow(view, rowHost, ctrl);
						} else {
							createControlRow(view, rowHost, ctrl);
						}
					}
				}
			}
		} else if (sec.isTagPills) {
			const rowHost = sectionEl.createDiv({ cls: 'css-control-grid css-control-grid-3' });
			const previewBox = rowHost.createDiv({ cls: 'css-tag-preview-box' });
			buildTagPreviewWidget(previewBox);
			updateTagPreviewWidget(view, previewBox);

			for (const ctrlId of sec.controlIds ?? []) {
				const ctrl = ctrlMap.get(ctrlId);
				if (ctrl) {
					createControlRow(view, rowHost, ctrl, () => {
						updateTagPreviewWidget(view, previewBox);
					});
				}
			}
		} else if (sec.controlIds) {
			const rowHost = sectionEl.createDiv({ cls: 'css-control-grid css-control-grid-3' });
			for (const ctrlId of sec.controlIds) {
				const ctrl = ctrlMap.get(ctrlId);
				if (ctrl) {
					createControlRow(view, rowHost, ctrl);
				}
			}
		}
	}
}

export function renderComponentMarkdownSection(_view: CssDesignerPopoutView, _container: HTMLElement): void {
	// Deprecated: All component markdown controls are cleanly integrated into renderColorsTab
}

export function renderCustomBackgroundSection(view: CssDesignerPopoutView, container: HTMLElement, tokenMap: Map<string, string>): void {
	const isBgEnabled = tokenMap.get('--ui-bg-enabled') === 'true';
	const currentStyle = tokenMap.get('--ui-bg-style') ?? 'dot-grid';
	const currentScope = tokenMap.get('--ui-bg-scope') ?? 'editor';
	const currentSize = parseInt(tokenMap.get('--ui-bg-size') ?? '24px', 10) || 24;
	const currentOpacity = parseFloat(tokenMap.get('--ui-bg-opacity') ?? '0.35');
	const isDark = view.activeMode === '.theme-dark';
	const defaultColor = isDark ? '#ffffff' : '#000000';
	const currentColor = tokenMap.get('--ui-bg-color') ?? defaultColor;
	const defaultColor2 = isDark ? '#a855f7' : '#9333ea';
	const currentColor2 = tokenMap.get('--ui-bg-color-2') ?? defaultColor2;

	// 0. HERO SECTION: Custom Backgrounds & Canvas Patterns
	const bgHero = container.createDiv({ cls: 'css-designer-section css-ui-bg-hero' });

	// Hero Section Header
	const bgHeader = bgHero.createDiv({ cls: 'css-section-header css-ui-bg-header' });
	const titleSpan = bgHeader.createSpan({ cls: 'css-hero-heading' });
	const heroIcon = titleSpan.createSpan({ cls: 'css-hero-icon' });
	setIcon(heroIcon, 'image');
	titleSpan.createSpan({ text: 'Custom Backgrounds & Canvas Patterns' });

	// 1. STANDARD BACKGROUNDS CATEGORY
	const stdSection = bgHero.createDiv({ cls: 'css-ui-bg-category-section' });
	const stdHeader = stdSection.createDiv({ cls: 'css-section-header css-ui-bg-header css-ui-bg-subheader' });
	const stdTitleSpan = stdHeader.createSpan({ cls: 'css-hero-heading css-ui-bg-subheading' });
	stdTitleSpan.createSpan({ text: 'Standard Backgrounds' });

	const stdToggleWrap = stdHeader.createDiv({ cls: 'css-boolean-toggle-wrap' });
	const stdToggle = new ToggleComponent(stdToggleWrap)
		.setValue(isBgEnabled)
		.setTooltip(`Toggle Standard Backgrounds ${isBgEnabled ? 'off' : 'on'}`);

	// Secondary controls for Standard Backgrounds
	const subControls = stdSection.createDiv({ cls: 'css-ui-bg-subcontrols' });
	subControls.toggleClass('is-collapsed', !isBgEnabled);

	stdToggle.onChange((val) => {
		tokenMap.set('--ui-bg-enabled', val ? 'true' : 'false');
		if (view.engine) {
			view.engine.setToken(view.activeMode, '--ui-bg-enabled', val ? 'true' : 'false');
		}
		stdToggle.setTooltip(`Toggle Standard Backgrounds ${val ? 'off' : 'on'}`);
		subControls.toggleClass('is-collapsed', !val);
		const areaNote = bgHero.querySelector('.css-ui-bg-animated-section .css-control-disclaimer-note');
		if (areaNote) {
			areaNote.classList.toggle('is-collapsed', !val);
		}
		view.invalidateCompanionCache();
		view.scheduleLiveStyleUpdate(false);
		view.debouncedSave();
	});

	// Pattern Style selector row: label + position indicator + stepper (prev, dropdown, next)
	const patternRow = subControls.createDiv({ cls: 'css-ui-bg-pattern-row' });
	const styleLabelGroup = patternRow.createDiv({ cls: 'css-ui-bg-label-group' });
	styleLabelGroup.createSpan({ text: 'Pattern Style', cls: 'css-ui-bg-label-title' });
	const stylePosition = styleLabelGroup.createSpan({ cls: 'css-ui-bg-style-position' });

	const stepper = patternRow.createDiv({ cls: 'css-ui-bg-stepper' });
	const prevStyleBtn = stepper.createEl('button', {
		cls: 'css-ui-bg-step-btn',
		attr: { type: 'button', 'aria-label': 'Previous pattern', title: 'Previous pattern (left arrow)' },
	});
	setIcon(prevStyleBtn, 'chevron-left');

	const styleDropdown = new DropdownComponent(stepper);
	// Rendered through populateSelectOptions rather than addOption so the
	// picker's <optgroup> categories survive; DropdownComponent has no
	// grouping of its own.
	populateSelectOptions(styleDropdown.selectEl, BACKGROUND_PATTERN_OPTIONS, currentStyle);

	const nextStyleBtn = stepper.createEl('button', {
		cls: 'css-ui-bg-step-btn',
		attr: { type: 'button', 'aria-label': 'Next pattern', title: 'Next pattern (right arrow)' },
	});
	setIcon(nextStyleBtn, 'chevron-right');

	const updateStylePosition = (val: string): void => {
		const index = BACKGROUND_PATTERN_OPTIONS.findIndex((o) => o.value === val);
		const option = BACKGROUND_PATTERN_OPTIONS[index];
		const total = BACKGROUND_PATTERN_OPTIONS.length;
		stylePosition.setText(option
			? `${option.group ?? 'Patterns'} · ${index + 1} of ${total}`
			: `${total} patterns`);
	};
	updateStylePosition(currentStyle);

	/**
	 * Switch pattern without rebuilding the tab.
	 *
	 * Stepping fires this once per keypress, and `view.renderUI()` would
	 * recreate every control and drop keyboard focus mid-scrub. Nothing else in
	 * the panel is derived from the style token, so refreshing the preview and
	 * the live style tag is the whole job.
	 */
	const applyStyle = (val: string, fromSelect: boolean): void => {
		tokenMap.set('--ui-bg-style', val);
		if (view.engine) {
			view.engine.setToken(view.activeMode, '--ui-bg-style', val);
		}
		if (!fromSelect) {
			styleDropdown.selectEl.value = val;
		}
		updateStylePosition(val);
		view.invalidateCompanionCache();
		view.scheduleLiveStyleUpdate(false);
		view.debouncedSave();
	};

	/** Move `delta` places through the picker, wrapping at either end. */
	const stepStyle = (delta: number): void => {
		const total = BACKGROUND_PATTERN_OPTIONS.length;
		const current = tokenMap.get('--ui-bg-style') ?? 'dot-grid';
		const at = BACKGROUND_PATTERN_OPTIONS.findIndex((o) => o.value === current);
		const target = at < 0 ? 0 : (((at + delta) % total) + total) % total;
		const next = BACKGROUND_PATTERN_OPTIONS[target];
		if (next) {
			applyStyle(next.value, false);
		}
	};

	styleDropdown.onChange((val) => applyStyle(val, true));
	prevStyleBtn.addEventListener('click', () => stepStyle(-1));
	nextStyleBtn.addEventListener('click', () => stepStyle(1));
	stepper.addEventListener('keydown', (evt) => {
		if (evt.key !== 'ArrowLeft' && evt.key !== 'ArrowRight') return;
		// The native <select> already steps itself with the arrow keys and
		// fires change, so only the buttons need the shortcut wired up.
		if (evt.target === styleDropdown.selectEl) return;
		evt.preventDefault();
		stepStyle(evt.key === 'ArrowRight' ? 1 : -1);
	});

	// Grid of secondary controls: Scope, Size, Opacity, Color
	const controlsGrid = subControls.createDiv({ cls: 'css-ui-bg-grid' });

	// Control A: Scope Dropdown
	const scopeBox = controlsGrid.createDiv({ cls: 'css-ui-bg-field' });
	scopeBox.createSpan({ text: 'Area', cls: 'css-control-label' });
	const scopeDropdown = new DropdownComponent(scopeBox);
	for (const opt of BACKGROUND_SCOPE_OPTIONS) {
		scopeDropdown.addOption(opt.value, opt.label);
	}
	scopeDropdown.setValue(currentScope);
	scopeDropdown.onChange((val) => {
		tokenMap.set('--ui-bg-scope', val);
		if (view.engine) {
			view.engine.setToken(view.activeMode, '--ui-bg-scope', val);
		}
		view.invalidateCompanionCache();
		view.scheduleLiveStyleUpdate(false);
		view.debouncedSave();
	});

	// Control B: Grid Spacing / Pattern Size Slider
	const sizeBox = controlsGrid.createDiv({ cls: 'css-ui-bg-field' });
	const sizeHeader = sizeBox.createDiv({ cls: 'css-control-header-row' });
	sizeHeader.createSpan({ text: 'Pattern Size / Spacing', cls: 'css-control-label' });
	const sizeBadge = sizeHeader.createSpan({ text: `${currentSize}px`, cls: 'css-control-val-badge' });

	const sizeSlider = sizeBox.createEl('input', {
		type: 'range',
		cls: 'css-control-slider',
	});
	sizeSlider.min = '12';
	sizeSlider.max = '72';
	sizeSlider.step = '2';
	sizeSlider.value = String(currentSize);
	sizeSlider.setAttribute('title', 'Double-click to reset to 24px');
	sizeSlider.addEventListener('input', (e) => {
		const val = (e.target as HTMLInputElement).value;
		const numVal = parseInt(val, 10) || 24;
		sizeBadge.setText(`${numVal}px`);
		tokenMap.set('--ui-bg-size', `${numVal}px`);
		if (view.engine) {
			view.engine.setToken(view.activeMode, '--ui-bg-size', `${numVal}px`);
		}
		view.invalidateCompanionCache();
		view.scheduleLiveStyleUpdate(false);
		view.debouncedSave();
	});
	sizeSlider.addEventListener('dblclick', () => {
		sizeSlider.value = '24';
		sizeBadge.setText('24px');
		tokenMap.set('--ui-bg-size', '24px');
		if (view.engine) {
			view.engine.setToken(view.activeMode, '--ui-bg-size', '24px');
		}
		view.invalidateCompanionCache();
		view.scheduleLiveStyleUpdate(false);
		view.debouncedSave();
	});

	// Control C: Opacity Slider
	const opacityBox = controlsGrid.createDiv({ cls: 'css-ui-bg-field' });
	const opHeader = opacityBox.createDiv({ cls: 'css-control-header-row' });
	opHeader.createSpan({ text: 'Pattern Opacity', cls: 'css-control-label' });
	const opBadge = opHeader.createSpan({ text: `${Math.round(currentOpacity * 100)}%`, cls: 'css-control-val-badge' });

	const opSlider = opacityBox.createEl('input', {
		type: 'range',
		cls: 'css-control-slider',
	});
	opSlider.min = '0.01';
	opSlider.max = '1.0';
	opSlider.step = '0.01';
	opSlider.value = String(currentOpacity);
	opSlider.setAttribute('title', 'Double-click to reset to 35%');
	opSlider.addEventListener('input', (e) => {
		const val = parseFloat((e.target as HTMLInputElement).value);
		opBadge.setText(`${Math.round(val * 100)}%`);
		const strVal = val.toFixed(2).replace(/\.?0+$/, '') || '0.01';
		tokenMap.set('--ui-bg-opacity', strVal);
		if (view.engine) {
			view.engine.setToken(view.activeMode, '--ui-bg-opacity', strVal);
		}
		view.invalidateCompanionCache();
		view.scheduleLiveStyleUpdate(false);
		view.debouncedSave();
	});
	opSlider.addEventListener('dblclick', () => {
		opSlider.value = '0.35';
		opBadge.setText('35%');
		tokenMap.set('--ui-bg-opacity', '0.35');
		if (view.engine) {
			view.engine.setToken(view.activeMode, '--ui-bg-opacity', '0.35');
		}
		view.invalidateCompanionCache();
		view.scheduleLiveStyleUpdate(false);
		view.debouncedSave();
	});

	// Control D: Tint Color
	const colorBox = controlsGrid.createDiv({ cls: 'css-ui-bg-field' });
	const colorHeader = colorBox.createDiv({ cls: 'css-control-header-row' });
	colorHeader.createSpan({ text: 'Pattern Tint Color', cls: 'css-control-label' });

	const colorRow = colorBox.createDiv({ cls: 'css-ui-bg-color-row' });
	const colorPicker = colorRow.createEl('input', {
		type: 'color',
		cls: 'css-color-picker-input',
	});
	colorPicker.value = currentColor.startsWith('#') && currentColor.length === 7 ? currentColor : (isDark ? '#ffffff' : '#000000');

	const colorHex = colorRow.createEl('input', {
		type: 'text',
		cls: 'css-color-hex-input',
		value: currentColor,
	});

	const applyColor = (rawVal: string) => {
		let hexVal = (rawVal || '').trim();
		if (!hexVal.startsWith('#') && /^[0-9a-fA-F]{3,8}$/.test(hexVal)) {
			hexVal = '#' + hexVal;
		}
		if (hexVal.startsWith('#') && hexVal.length === 4) {
			hexVal = '#' + hexVal.slice(1).split('').map((char) => char + char).join('');
		}
		if (hexVal.startsWith('#') && hexVal.length === 7) {
			colorPicker.value = hexVal;
		}
		colorHex.value = hexVal;
		tokenMap.set('--ui-bg-color', hexVal);
		if (view.engine) {
			view.engine.setToken(view.activeMode, '--ui-bg-color', hexVal);
		}
		view.invalidateCompanionCache();
		view.scheduleLiveStyleUpdate(false);
		view.debouncedSave();
	};

	colorPicker.addEventListener('input', () => {
		applyColor(colorPicker.value);
	});
	colorPicker.addEventListener('change', () => {
		applyColor(colorPicker.value);
	});
	colorHex.addEventListener('input', () => {
		applyColor(colorHex.value);
	});
	colorHex.addEventListener('change', () => {
		applyColor(colorHex.value);
	});

	// Shared by both animation dropdowns: the speed slider only does anything
	// once either motion or colour animation is running.
	let animationSpeedBox: HTMLDivElement | null = null;

	// Control E1: Motion Animation Dropdown
	const motionBox = controlsGrid.createDiv({ cls: 'css-ui-bg-field' });
	const motionHeader = motionBox.createDiv({ cls: 'css-control-header-row' });
	motionHeader.createSpan({ text: 'Motion Animation', cls: 'css-control-label' });
	let currentMotion = tokenMap.get('--ui-bg-motion-animation');
	if (!currentMotion) {
		const legacy = tokenMap.get('--ui-bg-animation');
		currentMotion = (legacy && ['rain-scroll', 'horizontal-rain-scroll', 'side-scroll', 'rotate-cw', 'rotate-ccw', 'drift', 'pulse'].includes(legacy)) ? legacy : 'none';
	}
	const isMotionActive = currentMotion !== 'none';
	const motionBadge = motionHeader.createSpan({
		text: isMotionActive ? 'Active' : 'Static',
		cls: `css-ui-bg-status-badge ${isMotionActive ? 'is-active' : ''}`,
	});

	const motionDropdown = new DropdownComponent(motionBox);
	for (const opt of BACKGROUND_MOTION_ANIMATION_OPTIONS) {
		motionDropdown.addOption(opt.value, opt.label);
	}
	motionDropdown.setValue(currentMotion);
	motionDropdown.onChange((val) => {
		tokenMap.set('--ui-bg-motion-animation', val);
		if (view.engine) {
			view.engine.setToken(view.activeMode, '--ui-bg-motion-animation', val);
		}
		const colorVal = tokenMap.get('--ui-bg-color-animation') ?? 'none';
		const anyActive = val !== 'none' || colorVal !== 'none';
		tokenMap.set('--ui-bg-animate', anyActive ? 'true' : 'false');
		tokenMap.set('--ui-bg-animation', val !== 'none' ? val : colorVal);
		if (view.engine) {
			view.engine.setToken(view.activeMode, '--ui-bg-animate', anyActive ? 'true' : 'false');
			view.engine.setToken(view.activeMode, '--ui-bg-animation', val !== 'none' ? val : colorVal);
		}
		motionBadge.setText(val !== 'none' ? 'Active' : 'Static');
		motionBadge.toggleClass('is-active', val !== 'none');
		animationSpeedBox?.toggleClass('is-disabled', !anyActive);
		view.invalidateCompanionCache();
		view.scheduleLiveStyleUpdate(false);
		view.debouncedSave();
	});

	// Control E2: Color Animation Dropdown
	const colorAnimBox = controlsGrid.createDiv({ cls: 'css-ui-bg-field' });
	const colorAnimHeader = colorAnimBox.createDiv({ cls: 'css-control-header-row' });
	colorAnimHeader.createSpan({ text: 'Color Animation', cls: 'css-control-label' });
	let currentColorAnim = tokenMap.get('--ui-bg-color-animation');
	if (!currentColorAnim) {
		const legacy = tokenMap.get('--ui-bg-animation');
		currentColorAnim = (legacy && ['rainbow-cycle', 'gradient-rotate', 'gradient-shift', 'neon-glow'].includes(legacy)) ? legacy : 'none';
	}
	const isColorAnimActive = currentColorAnim !== 'none';
	const colorAnimBadge = colorAnimHeader.createSpan({
		text: isColorAnimActive ? 'Active' : 'Static',
		cls: `css-ui-bg-status-badge ${isColorAnimActive ? 'is-active' : ''}`,
	});

	const colorAnimDropdown = new DropdownComponent(colorAnimBox);
	for (const opt of BACKGROUND_COLOR_ANIMATION_OPTIONS) {
		colorAnimDropdown.addOption(opt.value, opt.label);
	}
	colorAnimDropdown.setValue(currentColorAnim);
	colorAnimDropdown.onChange((val) => {
		tokenMap.set('--ui-bg-color-animation', val);
		if (view.engine) {
			view.engine.setToken(view.activeMode, '--ui-bg-color-animation', val);
		}
		const motionVal = tokenMap.get('--ui-bg-motion-animation') ?? 'none';
		const anyActive = val !== 'none' || motionVal !== 'none';
		tokenMap.set('--ui-bg-animate', anyActive ? 'true' : 'false');
		tokenMap.set('--ui-bg-animation', motionVal !== 'none' ? motionVal : val);
		if (view.engine) {
			view.engine.setToken(view.activeMode, '--ui-bg-animate', anyActive ? 'true' : 'false');
			view.engine.setToken(view.activeMode, '--ui-bg-animation', motionVal !== 'none' ? motionVal : val);
		}
		colorAnimBadge.setText(val !== 'none' ? 'Active' : 'Static');
		colorAnimBadge.toggleClass('is-active', val !== 'none');
		animationSpeedBox?.toggleClass('is-disabled', !anyActive);
		view.invalidateCompanionCache();
		view.scheduleLiveStyleUpdate(false);
		view.debouncedSave();
	});

	// Control E3: Animation Speed Slider
	const speedBox = controlsGrid.createDiv({
		cls: `css-ui-bg-field ${currentMotion !== 'none' || currentColorAnim !== 'none' ? '' : 'is-disabled'}`,
	});
	animationSpeedBox = speedBox;
	const speedHeader = speedBox.createDiv({ cls: 'css-control-header-row' });
	speedHeader.createSpan({ text: 'Animation Speed', cls: 'css-control-label' });
	const currentSpeedRaw = parseFloat(tokenMap.get('--ui-bg-animation-speed') ?? '1');
	const currentSpeed = isFinite(currentSpeedRaw) && currentSpeedRaw > 0 ? Math.min(3, Math.max(0.25, currentSpeedRaw)) : 1;
	const speedBadge = speedHeader.createSpan({ text: `${Number(currentSpeed.toFixed(2))}x`, cls: 'css-control-val-badge' });

	const speedSlider = speedBox.createEl('input', {
		type: 'range',
		cls: 'css-control-slider',
	});
	speedSlider.min = '0.25';
	speedSlider.max = '3';
	speedSlider.step = '0.05';
	speedSlider.value = String(currentSpeed);
	speedSlider.setAttribute('title', 'Double-click to reset to 1x');
	const applySpeed = (val: number) => {
		const clamped = Math.min(3, Math.max(0.25, val));
		const display = Number(clamped.toFixed(2));
		speedBadge.setText(`${display}x`);
		tokenMap.set('--ui-bg-animation-speed', String(display));
		if (view.engine) {
			view.engine.setToken(view.activeMode, '--ui-bg-animation-speed', String(display));
		}
		view.invalidateCompanionCache();
		view.scheduleLiveStyleUpdate(false);
		view.debouncedSave();
	};
	speedSlider.addEventListener('input', (e) => {
		applySpeed(parseFloat((e.target as HTMLInputElement).value));
	});
	speedSlider.addEventListener('dblclick', () => {
		speedSlider.value = '1';
		applySpeed(1);
	});

	// Control F: Gradient Mode Toggle
	const gradBox = controlsGrid.createDiv({ cls: 'css-ui-bg-field' });
	const gradHeader = gradBox.createDiv({ cls: 'css-control-header-row' });
	gradHeader.createSpan({ text: 'Gradient Mode', cls: 'css-control-label' });
	const isGrad = tokenMap.get('--ui-bg-gradient') === 'true';
	const gradBadge = gradHeader.createSpan({
		text: isGrad ? 'Gradient' : 'Solid',
		cls: `css-ui-bg-status-badge ${isGrad ? 'is-active' : ''}`,
	});

	// Control G: Secondary Tint Color (Color 2 for Gradient Mode)
	const color2Box = controlsGrid.createDiv({ cls: `css-ui-bg-field ${isGrad ? '' : 'is-disabled'}` });
	const color2Header = color2Box.createDiv({ cls: 'css-control-header-row' });
	color2Header.createSpan({ text: 'Secondary Tint (Gradient)', cls: 'css-control-label' });
	const color2Badge = color2Header.createSpan({
		text: isGrad ? 'Active' : 'Inactive',
		cls: `css-ui-bg-status-badge ${isGrad ? 'is-active' : ''}`,
	});

	const color2Row = color2Box.createDiv({ cls: 'css-ui-bg-color-row' });
	const color2Picker = color2Row.createEl('input', {
		type: 'color',
		cls: 'css-color-picker-input',
	});
	color2Picker.value = currentColor2.startsWith('#') && currentColor2.length === 7 ? currentColor2 : defaultColor2;

	const color2Hex = color2Row.createEl('input', {
		type: 'text',
		cls: 'css-color-hex-input',
		value: currentColor2,
	});

	const applyColor2 = (rawVal: string) => {
		let hexVal = (rawVal || '').trim();
		if (!hexVal.startsWith('#') && /^[0-9a-fA-F]{3,8}$/.test(hexVal)) {
			hexVal = '#' + hexVal;
		}
		if (hexVal.startsWith('#') && hexVal.length === 4) {
			hexVal = '#' + hexVal.slice(1).split('').map((char) => char + char).join('');
		}
		if (hexVal.startsWith('#') && hexVal.length === 7) {
			color2Picker.value = hexVal;
		}
		color2Hex.value = hexVal;
		tokenMap.set('--ui-bg-color-2', hexVal);
		if (view.engine) {
			view.engine.setToken(view.activeMode, '--ui-bg-color-2', hexVal);
		}
		view.invalidateCompanionCache();
		view.scheduleLiveStyleUpdate(false);
		view.debouncedSave();
	};

	color2Picker.addEventListener('input', () => {
		applyColor2(color2Picker.value);
	});
	color2Picker.addEventListener('change', () => {
		applyColor2(color2Picker.value);
	});
	color2Hex.addEventListener('input', () => {
		applyColor2(color2Hex.value);
	});
	color2Hex.addEventListener('change', () => {
		applyColor2(color2Hex.value);
	});

	// Control H: Gradient Angle Slider
	const angleBox = controlsGrid.createDiv({ cls: `css-ui-bg-field ${isGrad ? '' : 'is-disabled'}` });
	const angleHeader = angleBox.createDiv({ cls: 'css-control-header-row' });
	angleHeader.createSpan({ text: 'Gradient Angle', cls: 'css-control-label' });
	const currentAngleRaw = tokenMap.get('--ui-bg-gradient-angle') ?? '135deg';
	const currentAngle = parseInt(currentAngleRaw, 10) || 135;
	const angleBadge = angleHeader.createSpan({ text: `${currentAngle}°`, cls: 'css-control-val-badge' });

	const angleSlider = angleBox.createEl('input', {
		type: 'range',
		cls: 'css-control-slider',
	});
	angleSlider.min = '0';
	angleSlider.max = '360';
	angleSlider.step = '1';
	angleSlider.value = String(currentAngle);
	angleSlider.setAttribute('title', 'Double-click to reset to 135°');
	angleSlider.addEventListener('input', (e) => {
		const val = parseInt((e.target as HTMLInputElement).value, 10) || 0;
		angleBadge.setText(`${val}°`);
		tokenMap.set('--ui-bg-gradient-angle', `${val}deg`);
		if (view.engine) {
			view.engine.setToken(view.activeMode, '--ui-bg-gradient-angle', `${val}deg`);
		}
		view.invalidateCompanionCache();
		view.scheduleLiveStyleUpdate(false);
		view.debouncedSave();
	});
	angleSlider.addEventListener('dblclick', () => {
		angleSlider.value = '135';
		angleBadge.setText('135°');
		tokenMap.set('--ui-bg-gradient-angle', '135deg');
		if (view.engine) {
			view.engine.setToken(view.activeMode, '--ui-bg-gradient-angle', '135deg');
		}
		view.invalidateCompanionCache();
		view.scheduleLiveStyleUpdate(false);
		view.debouncedSave();
	});

	new ToggleComponent(gradBox)
		.setValue(isGrad)
		.onChange((val) => {
			tokenMap.set('--ui-bg-gradient', val ? 'true' : 'false');
			if (view.engine) {
				view.engine.setToken(view.activeMode, '--ui-bg-gradient', val ? 'true' : 'false');
			}
			gradBadge.setText(val ? 'Gradient' : 'Solid');
			gradBadge.toggleClass('is-active', val);
			color2Box.toggleClass('is-disabled', !val);
			color2Badge.setText(val ? 'Active' : 'Inactive');
			color2Badge.toggleClass('is-active', val);
			angleBox.toggleClass('is-disabled', !val);
			view.invalidateCompanionCache();
			view.scheduleLiveStyleUpdate(false);
			view.debouncedSave();
		});

	// 2. ANIMATED BACKGROUNDS CATEGORY
	renderAnimatedBackgroundsSection(view, bgHero, tokenMap);
}

/**
 * "Animated Backgrounds" subsection inside Custom Backgrounds & Canvas Patterns,
 * with a master toggle of its own. The picker, speed slider and controls only
 * exist while that toggle is on, so the subsection collapses to a single header
 * row when it is off.
 */
export function renderAnimatedBackgroundsSection(
	view: CssDesignerPopoutView,
	container: HTMLElement,
	tokenMap: Map<string, string>,
): void {
	const isDark = view.activeMode === '.theme-dark';
	const defaultColor = isDark ? '#ffffff' : '#000000';
	// "None" is no longer a style: the master toggle is the only off switch, and
	// the first entry (the winking face) is the default when nothing is picked.
	const firstStyleId = ANIMATED_PATTERN_STYLES[0]?.id ?? 'none';
	const hasStyle = ANIMATED_PATTERN_STYLES.some((s) => s.id === tokenMap.get('--ui-bg-flipbook'));
	const isEnabled = hasStyle && (tokenMap.get('--ui-bg-flipbook-enabled') ?? 'true') !== 'false';
	const current = hasStyle ? (tokenMap.get('--ui-bg-flipbook') as string) : firstStyleId;

	const section = container.createDiv({ cls: 'css-ui-bg-category-section css-ui-bg-animated-section' });
	const header = section.createDiv({ cls: 'css-section-header css-ui-bg-header css-ui-bg-subheader' });
	const titleSpan = header.createSpan({ cls: 'css-hero-heading css-ui-bg-subheading' });
	titleSpan.createSpan({ text: 'Animated Backgrounds' });

	const toggleWrap = header.createDiv({ cls: 'css-boolean-toggle-wrap' });
	const toggle = new ToggleComponent(toggleWrap)
		.setValue(isEnabled)
		.setTooltip(`Toggle Animated Backgrounds ${isEnabled ? 'off' : 'on'}`);

	// Right under the heading, above the controls.
	const warning = section.createDiv({ cls: 'css-control-disclaimer-warning' });
	warning.createSpan({ text: '⚠️ Repaints continuously; may affect performance.' });
	warning.toggleClass('is-collapsed', !isEnabled);

	const body = section.createDiv({ cls: 'css-ui-bg-subcontrols' });
	body.toggleClass('is-collapsed', !isEnabled);

	/** Write one token through the engine and refresh the preview. */
	const applyToken = (key: string, value: string): void => {
		tokenMap.set(key, value);
		if (view.engine) {
			view.engine.setToken(view.activeMode, key, value);
		}
		view.invalidateCompanionCache();
		view.scheduleLiveStyleUpdate(false);
		view.debouncedSave();
	};

	// Picker row
	const row = body.createDiv({ cls: 'css-ui-bg-pattern-row' });
	const labelGroup = row.createDiv({ cls: 'css-ui-bg-label-group' });
	labelGroup.createSpan({ text: 'Animated Backgrounds', cls: 'css-ui-bg-label-title' });
	const position = labelGroup.createSpan({ cls: 'css-ui-bg-style-position' });

	const stepper = row.createDiv({ cls: 'css-ui-bg-stepper' });
	const prevBtn = stepper.createEl('button', {
		cls: 'css-ui-bg-step-btn',
		attr: { type: 'button', 'aria-label': 'Previous animated background', title: 'Previous animated background' },
	});
	setIcon(prevBtn, 'chevron-left');

	const dropdown = new DropdownComponent(stepper);
	// Every entry is a real flipbook; the first one is the default, and the
	// master toggle is the only way to return to a static pattern.
	const order = ANIMATED_PATTERN_STYLES.map((s) => s.id);
	for (const style of ANIMATED_PATTERN_STYLES) {
		dropdown.addOption(style.id, style.label);
	}
	dropdown.setValue(current);

	const nextBtn = stepper.createEl('button', {
		cls: 'css-ui-bg-step-btn',
		attr: { type: 'button', 'aria-label': 'Next animated background', title: 'Next animated background' },
	});
	setIcon(nextBtn, 'chevron-right');

	const updatePosition = (val: string): void => {
		const index = order.indexOf(val);
		position.setText(`Flipbook ${Math.max(0, index) + 1} of ${order.length}`);
	};
	updatePosition(current);

	// The Pattern Style's Area wins while the base background is on, so say so
	// next to the picker rather than letting the Area control look broken.
	const areaNote = body.createDiv({
		cls: `css-control-disclaimer-note ${(tokenMap.get('--ui-bg-enabled') ?? 'false') === 'true' ? '' : 'is-collapsed'}`,
	});
	areaNote.createSpan({ text: 'Adopts the Standard Backgrounds Area above while Standard Backgrounds is enabled.' });

	// Its own full control set, mirroring the base Custom Backgrounds section but
	// writing the flipbook's private tokens so neither layer can affect the other.
	const grid = body.createDiv({ cls: 'css-ui-bg-grid' });

	// Area
	const scopeBox = grid.createDiv({ cls: 'css-ui-bg-field' });
	scopeBox.createSpan({ text: 'Area', cls: 'css-control-label' });
	const scopeDropdown = new DropdownComponent(scopeBox);
	for (const opt of BACKGROUND_SCOPE_OPTIONS) {
		scopeDropdown.addOption(opt.value, opt.label);
	}
	scopeDropdown.setValue(tokenMap.get('--ui-bg-flipbook-scope') ?? (tokenMap.get('--ui-bg-scope') ?? 'editor'));
	scopeDropdown.onChange((val) => applyToken('--ui-bg-flipbook-scope', val));

	// Pattern Size / Spacing
	const sizeBox = grid.createDiv({ cls: 'css-ui-bg-field' });
	const sizeHeader = sizeBox.createDiv({ cls: 'css-control-header-row' });
	sizeHeader.createSpan({ text: 'Pattern Size / Spacing', cls: 'css-control-label' });
	const sizeRaw = parseInt(tokenMap.get('--ui-bg-flipbook-size') ?? (tokenMap.get('--ui-bg-size') ?? '24px'), 10) || 24;
	const sizeValue = Math.min(72, Math.max(12, sizeRaw));
	const sizeBadge = sizeHeader.createSpan({ text: `${sizeValue}px`, cls: 'css-control-val-badge' });
	const sizeSlider = sizeBox.createEl('input', { type: 'range', cls: 'css-control-slider' });
	sizeSlider.min = '12';
	sizeSlider.max = '72';
	sizeSlider.step = '2';
	sizeSlider.value = String(sizeValue);
	sizeSlider.setAttribute('title', 'Double-click to reset to 24px');
	const applySize = (val: number): void => {
		const px = Math.min(72, Math.max(12, val));
		sizeBadge.setText(`${px}px`);
		applyToken('--ui-bg-flipbook-size', `${px}px`);
	};
	sizeSlider.addEventListener('input', (e) => applySize(parseInt((e.target as HTMLInputElement).value, 10) || 24));
	sizeSlider.addEventListener('dblclick', () => {
		sizeSlider.value = '24';
		applySize(24);
	});

	// X Offset
	const offsetXBox = grid.createDiv({ cls: 'css-ui-bg-field' });
	const offsetXHeader = offsetXBox.createDiv({ cls: 'css-control-header-row' });
	offsetXHeader.createSpan({ text: 'X Offset', cls: 'css-control-label' });
	const offXRaw = parseFloat(tokenMap.get('--ui-bg-flipbook-offset-x') ?? '0') || 0;
	const offXValue = Math.min(100, Math.max(-100, Math.round(offXRaw)));
	const offXBadge = offsetXHeader.createSpan({ text: `${offXValue}vw`, cls: 'css-control-val-badge' });
	const offsetXSlider = offsetXBox.createEl('input', { type: 'range', cls: 'css-control-slider' });
	offsetXSlider.min = '-100';
	offsetXSlider.max = '100';
	offsetXSlider.step = '1';
	offsetXSlider.value = String(offXValue);
	offsetXSlider.setAttribute('title', 'Double-click to reset to 0');
	const applyOffsetX = (val: number): void => {
		const v = Math.min(100, Math.max(-100, Math.round(val)));
		offXBadge.setText(`${v}vw`);
		applyToken('--ui-bg-flipbook-offset-x', String(v));
	};
	offsetXSlider.addEventListener('input', (e) => applyOffsetX(parseFloat((e.target as HTMLInputElement).value) || 0));
	offsetXSlider.addEventListener('dblclick', () => {
		offsetXSlider.value = '0';
		applyOffsetX(0);
	});

	// Y Offset
	const offsetYBox = grid.createDiv({ cls: 'css-ui-bg-field' });
	const offsetYHeader = offsetYBox.createDiv({ cls: 'css-control-header-row' });
	offsetYHeader.createSpan({ text: 'Y Offset', cls: 'css-control-label' });
	const offYRaw = parseFloat(tokenMap.get('--ui-bg-flipbook-offset-y') ?? '0') || 0;
	const offYValue = Math.min(100, Math.max(-100, Math.round(offYRaw)));
	const offYBadge = offsetYHeader.createSpan({ text: `${offYValue}vh`, cls: 'css-control-val-badge' });
	const offsetYSlider = offsetYBox.createEl('input', { type: 'range', cls: 'css-control-slider' });
	offsetYSlider.min = '-100';
	offsetYSlider.max = '100';
	offsetYSlider.step = '1';
	offsetYSlider.value = String(offYValue);
	offsetYSlider.setAttribute('title', 'Double-click to reset to 0');
	const applyOffsetY = (val: number): void => {
		const v = Math.min(100, Math.max(-100, Math.round(val)));
		offYBadge.setText(`${v}vh`);
		applyToken('--ui-bg-flipbook-offset-y', String(v));
	};
	offsetYSlider.addEventListener('input', (e) => applyOffsetY(parseFloat((e.target as HTMLInputElement).value) || 0));
	offsetYSlider.addEventListener('dblclick', () => {
		offsetYSlider.value = '0';
		applyOffsetY(0);
	});

	// Pattern Opacity
	const opacityBox = grid.createDiv({ cls: 'css-ui-bg-field' });
	const opHeader = opacityBox.createDiv({ cls: 'css-control-header-row' });
	opHeader.createSpan({ text: 'Pattern Opacity', cls: 'css-control-label' });
	const opRaw = parseFloat(tokenMap.get('--ui-bg-flipbook-opacity') ?? (tokenMap.get('--ui-bg-opacity') ?? '0.35'));
	const opValue = isFinite(opRaw) ? Math.min(1, Math.max(0.01, opRaw)) : 0.35;
	const opBadge = opHeader.createSpan({ text: `${Math.round(opValue * 100)}%`, cls: 'css-control-val-badge' });
	const opSlider = opacityBox.createEl('input', { type: 'range', cls: 'css-control-slider' });
	opSlider.min = '0.01';
	opSlider.max = '1.0';
	opSlider.step = '0.01';
	opSlider.value = String(opValue);
	opSlider.setAttribute('title', 'Double-click to reset to 35%');
	const applyOpacity = (val: number): void => {
		opBadge.setText(`${Math.round(val * 100)}%`);
		const strVal = val.toFixed(2).replace(/\.?0+$/, '') || '0.01';
		applyToken('--ui-bg-flipbook-opacity', strVal);
	};
	opSlider.addEventListener('input', (e) => applyOpacity(parseFloat((e.target as HTMLInputElement).value)));
	opSlider.addEventListener('dblclick', () => {
		opSlider.value = '0.35';
		applyOpacity(0.35);
	});

	// Pattern Tint Color
	const colorBox = grid.createDiv({ cls: 'css-ui-bg-field' });
	const colorHeader = colorBox.createDiv({ cls: 'css-control-header-row' });
	colorHeader.createSpan({ text: 'Pattern Tint Color', cls: 'css-control-label' });
	const colorRow = colorBox.createDiv({ cls: 'css-ui-bg-color-row' });
	const baseColor = tokenMap.get('--ui-bg-flipbook-color') ?? (tokenMap.get('--ui-bg-color') ?? defaultColor);
	const colorPicker = colorRow.createEl('input', { type: 'color', cls: 'css-color-picker-input' });
	colorPicker.value = baseColor.startsWith('#') && baseColor.length === 7 ? baseColor : defaultColor;
	const colorHex = colorRow.createEl('input', { type: 'text', cls: 'css-color-hex-input', value: baseColor });
	const applyColor = (raw: string): void => {
		let hex = (raw || '').trim();
		if (!hex.startsWith('#') && /^[0-9a-fA-F]{3,8}$/.test(hex)) hex = '#' + hex;
		if (hex.startsWith('#') && hex.length === 4) hex = '#' + hex.slice(1).split('').map((c) => c + c).join('');
		if (hex.startsWith('#') && hex.length === 7) colorPicker.value = hex;
		colorHex.value = hex;
		applyToken('--ui-bg-flipbook-color', hex);
	};
	colorPicker.addEventListener('input', () => applyColor(colorPicker.value));
	colorPicker.addEventListener('change', () => applyColor(colorPicker.value));
	colorHex.addEventListener('input', () => applyColor(colorHex.value));
	colorHex.addEventListener('change', () => applyColor(colorHex.value));

	// Animation Speed
	const speedBox = grid.createDiv({ cls: 'css-ui-bg-field' });
	const speedHeader = speedBox.createDiv({ cls: 'css-control-header-row' });
	speedHeader.createSpan({ text: 'Animated Pattern Speed', cls: 'css-control-label' });
	const rawSpeed = parseFloat(tokenMap.get('--ui-bg-flipbook-speed') ?? '1');
	const speedValue = isFinite(rawSpeed) && rawSpeed > 0 ? Math.min(3, Math.max(0.25, rawSpeed)) : 1;
	const speedBadge = speedHeader.createSpan({ text: `${Number(speedValue.toFixed(2))}x`, cls: 'css-control-val-badge' });
	const speedSlider = speedBox.createEl('input', { type: 'range', cls: 'css-control-slider' });
	speedSlider.min = '0.25';
	speedSlider.max = '3';
	speedSlider.step = '0.05';
	speedSlider.value = String(speedValue);
	speedSlider.setAttribute('title', 'Double-click to reset to 1x');
	const applySpeed = (val: number): void => {
		const clamped = Math.min(3, Math.max(0.25, val));
		const display = Number(clamped.toFixed(2));
		speedBadge.setText(`${display}x`);
		applyToken('--ui-bg-flipbook-speed', String(display));
	};
	speedSlider.addEventListener('input', (e) => applySpeed(parseFloat((e.target as HTMLInputElement).value)));
	speedSlider.addEventListener('dblclick', () => {
		speedSlider.value = '1';
		applySpeed(1);
	});

	const apply = (val: string): void => {
		const style = ANIMATED_PATTERN_STYLES.find((s) => s.id === val);
		if (style) {
			// Picking a style switches this section on (independently of the base
			// Custom Backgrounds toggle) and seeds its own Area from the base
			// pattern's the first time so it lines up out of the box.
			tokenMap.set('--ui-bg-flipbook-enabled', 'true');
			if (view.engine) {
				view.engine.setToken(view.activeMode, '--ui-bg-flipbook-enabled', 'true');
			}
			toggle.setValue(true);
			body.removeClass('is-collapsed');
			warning.removeClass('is-collapsed');
			if (!tokenMap.get('--ui-bg-flipbook-scope')) {
				applyToken('--ui-bg-flipbook-scope', tokenMap.get('--ui-bg-scope') ?? 'editor');
			}
		}
		const id = style ? style.id : firstStyleId;
		applyToken('--ui-bg-flipbook', id);
		updatePosition(id);
	};

	dropdown.onChange((val) => apply(val));
	const step = (delta: number): void => {
		const at = Math.max(0, order.indexOf(tokenMap.get('--ui-bg-flipbook') ?? ''));
		const target = (((at + delta) % order.length) + order.length) % order.length;
		apply(order[target] ?? firstStyleId);
	};
	prevBtn.addEventListener('click', () => step(-1));
	nextBtn.addEventListener('click', () => step(1));

	toggle.onChange((val) => {
		tokenMap.set('--ui-bg-flipbook-enabled', val ? 'true' : 'false');
		if (view.engine) {
			view.engine.setToken(view.activeMode, '--ui-bg-flipbook-enabled', val ? 'true' : 'false');
		}
		// With "None" gone, switching the section on must play a real style, so
		// seed the default (winking face) when nothing valid is selected yet.
		if (val && !ANIMATED_PATTERN_STYLES.some((s) => s.id === tokenMap.get('--ui-bg-flipbook'))) {
			applyToken('--ui-bg-flipbook', firstStyleId);
			updatePosition(firstStyleId);
		}
		toggle.setTooltip(`Toggle Animated Backgrounds ${val ? 'off' : 'on'}`);
		body.toggleClass('is-collapsed', !val);
		warning.toggleClass('is-collapsed', !val);
		view.invalidateCompanionCache();
		view.scheduleLiveStyleUpdate(false);
		view.debouncedSave();
	});
}

export const renderAnimatedPatternSection = renderAnimatedBackgroundsSection;

export function renderFrostedGlassSection(view: CssDesignerPopoutView, container: HTMLElement): void {
	const glassSection = container.createDiv({ cls: 'css-designer-section css-ui-glass-section' });
	const glassHeader = glassSection.createDiv({ cls: 'css-section-header css-ui-glass-header' });
	const titleSpan = glassHeader.createSpan({ cls: 'css-hero-heading' });
	const heroIcon = titleSpan.createSpan({ cls: 'css-hero-icon' });
	setIcon(heroIcon, 'sparkles');
	titleSpan.createSpan({ text: 'Frosted Glass Look' });

	const tokenMap = view.getActiveTokenMap();
	const enabledMap = view.getActiveEnabledMap();
	const isGlassActive = tokenMap.get('--glass-enabled') === 'true';

	const toggleWrap = glassHeader.createDiv({ cls: 'css-boolean-toggle-wrap' });
	const toggleComp = new ToggleComponent(toggleWrap)
		.setValue(isGlassActive)
		.setTooltip(`Toggle Frosted Glass Look ${isGlassActive ? 'off' : 'on'}`);

	const subcontrolsEl = glassSection.createDiv({
		cls: `css-feature-subcontrols css-glass-subcontrols ${isGlassActive ? '' : 'is-disabled'}`,
	});

	const handleToggle = (checked: boolean) => {
		const chosen = checked ? 'true' : 'false';
		enabledMap.set('--glass-enabled', true);
		tokenMap.set('--glass-enabled', chosen);

		if (checked) {
			tokenMap.set('--glass-blur', '48px');
			enabledMap.set('--glass-blur', true);
			tokenMap.set('--tab-curve', '0px');
			enabledMap.set('--tab-curve', true);
			if (view.engine) {
				view.engine.setToken(view.activeMode, '--glass-blur', '48px');
				view.engine.setToken(view.activeMode, '--tab-curve', '0px');
			}
			for (const doc of view.getAllTargetDocuments()) {
				doc.documentElement.setCssProps({ ['--glass-blur']: '48px' });
				doc.documentElement.setCssProps({ ['--tab-curve']: '0px' });
			}
		} else {
			tokenMap.set('--tab-curve', '6px');
			enabledMap.set('--tab-curve', true);
			if (view.engine) {
				view.engine.setToken(view.activeMode, '--tab-curve', '6px');
			}
			for (const doc of view.getAllTargetDocuments()) {
				// Only if this plugin added it; the class is Obsidian's own.
				if (doc.body.dataset.cssDesignerOwnsTranslucent === 'true') {
					doc.body.classList.remove('is-translucent');
					delete doc.body.dataset.cssDesignerOwnsTranslucent;
				}
				doc.getElementById('css-snippet-designer-translucency-fix')?.remove();
				doc.documentElement.style.removeProperty('--glass-blur');
				doc.documentElement.style.removeProperty('--tab-curve');
				doc.documentElement.style.removeProperty('--glass-opacity');
				doc.documentElement.style.removeProperty('--glass-tint-enabled');
				doc.documentElement.style.removeProperty('--glass-tint-color');
			}
		}

		if (view.engine) {
			view.engine.setToken(view.activeMode, '--glass-enabled', chosen);
		}

		toggleComp.setValue(checked);
		toggleComp.setTooltip(`Toggle Frosted Glass Look ${checked ? 'off' : 'on'}`);
		view.invalidateCompanionCache();
		view.lastTranslucencyOn = null;
		subcontrolsEl.toggleClass('is-disabled', !checked);
		view.scheduleLiveStyleUpdate(false);
		view.updateStatus(`Updated Frosted Glass Look to ${checked ? 'enabled' : 'disabled'}`);
		view.debouncedSave();
		view.renderUI();
	};

	toggleComp.onChange(handleToggle);

	// 1. Background Opacity Slider
	const opacityRow = subcontrolsEl.createDiv({ cls: 'css-subcontrol-item' });
	const opLabel = opacityRow.createDiv({ cls: 'css-subcontrol-label' });
	opLabel.createSpan({ text: 'Background Opacity' });

	const opInputWrap = opacityRow.createDiv({ cls: 'css-subcontrol-input-wrap' });
	const opSlider = opInputWrap.createEl('input', {
		type: 'range',
		cls: 'css-slider',
	});
	opSlider.min = '0.00';
	opSlider.max = '1.00';
	opSlider.step = '0.01';
	const defaultOp = view.activeMode === '.theme-dark' ? '0.75' : '0.80';
	const curOp = tokenMap.get('--glass-opacity') ?? defaultOp;
	opSlider.value = curOp;
	opSlider.setAttribute('title', 'Double-click to reset to default');
	const opBadge = opInputWrap.createSpan({
		cls: 'css-subcontrol-value-badge',
		text: `${Math.round(parseFloat(curOp) * 100)}%`,
	});

	opSlider.addEventListener('input', (e) => {
		const val = (e.target as HTMLInputElement).value;
		tokenMap.set('--glass-opacity', val);
		enabledMap.set('--glass-opacity', true);
		opBadge.setText(`${Math.round(parseFloat(val) * 100)}%`);
		if (tokenMap.get('--glass-enabled') !== 'true') {
			handleToggle(true);
		}
		if (view.engine) {
			view.engine.setToken(view.activeMode, '--glass-opacity', val);
		}
		for (const doc of view.getAllTargetDocuments()) {
			doc.documentElement.setCssProps({ ['--glass-opacity']: val });
		}
		view.invalidateCompanionCache();
		view.scheduleLiveStyleUpdate(false);
		view.debouncedSave();
	});

	opSlider.addEventListener('dblclick', () => {
		opSlider.value = defaultOp;
		tokenMap.set('--glass-opacity', defaultOp);
		enabledMap.set('--glass-opacity', true);
		opBadge.setText(`${Math.round(parseFloat(defaultOp) * 100)}%`);
		if (tokenMap.get('--glass-enabled') !== 'true') {
			handleToggle(true);
		}
		if (view.engine) {
			view.engine.setToken(view.activeMode, '--glass-opacity', defaultOp);
		}
		for (const doc of view.getAllTargetDocuments()) {
			doc.documentElement.setCssProps({ ['--glass-opacity']: defaultOp });
		}
		view.invalidateCompanionCache();
		view.scheduleLiveStyleUpdate(false);
	});

	// 2. Transparent Screen Tint (Toggleable Color Picker)
	const tintRow = subcontrolsEl.createDiv({ cls: 'css-subcontrol-item css-glass-tint-row' });
	const tintLabel = tintRow.createDiv({ cls: 'css-subcontrol-label' });
	tintLabel.createSpan({ text: 'Screen Tint Color' });

	const tintInputWrap = tintRow.createDiv({ cls: 'css-subcontrol-input-wrap' });

	const isTintOn = tokenMap.get('--glass-tint-enabled') === 'true';
	const defaultTint = '#7c3aed';
	const curTint = tokenMap.get('--glass-tint-color') ?? defaultTint;

	const tintPickerItem = tintInputWrap.createDiv({ cls: `css-glass-tint-picker-item ${isTintOn ? '' : 'is-disabled'}` });
	const tintPicker = tintPickerItem.createEl('input', {
		type: 'color',
		cls: 'css-color-picker css-color-picker-mini',
	});
	tintPicker.value = curTint.startsWith('#') && curTint.length === 7 ? curTint : defaultTint;
	tintPicker.title = `Screen Tint Color (${tintPicker.value}) - Double-click to reset`;
	tintPicker.disabled = !isTintOn;

	const tintHexBadge = tintPickerItem.createSpan({
		cls: 'css-subcontrol-value-badge css-glass-tint-hex',
		text: tintPicker.value,
	});
	tintHexBadge.title = 'Double-click to reset to default tint (#7c3aed)';

	const tintToggle = new ToggleComponent(tintInputWrap)
		.setValue(isTintOn)
		.setTooltip(`Toggle screen tint ${isTintOn ? 'off' : 'on'}`);

	const applyTint = (colorVal: string, enabled: boolean) => {
		tokenMap.set('--glass-tint-enabled', enabled ? 'true' : 'false');
		enabledMap.set('--glass-tint-enabled', true);
		tokenMap.set('--glass-tint-color', colorVal);
		enabledMap.set('--glass-tint-color', true);

		tintPickerItem.toggleClass('is-disabled', !enabled);
		tintPicker.disabled = !enabled;
		tintPicker.value = colorVal;
		tintHexBadge.setText(colorVal);

		if (enabled && tokenMap.get('--glass-enabled') !== 'true') {
			handleToggle(true);
		}

		if (view.engine) {
			view.engine.setToken(view.activeMode, '--glass-tint-enabled', enabled ? 'true' : 'false');
			view.engine.setToken(view.activeMode, '--glass-tint-color', colorVal);
		}
		for (const doc of view.getAllTargetDocuments()) {
			doc.documentElement.setCssProps({ ['--glass-tint-enabled']: enabled ? 'true' : 'false' });
			doc.documentElement.setCssProps({ ['--glass-tint-color']: colorVal });
		}
		view.invalidateCompanionCache();
		view.scheduleLiveStyleUpdate(false);
		view.debouncedSave();
	};

	tintToggle.onChange((checked) => {
		applyTint(tintPicker.value, checked);
	});

	tintPicker.addEventListener('input', (e) => {
		const val = (e.target as HTMLInputElement).value;
		applyTint(val, true);
		tintToggle.setValue(true);
	});

	tintPicker.addEventListener('dblclick', () => {
		applyTint(defaultTint, true);
		tintToggle.setValue(true);
	});

	tintHexBadge.addEventListener('dblclick', () => {
		applyTint(defaultTint, true);
		tintToggle.setValue(true);
	});
}

export function renderElementsTab(view: CssDesignerPopoutView, container: HTMLElement): void {
	const tokenMap = view.getActiveTokenMap();

	// 0. FROSTED GLASS LOOK SECTION (Moved to the top of UI Elements tab)
	renderFrostedGlassSection(view, container);

	// 1. CUSTOM BACKGROUNDS SECTION (Dropdown & Toggle at the top; includes Animated Backgrounds subsection)
	renderCustomBackgroundSection(view, container, tokenMap);

	// 2. LAYOUT MODS SECTION
	renderLayoutModsSection(view, container);

	// INDIVIDUAL UI ELEMENT CARDS
	const elementCardUpdaters = new Map<string, (val: number) => void>();
	const elementHoverToggles = new Map<string, ToggleComponent>();
	const childEffectiveUpdaters = new Map<string, () => void>();

	const elementOpacity = (el: UIElementConfig): number => {
		const fallback = view.activeMode === '.theme-dark' ? el.defaultOpacityDark : el.defaultOpacityLight;
		const n = parseFloat(tokenMap.get(`--ui-${el.id}-opacity`) ?? fallback);
		return isNaN(n) ? 1 : n;
	};

	// 5. INDIVIDUAL UI ELEMENT CARDS
	const individualSection = container.createDiv({ cls: 'css-designer-section' });
	const indHeader = individualSection.createDiv({ cls: 'css-section-header' });
	const titleSpan = indHeader.createSpan({ cls: 'css-hero-heading' });
	const heroIcon = titleSpan.createSpan({ cls: 'css-hero-icon' });
	setIcon(heroIcon, 'sliders-horizontal');
	titleSpan.createSpan({ text: 'Individual UI Element Opacity Sliders' });

	const UI_CATEGORIES: {
		id: string;
		label: string;
		title: string;
		desc?: string;
		icon: string;
	}[] = [
		{
			id: 'borders',
			label: 'Borders & Outlines',
			title: 'Borders, Dividers & Outlines',
			icon: 'square',
		},
		{
			id: 'navigation',
			label: 'Navigation & Docks',
			title: 'Navigation, Ribbons & Sidebars',
			icon: 'compass',
		},
		{
			id: 'chrome',
			label: 'Window Chrome',
			title: 'Window & Workspace Chrome',
			icon: 'app-window',
		},
		{
			id: 'editor',
			label: 'Editor Canvas',
			title: 'Editor & Note Canvas',
			icon: 'edit-3',
		},
	];

	const renderCategoryGroup = (catId: 'borders' | 'navigation' | 'chrome' | 'editor') => {
		const catMeta = UI_CATEGORIES.find((c) => c.id === catId);
		if (!catMeta) return;

		const elementsInCat = UI_ELEMENTS.filter((e) => e.category === catId);
		if (elementsInCat.length === 0) return;

		const groupContainer = individualSection.createDiv({ cls: 'css-ui-category-group' });

		const groupHeader = groupContainer.createDiv({ cls: 'css-ui-category-header' });
		const titleBox = groupHeader.createDiv({ cls: 'css-ui-category-titlebox' });
		titleBox.createSpan({ text: catMeta.title, cls: 'css-ui-category-title' });
		if (catMeta.desc) {
			titleBox.createEl('p', { text: catMeta.desc, cls: 'css-ui-category-desc' });
		}

		const groupActions = groupHeader.createDiv({ cls: 'css-ui-category-actions' });
		const hideGroupBtn = groupActions.createEl('button', {
			text: 'Fade group (0%)',
			cls: 'css-ui-category-btn',
		});
		hideGroupBtn.setAttribute('title', `Fade all ${catMeta.label} to 0% opacity`);
		hideGroupBtn.addEventListener('click', () => {
			for (const el of elementsInCat) {
				tokenMap.set(`--ui-${el.id}-opacity`, '0');
				if (view.engine) {
					view.engine.setToken(view.activeMode, `--ui-${el.id}-opacity`, '0');
				}
				elementCardUpdaters.get(el.id)?.(0);
			}
			view.invalidateCompanionCache();
			view.scheduleLiveStyleUpdate(false);
			view.debouncedSave();
			new Notice(`${catMeta.label} faded to 0% opacity`);
		});

		const restoreGroupBtn = groupActions.createEl('button', {
			text: 'Restore (100%)',
			cls: 'css-ui-category-btn',
		});
		restoreGroupBtn.setAttribute('title', `Restore all ${catMeta.label} to 100% opacity`);
		restoreGroupBtn.addEventListener('click', () => {
			for (const el of elementsInCat) {
				tokenMap.set(`--ui-${el.id}-opacity`, '1');
				if (view.engine) {
					view.engine.setToken(view.activeMode, `--ui-${el.id}-opacity`, '1');
				}
				elementCardUpdaters.get(el.id)?.(1.0);
			}
			view.invalidateCompanionCache();
			view.scheduleLiveStyleUpdate(false);
			view.debouncedSave();
			new Notice(`${catMeta.label} restored to 100% opacity`);
		});

		// Hover reveal was settable per card or globally, with nothing in between.
		const groupHoverCapable = elementsInCat.filter((e) => e.supportsHoverReveal);
		if (groupHoverCapable.length > 0) {
			const groupHoverWrap = groupActions.createDiv({ cls: 'css-ui-card-hover-wrap' });
			groupHoverWrap.createSpan({ text: 'Reveal on hover', cls: 'css-ui-hover-label' });
			new ToggleComponent(groupHoverWrap)
				.setValue(groupHoverCapable.every((e) => tokenMap.get(`--ui-${e.id}-hover-reveal`) === 'true'))
				.setTooltip(`Reveal every ${catMeta.label} element on hover`)
				.onChange((val) => {
					for (const e of groupHoverCapable) {
						tokenMap.set(`--ui-${e.id}-hover-reveal`, val ? 'true' : 'false');
						elementHoverToggles.get(e.id)?.setValue(val);
					}
					view.invalidateCompanionCache();
					view.scheduleLiveStyleUpdate(false);
					view.debouncedSave();
				});
		}

		const grid = groupContainer.createDiv({ cls: 'css-ui-element-grid' });

		for (const el of elementsInCat) {
			const defaultVal = parseFloat(view.activeMode === '.theme-dark' ? el.defaultOpacityDark : el.defaultOpacityLight);
			const curVal = parseFloat(tokenMap.get(`--ui-${el.id}-opacity`) ?? (view.activeMode === '.theme-dark' ? el.defaultOpacityDark : el.defaultOpacityLight));
			const isHoverOn = tokenMap.get(`--ui-${el.id}-hover-reveal`) === 'true';

			const card = grid.createDiv({
				cls: `css-ui-element-card ${curVal === 0 ? 'is-zero-opacity' : ''}`,
			});

			// Top row: Icon, Label, Category & Opacity Badge
			const cardTop = card.createDiv({ cls: 'css-ui-card-top' });
			const cardTitleBox = cardTop.createDiv({ cls: 'css-ui-card-titlebox' });
			const iconSpan = cardTitleBox.createSpan({ cls: 'css-ui-card-icon' });
			setIcon(iconSpan, el.icon);
			cardTitleBox.createSpan({ text: el.label, cls: 'css-ui-card-title' });

			const badge = cardTop.createSpan({
				cls: `css-opacity-badge ${curVal === 0 ? 'is-hidden' : ''}`,
				text: curVal === 0 ? '0% Hidden' : `${Math.round(curVal * 100)}%`,
			});

			// Description (only rendered when provided)
			if (el.description) {
				card.createEl('p', { text: el.description, cls: 'css-ui-card-desc' });
			}

			// Slider Row (Slider + Number Input)
			const sliderRow = card.createDiv({ cls: 'css-ui-card-slider-row' });
			const slider = sliderRow.createEl('input', {
				type: 'range',
				cls: 'css-control-slider css-ui-card-slider',
			});
			slider.min = '0';
			slider.max = '1';
			slider.step = '0.01';
			slider.value = String(curVal);
			slider.setAttribute('title', 'Double-click to reset to default');
			slider.setAttribute('aria-label', `${el.label} opacity`);

			// Typing a figure beats hunting for it on a 101-step slider inside a
			// narrow card.
			const numberInput = sliderRow.createEl('input', {
				type: 'number',
				cls: 'css-ui-card-number',
			});
			numberInput.min = '0';
			numberInput.max = '100';
			numberInput.step = '1';
			numberInput.value = String(Math.round(curVal * 100));
			numberInput.setAttribute('aria-label', `${el.label} opacity, percent`);

			const setElementOpacity = (v: number) => {
				const strVal = v.toFixed(2).replace(/\.?0+$/, '') || '0';
				tokenMap.set(`--ui-${el.id}-opacity`, strVal);
				if (view.engine) {
					view.engine.setToken(view.activeMode, `--ui-${el.id}-opacity`, strVal);
				}
				slider.value = String(v);
				numberInput.value = String(Math.round(v * 100));
				badge.setText(v === 0 ? '0% Hidden' : `${Math.round(v * 100)}%`);
				badge.toggleClass('is-hidden', v === 0);
				card.toggleClass('is-zero-opacity', v === 0);
				for (const refresh of childEffectiveUpdaters.values()) refresh();
				view.invalidateCompanionCache();
				view.scheduleLiveStyleUpdate(false);
				view.debouncedSave();
			};

			elementCardUpdaters.set(el.id, (v: number) => {
				slider.value = String(v);
				numberInput.value = String(Math.round(v * 100));
				badge.setText(v === 0 ? '0% Hidden' : `${Math.round(v * 100)}%`);
				badge.toggleClass('is-hidden', v === 0);
				card.toggleClass('is-zero-opacity', v === 0);
			});

			numberInput.addEventListener('change', () => {
				const pct = parseFloat(numberInput.value);
				if (isNaN(pct)) {
					numberInput.value = String(Math.round(parseFloat(slider.value) * 100));
					return;
				}
				setElementOpacity(Math.min(100, Math.max(0, Math.round(pct))) / 100);
			});

			slider.addEventListener('input', (e) => {
				const val = parseFloat((e.target as HTMLInputElement).value);
				setElementOpacity(val);
			});

			slider.addEventListener('dblclick', () => {
				setElementOpacity(defaultVal);
			});


			// `opacity` multiplies down the tree, so a card nested inside another can
			// never exceed its parent. Report what the user will actually see rather
			// than a figure the slider cannot deliver.
			const parent = el.parentId ? UI_ELEMENTS.find((p) => p.id === el.parentId) : undefined;
			if (parent) {
				const note = card.createEl('p', { cls: 'css-ui-card-desc' });
				const refreshNote = () => {
					const parentVal = elementOpacity(parent);
					const ownVal = parseFloat(slider.value);
					if (parentVal >= 1) {
						// `.is-hidden` is a red badge style here, not a visibility class.
						note.hidden = true;
						note.setText('');
						return;
					}
					note.hidden = false;
					note.setText(
						`Effective: ${Math.round(ownVal * parentVal * 100)}% — capped by ${parent.label} at ${Math.round(parentVal * 100)}%.`,
					);
				};
				refreshNote();
				childEffectiveUpdaters.set(el.id, refreshNote);
			}

			if (el.platformNote) {
				card.createEl('p', { text: el.platformNote, cls: 'css-ui-card-desc' });
			}

			// Bottom row: Hover reveal toggle + selector hint
			const cardBottom = card.createDiv({ cls: 'css-ui-card-bottom' });
			if (el.supportsHoverReveal) {
				const hoverWrap = cardBottom.createDiv({ cls: 'css-ui-card-hover-wrap' });
				hoverWrap.createSpan({ text: 'Reveal on hover', cls: 'css-ui-hover-label' });
				const elemHoverToggle = new ToggleComponent(hoverWrap)
					.setValue(isHoverOn)
					.setTooltip('Smoothly restore to 100% opacity when the mouse hovers over this element')
					.onChange((val) => {
						tokenMap.set(`--ui-${el.id}-hover-reveal`, val ? 'true' : 'false');
						view.invalidateCompanionCache();
						view.scheduleLiveStyleUpdate(false);
						view.debouncedSave();
					});
				elementHoverToggles.set(el.id, elemHoverToggle);
			} else {
				// No hover rule is emitted for this element, so offering the switch
				// would promise behaviour that never arrives.
				cardBottom.createSpan({ text: 'No hover reveal for this element', cls: 'css-ui-hover-label' });
			}
		}
	};

	renderCategoryGroup('borders');
	renderCategoryGroup('navigation');
	renderCategoryGroup('chrome');
	renderCategoryGroup('editor');
}

export function renderShadowsTab(view: CssDesignerPopoutView, container: HTMLElement): void {
	const tokenMap = view.getActiveTokenMap();
	// Cards flow in a compact responsive grid instead of one full-width stack, so
	// the whole catalogue is scannable at a glance.
	const grid = container.createDiv({ cls: 'css-shadow-cards-grid' });

	for (const el of SHADOW_ELEMENTS) {
		const isEnabled = tokenMap.get(`--sh-${el.id}-enabled`) === 'true';
		const currentMode = tokenMap.get(`--sh-${el.id}-mode`) ?? el.defaultMode;

		const card = grid.createDiv({
			cls: `css-shadow-card ${isEnabled ? 'is-enabled' : ''}`,
		});

		// 1. Card Header
		const header = card.createDiv({ cls: 'css-shadow-card-header' });
		const titleGroup = header.createDiv({ cls: 'css-shadow-card-title-group' });
		titleGroup.createSpan({ text: el.label, cls: 'css-shadow-card-title' });
		titleGroup.setAttribute('title', el.description);
		if (el.warning) {
			titleGroup.createSpan({ text: el.warning, cls: 'css-shadow-card-warning' });
		}

		const actions = header.createDiv({ cls: 'css-shadow-card-actions' });

		// Mode Pill Group (Shadow vs Glow)
		const pillGroup = actions.createDiv({ cls: 'css-mode-pill-group' });
		const shadowPill = pillGroup.createSpan({
			text: '🌑 Shadow',
			cls: `css-mode-pill ${currentMode === 'shadow' ? 'is-active' : ''}`,
		});
		const glowPill = pillGroup.createSpan({
			text: '✨ Glow',
			cls: `css-mode-pill ${currentMode === 'glow' ? 'is-active' : ''}`,
		});

		// Master Card Enable Toggle
		const toggleWrap = actions.createDiv({ cls: 'css-control-toggle-wrap' });
		new ToggleComponent(toggleWrap)
			.setValue(isEnabled)
			.setTooltip(`Enable drop shadow / glow for ${el.label}`)
			.onChange((active) => {
				tokenMap.set(`--sh-${el.id}-enabled`, active ? 'true' : 'false');
				card.toggleClass('is-enabled', active);
				view.renderUI();
				view.invalidateCompanionCache();
				view.scheduleLiveStyleUpdate(false);
				view.debouncedSave();
			});

		shadowPill.addEventListener('click', () => {
			tokenMap.set(`--sh-${el.id}-mode`, 'shadow');
			tokenMap.set(`--sh-${el.id}-x`, '0px');
			tokenMap.set(`--sh-${el.id}-y`, '4px');
			tokenMap.set(`--sh-${el.id}-blur`, '12px');
			tokenMap.set(`--sh-${el.id}-spread`, '0px');
			const curCol = tokenMap.get(`--sh-${el.id}-color`);
			if (curCol === '#7c3aed' || curCol === '#6d28d9') {
				tokenMap.set(`--sh-${el.id}-color`, view.activeMode === '.theme-dark' ? el.defaultColorDark : el.defaultColorLight);
			}
			const curOp = parseFloat(tokenMap.get(`--sh-${el.id}-opacity`) ?? '0');
			if (curOp > 0.45) {
				tokenMap.set(`--sh-${el.id}-opacity`, view.activeMode === '.theme-dark' ? el.defaultOpacityDark : el.defaultOpacityLight);
			}
			view.renderUI();
			view.invalidateCompanionCache();
			view.scheduleLiveStyleUpdate(false);
			view.debouncedSave();
		});

		glowPill.addEventListener('click', () => {
			tokenMap.set(`--sh-${el.id}-mode`, 'glow');
			tokenMap.set(`--sh-${el.id}-x`, '0px');
			tokenMap.set(`--sh-${el.id}-y`, '0px');
			tokenMap.set(`--sh-${el.id}-blur`, '16px');
			tokenMap.set(`--sh-${el.id}-spread`, '2px');
			const curCol = tokenMap.get(`--sh-${el.id}-color`);
			if (curCol === '#000000' || !curCol) {
				tokenMap.set(`--sh-${el.id}-color`, view.activeMode === '.theme-dark' ? '#7c3aed' : '#6d28d9');
			}
			const curOp = parseFloat(tokenMap.get(`--sh-${el.id}-opacity`) ?? '0');
			if (curOp < 0.45) {
				tokenMap.set(`--sh-${el.id}-opacity`, view.activeMode === '.theme-dark' ? '0.6' : '0.45');
			}
			view.renderUI();
			view.invalidateCompanionCache();
			view.scheduleLiveStyleUpdate(false);
			view.debouncedSave();
		});

		// 2. Interactive Realistic Obsidian UI Preview Widget
		const preview = card.createDiv({ cls: 'css-shadow-card-preview' });
		buildShadowPreviewWidget(preview, el);
		updateShadowPreview(view, preview, el, tokenMap);

		// 3. Controls Panels
		if (isEnabled) {
			// Base Geometry & Color Grid
			const grid = card.createDiv({ cls: 'css-shadow-card-grid' });

			// Horizontal X Offset
			const defX = currentMode === 'glow' ? '0px' : (el.defaultX ?? '0px');
			createShadowSlider(grid, 'X Offset', `--sh-${el.id}-x`, tokenMap, -30, 30, 0.1, 'px', () => {
				updateShadowPreview(view, preview, el, tokenMap);
				view.invalidateCompanionCache();
				view.scheduleLiveStyleUpdate(false);
				view.debouncedSave();
			}, defX);

			// Vertical Y Offset
			const defY = currentMode === 'glow' ? '0px' : (el.defaultY ?? '4px');
			createShadowSlider(grid, 'Y Offset', `--sh-${el.id}-y`, tokenMap, -30, 30, 0.1, 'px', () => {
				updateShadowPreview(view, preview, el, tokenMap);
				view.invalidateCompanionCache();
				view.scheduleLiveStyleUpdate(false);
				view.debouncedSave();
			}, defY);

			// Blur Softness
			const defBlur = currentMode === 'glow' ? '16px' : (el.defaultBlur ?? '12px');
			createShadowSlider(grid, 'Blur Radius', `--sh-${el.id}-blur`, tokenMap, 0, 60, 0.1, 'px', () => {
				updateShadowPreview(view, preview, el, tokenMap);
				view.invalidateCompanionCache();
				view.scheduleLiveStyleUpdate(false);
				view.debouncedSave();
			}, defBlur);

			// Spread Radius (for boxes)
			if (el.kind === 'box') {
				const defSpread = currentMode === 'glow' ? '2px' : (el.defaultSpread ?? '0px');
				createShadowSlider(grid, 'Spread Radius', `--sh-${el.id}-spread`, tokenMap, -15, 30, 0.1, 'px', () => {
					updateShadowPreview(view, preview, el, tokenMap);
					view.invalidateCompanionCache();
					view.scheduleLiveStyleUpdate(false);
					view.debouncedSave();
				}, defSpread);
			}

			// Effect Primary Color Picker
			const colorItem = grid.createDiv({ cls: 'css-shadow-grid-item' });
			colorItem.createSpan({ text: 'Color:', cls: 'css-shadow-grid-item-label' });
			const colorInput = colorItem.createEl('input', { type: 'color', cls: 'css-color-picker' });
			const curCol = tokenMap.get(`--sh-${el.id}-color`) ?? '#7c3aed';
			colorInput.value = curCol.startsWith('#') && curCol.length === 7 ? curCol : '#7c3aed';
			colorInput.addEventListener('input', (e) => {
				tokenMap.set(`--sh-${el.id}-color`, (e.target as HTMLInputElement).value);
				updateShadowPreview(view, preview, el, tokenMap);
				view.invalidateCompanionCache();
				view.scheduleLiveStyleUpdate(false);
				view.debouncedSave();
			});

			// Opacity Slider
			const defaultShOpacity = view.activeMode === '.theme-dark' ? el.defaultOpacityDark : el.defaultOpacityLight;
			createShadowSlider(grid, 'Opacity', `--sh-${el.id}-opacity`, tokenMap, 0.05, 1.0, 0.05, '', () => {
				updateShadowPreview(view, preview, el, tokenMap);
				view.invalidateCompanionCache();
				view.scheduleLiveStyleUpdate(false);
				view.debouncedSave();
			}, defaultShOpacity);

			// 4. Color Gradient Panel
			const gradSection = card.createDiv({ cls: 'css-shadow-sub-section' });
			const gradHeader = gradSection.createDiv({ cls: 'css-shadow-sub-header' });
			const gradTitle = gradHeader.createDiv({ cls: 'css-shadow-sub-title' });
			gradTitle.createSpan({ text: '🌈 Color Gradient' });
			const isGradOn = tokenMap.get(`--sh-${el.id}-gradient-enabled`) === 'true';
			new ToggleComponent(gradHeader)
				.setValue(isGradOn)
				.setTooltip('Enable dual-tone color gradient for shadow/glow')
				.onChange((active) => {
					tokenMap.set(`--sh-${el.id}-gradient-enabled`, active ? 'true' : 'false');
					view.renderUI();
					view.invalidateCompanionCache();
					view.scheduleLiveStyleUpdate(false);
					view.debouncedSave();
				});

			if (isGradOn) {
				const gradGrid = gradSection.createDiv({ cls: 'css-shadow-card-grid' });

				// Secondary Gradient Color
				const gradColorItem = gradGrid.createDiv({ cls: 'css-shadow-grid-item' });
				gradColorItem.createSpan({ text: 'Secondary Color:', cls: 'css-shadow-grid-item-label' });
				const gradColorInput = gradColorItem.createEl('input', { type: 'color', cls: 'css-color-picker' });
				const defaultSecondary = view.activeMode === '.theme-dark'
					? (el.defaultGradientColorDark ?? '#ec4899')
					: (el.defaultGradientColorLight ?? '#db2777');
				const curGradCol = tokenMap.get(`--sh-${el.id}-gradient-color`) ?? defaultSecondary;
				gradColorInput.value = curGradCol.startsWith('#') && curGradCol.length === 7 ? curGradCol : defaultSecondary;
				gradColorInput.addEventListener('input', (e) => {
					tokenMap.set(`--sh-${el.id}-gradient-color`, (e.target as HTMLInputElement).value);
					updateShadowPreview(view, preview, el, tokenMap);
					view.invalidateCompanionCache();
					view.scheduleLiveStyleUpdate(false);
					view.debouncedSave();
				});

				// Animate Gradient Flow Toggle
				const gradAnimItem = gradGrid.createDiv({ cls: 'css-shadow-grid-item' });
				gradAnimItem.createSpan({ text: 'Animate Flow:', cls: 'css-shadow-grid-item-label' });
				const isGradAnimOn = tokenMap.get(`--sh-${el.id}-gradient-anim`) === 'true';
				new ToggleComponent(gradAnimItem)
					.setValue(isGradAnimOn)
					.setTooltip('Continuously cycle and blend gradient colors')
					.onChange((active) => {
						tokenMap.set(`--sh-${el.id}-gradient-anim`, active ? 'true' : 'false');
						view.renderUI();
						view.invalidateCompanionCache();
						view.scheduleLiveStyleUpdate(false);
						view.debouncedSave();
					});
			}

			// 5. Outline Controls (if supported)
			if (el.supportsOutline) {
				const outlineSection = card.createDiv({ cls: 'css-shadow-sub-section' });
				const outlineHeader = outlineSection.createDiv({ cls: 'css-shadow-sub-header' });
				const outlineTitle = outlineHeader.createDiv({ cls: 'css-shadow-sub-title' });
				outlineTitle.createSpan({ text: '🔲 Outline' });
				const isOutlineOn = tokenMap.get(`--sh-${el.id}-outline-enabled`) === 'true';
				new ToggleComponent(outlineHeader)
					.setValue(isOutlineOn)
					.setTooltip('Enable outline stroke')
					.onChange((active) => {
						tokenMap.set(`--sh-${el.id}-outline-enabled`, active ? 'true' : 'false');
						if (active) {
							const curWidth = tokenMap.get(`--sh-${el.id}-outline-width`);
							if (!curWidth || curWidth === '0px') {
								tokenMap.set(`--sh-${el.id}-outline-width`, el.defaultOutlineWidth ?? '2px');
							}
						}
						view.renderUI();
						view.invalidateCompanionCache();
						view.scheduleLiveStyleUpdate(false);
						view.debouncedSave();
					});

				if (isOutlineOn) {
					const outlineGrid = outlineSection.createDiv({ cls: 'css-shadow-card-grid' });

					// Outline Width
					createShadowSlider(outlineGrid, 'Outline Width', `--sh-${el.id}-outline-width`, tokenMap, 0.1, 10, 0.1, 'px', () => {
						updateShadowPreview(view, preview, el, tokenMap);
						view.invalidateCompanionCache();
						view.scheduleLiveStyleUpdate(false);
						view.debouncedSave();
					}, el.defaultOutlineWidth ?? '1px');

					// Outline Color
					const outColItem = outlineGrid.createDiv({ cls: 'css-shadow-grid-item' });
					outColItem.createSpan({ text: 'Outline Color:', cls: 'css-shadow-grid-item-label' });
					const outColInput = outColItem.createEl('input', { type: 'color', cls: 'css-color-picker' });
					const curOutCol = tokenMap.get(`--sh-${el.id}-outline-color`) ?? '#7c3aed';
					outColInput.value = curOutCol.startsWith('#') && curOutCol.length === 7 ? curOutCol : '#7c3aed';
					outColInput.addEventListener('input', (e) => {
						tokenMap.set(`--sh-${el.id}-outline-color`, (e.target as HTMLInputElement).value);
						updateShadowPreview(view, preview, el, tokenMap);
						view.invalidateCompanionCache();
						view.scheduleLiveStyleUpdate(false);
						view.debouncedSave();
					});

					// Outline Gradient Toggle
					const outGradToggleItem = outlineGrid.createDiv({ cls: 'css-shadow-grid-item' });
					outGradToggleItem.createSpan({ text: 'Outline Gradient:', cls: 'css-shadow-grid-item-label' });
					const isOutGradOn = tokenMap.get(`--sh-${el.id}-outline-gradient-enabled`) === 'true';
					new ToggleComponent(outGradToggleItem)
						.setValue(isOutGradOn)
						.setTooltip('Blend outline with a secondary gradient halo')
						.onChange((active) => {
							tokenMap.set(`--sh-${el.id}-outline-gradient-enabled`, active ? 'true' : 'false');
							view.renderUI();
							view.invalidateCompanionCache();
							view.scheduleLiveStyleUpdate(false);
							view.debouncedSave();
						});

					if (isOutGradOn) {
						const outGradColItem = outlineGrid.createDiv({ cls: 'css-shadow-grid-item' });
						outGradColItem.createSpan({ text: 'Secondary Color:', cls: 'css-shadow-grid-item-label' });
						const outGradColInput = outGradColItem.createEl('input', { type: 'color', cls: 'css-color-picker' });
						const defaultOutSecondary = view.activeMode === '.theme-dark'
							? (el.defaultOutlineGradientColorDark ?? '#ec4899')
							: (el.defaultOutlineGradientColorLight ?? '#db2777');
						const curOutGradCol = tokenMap.get(`--sh-${el.id}-outline-gradient-color`) ?? defaultOutSecondary;
						outGradColInput.value = curOutGradCol.startsWith('#') && curOutGradCol.length === 7 ? curOutGradCol : defaultOutSecondary;
						outGradColInput.addEventListener('input', (e) => {
							tokenMap.set(`--sh-${el.id}-outline-gradient-color`, (e.target as HTMLInputElement).value);
							updateShadowPreview(view, preview, el, tokenMap);
							view.invalidateCompanionCache();
							view.scheduleLiveStyleUpdate(false);
							view.debouncedSave();
						});
					}
				}
			}

			// 6. CSS Animation Panel
			const animSection = card.createDiv({ cls: 'css-shadow-sub-section' });
			const animHeader = animSection.createDiv({ cls: 'css-shadow-sub-header' });
			const animTitle = animHeader.createDiv({ cls: 'css-shadow-sub-title' });
			animTitle.createSpan({ text: '🎬 Animation' });

			const curAnimStyle = tokenMap.get(`--sh-${el.id}-anim-style`) ?? el.defaultAnimStyle ?? 'none';
			const isAnimActive = curAnimStyle !== 'none' || tokenMap.get(`--sh-${el.id}-gradient-anim`) === 'true';
			if (isAnimActive) {
				animHeader.createSpan({ cls: 'css-anim-badge', text: 'ANIMATION ACTIVE' });
			}

			const animGrid = animSection.createDiv({ cls: 'css-shadow-card-grid' });

			// Dropdown selection for Animation
			const animSelectItem = animGrid.createDiv({ cls: 'css-shadow-grid-item' });
			animSelectItem.createSpan({ text: 'Preset:', cls: 'css-shadow-grid-item-label' });
			const selectEl = animSelectItem.createEl('select', { cls: 'css-select-input' });

			for (const opt of SHADOW_ANIMATION_OPTIONS) {
				const optEl = selectEl.createEl('option', {
					value: opt.value,
					text: opt.label,
				});
				if (opt.value === curAnimStyle) {
					optEl.selected = true;
				}
			}
			selectEl.addEventListener('change', (e) => {
				const chosen = (e.target as HTMLSelectElement).value;
				tokenMap.set(`--sh-${el.id}-anim-style`, chosen);
				view.renderUI();
				view.invalidateCompanionCache();
				view.scheduleLiveStyleUpdate(false);
				view.debouncedSave();
			});

			// Animation Speed Slider (when active)
			if (isAnimActive) {
				createShadowSlider(animGrid, 'Speed', `--sh-${el.id}-anim-speed`, tokenMap, 0.5, 6.0, 0.1, 's', () => {
					updateShadowPreview(view, preview, el, tokenMap);
					view.invalidateCompanionCache();
					view.scheduleLiveStyleUpdate(false);
					view.debouncedSave();
				}, el.defaultAnimSpeed ?? '2.5s');
			}
		}
	}
}
