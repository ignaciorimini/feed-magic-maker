
import { useState, useEffect } from 'react';

export const useTimezone = () => {
  const [timezone, setTimezone] = useState<string>('');

  useEffect(() => {
    // Detectar automáticamente la zona horaria del usuario
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setTimezone(userTimezone);
  }, []);

  // Convertir UTC a zona horaria local
  const utcToLocal = (utcDateString: string): Date => {
    if (!utcDateString) return new Date();
    return new Date(utcDateString);
  };

  // Convertir fecha local a UTC para almacenar en la base de datos
  const localToUtc = (localDate: Date): string => {
    return localDate.toISOString();
  };

  // Formatear fecha para mostrar en la UI
  const formatForDisplay = (dateString: string): string => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      timeZone: timezone,
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Formatear fecha para input datetime-local
  const formatForInput = (dateString: string): string => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    // Ajustar a la zona horaria local
    const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
    return localDate.toISOString().slice(0, 16);
  };

  // Obtener la fecha mínima permitida (ahora + 1 minuto)
  const getMinDateTime = (): string => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 1);
    const localDate = new Date(now.getTime() - (now.getTimezoneOffset() * 60000));
    return localDate.toISOString().slice(0, 16);
  };

  return {
    timezone,
    utcToLocal,
    localToUtc,
    formatForDisplay,
    formatForInput,
    getMinDateTime
  };
};
