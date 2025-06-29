
import React from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, Calendar, BarChart3, Settings, User, LogOut, Menu, X, Link } from 'lucide-react';
import MobileMenu from './MobileMenu';

interface DashboardHeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  showMobileMenu: boolean;
  setShowMobileMenu: (show: boolean) => void;
  onNewContent: () => void;
  onProfileSetup: () => void;
  onSignOut: () => void;
  userEmail?: string;
}

const DashboardHeader = ({
  activeTab,
  setActiveTab,
  showMobileMenu,
  setShowMobileMenu,
  onNewContent,
  onProfileSetup,
  onSignOut,
  userEmail
}: DashboardHeaderProps) => {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">CM</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900">Content Manager</h1>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-1">
              <Button
                variant={activeTab === 'dashboard' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('dashboard')}
                className="flex items-center space-x-2"
              >
                <BarChart3 className="w-4 h-4" />
                <span>Dashboard</span>
              </Button>
              <Button
                variant={activeTab === 'calendar' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('calendar')}
                className="flex items-center space-x-2"
              >
                <Calendar className="w-4 h-4" />
                <span>Calendario</span>
              </Button>
              <Button
                variant={activeTab === 'integrations' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('integrations')}
                className="flex items-center space-x-2"
              >
                <Link className="w-4 h-4" />
                <span>Integraciones</span>
              </Button>
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            {/* New Content Button */}
            <Button onClick={onNewContent} className="hidden sm:flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Nuevo Contenido</span>
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-gray-600" />
                  </div>
                  <span className="hidden sm:inline text-sm text-gray-700">
                    {userEmail?.split('@')[0] || 'Usuario'}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={onProfileSetup}>
                  <Settings className="w-4 h-4 mr-2" />
                  Configuración de Perfil
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onSignOut} className="text-red-600">
                  <LogOut className="w-4 h-4 mr-2" />
                  Cerrar Sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
            >
              {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={showMobileMenu}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onNewContent={onNewContent}
        onClose={() => setShowMobileMenu(false)}
      />
    </header>
  );
};

export default DashboardHeader;
