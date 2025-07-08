
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Sparkles, Plus, Loader2, Wand2, Stars } from 'lucide-react';
import { contentService } from '@/services/contentService';
import { toast } from '@/hooks/use-toast';

interface ContentFormProps {
  onContentGenerated: () => void;
}

const ContentForm = ({ onContentGenerated }: ContentFormProps) => {
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [contentType, setContentType] = useState('Simple Post');
  const [platforms, setPlatforms] = useState<string[]>(['instagram', 'linkedin']);
  const [isLoading, setIsLoading] = useState(false);

  const platformOptions = [
    { id: 'instagram', label: 'Instagram' },
    { id: 'linkedin', label: 'LinkedIn' },
    { id: 'wordpress', label: 'WordPress' },
  ];

  const contentTypes = ['Simple Post', 'Slide Post'];

  const handlePlatformChange = (platformId: string, checked: boolean) => {
    if (checked) {
      setPlatforms([...platforms, platformId]);
    } else {
      setPlatforms(platforms.filter(p => p !== platformId));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!topic.trim()) {
      toast({
        title: "Error",
        description: "El tema es requerido.",
        variant: "destructive",
      });
      return;
    }

    if (platforms.length === 0) {
      toast({
        title: "Error",
        description: "Selecciona al menos una plataforma.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const { data, error } = await contentService.generateContent({
        topic: topic.trim(),
        description: description.trim(),
        contentType,
        platforms
      });

      if (error) {
        throw error;
      }

      toast({
        title: "¡Contenido generado exitosamente!",
        description: `Se generó contenido para ${platforms.length} plataforma${platforms.length > 1 ? 's' : ''}.`,
      });

      // Reset form
      setTopic('');
      setDescription('');
      setContentType('Simple Post');
      setPlatforms(['instagram', 'linkedin']);
      
      onContentGenerated();
    } catch (error) {
      console.error('Error generating content:', error);
      toast({
        title: "Error al generar contenido",
        description: "Hubo un problema al generar el contenido. Verifica tu webhook.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
            <Wand2 className="w-5 h-5 text-white" />
          </div>
          <span>Crear nuevo contenido</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="topic">Tema del contenido *</Label>
            <Input
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Ej: Tendencias de marketing digital 2024"
              className="text-base"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción adicional (opcional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Añade detalles específicos sobre el enfoque o estilo que deseas..."
              rows={3}
              className="resize-none text-base"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label>Tipo de contenido</Label>
            <Select value={contentType} onValueChange={setContentType} disabled={isLoading}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {contentTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label>Plataformas de destino</Label>
            <div className="flex flex-wrap gap-3">
              {platformOptions.map((platform) => (
                <div key={platform.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={platform.id}
                    checked={platforms.includes(platform.id)}
                    onCheckedChange={(checked) => handlePlatformChange(platform.id, checked as boolean)}
                    disabled={isLoading}
                  />
                  <Label htmlFor={platform.id} className="cursor-pointer">
                    {platform.label}
                  </Label>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {platforms.map((platform) => (
                <Badge key={platform} variant="secondary" className="capitalize">
                  {platform}
                </Badge>
              ))}
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading || !topic.trim() || platforms.length === 0}
            className="w-full h-12 text-base font-semibold bg-gradient-to-r from-purple-600 via-purple-700 to-pink-600 hover:from-purple-700 hover:via-purple-800 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] border-0"
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Generando contenido...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Stars className="w-5 h-5" />
                  <Sparkles className="w-3 h-3 absolute -top-1 -right-1 animate-pulse" />
                </div>
                <span>Generar contenido</span>
              </div>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ContentForm;
