
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FileText, User, BarChart3, LogOut, Loader2, Settings, Menu, X, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import ContentForm from '@/components/ContentForm';
import StatsOverview from '@/components/StatsOverview';
import ProfileSetup from '@/components/ProfileSetup';
import CalendarView from '@/components/CalendarView';
import ContentCard from '@/components/ContentCard';
import { useAuth } from '@/hooks/useAuth';
import { contentService, ContentEntry, ContentPlatform } from '@/services/contentService';
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
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200/60 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => setActiveTab('dashboard')} 
              className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  ContentFlow
                </h1>
                <p className="text-sm text-gray-500">Automatización de Contenido</p>
              </div>
            </button>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4">
              <Button
                variant={activeTab === 'dashboard' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('dashboard')}
                size="sm"
              >
                Dashboard
              </Button>
              <Button
                variant={activeTab === 'calendar' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('calendar')}
                size="sm"
              >
                Calendario
              </Button>
              <Button
                onClick={() => setShowForm(true)}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                size="sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Contenido
              </Button>
              
              {/* Desktop User Menu */}
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowProfileSetup(true)}
                  className="p-2"
                >
                  <Settings className="w-4 h-4" />
                </Button>
                <div className="w-8 h-8 bg-gradient-to-r from-gray-600 to-gray-400 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  className="p-2"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMobileMenu(true)}
                className="p-2"
              >
                <Menu className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="fixed inset-0 z-[100] md:hidden">
            <div 
              className="fixed inset-0 bg-black/50 backdrop-blur-sm" 
              onClick={() => setShowMobileMenu(false)} 
            />
            <div className="fixed right-0 top-0 h-full w-80 max-w-[85vw] bg-white shadow-2xl border-l border-gray-200">
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900">Menú</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowMobileMenu(false)}
                  className="p-2 hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <div className="p-6 space-y-4">
                <Button
                  variant={activeTab === 'dashboard' ? 'default' : 'ghost'}
                  onClick={() => {
                    setActiveTab('dashboard');
                    setShowMobileMenu(false);
                  }}
                  className="w-full justify-start h-12 text-left"
                >
                  <BarChart3 className="w-5 h-5 mr-3" />
                  Dashboard
                </Button>
                <Button
                  variant={activeTab === 'calendar' ? 'default' : 'ghost'}
                  onClick={() => {
                    setActiveTab('calendar');
                    setShowMobileMenu(false);
                  }}
                  className="w-full justify-start h-12 text-left"
                >
                  <Calendar className="w-5 h-5 mr-3" />
                  Calendario
                </Button>
                <Button
                  onClick={() => {
                    setShowForm(true);
                    setShowMobileMenu(false);
                  }}
                  className="w-full justify-start h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
                >
                  <Plus className="w-5 h-5 mr-3" />
                  Nuevo Contenido
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowProfileSetup(true);
                    setShowMobileMenu(false);
                  }}
                  className="w-full justify-start h-12 hover:bg-gray-100"
                >
                  <Settings className="w-5 h-5 mr-3" />
                  Configuración
                </Button>
                
                <div className="border-t border-gray-200 pt-6 mt-6">
                  <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl mb-6">
                    <div className="w-10 h-10 bg-gradient-to-r from-gray-600 to-gray-400 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{user?.email}</p>
                      <p className="text-xs text-gray-500">Usuario</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      handleSignOut();
                      setShowMobileMenu(false);
                    }}
                    className="w-full justify-start h-12 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <LogOut className="w-5 h-5 mr-3" />
                    Cerrar Sesión
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

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
          <div className="space-y-6 sm:space-y-8">
            <div>
              <StatsOverview entries={transformedEntries} selectedPlatforms={selectedPlatforms} />
            </div>

            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 space-y-4 sm:space-y-0">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Contenido Creado</h2>
                  <p className="text-sm sm:text-base text-gray-600">Gestiona tu contenido por red social</p>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-xs sm:text-sm">
                    {transformedEntries.length} entradas
                  </Badge>
                </div>
              </div>

              {loading ? (
                <div className="text-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-4" />
                  <p className="text-gray-600">Cargando contenido...</p>
                </div>
              ) : transformedEntries.length === 0 ? (
                <Card className="text-center py-12 bg-white/60 backdrop-blur-sm border-dashed border-2 border-gray-300">
                  <CardContent className="pt-6">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No hay contenido aún
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Comienza creando tu primer contenido para redes sociales
                    </p>
                    <Button 
                      onClick={() => setShowForm(true)}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Crear Contenido
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {transformedEntries.map((entry) => (
                    <ContentCard
                      key={entry.id}
                      entry={entry}
                      selectedPlatforms={selectedPlatforms}
                      onUpdateContent={handleUpdateContent}
                      onUpdatePublishSettings={() => {}}
                      onDeleteEntry={handleDeleteEntry}
                      onDownloadSlides={handleDownloadSlides}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
