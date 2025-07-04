
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Calendar, Loader2, Images } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface MediaImage {
  id: string;
  image_url: string;
  created_at: string;
  type: 'platform' | 'uploaded';
  platform?: string;
  content_topic?: string;
}

interface MediaImageSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectImage: (imageUrl: string) => void;
}

const MediaImageSelector = ({ isOpen, onClose, onSelectImage }: MediaImageSelectorProps) => {
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
    if (isOpen) {
      loadImages();
    }
  }, [isOpen, user]);

  const filteredImages = images.filter(image => {
    const matchesSearch = !searchTerm || 
      image.content_topic?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      image.platform?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = selectedType === 'all' || image.type === selectedType;
    
    return matchesSearch && matchesType;
  });

  const handleSelectImage = (imageUrl: string) => {
    onSelectImage(imageUrl);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Seleccionar imagen desde Media</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
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

          {/* Image Grid */}
          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-4" />
              <p className="text-gray-600">Cargando imágenes...</p>
            </div>
          ) : filteredImages.length === 0 ? (
            <div className="text-center py-8">
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
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {filteredImages.map((image) => (
                <div 
                  key={`${image.type}-${image.id}`} 
                  className="group cursor-pointer hover:shadow-lg transition-shadow border rounded-lg overflow-hidden"
                  onClick={() => handleSelectImage(image.image_url)}
                >
                  <div className="aspect-square bg-gray-100 overflow-hidden">
                    <img
                      src={image.image_url}
                      alt={image.content_topic || 'Media image'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  </div>
                  
                  <div className="p-2 space-y-1">
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
                      <p className="text-xs text-gray-600 line-clamp-1">
                        {image.content_topic}
                      </p>
                    )}
                    
                    <div className="flex items-center text-xs text-gray-500">
                      <Calendar className="w-3 h-3 mr-1" />
                      {new Date(image.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MediaImageSelector;
