
import { useState } from 'react';
import { Plus, User, BarChart3, LogOut, Settings, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
    <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200/60 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => setActiveTab('dashboard')} 
            className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                ContentFlow
              </h1>
              <p className="text-sm text-gray-500">Automatización de Contenido</p>
            </div>
          </button>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <Button
              variant={activeTab === 'dashboard' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('dashboard')}
              size="sm"
            >
              Dashboard
            </Button>
            <Button
              variant={activeTab === 'calendar' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('calendar')}
              size="sm"
            >
              Calendario
            </Button>
            <Button
              onClick={onNewContent}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Contenido
            </Button>
            
            {/* Desktop User Menu */}
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onProfileSetup}
                className="p-2"
              >
                <Settings className="w-4 h-4" />
              </Button>
              <div className="w-8 h-8 bg-gradient-to-r from-gray-600 to-gray-400 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onSignOut}
                className="p-2"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMobileMenu(true)}
              className="p-2"
            >
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={showMobileMenu}
        onClose={() => setShowMobileMenu(false)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onNewContent={onNewContent}
        onProfileSetup={onProfileSetup}
        onSignOut={onSignOut}
        userEmail={userEmail}
      />
    </header>
  );
};

export default DashboardHeader;
