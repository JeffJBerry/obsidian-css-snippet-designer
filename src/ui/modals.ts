/**
 * Modal dialogs: tab visibility configuration and the save-snippet flow.
 */
import { App, Modal, Setting, Notice, TextComponent, DropdownComponent, SuggestModal } from 'obsidian';
import type CssSnippetDesignerPlugin from '../main';
import type { CssDesignerPopoutView } from '../view';
import { TAB_DEFINITIONS, type SelectOption } from '../schema';
import { DEFAULT_SNIPPET_NAME } from '../constants';

export class TabConfigModal extends Modal {
	plugin: CssSnippetDesignerPlugin;
	onSave: () => void;

	constructor(app: App, plugin: CssSnippetDesignerPlugin, onSave: () => void) {
		super(app);
		this.plugin = plugin;
		this.onSave = onSave;
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass('css-tab-config-modal');

		contentEl.createEl('h2', { text: 'Configure navigation tabs' });
		contentEl.createEl('p', {
			text: 'Choose which navigation items appear in the snippet designer toolbar.',
			cls: 'css-modal-subtitle',
		});

		new Setting(contentEl)
			.setName('Show tab icons')
			.setDesc('Display icon glyphs alongside tab labels')
			.addToggle((t) =>
				t.setValue(this.plugin.settings?.showTabIcons ?? true).onChange(async (val) => {
					if (this.plugin.settings) {
						this.plugin.settings.showTabIcons = val;
						await this.plugin.saveSettings();
						this.onSave();
					}
				})
			);

		new Setting(contentEl)
			.setName('Compact navigation tabs')
			.setDesc('Reduce horizontal padding on navigation tabs for smaller screens')
			.addToggle((t) =>
				t.setValue(this.plugin.settings?.compactTabs ?? false).onChange(async (val) => {
					if (this.plugin.settings) {
						this.plugin.settings.compactTabs = val;
						await this.plugin.saveSettings();
						this.onSave();
					}
				})
			);

		contentEl.createEl('h3', { text: 'Visible navigation items', cls: 'css-designer-section-title' });

		for (const tab of TAB_DEFINITIONS) {
			const isVisible = this.plugin.settings?.visibleTabs?.[tab.id] ?? true;
			new Setting(contentEl)
				.setName(tab.label)
				.setDesc(tab.description)
				.addToggle((toggle) =>
					toggle.setValue(isVisible).onChange(async (val) => {
						if (!this.plugin.settings) return;
						if (!val) {
							const activeCount = Object.values(this.plugin.settings.visibleTabs).filter(Boolean).length;
							if (activeCount <= 1) {
								toggle.setValue(true);
								new Notice('At least one navigation tab must remain visible');
								return;
							}
						}
						this.plugin.settings.visibleTabs[tab.id] = val;
						await this.plugin.saveSettings();
						this.onSave();
					})
				);
		}
	}

	onClose(): void {
		this.contentEl.empty();
	}
}

export class SaveSnippetModal extends Modal {
	view: CssDesignerPopoutView;
	snippetName: string;

	constructor(app: App, view: CssDesignerPopoutView, defaultName: string) {
		super(app);
		this.view = view;
		this.snippetName = defaultName || DEFAULT_SNIPPET_NAME;
	}

	async onOpen(): Promise<void> {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass('css-save-snippet-modal');

		contentEl.createEl('h2', { text: 'Save CSS snippet' });

		const subtitleEl = contentEl.createEl('p', { cls: 'css-modal-subtitle' });
		subtitleEl.createSpan({ text: 'Default directory: ' });
		subtitleEl.createEl('code', { text: `${this.app.vault.configDir}/snippets/` });

		const snippetsFolder = this.view.getSnippetsFolder();
		let existingSnippets: string[] = [];
		try {
			if (await this.app.vault.adapter.exists(snippetsFolder)) {
				const list = await this.app.vault.adapter.list(snippetsFolder);
				existingSnippets = list.files
					.filter((f) => f.toLowerCase().endsWith('.css'))
					.map((f) => {
						const parts = f.split(/[\\/]/);
						const base = parts[parts.length - 1] || '';
						return base.replace(/\.css$/i, '');
					})
					.filter((name) => name.length > 0)
					.sort((a, b) => a.localeCompare(b));
			}
		} catch (e) {
			console.error('Failed to list existing snippets:', e);
		}

		let textInputComp: TextComponent | null = null;
		let dropdownComp: DropdownComponent | null = null;

		new Setting(contentEl)
			.setName('Snippet name')
			.setDesc('Enter a name for your CSS snippet (without .css extension)')
			.addText((text) => {
				textInputComp = text;
				text.setPlaceholder(DEFAULT_SNIPPET_NAME)
					.setValue(this.snippetName)
					.onChange((val) => {
						this.snippetName = val;
						updateFeedback();
					});
				text.inputEl.addEventListener('keydown', (e: KeyboardEvent) => {
					if (e.key === 'Enter') {
						e.preventDefault();
						void this.handleSave();
					}
				});
			});

		if (existingSnippets.length > 0) {
			new Setting(contentEl)
				.setName('Overwrite existing snippet')
				.setDesc('Pick an existing snippet from your vault to overwrite')
				.addDropdown((dropdown) => {
					dropdownComp = dropdown;
					dropdown.addOption('', '-- choose snippet to overwrite --');
					for (const snip of existingSnippets) {
						dropdown.addOption(snip, `${snip}.css`);
					}
					dropdown.onChange((val) => {
						if (val) {
							this.snippetName = val;
							if (textInputComp) {
								textInputComp.setValue(val);
							}
							updateFeedback();
						}
					});
				});

			const chipsSection = contentEl.createDiv({ cls: 'css-snippet-chips-section' });
			chipsSection.createDiv({
				text: 'Vault snippets (click to select for overwrite):',
				cls: 'css-snippet-chips-label',
			});
			const chipsContainer = chipsSection.createDiv({ cls: 'css-snippet-chips-list' });
			for (const snip of existingSnippets) {
				const chipBtn = chipsContainer.createEl('button', {
					text: `${snip}.css`,
					cls: 'css-snippet-chip',
				});
				chipBtn.addEventListener('click', () => {
					this.snippetName = snip;
					if (textInputComp) {
						textInputComp.setValue(snip);
					}
					if (dropdownComp) {
						dropdownComp.setValue(snip);
					}
					updateFeedback();
				});
			}
		}

		const statusBox = contentEl.createDiv({ cls: 'css-snippet-save-status' });

		const footer = contentEl.createDiv({ cls: 'css-modal-footer' });
		const cancelBtn = footer.createEl('button', { text: 'Cancel' });
		cancelBtn.addEventListener('click', () => this.close());

		const saveBtn = footer.createEl('button', {
			text: 'Save snippet',
			cls: 'mod-cta',
		});
		saveBtn.addEventListener('click', () => {
			void this.handleSave();
		});

		const getCleanName = (): string => {
			let name = (this.snippetName || '').trim();
			if (name.toLowerCase().endsWith('.css')) {
				name = name.slice(0, -4);
			}
			return name.replace(/[\\/:*?"<>|]/g, '-').trim();
		};

		const updateFeedback = () => {
			const clean = getCleanName();
			statusBox.empty();

			if (!clean) {
				statusBox.createSpan({
					text: '⚠️ Please enter a snippet name.',
					cls: 'css-status-warn',
				});
				saveBtn.disabled = true;
				saveBtn.setText('Save snippet');
				saveBtn.removeClass('mod-warning');
				return;
			}

			saveBtn.disabled = false;
			const isOverwrite = existingSnippets.some((s) => s.toLowerCase() === clean.toLowerCase());
			if (isOverwrite) {
				statusBox.createSpan({
					text: `⚠️ Overwrite Warning: "${clean}.css" already exists in .obsidian/snippets/ and will be overwritten!`,
					cls: 'css-status-overwrite',
				});
				saveBtn.setText('Save & overwrite');
				saveBtn.addClass('mod-warning');
			} else {
				statusBox.createSpan({
					text: `✓ Will create new snippet "${clean}.css" in .obsidian/snippets/`,
					cls: 'css-status-new',
				});
				saveBtn.setText('Save snippet');
				saveBtn.removeClass('mod-warning');
			}
		};

		// Initial evaluation
		updateFeedback();
	}

	private async handleSave(): Promise<void> {
		let name = (this.snippetName || '').trim();
		if (name.toLowerCase().endsWith('.css')) {
			name = name.slice(0, -4);
		}
		name = name.replace(/[\\/:*?"<>|]/g, '-').trim();
		if (!name) {
			new Notice('Please enter a valid snippet name');
			return;
		}

		await this.view.saveSnippetAs(name);
		this.close();
	}

	onClose(): void {
		this.contentEl.empty();
	}
}

export class ConfirmApplyPresetModal extends Modal {
	presetName: string;
	onConfirm: () => void;

	constructor(app: App, presetName: string, onConfirm: () => void) {
		super(app);
		this.presetName = presetName;
		this.onConfirm = onConfirm;
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass('css-preset-modal');

		contentEl.createEl('h2', { text: `Apply Preset: ${this.presetName}` });

		const msgEl = contentEl.createDiv({ cls: 'css-preset-modal-warning' });
		msgEl.createEl('p', {
			text: '⚠️ applying this preset will reset your current styling controls and overwrite your unsaved adjustments.',
		});
		msgEl.createEl('p', {
			text: 'Are you sure you want to proceed and apply this preset?',
			cls: 'css-preset-modal-subtext',
		});

		const footer = contentEl.createDiv({ cls: 'css-modal-footer' });
		const cancelBtn = footer.createEl('button', { text: 'Cancel' });
		cancelBtn.addEventListener('click', () => this.close());

		const applyBtn = footer.createEl('button', {
			text: 'Apply preset',
			cls: 'mod-cta mod-warning',
		});
		applyBtn.addEventListener('click', () => {
			this.close();
			this.onConfirm();
		});

		contentEl.addEventListener('keydown', (e: KeyboardEvent) => {
			if (e.key === 'Enter') {
				e.preventDefault();
				this.close();
				this.onConfirm();
			}
		});
	}

	onClose(): void {
		this.contentEl.empty();
	}
}

export class SavePresetModal extends Modal {
	defaultName: string;
	onSave: (name: string) => void;

	constructor(app: App, defaultName: string, onSave: (name: string) => void) {
		super(app);
		this.defaultName = defaultName;
		this.onSave = onSave;
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass('css-preset-modal');

		contentEl.createEl('h2', { text: 'Save current style as preset' });
		contentEl.createEl('p', {
			text: 'Save your current designer configuration as a reusable preset.',
			cls: 'css-modal-subtitle',
		});

		let nameInput: TextComponent | null = null;
		let nameVal = this.defaultName;

		new Setting(contentEl)
			.setName('Preset name')
			.setDesc('Give your preset a memorable name')
			.addText((text) => {
				nameInput = text;
				text.setValue(this.defaultName)
					.setPlaceholder('E.g. My custom theme')
					.onChange((val) => {
						nameVal = val;
					});
				text.inputEl.addEventListener('keydown', (e: KeyboardEvent) => {
					if (e.key === 'Enter') {
						e.preventDefault();
						submit();
					}
				});
			});

		const footer = contentEl.createDiv({ cls: 'css-modal-footer' });
		const cancelBtn = footer.createEl('button', { text: 'Cancel' });
		cancelBtn.addEventListener('click', () => this.close());

		const saveBtn = footer.createEl('button', {
			text: 'Save preset',
			cls: 'mod-cta',
		});

		const submit = () => {
			const clean = nameVal.trim();
			if (!clean) {
				new Notice('Please enter a preset name');
				return;
			}
			this.close();
			this.onSave(clean);
		};

		saveBtn.addEventListener('click', submit);
		window.setTimeout(() => nameInput?.inputEl?.focus(), 50);
	}

	onClose(): void {
		this.contentEl.empty();
	}
}

export class ConfirmDeletePresetModal extends Modal {
	presetName: string;
	onConfirm: () => void;

	constructor(app: App, presetName: string, onConfirm: () => void) {
		super(app);
		this.presetName = presetName;
		this.onConfirm = onConfirm;
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass('css-preset-modal');

		contentEl.createEl('h2', { text: `Delete Preset: ${this.presetName}` });

		const msgEl = contentEl.createDiv({ cls: 'css-preset-modal-warning' });
		msgEl.createEl('p', {
			text: `Are you sure you want to delete the preset "${this.presetName}"? This action cannot be undone.`,
		});

		const footer = contentEl.createDiv({ cls: 'css-modal-footer' });
		const cancelBtn = footer.createEl('button', { text: 'Cancel' });
		cancelBtn.addEventListener('click', () => this.close());

		const deleteBtn = footer.createEl('button', {
			text: 'Delete preset',
			cls: 'mod-warning',
		});
		deleteBtn.addEventListener('click', () => {
			this.close();
			this.onConfirm();
		});
	}

	onClose(): void {
		this.contentEl.empty();
	}
}

/**
 * Generic yes/no confirmation, for actions that don't need a bespoke modal
 * of their own (restoring curated presets, removing one, etc).
 */
export class ConfirmActionModal extends Modal {
	title: string;
	message: string;
	confirmLabel: string;
	onConfirm: () => void;
	/**
	 * Called when the modal closes without confirming - Cancel, Escape, or a
	 * click outside. A caller whose control has already moved (a toggle the user
	 * just flipped) needs this to put it back.
	 */
	onCancel?: () => void;
	private confirmed = false;

	constructor(
		app: App,
		title: string,
		message: string,
		confirmLabel: string,
		onConfirm: () => void,
		onCancel?: () => void,
	) {
		super(app);
		this.title = title;
		this.message = message;
		this.confirmLabel = confirmLabel;
		this.onConfirm = onConfirm;
		this.onCancel = onCancel;
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass('css-preset-modal');

		contentEl.createEl('h2', { text: this.title });

		const msgEl = contentEl.createDiv({ cls: 'css-preset-modal-warning' });
		msgEl.createEl('p', { text: this.message });

		const footer = contentEl.createDiv({ cls: 'css-modal-footer' });
		const cancelBtn = footer.createEl('button', { text: 'Cancel' });
		cancelBtn.addEventListener('click', () => this.close());

		const confirmBtn = footer.createEl('button', {
			text: this.confirmLabel,
			cls: 'mod-cta mod-warning',
		});
		confirmBtn.addEventListener('click', () => {
			this.confirmed = true;
			this.close();
			this.onConfirm();
		});
	}

	onClose(): void {
		this.contentEl.empty();
		if (!this.confirmed && this.onCancel) {
			this.onCancel();
		}
	}
}

/**
 * Overwrites one curated preset's name, description, and saved colors with
 * the designer's current live state. A temporary, faster stand-in for
 * repeatedly asking for palette tweaks - "Restore official presets" in the
 * Presets tab undoes it.
 */
export class EditCuratedPresetModal extends Modal {
	defaultName: string;
	defaultDescription: string;
	onSave: (name: string, description: string) => void;
	private nameVal: string;
	private descVal: string;

	constructor(app: App, defaultName: string, defaultDescription: string, onSave: (name: string, description: string) => void) {
		super(app);
		this.defaultName = defaultName;
		this.defaultDescription = defaultDescription;
		this.onSave = onSave;
		this.nameVal = defaultName;
		this.descVal = defaultDescription;
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass('css-preset-modal');

		contentEl.createEl('h2', { text: 'Overwrite preset' });
		contentEl.createEl('p', {
			text: 'Replace this preset’s saved colors with your current styling controls, and edit its name and description.',
			cls: 'css-modal-subtitle',
		});

		let nameInput: TextComponent | null = null;

		new Setting(contentEl)
			.setName('Preset name')
			.addText((text) => {
				nameInput = text;
				text.setValue(this.defaultName).onChange((val) => {
					this.nameVal = val;
				});
			});

		new Setting(contentEl)
			.setName('Description')
			.addTextArea((ta) => {
				ta.setValue(this.defaultDescription).onChange((val) => {
					this.descVal = val;
				});
				ta.inputEl.rows = 3;
			});

		const warnEl = contentEl.createDiv({ cls: 'css-preset-modal-warning' });
		warnEl.createEl('p', {
			text: '⚠️ this overwrites the official preset’s saved colors with whatever the styling controls currently show. Use "restore official presets" above the preset list to undo.',
		});

		const footer = contentEl.createDiv({ cls: 'css-modal-footer' });
		const cancelBtn = footer.createEl('button', { text: 'Cancel' });
		cancelBtn.addEventListener('click', () => this.close());

		const saveBtn = footer.createEl('button', {
			text: 'Save & overwrite',
			cls: 'mod-cta mod-warning',
		});
		const submit = () => {
			const clean = this.nameVal.trim();
			if (!clean) {
				new Notice('Please enter a preset name');
				return;
			}
			this.close();
			this.onSave(clean, this.descVal.trim());
		};
		saveBtn.addEventListener('click', submit);

		window.setTimeout(() => nameInput?.inputEl?.focus(), 50);
	}

	onClose(): void {
		this.contentEl.empty();
	}
}

/**
 * Obsidian-style interactive font suggestion modal with prospective font previews.
 */
export class FontSuggestModal extends SuggestModal<SelectOption> {
	private options: SelectOption[];
	private onChoose: (option: SelectOption) => void;

	constructor(app: App, options: SelectOption[], title: string, onChoose: (option: SelectOption) => void) {
		super(app);
		this.options = options;
		this.onChoose = onChoose;
		this.setPlaceholder(`Search font (${options.length} available)...`);
		this.modalEl.addClass('css-font-picker-modal');
	}

	getSuggestions(query: string): SelectOption[] {
		const q = query.trim().toLowerCase();
		if (!q) {
			return this.options;
		}
		return this.options.filter(
			(opt) =>
				opt.label.toLowerCase().includes(q) ||
				opt.value.toLowerCase().includes(q) ||
				Boolean(opt.group && opt.group.toLowerCase().includes(q)),
		);
	}

	renderSuggestion(option: SelectOption, el: HTMLElement): void {
		el.addClass('css-font-suggest-item');
		const header = el.createDiv({ cls: 'css-font-suggest-header' });
		const nameEl = header.createSpan({ text: option.label, cls: 'css-font-suggest-name' });
		if (option.value && option.value !== 'inherit') {
			nameEl.style.fontFamily = option.value;
		}
		if (option.group) {
			header.createSpan({ text: option.group, cls: 'css-font-suggest-badge' });
		}
		const sampleEl = el.createDiv({
			text: 'The quick brown fox jumps over the lazy dog • 0123456789',
			cls: 'css-font-suggest-sample',
		});
		if (option.value && option.value !== 'inherit') {
			sampleEl.style.fontFamily = option.value;
		}
	}

	onChooseSuggestion(option: SelectOption): void {
		this.onChoose(option);
	}
}

