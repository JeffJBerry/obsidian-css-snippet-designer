/**
 * Builders for the designer's control rows.
 *
 * Each takes the view so it can read and write token state; they are the
 * bridge between a `StyleControl` definition in the schema and its rendered
 * input, live preview update and persistence.
 */
import { ToggleComponent, setIcon } from 'obsidian';
import type { CssDesignerPopoutView } from '../view';

import { getNextWrappedIndex, type StyleControl } from '../schema';
import { populateSelectOptions, renderDiscreteNavSpectrum, renderDiscreteHeadingSpectrum, updateSelectFontFamily } from './widgets';
import { parseColorDetails } from '../css/color';
import { getSystemFonts } from '../obsidian-internals';
import { mergeSystemFontsIntoOptions } from './font-merge';

export function createHeaderGradientControlRow(
	view: CssDesignerPopoutView,
	container: HTMLElement,
	ctrl: StyleControl,
	onUpdate?: () => void
): void {
	const tokenMap = view.getActiveTokenMap();
	const enabledMap = view.getActiveEnabledMap();
	const isEnabled = (enabledMap.get('--header-gradient-enabled') ?? true) &&
		tokenMap.get('--header-gradient-enabled') === 'true';

	// =========================================================================
	// MASTER TOGGLE HEADER (Integrated Section Header)
	// =========================================================================
	const headerRow = container.createDiv({
		cls: `css-section-header css-feature-section-header is-clickable-label ${isEnabled ? '' : 'is-disabled'}`,
	});

	const leftCol = headerRow.createDiv({ cls: 'css-section-header-left' });
	leftCol.setAttribute('title', ctrl.variable);
	leftCol.createEl('h3', { text: ctrl.label, cls: 'css-designer-section-title' });
	const statusBadge = leftCol.createSpan({
		text: isEnabled ? 'ON' : 'OFF',
		cls: `css-feature-status-badge ${isEnabled ? 'is-active' : ''}`,
	});

	const inputCol = headerRow.createDiv({ cls: 'css-control-input' });
	const toggleWrap = inputCol.createDiv({ cls: 'css-boolean-toggle-wrap' });
	const toggleComp = new ToggleComponent(toggleWrap)
		.setValue(isEnabled)
		.setTooltip(`Toggle ${ctrl.label} ${isEnabled ? 'off' : 'on'}`);

	view.updateHeaderGradientTokens();

	let subcontrolsEl: HTMLElement | null = null;
	let updateDiscreteSpectrum: (() => void) | null = null;
	let subSolidInput: HTMLInputElement | null = null;

	const syncHeaderGradientState = () => {
		view.invalidateCompanionCache();
		view.invalidateVarsCache();
		view.updateHeaderGradientTokens();
		if (updateDiscreteSpectrum) updateDiscreteSpectrum();
		if (onUpdate) onUpdate();
		view.scheduleLiveStyleUpdate(false);
		view.debouncedSave();
	};

	const handleToggle = (checked: boolean) => {
		enabledMap.set('--header-gradient-enabled', true);
		tokenMap.set('--header-gradient-enabled', checked ? 'true' : 'false');
		headerRow.toggleClass('is-disabled', !checked);
		statusBadge.setText(checked ? 'ON' : 'OFF');
		statusBadge.toggleClass('is-active', checked);
		toggleComp.setValue(checked);
		if (subcontrolsEl) {
			subcontrolsEl.toggleClass('is-disabled', !checked);
		}
		syncHeaderGradientState();
	};

	toggleComp.onChange(handleToggle);

	leftCol.addEventListener('click', () => {
		const nextVal = !toggleComp.getValue();
		handleToggle(nextVal);
	});

	// =========================================================================
	// SUBCONTROLS PANEL
	// =========================================================================
	subcontrolsEl = container.createDiv({
		cls: `css-feature-subcontrols css-gradient-header-subcontrols ${isEnabled ? '' : 'is-disabled'}`,
	});

	// --- 1. HEADING COLOR STYLE (GRADIENT VS SOLID) ---
	const modeSectionHeader = subcontrolsEl.createDiv({ cls: 'css-subcontrol-section-header is-first' });
	modeSectionHeader.createSpan({ text: 'Heading Color Progression', cls: 'css-section-header-title' });

	const modeRow = subcontrolsEl.createDiv({ cls: 'css-subcontrol-item' });
	const modeLabel = modeRow.createDiv({ cls: 'css-subcontrol-label' });
	modeLabel.createSpan({ text: 'Color Style' });

	const modePills = modeRow.createDiv({ cls: 'css-gradient-angle-presets' });
	let curStyle = tokenMap.get('--header-gradient-style') ?? 'gradient';

	const gradBtn = modePills.createEl('button', {
		text: '🌈 Gradient',
		cls: `css-angle-preset-btn ${curStyle === 'gradient' ? 'is-active' : ''}`,
	});
	const solidBtn = modePills.createEl('button', {
		text: '🎨 Solid',
		cls: `css-angle-preset-btn ${curStyle === 'solid' ? 'is-active' : ''}`,
	});

	const gradBox = subcontrolsEl.createDiv({ cls: 'css-body-grad-container' });
	const solidBox = subcontrolsEl.createDiv({ cls: 'css-body-solid-container' });

	const updateModeDisplay = (mode: string) => {
		curStyle = mode;
		tokenMap.set('--header-gradient-style', mode);
		enabledMap.set('--header-gradient-style', true);
		if (mode === 'solid') {
			let curSolid = tokenMap.get('--header-solid-color');
			const isDark = view.activeMode === '.theme-dark';
			if (!curSolid || curSolid === 'transparent') {
				curSolid = isDark ? '#a855f7' : '#7c3aed';
				tokenMap.set('--header-solid-color', curSolid);
				enabledMap.set('--header-solid-color', true);
			}
			if (subSolidInput) subSolidInput.value = curSolid.startsWith('#') ? curSolid : (isDark ? '#a855f7' : '#7c3aed');
		}
		gradBtn.toggleClass('is-active', mode === 'gradient');
		solidBtn.toggleClass('is-active', mode === 'solid');
		gradBox.style.display = mode === 'gradient' ? 'block' : 'none';
		solidBox.style.display = mode === 'solid' ? 'block' : 'none';
		syncHeaderGradientState();
	};

	gradBtn.addEventListener('click', () => updateModeDisplay('gradient'));
	solidBtn.addEventListener('click', () => updateModeDisplay('solid'));

	// Initial display state
	gradBox.style.display = curStyle === 'gradient' ? 'block' : 'none';
	solidBox.style.display = curStyle === 'solid' ? 'block' : 'none';

	// --- A. Gradient Controls ---
	const gradColorsRow = gradBox.createDiv({ cls: 'css-subcontrol-item' });
	const gradColorsLabel = gradColorsRow.createDiv({ cls: 'css-subcontrol-label' });
	gradColorsLabel.createSpan({ text: 'Gradient Palette' });

	const gradColorGroup = gradColorsRow.createDiv({ cls: 'css-gradient-picker-group' });

	const fromWrap = gradColorGroup.createDiv({ cls: 'css-gradient-picker-item' });
	fromWrap.createSpan({ text: 'From', cls: 'css-gradient-picker-label' });
	const fromInput = fromWrap.createEl('input', { type: 'color', cls: 'css-color-picker css-color-picker-mini' });
	const defaultAccent = tokenMap.get('--text-accent') ?? (view.activeMode === '.theme-dark' ? '#d4af37' : '#2563eb');
	const defaultAccent2 = tokenMap.get('--text-accent-2') ?? defaultAccent;
	const curFrom = tokenMap.get('--header-gradient-from') ?? defaultAccent;
	fromInput.value = curFrom.startsWith('#') ? curFrom : defaultAccent;
	fromInput.title = `From color (${curFrom})`;

	const is3Color = tokenMap.get('--header-gradient-3color-enabled') === 'true';
	const viaBtn = gradColorGroup.createEl('button', {
		cls: `css-3color-toggle-btn ${is3Color ? 'is-active' : ''}`,
		text: is3Color ? '✓ 3 Colors' : '+ 3rd Color',
	});
	viaBtn.title = 'Toggle 3-color gradient (from -> via -> to)';

	const viaWrap = gradColorGroup.createDiv({ cls: 'css-gradient-picker-item' });
	viaWrap.style.display = is3Color ? 'flex' : 'none';
	viaWrap.createSpan({ text: 'Via', cls: 'css-gradient-picker-label' });
	const viaInput = viaWrap.createEl('input', { type: 'color', cls: 'css-color-picker css-color-picker-mini' });
	const curVia = tokenMap.get('--header-gradient-via') ?? defaultAccent;
	viaInput.value = curVia.startsWith('#') ? curVia : defaultAccent;
	viaInput.title = `Via / Middle color (${curVia})`;

	const toWrap = gradColorGroup.createDiv({ cls: 'css-gradient-picker-item' });
	toWrap.createSpan({ text: 'To', cls: 'css-gradient-picker-label' });
	const toInput = toWrap.createEl('input', { type: 'color', cls: 'css-color-picker css-color-picker-mini' });
	const curTo = tokenMap.get('--header-gradient-to') ?? defaultAccent2;
	toInput.value = curTo.startsWith('#') ? curTo : defaultAccent2;
	toInput.title = `To color (${curTo})`;

	fromInput.addEventListener('input', (e) => {
		const val = (e.target as HTMLInputElement).value;
		tokenMap.set('--header-gradient-from', val);
		enabledMap.set('--header-gradient-from', true);
		syncHeaderGradientState();
	});

	viaBtn.addEventListener('click', (e) => {
		e.stopPropagation();
		const currently3Color = tokenMap.get('--header-gradient-3color-enabled') === 'true';
		const nextState = !currently3Color;
		tokenMap.set('--header-gradient-3color-enabled', nextState ? 'true' : 'false');
		enabledMap.set('--header-gradient-3color-enabled', true);
		viaBtn.setText(nextState ? '✓ 3 Colors' : '+ 3rd Color');
		viaBtn.toggleClass('is-active', nextState);
		viaWrap.style.display = nextState ? 'flex' : 'none';
		syncHeaderGradientState();
	});

	viaInput.addEventListener('input', (e) => {
		const val = (e.target as HTMLInputElement).value;
		tokenMap.set('--header-gradient-via', val);
		enabledMap.set('--header-gradient-via', true);
		syncHeaderGradientState();
	});

	toInput.addEventListener('input', (e) => {
		const val = (e.target as HTMLInputElement).value;
		tokenMap.set('--header-gradient-to', val);
		enabledMap.set('--header-gradient-to', true);
		syncHeaderGradientState();
	});

	// Discrete Spectrum Preview Strip (H1..H6)
	const discreteStrip = gradBox.createDiv({ cls: 'css-nav-discrete-spectrum css-heading-discrete-spectrum' });

	updateDiscreteSpectrum = () => {
		renderDiscreteHeadingSpectrum(discreteStrip, view);
	};

	// --- B. Solid Color Controls ---
	const solidRow = solidBox.createDiv({ cls: 'css-subcontrol-item' });
	const solidLabel = solidRow.createDiv({ cls: 'css-subcontrol-label' });
	solidLabel.createSpan({ text: 'Solid Color' });

	const solidInputWrap = solidRow.createDiv({ cls: 'css-gradient-picker-group' });
	const solidPickerWrap = solidInputWrap.createDiv({ cls: 'css-gradient-picker-item' });
	solidPickerWrap.createSpan({ text: 'Fill', cls: 'css-gradient-picker-label' });
	subSolidInput = solidPickerWrap.createEl('input', { type: 'color', cls: 'css-color-picker css-color-picker-mini' });
	const curSolidCol = tokenMap.get('--header-solid-color') ?? (view.activeMode === '.theme-dark' ? '#a855f7' : '#7c3aed');
	subSolidInput.value = curSolidCol.startsWith('#') ? curSolidCol : (view.activeMode === '.theme-dark' ? '#a855f7' : '#7c3aed');
	subSolidInput.title = `Solid Heading Color (${subSolidInput.value})`;

	subSolidInput.addEventListener('input', (e) => {
		const val = (e.target as HTMLInputElement).value;
		tokenMap.set('--header-solid-color', val);
		enabledMap.set('--header-solid-color', true);
		syncHeaderGradientState();
	});

	updateDiscreteSpectrum();
}

export function createNavBoxControlRow(view: CssDesignerPopoutView, container: HTMLElement, ctrl: StyleControl, onUpdate?: () => void): void {
	const tokenMap = view.getActiveTokenMap();
	const enabledMap = view.getActiveEnabledMap();
	const isBoxActive = (enabledMap.get('--nav-box-enabled') ?? true) &&
		tokenMap.get('--nav-box-enabled') === 'true';

	// =========================================================================
	// MASTER TOGGLE ROW
	// =========================================================================
	const row = container.createDiv({
		cls: `css-control-row css-feature-row is-clickable-label ${isBoxActive ? '' : 'is-disabled'}`,
	});

	const leftCol = row.createDiv({ cls: 'css-control-left' });
	const labelCol = leftCol.createDiv({ cls: 'css-control-label' });
	labelCol.setAttribute('title', ctrl.variable);
	const titleRow = labelCol.createDiv({ cls: 'css-control-title-row' });
	titleRow.createSpan({ text: ctrl.label, cls: 'css-control-title' });
	const statusBadge = titleRow.createSpan({
		text: isBoxActive ? 'ON' : 'OFF',
		cls: `css-feature-status-badge ${isBoxActive ? 'is-active' : ''}`,
	});

	if (ctrl.description) {
		labelCol.createSpan({ text: ctrl.description, cls: 'css-control-desc' });
	}

	const inputCol = row.createDiv({ cls: 'css-control-input' });
	const toggleWrap = inputCol.createDiv({ cls: 'css-boolean-toggle-wrap' });
	const toggleComp = new ToggleComponent(toggleWrap)
		.setValue(isBoxActive)
		.setTooltip(`Toggle ${ctrl.label} ${isBoxActive ? 'off' : 'on'}`);

	view.updateNavBoxTokens();

	let subcontrolsEl: HTMLElement | null = null;
	let updateDiscreteSpectrum: (() => void) | null = null;

	const syncNavBoxState = () => {
		view.invalidateCompanionCache();
		view.invalidateVarsCache();
		view.updateNavBoxTokens();
		if (updateDiscreteSpectrum) updateDiscreteSpectrum();
		if (onUpdate) onUpdate();
		view.scheduleLiveStyleUpdate(false);
		view.debouncedSave();
	};

	const handleToggle = (checked: boolean) => {
		enabledMap.set('--nav-box-enabled', true);
		tokenMap.set('--nav-box-enabled', checked ? 'true' : 'false');
		row.toggleClass('is-disabled', !checked);
		statusBadge.setText(checked ? 'ON' : 'OFF');
		statusBadge.toggleClass('is-active', checked);
		toggleComp.setValue(checked);
		if (subcontrolsEl) {
			subcontrolsEl.toggleClass('is-disabled', !checked);
			subcontrolsEl.toggleClass('is-collapsed', !checked);
		}
		syncNavBoxState();
	};

	toggleComp.onChange(handleToggle);

	labelCol.addEventListener('click', () => {
		const nextVal = !toggleComp.getValue();
		handleToggle(nextVal);
	});

	// =========================================================================
	// SUBCONTROLS PANEL
	// =========================================================================
	subcontrolsEl = container.createDiv({
		cls: `css-feature-subcontrols css-nav-box-subcontrols ${isBoxActive ? '' : 'is-disabled is-collapsed'}`,
	});
	const panel = subcontrolsEl;
	const isDark = view.activeMode === '.theme-dark';

	const setToken = (key: string, val: string): void => {
		tokenMap.set(key, val);
		enabledMap.set(key, true);
	};

	const sectionHeader = (title: string, desc: string): void => {
		const header = panel.createDiv({ cls: 'css-subcontrol-section-header' });
		header.createSpan({ text: title, cls: 'css-section-header-title' });
		header.createSpan({ text: desc, cls: 'css-section-header-desc' });
	};

	// One independent three-stop palette, bound to a token prefix so the surface
	// fill and the outline each own their own colours instead of mirroring.
	const buildGradientPalette = (parent: HTMLElement, prefix: string, fallbackFrom: string, fallbackVia: string, fallbackTo: string): void => {
		const paletteRow = parent.createDiv({ cls: 'css-subcontrol-item' });
		const paletteLabel = paletteRow.createDiv({ cls: 'css-subcontrol-label' });
		paletteLabel.createSpan({ text: 'Gradient Colors' });
		paletteLabel.createSpan({ text: 'Colours interpolated from the first menu row to the last.', cls: 'css-subcontrol-desc' });

		const group = paletteRow.createDiv({ cls: 'css-gradient-picker-group' });

		const fromWrap = group.createDiv({ cls: 'css-gradient-picker-item' });
		fromWrap.createSpan({ text: 'From', cls: 'css-gradient-picker-label' });
		const fromInput = fromWrap.createEl('input', { type: 'color', cls: 'css-color-picker css-color-picker-mini' });
		const curFrom = tokenMap.get(`${prefix}-from`) ?? fallbackFrom;
		fromInput.value = curFrom.startsWith('#') ? curFrom : fallbackFrom;
		fromInput.title = `From color (${curFrom})`;

		const is3Color = tokenMap.get(`${prefix}-3color-enabled`) === 'true';
		const viaBtn = group.createEl('button', {
			cls: `css-3color-toggle-btn ${is3Color ? 'is-active' : ''}`,
			text: is3Color ? '✓ 3 Colors' : '+ 3rd Color',
		});
		viaBtn.title = 'Add a middle color (from -> via -> to)';

		const viaWrap = group.createDiv({ cls: 'css-gradient-picker-item' });
		viaWrap.style.display = is3Color ? 'flex' : 'none';
		viaWrap.createSpan({ text: 'Via', cls: 'css-gradient-picker-label' });
		const viaInput = viaWrap.createEl('input', { type: 'color', cls: 'css-color-picker css-color-picker-mini' });
		const curVia = tokenMap.get(`${prefix}-via`) ?? fallbackVia;
		viaInput.value = curVia.startsWith('#') ? curVia : fallbackVia;
		viaInput.title = `Via / middle color (${curVia})`;

		const toWrap = group.createDiv({ cls: 'css-gradient-picker-item' });
		toWrap.createSpan({ text: 'To', cls: 'css-gradient-picker-label' });
		const toInput = toWrap.createEl('input', { type: 'color', cls: 'css-color-picker css-color-picker-mini' });
		const curTo = tokenMap.get(`${prefix}-to`) ?? fallbackTo;
		toInput.value = curTo.startsWith('#') ? curTo : fallbackTo;
		toInput.title = `To color (${curTo})`;

		fromInput.addEventListener('input', (e) => {
			setToken(`${prefix}-from`, (e.target as HTMLInputElement).value);
			syncNavBoxState();
		});
		viaInput.addEventListener('input', (e) => {
			setToken(`${prefix}-via`, (e.target as HTMLInputElement).value);
			syncNavBoxState();
		});
		toInput.addEventListener('input', (e) => {
			setToken(`${prefix}-to`, (e.target as HTMLInputElement).value);
			syncNavBoxState();
		});
		viaBtn.addEventListener('click', (e) => {
			e.stopPropagation();
			const nextState = tokenMap.get(`${prefix}-3color-enabled`) !== 'true';
			setToken(`${prefix}-3color-enabled`, nextState ? 'true' : 'false');
			viaBtn.setText(nextState ? '✓ 3 Colors' : '+ 3rd Color');
			viaBtn.toggleClass('is-active', nextState);
			viaWrap.style.display = nextState ? 'flex' : 'none';
			syncNavBoxState();
		});
	};

	// --- 1. STRUCTURE ---
	const subfolderRow = panel.createDiv({ cls: 'css-subcontrol-item' });
	const subfolderLabel = subfolderRow.createDiv({ cls: 'css-subcontrol-label' });
	subfolderLabel.createSpan({ text: 'Include Subfolders' });
	subfolderLabel.createSpan({ text: 'When off, only top-level menu items get boxes for a clean hierarchy.', cls: 'css-subcontrol-desc' });

	const subfolderToggleWrap = subfolderRow.createDiv({ cls: 'css-subcontrol-input-wrap' });
	const isSubfoldersActive = tokenMap.get('--nav-box-subfolders-enabled') === 'true';
	const subfolderToggle = new ToggleComponent(subfolderToggleWrap)
		.setValue(isSubfoldersActive)
		.setTooltip(`Toggle subfolder boxes ${isSubfoldersActive ? 'off' : 'on'}`);

	subfolderToggle.onChange((checked) => {
		setToken('--nav-box-subfolders-enabled', checked ? 'true' : 'false');
		syncSubfolderColorsState(checked);
		syncNavBoxState();
	});

	// Subfolder fill and outline colours, live only while subfolders are
	// included. Picking a colour on the switched-off row turns them on first,
	// mirroring how the top-level rows behave.
	const subfolderColorsRow = panel.createDiv({ cls: 'css-subcontrol-item' });
	const subfolderColorsLabel = subfolderColorsRow.createDiv({ cls: 'css-subcontrol-label' });
	subfolderColorsLabel.createSpan({ text: 'Subfolder Colors' });
	subfolderColorsLabel.createSpan({ text: 'Fill and outline painted behind nested folder rows.', cls: 'css-subcontrol-desc' });

	const subfolderColorsGroup = subfolderColorsRow.createDiv({ cls: 'css-gradient-picker-group' });

	const subfolderFillWrap = subfolderColorsGroup.createDiv({ cls: 'css-gradient-picker-item' });
	subfolderFillWrap.createSpan({ text: 'Fill', cls: 'css-gradient-picker-label' });
	const subfolderFillInput = subfolderFillWrap.createEl('input', { type: 'color', cls: 'css-color-picker css-color-picker-mini' });
	const curSubfolderFill = tokenMap.get('--nav-box-subfolder-bg') ?? (isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)');
	subfolderFillInput.value = curSubfolderFill.startsWith('#') ? curSubfolderFill : parseColorDetails(curSubfolderFill, 1).hex;
	subfolderFillInput.title = `Subfolder fill color (${subfolderFillInput.value})`;

	const subfolderOutlineWrap = subfolderColorsGroup.createDiv({ cls: 'css-gradient-picker-item' });
	subfolderOutlineWrap.createSpan({ text: 'Outline', cls: 'css-gradient-picker-label' });
	const subfolderOutlineInput = subfolderOutlineWrap.createEl('input', { type: 'color', cls: 'css-color-picker css-color-picker-mini' });
	const curSubfolderOutline = tokenMap.get('--nav-box-subfolder-border') ?? (isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)');
	subfolderOutlineInput.value = curSubfolderOutline.startsWith('#') ? curSubfolderOutline : parseColorDetails(curSubfolderOutline, 1).hex;
	subfolderOutlineInput.title = `Subfolder outline color (${subfolderOutlineInput.value})`;

	const enableSubfolders = (): void => {
		if (tokenMap.get('--nav-box-subfolders-enabled') === 'true') return;
		setToken('--nav-box-subfolders-enabled', 'true');
		subfolderToggle.setValue(true);
		syncSubfolderColorsState(true);
		syncNavBoxState();
	};

	function syncSubfolderColorsState(active: boolean): void {
		subfolderColorsRow.toggleClass('is-disabled', !active);
	}

	subfolderFillInput.addEventListener('pointerdown', enableSubfolders);
	subfolderOutlineInput.addEventListener('pointerdown', enableSubfolders);

	subfolderFillInput.addEventListener('input', (e) => {
		const val = (e.target as HTMLInputElement).value;
		setToken('--nav-box-subfolder-bg', val);
		subfolderFillInput.title = `Subfolder fill color (${val})`;
		syncNavBoxState();
	});

	subfolderOutlineInput.addEventListener('input', (e) => {
		const val = (e.target as HTMLInputElement).value;
		setToken('--nav-box-subfolder-border', val);
		subfolderOutlineInput.title = `Subfolder outline color (${val})`;
		syncNavBoxState();
	});

	syncSubfolderColorsState(isSubfoldersActive);

	// --- 2. SURFACE FILL ---
	sectionHeader('Surface Fill', 'What is painted behind each file and folder row');

	const bodyRow = panel.createDiv({ cls: 'css-subcontrol-item' });
	const bodyLabel = bodyRow.createDiv({ cls: 'css-subcontrol-label' });
	bodyLabel.createSpan({ text: 'Fill Style' });
	bodyLabel.createSpan({ text: 'Gradient steps a colour down the menu items; solid paints one colour everywhere.', cls: 'css-subcontrol-desc' });

	const bodyPills = bodyRow.createDiv({ cls: 'css-gradient-angle-presets' });
	let curBodyStyle: 'none' | 'solid' | 'gradient' =
		tokenMap.get('--nav-box-body-enabled') === 'false'
			? 'none'
			: (tokenMap.get('--nav-box-body-style') === 'solid' ? 'solid' : 'gradient');

	const bodyGradBox = panel.createDiv({ cls: 'css-body-grad-container' });
	const bodySolidBox = panel.createDiv({ cls: 'css-body-solid-container' });

	const bodySolidRow = bodySolidBox.createDiv({ cls: 'css-subcontrol-item' });
	const bodySolidLabel = bodySolidRow.createDiv({ cls: 'css-subcontrol-label' });
	bodySolidLabel.createSpan({ text: 'Fill Color' });
	bodySolidLabel.createSpan({ text: 'Single surface colour applied to every item.', cls: 'css-subcontrol-desc' });
	const bodySolidInputWrap = bodySolidRow.createDiv({ cls: 'css-subcontrol-input-wrap' });
	const bodySolidPickerWrap = bodySolidInputWrap.createDiv({ cls: 'css-gradient-picker-item' });
	bodySolidPickerWrap.createSpan({ text: 'Fill', cls: 'css-gradient-picker-label' });
	const bodySolidInput = bodySolidPickerWrap.createEl('input', { type: 'color', cls: 'css-color-picker css-color-picker-mini' });
	const curBodySolid = tokenMap.get('--nav-box-bg') ?? (isDark ? '#1e1e2e' : '#f4f4f5');
	bodySolidInput.value = curBodySolid.startsWith('#') ? curBodySolid : (isDark ? '#1e1e2e' : '#f4f4f5');
	bodySolidInput.title = `Solid fill color (${bodySolidInput.value})`;
	bodySolidInput.addEventListener('input', (e) => {
		setToken('--nav-box-bg', (e.target as HTMLInputElement).value);
		syncNavBoxState();
	});

	buildGradientPalette(
		bodyGradBox,
		'--nav-box-gradient',
		isDark ? '#7c3aed' : '#6d28d9',
		isDark ? '#06b6d4' : '#0891b2',
		isDark ? '#ec4899' : '#db2777',
	);

	const stepRow = bodyGradBox.createDiv({ cls: 'css-subcontrol-item' });
	const stepLabel = stepRow.createDiv({ cls: 'css-subcontrol-label' });
	stepLabel.createSpan({ text: 'Items in Gradient' });
	stepLabel.createSpan({ text: 'How many core menu rows the gradient transitions across (3–20).', cls: 'css-subcontrol-desc' });

	const stepInputWrap = stepRow.createDiv({ cls: 'css-subcontrol-input-wrap' });
	const stepSlider = stepInputWrap.createEl('input', { type: 'range', cls: 'css-slider' });
	stepSlider.min = '3';
	stepSlider.max = '20';
	stepSlider.step = '1';
	const curSteps = parseInt(tokenMap.get('--nav-box-gradient-steps') ?? '8', 10) || 8;
	stepSlider.value = curSteps.toString();
	stepSlider.title = 'Items in gradient (double-click to reset to 8)';
	const stepBadge = stepInputWrap.createSpan({ cls: 'css-subcontrol-value-badge', text: `${curSteps} items` });

	const discreteStrip = bodyGradBox.createDiv({ cls: 'css-nav-discrete-spectrum' });
	updateDiscreteSpectrum = () => {
		renderDiscreteNavSpectrum(discreteStrip, view);
	};

	stepSlider.addEventListener('input', (e) => {
		const val = (e.target as HTMLInputElement).value;
		setToken('--nav-box-gradient-steps', val);
		stepBadge.setText(`${val} items`);
		syncNavBoxState();
	});
	stepSlider.addEventListener('dblclick', () => {
		stepSlider.value = '8';
		setToken('--nav-box-gradient-steps', '8');
		stepBadge.setText('8 items');
		syncNavBoxState();
	});

	const noneBtn = bodyPills.createEl('button', {
		text: '🚫 None',
		cls: `css-angle-preset-btn ${curBodyStyle === 'none' ? 'is-active' : ''}`,
	});
	const solidBtn = bodyPills.createEl('button', {
		text: '🎨 Solid',
		cls: `css-angle-preset-btn ${curBodyStyle === 'solid' ? 'is-active' : ''}`,
	});
	const gradBtn = bodyPills.createEl('button', {
		text: '🌈 Gradient',
		cls: `css-angle-preset-btn ${curBodyStyle === 'gradient' ? 'is-active' : ''}`,
	});

	const updateBodyStyleDisplay = (): void => {
		noneBtn.toggleClass('is-active', curBodyStyle === 'none');
		solidBtn.toggleClass('is-active', curBodyStyle === 'solid');
		gradBtn.toggleClass('is-active', curBodyStyle === 'gradient');
		bodyGradBox.style.display = curBodyStyle === 'gradient' ? 'block' : 'none';
		bodySolidBox.style.display = curBodyStyle === 'solid' ? 'block' : 'none';
	};

	const updateBodyStyle = (next: 'none' | 'solid' | 'gradient'): void => {
		curBodyStyle = next;
		setToken('--nav-box-body-enabled', next === 'none' ? 'false' : 'true');
		if (next !== 'none') {
			setToken('--nav-box-body-style', next);
			if (next === 'solid') {
				let curBg = tokenMap.get('--nav-box-bg');
				if (!curBg || curBg === 'transparent' || curBg.startsWith('rgba(255, 255, 255, 0.0') || curBg.startsWith('rgba(0, 0, 0, 0.0')) {
					curBg = isDark ? '#1e1e2e' : '#f4f4f5';
					setToken('--nav-box-bg', curBg);
				}
				bodySolidInput.value = curBg.startsWith('#') ? curBg : (isDark ? '#1e1e2e' : '#f4f4f5');
			}
		}
		updateBodyStyleDisplay();
		syncNavBoxState();
	};

	noneBtn.addEventListener('click', () => updateBodyStyle('none'));
	solidBtn.addEventListener('click', () => updateBodyStyle('solid'));
	gradBtn.addEventListener('click', () => updateBodyStyle('gradient'));

	updateBodyStyleDisplay();

	// --- 3. OUTLINE ---
	sectionHeader('Outline', 'The border stroke drawn around each row');

	const outlineRow = panel.createDiv({ cls: 'css-subcontrol-item' });
	const outlineLabel = outlineRow.createDiv({ cls: 'css-subcontrol-label' });
	outlineLabel.createSpan({ text: 'Outline Style' });
	outlineLabel.createSpan({ text: 'Gradient steps a border colour down the items; solid uses one colour.', cls: 'css-subcontrol-desc' });

	const outlinePills = outlineRow.createDiv({ cls: 'css-gradient-angle-presets' });
	let curOutlineStyle: 'none' | 'solid' | 'gradient' =
		tokenMap.get('--nav-box-outline-enabled') === 'false'
			? 'none'
			: (tokenMap.get('--nav-box-outline-style') === 'gradient' ? 'gradient' : 'solid');

	const outlineSolidBox = panel.createDiv({ cls: 'css-body-solid-container' });
	const outlineSolidRow = outlineSolidBox.createDiv({ cls: 'css-subcontrol-item' });
	const outlineSolidLabel = outlineSolidRow.createDiv({ cls: 'css-subcontrol-label' });
	outlineSolidLabel.createSpan({ text: 'Border Color' });
	outlineSolidLabel.createSpan({ text: 'Single outline colour applied to every item.', cls: 'css-subcontrol-desc' });
	const outlineSolidInputWrap = outlineSolidRow.createDiv({ cls: 'css-subcontrol-input-wrap' });
	const outlineSolidPickerWrap = outlineSolidInputWrap.createDiv({ cls: 'css-gradient-picker-item' });
	outlineSolidPickerWrap.createSpan({ text: 'Border', cls: 'css-gradient-picker-label' });
	const outlineSolidInput = outlineSolidPickerWrap.createEl('input', { type: 'color', cls: 'css-color-picker css-color-picker-mini' });
	const curOutlineBorder = tokenMap.get('--nav-box-border-color') ?? (isDark ? '#3b3b4f' : '#d1d5db');
	outlineSolidInput.value = curOutlineBorder.startsWith('#') ? curOutlineBorder : (isDark ? '#3b3b4f' : '#d1d5db');
	outlineSolidInput.title = `Outline color (${outlineSolidInput.value})`;
	outlineSolidInput.addEventListener('input', (e) => {
		setToken('--nav-box-border-color', (e.target as HTMLInputElement).value);
		syncNavBoxState();
	});

	const outlineGradBox = panel.createDiv({ cls: 'css-body-grad-container' });
	buildGradientPalette(
		outlineGradBox,
		'--nav-box-outline-gradient',
		isDark ? '#a855f7' : '#7c3aed',
		isDark ? '#06b6d4' : '#0891b2',
		isDark ? '#ec4899' : '#db2777',
	);

	const outNoneBtn = outlinePills.createEl('button', {
		text: '🚫 None',
		cls: `css-angle-preset-btn ${curOutlineStyle === 'none' ? 'is-active' : ''}`,
	});
	const outSolidBtn = outlinePills.createEl('button', {
		text: '🎨 Solid',
		cls: `css-angle-preset-btn ${curOutlineStyle === 'solid' ? 'is-active' : ''}`,
	});
	const outGradBtn = outlinePills.createEl('button', {
		text: '🌈 Gradient',
		cls: `css-angle-preset-btn ${curOutlineStyle === 'gradient' ? 'is-active' : ''}`,
	});

	const updateOutlineStyleDisplay = (): void => {
		outNoneBtn.toggleClass('is-active', curOutlineStyle === 'none');
		outSolidBtn.toggleClass('is-active', curOutlineStyle === 'solid');
		outGradBtn.toggleClass('is-active', curOutlineStyle === 'gradient');
		outlineSolidBox.style.display = curOutlineStyle === 'solid' ? 'block' : 'none';
		outlineGradBox.style.display = curOutlineStyle === 'gradient' ? 'block' : 'none';
	};

	const updateOutlineStyle = (next: 'none' | 'solid' | 'gradient'): void => {
		curOutlineStyle = next;
		setToken('--nav-box-outline-enabled', next === 'none' ? 'false' : 'true');
		if (next !== 'none') {
			setToken('--nav-box-outline-style', next);
		}
		updateOutlineStyleDisplay();
		syncNavBoxState();
	};

	outNoneBtn.addEventListener('click', () => updateOutlineStyle('none'));
	outSolidBtn.addEventListener('click', () => updateOutlineStyle('solid'));
	outGradBtn.addEventListener('click', () => updateOutlineStyle('gradient'));

	updateOutlineStyleDisplay();

	// --- 4. GEOMETRY ---
	const strokeRow = panel.createDiv({ cls: 'css-subcontrol-item' });
	const strokeLabel = strokeRow.createDiv({ cls: 'css-subcontrol-label' });
	strokeLabel.createSpan({ text: 'Stroke Width' });
	strokeLabel.createSpan({ text: 'Thickness of the outline stroke (1–6px).', cls: 'css-subcontrol-desc' });

	const strokeRightWrap = strokeRow.createDiv({ cls: 'css-subcontrol-input-wrap' });
	const strokeSlider = strokeRightWrap.createEl('input', { type: 'range', cls: 'css-slider' });
	strokeSlider.min = '1';
	strokeSlider.max = '6';
	strokeSlider.step = '1';
	const curWidthNum = parseInt((tokenMap.get('--nav-box-border-width') ?? '1px').replace('px', ''), 10) || 1;
	strokeSlider.value = curWidthNum.toString();
	const strokeBadge = strokeRightWrap.createSpan({ cls: 'css-subcontrol-value-badge', text: `${curWidthNum}px` });

	strokeSlider.addEventListener('input', (e) => {
		const val = (e.target as HTMLInputElement).value;
		setToken('--nav-box-border-width', `${val}px`);
		strokeBadge.setText(`${val}px`);
		syncNavBoxState();
	});
	strokeSlider.addEventListener('dblclick', () => {
		strokeSlider.value = '1';
		setToken('--nav-box-border-width', '1px');
		strokeBadge.setText('1px');
		syncNavBoxState();
	});

	const radiusRow = panel.createDiv({ cls: 'css-subcontrol-item' });
	const radiusLabel = radiusRow.createDiv({ cls: 'css-subcontrol-label' });
	radiusLabel.createSpan({ text: 'Corner Radius' });
	radiusLabel.createSpan({ text: 'Curvature of item corners (0–16px).', cls: 'css-subcontrol-desc' });

	const radiusRightWrap = radiusRow.createDiv({ cls: 'css-subcontrol-input-wrap' });
	const radiusSlider = radiusRightWrap.createEl('input', { type: 'range', cls: 'css-slider' });
	radiusSlider.min = '0';
	radiusSlider.max = '16';
	radiusSlider.step = '1';
	const curRadiusNum = parseInt((tokenMap.get('--nav-box-radius') ?? '6px').replace('px', ''), 10) || 6;
	radiusSlider.value = curRadiusNum.toString();
	const radiusBadge = radiusRightWrap.createSpan({ cls: 'css-subcontrol-value-badge', text: `${curRadiusNum}px` });

	radiusSlider.addEventListener('input', (e) => {
		const val = (e.target as HTMLInputElement).value;
		setToken('--nav-box-radius', `${val}px`);
		radiusBadge.setText(`${val}px`);
		syncNavBoxState();
	});
	radiusSlider.addEventListener('dblclick', () => {
		radiusSlider.value = '6';
		setToken('--nav-box-radius', '6px');
		radiusBadge.setText('6px');
		syncNavBoxState();
	});

	updateDiscreteSpectrum();
}

export function createControlRow(view: CssDesignerPopoutView, container: HTMLElement, ctrl: StyleControl, onUpdate?: () => void): void {
	const enabledMap = view.getActiveEnabledMap();
	const tokenMap = view.getActiveTokenMap();
	// Rows inside the two-column grids place their description on its own
	// full-width line; plain stacks keep it under the title.
	const inGrid = container.classList.contains('css-control-grid');
	const isEnabled = enabledMap.get(ctrl.variable) ?? true;
	const defaultVal = view.activeMode === '.theme-dark' ? ctrl.defaultDarkValue : ctrl.defaultLightValue;
	const currentValue = tokenMap.get(ctrl.variable) ?? defaultVal;
	// The unfocused-frame link is a plain boolean, so it renders a single
	// toggle that writes the value itself rather than an enable toggle plus a
	// separate value toggle.
	const isLinkControl = ctrl.id === 'titlebar-match-unfocused';

	// Special check: When transparency is enabled, lock --tab-curve to 0px with an incompatibility disclaimer
	const isGlassActive = tokenMap.get('--glass-enabled') === 'true';
	const isTabCurveLocked = ctrl.variable === '--tab-curve' && isGlassActive;
	if (isTabCurveLocked) {
		tokenMap.set('--tab-curve', '0px');
		enabledMap.set('--tab-curve', true);
		if (view.engine) {
			view.engine.setToken(view.activeMode, '--tab-curve', '0px');
		}
	}
	// Special check: while the top bar frames are linked, the unfocused colour is
	// owned by the focused one, so the swatch shows the colour in force and is
	// read-only rather than sitting there accepting edits that do nothing.
	const framesLinked = (tokenMap.get('--titlebar-match-unfocused') ?? 'true') !== 'false';
	const isUnfocusedFrameLocked = ctrl.variable === '--titlebar-background' && framesLinked;
	const linkedFrameColor = tokenMap.get('--titlebar-background-focused');
	if (isUnfocusedFrameLocked && linkedFrameColor) {
		tokenMap.set('--titlebar-background', linkedFrameColor);
		enabledMap.set('--titlebar-background', true);
		if (view.engine) {
			view.engine.setToken(view.activeMode, '--titlebar-background', linkedFrameColor);
		}
	}

	const isLocked = isTabCurveLocked || isUnfocusedFrameLocked;
	const effectiveValue = isTabCurveLocked
		? '0px'
		: isUnfocusedFrameLocked && linkedFrameColor
			? linkedFrameColor
			: currentValue;

	const row = container.createDiv({
		cls: `css-control-row ${isEnabled ? '' : 'is-disabled'} ${isTabCurveLocked ? 'is-locked-transparency' : ''} ${isUnfocusedFrameLocked ? 'is-locked-linked' : ''}`,
	});

	// Left Column: Enable/Disable Switch + Label + Variable Badge
	const leftCol = row.createDiv({ cls: 'css-control-left' });

	const toggleBox = leftCol.createDiv({ cls: 'css-control-toggle-wrap' });
	const isLinkOn = (tokenMap.get('--titlebar-match-unfocused') ?? 'true') !== 'false';

	const enableToggle = new ToggleComponent(toggleBox)
		.setValue(isLinkControl ? isLinkOn : isEnabled)
		.setTooltip(
			isLinkControl
				? 'Match the unfocused top bar to the focused one'
				: `Enable or disable ${ctrl.variable} in ${view.activeMode}`
		);

	const setEnabled = (active: boolean) => {
		// Keep the switch itself in step when the row is toggled from somewhere
		// other than the switch (clicking the colour swatch on a row that is off).
		enableToggle.setValue(active);
		// The link has no separate value control: this single toggle is the
		// setting, so on writes "true" and off writes "false".
		if (isLinkControl) {
			enabledMap.set(ctrl.variable, active);
			row.toggleClass('is-disabled', !active);
			if (view.engine) {
				if (active) {
					view.engine.setToken(view.activeMode, ctrl.variable, 'true');
				} else {
					view.engine.removeToken(view.activeMode, ctrl.variable);
				}
			}
			view.onTokenChange(ctrl, active ? 'true' : 'false');
			if (onUpdate) onUpdate();
			return;
		}
		enabledMap.set(ctrl.variable, active);
		if (active) {
			row.removeClass('is-disabled');
			if (view.engine) {
				view.engine.setToken(view.activeMode, ctrl.variable, effectiveValue);
			}
		} else {
			row.addClass('is-disabled');
			if (view.engine) {
				view.engine.removeToken(view.activeMode, ctrl.variable);
			}
		}
		view.invalidateCompanionCache();
		view.invalidateVarsCache();
		view.scheduleLiveStyleUpdate(false);
		view.debouncedSave();
		if (onUpdate) onUpdate();
	};

	enableToggle.onChange((active) => setEnabled(active));

	if (isLocked) {
		enableToggle.setDisabled(true);
	}

	const labelCol = leftCol.createDiv({ cls: 'css-control-label' });
	labelCol.setAttribute('title', ctrl.variable);
	labelCol.createSpan({ text: ctrl.label, cls: 'css-control-title' });
	if (ctrl.description && !inGrid) {
		labelCol.createSpan({ text: ctrl.description, cls: 'css-control-desc' });
	}

	if (isTabCurveLocked) {
		const disclaimer = labelCol.createDiv({ cls: 'css-control-disclaimer-warning' });
		disclaimer.createSpan({ text: '⚠️ Locked to 0px: Tab bottom slope curve is not compatible with transparency (translucent backdrop causes rendering artifacts on curved tab fillets).' });
	}

	// Right Column: Input Control
	const inputCol = row.createDiv({ cls: 'css-control-input' });

	if (ctrl.type === 'toggle') {
		if (!isLinkControl) {
			const isTrue = effectiveValue === (ctrl.toggleTrueValue ?? 'true');
			const boolToggleBox = inputCol.createDiv({ cls: 'css-boolean-toggle-wrap' });
			new ToggleComponent(boolToggleBox)
				.setValue(isTrue)
				.onChange((checked) => {
					const chosen = checked
						? (ctrl.toggleTrueValue ?? 'true')
						: (ctrl.toggleFalseValue ?? 'false');
					view.onTokenChange(ctrl, chosen);
					if (onUpdate) onUpdate();
				});
		}
	} else if (ctrl.type === 'color') {
		// A linked colour follows the top bar's focused colour rather than being
		// independently editable. A lock icon marks that relationship in place
		// of boxing the whole row, so the list keeps its rhythm.
		if (isUnfocusedFrameLocked) {
			const linkBadge = inputCol.createSpan({ cls: 'css-control-link-badge' });
			setIcon(linkBadge, 'lock');
			linkBadge.setAttribute('aria-label', 'Locked to top bar (focused)');
			linkBadge.setAttribute('title', 'Locked to top bar (focused)');
		}
		const colorPicker = inputCol.createEl('input', {
			type: 'color',
			cls: 'css-color-picker',
		});
		const fallbackHex = view.activeMode === '.theme-dark' ? '#262626' : '#ffffff';
		let initialHex = fallbackHex;
		if (effectiveValue.startsWith('#') && effectiveValue.length === 7) {
			initialHex = effectiveValue;
		} else if (effectiveValue.startsWith('rgb')) {
			initialHex = parseColorDetails(effectiveValue, 1).hex;
		} else if (defaultVal.startsWith('#') && defaultVal.length === 7) {
			initialHex = defaultVal;
		} else if (defaultVal.startsWith('rgb')) {
			initialHex = parseColorDetails(defaultVal, 1).hex;
		}
		colorPicker.value = initialHex;

		if (isLocked) {
			colorPicker.disabled = true;
		}

		// Clicking the swatch on a switched-off row turns the row on and lets
		// the native picker open in the same gesture, so choosing a colour never
		// needs a separate trip to the toggle. `pointerdown` runs before the
		// click that opens the picker, so the row is live by the time it does.
		if (!isLocked) {
			colorPicker.addEventListener('pointerdown', () => {
				if (!(enabledMap.get(ctrl.variable) ?? true)) {
					setEnabled(true);
				}
			});
		}

		colorPicker.addEventListener('input', (e) => {
			const val = (e.target as HTMLInputElement).value;
			view.onTokenChange(ctrl, val);
			if (onUpdate) onUpdate();
		});
	} else if (ctrl.type === 'select' && ctrl.options) {
		const isFontDropdown = (ctrl.category === 'typography' || ctrl.id.startsWith('font-')) && ctrl.options.length > 1;
		if (isFontDropdown) {
			const stepper = inputCol.createDiv({ cls: 'css-select-stepper' });
			const prevBtn = stepper.createEl('button', {
				cls: 'css-select-step-btn',
				attr: {
					type: 'button',
					'aria-label': `Previous ${ctrl.label}`,
					title: `Previous ${ctrl.label} (left arrow)`,
				},
			});
			setIcon(prevBtn, 'chevron-left');

			const selectEl = stepper.createEl('select', { cls: 'css-select-input' });
			populateSelectOptions(selectEl, ctrl.options, currentValue, true);

			const nextBtn = stepper.createEl('button', {
				cls: 'css-select-step-btn',
				attr: {
					type: 'button',
					'aria-label': `Next ${ctrl.label}`,
					title: `Next ${ctrl.label} (right arrow)`,
				},
			});
			setIcon(nextBtn, 'chevron-right');

			const updateProspectiveDisplay = (val: string): void => {
				updateSelectFontFamily(selectEl, val);
			};

			const step = (delta: number): void => {
				const current = tokenMap.get(ctrl.variable) ?? defaultVal;
				const opts = ctrl.options ?? [];
				const targetIdx = getNextWrappedIndex(opts, current, delta);
				if (targetIdx >= 0 && opts[targetIdx]) {
					const nextVal = opts[targetIdx].value;
					selectEl.value = nextVal;
					updateProspectiveDisplay(nextVal);
					view.onTokenChange(ctrl, nextVal);
					if (onUpdate) onUpdate();
				}
			};

			selectEl.addEventListener('change', (e) => {
				const val = (e.target as HTMLSelectElement).value;
				updateProspectiveDisplay(val);
				view.onTokenChange(ctrl, val);
				if (onUpdate) onUpdate();
			});

			prevBtn.addEventListener('click', () => step(-1));
			nextBtn.addEventListener('click', () => step(1));

			stepper.addEventListener('keydown', (evt) => {
				if (evt.key !== 'ArrowLeft' && evt.key !== 'ArrowRight') return;
				if (evt.target === selectEl) return;
				evt.preventDefault();
				step(evt.key === 'ArrowRight' ? 1 : -1);
			});

			// Dynamically merge system fonts into options if available
			void getSystemFonts().then((sysFonts) => {
				if (sysFonts.length === 0 || !ctrl.options) return;
				const added = mergeSystemFontsIntoOptions(ctrl.options, sysFonts);
				if (added && (!('isConnected' in selectEl) || selectEl.isConnected)) {
					const curr = tokenMap.get(ctrl.variable) ?? defaultVal;
					selectEl.empty();
					populateSelectOptions(selectEl, ctrl.options, curr, true);
					updateProspectiveDisplay(curr);
				}
			});
		} else {
			const selectEl = inputCol.createEl('select', { cls: 'css-select-input' });
			populateSelectOptions(selectEl, ctrl.options, currentValue);

			selectEl.addEventListener('change', (e) => {
				const val = (e.target as HTMLSelectElement).value;
				view.onTokenChange(ctrl, val);
				if (onUpdate) onUpdate();
			});
		}
	} else if (ctrl.type === 'slider') {
		const numMatch = effectiveValue.match(/^-?[\d.]+/);
		const currentNum = numMatch ? parseFloat(numMatch[0]) : (ctrl.min ?? 0);

		const isMultiplier = ctrl.id.includes('multiplier');
		const initialDisplay = isMultiplier ? `${effectiveValue}x` : effectiveValue;

		const readout = inputCol.createSpan({
			text: initialDisplay,
			cls: 'css-slider-readout',
		});

		const slider = inputCol.createEl('input', {
			type: 'range',
			cls: 'css-range-slider',
		});
		if (ctrl.min !== undefined) slider.min = String(ctrl.min);
		if (ctrl.max !== undefined) slider.max = String(ctrl.max);
		if (ctrl.step !== undefined) slider.step = String(ctrl.step);
		slider.value = String(currentNum);
		slider.setAttribute('title', isTabCurveLocked ? 'Locked to 0px while transparency is enabled' : 'Double-click to reset to default');

		if (isTabCurveLocked) {
			slider.disabled = true;
			readout.setText('0px (Locked)');
			readout.addClass('is-locked');
		}

		slider.addEventListener('input', (e) => {
			if (isTabCurveLocked) return;
			const rawNum = (e.target as HTMLInputElement).value;
			const num = parseFloat(rawNum);
			let decimals = 0;
			if (ctrl.step !== undefined) {
				const parts = ctrl.step.toString().split('.');
				if (parts.length > 1 && parts[1]) {
					decimals = parts[1].length;
				}
			}
			const formattedNum = isNaN(num)
				? rawNum
				: (decimals > 0
					? Number(num.toFixed(decimals)).toString()
					: rawNum);
			const formatted = `${formattedNum}${ctrl.unit ?? ''}`;
			const displayReadout = isMultiplier ? `${formatted}x` : formatted;
			readout.setText(displayReadout);
			view.onTokenChange(ctrl, formatted);
			if (onUpdate) onUpdate();
		});

		slider.addEventListener('dblclick', () => {
			if (isTabCurveLocked) return;
			const defMatch = defaultVal.match(/^-?[\d.]+/);
			const defaultNum = defMatch ? parseFloat(defMatch[0]) : (ctrl.min ?? 0);
			slider.value = String(defaultNum);
			const displayReadout = isMultiplier ? `${defaultVal}x` : defaultVal;
			readout.setText(displayReadout);
			view.onTokenChange(ctrl, defaultVal);
			if (onUpdate) onUpdate();
		});
	}

	// Full-width description beneath the row, for the two-column grids.
	if (inGrid && ctrl.description) {
		row.createSpan({ text: ctrl.description, cls: 'css-control-desc css-control-desc-wide' });
	}
}
