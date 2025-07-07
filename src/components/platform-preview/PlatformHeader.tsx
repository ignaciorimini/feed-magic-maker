
import { Edit, Download, Sparkles, Instagram, Linkedin, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface PlatformHeaderProps {
  platform: 'instagram' | 'linkedin' | 'wordpress';
  platformId: string;
  topic: string;
  description: string;
  isSlidePost: boolean;
  hasSlidesURL: boolean;
  canGenerateImage: boolean;
  isDownloading: boolean;
  isGeneratingImage: boolean;
  status: 'published' | 'pending' | 'error';
  publishedLink?: string;
  onEdit: () => void;
  onDownloadSlides: () => void;
  onGenerateImage: () => void;
}

const PlatformHeader = ({
  platform,
  platformId,
  topic,
  description,
  isSlidePost,
  hasSlidesURL,
  canGenerateImage,
  isDownloading,
  isGeneratingImage,
  status,
  publishedLink,
  onEdit,
  onDownloadSlides,
  onGenerateImage
}: PlatformHeaderProps) => {
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

  return (
    <div className="space-y-2">
      {/* Botones de configuración arriba */}
      <div className="flex justify-end">
        <div className="flex items-center space-x-1">
          {canGenerateImage && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onGenerateImage}
              disabled={isGeneratingImage}
              className="h-7 w-7 p-0"
              title="Generar imagen"
            >
              <Sparkles className="w-3 h-3" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            className="h-7 w-7 p-0"
          >
            <Edit className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Plataforma y estado en la misma línea horizontal */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className={`w-5 h-5 bg-gradient-to-r ${config.color} rounded flex items-center justify-center`}>
            <PlatformIcon className="w-3 h-3 text-white" />
          </div>
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {config.name}
          </span>
          {isSlidePost && (
            <Badge variant="outline" className="text-xs">
              Slide Post
            </Badge>
          )}
        </div>
        
        <Badge 
          variant={status === 'published' ? 'default' : status === 'pending' ? 'secondary' : 'destructive'}
          className="text-xs"
        >
          {status === 'published' ? 'Publicado' : status === 'pending' ? 'Pendiente' : 'Error'}
        </Badge>
      </div>
    </div>
  );
};

export default PlatformHeader;
