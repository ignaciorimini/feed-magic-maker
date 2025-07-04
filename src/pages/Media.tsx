
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { contentService } from '@/services/contentService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Calendar, Download, Loader2, Images } from 'lucide-react';

interface MediaImage {
  id: string;
  image_url: string;
  created_at: string;
  type: 'platform' | 'uploaded';
  platform?: string;
  content_topic?: string;
}

const Media = () => {
  const { user } = useAuth();
  const [images, setImages] = useState<MediaImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'platform' | 'uploaded'>('all');

  const loadImages = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Get platform images
      const { data: platformImages, error: platformError } = await supabase
        .from('content_platforms')
        .select(`
          id,
          image_url,
          created_at,
          platform,
          content_entries!inner(topic, user_id)
        `)
        .eq('content_entries.user_id', user.id)
        .not('image_url', 'is', null);

      // Get uploaded images
      const { data: uploadedImages, error: uploadedError } = await supabase
        .from('uploaded_images')
        .select(`
          id,
          image_url,
          uploaded_at,
          content_platforms!inner(
            content_entries!inner(user_id, topic)
          )
        `)
        .eq('content_platforms.content_entries.user_id', user.id);

      if (platformError) {
        console.error('Error fetching platform images:', platformError);
      }

      if (uploadedError) {
        console.error('Error fetching uploaded images:', uploadedError);
      }

      const allImages: MediaImage[] = [];

      // Add platform images
      if (platformImages) {
        platformImages.forEach(img => {
          allImages.push({
            id: img.id,
            image_url: img.image_url,
            created_at: img.created_at,
            type: 'platform',
            platform: img.platform,
            content_topic: img.content_entries?.topic
          });
        });
      }

      // Add uploaded images
      if (uploadedImages) {
        uploadedImages.forEach(img => {
          allImages.push({
            id: img.id,
            image_url: img.image_url,
            created_at: img.uploaded_at,
            type: 'uploaded',
            content_topic: img.content_platforms?.content_entries?.topic
          });
        });
      }

      // Sort by date (newest first)
      allImages.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      setImages(allImages);
    } catch (error) {
      console.error('Error loading media images:', error);
      toast({
        title: "Error al cargar imágenes",
        description: "No se pudieron cargar las imágenes de la galería",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadImages();
  }, [user]);

  const handleDownloadImage = async (imageUrl: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `image-${Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Imagen descargada",
        description: "La imagen se ha descargado exitosamente",
      });
    } catch (error) {
      console.error('Error downloading image:', error);
      toast({
        title: "Error al descargar",
        description: "No se pudo descargar la imagen",
        variant: "destructive",
      });
    }
  };

  const filteredImages = images.filter(image => {
    const matchesSearch = !searchTerm || 
      image.content_topic?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      image.platform?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = selectedType === 'all' || image.type === selectedType;
    
    return matchesSearch && matchesType;
  });

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Media</h1>
        <p className="text-gray-600">Gestiona todas tus imágenes generadas y subidas</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Buscar por tema o plataforma..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={selectedType === 'all' ? 'default' : 'outline'}
            onClick={() => setSelectedType('all')}
            size="sm"
          >
            Todas ({images.length})
          </Button>
          <Button
            variant={selectedType === 'platform' ? 'default' : 'outline'}
            onClick={() => setSelectedType('platform')}
            size="sm"
          >
            Generadas ({images.filter(img => img.type === 'platform').length})
          </Button>
          <Button
            variant={selectedType === 'uploaded' ? 'default' : 'outline'}
            onClick={() => setSelectedType('uploaded')}
            size="sm"
          >
            Subidas ({images.filter(img => img.type === 'uploaded').length})
          </Button>
        </div>
      </div>

      {/* Image Gallery */}
      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-4" />
          <p className="text-gray-600">Cargando imágenes...</p>
        </div>
      ) : filteredImages.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent className="pt-6">
            <Images className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'No se encontraron imágenes' : 'No hay imágenes aún'}
            </h3>
            <p className="text-gray-600">
              {searchTerm 
                ? 'Intenta con otro término de búsqueda'
                : 'Las imágenes generadas y subidas aparecerán aquí'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredImages.map((image) => (
            <Card key={`${image.type}-${image.id}`} className="group hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                <div className="aspect-square bg-gray-100 rounded-t-lg overflow-hidden">
                  <img
                    src={image.image_url}
                    alt={image.content_topic || 'Media image'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                </div>
                
                <div className="p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge 
                      variant={image.type === 'platform' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {image.type === 'platform' ? 'Generada' : 'Subida'}
                    </Badge>
                    {image.platform && (
                      <Badge variant="outline" className="text-xs capitalize">
                        {image.platform}
                      </Badge>
                    )}
                  </div>
                  
                  {image.content_topic && (
                    <p className="text-xs text-gray-600 line-clamp-2">
                      {image.content_topic}
                    </p>
                  )}
                  
                  <div className="flex items-center text-xs text-gray-500">
                    <Calendar className="w-3 h-3 mr-1" />
                    {new Date(image.created_at).toLocaleDateString()}
                  </div>
                  
                  <div className="flex justify-center pt-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadImage(image.image_url)}
                      className="text-xs w-full"
                    >
                      <Download className="w-3 h-3 mr-1" />
                      Descargar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Media;
