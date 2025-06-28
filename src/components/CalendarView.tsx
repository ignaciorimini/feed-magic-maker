
import { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, Clock, ExternalLink, Filter } from 'lucide-react';
import { contentService } from '@/services/contentService';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface ScheduledContent {
  id: string;
  topic: string;
  publishDate: string;
  platform: string;
  status: string;
  type: string;
  publishedLink?: string;
  description?: string;
}

interface CalendarViewProps {
  entries?: any[];
}

interface PlatformContent {
  publishDate?: string;
  [key: string]: any;
}

const CalendarView = ({ entries = [] }: CalendarViewProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [scheduledContent, setScheduledContent] = useState<ScheduledContent[]>([]);
  const [filteredPlatforms, setFilteredPlatforms] = useState<string[]>(['instagram', 'linkedin', 'wordpress', 'twitter']);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadScheduledContent();
  }, [entries]);

  const loadScheduledContent = () => {
    try {
      setIsLoading(true);
      
      const allScheduledContent: ScheduledContent[] = [];
      
      entries.forEach(entry => {
        Object.entries(entry.platformContent || {}).forEach(([platform, content]) => {
          const typedContent = content as PlatformContent;
          if (typedContent && typeof typedContent === 'object' && typedContent.publishDate) {
            allScheduledContent.push({
              id: `${entry.id}-${platform}`,
              topic: entry.topic,
              publishDate: typedContent.publishDate,
              platform: platform,
              status: entry.status?.[platform as keyof typeof entry.status] || 'pending',
              type: entry.type || 'Simple Post',
              publishedLink: entry.publishedLinks?.[platform as keyof typeof entry.publishedLinks],
              description: entry.description
            });
          }
        });
      });
      
      setScheduledContent(allScheduledContent);
    } catch (error) {
      console.error('Error loading scheduled content:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getContentForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return scheduledContent.filter(content => 
      content.publishDate.startsWith(dateStr) && 
      filteredPlatforms.includes(content.platform)
    );
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const platformColors = {
    instagram: 'bg-pink-100 text-pink-800 border-pink-200',
    linkedin: 'bg-blue-100 text-blue-800 border-blue-200',
    wordpress: 'bg-gray-100 text-gray-800 border-gray-200',
    twitter: 'bg-gray-900 text-white border-gray-700'
  };

  const statusColors = {
    published: 'bg-green-100 text-green-800 border-green-200',
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    error: 'bg-red-100 text-red-800 border-red-200'
  };

  const contentForSelectedDate = selectedDate ? getContentForDate(selectedDate) : [];

  const handlePlatformFilter = (platform: string, checked: boolean) => {
    if (checked) {
      setFilteredPlatforms(prev => [...prev, platform]);
    } else {
      setFilteredPlatforms(prev => prev.filter(p => p !== platform));
    }
  };

  const getDatesWithContent = () => {
    const dates = new Set<string>();
    scheduledContent.forEach(content => {
      if (filteredPlatforms.includes(content.platform)) {
        dates.add(content.publishDate.split('T')[0]);
      }
    });
    return Array.from(dates).map(dateStr => new Date(dateStr));
  };

  const datesWithContent = getDatesWithContent();

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <CalendarIcon className="w-5 h-5" />
          <span>Calendario de Publicaciones</span>
          <Badge variant="outline" className="ml-auto">
            {scheduledContent.length} programadas
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Calendar */}
          <div className="space-y-4">
            {/* Platform Filters */}
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-600" />
                <Label className="text-sm font-medium text-gray-700">Filtrar por plataforma</Label>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: 'instagram', name: 'Instagram', color: 'text-pink-600' },
                  { key: 'linkedin', name: 'LinkedIn', color: 'text-blue-600' },
                  { key: 'wordpress', name: 'WordPress', color: 'text-gray-600' },
                  { key: 'twitter', name: 'X (Twitter)', color: 'text-gray-800' }
                ].map(platform => (
                  <div key={platform.key} className="flex items-center space-x-2">
                    <Checkbox
                      id={platform.key}
                      checked={filteredPlatforms.includes(platform.key)}
                      onCheckedChange={(checked) => handlePlatformFilter(platform.key, checked as boolean)}
                    />
                    <Label htmlFor={platform.key} className={`text-xs cursor-pointer ${platform.color}`}>
                      {platform.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border"
              modifiers={{
                hasContent: (date) => datesWithContent.some(d => 
                  d.toDateString() === date.toDateString()
                )
              }}
              modifiersStyles={{
                hasContent: {
                  backgroundColor: '#dbeafe',
                  color: '#1e40af',
                  fontWeight: 'bold'
                }
              }}
            />
            <div className="text-xs text-gray-500">
              <p>• Las fechas en azul tienen publicaciones programadas</p>
            </div>
          </div>

          {/* Content for selected date */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">
              {selectedDate ? (
                `Publicaciones para ${selectedDate.toLocaleDateString('es-ES', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}`
              ) : (
                'Selecciona una fecha'
              )}
            </h3>

            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Cargando...</p>
              </div>
            ) : contentForSelectedDate.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {contentForSelectedDate
                  .sort((a, b) => new Date(a.publishDate).getTime() - new Date(b.publishDate).getTime())
                  .map((content) => (
                  <div key={content.id} className="border rounded-lg p-4 space-y-3 bg-white shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm text-gray-900 truncate">{content.topic}</h4>
                        {content.description && (
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">{content.description}</p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 ml-2">
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${platformColors[content.platform as keyof typeof platformColors]}`}
                        >
                          {content.platform === 'twitter' ? 'X' : content.platform}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatTime(content.publishDate)}</span>
                        </div>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${statusColors[content.status as keyof typeof statusColors]}`}
                        >
                          {content.status}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {content.type}
                        </Badge>
                      </div>
                      
                      {content.publishedLink && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(content.publishedLink, '_blank')}
                          className="h-6 w-6 p-0"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <CalendarIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No hay publicaciones programadas para esta fecha</p>
                {filteredPlatforms.length < 4 && (
                  <p className="text-xs text-gray-400 mt-1">
                    (Algunas plataformas están filtradas)
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CalendarView;
