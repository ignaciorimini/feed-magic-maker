
import { Calendar, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PublishButton from '@/components/PublishButton';

interface PublishInfoProps {
  publishDate?: string;
  status: 'published' | 'pending' | 'error';
  publishedLink?: string;
  entryId?: string;
  platform: 'instagram' | 'linkedin' | 'wordpress';
  contentType: string;
  onStatusChange?: (newStatus: 'published' | 'pending' | 'error') => void;
  onLinkUpdate?: (link: string) => void;
}

const PublishInfo = ({
  publishDate,
  status,
  publishedLink,
  entryId,
  platform,
  contentType,
  onStatusChange,
  onLinkUpdate
}: PublishInfoProps) => {
  const formatPublishDate = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-2 mt-auto">
      {/* Publish Date */}
      {publishDate && (
        <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
          <Calendar className="w-3 h-3" />
          <span>Programado: {formatPublishDate(publishDate)}</span>
        </div>
      )}

      {/* Published Link */}
      {status === 'published' && publishedLink && (
        <div className="flex items-center space-x-1 text-xs">
          <span className="text-gray-500 dark:text-gray-400">Enlace:</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-5 px-1 text-blue-600 hover:text-blue-800"
            onClick={() => window.open(publishedLink, '_blank')}
          >
            <ExternalLink className="w-3 h-3 mr-1" />
            Ver publicación
          </Button>
        </div>
      )}

      {/* Publish Button */}
      {entryId && (platform === 'instagram' || platform === 'linkedin') && (
        <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
          <PublishButton
            entryId={entryId}
            platform={platform}
            currentStatus={status}
            contentType={contentType}
            onStatusChange={onStatusChange || (() => {})}
            onLinkUpdate={onLinkUpdate}
          />
        </div>
      )}
    </div>
  );
};

export default PublishInfo;
