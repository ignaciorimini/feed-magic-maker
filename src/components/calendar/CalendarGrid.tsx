
import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CalendarCard from './CalendarCard';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';

interface CalendarGridProps {
  entries: any[];
  onUpdateContent?: (entryId: string, platform: string, content: any) => Promise<void>;
  onUpdateImage?: (entryId: string, imageUrl: string | null) => Promise<void>;
  onGenerateImage?: (entryId: string, platform: string, topic: string, description: string) => Promise<void>;
}

const CalendarGrid = ({ entries, onUpdateContent }: CalendarGridProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  // Get scheduled entries for the current month
  const getScheduledEntries = () => {
    const scheduledEntries: Array<{
      entry: any;
      platform: string;
      scheduledDate: string;
    }> = [];

    entries.forEach(entry => {
      if (entry.platformContent) {
        Object.entries(entry.platformContent).forEach(([platform, content]: [string, any]) => {
          if (content?.scheduled_at) {
            scheduledEntries.push({
              entry,
              platform,
              scheduledDate: content.scheduled_at
            });
          }
        });
      }
    });

    return scheduledEntries;
  };

  const scheduledEntries = getScheduledEntries();

  // Get entries for a specific date
  const getEntriesForDate = (date: Date) => {
    return scheduledEntries.filter(({ scheduledDate }) => {
      const entryDate = new Date(scheduledDate);
      return isSameDay(entryDate, date);
    });
  };

  // Get entries for selected date
  const selectedDateEntries = selectedDate ? getEntriesForDate(selectedDate) : [];

  // Get days that have scheduled content
  const getDaysWithContent = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    return monthDays.filter(day => getEntriesForDate(day).length > 0);
  };

  const daysWithContent = getDaysWithContent();

  const handlePreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Calendar */}
      <div className="lg:col-span-1">
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                {format(currentDate, 'MMMM yyyy', { locale: es })}
              </CardTitle>
              <div className="flex space-x-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviousMonth}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextMonth}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              month={currentDate}
              onMonthChange={setCurrentDate}
              locale={es}
              modifiers={{
                hasContent: daysWithContent
              }}
              modifiersStyles={{
                hasContent: {
                  backgroundColor: '#dbeafe',
                  color: '#1e40af',
                  fontWeight: 'bold'
                }
              }}
              className="rounded-md border-0"
            />
            
            {/* Legend */}
            <div className="mt-4 space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-100 border border-blue-300 rounded"></div>
                <span className="text-xs text-gray-600">Días con contenido programado</span>
              </div>
              <div className="text-xs text-gray-500">
                Total de publicaciones programadas este mes: {scheduledEntries.filter(({ scheduledDate }) => {
                  const entryDate = new Date(scheduledDate);
                  return entryDate.getMonth() === currentDate.getMonth() && entryDate.getFullYear() === currentDate.getFullYear();
                }).length}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Scheduled Content for Selected Date */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                {selectedDate ? (
                  <>
                    Contenido programado para {format(selectedDate, 'dd MMMM yyyy', { locale: es })}
                    <Badge variant="secondary" className="ml-2">
                      {selectedDateEntries.length} publicación{selectedDateEntries.length === 1 ? '' : 'es'}
                    </Badge>
                  </>
                ) : (
                  'Selecciona una fecha'
                )}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {selectedDateEntries.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedDateEntries.map(({ entry, platform, scheduledDate }, index) => (
                  <CalendarCard
                    key={`${entry.id}-${platform}-${index}`}
                    entry={entry}
                    platform={platform}
                    scheduledDate={scheduledDate}
                    onUpdateContent={onUpdateContent}
                  />
                ))}
              </div>
            ) : selectedDate ? (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">
                  No hay contenido programado para esta fecha
                </p>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">
                  Selecciona una fecha en el calendario para ver el contenido programado
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CalendarGrid;
