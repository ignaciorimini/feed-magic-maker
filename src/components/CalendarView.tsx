
import CalendarGrid from './calendar/CalendarGrid';

interface CalendarViewProps {
  entries?: any[];
  onUpdateContent?: (entryId: string, platform: string, content: any) => Promise<void>;
  onUpdateImage?: (entryId: string, imageUrl: string | null) => Promise<void>;
  onGenerateImage?: (entryId: string, platform: string, topic: string, description: string) => Promise<void>;
}

const CalendarView = ({ entries = [], onUpdateContent, onUpdateImage, onGenerateImage }: CalendarViewProps) => {
  return (
    <CalendarGrid 
      entries={entries}
      onUpdateContent={onUpdateContent}
      onUpdateImage={onUpdateImage}
      onGenerateImage={onGenerateImage}
    />
  );
};

export default CalendarView;
