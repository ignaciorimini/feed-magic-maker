import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Badge } from '@/components/ui/badge';
import { Calendar, Download, Save } from 'lucide-react';
import { contentService } from '@/services/contentService';
import { toast } from '@/hooks/use-toast';

interface ContentEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  platform: 'instagram' | 'linkedin' | 'wordpress';
  content: {
    text: string;
    images: string[];
    publishDate?: string;
    title?: string;
    description?: string;
    slug?: string;
    slidesURL?: string;
  };
  contentType: string;
  onSave: (content: any) => void;
  entryId: string;
  topic?: string;
  slideImages?: string[];
}

const ContentEditModal = ({ 
  isOpen, 
  onClose, 
  platform, 
  content, 
  contentType, 
  onSave, 
  entryId, 
  topic,
  slideImages 
}: ContentEditModalProps) => {
  const [editedContent, setEditedContent] = useState(content);
  const [downloadedSlides, setDownloadedSlides] = useState<string[]>(slideImages || []);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    setEditedContent(content);
    setDownloadedSlides(slideImages || []);
  }, [content, slideImages]);

  const handleSave = () => {
    onSave(editedContent);
    onClose();
  };

  const handleDownloadSlides = async () => {
    if (!content.slidesURL || !topic) {
      toast({
        title: "Error",
        description: "No hay URL de slides disponible para descargar.",
        variant: "destructive",
      });
      return;
    }

    setIsDownloading(true);
    try {
      const { data, error } = await contentService.downloadSlidesWithUserWebhook(content.slidesURL, topic);
      
      if (error) {
        throw error;
      }

      if (Array.isArray(data) && data.length > 0 && data[0].slideImages && Array.isArray(data[0].slideImages)) {
        const newSlideImages = data[0].slideImages;
        setDownloadedSlides(newSlideImages);
        
        // Save to database
        await contentService.saveSlideImages(entryId, newSlideImages);
        
        toast({
          title: "¡Slides descargadas exitosamente!",
          description: `Se descargaron ${newSlideImages.length} imágenes de las slides.`,
        });
        
        // Trigger a page refresh to show the updated slides everywhere
        window.location.reload();
      }
    } catch (error) {
      console.error('Error al descargar slides:', error);
      toast({
        title: "Error al descargar slides",
        description: "Hubo un problema al conectar con tu webhook para descargar las slides.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const isSlidePost = contentType === 'Slide Post';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <span>Editar contenido - {platform}</span>
            <Badge variant="outline">{contentType}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Slides carousel with navigation - only show if there are downloaded slides */}
          {isSlidePost && downloadedSlides.length > 0 && (
            <div className="space-y-2">
              <Label>Slides descargadas ({downloadedSlides.length} imágenes)</Label>
              <Carousel className="w-full" showNavigation={true}>
                <CarouselContent>
                  {downloadedSlides.map((imageUrl, index) => (
                    <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                      <div className="p-1">
                        <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-md overflow-hidden">
                          <img 
                            src={imageUrl} 
                            alt={`Slide ${index + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              console.error('Error loading slide image:', imageUrl);
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </div>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
              </Carousel>
            </div>
          )}

          {/* Download Slides Button - solo para Slide Posts que tengan slidesURL */}
          {isSlidePost && content.slidesURL && (
            <div className="flex justify-center">
              <Button
                onClick={handleDownloadSlides}
                disabled={isDownloading}
                className="flex items-center space-x-2"
                variant="outline"
              >
                <Download className="w-4 h-4" />
                <span>{isDownloading ? 'Descargando...' : 'Descargar slides'}</span>
              </Button>
            </div>
          )}

          {/* Main Image - Para Simple Posts o cuando no hay slides */}
          {(!isSlidePost || downloadedSlides.length === 0) && editedContent.images[0] && editedContent.images[0] !== "/placeholder.svg" && (
            <div className="space-y-2">
              <Label>Imagen</Label>
              <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 rounded-md overflow-hidden">
                <img 
                  src={editedContent.images[0]} 
                  alt="Content preview"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}

          {/* Text Content */}
          <div className="space-y-2">
            <Label htmlFor="text">Texto del contenido</Label>
            <Textarea
              id="text"
              value={editedContent.text}
              onChange={(e) => setEditedContent({ ...editedContent, text: e.target.value })}
              rows={6}
              className="resize-none"
            />
          </div>

          {/* WordPress specific fields */}
          {platform === 'wordpress' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  value={editedContent.title || ''}
                  onChange={(e) => setEditedContent({ ...editedContent, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Input
                  id="description"
                  value={editedContent.description || ''}
                  onChange={(e) => setEditedContent({ ...editedContent, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={editedContent.slug || ''}
                  onChange={(e) => setEditedContent({ ...editedContent, slug: e.target.value })}
                />
              </div>
            </>
          )}

          {/* Publish Date */}
          <div className="space-y-2">
            <Label htmlFor="publishDate">Fecha de publicación (opcional)</Label>
            <Input
              id="publishDate"
              type="datetime-local"
              value={editedContent.publishDate || ''}
              onChange={(e) => setEditedContent({ ...editedContent, publishDate: e.target.value })}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleSave} className="flex items-center space-x-2">
              <Save className="w-4 h-4" />
              <span>Guardar cambios</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ContentEditModal;
