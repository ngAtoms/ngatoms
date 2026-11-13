import { Component, ElementRef, input, model, output, signal, viewChild } from '@angular/core';

export type NgAtomsFileRejectionReason = 'type' | 'size' | 'count';

export interface NgAtomsFileRejection {
  file: File;
  reason: NgAtomsFileRejectionReason;
}

@Component({
  selector: 'nga-file-upload',
  standalone: true,
  templateUrl: './file-upload.component.html',
  host: {
    class: 'nga-file-upload',
    '[class.nga-file-upload--disabled]': 'disabled()',
    '[class.nga-file-upload--dragover]': 'dragover()',
  },
})
export class NgAtomsFileUploadComponent {
  private readonly inputEl = viewChild.required<ElementRef<HTMLInputElement>>('inputEl');

  readonly files = model<File[]>([]);
  /** Same syntax as the native `accept` attribute: `.pdf,image/*,text/plain`. */
  readonly accept = input<string>('');
  readonly multiple = input<boolean>(false);
  /** Maximum size per file, in bytes. */
  readonly maxSize = input<number>(Infinity);
  /** Maximum number of files kept when `multiple` is on. */
  readonly maxFiles = input<number>(Infinity);
  readonly disabled = input<boolean>(false);
  /** Accessible name of the file input. */
  readonly label = input<string>('Upload files');

  /** Emits the files that were dropped or picked but not accepted. */
  readonly rejected = output<NgAtomsFileRejection[]>();

  readonly dragover = signal(false);

  onChange(event: Event): void {
    const field = event.target as HTMLInputElement;
    this.addFiles(Array.from(field.files ?? []));
    // Reset so picking the same file again still fires `change`.
    field.value = '';
  }

  onDragOver(event: DragEvent): void {
    if (this.disabled()) return;
    event.preventDefault();
    this.dragover.set(true);
  }

  onDragLeave(): void {
    this.dragover.set(false);
  }

  onDrop(event: DragEvent): void {
    if (this.disabled()) return;
    event.preventDefault();
    this.dragover.set(false);
    this.addFiles(Array.from(event.dataTransfer?.files ?? []));
  }

  remove(index: number): void {
    if (this.disabled()) return;
    this.files.update(files => files.filter((_, i) => i !== index));
    this.inputEl().nativeElement.focus();
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    const units = ['KB', 'MB', 'GB', 'TB'];
    let value = bytes / 1024;
    let unit = 0;
    while (value >= 1024 && unit < units.length - 1) {
      value /= 1024;
      unit++;
    }
    return `${value >= 10 ? Math.round(value) : value.toFixed(1)} ${units[unit]}`;
  }

  private addFiles(incoming: File[]): void {
    if (this.disabled() || !incoming.length) return;

    const rejections: NgAtomsFileRejection[] = [];
    const accepted: File[] = [];

    for (const file of incoming) {
      if (!this.matchesAccept(file)) rejections.push({ file, reason: 'type' });
      else if (file.size > this.maxSize()) rejections.push({ file, reason: 'size' });
      else accepted.push(file);
    }

    // Single mode replaces the selection; multiple mode appends to it.
    const limit = this.multiple() ? this.maxFiles() : 1;
    const base = this.multiple() ? this.files() : [];
    const room = Math.max(0, limit - base.length);
    accepted.slice(room).forEach(file => rejections.push({ file, reason: 'count' }));

    const next = [...base, ...accepted.slice(0, room)];
    if (accepted.length && room > 0) this.files.set(next);
    if (rejections.length) this.rejected.emit(rejections);
  }

  private matchesAccept(file: File): boolean {
    const tokens = this.accept().split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
    if (!tokens.length) return true;

    const name = file.name.toLowerCase();
    const type = file.type.toLowerCase();
    return tokens.some(token => {
      if (token.startsWith('.')) return name.endsWith(token);
      if (token.endsWith('/*')) return type.startsWith(token.slice(0, -1));
      return type === token;
    });
  }
}
