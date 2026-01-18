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
    // Parse show date and time
    const [year, month, day] = showDateLocal.split('-').map(Number);
    const [hours, minutes] = (showTimeLocal || '20:00').split(':').map(Number);
    
    // Create show datetime (treating as local time in the show's context)
    // We use Date.UTC and adjust, because the show date_local/time_local are already in local time
    const showDateTime = new Date(year, month - 1, day, hours, minutes, 0);
    
    // Get current time in user's timezone
    const localTime = getCurrentTimeInTimezone(timezone);
    
    // Calculate difference in milliseconds and convert to minutes
    const diffMs = showDateTime.getTime() - localTime.getTime();
    const diffMinutes = Math.round(diffMs / (1000 * 60));
    
    return diffMinutes;
  } catch (error) {
    console.warn(`[timezone-utils] Error calculating minutes until show:`, error);
    return -1; // Return negative to indicate error/past
  }
}
