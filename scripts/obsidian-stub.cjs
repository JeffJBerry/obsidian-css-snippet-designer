/**
 * A stub of the parts of the Obsidian API this plugin touches during load,
 * plus the minimum DOM Obsidian's element helpers assume.
 *
 * Enough to run `onload()` end to end in plain node and catch the errors that
 * make Obsidian report "Failed to load plugin". Not a general-purpose fake.
 */
const calls = { views: [], commands: [], ribbon: [], settingTabs: [], events: [] };

/** A DOMTokenList-alike: the real one has contains/add/remove/toggle, not Set's API. */
function makeClassList() {
	const set = new Set();
	return {
		add: (...c) => c.forEach((x) => set.add(x)),
		remove: (...c) => c.forEach((x) => set.delete(x)),
		contains: (c) => set.has(c),
		toggle: (c, on) => (on ?? !set.has(c) ? set.add(c) : set.delete(c)),
		get length() { return set.size; },
		toString: () => Array.from(set).join(' '),
	};
}

/** Obsidian augments HTMLElement with these; jsdom-free minimal stand-ins. */
function makeEl(tag = 'div') {
	const elStyle = {
		setProperty(k, v) { elStyle[k] = v; },
		removeProperty(k) { delete elStyle[k]; },
	};
	const el = {
		tagName: String(tag).toUpperCase(),
		children: [],
		classList: makeClassList(),
		style: elStyle,
		attrs: {},
		dataset: {},
		textContent: '',
		scrollTop: 0,
		ownerDocument: null,
	};
	Object.defineProperty(el, 'options', {
		get() {
			const res = [];
			const collect = (node) => {
				for (const child of node.children) {
					if (child.tagName === 'OPTION') res.push(child);
					else if (child.tagName === 'OPTGROUP') collect(child);
				}
			};
			collect(el);
			return res;
		},
	});
	el.createEl = (t, o = {}) => {
		const c = makeEl(t);
		c.ownerDocument = el.ownerDocument;
		if (o.text) c.textContent = o.text;
		if (o.cls) String(o.cls).split(/\s+/).forEach((x) => c.classList.add(x));
		el.children.push(c);
		return c;
	};
	el.createDiv = (o) => el.createEl('div', o);
	el.createSpan = (o) => el.createEl('span', o);
	el.empty = () => { el.children.length = 0; };
	el.addClass = (...c) => el.classList.add(...c);
	el.removeClass = (...c) => el.classList.remove(...c);
	el.toggleClass = (c, on) => el.classList.toggle(c, on);
	el.hasClass = (c) => el.classList.contains(c);
	el.setText = (t) => { el.textContent = t; };
	el.setAttribute = (k, v) => { el.attrs[k] = v; };
	el.getAttribute = (k) => el.attrs[k] ?? null;
	el.removeAttribute = (k) => { delete el.attrs[k]; };
	el.setCssProps = (props) => {
		for (const k in props) {
			if (Object.prototype.hasOwnProperty.call(props, k)) {
				elStyle[k] = props[k];
			}
		}
	};
	el.setCssStyles = el.setCssProps;
	el.appendChild = (c) => { el.children.push(c); return c; };
	el.remove = () => {};
	el.querySelector = (sel) => {
		const list = el.querySelectorAll(sel);
		return list.length > 0 ? list[0] : null;
	};
	el.querySelectorAll = (sel) => {
		const res = [];
		const targetTag = sel.toUpperCase();
		const collect = (node) => {
			for (const child of node.children) {
				if (child.tagName === targetTag) res.push(child);
				collect(child);
			}
		};
		collect(el);
		return res;
	};
	const listeners = new Map();
	el.addEventListener = (evt, fn) => {
		if (!listeners.has(evt)) listeners.set(evt, []);
		listeners.get(evt).push(fn);
	};
	el.removeEventListener = (evt, fn) => {
		const arr = listeners.get(evt);
		if (arr) {
			const idx = arr.indexOf(fn);
			if (idx >= 0) arr.splice(idx, 1);
		}
	};
	el.dispatchEvent = (evt) => {
		const type = typeof evt === 'string' ? evt : evt.type;
		const arr = listeners.get(type);
		if (arr) arr.forEach((fn) => fn(evt));
		return true;
	};
	el.detach = () => {};
	return el;
}

function makeDocument() {
	const doc = { defaultView: null };
	doc.body = makeEl('body');
	doc.body.ownerDocument = doc;
	doc.head = makeEl('head');
	doc.head.ownerDocument = doc;
	doc.documentElement = makeEl('html');
	doc.documentElement.ownerDocument = doc;
	doc.createElement = (t) => { const e = makeEl(t); e.ownerDocument = doc; return e; };
	doc.getElementById = () => null;
	doc.querySelector = () => null;
	doc.querySelectorAll = () => [];
	doc.addEventListener = () => {};
	doc.removeEventListener = () => {};
	return doc;
}

/** Install the globals a browser/Electron renderer would provide. */
function installDom() {
	const doc = makeDocument();
	const win = {
		document: doc,
		addEventListener() {},
		removeEventListener() {},
		requestAnimationFrame: (fn) => setTimeout(fn, 0),
		cancelAnimationFrame: (id) => clearTimeout(id),
		getComputedStyle: () => ({ getPropertyValue: () => '' }),
	};
	doc.defaultView = win;
	globalThis.document = doc;
	globalThis.window = win;
	globalThis.requestAnimationFrame = win.requestAnimationFrame;
	globalThis.cancelAnimationFrame = win.cancelAnimationFrame;
	globalThis.getComputedStyle = win.getComputedStyle;
	globalThis.HTMLElement = function HTMLElement() {};
	return doc;
}

/** A vault adapter backed by an in-memory filesystem. */
function makeApp() {
	const files = new Map();
	const dirs = new Set();
	const workspace = {
		onLayoutReady(fn) { calls.events.push('onLayoutReady'); fn(); },
		on(name) { calls.events.push(name); return { name }; },
		off() {},
		getLeavesOfType: () => [],
		getLeaf: () => null,
		getRightLeaf: () => null,
		revealLeaf() {},
		iterateAllLeaves() {},
		detachLeavesOfType() {},
	};
	return {
		workspace,
		vault: {
			configDir: '.obsidian',
			adapter: {
				exists: async (p) => files.has(p) || dirs.has(p),
				read: async (p) => files.get(p) ?? '',
				write: async (p, d) => { files.set(p, d); },
				mkdir: async (p) => { dirs.add(p); },
				list: async () => ({ files: [], folders: [] }),
			},
		},
		__files: files,
	};
}

class Events {
	on() { return {}; }
	off() {}
	trigger() {}
}

class Component {
	registerEvent(ref) { calls.events.push('registerEvent'); return ref; }
	registerDomEvent() {}
	registerInterval(id) { return id; }
	register() {}
	addChild(c) { return c; }
	load() {}
	unload() {}
}

class Plugin extends Component {
	constructor(app, manifest) { super(); this.app = app; this.manifest = manifest; this._data = null; }
	async loadData() { return this._data; }
	async saveData(d) { this._data = d; }
	registerView(type, factory) { calls.views.push(type); this[`__view_${type}`] = factory; }
	addRibbonIcon(icon, title) { calls.ribbon.push({ icon, title }); return makeEl('div'); }
	addCommand(cmd) { calls.commands.push(cmd.id); return cmd; }
	addSettingTab(tab) { calls.settingTabs.push(tab?.constructor?.name ?? 'unknown'); }
	registerExtensions() {}
}

class ItemView extends Component {
	constructor(leaf) { super(); this.leaf = leaf; this.containerEl = makeEl('div'); this.contentEl = makeEl('div'); }
}
class Modal { constructor(app) { this.app = app; this.contentEl = makeEl('div'); this.titleEl = makeEl('div'); this.modalEl = makeEl('div'); } open() {} close() {} }
class SuggestModal extends Modal { constructor(app) { super(app); } setPlaceholder() {} }
class PluginSettingTab { constructor(app, plugin) { this.app = app; this.plugin = plugin; this.containerEl = makeEl('div'); } display() {} hide() {} }

const chain = () => {
	const c = {};
	for (const m of ['setName','setDesc','setHeading','setClass','setTooltip','setValue','setPlaceholder',
		'setButtonText','setIcon','setDynamicTooltip','addOption','addOptions','onChange','onClick',
		'setDisabled','setLimits','setInstant','then','inputEl','controlEl']) c[m] = () => c;
	return c;
};
class Setting {
	constructor(el) { this.containerEl = el; Object.assign(this, chain()); }
	addToggle(cb) { cb?.(new ToggleComponent()); return this; }
	addDropdown(cb) { cb?.(new DropdownComponent()); return this; }
	addText(cb) { cb?.(new TextComponent()); return this; }
	addButton(cb) { cb?.(chain()); return this; }
	addSlider(cb) { cb?.(chain()); return this; }
	addExtraButton(cb) { cb?.(chain()); return this; }
}
class ToggleComponent { constructor() { Object.assign(this, chain()); } }
class TextComponent { constructor() { Object.assign(this, chain()); } }
class DropdownComponent { constructor() { Object.assign(this, chain()); } }
class WorkspaceLeaf { constructor() { this.view = null; } async setViewState() {} }

module.exports = {
	Plugin, ItemView, Modal, SuggestModal, PluginSettingTab, Setting, Component, Events,
	ToggleComponent, TextComponent, DropdownComponent, WorkspaceLeaf,
	Notice: class Notice { constructor(msg) { calls.events.push(`notice:${msg}`); } },
	setIcon() {}, debounce(fn) { const f = (...a) => fn(...a); f.cancel = () => {}; return f; },
	normalizePath: (p) => p,
	Platform: { isWin: process.platform === 'win32', isMacOS: false, isLinux: true, isDesktop: true, isMobile: false },
	__test: { makeApp, installDom, makeEl, calls },
};
