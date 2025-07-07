
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, FileText, Presentation, Eye } from 'lucide-react';
import { formatTimeOnly } from '@/utils/timezoneUtils';
import ContentEditModal from '../ContentEditModal';

interface CalendarCardProps {
  entry: {
    id: string;
    topic: string;
    description: string;
    type: string;
    platformContent: {
      [key: string]: {
        text: string;
        images: string[];
        scheduled_at?: string;
        title?: string;
        description?: string;
        slug?: string;
        slidesURL?: string;
      };
    };
    slideImages?: string[];
  };
  platform: string;
  scheduledDate: string;
  onUpdateContent?: (entryId: string, platform: string, content: any) => Promise<void>;
}

const CalendarCard = ({ entry, platform, scheduledDate, onUpdateContent }: CalendarCardProps) => {
  const [showEditModal, setShowEditModal] = useState(false);
  
  const platformColors = {
    instagram: 'bg-gradient-to-r from-purple-500 to-pink-500',
    linkedin: 'bg-gradient-to-r from-blue-600 to-blue-700',
    wordpress: 'bg-gradient-to-r from-gray-600 to-gray-700',
    twitter: 'bg-gradient-to-r from-black to-gray-800'
  };

  const platformNames = {
    instagram: 'Instagram',
    linkedin: 'LinkedIn',
    wordpress: 'WordPress',
    twitter: 'X (Twitter)'
  };

  const TypeIcon = entry.type === 'Simple Post' ? FileText : Presentation;
  const platformColor = platformColors[platform as keyof typeof platformColors] || 'bg-gray-500';
  const platformName = platformNames[platform as keyof typeof platformNames] || platform;

  const truncateText = (text: string, maxLength: number = 60) => {
    if (!text || text.length <= maxLength) return text || '';
    return text.substring(0, maxLength) + '...';
  };

  const handleCardClick = () => {
    setShowEditModal(true);
  };

  const handleUpdateContent = async (updatedContent: any) => {
    if (onUpdateContent) {
      await onUpdateContent(entry.id, platform, updatedContent);
    }
  };

  return (
    <>
      <Card 
        className="h-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200 cursor-pointer group"
        onClick={handleCardClick}
      >
        <CardContent className="p-3 h-full flex flex-col">
          {/* Header with platform and time */}
          <div className="flex items-center justify-between mb-2">
            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white ${platformColor}`}>
              {platformName}
            </div>
            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
              <Clock className="w-3 h-3 mr-1" />
              {formatTimeOnly(scheduledDate)}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 space-y-2">
            <div className="flex items-start space-x-2">
              <TypeIcon className="w-4 h-4 text-gray-500 dark:text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm text-gray-900 dark:text-white line-clamp-2 leading-tight">
                  {entry.topic}
                </h4>
              </div>
            </div>
            
            <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-3 leading-relaxed">
              {truncateText(entry.description, 80)}
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100 dark:border-gray-700">
            <Badge variant="outline" className="text-xs">
              {entry.type}
            </Badge>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <Eye className="w-4 h-4 text-gray-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Modal */}
      {showEditModal && (
        <ContentEditModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          platform={platform as 'instagram' | 'linkedin' | 'wordpress' | 'twitter'}
          content={entry.platformContent[platform]}
          contentType={entry.type}
          onSave={handleUpdateContent}
          entryId={`${entry.id}__${platform}`}
          topic={entry.topic}
          description={entry.description}
          slideImages={entry.slideImages}
          imageUrl={entry.platformContent[platform]?.images?.[0]}
        />
      )}
    </>
  );
};

export default CalendarCard;
