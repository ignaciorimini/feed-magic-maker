
import { useState, useEffect } from 'react';
import { Edit, Instagram, Linkedin, FileText, ExternalLink, Calendar, Download, ImageIcon } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import ContentEditModal from './ContentEditModal';
import WordPressPreview from './WordPressPreview';
import PublishButton from './PublishButton';
import { contentService } from '@/services/contentService';
import { toast } from '@/hooks/use-toast';

interface PlatformPreviewProps {
  platform: 'instagram' | 'linkedin' | 'wordpress';
  content: {
    text: string;
    images: string[];
    publishDate?: string;
    title?: string;
    description?: string;
    slug?: string;
    slidesURL?: string;
  };
  status: 'published' | 'pending' | 'error';
  contentType: string;
  onUpdateContent: (content: any) => Promise<void>;
  entryId?: string;
  topic?: string;
  slideImages?: string[];
  publishedLink?: string;
  onStatusChange?: (newStatus: 'published' | 'pending' | 'error') => void;
  onLinkUpdate?: (link: string) => void;
}

const PlatformPreview = ({ 
  platform, 
  content, 
  status, 
  contentType, 
  onUpdateContent, 
  entryId, 
  topic, 
  slideImages,
  publishedLink,
  onStatusChange,
  onLinkUpdate 
}: PlatformPreviewProps) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [content.images]);

  const getPlatformConfig = (platform: string) => {
    switch (platform) {
      case 'instagram':
        return { name: 'Instagram', icon: Instagram, color: 'from-purple-500 to-pink-500' };
      case 'linkedin':
        return { name: 'LinkedIn', icon: Linkedin, color: 'from-blue-600 to-blue-700' };
      case 'wordpress':
        return { name: 'WordPress', icon: FileText, color: 'from-gray-600 to-gray-700' };
      default:
        return { name: platform, icon: FileText, color: 'from-gray-500 to-gray-600' };
    }
  };

  const config = getPlatformConfig(platform);
  const PlatformIcon = config.icon;

  const truncateText = (text: string, maxLength: number = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

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

  const handleDownloadSlides = async () => {
    if (!content.slidesURL || !entryId || !topic) {
      toast({
        title: "Error",
        description: "No hay URL de slides disponible para descargar.",
        variant: "destructive",
      });
      return;
    }

    setIsDownloading(true);
    try {
      const { data, error } = await contentService.downloadSlidesWithUserWebhook(content.slidesURL, topic);
      
      if (error) {
        throw error;
      }

      // FIXED: Extraer slideImages del formato correcto
      if (Array.isArray(data) && data.length > 0 && data[0].slideImages && Array.isArray(data[0].slideImages)) {
        const slideImages = data[0].slideImages;
        toast({
          title: "¡Slides descargadas exitosamente!",
          description: `Se descargaron ${slideImages.length} imágenes de las slides.`,
        });
        
        // Trigger a page refresh to show the updated slides
        window.location.reload();
      } else {
        toast({
          title: "Descarga completada",
          description: "Las slides han sido procesadas por tu webhook.",
        });
      }
    } catch (error) {
      console.error('Error al descargar slides:', error);
      toast({
        title: "Error al descargar slides",
        description: "Hubo un problema al conectar con tu webhook para descargar las slides.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  // FIXED: Determinar la imagen a mostrar - para Slide Posts usar la primera slide descargada
  const getPreviewImage = () => {
    const isSlidePost = contentType === 'Slide Post';
    const hasSlideImages = slideImages && slideImages.length > 0;

    // Para Slide Posts, mostrar la primera slide descargada si está disponible
    if (isSlidePost && hasSlideImages) {
      return slideImages[0];
    }

    const imageUrl = content.images && content.images.length > 0 ? content.images[0] : '';

    // Para Simple Posts, usar la imagen del contenido si no es un placeholder
    if (imageUrl && !imageUrl.includes('/placeholder.svg') && !imageUrl.includes('placeholder')) {
      return imageUrl;
    }
    
    return '';
  };

  if (platform === 'wordpress') {
    return (
      <WordPressPreview
        content={content}
        status={status}
        contentType={contentType}
        onUpdateContent={onUpdateContent}
        entryId={entryId}
        publishedLink={publishedLink}
        onStatusChange={onStatusChange}
        onLinkUpdate={onLinkUpdate}
      />
    );
  }

  const previewImage = getPreviewImage();
  const isSlidePost = contentType === 'Slide Post';
  const hasSlideImages = slideImages && slideImages.length > 0;

  return (
    <>
      <Card className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className={`w-5 h-5 bg-gradient-to-r ${config.color} rounded flex items-center justify-center`}>
                <PlatformIcon className="w-3 h-3 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {config.name}
              </span>
            </div>
            <div className="flex items-center space-x-1">
              {/* Download Slides Button - solo para Slide Posts que tengan slidesURL y no tengan slides descargadas */}
              {isSlidePost && content.slidesURL && !hasSlideImages && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDownloadSlides}
                  disabled={isDownloading}
                  className="h-7 w-7 p-0 opacity-70 hover:opacity-100"
                  title="Descargar slides"
                >
                  <Download className="w-3 h-3" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowEditModal(true)}
                className="h-7 w-7 p-0 opacity-70 hover:opacity-100"
              >
                <Edit className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0 space-y-3">
          {/* Content Preview */}
          <div className="space-y-2">
            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
              {truncateText(content.text)}
            </p>
          </div>

          {/* Slides Carousel - mostrar solo si es Slide Post y hay slides descargadas */}
          {isSlidePost && hasSlideImages && (
            <div className="space-y-2">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Slides ({slideImages.length} imágenes)
              </span>
              <Carousel className="w-full max-w-full">
                <CarouselContent>
                  {slideImages.map((imageUrl, index) => (
                    <CarouselItem key={index}>
                      <div className="w-full h-32 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
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
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
              </Carousel>
            </div>
          )}

          {/* Image Preview for Simple Posts, or for Slide Posts before slides are downloaded */}
          {!hasSlideImages && (
            <>
              {previewImage && !imageError ? (
                <div className="w-full h-24 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
                  <img
                    src={previewImage}
                    alt="Previsualización de contenido"
                    className="w-full h-full object-cover"
                    onError={() => setImageError(true)}
                  />
                </div>
              ) : (
                <div className="w-full h-24 bg-gray-200 dark:bg-gray-700 rounded-md flex items-center justify-center text-xs text-gray-500 dark:text-gray-400">
                  <ImageIcon className="w-4 h-4 mr-2" />
                  <span>{imageError ? 'Error al cargar imagen' : 'Sin imagen de previsualización'}</span>
                </div>
              )}
            </>
          )}

          {/* Publish Date */}
          {content.publishDate && (
            <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
              <Calendar className="w-3 h-3" />
              <span>Programado: {formatPublishDate(content.publishDate)}</span>
            </div>
          )}

          {/* Published Link - Mostrar si existe y el estado es publicado */}
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

          {/* Status Badge */}
          <div className="flex justify-end">
            <Badge 
              variant={status === 'published' ? 'default' : status === 'pending' ? 'secondary' : 'destructive'}
              className="text-xs"
            >
              {status === 'published' ? 'Publicado' : status === 'pending' ? 'Pendiente' : 'Error'}
            </Badge>
          </div>

          {/* Publish Button - Add for Instagram and LinkedIn */}
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
        </CardContent>
      </Card>

      {showEditModal && (
        <ContentEditModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          platform={platform}
          content={content}
          contentType={contentType}
          onSave={onUpdateContent}
          entryId={entryId || ''}
          topic={topic}
          slideImages={slideImages}
        />
      )}
    </>
  );
};

export default PlatformPreview;
