import { User, Settings, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const ProfileSetup = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center space-x-3">
          <User className="w-8 h-8 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Configuración de Perfil</h1>
        </div>

        <div className="grid gap-6 max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="w-5 h-5" />
                <span>Información General</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="tu@email.com" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="webhook">URL del Webhook</Label>
                <Input id="webhook" placeholder="https://tu-webhook-url.com" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Directrices de Marca</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="brand-guidelines">Directrices de Marca</Label>
                <Textarea 
                  id="brand-guidelines" 
                  placeholder="Describe el tono, estilo y valores de tu marca..."
                  rows={4}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="posting-guidelines">Directrices de Publicación</Label>
                <Textarea 
                  id="posting-guidelines" 
                  placeholder="Describe cómo quieres que se publique tu contenido..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          <Button className="w-full">
            <Save className="w-4 h-4 mr-2" />
            Guardar Configuración
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProfileSetup;