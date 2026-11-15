/**
 * @file Tag input: a text field that turns what is typed into removable
 * tags.
 */

import {
  Component,
  ElementRef,
  Renderer2,
  computed,
  effect,
  inject,
  input,
  model,
  viewChild,
} from '@angular/core';

export type NgAtomsTagInputSize = 'sm' | 'md' | 'lg';

/** Tag input: a text field that turns what is typed into removable tags. */
@Component({
  selector: 'nga-tag-input',
  standalone: true,
  templateUrl: './tag-input.component.html',
  host: {
    class: 'nga-tag-input',
    '[class.nga-tag-input--disabled]': 'disabled()',
    '[class.nga-tag-input--invalid]': 'invalid()',
    '(click)': 'focus()',
  },
})
export class NgAtomsTagInputComponent {
  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly renderer = inject(Renderer2);
  private readonly field = viewChild.required<ElementRef<HTMLInputElement>>('field');

  readonly tags = model<string[]>([]);
  readonly placeholder = input<string>('');
  /** Maximum number of tags. */
  readonly max = input<number>(Infinity);
  readonly allowDuplicates = input<boolean>(false);
  /** Characters that commit the current text as a tag, besides Enter. */
  readonly separators = input<string[]>([',']);
  readonly size = input<NgAtomsTagInputSize>('md');
  readonly disabled = input<boolean>(false);
  readonly invalid = input<boolean>(false);
  /** Accessible name of the text field. */
  readonly label = input<string>('Add tag');

  readonly atMax = computed(() => this.tags().length >= this.max());

  private _prevSize: NgAtomsTagInputSize = 'md';

  constructor() {
    effect(() => {
      const s = this.size();
      this.renderer.removeClass(this.el.nativeElement, `nga-tag-input--${this._prevSize}`);
      this.renderer.addClass(this.el.nativeElement, `nga-tag-input--${s}`);
      this._prevSize = s;
    });
  }

  /** Focuses the text field. */
  focus(): void {
    if (!this.disabled()) this.field().nativeElement.focus();
  }

  /** Adds one tag. Returns false when it was rejected (empty, duplicate or over max). */
  add(raw: string): boolean {
    const tag = raw.trim();
    if (!tag || this.disabled() || this.atMax()) return false;
    if (!this.allowDuplicates() && this.tags().some(t => t.toLowerCase() === tag.toLowerCase())) {
      return false;
    }
    this.tags.update(tags => [...tags, tag]);
    return true;
  }

  /** Removes a tag and returns focus to the field. */
  remove(index: number): void {
    if (this.disabled()) return;
    this.tags.update(tags => tags.filter((_, i) => i !== index));
    this.focus();
  }

  /** Turns the pending text into a tag. Rejected text stays so it can be edited. */
  commit(): void {
    const field = this.field().nativeElement;
    if (this.add(field.value) || !field.value.trim()) field.value = '';
  }

  /**
   * Enter or a separator adds the typed text; Backspace in an empty field
   * removes the last tag. Enter with nothing typed is left alone, so it can
   * submit the surrounding form.
   */
  onKeydown(event: KeyboardEvent): void {
    const field = this.field().nativeElement;

    if (event.key === 'Enter' || this.separators().includes(event.key)) {
      if (event.key === 'Enter' && !field.value.trim()) return;
      event.preventDefault();
      this.commit();
    } else if (event.key === 'Backspace' && !field.value && this.tags().length) {
      this.remove(this.tags().length - 1);
    }
  }

  /** Turns pasted text holding several values into one tag each. */
  onPaste(event: ClipboardEvent): void {
    const text = event.clipboardData?.getData('text') ?? '';
    const parts = this.split(text);
    if (parts.length < 2) return;

    event.preventDefault();
    parts.forEach(part => this.add(part));
  }

  /** Splits text on line breaks, tabs and the separators. */
  private split(text: string): string[] {
    const separators = ['\n', '\r', '\t', ...this.separators()];
    let parts = [text];
    for (const sep of separators) parts = parts.flatMap(p => p.split(sep));
    return parts.map(p => p.trim()).filter(Boolean);
  }
}
