import { Component, input, signal, OnInit, OnDestroy, inject, PLATFORM_ID, NgZone } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface TocItem {
  id: string;
  label: string;
}

@Component({
  selector: 'app-toc',
  standalone: true,
  templateUrl: './toc.component.html',
  styleUrl: './toc.component.css',
})
export class TocComponent implements OnInit, OnDestroy {
  private platformId = inject(PLATFORM_ID);
  private zone = inject(NgZone);

  readonly items = input.required<TocItem[]>();

  activeTocId = signal('');

  private onScroll = () => {
    const offset = 56 + 32;
    const tocItems = this.items();
    if (!tocItems.length) return;
    let active = tocItems[0].id;
    for (const { id } of tocItems) {
      const el = document.getElementById(id);
      if (el && el.getBoundingClientRect().top - offset <= 0) active = id;
    }
    this.activeTocId.set(active);
  };

  ngOnInit() {
    const tocItems = this.items();
    if (tocItems.length) this.activeTocId.set(tocItems[0].id);
    if (!isPlatformBrowser(this.platformId)) return;
    this.zone.runOutsideAngular(() => window.addEventListener('scroll', this.onScroll, { passive: true }));
  }

  ngOnDestroy() {
    if (isPlatformBrowser(this.platformId)) window.removeEventListener('scroll', this.onScroll);
  }

  scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
