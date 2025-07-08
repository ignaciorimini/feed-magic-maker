
import { Clock, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useTimezone } from '@/hooks/useTimezone';

interface ScheduledBadgeProps {
  scheduledAt: string | null;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'secondary' | 'outline';
}

const ScheduledBadge = ({ scheduledAt, size = 'sm', variant = 'secondary' }: ScheduledBadgeProps) => {
  const { formatForDisplay } = useTimezone();

  if (!scheduledAt) return null;

  const isLarge = size === 'lg';

  return (
    <Badge 
      variant={variant} 
      className={`${isLarge ? 'text-sm px-3 py-1' : 'text-xs px-2 py-1'} bg-blue-100 text-blue-800 border-blue-200 flex items-center gap-1 max-w-fit`}
    >
      {isLarge ? <Calendar className="w-4 h-4" /> : <Clock className="w-3 h-3" />}
      <span className={isLarge ? 'font-medium' : 'font-normal'}>
        {isLarge ? formatForDisplay(scheduledAt) : 'Programado'}
      </span>
    </Badge>
  );
};

export default ScheduledBadge;
