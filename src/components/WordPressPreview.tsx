
import { useState, useEffect } from 'react';
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
    content?: string;
    wordpressPost?: {
      title: string;
      description: string;
      slug: string;
      content: string;
    };
  };
  status: 'pending' | 'generated' | 'edited' | 'scheduled' | 'published';
  contentType: string;
  onUpdateContent: (content: any) => Promise<void>;
  platformId: string;
  publishedLink?: string;
  onStatusChange?: (newStatus: 'pending' | 'generated' | 'edited' | 'scheduled' | 'published') => void;
  onLinkUpdate?: (link: string) => void;
}

const WordPressPreview = ({ 
  content, 
  status, 
  contentType, 
  onUpdateContent, 
  platformId, 
  publishedLink,
  onStatusChange,
  onLinkUpdate 
}: WordPressPreviewProps) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [content.images]);

  const truncateText = (text: string, maxLength: number = 40) => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const isRealImage = (imageUrl: string | null): imageUrl is string => {
    return !!imageUrl && !imageUrl.includes('/placeholder.svg') && !imageUrl.includes('placeholder');
  };

  const currentImage = content.images && content.images.length > 0 ? content.images[0] : null;

  // Get WordPress specific data
  const wpData = content.wordpressPost || {
    title: content.title || '',
    description: content.description || '',
    slug: content.slug || '',
    content: content.content || content.text || ''
  };

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
          {wpData.title && (
            <div className="space-y-1">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Título</span>
              <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 p-1.5 rounded">
                {truncateText(wpData.title, 50)}
              </p>
            </div>
          )}

          {/* Description Preview */}
          {wpData.description && (
            <div className="space-y-1">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Descripción</span>
              <p className="text-xs text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-1.5 rounded">
                {truncateText(wpData.description, 60)}
              </p>
            </div>
          )}

          {/* Slug Preview */}
          {wpData.slug && (
            <div className="space-y-1">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Slug</span>
              <p className="text-xs text-blue-600 dark:text-blue-400 bg-gray-50 dark:bg-gray-700 p-1.5 rounded font-mono">
                /{truncateText(wpData.slug, 40)}
              </p>
            </div>
          )}

          {/* Content Preview */}
          <div className="space-y-1">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Contenido</span>
            <p className="text-xs text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-1.5 rounded">
              {truncateText(wpData.content, 60)}
            </p>
          </div>

          {/* Images Preview */}
          <div className="space-y-1">
            <div className="w-full h-16 bg-gray-200 dark:bg-gray-700 rounded-md flex items-center justify-center overflow-hidden">
              {isRealImage(currentImage) && !imageError ? (
                <img 
                  src={currentImage} 
                  alt="Contenido generado"
                  className="w-full h-full object-cover rounded-md"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="flex items-center justify-center text-xs text-gray-500 dark:text-gray-400">
                  <ImageIcon className="w-3 h-3 mr-1" />
                  <span>{imageError ? 'Error al cargar' : 'Sin imagen'}</span>
                </div>
              )}
            </div>
          </div>

          {/* Published Link Display */}
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
          <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
            <PublishButton
              platformId={platformId}
              platform="wordpress"
              currentStatus={status}
              contentType={contentType}
              onStatusChange={onStatusChange || (() => {})}
              onLinkUpdate={onLinkUpdate}
            />
          </div>
        </CardContent>
      </Card>

      {/* Edit Modal */}
      {showEditModal && (
        <ContentEditModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          platform="wordpress"
          content={{
            text: wpData.content,
            title: wpData.title,
            description: wpData.description,
            slug: wpData.slug,
            content: wpData.content,
            images: content.images
          }}
          contentType={contentType}
          onSave={onUpdateContent}
          entryId={platformId}
        />
      )}
    </>
  );
};

export default WordPressPreview;
