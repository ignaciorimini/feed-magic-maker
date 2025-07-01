import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { contentService } from '@/services/contentService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import ContentForm from '@/components/ContentForm';
import DashboardContent from '@/components/dashboard/DashboardContent';
import DashboardHeader from '@/components/dashboard/DashboardHeader';

const Index = () => {
  const { user } = useAuth();
  const [showNewContent, setShowNewContent] = useState(false);
  const [entries, setEntries] = useState<any[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['instagram', 'linkedin', 'wordpress', 'twitter']);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('content');
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const loadEntries = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await contentService.getUserContentEntries();
      
      if (error) {
        console.error('Error loading entries:', error);
        toast({
          title: "Error al cargar contenido",
          description: error.message || "No se pudieron cargar las entradas",
          variant: "destructive",
        });
        return;
      }

      console.log('Raw data from database:', data);

      if (data) {
        // Pass the raw data directly to DashboardContent for processing
        // This maintains compatibility with both old and new data formats
        console.log('Setting entries with raw data from database');
        setEntries(data);
      }
    } catch (error) {
      console.error('Unexpected error loading entries:', error);
      toast({
        title: "Error inesperado",
        description: "Ocurrió un error al cargar el contenido",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEntries();
  }, [user]);

  const handleNewContent = async (formData: any) => {
    try {
      console.log("=== CREATING NEW CONTENT ===");
      console.log("Form data:", formData);
      console.log("Selected platforms:", formData.selectedPlatforms);
      console.log("Generated content:", formData.generatedContent);
      console.log("Platform types:", formData.platformTypes);

      // Create the content entry in the database
      const { data, error } = await contentService.createContentEntry({
        topic: formData.topic,
        description: formData.description,
        type: formData.type,
        selectedPlatforms: formData.selectedPlatforms,
        generatedContent: formData.generatedContent,
        platformTypes: formData.platformTypes
      });

      if (error) {
        console.error("Error creating content entry:", error);
        throw error;
      }

      console.log("Content entry created successfully:", data);

      await loadEntries();
      setShowNewContent(false);
      
      toast({
        title: "¡Contenido creado exitosamente!",
        description: "El contenido ha sido generado y está listo para editar o publicar.",
      });
    } catch (error) {
      console.error('Error creating content:', error);
      toast({
        title: "Error al crear contenido",
        description: "Hubo un problema al guardar el contenido generado.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateContent = async (entryId: string, platform: string, content: any) => {
    try {
      console.log('=== UPDATE CONTENT DEBUG ===');
      console.log('Entry ID received:', entryId);
      console.log('Platform:', platform);
      console.log('Content to update:', content);
      
      const { error } = await contentService.updatePlatformContent(entryId, content);
      
      if (error) {
        throw error;
      }

      await loadEntries();
      
      toast({
        title: "Contenido actualizado",
        description: "Los cambios han sido guardados exitosamente.",
      });
    } catch (error) {
      console.error('Error updating content:', error);
      toast({
        title: "Error al actualizar",
        description: "No se pudieron guardar los cambios.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    try {
      console.log('=== HANDLING DELETE ENTRY ===');
      console.log('Entry ID received:', entryId);
      
      // Validate that we have a complete UUID
      if (!entryId || entryId.length !== 36 || !entryId.includes('-')) {
        console.error('Invalid entry ID format for deletion:', entryId);
        toast({
          title: "Error de validación",
          description: `ID de entrada inválido: ${entryId}`,
          variant: "destructive",
        });
        return;
      }
      
      console.log('✅ Valid UUID format, proceeding with deletion');
      
      const { error } = await contentService.deleteContentEntry(entryId);
      
      if (error) {
        console.error('Error from deleteContentEntry:', error);
        throw error;
      }

      console.log('✅ Entry deleted successfully');
      await loadEntries();
      
      toast({
        title: "Contenido eliminado",
        description: "La entrada ha sido eliminada exitosamente.",
      });
    } catch (error) {
      console.error('Error deleting entry:', error);
      toast({
        title: "Error al eliminar",
        description: "No se pudo eliminar la entrada.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadSlides = async (platformId: string, slidesURL: string) => {
    try {
      // Extract the original entry ID if it contains the separator
      const originalEntryId = platformId.includes('__') ? platformId.split('__')[0] : platformId;
      
      // Find the entry to get the topic
      const entry = entries.find(e => e.id === originalEntryId);
      const topic = entry?.topic || 'slides';
      
      const { data, error } = await contentService.downloadSlidesWithUserWebhook(slidesURL, topic);
      
      if (error) {
        throw error;
      }

      toast({
        title: "Descarga iniciada",
        description: "Las slides se están descargando. Recibirás un email cuando estén listas.",
      });
    } catch (error) {
      console.error('Error downloading slides:', error);
      toast({
        title: "Error en descarga",
        description: "No se pudieron descargar las slides.",
        variant: "destructive",
      });
    }
  };

  const handleGenerateImage = async (entryId: string, platform: string, topic: string, description: string) => {
    try {
      console.log('=== GENERATING IMAGE ===');
      console.log('Entry ID:', entryId);
      console.log('Platform:', platform);
      
      const { data, error } = await contentService.generateImageForPlatform(entryId, platform, topic, description);
      
      if (error) {
        throw error;
      }

      // Reload entries to get the updated image
      await loadEntries();
      
      toast({
        title: "¡Imagen generada exitosamente!",
        description: "La imagen ha sido generada y guardada.",
      });
    } catch (error) {
      console.error('Error generating image:', error);
      toast({
        title: "Error al generar imagen",
        description: "Hubo un problema al generar la imagen.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateImage = async (platformId: string, imageUrl: string | null) => {
    try {
      console.log('=== UPDATING IMAGE FOR SPECIFIC PLATFORM ===');
      console.log('Platform ID:', platformId);
      console.log('Image URL:', imageUrl);
      
      // Get the actual platform ID from the composite ID
      const actualPlatformId = await contentService.getPlatformIdFromComposite(platformId);
      
      // Update only the specific platform with the new image URL
      const { error } = await supabase
        .from('content_platforms')
        .update({ image_url: imageUrl })
        .eq('id', actualPlatformId);

      if (error) {
        console.error('Error updating platform image:', error);
        throw new Error('Failed to update platform image');
      }

      // Reload entries to reflect the changes
      await loadEntries();
      
      if (imageUrl) {
        toast({
          title: "Imagen actualizada",
          description: "La imagen ha sido actualizada exitosamente.",
        });
      } else {
        toast({
          title: "Imagen eliminada",
          description: "La imagen ha sido eliminada exitosamente.",
        });
      }
    } catch (error) {
      console.error('Error updating image:', error);
      toast({
        title: "Error al actualizar imagen",
        description: "Hubo un problema al actualizar la imagen.",
        variant: "destructive",
      });
    }
  };

  if (showNewContent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="container mx-auto px-4 py-8">
          <ContentForm 
            onSubmit={handleNewContent}
            onCancel={() => setShowNewContent(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-6 space-y-6">
        <DashboardHeader 
          onNewContent={() => setShowNewContent(true)}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          showMobileMenu={showMobileMenu}
          setShowMobileMenu={setShowMobileMenu}
          onProfileSetup={() => {}}
          onSignOut={() => {}}
          userEmail={user?.email}
        />
        <DashboardContent
          entries={entries}
          selectedPlatforms={selectedPlatforms}
          loading={loading}
          onNewContent={() => setShowNewContent(true)}
          onUpdateContent={handleUpdateContent}
          onDeleteEntry={handleDeleteEntry}
          onDownloadSlides={handleDownloadSlides}
          onGenerateImage={handleGenerateImage}
          onUploadImage={() => {}} // Not used anymore  
          onDeleteImage={() => {}} // Not used anymore
          onReloadEntries={loadEntries}
          onUpdateImage={handleUpdateImage}
        />
      </div>
    </div>
  );
};

export default Index;
