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

      if (data) {
        // Transform the data to match the expected format
        const transformedEntries = data.map(entry => {
          const platformContent: any = {};
          const status: any = {};
          const publishedLinks: any = {};
          
          // Get the main image from the first platform that has one
          let entryImageUrl = null;
          
          entry.platforms.forEach(platform => {
            const platformKey = platform.platform as 'instagram' | 'linkedin' | 'wordpress' | 'twitter';
            
            // Set platform content
            platformContent[platformKey] = {
              text: platform.text || '',
              image_url: platform.image_url,
              images: platform.image_url ? [platform.image_url] : [],
              slidesURL: platform.slides_url,
              slideImages: platform.slideImages || [],
              uploadedImages: platform.uploadedImages || []
            };
            
            // Set platform status (convert new status to old format for compatibility)
            status[platformKey] = platform.status === 'published' ? 'published' : 'pending';
            
            // If we don't have an entry image yet and this platform has one, use it
            if (!entryImageUrl && platform.image_url) {
              entryImageUrl = platform.image_url;
            }
          });

          return {
            id: entry.id,
            topic: entry.topic,
            description: entry.description || '',
            type: entry.type,
            createdDate: new Date(entry.created_date).toLocaleDateString(),
            status,
            platformContent,
            publishedLinks: entry.published_links || {},
            imageUrl: entryImageUrl, // Set the entry-level image URL
            slideImages: [] // This will be populated from platforms if needed
          };
        });

        console.log('Transformed entries:', transformedEntries);
        setEntries(transformedEntries);
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
      console.log('=== CREATING NEW CONTENT ===');
      console.log('Form data received:', formData);
      console.log('Generated content:', formData.generatedContent);

      const { data, error } = await contentService.createContentEntry({
        topic: formData.topic,
        description: formData.description,
        type: formData.type,
        selectedPlatforms: formData.selectedPlatforms,
        generatedContent: formData.generatedContent
      });

      if (error) {
        console.error('Error creating content entry:', error);
        throw error;
      }

      console.log('Content entry created successfully:', data);
      
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
      
      // Extract the original entry ID if it contains the separator
      const originalEntryId = entryId.includes('__') ? entryId.split('__')[0] : entryId;
      console.log('Extracted original entry ID:', originalEntryId);
      console.log('Original ID length:', originalEntryId.length);
      
      // Validate extracted ID is a complete UUID
      if (!originalEntryId || originalEntryId.length !== 36 || !originalEntryId.includes('-')) {
        console.error('Invalid extracted entry ID format:', originalEntryId);
        throw new Error(`Invalid entry ID format: ${originalEntryId}`);
      }
      
      // Find the platform record to get the platformId
      const { data: platformRecord, error: platformError } = await supabase
        .from('content_platforms')
        .select('id')
        .eq('content_entry_id', originalEntryId)
        .eq('platform', platform as 'instagram' | 'linkedin' | 'twitter' | 'wordpress')
        .single();

      if (platformError || !platformRecord) {
        console.error('Error finding platform record:', platformError);
        throw new Error('Platform record not found');
      }

      const { error } = await contentService.updatePlatformContent(platformRecord.id, content);
      
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
      console.log('Entry ID type:', typeof entryId);
      console.log('Entry ID length:', entryId.length);
      
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

  const handleDownloadSlides = async (entryId: string, slidesURL: string) => {
    try {
      // Extract the original entry ID if it contains the separator
      const originalEntryId = entryId.includes('__') ? entryId.split('__')[0] : entryId;
      
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

  const handleUpdateImage = async (entryId: string, imageUrl: string | null) => {
    try {
      console.log('=== UPDATING IMAGE ===');
      console.log('Entry ID:', entryId);
      console.log('Image URL:', imageUrl);
      
      // Extract the original entry ID if it contains the separator
      const originalEntryId = entryId.includes('__') ? entryId.split('__')[0] : entryId;
      
      // Find all platforms for this entry
      const { data: platforms, error: platformsError } = await supabase
        .from('content_platforms')
        .select('id, platform')
        .eq('content_entry_id', originalEntryId);

      if (platformsError || !platforms || platforms.length === 0) {
        console.error('Error finding platforms:', platformsError);
        throw new Error('No platforms found for this entry');
      }

      // Update all platforms with the new image URL
      const updatePromises = platforms.map(platform => 
        supabase
          .from('content_platforms')
          .update({ image_url: imageUrl })
          .eq('id', platform.id)
      );

      const results = await Promise.all(updatePromises);
      
      // Check if any updates failed
      const errors = results.filter(result => result.error);
      if (errors.length > 0) {
        console.error('Some updates failed:', errors);
        throw new Error('Failed to update some platforms');
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
