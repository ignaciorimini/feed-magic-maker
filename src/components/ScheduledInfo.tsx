
import { Clock, Calendar } from 'lucide-react';
import { useTimezone } from '@/hooks/useTimezone';

interface ScheduledInfoProps {
  scheduledAt: string | null;
  variant?: 'badge' | 'card' | 'full';
  className?: string;
}

const ScheduledInfo = ({ scheduledAt, variant = 'badge', className = '' }: ScheduledInfoProps) => {
  const { formatForDisplay } = useTimezone();

  if (!scheduledAt) return null;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    
    if (variant === 'badge') {
      return date.toLocaleDateString('es-ES', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    
    if (variant === 'card') {
      return date.toLocaleDateString('es-ES', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    
    return formatForDisplay(dateStr);
  };

  if (variant === 'badge') {
    return (
      <div className={`inline-flex items-center px-2 py-1 rounded text-xs bg-blue-100 text-blue-800 border border-blue-200 ${className}`}>
        <Clock className="w-3 h-3 mr-1" />
        <span className="font-medium">{formatDate(scheduledAt)}</span>
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className={`flex items-center space-x-2 text-sm text-blue-700 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200 ${className}`}>
        <Calendar className="w-4 h-4" />
        <div>
          <span className="font-medium">Programado para:</span>
          <div className="text-blue-600 font-semibold">{formatDate(scheduledAt)}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-3 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg ${className}`}>
      <div className="flex items-center space-x-2 mb-1">
        <Calendar className="w-4 h-4 text-blue-600" />
        <span className="text-sm font-medium text-blue-900">Programado para:</span>
      </div>
      <div className="text-blue-700 font-semibold">{formatDate(scheduledAt)}</div>
    </div>
  );
};

export default ScheduledInfo;
