
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
    content: string;
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
    selectedPlatforms: [] as string[],
    platformTypes: {} as Record<string, string>
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePlatformChange = (platform: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        selectedPlatforms: [...prev.selectedPlatforms, platform],
        platformTypes: {
          ...prev.platformTypes,
          [platform]: platform === 'wordpress' ? 'article' : 'simple'
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        selectedPlatforms: prev.selectedPlatforms.filter(p => p !== platform),
        platformTypes: Object.fromEntries(
          Object.entries(prev.platformTypes).filter(([key]) => key !== platform)
        )
      }));
    }
  };

  const handlePlatformTypeChange = (platform: string, type: string) => {
    setFormData(prev => ({
      ...prev,
      platformTypes: {
        ...prev.platformTypes,
        [platform]: type
      }
    }));
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
          selectedPlatforms: formData.selectedPlatforms,
          platformTypes: formData.platformTypes,
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
            contentType: formData.platformTypes[platform],
            // Add WordPress specific fields
            ...(platform === 'wordpress' && platformData && 'title' in platformData && {
              title: platformData.title || '',
              description: platformData.description || '',
              slug: platformData.slug || '',
              content: platformData.content || ''
            })
          };
        }
      });

      const newEntry = {
        topic: formData.topic,
        description: formData.description,
        type: 'Mixed Content', // Since we now have different types per platform
        selectedPlatforms: formData.selectedPlatforms,
        generatedContent: transformedContent,
        platformTypes: formData.platformTypes
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

  const getContentTypeOptions = (platform: string) => {
    if (platform === 'wordpress') {
      return [
        { value: 'article', label: 'Artículo', description: 'Artículo completo para blog', icon: FileText }
      ];
    }
    
    const options = [
      { value: 'simple', label: 'Simple Post', description: 'Post básico con texto', icon: FileText },
      { value: 'slide', label: 'Slide Post', description: 'Presentación con slides', icon: Presentation }
    ];

    if (platform === 'twitter') {
      options.push({ value: 'thread', label: 'Thread', description: 'Hilo de tweets', icon: FileText });
    }

    return options;
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
          <p className="text-gray-600">Selecciona las redes sociales y tipos de contenido para generar contenido automáticamente</p>
        </div>
      </div>

      {/* Form */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
        <CardHeader className="pb-6">
          <CardTitle className="text-xl">Detalles del Contenido</CardTitle>
          <CardDescription>
            Configura el tema y selecciona las plataformas con sus tipos de contenido específicos.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
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

            {/* Selección de plataformas y tipos */}
            <div className="space-y-4">
              <Label className="text-sm font-medium text-gray-700">
                Plataformas y tipos de contenido *
              </Label>
              
              <div className="space-y-4">
                {/* Instagram */}
                <div className="border border-gray-200 rounded-lg p-4 bg-gradient-to-r from-pink-50 to-rose-50">
                  <div className="flex items-center space-x-3 mb-3">
                    <Checkbox
                      id="instagram"
                      checked={formData.selectedPlatforms.includes('instagram')}
                      onCheckedChange={(checked) => handlePlatformChange('instagram', checked as boolean)}
                      disabled={isSubmitting}
                    />
                    <Label htmlFor="instagram" className="cursor-pointer font-medium">Instagram</Label>
                  </div>
                  
                  {formData.selectedPlatforms.includes('instagram') && (
                    <RadioGroup
                      value={formData.platformTypes.instagram || 'simple'}
                      onValueChange={(value) => handlePlatformTypeChange('instagram', value)}
                      className="ml-6"
                    >
                      {getContentTypeOptions('instagram').map((option) => (
                        <div key={option.value} className="flex items-center space-x-2">
                          <RadioGroupItem value={option.value} id={`instagram-${option.value}`} />
                          <Label htmlFor={`instagram-${option.value}`} className="text-sm cursor-pointer">
                            <span className="font-medium">{option.label}</span>
                            <span className="text-gray-600 ml-1">- {option.description}</span>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  )}
                </div>

                {/* LinkedIn */}
                <div className="border border-gray-200 rounded-lg p-4 bg-gradient-to-r from-blue-50 to-cyan-50">
                  <div className="flex items-center space-x-3 mb-3">
                    <Checkbox
                      id="linkedin"
                      checked={formData.selectedPlatforms.includes('linkedin')}
                      onCheckedChange={(checked) => handlePlatformChange('linkedin', checked as boolean)}
                      disabled={isSubmitting}
                    />
                    <Label htmlFor="linkedin" className="cursor-pointer font-medium">LinkedIn</Label>
                  </div>
                  
                  {formData.selectedPlatforms.includes('linkedin') && (
                    <RadioGroup
                      value={formData.platformTypes.linkedin || 'simple'}
                      onValueChange={(value) => handlePlatformTypeChange('linkedin', value)}
                      className="ml-6"
                    >
                      {getContentTypeOptions('linkedin').map((option) => (
                        <div key={option.value} className="flex items-center space-x-2">
                          <RadioGroupItem value={option.value} id={`linkedin-${option.value}`} />
                          <Label htmlFor={`linkedin-${option.value}`} className="text-sm cursor-pointer">
                            <span className="font-medium">{option.label}</span>
                            <span className="text-gray-600 ml-1">- {option.description}</span>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  )}
                </div>

                {/* WordPress */}
                <div className="border border-gray-200 rounded-lg p-4 bg-gradient-to-r from-gray-50 to-slate-50">
                  <div className="flex items-center space-x-3 mb-3">
                    <Checkbox
                      id="wordpress"
                      checked={formData.selectedPlatforms.includes('wordpress')}
                      onCheckedChange={(checked) => handlePlatformChange('wordpress', checked as boolean)}
                      disabled={isSubmitting}
                    />
                    <Label htmlFor="wordpress" className="cursor-pointer font-medium">WordPress</Label>
                  </div>
                  
                  {formData.selectedPlatforms.includes('wordpress') && (
                    <RadioGroup
                      value={formData.platformTypes.wordpress || 'article'}
                      onValueChange={(value) => handlePlatformTypeChange('wordpress', value)}
                      className="ml-6"
                    >
                      {getContentTypeOptions('wordpress').map((option) => (
                        <div key={option.value} className="flex items-center space-x-2">
                          <RadioGroupItem value={option.value} id={`wordpress-${option.value}`} />
                          <Label htmlFor={`wordpress-${option.value}`} className="text-sm cursor-pointer">
                            <span className="font-medium">{option.label}</span>
                            <span className="text-gray-600 ml-1">- {option.description}</span>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  )}
                </div>

                {/* Twitter */}
                <div className="border border-gray-200 rounded-lg p-4 bg-gradient-to-r from-gray-900 to-gray-700 text-white">
                  <div className="flex items-center space-x-3 mb-3">
                    <Checkbox
                      id="twitter"
                      checked={formData.selectedPlatforms.includes('twitter')}
                      onCheckedChange={(checked) => handlePlatformChange('twitter', checked as boolean)}
                      disabled={isSubmitting}
                      className="border-white data-[state=checked]:bg-white data-[state=checked]:text-black"
                    />
                    <Label htmlFor="twitter" className="cursor-pointer font-medium text-white">X (Twitter)</Label>
                  </div>
                  
                  {formData.selectedPlatforms.includes('twitter') && (
                    <RadioGroup
                      value={formData.platformTypes.twitter || 'simple'}
                      onValueChange={(value) => handlePlatformTypeChange('twitter', value)}
                      className="ml-6"
                    >
                      {getContentTypeOptions('twitter').map((option) => (
                        <div key={option.value} className="flex items-center space-x-2">
                          <RadioGroupItem value={option.value} id={`twitter-${option.value}`} className="border-white text-white" />
                          <Label htmlFor={`twitter-${option.value}`} className="text-sm cursor-pointer text-white">
                            <span className="font-medium">{option.label}</span>
                            <span className="text-gray-300 ml-1">- {option.description}</span>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                🤖 <strong>Generación automática:</strong> El sistema generará contenido específico 
                para each plataforma según el tipo seleccionado. Las imágenes se pueden generar después por separado.
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
