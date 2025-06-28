
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
  useEffect(() => {
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
          setEntries(data);
        }
        setLoading(false);
      }
    };
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
    const { data, error } = await contentService.createContentEntry({
      topic: entryData.topic,
      description: entryData.description,
      type: entryData.type,
      selectedPlatforms: entryData.selectedPlatforms
    });

    if (error) {
      toast({
        title: "Error al crear contenido",
        description: "No se pudo crear el contenido. Inténtalo nuevamente.",
        variant: "destructive",
      });
    } else if (data) {
      // Reload entries to show the new content
      const { data: updatedEntries } = await contentService.getUserContentEntries();
      if (updatedEntries) {
        setEntries(updatedEntries);
      }
      setShowForm(false);
      toast({
        title: "Contenido creado exitosamente",
        description: "Tu contenido ha sido generado para las plataformas seleccionadas.",
      });
    }
  };

  const handleUpdateContent = async (entryId: string, platform: string, content: any): Promise<void> => {
    // Find the platform ID for the specific entry and platform
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
      // Reload entries to show updated content
      window.location.reload();
      toast({
        title: "Contenido actualizado",
        description: "Los cambios se han guardado correctamente.",
      });
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    const { error } = await contentService.deleteContentEntry(entryId);
    
    if (error) {
      toast({
        title: "Error al eliminar contenido",
        description: "No se pudo eliminar el contenido.",
        variant: "destructive",
      });
    } else {
      setEntries(prev => prev.filter(entry => entry.id !== entryId));
      toast({
        title: "Contenido eliminado",
        description: "El contenido ha sido eliminado exitosamente.",
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
        
        // Reload to show updated slides
        window.location.reload();
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

  // Transform entries for ContentCard compatibility
  const transformedEntries = entries.map(entry => {
    const platformContent: any = {};
    const status: any = {};
    const slideImages: string[] = [];

    entry.platforms.forEach(platform => {
      platformContent[platform.platform] = {
        text: platform.text || '',
        images: platform.images || [],
        publishDate: platform.publish_date,
        slidesURL: platform.slides_url,
        ...(platform.platform === 'wordpress' && {
          title: entry.topic,
          description: entry.description,
          slug: entry.topic.toLowerCase().replace(/\s+/g, '-')
        })
      };

      // Convert new status to old status format for ContentCard
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

      // Collect slide images from any platform
      if (platform.slideImages && platform.slideImages.length > 0) {
        slideImages.push(...platform.slideImages);
      }
    });

    return {
      id: entry.id,
      topic: entry.topic,
      description: entry.description,
      type: entry.type,
      createdDate: new Date(entry.created_at).toLocaleDateString(),
      status,
      platformContent,
      slideImages: slideImages.length > 0 ? slideImages : undefined,
      publishedLinks: entry.published_links || {}
    };
  });

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

      {/* Main Content */}
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
        ) : (
          <DashboardContent
            entries={transformedEntries}
            selectedPlatforms={selectedPlatforms}
            loading={loading}
            onNewContent={() => setShowForm(true)}
            onUpdateContent={handleUpdateContent}
            onDeleteEntry={handleDeleteEntry}
            onDownloadSlides={handleDownloadSlides}
          />
        )}
      </main>
    </div>
  );
};

export default Index;
