
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
    publishDate?: string;
    title?: string;
    description?: string;
    slug?: string;
    slidesURL?: string;
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
    if (!user || !entryId) {
      toast({
        title: "Error",
        description: "No se puede generar la imagen en este momento.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingImage(true);
    try {
      console.log("Obteniendo webhook del perfil del usuario para generar imagen...");
      
      const { data: profile, error: profileError } = await profileService.getUserProfile(user.id);
      
      if (profileError || !profile?.webhook_url) {
        toast({
          title: "Webhook no configurado",
          description: "Debes configurar tu webhook URL en el perfil para generar imágenes.",
          variant: "destructive",
        });
        return;
      }

      console.log("Enviando solicitud de generación de imagen al webhook:", profile.webhook_url);
      
      const response = await fetch(profile.webhook_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'generate_image',
          topic: topic,
          platform: platform,
          userEmail: user.email
        }),
      });

      if (!response.ok) {
        throw new Error(`Error del servidor: ${response.status}`);
      }

      const result = await response.json();
      console.log("Respuesta de generación de imagen:", result);

      if (result.imageURL) {
        const updatedContent = {
          ...content,
          images: [result.imageURL]
        };
        
        await onUpdateContent(updatedContent);
        
        toast({
          title: "¡Imagen generada exitosamente!",
          description: "La imagen ha sido generada y actualizada.",
        });
      } else {
        throw new Error("No se recibió una URL de imagen válida");
      }
    } catch (error) {
      console.error('Error al generar imagen:', error);
      toast({
        title: "Error al generar imagen",
        description: "Hubo un problema al generar la imagen. Inténtalo nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const getPreviewImage = () => {
    const isSlidePost = contentType === 'Slide Post';
    const hasSlideImages = slideImages && slideImages.length > 0;

    if (isSlidePost && hasSlideImages) {
      console.log('Using slide image:', slideImages[0]);
      return slideImages[0];
    }

    const imageUrl = content.images && content.images.length > 0 ? content.images[0] : '';
    
    console.log('Image URL from content:', imageUrl);
    console.log('Content images array:', content.images);

    if (imageUrl && 
        typeof imageUrl === 'string' && 
        imageUrl.trim() !== '' &&
        !imageUrl.includes('/placeholder.svg') && 
        !imageUrl.includes('placeholder')) {
      console.log('Using valid image URL:', imageUrl);
      return imageUrl;
    }
    
    console.log('No valid image found, returning empty string');
    return '';
  };

  if (platform === 'wordpress') {
    return (
      <WordPressPreview
        content={content}
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

  console.log('Preview image determined:', previewImage);
  console.log('Is slide post:', isSlidePost);
  console.log('Has slides URL:', !!content.slidesURL);
  console.log('Has slide images:', hasSlideImages);

  return (
    <>
      <Card className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <PlatformHeader
            platform={platform}
            isSlidePost={isSlidePost}
            hasSlidesURL={!!content.slidesURL}
            canGenerateImage={canGenerateImage}
            isDownloading={isDownloading}
            isGeneratingImage={isGeneratingImage}
            status={status}
            publishedLink={publishedLink}
            onEdit={() => setShowEditModal(true)}
            onDownloadSlides={handleDownloadSlides}
            onGenerateImage={handleGenerateImage}
          />
        </CardHeader>
        
        <CardContent className="pt-0 space-y-3">
          <SlidePreview
            slidesURL={content.slidesURL}
            slideImages={slideImages}
            isSlidePost={isSlidePost}
            hasSlideImages={hasSlideImages}
            isDownloading={isDownloading}
            onDownloadSlides={handleDownloadSlides}
          />

          {/* Content Preview */}
          <div className="space-y-2">
            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
              {truncateText(content.text)}
            </p>
          </div>

          {/* Image Preview - Updated to handle Slide Posts better */}
          <ImagePreview
            previewImage={previewImage}
            imageError={imageError}
            canGenerateImage={canGenerateImage}
            isGeneratingImage={isGeneratingImage}
            isSlidePost={isSlidePost}
            hasSlidesURL={!!content.slidesURL}
            hasSlideImages={hasSlideImages}
            isDownloading={isDownloading}
            onGenerateImage={handleGenerateImage}
            onImageError={() => setImageError(true)}
            onDownloadSlides={handleDownloadSlides}
          />

          <PublishInfo
            publishDate={content.publishDate}
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
