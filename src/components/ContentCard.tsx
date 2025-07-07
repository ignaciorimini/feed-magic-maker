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
  const [slideImages, setSlideImages] = useState<string[]>([]);
  const [imagesLoaded, setImagesLoaded] = useState(false);

  // Update local entry when prop changes
  useEffect(() => {
    setLocalEntry(entry);
    // Force reload slide images when entry changes
    if (entry.slideImages && entry.slideImages.length > 0) {
      setSlideImages([...entry.slideImages]);
      setImagesLoaded(true);
    } else {
      setSlideImages([]);
      setImagesLoaded(false);
    }
  }, [entry]);

  // Additional effect to ensure slide images are properly loaded
  useEffect(() => {
    if (localEntry.type === 'Slide Post' && !imagesLoaded && localEntry.slideImages) {
      console.log('Loading slide images for entry:', localEntry.id);
      setSlideImages([...localEntry.slideImages]);
      setImagesLoaded(true);
    }
  }, [localEntry.type, localEntry.slideImages, imagesLoaded]);

  const getTypeIcon = (type: string) => {
    return type === 'Simple Post' ? FileText : Presentation;
  };

  const getTypeColor = (type: string) => {
    return type === 'Simple Post' ? 'bg-blue-500' : 'bg-indigo-500';
  };

  const TypeIcon = getTypeIcon(localEntry.type);

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const availablePlatforms = ['instagram', 'linkedin', 'wordpress'].filter(platform => 
    selectedPlatforms.includes(platform)
  );

  const handleDelete = () => {
    console.log('Deleting entry with ID:', entry.id, 'Type:', typeof entry.id);
    onDeleteEntry(entry.id);
  };

  // Check if we have slides to show - more robust checking
  const hasDownloadedSlides = slideImages && slideImages.length > 0;
  const isSlidePost = localEntry.type === 'Slide Post';
  const shouldShowSlides = isSlidePost && hasDownloadedSlides;

  const handleStatusChange = (platform: string, newStatus: 'pending' | 'generated' | 'edited' | 'scheduled' | 'published') => {
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

  const handleLinkUpdate = (platform: string, link: string) => {
    setLocalEntry(prev => ({
      ...prev,
      publishedLinks: {
        ...prev.publishedLinks,
        [platform]: link
      }
    }));
  };

  const convertStatusToNew = (oldStatus: 'published' | 'pending' | 'error'): 'pending' | 'generated' | 'edited' | 'scheduled' | 'published' => {
    switch (oldStatus) {
      case 'published':
        return 'published';
      case 'pending':
        return 'pending';
      case 'error':
        return 'pending';
      default:
        return 'pending';
    }
  };

  return (
    <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
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

            {/* Slides Carousel - Better error handling and loading */}
            {shouldShowSlides && (
              <div className="space-y-2">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Slides Descargadas ({slideImages.length} imágenes)
                </span>
                <Carousel className="w-full max-w-xs mx-auto">
                  <CarouselContent>
                    {slideImages.map((imageUrl, index) => (
                      <CarouselItem key={`${localEntry.id}-slide-${index}`}>
                        <div className="p-1">
                          <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-md overflow-hidden">
                            <img 
                              src={imageUrl} 
                              alt={`Slide ${index + 1}`}
                              className="w-full h-full object-cover"
                              loading="lazy"
                              onError={(e) => {
                                console.error('Error loading slide image:', imageUrl, 'for entry:', localEntry.id);
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                              }}
                              onLoad={() => {
                                console.log('Successfully loaded slide image:', index, 'for entry:', localEntry.id);
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
                  slideImages={slideImages}
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
                  slideImages={slideImages}
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
                  slideImages={slideImages}
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
