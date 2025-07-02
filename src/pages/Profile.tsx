
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User } from 'lucide-react';

const Profile = () => {
  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Configuración de Perfil</h1>
        <p className="text-gray-600">Gestiona tu información personal y configuraciones</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="w-5 h-5 mr-2" />
            Próximamente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            Las configuraciones de perfil estarán disponibles próximamente.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;
