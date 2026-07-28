/**
 * Date Utilities for Indian Standard Time (IST) formatting (DD-MM-YYYY)
 */

/**
 * Returns date formatted as DD-MM-YYYY in Indian Standard Time (Asia/Kolkata)
 */
export function getIndianDateString(input?: Date | string | number): string {
  if (!input) {
    const now = new Date();
    return formatToDDMMYYYYParts(now);
  }

  if (typeof input === 'string') {
    const trimmed = input.trim();
    // Already in DD-MM-YYYY format
    if (/^\d{2}-\d{2}-\d{4}$/.test(trimmed)) {
      return trimmed;
    }
    // Standard ISO YYYY-MM-DD format
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const [y, m, d] = trimmed.split('-');
      return `${d}-${m}-${y}`;
    }
    // ISO string with T
    if (trimmed.includes('T') || trimmed.includes(':')) {
      const dateObj = new Date(trimmed);
      if (!isNaN(dateObj.getTime())) {
        return formatToDDMMYYYYParts(dateObj);
      }
    }
  }

  const date = new Date(input);
  if (isNaN(date.getTime())) {
    return String(input);
  }

  return formatToDDMMYYYYParts(date);
}

function formatToDDMMYYYYParts(date: Date): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    const parts = formatter.formatToParts(date);
    const day = parts.find(p => p.type === 'day')?.value || '01';
    const month = parts.find(p => p.type === 'month')?.value || '01';
    const year = parts.find(p => p.type === 'year')?.value || '2026';
    return `${day}-${month}-${year}`;
  } catch (err) {
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = date.getFullYear();
    return `${d}-${m}-${y}`;
  }
}

/**
 * Returns time formatted as hh:mm:ss AM/PM or hh:mm AM/PM in IST
 */
export function getIndianTimeString(input?: Date | string | number): string {
  const date = input ? new Date(input) : new Date();
  if (isNaN(date.getTime())) return '';
  try {
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }).format(date);
  } catch (err) {
    return date.toLocaleTimeString();
  }
}

/**
 * Returns combined DD-MM-YYYY hh:mm:ss AM/PM in IST
 */
export function getIndianDateTimeString(input?: Date | string | number): string {
  const dateStr = getIndianDateString(input);
  const timeStr = getIndianTimeString(input);
  return `${dateStr} ${timeStr}`.trim();
}

/**
 * Helper to convert HTML <input type="date"> value (YYYY-MM-DD) to DD-MM-YYYY
 */
export function convertInputDateToDDMMYYYY(isoDate: string): string {
  if (!isoDate) return getIndianDateString();
  if (/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
    const [y, m, d] = isoDate.split('-');
    return `${d}-${m}-${y}`;
  }
  return getIndianDateString(isoDate);
}

/**
 * Parses a DD-MM-YYYY string into a Date (midnight local time). Returns null if invalid/empty.
 */
export function parseDDMMYYYYToDate(ddmmyyyy: string): Date | null {
  if (!ddmmyyyy) return null;
  const match = ddmmyyyy.trim().match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (!match) return null;
  const date = new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]));
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Checks whether `dateStr` (DD-MM-YYYY) falls within [fromStr, toStr] inclusive (both DD-MM-YYYY).
 * Returns false if dateStr or fromStr is missing/unparseable.
 */
export function isDateWithinRange(dateStr: string, fromStr: string, toStr: string): boolean {
  const date = parseDDMMYYYYToDate(dateStr);
  const from = parseDDMMYYYYToDate(fromStr);
  if (!date || !from) return false;
  const to = parseDDMMYYYYToDate(toStr) || from;
  return date >= from && date <= to;
}

/**
 * Helper to convert DD-MM-YYYY to YYYY-MM-DD for HTML <input type="date">
 */
export function convertDDMMYYYYToInputDate(ddmmyyyy: string): string {
  if (!ddmmyyyy) {
    const [d, m, y] = getIndianDateString().split('-');
    return `${y}-${m}-${d}`;
  }
  if (/^\d{2}-\d{2}-\d{4}$/.test(ddmmyyyy)) {
    const [d, m, y] = ddmmyyyy.split('-');
    return `${y}-${m}-${d}`;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(ddmmyyyy)) {
    return ddmmyyyy;
  }
  return new Date().toISOString().substring(0, 10);
}
