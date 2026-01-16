import { format, startOfWeek, endOfWeek, getWeek, getYear } from 'date-fns';

/**
 * Get the ISO week identifier for a given date
 * Format: "YYYY-Www" (e.g., "2024-W15")
 */
export function getWeekId(date: Date = new Date()): string {
  const year = getYear(date);
  const week = getWeek(date, { weekStartsOn: 1 }); // Monday as start of week
  return `${year}-W${week.toString().padStart(2, '0')}`;
}

/**
 * Get the start and end dates for a week ID
 */
export function getWeekDates(weekId: string): { startDate: Date; endDate: Date } {
  const [year, week] = weekId.split('-W').map(Number);
  
  // Create a date in the given year and week
  const jan4 = new Date(year, 0, 4);
  const jan4Day = jan4.getDay() || 7; // Convert Sunday (0) to 7
  const weekStart = new Date(year, 0, 4 - jan4Day + 1 + (week - 1) * 7);
  
  const startDate = startOfWeek(weekStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(weekStart, { weekStartsOn: 1 });
  
  return { startDate, endDate };
}

/**
 * Format week ID for display
 */
export function formatWeekId(weekId: string): string {
  const { startDate, endDate } = getWeekDates(weekId);
  return `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')}`;
}
