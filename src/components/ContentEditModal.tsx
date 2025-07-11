import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Badge } from '@/components/ui/badge';
import { Calendar, Download, Save, Send, Loader2, Sparkles, X, Upload, Plus, AlertCircle, ExternalLink, Image, Clock, CalendarDays } from 'lucide-react';
import { contentService } from '@/services/contentService';
import { toast } from '@/hooks/use-toast';
import ImagePreviewModal from './ImagePreviewModal';
import MediaImageSelector from './MediaImageSelector';
import { Switch } from '@/components/ui/switch';
import PublishButton from './PublishButton';
import { useTimezone } from '@/hooks/useTimezone';

interface ContentEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  platform: 'instagram' | 'linkedin' | 'wordpress' | 'twitter';
  content: {
    text: string;
    images: string[];
    publishDate?: string;
    scheduled_at?: string;
    title?: string;
    description?: string;
    slug?: string;
    slidesURL?: string;
    slideImages?: string[];
  };
  contentType: string;
  onSave: (content: any) => Promise<void>;
  entryId: string;
  topic?: string;
  description?: string;
  slideImages?: string[];
  imageUrl?: string;
  onUpdateImage?: (entryId: string, imageUrl: string | null) => Promise<void>;
  onGenerateImage?: (entryId: string, platform: string, topic: string, description: string) => Promise<void>;
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
  onUpdateImage,
  onGenerateImage
}: ContentEditModalProps) => {
  const { formatForDisplay, formatForInput, getMinDateTime, localToUtc } = useTimezone();
  const [editedContent, setEditedContent] = useState(content);
  const [downloadedSlides, setDownloadedSlides] = useState<string[]>(slideImages || content.slideImages || []);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imagesForPreview, setImagesForPreview] = useState<string[]>([]);
  const [previewStartIndex, setPreviewStartIndex] = useState(0);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [publishNow, setPublishNow] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [showImageOptions, setShowImageOptions] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(imageUrl || null);
  const [showMediaSelector, setShowMediaSelector] = useState(false);
  const [scheduledDate, setScheduledDate] = useState<string>('');

  useEffect(() => {
    setEditedContent(content);
    setDownloadedSlides(slideImages || content.slideImages || []);
    setCurrentImageUrl(imageUrl || null);
    
    // Initialize scheduled date properly
    const existingDate = content.scheduled_at || content.publishDate;
    if (existingDate && existingDate !== '') {
      // Convert to local time and format for datetime-local input
      const date = new Date(existingDate);
      const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
      const formattedDate = localDate.toISOString().slice(0, 16);
      setScheduledDate(formattedDate);
    } else {
      setScheduledDate('');
    }
  }, [content, slideImages, imageUrl]);

  const handleScheduledDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setScheduledDate(newValue);
    console.log('Scheduled date changed to:', newValue);
  };

  const handleCancelScheduling = async () => {
    try {
      // Remove scheduling from the database
      const { error } = await contentService.updatePlatformSchedule(entryId, '');
      
      if (error) {
        console.error('Error canceling schedule:', error);
        toast({
          title: "Error al cancelar programación",
          description: "No se pudo cancelar la programación.",
          variant: "destructive",
        });
        return;
      }
      
      setScheduledDate('');
      
      toast({
        title: "Programación cancelada",
        description: "La publicación ya no está programada.",
      });
      
      onClose();
    } catch (error) {
      console.error('Error canceling schedule:', error);
      toast({
        title: "Error al cancelar programación",
        description: "Hubo un problema al cancelar la programación.",
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    try {
      console.log('=== SAVING CONTENT ===');
      console.log('Entry ID:', entryId);
      console.log('Platform:', platform);
      console.log('Edited content:', editedContent);
      console.log('Scheduled date:', scheduledDate);

      let contentToSave = { ...editedContent };

      // Handle scheduled date if provided
      if (scheduledDate && scheduledDate.trim() !== '') {
        try {
          const localDate = new Date(scheduledDate);
          const utcDate = localDate.toISOString();
          
          // Update the schedule in the database
          const { error } = await contentService.updatePlatformSchedule(entryId, utcDate);
          if (error) {
            console.error('Error updating schedule:', error);
            toast({
              title: "Error al programar",
              description: "No se pudo guardar la fecha programada.",
              variant: "destructive",
            });
            return;
          }
          
          // Add schedule info to content
          contentToSave.scheduled_at = utcDate;
          contentToSave.publishDate = utcDate;
          
          console.log('Scheduled date saved:', utcDate);
        } catch (error) {
          console.error('Error processing scheduled date:', error);
          toast({
            title: "Error al programar",
            description: "Fecha inválida. Por favor, verifica el formato.",
            variant: "destructive",
          });
          return;
        }
      }

      // Call the onSave callback with the platform and content
      console.log('Calling onSave with:', { entryId, platform, contentToSave });
      await onSave(contentToSave);
      
      if (scheduledDate && scheduledDate.trim() !== '') {
        const displayDate = formatForDisplay(new Date(scheduledDate).toISOString());
        toast({
          title: "Contenido programado",
          description: `El contenido se publicará el ${displayDate}`,
        });
      } else {
        toast({
          title: "Contenido guardado",
          description: "Los cambios han sido guardados exitosamente.",
        });
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving content:', error);
      toast({
        title: "Error al guardar",
        description: "Hubo un problema al guardar los cambios.",
        variant: "destructive",
      });
    }
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
      const { data, error } = await contentService.downloadSlidesForPlatform(entryId, content.slidesURL, topic);
      
      if (error) {
        throw error;
      }

      if (Array.isArray(data) && data.length > 0 && data[0].slideImages && Array.isArray(data[0].slideImages)) {
        const newSlideImages = data[0].slideImages;
        setDownloadedSlides(newSlideImages);
        
        toast({
          title: "¡Slides descargadas exitosamente!",
          description: `Se descargaron ${newSlideImages.length} imágenes de las slides.`,
        });
        
        onClose();
        window.location.reload();
      } else {
        toast({
          title: "Descarga completada",
          description: "Las slides han sido procesadas exitosamente.",
        });
        
        onClose();
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
    if (!onGenerateImage || !topic || !description) {
      toast({
        title: "Error",
        description: "No se puede generar la imagen en este momento.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingImage(true);
    try {
      const { data, error } = await contentService.generateImageForPlatform(
        entryId, 
        platform, 
        topic, 
        description
      );
      
      if (error) {
        console.error('Error from generateImageForPlatform:', error);
        toast({
          title: "Error al generar imagen",
          description: `No se pudo generar la imagen: ${error.message || 'Verifica tu webhook'}`,
          variant: "destructive",
        });
      } else {
        if (data && data.imageURL) {
          setCurrentImageUrl(data.imageURL);
        }
        
        toast({
          title: "¡Imagen generada exitosamente!",
          description: "La imagen ha sido generada y guardada.",
        });
        
        setShowImageOptions(false);
        
        if (onUpdateImage && data && data.imageURL) {
          await onUpdateImage(entryId, data.imageURL);
        }
      }
    } catch (error) {
      console.error('Unexpected error generating image:', error);
      toast({
        title: "Error inesperado",
        description: "Ocurrió un error al generar la imagen.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleRemoveImage = async () => {
    if (!onUpdateImage) {
      toast({
        title: "Error",
        description: "No se puede eliminar la imagen en este momento.",
        variant: "destructive",
      });
      return;
    }

    try {
      await onUpdateImage(entryId, null);
      setCurrentImageUrl(null);
      setShowImageOptions(false);
      
      toast({
        title: "Imagen eliminada",
        description: "La imagen ha sido eliminada exitosamente.",
      });
    } catch (error) {
      console.error('Error removing image:', error);
      toast({
        title: "Error al eliminar imagen",
        description: "Hubo un problema al eliminar la imagen.",
        variant: "destructive",
      });
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !onUpdateImage) return;

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
        await onUpdateImage(entryId, dataUrl);
        setCurrentImageUrl(dataUrl);
        setShowImageOptions(false);
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

  const handleSelectFromMedia = async (imageUrl: string) => {
    if (!onUpdateImage) return;
    
    try {
      await onUpdateImage(entryId, imageUrl);
      setCurrentImageUrl(imageUrl);
      setShowImageOptions(false);
      
      toast({
        title: "Imagen seleccionada",
        description: "La imagen ha sido seleccionada desde Media.",
      });
    } catch (error) {
      console.error('Error selecting image from media:', error);
      toast({
        title: "Error al seleccionar imagen",
        description: "Hubo un problema al seleccionar la imagen.",
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
  const hasScheduledDate = scheduledDate && scheduledDate.length > 0;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <span>Editar contenido - {platform}</span>
              <Badge variant="outline">{contentType}</Badge>
              {hasScheduledDate && (
                <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-800">
                  <Clock className="w-3 h-3 mr-1" />
                  Programado
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Scheduled Date - Prominent Display */}
            {hasScheduledDate && (
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-200 rounded-full">
                      <CalendarDays className="w-5 h-5 text-blue-700" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-blue-900">Publicación Programada</h3>
                      <p className="text-blue-700 font-medium">
                        {formatForDisplay(new Date(scheduledDate).toISOString())}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancelScheduling}
                    className="text-blue-700 border-blue-300 hover:bg-blue-200"
                  >
                    Cancelar programación
                  </Button>
                </div>
              </div>
            )}

            {/* Topic and Description Info */}
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

            {/* Content Text */}
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

            {/* Slide Posts Section */}
            {isSlidePost && (
              <div className="space-y-4">
                {content.slidesURL && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-600">
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
                                    className="w-full h-full object-contain max-h-32"
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

            {/* Simple Posts - Main Image Section */}
            {!isSlidePost && (
              <div className="space-y-2">
                <Label>Imagen principal</Label>
                
                {hasImage ? (
                  <div className="flex items-start space-x-4">
                    <div className="relative">
                      <div 
                        className="w-40 h-32 bg-gray-200 dark:bg-gray-700 rounded-md overflow-hidden cursor-pointer hover:opacity-80 transition-opacity border"
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
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleGenerateImage}
                          disabled={isGeneratingImage || !onGenerateImage}
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
                          Subir
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowMediaSelector(true)}
                        >
                          <Image className="w-3 h-3 mr-1" />
                          Desde Media
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : showImageOptions ? (
                  <div className="w-40 h-32 bg-gray-200 dark:bg-gray-700 rounded-md flex flex-col items-center justify-center space-y-2 border">
                    <span className="text-xs text-gray-500 dark:text-gray-400 text-center px-2">¿Cómo añadir imagen?</span>
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleGenerateImage}
                        disabled={isGeneratingImage || !onGenerateImage}
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
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowMediaSelector(true)}
                        className="h-7 px-2 text-xs"
                      >
                        <Image className="w-3 h-3" />
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
                  <div className="w-40 h-32 bg-gray-200 dark:bg-gray-700 rounded-md flex flex-col items-center justify-center space-y-2 border">
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

            {/* Publishing Configuration */}
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
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <CalendarDays className="w-5 h-5 text-blue-600" />
                    <Label htmlFor="scheduledDate" className="text-base font-medium">
                      Programar fecha de publicación:
                    </Label>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg border">
                    <Input
                      id="scheduledDate"
                      type="datetime-local"
                      value={scheduledDate}
                      onChange={handleScheduledDateChange}
                      min={getMinDateTime()}
                      className="text-base font-medium"
                    />
                    {hasScheduledDate && (
                      <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-200">
                        <p className="text-sm text-blue-700 font-medium">
                          <Clock className="w-4 h-4 inline mr-1" />
                          Se publicará el {formatForDisplay(new Date(scheduledDate).toISOString())}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2 pt-4 border-t">
              <Button onClick={onClose} variant="outline" className="flex-1">
                Cancelar
              </Button>
              <Button onClick={handleSave} className="flex-1">
                <Save className="mr-2 h-4 w-4" />
                {hasScheduledDate ? 'Programar Publicación' : 'Guardar Cambios'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Preview Modal */}
      {showImagePreview && (
        <ImagePreviewModal
          images={imagesForPreview}
          startIndex={previewStartIndex}
          isOpen={showImagePreview}
          onClose={() => setShowImagePreview(false)}
        />
      )}

      {/* Media Image Selector */}
      <MediaImageSelector
        isOpen={showMediaSelector}
        onClose={() => setShowMediaSelector(false)}
        onSelectImage={handleSelectFromMedia}
      />
    </>
  );
};

export default ContentEditModal;
