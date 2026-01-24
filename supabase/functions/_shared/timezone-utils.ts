/**
 * Timezone utilities for push notifications
 * Converts between UTC and user's local timezone
 */

const DEFAULT_TIMEZONE = 'America/Sao_Paulo';

/**
 * Get current time in a specific timezone
 */
export function getCurrentTimeInTimezone(timezone: string): Date {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone || DEFAULT_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    
    const parts = formatter.formatToParts(now);
    const getPart = (type: string) => parts.find(p => p.type === type)?.value || '0';
    
    const year = parseInt(getPart('year'));
    const month = parseInt(getPart('month')) - 1;
    const day = parseInt(getPart('day'));
    const hour = parseInt(getPart('hour'));
    const minute = parseInt(getPart('minute'));
    const second = parseInt(getPart('second'));
    
    return new Date(year, month, day, hour, minute, second);
  } catch (error) {
    console.warn(`[timezone-utils] Invalid timezone "${timezone}", falling back to ${DEFAULT_TIMEZONE}`);
    return getCurrentTimeInTimezone(DEFAULT_TIMEZONE);
  }
}

/**
 * Get current hour in a specific timezone (0-23)
 */
export function getCurrentHourInTimezone(timezone: string): number {
  const localTime = getCurrentTimeInTimezone(timezone);
  return localTime.getHours();
}

/**
 * Get current date string (YYYY-MM-DD) in a specific timezone
 */
export function getCurrentDateInTimezone(timezone: string): string {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone || DEFAULT_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(now);
  } catch (error) {
    console.warn(`[timezone-utils] Invalid timezone "${timezone}", falling back to ${DEFAULT_TIMEZONE}`);
    return getCurrentDateInTimezone(DEFAULT_TIMEZONE);
  }
}

/**
 * Check if current time in user's timezone is within a time window
 * @param timezone User's timezone
 * @param startHour Start hour (0-23)
 * @param endHour End hour (0-23)
 */
export function isWithinTimeWindow(timezone: string, startHour: number, endHour: number): boolean {
  const currentHour = getCurrentHourInTimezone(timezone);
  
  // Handle windows that cross midnight (e.g., 22-06)
  if (startHour > endHour) {
    return currentHour >= startHour || currentHour < endHour;
  }
  
  return currentHour >= startHour && currentHour < endHour;
}

/**
 * Check if current time is within appropriate push notification window (8:00 - 21:00)
 */
export function isWithinPushWindow(timezone: string): boolean {
  return isWithinTimeWindow(timezone, 8, 21);
}

/**
 * Get time difference in minutes between a show time and current time in user's timezone
 * @param showTimeLocal Show time in format "HH:MM"
 * @param timezone User's timezone
 */
export function getMinutesUntilShowTime(showTimeLocal: string, timezone: string): number {
  const [hours, minutes] = showTimeLocal.split(':').map(Number);
  const showTimeInMinutes = hours * 60 + minutes;
  
  const localTime = getCurrentTimeInTimezone(timezone);
  const currentTimeInMinutes = localTime.getHours() * 60 + localTime.getMinutes();
  
  return showTimeInMinutes - currentTimeInMinutes;
}

/**
 * Get date strings for relative days in user's timezone
 */
export function getRelativeDatesInTimezone(timezone: string): {
  today: string;
  tomorrow: string;
  in7Days: string;
} {
  const now = new Date();
  
  const getDateInTz = (offsetDays: number) => {
    const date = new Date(now.getTime() + offsetDays * 24 * 60 * 60 * 1000);
    try {
      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone || DEFAULT_TIMEZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
      return formatter.format(date);
    } catch {
      return date.toISOString().split('T')[0];
    }
  };
  
  return {
    today: getDateInTz(0),
    tomorrow: getDateInTz(1),
    in7Days: getDateInTz(7),
  };
}

/**
 * Get the start of today in user's timezone as a UTC Date object
 */
export function getTodayStartInTimezone(timezone: string): Date {
  const now = new Date();
  
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone || DEFAULT_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const dateStr = formatter.format(now);
    
    // Create a date at midnight in the user's timezone and convert to UTC
    const [year, month, day] = dateStr.split('-').map(Number);
    
    // Get the timezone offset for this date
    const testDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0)); // Use noon to avoid DST issues
    const formatter2 = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone || DEFAULT_TIMEZONE,
      hour: 'numeric',
      hour12: false,
    });
    const localHour = parseInt(formatter2.format(testDate));
    const offsetHours = localHour - 12;
    
    // Create UTC date at midnight local time
    return new Date(Date.UTC(year, month - 1, day, -offsetHours, 0, 0));
  } catch {
    // Fallback to BRT (UTC-3)
    const nowBRT = new Date(now.getTime() - 3 * 60 * 60 * 1000);
    const todayStartBRT = new Date(Date.UTC(nowBRT.getUTCFullYear(), nowBRT.getUTCMonth(), nowBRT.getUTCDate(), 0, 0, 0));
    return new Date(todayStartBRT.getTime() + 3 * 60 * 60 * 1000);
  }
}

/**
 * Calculate minutes until a show (considering date + time)
 * Returns negative number if the show has already passed
 * @param showDateLocal Show date in format "YYYY-MM-DD"
 * @param showTimeLocal Show time in format "HH:MM"
 * @param timezone User's timezone
 */
export function getMinutesUntilShow(
  showDateLocal: string,
  showTimeLocal: string,
  timezone: string
): number {
  try {
    // Get current date and time in user's timezone
    const { today } = getRelativeDatesInTimezone(timezone);
    const localTime = getCurrentTimeInTimezone(timezone);
    
    // Current time in minutes since midnight
    const currentMinutes = localTime.getHours() * 60 + localTime.getMinutes();
    
    // Show time in minutes since midnight
    const [hours, minutes] = (showTimeLocal || '20:00').split(':').map(Number);
    const showMinutes = hours * 60 + minutes;
    
    // Calculate difference in days (using date strings to avoid timezone issues)
    // Both dates are in YYYY-MM-DD format, so we can compare directly
    const showDateParts = showDateLocal.split('-').map(Number);
    const todayParts = today.split('-').map(Number);
    
    // Create dates at noon UTC to avoid DST edge cases (we only care about the day difference)
    const showDate = Date.UTC(showDateParts[0], showDateParts[1] - 1, showDateParts[2], 12, 0, 0);
    const todayDate = Date.UTC(todayParts[0], todayParts[1] - 1, todayParts[2], 12, 0, 0);
    
    const daysDiff = Math.round((showDate - todayDate) / (1000 * 60 * 60 * 24));
    
    // Calculate total minutes until show
    // = (days difference * minutes per day) + (show time - current time)
    const totalMinutes = (daysDiff * 24 * 60) + (showMinutes - currentMinutes);
    
    console.log(`[timezone-utils] getMinutesUntilShow: showDate=${showDateLocal}, today=${today}, daysDiff=${daysDiff}, showMin=${showMinutes}, currentMin=${currentMinutes}, total=${totalMinutes}`);
    
    return totalMinutes;
  } catch (error) {
    console.warn(`[timezone-utils] Error calculating minutes until show:`, error);
    return -1; // Return negative to indicate error/past
  }
}
