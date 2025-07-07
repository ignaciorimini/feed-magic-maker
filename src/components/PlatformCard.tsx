
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Edit, MoreVertical, Send, Trash2, Clock } from 'lucide-react';
import ContentEditModal from './ContentEditModal';
import StatusBadge from './StatusBadge';
import PlatformIcon from './PlatformIcon';

interface PlatformCardProps {
  entry: any;
  platform: string;
  onUpdateContent: (entryId: string, platform: string, content: any) => Promise<void>;
  onDeleteEntry: (platformId: string, platform: string) => void;
  onDownloadSlides: (entryId: string, slidesURL: string) => void;
  onUpdateStatus: (entryId: string, platform: string, newStatus: 'published' | 'pending' | 'error') => void;
  onUpdateLink: (entryId: string, platform: string, link: string) => void;
  onUpdateImage: (entryId: string, imageUrl: string | null) => Promise<void>;
  onGenerateImage?: (entryId: string, platform: string, topic: string, description: string) => Promise<void>;
  onReloadEntries?: () => void;
  onStatsUpdate?: () => void;
}

const PlatformCard = ({ entry, platform, onUpdateContent, onDeleteEntry, onDownloadSlides, onUpdateStatus, onUpdateLink, onUpdateImage, onGenerateImage, onReloadEntries, onStatsUpdate }: PlatformCardProps) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const handleEdit = () => {
    setShowEditModal(true);
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    // Simulate publishing delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsPublishing(false);
  };

  const platformColors = {
    instagram: '#E4405F',
    linkedin: '#0077B5',
    wordpress: '#21759B',
    twitter: '#1DA1F2'
  };

  // Get scheduled date from platform content
  const scheduledDate = entry.platformContent?.[platform]?.publishDate || entry.platformContent?.[platform]?.scheduled_at;
  const isScheduled = scheduledDate && new Date(scheduledDate) > new Date();

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 border-l-4" style={{ borderLeftColor: platformColors[platform] }}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <PlatformIcon platform={platform} />
              <Badge 
                variant="secondary" 
                className="text-xs"
                style={{ backgroundColor: `${platformColors[platform]}20`, color: platformColors[platform] }}
              >
                {platform}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {entry.type}
              </Badge>
            </div>
            
            <CardTitle className="text-lg mb-2 line-clamp-2">
              {entry.topic}
            </CardTitle>
            
            {entry.description && (
              <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                {entry.description}
              </p>
            )}

            {/* Scheduled Publication Date - Prominent Display */}
            {isScheduled && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3 mb-3">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <div>
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                      Programado para publicar
                    </p>
                    <p className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                      {new Date(scheduledDate).toLocaleDateString('es-ES', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      {new Date(scheduledDate).toLocaleTimeString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <StatusBadge status={entry.status?.[platform] || 'pending'} />
                <span className="text-xs text-gray-500">
                  {entry.createdDate}
                </span>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleEdit}>
                    <Edit className="mr-2 h-4 w-4" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handlePublish} disabled={isPublishing}>
                    <Send className="mr-2 h-4 w-4" />
                    {isPublishing ? 'Publicando...' : 'Publicar'}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => onDeleteEntry(entry.id, platform)} 
                    className="text-red-600 dark:text-red-400"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Eliminar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {showEditModal && (
          <ContentEditModal
            isOpen={showEditModal}
            onClose={() => setShowEditModal(false)}
            platform={platform}
            content={entry.platformContent?.[platform]}
            contentType={entry.contentType}
            onSave={(content) => onUpdateContent(entry.id, platform, content)}
            entryId={entry.id + '__' + platform}
            topic={entry.topic}
            description={entry.description}
            slideImages={entry.slideImages}
            imageUrl={entry.platformContent?.[platform]?.image_url}
            onUpdateImage={onUpdateImage}
            onGenerateImage={onGenerateImage ? (entryId, platform, topic, description) => {
              console.log('=== GENERATE IMAGE FROM PLATFORMCARD ===');
              console.log('Entry ID:', entryId);
              console.log('Platform:', platform);
              console.log('Topic:', topic);
              console.log('Description:', description);
              return onGenerateImage(entryId, platform, topic, description);
            } : undefined}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default PlatformCard;
