
import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ContentForm from '@/components/ContentForm';
import PlatformPreview from '@/components/PlatformPreview';
import { useAuth } from '@/hooks/useAuth';
import { contentService } from '@/services/contentService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const DashboardContent = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [lastFetch, setLastFetch] = useState<number>(Date.now());

  const { data: entries = [], isLoading, error, refetch } = useQuery({
    queryKey: ['content-entries', user?.id, lastFetch],
    queryFn: async () => {
      if (!user?.id) {
        throw new Error('User not found');
      }
      
      console.log('Fetching content entries...');
      
      // Fetch content entries with platforms and slide images
      const { data: entriesData, error: entriesError } = await supabase
        .from('content_entries')
        .select(`
          *,
          platforms:content_platforms(
            id,
            platform,
            status,
            text,
            image_url,
            slides_url,
            scheduled_at,
            published_url,
            slide_images:slide_images(
              image_url,
              position
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (entriesError) {
        console.error('Error fetching entries:', entriesError);
        throw entriesError;
      }

      console.log('Raw entries data:', entriesData);

      // Transform the data to include slide images properly
      const transformedEntries = entriesData?.map(entry => {
        const platforms = entry.platforms?.map((platform: any) => {
          // Sort slide images by position
          const slideImages = platform.slide_images?.sort((a: any, b: any) => a.position - b.position);
          
          return {
            ...platform,
            slideImages: slideImages?.map((img: any) => img.image_url) || []
          };
        }) || [];

        return {
          ...entry,
          platforms
        };
      }) || [];

      console.log('Transformed entries:', transformedEntries);
      return transformedEntries;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchInterval: false,
  });

  const handleDeleteEntry = async (entryId: string) => {
    try {
      // Delete the content entry and its related platforms
      const { error } = await supabase
        .from('content_entries')
        .delete()
        .eq('id', entryId);
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Contenido eliminado",
        description: "La entrada ha sido eliminada exitosamente.",
      });
      
      // Invalidate query to refetch data
      queryClient.invalidateQueries({ queryKey: ['content-entries', user?.id] });
    } catch (error) {
      console.error('Error deleting entry:', error);
      toast({
        title: "Error al eliminar",
        description: "Hubo un problema al eliminar la entrada.",
        variant: "destructive",
      });
    }
  };

  const handleContentGenerated = useCallback(() => {
    console.log('Content generated, refetching...');
    setLastFetch(Date.now());
    refetch();
  }, [refetch]);

  const handleUpdateContent = useCallback(async (entryId: string, platform: string, content: any) => {
    try {
      const { error } = await contentService.updatePlatformContent(entryId, content);
      if (error) {
        throw error;
      }
      
      toast({
        title: "Contenido actualizado",
        description: "Los cambios han sido guardados exitosamente.",
      });
      
      // Trigger refetch
      setLastFetch(Date.now());
      refetch();
    } catch (error) {
      console.error('Error updating content:', error);
      toast({
        title: "Error al actualizar",
        description: "Hubo un problema al guardar los cambios.",
        variant: "destructive",
      });
    }
  }, [refetch]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <ContentForm onContentGenerated={handleContentGenerated} />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="w-full">
              <CardContent className="p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-32 bg-gray-200 rounded"></div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <ContentForm onContentGenerated={handleContentGenerated} />
        </div>
        
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">Error al cargar el contenido: {error.message}</p>
          <Button onClick={() => refetch()} variant="outline">
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <ContentForm onContentGenerated={handleContentGenerated} />
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg mb-4">
            Aún no tienes contenido generado
          </p>
          <p className="text-gray-400">
            Usa el formulario de arriba para crear tu primer contenido
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {entries.map((entry: any) => (
            <div key={entry.id} className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    {entry.topic}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Creado el {new Date(entry.created_at).toLocaleDateString('es-ES')}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">{entry.type}</Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteEntry(entry.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    Eliminar
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {entry.platforms?.map((platform: any) => {
                  console.log('Rendering platform:', platform.platform, 'with slideImages:', platform.slideImages);
                  
                  return (
                    <PlatformPreview
                      key={`${entry.id}-${platform.platform}`}
                      platform={platform.platform}
                      content={{
                        text: platform.text || '',
                        images: platform.image_url ? [platform.image_url] : [],
                        publishDate: platform.scheduled_at,
                        title: platform.title,
                        description: platform.description,
                        slug: platform.slug,
                        slidesURL: platform.slides_url,
                        platformId: platform.id
                      }}
                      status={platform.status || 'pending'}
                      contentType={entry.type}
                      onUpdateContent={(content) => handleUpdateContent(entry.id, platform.platform, content)}
                      entryId={entry.id}
                      platformId={platform.id}
                      topic={entry.topic}
                      slideImages={platform.slideImages || []}
                      publishedLink={platform.published_url}
                      onStatusChange={(newStatus) => console.log('Status changed:', newStatus)}
                      onLinkUpdate={(link) => console.log('Link updated:', link)}
                      onDeleteEntry={() => handleDeleteEntry(entry.id)}
                      onDownloadSlides={() => console.log('Download slides')}
                      onUpdateImage={() => console.log('Update image')}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DashboardContent;
