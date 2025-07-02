
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings } from 'lucide-react';

const Integrations = () => {
  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Integraciones</h1>
        <p className="text-gray-600">Conecta tus cuentas de redes sociales</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="w-5 h-5 mr-2" />
            Próximamente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            Las integraciones con redes sociales estarán disponibles próximamente.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Integrations;
