
import { useState } from 'react';
import { Calendar as CalendarIcon, Clock, Send, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import StatusBadge from './StatusBadge';
import { cn } from '@/lib/utils';

interface PublishingSettingsProps {
  entry: {
    id: string;
    topic: string;
    status: {
      instagram: 'published' | 'pending' | 'error';
      linkedin: 'published' | 'pending' | 'error';
      wordpress: 'published' | 'pending' | 'error';
      twitter: 'published' | 'pending' | 'error';
    };
    platformContent: {
      instagram: { publishDate?: string };
      linkedin: { publishDate?: string };
      wordpress: { publishDate?: string };
      twitter: { publishDate?: string };
    };
  };
  onClose: () => void;
  onUpdateSettings: (entryId: string, settings: any) => void;
}

const PublishingSettings = ({ entry, onClose, onUpdateSettings }: PublishingSettingsProps) => {
  const [publishDates, setPublishDates] = useState({
    instagram: entry.platformContent.instagram.publishDate || '',
    linkedin: entry.platformContent.linkedin.publishDate || '',
    wordpress: entry.platformContent.wordpress.publishDate || '',
    twitter: entry.platformContent.twitter?.publishDate || ''
  });

  const [selectedDates, setSelectedDates] = useState<{[key: string]: Date | undefined}>({
    instagram: entry.platformContent.instagram.publishDate ? new Date(entry.platformContent.instagram.publishDate) : undefined,
    linkedin: entry.platformContent.linkedin.publishDate ? new Date(entry.platformContent.linkedin.publishDate) : undefined,
    wordpress: entry.platformContent.wordpress.publishDate ? new Date(entry.platformContent.wordpress.publishDate) : undefined,
    twitter: entry.platformContent.twitter?.publishDate ? new Date(entry.platformContent.twitter.publishDate) : undefined
  });

  const handleDateSelect = (platform: string, date: Date | undefined) => {
    setSelectedDates(prev => ({ ...prev, [platform]: date }));
    if (date) {
      // Set time to current time when date is selected
      const now = new Date();
      const dateWithTime = new Date(date);
      dateWithTime.setHours(now.getHours(), now.getMinutes());
      const isoString = dateWithTime.toISOString().slice(0, 16);
      setPublishDates(prev => ({ ...prev, [platform]: isoString }));
    }
  };

  const handleTimeChange = (platform: string, time: string) => {
    setPublishDates(prev => ({ ...prev, [platform]: time }));
  };

  const handlePublishNow = (platform: string) => {
    const now = new Date().toISOString().slice(0, 16);
    setPublishDates(prev => ({ ...prev, [platform]: now }));
    setSelectedDates(prev => ({ ...prev, [platform]: new Date() }));
    
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
    { key: 'wordpress', name: 'WordPress', icon: '📝' },
    { key: 'twitter', name: 'X (Twitter)', icon: '🐦' }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl bg-white max-h-[90vh] overflow-y-auto">
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
              <StatusBadge platform="instagram" status={entry.status.instagram} />
              <StatusBadge platform="linkedin" status={entry.status.linkedin} />
              <StatusBadge platform="wordpress" status={entry.status.wordpress} />
              <StatusBadge platform="twitter" status={entry.status.twitter} />
            </div>
          </div>

          <div className="space-y-4">
            <h5 className="font-medium text-sm text-gray-700">Fechas de publicación por plataforma</h5>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {platforms.map((platform) => (
                <div key={platform.key} className="border border-gray-200 rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{platform.icon}</span>
                      <span className="font-medium text-sm">{platform.name}</span>
                      <StatusBadge 
                        platform={platform.key as any} 
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
                      Ahora
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <Label className="text-xs text-gray-600 mb-2 block">
                          Seleccionar fecha
                        </Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !selectedDates[platform.key] && "text-muted-foreground"
                              )}
                              disabled={entry.status[platform.key as keyof typeof entry.status] === 'published'}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {selectedDates[platform.key] ? format(selectedDates[platform.key]!, "PPP") : <span>Seleccionar fecha</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={selectedDates[platform.key]}
                              onSelect={(date) => handleDateSelect(platform.key, date)}
                              initialFocus
                              className="pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      
                      <div>
                        <Label className="text-xs text-gray-600 mb-2 block">
                          Hora específica
                        </Label>
                        <Input
                          type="time"
                          value={publishDates[platform.key as keyof typeof publishDates] ? 
                            publishDates[platform.key as keyof typeof publishDates].slice(11, 16) : ''}
                          onChange={(e) => {
                            const currentDate = selectedDates[platform.key] || new Date();
                            const dateStr = currentDate.toISOString().slice(0, 10);
                            handleTimeChange(platform.key, `${dateStr}T${e.target.value}`);
                          }}
                          className="text-sm"
                          disabled={entry.status[platform.key as keyof typeof entry.status] === 'published'}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
