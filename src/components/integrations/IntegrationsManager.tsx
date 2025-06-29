
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, ExternalLink, Play } from 'lucide-react';
import { credentialsService, UserCredential, IntegrationGuide } from '@/services/credentialsService';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import GoogleIntegration from './GoogleIntegration';
import MetaIntegration from './MetaIntegration';
import LinkedInIntegration from './LinkedInIntegration';
import WordPressIntegration from './WordPressIntegration';

const IntegrationsManager = () => {
  const [credentials, setCredentials] = useState<UserCredential[]>([]);
  const [guides, setGuides] = useState<IntegrationGuide[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const { user } = useAuth();

  const serviceNames = {
    google: 'Google Slides',
    meta: 'Meta (Instagram/Facebook)',
    linkedin: 'LinkedIn',
    wordpress: 'WordPress'
  };

  const serviceIcons = {
    google: '🔍',
    meta: '📘',
    linkedin: '💼',
    wordpress: '📝'
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    
    const [credentialsResult, guidesResult] = await Promise.all([
      credentialsService.getUserCredentials(),
      credentialsService.getIntegrationGuides()
    ]);

    if (credentialsResult.error) {
      toast({
        title: "Error al cargar credenciales",
        description: credentialsResult.error.message,
        variant: "destructive",
      });
    } else if (credentialsResult.data) {
      setCredentials(credentialsResult.data);
    }

    if (guidesResult.error) {
      console.error('Error loading guides:', guidesResult.error);
    } else if (guidesResult.data) {
      setGuides(guidesResult.data);
    }

    setLoading(false);
  };

  const getCredentialStatus = (service: string) => {
    const credential = credentials.find(c => c.service === service);
    
    if (!credential) {
      return { status: 'disconnected', label: 'No conectado', variant: 'secondary' };
    }

    if (credentialsService.isCredentialExpired(credential)) {
      return { status: 'expired', label: 'Expirado', variant: 'destructive' };
    }

    return { status: 'connected', label: 'Conectado', variant: 'default' };
  };

  const handleCredentialUpdate = () => {
    loadData();
  };

  const getGuideForService = (service: string) => {
    return guides.find(g => g.service === service);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600">Cargando integraciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">Integraciones Externas</h2>
        <p className="text-muted-foreground">
          Conecta tus cuentas para automatizar la publicación y gestión de contenido.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Vista General</TabsTrigger>
          <TabsTrigger value="google">Google</TabsTrigger>
          <TabsTrigger value="meta">Meta</TabsTrigger>
          <TabsTrigger value="linkedin">LinkedIn</TabsTrigger>
          <TabsTrigger value="wordpress">WordPress</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4">
            {Object.entries(serviceNames).map(([service, name]) => {
              const status = getCredentialStatus(service);
              const guide = getGuideForService(service);
              
              return (
                <Card key={service} className="hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{serviceIcons[service as keyof typeof serviceIcons]}</span>
                      <div>
                        <CardTitle className="text-lg">{name}</CardTitle>
                        <CardDescription className="max-w-md">
                          {guide?.description || `Integración con ${name}`}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={status.variant as any}>
                        {status.status === 'connected' && <CheckCircle className="w-3 h-3 mr-1" />}
                        {status.status === 'expired' && <AlertCircle className="w-3 h-3 mr-1" />}
                        {status.label}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {guide?.video_url && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(guide.video_url, '_blank')}
                          >
                            <Play className="w-4 h-4 mr-1" />
                            Ver Tutorial
                          </Button>
                        )}
                      </div>
                      <Button
                        onClick={() => setActiveTab(service)}
                        variant={status.status === 'connected' ? 'outline' : 'default'}
                      >
                        {status.status === 'connected' ? 'Gestionar' : 'Conectar'}
                        <ExternalLink className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {credentials.some(c => credentialsService.isCredentialExpired(c)) && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Algunas de tus integraciones han expirado. Por favor, reconecta las cuentas afectadas para continuar usando las funciones automatizadas.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="google">
          <GoogleIntegration 
            credential={credentials.find(c => c.service === 'google')}
            guide={getGuideForService('google')}
            onUpdate={handleCredentialUpdate}
          />
        </TabsContent>

        <TabsContent value="meta">
          <MetaIntegration 
            credential={credentials.find(c => c.service === 'meta')}
            guide={getGuideForService('meta')}
            onUpdate={handleCredentialUpdate}
          />
        </TabsContent>

        <TabsContent value="linkedin">
          <LinkedInIntegration 
            credential={credentials.find(c => c.service === 'linkedin')}
            guide={getGuideForService('linkedin')}
            onUpdate={handleCredentialUpdate}
          />
        </TabsContent>

        <TabsContent value="wordpress">
          <WordPressIntegration 
            credential={credentials.find(c => c.service === 'wordpress')}
            guide={getGuideForService('wordpress')}
            onUpdate={handleCredentialUpdate}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default IntegrationsManager;
