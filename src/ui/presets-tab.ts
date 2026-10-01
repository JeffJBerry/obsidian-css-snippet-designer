/**
 * Presets tab renderer for the CSS Snippet Designer.
 * Features:
 * - User Saved Presets at the top (synced from saved snippets + custom saved presets)
 * - Curated Dark Mode Themes
 * - Curated Light Mode Themes
 * - Overwrite protection warning modals before applying any preset
 * - Delete options for user-saved presets
 */
import { setIcon } from 'obsidian';
import type { CssDesignerPopoutView } from '../view';
import {
	CURATED_DARK_PRESETS,
	CURATED_LIGHT_PRESETS,
	CuratedPreset,
	UserSavedPreset,
	effectiveCuratedPresets,
	presetPreviewColors,
} from '../presets';
import {
	ConfirmActionModal,
	ConfirmApplyPresetModal,
	ConfirmDeletePresetModal,
	EditCuratedPresetModal,
	SavePresetModal,
} from './modals';

export function renderPresetsTab(view: CssDesignerPopoutView, container: HTMLElement): void {
	container.empty();
	container.addClass('css-presets-tab-container');

	// 1. USER SAVED PRESETS SECTION (AT TOP)
	renderUserPresetsSection(view, container);

	const overrides = view.plugin.settings?.curatedPresetOverrides;
	const deletedIds = view.plugin.settings?.deletedCuratedPresetIds;

	// 2. DARK MODE THEMES SECTION
	renderCuratedSection(
		view,
		container,
		'🌙 Dark Mode Themes',
		effectiveCuratedPresets(CURATED_DARK_PRESETS, overrides, deletedIds),
		'dark'
	);

	// 3. LIGHT MODE THEMES SECTION
	renderCuratedSection(
		view,
		container,
		'☀️ Light Mode Themes',
		effectiveCuratedPresets(CURATED_LIGHT_PRESETS, overrides, deletedIds),
		'light'
	);
}

function renderUserPresetsSection(view: CssDesignerPopoutView, container: HTMLElement): void {
	const sectionEl = container.createDiv({ cls: 'css-designer-section css-presets-section' });

	const headerRow = sectionEl.createDiv({ cls: 'css-presets-section-header' });
	const titleBox = headerRow.createDiv();
	titleBox.createEl('h3', { text: '💾 User saved presets', cls: 'css-designer-section-title' });

	const saveCurrentBtn = headerRow.createEl('button', {
		text: '+ save current as preset',
		cls: 'css-save-preset-btn',
	});
	saveCurrentBtn.addEventListener('click', () => {
		// Start blank: seeding the field with the active snippet name (often a
		// curated theme like "Matrix") made it look like a preset already named
		// itself, and saving would silently reuse that name.
		new SavePresetModal(view.app, '', (name) => {
			void view.saveCurrentAsPreset(name);
		}).open();
	});

	const savedPresets = view.plugin.settings?.savedPresets ?? [];

	if (savedPresets.length === 0) {
		const emptyEl = sectionEl.createDiv({ cls: 'css-preset-empty-state' });
		const iconEl = emptyEl.createDiv({ cls: 'css-preset-empty-icon' });
		setIcon(iconEl, 'sparkles');
		emptyEl.createEl('p', {
			text: 'No saved presets yet. When you save a snippet or click "+ save current as preset", your custom designs appear here for instant 1-click reuse.',
		});
		return;
	}

	const gridEl = sectionEl.createDiv({ cls: 'css-preset-grid' });

	for (const preset of savedPresets) {
		renderUserPresetCard(view, gridEl, preset);
	}
}

function renderUserPresetCard(
	view: CssDesignerPopoutView,
	grid: HTMLElement,
	preset: UserSavedPreset
): void {
	const card = grid.createDiv({ cls: 'css-preset-card mod-user' });

	// Palette band leads the column so the colours preview before the text.
	renderPalette(card, presetPreviewColors(preset));

	const body = card.createDiv({ cls: 'css-preset-card-body' });

	// Top bar: title & delete button
	const topBar = body.createDiv({ cls: 'css-preset-card-header' });
	const nameEl = topBar.createEl('h4', { text: preset.name, cls: 'css-preset-card-title' });
	nameEl.title = preset.name;

	const deleteBtn = topBar.createEl('button', {
		cls: 'clickable-icon css-preset-delete-btn',
	});
	deleteBtn.setAttribute('aria-label', `Delete preset ${preset.name}`);
	setIcon(deleteBtn, 'trash-2');
	deleteBtn.addEventListener('click', (e) => {
		e.stopPropagation();
		new ConfirmDeletePresetModal(view.app, preset.name, () => {
			void view.deleteUserPreset(preset.id);
		}).open();
	});

	// Date or description subtitle
	const dateStr = preset.savedAt
		? new Date(preset.savedAt).toLocaleDateString(undefined, {
				month: 'short',
				day: 'numeric',
				year: 'numeric',
			})
		: 'Saved snippet';
	body.createEl('p', {
		text: preset.description || `Saved snippet • ${dateStr}`,
		cls: 'css-preset-card-desc',
	});

	// Action footer: colour circles on the left, Apply on the right.
	const footer = body.createDiv({ cls: 'css-preset-card-footer' });
	renderSwatchRow(footer, presetPreviewColors(preset));
	const applyBtn = footer.createEl('button', {
		text: 'Apply preset',
		cls: 'css-preset-apply-btn',
	});

	const onApply = () => {
		new ConfirmApplyPresetModal(view.app, preset.name, () => {
			void view.applyPreset(preset);
		}).open();
	};

	applyBtn.addEventListener('click', (e) => {
		e.stopPropagation();
		onApply();
	});
	card.addEventListener('click', (e) => {
		// Ignore clicks on delete button or apply button
		if ((e.target as HTMLElement).closest('.css-preset-delete-btn, .css-preset-apply-btn')) return;
		onApply();
	});
}

function renderCuratedSection(
	view: CssDesignerPopoutView,
	container: HTMLElement,
	title: string,
	presets: CuratedPreset[],
	category: 'dark' | 'light'
): void {
	const sectionEl = container.createDiv({
		cls: `css-designer-section css-presets-section mod-${category}`,
	});

	const headerRow = sectionEl.createDiv({ cls: 'css-presets-section-header' });
	const titleBox = headerRow.createDiv();
	titleBox.createEl('h3', { text: title, cls: 'css-designer-section-title' });

	// Only worth showing once there's something in this category to undo -
	// an always-visible link here would just be clutter for most users.
	const basePresets = category === 'dark' ? CURATED_DARK_PRESETS : CURATED_LIGHT_PRESETS;
	const overrides = view.plugin.settings?.curatedPresetOverrides ?? {};
	const deletedIds = new Set(view.plugin.settings?.deletedCuratedPresetIds ?? []);
	const hasCustomizations = basePresets.some((p) => overrides[p.id] || deletedIds.has(p.id));
	if (hasCustomizations) {
		const restoreBtn = headerRow.createEl('button', {
			text: '↺ restore official presets',
			cls: 'css-preset-restore-btn',
		});
		restoreBtn.addEventListener('click', () => {
			new ConfirmActionModal(
				view.app,
				'Restore Official Presets',
				`This puts back the original name, description, and colors for every ${category} preset you've removed or overwritten in this section. Other sections and your own saved presets are untouched.`,
				'Restore',
				() => void view.restoreCuratedPresets(category)
			).open();
		});
	}

	const gridEl = sectionEl.createDiv({ cls: 'css-preset-grid' });

	for (const preset of presets) {
		renderCuratedPresetCard(view, gridEl, preset);
	}
}

function renderCuratedPresetCard(
	view: CssDesignerPopoutView,
	grid: HTMLElement,
	preset: CuratedPreset
): void {
	const card = grid.createDiv({
		cls: `css-preset-card mod-${preset.category}`,
	});

	// Slim colour accent line across the top; the footer circles show the palette.
	renderPalette(card, presetPreviewColors(preset));

	const body = card.createDiv({ cls: 'css-preset-card-body' });

	// Header
	const topBar = body.createDiv({ cls: 'css-preset-card-header' });
	topBar.createEl('h4', { text: preset.name, cls: 'css-preset-card-title' });

	const headerActions = topBar.createDiv({ cls: 'css-preset-card-header-actions' });

	const badge = headerActions.createSpan({
		cls: `css-preset-category-badge mod-${preset.category}`,
		text: preset.category === 'dark' ? 'Dark' : 'Light',
	});
	badge.title = `Optimized for ${preset.category} mode`;

	// Temporary override tools: overwrite this preset's saved colors/name/
	// description with the current live styling, or remove it from the list.
	// "Restore official presets" above undoes either.
	const editBtn = headerActions.createEl('button', {
		cls: 'clickable-icon css-preset-edit-btn',
	});
	editBtn.setAttribute('aria-label', `Overwrite preset ${preset.name} with current styling`);
	setIcon(editBtn, 'save');
	editBtn.addEventListener('click', (e) => {
		e.stopPropagation();
		new EditCuratedPresetModal(view.app, preset.name, preset.description, (name, description) => {
			void view.overwriteCuratedPreset(preset, name, description);
		}).open();
	});

	const deleteBtn = headerActions.createEl('button', {
		cls: 'clickable-icon css-preset-delete-btn',
	});
	deleteBtn.setAttribute('aria-label', `Remove preset ${preset.name}`);
	setIcon(deleteBtn, 'trash-2');
	deleteBtn.addEventListener('click', (e) => {
		e.stopPropagation();
		new ConfirmActionModal(
			view.app,
			`Remove Preset: ${preset.name}`,
			`Remove "${preset.name}" from the presets list? "Restore official presets" above brings it back.`,
			'Remove',
			() => void view.deleteCuratedPreset(preset)
		).open();
	});

	// Description
	body.createEl('p', { text: preset.description, cls: 'css-preset-card-desc' });

	// Action footer: colour circles on the left, Apply on the right.
	const footer = body.createDiv({ cls: 'css-preset-card-footer' });
	renderSwatchRow(footer, presetPreviewColors(preset));
	const applyBtn = footer.createEl('button', {
		text: 'Apply preset',
		cls: 'css-preset-apply-btn',
	});

	const onApply = () => {
		new ConfirmApplyPresetModal(view.app, preset.name, () => {
			void view.applyPreset(preset);
		}).open();
	};

	applyBtn.addEventListener('click', (e) => {
		e.stopPropagation();
		onApply();
	});
	card.addEventListener('click', (e) => {
		if ((e.target as HTMLElement).closest('.css-preset-apply-btn, .css-preset-edit-btn, .css-preset-delete-btn')) return;
		onApply();
	});
}

/**
 * A slim color strip across the card's top edge. The footer circles carry the
 * palette detail, so this is just a sleek accent line rather than a full band.
 */
function renderPalette(card: HTMLElement, colors: string[]): void {
	if (!colors || colors.length === 0) return;
	const palette = card.createDiv({ cls: 'css-preset-preview' });
	for (const color of colors) {
		const segment = palette.createDiv({ cls: 'css-preset-preview-swatch' });
		segment.setCssProps({ '--cssd-swatch-color': color });
		segment.title = color;
	}
}

/**
 * A compact row of color circles, used in the card footer beside Apply.
 */
function renderSwatchRow(footer: HTMLElement, colors: string[]): void {
	if (!colors || colors.length === 0) return;
	const row = footer.createDiv({ cls: 'css-preset-swatch-row' });
	for (const color of colors) {
		const dot = row.createDiv({ cls: 'css-preset-swatch' });
		dot.setCssProps({ '--cssd-swatch-color': color });
		dot.title = color;
	}
}
