
import { Sparkles, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImagePreviewProps {
  previewImage: string;
  imageError: boolean;
  canGenerateImage: boolean;
  isGeneratingImage: boolean;
  isSlidePost?: boolean;
  hasSlidesURL?: boolean;
  hasSlideImages?: boolean;
  isDownloading?: boolean;
  imageUrl?: string; // NEW: Add imageUrl prop from database
  onGenerateImage: () => void;
  onImageError: () => void;
  onDownloadSlides?: () => void;
}

const ImagePreview = ({ 
  previewImage, 
  imageError, 
  canGenerateImage, 
  isGeneratingImage,
  isSlidePost = false,
  hasSlidesURL = false,
  hasSlideImages = false,
  isDownloading = false,
  imageUrl, // NEW: imageUrl from database
  onGenerateImage, 
  onImageError,
  onDownloadSlides
}: ImagePreviewProps) => {
  // FIXED: Prioritize imageUrl from database over previewImage
  const displayImage = imageUrl || previewImage;

  // For Slide Posts without downloaded slides, show download area
  if (isSlidePost && !hasSlideImages) {
    if (!hasSlidesURL) {
      return (
        <div className="w-full h-32 bg-amber-50 dark:bg-amber-900/20 rounded-md flex flex-col items-center justify-center space-y-2 border border-amber-200 dark:border-amber-700">
          <span className="text-sm text-amber-700 dark:text-amber-300 text-center px-2">
            No hay URL de slides
          </span>
        </div>
      );
    }

    return (
      <div className="w-full h-32 bg-gray-200 dark:bg-gray-700 rounded flex flex-col items-center justify-center space-y-2">
        <span className="text-xs text-gray-500 dark:text-gray-400 text-center">Sin imagen</span>
        <span className="text-xs text-blue-600 dark:text-blue-400 text-center">Slides pendientes de descarga</span>
        {onDownloadSlides && (
          <Button
            onClick={onDownloadSlides}
            disabled={isDownloading}
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white h-7 px-3 text-xs"
          >
            <Download className="w-3 h-3 mr-1" />
            {isDownloading ? 'Descargando...' : 'Descargar slides'}
          </Button>
        )}
      </div>
    );
  }

  // For Simple Posts or Slide Posts with downloaded slides, show image preview
  if (displayImage && !imageError) {
    return (
      <div className="w-full h-32 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
        <img 
          src={displayImage} 
          alt="Content preview"
          className="w-full h-full object-cover"
          onError={onImageError}
        />
      </div>
    );
  }

  // Show placeholder with generate option for Simple Posts
  if (!isSlidePost) {
    return (
      <div className="w-full h-32 bg-gray-200 dark:bg-gray-700 rounded flex flex-col items-center justify-center space-y-2">
        <span className="text-xs text-gray-500 dark:text-gray-400 text-center">Sin imagen</span>
        {canGenerateImage && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onGenerateImage}
            disabled={isGeneratingImage}
            className="h-7 px-2 text-xs"
          >
            {isGeneratingImage ? (
              <Sparkles className="w-3 h-3 animate-spin" />
            ) : (
              <Sparkles className="w-3 h-3" />
            )}
          </Button>
        )}
      </div>
    );
  }

  return null;
};

export default ImagePreview;
