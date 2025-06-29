
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Trash2, ExternalLink, Play, CheckCircle, AlertCircle } from 'lucide-react';
import { credentialsService, UserCredential, IntegrationGuide } from '@/services/credentialsService';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

interface WordPressIntegrationProps {
  credential?: UserCredential;
  guide?: IntegrationGuide;
  onUpdate: () => void;
}

const WordPressIntegration: React.FC<WordPressIntegrationProps> = ({ credential, guide, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    access_token: credential?.access_token || '', // API Key
    client_id: credential?.client_id || '', // WordPress URL
    client_secret: credential?.client_secret || '' // Username (optional)
  });
  const { user } = useAuth();

  const isConnected = !!credential;

  const handleSave = async () => {
    if (!user) return;

    setLoading(true);
    
    try {
      const { error } = await credentialsService.upsertCredential({
        user_id: user.id,
        service: 'wordpress',
        credential_type: 'api_key',
        access_token: formData.access_token || null, // API Key
        client_id: formData.client_id || null, // WordPress URL
        client_secret: formData.client_secret || null // Username
      });

      if (error) {
        toast({
          title: "Error al guardar credenciales",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Credenciales guardadas",
          description: "Tu sitio WordPress ha sido conectado exitosamente.",
        });
        setShowForm(false);
        onUpdate();
      }
    } catch (error) {
      toast({
        title: "Error inesperado",
        description: "Ocurrió un error al conectar con WordPress.",
        variant: "destructive",
      });
    }
    
    setLoading(false);
  };

  const handleDisconnect = async () => {
    setLoading(true);
    
    const { error } = await credentialsService.deleteCredential('wordpress');
    
    if (error) {
      toast({
        title: "Error al desconectar",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Sitio desconectado",
        description: "Tu sitio WordPress ha sido desconectado.",
      });
      onUpdate();
    }
    
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">📝</span>
              <div>
                <CardTitle>WordPress Integration</CardTitle>
                <CardDescription>
                  Conecta tu sitio WordPress para publicación automática de artículos
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {isConnected && (
                <Badge variant="default">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Conectado
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {guide?.description && (
            <Alert>
              <AlertDescription>{guide.description}</AlertDescription>
            </Alert>
          )}

          {guide?.video_url && (
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(guide.video_url, '_blank')}
              >
                <Play className="w-4 h-4 mr-1" />
                Ver Tutorial
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open('https://developer.wordpress.org/rest-api/', '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-1" />
                WordPress API Docs
              </Button>
            </div>
          )}

          {isConnected && !showForm ? (
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div>
                <p className="font-medium text-green-800">WordPress conectado exitosamente</p>
                <p className="text-sm text-green-600">
                  Sitio: {credential.client_id || 'No especificado'}
                </p>
                <p className="text-sm text-green-600">
                  Conectado el {new Date(credential.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
                  Editar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDisconnect}
                  disabled={loading}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {!showForm && (
                <Button onClick={() => setShowForm(true)}>
                  Conectar WordPress Site
                </Button>
              )}

              {showForm && (
                <div className="space-y-4 p-4 border rounded-lg">
                  <div className="space-y-2">
                    <Label htmlFor="wp_url">WordPress Site URL</Label>
                    <Input
                      id="wp_url"
                      value={formData.client_id}
                      onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                      placeholder="https://tu-sitio-wordpress.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="wp_api_key">API Key / Application Password</Label>
                    <Input
                      id="wp_api_key"
                      type="password"
                      value={formData.access_token}
                      onChange={(e) => setFormData({ ...formData, access_token: e.target.value })}
                      placeholder="Tu WordPress API Key"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="wp_username">Username (Opcional)</Label>
                    <Input
                      id="wp_username"
                      value={formData.client_secret}
                      onChange={(e) => setFormData({ ...formData, client_secret: e.target.value })}
                      placeholder="Tu username de WordPress"
                    />
                  </div>

                  <Alert>
                    <AlertDescription>
                      Para conectar WordPress, necesitas generar una "Application Password" desde tu perfil de usuario en WordPress.
                    </AlertDescription>
                  </Alert>

                  <div className="flex space-x-2">
                    <Button onClick={handleSave} disabled={loading}>
                      {loading ? 'Guardando...' : 'Guardar Credenciales'}
                    </Button>
                    <Button variant="outline" onClick={() => setShowForm(false)}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default WordPressIntegration;
