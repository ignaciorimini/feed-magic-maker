
import { useState, useEffect } from 'react';
import { Calendar, FileText, Presentation, ExternalLink, Edit, MoreVertical, Trash2 } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import StatusBadge from './StatusBadge';
import PlatformPreview from './PlatformPreview';
import PublishingSettings from './PublishingSettings';

interface ContentCardProps {
  entry: {
    id: string;
    topic: string;
    description: string;
    type: string;
    createdDate: string;
    status: {
      instagram: 'published' | 'pending' | 'error';
      linkedin: 'published' | 'pending' | 'error';
      wordpress: 'published' | 'pending' | 'error';
    };
    platformContent: {
      instagram: {
        text: string;
        images: string[];
        publishDate?: string;
        slidesURL?: string;
      };
      linkedin: {
        text: string;
        images: string[];
        publishDate?: string;
        slidesURL?: string;
      };
      wordpress: {
        text: string;
        images: string[];
        publishDate?: string;
        title?: string;
        description?: string;
        slug?: string;
        slidesURL?: string;
      };
    };
    slideImages?: string[];
    publishedLinks?: {
      instagram?: string;
      linkedin?: string;
      wordpress?: string;
    };
  };
  selectedPlatforms: string[];
  onUpdateContent: (entryId: string, platform: string, content: any) => Promise<void>;
  onUpdatePublishSettings: (entryId: string, settings: any) => void;
  onDeleteEntry: (entryId: string) => void;
  onDownloadSlides: (entryId: string, slidesURL: string) => void;
}

const ContentCard = ({ entry, selectedPlatforms, onUpdateContent, onUpdatePublishSettings, onDeleteEntry, onDownloadSlides }: ContentCardProps) => {
  const [showPublishSettings, setShowPublishSettings] = useState(false);
  const [localEntry, setLocalEntry] = useState(entry);

  // Update local entry when prop changes
  useEffect(() => {
    setLocalEntry(entry);
  }, [entry]);

  const getTypeIcon = (type: string) => {
    return type === 'Simple Post' ? FileText : Presentation;
  };

  const getTypeColor = (type: string) => {
    return type === 'Simple Post' ? 'bg-blue-500' : 'bg-indigo-500';
  };

  // Usar el tipo real del entry, no una función que puede devolver algo incorrecto
  const TypeIcon = getTypeIcon(localEntry.type);

  // Función para truncar texto
  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Filter platforms based on user selection
  const availablePlatforms = ['instagram', 'linkedin', 'wordpress'].filter(platform => 
    selectedPlatforms.includes(platform)
  );

  const handleDelete = () => {
    console.log('Deleting entry with ID:', entry.id, 'Type:', typeof entry.id);
    onDeleteEntry(entry.id);
  };

  // FIXED: Verificar si hay slides descargadas Y es un Slide Post
  const hasDownloadedSlides = localEntry.slideImages && localEntry.slideImages.length > 0;
  const isSlidePost = localEntry.type === 'Slide Post';
  const shouldShowSlides = isSlidePost && hasDownloadedSlides;

  // Handler for status changes - convert between old and new status systems
  const handleStatusChange = (platform: string, newStatus: 'pending' | 'generated' | 'edited' | 'scheduled' | 'published') => {
    // Convert the new status system to the old one for compatibility
    const convertedStatus: 'published' | 'pending' | 'error' = 
      newStatus === 'published' ? 'published' : 'pending';

    setLocalEntry(prev => ({
      ...prev,
      status: {
        ...prev.status,
        [platform]: convertedStatus
      }
    }));
  };

  // Handler for link updates
  const handleLinkUpdate = (platform: string, link: string) => {
    setLocalEntry(prev => ({
      ...prev,
      publishedLinks: {
        ...prev.publishedLinks,
        [platform]: link
      }
    }));
  };

  // Convert old status to new status for platform previews
  const convertStatusToNew = (oldStatus: 'published' | 'pending' | 'error'): 'pending' | 'generated' | 'edited' | 'scheduled' | 'published' => {
    switch (oldStatus) {
      case 'published':
        return 'published';
      case 'pending':
        return 'pending';
      case 'error':
        return 'pending'; // Convert error to pending for now
      default:
        return 'pending';
    }
  };

  return (
    <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
      {/* Horizontal Layout */}
      <div className="flex flex-col lg:flex-row">
        {/* Left Side - Main Info */}
        <div className="lg:w-1/3 p-4">
          <CardHeader className="p-0 pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 ${getTypeColor(localEntry.type)} rounded-lg flex items-center justify-center`}>
                  <TypeIcon className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-tight">
                    {localEntry.topic}
                  </h3>
                  <Badge variant="outline" className="mt-1 text-xs">
                    {localEntry.type}
                  </Badge>
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

          <CardContent className="p-0 space-y-3">
            {/* Description Preview */}
            <div className="space-y-1">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Descripción
              </span>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {truncateText(localEntry.description, 80)}
              </p>
            </div>

            {/* FIXED: Slides Carousel - Show when we have slide images AND it's a Slide Post */}
            {shouldShowSlides && (
              <div className="space-y-2">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Slides Descargadas ({localEntry.slideImages!.length} imágenes)
                </span>
                <Carousel className="w-full max-w-xs mx-auto">
                  <CarouselContent>
                    {localEntry.slideImages!.map((imageUrl, index) => (
                      <CarouselItem key={index}>
                        <div className="p-1">
                          <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-md overflow-hidden">
                            <img 
                              src={imageUrl} 
                              alt={`Slide ${index + 1}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                console.error('Error loading slide image:', imageUrl);
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          </div>
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious />
                  <CarouselNext />
                </Carousel>
              </div>
            )}

            {/* Publication Status - Only show selected platforms */}
            <div className="space-y-2">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Estado de publicación
              </span>
              <div className="flex flex-wrap gap-1">
                {availablePlatforms.map(platform => (
                  <StatusBadge 
                    key={platform}
                    platform={platform as 'instagram' | 'linkedin' | 'wordpress'} 
                    status={localEntry.status[platform as keyof typeof localEntry.status]} 
                  />
                ))}
              </div>
            </div>

            {/* Published Links - Show if any links exist */}
            {localEntry.publishedLinks && Object.keys(localEntry.publishedLinks).length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Enlaces publicados
                </span>
                <div className="space-y-1">
                  {Object.entries(localEntry.publishedLinks).map(([platform, link]) => {
                    if (!link || !availablePlatforms.includes(platform)) return null;
                    
                    return (
                      <div key={platform} className="flex items-center justify-between text-xs">
                        <span className="capitalize text-gray-600 dark:text-gray-400">{platform}:</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 px-1 text-blue-600 hover:text-blue-800"
                          onClick={() => window.open(link, '_blank')}
                        >
                          <ExternalLink className="w-3 h-3 mr-1" />
                          Ver publicación
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="p-0 pt-3 border-t border-gray-100/50 dark:border-gray-700/50">
            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
              <Calendar className="w-3 h-3 mr-1" />
              <span>Creado {localEntry.createdDate}</span>
            </div>
          </CardFooter>
        </div>

        {/* Right Side - Platform Previews - Only show selected platforms */}
        <div className="lg:w-2/3 p-4 border-l border-gray-100/50 dark:border-gray-700/50">
          <div className="space-y-3">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Vista previa por plataforma
            </span>
            
            <div className={`grid grid-cols-1 ${availablePlatforms.length === 2 ? 'md:grid-cols-2' : availablePlatforms.length === 3 ? 'md:grid-cols-3' : ''} gap-3`}>
              {availablePlatforms.includes('instagram') && (
                <PlatformPreview
                  platform="instagram"
                  content={localEntry.platformContent.instagram}
                  status={convertStatusToNew(localEntry.status.instagram)}
                  contentType={localEntry.type}
                  onUpdateContent={(content) => onUpdateContent(localEntry.id, 'instagram', content)}
                  entryId={localEntry.id}
                  topic={localEntry.topic}
                  slideImages={localEntry.slideImages}
                  onStatusChange={(newStatus) => handleStatusChange('instagram', newStatus)}
                  onLinkUpdate={(link) => handleLinkUpdate('instagram', link)}
                />
              )}
              
              {availablePlatforms.includes('linkedin') && (
                <PlatformPreview
                  platform="linkedin"
                  content={localEntry.platformContent.linkedin}
                  status={convertStatusToNew(localEntry.status.linkedin)}
                  contentType={localEntry.type}
                  onUpdateContent={(content) => onUpdateContent(localEntry.id, 'linkedin', content)}
                  entryId={localEntry.id}
                  topic={localEntry.topic}
                  slideImages={localEntry.slideImages}
                  onStatusChange={(newStatus) => handleStatusChange('linkedin', newStatus)}
                  onLinkUpdate={(link) => handleLinkUpdate('linkedin', link)}
                />
              )}
              
              {availablePlatforms.includes('wordpress') && (
                <PlatformPreview
                  platform="wordpress"
                  content={localEntry.platformContent.wordpress}
                  status={convertStatusToNew(localEntry.status.wordpress)}
                  contentType={localEntry.type}
                  onUpdateContent={(content) => onUpdateContent(localEntry.id, 'wordpress', content)}
                  entryId={localEntry.id}
                  topic={localEntry.topic}
                  slideImages={localEntry.slideImages}
                  publishedLink={localEntry.publishedLinks?.wordpress}
                  onStatusChange={(newStatus) => handleStatusChange('wordpress', newStatus)}
                  onLinkUpdate={(link) => handleLinkUpdate('wordpress', link)}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Publishing Settings Modal */}
      {showPublishSettings && (
        <PublishingSettings
          entry={entry}
          onClose={() => setShowPublishSettings(false)}
          onUpdateSettings={onUpdatePublishSettings}
        />
      )}
    </Card>
  );
};

export default ContentCard;
