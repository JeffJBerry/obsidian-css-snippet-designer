import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SnippetEngine, SnippetSession, validateCss } from '../src/engine';

// Tests for the in-memory SnippetEngine token store and validation.

test('token mutation and export', () => {
	const engine = new SnippetEngine();
	engine.setToken(':root', '--font-text-size', '16px');
	engine.setToken(':root', 'line-height-normal', '1.6');
	engine.setToken('.theme-dark', '--background-primary', '#1e1e2e');
	engine.setToken('.theme-light', '--background-primary', '#ffffff');

	assert.equal(engine.getToken(':root', '--font-text-size'), '16px');
	// A name without the `--` prefix resolves to the same token.
	assert.equal(engine.getToken(':root', 'line-height-normal'), '1.6');
	assert.equal(engine.getToken('.theme-dark', '--background-primary'), '#1e1e2e');

	const exported = engine.exportCss();
	assert.match(exported, /:root/);
	assert.match(exported, /--font-text-size: 16px/);
	assert.match(exported, /--line-height-normal: 1\.6/);
	assert.match(exported, /\.theme-dark/);
	assert.match(exported, /--background-primary: #1e1e2e/);
	assert.match(exported, /\.theme-light/);

	engine.removeToken(':root', '--font-text-size');
	assert.equal(engine.getToken(':root', '--font-text-size'), undefined);
	assert.doesNotMatch(engine.exportCss(), /--font-text-size/);
});

test('empty scope falls back to :root and values are trimmed', () => {
	const engine = new SnippetEngine();
	engine.setToken('   ', '  --pad  ', '  4px  ');
	assert.equal(engine.getToken(':root', '--pad'), '4px');
});

test('removing the last token in a scope drops the scope', () => {
	const engine = new SnippetEngine();
	engine.setToken('.theme-dark', '--x', '1');
	assert.deepEqual(engine.scopes(), ['.theme-dark']);
	engine.removeToken('.theme-dark', '--x');
	assert.deepEqual(engine.scopes(), []);
	assert.equal(engine.scopeCount, 0);
});

test('export is deterministic regardless of insertion order', () => {
	const a = new SnippetEngine();
	a.setToken('.theme-dark', '--z', '1');
	a.setToken('.theme-dark', '--a', '2');
	const b = new SnippetEngine();
	b.setToken('.theme-dark', '--a', '2');
	b.setToken('.theme-dark', '--z', '1');
	assert.equal(a.exportCss(), b.exportCss());
});

test('session lifecycle', () => {
	const session = new SnippetSession('.cm-editor { font-size: 14px; }');
	session.setProperty('.cm-editor', 'font-size', '16px');
	session.setProperty('.cm-editor', 'color', '#123456');
	session.setProperty('.nav-folder-title', 'font-weight', '600');

	const overrides = session.generateLiveOverrideCss();
	assert.match(overrides, /\.cm-editor/);
	assert.match(overrides, /font-size: 16px;/);
	assert.match(overrides, /color: #123456;/);
	assert.match(overrides, /\.nav-folder-title/);
	assert.match(overrides, /font-weight: 600;/);

	const full = session.serializeFull();
	assert.match(full, /font-size: 14px/);
	assert.match(full, /font-size: 16px/);
});

test('invalid css is rejected', () => {
	assert.throws(() => new SnippetSession('this is not valid css {{{'));
	assert.equal(SnippetSession.tryCreate('a {'), null);
});

test('spelling and grammar pseudo-elements parse', () => {
	const css = `
		::spelling-error, *::spelling-error, .cm-content ::spelling-error, .cm-line::spelling-error {
			color: var(--text-normal) !important;
			text-decoration-color: var(--spellcheck-underline-color, #e05252) !important;
		}
		::grammar-error, *::grammar-error, .cm-content ::grammar-error {
			color: var(--text-normal) !important;
		}
	`;
	const session = SnippetSession.tryCreate(css);
	assert.notEqual(session, null);
	assert.match((session as SnippetSession).serializeFull(), /spelling-error/);
});
