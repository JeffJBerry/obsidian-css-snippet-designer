import { Platform } from 'obsidian';

export type DesktopMaterial = 'acrylic' | 'mica' | 'tabbed' | 'none';

interface ElectronWindow {
	setBackgroundMaterial?(material: string): void;
	setBackgroundColor?(color: string): void;
	setVibrancy?(vibrancy: string | null): void;
}

export function getElectronWindow(doc?: Document): ElectronWindow | null {
	try {
		const targetWindow = doc?.defaultView ?? (typeof window !== 'undefined' ? window : null);
		if (!targetWindow) return null;

		const targetAny = targetWindow as unknown as { electronWindow?: ElectronWindow; require?: (mod: string) => unknown };
		// 1. Attached to window by Obsidian
		if (targetAny.electronWindow) {
			return targetAny.electronWindow;
		}

		// 2. Via @electron/remote
		const req = targetAny.require ?? (typeof require !== 'undefined' ? require : null);
		if (req) {
			try {
				const remote = req('@electron/remote') as { getCurrentWindow?: () => ElectronWindow } | undefined;
				if (remote?.getCurrentWindow) {
					return remote.getCurrentWindow();
				}
			} catch {
				/* ignore */
			}
			try {
				const electron = req('electron') as { remote?: { getCurrentWindow?: () => ElectronWindow } } | undefined;
				if (electron?.remote?.getCurrentWindow) {
					return electron.remote.getCurrentWindow();
				}
			} catch {
				/* ignore */
			}
		}
	} catch (e) {
		console.warn('[CSS Snippet Designer] Could not get Electron window:', e);
	}
	return null;
}

const docCleanups = new WeakMap<Document, () => void>();

/**
 * Marks a document whose `is-translucent` class this plugin added.
 *
 * The class is Obsidian's, set by Appearance -> Translucent window. Removing it
 * unconditionally switched that setting off for anyone who had it on, and left
 * them no way to get it back short of toggling it in settings.
 */
const OWNS_TRANSLUCENT_CLASS = 'cssDesignerOwnsTranslucent';

/** Add the class, remembering that we were the one to do it. */
function claimTranslucentClass(doc: Document): void {
	if (doc.body.classList.contains('is-translucent')) return;
	doc.body.classList.add('is-translucent');
	doc.body.dataset[OWNS_TRANSLUCENT_CLASS] = 'true';
}

/** Remove the class only if this plugin was what added it. */
function releaseTranslucentClass(doc: Document): void {
	if (doc.body.dataset[OWNS_TRANSLUCENT_CLASS] !== 'true') return;
	doc.body.classList.remove('is-translucent');
	delete doc.body.dataset[OWNS_TRANSLUCENT_CLASS];
}

/**
 * Detach the focus listeners and pending re-assert without changing anything the
 * user can see.
 *
 * Used on plugin unload. Resetting the window there meant disabling the designer
 * visibly undid the look the user had designed — which is the opposite of what a
 * snippet designer is for. The native material stays as last set, for the life of
 * the window; only the listeners go.
 */
export function releaseTranslucencyListeners(documents: Document[]): void {
	for (const doc of documents) {
		const cleanup = docCleanups.get(doc);
		if (cleanup) {
			cleanup();
			docCleanups.delete(doc);
		}
	}
}

/**
 * The persistent-translucency stylesheet. Constant: it interpolates nothing, so it
 * lives at module scope rather than being rebuilt once per document on every
 * theme change and every settings change.
 */
const TRANSLUCENCY_CSS = `
/* CSS Snippet Designer: Persistent Desktop Translucency Fix */
body.is-translucent.theme-dark,
body.is-translucent.theme-dark.is-focused,
body.is-translucent.theme-dark:not(.is-focused) {
  --workspace-background-translucent: transparent !important;
  --titlebar-background: transparent !important;
  --titlebar-background-focused: transparent !important;
  --canvas-background: transparent !important;
  --bases-cards-container-background: transparent !important;
  --status-bar-background: transparent !important;
}

body.is-translucent.theme-light,
body.is-translucent.theme-light.is-focused,
body.is-translucent.theme-light:not(.is-focused) {
  --workspace-background-translucent: rgba(255, 255, 255, 0.80) !important;
  --titlebar-background: transparent !important;
  --titlebar-background-focused: transparent !important;
  --canvas-background: transparent !important;
  --bases-cards-container-background: transparent !important;
  --status-bar-background: transparent !important;
}

/* Ensure root containers stay transparent whether window is focused or unfocused */
body.is-translucent,
body.is-translucent.is-focused,
body.is-translucent:not(.is-focused) {
  background-color: transparent !important;
  contain: none !important;
}

body.is-translucent .horizontal-main-container,
body.is-translucent.is-focused .horizontal-main-container,
body.is-translucent:not(.is-focused) .horizontal-main-container,
body.is-translucent .workspace,
body.is-translucent.is-focused .workspace,
body.is-translucent:not(.is-focused) .workspace,
body.is-translucent .workspace-split:not(.mod-left-split):not(.mod-right-split),
body.is-translucent.is-focused .workspace-split:not(.mod-left-split):not(.mod-right-split),
body.is-translucent:not(.is-focused) .workspace-split:not(.mod-left-split):not(.mod-right-split),
body.is-translucent .workspace-split:not(.mod-left-split):not(.mod-right-split) .workspace-tabs,
body.is-translucent.is-focused .workspace-split:not(.mod-left-split):not(.mod-right-split) .workspace-tabs,
body.is-translucent:not(.is-focused) .workspace-split:not(.mod-left-split):not(.mod-right-split) .workspace-tabs,
body.is-translucent .workspace-split:not(.mod-left-split):not(.mod-right-split) .workspace-leaf,
body.is-translucent.is-focused .workspace-split:not(.mod-left-split):not(.mod-right-split) .workspace-leaf,
body.is-translucent:not(.is-focused) .workspace-split:not(.mod-left-split):not(.mod-right-split) .workspace-leaf,
body.is-translucent .workspace-split:not(.mod-left-split):not(.mod-right-split) .workspace-leaf-content,
body.is-translucent.is-focused .workspace-split:not(.mod-left-split):not(.mod-right-split) .workspace-leaf-content,
body.is-translucent:not(.is-focused) .workspace-split:not(.mod-left-split):not(.mod-right-split) .workspace-leaf-content,
body.is-translucent .workspace-split:not(.mod-left-split):not(.mod-right-split) .view-content,
body.is-translucent.is-focused .workspace-split:not(.mod-left-split):not(.mod-right-split) .view-content,
body.is-translucent:not(.is-focused) .workspace-split:not(.mod-left-split):not(.mod-right-split) .view-content,
body.is-translucent .markdown-source-view,
body.is-translucent.is-focused .markdown-source-view,
body.is-translucent:not(.is-focused) .markdown-source-view,
body.is-translucent .markdown-preview-view,
body.is-translucent.is-focused .markdown-preview-view,
body.is-translucent:not(.is-focused) .markdown-preview-view,
body.is-translucent .cm-editor,
body.is-translucent.is-focused .cm-editor,
body.is-translucent:not(.is-focused) .cm-editor,
body.is-translucent .cm-scroller,
body.is-translucent.is-focused .cm-scroller,
body.is-translucent:not(.is-focused) .cm-scroller {
  background-color: transparent !important;
}

/* Frameless seamless titlebar */
body.is-translucent.is-hidden-frameless .titlebar,
body.is-translucent.is-hidden-frameless.is-focused .titlebar,
body.is-translucent.is-hidden-frameless:not(.is-focused) .titlebar {
  border: none !important;
  background: transparent !important;
}

body.is-translucent .titlebar,
body.is-translucent .titlebar-inner,
body.is-translucent.is-focused .titlebar,
body.is-translucent.is-focused .titlebar-inner,
body.is-translucent:not(.is-focused) .titlebar,
body.is-translucent:not(.is-focused) .titlebar-inner {
  background-color: transparent !important;
}

/* Canvas & Bases Translucency */
body.is-translucent .workspace-leaf-content[data-type="canvas"],
body.is-translucent .workspace-leaf-content[data-type="canvas"] .view-content,
body.is-translucent .canvas-wrapper,
body.is-translucent .canvas,
body.is-translucent .canvas-background,
body.is-translucent .workspace-leaf-content[data-type="bases"],
body.is-translucent .workspace-leaf-content[data-type="bases"] .view-content,
body.is-translucent .workspace-leaf-content[data-type="bases-query"],
body.is-translucent .workspace-leaf-content[data-type="bases-query"] .view-content,
body.is-translucent .bases-view,
body.is-translucent .bases-container,
body.is-translucent .bases-table-container,
body.is-translucent .bases-cards-container,
body.is-translucent .bases-header {
  background-color: transparent !important;
}

/* Prevent ribbon from establishing a containing block that shifts the sidebar toggle button down over the quick switcher */
body.is-translucent .workspace-ribbon,
body.is-translucent .workspace-ribbon.side-dock-ribbon,
body.is-translucent .workspace-ribbon.mod-left,
body.is-translucent .workspace-ribbon.mod-right {
  background-color: transparent !important;
  transform: none !important;
  will-change: auto !important;
  contain: none !important;
}

body.is-translucent .workspace-ribbon.mod-left:before {
  background-color: transparent !important;
}

body.is-translucent .sidebar-toggle-button {
  background-color: transparent !important;
}

body.is-translucent .view-header {
  background-color: transparent !important;
  border-bottom: none !important;
}

/* Vault profile & switcher in left sidebar */
body.is-translucent .workspace-sidedock-vault-profile,
body.is-translucent .workspace-split.mod-left-split .workspace-sidedock-vault-profile,
body.is-translucent .workspace-drawer-vault-switcher,
body.is-translucent .workspace-drawer-vault-name,
body.is-translucent.is-focused .workspace-sidedock-vault-profile,
body.is-translucent.is-focused .workspace-split.mod-left-split .workspace-sidedock-vault-profile,
body.is-translucent.is-focused .workspace-drawer-vault-switcher,
body.is-translucent.is-focused .workspace-drawer-vault-name,
body.is-translucent:not(.is-focused) .workspace-sidedock-vault-profile,
body.is-translucent:not(.is-focused) .workspace-split.mod-left-split .workspace-sidedock-vault-profile,
body.is-translucent:not(.is-focused) .workspace-drawer-vault-switcher,
body.is-translucent:not(.is-focused) .workspace-drawer-vault-name {
  background-color: transparent !important;
  background: transparent !important;
}

/* Status Bar Translucency */
body.is-translucent .status-bar,
body.is-translucent .status-bar-item:not(:hover),
body.is-translucent .status-bar-item.plugin-editor-status:not(:hover),
body.is-translucent .status-bar-item.plugin-sync:not(:hover),
body.is-translucent .status-bar-item.plugin-word-count:not(:hover) {
  background-color: transparent !important;
  border-color: transparent !important;
  border-width: 0 !important;
  box-shadow: none !important;
}
`;

export function applyDesktopTranslucency(
	enabled: boolean,
	material: DesktopMaterial = 'acrylic',
	documents: Document[] = [document]
): void {
	for (const doc of documents) {
		const win = getElectronWindow(doc);
		const isLight = doc.body.classList.contains('theme-light');

		const previousCleanup = docCleanups.get(doc);
		if (previousCleanup) {
			previousCleanup();
			docCleanups.delete(doc);
		}

		if (enabled) {
			const reassert = () => {
				if (win) {
					try {
						win.setBackgroundColor?.('#00000000');
					} catch {
						/* Non-fatal: the optional API is unavailable in this environment. */
					}

					if (Platform.isWin) {
						try {
							win.setBackgroundMaterial?.(material);
						} catch {
							try {
								win.setBackgroundMaterial?.('mica');
							} catch {
								/* Non-fatal: the optional API is unavailable in this environment. */
							}
						}
					} else if (Platform.isMacOS) {
						try {
							win.setVibrancy?.(doc.body.classList.contains('theme-light') ? 'under-window' : 'sidebar');
						} catch {
							/* Non-fatal: the optional API is unavailable in this environment. */
						}
					}
				}
			};

			reassert();

			const targetWin = doc.defaultView;
			const timerHost = targetWin ?? window;

			// Electron drops the material on some focus transitions, so it is
			// re-asserted once immediately and once shortly after. The pending id is
			// tracked so cleanup can cancel it: an orphaned re-assert firing after
			// translucency was switched off would leave the window transparent, and
			// rapid focus/blur cycling would otherwise stack unbounded timers.
			let reassertTimer: number | null = null;
			const clearReassertTimer = () => {
				if (reassertTimer !== null) {
					timerHost.clearTimeout(reassertTimer);
					reassertTimer = null;
				}
			};
			const onBlurOrFocus = () => {
				reassert();
				clearReassertTimer();
				reassertTimer = timerHost.setTimeout(() => {
					reassertTimer = null;
					reassert();
				}, 50);
			};

			if (targetWin) {
				targetWin.addEventListener('blur', onBlurOrFocus);
				targetWin.addEventListener('focus', onBlurOrFocus);
				(targetWin as EventTarget).addEventListener('focuschange', onBlurOrFocus);
				targetWin.addEventListener('visibilitychange', onBlurOrFocus);
			}

			const winEmitter = win as unknown as { on?: (evt: string, fn: () => void) => void; off?: (evt: string, fn: () => void) => void; removeListener?: (evt: string, fn: () => void) => void };
			if (typeof winEmitter?.on === 'function') {
				try {
					winEmitter.on('blur', onBlurOrFocus);
					winEmitter.on('focus', onBlurOrFocus);
				} catch {
					/* Non-fatal: the optional API is unavailable in this environment. */
				}
			}

			const onWindowUnload = () => {
				const cleanup = docCleanups.get(doc);
				if (cleanup) {
					cleanup();
					docCleanups.delete(doc);
				}
			};

			if (targetWin) {
				targetWin.addEventListener('unload', onWindowUnload, { once: true });
			}

			docCleanups.set(doc, () => {
				clearReassertTimer();
				if (targetWin) {
					targetWin.removeEventListener('unload', onWindowUnload);
					targetWin.removeEventListener('blur', onBlurOrFocus);
					targetWin.removeEventListener('focus', onBlurOrFocus);
					(targetWin as EventTarget).removeEventListener('focuschange', onBlurOrFocus);
					targetWin.removeEventListener('visibilitychange', onBlurOrFocus);
				}
				try {
					if (typeof winEmitter?.off === 'function') {
						winEmitter.off('blur', onBlurOrFocus);
						winEmitter.off('focus', onBlurOrFocus);
					} else if (typeof winEmitter?.removeListener === 'function') {
						winEmitter.removeListener('blur', onBlurOrFocus);
						winEmitter.removeListener('focus', onBlurOrFocus);
					}
				} catch {
					/* Non-fatal: the optional API is unavailable in this environment. */
				}
			});

			// Ensure Obsidian classes allow persistent transparency
			claimTranslucentClass(doc);

			const styleId = 'css-snippet-designer-translucency-fix';
			let styleEl = doc.getElementById(styleId) as HTMLStyleElement | null;
			if (!styleEl) {
				styleEl = doc.createElement('style');
				styleEl.id = styleId;
				doc.head?.appendChild(styleEl);
			}
			if (styleEl && styleEl.textContent !== TRANSLUCENCY_CSS) {
				styleEl.textContent = TRANSLUCENCY_CSS;
			}
		} else {
			const cleanup = docCleanups.get(doc);
			if (cleanup) {
				cleanup();
				docCleanups.delete(doc);
			}

			if (win) {
				try {
					win.setBackgroundMaterial?.('none');
				} catch {
					/* ignore */
				}
				try {
					win.setVibrancy?.(null);
				} catch {
					/* ignore */
				}
				try {
					win.setBackgroundColor?.(isLight ? '#ffffff' : '#1e1e1e');
				} catch {
					/* ignore */
				}
			}

			doc.getElementById('css-snippet-designer-translucency-fix')?.remove();
			releaseTranslucentClass(doc);

			if (doc.documentElement?.style) {
				doc.documentElement.style.removeProperty('--glass-blur');
				doc.documentElement.style.removeProperty('--tab-curve');
				doc.documentElement.style.removeProperty('--glass-opacity');
				doc.documentElement.style.removeProperty('--glass-tint-enabled');
				doc.documentElement.style.removeProperty('--glass-tint-color');
			}
		}
	}
}
