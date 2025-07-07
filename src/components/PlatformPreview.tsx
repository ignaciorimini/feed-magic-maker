import { useState, useEffect } from 'react';
import { Instagram, Linkedin, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import ContentEditModal from './ContentEditModal';
import WordPressPreview from './WordPressPreview';
import { PlatformHeader, SlidePreview, ImagePreview, PublishInfo } from './platform-preview';
import { contentService } from '@/services/contentService';
import { profileService } from '@/services/profileService';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

interface PlatformPreviewProps {
  platform: 'instagram' | 'linkedin' | 'wordpress';
  content: {
    text: string;
    images: string[];
    uploadedImages?: string[];
    publishDate?: string;
    title?: string;
    description?: string;
    slug?: string;
    slidesURL?: string;
    platformId?: string;
  };
  status: 'pending' | 'generated' | 'edited' | 'scheduled' | 'published';
  contentType: string;
  onUpdateContent: (content: any) => Promise<void>;
  entryId?: string;
  platformId?: string;
  topic?: string;
  slideImages?: string[];
  publishedLink?: string;
  onStatusChange?: (newStatus: 'pending' | 'generated' | 'edited' | 'scheduled' | 'published') => void;
  onLinkUpdate?: (link: string) => void;
  onDeleteEntry?: () => void;
  onDownloadSlides?: () => void;
  onUpdateImage?: () => void;
}

const PlatformPreview = ({ 
  platform, 
  content, 
  status, 
  contentType, 
  onUpdateContent, 
  entryId, 
  platformId,
  topic, 
  slideImages,
  publishedLink,
  onStatusChange,
  onLinkUpdate,
  onDeleteEntry,
  onDownloadSlides,
  onUpdateImage
}: PlatformPreviewProps) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imageError, setImageError] = useState(false);
  const { user } = useAuth();

  // Add defensive checks for content prop
  if (!content) {
    console.error('PlatformPreview: content prop is undefined for platform:', platform);
    return null;
  }

  // Ensure content has required properties with defaults
  const safeContent = {
    text: content.text || '',
    images: content.images || [],
    uploadedImages: content.uploadedImages || [],
    publishDate: content.publishDate,
    title: content.title,
    description: content.description,
    slug: content.slug,
    slidesURL: content.slidesURL,
    platformId: content.platformId || platformId
  };

  useEffect(() => {
    setImageError(false);
  }, [safeContent.images]);

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
    if (!text || text.length <= maxLength) return text || '';
    return text.substring(0, maxLength) + '...';
  };

  // Convert new status to old status for PlatformHeader component
  const convertToOldStatus = (newStatus: 'pending' | 'generated' | 'edited' | 'scheduled' | 'published'): 'pending' | 'published' | 'error' => {
    switch (newStatus) {
      case 'published':
        return 'published';
      case 'pending':
      case 'generated':
      case 'edited':
      case 'scheduled':
      default:
        return 'pending';
    }
  };

  const handleDownloadSlides = async () => {
    if (!safeContent.slidesURL || !entryId || !topic) {
      toast({
        title: "Error",
        description: "No hay URL de slides disponible para descargar.",
        variant: "destructive",
      });
      return;
    }

    setIsDownloading(true);
    try {
      const { data, error } = await contentService.downloadSlidesWithUserWebhook(safeContent.slidesURL, topic);
      
      if (error) {
        throw error;
      }

      if (Array.isArray(data) && data.length > 0 && data[0].slideImages && Array.isArray(data[0].slideImages)) {
        const slideImages = data[0].slideImages;
        toast({
          title: "¡Slides descargadas exitosamente!",
          description: `Se descargaron ${slideImages.length} imágenes de las slides.`,
        });
        
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

  const handleGenerateImage = async () => {
    if (!user || !safeContent.platformId || !topic) {
      toast({
        title: "Error",
        description: "No se puede generar la imagen en este momento.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingImage(true);
    try {
      const { data, error } = await contentService.generateImageForPlatform(
        safeContent.platformId,
        platform,
        topic,
        safeContent.description || ''
      );
      
      if (error) {
        throw error;
      }

      if (data?.imageUrl) {
        toast({
          title: "¡Imagen generada exitosamente!",
          description: "La imagen ha sido generada y actualizada.",
        });
        
        // Reload to show updated content
        window.location.reload();
      }
    } catch (error) {
      console.error('Error al generar imagen:', error);
      toast({
        title: "Error al generar imagen",
        description: "Hubo un problema al generar la imagen. Verifica tu webhook.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleUploadImage = async (platformId: string, file: File) => {
    if (!platformId) {
      toast({
        title: "Error",
        description: "No se puede subir la imagen en este momento.",
        variant: "destructive",
      });
      return;
    }

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
          
          window.location.reload();
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
    if (!platformId) {
      toast({
        title: "Error",
        description: "No se puede eliminar la imagen en este momento.",
        variant: "destructive",
      });
      return;
    }

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
        
        window.location.reload();
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

  const getPreviewImage = () => {
    const isSlidePost = contentType === 'Slide Post';
    const hasSlideImages = slideImages && slideImages.length > 0;

    if (isSlidePost && hasSlideImages) {
      return slideImages[0];
    }

    const imageUrl = safeContent.images && safeContent.images.length > 0 ? safeContent.images[0] : '';
    
    if (imageUrl && 
        typeof imageUrl === 'string' && 
        imageUrl.trim() !== '' &&
        !imageUrl.includes('/placeholder.svg') && 
        !imageUrl.includes('placeholder')) {
      return imageUrl;
    }
    
    return '';
  };

  if (platform === 'wordpress') {
    return (
      <WordPressPreview
        content={safeContent}
        status={status}
        contentType={contentType}
        onUpdateContent={onUpdateContent}
        platformId={platformId || ''}
        publishedLink={publishedLink}
        onStatusChange={onStatusChange}
        onLinkUpdate={onLinkUpdate}
      />
    );
  }

  const previewImage = getPreviewImage();
  const isSlidePost = contentType === 'Slide Post';
  const hasSlideImages = slideImages && slideImages.length > 0;
  const hasImage = previewImage && !imageError;
  const canGenerateImage = !isSlidePost && !hasImage;

  return (
    <>
      <Card className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <PlatformHeader
            platform={platform}
            platformId={safeContent.platformId || ''}
            topic={topic || ''}
            description={safeContent.description || ''}
            isSlidePost={isSlidePost}
            hasSlidesURL={!!safeContent.slidesURL}
            canGenerateImage={canGenerateImage}
            isDownloading={isDownloading}
            isGeneratingImage={isGeneratingImage}
            status={convertToOldStatus(status)}
            publishedLink={publishedLink}
            onEdit={() => setShowEditModal(true)}
            onDownloadSlides={handleDownloadSlides}
            onGenerateImage={handleGenerateImage}
          />
        </CardHeader>
        
        <CardContent className="pt-0 space-y-3">
          <SlidePreview
            slidesURL={safeContent.slidesURL}
            slideImages={slideImages}
            isSlidePost={isSlidePost}
            hasSlideImages={hasSlideImages}
            isDownloading={isDownloading}
            onDownloadSlides={handleDownloadSlides}
          />

          {/* Content Preview */}
          <div className="space-y-2">
            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
              {truncateText(safeContent.text)}
            </p>
          </div>

          {/* Image Preview */}
          <ImagePreview
            previewImage={previewImage}
            uploadedImages={safeContent.uploadedImages}
            imageError={imageError}
            canGenerateImage={canGenerateImage}
            isGeneratingImage={isGeneratingImage}
            isSlidePost={isSlidePost}
            hasSlidesURL={!!safeContent.slidesURL}
            hasSlideImages={hasSlideImages}
            isDownloading={isDownloading}
            platform={platform}
            platformId={safeContent.platformId || ''}
            topic={topic || ''}
            description={safeContent.description || ''}
            onGenerateImage={handleGenerateImage}
            onImageError={() => setImageError(true)}
            onDownloadSlides={handleDownloadSlides}
            onUploadImage={handleUploadImage}
            onDeleteImage={handleDeleteImage}
          />

          <PublishInfo
            publishDate={safeContent.publishDate}
            status={status}
            publishedLink={publishedLink}
            entryId={entryId}
            platform={platform}
            contentType={contentType}
            onStatusChange={onStatusChange}
            onLinkUpdate={onLinkUpdate}
          />
        </CardContent>
      </Card>

      {showEditModal && (
        <ContentEditModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          platform={platform}
          content={safeContent}
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
