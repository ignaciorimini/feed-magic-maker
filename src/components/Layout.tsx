
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { useAuth } from '@/hooks/useAuth';
import MobileHeader from './MobileHeader';
import AppHeader from './AppHeader';
import { useNavigate } from 'react-router-dom';

interface LayoutProps {  
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleGenerateContent = () => {
    navigate('/dashboard?create=true');
  };

  if (!isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex flex-col w-full">
        <AppHeader onGenerateContent={handleGenerateContent} />
        <MobileHeader />
        <div className="flex flex-1 w-full">
          <AppSidebar />
          <SidebarInset className="flex-1">
            <main className="flex-1 overflow-auto pt-4">
              {children}
            </main>
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Layout;
