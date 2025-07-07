
import { Instagram, Linkedin, Globe } from 'lucide-react';

interface PlatformIconProps {
  platform: string;
  className?: string;
}

const PlatformIcon = ({ platform, className = "w-4 h-4" }: PlatformIconProps) => {
  const getIcon = () => {
    switch (platform) {
      case 'instagram':
        return <Instagram className={className} />;
      case 'linkedin':
        return <Linkedin className={className} />;
      case 'wordpress':
        return <Globe className={className} />;
      case 'twitter':
        return <Globe className={className} />;
      default:
        return <Globe className={className} />;
    }
  };

  return getIcon();
};

export default PlatformIcon;
