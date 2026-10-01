/**
 * Reusable presentational widgets and form controls for the designer panel.
 */
import type { SelectOption, ShadowElementConfig } from '../schema';
import type { CssDesignerPopoutView } from '../view';
import { computeShadowString, generateKeyframeBlock } from '../css/shadows';
import { EMBEDDED_FONT_FAMILIES, embeddedPreviewFamily } from './embedded-fonts';

/**
 * Rewrites a font stack's primary family to its embedded preview alias when the
 * family has a bundled face. The embedded faces are declared under a '__cssd_'
 * name so previewing a font in the picker can never override the user's
 * Obsidian UI font or a theme that uses the same family. Non-embedded families
 * (e.g. "Arial, sans-serif") pass through untouched.
 */
export function previewFontFamily(value: string): string {
	const parts = value.split(',').map((s) => s.trim()).filter(Boolean);
	const [head, ...rest] = parts;
	if (!head) return value;
	const first = head.replace(/^['"]|['"]$/g, '');
	if (EMBEDDED_FONT_FAMILIES.has(first)) {
		return [`'${embeddedPreviewFamily(first)}'`, ...rest].join(', ');
	}
	return value;
}


/**
 * Applies prospective font-family styles to each <option> in a font <select> element.
 * Cached via dataset and attribute flags so this work happens at most once per options update.
 */
export function applyProspectiveFontStyles(selectEl: HTMLSelectElement): void {
	if (
		selectEl.dataset?.fontsRendered === 'true' ||
		selectEl.getAttribute('data-fonts-rendered') === 'true'
	) {
		return;
	}
	if (selectEl.dataset) {
		selectEl.dataset.fontsRendered = 'true';
	}
	selectEl.setAttribute('data-fonts-rendered', 'true');

	const options: ArrayLike<HTMLOptionElement> = selectEl.options && selectEl.options.length > 0
		? selectEl.options
		: (typeof selectEl.querySelectorAll === 'function' ? selectEl.querySelectorAll<HTMLOptionElement>('option') : []);

	for (let i = 0; i < options.length; i++) {
		const opt = options[i];
		if (!opt) continue;
		const val = opt.value;
		if (!val || val === 'inherit' || val === 'initial') {
			continue;
		}
		const family = previewFontFamily(val);
		if (opt.style && typeof opt.style.setProperty === 'function') {
			opt.style.setProperty('font-family', family);
		} else if (opt.style) {
			opt.style.fontFamily = family;
		}
	}
}

/**
 * Attaches JIT interaction listeners and an idle background schedule to efficiently hydrate
 * <option> prospective font styles right before opening or when the main thread is idle.
 */
export function attachProspectiveFontStyler(selectEl: HTMLSelectElement): void {
	// Schedule hydration during browser idle time so fonts are ready without blocking initial render
	if (typeof window !== 'undefined') {
		const win = window as Window & { requestIdleCallback?: (cb: () => void) => number };
		const scheduleIdle = typeof win.requestIdleCallback === 'function'
			? win.requestIdleCallback.bind(win)
			: (cb: () => void) => window.setTimeout(cb, 60);

		scheduleIdle(() => {
			if (!('isConnected' in selectEl) || selectEl.isConnected) {
				applyProspectiveFontStyles(selectEl);
			}
		});
	}

	if (
		selectEl.dataset?.fontStylerAttached === 'true' ||
		selectEl.getAttribute('data-font-styler-attached') === 'true'
	) {
		return;
	}
	if (selectEl.dataset) {
		selectEl.dataset.fontStylerAttached = 'true';
	}
	selectEl.setAttribute('data-font-styler-attached', 'true');

	const hydrate = () => applyProspectiveFontStyles(selectEl);

	selectEl.addEventListener('pointerenter', hydrate, { passive: true });
	selectEl.addEventListener('mouseenter', hydrate, { passive: true });
	selectEl.addEventListener('focus', hydrate, { passive: true });
	selectEl.addEventListener('pointerdown', hydrate, { passive: true });
	selectEl.addEventListener('mousedown', hydrate, { passive: true });
}

/**
 * Updates the display font on a font <select> element to match the active font value.
 */
export function updateSelectFontFamily(selectEl: HTMLSelectElement, val: string): void {
	const isInherit = !val || val === 'inherit';
	const family = isInherit ? '' : previewFontFamily(val);
	if (isInherit) {
		selectEl.style?.removeProperty?.('font-family');
	} else if (selectEl.style && typeof selectEl.style.setProperty === 'function') {
		selectEl.style.setProperty('font-family', family);
	} else if (selectEl.style) {
		selectEl.style.fontFamily = family;
	}
}

export function populateSelectOptions(
	selectEl: HTMLSelectElement,
	options: SelectOption[],
	currentValue: string,
	applyFontStyles = false,
): void {
	const groupEls = new Map<string, HTMLOptGroupElement>();

	for (const opt of options) {
		let targetEl: HTMLElement = selectEl;
		if (opt.group) {
			let optgroup = groupEls.get(opt.group);
			if (!optgroup) {
				optgroup = selectEl.createEl('optgroup');
				optgroup.label = opt.group;
				groupEls.set(opt.group, optgroup);
			}
			targetEl = optgroup;
		}
		const optEl = targetEl.createEl('option');
		optEl.value = opt.value;
		optEl.textContent = opt.label;
		if (opt.value === currentValue) {
			optEl.selected = true;
		}
	}

	if (applyFontStyles) {
		if (selectEl.dataset) {
			delete selectEl.dataset.fontsRendered;
		}
		selectEl.removeAttribute('data-fonts-rendered');

		updateSelectFontFamily(selectEl, currentValue);
		attachProspectiveFontStyler(selectEl);
	}
}

export function buildTagPreviewWidget(container: HTMLElement): void {
	container.empty();
	const previewCard = container.createDiv({ cls: 'css-tag-preview-card' });

	const headerRow = previewCard.createDiv({ cls: 'css-tag-preview-header' });
	headerRow.createSpan({ text: '🏷️ Live Tag Pills Preview (Reading & Live Preview Modes)', cls: 'css-tag-preview-title' });
	const badge = headerRow.createSpan({ text: 'Roundness Active', cls: 'css-tag-preview-badge' });
	badge.id = 'tag-preview-roundness-badge';

	const tagsRow = previewCard.createDiv({ cls: 'css-tag-preview-row' });

	// 1. Reading view tag (single <a> tag)
	const tag1 = tagsRow.createEl('a', { cls: 'tag css-preview-tag-pill', text: '#productivity' });
	tag1.setAttribute('href', '#productivity');

	// 2. Live Preview split tag (# + text seamlessly joined)
	const tag2 = tagsRow.createDiv({ cls: 'css-preview-cm-tag-wrap' });
	tag2.createSpan({ cls: 'cm-hashtag cm-hashtag-begin css-preview-cm-begin', text: '#' });
	tag2.createSpan({ cls: 'cm-hashtag cm-hashtag-end css-preview-cm-end', text: 'workspace-design' });

	// 3. Nested subtag (begin + middle + end seamlessly joined)
	const tag3 = tagsRow.createDiv({ cls: 'css-preview-cm-tag-wrap' });
	tag3.createSpan({ cls: 'cm-hashtag cm-hashtag-begin css-preview-cm-begin', text: '#' });
	tag3.createSpan({ cls: 'cm-hashtag css-preview-cm-mid', text: 'project/' });
	tag3.createSpan({ cls: 'cm-hashtag cm-hashtag-end css-preview-cm-end', text: 'roadmap' });

	// 4. Short tag
	const tag4 = tagsRow.createEl('a', { cls: 'tag css-preview-tag-pill', text: '#minimal' });
	tag4.setAttribute('href', '#minimal');

	// 5. Another tag
	const tag5 = tagsRow.createEl('a', { cls: 'tag css-preview-tag-pill', text: '#styling' });
	tag5.setAttribute('href', '#styling');
}

export function buildNavTreePreviewWidget(container: HTMLElement): void {
	container.empty();
	const previewCard = container.createDiv({ cls: 'css-nav-tree-preview-card' });

	const headerRow = previewCard.createDiv({ cls: 'css-nav-tree-preview-header' });
	headerRow.createSpan({ text: '📁 Live Navigation Tree Preview (File Explorer Mock)', cls: 'css-nav-tree-preview-title' });
	const badge = headerRow.createSpan({ text: 'Boxes: OFF (Default)', cls: 'css-nav-tree-preview-badge' });
	badge.id = 'nav-tree-preview-badge';

	const treeContent = previewCard.createDiv({ cls: 'nav-tree-preview-content' });

	// Core Item 1: Projects (Folder, Expanded)
	const folder1 = treeContent.createDiv({ cls: 'nav-tree-preview-folder' });
	const folderTitle1 = folder1.createDiv({ cls: 'nav-tree-preview-folder-title nav-folder-title is-item-1' });
	folderTitle1.createSpan({ text: '▼', cls: 'nav-tree-arrow' });
	folderTitle1.createSpan({ text: '📁 Projects', cls: 'nav-tree-folder-name' });

	const children1 = folder1.createDiv({ cls: 'nav-tree-preview-children' });

	const file1 = children1.createDiv({ cls: 'nav-tree-preview-file-title nav-file-title is-subfolder-item' });
	file1.createSpan({ text: '📄 Overview.md', cls: 'nav-file-title-content' });

	// Subfolder inside Projects: Components
	const subfolder = children1.createDiv({ cls: 'nav-tree-preview-folder' });
	const subfolderTitle = subfolder.createDiv({ cls: 'nav-tree-preview-folder-title nav-folder-title is-subfolder-item' });
	subfolderTitle.createSpan({ text: '▼', cls: 'nav-tree-arrow' });
	subfolderTitle.createSpan({ text: '📁 Components', cls: 'nav-tree-folder-name' });

	const subchildren = subfolder.createDiv({ cls: 'nav-tree-preview-children' });
	const subfile1 = subchildren.createDiv({ cls: 'nav-tree-preview-file-title nav-file-title is-subfolder-item' });
	subfile1.createSpan({ text: '📄 Button.tsx', cls: 'nav-file-title-content' });

	const file2 = children1.createDiv({ cls: 'nav-tree-preview-file-title nav-file-title is-active is-subfolder-item' });
	file2.createSpan({ text: '📄 Architecture.md (Active)', cls: 'nav-file-title-content' });

	// Core Item 2: Daily Notes (Folder)
	const folder2 = treeContent.createDiv({ cls: 'nav-tree-preview-folder' });
	const folderTitle2 = folder2.createDiv({ cls: 'nav-tree-preview-folder-title nav-folder-title is-item-2' });
	folderTitle2.createSpan({ text: '▶', cls: 'nav-tree-arrow' });
	folderTitle2.createSpan({ text: '📁 Daily Notes', cls: 'nav-tree-folder-name' });

	// Core Item 3: Resources (Folder)
	const folder3 = treeContent.createDiv({ cls: 'nav-tree-preview-folder' });
	const folderTitle3 = folder3.createDiv({ cls: 'nav-tree-preview-folder-title nav-folder-title is-item-3' });
	folderTitle3.createSpan({ text: '▶', cls: 'nav-tree-arrow' });
	folderTitle3.createSpan({ text: '📁 Resources', cls: 'nav-tree-folder-name' });

	// Core Item 4: Templates (Folder)
	const folder4 = treeContent.createDiv({ cls: 'nav-tree-preview-folder' });
	const folderTitle4 = folder4.createDiv({ cls: 'nav-tree-preview-folder-title nav-folder-title is-item-4' });
	folderTitle4.createSpan({ text: '▶', cls: 'nav-tree-arrow' });
	folderTitle4.createSpan({ text: '📁 Templates', cls: 'nav-tree-folder-name' });

	// Core Item 5: Archive (Folder)
	const folder5 = treeContent.createDiv({ cls: 'nav-tree-preview-folder' });
	const folderTitle5 = folder5.createDiv({ cls: 'nav-tree-preview-folder-title nav-folder-title is-item-5' });
	folderTitle5.createSpan({ text: '▶', cls: 'nav-tree-arrow' });
	folderTitle5.createSpan({ text: '📁 Archive', cls: 'nav-tree-folder-name' });

	// Core Item 6: Dashboard (Root File)
	const file6 = treeContent.createDiv({ cls: 'nav-tree-preview-file-title nav-file-title is-item-6' });
	file6.createSpan({ text: '📄 Dashboard.md', cls: 'nav-file-title-content' });
}

export function buildShadowPreviewWidget(preview: HTMLElement, el: ShadowElementConfig): void {
	preview.empty();
	if (el.id === 'headings') {
		preview.addClass('obsidian-preview-headings-box');
		preview.createDiv({ cls: 'obsidian-preview-h1', text: 'Deep Space Research 🪐' });
		preview.createDiv({ cls: 'obsidian-preview-h2', text: 'Key Discoveries & Telemetry' });
	} else if (el.id === 'body-text') {
		preview.addClass('obsidian-preview-body-box');
		const p = preview.createEl('p', { cls: 'obsidian-preview-p' });
		p.createSpan({ text: 'Obsidian notes link seamlessly across your vault. Check ' });
		p.createSpan({ cls: 'internal-link', text: '[[Quantum Computing]]' });
		p.createSpan({ text: ' for active telemetry.' });
	} else if (el.id === 'callouts') {
		const calloutBox = preview.createDiv({ cls: 'callout obsidian-preview-callout' });
		const title = calloutBox.createDiv({ cls: 'callout-title obsidian-callout-title' });
		title.createSpan({ text: '💡' });
		title.createDiv({ text: 'Note Alert & Callout' });
		const content = calloutBox.createDiv({ cls: 'callout-content obsidian-callout-content' });
		content.setText('Visual CSS snippet styling for your Obsidian notes.');
	} else if (el.id === 'codeblocks') {
		const pre = preview.createEl('pre', { cls: 'obsidian-preview-codeblock' });
		const codeHeader = pre.createDiv({ cls: 'obsidian-codeblock-header' });
		codeHeader.createSpan({ text: 'typescript' });
		codeHeader.createSpan({ text: 'copy' });
		const code = pre.createEl('code', { cls: 'obsidian-codeblock-pre' });
		code.createSpan({ cls: 'token-kw', text: 'const ' });
		code.createSpan({ cls: 'token-fn', text: 'designer ' });
		code.createSpan({ text: '= ' });
		code.createSpan({ cls: 'token-kw', text: 'new ' });
		code.createSpan({ cls: 'token-class', text: 'CssDesigner' });
		code.createSpan({ text: '();\n' });
		code.createSpan({ cls: 'token-var', text: 'designer' });
		code.createSpan({ text: '.' });
		code.createSpan({ cls: 'token-fn', text: 'generateCss' });
		code.createSpan({ text: '();' });
	} else if (el.id === 'active-leaf') {
		const leaf = preview.createDiv({ cls: 'workspace-leaf obsidian-preview-leaf' });
		const tabbar = leaf.createDiv({ cls: 'obsidian-leaf-tabbar' });
		const activeTab = tabbar.createDiv({ cls: 'obsidian-leaf-tab is-active' });
		activeTab.createSpan({ text: '📑 Deep Space.md' });
		const otherTab = tabbar.createDiv({ cls: 'obsidian-leaf-tab' });
		otherTab.createSpan({ text: 'Plan.md' });
		const body = leaf.createDiv({ cls: 'obsidian-leaf-body' });
		body.setText('# Workspace Styling\n• Visual CSS theme rules active.');
	} else if (el.id === 'nav-icons') {
		const ribbon = preview.createDiv({ cls: 'obsidian-preview-ribbon' });
		for (const glyph of ['📝', '🔍', '🔖', '⚙️']) {
			ribbon.createDiv({ cls: 'obsidian-preview-ribbon-btn', text: glyph });
		}
	} else if (el.id === 'nav-text') {
		const tree = preview.createDiv({ cls: 'obsidian-preview-tree' });
		tree.createDiv({ cls: 'obsidian-preview-tree-row' })
			.createSpan({ cls: 'obsidian-preview-nav-text', text: '📁 Research' });
		tree.createDiv({ cls: 'obsidian-preview-tree-row' })
			.createSpan({ cls: 'obsidian-preview-nav-text', text: '📄 Deep Space' });
	} else if (el.id === 'nav-item-box') {
		const tree = preview.createDiv({ cls: 'obsidian-preview-tree' });
		tree.createDiv({ cls: 'obsidian-preview-nav-row', text: '📁 Research' });
		tree.createDiv({ cls: 'obsidian-preview-nav-row is-active', text: '📄 Deep Space' });
	} else if (el.id === 'canvas-cards') {
		const canvas = preview.createDiv({ cls: 'obsidian-preview-canvas' });
		const card = canvas.createDiv({ cls: 'obsidian-preview-canvas-card' });
		card.createDiv({ cls: 'obsidian-preview-canvas-card-title', text: '📄 Deep Space' });
		card.createDiv({ cls: 'obsidian-preview-canvas-card-line', text: 'Telemetry note' });
	} else if (el.id === 'pane-dividers') {
		const panes = preview.createDiv({ cls: 'obsidian-preview-panes' });
		panes.createDiv({ cls: 'obsidian-preview-pane', text: 'Pane A' });
		panes.createDiv({ cls: 'obsidian-preview-pane-divider' });
		panes.createDiv({ cls: 'obsidian-preview-pane', text: 'Pane B' });
	} else if (el.id === 'workspace-leaf-resizer-hover') {
		const panes = preview.createDiv({ cls: 'obsidian-preview-panes' });
		panes.createDiv({ cls: 'obsidian-preview-pane', text: 'Pane A' });
		panes.createDiv({ cls: 'obsidian-preview-resizer-handle is-hovered' });
		panes.createDiv({ cls: 'obsidian-preview-pane', text: 'Pane B' });
	}
}

/**
 * The element(s) inside each preview that receive the live shadow/outline, and
 * whether the effect is a text or box effect. Keeping this as data (rather than
 * a chain of `if`s) is what lets the catalogue be checked for full coverage.
 */
export const SHADOW_PREVIEW_TARGETS: Record<string, { selector: string; text: boolean }> = {
	headings: { selector: '.obsidian-preview-h1, .obsidian-preview-h2', text: true },
	'body-text': { selector: '.obsidian-preview-p', text: true },
	callouts: { selector: '.obsidian-preview-callout', text: false },
	codeblocks: { selector: '.obsidian-preview-codeblock', text: false },
	'active-leaf': { selector: '.obsidian-preview-leaf', text: false },
	'nav-icons': { selector: '.obsidian-preview-ribbon-btn', text: false },
	'nav-text': { selector: '.obsidian-preview-nav-text', text: true },
	'nav-item-box': { selector: '.obsidian-preview-nav-row', text: false },
	'canvas-cards': { selector: '.obsidian-preview-canvas-card', text: false },
	'pane-dividers': { selector: '.obsidian-preview-pane-divider', text: false },
	'workspace-leaf-resizer-hover': { selector: '.obsidian-preview-resizer-handle', text: false },
};

export function createShadowSlider(
	container: HTMLElement,
	label: string,
	varKey: string,
	tokenMap: Map<string, string>,
	min: number,
	max: number,
	step: number,
	unit: string,
	onChange: () => void,
	defaultVal?: string | number,
): void {
	const item = container.createDiv({ cls: 'css-shadow-grid-item' });
	const defaultStr = defaultVal !== undefined ? String(defaultVal) : (min === 0 ? `0${unit}` : `${min}${unit}`);
	const curVal = tokenMap.get(varKey) ?? defaultStr;
	const numMatch = curVal.match(/^-?[\d.]+/);
	const curNum = numMatch ? parseFloat(numMatch[0]) : min;

	const labelEl = item.createDiv({ cls: 'css-shadow-grid-item-label' });
	labelEl.createSpan({ text: `${label}: ` });
	const readout = labelEl.createSpan({ text: curVal, cls: 'css-slider-readout' });

	const slider = item.createEl('input', {
		type: 'range',
		cls: 'css-range-slider',
	});
	slider.min = String(min);
	slider.max = String(max);
	slider.step = String(step);
	slider.value = String(curNum);
	slider.setAttribute('title', 'Double-click to reset to default');

	slider.addEventListener('input', (e) => {
		const raw = (e.target as HTMLInputElement).value;
		const num = parseFloat(raw);
		const formattedNum = isNaN(num)
			? raw
			: (step < 1 ? Number(num.toFixed(1)).toString() : raw);
		const formatted = `${formattedNum}${unit}`;
		readout.setText(formatted);
		tokenMap.set(varKey, formatted);
		onChange();
	});

	slider.addEventListener('dblclick', () => {
		const defMatch = defaultStr.match(/^-?[\d.]+/);
		const defNum = defMatch ? parseFloat(defMatch[0]) : min;
		slider.value = String(defNum);
		readout.setText(defaultStr);
		tokenMap.set(varKey, defaultStr);
		onChange();
	});
}

export function updateTagPreviewWidget(view: CssDesignerPopoutView, container: HTMLElement): void {
	const tokenMap = view.getActiveTokenMap();
	const enabledMap = view.getActiveEnabledMap();
	const isDark = view.activeMode === '.theme-dark';

	const radius = (enabledMap.get('--tag-radius') ?? true) ? (tokenMap.get('--tag-radius') ?? '12px') : '12px';
	const size = (enabledMap.get('--tag-size') ?? true) ? (tokenMap.get('--tag-size') ?? '11px') : '11px';
	const color = (enabledMap.get('--tag-color') ?? true)
		? (tokenMap.get('--tag-color') ?? (isDark ? '#c084fc' : '#7c3aed'))
		: (isDark ? '#c084fc' : '#7c3aed');
	const bg = (enabledMap.get('--tag-background') ?? true)
		? (tokenMap.get('--tag-background') ?? (isDark ? '#3b1a54' : '#f3e8ff'))
		: (isDark ? '#3b1a54' : '#f3e8ff');
	const padX = (enabledMap.get('--tag-padding-x') ?? true) ? (tokenMap.get('--tag-padding-x') ?? '8px') : '8px';
	const padY = (enabledMap.get('--tag-padding-y') ?? true) ? (tokenMap.get('--tag-padding-y') ?? '2px') : '2px';

	const previewCard = container.querySelector<HTMLElement>('.css-tag-preview-card');
	if (previewCard) {
		previewCard.setCssProps({
			'--preview-tag-radius': radius,
			'--preview-tag-size': size,
			'--preview-tag-color': color,
			'--preview-tag-bg': bg,
			'--preview-tag-padding-x': padX,
			'--preview-tag-padding-y': padY,
		});
	}

	const badge = container.querySelector<HTMLElement>('#tag-preview-roundness-badge');
	if (badge) {
		badge.setText(`Radius: ${radius}`);
	}
}

export function updateNavTreePreviewWidget(view: CssDesignerPopoutView, container: HTMLElement): void {
	const tokenMap = view.getActiveTokenMap();
	const enabledMap = view.getActiveEnabledMap();
	const isDark = view.activeMode === '.theme-dark';

	const isBoxOn = (enabledMap.get('--nav-box-enabled') ?? true) &&
		tokenMap.get('--nav-box-enabled') === 'true';

	const badge = container.querySelector<HTMLElement>('#nav-tree-preview-badge');
	if (badge) {
		if (!isBoxOn) {
			badge.setText('Boxes: OFF (default flat)');
		} else {
			const isBodyGrad = tokenMap.get('--nav-box-body-style') !== 'solid';
			const modeText = isBodyGrad ? 'Vertical Gradient' : 'Solid Color';
			const isSubfoldersOn = tokenMap.get('--nav-box-subfolders-enabled') === 'true';
			const subfolderText = isSubfoldersOn ? 'Subfolders: ON' : 'Subfolders: OFF';
			badge.setText(`Boxes: ON (${modeText} | ${subfolderText})`);
		}
	}

	const previewCard = container.querySelector<HTMLElement>('.css-nav-tree-preview-card');
	if (previewCard) {
		const bgDisplay = tokenMap.get('--nav-box-bg-display') ?? 'transparent';
		const borderDisplay = tokenMap.get('--nav-box-border-display') ?? '1px solid transparent';
		const borderColorDisplay = tokenMap.get('--nav-box-border-color-display') ?? 'transparent';
		const radiusDisplay = tokenMap.get('--nav-box-radius-display') ?? 'var(--radius-s, 4px)';
		const marginDisplay = tokenMap.get('--nav-box-margin-display') ?? '0px';
		const shadowDisplay = tokenMap.get('--nav-box-shadow-display') ?? 'none';
		const textColor = tokenMap.get('--nav-item-color') ?? (isDark ? '#9ca3af' : '#4b5563');
		const activeTextColor = tokenMap.get('--nav-item-color-active') ?? (isDark ? '#c084fc' : '#7c3aed');
		const guideColor = tokenMap.get('--nav-indentation-guide-color') ?? (isDark ? '#374151' : '#e5e7eb');
		const fontSize = tokenMap.get('--nav-item-size') ?? '13px';

		previewCard.setCssProps({
			'--preview-nav-box-bg': bgDisplay,
			'--preview-nav-box-gradient': tokenMap.get('--nav-box-gradient-display') ?? 'none',
			'--preview-nav-box-border': borderDisplay,
			'--preview-nav-box-border-color': borderColorDisplay,
			'--preview-nav-box-radius': radiusDisplay,
			'--preview-nav-box-margin': marginDisplay,
			'--preview-nav-box-shadow': shadowDisplay,
			'--preview-nav-text-color': textColor,
			'--preview-nav-active-color': activeTextColor,
			'--preview-nav-guide-color': guideColor,
			'--preview-nav-font-size': fontSize,
			'--preview-nav-item-1-bg': tokenMap.get('--nav-box-item-1-bg') ?? bgDisplay,
			'--preview-nav-item-1-border': tokenMap.get('--nav-box-item-1-border') ?? borderColorDisplay,
			'--preview-nav-item-2-bg': tokenMap.get('--nav-box-item-2-bg') ?? bgDisplay,
			'--preview-nav-item-2-border': tokenMap.get('--nav-box-item-2-border') ?? borderColorDisplay,
			'--preview-nav-item-3-bg': tokenMap.get('--nav-box-item-3-bg') ?? bgDisplay,
			'--preview-nav-item-3-border': tokenMap.get('--nav-box-item-3-border') ?? borderColorDisplay,
			'--preview-nav-item-4-bg': tokenMap.get('--nav-box-item-4-bg') ?? bgDisplay,
			'--preview-nav-item-4-border': tokenMap.get('--nav-box-item-4-border') ?? borderColorDisplay,
			'--preview-nav-item-5-bg': tokenMap.get('--nav-box-item-5-bg') ?? bgDisplay,
			'--preview-nav-item-5-border': tokenMap.get('--nav-box-item-5-border') ?? borderColorDisplay,
			'--preview-nav-item-6-bg': tokenMap.get('--nav-box-item-6-bg') ?? bgDisplay,
			'--preview-nav-item-6-border': tokenMap.get('--nav-box-item-6-border') ?? borderColorDisplay,
			'--preview-nav-subfolder-bg': tokenMap.get('--nav-box-subfolder-bg-display') ?? 'transparent',
			'--preview-nav-subfolder-border': tokenMap.get('--nav-box-subfolder-border-display') ?? '1px solid transparent',
			'--preview-nav-subfolder-border-color': tokenMap.get('--nav-box-subfolder-border-color-display') ?? 'transparent',
			'--preview-nav-subfolder-margin': tokenMap.get('--nav-box-subfolder-margin-display') ?? '0px',
			'--preview-nav-subfolder-shadow': tokenMap.get('--nav-box-subfolder-shadow-display') ?? 'none',
		});
	}
}

export function renderDiscreteNavSpectrum(discreteStrip: HTMLElement, view: CssDesignerPopoutView): void {
	discreteStrip.empty();
	const tokenMap = view.getActiveTokenMap();
	const isGrad = tokenMap.get('--nav-box-body-style') !== 'solid';
	const stepCount = Math.max(3, Math.min(24, parseInt(tokenMap.get('--nav-box-gradient-steps') ?? '8', 10) || 8));
	discreteStrip.toggleClass('is-hidden', !isGrad);
	if (!isGrad) {
		return;
	}
	for (let i = 1; i <= stepCount; i++) {
		const pct = Math.min(100, Math.round(((i - 1) / Math.max(1, stepCount - 1)) * 100));
		const col = view.getNavBoxGradientColorAt(pct);
		const step = discreteStrip.createDiv({ cls: 'css-nav-discrete-step' });
		step.style.backgroundColor = col;
		step.setText(`${i}`);
		step.setAttribute('title', `Item ${i}: ${col} (${pct}%)`);
	}
}

export function renderDiscreteHeadingSpectrum(discreteStrip: HTMLElement, view: CssDesignerPopoutView): void {
	discreteStrip.empty();
	const tokenMap = view.getActiveTokenMap();
	const isGrad = tokenMap.get('--header-gradient-style') !== 'solid';
	discreteStrip.toggleClass('is-hidden', !isGrad);
	if (!isGrad) {
		return;
	}
	for (let i = 1; i <= 6; i++) {
		const pct = Math.round(((i - 1) / 5) * 100);
		const col = view.getHeaderGradientColorAt(pct);
		const step = discreteStrip.createDiv({ cls: 'css-nav-discrete-step css-heading-discrete-step' });
		step.style.backgroundColor = col;
		step.setText(`H${i}`);
		step.setAttribute('title', `H${i} Heading: ${col} (${pct}%)`);
	}
}

/**
 * Dedicated Tab: Shadows, Glows & Outlines
 */

export function updateShadowPreview(view: CssDesignerPopoutView, preview: HTMLElement, el: ShadowElementConfig, tokenMap: Map<string, string>): void {
	const isEnabled = tokenMap.get(`--sh-${el.id}-enabled`) === 'true';
	const shadow = isEnabled ? computeShadowString(el.id, tokenMap, el.kind, 'base') : 'none';
	const isOutlineOn = isEnabled && tokenMap.get(`--sh-${el.id}-outline-enabled`) === 'true';
	const outlineWidth = tokenMap.get(`--sh-${el.id}-outline-width`) ?? '2px';
	const outlineColor = tokenMap.get(`--sh-${el.id}-outline-color`) ?? '#7c3aed';

	const animStyle = tokenMap.get(`--sh-${el.id}-anim-style`) ?? 'none';
	const animSpeed = tokenMap.get(`--sh-${el.id}-anim-speed`) ?? '2.5s';
	const gradientAnim = tokenMap.get(`--sh-${el.id}-gradient-anim`) === 'true';
	const hasAnim = isEnabled && (animStyle !== 'none' || gradientAnim);
	const scopeKey = view.activeMode === '.theme-dark' ? 'themedark' : 'themelight';

	const animBlock = generateKeyframeBlock(el, tokenMap, scopeKey);
	const animName = animBlock ? animBlock.keyframeName : `sh-anim-${el.id}-${scopeKey}`;

	// Directly inject / refresh keyframe styles in the preview's ownerDocument
	const doc = preview.ownerDocument;
	if (doc && doc.head) {
		let kfEl = doc.getElementById(`css-designer-preview-kf-${el.id}`) as HTMLStyleElement | null;
		if (hasAnim && animBlock) {
			if (!kfEl) {
				kfEl = createEl('style');
				kfEl.id = `css-designer-preview-kf-${el.id}`;
				doc.head.appendChild(kfEl);
			}
			if (kfEl.textContent !== animBlock.css) {
				kfEl.textContent = animBlock.css;
			}
		} else if (kfEl) {
			kfEl.textContent = '';
		}
	}

	const applyToElement = (target: HTMLElement, isText: boolean) => {
		// Animated properties must NOT have !important so CSS keyframes can
		// interpolate them freely. Values are passed as custom properties and the
		// matching class consumes them, so no styles are set directly here.
		target.addClass(isText ? 'css-preview-dynamic-text' : 'css-preview-dynamic-box');
		const timing = animBlock?.timingFunction ?? 'ease-in-out';
		const vars: Record<string, string> = {
			'--cssd-animation': hasAnim && animBlock ? `${animName} ${animSpeed} ${timing} infinite` : 'none',
		};
		const outlined = isOutlineOn && outlineWidth !== '0px';
		if (isText) {
			vars['--cssd-text-shadow'] = shadow;
			vars['--cssd-text-stroke'] = outlined ? `${outlineWidth} ${outlineColor}` : 'unset';
		} else {
			vars['--cssd-box-shadow'] = shadow;
			vars['--cssd-outline'] = outlined ? `${outlineWidth} solid ${outlineColor}` : 'none';
			vars['--cssd-outline-offset'] = outlined ? '-1px' : '0';
		}
		target.setCssProps(vars);
	};

	const target = SHADOW_PREVIEW_TARGETS[el.id];
	if (target) {
		preview.querySelectorAll<HTMLElement>(target.selector).forEach((t) => applyToElement(t, target.text));
	}

	if (el.id === 'callouts') {
		preview.querySelectorAll<HTMLElement>('.obsidian-preview-callout').forEach((c) => c.addClass('css-preview-unclipped'));
	} else if (el.id === 'codeblocks') {
		preview.querySelectorAll<HTMLElement>('.obsidian-preview-codeblock').forEach((c) => c.addClass('css-preview-unclipped', 'css-preview-unclipped-low'));
	} else if (el.id === 'active-leaf') {
		preview.querySelectorAll<HTMLElement>('.obsidian-preview-leaf').forEach((l) => {
			l.addClass('css-preview-leaf-positioned');
		});
	}
}
