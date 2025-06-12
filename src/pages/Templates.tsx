
import React, { useState } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Filter, 
  Heart, 
  Download, 
  Copy,
  Eye,
  Sparkles,
  TrendingUp,
  Users,
  Coffee,
  Briefcase,
  Camera
} from 'lucide-react';

const Templates = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', name: 'Todos', icon: Sparkles },
    { id: 'marketing', name: 'Marketing', icon: TrendingUp },
    { id: 'personal', name: 'Personal', icon: Users },
    { id: 'business', name: 'Negocios', icon: Briefcase },
    { id: 'lifestyle', name: 'Lifestyle', icon: Coffee },
    { id: 'photography', name: 'Fotografía', icon: Camera }
  ];

  const templates = [
    {
      id: 1,
      title: 'Post Motivacional',
      description: 'Perfecto para inspirar y motivar a tu audiencia con mensajes positivos',
      category: 'personal',
      platform: 'Instagram',
      likes: 324,
      downloads: 1200,
      content: '🌟 RECUERDA: El éxito no es el destino, es el viaje.\n\nCada pequeño paso que das hoy te acerca a tus metas. No importa qué tan lento vayas, lo importante es que no te detengas.\n\n✨ ¿Cuál es tu meta para hoy?\n\n#motivacion #exito #crecimientopersonal #metas',
      color: 'from-orange-400 to-pink-500'
    },
    {
      id: 2,
      title: 'Tip de Productividad',
      description: 'Comparte consejos valiosos para mejorar la productividad diaria',
      category: 'business',
      platform: 'LinkedIn',
      likes: 567,
      downloads: 890,
      content: '💡 TIP DE PRODUCTIVIDAD:\n\nLa regla de los 2 minutos: Si una tarea te toma menos de 2 minutos, hazla inmediatamente.\n\nEsto evita que pequeñas tareas se acumulen y se conviertan en una montaña de pendientes.\n\n🚀 ¿Qué pequeña tarea vas a completar ahora mismo?\n\n#productividad #tips #eficiencia #trabajo',
      color: 'from-blue-400 to-purple-500'
    },
    {
      id: 3,
      title: 'Pregunta Interactiva',
      description: 'Aumenta el engagement con preguntas que inviten a la participación',
      category: 'marketing',
      platform: 'Facebook',
      likes: 234,
      downloads: 567,
      content: '🤔 PREGUNTA DEL DÍA:\n\n¿Cuál es la habilidad que más te ha servido en tu carrera profesional?\n\nYo diría que la comunicación efectiva ha sido clave para mi crecimiento. Me ha permitido construir mejores relaciones y transmitir ideas de manera clara.\n\n👇 ¡Comparte tu respuesta en los comentarios!\n\n#habilidades #carrera #crecimiento #comunidad',
      color: 'from-green-400 to-blue-500'
    },
    {
      id: 4,
      title: 'Receta Saludable',
      description: 'Comparte recetas nutritivas y deliciosas de manera atractiva',
      category: 'lifestyle',
      platform: 'Instagram',
      likes: 892,
      downloads: 1500,
      content: '🥗 SMOOTHIE VERDE ENERGIZANTE\n\nIngredientes:\n• 1 taza de espinacas frescas\n• 1 plátano maduro\n• 1/2 aguacate\n• 1 taza de agua de coco\n• Jugo de 1/2 limón\n• 1 cdta de miel\n\n✨ Licúa todo hasta que esté cremoso y ¡disfruta!\n\nPerfecto para comenzar el día con energía y nutrientes.\n\n#smoothie #saludable #energia #receta #verde',
      color: 'from-green-300 to-emerald-500'
    },
    {
      id: 5,
      title: 'Promoción de Producto',
      description: 'Template profesional para promocionar productos o servicios',
      category: 'marketing',
      platform: 'Instagram',
      likes: 445,
      downloads: 823,
      content: '🎉 ¡NOVEDAD DISPONIBLE!\n\nEstamos emocionados de presentarte nuestro nuevo producto que revolucionará tu experiencia.\n\n✅ Calidad premium\n✅ Diseño innovador\n✅ Garantía de satisfacción\n\n🔥 Oferta de lanzamiento: 20% de descuento\nCódigo: NUEVO20\n\n🛒 ¡Consíguelo ahora!\nEnlace en bio\n\n#nuevo #producto #oferta #calidad #innovacion',
      color: 'from-purple-400 to-pink-500'
    },
    {
      id: 6,
      title: 'Behind the Scenes',
      description: 'Muestra el lado humano de tu marca o negocio',
      category: 'personal',
      platform: 'Instagram',
      likes: 678,
      downloads: 1100,
      content: '🎬 DETRÁS DE CÁMARAS\n\nAsí es como creamos la magia ✨\n\nMuchas veces solo ven el resultado final, pero hay todo un proceso creativo detrás de cada proyecto.\n\nDesde la lluvia de ideas hasta los retoques finales, cada paso cuenta para crear algo especial.\n\n📸 ¿Les gusta ver este tipo de contenido?\n\n#behindthescenes #proceso #creativo #trabajo #pasion',
      color: 'from-yellow-400 to-orange-500'
    }
  ];

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center animate-fade-in">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Biblioteca de Plantillas
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Encuentra inspiración con nuestras plantillas profesionales. 
            Personalízalas y publícalas en segundos.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 animate-slide-up">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar plantillas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" className="w-full sm:w-auto">
            <Filter className="w-4 h-4 mr-2" />
            Filtros
          </Button>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-2 animate-scale-in">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className={selectedCategory === category.id ? 
                  "bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600" : ""
                }
              >
                <Icon className="w-4 h-4 mr-2" />
                {category.name}
              </Button>
            );
          })}
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template, index) => (
            <Card key={template.id} className="group hover:shadow-lg transition-all duration-300 animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
              <CardHeader className="pb-3">
                <div className={`h-32 bg-gradient-to-r ${template.color} rounded-lg mb-3 flex items-center justify-center relative overflow-hidden`}>
                  <div className="absolute inset-0 bg-black bg-opacity-20" />
                  <div className="text-white text-center z-10">
                    <h3 className="font-bold text-lg mb-1">{template.title}</h3>
                    <Badge variant="secondary" className="bg-white bg-opacity-20 text-white border-white border-opacity-30">
                      {template.platform}
                    </Badge>
                  </div>
                </div>
                <CardTitle className="text-lg">{template.title}</CardTitle>
                <p className="text-sm text-gray-600">{template.description}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-700 line-clamp-4 whitespace-pre-line">
                    {template.content}
                  </p>
                </div>
                
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <Heart className="w-4 h-4" />
                      <span>{template.likes}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Download className="w-4 h-4" />
                      <span>{template.downloads}</span>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {categories.find(c => c.id === template.category)?.name}
                  </Badge>
                </div>

                <div className="flex space-x-2">
                  <Button size="sm" variant="outline" className="flex-1">
                    <Eye className="w-4 h-4 mr-1" />
                    Vista Previa
                  </Button>
                  <Button size="sm" className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600">
                    <Copy className="w-4 h-4 mr-1" />
                    Usar Template
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="text-center py-12 animate-fade-in">
            <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No se encontraron plantillas
            </h3>
            <p className="text-gray-600">
              Intenta cambiar los filtros de búsqueda o explora otras categorías.
            </p>
          </div>
        )}

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl p-8 text-white text-center animate-fade-in">
          <h2 className="text-2xl font-bold mb-2">
            ¿No encuentras lo que buscas?
          </h2>
          <p className="text-purple-100 mb-6">
            Usa nuestro generador de contenido con IA para crear plantillas personalizadas
          </p>
          <Button size="lg" variant="secondary" className="text-purple-700 hover:text-purple-800">
            <Sparkles className="w-5 h-5 mr-2" />
            Crear Plantilla Personalizada
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default Templates;
