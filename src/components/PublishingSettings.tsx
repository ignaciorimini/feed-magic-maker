
import { useState } from 'react';
import { Calendar, Clock, Send, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import StatusBadge from './StatusBadge';

interface PublishingSettingsProps {
  entry: {
    id: string; // Changed from number to string
    topic: string;
    status: {
      instagram: 'published' | 'pending' | 'error';
      linkedin: 'published' | 'pending' | 'error';
      wordpress: 'published' | 'pending' | 'error';
    };
    platformContent: {
      instagram: { publishDate?: string };
      linkedin: { publishDate?: string };
      wordpress: { publishDate?: string };
    };
  };
  onClose: () => void;
  onUpdateSettings: (entryId: string, settings: any) => void; // Changed from number to string
}

const PublishingSettings = ({ entry, onClose, onUpdateSettings }: PublishingSettingsProps) => {
  const [publishDates, setPublishDates] = useState({
    instagram: entry.platformContent.instagram.publishDate || '',
    linkedin: entry.platformContent.linkedin.publishDate || '',
    wordpress: entry.platformContent.wordpress.publishDate || ''
  });

  const handleDateChange = (platform: string, date: string) => {
    setPublishDates(prev => ({ ...prev, [platform]: date }));
  };

  const handlePublishNow = (platform: string) => {
    const now = new Date().toISOString().slice(0, 16);
    setPublishDates(prev => ({ ...prev, [platform]: now }));
    
    toast({
      title: `Publicando en ${platform}`,
      description: "El contenido se publicará inmediatamente",
    });
  };

  const handleSave = () => {
    onUpdateSettings(entry.id, { publishDates });
    toast({
      title: "Configuración guardada",
      description: "Las fechas de publicación han sido actualizadas",
    });
    onClose();
  };

  const platforms = [
    { key: 'instagram', name: 'Instagram', icon: '📸' },
    { key: 'linkedin', name: 'LinkedIn', icon: '💼' },
    { key: 'wordpress', name: 'WordPress', icon: '📝' }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-white">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg">Configuración de Publicación</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="bg-gray-50 p-3 rounded-lg">
            <h4 className="font-medium text-sm text-gray-900 mb-1">{entry.topic}</h4>
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={entry.status.instagram} />
              <StatusBadge status={entry.status.linkedin} />
              <StatusBadge status={entry.status.wordpress} />
            </div>
          </div>

          <div className="space-y-4">
            <h5 className="font-medium text-sm text-gray-700">Fechas de publicación por plataforma</h5>
            
            {platforms.map((platform) => (
              <div key={platform.key} className="border border-gray-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{platform.icon}</span>
                    <span className="font-medium text-sm">{platform.name}</span>
                    <StatusBadge 
                      status={entry.status[platform.key as keyof typeof entry.status]} 
                    />
                  </div>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handlePublishNow(platform.key)}
                    className="text-xs h-7"
                    disabled={entry.status[platform.key as keyof typeof entry.status] === 'published'}
                  >
                    <Send className="w-3 h-3 mr-1" />
                    Publicar ahora
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor={`${platform.key}-date`} className="text-xs text-gray-600">
                    Fecha y hora programada
                  </Label>
                  <Input
                    id={`${platform.key}-date`}
                    type="datetime-local"
                    value={publishDates[platform.key as keyof typeof publishDates]}
                    onChange={(e) => handleDateChange(platform.key, e.target.value)}
                    className="text-sm"
                    disabled={entry.status[platform.key as keyof typeof entry.status] === 'published'}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex space-x-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={handleSave} className="flex-1">
              Guardar Configuración
            </Button>
            </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PublishingSettings;
