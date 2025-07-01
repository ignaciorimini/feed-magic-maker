
import { useState } from 'react';
import { FileText, Presentation, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { profileService } from '@/services/profileService';

interface ContentFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

interface WebhookResponse {
  instagram?: {
    text: string;
    slidesURL?: string | null;
  };
  linkedin?: {
    text: string;
    slidesURL?: string | null;
  };
  wordpress?: {
    title: string;
    description: string;
    slug: string;
    text: string;
    slidesURL?: string | null;
  };
  twitter?: {
    text: string;
    slidesURL?: string | null;
  };
}

const ContentForm = ({ onSubmit, onCancel }: ContentFormProps) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    topic: '',
    description: '',
    contentType: 'simple',
    selectedPlatforms: [] as string[]
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePlatformChange = (platform: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        selectedPlatforms: [...prev.selectedPlatforms, platform]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        selectedPlatforms: prev.selectedPlatforms.filter(p => p !== platform)
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.topic || !formData.description || formData.selectedPlatforms.length === 0) {
      toast({
        title: "Campos requeridos",
        description: "Por favor completa todos los campos y selecciona al menos una red social",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Error de autenticación",
        description: "Debes estar autenticado para crear contenido",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      console.log("Obteniendo webhook del perfil del usuario...");
      
      const { data: profile, error: profileError } = await profileService.getUserProfile(user.id);
      
      if (profileError || !profile?.webhook_url) {
        toast({
          title: "Webhook no configurado",
          description: "Debes configurar tu webhook URL en el perfil antes de generar contenido",
          variant: "destructive",
        });
        return;
      }

      console.log("Enviando datos al webhook personalizado:", profile.webhook_url, formData);
      
      const response = await fetch(profile.webhook_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'generate_content',
          topic: formData.topic,
          description: formData.description,
          contentType: formData.contentType,
          selectedPlatforms: formData.selectedPlatforms,
          userEmail: user.email
        }),
      });

      if (!response.ok) {
        throw new Error(`Error del servidor: ${response.status}`);
      }

      const generatedContent: WebhookResponse = await response.json();
      console.log("Contenido generado recibido:", generatedContent);

      // Transform the webhook response to match our expected format
      const transformedContent: any = {};
      
      formData.selectedPlatforms.forEach((platform: string) => {
        const platformKey = platform as keyof WebhookResponse;
        const platformData = generatedContent[platformKey];
        
        if (platformData) {
          transformedContent[platform] = {
            text: platformData.text || '',
            slidesURL: platformData.slidesURL || null,
            // Add WordPress specific fields
            ...(platform === 'wordpress' && platformData && 'title' in platformData && {
              title: platformData.title || '',
              description: platformData.description || '',
              slug: platformData.slug || ''
            })
          };
        }
      });

      const newEntry = {
        topic: formData.topic,
        description: formData.description,
        type: formData.contentType === 'simple' ? 'Simple Post' : 'Slide Post',
        selectedPlatforms: formData.selectedPlatforms,
        generatedContent: transformedContent
      };

      onSubmit(newEntry);
      
      toast({
        title: "¡Contenido generado exitosamente!",
        description: "El contenido ha sido creado y está listo para publicar",
      });
      
    } catch (error) {
      console.error("Error al generar contenido:", error);
      toast({
        title: "Error al generar contenido",
        description: "Hubo un problema al conectar con tu webhook personalizado. Verifica la URL y que el servicio esté funcionando.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="p-2"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Crear Nuevo Contenido</h2>
          <p className="text-gray-600">Selecciona las redes sociales y completa los datos para generar contenido automáticamente</p>
        </div>
      </div>

      {/* Form */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
        <CardHeader className="pb-6">
          <CardTitle className="text-xl">Detalles del Contenido</CardTitle>
          <CardDescription>
            Selecciona las redes sociales y proporciona la información básica para generar contenido automáticamente.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Selección de redes sociales */}
            <div className="space-y-4">
              <Label className="text-sm font-medium text-gray-700">
                Redes sociales *
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg bg-gradient-to-r from-pink-50 to-rose-50">
                  <Checkbox
                    id="instagram"
                    checked={formData.selectedPlatforms.includes('instagram')}
                    onCheckedChange={(checked) => handlePlatformChange('instagram', checked as boolean)}
                    disabled={isSubmitting}
                  />
                  <Label htmlFor="instagram" className="cursor-pointer font-medium">Instagram</Label>
                </div>
                
                <div className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg bg-gradient-to-r from-blue-50 to-cyan-50">
                  <Checkbox
                    id="linkedin"
                    checked={formData.selectedPlatforms.includes('linkedin')}
                    onCheckedChange={(checked) => handlePlatformChange('linkedin', checked as boolean)}
                    disabled={isSubmitting}
                  />
                  <Label htmlFor="linkedin" className="cursor-pointer font-medium">LinkedIn</Label>
                </div>
                
                <div className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg bg-gradient-to-r from-gray-50 to-slate-50">
                  <Checkbox
                    id="wordpress"
                    checked={formData.selectedPlatforms.includes('wordpress')}
                    onCheckedChange={(checked) => handlePlatformChange('wordpress', checked as boolean)}
                    disabled={isSubmitting}
                  />
                  <Label htmlFor="wordpress" className="cursor-pointer font-medium">WordPress</Label>
                </div>

                <div className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg bg-gradient-to-r from-gray-900 to-gray-700 text-white">
                  <Checkbox
                    id="twitter"
                    checked={formData.selectedPlatforms.includes('twitter')}
                    onCheckedChange={(checked) => handlePlatformChange('twitter', checked as boolean)}
                    disabled={isSubmitting}
                    className="border-white data-[state=checked]:bg-white data-[state=checked]:text-black"
                  />
                  <Label htmlFor="twitter" className="cursor-pointer font-medium text-white">X (Twitter)</Label>
                </div>
              </div>
            </div>

            {/* Tema del artículo */}
            <div className="space-y-2">
              <Label htmlFor="topic" className="text-sm font-medium text-gray-700">
                Tema del artículo *
              </Label>
              <Input
                id="topic"
                placeholder="ej: Marketing Digital para PyMEs"
                value={formData.topic}
                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                className="bg-white/50"
                disabled={isSubmitting}
              />
            </div>

            {/* Descripción */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                Descripción breve *
              </Label>
              <Textarea
                id="description"
                placeholder="Describe brevemente el enfoque o los puntos clave que quieres abordar..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-white/50 min-h-[100px]"
                disabled={isSubmitting}
              />
            </div>

            {/* Tipo de contenido - Para todas las plataformas excepto WordPress */}
            {(formData.selectedPlatforms.includes('instagram') || 
              formData.selectedPlatforms.includes('linkedin') || 
              formData.selectedPlatforms.includes('twitter')) && (
              <div className="space-y-4">
                <Label className="text-sm font-medium text-gray-700">
                  Tipo de contenido *
                </Label>
                <RadioGroup
                  value={formData.contentType}
                  onValueChange={(value) => setFormData({ ...formData, contentType: value })}
                  className="space-y-3"
                  disabled={isSubmitting}
                >
                  <div className="flex items-start space-x-3 p-4 border border-gray-200 rounded-lg bg-white/30 hover:bg-white/50 transition-colors">
                    <RadioGroupItem value="simple" id="simple" className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor="simple" className="flex items-center space-x-2 cursor-pointer">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <span className="font-medium">Simple Post</span>
                      </Label>
                      <p className="text-sm text-gray-600 mt-1">
                        Genera artículo completo (la imagen se generará por separado)
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3 p-4 border border-gray-200 rounded-lg bg-white/30 hover:bg-white/50 transition-colors">
                    <RadioGroupItem value="slide" id="slide" className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor="slide" className="flex items-center space-x-2 cursor-pointer">
                        <Presentation className="w-4 h-4 text-indigo-600" />
                        <span className="font-medium">Slide Post</span>
                      </Label>
                      <p className="text-sm text-gray-600 mt-1">
                        Duplica plantilla de Google Slides y reemplaza textos
                      </p>
                    </div>
                  </div>

                  {formData.selectedPlatforms.includes('twitter') && (
                    <div className="flex items-start space-x-3 p-4 border border-gray-200 rounded-lg bg-white/30 hover:bg-white/50 transition-colors">
                      <RadioGroupItem value="thread" id="thread" className="mt-1" />
                      <div className="flex-1">
                        <Label htmlFor="thread" className="flex items-center space-x-2 cursor-pointer">
                          <FileText className="w-4 h-4 text-gray-800" />
                          <span className="font-medium">Thread</span>
                        </Label>
                        <p className="text-sm text-gray-600 mt-1">
                          Genera un hilo de tweets sobre el tema
                        </p>
                      </div>
                    </div>
                  )}
                </RadioGroup>
              </div>
            )}

            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                🤖 <strong>Generación automática:</strong> Una vez enviado, el sistema generará contenido 
                específico para cada red social seleccionada. Las imágenes se pueden generar después por separado.
              </p>
            </div>

            {/* Buttons */}
            <div className="flex space-x-4 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="flex-1"
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
              >
                {isSubmitting ? "Generando contenido..." : "Generar Contenido"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ContentForm;
