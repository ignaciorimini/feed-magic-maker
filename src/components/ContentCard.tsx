
import React from 'react';
import { Button } from '@/components/ui/button';
import { Calendar, Eye, Heart, Share2, MoreHorizontal } from 'lucide-react';

interface ContentCardProps {
  title: string;
  content: string;
  platform: string;
  scheduledFor?: string;
  engagement?: {
    views: number;
    likes: number;
    shares: number;
  };
  status: 'draft' | 'scheduled' | 'published';
}

const ContentCard = ({ title, content, platform, scheduledFor, engagement, status }: ContentCardProps) => {
  const statusColors = {
    draft: 'bg-gray-100 text-gray-700',
    scheduled: 'bg-yellow-100 text-yellow-700',
    published: 'bg-green-100 text-green-700'
  };

  const platformColors = {
    Instagram: 'bg-gradient-to-r from-purple-500 to-pink-500',
    Facebook: 'bg-blue-600',
    Twitter: 'bg-sky-500',
    LinkedIn: 'bg-blue-700'
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-200 animate-scale-in">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`w-3 h-3 rounded-full ${platformColors[platform as keyof typeof platformColors] || 'bg-gray-400'}`} />
          <span className="text-sm font-medium text-gray-600">{platform}</span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status]}`}>
            {status === 'draft' ? 'Borrador' : status === 'scheduled' ? 'Programado' : 'Publicado'}
          </span>
        </div>
        <Button variant="ghost" size="sm">
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </div>

      <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm mb-4 line-clamp-3">{content}</p>

      {scheduledFor && (
        <div className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
          <Calendar className="w-4 h-4" />
          <span>{scheduledFor}</span>
        </div>
      )}

      {engagement && (
        <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
          <div className="flex items-center space-x-1">
            <Eye className="w-4 h-4" />
            <span>{engagement.views}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Heart className="w-4 h-4" />
            <span>{engagement.likes}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Share2 className="w-4 h-4" />
            <span>{engagement.shares}</span>
          </div>
        </div>
      )}

      <div className="flex items-center space-x-2">
        <Button size="sm" variant="outline" className="flex-1">
          Editar
        </Button>
        <Button size="sm" className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600">
          {status === 'draft' ? 'Programar' : status === 'scheduled' ? 'Ver' : 'Analizar'}
        </Button>
      </div>
    </div>
  );
};

export default ContentCard;
