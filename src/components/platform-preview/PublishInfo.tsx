
import { Clock, Calendar, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDateInUserTimezone } from '@/utils/timezoneUtils';

interface PublishInfoProps {
  publishDate?: string;
  scheduledAt?: string;
  status: 'pending' | 'generated' | 'edited' | 'scheduled' | 'published';
  publishedLink?: string;
  entryId?: string;
  platform: string;
  contentType: string;
  onStatusChange?: (newStatus: 'pending' | 'generated' | 'edited' | 'scheduled' | 'published') => void;
  onLinkUpdate?: (link: string) => void;
}

const PublishInfo = ({
  publishDate,
  scheduledAt,
  status,
  publishedLink,
  entryId,
  platform,
  contentType,
  onStatusChange,
  onLinkUpdate
}: PublishInfoProps) => {
  // Use scheduledAt if available, otherwise fallback to publishDate
  const displayDate = scheduledAt || publishDate;

  return (
    <div className="space-y-2">
      {/* Scheduled Date Display */}
      {displayDate && status !== 'published' && (
        <div className="flex items-center space-x-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-600">
          <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <div className="flex-1">
            <p className="text-xs font-medium text-blue-800 dark:text-blue-200">
              Programado para
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300">
              {formatDateInUserTimezone(displayDate, {
                weekday: 'short',
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
          <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
            <Clock className="w-3 h-3 mr-1" />
            Programado
          </Badge>
        </div>
      )}

      {/* Published Link */}
      {status === 'published' && publishedLink && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.open(publishedLink, '_blank')}
          className="w-full text-xs bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
        >
          <ExternalLink className="w-3 h-3 mr-2" />
          Ver publicación
        </Button>
      )}
    </div>
  );
};

export default PublishInfo;
