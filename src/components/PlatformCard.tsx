
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MoreVertical, Edit, Trash2, Download, Clock, CalendarDays, ImageIcon, ExternalLink } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import ContentEditModal from './ContentEditModal';
import { contentService } from '@/services/contentService';
import { toast } from '@/hooks/use-toast';
import StatusBadge from './StatusBadge';
import PublishButton from './PublishButton';
import { timezoneUtils } from '@/utils/timezoneUtils';

interface PlatformCardProps {
  entry: any;
  platform: 'instagram' | 'linkedin' | 'wordpress' | 'twitter';
  onUpdateContent: (entryId: string, platform: string, content: any) => Promise<void>;
  onDeleteEntry?: (platformId: string) => void;
  onDownloadSlides?: (entryId: string, slidesURL: string) => void;
  onUpdateStatus?: (entryId: string, platform: string, newStatus: 'published' | 'pending' | 'error') => void;
  onUpdateLink?: (entryId: string, platform: string, link: string) => void;
  onUpdateImage?: (entryId: string, imageUrl: string | null) => Promise<void>;
  onReloadEntries?: () => void;
  onStatsUpdate?: () => void;
}

const PlatformCard = ({
  entry,
  platform,
  onUpdateContent,
  onDeleteEntry,
  onDownloadSlides,
  onUpdateStatus,
  onUpdateLink,
  onUpdateImage,
  onReloadEntries,
  onStatsUpdate
}: PlatformCardProps) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [slideImages, setSlideImages] = useState<string[]>([]);
  const [loadingSlides, setLoadingSlides] = useState(false);

  // Get platform-specific content
  const platformContent = entry.platformContent?.[platform] || {};
  const status = entry.status?.[platform] || 'pending';
  const publishedLink = entry.publishedLinks?.[platform];
  const scheduledAt = platformContent.scheduled_at || platformContent.publishDate;

  // Get the image URL from the platform content
  const imageUrl = platformContent.image_url || entry.imageUrl;

  useEffect(() => {
    if (entry.slideImages && Array.isArray(entry.slideImages)) {
      setSlideImages(entry.slideImages);
    } else {
      loadSlideImages();
    }
  }, [entry.id]);

  const loadSlideImages = async () => {
    try {
      setLoadingSlides(true);
      const { data, error } = await contentService.getSlideImages(entry.id);
      
      if (error) {
        console.error('Error loading slide images:', error);
        return;
      }
      
      if (data && Array.isArray(data)) {
        const sortedImages = data
          .sort((a, b) => a.position - b.position)
          .map(img => img.image_url);
        setSlideImages(sortedImages);
      }
    } catch (error) {
      console.error('Error loading slide images:', error);
    } finally {
      setLoadingSlides(false);
    }
  };

  const handleEdit = () => {
    setShowEditModal(true);
  };

  const handleSaveContent = async (content: any) => {
    try {
      await onUpdateContent(entry.id, platform, content);
      if (onStatsUpdate) {
        onStatsUpdate();
      }
    } catch (error) {
      console.error('Error saving content:', error);
    }
  };

  const handleDelete = () => {
    if (onDeleteEntry && window.confirm('¿Estás seguro de que quieres eliminar este contenido?')) {
      onDeleteEntry(entry.id);
    }
  };

  const handleDownloadSlides = () => {
    if (onDownloadSlides && platformContent.slidesURL) {
      onDownloadSlides(entry.id, platformContent.slidesURL);
    }
  };

  const getPlatformColor = (platform: string) => {
    const colors = {
      instagram: 'from-pink-500 to-purple-600',
      linkedin: 'from-blue-500 to-blue-700',
      wordpress: 'from-gray-600 to-gray-800',
      twitter: 'from-gray-800 to-black'
    };
    return colors[platform as keyof typeof colors] || 'from-gray-500 to-gray-700';
  };

  const getPlatformIcon = (platform: string) => {
    // Platform icons would be defined here
    return null;
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  // Check if content has images (for Slide Posts) or image (for Simple Posts)
  const hasImages = slideImages.length > 0 || imageUrl;

  return (
    <>
      <Card className="w-full hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg font-semibold text-gray-900 mb-2">
                {entry.topic}
              </CardTitle>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <Badge 
                  variant="outline" 
                  className={`bg-gradient-to-r ${getPlatformColor(platform)} text-white border-0 capitalize`}
                >
                  {platform}
                </Badge>
                <StatusBadge status={status} platform={platform} />
                {entry.type && (
                  <Badge variant="secondary" className="text-xs">
                    {entry.type}
                  </Badge>
                )}
              </div>
              
              {/* Scheduled Date Display */}
              {scheduledAt && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 mb-3">
                  <div className="flex items-center space-x-2 text-blue-700">
                    <CalendarDays className="w-4 h-4" />
                    <span className="text-sm font-medium">Programado para:</span>
                  </div>
                  <p className="text-sm text-blue-600 font-semibold mt-1">
                    {timezoneUtils.formatForDisplay(scheduledAt)}
                  </p>
                </div>
              )}
              
              {entry.description && (
                <p className="text-sm text-gray-600 mb-3">
                  {truncateText(entry.description, 80)}
                </p>
              )}
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
                {platformContent.slidesURL && (
                  <DropdownMenuItem onClick={handleDownloadSlides}>
                    <Download className="mr-2 h-4 w-4" />
                    Descargar slides
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          {/* Content Preview */}
          <div className="space-y-3">
            {/* Text Content */}
            {platformContent.text && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-700 font-mono leading-relaxed">
                  {truncateText(platformContent.text, 150)}
                </p>
              </div>
            )}
            
            {/* Images Preview */}
            {hasImages && (
              <div className="space-y-2">
                <div className="flex items-center space-x-1 text-gray-600">
                  <ImageIcon className="w-4 h-4" />
                  <span className="text-xs font-medium">
                    {slideImages.length > 0 ? `${slideImages.length} slides` : '1 imagen'}
                  </span>
                </div>
                <div className="flex space-x-2 overflow-x-auto">
                  {slideImages.length > 0 ? (
                    slideImages.slice(0, 3).map((image, index) => (
                      <div key={index} className="flex-shrink-0">
                        <img 
                          src={image} 
                          alt={`Slide ${index + 1}`}
                          className="w-16 h-12 object-cover rounded border"
                        />
                      </div>
                    ))
                  ) : imageUrl && (
                    <div className="flex-shrink-0">
                      <img 
                        src={imageUrl} 
                        alt="Content image"
                        className="w-16 h-12 object-cover rounded border"
                      />
                    </div>
                  )}
                  {slideImages.length > 3 && (
                    <div className="flex-shrink-0 w-16 h-12 bg-gray-200 rounded border flex items-center justify-center">
                      <span className="text-xs text-gray-600">+{slideImages.length - 3}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Published Link */}
            {publishedLink && (
              <div className="flex items-center space-x-2 text-sm">
                <ExternalLink className="w-4 h-4 text-green-600" />
                <a 
                  href={publishedLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-green-600 hover:text-green-700 underline truncate"
                >
                  Ver publicación
                </a>
              </div>
            )}
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t mt-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleEdit}
              className="flex-1 mr-2"
            >
              <Edit className="w-4 h-4 mr-1" />
              Editar
            </Button>
            
            <PublishButton
              entryId={entry.id}
              platform={platform}
              status={status}
              onStatusUpdate={onStatsUpdate}
            />
          </div>
        </CardContent>
      </Card>

      {showEditModal && (
        <ContentEditModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          platform={platform}
          content={platformContent}
          contentType={entry.type}
          onSave={handleSaveContent}
          entryId={entry.id}
          topic={entry.topic}
          description={entry.description}
          slideImages={slideImages}
          imageUrl={imageUrl}
          onUpdateImage={onUpdateImage}
          onGenerateImage={async (entryId, platform, topic, description) => {
            try {
              const { data, error } = await contentService.generateImageForPlatform(entryId, platform, topic, description);
              if (error) {
                toast({
                  title: "Error al generar imagen",
                  description: "No se pudo generar la imagen",
                  variant: "destructive",
                });
              } else {
                toast({
                  title: "Imagen generada",
                  description: "La imagen se ha generado correctamente",
                });
                if (onReloadEntries) {
                  onReloadEntries();
                }
              }
            } catch (error) {
              console.error('Error generating image:', error);
            }
          }}
        />
      )}
    </>
  );
};

export default PlatformCard;
