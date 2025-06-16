
import { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';
import { contentService } from '@/services/contentService';

interface ScheduledContent {
  id: string;
  topic: string;
  publishDate: string;
  platform: string;
  status: string;
}

const CalendarView = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [scheduledContent, setScheduledContent] = useState<ScheduledContent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadScheduledContent();
  }, []);

  const loadScheduledContent = async () => {
    try {
      setIsLoading(true);
      // Aquí deberías implementar la función en contentService para obtener contenido programado
      // const { data } = await contentService.getScheduledContent();
      // setScheduledContent(data || []);
      
      // Por ahora uso datos de ejemplo
      setScheduledContent([]);
    } catch (error) {
      console.error('Error loading scheduled content:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getContentForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return scheduledContent.filter(content => 
      content.publishDate.startsWith(dateStr)
    );
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const platformColors = {
    instagram: 'bg-pink-100 text-pink-800',
    linkedin: 'bg-blue-100 text-blue-800',
    wordpress: 'bg-gray-100 text-gray-800',
    twitter: 'bg-black text-white'
  };

  const contentForSelectedDate = selectedDate ? getContentForDate(selectedDate) : [];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <CalendarIcon className="w-5 h-5" />
          <span>Calendario de Publicaciones</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Calendar */}
          <div className="space-y-4">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border"
              modifiers={{
                hasContent: (date) => getContentForDate(date).length > 0
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
              <div className="space-y-3">
                {contentForSelectedDate.map((content) => (
                  <div key={content.id} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm">{content.topic}</h4>
                      <Badge 
                        variant="outline" 
                        className={platformColors[content.platform as keyof typeof platformColors]}
                      >
                        {content.platform}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      <span>{formatTime(content.publishDate)}</span>
                      <Badge variant="outline">
                        {content.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <CalendarIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No hay publicaciones programadas para esta fecha</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CalendarView;
