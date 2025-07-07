
// Utility functions for handling user timezone
export const getUserTimezone = (): string => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
};

export const formatDateInUserTimezone = (date: string | Date, options?: Intl.DateTimeFormatOptions): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: getUserTimezone(),
    ...options
  };
  
  return dateObj.toLocaleString('es-ES', defaultOptions);
};

export const formatDateForInput = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Get the date in the user's timezone
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  const hours = String(dateObj.getHours()).padStart(2, '0');
  const minutes = String(dateObj.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export const convertToUTC = (localDateTime: string): string => {
  // Create a date object from the local datetime input
  const localDate = new Date(localDateTime);
  return localDate.toISOString();
};

export const convertFromUTC = (utcDateTime: string): string => {
  // Convert UTC date to local datetime input format
  const utcDate = new Date(utcDateTime);
  return formatDateForInput(utcDate);
};

export const getMinDateTimeForInput = (): string => {
  const now = new Date();
  return formatDateForInput(now);
};

export const formatTimeOnly = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: getUserTimezone()
  });
};
