
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AppHeader = () => {
  const navigate = useNavigate();

  const handleGenerateContent = () => {
    // Navigate to dashboard and trigger content creation
    navigate('/dashboard?create=true');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-end px-6 py-3">
        <Button
          onClick={handleGenerateContent}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium"
        >
          <Plus className="w-4 h-4 mr-2" />
          Generar Contenido
        </Button>
      </div>
    </header>
  );
};

export default AppHeader;
