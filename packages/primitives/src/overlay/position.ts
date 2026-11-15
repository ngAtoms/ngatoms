/**
 * @file Positioning for floating panels: where a panel goes next to its
 * anchor, flipping to the other side or clamping to stay in the viewport.
 */

export type NgAtomsOverlayPlacement = 'top' | 'bottom' | 'left' | 'right';
export type NgAtomsOverlayAlign = 'start' | 'center' | 'end';

export interface NgAtomsOverlayRect {
  top: number;
  left: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

export interface NgAtomsOverlayPositionOptions {
  placement: NgAtomsOverlayPlacement;
  /** Alignment on the cross axis. Defaults to `center`. */
  align?: NgAtomsOverlayAlign;
  /** Distance between anchor and panel, in px. Defaults to 8. */
  gap?: number;
  /** Minimum distance kept from the viewport edges, in px. Defaults to 8. */
  margin?: number;
  /** Viewport size. Defaults to the window's inner size. */
  viewport?: { width: number; height: number };
}

export interface NgAtomsOverlayPosition {
  top: number;
  left: number;
  /** The placement actually used, after flipping. */
  placement: NgAtomsOverlayPlacement;
}

const OPPOSITE: Record<NgAtomsOverlayPlacement, NgAtomsOverlayPlacement> = {
  top: 'bottom',
  bottom: 'top',
  left: 'right',
  right: 'left',
};

/** Top-left corner of a panel placed on one side of an anchor, with the given alignment. */
function coords(
  p: NgAtomsOverlayPlacement,
  a: NgAtomsOverlayAlign,
  anchor: NgAtomsOverlayRect,
  panel: { width: number; height: number },
  gap: number,
): { top: number; left: number } {
  if (p === 'left' || p === 'right') {
    const left = p === 'left' ? anchor.left - panel.width - gap : anchor.right + gap;
    const top =
      a === 'start' ? anchor.top :
      a === 'end'   ? anchor.bottom - panel.height :
                      anchor.top + anchor.height / 2 - panel.height / 2;
    return { top, left };
  }

  const top = p === 'bottom' ? anchor.bottom + gap : anchor.top - panel.height - gap;
  const left =
    a === 'start' ? anchor.left :
    a === 'end'   ? anchor.right - panel.width :
                    anchor.left + anchor.width / 2 - panel.width / 2;
  return { top, left };
}

/**
 * Computes fixed-position coordinates for a floating panel anchored to a
 * rect. Tries the preferred placement, flips to the opposite side when it
 * does not fit, and otherwise clamps the preferred placement into the
 * viewport. The grid filter is the caller.
 */
export function computeOverlayPosition(
  anchor: NgAtomsOverlayRect,
  panel: { width: number; height: number },
  options: NgAtomsOverlayPositionOptions,
): NgAtomsOverlayPosition {
  const { placement, align = 'center', gap = 8, margin = 8 } = options;
  const vw = options.viewport?.width ?? window.innerWidth;
  const vh = options.viewport?.height ?? window.innerHeight;

  /** Whether a panel at these coordinates stays inside the viewport margins. */
  const fits = (c: { top: number; left: number }): boolean =>
    c.top >= margin &&
    c.left >= margin &&
    c.top + panel.height <= vh - margin &&
    c.left + panel.width <= vw - margin;

  const preferred = coords(placement, align, anchor, panel, gap);
  if (fits(preferred)) return { ...preferred, placement };

  const fallback = coords(OPPOSITE[placement], align, anchor, panel, gap);
  if (fits(fallback)) return { ...fallback, placement: OPPOSITE[placement] };

  return {
    top: Math.max(margin, Math.min(preferred.top, vh - panel.height - margin)),
    left: Math.max(margin, Math.min(preferred.left, vw - panel.width - margin)),
    placement,
  };
}
