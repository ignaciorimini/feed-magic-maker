
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { useAuth } from '@/hooks/useAuth';
import MobileHeader from './MobileHeader';
import AppHeader from './AppHeader';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex flex-col w-full">
        <AppHeader />
        <MobileHeader />
        <div className="flex flex-1 w-full pt-16">
          <AppSidebar />
          <SidebarInset className="flex-1">
            <main className="flex-1 overflow-auto">
              {children}
            </main>
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Layout;
