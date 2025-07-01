
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Edit, 
  Trash2, 
  Download, 
  ExternalLink, 
  Calendar,
  Sparkles,
  Image as ImageIcon
} from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from '@/hooks/use-toast';
import { contentService } from '@/services/contentService';
import { StatusBadge } from './StatusBadge';
import { PublishButton } from './PublishButton';
import { ImagePreview } from './platform-preview/ImagePreview';

interface PlatformCardProps {
  id: string;
  platform: string;
  contentType: string;
  topic: string;
  description?: string;
  text?: string;
  createdAt: string;
  status: string;
  imageUrl?: string;
  slidesUrl?: string;
  slideImages?: Array<{ image_url: string; position: number }>;
  onEdit: () => void;
  onDelete: () => void;
  onRefresh: () => void;
}

const PlatformCard = ({ 
  id, 
  platform, 
  contentType,
  topic, 
  description, 
  text,
  createdAt, 
  status,
  imageUrl,
  slidesUrl,
  slideImages = [],
  onEdit, 
  onDelete,
  onRefresh 
}: PlatformCardProps) => {
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isDownloadingSlides, setIsDownloadingSlides] = useState(false);

  const formatContentType = (type: string) => {
    switch (type) {
      case 'simple':
        return 'Simple Post';
      case 'slide':
        return 'Slide Post';
      case 'thread':
        return 'Thread';
      case 'article':
        return 'Article';
      default:
        return type;
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'instagram':
        return 'bg-gradient-to-r from-pink-500 to-rose-500';
      case 'linkedin':
        return 'bg-blue-600';
      case 'wordpress':
        return 'bg-gray-700';
      case 'twitter':
        return 'bg-black';
      default:
        return 'bg-gray-500';
    }
  };

  const handleGenerateImage = async () => {
    if (!topic || !description) {
      toast({
        title: "Error",
        description: "Faltan datos necesarios para generar la imagen",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingImage(true);
    
    try {
      const { data, error } = await contentService.generateImageForPlatform(
        id, 
        platform, 
        topic, 
        description
      );

      if (error) {
        throw error;
      }

      toast({
        title: "¡Imagen generada!",
        description: "La imagen se ha generado y guardado correctamente",
      });

      onRefresh();
    } catch (error) {
      console.error('Error generating image:', error);
      toast({
        title: "Error al generar imagen",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleDownloadSlides = async () => {
    if (!slidesUrl) {
      toast({
        title: "Error",
        description: "No hay URL de slides disponible",
        variant: "destructive",
      });
      return;
    }

    setIsDownloadingSlides(true);
    
    try {
      const { data, error } = await contentService.downloadSlidesWithUserWebhook(
        slidesUrl, 
        topic
      );

      if (error) {
        throw error;
      }

      // If slide images were returned, save them to the database
      if (data?.slideImages && Array.isArray(data.slideImages)) {
        console.log('Saving slide images for platform:', id);
        const { error: saveError } = await contentService.saveSlideImages(id, data.slideImages);
        
        if (saveError) {
          console.error('Error saving slide images:', saveError);
          toast({
            title: "Slides descargadas",
            description: "Las slides se descargaron pero hubo un error al guardarlas en la base de datos",
            variant: "destructive",
          });
        } else {
          toast({
            title: "¡Slides descargadas!",
            description: "Las slides se han descargado y guardado correctamente",
          });
          onRefresh();
        }
      } else {
        toast({
          title: "Descarga iniciada",
          description: "El proceso de descarga de slides ha comenzado",
        });
      }
    } catch (error) {
      console.error('Error downloading slides:', error);
      toast({
        title: "Error al descargar slides",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      });
    } finally {
      setIsDownloadingSlides(false);
    }
  };

  const shouldShowGenerateImage = contentType === 'simple' && !imageUrl;
  const shouldShowSlideDownload = contentType === 'slide' && slidesUrl;

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge className={`${getPlatformColor(platform)} text-white border-0`}>
                {platform.charAt(0).toUpperCase() + platform.slice(1)}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {formatContentType(contentType)}
              </Badge>
              <StatusBadge status={status} />
            </div>
            <CardTitle className="text-lg font-semibold text-gray-900 line-clamp-2">
              {topic}
            </CardTitle>
            {description && (
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                {description}
              </p>
            )}
          </div>
        </div>
        
        <div className="text-xs text-gray-500 flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {formatDistanceToNow(parseISO(createdAt), { addSuffix: true, locale: es })}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Content preview */}
        {text && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700 line-clamp-3">
              {text.length > 150 ? `${text.substring(0, 150)}...` : text}
            </p>
          </div>
        )}

        {/* Image preview */}
        {imageUrl && (
          <div className="mb-4">
            <ImagePreview 
              imageUrl={imageUrl} 
              platform={platform}
              onRefresh={onRefresh}
            />
          </div>
        )}

        {/* Slide images preview */}
        {slideImages.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              Slides ({slideImages.length})
            </h4>
            <div className="grid grid-cols-3 gap-2">
              {slideImages.slice(0, 6).map((slide, index) => (
                <img
                  key={index}
                  src={slide.image_url}
                  alt={`Slide ${index + 1}`}
                  className="w-full h-16 object-cover rounded border"
                />
              ))}
              {slideImages.length > 6 && (
                <div className="w-full h-16 bg-gray-100 rounded border flex items-center justify-center text-xs text-gray-500">
                  +{slideImages.length - 6} más
                </div>
              )}
            </div>
          </div>
        )}

        {/* Slides URL info */}
        {shouldShowSlideDownload && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <ExternalLink className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Slides disponibles</span>
            </div>
            <p className="text-xs text-blue-600 mb-2">
              Modifica las slides antes de descargar si es necesario
            </p>
            <a 
              href={slidesUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:text-blue-800 underline break-all"
            >
              Ver slides →
            </a>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onEdit}
            className="flex-1 min-w-0"
          >
            <Edit className="w-4 h-4 mr-1" />
            Editar
          </Button>

          {shouldShowGenerateImage && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateImage}
              disabled={isGeneratingImage}
              className="flex-1 min-w-0"
            >
              <Sparkles className="w-4 h-4 mr-1" />
              {isGeneratingImage ? 'Generando...' : 'Generar Imagen'}
            </Button>
          )}

          {shouldShowSlideDownload && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadSlides}
              disabled={isDownloadingSlides}
              className="flex-1 min-w-0"
            >
              <Download className="w-4 h-4 mr-1" />
              {isDownloadingSlides ? 'Descargando...' : 'Descargar Slides'}
            </Button>
          )}

          <PublishButton
            platformId={id}
            platform={platform}
            status={status}
            onRefresh={onRefresh}
          />

          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PlatformCard;
