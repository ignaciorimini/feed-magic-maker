
import { supabase } from '@/integrations/supabase/client';

export interface UserCredential {
  id: string;
  user_id: string;
  service: 'google' | 'meta' | 'wordpress' | 'linkedin';
  credential_type: 'oauth' | 'api_key' | 'username_password';
  access_token?: string;
  refresh_token?: string;
  client_id?: string;
  client_secret?: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface IntegrationGuide {
  id: string;
  service: 'google' | 'meta' | 'wordpress' | 'linkedin';
  video_url?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export const credentialsService = {
  // Obtener todas las credenciales del usuario
  async getUserCredentials() {
    const { data, error } = await supabase
      .from('user_credentials')
      .select('*')
      .order('created_at', { ascending: false });

    return { data, error };
  },

  // Obtener credencial específica por servicio
  async getCredentialByService(service: string) {
    const { data, error } = await supabase
      .from('user_credentials')
      .select('*')
      .eq('service', service)
      .maybeSingle();

    return { data, error };
  },

  // Crear o actualizar credencial
  async upsertCredential(credential: Omit<UserCredential, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('user_credentials')
      .upsert(credential, { 
        onConflict: 'user_id,service',
        ignoreDuplicates: false 
      })
      .select()
      .single();

    return { data, error };
  },

  // Eliminar credencial
  async deleteCredential(service: string) {
    const { error } = await supabase
      .from('user_credentials')
      .delete()
      .eq('service', service);

    return { error };
  },

  // Obtener guías de integración
  async getIntegrationGuides() {
    const { data, error } = await supabase
      .from('integration_guides')
      .select('*')
      .order('service');

    return { data, error };
  },

  // Verificar si las credenciales están expiradas
  isCredentialExpired(credential: UserCredential): boolean {
    if (!credential.expires_at) return false;
    
    const expirationDate = new Date(credential.expires_at);
    const now = new Date();
    
    return expirationDate <= now;
  },

  // Validar credenciales de OAuth
  async validateOAuthCredentials(service: string, accessToken: string) {
    // Esta función se puede expandir para validar tokens con cada servicio
    try {
      switch (service) {
        case 'google':
          // Validar con Google API
          const response = await fetch(`https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${accessToken}`);
          return { valid: response.ok, error: response.ok ? null : 'Token inválido' };
        
        case 'linkedin':
          // Validar con LinkedIn API
          const linkedinResponse = await fetch('https://api.linkedin.com/v2/me', {
            headers: { 'Authorization': `Bearer ${accessToken}` }
          });
          return { valid: linkedinResponse.ok, error: linkedinResponse.ok ? null : 'Token inválido' };
        
        default:
          return { valid: true, error: null };
      }
    } catch (error) {
      return { valid: false, error: 'Error al validar credenciales' };
    }
  }
};
