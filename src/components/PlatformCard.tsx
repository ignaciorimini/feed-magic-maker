
import { useState } from 'react';
import { Calendar, FileText, Presentation, ExternalLink, Edit, MoreVertical, Trash2, Clock } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import StatusBadge from './StatusBadge';
import ContentEditModal from './ContentEditModal';
import { useTimezone } from '@/hooks/useTimezone';

interface PlatformCardProps {
  entry: {
    id: string;
    topic: string;
    description: string;
    type: string;
    createdDate: string;
    platform: string;
    contentType: string;
    slideImages?: string[];
    scheduledAt?: string | null;
    platformData?: any;
  };
  platform: string;
  onUpdateContent: (entryId: string, platform: string, content: any) => Promise<void>;
  onDeleteEntry: (entryId: string) => void;
  onDownloadSlides: (entryId: string, slidesURL: string) => void;
  onUpdateStatus?: (entryId: string, platform: string, newStatus: 'published' | 'pending' | 'error') => void;
  onUpdateLink?: (entryId: string, platform: string, link: string) => void;
  onUpdateImage: (entryId: string, imageUrl: string | null) => Promise<void>;
  onReloadEntries?: () => void;
  onStatsUpdate?: () => void;
}

const PlatformCard = ({ entry, platform, onUpdateContent, onDeleteEntry, onDownloadSlides, onUpdateImage, onReloadEntries }: PlatformCardProps) => {
  const { formatForDisplay } = useTimezone();
  const [showEditModal, setShowEditModal] = useState(false);

  const getTypeIcon = (type: string) => {
    return type === 'Simple Post' ? FileText : Presentation;
  };

  const getTypeColor = (type: string) => {
    return type === 'Simple Post' ? 'bg-blue-500' : 'bg-indigo-500';
  };

  const TypeIcon = getTypeIcon(entry.type);

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const handleDelete = () => {
    console.log('Deleting entry with ID:', entry.id);
    onDeleteEntry(entry.id);
  };

  // Determine if content is scheduled (not yet published)
  const isScheduled = entry.scheduledAt && new Date(entry.scheduledAt) > new Date();
  const isPublished = entry.platformData?.status === 'published';

  return (
    <>
      <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
        <CardHeader className="pb-3">
          {/* Scheduled info at the top - compact single line */}
          {isScheduled && (
            <div className="flex items-center gap-2 text-xs text-blue-700 bg-blue-50 px-2 py-1 rounded-md mb-2 border border-blue-200">
              <Clock className="w-3 h-3" />
              <span className="font-medium">
                Programado: {formatForDisplay(entry.scheduledAt)}
              </span>
            </div>
          )}

          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3 flex-1">
              <div className={`w-8 h-8 ${getTypeColor(entry.type)} rounded-lg flex items-center justify-center`}>
                <TypeIcon className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-tight truncate">
                  {entry.topic}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {entry.type}
                  </Badge>
                  {/* Show only one status badge - Programado takes priority over Pendiente */}
                  {isScheduled ? (
                    <Badge className="text-xs bg-blue-100 text-blue-800 border-blue-200">
                      Programado
                    </Badge>
                  ) : (
                    <StatusBadge 
                      platform={platform as 'instagram' | 'linkedin' | 'wordpress' | 'twitter'} 
                      status={entry.platformData?.status || 'pending'} 
                      scheduledAt={entry.scheduledAt}
                    />
                  )}
                </div>
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <DropdownMenuItem 
                  onClick={handleDelete}
                  className="text-red-600 dark:text-red-400 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar contenido
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Description Preview */}
          <div className="space-y-1">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Descripción
            </span>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {truncateText(entry.description, 80)}
            </p>
          </div>

          {/* Platform specific content preview */}
          {entry.platformData?.text && (
            <div className="space-y-1">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Contenido para {platform}
              </span>
              <p className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-2 rounded">
                {truncateText(entry.platformData.text, 120)}
              </p>
            </div>
          )}

          {/* Published link if available */}
          {entry.platformData?.published_url && (
            <div className="space-y-1">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Enlace publicado
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-blue-600 hover:text-blue-800 text-xs"
                onClick={() => window.open(entry.platformData.published_url, '_blank')}
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                Ver publicación
              </Button>
            </div>
          )}
        </CardContent>

        <CardFooter className="pt-0 border-t border-gray-100/50 dark:border-gray-700/50">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
              <Calendar className="w-3 h-3 mr-1" />
              <span>Creado {entry.createdDate}</span>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowEditModal(true)}
              className="h-6 px-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Edit className="w-3 h-3 mr-1" />
              Editar
            </Button>
          </div>
        </CardFooter>
      </Card>

      {showEditModal && (
        <ContentEditModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          platform={platform}
          content={entry.platformData}
          contentType={entry.contentType}
          onSave={async (content) => {
            await onUpdateContent(entry.id, platform, content);
            setShowEditModal(false);
            if (onReloadEntries) onReloadEntries();
          }}
          entryId={entry.id}
          topic={entry.topic}
          description={entry.description}
          slideImages={entry.slideImages}
          imageUrl={entry.platformData?.image_url}
          onUpdateImage={onUpdateImage}
        />
      )}
    </>
  );
};

export default PlatformCard;
