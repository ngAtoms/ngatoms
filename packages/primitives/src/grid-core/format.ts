/**
 * @file Number formatting on top of `Intl.NumberFormat`:
 * negatives in parentheses, scaling, zero placeholders, percentages and sign
 * reversal, plus the favorable/unfavorable reading of a variance.
 */

import { GridCellValue, GridColumn, GridNumberFormat, GridRow } from './types';
import { toNumber } from './value';

/** How a variance reads for a given row. */
export type GridVarianceTone = 'favorable' | 'unfavorable';

/** Formats raw cell values for display. */
export interface GridNumberFormatter {
  /**
   * Formats a value.
   * Non-numeric values are returned as text; empty values as an empty string.
   */
  format(value: GridCellValue, format?: GridNumberFormat): string;
}

const DEFAULT_DECIMALS = 2;
const DEFAULT_PERCENT_DECIMALS = 1;

/** Number of decimals a format displays. */
function decimalsOf(format: GridNumberFormat): number {
  return format.decimals ?? (format.style === 'percent' ? DEFAULT_PERCENT_DECIMALS : DEFAULT_DECIMALS);
}

/**
 * Applies the display-only transformations of a format: sign reversal
 * first, then scaling.
 */
function toDisplayNumber(value: number, format: GridNumberFormat): number {
  const signed = format.reverseSign ? -value : value;
  return format.scale ? signed / format.scale : signed;
}

/**
 * Whether a number shows as zero at the given precision.
 * Percentages are multiplied by 100 on display, hence the two extra digits.
 */
function roundsToZero(value: number, format: GridNumberFormat): boolean {
  const digits = decimalsOf(format) + (format.style === 'percent' ? 2 : 0);
  return Number(value.toFixed(digits)) === 0;
}

/**
 * Merges the formats that apply to a cell.
 * The row wins over the column: a percentage line dictates its
 * own format whatever column it crosses.
 */
export function resolveFormat<T>(row: GridRow<T>, column: GridColumn<T>): GridNumberFormat | undefined {
  if (!row.format) return column.format;
  if (!column.format) return row.format;
  return { ...column.format, ...row.format };
}

/**
 * Creates a formatter for a locale.
 * `Intl.NumberFormat` instances are expensive to build, so one is kept per
 * distinct combination of style and precision.
 *
 * @param locale BCP 47 tag; defaults to the runtime's locale.
 */
export function createNumberFormatter(locale?: string): GridNumberFormatter {
  const cache = new Map<string, Intl.NumberFormat>();

  /** Returns the cached `Intl.NumberFormat` for a format, creating it on first use. */
  const intlFor = (format: GridNumberFormat): Intl.NumberFormat => {
    const style = format.style ?? 'number';
    const decimals = decimalsOf(format);
    const key = `${style}:${decimals}`;
    let intl = cache.get(key);
    if (!intl) {
      intl = new Intl.NumberFormat(locale, {
        style: style === 'percent' ? 'percent' : 'decimal',
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });
      cache.set(key, intl);
    }
    return intl;
  };

  return {
    /** @inheritdoc */
    format(value, format = {}) {
      const raw = toNumber(value);
      if (raw === null) return value === null || value === undefined ? '' : String(value);

      const n = toDisplayNumber(raw, format);
      if (roundsToZero(n, format)) return format.zero ?? intlFor(format).format(0);
      if (n < 0 && format.negative === 'parentheses') return `(${intlFor(format).format(-n)})`;
      return intlFor(format).format(n);
    },
  };
}

/**
 * Reads a variance as good or bad news for a row.
 * A positive variance is favorable when higher is better and unfavorable
 * when lower is better. The raw value is judged,
 * before any display-only sign reversal.
 *
 * @returns The tone, or null when the value is empty, non-numeric or zero.
 */
export function varianceTone<T>(value: GridCellValue, row: GridRow<T>): GridVarianceTone | null {
  const n = toNumber(value);
  if (n === null || n === 0) return null;
  const higherIsBetter = (row.favorable ?? 'higher') === 'higher';
  return n > 0 === higherIsBetter ? 'favorable' : 'unfavorable';
}
