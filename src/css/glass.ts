/**
 * Frosted glass / translucency CSS generation.
 *
 * The blurred rules below deliberately carry no `will-change`. `backdrop-filter`
 * here is static, and hinting a static property pins a compositor layer that
 * never retires — one per open pane plus both sidebars, each holding a backdrop
 * readback of everything painted behind it. `transform: translateZ(0)` already
 * promotes the layer these rules need. See AGENTS.md §5 rule 9: a `will-change`
 * names only what keyframes actually touch.
 */

export function generateGlassCss(mode: '.theme-dark' | '.theme-light', tokens: Map<string, string>): string {
	const isGlassOn = tokens.get('--glass-enabled') === 'true';
	if (!isGlassOn) return '';

	const isDark = mode === '.theme-dark';
	const rawBlur = tokens.get('--glass-blur') ?? '48px';
	const blur = rawBlur.endsWith('px') ? rawBlur : `${rawBlur}px`;
	const rawOpacity = tokens.get('--glass-opacity') ?? (isDark ? '0.75' : '0.80');
	const opacityNum = parseFloat(rawOpacity);
	const defaultOp = isDark ? 0.75 : 0.80;
	const op = isNaN(opacityNum) ? defaultOp : opacityNum;
	const opPct = `${Math.round(op * 100)}%`;

	const isTintOn = tokens.get('--glass-tint-enabled') === 'true';
	const tintColor = tokens.get('--glass-tint-color') ?? '#7c3aed';

	// In dark mode: primaryBg can take direct tint.
	// In light mode: pure tint like #7c3aed is too dark for dark text! Mix with white to keep crisp contrast.
	const primaryBg = isTintOn
		? (isDark ? tintColor : `color-mix(in srgb, ${tintColor} 20%, #ffffff)`)
		: 'var(--background-primary)';

	const secondaryBg = isTintOn
		? (isDark
			? `color-mix(in srgb, ${tintColor} 82%, #000000)`
			: `color-mix(in srgb, ${tintColor} 14%, #ffffff)`)
		: 'var(--background-secondary)';

	const navSidebarBg = op === 0
		? 'transparent'
		: (isTintOn
			? `color-mix(in srgb, ${secondaryBg} ${opPct}, transparent)`
			: `color-mix(in srgb, ${secondaryBg} ${isDark ? Math.round(op * 25) : Math.round(op * 30)}%, transparent)`);

	const tabBg = op === 0 ? 'transparent' : `color-mix(in srgb, ${primaryBg} ${opPct}, transparent)`;

	const borderRgba = isTintOn
		? (isDark
			? `color-mix(in srgb, ${tintColor} 30%, rgba(255, 255, 255, 0.15))`
			: `color-mix(in srgb, ${tintColor} 25%, rgba(0, 0, 0, 0.12))`)
		: (isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.10)');

	const shadowRgba = isTintOn
		? (isDark
			? `color-mix(in srgb, ${tintColor} 25%, rgba(0, 0, 0, 0.45))`
			: `color-mix(in srgb, ${tintColor} 15%, rgba(0, 0, 0, 0.12))`)
		: (isDark ? 'rgba(0, 0, 0, 0.35)' : 'rgba(0, 0, 0, 0.10)');

	// Luminous diffusion base for app-container in light mode prevents black desktop wallpaper bleeding into black text
	const appContainerBg = isTintOn && op > 0
		? (isDark
			? `color-mix(in srgb, ${tintColor} ${Math.round(op * 35)}%, transparent)`
			: `color-mix(in srgb, color-mix(in srgb, ${tintColor} 20%, #ffffff) ${Math.round(op * 40)}%, transparent)`)
		: (isDark
			? 'transparent'
			: `color-mix(in srgb, #ffffff ${Math.round(op * 25)}%, transparent)`);

	// Overlays (modals, dropdown menus, autocomplete) need higher opacity to prevent underlying text collision
	const overlayOpPct = `${Math.min(96, Math.max(88, Math.round(op * 100) + 14))}%`;
	const overlayBg = op === 0 ? 'transparent' : `color-mix(in srgb, ${primaryBg} ${overlayOpPct}, transparent)`;

	return `
/* Frosted Glass Effect (${mode.slice(1)}) */

/* Graph view renders onto a <canvas> element, and Obsidian never paints an
   opaque fill behind it - the canvas takes a normal CSS background-color
   like any other DOM node, so clearing that is what lets the blurred
   backdrop show through. Do NOT touch \`.graph-view.color-fill\`: that class
   is Obsidian's bridge for the *node* fill color (--graph-node), not the
   canvas background - forcing it transparent makes every graph node
   invisible instead. */
${mode} .workspace-leaf-content[data-type="graph"] canvas {
  background-color: transparent !important;
}

/* 1. Structural shells: Clear opaque backgrounds so underlying translucency is not occluded */
body${mode}.is-translucent,
body${mode}.is-translucent .horizontal-main-container,
body${mode}.is-translucent .workspace,
body${mode}.is-translucent .workspace-split,
body${mode}.is-translucent .workspace-tabs,
body${mode}.is-translucent .workspace-leaf,
${mode} .horizontal-main-container,
${mode} .workspace,
${mode} .workspace-split,
${mode} .workspace-tabs,
${mode} .workspace-leaf,
${mode} .view-header,
${mode} .view-content,
${mode} .markdown-source-view,
${mode} .markdown-preview-view,
${mode} .markdown-rendered,
${mode} .markdown-reading-view,
${mode} .cm-editor,
${mode} .cm-scroller,
${mode} .cm-gutters,
${mode} .cm-gutter,
${mode} .cm-lineNumbers,
body${mode}.is-translucent .cm-gutters,
body${mode}.is-translucent .cm-gutter,
body${mode}.is-translucent .cm-lineNumbers,
body${mode}.is-translucent .markdown-rendered,
body${mode}.is-translucent .markdown-reading-view,
${mode} .workspace-leaf-content[data-type="canvas"],
${mode} .workspace-leaf-content[data-type="canvas"] .view-content,
${mode} .canvas-wrapper,
${mode} .canvas,
${mode} .canvas-background,
${mode} .workspace-leaf-content[data-type="bases"],
${mode} .workspace-leaf-content[data-type="bases"] .view-content,
${mode} .workspace-leaf-content[data-type="bases-query"],
${mode} .workspace-leaf-content[data-type="bases-query"] .view-content,
${mode} .bases-view,
${mode} .bases-container,
${mode} .bases-table-container,
${mode} .bases-cards-container,
${mode} .bases-header,
${mode} .workspace-leaf-content[data-type="graph"],
${mode} .workspace-leaf-content[data-type="graph"] .view-content,
${mode} .nav-files-container,
${mode} .nav-folder-children,
${mode} .workspace-ribbon,
${mode} .workspace-ribbon.side-dock-ribbon,
${mode} .workspace-ribbon.mod-left,
${mode} .workspace-ribbon.mod-left:before,
${mode} .sidebar-toggle-button,
body${mode}.is-translucent .workspace-ribbon,
body${mode}.is-translucent .workspace-ribbon.side-dock-ribbon,
body${mode}.is-translucent .workspace-ribbon.mod-left,
body${mode}.is-translucent .workspace-ribbon.mod-left:before,
body${mode}.is-translucent .sidebar-toggle-button,
body${mode}.is-translucent .workspace-leaf-content[data-type="canvas"],
body${mode}.is-translucent .workspace-leaf-content[data-type="canvas"] .view-content,
body${mode}.is-translucent .canvas-wrapper,
body${mode}.is-translucent .canvas,
body${mode}.is-translucent .canvas-background,
body${mode}.is-translucent .workspace-leaf-content[data-type="bases"],
body${mode}.is-translucent .workspace-leaf-content[data-type="bases"] .view-content,
body${mode}.is-translucent .workspace-leaf-content[data-type="bases-query"],
body${mode}.is-translucent .workspace-leaf-content[data-type="bases-query"] .view-content,
body${mode}.is-translucent .bases-view,
body${mode}.is-translucent .bases-container,
body${mode}.is-translucent .bases-table-container,
body${mode}.is-translucent .bases-cards-container,
body${mode}.is-translucent .bases-header,
body${mode}.is-translucent .workspace-leaf-content[data-type="graph"],
body${mode}.is-translucent .workspace-leaf-content[data-type="graph"] .view-content,
${mode} .status-bar,
body${mode}.is-translucent .status-bar {
  background-color: transparent !important;
}

/* Root translucent screen backdrop tint */
body${mode}.is-translucent .app-container,
${mode} .app-container {
  background-color: ${appContainerBg} !important;
}

/* 2. Override Obsidian's contain: strict and unfocused fallbacks */
body${mode}.is-translucent,
body${mode}.is-focused,
body${mode}:not(.is-focused) {
  contain: none !important;
}

body${mode},
body${mode}.is-translucent,
body${mode}.is-focused,
body${mode}:not(.is-focused) {
  --workspace-background-translucent: ${op === 0 ? 'transparent' : (isDark ? 'transparent' : `color-mix(in srgb, ${primaryBg} ${opPct}, transparent)`)} !important;
  --titlebar-background: ${navSidebarBg} !important;
  --titlebar-background-focused: ${navSidebarBg} !important;
  --tab-container-background: ${navSidebarBg} !important;
  --tab-background-active: ${tabBg} !important;
  --tab-outline-color: ${borderRgba} !important;
  --canvas-background: transparent !important;
  --bases-cards-container-background: transparent !important;
  --status-bar-background: transparent !important;
  --glass-blur: ${blur} !important;
  --glass-opacity: ${rawOpacity} !important;
  --glass-tint-enabled: ${isTintOn ? 'true' : 'false'} !important;
  --glass-tint-color: ${tintColor} !important;
}

/* Frameless seamless titlebar */
${mode} .is-hidden-frameless .titlebar,
body${mode}.is-translucent.is-hidden-frameless .titlebar,
body${mode}:not(.is-focused).is-hidden-frameless .titlebar {
  border: none !important;
  background: transparent !important;
}

/* Seamless top bar: Tab container retains uniform translucent background */
${mode} .workspace-tab-header-container,
body${mode}:not(.is-focused) .workspace-tab-header-container,
body${mode}.is-translucent .workspace-tab-header-container,
body${mode}.is-translucent:not(.is-focused) .workspace-tab-header-container {
  background-color: var(--tab-container-background, ${navSidebarBg}) !important;
}

/* 2.01 Unfocused shell clearing MUST mirror the focused list above. Obsidian
   only paints its own opaque fallbacks while the window is blurred, so a shell
   that is cleared when focused but omitted here silently regains an opaque
   background on blur and the glass opacity stops applying. The left/right
   splits are deliberately excluded (their own paint rule follows) and the
   ribbon/view-header/app-container carry dedicated unfocused paint below. */
body${mode}:not(.is-focused),
body${mode}:not(.is-focused) .horizontal-main-container,
body${mode}:not(.is-focused) .workspace,
body${mode}:not(.is-focused) .workspace-split:not(.mod-left-split):not(.mod-right-split),
body${mode}:not(.is-focused) .workspace-split:not(.mod-left-split):not(.mod-right-split) .workspace-tabs,
body${mode}:not(.is-focused) .workspace-split:not(.mod-left-split):not(.mod-right-split) .workspace-leaf,
body${mode}:not(.is-focused) .workspace-split:not(.mod-left-split):not(.mod-right-split) .view-content,
body${mode}:not(.is-focused) .markdown-source-view,
body${mode}:not(.is-focused) .markdown-preview-view,
body${mode}:not(.is-focused) .markdown-rendered,
body${mode}:not(.is-focused) .markdown-reading-view,
body${mode}:not(.is-focused) .cm-editor,
body${mode}:not(.is-focused) .cm-scroller,
body${mode}:not(.is-focused) .cm-gutters,
body${mode}:not(.is-focused) .cm-gutter,
body${mode}:not(.is-focused) .cm-lineNumbers,
body${mode}:not(.is-focused) .workspace-leaf-content[data-type="canvas"],
body${mode}:not(.is-focused) .workspace-leaf-content[data-type="canvas"] .view-content,
body${mode}:not(.is-focused) .canvas-wrapper,
body${mode}:not(.is-focused) .canvas,
body${mode}:not(.is-focused) .canvas-background,
body${mode}:not(.is-focused) .workspace-leaf-content[data-type="bases"],
body${mode}:not(.is-focused) .workspace-leaf-content[data-type="bases"] .view-content,
body${mode}:not(.is-focused) .workspace-leaf-content[data-type="bases-query"],
body${mode}:not(.is-focused) .workspace-leaf-content[data-type="bases-query"] .view-content,
body${mode}:not(.is-focused) .bases-view,
body${mode}:not(.is-focused) .bases-container,
body${mode}:not(.is-focused) .bases-table-container,
body${mode}:not(.is-focused) .bases-cards-container,
body${mode}:not(.is-focused) .bases-header,
body${mode}:not(.is-focused) .workspace-leaf-content[data-type="graph"],
body${mode}:not(.is-focused) .workspace-leaf-content[data-type="graph"] .view-content,
body${mode}:not(.is-focused) .nav-files-container,
body${mode}:not(.is-focused) .nav-folder-children,
body${mode}:not(.is-focused) .sidebar-toggle-button,
body${mode}:not(.is-focused) .status-bar {
  background-color: transparent !important;
}

body${mode}:not(.is-focused) .app-container {
  background-color: ${appContainerBg} !important;
}

/* 3. Main Note Content & Editor Area
   Scoped to .workspace-split.mod-root. A side-dock leaf carries no
   .mod-sidedock of its own - Obsidian puts that class on the split, not the
   leaf (see the workspace JS) - so the old broad
   .workspace-leaf:not(.mod-sidedock) selector also matched sidebars. Its
   .mod-active form then outranked the "4. Sidebars & Docks" rule below and
   repainted the focused sidebar with the editor's primary background, which is
   what made a pane darken the moment it was clicked. Descendant selectors keep
   every nested editor split covered because they all live under mod-root. */
${mode} .workspace-split.mod-root .workspace-leaf-content,
${mode} .workspace-split.mod-root .workspace-leaf.mod-active .workspace-leaf-content,
body${mode}:not(.is-focused) .workspace-split.mod-root .workspace-leaf-content,
body${mode}:not(.is-focused) .workspace-split.mod-root .workspace-leaf.mod-active .workspace-leaf-content {
  background-color: ${op === 0 ? 'transparent' : `color-mix(in srgb, ${primaryBg} ${opPct}, transparent)`} !important;
  backdrop-filter: blur(var(--glass-blur, ${blur})) saturate(150%) !important;
  -webkit-backdrop-filter: blur(var(--glass-blur, ${blur})) saturate(150%) !important;
  transform: translateZ(0);
}

/* 4. Sidebars & Docks */
${mode} .workspace-split.mod-left-split,
${mode} .workspace-split.mod-right-split,
${mode} .workspace-split.mod-left-split .workspace-leaf-content,
${mode} .workspace-split.mod-right-split .workspace-leaf-content,
${mode} .workspace-split.mod-left-split .nav-header,
${mode} .workspace-split.mod-right-split .nav-header,
${mode} .workspace-split.mod-left-split .nav-buttons-container,
${mode} .workspace-split.mod-right-split .nav-buttons-container,
${mode} .workspace-leaf-content[data-type="file-explorer"] .nav-header,
${mode} .workspace-leaf-content[data-type="file-explorer"] .nav-buttons-container,
${mode} .workspace-drawer,
body${mode}:not(.is-focused) .workspace-split.mod-left-split,
body${mode}:not(.is-focused) .workspace-split.mod-right-split,
body${mode}:not(.is-focused) .workspace-split.mod-left-split .workspace-leaf-content,
body${mode}:not(.is-focused) .workspace-split.mod-right-split .workspace-leaf-content,
body${mode}:not(.is-focused) .workspace-split.mod-left-split .nav-header,
body${mode}:not(.is-focused) .workspace-split.mod-right-split .nav-header,
body${mode}:not(.is-focused) .workspace-split.mod-left-split .nav-buttons-container,
body${mode}:not(.is-focused) .workspace-split.mod-right-split .nav-buttons-container,
body${mode}:not(.is-focused) .workspace-leaf-content[data-type="file-explorer"] .nav-header,
body${mode}:not(.is-focused) .workspace-leaf-content[data-type="file-explorer"] .nav-buttons-container,
body${mode}:not(.is-focused) .workspace-drawer {
  background-color: ${navSidebarBg} !important;
  backdrop-filter: blur(var(--glass-blur, ${blur})) saturate(150%) !important;
  -webkit-backdrop-filter: blur(var(--glass-blur, ${blur})) saturate(150%) !important;
  border-color: ${borderRgba} !important;
  transform: translateZ(0);
}

/* 4.01 Vault profile in left sidebar */
${mode} .workspace-sidedock-vault-profile,
${mode} .workspace-split.mod-left-split .workspace-sidedock-vault-profile,
${mode} .workspace-drawer-vault-switcher,
${mode} .workspace-drawer-vault-name,
body${mode}.is-translucent .workspace-sidedock-vault-profile,
body${mode}.is-translucent .workspace-drawer-vault-switcher,
body${mode}.is-translucent .workspace-drawer-vault-name,
body${mode}:not(.is-focused) .workspace-sidedock-vault-profile,
body${mode}:not(.is-focused) .workspace-split.mod-left-split .workspace-sidedock-vault-profile,
body${mode}:not(.is-focused) .workspace-drawer-vault-switcher,
body${mode}:not(.is-focused) .workspace-drawer-vault-name,
body${mode}.is-translucent:not(.is-focused) .workspace-sidedock-vault-profile,
body${mode}.is-translucent:not(.is-focused) .workspace-drawer-vault-switcher,
body${mode}.is-translucent:not(.is-focused) .workspace-drawer-vault-name {
  background-color: transparent !important;
  background: transparent !important;
  border-color: ${borderRgba} !important;
}

/* 4.02 CSS Snippet Designer top menu navigation tabs & tree preview */
${mode} .css-designer-tabs,
body${mode}:not(.is-focused) .css-designer-tabs {
  background-color: ${navSidebarBg} !important;
  backdrop-filter: blur(var(--glass-blur, ${blur})) saturate(150%) !important;
  -webkit-backdrop-filter: blur(var(--glass-blur, ${blur})) saturate(150%) !important;
  border-color: ${borderRgba} !important;
}
${mode} .css-designer-container .css-nav-tree-preview-card,
${mode} .css-designer-container .obsidian-preview-nav-tree,
body${mode}:not(.is-focused) .css-designer-container .css-nav-tree-preview-card,
body${mode}:not(.is-focused) .css-designer-container .obsidian-preview-nav-tree {
  background: ${navSidebarBg} !important;
  backdrop-filter: blur(var(--glass-blur, ${blur})) saturate(150%) !important;
  -webkit-backdrop-filter: blur(var(--glass-blur, ${blur})) saturate(150%) !important;
}

/* 4.1 Ribbon Dock: Transparent shell isolated from transform/contain/backdrop-filter to preserve sidebar toggle button header positioning */
${mode} .workspace-ribbon,
${mode} .workspace-ribbon.side-dock-ribbon,
${mode} .workspace-ribbon.mod-left,
${mode} .workspace-ribbon.mod-right,
body${mode}:not(.is-focused) .workspace-ribbon,
body${mode}:not(.is-focused) .workspace-ribbon.side-dock-ribbon,
body${mode}:not(.is-focused) .workspace-ribbon.mod-left,
body${mode}:not(.is-focused) .workspace-ribbon.mod-right {
  background-color: ${navSidebarBg} !important;
  border-color: ${borderRgba} !important;
  transform: none !important;
  will-change: auto !important;
  contain: none !important;
}
${mode} .workspace-ribbon.mod-left:before,
body${mode}:not(.is-focused) .workspace-ribbon.mod-left:before {
  background-color: ${navSidebarBg} !important;
  border-bottom: 1px solid ${borderRgba} !important;
}

/* 5.2 Navigation Bar & Page Title (.view-header) - Homogeneous with active tab and note body */
${mode} .view-header,
${mode} .workspace-leaf .view-header,
${mode} .workspace-leaf.mod-active .view-header,
${mode}.is-focused .workspace-leaf.mod-active .view-header,
body${mode}:not(.is-focused) .view-header,
body${mode}:not(.is-focused) .workspace-leaf .view-header,
body${mode}:not(.is-focused) .workspace-leaf.mod-active .view-header {
  background-color: transparent !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
  border-bottom: none !important;
  border-top: none !important;
  box-shadow: none !important;
  transform: none !important;
  will-change: auto !important;
}

/* 6. Modal Backdrop (Dims and frosted-blurs workspace behind modals) */
${mode} .modal-container {
  background-color: ${isDark ? 'rgba(0, 0, 0, 0.35)' : 'rgba(0, 0, 0, 0.15)'} !important;
  backdrop-filter: blur(var(--glass-blur, ${blur})) saturate(150%) !important;
  -webkit-backdrop-filter: blur(var(--glass-blur, ${blur})) saturate(150%) !important;
  transform: translateZ(0);
}

/* 7. Floating Overlays: Modals, Quick Switcher, Command Palette, Menus, Suggestions & Hover Popovers */
${mode} .modal,
${mode} .prompt,
${mode} .menu,
${mode} .suggestion-container,
${mode} .hover-popover {
  background-color: ${overlayBg} !important;
  backdrop-filter: blur(var(--glass-blur, ${blur})) saturate(150%) !important;
  -webkit-backdrop-filter: blur(var(--glass-blur, ${blur})) saturate(150%) !important;
  border: 1px solid ${borderRgba} !important;
  box-shadow: 0 16px 36px ${shadowRgba} !important;
}

/* 8. Canvas & Bases Nodes and Cards */
${mode} .canvas-node-container,
${mode} .canvas-card-menu,
${mode} .canvas-control-group,
${mode} .bases-cards-container .bases-card,
${mode} .bases-toolbar-menu,
body${mode}:not(.is-focused) .canvas-node-container,
body${mode}:not(.is-focused) .canvas-card-menu,
body${mode}:not(.is-focused) .canvas-control-group,
body${mode}:not(.is-focused) .bases-cards-container .bases-card,
body${mode}:not(.is-focused) .bases-toolbar-menu {
  background-color: ${op === 0 ? 'transparent' : `color-mix(in srgb, ${primaryBg} ${opPct}, transparent)`} !important;
  backdrop-filter: blur(var(--glass-blur, ${blur})) saturate(150%) !important;
  -webkit-backdrop-filter: blur(var(--glass-blur, ${blur})) saturate(150%) !important;
  border-color: ${borderRgba} !important;
}
`;
}
