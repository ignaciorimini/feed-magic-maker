
import { ExternalLink, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';

interface SlidePreviewProps {
  slidesURL?: string;
  slideImages?: string[];
  isSlidePost: boolean;
  hasSlideImages: boolean;
  isDownloading?: boolean;
  onDownloadSlides?: () => void;
}

const SlidePreview = ({ 
  slidesURL, 
  slideImages, 
  isSlidePost, 
  hasSlideImages,
  isDownloading = false,
  onDownloadSlides
}: SlidePreviewProps) => {
  if (!isSlidePost) return null;

  return (
    <>
      {/* Google Slides Link and Download Section */}
      {slidesURL && (
        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md border border-blue-200 dark:border-blue-700 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-blue-800 dark:text-blue-200">Google Slides:</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-blue-600 hover:text-blue-800 text-xs"
              onClick={() => window.open(slidesURL, '_blank')}
            >
              <ExternalLink className="w-3 h-3 mr-1" />
              Editar slides
            </Button>
          </div>
          <p className="text-xs text-blue-700 dark:text-blue-300">
            Edita las slides y luego descárgalas como imágenes
          </p>
          
          {/* Download Button */}
          {onDownloadSlides && (
            <div className="pt-2 border-t border-blue-200 dark:border-blue-600">
              <Button
                onClick={onDownloadSlides}
                disabled={isDownloading}
                size="sm"
                className="w-full bg-green-600 hover:bg-green-700 text-white text-xs h-7"
              >
                <Download className="w-3 h-3 mr-1" />
                {isDownloading ? 'Descargando slides...' : 'Descargar slides como imágenes'}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Slides Carousel */}
      {hasSlideImages && slideImages && slideImages.length > 0 && (
        <div className="space-y-2">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Slides ({slideImages.length} imágenes)
          </span>
          <Carousel className="w-full max-w-full" showNavigation={true}>
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
    </>
  );
};

export default SlidePreview;
