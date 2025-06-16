
import { useState, useEffect } from 'react';
import { Calendar, Edit, ExternalLink, Download, MoreVertical, Trash2, ImageIcon } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import StatusBadge from './StatusBadge';
import ContentEditModal from './ContentEditModal';
import PublishButton from './PublishButton';

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
      twitter: 'published' | 'pending' | 'error';
    };
    platformContent: {
      instagram: any;
      linkedin: any;
      wordpress: any;
      twitter: any;
    };
    slideImages?: string[];
    publishedLinks?: {
      instagram?: string;
      linkedin?: string;
      wordpress?: string;
      twitter?: string;
    };
  };
  platform: 'instagram' | 'linkedin' | 'wordpress' | 'twitter';
  onUpdateContent: (entryId: string, platform: string, content: any) => Promise<void>;
  onDeleteEntry: (entryId: string, platform: string) => void;
  onDownloadSlides?: (entryId: string, slidesURL: string) => void;
  onUpdateStatus?: (entryId: string, platform: string, newStatus: 'published' | 'pending' | 'error') => void;
  onUpdateLink?: (entryId: string, platform: string, link: string) => void;
}

const PlatformCard = ({ entry, platform, onUpdateContent, onDeleteEntry, onDownloadSlides, onUpdateStatus, onUpdateLink }: PlatformCardProps) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);
  const [imagePreviewIndex, setImagePreviewIndex] = useState(0);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [entry.platformContent[platform]?.images]);

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
    },
    twitter: {
      name: 'X (Twitter)',
      gradient: 'from-black to-gray-800',
      bgGradient: 'from-gray-50 to-black-50',
      borderColor: 'border-gray-300'
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
      <Card className={`bg-gradient-to-br ${config.bgGradient} ${config.borderColor} border-2 hover:shadow-xl transition-all duration-300 group flex flex-col h-full`}>
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
        <CardContent className="p-4 pt-2 flex-1 flex flex-col space-y-3">
          {/* Description */}
          <p className="text-xs text-gray-600 line-clamp-2">
            {truncateText(entry.description, 80)}
          </p>

          {/* Slides Carousel */}
          {isSlidePost && hasSlides && (
            <div className="flex-1">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-2">
                Slides ({entry.slideImages!.length})
              </span>
              <Carousel className="w-full">
                <CarouselContent>
                  {entry.slideImages!.map((imageUrl, index) => (
                    <CarouselItem key={index}>
                      <div className="aspect-video bg-white rounded-md overflow-hidden border">
                        <img 
                          src={imageUrl} 
                          alt={`Slide ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="h-6 w-6" />
                <CarouselNext className="h-6 w-6" />
              </Carousel>
            </div>
          )}

          {/* Single Image */}
          {(!isSlidePost || !hasSlides) && (
            <div className="flex-1">
              <div className="aspect-video bg-white rounded-md overflow-hidden border flex items-center justify-center">
                {content?.images?.[0] && content.images[0] !== "/placeholder.svg" && !imageError ? (
                  <img 
                    src={content.images[0]} 
                    alt="Previsualización de contenido"
                    className="w-full h-full object-cover"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="text-center text-xs text-gray-500 p-2">
                    <ImageIcon className="w-6 h-6 mx-auto mb-1 text-gray-400" />
                    <span>{imageError ? 'Error al cargar imagen' : 'Sin imagen'}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Status and Actions */}
          <div className="space-y-2 mt-auto">
            <StatusBadge platform={platform} status={status} />

            {status === 'pending' && onUpdateStatus && onUpdateLink && (
              <div className="pt-2">
                <PublishButton
                  entryId={entry.id}
                  platform={platform}
                  currentStatus={status}
                  contentType={entry.type}
                  onStatusChange={(newStatus) => onUpdateStatus(entry.id, platform, newStatus)}
                  onLinkUpdate={(link) => onUpdateLink(entry.id, platform, link)}
                />
              </div>
            )}
            
            {/* Action Buttons */}
            <div className="flex space-x-2 pt-2">
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
          onSave={async (updatedContent) => onUpdateContent(entry.id, platform, updatedContent)}
          entryId={entry.id}
          topic={entry.topic}
          description={entry.description}
          slideImages={entry.slideImages}
        />
      )}
    </>
  );
};

export default PlatformCard;
