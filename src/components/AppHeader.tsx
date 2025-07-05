
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AppHeaderProps {
  onGenerateContent: () => void;
}

const AppHeader = ({ onGenerateContent }: AppHeaderProps) => {
  return (
    <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600">Gestiona todo tu contenido desde aquí</p>
          </div>
          <Button 
            onClick={onGenerateContent}
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold px-8 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            <Plus className="w-5 h-5 mr-2" />
            Generar Contenido
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AppHeader;
