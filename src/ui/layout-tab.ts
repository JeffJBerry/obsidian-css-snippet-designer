/**
 * Layout Mods section renderer for the CSS Snippet Designer UI Elements tab.
 *
 * Provides dedicated cards for:
 * - Vertical Note Tabs (with integrated Rail Width slider)
 * - Auto-Hide Status Bar
 * - Floating Pill Status Bar
 */
import { setIcon, ToggleComponent } from 'obsidian';
import type { CssDesignerPopoutView } from '../view';
import { STYLE_CONTROLS, type StyleControl } from '../schema';
import { populateSelectOptions } from './widgets';

export function renderLayoutModsSection(view: CssDesignerPopoutView, container: HTMLElement): void {
	const tokenMap = view.getActiveTokenMap();
	const layoutModControls = STYLE_CONTROLS.filter(
		(c) => c.category === 'elements' && c.subcategory === 'Layout Mods'
	);
	if (layoutModControls.length === 0) return;

	const sectionEl = container.createDiv({ cls: 'css-designer-section css-ui-layout-mods-section' });

	// Hero Section Header matching Frosted Glass & Custom Backgrounds
	const sectionHeader = sectionEl.createDiv({ cls: 'css-section-header' });
	const titleSpan = sectionHeader.createSpan({ cls: 'css-hero-heading' });
	const heroIcon = titleSpan.createSpan({ cls: 'css-hero-icon' });
	setIcon(heroIcon, 'layout-template');
	titleSpan.createSpan({ text: 'Layout Mods' });

	// Responsive Grid matching UI Elements
	const gridEl = sectionEl.createDiv({ cls: 'css-ui-element-grid' });

	for (const ctrl of layoutModControls) {
		if (ctrl.id === 'layout-vertical-tabs-width') continue;
		renderLayoutControlCard(view, gridEl, ctrl, tokenMap, layoutModControls);
	}
}

export function renderLayoutControlCard(
	view: CssDesignerPopoutView,
	grid: HTMLElement,
	ctrl: StyleControl,
	tokenMap: Map<string, string>,
	allControls: StyleControl[],
): void {
	const currentVal = tokenMap.get(ctrl.variable) ?? (view.activeMode === '.theme-dark' ? ctrl.defaultDarkValue : ctrl.defaultLightValue);
	const isEnabled = currentVal === (ctrl.toggleTrueValue ?? 'true');

	// Non-toggle layout mods (the task checkbox style select) get a plain card
	// with their picker instead of a toggle switch and the width slider.
	if (ctrl.type !== 'toggle') {
		const selectCard = grid.createDiv({ cls: 'css-ui-element-card css-ui-layout-card' });
		const selectTop = selectCard.createDiv({ cls: 'css-ui-card-top' });
		const selectTitlebox = selectTop.createDiv({ cls: 'css-ui-card-titlebox' });
		if (ctrl.icon) {
			const selectIcon = selectTitlebox.createSpan({ cls: 'css-ui-card-icon' });
			setIcon(selectIcon, ctrl.icon);
		}
		selectTitlebox.createSpan({ text: ctrl.label, cls: 'css-ui-card-title' });
		const selectEl = selectTop.createEl('select', { cls: 'dropdown css-ui-card-select' });
		populateSelectOptions(selectEl, ctrl.options ?? [], currentVal);
		selectEl.addEventListener('change', () => {
			view.onTokenChange(ctrl, selectEl.value);
		});
		if (ctrl.description) {
			selectCard.createEl('p', { text: ctrl.description, cls: 'css-ui-card-desc' });
		}
		return;
	}

	const card = grid.createDiv({
		cls: `css-ui-element-card css-ui-layout-card ${isEnabled ? 'is-active' : ''}`,
	});

	// Top row: Titlebox (icon + label) + Toggle Component
	const topRow = card.createDiv({ cls: 'css-ui-card-top' });

	const titlebox = topRow.createDiv({ cls: 'css-ui-card-titlebox' });
	if (ctrl.icon) {
		const iconSpan = titlebox.createSpan({ cls: 'css-ui-card-icon' });
		setIcon(iconSpan, ctrl.icon);
	}
	titlebox.createSpan({ text: ctrl.label, cls: 'css-ui-card-title' });

	// Embedded slider for vertical tabs width
	let sliderWrap: HTMLElement | null = null;
	const widthCtrl = allControls.find((c) => c.id === 'layout-vertical-tabs-width')
		?? STYLE_CONTROLS.find((c) => c.id === 'layout-vertical-tabs-width');

	// Toggle switch on the right side of the card header
	new ToggleComponent(topRow)
		.setValue(isEnabled)
		.setTooltip(`Toggle ${ctrl.label}`)
		.onChange((checked) => {
			const nextVal = checked ? (ctrl.toggleTrueValue ?? 'true') : (ctrl.toggleFalseValue ?? 'false');
			view.onTokenChange(ctrl, nextVal);

			if (checked) {
				card.addClass('is-active');
				if (sliderWrap) sliderWrap.removeClass('is-hidden');
			} else {
				card.removeClass('is-active');
				if (sliderWrap) sliderWrap.addClass('is-hidden');
			}
		});

	// Description text
	if (ctrl.description) {
		card.createEl('p', { text: ctrl.description, cls: 'css-ui-card-desc' });
	}

	// For Vertical Note Tabs, add the integrated Rail Width slider
	if (ctrl.id === 'layout-vertical-tabs' && widthCtrl) {
		const widthVal = tokenMap.get(widthCtrl.variable) ?? (view.activeMode === '.theme-dark' ? widthCtrl.defaultDarkValue : widthCtrl.defaultLightValue);
		const defaultWidthVal = view.activeMode === '.theme-dark' ? widthCtrl.defaultDarkValue : widthCtrl.defaultLightValue;
		const numMatch = widthVal.match(/^-?[\d.]+/);
		const currentNum = numMatch ? parseFloat(numMatch[0]) : (widthCtrl.min ?? 32);

		sliderWrap = card.createDiv({
			cls: `css-ui-layout-slider-wrap ${isEnabled ? '' : 'is-hidden'}`,
		});

		sliderWrap.createSpan({ cls: 'css-ui-layout-slider-label', text: 'Rail Width' });

		const slider = sliderWrap.createEl('input', {
			type: 'range',
			cls: 'css-control-slider',
		});
		if (widthCtrl.min !== undefined) slider.min = String(widthCtrl.min);
		if (widthCtrl.max !== undefined) slider.max = String(widthCtrl.max);
		if (widthCtrl.step !== undefined) slider.step = String(widthCtrl.step);
		slider.value = String(currentNum);
		slider.setAttribute('title', 'Double-click to reset to default (32px)');

		const readout = sliderWrap.createSpan({
			cls: 'css-ui-card-number',
			text: widthVal,
		});

		slider.addEventListener('input', (e) => {
			const rawNum = (e.target as HTMLInputElement).value;
			const num = parseFloat(rawNum);
			const formatted = `${num}${widthCtrl.unit ?? 'px'}`;
			readout.setText(formatted);
			view.onTokenChange(widthCtrl, formatted);
		});

		slider.addEventListener('dblclick', () => {
			const defMatch = defaultWidthVal.match(/^-?[\d.]+/);
			const defNum = defMatch ? parseFloat(defMatch[0]) : 32;
			slider.value = String(defNum);
			readout.setText(defaultWidthVal);
			view.onTokenChange(widthCtrl, defaultWidthVal);
		});
	}
}
