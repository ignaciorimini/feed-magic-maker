import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { X, Plus, User, Link, Settings } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { profileService } from '@/services/profileService';

interface ProfileSetupProps {
  userId: string;
  onComplete: () => void;
  isFirstTime?: boolean;
}

const ProfileSetup = ({ userId, onComplete, isFirstTime = false }: ProfileSetupProps) => {
  const [loading, setLoading] = useState(false);
  const [brandColors, setBrandColors] = useState<string[]>(['']);
  const [brandDescription, setBrandDescription] = useState('');
  const [tone, setTone] = useState('');
  const [language, setLanguage] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['instagram', 'linkedin', 'wordpress']);

  const platforms = [
    { id: 'instagram', label: 'Instagram', description: 'Posts e historias' },
    { id: 'linkedin', label: 'LinkedIn', description: 'Posts profesionales' },
    { id: 'wordpress', label: 'WordPress', description: 'Artículos de blog' }
  ];

  // Load existing profile data if not first time
  useEffect(() => {
    const loadProfile = async () => {
      if (!isFirstTime) {
        const { data, error } = await profileService.getUserProfile(userId);
        if (data && !error) {
          // Safely extract typed data using helper functions
          const brandGuidelines = profileService.getBrandGuidelines(data.brand_guidelines);
          const postingGuidelines = profileService.getPostingGuidelines(data.posting_guidelines);
          const platforms = Array.isArray(data.selected_platforms) ? data.selected_platforms as string[] : null;

          setBrandColors(brandGuidelines?.colors || ['']);
          setBrandDescription(brandGuidelines?.brand_description || '');
          setTone(postingGuidelines?.tone || '');
          setLanguage(postingGuidelines?.language || '');
          setTargetAudience(postingGuidelines?.target_audience || '');
          setAdditionalNotes(postingGuidelines?.additional_notes || '');
          setWebhookUrl(data.webhook_url || '');
          setSelectedPlatforms(platforms || ['instagram', 'linkedin', 'wordpress']);
        }
      }
    };

    loadProfile();
  }, [userId, isFirstTime]);

  const addColorField = () => {
    setBrandColors([...brandColors, '']);
  };

  const removeColorField = (index: number) => {
    setBrandColors(brandColors.filter((_, i) => i !== index));
  };

  const updateColor = (index: number, value: string) => {
    const newColors = [...brandColors];
    newColors[index] = value;
    setBrandColors(newColors);
  };

  const handlePlatformChange = (platformId: string, checked: boolean) => {
    setSelectedPlatforms(prev => {
      if (checked) {
        return [...prev, platformId];
      } else {
        return prev.filter(id => id !== platformId);
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const profileData = {
        brand_guidelines: {
          colors: brandColors.filter(color => color.trim() !== ''),
          brand_description: brandDescription
        },
        posting_guidelines: {
          tone,
          language,
          target_audience: targetAudience,
          additional_notes: additionalNotes
        },
        webhook_url: webhookUrl.trim() || null,
        selected_platforms: selectedPlatforms
      };

      const { error } = await profileService.updateUserProfile(userId, profileData);

      if (error) {
        toast({
          title: "Error al guardar perfil",
          description: "No se pudo guardar tu perfil. Inténtalo nuevamente.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Perfil guardado",
          description: "Tu perfil ha sido configurado exitosamente.",
        });
        onComplete();
      }
    } catch (error) {
      toast({
        title: "Error inesperado",
        description: "Ocurrió un error inesperado. Inténtalo nuevamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
              <User className="w-7 h-7 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isFirstTime ? 'Configura tu perfil' : 'Editar perfil'}
          </h1>
          <p className="text-gray-600">
            {isFirstTime 
              ? 'Configura las directrices de tu marca y preferencias de automatización'
              : 'Actualiza las directrices de tu marca y preferencias de automatización'
            }
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Platform Selection */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                Plataformas Activas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">Selecciona las plataformas donde quieres publicar contenido automáticamente:</p>
              <div className="space-y-3">
                {platforms.map((platform) => (
                  <div key={platform.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <Checkbox
                      id={platform.id}
                      checked={selectedPlatforms.includes(platform.id)}
                      onCheckedChange={(checked) => handlePlatformChange(platform.id, checked as boolean)}
                    />
                    <div className="flex-1">
                      <Label htmlFor={platform.id} className="font-medium">{platform.label}</Label>
                      <p className="text-sm text-gray-500">{platform.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Webhook Configuration */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Link className="w-5 h-5 mr-2" />
                Webhook de Automatización
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="webhook-url">URL del Webhook (opcional)</Label>
                <Input
                  id="webhook-url"
                  type="url"
                  placeholder="https://tu-servicio.com/webhook"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Configura un webhook para recibir notificaciones cuando se cree contenido automatizado
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Brand Guidelines */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">Directrices de Marca</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="brand-description">Descripción de la marca</Label>
                <Textarea
                  id="brand-description"
                  placeholder="Describe tu marca, valores, personalidad..."
                  value={brandDescription}
                  onChange={(e) => setBrandDescription(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Colores de marca</Label>
                <div className="space-y-2 mt-1">
                  {brandColors.map((color, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Input
                        type="text"
                        placeholder="#000000 o nombre del color"
                        value={color}
                        onChange={(e) => updateColor(index, e.target.value)}
                        className="flex-1"
                      />
                      {brandColors.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeColorField(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addColorField}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar color
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Posting Guidelines */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">Directrices de Contenido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="tone">Tono de comunicación</Label>
                <Input
                  id="tone"
                  placeholder="Ej: Profesional, casual, divertido, inspirador..."
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="language">Idioma principal</Label>
                <Input
                  id="language"
                  placeholder="Ej: Español, Inglés, Portugués..."
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="target-audience">Audiencia objetivo</Label>
                <Input
                  id="target-audience"
                  placeholder="Ej: Emprendedores, Jóvenes profesionales, Familias..."
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="additional-notes">Notas adicionales</Label>
                <Textarea
                  id="additional-notes"
                  placeholder="Cualquier otra información importante sobre tu estilo de contenido..."
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex space-x-4">
            {!isFirstTime && (
              <Button
                type="button"
                variant="outline"
                onClick={onComplete}
                className="flex-1"
              >
                Cancelar
              </Button>
            )}
            <Button
              type="submit"
              disabled={loading || selectedPlatforms.length === 0}
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              {loading ? 'Guardando...' : (isFirstTime ? 'Comenzar' : 'Guardar cambios')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileSetup;
