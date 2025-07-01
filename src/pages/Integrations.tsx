import { Link as LinkIcon, Settings, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const Integrations = () => {
  const integrations = [
    {
      name: 'Instagram',
      description: 'Conecta tu cuenta de Instagram para publicar automáticamente',
      status: 'disconnected',
      icon: '📷'
    },
    {
      name: 'LinkedIn',
      description: 'Publica contenido profesional en tu perfil de LinkedIn',
      status: 'disconnected',
      icon: '💼'
    },
    {
      name: 'WordPress',
      description: 'Publica artículos directamente en tu blog de WordPress',
      status: 'disconnected',
      icon: '📝'
    },
    {
      name: 'Twitter/X',
      description: 'Comparte contenido y hilos en Twitter/X',
      status: 'disconnected',
      icon: '🐦'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <LinkIcon className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Integraciones</h1>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {integrations.map((integration) => (
            <Card key={integration.name} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{integration.icon}</span>
                    <span>{integration.name}</span>
                  </div>
                  {integration.status === 'connected' ? (
                    <Badge variant="outline" className="text-green-600 border-green-200">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Conectado
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-gray-500">
                      Desconectado
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">{integration.description}</p>
                <Button 
                  variant={integration.status === 'connected' ? 'outline' : 'default'}
                  className="w-full"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  {integration.status === 'connected' ? 'Configurar' : 'Conectar'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Configuración de Webhook</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Settings className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Configuración de Integraciones
              </h3>
              <p className="text-gray-500 mb-4">
                Las integraciones con redes sociales estarán disponibles próximamente.
              </p>
              <Badge variant="outline">En Desarrollo</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Integrations;