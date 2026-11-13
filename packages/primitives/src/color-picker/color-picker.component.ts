import { Component, computed, effect, input, model, signal, untracked } from '@angular/core';

interface Hsv {
  /** Hue 0–360. */
  h: number;
  /** Saturation 0–1. */
  s: number;
  /** Value (brightness) 0–1. */
  v: number;
}

const HEX_PATTERN = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;

function hsvToHex({ h, s, v }: Hsv): string {
  const f = (n: number): string => {
    const k = (n + h / 60) % 6;
    const channel = v - v * s * Math.max(0, Math.min(k, 4 - k, 1));
    return Math.round(channel * 255).toString(16).padStart(2, '0');
  };
  return `#${f(5)}${f(3)}${f(1)}`;
}

function hexToHsv(hex: string): Hsv | null {
  const match = HEX_PATTERN.exec(hex.trim());
  if (!match) return null;

  let digits = match[1];
  if (digits.length === 3) digits = digits.split('').map(c => c + c).join('');

  const r = parseInt(digits.slice(0, 2), 16) / 255;
  const g = parseInt(digits.slice(2, 4), 16) / 255;
  const b = parseInt(digits.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const delta = max - Math.min(r, g, b);

  let h = 0;
  if (delta) {
    if (max === r) h = ((g - b) / delta) % 6;
    else if (max === g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;
    h = (h * 60 + 360) % 360;
  }
  return { h, s: max ? delta / max : 0, v: max };
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

@Component({
  selector: 'nga-color-picker',
  standalone: true,
  templateUrl: './color-picker.component.html',
  host: {
    class: 'nga-color-picker',
    role: 'group',
    '[attr.aria-label]': 'label()',
    '[class.nga-color-picker--disabled]': 'disabled()',
  },
})
export class NgAtomsColorPickerComponent {
  /** Selected color as a 6-digit hex string, e.g. `#3366ff`. */
  readonly value = model<string>('#333333');
  /** Preset colors shown as one-click swatches. */
  readonly swatches = input<string[]>([]);
  readonly disabled = input<boolean>(false);
  readonly label = input<string>('Color picker');

  /**
   * HSV is the source of truth while dragging: hex alone loses the hue at
   * black/white/gray, which would make the thumbs jump.
   */
  readonly hsv = signal<Hsv>({ h: 0, s: 0, v: 0.2 });

  /** Fully saturated color of the current hue, behind the saturation area. */
  readonly hueColor = computed(() => hsvToHex({ h: this.hsv().h, s: 1, v: 1 }));
  readonly saturationPercent = computed(() => Math.round(this.hsv().s * 100));
  readonly brightnessPercent = computed(() => Math.round(this.hsv().v * 100));
  readonly hueDegrees = computed(() => Math.round(this.hsv().h));

  constructor() {
    // Adopt external value changes, ignoring echoes of our own writes.
    effect(() => {
      const parsed = hexToHsv(this.value());
      untracked(() => {
        if (parsed && hsvToHex(parsed) !== hsvToHex(this.hsv())) this.hsv.set(parsed);
      });
    });
  }

  isSelected(swatch: string): boolean {
    const parsed = hexToHsv(swatch);
    return !!parsed && hsvToHex(parsed) === this.value().toLowerCase();
  }

  setHex(hex: string): void {
    if (this.disabled()) return;
    const parsed = hexToHsv(hex);
    if (!parsed) return;
    this.hsv.set(parsed);
    this.value.set(hsvToHex(parsed));
  }

  onHexChange(event: Event): void {
    const field = event.target as HTMLInputElement;
    this.setHex(field.value);
    // Normalise what is shown, and restore it when the input was not a color.
    field.value = this.value();
  }

  onAreaPointer(event: PointerEvent, start: boolean): void {
    const area = event.currentTarget as HTMLElement;
    if (this.disabled()) return;
    if (start) {
      if (event.button !== 0) return;
      event.preventDefault();
      area.setPointerCapture(event.pointerId);
      (area.querySelector('.nga-color-picker__area-thumb') as HTMLElement | null)?.focus();
    } else if (!area.hasPointerCapture(event.pointerId)) {
      return;
    }

    const rect = area.getBoundingClientRect();
    this.update({
      s: clamp((event.clientX - rect.left) / rect.width, 0, 1),
      v: 1 - clamp((event.clientY - rect.top) / rect.height, 0, 1),
    });
  }

  onHuePointer(event: PointerEvent, start: boolean): void {
    const track = event.currentTarget as HTMLElement;
    if (this.disabled()) return;
    if (start) {
      if (event.button !== 0) return;
      event.preventDefault();
      track.setPointerCapture(event.pointerId);
      (track.querySelector('.nga-color-picker__hue-thumb') as HTMLElement | null)?.focus();
    } else if (!track.hasPointerCapture(event.pointerId)) {
      return;
    }

    const rect = track.getBoundingClientRect();
    this.update({ h: clamp((event.clientX - rect.left) / rect.width, 0, 1) * 360 });
  }

  onPointerEnd(event: PointerEvent): void {
    const target = event.currentTarget as HTMLElement;
    if (target.hasPointerCapture(event.pointerId)) target.releasePointerCapture(event.pointerId);
  }

  onAreaKeydown(event: KeyboardEvent): void {
    if (this.disabled()) return;
    const step = event.shiftKey ? 0.1 : 0.01;
    const { s, v } = this.hsv();

    switch (event.key) {
      case 'ArrowRight': this.update({ s: clamp(s + step, 0, 1) }); break;
      case 'ArrowLeft':  this.update({ s: clamp(s - step, 0, 1) }); break;
      case 'ArrowUp':    this.update({ v: clamp(v + step, 0, 1) }); break;
      case 'ArrowDown':  this.update({ v: clamp(v - step, 0, 1) }); break;
      default: return;
    }
    event.preventDefault();
  }

  onHueKeydown(event: KeyboardEvent): void {
    if (this.disabled()) return;
    const step = event.shiftKey ? 10 : 1;
    const { h } = this.hsv();

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        this.update({ h: clamp(h + step, 0, 360) });
        break;
      case 'ArrowLeft':
      case 'ArrowDown':
        this.update({ h: clamp(h - step, 0, 360) });
        break;
      case 'Home': this.update({ h: 0 }); break;
      case 'End':  this.update({ h: 360 }); break;
      default: return;
    }
    event.preventDefault();
  }

  private update(patch: Partial<Hsv>): void {
    const next = { ...this.hsv(), ...patch };
    this.hsv.set(next);
    this.value.set(hsvToHex(next));
  }
}
