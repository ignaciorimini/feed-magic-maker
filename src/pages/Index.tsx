import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FileText, User, BarChart3, LogOut, Loader2, Settings, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import ContentForm from '@/components/ContentForm';
import ContentCard from '@/components/ContentCard';
import StatsOverview from '@/components/StatsOverview';
import ProfileSetup from '@/components/ProfileSetup';
import { useAuth } from '@/hooks/useAuth';
import { contentService, ContentEntry } from '@/services/contentService';
import { profileService } from '@/services/profileService';
import { toast } from '@/hooks/use-toast';

// Helper function to safely parse publishedLinks from database Json type
const parsePublishedLinks = (publishedLinks: any): { instagram?: string; linkedin?: string; wordpress?: string; } => {
  if (!publishedLinks || typeof publishedLinks !== 'object') {
    return {};
  }
  
  // If it's already the right type, return it
  if (typeof publishedLinks === 'object' && !Array.isArray(publishedLinks)) {
    return publishedLinks as { instagram?: string; linkedin?: string; wordpress?: string; };
  }
  
  return {};
};

// Helper function to safely parse slideImages from platform_content
const parseSlideImages = (platformContent: any): string[] => {
  if (!platformContent || typeof platformContent !== 'object') {
    return [];
  }
  
  if (platformContent.slideImages && Array.isArray(platformContent.slideImages)) {
    return platformContent.slideImages;
  }
  
  return [];
};

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

  // Check if user needs profile setup and load selected platforms
  useEffect(() => {
    const checkProfile = async () => {
      if (user) {
        const { needsSetup } = await profileService.checkProfileSetup(user.id);
        setNeedsProfileSetup(needsSetup);
        if (needsSetup) {
          setShowProfileSetup(true);
        } else {
          // Load user profile to get selected platforms
          const { data: profile } = await profileService.getUserProfile(user.id);
          if (profile && profile.selected_platforms) {
            // Ensure the selected_platforms is an array of strings
            if (Array.isArray(profile.selected_platforms)) {
              const validPlatforms = profile.selected_platforms.filter(
                (platform): platform is string => typeof platform === 'string'
              );
              setSelectedPlatforms(validPlatforms);
            }
          }
        }
      }
    };

    checkProfile();
  }, [user]);

  // Load user's content entries
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
          // Transform the data to match the expected format
          const transformedEntries: ContentEntry[] = data.map(entry => ({
            id: entry.id, // Keep as string UUID
            topic: entry.topic,
            description: entry.description || '',
            type: entry.type,
            createdDate: entry.created_date,
            status: {
              instagram: entry.status_instagram as 'published' | 'pending' | 'error',
              linkedin: entry.status_linkedin as 'published' | 'pending' | 'error',
              wordpress: entry.status_wordpress as 'published' | 'pending' | 'error'
            },
            platformContent: entry.platform_content || {},
            publishedLinks: parsePublishedLinks(entry.published_links),
            slideImages: parseSlideImages(entry.platform_content)
          }));
          setEntries(transformedEntries);
        }
        setLoading(false);
      }
    };

    loadEntries();
  }, [user, needsProfileSetup]);

  // Nueva función para manejar descarga de slides
  const handleDownloadSlides = async (entryId: string, slidesURL: string) => {
    console.log('Downloading slides for entry:', entryId, 'URL:', slidesURL);
    
    if (!slidesURL) {
      toast({
        title: "Error",
        description: "No hay URL de slides disponible para descargar.",
        variant: "destructive",
      });
      return;
    }

    // Find the entry to get its topic/name
    const entry = entries.find(e => e.id === entryId);
    if (!entry) {
      toast({
        title: "Error",
        description: "No se pudo encontrar el contenido.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Usar la función que llama al webhook del usuario con action, slidesURL y contentName
      const { data, error } = await contentService.downloadSlidesWithUserWebhook(slidesURL, entry.topic);
      
      if (error) {
        throw error;
      }

      console.log('Download response received:', data);
      console.log('Data type:', typeof data);
      console.log('Data is array:', Array.isArray(data));

      // FIXED: Mejorar la extracción de slideImages del response
      let slideImages: string[] = [];
      
      if (data) {
        console.log('Processing data...', data);
        
        // FIXED: Si data.slideImages existe directamente (respuesta normalizada por contentService)
        if (data.slideImages && Array.isArray(data.slideImages)) {
          slideImages = data.slideImages;
          console.log('Found slideImages directly in data:', slideImages.length);
        }
        // Si es la respuesta original del webhook (array con objeto)
        else if (Array.isArray(data) && data.length > 0) {
          console.log('Data is array, checking first element:', data[0]);
          const firstItem = data[0];
          if (firstItem && firstItem.slideImages && Array.isArray(firstItem.slideImages)) {
            slideImages = firstItem.slideImages;
            console.log('Found slideImages in first array element:', slideImages.length);
          }
        }
        // Si data es un objeto con slideImages
        else if (typeof data === 'object' && data.slideImages && Array.isArray(data.slideImages)) {
          slideImages = data.slideImages;
          console.log('Found slideImages in object:', slideImages.length);
        }
        
        console.log('Final extracted slideImages:', slideImages);
        console.log('Number of slide images:', slideImages.length);
      }

      if (slideImages.length > 0) {
        console.log('Saving', slideImages.length, 'slide images to database...');
        
        // Guardar las slide images en la base de datos
        const { error: saveError } = await contentService.saveSlideImages(entryId, slideImages);
        
        if (saveError) {
          console.error('Error saving slide images:', saveError);
          toast({
            title: "Error al guardar slides",
            description: "Las slides se descargaron pero no se pudieron guardar.",
            variant: "destructive",
          });
          return;
        }

        console.log('Slide images saved successfully, updating local state...');

        // Actualizar el estado local para mostrar las imágenes en el carousel
        setEntries(prev => prev.map(entry => {
          if (entry.id === entryId) {
            const updatedPlatformContent = { ...entry.platformContent };
            
            // Actualizar la imagen de Instagram y LinkedIn con la primera slide
            if (slideImages.length > 0) {
              const firstSlideImage = slideImages[0];
              console.log('Updating platform content with first slide:', firstSlideImage);
              
              if (updatedPlatformContent.instagram) {
                updatedPlatformContent.instagram = {
                  ...updatedPlatformContent.instagram,
                  images: [firstSlideImage]
                };
              }
              
              if (updatedPlatformContent.linkedin) {
                updatedPlatformContent.linkedin = {
                  ...updatedPlatformContent.linkedin,
                  images: [firstSlideImage]
                };
              }
            }

            const updatedEntry = {
              ...entry,
              slideImages: slideImages,
              platformContent: updatedPlatformContent
            };
            
            console.log('Updated entry:', updatedEntry);
            return updatedEntry;
          }
          return entry;
        }));

        toast({
          title: "¡Slides descargadas exitosamente!",
          description: `Se descargaron y guardaron ${slideImages.length} imágenes de las slides.`,
        });
      } else {
        console.log('No slideImages found in response. Full response structure:');
        console.log(JSON.stringify(data, null, 2));
        toast({
          title: "Error en la descarga",
          description: "No se encontraron imágenes de slides en la respuesta del webhook.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error al descargar slides:', error);
      toast({
        title: "Error al descargar slides",
        description: "Hubo un problema al conectar con tu webhook para descargar las slides.",
        variant: "destructive",
      });
    }
  };

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (!error) {
      navigate('/auth');
    }
  };

  const handleProfileSetupComplete = () => {
    setShowProfileSetup(false);
    setNeedsProfileSetup(false);
    // Reload entries after profile setup
    window.location.reload();
  };

  // Función para manejar nueva entrada con mapeo correcto de tipos
  const handleNewEntry = async (entryData: any) => {
    console.log("Datos recibidos para nueva entrada:", entryData);
    
    // FIXED: Corregir el mapeo del tipo de contenido
    let contentType: string;
    if (entryData.type === 'simple') {
      contentType = 'Simple Post';
    } else if (entryData.type === 'slide') {
      contentType = 'Slide Post';
    } else {
      // Fallback para casos edge
      contentType = entryData.type || 'Simple Post';
    }
    
    console.log('Content type mapped to:', contentType);
    
    // Process content generated from webhook
    let platformContent = {
      instagram: {
        text: "Generando contenido automáticamente para Instagram...",
        images: ["/placeholder.svg"],
        publishDate: "",
        slidesURL: ""
      },
      linkedin: {
        text: "Generando contenido automáticamente para LinkedIn...",
        images: ["/placeholder.svg"],
        publishDate: "",
        slidesURL: ""
      },
      wordpress: {
        text: "Generando contenido automáticamente para WordPress...",
        images: ["/placeholder.svg"],
        publishDate: "",
        title: "",
        description: "",
        slug: "",
        slidesURL: ""
      }
    };

    // If there's generated content from webhook, use it
    if (entryData.generatedContent) {
      const generated = entryData.generatedContent;
      
      // Use AI generated image if available, otherwise use placeholder
      const imageToUse = generated.imageURL || "/placeholder.svg";
      const slidesURL = generated.slidesURL || "";
      
      platformContent = {
        instagram: {
          text: generated.instagramContent || platformContent.instagram.text,
          images: [imageToUse],
          publishDate: "",
          slidesURL: slidesURL
        },
        linkedin: {
          text: generated.linkedinContent || platformContent.linkedin.text,
          images: [imageToUse],
          publishDate: "",
          slidesURL: slidesURL
        },
        wordpress: {
          text: generated.wordpressContent || platformContent.wordpress.text,
          images: [imageToUse],
          publishDate: "",
          title: generated.wordpressTitle || "",
          description: generated.wordpressDescription || "",
          slug: generated.wordpressSlug || "",
          slidesURL: slidesURL
        }
      };
    }

    // Save to Supabase with correct content type
    const { data, error } = await contentService.createContentEntry({
      topic: entryData.topic,
      description: entryData.description,
      type: contentType, // Usar el tipo mapeado correctamente
      platform_content: platformContent
    });

    if (error) {
      console.error('Error creating entry:', error);
      toast({
        title: "Error al crear contenido",
        description: "No se pudo guardar el contenido. Inténtalo nuevamente.",
        variant: "destructive",
      });
    } else if (data) {
      // Transform the new entry and add to state - using string ID instead of parseInt
      const newEntry: ContentEntry = {
        id: data.id, // Keep as string UUID
        topic: data.topic,
        description: data.description || '',
        type: data.type,
        createdDate: data.created_date,
        status: {
          instagram: data.status_instagram as 'published' | 'pending' | 'error',
          linkedin: data.status_linkedin as 'published' | 'pending' | 'error',
          wordpress: data.status_wordpress as 'published' | 'pending' | 'error'
        },
        platformContent: data.platform_content,
        publishedLinks: parsePublishedLinks(data.published_links),
        slideImages: parseSlideImages(data.platform_content)
      };

      setEntries([newEntry, ...entries]);
      setShowForm(false);
    }
  };

  const handleUpdateContent = async (entryId: string, platform: string, content: any) => {
    const { error } = await contentService.updatePlatformContent(entryId, platform, content);
    
    if (error) {
      toast({
        title: "Error al actualizar contenido",
        description: "No se pudo actualizar el contenido.",
        variant: "destructive",
      });
    } else {
      setEntries(prev => prev.map(entry => {
        if (entry.id === entryId) {
          return {
            ...entry,
            platformContent: {
              ...entry.platformContent,
              [platform]: content
            }
          };
        }
        return entry;
      }));
    }
  };

  const handleUpdatePublishSettings = (entryId: string, settings: any) => {
    setEntries(prev => prev.map(entry => {
      if (entry.id === entryId) {
        const updatedEntry = { ...entry };
        Object.entries(settings.publishDates).forEach(([platform, date]) => {
          if (date) {
            updatedEntry.platformContent[platform as keyof typeof updatedEntry.platformContent].publishDate = date as string;
          }
        });
        return updatedEntry;
      }
      return entry;
    }));
  };

  const handleDeleteEntry = async (entryId: string) => {
    console.log('Attempting to delete entry:', entryId, 'Type:', typeof entryId);
    
    // Validate that we have a valid ID
    if (!entryId || entryId === 'undefined' || entryId === 'null') {
      toast({
        title: "Error al eliminar contenido",
        description: "ID de entrada inválido.",
        variant: "destructive",
      });
      return;
    }
    
    const { error } = await contentService.deleteContentEntry(entryId);
    
    if (error) {
      console.error('Delete error:', error);
      toast({
        title: "Error al eliminar contenido",
        description: error.message || "No se pudo eliminar el contenido.",
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

  // Don't render anything if not authenticated (redirect is happening)
  if (!user) {
    return null;
  }

  // Show profile setup if needed
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
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  ContentFlow
                </h1>
                <p className="text-sm text-gray-500">Automatización de Contenido</p>
              </div>
            </div>
            
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

        {showMobileMenu && (
          <div className="fixed inset-0 z-[100] md:hidden">
            {/* Dark overlay behind the menu */}
            <div 
              className="fixed inset-0 bg-black/50 backdrop-blur-sm" 
              onClick={() => setShowMobileMenu(false)} 
            />
            {/* Menu panel with solid white background */}
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
        ) : (
          <div className="space-y-6 sm:space-y-8">
            {/* Stats Overview - Pass selectedPlatforms */}
            <div>
              <StatsOverview entries={entries} selectedPlatforms={selectedPlatforms} />
            </div>

            {/* Content Grid */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 space-y-4 sm:space-y-0">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Contenido Creado</h2>
                  <p className="text-sm sm:text-base text-gray-600">Gestiona y supervisa tu contenido automatizado</p>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-xs sm:text-sm">
                    {entries.length} entradas
                  </Badge>
                </div>
              </div>

              {loading ? (
                <div className="text-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-4" />
                  <p className="text-gray-600">Cargando contenido...</p>
                </div>
              ) : entries.length === 0 ? (
                <Card className="text-center py-12 bg-white/60 backdrop-blur-sm border-dashed border-2 border-gray-300">
                  <CardContent className="pt-6">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No hay contenido aún
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Comienza creando tu primer contenido automatizado
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
                  {entries.map((entry) => (
                    <ContentCard 
                      key={entry.id} 
                      entry={entry}
                      selectedPlatforms={selectedPlatforms}
                      onUpdateContent={handleUpdateContent}
                      onUpdatePublishSettings={handleUpdatePublishSettings}
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
