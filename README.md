# CSS Snippet Designer

![CSS Snippet Designer demo](assets/demo.gif)

A visual styling studio for [Obsidian](https://obsidian.md). Tune typography, colors, shadows, backgrounds and UI chrome with live controls, then save the result as a standard CSS snippet.

> **Desktop only** — requires Obsidian 1.7.2 or newer.

[![CI](https://github.com/JeffJBerry/obsidian-css-snippet-designer/actions/workflows/lint.yml/badge.svg)](https://github.com/JeffJBerry/obsidian-css-snippet-designer/actions/workflows/lint.yml)
[![License](https://img.shields.io/github/license/JeffJBerry/obsidian-css-snippet-designer)](https://github.com/JeffJBerry/obsidian-css-snippet-designer/blob/main/LICENSE)
[![Latest release](https://img.shields.io/github/v/release/JeffJBerry/obsidian-css-snippet-designer)](https://github.com/JeffJBerry/obsidian-css-snippet-designer/releases)

## Features

- Live preview across both Reading View and Live Preview
- Generates plain CSS in real time, ready to copy and share
- Curated presets and procedural background patterns
- Shadows, glows and animations, with reduced-motion support
- Fenced output that preserves your own CSS between saves
- Built-in structural CSS validation before anything is written

## The designer

![The CSS Snippet Designer panel — the Typography tab](assets/obsidian-css-snippet-designer-app-ui.png)

Switch between **Presets**, **Typography**, **Colors**, **UI Elements**, and **Shadows & Outlines**; every control updates the live preview and the generated snippet in real time.

## Live CSS generation

![The generated CSS pane with a Copy Code button](assets/plugin-view-code-view.png)

Every control change updates the Obsidian UI instantly and writes the matching plain CSS in real time. The live snippet appears in a code pane with a **Copy Code** button, so you can copy and share your CSS just like any other snippet.

## Installation

**Community plugins:** coming soon — the plugin is not yet listed in the Obsidian Community directory.

**Manual install:** copy `main.js`, `manifest.json`, and `styles.css` into:

```
YourVault/.obsidian/plugins/css-snippet-designer/
```

Then reload Obsidian and enable **CSS Snippet Designer** under **Settings → Community plugins**.

## Development

```bash
npm install
npm run dev      # esbuild watch
npm run check    # typecheck + lint + tests + smoke load
npm run build    # production bundle
```

Pure TypeScript with no runtime dependencies. All CSS is produced by pure generator functions and validated before it reaches disk. The suite covers 288 tests running on Node's built-in test runner.

## License

[MIT](LICENSE)

---

Made by [Jeffrey Berry](https://github.com/JeffJBerry). Issues and ideas welcome in the [issue tracker](https://github.com/JeffJBerry/obsidian-css-snippet-designer/issues).
