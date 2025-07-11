
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { contentService } from '@/services/contentService';
import CalendarGrid from '@/components/calendar/CalendarGrid';
import { toast } from '@/hooks/use-toast';

const Calendar = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadEntries();
    }
  }, [user]);

  const loadEntries = async () => {
    try {
      setLoading(true);
      
      // Load both regular entries and scheduled content
      const [entriesResult, scheduledResult] = await Promise.all([
        contentService.getUserContentEntries(),
        contentService.getScheduledContent()
      ]);
      
      if (entriesResult.error) {
        throw entriesResult.error;
      }
      
      if (scheduledResult.error) {
        console.error('Error loading scheduled content:', scheduledResult.error);
        // Don't throw here, just log the error and continue with regular entries
      }
      
      const allEntries = entriesResult.data || [];
      const scheduledContent = scheduledResult.data || [];
      
      // Merge scheduled content into entries structure
      const entriesWithScheduled = allEntries.map(entry => {
        const entryScheduledContent = scheduledContent.filter(sc => sc.content_entry_id === entry.id);
        
        // Add scheduled_at information to platformContent
        if (entryScheduledContent.length > 0) {
          entryScheduledContent.forEach(sc => {
            if (entry.platformContent && entry.platformContent[sc.platform]) {
              entry.platformContent[sc.platform].scheduled_at = sc.scheduled_at;
            }
          });
        }
        
        return entry;
      });
      
      setEntries(entriesWithScheduled);
    } catch (error) {
      console.error('Error loading entries:', error);
      toast({
        title: "Error al cargar contenido",
        description: "No se pudieron cargar las entradas de contenido",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateContent = async (entryId: string, platform: string, content: any) => {
    try {
      const { error } = await contentService.updatePlatformContent(entryId, platform, content);
      
      if (error) {
        throw error;
      }
      
      await loadEntries();
      
      toast({
        title: "Contenido actualizado",
        description: "El contenido se ha actualizado correctamente",
      });
    } catch (error) {
      console.error('Error updating content:', error);
      toast({
        title: "Error al actualizar",
        description: "No se pudo actualizar el contenido",
        variant: "destructive",
      });
    }
  };

  const handleUpdateImage = async (entryId: string, imageUrl: string | null) => {
    try {
      const { error } = await contentService.uploadCustomImage(entryId, imageUrl || '');
      
      if (error) {
        throw error;
      }
      
      await loadEntries();
      
      toast({
        title: "Imagen actualizada",
        description: "La imagen se ha actualizado correctamente",
      });
    } catch (error) {
      console.error('Error updating image:', error);
      toast({
        title: "Error al actualizar imagen",
        description: "No se pudo actualizar la imagen",
        variant: "destructive",
      });
    }
  };

  const handleGenerateImage = async (entryId: string, platform: string, topic: string, description: string) => {
    try {
      const { error } = await contentService.generateImageForPlatform(entryId, platform, topic, description);
      
      if (error) {
        throw error;
      }
      
      await loadEntries();
      
      toast({
        title: "Imagen generada",
        description: "La imagen se ha generado correctamente",
      });
    } catch (error) {
      console.error('Error generating image:', error);
      toast({
        title: "Error al generar imagen",
        description: "No se pudo generar la imagen",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-sm text-gray-500 mt-2">Cargando calendario...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Calendario</h1>
        <p className="text-gray-600">Programa y gestiona tus publicaciones</p>
      </div>

      <CalendarGrid 
        entries={entries}
        onUpdateContent={handleUpdateContent}
        onUpdateImage={handleUpdateImage}
        onGenerateImage={handleGenerateImage}
      />
    </div>
  );
};

export default Calendar;
