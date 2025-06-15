
import { useState } from 'react';
import { Globe, Edit2, ImageIcon } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ContentEditModal from './ContentEditModal';
import PublishButton from './PublishButton';

interface WordPressPreviewProps {
  content: {
    text: string;
    images: string[];
    publishDate?: string;
    title?: string;
    description?: string;
    slug?: string;
  };
  status: 'published' | 'pending' | 'error';
  contentType: string;
  onUpdateContent: (content: any) => Promise<void>;
  entryId?: string;
  publishedLink?: string;
  onStatusChange?: (newStatus: 'published' | 'pending' | 'error') => void;
  onLinkUpdate?: (link: string) => void;
}

const WordPressPreview = ({ 
  content, 
  status, 
  contentType, 
  onUpdateContent, 
  entryId, 
  publishedLink,
  onStatusChange,
  onLinkUpdate 
}: WordPressPreviewProps) => {
  const [showEditModal, setShowEditModal] = useState(false);

  // Función para truncar texto
  const truncateText = (text: string, maxLength: number = 40) => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const isRealImage = (imageUrl: string) => {
    return imageUrl && !imageUrl.includes('/placeholder.svg') && !imageUrl.includes('placeholder');
  };

  const currentImage = content.images && content.images.length > 0 ? content.images[0] : null;

  return (
    <>
      <Card className="border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 bg-gray-700 rounded flex items-center justify-center">
                <Globe className="w-3 h-3 text-white" />
              </div>
              <span className="text-xs font-medium dark:text-white">WordPress</span>
              {content.publishDate && (
                <Badge variant="outline" className="text-xs">
                  {new Date(content.publishDate).toLocaleDateString()}
                </Badge>
              )}
            </div>
            
            <div className="flex items-center space-x-1">
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => setShowEditModal(true)} 
                className="h-5 w-5 p-0"
              >
                <Edit2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0 space-y-2">
          {/* Title Preview */}
          {content.title && (
            <div className="space-y-1">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Título</span>
              <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 p-1.5 rounded">
                {truncateText(content.title, 50)}
              </p>
            </div>
          )}

          {/* Description Preview */}
          {content.description && (
            <div className="space-y-1">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Descripción</span>
              <p className="text-xs text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-1.5 rounded">
                {truncateText(content.description, 60)}
              </p>
            </div>
          )}

          {/* Content Preview */}
          <div className="space-y-1">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Contenido</span>
            <p className="text-xs text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-1.5 rounded">
              {truncateText(content.text, 60)}
            </p>
          </div>

          {/* Images Preview */}
          {currentImage && (
            <div className="space-y-1">
              <div className="w-full h-16 bg-gray-200 dark:bg-gray-700 rounded-md flex items-center justify-center overflow-hidden">
                {isRealImage(currentImage) ? (
                  <img 
                    src={currentImage} 
                    alt="Generated content"
                    className="w-full h-full object-cover rounded-md"
                  />
                ) : (
                  <div className="flex items-center justify-center text-xs text-gray-500 dark:text-gray-400">
                    <ImageIcon className="w-3 h-3 mr-1" />
                    <span>Imagen</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Published Link Display - Blue clickable link */}
          {publishedLink && (
            <div className="space-y-1">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Artículo publicado</span>
              <div className="text-xs bg-blue-50 dark:bg-blue-900/20 p-1.5 rounded">
                <a 
                  href={publishedLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline break-all"
                >
                  {publishedLink}
                </a>
              </div>
            </div>
          )}

          {/* Publish Button */}
          {entryId && (
            <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
              <PublishButton
                entryId={entryId}
                platform="wordpress"
                currentStatus={status}
                contentType={contentType}
                onStatusChange={onStatusChange || (() => {})}
                onLinkUpdate={onLinkUpdate}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Modal */}
      {showEditModal && (
        <ContentEditModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          platform="wordpress"
          content={content}
          contentType={contentType}
          onSave={onUpdateContent}
          entryId={entryId || ''}
        />
      )}
    </>
  );
};

export default WordPressPreview;
