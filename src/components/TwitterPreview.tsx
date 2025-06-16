
import { useState, useEffect } from 'react';
import { Edit2, ImageIcon } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ContentEditModal from './ContentEditModal';
import PublishButton from './PublishButton';

interface TwitterPreviewProps {
  content: {
    text: string;
    images: string[];
    publishDate?: string;
    threadPosts?: string[];
  };
  status: 'published' | 'pending' | 'error';
  contentType: string;
  onUpdateContent: (content: any) => Promise<void>;
  entryId?: string;
  publishedLink?: string;
  onStatusChange?: (newStatus: 'published' | 'pending' | 'error') => void;
  onLinkUpdate?: (link: string) => void;
}

const TwitterPreview = ({ 
  content, 
  status, 
  contentType, 
  onUpdateContent, 
  entryId, 
  publishedLink,
  onStatusChange,
  onLinkUpdate 
}: TwitterPreviewProps) => {
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
  const isThread = contentType === 'Thread' && content.threadPosts && content.threadPosts.length > 0;

  return (
    <>
      <Card className="border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 bg-black rounded flex items-center justify-center">
                <span className="text-white font-bold text-xs">X</span>
              </div>
              <span className="text-xs font-medium dark:text-white">Twitter/X</span>
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
          {/* Thread Posts Preview */}
          {isThread ? (
            <div className="space-y-1">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                Hilo ({content.threadPosts!.length} tweets)
              </span>
              <div className="max-h-32 overflow-y-auto space-y-2">
                {content.threadPosts!.slice(0, 3).map((post, index) => (
                  <div key={index} className="text-xs text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-1.5 rounded border-l-2 border-blue-400">
                    <span className="text-blue-600 font-medium">{index + 1}/</span> {truncateText(post, 50)}
                  </div>
                ))}
                {content.threadPosts!.length > 3 && (
                  <p className="text-xs text-gray-500 italic">
                    ... y {content.threadPosts!.length - 3} tweets más
                  </p>
                )}
              </div>
            </div>
          ) : (
            /* Single Tweet Preview */
            <div className="space-y-1">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Tweet</span>
              <p className="text-xs text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-1.5 rounded">
                {truncateText(content.text, 60)}
              </p>
            </div>
          )}

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
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Tweet publicado</span>
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
                platform="twitter"
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
          platform="twitter"
          content={content}
          contentType={contentType}
          onSave={onUpdateContent}
          entryId={entryId || ''}
        />
      )}
    </>
  );
};

export default TwitterPreview;
