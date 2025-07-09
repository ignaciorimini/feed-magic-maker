
import { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { contentService } from '@/services/contentService';
import { toast } from '@/hooks/use-toast';

interface PublishButtonProps {
  platformId: string;
  platform: 'instagram' | 'linkedin' | 'wordpress' | 'twitter';
  currentStatus: 'pending' | 'generated' | 'edited' | 'scheduled' | 'published';
  contentType?: string;
  onStatusChange: (newStatus: 'pending' | 'generated' | 'edited' | 'scheduled' | 'published') => void;
  onLinkUpdate?: (link: string) => void;
  onStatsUpdate?: () => void;
}

const PublishButton = ({ 
  platformId, 
  platform, 
  currentStatus, 
  contentType, 
  onStatusChange, 
  onLinkUpdate,
  onStatsUpdate
}: PublishButtonProps) => {
  const [isPublishing, setIsPublishing] = useState(false);

  const handlePublish = async () => {
    setIsPublishing(true);
    
    try {
      const { data, error } = await contentService.publishContent(platformId, platform);
      
      if (error) {
        throw error;
      }

      // Handle the webhook response structure for different platforms
      const isPublished = data?.status === 'published' || 
                          (platform === 'wordpress' && data?.status === 'wordpressPublished');
      
      if (isPublished) {
        // Update the status in the database using the new method
        await contentService.updatePlatformStatus(platformId, 'published', data.link);
        
        // Update the UI immediately
        onStatusChange('published');
        
        if (data.link && onLinkUpdate) {
          onLinkUpdate(data.link);
        }
        
        // Trigger stats update to refresh counters
        if (onStatsUpdate) {
          onStatsUpdate();
        }
        
        toast({
          title: "¡Contenido publicado exitosamente!",
          description: `El contenido ha sido publicado en ${platform}.`,
        });
      } else {
        // Content is scheduled/queued for publishing by N8N
        onStatusChange('scheduled');
        
        toast({
          title: "Contenido programado para publicación",
          description: `El contenido será publicado automáticamente por N8N. El estado se actualizará cuando se complete la publicación.`,
        });
      }
    } catch (error) {
      console.error('Error al publicar contenido:', error);
      onStatusChange('pending');
      toast({
        title: "Error al publicar contenido",
        description: "Hubo un problema al publicar el contenido. Inténtalo nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <Button
      onClick={handlePublish}
      disabled={isPublishing || currentStatus === 'published'}
      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
      size="sm"
    >
      {isPublishing ? (
        <>
          <Loader2 className="w-3 h-3 mr-2 animate-spin" />
          Publicando...
        </>
      ) : currentStatus === 'published' ? (
        'Publicado'
      ) : currentStatus === 'scheduled' ? (
        'Programado'
      ) : (
        <>
          <Send className="w-3 h-3 mr-2" />
          Publicar
        </>
      )}
    </Button>
  );
};

export default PublishButton;
