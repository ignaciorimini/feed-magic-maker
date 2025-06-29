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
      const { data, error } = await contentService.getUserContentEntries();
      
      if (error) {
        console.error('Error loading entries:', error);
        toast({
          title: "Error al cargar contenido",
          description: "No se pudo cargar tu contenido. Inténtalo nuevamente.",
          variant: "destructive",
        });
      } else if (data) {
        console.log('Raw entries loaded:', data);
        setEntries(data);
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
    const { data: rawEntries } = await contentService.getUserContentEntries();
    const entry = rawEntries?.find(e => e.id === entryId);
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

  const handleGenerateImage = async (platformId: string, platform: string, topic: string, description: string) => {
    console.log(`Generating image for platform ${platform}:`, { platformId, topic, description });
    
    try {
      const { data, error } = await contentService.generateImageForPlatform(platformId, platform, topic, description);
      
      if (error) {
        toast({
          title: "Error al generar imagen",
          description: "No se pudo generar la imagen. Verifica tu webhook.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Imagen generada exitosamente",
          description: `Se generó la imagen para ${platform}.`,
        });
        
        await loadEntries();
      }
    } catch (error) {
      console.error('Error generating image:', error);
      toast({
        title: "Error inesperado",
        description: "Ocurrió un error al generar la imagen.",
        variant: "destructive",
      });
    }
  };

  const handleUploadImage = async (platformId: string, file: File) => {
    console.log(`Uploading image for platform:`, { platformId, fileName: file.name });
    
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const imageUrl = e.target?.result as string;
        
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
    console.log(`Deleting image:`, { platformId, imageUrl, isUploaded });
    
    try {
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

  const handleDeleteEntry = async (entryId: string) => {
    console.log('Attempting to delete entry:', entryId);
    
    try {
      const { error } = await contentService.deleteContentEntry(entryId);
      
      if (error) {
        console.error('Delete error:', error);
        toast({
          title: "Error al eliminar contenido",
          description: "No se pudo eliminar el contenido. Inténtalo nuevamente.",
          variant: "destructive",
        });
      } else {
        setEntries(prev => prev.filter(entry => entry.id !== entryId));
        
        toast({
          title: "Contenido eliminado",
          description: "El contenido ha sido eliminado exitosamente.",
        });
        
        console.log('Entry deleted successfully');
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

  // Transform entries for ContentCard compatibility with enhanced error checking
  const transformedEntries = entries.map(entry => {
    console.log('Transforming entry:', entry);
    
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
        // Handle image_url from the database
        const images: string[] = [];
        if (platform.image_url && typeof platform.image_url === 'string') {
          images.push(platform.image_url);
        }

        // Safe parsing of uploaded images
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

        // Combine all images safely
        const allImages = [
          ...images,
          ...uploadedImages
        ];

        const safeContent = {
          text: platform.text || '',
          images: allImages,
          uploadedImages: uploadedImages,
          publishDate: platform.publish_date,
          slidesURL: platform.slides_url,
          platformId: platform.id,
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
      id: entry.id,
      topic: entry.topic || '',
      description: entry.description || '',
      type: entry.type || '',
      createdDate: new Date(entry.created_at).toLocaleDateString(),
      status,
      platformContent,
      slideImages: slideImages.length > 0 ? slideImages : undefined,
      publishedLinks: entry.published_links || {}
    };

    console.log('Transformed entry:', transformedEntry);
    return transformedEntry;
  });

  console.log('Final transformed entries:', transformedEntries);

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
