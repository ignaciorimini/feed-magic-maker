
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
  instagramContent: string;
  linkedinContent: string;
  wordpressTitle: string;
  wordpressDescription: string;
  wordpressSlug: string;
  wordpressContent: string;
  twitterContent: string;
  twitterThreadPosts: string[];
  imageURL: string;
  slidesURL: string;
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

      // Crear una entrada separada para cada plataforma seleccionada
      const allEntries = [];
      
      for (const platform of formData.selectedPlatforms) {
        // Determinar el contentType específico para cada plataforma
        let platformContentType = 'simple post'; // valor por defecto
        
        if (platform === 'instagram' || platform === 'linkedin') {
          platformContentType = formData.contentType === 'simple' ? 'simple post' : 'slide post';
        } else if (platform === 'wordpress') {
          platformContentType = 'blog post';
        } else if (platform === 'twitter') {
          platformContentType = 'thread post';
        }

        console.log(`Enviando datos al webhook para ${platform}:`, profile.webhook_url, {
          platform,
          contentType: platformContentType
        });
        
        const response = await fetch(profile.webhook_url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'generate_content',
            platform: platform, // Especificar la plataforma
            topic: formData.topic,
            description: formData.description,
            contentType: platformContentType, // Tipo específico por plataforma
            userEmail: user.email
          }),
        });

        if (!response.ok) {
          throw new Error(`Error del servidor para ${platform}: ${response.status}`);
        }

        const generatedContent: WebhookResponse = await response.json();
        console.log(`Contenido generado para ${platform}:`, generatedContent);

        const newEntry = {
          topic: formData.topic,
          description: formData.description,
          type: formData.contentType === 'simple' ? 'Simple Post' : 'Slide Post',
          selectedPlatforms: [platform], // Solo esta plataforma
          generatedContent: generatedContent,
          targetPlatform: platform
        };

        allEntries.push(newEntry);
      }

      // Enviar todas las entradas creadas
      for (const entry of allEntries) {
        onSubmit(entry);
      }
      
      toast({
        title: "¡Contenido generado exitosamente!",
        description: `Se ha creado contenido para ${formData.selectedPlatforms.length} plataforma(s)`,
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

                <div className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg bg-gradient-to-r from-gray-800 to-black">
                  <Checkbox
                    id="twitter"
                    checked={formData.selectedPlatforms.includes('twitter')}
                    onCheckedChange={(checked) => handlePlatformChange('twitter', checked as boolean)}
                    disabled={isSubmitting}
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

            {/* Tipo de contenido - Solo para Instagram y LinkedIn */}
            {(formData.selectedPlatforms.includes('instagram') || formData.selectedPlatforms.includes('linkedin')) && (
              <div className="space-y-4">
                <Label className="text-sm font-medium text-gray-700">
                  Tipo de contenido (Instagram y LinkedIn) *
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
                        Genera artículo completo + imagen con IA
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
                </RadioGroup>
              </div>
            )}

            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                🤖 <strong>Generación automática:</strong> Una vez enviado, el sistema generará contenido 
                específico para cada red social seleccionada con el tipo de contenido apropiado.
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
