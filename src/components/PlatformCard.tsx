
import { useState } from 'react';
import { Calendar, Edit, ExternalLink, Download, MoreVertical, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import StatusBadge from './StatusBadge';
import ContentEditModal from './ContentEditModal';

interface PlatformCardProps {
  entry: {
    id: string;
    topic: string;
    description: string;
    type: string;
    createdDate: string;
    status: {
      instagram: 'published' | 'pending' | 'error';
      linkedin: 'published' | 'pending' | 'error';
      wordpress: 'published' | 'pending' | 'error';
    };
    platformContent: {
      instagram: any;
      linkedin: any;
      wordpress: any;
    };
    slideImages?: string[];
    publishedLinks?: {
      instagram?: string;
      linkedin?: string;
      wordpress?: string;
    };
  };
  platform: 'instagram' | 'linkedin' | 'wordpress';
  onUpdateContent: (entryId: string, platform: string, content: any) => void;
  onDeleteEntry: (entryId: string, platform: string) => void;
  onDownloadSlides?: (entryId: string, slidesURL: string) => void;
}

const PlatformCard = ({ entry, platform, onUpdateContent, onDeleteEntry, onDownloadSlides }: PlatformCardProps) => {
  const [showEditModal, setShowEditModal] = useState(false);

  const platformConfig = {
    instagram: {
      name: 'Instagram',
      gradient: 'from-pink-500 to-rose-500',
      bgGradient: 'from-pink-50 to-rose-50',
      borderColor: 'border-pink-200'
    },
    linkedin: {
      name: 'LinkedIn',
      gradient: 'from-blue-500 to-cyan-500',
      bgGradient: 'from-blue-50 to-cyan-50',
      borderColor: 'border-blue-200'
    },
    wordpress: {
      name: 'WordPress',
      gradient: 'from-gray-500 to-slate-500',
      bgGradient: 'from-gray-50 to-slate-50',
      borderColor: 'border-gray-200'
    }
  };

  const config = platformConfig[platform];
  const content = entry.platformContent[platform];
  const status = entry.status[platform];
  const publishedLink = entry.publishedLinks?.[platform];

  const truncateText = (text: string, maxLength: number = 60) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const hasSlides = entry.slideImages && entry.slideImages.length > 0;
  const isSlidePost = entry.type === 'Slide Post';

  const handleDelete = () => {
    onDeleteEntry(entry.id, platform);
  };

  const handleDownloadSlides = () => {
    if (content?.slidesURL && onDownloadSlides) {
      onDownloadSlides(entry.id, content.slidesURL);
    }
  };

  return (
    <>
      {/* Ajustamos el alto de la card y sus hijos para ser consistentes */}
      <Card className={`
        bg-gradient-to-br ${config.bgGradient} ${config.borderColor} border-2 hover:shadow-xl transition-all duration-300 group
        aspect-[4/5] flex flex-col min-h-[400px] h-full 
      `}>
        {/* Header */}
        <CardHeader className="p-4 pb-2 flex-shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold text-white bg-gradient-to-r ${config.gradient} mb-2`}>
                {config.name}
              </div>
              <h3 className="font-bold text-gray-900 text-sm leading-tight mb-1">
                {entry.topic}
              </h3>
              <Badge variant="outline" className="text-xs">
                {entry.type}
              </Badge>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem 
                  onClick={handleDelete}
                  className="text-red-600 focus:text-red-600 focus:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        {/* Content */}
        <CardContent className="flex-1 flex flex-col p-4 pt-2 space-y-3 min-h-[250px] overflow-hidden">
          {/* Description */}
          <p className="text-xs text-gray-600 line-clamp-2">
            {truncateText(entry.description, 80)}
          </p>

          {/* Slides Carousel */}
          {isSlidePost && hasSlides && (
            <div className="flex-1 min-h-0 flex flex-col justify-center">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-2">
                Slides ({entry.slideImages!.length})
              </span>
              <div className="w-full aspect-video bg-white rounded-md overflow-hidden border relative">
                <Carousel className="w-full h-full">
                  <CarouselContent className="h-full">
                    {entry.slideImages!.map((imageUrl, index) => (
                      <CarouselItem key={index} className="h-full">
                        <div className="w-full h-full">
                          <img 
                            src={imageUrl} 
                            alt={`Slide ${index + 1}`}
                            className="w-full h-full object-cover aspect-video"
                            style={{ maxHeight: '180px', maxWidth: '100%' }}
                          />
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="h-7 w-7 top-1/2 -translate-y-1/2 left-2 bg-black/70 hover:bg-black/90 text-white" />
                  <CarouselNext className="h-7 w-7 top-1/2 -translate-y-1/2 right-2 bg-black/70 hover:bg-black/90 text-white" />
                </Carousel>
              </div>
            </div>
          )}

          {/* Single Image */}
          {(!isSlidePost || !hasSlides) && content?.images?.[0] && content.images[0] !== "/placeholder.svg" && (
            <div className="flex-1 flex flex-col justify-center">
              <div className="w-full aspect-video bg-white rounded-md overflow-hidden border relative">
                <img 
                  src={content.images[0]} 
                  alt="Content preview"
                  className="w-full h-full object-cover aspect-video"
                  style={{ maxHeight: '180px', maxWidth: '100%' }}
                />
              </div>
            </div>
          )}

          {/* Status and Actions */}
          <div className="space-y-2 mt-auto">
            <StatusBadge platform={platform} status={status} />
            
            {/* Action Buttons */}
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowEditModal(true)}
                className="flex-1 text-xs"
              >
                <Edit className="w-3 h-3 mr-1" />
                Editar
              </Button>
              
              {isSlidePost && content?.slidesURL && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadSlides}
                  className="text-xs"
                >
                  <Download className="w-3 h-3" />
                </Button>
              )}
              
              {publishedLink && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(publishedLink, '_blank')}
                  className="text-xs"
                >
                  <ExternalLink className="w-3 h-3" />
                </Button>
              )}
            </div>

            {/* Date */}
            <div className="flex items-center text-xs text-gray-500">
              <Calendar className="w-3 h-3 mr-1" />
              <span>{entry.createdDate}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Modal */}
      {showEditModal && (
        <ContentEditModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          platform={platform}
          content={content}
          contentType={entry.type}
          onSave={(updatedContent) => onUpdateContent(entry.id, platform, updatedContent)}
          entryId={entry.id}
          topic={entry.topic}
          slideImages={entry.slideImages}
        />
      )}
    </>
  );
};

export default PlatformCard;
