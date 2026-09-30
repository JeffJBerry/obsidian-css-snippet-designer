import { Plugin, WorkspaceLeaf } from 'obsidian';
import { CssDesignerPopoutView } from './view';
import { VIEW_TYPE_CSS_DESIGNER, DEFAULT_SNIPPET_NAME } from './constants';
import {
	DesignerPluginSettings,
	DEFAULT_SETTINGS,
	CssDesignerSettingTab,
} from './settings';
import { applyDesktopTranslucency, releaseTranslucencyListeners, DesktopMaterial } from './translucency';
import { VerticalTabsNav } from './vertical-tabs-nav';

export default class CssSnippetDesignerPlugin extends Plugin {
	settings!: DesignerPluginSettings;
	/** Up/down arrows for the vertical note-tab rail while it is over-filled. */
	verticalTabsNav!: VerticalTabsNav;

	async onload() {
		// 0. Load persistent settings
		await this.loadSettings();

		// 1. Register the detached Popout ItemView
		this.registerView(
			VIEW_TYPE_CSS_DESIGNER,
			(leaf) => new CssDesignerPopoutView(leaf, this),
		);

		// 2. Register ribbon icon
		this.addRibbonIcon('palette', 'Open CSS snippet designer', () => {
			void this.openDesignerWindow();
		});

		// 3. Register primary command (Opens Popout Window with Tab fallback)
		this.addCommand({
			id: 'open-designer-popout',
			name: 'Open in popout window',
			callback: () => {
				void this.openDesignerWindow();
			},
		});

		// 4. Register command to open in new Tab
		this.addCommand({
			id: 'open-designer-tab',
			name: 'Open in new tab',
			callback: () => {
				void this.openDesignerTab();
			},
		});

		// 5. Register command to open in Right Sidebar
		this.addCommand({
			id: 'open-designer-sidebar',
			name: 'Open in right sidebar',
			callback: () => {
				void this.openDesignerSidebar();
			},
		});

		// 6. Register settings tab
		this.addSettingTab(new CssDesignerSettingTab(this.app, this));

		this.app.workspace.onLayoutReady(() => {
			void this.applyTranslucency();
		});

		// 8. Re-apply Desktop Translucency only when the theme mode actually changes (Light <-> Dark)
		let lastIsLight: boolean | null = null;
		this.registerEvent(
			this.app.workspace.on('css-change', () => {
				const isLight = document.body.classList.contains('theme-light');
				if (lastIsLight === null || lastIsLight !== isLight) {
					lastIsLight = isLight;
					void this.applyTranslucency();
				}
			})
		);

		// 9. Keep the vertical note-tab rail's up/down arrows in step with the
		// workspace. `attach` is deferred to layout-ready so the workspace DOM
		// exists; layout/css changes re-scan for rails, and the view pokes
		// `sync` when the live preview regenerates.
		this.verticalTabsNav = new VerticalTabsNav();
		this.app.workspace.onLayoutReady(() => this.verticalTabsNav.attach(document));
		this.registerEvent(this.app.workspace.on('layout-change', () => this.verticalTabsNav.sync()));
		this.registerEvent(this.app.workspace.on('css-change', () => this.verticalTabsNav.sync()));
		this.register(() => this.verticalTabsNav.detach());
	}

	/**
	 * `Object.assign` is shallow, so every nested member it copies from
	 * DEFAULT_SETTINGS is a *reference* to the module-level default, not a copy.
	 * On a fresh install `loadData()` returns null and nothing shadows those
	 * members, so writing to `settings.visibleTabs` would mutate the defaults —
	 * and "Reset tabs to default", which spreads DEFAULT_SETTINGS.visibleTabs,
	 * would hand back the values it was meant to discard. Every nested member is
	 * therefore rebuilt here rather than inherited.
	 */
	async loadSettings(): Promise<void> {
		const loadedData = (await this.loadData()) as Partial<DesignerPluginSettings> | null;
		this.settings = Object.assign({}, DEFAULT_SETTINGS, loadedData ?? {});

		// Defaults first, then whatever was stored, so any tab added to
		// DEFAULT_SETTINGS since the last save starts out visible.
		this.settings.visibleTabs = {
			...DEFAULT_SETTINGS.visibleTabs,
			...(loadedData?.visibleTabs ?? {}),
		};
		// Tabs retired in earlier versions.
		delete (this.settings.visibleTabs as Record<string, boolean>)['spacing'];
		delete (this.settings.visibleTabs as Record<string, boolean>)['editor'];
		delete (this.settings.visibleTabs as Record<string, boolean>)['features'];

		const storedPresets = loadedData?.savedPresets;
		this.settings.savedPresets = Array.isArray(storedPresets) ? [...storedPresets] : [];
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
		this.notifyViewsSettingsChanged();
	}

	notifyViewsSettingsChanged(): void {
		const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_CSS_DESIGNER);
		for (const leaf of leaves) {
			if (leaf.view instanceof CssDesignerPopoutView) {
				leaf.view.onSettingsChanged();
			}
		}
	}

	async openDesignerWindow(): Promise<void> {
		const { workspace } = this.app;

		// Check if an existing leaf already has this view open
		const existingLeaves = workspace.getLeavesOfType(VIEW_TYPE_CSS_DESIGNER);
		if (existingLeaves.length > 0 && existingLeaves[0]) {
			void workspace.revealLeaf(existingLeaves[0]);
			return;
		}

		let leaf: WorkspaceLeaf | null = null;
		if (typeof workspace.openPopoutLeaf === 'function') {
			try {
				leaf = workspace.openPopoutLeaf();
			} catch (e) {
				console.warn('openPopoutLeaf failed, falling back to tab:', e);
			}
		}
		if (!leaf) {
			leaf = workspace.getLeaf('tab');
		}

		if (leaf) {
			await leaf.setViewState({
				type: VIEW_TYPE_CSS_DESIGNER,
				active: true,
			});
			void workspace.revealLeaf(leaf);
		}
	}

	async openDesignerTab(): Promise<void> {
		const { workspace } = this.app;
		const leaf = workspace.getLeaf('tab');
		if (leaf) {
			await leaf.setViewState({
				type: VIEW_TYPE_CSS_DESIGNER,
				active: true,
			});
			void workspace.revealLeaf(leaf);
		}
	}

	async openDesignerSidebar(): Promise<void> {
		const { workspace } = this.app;
		let leaf = workspace.getRightLeaf(false);
		if (!leaf) {
			leaf = workspace.getLeaf('tab');
		}
		if (leaf) {
			await leaf.setViewState({
				type: VIEW_TYPE_CSS_DESIGNER,
				active: true,
			});
			void workspace.revealLeaf(leaf);
		}
	}

	private isApplyingTranslucency = false;

	async isGlassActiveForCurrentTheme(): Promise<boolean> {
		const isLight = document.body.classList.contains('theme-light');
		const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_CSS_DESIGNER);
		for (const leaf of leaves) {
			if (leaf.view instanceof CssDesignerPopoutView) {
				const tokens = isLight ? leaf.view.getLightTokens() : leaf.view.getDarkTokens();
				return tokens.get('--glass-enabled') === 'true';
			}
		}
		const cleanName = (this.settings?.lastSnippetName || DEFAULT_SNIPPET_NAME).replace(/\.css$/i, '');
		const snippetPath = `${this.app.vault.configDir}/snippets/${cleanName}.css`;
		try {
			if (await this.app.vault.adapter.exists(snippetPath)) {
				const css = await this.app.vault.adapter.read(snippetPath);
				const scope = isLight ? '\\.theme-light' : '\\.theme-dark';
				const match = css.match(new RegExp(`(?:^|\\n)\\s*${scope}\\s*\\{([^}]+)\\}`));
				if (match && match[1]) {
					return /--glass-enabled\s*:\s*true\b/i.test(match[1]);
				}
			}
		} catch {
			/* Non-fatal: the optional API is unavailable in this environment. */
		}
		return false;
	}

	async applyTranslucency(material?: DesktopMaterial): Promise<void> {
		if (this.isApplyingTranslucency) return;
		this.isApplyingTranslucency = true;
		try {
			const mat = material ?? this.settings.desktopMaterial ?? 'acrylic';
			const isGlass = await this.isGlassActiveForCurrentTheme();
			const enabled = isGlass && (this.settings.desktopTranslucency ?? true);
			const docs: Set<Document> = new Set();
			if (typeof window !== 'undefined' && window.document) {
				docs.add(window.document);
			}
			try {
				this.app.workspace.iterateAllLeaves((leaf) => {
					const d = leaf.view?.containerEl?.ownerDocument;
					if (d) docs.add(d);
				});
			} catch {
				/* Non-fatal: the optional API is unavailable in this environment. */
			}
			applyDesktopTranslucency(enabled, mat, Array.from(docs));
		} finally {
			this.isApplyingTranslucency = false;
		}
	}

	/**
	 * Leave the window looking as the user designed it.
	 *
	 * This used to call `applyDesktopTranslucency(false, …)`, which reset the native
	 * material, stripped the body class and removed the injected stylesheet — so
	 * disabling the plugin visibly undid the design. For a snippet designer that is
	 * backwards: the snippet is meant to outlive the plugin. Only the focus
	 * listeners are detached here.
	 */
	onunload() {
		const docs: Set<Document> = new Set();
		if (typeof window !== 'undefined' && window.document) {
			docs.add(window.document);
		}
		try {
			this.app.workspace.iterateAllLeaves((leaf) => {
				const d = leaf.view?.containerEl?.ownerDocument;
				if (d) docs.add(d);
			});
		} catch {
			/* Non-fatal: the optional API is unavailable in this environment. */
		}
		releaseTranslucencyListeners(Array.from(docs));
	}
}
