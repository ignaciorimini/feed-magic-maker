import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, Calendar, BarChart3, Settings, User, LogOut, Menu, X, Link as LinkIcon } from 'lucide-react';
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
  const navigate = useNavigate();
  return <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      

      {/* Mobile Menu */}
      <MobileMenu isOpen={showMobileMenu} activeTab={activeTab} setActiveTab={setActiveTab} onNewContent={onNewContent} onClose={() => setShowMobileMenu(false)} />
    </header>;
};
export default DashboardHeader;