import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Badge } from '@/components/ui/badge';
import { Calendar, Download, Save, Send } from 'lucide-react';
import { contentService } from '@/services/contentService';
import { toast } from '@/hooks/use-toast';
import ImagePreviewModal from './ImagePreviewModal';
import { Switch } from '@/components/ui/switch';

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
  const [selectedImageUrl, setSelectedImageUrl] = useState<string>('');
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [publishNow, setPublishNow] = useState(false);
  const [previewSlideIndex, setPreviewSlideIndex] = useState<number>(0);

  useEffect(() => {
    setEditedContent(content);
    setDownloadedSlides(slideImages || []);
  }, [content, slideImages]);

  const handleSave = () => {
    onSave(editedContent);
    onClose();
  };

  const handleImageClick = (imageUrl: string, index: number = 0, imagesForPreview?: string[]) => {
    setSelectedImageUrl(imageUrl);
    setPreviewSlideIndex(index);
    // Si es parte de un slider, pasar images y el index inicial
    if (imagesForPreview && imagesForPreview.length > 1) {
      setShowImagePreview(true);
    } else {
      setShowImagePreview(true);
    }
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

  const handlePublishNowToggle = (checked: boolean) => {
    setPublishNow(checked);
    if (checked) {
      // Set publishDate as now
      const now = new Date().toISOString().slice(0, 16);
      setEditedContent({ ...editedContent, publishDate: now });
    }
  };

  const isSlidePost = contentType === 'Slide Post';

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-[1100px] max-h-[96vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <span>Editar contenido - {platform}</span>
              <Badge variant="outline">{contentType}</Badge>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-8">
            {/* SECCIÓN 1: CONTENIDO DE TEXTO */}
            <div className="space-y-4 p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Contenido del Post</h3>
              
              {/* WordPress specific fields */}
              {platform === 'wordpress' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Título</Label>
                    <Input
                      id="title"
                      value={editedContent.title || ''}
                      onChange={(e) => setEditedContent({ ...editedContent, title: e.target.value })}
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
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="description">Descripción</Label>
                    <Input
                      id="description"
                      value={editedContent.description || ''}
                      onChange={(e) => setEditedContent({ ...editedContent, description: e.target.value })}
                    />
                  </div>
                </div>
              )}
              
              {/* Texto */}
              <div className="space-y-2">
                <Label htmlFor="text" className="font-bold">Texto del contenido</Label>
                <Textarea
                  id="text"
                  value={editedContent.text}
                  onChange={(e) => setEditedContent({ ...editedContent, text: e.target.value })}
                  rows={16}
                  className="resize-none text-base min-h-[200px]"
                />
              </div>
            </div>

            {/* SECCIÓN 2: SLIDES E IMÁGENES */}
            <div className="space-y-4 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Imágenes y Slides</h3>
              
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

              {/* Slides carousel con navegación y visor de slides */}
              {isSlidePost && downloadedSlides.length > 0 && (
                <div className="space-y-2">
                  <Label>Slides descargadas ({downloadedSlides.length} imágenes)</Label>
                  <div className="relative">
                    <Carousel className="w-full max-w-3xl mx-auto" showNavigation={true}>
                      <CarouselContent className="-ml-2 md:-ml-4">
                        {downloadedSlides.map((imageUrl, index) => (
                          <CarouselItem key={index} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
                            <div className="p-1">
                              <div 
                                className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-md overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => handleImageClick(imageUrl, index, downloadedSlides)}
                              >
                                <img 
                                  src={imageUrl} 
                                  alt={`Slide ${index + 1}`}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                              </div>
                            </div>
                          </CarouselItem>
                        ))}
                      </CarouselContent>
                      <CarouselPrevious className="left-2" />
                      <CarouselNext className="right-2" />
                    </Carousel>
                  </div>
                </div>
              )}

              {/* Main Image - Para Simple Posts o cuando no hay slides */}
              {(!isSlidePost || downloadedSlides.length === 0) && editedContent.images[0] && editedContent.images[0] !== "/placeholder.svg" && (
                <div className="space-y-2">
                  <Label>Imagen principal</Label>
                  <div 
                    className="w-full h-64 bg-gray-200 dark:bg-gray-700 rounded-md overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => handleImageClick(editedContent.images[0])}
                  >
                    <img 
                      src={editedContent.images[0]} 
                      alt="Content preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* SECCIÓN 3: PUBLICACIÓN */}
            <div className="p-6 bg-green-50 dark:bg-green-900/20 rounded-lg space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Configuración de Publicación</h3>
              <div className="flex items-center space-x-3 mb-4">
                <Switch
                  checked={publishNow}
                  onCheckedChange={handlePublishNowToggle}
                  id="publish-now-toggle"
                />
                <Label htmlFor="publish-now-toggle" className="text-base font-medium select-none">
                  Publicar ahora
                </Label>
              </div>
              {!publishNow && (
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <Label htmlFor="publishDate">Fecha de publicación</Label>
                    <Input
                      id="publishDate"
                      type="datetime-local"
                      value={editedContent.publishDate || ''}
                      onChange={(e) => setEditedContent({ ...editedContent, publishDate: e.target.value })}
                      className="max-w-xs"
                    />
                  </div>
                </div>
              )}
              {publishNow && (
                <div className="flex items-end">
                  <Button 
                    onClick={() => handlePublishNowToggle(true)}
                    className="w-full bg-green-600 hover:bg-green-700 text-white flex items-center space-x-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>Publicar ahora</span>
                  </Button>
                </div>
              )}
            </div>
            <div className="flex justify-end space-x-2 pt-4 border-t">
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

      {/* Image Preview Modal (sólo se incluyen props de slides si hay varias imágenes) */}
      <ImagePreviewModal
        isOpen={showImagePreview}
        onClose={() => setShowImagePreview(false)}
        imageUrl={selectedImageUrl}
        alt="Vista previa de imagen"
        images={downloadedSlides.length > 1 ? downloadedSlides : undefined}
        initialIndex={previewSlideIndex}
      />
    </>
  );
};

export default ContentEditModal;
