
import { X, BarChart3, Calendar, Plus, Settings, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onNewContent: () => void;
  onProfileSetup: () => void;
  onSignOut: () => void;
  userEmail?: string;
}

const MobileMenu = ({
  isOpen,
  onClose,
  activeTab,
  setActiveTab,
  onNewContent,
  onProfileSetup,
  onSignOut,
  userEmail
}: MobileMenuProps) => {
  if (!isOpen) return null;

  const handleMenuAction = (action: () => void) => {
    action();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] md:hidden">
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm" 
        onClick={onClose} 
      />
      <div className="fixed right-0 top-0 h-full w-80 max-w-[85vw] bg-white shadow-2xl border-l border-gray-200">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Menú</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="p-2 hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
        <div className="p-6 space-y-4">
          <Button
            variant={activeTab === 'dashboard' ? 'default' : 'ghost'}
            onClick={() => handleMenuAction(() => setActiveTab('dashboard'))}
            className="w-full justify-start h-12 text-left"
          >
            <BarChart3 className="w-5 h-5 mr-3" />
            Dashboard
          </Button>
          <Button
            variant={activeTab === 'calendar' ? 'default' : 'ghost'}
            onClick={() => handleMenuAction(() => setActiveTab('calendar'))}
            className="w-full justify-start h-12 text-left"
          >
            <Calendar className="w-5 h-5 mr-3" />
            Calendario
          </Button>
          <Button
            onClick={() => handleMenuAction(onNewContent)}
            className="w-full justify-start h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
          >
            <Plus className="w-5 h-5 mr-3" />
            Nuevo Contenido
          </Button>
          <Button
            variant="ghost"
            onClick={() => handleMenuAction(onProfileSetup)}
            className="w-full justify-start h-12 hover:bg-gray-100"
          >
            <Settings className="w-5 h-5 mr-3" />
            Configuración
          </Button>
          
          <div className="border-t border-gray-200 pt-6 mt-6">
            <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-gray-600 to-gray-400 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">{userEmail}</p>
                <p className="text-xs text-gray-500">Usuario</p>
              </div>
            </div>
            <Button
              variant="ghost"
              onClick={() => handleMenuAction(onSignOut)}
              className="w-full justify-start h-12 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileMenu;
