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
      console.log('=== PUBLISH BUTTON CLICKED ===');
      console.log('Platform ID:', platformId);
      console.log('Platform:', platform);
      console.log('Current Status:', currentStatus);

      const { data, error } = await contentService.publishContent(platformId, platform);
      
      if (error) {
        console.error('Publish content error:', error);
        throw error;
      }

      console.log('Publish response data:', data);

      // Handle successful response
      if (data) {
        // Check if the content was immediately published or scheduled
        const isPublished = data?.status === 'published' || 
                            data?.status === 'success' ||
                            (platform === 'wordpress' && data?.status === 'wordpressPublished');
        
        if (isPublished && data.link) {
          // Content was published immediately with a link
          await contentService.updatePlatformStatus(platformId, 'published', data.link);
          onStatusChange('published');
          
          if (onLinkUpdate) {
            onLinkUpdate(data.link);
          }
          
          toast({
            title: "¡Contenido publicado exitosamente!",
            description: `El contenido ha sido publicado en ${platform}.`,
          });
        } else {
          // Content was sent to N8N for processing (scheduled/queued)
          onStatusChange('scheduled');
          
          toast({
            title: "Contenido enviado a N8N",
            description: `El contenido ha sido enviado para publicación en ${platform}. El estado se actualizará automáticamente cuando se complete.`,
          });
        }
      } else {
        // Successful request but no specific data - treat as scheduled
        onStatusChange('scheduled');
        
        toast({
          title: "Contenido enviado a N8N",
          description: `El contenido ha sido enviado para publicación en ${platform}. El estado se actualizará automáticamente cuando se complete.`,
        });
      }
      
      // Trigger stats update to refresh counters
      if (onStatsUpdate) {
        onStatsUpdate();
      }

    } catch (error) {
      console.error('Error al publicar contenido:', error);
      
      // Keep current status on error
      onStatusChange(currentStatus);
      
      let errorMessage = "Hubo un problema al publicar el contenido. Inténtalo nuevamente.";
      
      if (error instanceof Error) {
        if (error.message.includes('Webhook URL is not configured')) {
          errorMessage = "URL de webhook no configurada. Por favor configura tu URL de webhook en los ajustes de perfil.";
        } else if (error.message.includes('Failed to fetch')) {
          errorMessage = "No se pudo conectar con el webhook. Verifica que la URL esté correcta y que el servicio esté disponible.";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Error al publicar contenido",
        description: errorMessage,
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
