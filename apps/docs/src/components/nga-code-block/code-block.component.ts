import { Component, OnDestroy, computed, input, signal } from '@angular/core';

/**
 * Turns source code into highlighted HTML. Plug in any highlighter you
 * like (highlight.js, Prism, Shiki…) — the component ships none, so it
 * adds no dependency to your app. The returned HTML goes through
 * Angular's sanitizer: `<span class="…">` survives, inline styles do not.
 */
export type NgAtomsCodeHighlighter = (code: string, language: string) => string;

@Component({
  selector: 'nga-code-block',
  standalone: true,
  templateUrl: './code-block.component.html',
  host: {
    class: 'nga-code-block',
    '[class.nga-code-block--line-numbers]': 'lineNumbers()',
  },
})
export class NgAtomsCodeBlockComponent implements OnDestroy {
  readonly code = input.required<string>();
  /** Language id, shown in the header and passed to the highlighter. */
  readonly language = input<string>('');
  /** File name shown in the header instead of the language. */
  readonly filename = input<string>('');
  readonly lineNumbers = input<boolean>(false);
  readonly copyable = input<boolean>(true);
  readonly highlighter = input<NgAtomsCodeHighlighter | null>(null);
  readonly copyLabel = input<string>('Copy code');
  readonly copiedLabel = input<string>('Copied');

  readonly copied = signal(false);

  readonly source = computed(() => this.code().replace(/^\n+|\s+$/g, ''));
  readonly title = computed(() => this.filename() || this.language());
  readonly showHeader = computed(() => !!this.title() || this.copyable());

  /** Highlighted HTML, or null to render the source as plain text. */
  readonly html = computed(() => {
    const highlight = this.highlighter();
    return highlight ? highlight(this.source(), this.language()) : null;
  });

  readonly gutter = computed(() =>
    this.source().split('\n').map((_, i) => i + 1).join('\n'),
  );

  private resetTimer: ReturnType<typeof setTimeout> | null = null;

  async copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.source());
    } catch {
      // Clipboard unavailable (insecure context or denied permission).
      return;
    }
    this.copied.set(true);
    if (this.resetTimer !== null) clearTimeout(this.resetTimer);
    this.resetTimer = setTimeout(() => this.copied.set(false), 2000);
  }

  ngOnDestroy(): void {
    if (this.resetTimer !== null) clearTimeout(this.resetTimer);
  }
}
