import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Badge } from '@/components/ui/badge';
import { Calendar, Download, Save, Send, Loader2, Sparkles, X, Upload, Plus, AlertCircle, ExternalLink } from 'lucide-react';
import { contentService } from '@/services/contentService';
import { profileService } from '@/services/profileService';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import ImagePreviewModal from './ImagePreviewModal';
import { Switch } from '@/components/ui/switch';
import PublishButton from './PublishButton';

interface ContentEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  platform: 'instagram' | 'linkedin' | 'wordpress' | 'twitter';
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
  onSave: (content: any) => Promise<void>;
  entryId: string;
  topic?: string;
  description?: string;
  slideImages?: string[];
  imageUrl?: string;
  onUpdateImage?: (entryId: string, imageUrl: string | null) => Promise<void>;
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
  description,
  slideImages,
  imageUrl,
  onUpdateImage
}: ContentEditModalProps) => {
  const [editedContent, setEditedContent] = useState(content);
  const [downloadedSlides, setDownloadedSlides] = useState<string[]>(slideImages || []);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imagesForPreview, setImagesForPreview] = useState<string[]>([]);
  const [previewStartIndex, setPreviewStartIndex] = useState(0);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [publishNow, setPublishNow] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [showImageOptions, setShowImageOptions] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(imageUrl || null);
  const { user } = useAuth();
  
  const imageGenerationRef = useRef<{
    isGenerating: boolean;
    webhookUrl?: string;
    payload?: any;
  }>({ isGenerating: false });

  useEffect(() => {
    setEditedContent(content);
    setDownloadedSlides(slideImages || []);
    setCurrentImageUrl(imageUrl || null);
  }, [content, slideImages, imageUrl]);

  const handleSave = () => {
    onSave(editedContent);
    onClose();
  };

  const handleImageClick = (images: string[], index: number) => {
    setImagesForPreview(images);
    setPreviewStartIndex(index);
    setShowImagePreview(true);
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
        
        await contentService.saveSlideImages(entryId, newSlideImages);
        
        toast({
          title: "¡Slides descargadas exitosamente!",
          description: `Se descargaron ${newSlideImages.length} imágenes de las slides.`,
        });
        
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

  const handleGenerateImage = async () => {
    if (!user || !entryId) {
      toast({
        title: "Error",
        description: "No se puede generar la imagen en este momento.",
        variant: "destructive",
      });
      return;
    }

    if (imageGenerationRef.current.isGenerating) {
      toast({
        title: "Generación en progreso",
        description: "Ya hay una imagen siendo generada. Por favor espera.",
      });
      return;
    }

    setIsGeneratingImage(true);
    imageGenerationRef.current.isGenerating = true;

    try {
      console.log("Obteniendo webhook del perfil del usuario para generar imagen...");
      
      const { data: profile, error: profileError } = await profileService.getUserProfile(user.id);
      
      if (profileError || !profile?.webhook_url) {
        toast({
          title: "Webhook no configurado",
          description: "Debes configurar tu webhook URL en el perfil para generar imágenes.",
          variant: "destructive",
        });
        return;
      }

      const webhookPayload = {
        action: 'generate_image',
        topic: topic,
        description: description,
        platform: platform,
        userEmail: user.email
      };

      imageGenerationRef.current.webhookUrl = profile.webhook_url;
      imageGenerationRef.current.payload = webhookPayload;

      console.log("Enviando solicitud de generación de imagen al webhook:", profile.webhook_url);
      
      const response = await fetch(profile.webhook_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookPayload),
      });

      if (!response.ok) {
        throw new Error(`Error del servidor: ${response.status}`);
      }

      const result = await response.json();
      console.log("Respuesta de generación de imagen:", result);

      if (result.imageURL && onUpdateImage) {
        await onUpdateImage(entryId, result.imageURL);
        setCurrentImageUrl(result.imageURL);
        setShowImageOptions(false);
        
        toast({
          title: "¡Imagen generada exitosamente!",
          description: "La imagen ha sido generada y actualizada.",
        });
      } else {
        throw new Error("No se recibió una URL de imagen válida");
      }
    } catch (error) {
      console.error('Error al generar imagen:', error);
      toast({
        title: "Error al generar imagen",
        description: "Hubo un problema al generar la imagen. Inténtalo nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingImage(false);
      imageGenerationRef.current.isGenerating = false;
    }
  };

  const handleRemoveImage = async () => {
    if (onUpdateImage) {
      await onUpdateImage(entryId, null);
      setCurrentImageUrl(null);
      setShowImageOptions(false);
      
      toast({
        title: "Imagen eliminada",
        description: "La imagen ha sido eliminada.",
      });
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Archivo inválido",
        description: "Por favor selecciona un archivo de imagen.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Archivo muy grande",
        description: "El archivo debe ser menor a 10MB.",
        variant: "destructive",
      });
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataUrl = e.target?.result as string;
        if (onUpdateImage) {
          await onUpdateImage(entryId, dataUrl);
          setCurrentImageUrl(dataUrl);
          setShowImageOptions(false);
          
          toast({
            title: "Imagen subida exitosamente",
            description: "Tu imagen ha sido guardada.",
          });
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Error al subir imagen",
        description: "Hubo un problema al subir la imagen.",
        variant: "destructive",
      });
    }
  };

  const handlePublishAndSave = async () => {
    setIsPublishing(true);
    try {
      await onSave(editedContent);

      const { data, error } = await contentService.publishContent(entryId, platform);

      if (error) {
        throw error;
      }

      toast({
        title: "¡Publicación enviada!",
        description: `Tu contenido para ${platform} se está procesando.`,
      });
      onClose();
      setTimeout(() => window.location.reload(), 1500);

    } catch (error) {
      console.error('Error al publicar:', error);
      toast({
        title: "Error al publicar",
        description: "Hubo un problema al publicar el contenido.",
        variant: "destructive",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const isSlidePost = contentType === 'Slide Post';
  const hasImage = currentImageUrl && currentImageUrl !== "/placeholder.svg";

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <span>Editar contenido - {platform}</span>
              <Badge variant="outline">{contentType}</Badge>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Información del Contenido */}
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-sm font-medium text-amber-800 dark:text-amber-200">Tema</Label>
                <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded border border-amber-200 dark:border-amber-700">
                  <p className="text-sm text-gray-900 dark:text-gray-100 font-medium">{topic || 'Sin tema especificado'}</p>
                </div>
              </div>
              
              <div className="space-y-1">
                <Label className="text-sm font-medium text-amber-800 dark:text-amber-200">Descripción breve</Label>
                <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded border border-amber-200 dark:border-amber-700">
                  <p className="text-sm text-gray-700 dark:text-gray-300">{description || 'Sin descripción especificada'}</p>
                </div>
              </div>
            </div>

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
                  <Label htmlFor="description">Meta Descripción</Label>
                  <Input
                    id="description"
                    value={editedContent.description || ''}
                    onChange={(e) => setEditedContent({ ...editedContent, description: e.target.value })}
                  />
                </div>
              </div>
            )}

            {/* Contenido del Post */}
            <div className="space-y-2">
              <Label htmlFor="text">
                {platform === 'wordpress' ? 'Contenido (Markdown)' : 'Texto del contenido'}
              </Label>
              <Textarea
                id="text"
                value={editedContent.text}
                onChange={(e) => setEditedContent({ ...editedContent, text: e.target.value })}
                rows={8}
                className="resize-none text-base font-mono"
                placeholder={platform === 'wordpress' ? 'Escribe tu contenido usando Markdown...' : 'Escribe tu contenido...'}
              />
            </div>

            {/* Sección específica para Slide Posts */}
            {isSlidePost && (
              <div className="space-y-4">
                {content.slidesURL && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1 flex items-center">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Google Slides
                        </h4>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          Edita las slides antes de descargarlas como imágenes
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(content.slidesURL, '_blank')}
                        className="bg-blue-600 text-white hover:bg-blue-700 border-blue-600"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Abrir slides
                      </Button>
                    </div>
                    
                    <div className="flex justify-center pt-3 border-t border-blue-200 dark:border-blue-600">
                      <Button
                        onClick={handleDownloadSlides}
                        disabled={isDownloading}
                        className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Download className="w-4 h-4" />
                        <span>{isDownloading ? 'Descargando slides...' : 'Descargar slides como imágenes'}</span>
                      </Button>
                    </div>
                  </div>
                )}

                {/* Slides carousel */}
                {downloadedSlides.length > 0 && (
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Slides descargadas ({downloadedSlides.length} imágenes)</Label>
                    <div className="relative bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                      <Carousel className="w-full" showNavigation={true}>
                        <CarouselContent className="-ml-4">
                          {downloadedSlides.map((imageUrl, index) => (
                            <CarouselItem key={index} className="pl-4 md:basis-1/2 lg:basis-1/4">
                              <div className="p-1">
                                <div 
                                  className="aspect-[4/3] bg-gray-200 dark:bg-gray-700 rounded-md overflow-hidden cursor-pointer hover:opacity-80 transition-opacity border-2 border-gray-300 dark:border-gray-600"
                                  onClick={() => handleImageClick(downloadedSlides, index)}
                                >
                                  <img 
                                    src={imageUrl} 
                                    alt={`Slide ${index + 1}`}
                                    className="w-full h-full object-contain"
                                    onError={(e) => {
                                      console.error('Error loading slide image:', imageUrl);
                                      (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                  />
                                </div>
                                <p className="text-xs text-center text-gray-500 mt-2">Slide {index + 1}</p>
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

                {!content.slidesURL && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-200 dark:border-amber-700">
                    <div className="flex items-start space-x-3">
                      <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-1">
                          No hay URL de Google Slides
                        </h4>
                        <p className="text-sm text-amber-700 dark:text-amber-300">
                          Este Slide Post no tiene una URL de Google Slides asociada. Contacta al administrador para obtener ayuda.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Sección para Simple Posts - Imagen Principal */}
            {!isSlidePost && (
              <div className="space-y-2">
                <Label>Imagen principal</Label>
                
                {hasImage ? (
                  <div className="flex items-start space-x-4">
                    <div className="relative">
                      <div 
                        className="w-32 h-32 bg-gray-200 dark:bg-gray-700 rounded-md overflow-hidden cursor-pointer hover:opacity-80 transition-opacity border"
                        onClick={() => handleImageClick([currentImageUrl!], 0)}
                      >
                        <img 
                          src={currentImageUrl!} 
                          alt="Content preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleRemoveImage}
                        className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full bg-red-500 hover:bg-red-600 text-white"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                    <div className="flex-1 flex flex-col justify-center space-y-2">
                      <p className="text-sm text-gray-600">Imagen actual del artículo</p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleGenerateImage}
                          disabled={isGeneratingImage}
                        >
                          {isGeneratingImage ? (
                            <>
                              <Sparkles className="w-3 h-3 mr-1 animate-spin" />
                              Generando...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3 h-3 mr-1" />
                              Regenerar
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => document.getElementById('image-upload')?.click()}
                        >
                          <Upload className="w-3 h-3 mr-1" />
                          Cambiar
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : showImageOptions ? (
                  <div className="w-32 h-32 bg-gray-200 dark:bg-gray-700 rounded-md flex flex-col items-center justify-center space-y-2 border">
                    <span className="text-xs text-gray-500 dark:text-gray-400 text-center px-2">¿Cómo añadir imagen?</span>
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleGenerateImage}
                        disabled={isGeneratingImage}
                        className="h-7 px-2 text-xs"
                      >
                        {isGeneratingImage ? (
                          <>
                            <Sparkles className="w-3 h-3 animate-spin" />
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3 h-3" />
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById('image-upload')?.click()}
                        className="h-7 px-2 text-xs"
                      >
                        <Upload className="w-3 h-3" />
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowImageOptions(false)}
                      className="text-xs text-gray-500 hover:text-gray-700 h-6 px-1"
                    >
                      Cancelar
                    </Button>
                  </div>
                ) : (
                  <div className="w-32 h-32 bg-gray-200 dark:bg-gray-700 rounded-md flex flex-col items-center justify-center space-y-2 border">
                    <span className="text-xs text-gray-500 dark:text-gray-400 text-center">Sin imagen</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowImageOptions(true)}
                      className="h-7 px-2 text-xs"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Añadir
                    </Button>
                  </div>
                )}
                
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            )}

            {/* Configuración de Publicación */}
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center space-x-2">
                <Switch
                  id="publish-now"
                  checked={publishNow}
                  onCheckedChange={setPublishNow}
                />
                <Label htmlFor="publish-now">Publicar ahora</Label>
              </div>

              {publishNow ? (
                <div className="pt-2">
                  <Button onClick={handlePublishAndSave} disabled={isPublishing} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                    {isPublishing ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="mr-2 h-4 w-4" />
                    )}
                    Publicar Ahora y Guardar
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="publishDate">O programar para una fecha futura:</Label>
                  <Input
                    id="publishDate"
                    type="datetime-local"
                    value={editedContent.publishDate || ''}
                    onChange={(e) => setEditedContent({ ...editedContent, publishDate: e.target.value })}
                  />
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

      <ImagePreviewModal
        isOpen={showImagePreview}
        onClose={() => setShowImagePreview(false)}
        images={imagesForPreview}
        startIndex={previewStartIndex}
        alt="Vista previa de imagen"
      />
    </>
  );
};

export default ContentEditModal;
