# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- `THIRD-PARTY-NOTICES.md` listing the embedded preview fonts and reproducing their licenses (OFL-1.1, Apache-2.0, UFL-1.0).

### Changed

- Settings now also expose Obsidian's declarative settings API (1.13+), so they appear in settings search; the legacy tab is retained for older versions.
- Replaced native `document.createElement('style')` with Obsidian's `createEl`, and explicitly typed the Electron `require` lookup, clearing the remaining review warnings.

### Fixed

- Live-preview and preset-swatch styling now uses CSS classes and custom properties instead of inline styles, clearing the `obsidianmd/no-static-styles-assignment` findings from the community plugin review.

## [1.0.0] - 2026-09-30

### Added

- Visual CSS snippet designer for Obsidian: live multi-mode preview, curated presets and themes, procedural background patterns, and configurable shadows, glows and animations.
- Real-time CSS generation with a copy-and-share code pane.
- Fenced snippet persistence that preserves hand-written CSS between saves.
- Built-in structural CSS validation before anything is written to disk.
- Optional desktop window translucency (Windows Mica/Acrylic, macOS vibrancy).

[Unreleased]: https://github.com/JeffJBerry/obsidian-css-snippet-designer/compare/1.0.0...HEAD
[1.0.0]: https://github.com/JeffJBerry/obsidian-css-snippet-designer/releases/tag/1.0.0
