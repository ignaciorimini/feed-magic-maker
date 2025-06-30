import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import ContentForm from '@/components/ContentForm';
import CalendarView from '@/components/CalendarView';
import ProfileSetup from '@/components/ProfileSetup';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import DashboardContent from '@/components/dashboard/DashboardContent';
import { useAuth } from '@/hooks/useAuth';
import { contentService, ContentEntry } from '@/services/contentService';
import { profileService } from '@/services/profileService';
import { toast } from '@/hooks/use-toast';
import IntegrationsManager from '@/components/integrations/IntegrationsManager';
import { checkAndLogRLSPolicies } from '@/utils/checkRLSPolicies';

const Index = () => {
  const [showForm, setShowForm] = useState(false);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [needsProfileSetup, setNeedsProfileSetup] = useState(false);
  const [entries, setEntries] = useState<ContentEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['instagram', 'linkedin', 'wordpress']);
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Check profile setup and load platforms
  useEffect(() => {
    const checkProfile = async () => {
      if (user) {
        // Check RLS policies for debugging
        await checkAndLogRLSPolicies();
        
        const { needsSetup } = await profileService.checkProfileSetup(user.id);
        setNeedsProfileSetup(needsSetup);
        if (needsSetup) {
          setShowProfileSetup(true);
        } else {
          const { data: profile } = await profileService.getUserProfile(user.id);
          if (profile?.selected_platforms && Array.isArray(profile.selected_platforms)) {
            setSelectedPlatforms(profile.selected_platforms.filter((p): p is string => typeof p === 'string'));
          }
        }
      }
    };
    checkProfile();
  }, [user]);

  // Load content entries
  const loadEntries = async () => {
    if (user && !needsProfileSetup) {
      setLoading(true);
      console.log('=== LOADING ENTRIES ===');
      console.log('User ID:', user.id);
      
      const { data, error } = await contentService.getUserContentEntries();
      
      if (error) {
        console.error('Error loading entries:', error);
        toast({
          title: "Error al cargar contenido",
          description: `No se pudo cargar tu contenido: ${error.message || 'Error desconocido'}`,
          variant: "destructive",
        });
      } else if (data) {
        console.log('Raw entries loaded:', data);
        setEntries(data);
        console.log('Entries set in state:', data.length, 'entries');
      } else {
        console.log('No data returned from contentService.getUserContentEntries()');
        setEntries([]);
      }
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEntries();
  }, [user, needsProfileSetup]);

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (!error) {
      navigate('/auth');
    }
  };

  const handleProfileSetupComplete = () => {
    setShowProfileSetup(false);
    setNeedsProfileSetup(false);
    window.location.reload();
  };

  const handleNewEntry = async (entryData: any) => {
    console.log('Creating new entry with data:', entryData);
    
    const { data, error } = await contentService.createContentEntry({
      topic: entryData.topic,
      description: entryData.description,
      type: entryData.type,
      selectedPlatforms: entryData.selectedPlatforms,
      generatedContent: entryData.generatedContent
    });

    if (error) {
      console.error('Error creating content:', error);
      toast({
        title: "Error al crear contenido",
        description: "No se pudo crear el contenido. Inténtalo nuevamente.",
        variant: "destructive",
      });
    } else if (data) {
      console.log('Content created successfully:', data);
      
      await loadEntries();
      
      setShowForm(false);
      toast({
        title: "Contenido creado exitosamente",
        description: "Tu contenido ha sido generado para las plataformas seleccionadas.",
      });
    }
  };

  const handleUpdateContent = async (entryId: string, platform: string, content: any): Promise<void> => {
    // Extract the original entry ID if it contains the new separator
    const originalEntryId = entryId.includes('__') ? entryId.split('__')[0] : entryId;
    
    console.log('=== UPDATE CONTENT DEBUG ===');
    console.log('Entry ID received:', entryId);
    console.log('Extracted original entry ID:', originalEntryId);
    console.log('Original ID length:', originalEntryId.length);
    console.log('Platform:', platform);
    
    // Validate extracted ID is a complete UUID
    if (!originalEntryId || originalEntryId.length !== 36 || !originalEntryId.includes('-')) {
      console.error('Invalid extracted entry ID format:', originalEntryId);
      toast({
        title: "Error al actualizar contenido",
        description: "ID de contenido inválido.",
        variant: "destructive",
      });
      return;
    }

    const { data: rawEntries } = await contentService.getUserContentEntries();
    const entry = rawEntries?.find(e => e.id === originalEntryId);
    const platformData = entry?.platforms.find(p => p.platform === platform);
    
    if (!platformData) {
      toast({
        title: "Error al actualizar contenido",
        description: "No se pudo encontrar la plataforma especificada.",
        variant: "destructive",
      });
      return;
    }

    const { error } = await contentService.updatePlatformContent(platformData.id, content);
    
    if (error) {
      toast({
        title: "Error al actualizar contenido",
        description: "No se pudo actualizar el contenido.",
        variant: "destructive",
      });
    } else {
      await loadEntries();
      toast({
        title: "Contenido actualizado",
        description: "Los cambios se han guardado correctamente.",
      });
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    console.log('=== HANDLING DELETE ENTRY ===');
    console.log('Entry ID received:', entryId);
    console.log('Entry ID type:', typeof entryId);
    console.log('Entry ID length:', entryId ? entryId.length : 'undefined');
    
    // Extract the original entry ID if it contains the new separator
    const originalEntryId = entryId.includes('__') ? entryId.split('__')[0] : entryId;
    
    console.log('Extracted original entry ID:', originalEntryId);
    console.log('Extracted ID length:', originalEntryId ? originalEntryId.length : 'undefined');
    
    // Validate that we have a complete UUID before proceeding
    if (!originalEntryId) {
      console.error('No entry ID provided for deletion');
      toast({
        title: "Error",
        description: "No se pudo identificar el contenido a eliminar.",
        variant: "destructive",
      });
      return;
    }

    // Check if the ID looks like a complete UUID (36 characters with dashes)
    if (originalEntryId.length !== 36 || !originalEntryId.includes('-')) {
      console.error('Invalid entry ID format:', originalEntryId);
      toast({
        title: "Error",
        description: "ID de contenido inválido. No se puede eliminar.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      console.log('✅ Attempting to delete entry with complete UUID:', originalEntryId);
      const { error } = await contentService.deleteContentEntry(originalEntryId);
      
      if (error) {
        console.error('Delete error:', error);
        toast({
          title: "Error al eliminar contenido",
          description: `No se pudo eliminar el contenido: ${error.message || 'Error desconocido'}`,
          variant: "destructive",
        });
      } else {
        // Remove from local state only after successful deletion
        setEntries(prev => prev.filter(entry => entry.id !== originalEntryId));
        
        toast({
          title: "Contenido eliminado",
          description: "El contenido ha sido eliminado exitosamente.",
        });
        
        console.log('✅ Entry deleted successfully with ID:', originalEntryId);
      }
    } catch (error) {
      console.error('Unexpected error during deletion:', error);
      toast({
        title: "Error inesperado",
        description: "Ocurrió un error inesperado al eliminar el contenido.",
        variant: "destructive",
      });
    }
  };

  const handleGenerateImage = async (platformId: string, platform: string, topic: string, description: string) => {
    console.log('=== HANDLING GENERATE IMAGE ===');
    console.log('Platform ID received:', platformId);
    console.log('Platform ID type:', typeof platformId);
    console.log('Platform ID length:', platformId ? platformId.length : 'undefined');
    console.log('Platform:', platform);
    
    // Validate that we have a complete platform UUID before proceeding
    if (!platformId) {
      console.error('No platform ID provided for image generation');
      toast({
        title: "Error",
        description: "No se pudo identificar la plataforma para generar la imagen.",
        variant: "destructive",
      });
      return;
    }

    // Check if the ID looks like a complete UUID (36 characters with dashes)
    if (platformId.length !== 36 || !platformId.includes('-')) {
      console.error('Invalid platform ID format:', platformId);
      toast({
        title: "Error",
        description: "ID de plataforma inválido. No se puede generar la imagen.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      console.log('Generating image for platform with complete ID:', platformId);
      const { data, error } = await contentService.generateImageForPlatform(platformId, platform, topic, description);
      
      if (error) {
        console.error('Error from generateImageForPlatform:', error);
        toast({
          title: "Error al generar imagen",
          description: `No se pudo generar la imagen: ${error.message || 'Verifica tu webhook'}`,
          variant: "destructive",
        });
      } else {
        console.log('Image generated successfully:', data);
        
        toast({
          title: "Imagen generada exitosamente",
          description: `Se generó la imagen para ${platform}.`,
        });
        
        // Reload entries to show the new image from database
        console.log('Reloading entries to show new image...');
        await loadEntries();
      }
    } catch (error) {
      console.error('Unexpected error generating image:', error);
      toast({
        title: "Error inesperado",
        description: "Ocurrió un error al generar la imagen.",
        variant: "destructive",
      });
    }
  };

  const handleUploadImage = async (platformId: string, file: File) => {
    console.log('=== HANDLING UPLOAD IMAGE ===');
    console.log('Platform ID received:', platformId);
    console.log('Platform ID type:', typeof platformId);
    console.log('Platform ID length:', platformId ? platformId.length : 'undefined');
    console.log('File name:', file.name);
    
    // Validate that we have a complete platform UUID before proceeding
    if (!platformId) {
      console.error('No platform ID provided for image upload');
      toast({
        title: "Error",
        description: "No se pudo identificar la plataforma para subir la imagen.",
        variant: "destructive",
      });
      return;
    }

    // Check if the ID looks like a complete UUID (36 characters with dashes)
    if (platformId.length !== 36 || !platformId.includes('-')) {
      console.error('Invalid platform ID format:', platformId);
      toast({
        title: "Error",
        description: "ID de plataforma inválido. No se puede subir la imagen.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const imageUrl = e.target?.result as string;
        
        console.log('Uploading image for platform with complete ID:', platformId);
        const { error } = await contentService.uploadCustomImage(platformId, imageUrl);
        
        if (error) {
          toast({
            title: "Error al subir imagen",
            description: "No se pudo subir la imagen personalizada.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Imagen subida exitosamente",
            description: "Tu imagen personalizada se ha guardado.",
          });
          
          await loadEntries();
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Error inesperado",
        description: "Ocurrió un error al subir la imagen.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteImage = async (platformId: string, imageUrl: string, isUploaded: boolean) => {
    console.log('=== HANDLING DELETE IMAGE ===');
    console.log('Platform ID received:', platformId);
    console.log('Platform ID type:', typeof platformId);
    console.log('Platform ID length:', platformId ? platformId.length : 'undefined');
    console.log('Image URL:', imageUrl);
    console.log('Is uploaded:', isUploaded);
    
    // Validate that we have a complete platform UUID before proceeding
    if (!platformId) {
      console.error('No platform ID provided for image deletion');
      toast({
        title: "Error",
        description: "No se pudo identificar la plataforma para eliminar la imagen.",
        variant: "destructive",
      });
      return;
    }

    // Check if the ID looks like a complete UUID (36 characters with dashes)
    if (platformId.length !== 36 || !platformId.includes('-')) {
      console.error('Invalid platform ID format:', platformId);
      toast({
        title: "Error",
        description: "ID de plataforma inválido. No se puede eliminar la imagen.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      console.log('Deleting image for platform with complete ID:', platformId);
      const { error } = await contentService.deleteImageFromPlatform(platformId, imageUrl, isUploaded);
      
      if (error) {
        toast({
          title: "Error al eliminar imagen",
          description: "No se pudo eliminar la imagen.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Imagen eliminada",
          description: "La imagen ha sido eliminada exitosamente.",
        });
        
        await loadEntries();
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      toast({
        title: "Error inesperado",
        description: "Ocurrió un error al eliminar la imagen.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadSlides = async (entryId: string, slidesURL: string) => {
    if (!slidesURL) {
      toast({
        title: "Error",
        description: "No hay URL de slides disponible para descargar.",
        variant: "destructive",
      });
      return;
    }

    try {
      const entry = entries.find(e => e.id === entryId);
      if (!entry) return;

      const { data, error } = await contentService.downloadSlidesWithUserWebhook(slidesURL, entry.topic);
      
      if (error) throw error;

      let slideImages: string[] = [];
      if (Array.isArray(data) && data.length > 0 && data[0]?.slideImages) {
        slideImages = data[0].slideImages;
      }

      if (slideImages.length > 0) {
        toast({
          title: "¡Slides descargadas exitosamente!",
          description: `Se descargaron ${slideImages.length} imágenes de las slides.`,
        });
        
        await loadEntries();
      } else {
        toast({
          title: "Descarga completada",
          description: "Las slides han sido procesadas por tu webhook.",
        });
      }
    } catch (error) {
      console.error('Error downloading slides:', error);
      toast({
        title: "Error al descargar slides",
        description: "Hubo un problema al conectar con tu webhook para descargar las slides.",
        variant: "destructive",
      });
    }
  };

  // Transform entries for ContentCard compatibility with improved image handling
  const transformedEntries = entries.map(entry => {
    console.log('=== TRANSFORMING ENTRY ===');
    console.log('Entry ID:', entry.id);
    console.log('Entry ID type:', typeof entry.id);
    console.log('Entry ID length:', entry.id ? entry.id.length : 'undefined');
    console.log('Entry topic:', entry.topic);
    
    const platformContent: any = {};
    const status: any = {};
    const slideImages: string[] = [];

    if (!entry.platforms || !Array.isArray(entry.platforms)) {
      console.error('Entry platforms is missing or not an array:', entry);
      return {
        id: entry.id,
        topic: entry.topic || '',
        description: entry.description || '',
        type: entry.type || '',
        createdDate: new Date(entry.created_at).toLocaleDateString(),
        status: {},
        platformContent: {},
        slideImages: undefined,
        publishedLinks: entry.published_links || {}
      };
    }

    entry.platforms.forEach(platform => {
      try {
        console.log(`Processing platform ${platform.platform} for entry ${entry.id}:`, platform);
        console.log(`Platform ID: ${platform.id} (type: ${typeof platform.id}, length: ${platform.id ? platform.id.length : 'undefined'})`);
        
        // Validate platform ID
        if (!platform.id || platform.id.length !== 36 || !platform.id.includes('-')) {
          console.warn(`Invalid platform ID format for ${platform.platform}:`, platform.id);
        }
        
        // Use image_url directly from database as a single string
        const imageUrl = platform.image_url || null;
        console.log(`Image URL for ${platform.platform}:`, imageUrl);

        // Safe parsing of uploaded images (keep as array for backward compatibility)
        let uploadedImages: string[] = [];
        if (platform.uploadedImages) {
          if (typeof platform.uploadedImages === 'string') {
            try {
              const parsed = JSON.parse(platform.uploadedImages);
              uploadedImages = Array.isArray(parsed) ? parsed : [];
            } catch (e) {
              console.warn('Failed to parse uploadedImages JSON for platform', platform.platform, ':', e);
              uploadedImages = [];
            }
          } else if (Array.isArray(platform.uploadedImages)) {
            uploadedImages = platform.uploadedImages;
          }
        }

        // Safe parsing of slide images
        let slideImagesArray: string[] = [];
        if (platform.slideImages) {
          if (typeof platform.slideImages === 'string') {
            try {
              const parsed = JSON.parse(platform.slideImages);
              slideImagesArray = Array.isArray(parsed) ? parsed : [];
            } catch (e) {
              console.warn('Failed to parse slideImages JSON for platform', platform.platform, ':', e);
              slideImagesArray = [];
            }
          } else if (Array.isArray(platform.slideImages)) {
            slideImagesArray = platform.slideImages;
          }
        }

        // Create images array for compatibility - include image_url if it exists
        const images: string[] = [];
        if (imageUrl) {
          images.push(imageUrl);
        }

        const safeContent = {
          text: platform.text || '',
          image_url: imageUrl, // Direct single image URL from database
          images: imageUrl ? [imageUrl] : [], // Keep for backward compatibility
          uploadedImages: uploadedImages,
          publishDate: platform.publish_date,
          slidesURL: platform.slides_url,
          platformId: platform.id, // Make sure this is the complete platform ID
          ...(platform.platform === 'wordpress' && {
            title: entry.topic || '',
            description: entry.description || '',
            slug: (entry.topic || '').toLowerCase().replace(/\s+/g, '-')
          })
        };

        platformContent[platform.platform] = safeContent;
        console.log(`Platform content for ${platform.platform}:`, safeContent);

        // Set status safely
        switch (platform.status) {
          case 'published':
            status[platform.platform] = 'published';
            break;
          case 'pending':
          case 'generated':
          case 'edited':
          case 'scheduled':
          default:
            status[platform.platform] = 'pending';
            break;
        }

        // Add slide images to the main slideImages array
        if (slideImagesArray.length > 0) {
          slideImages.push(...slideImagesArray);
        }

      } catch (error) {
        console.error('Error transforming platform data for', platform.platform, ':', error);
        // Provide safe fallback for this platform
        platformContent[platform.platform] = {
          text: platform.text || '',
          images: platform.image_url ? [platform.image_url] : [],
          uploadedImages: [],
          publishDate: platform.publish_date,
          slidesURL: platform.slides_url,
          platformId: platform.id,
          ...(platform.platform === 'wordpress' && {
            title: entry.topic || '',
            description: entry.description || '',
            slug: (entry.topic || '').toLowerCase().replace(/\s+/g, '-')
          })
        };
        status[platform.platform] = 'pending';
      }
    });

    const transformedEntry = {
      id: entry.id, // Ensure this is the complete entry ID
      topic: entry.topic || '',
      description: entry.description || '',
      type: entry.type || '',
      createdDate: new Date(entry.created_at).toLocaleDateString(),
      status,
      platformContent,
      slideImages: slideImages.length > 0 ? slideImages : undefined,
      publishedLinks: entry.published_links || {}
    };

    console.log('✅ Transformed entry with complete ID:', transformedEntry.id, transformedEntry.topic);
    return transformedEntry;
  });

  console.log('Final transformed entries:', transformedEntries.length);

  // Show loading screen while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  if (showProfileSetup) {
    return (
      <ProfileSetup
        userId={user.id}
        onComplete={handleProfileSetupComplete}
        isFirstTime={needsProfileSetup}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <DashboardHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        showMobileMenu={showMobileMenu}
        setShowMobileMenu={setShowMobileMenu}
        onNewContent={() => setShowForm(true)}
        onProfileSetup={() => setShowProfileSetup(true)}
        onSignOut={handleSignOut}
        userEmail={user?.email}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {showForm ? (
          <div className="max-w-2xl mx-auto">
            <ContentForm 
              onSubmit={handleNewEntry}
              onCancel={() => setShowForm(false)}
            />
          </div>
        ) : activeTab === 'calendar' ? (
          <div className="space-y-6 sm:space-y-8">
            <CalendarView entries={transformedEntries} />
          </div>
        ) : activeTab === 'integrations' ? (
          <div className="space-y-6 sm:space-y-8">
            <IntegrationsManager />
          </div>
        ) : (
          <DashboardContent
            entries={transformedEntries}
            selectedPlatforms={selectedPlatforms}
            loading={loading}
            onNewContent={() => setShowForm(true)}
            onUpdateContent={handleUpdateContent}
            onDeleteEntry={handleDeleteEntry}
            onDownloadSlides={handleDownloadSlides}
            onGenerateImage={handleGenerateImage}
            onUploadImage={handleUploadImage}
            onDeleteImage={handleDeleteImage}
          />
        )}
      </main>
    </div>
  );
};

export default Index;
