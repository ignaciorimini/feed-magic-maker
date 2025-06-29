
-- Crear tabla para credenciales de usuarios
CREATE TABLE public.user_credentials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  service TEXT NOT NULL CHECK (service IN ('google', 'meta', 'wordpress', 'linkedin')),
  credential_type TEXT NOT NULL CHECK (credential_type IN ('oauth', 'api_key', 'username_password')),
  access_token TEXT,
  refresh_token TEXT,
  client_id TEXT,
  client_secret TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, service)
);

-- Crear tabla para guías de integración
CREATE TABLE public.integration_guides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service TEXT NOT NULL UNIQUE CHECK (service IN ('google', 'meta', 'wordpress', 'linkedin')),
  video_url TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS para user_credentials
ALTER TABLE public.user_credentials ENABLE ROW LEVEL SECURITY;

-- Políticas para user_credentials - usuarios solo pueden ver sus propias credenciales
CREATE POLICY "Users can view their own credentials" 
  ON public.user_credentials 
  FOR SELECT 
  USING (user_id IN (SELECT id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can create their own credentials" 
  ON public.user_credentials 
  FOR INSERT 
  WITH CHECK (user_id IN (SELECT id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update their own credentials" 
  ON public.user_credentials 
  FOR UPDATE 
  USING (user_id IN (SELECT id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete their own credentials" 
  ON public.user_credentials 
  FOR DELETE 
  USING (user_id IN (SELECT id FROM public.profiles WHERE id = auth.uid()));

-- Habilitar RLS para integration_guides (lectura pública)
ALTER TABLE public.integration_guides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view integration guides" 
  ON public.integration_guides 
  FOR SELECT 
  USING (true);

-- Trigger para actualizar updated_at en user_credentials
CREATE TRIGGER update_user_credentials_updated_at
  BEFORE UPDATE ON public.user_credentials
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Trigger para actualizar updated_at en integration_guides
CREATE TRIGGER update_integration_guides_updated_at
  BEFORE UPDATE ON public.integration_guides
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Insertar guías de ejemplo
INSERT INTO public.integration_guides (service, video_url, description) VALUES
('google', 'https://www.youtube.com/watch?v=example-google', 'Conecta tu cuenta de Google para acceder y clonar presentaciones de Google Slides. Aprende a configurar los permisos necesarios para que la aplicación pueda acceder a tus presentaciones.'),
('meta', 'https://www.youtube.com/watch?v=example-meta', 'Configura tu cuenta de Meta para publicar automáticamente en Instagram Business y Facebook Pages. Obtén los permisos necesarios y vincula tu cuenta comercial.'),
('linkedin', 'https://www.youtube.com/watch?v=example-linkedin', 'Crea una aplicación en LinkedIn para obtener las credenciales OAuth necesarias. Aprende a configurar los permisos para publicar contenido en tu perfil o página de empresa.'),
('wordpress', 'https://www.youtube.com/watch?v=example-wordpress', 'Obtén las claves API de WordPress para publicación automática de artículos. Configura tu sitio WordPress para permitir el acceso mediante API REST.');
