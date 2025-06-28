import { ArrowRight, CheckCircle, Star, Users, Zap, Target, Clock, TrendingUp, Smartphone, Laptop, Edit3, Image, Calendar, Award, Shield, Play, Sparkles, BarChart3, Globe, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';

const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Navbar />
      
      {/* Hero Section with Enhanced Animations */}
      <section className="pt-36 pb-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 animate-pulse"></div>
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 px-6 py-3 rounded-full text-sm font-semibold mb-8 animate-fade-in border border-blue-200 shadow-lg">
            <Sparkles className="w-4 h-4 mr-2 animate-pulse" />
            Sistema Exclusivo de Automatización con IA
          </div>
          
          <h1 className="text-6xl md:text-7xl font-bold text-gray-900 mb-8 leading-tight animate-fade-in">
            Convierte Tus Ideas en 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 block animate-scale-in">
              Contenido Viral
            </span>
            <span className="text-4xl md:text-5xl text-gray-700">en Segundos</span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed animate-fade-in">
            La plataforma de IA más avanzada para crear y publicar contenido automáticamente 
            en Instagram, LinkedIn, WordPress y Twitter. <strong>Sin esfuerzo, sin complicaciones.</strong>
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16 animate-fade-in">
            <Link to="/auth">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-10 py-5 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                <Play className="mr-3 w-5 h-5" />
                Comenzar Gratis Ahora
                <ArrowRight className="ml-3 w-5 h-5" />
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="px-10 py-5 text-lg font-semibold border-2 hover:bg-gray-50 transition-all duration-300 hover:scale-105">
              Ver Demo en Vivo
            </Button>
          </div>
          
          {/* Interactive Dashboard Preview */}
          <div className="relative max-w-6xl mx-auto animate-fade-in">
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur-2xl opacity-20 animate-pulse"></div>
            <div className="relative bg-white rounded-2xl shadow-2xl p-2 border border-gray-200">
              <div className="bg-gray-900 rounded-t-xl p-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <div className="ml-4 text-gray-300 text-sm font-mono">contentflow.ai</div>
                </div>
              </div>
              <div className="relative rounded-b-xl overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2426&auto=format&fit=crop" 
                  alt="Dashboard de Contentflow" 
                  className="w-full h-[400px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-blue-900/20 to-transparent"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Animated Process Flow Section */}
      <section className="py-20 px-4 bg-white relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-gray-900 mb-6">
              Cómo Funciona la <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Magia</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Descubre el proceso automatizado que convierte tus ideas en contenido viral en tiempo record
            </p>
          </div>
          
          {/* Interactive Flow Animation */}
          <div className="relative">
            <div className="grid lg:grid-cols-4 gap-8 relative">
              {/* Animated Connection Lines */}
              <div className="hidden lg:block absolute top-16 left-0 w-full h-0.5 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 animate-pulse"></div>
              
              {/* Step 1 */}
              <div className="relative group">
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8 border border-blue-100 shadow-lg hover:shadow-xl transition-all duration-500 hover:scale-105">
                  <div className="relative">
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:animate-pulse">
                      <Edit3 className="w-8 h-8 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">1</div>
                  </div>
                  <h3 className="text-xl font-bold mb-4 text-center">Insertar Tema</h3>
                  <p className="text-gray-600 text-center mb-6">Simplemente describe tu idea o tema en una frase</p>
                  <div className="relative overflow-hidden rounded-lg">
                    <img 
                      src="https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?q=80&w=6000&auto=format&fit=crop" 
                      alt="Insertar tema" 
                      className="w-full h-40 object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-blue-900/30 to-transparent"></div>
                  </div>
                </div>
              </div>
              
              {/* Step 2 */}
              <div className="relative group">
                <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-8 border border-purple-100 shadow-lg hover:shadow-xl transition-all duration-500 hover:scale-105">
                  <div className="relative">
                    <div className="bg-gradient-to-r from-purple-600 to-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:animate-spin">
                      <Zap className="w-8 h-8 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 bg-purple-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">2</div>
                  </div>
                  <h3 className="text-xl font-bold mb-4 text-center">IA Genera Contenido</h3>
                  <p className="text-gray-600 text-center mb-6">Nuestra IA crea contenido optimizado para cada plataforma</p>
                  <div className="relative overflow-hidden rounded-lg">
                    <img 
                      src="https://images.unsplash.com/photo-1531297484001-80022131f5a1?q=80&w=4846&auto=format&fit=crop" 
                      alt="Generar contenido" 
                      className="w-full h-40 object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-purple-900/30 to-transparent"></div>
                  </div>
                </div>
              </div>
              
              {/* Step 3 */}
              <div className="relative group">
                <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl p-8 border border-green-100 shadow-lg hover:shadow-xl transition-all duration-500 hover:scale-105">
                  <div className="relative">
                    <div className="bg-gradient-to-r from-green-600 to-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:animate-bounce">
                      <Image className="w-8 h-8 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 bg-green-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">3</div>
                  </div>
                  <h3 className="text-xl font-bold mb-4 text-center">Crear Imágenes</h3>
                  <p className="text-gray-600 text-center mb-6">Genera imágenes impactantes con IA o sube las tuyas</p>
                  <div className="relative overflow-hidden rounded-lg">
                    <img 
                      src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=7952&auto=format&fit=crop" 
                      alt="Generar imagen" 
                      className="w-full h-40 object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-green-900/30 to-transparent"></div>
                  </div>
                </div>
              </div>
              
              {/* Step 4 */}
              <div className="relative group">
                <div className="bg-gradient-to-br from-orange-50 to-purple-50 rounded-2xl p-8 border border-orange-100 shadow-lg hover:shadow-xl transition-all duration-500 hover:scale-105">
                  <div className="relative">
                    <div className="bg-gradient-to-r from-orange-600 to-purple-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:animate-pulse">
                      <Calendar className="w-8 h-8 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 bg-orange-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">4</div>
                  </div>
                  <h3 className="text-xl font-bold mb-4 text-center">Publicar Automático</h3>
                  <p className="text-gray-600 text-center mb-6">Programa y publica en todas las plataformas simultáneamente</p>
                  <div className="relative overflow-hidden rounded-lg">
                    <img 
                      src="https://images.unsplash.com/photo-1518495973542-4542c06a5843?q=80&w=3648&auto=format&fit=crop" 
                      alt="Programar publicación" 
                      className="w-full h-40 object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-orange-900/30 to-transparent"></div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Floating Icons Animation */}
            <div className="absolute inset-0 pointer-events-none">
              <Globe className="absolute top-10 left-10 w-6 h-6 text-blue-400 animate-bounce" style={{animationDelay: '0s'}} />
              <RefreshCw className="absolute top-20 right-20 w-5 h-5 text-purple-400 animate-spin" style={{animationDuration: '3s'}} />
              <BarChart3 className="absolute bottom-20 left-20 w-6 h-6 text-green-400 animate-pulse" style={{animationDelay: '1s'}} />
              <Sparkles className="absolute bottom-10 right-10 w-5 h-5 text-orange-400 animate-ping" style={{animationDelay: '2s'}} />
            </div>
          </div>
          
          <div className="text-center mt-16">
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-10 py-4 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <Play className="mr-3 w-5 h-5" />
              Ver Demo Interactivo
            </Button>
          </div>
        </div>
      </section>

      {/* Problem Section with Enhanced Styling */}
      <section className="py-20 px-4 bg-gradient-to-br from-gray-50 to-slate-100">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-gray-900 mb-8 animate-fade-in">
              ¿Te Sientes <span className="text-red-600">Abrumado</span> Creando Contenido?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              No eres el único. El 87% de los emprendedores luchan con estos mismos problemas
            </p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="flex items-start space-x-6 bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                <div className="bg-red-100 p-4 rounded-2xl">
                  <Clock className="w-8 h-8 text-red-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-3 text-gray-900">Falta de Tiempo</h3>
                  <p className="text-gray-600 text-lg">Pasas 4-6 horas diarias creando contenido en lugar de hacer crecer tu negocio</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-6 bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                <div className="bg-orange-100 p-4 rounded-2xl">
                  <Target className="w-8 h-8 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-3 text-gray-900">Inconsistencia</h3>
                  <p className="text-gray-600 text-lg">Tu presencia online es irregular y pierdes el 60% de tu audiencia potencial</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-6 bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                <div className="bg-blue-100 p-4 rounded-2xl">
                  <TrendingUp className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-3 text-gray-900">Bajo Engagement</h3>
                  <p className="text-gray-600 text-lg">Tu contenido genera menos del 2% de interacción cuando podría ser 10x más</p>
                </div>
              </div>
              
              <Button className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white px-8 py-4 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                Resolver Estos Problemas Ahora
              </Button>
            </div>
            
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-red-600 to-orange-600 rounded-3xl blur-2xl opacity-20 animate-pulse"></div>
              <div className="relative bg-gray-900 rounded-3xl p-6 shadow-2xl">
                <div className="bg-gray-800 rounded-t-2xl p-4">
                  <div className="flex space-x-3">
                    <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
                    <div className="w-4 h-4 bg-yellow-500 rounded-full animate-pulse"></div>
                    <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
                  </div>
                </div>
                <div className="bg-white rounded-b-2xl overflow-hidden">
                  <img 
                    src="https://images.unsplash.com/photo-1461749280684-dccba630e2f6?q=80&w=3543&auto=format&fit=crop" 
                    alt="Dashboard de Contentflow en laptop" 
                    className="w-full h-80 object-cover hover:scale-105 transition-transform duration-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Section with Gradient Background */}
      <section className="py-20 px-4 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="lg:order-2 relative">
              <div className="absolute -inset-8 bg-white/10 rounded-3xl blur-3xl animate-pulse"></div>
              <div className="relative bg-gray-900 rounded-3xl p-6 max-w-sm mx-auto shadow-2xl">
                <div className="bg-white rounded-2xl overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 h-8 flex items-center justify-center">
                    <div className="w-16 h-2 bg-white/30 rounded-full"></div>
                  </div>
                  <img 
                    src="https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=5530&auto=format&fit=crop" 
                    alt="Contentflow en móvil" 
                    className="w-full h-80 object-cover"
                  />
                </div>
              </div>
            </div>
            
            <div className="lg:order-1">
              <h2 className="text-5xl font-bold mb-8 animate-fade-in">
                ContentFlow: Tu <span className="text-yellow-300">Solución Definitiva</span>
              </h2>
              
              <p className="text-2xl mb-10 opacity-90 animate-fade-in">
                Automatiza completamente tu estrategia de contenido con IA de última generación
              </p>
              
              <div className="space-y-8">
                <div className="flex items-start space-x-6 animate-fade-in">
                  <div className="bg-white/20 p-4 rounded-2xl">
                    <Zap className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-3">Generación Inteligente</h3>
                    <p className="opacity-90 text-lg">IA que crea contenido optimizado para cada plataforma automáticamente</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-6 animate-fade-in">
                  <div className="bg-white/20 p-4 rounded-2xl">
                    <Target className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-3">Publicación Automática</h3>
                    <p className="opacity-90 text-lg">Programa y publica en múltiples plataformas sin intervención manual</p>
                  </div>
                </div>
              </div>
              
              <Button className="bg-white text-blue-600 hover:bg-gray-100 px-10 py-4 text-lg font-semibold mt-10 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                <Play className="mr-3 w-5 h-5" />
                Probar Gratis por 14 Días
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Features Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-5xl font-bold text-center text-gray-900 mb-6">
            Todo lo que Necesitas en <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Una Plataforma</span>
          </h2>
          <p className="text-xl text-gray-600 text-center mb-16 max-w-3xl mx-auto">
            Descubre las características que están revolucionando la forma en que los emprendedores crean contenido
          </p>
          
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {[
              {
                icon: <Users className="w-8 h-8 text-blue-600" />,
                title: "Multi-Plataforma",
                description: "Instagram, LinkedIn, WordPress y Twitter en un solo lugar",
                gradient: "from-blue-50 to-blue-100",
                border: "border-blue-200"
              },
              {
                icon: <Zap className="w-8 h-8 text-purple-600" />,
                title: "IA Avanzada",
                description: "Contenido optimizado con las últimas tecnologías de inteligencia artificial",
                gradient: "from-purple-50 to-purple-100",
                border: "border-purple-200"
              },
              {
                icon: <Clock className="w-8 h-8 text-green-600" />,
                title: "Programación Inteligente",
                description: "Publica en los mejores horarios automáticamente",
                gradient: "from-green-50 to-green-100",
                border: "border-green-200"
              },
              {
                icon: <TrendingUp className="w-8 h-8 text-orange-600" />,
                title: "Analytics Completos",
                description: "Métricas detalladas para optimizar tu estrategia",
                gradient: "from-orange-50 to-orange-100",
                border: "border-orange-200"
              },
              {
                icon: <Target className="w-8 h-8 text-red-600" />,
                title: "Personalización Total",
                description: "Adapta el tono y estilo a tu marca personal",
                gradient: "from-red-50 to-red-100",
                border: "border-red-200"
              },
              {
                icon: <CheckCircle className="w-8 h-8 text-indigo-600" />,
                title: "Fácil de Usar",
                description: "Interfaz intuitiva que cualquiera puede dominar",
                gradient: "from-indigo-50 to-indigo-100",
                border: "border-indigo-200"
              }
            ].map((feature, index) => (
              <Card key={index} className={`hover:shadow-xl transition-all duration-500 hover:scale-105 bg-gradient-to-br ${feature.gradient} ${feature.border} border-2 group`}>
                <CardHeader className="text-center">
                  <div className="bg-white rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:animate-bounce">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-center">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="text-center">
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-10 py-4 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <Play className="mr-3 w-5 h-5" />
              Explorar Todas las Características
            </Button>
          </div>
        </div>
      </section>

      {/* Bonuses Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-green-50 to-emerald-100">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-12">
            Bonuses Exclusivos
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <Card className="p-6">
              <Award className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-3">Plantillas Premium</h3>
              <p className="text-gray-600">Acceso a más de 100 plantillas profesionales para cada plataforma</p>
            </Card>
            
            <Card className="p-6">
              <Star className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-3">Curso de Marketing</h3>
              <p className="text-gray-600">Curso completo de estrategias de contenido valorado en $297</p>
            </Card>
          </div>
          
          <Button className="bg-green-600 hover:bg-green-700 text-white px-8 py-3">
            Contactar
          </Button>
        </div>
      </section>

      {/* Guarantees Section */}
      <section className="py-16 px-4 bg-blue-900 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-12">
            Nuestras Garantías
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="p-6">
              <Shield className="w-12 h-12 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-3">30 Días de Garantía</h3>
              <p className="opacity-90">Si no estás satisfecho, te devolvemos tu dinero</p>
            </div>
            
            <div className="p-6">
              <Clock className="w-12 h-12 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-3">Soporte 24/7</h3>
              <p className="opacity-90">Asistencia técnica disponible las 24 horas del día</p>
            </div>
            
            <div className="p-6">
              <CheckCircle className="w-12 h-12 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-3">Actualizaciones Gratuitas</h3>
              <p className="opacity-90">Todas las mejoras y nuevas funciones sin costo adicional</p>
            </div>
          </div>
          
          <Button className="bg-white text-blue-900 hover:bg-gray-100 px-8 py-3">
            Contactar
          </Button>
        </div>
      </section>

      {/* About Me Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Conoce Más Acerca de Mí
              </h2>
              
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                Soy un emprendedor digital apasionado por la automatización y la inteligencia artificial. 
                Durante los últimos 5 años he ayudado a más de 1,000 empresarios a escalar sus negocios 
                a través del marketing de contenido automatizado.
              </p>
              
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Mi misión es democratizar el acceso a herramientas de IA avanzadas para que cualquier 
                persona pueda crear contenido de calidad profesional sin necesidad de conocimientos técnicos.
              </p>
              
              <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3">
                Contactar
              </Button>
            </div>
            
            <div className="lg:pl-8">
              <img 
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1000&auto=format&fit=crop" 
                alt="Foto del fundador" 
                className="w-full max-w-md mx-auto rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced CTA Section */}
      <section className="py-24 px-4 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full animate-pulse"></div>
          <div className="absolute top-32 right-20 w-16 h-16 bg-white/10 rounded-full animate-bounce"></div>
          <div className="absolute bottom-20 left-20 w-12 h-12 bg-white/10 rounded-full animate-ping"></div>
          <div className="absolute bottom-10 right-10 w-24 h-24 bg-white/10 rounded-full animate-pulse"></div>
        </div>
        
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <h2 className="text-6xl font-bold mb-8 animate-fade-in">
            Comienza a Automatizar Tu Contenido <span className="text-yellow-300">Hoy</span>
          </h2>
          
          <p className="text-2xl mb-12 opacity-90 animate-fade-in">
            Únete a más de <strong>10,000 emprendedores</strong> que ya están revolucionando su marketing de contenido
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center animate-fade-in">
            <Link to="/auth">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 px-16 py-6 text-xl font-bold shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110">
                <Play className="mr-4 w-6 h-6" />
                Empezar Gratis por 14 Días
                <ArrowRight className="ml-4 w-6 h-6" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white hover:text-blue-600 px-16 py-6 text-xl font-bold transition-all duration-300 hover:scale-110">
              Ver Demo en Vivo
            </Button>
          </div>
          
          <p className="text-sm opacity-75 mt-8">
            * No se requiere tarjeta de crédito • Cancela cuando quieras • Soporte 24/7
          </p>
        </div>
      </section>

      {/* Enhanced Footer */}
      <footer className="py-12 px-4 bg-gray-900 text-white">
        <div className="max-w-5xl mx-auto text-center">
          <h3 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
            ContentFlow
          </h3>
          <p className="text-gray-400 text-lg mb-8">
            La plataforma más avanzada para automatizar tu estrategia de contenido con inteligencia artificial
          </p>
          <div className="flex justify-center space-x-6">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
