
import React from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Settings as SettingsIcon, 
  User, 
  Bell, 
  Shield, 
  Palette,
  Smartphone,
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  Plus,
  Check,
  X
} from 'lucide-react';

const Settings = () => {
  const connectedAccounts = [
    {
      platform: 'Instagram',
      username: '@tuempresa',
      connected: true,
      icon: Instagram,
      color: 'bg-gradient-to-r from-purple-500 to-pink-500'
    },
    {
      platform: 'Facebook',
      username: 'Tu Empresa',
      connected: true,
      icon: Facebook,
      color: 'bg-blue-600'
    },
    {
      platform: 'Twitter',
      username: '@tuempresa',
      connected: false,
      icon: Twitter,
      color: 'bg-sky-500'
    },
    {
      platform: 'LinkedIn',
      username: 'Tu Empresa',
      connected: false,
      icon: Linkedin,
      color: 'bg-blue-700'
    }
  ];

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="animate-fade-in">
          <div className="flex items-center space-x-3 mb-2">
            <SettingsIcon className="w-8 h-8 text-purple-500" />
            <h1 className="text-3xl font-bold text-gray-900">Configuración</h1>
          </div>
          <p className="text-gray-600">
            Gestiona tu cuenta, conecta redes sociales y personaliza tu experiencia
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Configuración de Perfil */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="animate-slide-up">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="w-5 h-5 text-purple-500" />
                  <span>Información del Perfil</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
                    TU
                  </div>
                  <Button variant="outline">Cambiar Foto</Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">Nombre</Label>
                    <Input id="firstName" defaultValue="Tu Nombre" />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Apellido</Label>
                    <Input id="lastName" defaultValue="Tu Apellido" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">Correo Electrónico</Label>
                  <Input id="email" type="email" defaultValue="tu@email.com" />
                </div>
                <div>
                  <Label htmlFor="company">Empresa</Label>
                  <Input id="company" defaultValue="Tu Empresa" />
                </div>
                <Button className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600">
                  Guardar Cambios
                </Button>
              </CardContent>
            </Card>

            <Card className="animate-slide-up">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bell className="w-5 h-5 text-purple-500" />
                  <span>Notificaciones</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Notificaciones por Email</p>
                    <p className="text-sm text-gray-600">Recibe actualizaciones sobre tu contenido</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Recordatorios de Publicación</p>
                    <p className="text-sm text-gray-600">Te recordamos cuando es hora de publicar</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Alertas de Engagement</p>
                    <p className="text-sm text-gray-600">Notificaciones cuando recibas interacciones</p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Newsletter Semanal</p>
                    <p className="text-sm text-gray-600">Resumen semanal de tu actividad</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>

            <Card className="animate-slide-up">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-purple-500" />
                  <span>Privacidad y Seguridad</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Perfil Público</p>
                    <p className="text-sm text-gray-600">Permite que otros vean tu perfil</p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Verificación en Dos Pasos</p>
                    <p className="text-sm text-gray-600">Agrega una capa extra de seguridad</p>
                  </div>
                  <Button variant="outline" size="sm">Configurar</Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Sesiones Activas</p>
                    <p className="text-sm text-gray-600">Gestiona dónde has iniciado sesión</p>
                  </div>
                  <Button variant="outline" size="sm">Ver Dispositivos</Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Redes Sociales Conectadas */}
            <Card className="animate-scale-in">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Smartphone className="w-5 h-5 text-purple-500" />
                  <span>Redes Sociales</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {connectedAccounts.map((account) => {
                  const Icon = account.icon;
                  return (
                    <div key={account.platform} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${account.color}`}>
                          <Icon className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{account.platform}</p>
                          {account.connected && (
                            <p className="text-xs text-gray-500">{account.username}</p>
                          )}
                        </div>
                      </div>
                      {account.connected ? (
                        <div className="flex items-center space-x-2">
                          <Check className="w-4 h-4 text-green-500" />
                          <Button variant="ghost" size="sm">
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button size="sm" variant="outline">
                          <Plus className="w-4 h-4 mr-1" />
                          Conectar
                        </Button>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Preferencias */}
            <Card className="animate-scale-in">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Palette className="w-5 h-5 text-purple-500" />
                  <span>Preferencias</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="timezone">Zona Horaria</Label>
                  <select className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                    <option>GMT-5 (Lima, Bogotá)</option>
                    <option>GMT-3 (Buenos Aires)</option>
                    <option>GMT-6 (México)</option>
                    <option>GMT+1 (Madrid)</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="language">Idioma</Label>
                  <select className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                    <option>Español</option>
                    <option>English</option>
                    <option>Português</option>
                  </select>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Modo Oscuro</p>
                    <p className="text-xs text-gray-600">Cambia la apariencia de la interfaz</p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>

            {/* Plan Actual */}
            <Card className="animate-scale-in">
              <CardHeader>
                <CardTitle className="text-lg">Plan Actual</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg p-4 text-white mb-4">
                  <h3 className="font-bold mb-1">Plan Gratuito</h3>
                  <p className="text-sm text-purple-100">10 posts por mes</p>
                </div>
                <Button className="w-full" variant="outline">
                  Actualizar Plan
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Settings;
