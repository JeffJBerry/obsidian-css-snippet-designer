/**
 * Up/down navigation arrows for the vertical note-tab rail.
 *
 * The rail is Obsidian's own DOM (`.workspace-tab-header-container-inner`) and
 * is a scroll container whose scrollbar the vertical-tabs feature hides. When
 * more tabs accumulate than fit, these two buttons let the reader page through
 * them. They live on `document.body` with `position: fixed` (a child of the
 * scrolling rail would scroll away with its content), are positioned against
 * the rail's measured rect, and only appear while the rail is over-filled.
 *
 * The module is intentionally independent of the designer view: it is driven by
 * workspace layout events and per-rail observers.
 */
import { setIcon } from 'obsidian';
import { navArrowState } from './vertical-tabs-nav-state';

const RAIL_SELECTOR =
	'.workspace-split.mod-root .workspace-tabs .workspace-tab-header-container-inner';
const ARROW_CLASS = 'csi-vt-nav-arrow';
const HOST_SELECTOR = '.workspace-tabs';

interface RailNav {
	up: HTMLButtonElement;
	down: HTMLButtonElement;
	sizeObserver: ResizeObserver;
	mutationObserver: MutationObserver;
	onScroll: () => void;
}

export class VerticalTabsNav {
	private doc: Document = document;
	private navs = new Map<HTMLElement, RailNav>();
	private resizeListener: (() => void) | null = null;
	private scheduled = false;

	attach(doc: Document = document): void {
		this.doc = doc;
		this.sync();
		this.resizeListener = () => this.schedule();
		doc.defaultView?.addEventListener('resize', this.resizeListener, { passive: true });
	}

	detach(): void {
		if (this.resizeListener) {
			this.doc.defaultView?.removeEventListener('resize', this.resizeListener);
			this.resizeListener = null;
		}
		for (const rail of [...this.navs.keys()]) this.teardown(rail);
		this.navs.clear();
	}

	/** Re-scan for rails and refresh every arrow. Safe to call often. */
	sync(): void {
		const rails = Array.from(this.doc.querySelectorAll<HTMLElement>(RAIL_SELECTOR));
		const present = new Set(rails);
		for (const rail of rails) {
			if (!this.navs.has(rail)) this.setup(rail);
		}
		for (const rail of [...this.navs.keys()]) {
			if (!present.has(rail)) this.teardown(rail);
		}
		for (const rail of rails) this.update(rail, true);
	}

	private schedule(): void {
		if (this.scheduled) return;
		this.scheduled = true;
		const win = this.doc.defaultView ?? window;
		win.requestAnimationFrame(() => {
			this.scheduled = false;
			this.sync();
		});
	}

	private setup(rail: HTMLElement): void {
		const up = this.makeArrow('is-up', 'chevron-up', 'Scroll tabs up');
		const down = this.makeArrow('is-down', 'chevron-down', 'Scroll tabs down');

		const onScroll = () => this.update(rail, false);
		up.addEventListener('click', (event) => {
			event.stopPropagation();
			this.pagesBy(rail, -1);
		});
		down.addEventListener('click', (event) => {
			event.stopPropagation();
			this.pagesBy(rail, 1);
		});
		rail.addEventListener('scroll', onScroll, { passive: true });

		const sizeObserver = new ResizeObserver(() => this.update(rail, true));
		sizeObserver.observe(rail);
		const mutationObserver = new MutationObserver(() => this.update(rail, true));
		mutationObserver.observe(rail, { childList: true });

		this.navs.set(rail, { up, down, sizeObserver, mutationObserver, onScroll });
	}

	private makeArrow(mod: string, icon: string, label: string): HTMLButtonElement {
		const button = this.doc.body.createEl('button');
		button.className = `${ARROW_CLASS} ${mod}`;
		button.type = 'button';
		button.setAttribute('aria-label', label);
		setIcon(button, icon);
		return button;
	}

	private update(rail: HTMLElement, reposition: boolean): void {
		const nav = this.navs.get(rail);
		if (!nav) return;

		const vertical = getComputedStyle(rail).flexDirection === 'column';
		const state = navArrowState(rail.scrollTop, rail.clientHeight, rail.scrollHeight);
		const showUp = vertical && state.up;
		const showDown = vertical && state.down;

		nav.up.classList.toggle('is-visible', showUp);
		nav.down.classList.toggle('is-visible', showDown);

		if ((showUp || showDown) && (reposition || nav.up.style.top === '' || nav.down.style.top === '')) {
			this.position(rail, nav, showUp, showDown);
		}
	}

	/** Anchor the arrows over the rail's visible top and bottom edges. */
	private position(rail: HTMLElement, nav: RailNav, showUp: boolean, showDown: boolean): void {
		const railRect = rail.getBoundingClientRect();
		const host = rail.closest(HOST_SELECTOR) ?? rail;
		const hostRect = host.getBoundingClientRect();
		const left = `${Math.round(railRect.left + railRect.width / 2)}px`;
		if (showUp) {
			nav.up.style.left = left;
			nav.up.style.top = `${Math.round(Math.max(railRect.top, hostRect.top) + 6)}px`;
		}
		if (showDown) {
			nav.down.style.left = left;
			nav.down.style.top = `${Math.round(Math.min(railRect.bottom, hostRect.bottom) - 28)}px`;
		}
	}

	private pagesBy(rail: HTMLElement, direction: 1 | -1): void {
		const step = Math.max(Math.round(rail.clientHeight * 0.8), 80);
		rail.scrollBy({ top: direction * step, behavior: 'smooth' });
	}

	private teardown(rail: HTMLElement): void {
		const nav = this.navs.get(rail);
		if (!nav) return;
		nav.sizeObserver.disconnect();
		nav.mutationObserver.disconnect();
		rail.removeEventListener('scroll', nav.onScroll);
		nav.up.remove();
		nav.down.remove();
		this.navs.delete(rail);
	}
}
