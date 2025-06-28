
import { Download, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SlideDownloadAreaProps {
  isSlidePost: boolean;
  hasSlidesURL: boolean;
  hasSlideImages: boolean;
  isDownloading: boolean;
  onDownloadSlides: () => void;
}

const SlideDownloadArea = ({ 
  isSlidePost, 
  hasSlidesURL, 
  hasSlideImages, 
  isDownloading, 
  onDownloadSlides 
}: SlideDownloadAreaProps) => {
  // Only show for Slide Posts that don't have downloaded slides yet
  if (!isSlidePost || hasSlideImages) return null;

  if (!hasSlidesURL) {
    return (
      <div className="w-full h-32 bg-amber-50 dark:bg-amber-900/20 rounded-md flex flex-col items-center justify-center space-y-2 border border-amber-200 dark:border-amber-700">
        <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
        <span className="text-sm text-amber-700 dark:text-amber-300 text-center px-2">
          No hay URL de slides
        </span>
      </div>
    );
  }

  return (
    <div className="w-full h-32 bg-blue-50 dark:bg-blue-900/20 rounded-md flex flex-col items-center justify-center space-y-3 border border-blue-200 dark:border-blue-700">
      <span className="text-sm text-blue-700 dark:text-blue-300 text-center px-2">
        Slides pendientes de descarga
      </span>
      <Button
        onClick={onDownloadSlides}
        disabled={isDownloading}
        size="sm"
        className="bg-green-600 hover:bg-green-700 text-white"
      >
        <Download className="w-4 h-4 mr-2" />
        {isDownloading ? 'Descargando...' : 'Descargar slides'}
      </Button>
    </div>
  );
};

export default SlideDownloadArea;
