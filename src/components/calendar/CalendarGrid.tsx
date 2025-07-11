
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus, Clock, CalendarDays } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import ContentEditModal from '../ContentEditModal';
import { useTimezone } from '@/hooks/useTimezone';

interface ScheduledContent {
  id: string;
  topic: string;
  publishDate: string;
  platform: string;
  status: string;
  type: string;
  publishedLink?: string;
  description?: string;
  platformContent?: any;
  slideImages?: string[];
  imageUrl?: string;
  isScheduled?: boolean;
  entryId?: string;
}

interface CalendarGridProps {
  entries?: any[];
  onUpdateContent?: (entryId: string, platform: string, content: any) => Promise<void>;
  onUpdateImage?: (entryId: string, imageUrl: string | null) => Promise<void>;
  onGenerateImage?: (entryId: string, platform: string, topic: string, description: string) => Promise<void>;
}

const CalendarGrid = ({ entries = [], onUpdateContent, onUpdateImage, onGenerateImage }: CalendarGridProps) => {
  const { formatForDisplay, utcToLocal } = useTimezone();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarContent, setCalendarContent] = useState<ScheduledContent[]>([]);
  const [selectedContent, setSelectedContent] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    loadCalendarContent();
  }, [entries]);

  const loadCalendarContent = () => {
    const allContent: ScheduledContent[] = [];
    
    entries.forEach(entry => {
      // Check platforms array if exists
      if (entry.platforms && Array.isArray(entry.platforms)) {
        entry.platforms.forEach((platform: any) => {
          // Add scheduled content
          if (platform.scheduled_at) {
            allContent.push({
              id: `${entry.id}-${platform.platform}`,
              entryId: entry.id,
              topic: entry.topic,
              publishDate: platform.scheduled_at,
              platform: platform.platform,
              status: platform.status || 'pending',
              type: entry.type || 'Simple Post',
              description: entry.description,
              platformContent: platform,
              imageUrl: platform.image_url,
              isScheduled: true
            });
          }
          
          // Add published content (immediate publications)
          if (platform.published_at && platform.status === 'published') {
            allContent.push({
              id: `${entry.id}-${platform.platform}-published`,
              entryId: entry.id,
              topic: entry.topic,
              publishDate: platform.published_at,
              platform: platform.platform,
              status: 'published',
              type: entry.type || 'Simple Post',
              description: entry.description,
              platformContent: platform,
              imageUrl: platform.image_url,
              publishedLink: platform.published_url,
              isScheduled: false
            });
          }
        });
      }
      
      // Check platformContent if exists (compatibility with previous structure)
      if (entry.platformContent) {
        Object.entries(entry.platformContent).forEach(([platform, content]) => {
          const typedContent = content as any;
          
          // Add scheduled content
          const scheduledDate = typedContent?.scheduled_at || typedContent?.publishDate;
          if (scheduledDate) {
            allContent.push({
              id: `${entry.id}-${platform}`,
              entryId: entry.id,
              topic: entry.topic,
              publishDate: scheduledDate,
              platform: platform,
              status: entry.status?.[platform] || 'pending',
              type: entry.type || 'Simple Post',
              publishedLink: entry.publishedLinks?.[platform],
              description: entry.description,
              platformContent: typedContent,
              slideImages: entry.slideImages,
              imageUrl: typedContent.image_url || entry.imageUrl,
              isScheduled: true
            });
          }
          
          // Add published content (immediate publications)
          if (typedContent?.published_at && entry.status?.[platform] === 'published') {
            allContent.push({
              id: `${entry.id}-${platform}-published`,
              entryId: entry.id,
              topic: entry.topic,
              publishDate: typedContent.published_at,
              platform: platform,
              status: 'published',
              type: entry.type || 'Simple Post',
              publishedLink: entry.publishedLinks?.[platform] || typedContent.published_url,
              description: entry.description,
              platformContent: typedContent,
              slideImages: entry.slideImages,
              imageUrl: typedContent.image_url || entry.imageUrl,
              isScheduled: false
            });
          }
        });
      }
    });
    
    console.log('Loaded calendar content:', allContent);
    setCalendarContent(allContent);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getContentForDay = (date: Date) => {
    if (!date) return [];
    
    return calendarContent.filter(content => {
      const contentDate = utcToLocal(content.publishDate);
      const contentDay = contentDate.toDateString();
      const targetDay = date.toDateString();
      
      return contentDay === targetDay;
    });
  };

  const handleContentClick = (content: ScheduledContent) => {
    // Find the original entry
    const entryId = content.entryId || content.id.split('-')[0];
    const platform = content.platform;
    const entry = entries.find(e => e.id === entryId);
    
    if (entry) {
      setSelectedContent({
        entry,
        platform,
        content: content.platformContent
      });
      setShowEditModal(true);
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const formatTime = (dateStr: string) => {
    const localDate = utcToLocal(dateStr);
    return localDate.toLocaleTimeString('es-ES', {
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

  const days = getDaysInMonth(currentDate);
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <CalendarIcon className="w-5 h-5" />
              <span>Calendario de Publicaciones</span>
              <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-800">
                <CalendarDays className="w-3 h-3 mr-1" />
                {calendarContent.length} publicaciones
              </Badge>
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('prev')}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-lg font-semibold min-w-[180px] text-center">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('next')}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1 mb-4">
            {dayNames.map(day => (
              <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => {
              const dayContent = day ? getContentForDay(day) : [];
              const isToday = day && day.toDateString() === new Date().toDateString();
              
              return (
                <div
                  key={index}
                  className={`min-h-[120px] p-2 border rounded-md ${
                    day ? 'bg-white hover:bg-gray-50' : 'bg-gray-50'
                  } ${isToday ? 'ring-2 ring-blue-500' : ''}`}
                >
                  {day && (
                    <>
                      <div className={`text-sm font-medium mb-2 ${
                        isToday ? 'text-blue-600' : 'text-gray-900'
                      }`}>
                        {day.getDate()}
                      </div>
                      
                      <div className="space-y-1">
                        {dayContent.map((content, contentIndex) => (
                          <div
                            key={contentIndex}
                            onClick={() => handleContentClick(content)}
                            className="cursor-pointer p-1 rounded text-xs hover:shadow-md transition-all hover:scale-105"
                          >
                            <div className={`px-2 py-1 rounded text-xs border ${
                              platformColors[content.platform as keyof typeof platformColors] || 'bg-gray-100'
                            }`}>
                              <div className="flex items-center space-x-1 mb-1">
                                {content.isScheduled ? (
                                  <CalendarDays className="w-3 h-3" />
                                ) : (
                                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                                )}
                                <span className="font-medium truncate">{content.topic}</span>
                              </div>
                              <div className="text-xs opacity-75 flex items-center justify-between">
                                <span>{formatTime(content.publishDate)}</span>
                                <span className="capitalize">{content.platform}</span>
                              </div>
                              {!content.isScheduled && (
                                <div className="text-xs text-green-600 font-medium mt-1">
                                  Publicado
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {selectedContent && showEditModal && (
        <ContentEditModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          platform={selectedContent.platform}
          content={selectedContent.content}
          contentType={selectedContent.entry.type}
          onSave={onUpdateContent ? (content) => onUpdateContent(selectedContent.entry.id, selectedContent.platform, content) : async () => {}}
          entryId={`${selectedContent.entry.id}__${selectedContent.platform}`}
          topic={selectedContent.entry.topic}
          description={selectedContent.entry.description}
          slideImages={selectedContent.entry.slideImages}
          imageUrl={selectedContent.content.image_url}
          onUpdateImage={onUpdateImage}
          onGenerateImage={onGenerateImage}
        />
      )}
    </>
  );
};

export default CalendarGrid;
