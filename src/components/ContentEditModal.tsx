
import { useState } from 'react';
import { X, Save, Upload, ImageIcon, Calendar, Send, ChevronLeft, ChevronRight, ExternalLink, Download, Presentation } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import ImagePreviewModal from './ImagePreviewModal';
import { contentService } from '@/services/contentService';

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
  slideImages?: string[]; // Add slideImages prop
}

const ContentEditModal = ({ isOpen, onClose, platform, content, contentType, onSave, entryId, topic, slideImages }: ContentEditModalProps) => {
  const [editedText, setEditedText] = useState(content.text);
  const [publishDate, setPublishDate] = useState(content.publishDate || '');
  const [publishNow, setPublishNow] = useState(!content.publishDate);
  const [customImage, setCustomImage] = useState<File | null>(null);
  const [customImageUrl, setCustomImageUrl] = useState<string>('');
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState('');
  const [isDownloadingSlides, setIsDownloadingSlides] = useState(false);
  const [downloadedSlides, setDownloadedSlides] = useState<string[]>(slideImages || []);
  const [isPublishing, setIsPublishing] = useState(false);
  
  // WordPress specific fields
  const [wpTitle, setWpTitle] = useState(content.title || '');
  const [wpDescription, setWpDescription] = useState(content.description || '');
  const [wpSlug, setWpSlug] = useState(content.slug || '');

  const getPlatformConfig = (platform: string) => {
    switch (platform) {
      case 'instagram':
        return { name: 'Instagram', color: 'from-purple-500 to-pink-500' };
      case 'linkedin':
        return { name: 'LinkedIn', color: 'from-blue-600 to-blue-700' };
      case 'wordpress':
        return { name: 'WordPress', color: 'from-gray-600 to-gray-700' };
      default:
        return { name: platform, color: 'from-gray-500 to-gray-600' };
    }
  };

  const config = getPlatformConfig(platform);
  const isSlidePost = contentType === 'Slide Post';
  const showSlideCarousel = isSlidePost && (platform === 'instagram' || platform === 'linkedin');
  const isWordPress = platform === 'wordpress';

  // Verificar si es una imagen real o placeholder
  const isRealImage = (imageUrl: string) => {
    return imageUrl && !imageUrl.includes('/placeholder.svg') && !imageUrl.includes('placeholder');
  };

  const handleImageClick = (imageUrl: string) => {
    if (isRealImage(imageUrl)) {
      setPreviewImageUrl(imageUrl);
      setShowImagePreview(true);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setCustomImage(file);
      const url = URL.createObjectURL(file);
      setCustomImageUrl(url);
    }
  };

  const handleEditGoogleSlides = () => {
    if (content.slidesURL) {
      window.open(content.slidesURL, '_blank');
      toast({
        title: "Abriendo Google Slides",
        description: "La presentación se ha abierto en una nueva pestaña para editar.",
      });
    } else {
      toast({
        title: "URL no disponible",
        description: "No se encontró la URL de Google Slides para este contenido.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadSlides = async () => {
    if (!content.slidesURL) {
      toast({
        title: "URL no disponible",
        description: "No se encontró la URL de Google Slides para descargar.",
        variant: "destructive",
      });
      return;
    }

    setIsDownloadingSlides(true);
    try {
      toast({
        title: "Descargando slides",
        description: "Procesando las slides, esto puede tomar unos momentos...",
      });

      // Pass the topic (content name) as the second parameter
      const { data, error } = await contentService.downloadSlidesWithUserWebhook(content.slidesURL, topic || 'Contenido sin nombre');
      
      if (error) {
        throw error;
      }

      if (data && data.slideImages && Array.isArray(data.slideImages)) {
        setDownloadedSlides(data.slideImages);
        
        toast({
          title: "Slides descargadas exitosamente",
          description: `Se descargaron ${data.slideImages.length} slides como imágenes.`,
        });
      } else {
        throw new Error('No se recibieron URLs de imágenes válidas');
      }
      
    } catch (error) {
      console.error("Error al descargar slides:", error);
      toast({
        title: "Error al descargar slides",
        description: "Hubo un problema al procesar las slides. Inténtalo nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsDownloadingSlides(false);
    }
  };

  const handlePublishNow = async () => {
    setIsPublishing(true);
    try {
      const { data, error } = await contentService.publishContent(entryId, platform);
      
      if (error) {
        throw error;
      }

      toast({
        title: "Publicando contenido",
        description: `El contenido se está publicando en ${config.name}.`,
      });
      
    } catch (error) {
      console.error("Error al publicar:", error);
      toast({
        title: "Error al publicar",
        description: "Hubo un problema al publicar el contenido.",
        variant: "destructive",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const handlePublishNowToggle = (checked: boolean) => {
    setPublishNow(checked);
    if (checked) {
      setPublishDate('');
    } else {
      const now = new Date();
      now.setMinutes(now.getMinutes() + 30); // Default to 30 minutes from now
      setPublishDate(now.toISOString().slice(0, 16));
    }
  };

  const handlePublishNowClick = () => {
    const now = new Date().toISOString().slice(0, 16);
    setPublishDate(now);
    setPublishNow(true);
  };

  const nextSlide = () => {
    const imagesToShow = downloadedSlides.length > 0 ? downloadedSlides : content.images;
    setCurrentSlideIndex((prev) => (prev + 1) % imagesToShow.length);
  };

  const prevSlide = () => {
    const imagesToShow = downloadedSlides.length > 0 ? downloadedSlides : content.images;
    setCurrentSlideIndex((prev) => (prev - 1 + imagesToShow.length) % imagesToShow.length);
  };

  const handleSave = () => {
    // Use downloaded slides if available, otherwise use custom image or original images
    let imagesToSave = content.images;
    
    if (downloadedSlides.length > 0) {
      imagesToSave = downloadedSlides;
    } else if (customImageUrl) {
      imagesToSave = [customImageUrl];
    }
    
    const updatedContent = {
      ...content,
      text: editedText,
      publishDate: publishNow ? '' : publishDate,
      images: imagesToSave,
      ...(isWordPress && {
        title: wpTitle,
        description: wpDescription,
        slug: wpSlug
      })
    };
    
    onSave(updatedContent);
    toast({
      title: "Contenido actualizado",
      description: `El contenido para ${config.name} ha sido guardado exitosamente.`,
    });
    onClose();
  };

  const handleCancel = () => {
    setEditedText(content.text);
    setPublishDate(content.publishDate || '');
    setPublishNow(!content.publishDate);
    setCustomImage(null);
    setCustomImageUrl('');
    setCurrentSlideIndex(0);
    setDownloadedSlides(slideImages || []);
    setWpTitle(content.title || '');
    setWpDescription(content.description || '');
    setWpSlug(content.slug || '');
    onClose();
  };

  // Determinar qué imágenes mostrar
  const imagesToShow = downloadedSlides.length > 0 ? downloadedSlides : content.images;
  const currentAIImage = imagesToShow && imagesToShow.length > 0 ? imagesToShow[currentSlideIndex] : null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <div className={`w-6 h-6 bg-gradient-to-r ${config.color} rounded flex items-center justify-center`}>
                <span className="text-white text-xs font-bold">{config.name[0]}</span>
              </div>
              <span>Editar contenido para {config.name}</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Google Slides Section for Slide Posts */}
            {isSlidePost && content.slidesURL && (platform === 'instagram' || platform === 'linkedin') && (
              <div className="space-y-4 border-b pb-4">
                <Label className="text-base font-medium">Presentación de Google Slides</Label>
                <div className="bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 p-4 rounded-lg border border-orange-200 dark:border-orange-700">
                  <div className="flex items-start space-x-3">
                    <Presentation className="w-6 h-6 text-orange-600 dark:text-orange-400 mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="font-medium text-orange-900 dark:text-orange-100 mb-2">
                        Editar presentación en Google Slides
                      </h3>
                      <p className="text-sm text-orange-700 dark:text-orange-300 mb-4">
                        Modifica tu presentación directamente en Google Slides. Cuando termines, descarga las slides para actualizar el contenido.
                      </p>
                      <div className="flex space-x-3">
                        <Button
                          onClick={handleEditGoogleSlides}
                          className="bg-orange-600 hover:bg-orange-700 text-white"
                          size="sm"
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Editar en Google Slides
                        </Button>
                        <Button
                          onClick={handleDownloadSlides}
                          variant="outline"
                          size="sm"
                          disabled={isDownloadingSlides}
                          className="border-orange-300 text-orange-700 hover:bg-orange-50 dark:border-orange-600 dark:text-orange-300 dark:hover:bg-orange-900/20"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          {isDownloadingSlides ? "Descargando..." : "Descargar Slides"}
                        </Button>
                      </div>
                      {downloadedSlides.length > 0 && (
                        <div className="mt-3 p-2 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-700">
                          <p className="text-sm text-green-700 dark:text-green-300">
                            ✅ Se descargaron {downloadedSlides.length} slides como imágenes
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* WordPress specific fields */}
            {isWordPress && (
              <div className="space-y-4 border-b pb-4">
                <Label className="text-base font-medium">Campos de WordPress</Label>
                
                <div className="space-y-2">
                  <Label htmlFor="wp-title">Título</Label>
                  <Input
                    id="wp-title"
                    value={wpTitle}
                    onChange={(e) => setWpTitle(e.target.value)}
                    placeholder="Título del artículo..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="wp-description">Descripción</Label>
                  <Textarea
                    id="wp-description"
                    value={wpDescription}
                    onChange={(e) => setWpDescription(e.target.value)}
                    className="min-h-[80px]"
                    placeholder="Descripción del artículo..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="wp-slug">Slug</Label>
                  <Input
                    id="wp-slug"
                    value={wpSlug}
                    onChange={(e) => setWpSlug(e.target.value)}
                    placeholder="slug-del-articulo"
                    className="font-mono"
                  />
                </div>
              </div>
            )}

            {/* Text Content */}
            <div className="space-y-2">
              <Label htmlFor="content-text">Contenido del texto</Label>
              <Textarea
                id="content-text"
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                className="min-h-[200px]"
                placeholder="Escribe tu contenido aquí..."
              />
              <div className="text-xs text-gray-500">
                {editedText.length} caracteres
              </div>
            </div>

            {/* Image Section */}
            <div className="space-y-4">
              <Label>Imagen{showSlideCarousel ? 's' : ''}</Label>
              
              {showSlideCarousel && imagesToShow.length > 1 ? (
                /* Slide Carousel for Instagram/LinkedIn Slide Posts */
                <div className="space-y-4">
                  <div className="relative">
                    <div className="w-full h-64 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center relative overflow-hidden">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={prevSlide}
                        className="absolute left-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 bg-black/20 hover:bg-black/40 text-white z-10"
                        disabled={imagesToShow.length <= 1}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      
                      {currentAIImage && isRealImage(currentAIImage) ? (
                        <img 
                          src={currentAIImage} 
                          alt={`Slide ${currentSlideIndex + 1}`}
                          className="w-full h-full object-cover rounded-lg cursor-pointer"
                          onClick={() => handleImageClick(currentAIImage)}
                        />
                      ) : (
                        <div className="text-center">
                          <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            Slide {currentSlideIndex + 1} de {imagesToShow.length}
                          </span>
                        </div>
                      )}
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={nextSlide}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 bg-black/20 hover:bg-black/40 text-white z-10"
                        disabled={imagesToShow.length <= 1}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div className="flex justify-center mt-2 space-x-1">
                      {imagesToShow.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentSlideIndex(index)}
                          className={`w-2 h-2 rounded-full transition-colors ${
                            index === currentSlideIndex 
                              ? 'bg-blue-600' 
                              : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* Regular Image Display */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {downloadedSlides.length > 0 ? 'Imagen descargada' : 'Imagen actual (IA)'}
                    </span>
                    <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 overflow-hidden">
                      {currentAIImage && isRealImage(currentAIImage) ? (
                        <img 
                          src={currentAIImage} 
                          alt="Generated content"
                          className="w-full h-full object-cover rounded-lg cursor-pointer"
                          onClick={() => handleImageClick(currentAIImage)}
                        />
                      ) : (
                        <div className="text-center">
                          <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {downloadedSlides.length > 0 ? 'Imagen descargada' : 'Imagen generada por IA'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Custom Image Upload */}
                  {!isSlidePost && (
                    <div className="space-y-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Imagen personalizada</span>
                      {customImageUrl ? (
                        <div className="relative">
                          <img 
                            src={customImageUrl} 
                            alt="Custom upload" 
                            className="w-full h-48 object-cover rounded-lg cursor-pointer"
                            onClick={() => handleImageClick(customImageUrl)}
                          />
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setCustomImage(null);
                              setCustomImageUrl('');
                            }}
                            className="absolute top-2 right-2"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="w-full h-48 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600">
                          <div className="text-center">
                            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                            <Label htmlFor="image-upload" className="text-sm text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700">
                              Haz clic para subir una imagen
                            </Label>
                            <Input
                              id="image-upload"
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              className="hidden"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Publishing Options */}
            <div className="space-y-4 border-t pt-4">
              <Label className="text-base font-medium">Opciones de publicación</Label>
              
              {/* Publish Now Button */}
              <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                <div className="flex items-center space-x-3">
                  <Send className="w-5 h-5 text-blue-600" />
                  <div>
                    <span className="font-medium text-sm">Publicar ahora mismo</span>
                    <p className="text-xs text-gray-600 dark:text-gray-400">El contenido se publicará inmediatamente</p>
                  </div>
                </div>
                <Button
                  onClick={handlePublishNow}
                  disabled={isPublishing}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isPublishing ? "Publicando..." : "Publicar Ahora"}
                </Button>
              </div>

              {/* Scheduled Publish Date */}
              <div className="space-y-2">
                <Label htmlFor="publish-date" className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>Programar fecha de publicación</span>
                </Label>
                <Input
                  id="publish-date"
                  type="datetime-local"
                  value={publishDate}
                  onChange={(e) => setPublishDate(e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button variant="outline" onClick={handleCancel}>
              Cancelar
            </Button>
            <Button onClick={handleSave} className={`bg-gradient-to-r ${config.color} text-white`}>
              <Save className="w-4 h-4 mr-2" />
              Guardar Cambios
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Preview Modal */}
      <ImagePreviewModal
        isOpen={showImagePreview}
        onClose={() => setShowImagePreview(false)}
        imageUrl={previewImageUrl}
        alt="Vista previa de imagen"
      />
    </>
  );
};

export default ContentEditModal;
