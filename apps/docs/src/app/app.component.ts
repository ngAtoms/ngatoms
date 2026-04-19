import { Component, signal, effect, inject, DOCUMENT, AfterViewInit, OnDestroy } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements AfterViewInit, OnDestroy {
  private readonly document = inject(DOCUMENT);

  readonly isDark = signal(true);
  readonly scrolled = signal(false);

  private readonly onScroll = () => this.scrolled.set(this.document.documentElement.scrollTop > 4);

  constructor() {
    effect(() => {
      this.document.documentElement.classList.toggle('dark', this.isDark());
    });
  }

  ngAfterViewInit() {
    this.document.defaultView?.addEventListener('scroll', this.onScroll, { passive: true });
  }

  ngOnDestroy() {
    this.document.defaultView?.removeEventListener('scroll', this.onScroll);
  }

  toggleTheme(): void {
    this.isDark.update(v => !v);
  }
}
