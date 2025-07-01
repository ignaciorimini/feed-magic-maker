
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
import StatusBadge from './StatusBadge';
import PublishButton from './PublishButton';
import ImagePreview from './platform-preview/ImagePreview';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ContentEditModal from './ContentEditModal';

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
  const [showEditModal, setShowEditModal] = useState(false);

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
        return 'from-pink-50 to-purple-50 border-pink-200';
      case 'linkedin':
        return 'from-blue-50 to-indigo-50 border-blue-200';
      case 'wordpress':
        return 'from-gray-50 to-slate-50 border-gray-200';
      case 'twitter':
        return 'from-sky-50 to-blue-50 border-sky-200';
      default:
        return 'from-gray-50 to-slate-50 border-gray-200';
    }
  };

  const getPlatformAccent = (platform: string) => {
    switch (platform) {
      case 'instagram':
        return 'text-pink-600';
      case 'linkedin':
        return 'text-blue-600';
      case 'wordpress':
        return 'text-gray-600';
      case 'twitter':
        return 'text-sky-600';
      default:
        return 'text-gray-600';
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
      console.log('=== DOWNLOADING SLIDES ===');
      console.log('Platform ID:', id);
      console.log('Slides URL:', slidesUrl);
      console.log('Topic:', topic);

      const { data, error } = await contentService.downloadSlidesWithUserWebhook(
        slidesUrl, 
        topic
      );

      if (error) {
        console.error('Error downloading slides:', error);
        throw error;
      }

      console.log('Webhook response:', data);

      // If the webhook returns slide images, save them to the database
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
          console.log('✅ Slide images saved successfully');
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

  const handleUploadImage = async (platformId: string, file: File) => {
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const imageUrl = e.target?.result as string;
        
        const { error } = await contentService.uploadCustomImage(platformId, imageUrl);
        
        if (error) {
          toast({
            title: "Error al subir imagen",
            description: "No se pudo subir la imagen personalizada.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Imagen subida exitosamente",
            description: "Tu imagen personalizada se ha guardado.",
          });
          
          onRefresh();
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Error inesperado",
        description: "Ocurrió un error al subir la imagen.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteImage = async (platformId: string, imageUrl: string, isUploaded: boolean) => {
    try {
      const { error } = await contentService.deleteImageFromPlatform(platformId, imageUrl, isUploaded);
      
      if (error) {
        toast({
          title: "Error al eliminar imagen",
          description: "No se pudo eliminar la imagen.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Imagen eliminada",
          description: "La imagen ha sido eliminada exitosamente.",
        });
        
        onRefresh();
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      toast({
        title: "Error inesperado",
        description: "Ocurrió un error al eliminar la imagen.",
        variant: "destructive",
      });
    }
  };

  const handleEditClick = () => {
    console.log('Edit button clicked for platform:', id);
    setShowEditModal(true);
  };

  const handleEditSave = async (updatedContent: any) => {
    try {
      console.log('Saving updated content:', updatedContent);
      
      // Here we would call the content service to update the content
      // For now, we'll just close the modal and refresh
      setShowEditModal(false);
      onRefresh();
      
      toast({
        title: "Contenido actualizado",
        description: "Los cambios se han guardado exitosamente.",
      });
    } catch (error) {
      console.error('Error updating content:', error);
      toast({
        title: "Error al actualizar",
        description: "No se pudieron guardar los cambios.",
        variant: "destructive",
      });
    }
  };

  const shouldShowGenerateImage = contentType === 'simple' && !imageUrl;
  const shouldShowSlideDownload = contentType === 'slide' && slidesUrl;

  // Prepare content for edit modal
  const contentForEdit = {
    [platform]: {
      text: text || '',
      images: imageUrl ? [imageUrl] : [],
      slidesURL: slidesUrl,
      contentType: contentType
    }
  };

  return (
    <>
      <Card className={`bg-gradient-to-br ${getPlatformColor(platform)} hover:shadow-lg transition-all duration-200`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className={`${getPlatformAccent(platform)} bg-white/80`}>
                {platform.charAt(0).toUpperCase() + platform.slice(1)}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {formatContentType(contentType)}
              </Badge>
            </div>
            <StatusBadge platform={platform as 'instagram' | 'linkedin' | 'wordpress' | 'twitter'} status={status as 'published' | 'pending' | 'error'} />
          </div>
          
          <CardTitle className={`text-lg font-semibold ${getPlatformAccent(platform)} line-clamp-2`}>
            {topic}
          </CardTitle>
          
          {description && (
            <p className="text-sm text-gray-600 line-clamp-2 mt-1">
              {description}
            </p>
          )}
          
          <div className="text-xs text-gray-500 flex items-center gap-1 mt-2">
            <Calendar className="w-3 h-3" />
            {formatDistanceToNow(parseISO(createdAt), { addSuffix: true, locale: es })}
          </div>
        </CardHeader>

        <CardContent className="pt-0 space-y-4">
          {/* Content preview */}
          {text && (
            <div className="p-3 bg-white/60 rounded-lg border border-white/40">
              <p className="text-sm text-gray-700 line-clamp-3">
                {text.length > 150 ? `${text.substring(0, 150)}...` : text}
              </p>
            </div>
          )}

          {/* Image preview */}
          {imageUrl && (
            <div className="space-y-2">
              <ImagePreview 
                previewImage={imageUrl}
                uploadedImages={[]}
                imageError={false}
                canGenerateImage={shouldShowGenerateImage}
                isGeneratingImage={isGeneratingImage}
                isSlidePost={contentType === 'slide'}
                hasSlidesURL={!!slidesUrl}
                hasSlideImages={slideImages.length > 0}
                isDownloading={isDownloadingSlides}
                platform={platform}
                platformId={id}
                topic={topic}
                description={description || ''}
                onGenerateImage={handleGenerateImage}
                onImageError={() => {}}
                onDownloadSlides={handleDownloadSlides}
                onUploadImage={handleUploadImage}
                onDeleteImage={handleDeleteImage}
              />
            </div>
          )}

          {/* Slide images preview */}
          {slideImages.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">
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
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <ExternalLink className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Slides disponibles</span>
              </div>
              <p className="text-xs text-blue-700 mb-2">
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
          <div className="flex flex-wrap gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleEditClick}
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
              platform={platform as 'instagram' | 'linkedin' | 'wordpress' | 'twitter'}
              currentStatus={status as 'pending' | 'generated' | 'edited' | 'scheduled' | 'published'}
              onStatusChange={() => onRefresh()}
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

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Contenido - {topic}</DialogTitle>
          </DialogHeader>
          <ContentEditModal
            entry={{
              id: id.split('__')[0], // Extract entry ID from composite ID
              topic,
              description: description || '',
              type: contentType === 'slide' ? 'Slide Post' : 'Simple Post',
              platformContent: contentForEdit,
              createdDate: formatDistanceToNow(parseISO(createdAt), { addSuffix: true, locale: es })
            }}
            platform={platform}
            onSave={handleEditSave}
            onCancel={() => setShowEditModal(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PlatformCard;
