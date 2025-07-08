
import { Instagram, Linkedin, Globe, Clock, CheckCircle, XCircle, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface StatusBadgeProps {
  platform: 'instagram' | 'linkedin' | 'wordpress' | 'twitter';
  status: 'published' | 'pending' | 'error';
  scheduledAt?: string | null;
}

const StatusBadge = ({ platform, status, scheduledAt }: StatusBadgeProps) => {
  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'instagram':
        return Instagram;
      case 'linkedin':
        return Linkedin;
      case 'wordpress':
        return Globe;
      case 'twitter':
        return Globe;
      default:
        return Globe;
    }
  };

  const getStatusConfig = (status: string, scheduledAt?: string | null) => {
    // If content is scheduled (has scheduledAt and it's in the future), show "Programado"
    if (scheduledAt && new Date(scheduledAt) > new Date()) {
      return {
        icon: Calendar,
        color: 'bg-blue-100 text-blue-700 border-blue-200',
        label: 'Programado'
      };
    }
    
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

  const statusConfig = getStatusConfig(status, scheduledAt);
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
