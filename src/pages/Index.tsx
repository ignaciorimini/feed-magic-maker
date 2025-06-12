
import React from 'react';
import Layout from '@/components/Layout';
import StatCard from '@/components/StatCard';
import ContentCard from '@/components/ContentCard';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  Users, 
  Calendar, 
  Sparkles,
  Plus,
  ArrowRight
} from 'lucide-react';

const Index = () => {
  const stats = [
    {
      title: 'Posts Generados',
      value: '247',
      change: '+12% este mes',
      icon: Sparkles,
      gradient: 'from-purple-500 to-blue-500'
    },
    {
      title: 'Engagement Total',
      value: '15.2K',
      change: '+8% esta semana',
      icon: TrendingUp,
      gradient: 'from-pink-500 to-red-500'
    },
    {
      title: 'Nuevos Seguidores',
      value: '1,234',
      change: '+15% este mes',
      icon: Users,
      gradient: 'from-green-500 to-teal-500'
    },
    {
      title: 'Posts Programados',
      value: '18',
      change: 'Próximos 7 días',
      icon: Calendar,
      gradient: 'from-orange-500 to-yellow-500'
    }
  ];

  const recentContent = [
    {
      title: '5 Tips para Productividad',
      content: 'Descubre las mejores estrategias para maximizar tu productividad diaria. Desde técnicas de gestión del tiempo hasta herramientas digitales que transformarán tu rutina.',
      platform: 'Instagram',
      scheduledFor: 'Hoy a las 3:00 PM',
      status: 'scheduled' as const
    },
    {
      title: 'Tendencias de Marketing 2024',
      content: 'El panorama del marketing digital está evolucionando rápidamente. Estas son las tendencias que definirán el éxito de las marcas este año.',
      platform: 'LinkedIn',
      engagement: { views: 1250, likes: 89, shares: 23 },
      status: 'published' as const
    },
    {
      title: 'Receta de Smoothie Verde',
      content: 'Un delicioso y nutritivo smoothie verde perfecto para comenzar el día con energía. Ingredientes naturales y fácil preparación.',
      platform: 'Facebook',
      status: 'draft' as const
    }
  ];

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="animate-fade-in">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              ¡Bienvenido de vuelta! 👋
            </h1>
            <p className="text-gray-600">
              Aquí tienes un resumen de tu actividad en redes sociales
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex space-x-3">
            <Button variant="outline" className="animate-slide-up">
              <Calendar className="w-4 h-4 mr-2" />
              Ver Calendario
            </Button>
            <Button className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 animate-slide-up">
              <Plus className="w-4 h-4 mr-2" />
              Crear Contenido
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <div key={stat.title} style={{ animationDelay: `${index * 100}ms` }}>
              <StatCard {...stat} />
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-fade-in">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Acciones Rápidas</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-center space-y-2 hover:bg-purple-50 hover:border-purple-200 transition-colors duration-200"
            >
              <Sparkles className="w-8 h-8 text-purple-500" />
              <span className="font-medium">Generar Post con IA</span>
              <span className="text-xs text-gray-500">Crea contenido automáticamente</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-center space-y-2 hover:bg-blue-50 hover:border-blue-200 transition-colors duration-200"
            >
              <Calendar className="w-8 h-8 text-blue-500" />
              <span className="font-medium">Programar Publicación</span>
              <span className="text-xs text-gray-500">Planifica tu contenido</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-center space-y-2 hover:bg-green-50 hover:border-green-200 transition-colors duration-200"
            >
              <TrendingUp className="w-8 h-8 text-green-500" />
              <span className="font-medium">Ver Analytics</span>
              <span className="text-xs text-gray-500">Analiza tu rendimiento</span>
            </Button>
          </div>
        </div>

        {/* Recent Content */}
        <div className="animate-fade-in">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Contenido Reciente</h2>
            <Button variant="ghost" className="text-purple-600 hover:text-purple-700">
              Ver todo <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentContent.map((content, index) => (
              <div key={content.title} style={{ animationDelay: `${index * 150}ms` }}>
                <ContentCard {...content} />
              </div>
            ))}
          </div>
        </div>

        {/* CTA Banner */}
        <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl p-8 text-white animate-fade-in">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold mb-2">
              ¿Listo para crear contenido increíble?
            </h2>
            <p className="text-purple-100 mb-6">
              Usa nuestra IA avanzada para generar posts únicos y atractivos que conecten con tu audiencia.
            </p>
            <Button size="lg" variant="secondary" className="text-purple-700 hover:text-purple-800">
              <Sparkles className="w-5 h-5 mr-2" />
              Comenzar a Generar
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Index;
