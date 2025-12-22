/**
 * Date utility functions for dynamic date handling across the application
 */

/**
 * Get current date in YYYY-MM-DD format
 */
export function getCurrentDate(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

/**
 * Get minimum bookable date (today)
 */
export function getMinBookingDate(): string {
  return getCurrentDate();
}

/**
 * Format date to readable string (e.g., "Mon, Nov 20")
 */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Get date label for UI display
 */
export function getDateLabel(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Reset time parts for accurate comparison
  today.setHours(0, 0, 0, 0);
  tomorrow.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);

  if (date.getTime() === today.getTime()) {
    return 'Today';
  } else if (date.getTime() === tomorrow.getTime()) {
    return 'Tomorrow';
  } else {
    return formatDate(dateStr);
  }
}

/**
 * Generate array of upcoming dates for booking
 * @param days Number of days to generate (default: 7)
 * @returns Array of date objects with date string and label
 */
export function generateUpcomingDates(days: number = 7): Array<{ date: string; label: string }> {
  const dates: Array<{ date: string; label: string }> = [];
  const today = new Date();

  for (let i = 0; i < days; i++) {
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + i);
    
    const dateStr = futureDate.toISOString().split('T')[0];
    const label = getDateLabel(dateStr);
    
    dates.push({ date: dateStr, label });
  }

  return dates;
}

/**
 * Check if a date is in the past
 */
export function isPastDate(dateStr: string): boolean {
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return date < today;
}

/**
 * Get formatted date for display (e.g., "November 20, 2025")
 */
export function getFormattedDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Add days to a date string
 */
export function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

/**
 * Get day of week from date string
 */
export function getDayOfWeek(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { weekday: 'long' });
}

/**
 * Check if date is today
 */
export function isToday(dateStr: string): boolean {
  return dateStr === getCurrentDate();
}

/**
 * Check if date is tomorrow
 */
export function isTomorrow(dateStr: string): boolean {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return dateStr === tomorrow.toISOString().split('T')[0];
}
