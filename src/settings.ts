import { App, PluginSettingTab, Setting } from 'obsidian';
import type CssSnippetDesignerPlugin from './main';
import { DesignerTabId, TAB_DEFINITIONS } from './schema';
import { DEFAULT_SNIPPET_NAME } from './constants';
import type { UserSavedPreset, CuratedPresetOverride } from './presets';

export interface DesignerPluginSettings {
	visibleTabs: Record<DesignerTabId, boolean>;
	showTabIcons: boolean;
	compactTabs: boolean;
	desktopTranslucency: boolean;
	desktopMaterial: 'acrylic' | 'mica' | 'tabbed';
	lastSnippetName?: string;
	savedPresets: UserSavedPreset[];
	/**
	 * Per-user edits layered onto the built-in curated presets (rename,
	 * redescribe, or overwrite with the live designer state), keyed by the
	 * curated preset's id. Temporary, quick-iteration mechanism requested in
	 * place of repeatedly asking for palette tweaks.
	 */
	curatedPresetOverrides: Record<string, CuratedPresetOverride>;
	/** Curated preset ids the user removed from the Presets tab. */
	deletedCuratedPresetIds: string[];
	/**
	 * The designer's live token state, mirrored here so it survives even when
	 * the backing snippet is missing, disabled, or fails to reload. The snippet
	 * is still the CSS the user ships; this is the editor's own undo history so
	 * a deactivated plugin does not lose the design.
	 */
	tokenState?: PersistedTokenState;
}

/** Serializable snapshot of both mode token stores and their enable flags. */
export interface PersistedTokenState {
	dark: Record<string, string>;
	light: Record<string, string>;
	darkEnabled: Record<string, boolean>;
	lightEnabled: Record<string, boolean>;
}

export const DEFAULT_SETTINGS: DesignerPluginSettings = {
	visibleTabs: {
		presets: true,
		typography: true,
		colors: true,
		elements: true,
		shadows: true,
	},
	showTabIcons: true,
	compactTabs: false,
	desktopTranslucency: true,
	desktopMaterial: 'acrylic',
	lastSnippetName: DEFAULT_SNIPPET_NAME,
	savedPresets: [],
	curatedPresetOverrides: {},
	deletedCuratedPresetIds: [],
};

export class CssDesignerSettingTab extends PluginSettingTab {
	plugin: CssSnippetDesignerPlugin;

	constructor(app: App, plugin: CssSnippetDesignerPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();
		containerEl.addClass('css-designer-settings-tab');

		new Setting(containerEl)
			.setName('Menu navigation display')
			.setHeading();

		new Setting(containerEl)
			.setName('Show tab icons')
			.setDesc('Display icon glyphs alongside tab titles in the menu navigation bar')
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.showTabIcons)
					.onChange(async (val) => {
						this.plugin.settings.showTabIcons = val;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName('Compact navigation tabs')
			.setDesc('Reduce horizontal padding on navigation tabs for a tighter layout')
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.compactTabs)
					.onChange(async (val) => {
						this.plugin.settings.compactTabs = val;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName('Configurable navigation tabs')
			.setDesc('Choose which tabs appear in the top menu navigation bar. At least one tab must remain enabled.')
			.setHeading();

		for (const tab of TAB_DEFINITIONS) {
			new Setting(containerEl)
				.setName(tab.label)
				.setDesc(tab.description)
				.addToggle((toggle) =>
					toggle
						.setValue(this.plugin.settings.visibleTabs[tab.id] ?? true)
						.onChange(async (val) => {
							if (!val) {
								const activeCount = Object.values(this.plugin.settings.visibleTabs).filter(Boolean).length;
								if (activeCount <= 1) {
									toggle.setValue(true);
									return;
								}
							}
							this.plugin.settings.visibleTabs[tab.id] = val;
							await this.plugin.saveSettings();
						})
				);
		}

		new Setting(containerEl)
			.setName('Desktop translucency (Windows / macOS)')
			.setHeading();

		new Setting(containerEl)
			.setName('Enable native window translucency')
			.setDesc('Applies native Windows 11/10 acrylic or mica effect to the Obsidian window')
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.desktopTranslucency)
					.onChange(async (val) => {
						this.plugin.settings.desktopTranslucency = val;
						await this.plugin.saveSettings();
						void this.plugin.applyTranslucency();
					})
			);

		new Setting(containerEl)
			.setName('Windows translucency material')
			.setDesc('Choose background material applied to the window on Windows')
			.addDropdown((dropdown) =>
				dropdown
					.addOption('acrylic', 'Acrylic (frosted glass blur)')
					.addOption('mica', 'Mica (dynamic system tint)')
					.addOption('tabbed', 'Mica alt / tabbed')
					.setValue(this.plugin.settings.desktopMaterial)
					.onChange(async (val) => {
						this.plugin.settings.desktopMaterial = val as 'acrylic' | 'mica' | 'tabbed';
						await this.plugin.saveSettings();
						void this.plugin.applyTranslucency();
					})
			);

		new Setting(containerEl)
			.setName('Reset navigation tabs')
			.setDesc('Restore all menu navigation tabs to their default visible states')
			.addButton((btn) =>
				btn
					.setButtonText('Reset tabs to default')
					.onClick(async () => {
						this.plugin.settings.visibleTabs = { ...DEFAULT_SETTINGS.visibleTabs };
						this.plugin.settings.showTabIcons = DEFAULT_SETTINGS.showTabIcons;
						this.plugin.settings.compactTabs = DEFAULT_SETTINGS.compactTabs;
						this.plugin.settings.desktopTranslucency = DEFAULT_SETTINGS.desktopTranslucency;
						this.plugin.settings.desktopMaterial = DEFAULT_SETTINGS.desktopMaterial;
						await this.plugin.saveSettings();
						this.display();
					})
			);
	}
}
