
import { useState, useEffect } from 'react';
import { Calendar, Edit, ExternalLink, Download, MoreVertical, Trash2, ImageIcon, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import StatusBadge from './StatusBadge';
import ContentEditModal from './ContentEditModal';
import PublishButton from './PublishButton';
import { useAuth } from '@/hooks/useAuth';
import { profileService } from '@/services/profileService';
import { contentService } from '@/services/contentService';
import { toast } from '@/hooks/use-toast';

interface PlatformCardProps {
  entry: {
    id: string;
    topic: string;
    description: string;
    type: string;
    contentType?: string;
    createdDate: string;
    status: {
      instagram: 'published' | 'pending' | 'error';
      linkedin: 'published' | 'pending' | 'error';
      wordpress: 'published' | 'pending' | 'error';
      twitter: 'published' | 'pending' | 'error';
    };
    platformContent: {
      instagram: any;
      linkedin: any;
      wordpress: any;
      twitter: any;
    };
    slideImages?: string[];
    publishedLinks?: {
      instagram?: string;
      linkedin?: string;
      wordpress?: string;
      twitter?: string;
    };
    imageUrl?: string;
  };
  platform: 'instagram' | 'linkedin' | 'wordpress' | 'twitter';
  onUpdateContent: (entryId: string, platform: string, content: any) => Promise<void>;
  onDeleteEntry: (entryId: string, platform: string) => void;
  onDownloadSlides?: (entryId: string, slidesURL: string) => void;
  onUpdateStatus?: (entryId: string, platform: string, newStatus: 'published' | 'pending' | 'error') => void;
  onUpdateLink?: (entryId: string, platform: string, link: string) => void;
  onUpdateImage?: (entryId: string, imageUrl: string | null) => Promise<void>;
  onReloadEntries?: () => void;
  onStatsUpdate?: () => void;
}

// Utility function to validate image URLs
const getValidImageUrl = (url?: string | null): string | null => {
  if (!url || typeof url !== 'string') return null;
  // Basic URL validation
  try {
    new URL(url);
    return url;
  } catch {
    return null;
  }
};

const PlatformCard = ({ entry, platform, onUpdateContent, onDeleteEntry, onDownloadSlides, onUpdateStatus, onUpdateLink, onUpdateImage, onReloadEntries, onStatsUpdate }: PlatformCardProps) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);
  const [imagePreviewIndex, setImagePreviewIndex] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isDownloadingSlides, setIsDownloadingSlides] = useState(false);
  const [localEntry, setLocalEntry] = useState(entry);
  const [slideImages, setSlideImages] = useState<string[]>([]);
  const { user } = useAuth();

  // Get the platform ID by combining entry ID with platform
  const platformId = `${entry.id}__${platform}`;

  useEffect(() => {
    setLocalEntry(entry);
    setImageError(false);
  }, [entry]);

  // Fetch slide images from database
  useEffect(() => {
    const fetchSlideImages = async () => {
      try {
        const { data, error } = await contentService.getSlideImages(platformId);
        if (error) {
          console.error('Error fetching slide images:', error);
        } else if (data) {
          setSlideImages(data.map(img => img.image_url));
        }
      } catch (error) {
        console.error('Error fetching slide images:', error);
      }
    };

    fetchSlideImages();
  }, [platformId]);

  const platformConfig = {
    instagram: {
      name: 'Instagram',
      gradient: 'from-pink-500 to-rose-500',
      bgGradient: 'from-pink-50 to-rose-50',
      borderColor: 'border-pink-200'
    },
    linkedin: {
      name: 'LinkedIn',
      gradient: 'from-blue-500 to-cyan-500',
      bgGradient: 'from-blue-50 to-cyan-50',
      borderColor: 'border-blue-200'
    },
    wordpress: {
      name: 'WordPress',
      gradient: 'from-gray-500 to-slate-500',
      bgGradient: 'from-gray-50 to-slate-50',
      borderColor: 'border-gray-200'
    },
    twitter: {
      name: 'X (Twitter)',
      gradient: 'from-black to-gray-800',
      bgGradient: 'from-gray-50 to-gray-100',
      borderColor: 'border-gray-300'
    }
  };

  const config = platformConfig[platform];
  const content = localEntry.platformContent[platform];
  const status = localEntry.status[platform];
  
  // Fix: Get published_url from the content object (which comes from content_platforms table)
  const publishedLink = content?.published_url || localEntry.publishedLinks?.[platform];

  // Only show the card if this platform has content or a status (not null)
  if (!content && status === null) {
    return null;
  }

  const truncateText = (text: string, maxLength: number = 60) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Use slide images from state (fetched from database)
  const hasSlides = slideImages && slideImages.length > 0;
  
  // Use the contentType from the entry if available, otherwise determine from type
  const contentType = localEntry.contentType || (localEntry.type === 'Slide Post' ? 'slide' : 'simple');
  const isSlidePost = contentType === 'slide';

  // Check if content is a thread for Twitter
  const isThread = platform === 'twitter' && content?.threadPosts && content.threadPosts.length > 0;

  const handleDelete = () => {
    onDeleteEntry(localEntry.id, platform);
  };

  const handleDownloadSlides = async () => {
    if (!content?.slidesURL) {
      toast({
        title: "Error",
        description: "No hay URL de slides disponible.",
        variant: "destructive",
      });
      return;
    }

    setIsDownloadingSlides(true);
    
    try {
      console.log("=== DOWNLOADING SLIDES FOR PLATFORM ===");
      console.log("Platform ID:", platformId);
      console.log("Slides URL:", content.slidesURL);
      console.log("Topic:", localEntry.topic);
      
      // Usar el nuevo método específico para plataformas
      const { data, error } = await contentService.downloadSlidesForPlatform(
        platformId,
        content.slidesURL,
        localEntry.topic
      );
      
      if (error) {
        console.error('Error downloading slides:', error);
        toast({
          title: "Error al descargar slides",
          description: `No se pudieron descargar las slides: ${error.message || 'Verifica tu webhook'}`,
          variant: "destructive",
        });
      } else {
        console.log('Slides downloaded successfully:', data);
        
        toast({
          title: "¡Slides descargadas exitosamente!",
          description: `Se descargaron las slides para ${config.name}.`,
        });
        
        // Reload entries to show the new slides from database
        if (onReloadEntries) {
          onReloadEntries();
        }
      }
    } catch (error) {
      console.error('Unexpected error downloading slides:', error);
      toast({
        title: "Error inesperado",
        description: "Ocurrió un error al descargar las slides.",
        variant: "destructive",
      });
    } finally {
      setIsDownloadingSlides(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!user || !localEntry.id) {
      toast({
        title: "Error",
        description: "No se puede generar la imagen en este momento.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingImage(true);
    try {
      console.log("=== GENERATING IMAGE FOR SPECIFIC PLATFORM ===");
      console.log("Platform ID:", platformId);
      console.log("Platform:", platform);
      console.log("Topic:", localEntry.topic);
      console.log("Description:", localEntry.description);
      
      // Use the generateImageForPlatform service with the specific platformId
      const { data, error } = await contentService.generateImageForPlatform(
        platformId, 
        platform, 
        localEntry.topic, 
        localEntry.description
      );
      
      if (error) {
        console.error('Error from generateImageForPlatform:', error);
        toast({
          title: "Error al generar imagen",
          description: `No se pudo generar la imagen: ${error.message || 'Verifica tu webhook'}`,
          variant: "destructive",
        });
      } else {
        console.log('Image generated successfully:', data);
        
        toast({
          title: "¡Imagen generada exitosamente!",
          description: `Se generó la imagen para ${config.name}.`,
        });
        
        // Reload entries to show the new image from database
        if (onReloadEntries) {
          onReloadEntries();
        }
      }
    } catch (error) {
      console.error('Unexpected error generating image:', error);
      toast({
        title: "Error inesperado",
        description: "Ocurrió un error al generar la imagen.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // For slide posts, use the first slide as preview image if available
  const displayImage = isSlidePost && hasSlides 
    ? getValidImageUrl(slideImages[0])
    : getValidImageUrl(content?.image_url);
  const hasImage = displayImage && !imageError;
  const canGenerateImage = !isSlidePost && !hasImage; // Only show for simple posts without image

  // Convert old status to new status format
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

  // Convert new status to old status format
  const convertStatusToOld = (newStatus: 'pending' | 'generated' | 'edited' | 'scheduled' | 'published'): 'published' | 'pending' | 'error' => {
    switch (newStatus) {
      case 'published':
        return 'published';
      case 'pending':
      case 'generated':
      case 'edited':
      case 'scheduled':
        return 'pending';
      default:
        return 'pending';
    }
  };

  const handleStatusUpdate = (newStatus: 'pending' | 'generated' | 'edited' | 'scheduled' | 'published') => {
    const convertedStatus: 'published' | 'pending' | 'error' = 
      newStatus === 'published' ? 'published' : 'pending';
    
    // Update local state
    setLocalEntry(prev => ({
      ...prev,
      status: {
        ...prev.status,
        [platform]: convertedStatus
      }
    }));
    
    // Notify parent component
    if (onUpdateStatus) {
      onUpdateStatus(localEntry.id, platform, convertedStatus);
    }
  };

  const handleLinkUpdate = (link: string) => {
    // Update local state
    setLocalEntry(prev => ({
      ...prev,
      publishedLinks: {
        ...prev.publishedLinks,
        [platform]: link
      }
    }));
    
    // Notify parent component
    if (onUpdateLink) {
      onUpdateLink(localEntry.id, platform, link);
    }
  };

  return (
    <>
      <Card className={`bg-gradient-to-br ${config.bgGradient} ${config.borderColor} border-2 hover:shadow-xl transition-all duration-300 group flex flex-col h-full`}>
        {/* Header */}
        <CardHeader className="p-4 pb-2 flex-shrink-0">
          {/* Platform and Status in same flexbox - Status aligned right */}
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center space-x-2">
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold text-white bg-gradient-to-r ${config.gradient}`}>
                {config.name}
              </div>
              {isThread && (
                <Badge variant="outline" className="text-xs bg-gray-100 text-gray-800">
                  Thread
                </Badge>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              {status && <StatusBadge platform={platform} status={status} />}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem 
                    onClick={() => setShowEditModal(true)}
                    className="focus:bg-blue-50"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={handleDelete}
                    className="text-red-600 focus:text-red-600 focus:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Eliminar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 text-sm leading-tight mb-1">
              {localEntry.topic}
            </h3>
            <Badge variant="outline" className="text-xs">
              {localEntry.type}
            </Badge>
          </div>
        </CardHeader>

        {/* Content */}
        <CardContent className="p-4 pt-2 flex-1 flex flex-col space-y-3">
          {/* Description */}
          <p className="text-xs text-gray-600 line-clamp-2">
            {truncateText(localEntry.description, 80)}
          </p>

          {/* Twitter Thread Preview */}
          {platform === 'twitter' && isThread ? (
            <div className="flex-1">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-2">
                Hilo ({content.threadPosts.length} tweets)
              </span>
              <div className="max-h-32 overflow-y-auto space-y-2 bg-white rounded-md p-2 border">
                {content.threadPosts.slice(0, 3).map((tweet: string, index: number) => (
                  <div key={index} className="text-xs text-gray-700 p-1.5 rounded border-l-2 border-gray-800">
                    <span className="text-gray-800 font-medium">{index + 1}/</span> {truncateText(tweet, 50)}
                  </div>
                ))}
                {content.threadPosts.length > 3 && (
                  <p className="text-xs text-gray-500 italic text-center">
                    ... y {content.threadPosts.length - 3} tweets más
                  </p>
                )}
              </div>
            </div>
          ) : (
            /* Regular content preview */
            <>
              {/* Slides Carousel */}
              {isSlidePost && hasSlides && (
                <div className="flex-1">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-2">
                    Slides ({slideImages.length})
                  </span>
                  <Carousel className="w-full">
                    <CarouselContent>
                      {slideImages.map((imageUrl: string, index: number) => (
                        <CarouselItem key={index}>
                          <div className="aspect-video bg-white rounded-md overflow-hidden border">
                            <img 
                              src={imageUrl} 
                              alt={`Slide ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    <CarouselPrevious className="h-6 w-6" />
                    <CarouselNext className="h-6 w-6" />
                  </Carousel>
                </div>
              )}

              {/* Single Image or Slide URL for Slide Posts */}
              {(!isSlidePost || !hasSlides) && (
                <div className="flex-1">
                  <div className="aspect-video bg-white rounded-md overflow-hidden border flex items-center justify-center">
                    {/* Show slides URL for slide posts without downloaded slides */}
                    {isSlidePost && content?.slidesURL && !hasSlides ? (
                      <div className="text-center text-xs text-gray-700 p-4">
                        <div className="mb-2">
                          <span className="text-sm font-medium">Slides URL disponible</span>
                        </div>
                        <div className="text-gray-600 break-all mb-2">
                          {content.slidesURL}
                        </div>
                        <p className="text-gray-500 italic mb-3">
                          Modifica las slides antes de descargar
                        </p>
                        <Button
                          onClick={handleDownloadSlides}
                          disabled={isDownloadingSlides}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <Download className="w-3 h-3 mr-1" />
                          {isDownloadingSlides ? 'Descargando...' : 'Descargar slides'}
                        </Button>
                      </div>
                    ) : hasImage ? (
                      <img 
                        src={displayImage!} 
                        alt="Previsualización de contenido"
                        className="w-full h-full object-cover"
                        onError={() => setImageError(true)}
                      />
                    ) : (
                      <div className="text-center text-xs text-gray-500 p-2 flex flex-col items-center justify-center h-full">
                        <ImageIcon className="w-6 h-6 mx-auto mb-1 text-gray-400" />
                        <span className="mb-2">{imageError ? 'Error al cargar imagen' : 'Sin imagen'}</span>
                        {/* Generate Image Button only for simple posts */}
                        {canGenerateImage && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleGenerateImage}
                            disabled={isGeneratingImage}
                            className="h-7 px-3 text-xs"
                          >
                            {isGeneratingImage ? (
                              <>
                                <Sparkles className="w-3 h-3 mr-1 animate-spin" />
                                Generando...
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-3 h-3 mr-1" />
                                Generar Imagen
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Status and Actions */}
          <div className="space-y-2 mt-auto">
            {/* Published Link - Show prominently if content is published and has published_url */}
            {status === 'published' && publishedLink && (
              <div className="pt-2 border-t border-gray-200">
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => window.open(publishedLink, '_blank')}
                  className="w-full text-xs bg-green-600 hover:bg-green-700 text-white"
                >
                  <ExternalLink className="w-3 h-3 mr-2" />
                  Ver publicación en {config.name}
                </Button>
              </div>
            )}
            
            {/* Publish Button with stats update */}
            {status !== 'published' && onUpdateStatus && onUpdateLink && (
              <div className="pt-2">
                <PublishButton
                  platformId={platformId}
                  platform={platform as 'instagram' | 'linkedin' | 'wordpress' | 'twitter'}
                  currentStatus={convertStatusToNew(status)}
                  contentType={localEntry.type}
                  onStatusChange={handleStatusUpdate}
                  onLinkUpdate={handleLinkUpdate}
                  onStatsUpdate={onStatsUpdate}
                />
              </div>
            )}
            
            {/* Action Buttons - Always visible */}
            <div className="flex space-x-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowEditModal(true)}
                className="text-xs flex-1"
              >
                <Edit className="w-3 h-3 mr-1" />
                Editar
              </Button>
              
              {isSlidePost && content?.slidesURL && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadSlides}
                  disabled={isDownloadingSlides}
                  className="text-xs"
                >
                  {isDownloadingSlides ? (
                    <Download className="w-3 h-3 animate-spin" />
                  ) : (
                    <Download className="w-3 h-3" />
                  )}
                </Button>
              )}
              
              {/* Generate Image Button - Only for simple posts without image */}
              {canGenerateImage && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateImage}
                  disabled={isGeneratingImage}
                  className="text-xs"
                >
                  {isGeneratingImage ? (
                    <Sparkles className="w-3 h-3 animate-spin" />
                  ) : (
                    <Sparkles className="w-3 h-3" />
                  )}
                </Button>
              )}
            </div>

            {/* Date */}
            <div className="flex items-center text-xs text-gray-500">
              <Calendar className="w-3 h-3 mr-1" />
              <span>{localEntry.createdDate}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Modal */}
      {showEditModal && (
        <ContentEditModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          platform={platform}
          content={content}
          contentType={isThread ? 'Thread' : localEntry.type}
          onSave={async (updatedContent) => onUpdateContent(platformId, platform, updatedContent)}
          entryId={platformId}
          topic={localEntry.topic}
          description={localEntry.description}
          slideImages={slideImages}
          imageUrl={content?.image_url}
          onUpdateImage={onUpdateImage}
        />
      )}
    </>
  );
};

export default PlatformCard;
