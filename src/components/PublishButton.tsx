
import { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { profileService } from '@/services/profileService';
import { contentService } from '@/services/contentService';
import { toast } from '@/hooks/use-toast';

interface PublishButtonProps {
  entryId: string;
  platform: 'instagram' | 'linkedin' | 'wordpress' | 'twitter';
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
  const { user } = useAuth();

  const handlePublish = async () => {
    if (!user) {
      toast({
        title: "Error de autenticación",
        description: "Debes estar autenticado para publicar contenido",
        variant: "destructive",
      });
      return;
    }

    setIsPublishing(true);
    
    try {
      console.log("Obteniendo webhook del perfil del usuario para publicar...");
      
      const { data: profile, error: profileError } = await profileService.getUserProfile(user.id);
      
      if (profileError || !profile?.webhook_url) {
        toast({
          title: "Webhook no configurado",
          description: "Debes configurar tu webhook URL en el perfil para publicar contenido.",
          variant: "destructive",
        });
        return;
      }

      // Obtener los datos completos del entry
      const { data: entries } = await contentService.getUserContentEntries();
      const entry = entries?.find(e => e.id === entryId);
      
      if (!entry) {
        throw new Error("No se pudo encontrar el contenido");
      }

      console.log("Enviando solicitud de publicación al webhook:", profile.webhook_url);
      
      // Preparar el payload completo con todos los datos necesarios
      const webhookPayload: any = {
        action: 'publish_content',
        entryId: entryId,
        platform: platform,
        contentType: contentType,
        userEmail: user.email,
        topic: entry.topic,
        description: entry.description
      };

      // Para WordPress, enviar datos completos incluyendo imagen
      if (platform === 'wordpress' && (entry as any).platform_content) {
        const platformContent = (entry as any).platform_content as Record<string, any>;
        const wpContent = platformContent?.wordpress;
        
        if (wpContent && typeof wpContent === 'object') {
          webhookPayload.content = {
            text: wpContent.text,
            title: wpContent.title,
            slug: wpContent.slug,
            description: wpContent.description || entry.description,
            image: entry.image_url || null
          };
        }
      } else {
        // Para otras plataformas, enviar el contenido específico de la plataforma
        const platformContent = (entry as any).platform_content as Record<string, any>;
        webhookPayload.content = platformContent?.[platform] || {};
        if (entry.image_url) {
          webhookPayload.content.image = entry.image_url;
        }
      }

      const response = await fetch(profile.webhook_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookPayload),
      });

      if (!response.ok) {
        throw new Error(`Error del servidor: ${response.status}`);
      }

      const result = await response.json();
      console.log("Respuesta de publicación:", result);

      // FIXED: Corregir la lógica de éxito de publicación
      const expectedSuccessStatus = `${platform}Published`;
      
      if (result.status === expectedSuccessStatus) {
        onStatusChange('published');
        
        if (result.link && onLinkUpdate) {
          onLinkUpdate(result.link);
        }
        
        toast({
          title: "¡Contenido publicado exitosamente!",
          description: `El contenido ha sido publicado en ${platform}.`,
        });
      } else {
        // Si no hay un status claro de éxito, pero tampoco hay error explícito, mantener como pending
        console.warn("Status de respuesta inesperado:", result.status);
        toast({
          title: "Publicación en proceso",
          description: `El contenido se está procesando para ${platform}.`,
        });
      }
    } catch (error) {
      console.error('Error al publicar contenido:', error);
      onStatusChange('error');
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
