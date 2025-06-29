
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

interface LinkedInIntegrationProps {
  credential?: UserCredential;
  guide?: IntegrationGuide;
  onUpdate: () => void;
}

const LinkedInIntegration: React.FC<LinkedInIntegrationProps> = ({ credential, guide, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    access_token: credential?.access_token || '',
    client_id: credential?.client_id || '',
    client_secret: credential?.client_secret || ''
  });
  const { user } = useAuth();

  const isConnected = !!credential;
  const isExpired = credential ? credentialsService.isCredentialExpired(credential) : false;

  const handleSave = async () => {
    if (!user) return;

    setLoading(true);
    
    try {
      // Validar token si está presente
      if (formData.access_token) {
        const validation = await credentialsService.validateOAuthCredentials('linkedin', formData.access_token);
        if (!validation.valid) {
          toast({
            title: "Token inválido",
            description: validation.error || "El token de acceso no es válido",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
      }

      const { error } = await credentialsService.upsertCredential({
        user_id: user.id,
        service: 'linkedin',
        credential_type: 'oauth',
        access_token: formData.access_token || null,
        client_id: formData.client_id || null,
        client_secret: formData.client_secret || null
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
          description: "Tu cuenta de LinkedIn ha sido conectada exitosamente.",
        });
        setShowForm(false);
        onUpdate();
      }
    } catch (error) {
      toast({
        title: "Error inesperado",
        description: "Ocurrió un error al conectar con LinkedIn.",
        variant: "destructive",
      });
    }
    
    setLoading(false);
  };

  const handleDisconnect = async () => {
    setLoading(true);
    
    const { error } = await credentialsService.deleteCredential('linkedin');
    
    if (error) {
      toast({
        title: "Error al desconectar",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Cuenta desconectada",
        description: "Tu cuenta de LinkedIn ha sido desconectada.",
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
              <span className="text-2xl">💼</span>
              <div>
                <CardTitle>LinkedIn Integration</CardTitle>
                <CardDescription>
                  Conecta tu cuenta de LinkedIn para publicar contenido en tu perfil o página de empresa
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {isConnected && (
                <Badge variant={isExpired ? "destructive" : "default"}>
                  {isExpired ? (
                    <>
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Expirado
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Conectado
                    </>
                  )}
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
                onClick={() => window.open('https://www.linkedin.com/developers/apps', '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-1" />
                LinkedIn Developers
              </Button>
            </div>
          )}

          {isConnected && !showForm ? (
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div>
                <p className="font-medium text-blue-800">LinkedIn conectado exitosamente</p>
                <p className="text-sm text-blue-600">
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
                  Conectar LinkedIn Account
                </Button>
              )}

              {showForm && (
                <div className="space-y-4 p-4 border rounded-lg">
                  <div className="space-y-2">
                    <Label htmlFor="linkedin_access_token">Access Token</Label>
                    <Input
                      id="linkedin_access_token"
                      value={formData.access_token}
                      onChange={(e) => setFormData({ ...formData, access_token: e.target.value })}
                      placeholder="Tu LinkedIn Access Token"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="linkedin_client_id">Client ID</Label>
                    <Input
                      id="linkedin_client_id"
                      value={formData.client_id}
                      onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                      placeholder="Tu LinkedIn Client ID"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="linkedin_client_secret">Client Secret</Label>
                    <Input
                      id="linkedin_client_secret"
                      type="password"
                      value={formData.client_secret}
                      onChange={(e) => setFormData({ ...formData, client_secret: e.target.value })}
                      placeholder="Tu LinkedIn Client Secret"
                    />
                  </div>

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

export default LinkedInIntegration;
