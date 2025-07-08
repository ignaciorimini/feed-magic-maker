
import { Sparkles, Download, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImagePreviewProps {
  previewImage?: string;
  uploadedImages?: string[];
  imageError: boolean;
  canGenerateImage: boolean;
  isGeneratingImage: boolean;
  isSlidePost?: boolean;
  hasSlidesURL?: boolean;
  hasSlideImages?: boolean;
  isDownloading?: boolean;
  platform: string;
  platformId: string;
  topic: string;
  description: string;
  onGenerateImage: (platformId: string, platform: string, topic: string, description: string) => void;
  onImageError: () => void;
  onDownloadSlides?: () => void;
  onUploadImage?: (platformId: string, file: File) => void;
  onDeleteImage?: (platformId: string, imageUrl: string, isUploaded: boolean) => void;
}

const ImagePreview = ({ 
  previewImage,
  uploadedImages = [],
  imageError, 
  canGenerateImage, 
  isGeneratingImage,
  isSlidePost = false,
  hasSlidesURL = false,
  hasSlideImages = false,
  isDownloading = false,
  platform,
  platformId,
  topic,
  description,
  onGenerateImage, 
  onImageError,
  onDownloadSlides,
  onUploadImage,
  onDeleteImage
}: ImagePreviewProps) => {
  
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && onUploadImage) {
      onUploadImage(platformId, file);
    }
  };

  const allImages = [
    ...(previewImage && !imageError ? [previewImage] : []),
    ...uploadedImages
  ];

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

  // Show images if available
  if (allImages.length > 0) {
    return (
      <div className="w-full space-y-2">
        <div className="grid grid-cols-2 gap-2">
          {allImages.map((imageUrl, index) => (
            <div key={index} className="relative group">
              <div className="w-full h-16 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
                <img 
                  src={imageUrl} 
                  alt={`Content preview ${index + 1}`}
                  className="w-full h-full object-cover"
                  onError={onImageError}
                />
              </div>
              {onDeleteImage && (
                <button
                  onClick={() => onDeleteImage(platformId, imageUrl, index >= (previewImage && !imageError ? 1 : 0))}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                >
                  <X className="w-2 h-2" />
                </button>
              )}
            </div>
          ))}
        </div>
        
        {/* Action buttons */}
        <div className="flex space-x-2">
          {canGenerateImage && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onGenerateImage(platformId, platform, topic, description)}
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
          
          {onUploadImage && (
            <label className="cursor-pointer">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                asChild
              >
                <span>
                  <Upload className="w-3 h-3" />
                </span>
              </Button>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          )}
        </div>
      </div>
    );
  }

  // Show placeholder with generate/upload options
  return (
    <div className="w-full h-32 bg-gray-200 dark:bg-gray-700 rounded flex flex-col items-center justify-center space-y-2">
      <span className="text-xs text-gray-500 dark:text-gray-400 text-center">Sin imagen</span>
      
      <div className="flex space-x-2">
        {canGenerateImage && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onGenerateImage(platformId, platform, topic, description)}
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
        
        {onUploadImage && (
          <label className="cursor-pointer">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              asChild
            >
              <span>
                <Upload className="w-3 h-3" />
              </span>
            </Button>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        )}
      </div>
    </div>
  );
};

export default ImagePreview;
