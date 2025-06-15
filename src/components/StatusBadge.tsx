
import { Instagram, Linkedin, Globe, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface StatusBadgeProps {
  platform: 'instagram' | 'linkedin' | 'wordpress';
  status: 'published' | 'pending' | 'error';
}

const StatusBadge = ({ platform, status }: StatusBadgeProps) => {
  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'instagram':
        return Instagram;
      case 'linkedin':
        return Linkedin;
      case 'wordpress':
        return Globe;
      default:
        return Globe;
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'published':
        return {
          icon: CheckCircle,
          color: 'bg-green-100 text-green-700 border-green-200',
          label: 'Publicado'
        };
      case 'pending':
        return {
          icon: Clock,
          color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
          label: 'Pendiente'
        };
      case 'error':
        return {
          icon: XCircle,
          color: 'bg-red-100 text-red-700 border-red-200',
          label: 'Error'
        };
      default:
        return {
          icon: Clock,
          color: 'bg-gray-100 text-gray-700 border-gray-200',
          label: 'Desconocido'
        };
    }
  };

  const statusConfig = getStatusConfig(status);
  const StatusIcon = statusConfig.icon;

  return (
    <Badge 
      variant="outline" 
      className={`${statusConfig.color} text-xs flex items-center space-x-1 px-2 py-1`}
    >
      <StatusIcon className="w-3 h-3" />
      <span>{statusConfig.label}</span>
    </Badge>
  );
};

export default StatusBadge;
