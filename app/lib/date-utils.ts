// Date utility functions to handle timezone issues consistently

/**
 * Format a date for the highlighted stocks API (YYYY-MM-DD format)
 * Uses UTC noon time to avoid timezone date shifting
 */
export function formatDateForHighlightedAPI(date: Date): string {
  // Create a UTC date at noon to avoid any timezone day shifting
  const utcDate = new Date(Date.UTC(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    12, 0, 0
  ));
  return utcDate.toISOString().split('T')[0];
}

/**
 * Format a date for the portfolio API (MM/DD/YYYY format)
 * Uses UTC noon time to avoid timezone date shifting
 */
export function formatDateForPortfolioAPI(date: Date): string {
  // Create a UTC date at noon to avoid any timezone day shifting
  const utcDate = new Date(Date.UTC(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    12, 0, 0
  ));
  const year = utcDate.getUTCFullYear();
  const month = String(utcDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(utcDate.getUTCDate()).padStart(2, '0');
  return `${month}/${day}/${year}`;
}

/**
 * Parse a date string in MM/DD/YYYY format to a Date object
 * Creates the date in UTC at noon to avoid timezone shifting
 */
export function parseDateString(dateString: string): Date | null {
  try {
    // Handle MM/DD/YYYY format
    if (dateString.includes('/')) {
      const [month, day, year] = dateString.split('/');
      // Create date in UTC at noon to avoid timezone shifting
      return new Date(Date.UTC(
        parseInt(year), 
        parseInt(month) - 1, 
        parseInt(day),
        12, 0, 0
      ));
    }
    // Handle YYYY-MM-DD format
    const [year, month, day] = dateString.split('-');
    // Create date in UTC at noon to avoid timezone shifting
    return new Date(Date.UTC(
      parseInt(year), 
      parseInt(month) - 1, 
      parseInt(day),
      12, 0, 0
    ));
  } catch (error) {
    console.error('Error parsing date:', error);
    return null;
  }
}

/**
 * Format a Date object to MM/DD/YYYY string for display
 */
export function formatDateForDisplay(date: Date | null): string {
  if (!date) return '';
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
}

/**
 * Create a date object from year, month, day in local timezone
 * This avoids timezone conversion issues
 */
export function createLocalDate(year: number, month: number, day: number): Date {
  return new Date(year, month - 1, day);
}

/**
 * Get today's date in UTC at noon to avoid timezone day shifting
 */
export function getTodayLocal(): Date {
  const now = new Date();
  return new Date(Date.UTC(
    now.getFullYear(), 
    now.getMonth(), 
    now.getDate(),
    12, 0, 0
  ));
}

/**
 * Check if two dates are the same day (ignoring time)
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Add days to a date
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Subtract days from a date
 */
export function subtractDays(date: Date, days: number): Date {
  return addDays(date, -days);
}