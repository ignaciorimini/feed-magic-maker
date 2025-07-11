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
  
  // Cache to prevent unnecessary refetches
  const lastFetchTime = useRef<number>(0);
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  const loadEntries = async (forceRefresh: boolean = false) => {
    if (!user) return;
    
    // Check cache unless forced refresh
    const now = Date.now();
    if (!forceRefresh && entries.length > 0 && (now - lastFetchTime.current) < CACHE_DURATION) {
      return;
    }
    
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
                published_url: platform.published_url,
                publishDate: platform.scheduled_at,
                scheduled_at: platform.scheduled_at, // Add for StatusBadge
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
                published_url: platform.published_url,
                publishDate: platform.scheduled_at,
                scheduled_at: platform.scheduled_at // Add for StatusBadge
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
            imageUrl: entryImageUrl,
            slideImages: []
          };
        });

        console.log('Transformed entries:', transformedEntries);
        setEntries(transformedEntries);
        lastFetchTime.current = now;
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

  // Listen for visibility changes to prevent unnecessary refetches
  useEffect(() => {
    const handleVisibilityChange = () => {
      // Only reload if the page has been hidden for more than cache duration
      if (!document.hidden && entries.length > 0) {
        const now = Date.now();
        if ((now - lastFetchTime.current) > CACHE_DURATION) {
          loadEntries(true);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [entries.length]);

  const handleNewContent = async (formData: any) => {
    try {
      console.log("=== CREATING NEW CONTENT ===");
      console.log("Form data:", formData);

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

      await loadEntries(true); // Force refresh after creating new content
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
      
      // Call the update service
      const { error } = await contentService.updatePlatformContent(entryId, content);
      
      if (error) {
        throw error;
      }

      console.log('Content updated successfully, refreshing entries...');
      
      // Force refresh after update to show changes immediately
      await loadEntries(true);
      
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

  const handleDeletePlatform = async (platformId: string) => {
    try {
      console.log('=== HANDLING DELETE PLATFORM ===');
      console.log('Platform ID received:', platformId);
      
      if (!platformId || !platformId.includes('__')) {
        console.error('Invalid platform ID format for deletion:', platformId);
        toast({
          title: "Error de validación",
          description: `ID de plataforma inválido: ${platformId}`,
          variant: "destructive",
        });
        return;
      }
      
      console.log('✅ Valid platform ID format, proceeding with deletion');
      
      const { error } = await contentService.deletePlatform(platformId);
      
      if (error) {
        console.error('Error from deletePlatform:', error);
        throw error;
      }

      console.log('✅ Platform deleted successfully');
      await loadEntries(true); // Force refresh after deletion
      
      toast({
        title: "Plataforma eliminada",
        description: "La tarjeta de plataforma ha sido eliminada exitosamente.",
      });
    } catch (error) {
      console.error('Error deleting platform:', error);
      toast({
        title: "Error al eliminar",
        description: "No se pudo eliminar la tarjeta de plataforma.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadSlides = async (platformId: string, slidesURL: string) => {
    try {
      const originalEntryId = platformId.includes('__') ? platformId.split('__')[0] : platformId;
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

      await loadEntries(true); // Force refresh after image generation
      
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
      
      const actualPlatformId = await contentService.getPlatformIdFromComposite(platformId);
      
      const { error } = await supabase
        .from('content_platforms')
        .update({ image_url: imageUrl })
        .eq('id', actualPlatformId);

      if (error) {
        console.error('Error updating platform image:', error);
        throw new Error('Failed to update platform image');
      }

      await loadEntries(true); // Force refresh after image update
      
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
          onDeletePlatform={handleDeletePlatform}
          onDownloadSlides={handleDownloadSlides}
          onGenerateImage={handleGenerateImage}
          onUploadImage={() => {}}
          onDeleteImage={() => {}}
          onReloadEntries={() => loadEntries(true)}
          onUpdateImage={handleUpdateImage}
        />
      </div>
    </div>
  );
};

export default Index;
