
import React, { useState } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, 
  Copy, 
  Download, 
  Share2, 
  RefreshCw,
  Wand2,
  Target,
  Hash
} from 'lucide-react';

const Generate = () => {
  const [prompt, setPrompt] = useState('');
  const [platform, setPlatform] = useState('');
  const [tone, setTone] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');

  const platforms = [
    { value: 'instagram', label: 'Instagram', color: 'bg-gradient-to-r from-purple-500 to-pink-500' },
    { value: 'facebook', label: 'Facebook', color: 'bg-blue-600' },
    { value: 'twitter', label: 'Twitter', color: 'bg-sky-500' },
    { value: 'linkedin', label: 'LinkedIn', color: 'bg-blue-700' },
    { value: 'tiktok', label: 'TikTok', color: 'bg-black' }
  ];

  const tones = [
    'Profesional', 'Casual', 'Divertido', 'Inspiracional', 
    'Educativo', 'Promocional', 'Emotivo', 'Minimalista'
  ];

  const contentIdeas = [
    '5 tips para ser más productivo',
    'Receta saludable para el desayuno',
    'Motivación para el lunes',
    'Tendencias de moda primavera',
    'Consejos de ahorro financiero',
    'Rutina de ejercicios en casa'
  ];

  const handleGenerate = async () => {
    if (!prompt || !platform || !tone) return;
    
    setIsGenerating(true);
    // Simulamos la generación de contenido
    setTimeout(() => {
      const sampleContent = `🌟 ${prompt}

¿Sabías que pequeños cambios pueden generar grandes resultados? Aquí te comparto algunas ideas que pueden transformar tu día a día.

✨ Tip 1: Dedica 10 minutos cada mañana a planificar tu día
✨ Tip 2: Elimina distracciones durante tus horas más productivas  
✨ Tip 3: Celebra los pequeños logros para mantener la motivación

¿Cuál de estos tips vas a implementar hoy? ¡Cuéntame en los comentarios! 👇

#productividad #motivacion #desarrollo #exito #tips`;
      
      setGeneratedContent(sampleContent);
      setIsGenerating(false);
    }, 2000);
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Generador de Contenido con IA
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Crea contenido único y atractivo para tus redes sociales en segundos. 
            Solo describe tu idea y deja que la IA haga el resto.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Form */}
          <div className="space-y-6 animate-slide-up">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Wand2 className="w-5 h-5 text-purple-500" />
                  <span>Configuración del Contenido</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ¿Sobre qué quieres escribir?
                  </label>
                  <Textarea
                    placeholder="Ej: Consejos para ser más productivo en el trabajo..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="min-h-[100px] resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Target className="w-4 h-4 inline mr-1" />
                      Plataforma
                    </label>
                    <Select value={platform} onValueChange={setPlatform}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una plataforma" />
                      </SelectTrigger>
                      <SelectContent>
                        {platforms.map((p) => (
                          <SelectItem key={p.value} value={p.value}>
                            <div className="flex items-center space-x-2">
                              <div className={`w-3 h-3 rounded-full ${p.color}`} />
                              <span>{p.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Hash className="w-4 h-4 inline mr-1" />
                      Tono
                    </label>
                    <Select value={tone} onValueChange={setTone}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un tono" />
                      </SelectTrigger>
                      <SelectContent>
                        {tones.map((t) => (
                          <SelectItem key={t} value={t.toLowerCase()}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button 
                  onClick={handleGenerate}
                  disabled={!prompt || !platform || !tone || isGenerating}
                  className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                      Generando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Generar Contenido
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Content Ideas */}
            <Card className="animate-fade-in">
              <CardHeader>
                <CardTitle className="text-lg">Ideas de Contenido</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {contentIdeas.map((idea, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="cursor-pointer hover:bg-purple-50 hover:border-purple-200 transition-colors duration-200"
                      onClick={() => setPrompt(idea)}
                    >
                      {idea}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Generated Content */}
          <div className="animate-slide-up">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Contenido Generado</span>
                  {generatedContent && (
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Share2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isGenerating ? (
                  <div className="flex flex-col items-center justify-center h-64 space-y-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full animate-pulse flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-gray-500">Generando tu contenido perfecto...</p>
                  </div>
                ) : generatedContent ? (
                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-purple-500">
                      <pre className="whitespace-pre-wrap text-sm text-gray-800 font-medium">
                        {generatedContent}
                      </pre>
                    </div>
                    <div className="flex space-x-2">
                      <Button className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600">
                        Programar Publicación
                      </Button>
                      <Button variant="outline" className="flex-1">
                        Generar Variación
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                    <Sparkles className="w-12 h-12 mb-4 text-gray-300" />
                    <p>Tu contenido aparecerá aquí</p>
                    <p className="text-sm mt-2">Completa el formulario y genera contenido increíble</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Generate;
