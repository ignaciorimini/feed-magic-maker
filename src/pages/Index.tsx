
import { useState, useEffect, useRef } from 'react';
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
  
  // Use ref to track if component is mounted to prevent state updates on unmounted component
  const isMountedRef = useRef(true);
  
  // Track visibility to avoid unnecessary reloads
  const [isVisible, setIsVisible] = useState(true);

  // Handle visibility change to optimize loading
  useEffect(() => {
    const handleVisibilityChange = () => {
      const visible = !document.hidden;
      setIsVisible(visible);
      
      // Only reload if coming back to visible and we have been away for more than 30 seconds
      if (visible && entries.length > 0) {
        console.log('Tab became visible - checking if refresh needed');
        // Don't force reload immediately, let cache handle it
        loadEntries(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      isMountedRef.current = false;
    };
  }, [entries.length]);

  const loadEntries = async (forceRefresh: boolean = false) => {
    if (!user || !isMountedRef.current) return;
    
    // Only show loading if we don't have cached data
    if (forceRefresh || entries.length === 0) {
      setLoading(true);
    }
    
    try {
      const { data, error } = await contentService.getUserContentEntries(forceRefresh);
      
      if (error) {
        console.error('Error loading entries:', error);
        if (isMountedRef.current) {
          toast({
            title: "Error al cargar contenido",
            description: error.message || "No se pudieron cargar las entradas",
            variant: "destructive",
          });
        }
        return;
      }

      if (data && isMountedRef.current) {
        // Transform the data to match the expected format
        const transformedEntries = data.map(entry => {
          const platformContent: any = {};
          const status: any = {};
          
          // Get the main image from the first platform that has one
          let entryImageUrl = null;
          
          entry.platforms.forEach(platform => {
            const platformKey = platform.platform as 'instagram' | 'linkedin' | 'wordpress' | 'twitter';
            
            // Handle WordPress content differently
            if (platformKey === 'wordpress' && platform.wordpress_post && platform.wordpress_post.length > 0) {
              const wpPost = platform.wordpress_post[0]; // Take the first WordPress post
              platformContent[platformKey] = {
                title: wpPost.title || '',
                description: wpPost.description || '',
                slug: wpPost.slug || '',
                content: wpPost.content || '',
                text: wpPost.content || '', // Add text field for compatibility
                image_url: platform.image_url,
                images: platform.image_url ? [platform.image_url] : [],
                slidesURL: platform.slides_url,
                slideImages: platform.slideImages || [],
                uploadedImages: platform.uploadedImages || [],
                contentType: platform.content_type || 'article',
                published_url: platform.published_url, // Add published_url from content_platforms
                wordpressPost: {
                  title: wpPost.title || '',
                  description: wpPost.description || '',
                  slug: wpPost.slug || '',
                  content: wpPost.content || ''
                }
              };
            } else {
              // Handle other platforms normally
              platformContent[platformKey] = {
                text: platform.text || '',
                image_url: platform.image_url,
                images: platform.image_url ? [platform.image_url] : [],
                slidesURL: platform.slides_url,
                slideImages: platform.slideImages || [],
                uploadedImages: platform.uploadedImages || [],
                contentType: platform.content_type || (platformKey === 'wordpress' ? 'article' : 'simple'),
                published_url: platform.published_url // Add published_url from content_platforms
              };
            }
            
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
            imageUrl: entryImageUrl, // Set the entry-level image URL
            slideImages: [] // This will be populated from platforms if needed
          };
        });

        console.log('Transformed entries:', transformedEntries);
        setEntries(transformedEntries);
      }
    } catch (error) {
      console.error('Unexpected error loading entries:', error);
      if (isMountedRef.current) {
        toast({
          title: "Error inesperado",
          description: "Ocurrió un error al cargar el contenido",
          variant: "destructive",
        });
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    // Load entries on mount
    loadEntries(true); // Force refresh on initial load
  }, [user]);

  const handleNewContent = async (formData: any) => {
    if (!isMountedRef.current) return;
    
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

      // Force refresh after creating new content
      await loadEntries(true);
      
      if (isMountedRef.current) {
        setShowNewContent(false);
        
        toast({
          title: "¡Contenido creado exitosamente!",
          description: "El contenido ha sido generado y está listo para editar o publicar.",
        });
      }
    } catch (error) {
      console.error('Error creating content:', error);
      if (isMountedRef.current) {
        toast({
          title: "Error al crear contenido",
          description: "Hubo un problema al guardar el contenido generado.",
          variant: "destructive",
        });
      }
    }
  };

  const handleUpdateContent = async (entryId: string, platform: string, content: any) => {
    if (!isMountedRef.current) return;
    
    try {
      console.log('=== UPDATE CONTENT DEBUG ===');
      console.log('Entry ID received:', entryId);
      console.log('Platform:', platform);
      console.log('Content to update:', content);
      
      const { error } = await contentService.updatePlatformContent(entryId, content);
      
      if (error) {
        throw error;
      }

      // Refresh data after update
      await loadEntries(true);
      
      if (isMountedRef.current) {
        toast({
          title: "Contenido actualizado",
          description: "Los cambios han sido guardados exitosamente.",
        });
      }
    } catch (error) {
      console.error('Error updating content:', error);
      if (isMountedRef.current) {
        toast({
          title: "Error al actualizar",
          description: "No se pudieron guardar los cambios.",
          variant: "destructive",
        });
      }
    }
  };

  const handleDeletePlatform = async (platformId: string) => {
    if (!isMountedRef.current) return;
    
    try {
      console.log('=== HANDLING DELETE PLATFORM ===');
      console.log('Platform ID received:', platformId);
      
      // Validate that we have a proper platform ID format
      if (!platformId || !platformId.includes('__')) {
        console.error('Invalid platform ID format for deletion:', platformId);
        if (isMountedRef.current) {
          toast({
            title: "Error de validación",
            description: `ID de plataforma inválido: ${platformId}`,
            variant: "destructive",
          });
        }
        return;
      }
      
      console.log('✅ Valid platform ID format, proceeding with deletion');
      
      const { error } = await contentService.deletePlatform(platformId);
      
      if (error) {
        console.error('Error from deletePlatform:', error);
        throw error;
      }

      console.log('✅ Platform deleted successfully');
      
      // Force refresh after deletion
      await loadEntries(true);
      
      if (isMountedRef.current) {
        toast({
          title: "Plataforma eliminada",
          description: "La tarjeta de plataforma ha sido eliminada exitosamente.",
        });
      }
    } catch (error) {
      console.error('Error deleting platform:', error);
      if (isMountedRef.current) {
        toast({
          title: "Error al eliminar",
          description: "No se pudo eliminar la tarjeta de plataforma.",
          variant: "destructive",
        });
      }
    }
  };

  const handleDownloadSlides = async (platformId: string, slidesURL: string) => {
    if (!isMountedRef.current) return;
    
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

      if (isMountedRef.current) {
        toast({
          title: "Descarga iniciada",
          description: "Las slides se están descargando. Recibirás un email cuando estén listas.",
        });
      }
    } catch (error) {
      console.error('Error downloading slides:', error);
      if (isMountedRef.current) {
        toast({
          title: "Error en descarga",
          description: "No se pudieron descargar las slides.",
          variant: "destructive",
        });
      }
    }
  };

  const handleGenerateImage = async (entryId: string, platform: string, topic: string, description: string) => {
    if (!isMountedRef.current) return;
    
    try {
      console.log('=== GENERATING IMAGE ===');
      console.log('Entry ID:', entryId);
      console.log('Platform:', platform);
      
      const { data, error } = await contentService.generateImageForPlatform(entryId, platform, topic, description);
      
      if (error) {
        throw error;
      }

      // Reload entries to get the updated image - force refresh
      await loadEntries(true);
      
      if (isMountedRef.current) {
        toast({
          title: "¡Imagen generada exitosamente!",
          description: "La imagen ha sido generada y guardada.",
        });
      }
    } catch (error) {
      console.error('Error generating image:', error);
      if (isMountedRef.current) {
        toast({
          title: "Error al generar imagen",
          description: "Hubo un problema al generar la imagen.",
          variant: "destructive",
        });
      }
    }
  };

  const handleUpdateImage = async (platformId: string, imageUrl: string | null) => {
    if (!isMountedRef.current) return;
    
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

      // Reload entries to reflect the changes - force refresh
      await loadEntries(true);
      
      if (isMountedRef.current) {
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
      }
    } catch (error) {
      console.error('Error updating image:', error);
      if (isMountedRef.current) {
        toast({
          title: "Error al actualizar imagen",
          description: "Hubo un problema al actualizar la imagen.",
          variant: "destructive",
        });
      }
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
          onDeletePlatform={handleDeletePlatform} // Changed from onDeleteEntry
          onDownloadSlides={handleDownloadSlides}
          onGenerateImage={handleGenerateImage}
          onUploadImage={() => {}} // Not used anymore  
          onDeleteImage={() => {}} // Not used anymore
          onReloadEntries={() => loadEntries(true)} // Force refresh when explicitly requested
          onUpdateImage={handleUpdateImage}
        />
      </div>
    </div>
  );
};

export default Index;
