/**
 * Task checkbox marker shapes, emitted as CSS mask images.
 */

export function getCheckboxMarkerSvg(style: string): { maskImage: string; maskSize: string; maskPos: string; display: string } {
	switch (style) {
		case 'fill':
			return {
				maskImage: 'none',
				maskSize: '100% 100%',
				maskPos: '50% 50%',
				display: 'none',
			};
		case 'x':
			return {
				maskImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12'%3E%3Cpath d='M2.5 2.5 L9.5 9.5 M9.5 2.5 L2.5 9.5' fill='none' stroke='%23000000' stroke-width='2.2' stroke-linecap='round'/%3E%3C/svg%3E")`,
				maskSize: '70% 70%',
				maskPos: '50% 50%',
				display: 'block',
			};
		case 'smiley':
			return {
				maskImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Ccircle cx='5' cy='5.5' r='1.3' fill='%23000000'/%3E%3Ccircle cx='11' cy='5.5' r='1.3' fill='%23000000'/%3E%3Cpath d='M4 9 C 5.5 12.5%2C 10.5 12.5%2C 12 9' fill='none' stroke='%23000000' stroke-width='1.8' stroke-linecap='round'/%3E%3C/svg%3E")`,
				maskSize: '80% 80%',
				maskPos: '50% 50%',
				display: 'block',
			};
		case 'sad':
			return {
				maskImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Ccircle cx='5' cy='6' r='1.3' fill='%23000000'/%3E%3Ccircle cx='11' cy='6' r='1.3' fill='%23000000'/%3E%3Cpath d='M4 11.5 C 5.5 8.5%2C 10.5 8.5%2C 12 11.5' fill='none' stroke='%23000000' stroke-width='1.8' stroke-linecap='round'/%3E%3C/svg%3E")`,
				maskSize: '80% 80%',
				maskPos: '50% 50%',
				display: 'block',
			};
		case 'checkmark':
		default:
			return {
				maskImage: `url("data:image/svg+xml,%3Csvg width='12px' height='10px' viewBox='0 0 12 8' version='1.1' xmlns='http://www.w3.org/2000/svg'%3E%3Cg stroke='none' stroke-width='1' fill='none' fill-rule='evenodd'%3E%3Cg transform='translate(-4.000000, -6.000000)' fill='%23000000'%3E%3Cpath d='M8.1043257,14.0367999 L4.52468714,10.5420499 C4.32525014,10.3497722 4.32525014,10.0368095 4.52468714,9.8424863 L5.24777413,9.1439454 C5.44721114,8.95166768 5.77142411,8.95166768 5.97086112,9.1439454 L8.46638057,11.5903727 L14.0291389,6.1442083 C14.2285759,5.95193057 14.5527889,5.95193057 14.7522259,6.1442083 L15.4753129,6.84377194 C15.6747499,7.03604967 15.6747499,7.35003511 15.4753129,7.54129009 L8.82741268,14.0367999 C8.62797568,14.2290777 8.3037627,14.2290777 8.1043257,14.0367999'%3E%3C/path%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
				maskSize: '65% 65%',
				maskPos: '52% 52%',
				display: 'block',
			};
	}
}

export function generateCheckboxStyleRules(scope: string, tokenMap: Map<string, string>): string {
	const style = tokenMap.get('--checkbox-style') ?? 'checkmark';
	const info = getCheckboxMarkerSvg(style);
	if (info.display === 'none') {
		return `${scope} input[type="checkbox"].task-list-item-checkbox:checked::after,\n${scope} .task-list-item-checkbox:checked::after,\n${scope} .markdown-rendered input[type="checkbox"]:checked::after,\n${scope} .cm-content input[type="checkbox"]:checked::after {\n  display: none !important;\n}\n${scope} input[type="checkbox"].task-list-item-checkbox:checked,\n${scope} .task-list-item-checkbox:checked,\n${scope} .markdown-rendered input[type="checkbox"]:checked,\n${scope} .cm-content input[type="checkbox"]:checked {\n  background-color: var(--checkbox-color) !important;\n  border-color: var(--checkbox-border-color, var(--checkbox-color)) !important;\n}\n`;
	}
	return `${scope} input[type="checkbox"].task-list-item-checkbox:checked::after,\n${scope} .task-list-item-checkbox:checked::after,\n${scope} .markdown-rendered input[type="checkbox"]:checked::after,\n${scope} .cm-content input[type="checkbox"]:checked::after {\n  display: block !important;\n  content: "" !important;\n  position: absolute !important;\n  top: -1px !important;\n  inset-inline-start: -1px !important;\n  width: var(--checkbox-size, 16px) !important;\n  height: var(--checkbox-size, 16px) !important;\n  background-color: var(--checkbox-marker-color, #ffffff) !important;\n  -webkit-mask-image: ${info.maskImage} !important;\n  mask-image: ${info.maskImage} !important;\n  -webkit-mask-size: ${info.maskSize} !important;\n  mask-size: ${info.maskSize} !important;\n  -webkit-mask-position: ${info.maskPos} !important;\n  mask-position: ${info.maskPos} !important;\n  -webkit-mask-repeat: no-repeat !important;\n  mask-repeat: no-repeat !important;\n}\n`;
}

/**
 * Generates dual-mode CSS rules and companion DOM bindings, injecting into both
 * the main vault window and any popout windows.
 *
 * When varsOnly is true, only the lightweight CSS variables style tag is regenerated,
 * skipping costly selector parsing, SVG masks, frosted glass CSS, and keyframe animations.
 */
