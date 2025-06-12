
import { useState } from 'react';
import { Send, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { contentService } from '@/services/contentService';
import { toast } from '@/hooks/use-toast';

interface PublishButtonProps {
  entryId: string;
  platform: string;
  currentStatus: 'published' | 'pending' | 'error';
  contentType?: string;
  onStatusChange: (newStatus: 'published' | 'pending' | 'error') => void;
  onLinkUpdate?: (link: string) => void;
}

const PublishButton = ({ 
  entryId, 
  platform, 
  currentStatus, 
  contentType,
  onStatusChange,
  onLinkUpdate 
}: PublishButtonProps) => {
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);

  const handlePublish = async () => {
    setIsPublishing(true);
    setPublishSuccess(false);
    
    try {
      onStatusChange('pending'); // Actualizar estado a pending inmediatamente
      
      // Determinar el post_type basado en contentType
      const postType = contentType === 'Simple Post' ? 'simple' : 'slide';
      
      const { data, error } = await contentService.publishContent(entryId, platform, postType);
      
      if (error) {
        throw error;
      }

      // Verificar si la publicación fue exitosa según el platform específico
      const platformPublishedStatus = `${platform}Published`;
      
      if (data?.status === platformPublishedStatus) {
        setPublishSuccess(true);
        onStatusChange('published');
        
        // Mostrar mensaje de éxito
        toast({
          title: "¡Contenido publicado exitosamente!",
          description: `Tu contenido ha sido publicado en ${platform}.`,
          variant: "default",
          className: "bg-green-50 border-green-200 text-green-800",
        });

        // Si hay un link, actualizar la UI
        if (data.link && onLinkUpdate) {
          onLinkUpdate(data.link);
        }

        // Ocultar el mensaje de éxito después de 3 segundos
        setTimeout(() => {
          setPublishSuccess(false);
        }, 3000);
        
      } else {
        // Si no es un estado de éxito claro, mostrar mensaje informativo
        toast({
          title: "Solicitud enviada",
          description: "Tu contenido está siendo procesado. El estado se actualizará automáticamente.",
          variant: "default",
        });
      }
    } catch (error) {
      console.error('Error al publicar:', error);
      onStatusChange('error');
      
      toast({
        title: "Error al publicar",
        description: "Hubo un problema al publicar el contenido. Por favor, intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  if (currentStatus === 'published') {
    return (
      <div className="flex items-center space-x-2">
        <CheckCircle className="w-4 h-4 text-green-600" />
        <span className="text-sm text-green-600 font-medium">Publicado</span>
      </div>
    );
  }

  if (publishSuccess) {
    return (
      <div className="flex items-center space-x-2 text-green-600">
        <CheckCircle className="w-4 h-4" />
        <span className="text-sm font-medium">¡Publicado con éxito!</span>
      </div>
    );
  }

  return (
    <Button
      onClick={handlePublish}
      disabled={isPublishing}
      size="sm"
      className="bg-blue-600 hover:bg-blue-700 text-white"
    >
      {isPublishing ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Publicando...
        </>
      ) : (
        <>
          <Send className="w-4 h-4 mr-2" />
          Publicar ahora
        </>
      )}
    </Button>
  );
};

export default PublishButton;
