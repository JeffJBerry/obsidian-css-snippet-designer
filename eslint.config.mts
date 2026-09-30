import obsidianmd from 'eslint-plugin-obsidianmd';
import globals from 'globals';
import { globalIgnores, defineConfig } from 'eslint/config';

export default defineConfig(
	globalIgnores([
		'node_modules',
		'dist',
		'esbuild.config.mjs',
		'version-bump.mjs',
		'versions.json',
		'main.js',
		'package.json',
		'package-lock.json',
		'tsconfig.json',
		'styles.css',
		'.antigravity/**',
		'.agents/**',
		'.docs/**',
		'.codebase-memory/**',
		'.git/**',
	]),
	{
		languageOptions: {
			globals: {
				...globals.browser,
			},
			parserOptions: {
				projectService: {
					allowDefaultProject: ['eslint.config.mts', 'manifest.json'],
				},
				tsconfigRootDir: import.meta.dirname,
				extraFileExtensions: ['.json'],
			},
		},
	},
	...obsidianmd.configs.recommended,
	{
		// The live preview writes computed shadow/outline values to the preview
		// card on every control change. Those values are per-frame and cannot be
		// expressed as CSS classes; the rule also flags `setCssProps`, which is
		// the replacement its own message recommends. The preset palette band and
		// swatch circles are likewise rendered with inline styles on purpose, so
		// they contribute no stylesheet rules. Downgraded here only, so the rule
		// keeps protecting the rest of the codebase.
		files: ['src/ui/widgets.ts', 'src/ui/presets-tab.ts'],
		rules: {
			'obsidianmd/no-static-styles-assignment': 'warn',
		},
	},
);
