
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Send, Loader2 } from 'lucide-react';
import { publishContent } from '@/services/contentService';
import { toast } from '@/hooks/use-toast';

interface PublishButtonProps {
  entryId?: string;
  platformId?: string; // Add platformId as optional
  platform: string;
  currentStatus?: 'pending' | 'generated' | 'edited' | 'scheduled' | 'published';
  contentType?: string;
  onStatusChange?: (newStatus: 'pending' | 'generated' | 'edited' | 'scheduled' | 'published') => void;
  onLinkUpdate?: (link: string) => void;
  onStatsUpdate?: () => void;
  onPublish?: () => void;
  disabled?: boolean;
}

const PublishButton = ({ 
  entryId, 
  platformId, 
  platform, 
  currentStatus,
  contentType,
  onStatusChange,
  onLinkUpdate,
  onStatsUpdate,
  onPublish, 
  disabled 
}: PublishButtonProps) => {
  const [isPublishing, setIsPublishing] = useState(false);

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      // Use platformId if available, otherwise fallback to entryId
      const idToUse = platformId || entryId;
      
      if (!idToUse) {
        throw new Error('No entry ID or platform ID provided');
      }

      const { data, error } = await publishContent(idToUse, platform);

      if (error) {
        throw error;
      }

      toast({
        title: "¡Publicación enviada!",
        description: `Tu contenido para ${platform} se está procesando.`,
      });

      if (onPublish) {
        onPublish();
      }

      if (onStatsUpdate) {
        onStatsUpdate();
      }

      // Reload page after a short delay to show updated status
      setTimeout(() => window.location.reload(), 1500);

    } catch (error) {
      console.error('Error al publicar:', error);
      toast({
        title: "Error al publicar",
        description: "Hubo un problema al publicar el contenido.",
        variant: "destructive",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <Button
      onClick={handlePublish}
      disabled={disabled || isPublishing}
      size="sm"
      className="bg-blue-600 hover:bg-blue-700 text-white"
    >
      {isPublishing ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <Send className="w-4 h-4 mr-2" />
      )}
      {isPublishing ? 'Publicando...' : 'Publicar'}
    </Button>
  );
};

export default PublishButton;
