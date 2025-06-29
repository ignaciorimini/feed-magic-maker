
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Calendar, BarChart3, Link } from 'lucide-react';

interface MobileMenuProps {
  isOpen: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onNewContent: () => void;
  onClose: () => void;
}

const MobileMenu = ({ isOpen, activeTab, setActiveTab, onNewContent, onClose }: MobileMenuProps) => {
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    onClose();
  };

  const handleNewContent = () => {
    onNewContent();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="md:hidden bg-white border-t border-gray-200">
      <div className="px-4 py-4 space-y-2">
        <Button
          variant={activeTab === 'dashboard' ? 'default' : 'ghost'}
          onClick={() => handleTabChange('dashboard')}
          className="w-full justify-start"
        >
          <BarChart3 className="w-4 h-4 mr-2" />
          Dashboard
        </Button>
        <Button
          variant={activeTab === 'calendar' ? 'default' : 'ghost'}
          onClick={() => handleTabChange('calendar')}
          className="w-full justify-start"
        >
          <Calendar className="w-4 h-4 mr-2" />
          Calendario
        </Button>
        <Button
          variant={activeTab === 'integrations' ? 'default' : 'ghost'}
          onClick={() => handleTabChange('integrations')}
          className="w-full justify-start"
        >
          <Link className="w-4 h-4 mr-2" />
          Integraciones
        </Button>
        <hr className="my-2" />
        <Button onClick={handleNewContent} className="w-full justify-start">
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Contenido
        </Button>
      </div>
    </div>
  );
};

export default MobileMenu;
