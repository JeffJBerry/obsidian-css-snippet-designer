import { test } from 'node:test';
import assert from 'node:assert/strict';
import { STYLE_CONTROLS, getNextWrappedIndex, FONT_OPTIONS } from '../src/schema';
import { validateCss, formatIssues } from '../src/engine';
import { getSystemFonts, resetCachedSystemFontsForTest, isIllegibleSymbolFont } from '../src/obsidian-internals';
import { populateSelectOptions, applyProspectiveFontStyles, previewFontFamily } from '../src/ui/widgets';
import { mergeSystemFontsIntoOptions } from '../src/ui/font-merge';

function assertValid(css: string, label: string): void {
	const result = validateCss(css);
	assert.ok(result.ok, `${label} produced malformed CSS:\n${formatIssues(result.issues)}`);
}

test('typography font controls exist with type select and populated options', () => {
	const fontIds = ['font-header', 'font-text', 'font-interface', 'font-monospace'];

	for (const id of fontIds) {
		const ctrl = STYLE_CONTROLS.find((c) => c.id === id);
		assert.ok(ctrl, `Control ${id} must exist in STYLE_CONTROLS`);
		assert.equal(ctrl.category, 'typography');
		assert.equal(ctrl.subcategory, 'Font & Base Scale');
		assert.equal(ctrl.type, 'select');
		assert.ok(ctrl.options && ctrl.options.length > 50, `${id} must have populated font options`);
		assert.ok(ctrl.defaultDarkValue.length > 0, `${id} must have defaultDarkValue`);
		assert.ok(ctrl.defaultLightValue.length > 0, `${id} must have defaultLightValue`);
	}
});

test('typography font controls companionCss is valid and targets appropriate selectors', () => {
	const headerCtrl = STYLE_CONTROLS.find((c) => c.id === id('font-header'));
	const textCtrl = STYLE_CONTROLS.find((c) => c.id === 'font-text');
	const interfaceCtrl = STYLE_CONTROLS.find((c) => c.id === 'font-interface');
	const monospaceCtrl = STYLE_CONTROLS.find((c) => c.id === 'font-monospace');

	function id(val: string): string { return val; }

	assert.ok(headerCtrl?.companionCss, 'font-header must have companionCss');
	assertValid(headerCtrl.companionCss, 'font-header companionCss');
	assert.ok(headerCtrl.companionCss.includes('var(--font-header) !important'));

	assert.ok(textCtrl?.companionCss, 'font-text must have companionCss');
	assertValid(textCtrl.companionCss, 'font-text companionCss');
	assert.ok(textCtrl.companionCss.includes('var(--font-text) !important'));

	assert.ok(interfaceCtrl?.companionCss, 'font-interface must have companionCss');
	assertValid(interfaceCtrl.companionCss, 'font-interface companionCss');
	assert.ok(interfaceCtrl.companionCss.includes('var(--font-interface) !important'));

	assert.ok(monospaceCtrl?.companionCss, 'font-monospace must have companionCss');
	assertValid(monospaceCtrl.companionCss, 'font-monospace companionCss');
	assert.ok(monospaceCtrl.companionCss.includes('var(--font-monospace) !important'));
});

test('font options contain free/open-source stock fonts across categories', () => {
	const textCtrl = STYLE_CONTROLS.find((c) => c.id === 'font-text');
	assert.ok(textCtrl?.options);
	const groups = new Set(textCtrl.options.map((o) => o.group));
	assert.ok(groups.has('Sans-Serif'), 'Must contain Sans-Serif group');
	assert.ok(groups.has('Serif'), 'Must contain Serif group');
	assert.ok(groups.has('Monospace'), 'Must contain Monospace group');
	assert.ok(groups.has('Script & Decorative'), 'Must contain Script & Decorative group');

	const labels = textCtrl.options.map((o) => o.label);
	const expectedStockFonts = [
		'Inter',
		'Source Code Pro',
		'Arimo',
		'Carlito',
		'Gelasio',
		'Tinos',
	];
	for (const font of expectedStockFonts) {
		const found = labels.some((l) => l.includes(font));
		assert.ok(found, `Stock font ${font} must be present in font options`);
	}
});

test('getNextWrappedIndex cycles forward and backward with wrap-around', () => {
	const options = [
		{ label: 'Opt A', value: 'a' },
		{ label: 'Opt B', value: 'b' },
		{ label: 'Opt C', value: 'c' },
	];

	// Forward stepping
	assert.equal(getNextWrappedIndex(options, 'a', 1), 1, 'from a forward should be b');
	assert.equal(getNextWrappedIndex(options, 'b', 1), 2, 'from b forward should be c');
	assert.equal(getNextWrappedIndex(options, 'c', 1), 0, 'from c forward should wrap to a');

	// Backward stepping
	assert.equal(getNextWrappedIndex(options, 'c', -1), 1, 'from c backward should be b');
	assert.equal(getNextWrappedIndex(options, 'b', -1), 0, 'from b backward should be a');
	assert.equal(getNextWrappedIndex(options, 'a', -1), 2, 'from a backward should wrap to c');

	// Unknown current value fallback
	assert.equal(getNextWrappedIndex(options, 'unknown', 1), 0, 'unknown forward defaults to 0');
	assert.equal(getNextWrappedIndex(options, 'unknown', -1), 2, 'unknown backward defaults to last');

	// Empty list
	assert.equal(getNextWrappedIndex([], 'a', 1), -1, 'empty options returns -1');
});

test('system font merge skips families and their weight/width variants already listed', () => {
	const options = [
		{ label: 'Arial', value: '"Arial", sans-serif', group: 'Sans-Serif' },
		{ label: 'Courier New', value: '"Courier New", monospace', group: 'Monospace' },
		{ label: 'Sitka', value: '"Sitka", serif', group: 'Serif' },
		{ label: 'Segoe UI (Windows Fluent)', value: '"Segoe UI", sans-serif', group: 'Sans-Serif' },
		{ label: 'Bahnschrift (Modern Variable Sans)', value: 'Bahnschrift, sans-serif', group: 'Sans-Serif' },
	];
	const sysFonts = [
		'Arial', 'Arial Black', 'Courier New', 'Roboto',
		'Sitka', 'Sitka Banner', 'Sitka Display', 'Sitka Heading', 'Sitka Small', 'Sitka Subheading', 'Sitka Text',
		'Segoe UI', 'Segoe UI Semilight', 'Segoe UI Variable Display', 'Segoe UI Variable Text',
		'Bahnschrift Light SemiCondensed', 'Bahnschrift SemiBold SemiConden',
		'Agency FB',
	];

	assert.equal(mergeSystemFontsIntoOptions(options, sysFonts), true, 'the merge should add the unrelated families');
	const added = options.filter((o) => o.group === 'System Fonts').map((o) => o.label);
	assert.deepEqual(added, ['Roboto', 'Agency FB'], `unexpected system fonts added: ${added.join(', ')}`);

	// Repeated merge (simulating a re-render) must not add anything more.
	assert.equal(mergeSystemFontsIntoOptions(options, sysFonts), false);
	assert.equal(options.filter((o) => o.group === 'System Fonts').length, 2);
});

test('getSystemFonts deduplicates in-flight calls and caches results', async () => {
	resetCachedSystemFontsForTest();
	const promise1 = getSystemFonts();
	const promise2 = getSystemFonts();

	assert.strictEqual(promise1, promise2, 'Concurrent calls to getSystemFonts must share the same in-flight Promise');

	const [fonts1, fonts2] = await Promise.all([promise1, promise2]);
	assert.deepEqual(fonts1, fonts2);

	const promise3 = getSystemFonts();
	const fonts3 = await promise3;
	assert.deepEqual(fonts3, fonts1, 'Subsequent call must return cached system fonts');
});

test('isIllegibleSymbolFont correctly rejects symbol, dingbat, icon, and math fonts', () => {
	const symbolFonts = [
		'Webdings',
		'Wingdings',
		'Wingdings 2',
		'Wingdings 3',
		'Symbol',
		'MT Extra',
		'Marlett',
		'MS Outlook',
		'Bookshelf Symbol 7',
		'MS Reference Specialty',
		'Segoe MDL2 Assets',
		'Segoe Fluent Icons',
		'Segoe UI Symbol',
		'Segoe UI Emoji',
		'Segoe UI Historic',
		'Holo MDL2 Assets',
		'Cambria Math',
		'@Arial',
		'@SimSun',
		'Material Icons',
		'FontAwesome',
		// Legacy bitmap / raster fonts
		'Courier 10,12,15',
		'MS Sans Serif 8,10,12,14,18,24',
		'MS Serif 8,10,12,14,18,24',
		'Small Fonts',
		'Modern',
		'Roman',
		'Script',
		// Extreme novelty / illegible decorative fonts
		'Chiller',
		'Jokerman',
		'Old English Text MT',
		'Blackadder ITC',
		'Gigi',
		'Goudy Stout',
		'Parchment',
		'Playbill',
		'Ravie',
		'Herculanum',
		'Luminari',
		'Trattatello',
		'Zapfino',
		// Obscure non-Latin script fallbacks
		'Microsoft Uighur',
		'Microsoft New Tai Lue',
		'Microsoft Tai Le',
		'Microsoft PhagsPa',
		'Microsoft Yi Baiti',
		'Mongolian Baiti',
		'Javanese Text',
		'Microsoft Himalaya',
		'MV Boli',
		'Myanmar Text',
		// CAD / driver artifacts
		'OLFSimpleSansCJKOC-Regular',
		'qtquickcontrols',
		'LG Display-Regular',
	];

	for (const font of symbolFonts) {
		assert.ok(isIllegibleSymbolFont(font), `Expected "${font}" to be recognized as illegible symbol font`);
	}

	const legitimateFonts = [
		'Arial',
		'Calibri',
		'Inter',
		'Roboto',
		'Georgia',
		'Times New Roman',
		'Consolas',
		'Courier New',
		'Fira Code',
		'Dubai',
		'Elephant',
		'Curlz MT',
		'Book Antiqua',
		'Century Gothic',
		'Palatino Linotype',
		'Trebuchet MS',
		'Verdana',
		'Segoe UI',
		'Bahnschrift',
	];

	for (const font of legitimateFonts) {
		assert.ok(!isIllegibleSymbolFont(font), `Expected "${font}" to be recognized as legitimate font`);
	}
});

test('FONT_OPTIONS contains no symbol fonts or duplicate entries', () => {
	const seenLabels = new Set<string>();

	for (const opt of FONT_OPTIONS) {
		assert.ok(!isIllegibleSymbolFont(opt.label), `FONT_OPTIONS must not contain symbol font: "${opt.label}"`);
		assert.ok(!isIllegibleSymbolFont(opt.value), `FONT_OPTIONS value must not contain symbol font: "${opt.value}"`);

		const normLabel = opt.label.toLowerCase().trim();
		assert.ok(!seenLabels.has(normLabel), `Duplicate font option detected in FONT_OPTIONS: "${opt.label}"`);
		seenLabels.add(normLabel);
	}
});

test('FONT_OPTIONS ships only free/open-source font families', () => {
	const proprietary = new Set([
		'arial', 'arial black', 'arial narrow', 'arial rounded mt bold',
		'helvetica', 'helvetica neue', 'segoe ui', 'segoe print', 'segoe script',
		'calibri', 'cambria', 'cambria math', 'candara', 'constantia', 'corbel',
		'georgia', 'times new roman', 'times', 'courier', 'courier new', 'consolas',
		'menlo', 'monaco', 'sfmono-regular', 'lucida grande', 'lucida sans unicode',
		'lucida console', 'tahoma', 'verdana', 'trebuchet ms', 'impact',
		'haettenschweiler', 'gill sans', 'gill sans mt', 'futura', 'optima',
		'avenir', 'avenir next', 'avenir next condensed', 'franklin gothic medium',
		'book antiqua', 'bookman old style', 'bookman', 'palatino', 'palatino linotype',
		'rockwell', 'sitka', 'sitka text', 'sylfaen', 'didot', 'bodoni 72',
		'bodoni 72 oldstyle', 'bodoni mt', 'big caslon', 'copperplate',
		'copperplate gothic light', 'papyrus', 'comic sans ms', 'brush script mt',
		'marker felt', 'noteworthy', 'signpainter', 'savoye let', 'phosphate',
		'gabriola', 'ink free', 'bradley hand', 'nirmala ui', 'malgun gothic',
		'microsoft jhenghei', 'microsoft sans serif', 'microsoft yahei',
		'leelawadee ui', 'ebrima', 'gadugi', 'skia', 'geneva', 'charter', 'cochin',
		'hoefler text', 'baskerville old face', 'baskerville', 'garamond',
	]);

	for (const opt of FONT_OPTIONS) {
		const families = opt.value
			.split(',')
			.map((f) => f.trim().replace(/^['"]|['"]$/g, '').toLowerCase())
			.filter(Boolean);
		for (const family of families) {
			assert.ok(
				!proprietary.has(family),
				`FONT_OPTIONS option "${opt.label}" uses proprietary family "${family}"`
			);
		}
	}
});

function setupTestDom(): void {
	if (typeof globalThis.document === 'undefined') {
		const doc = {
			createElement(tag: string) {
				const elStyle: Record<string, string> = {};
				const listeners = new Map<string, Array<() => void>>();
				const el: any = {
					tagName: tag.toUpperCase(),
					style: {
						setProperty(k: string, v: string) { elStyle[k] = v; },
						removeProperty(k: string) { delete elStyle[k]; },
						get 'font-family'() { return elStyle['font-family']; },
						fontFamily: '',
					},
					dataset: {} as Record<string, string>,
					attrs: {} as Record<string, string>,
					setAttribute(k: string, v: string) { el.attrs[k] = v; },
					getAttribute(k: string) { return el.attrs[k] ?? null; },
					removeAttribute(k: string) { delete el.attrs[k]; },
					children: [] as any[],
					appendChild(child: any) {
						if (child && !child.tagName && Array.isArray(child.children)) {
							el.children.push(...child.children);
							child.children.length = 0;
						} else {
							el.children.push(child);
						}
						return child;
					},
					empty() { el.children.length = 0; },
					createEl(tag: string, o: { text?: string; cls?: string } = {}) {
						const child = doc.createElement(tag);
						if (o.text) child.textContent = o.text;
						if (o.cls) String(o.cls).split(/\s+/).forEach((c) => child.classList?.add?.(c));
						el.children.push(child);
						return child;
					},
					addEventListener(evt: string, fn: () => void) {
						if (!listeners.has(evt)) listeners.set(evt, []);
						listeners.get(evt)!.push(fn);
					},
				};
				Object.defineProperty(el, 'options', {
					get() {
						const res: any[] = [];
						const collect = (node: any) => {
							for (const c of node.children) {
								if (c.tagName === 'OPTION') res.push(c);
								else if (c.tagName === 'OPTGROUP') collect(c);
							}
						};
						collect(el);
						return res;
					},
				});
				return el;
			},
			createDocumentFragment() {
				const frag = {
					children: [] as any[],
					appendChild(child: any) {
						frag.children.push(child);
						return child;
					},
				};
				return frag;
			},
		};
		globalThis.document = doc as any;
	}

	if (typeof globalThis.window === 'undefined') {
		globalThis.window = {
			requestIdleCallback: (cb: () => void) => {
				const id = setTimeout(cb, 50);
				return id as unknown as number;
			},
		} as any;
	}
}

test('populateSelectOptions and applyProspectiveFontStyles render prospective fonts on options', () => {
	setupTestDom();
	const selectEl = document.createElement('select') as unknown as HTMLSelectElement;
	const options = [
		{ label: 'Inherit Default', value: 'inherit', group: 'Default' },
		{ label: 'Arial', value: 'Arial, sans-serif', group: 'Sans-Serif' },
		{ label: 'Georgia', value: 'Georgia, serif', group: 'Serif' },
		{ label: 'Fira Code', value: '"Fira Code", monospace', group: 'Monospace' },
	];

	populateSelectOptions(selectEl, options, 'Georgia, serif', true);

	// Options collection is populated
	assert.equal(selectEl.options.length, 4);

	// Calling applyProspectiveFontStyles styles options
	applyProspectiveFontStyles(selectEl);

	assert.equal(selectEl.dataset.fontsRendered, 'true');

	// Verify each option received its prospective font-family
	const optMap = new Map<string, string | undefined>();
	for (let i = 0; i < selectEl.options.length; i++) {
		const opt = selectEl.options[i];
		if (!opt) continue;
		const styleObj = (opt.style ?? {}) as unknown as Record<string, string | undefined>;
		optMap.set(opt.value, styleObj['font-family'] ?? opt.style?.fontFamily);
	}

	assert.equal(optMap.get('Arial, sans-serif'), 'Arial, sans-serif');
	assert.equal(optMap.get('Georgia, serif'), 'Georgia, serif');
	assert.equal(optMap.get('"Fira Code", monospace'), "'__cssd_Fira Code', monospace");
	// Inherit should not have overridden font-family
	assert.ok(!optMap.get('inherit'), 'Inherit should not have custom font-family');
});

test('applyProspectiveFontStyles is idempotent and resets upon new options population', () => {
	setupTestDom();
	const selectEl = document.createElement('select') as unknown as HTMLSelectElement;
	const options = [
		{ label: 'Arial', value: 'Arial, sans-serif' },
	];

	populateSelectOptions(selectEl, options, 'Arial, sans-serif', true);
	applyProspectiveFontStyles(selectEl);
	assert.equal(selectEl.dataset.fontsRendered, 'true');

	// Simulate options re-population (e.g. system fonts merged)
	const updatedOptions = [
		{ label: 'Arial', value: 'Arial, sans-serif' },
		{ label: 'Roboto', value: 'Roboto, sans-serif' },
	];
	selectEl.empty();
	populateSelectOptions(selectEl, updatedOptions, 'Arial, sans-serif', true);

	// fontsRendered flag should be cleared so new batch can be styled
	assert.notEqual(selectEl.dataset.fontsRendered, 'true');

	applyProspectiveFontStyles(selectEl);
	assert.equal(selectEl.dataset.fontsRendered, 'true');
	assert.equal(selectEl.options.length, 2);
	const opt1Style = (selectEl.options[1]?.style ?? {}) as unknown as Record<string, string | undefined>;
	assert.equal(opt1Style['font-family'], "'__cssd_Roboto', sans-serif");
});

test('every curated font option previews through an embedded face', () => {
	// Each editable font family must have a bundled preview face so the picker
	// renders it even when the family is not installed on the machine.
	const GENERIC = new Set([
		'system-ui',
		'-apple-system',
		'blinkmacsystemfont',
		'sans-serif',
		'serif',
		'monospace',
		'cursive',
		'fantasy',
		'inherit',
	]);
	for (const opt of FONT_OPTIONS) {
		const first = opt.value.split(',')[0]?.trim().replace(/^['"]|['"]$/g, '') ?? '';
		if (!first || GENERIC.has(first.toLowerCase())) continue;
		assert.equal(
			previewFontFamily(opt.value).split(',')[0]?.trim().replace(/^['"]|['"]$/g, ''),
			`__cssd_${first}`,
			`Option "${opt.label}" has no embedded preview face for "${first}"`
		);
	}
});

test('non-embedded font stacks pass through untouched', () => {
	assert.equal(previewFontFamily('Arial, sans-serif'), 'Arial, sans-serif');
	assert.equal(previewFontFamily('inherit'), 'inherit');
	assert.equal(previewFontFamily(''), '');
});

test('typography controls do not carry redundant bottom descriptions', () => {
	const typoControls = STYLE_CONTROLS.filter((c) => c.category === 'typography');
	assert.ok(typoControls.length >= 18, 'Typography category must have controls');
	for (const ctrl of typoControls) {
		assert.equal(
			ctrl.description,
			undefined,
			`Control ${ctrl.id} in typography should not have redundant bottom description`
		);
	}
});

test('typography spacing controls exist, are properly categorized, and have valid companion CSS', () => {
	const spacingControlIds = [
		'line-height-normal',
		'p-spacing',
		'nav-name-spacing',
		'nav-name-letter-spacing',
		'page-margin-spacing',
		'letter-spacing-body',
	];

	for (const id of spacingControlIds) {
		const ctrl = STYLE_CONTROLS.find((c) => c.id === id);
		assert.ok(ctrl, `Spacing control ${id} must exist in STYLE_CONTROLS`);
		assert.equal(ctrl.category, 'typography', `${id} must be in typography category`);
		assert.equal(ctrl.subcategory, 'Text & Page Spacing', `${id} must be in Text & Page Spacing subcategory`);
		assert.equal(ctrl.type, 'slider', `${id} must be a slider`);
		assert.ok(ctrl.companionCss, `${id} must define companionCss`);
		assertValid(ctrl.companionCss, `${id} companionCss`);
		assert.ok(ctrl.companionCss.includes(ctrl.variable), `${id} companionCss must reference variable ${ctrl.variable}`);
	}
});

test('streamlined typography UI omits bold multiplier, heading spacing, and empty subcategories', () => {
	assert.equal(STYLE_CONTROLS.find((c) => c.id === 'bold-size-multiplier'), undefined);
	assert.equal(STYLE_CONTROLS.find((c) => c.id === 'heading-spacing'), undefined);

	const subcategories = new Set(
		STYLE_CONTROLS.filter((c) => c.category === 'typography').map((c) => c.subcategory)
	);
	assert.ok(!subcategories.has('Text Formatting & Emphasis'), 'Text Formatting & Emphasis subcategory should be gone');
});




