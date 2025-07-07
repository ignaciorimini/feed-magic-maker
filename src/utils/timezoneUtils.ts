
// Utility functions for timezone handling
export const timezoneUtils = {
  // Get user's timezone
  getUserTimezone: (): string => {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  },

  // Convert UTC date to user's local timezone
  utcToLocal: (utcDate: string): Date => {
    return new Date(utcDate);
  },

  // Convert local date to UTC for database storage
  localToUtc: (localDate: string): string => {
    const date = new Date(localDate);
    return date.toISOString();
  },

  // Format date for display in user's timezone
  formatForDisplay: (dateStr: string, options: Intl.DateTimeFormatOptions = {}): string => {
    const date = new Date(dateStr);
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
      ...options
    };
    
    return new Intl.DateTimeFormat('es-ES', defaultOptions).format(date);
  },

  // Get minimum datetime string for input (current time in user's timezone)
  getMinDateTime: (): string => {
    const now = new Date();
    // Add 1 minute to current time to avoid scheduling in the past
    now.setMinutes(now.getMinutes() + 1);
    
    // Format for datetime-local input (YYYY-MM-DDTHH:MM)
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  },

  // Convert UTC datetime to local datetime-local format
  utcToLocalInput: (utcDate: string): string => {
    const date = new Date(utcDate);
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }
};
