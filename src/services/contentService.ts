import { supabase } from '@/integrations/supabase/client';
import { profileService } from './profileService';

export interface ContentEntry {
  id: string; // Changed from number to string to match UUID
  topic: string;
  description: string;
  type: string;
  createdDate: string;
  status: {
    instagram: 'published' | 'pending' | 'error';
    linkedin: 'published' | 'pending' | 'error';
    wordpress: 'published' | 'pending' | 'error';
  };
  platformContent: any;
  publishedLinks?: {
    instagram?: string;
    linkedin?: string;
    wordpress?: string;
  };
  slideImages?: string[];
}

interface PlatformContentStructure {
  instagram?: {
    text: string;
    images: string[];
    publishDate?: string;
    slidesURL?: string;
  };
  linkedin?: {
    text: string;
    images: string[];
    publishDate?: string;
    slidesURL?: string;
  };
  wordpress?: {
    text: string;
    images: string[];
    publishDate?: string;
    title?: string;
    description?: string;
    slug?: string;
    slidesURL?: string;
  };
  slideImages?: string[];
}

// Helper function to safely parse publishedLinks from database
const parsePublishedLinks = (publishedLinks: any): { instagram?: string; linkedin?: string; wordpress?: string; } => {
  if (!publishedLinks || typeof publishedLinks !== 'object') {
    return {};
  }
  
  // If it's already the right type, return it
  if (typeof publishedLinks === 'object' && !Array.isArray(publishedLinks)) {
    return publishedLinks as { instagram?: string; linkedin?: string; wordpress?: string; };
  }
  
  return {};
};

export const contentService = {
  // Crear nueva entrada de contenido
  async createContentEntry(entryData: {
    topic: string;
    description: string;
    type: string;
    platform_content: any;
  }) {
    const { data, error } = await supabase
      .from('content_entries')
      .insert([
        {
          topic: entryData.topic,
          description: entryData.description,
          type: entryData.type,
          platform_content: entryData.platform_content,
          user_id: (await supabase.auth.getUser()).data.user?.id
        }
      ])
      .select()
      .single();

    return { data, error };
  },

  async getUserContentEntries() {
    const { data, error } = await supabase
      .from('content_entries')
      .select('*')
      .order('created_at', { ascending: false });

    return { data, error };
  },

  async updateContentEntry(entryId: string, updates: any) {
    const { data, error } = await supabase
      .from('content_entries')
      .update(updates)
      .eq('id', entryId)
      .select()
      .single();

    return { data, error };
  },

  async deleteContentEntry(entryId: string) {
    console.log('Attempting to delete entry with ID:', entryId);
    
    if (!entryId || entryId === 'undefined' || entryId === 'null') {
      console.error('Invalid entry ID provided:', entryId);
      return { error: new Error('ID de entrada inválido') };
    }

    try {
      // Get current user to ensure they own the entry
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { error: new Error('Usuario no autenticado') };
      }

      // First check if the entry exists and belongs to the user
      const { data: existingEntry, error: fetchError } = await supabase
        .from('content_entries')
        .select('id, user_id')
        .eq('id', entryId)
        .eq('user_id', user.id)
        .single();

      if (fetchError) {
        console.error('Error fetching entry:', fetchError);
        return { error: new Error('No se pudo encontrar la entrada o no tienes permisos para eliminarla') };
      }

      if (!existingEntry) {
        return { error: new Error('Entrada no encontrada') };
      }

      // Now delete the entry
      const { error: deleteError } = await supabase
        .from('content_entries')
        .delete()
        .eq('id', entryId)
        .eq('user_id', user.id); // Double check ownership

      if (deleteError) {
        console.error('Database delete error:', deleteError);
        return { error: deleteError };
      }

      console.log('Entry deleted successfully');
      return { error: null };
    } catch (err) {
      console.error('Delete operation failed:', err);
      return { error: err };
    }
  },

  async updatePlatformContent(entryId: string, platform: string, content: any) {
    // Primero obtenemos el contenido actual
    const { data: currentEntry } = await supabase
      .from('content_entries')
      .select('platform_content')
      .eq('id', entryId)
      .single();

    if (currentEntry) {
      // Ensure platform_content is an object before spreading
      const currentPlatformContent = currentEntry.platform_content && typeof currentEntry.platform_content === 'object' 
        ? currentEntry.platform_content 
        : {};

      const updatedPlatformContent = {
        ...currentPlatformContent,
        [platform]: content
      };

      const { data, error } = await supabase
        .from('content_entries')
        .update({ platform_content: updatedPlatformContent })
        .eq('id', entryId)
        .select()
        .single();

      return { data, error };
    }

    return { data: null, error: new Error('Entry not found') };
  },

  // Nueva función para guardar slide images en la base de datos
  async saveSlideImages(entryId: string, slideImages: string[]) {
    try {
      // Obtener el contenido actual
      const { data: currentEntry, error: fetchError } = await supabase
        .from('content_entries')
        .select('platform_content')
        .eq('id', entryId)
        .single();

      if (fetchError) {
        return { error: fetchError };
      }

      if (currentEntry) {
        // Asegurar que platform_content es un objeto y hacer type assertion
        const currentPlatformContent: PlatformContentStructure = 
          currentEntry.platform_content && 
          typeof currentEntry.platform_content === 'object' &&
          !Array.isArray(currentEntry.platform_content)
            ? currentEntry.platform_content as PlatformContentStructure
            : {};

        // Actualizar el contenido con las slide images
        const updatedPlatformContent: PlatformContentStructure = {
          ...currentPlatformContent,
          slideImages: slideImages
        };

        // Para Slide Posts, actualizar la imagen de Instagram y LinkedIn con la primera slide
        if (slideImages.length > 0) {
          const firstSlideImage = slideImages[0];
          
          if (currentPlatformContent.instagram) {
            updatedPlatformContent.instagram = {
              ...currentPlatformContent.instagram,
              images: [firstSlideImage]
            };
          }
          
          if (currentPlatformContent.linkedin) {
            updatedPlatformContent.linkedin = {
              ...currentPlatformContent.linkedin,
              images: [firstSlideImage]
            };
          }
        }

        const { data, error } = await supabase
          .from('content_entries')
          .update({ platform_content: updatedPlatformContent as any })
          .eq('id', entryId)
          .select()
          .single();

        return { data, error };
      }

      return { data: null, error: new Error('Entry not found') };
    } catch (error) {
      console.error('Error saving slide images:', error);
      return { data: null, error };
    }
  },

  // Nueva función para actualizar links de publicación
  async updatePublishedLink(entryId: string, platform: string, link: string) {
    try {
      // Obtener los links actuales
      const { data: currentEntry, error: fetchError } = await supabase
        .from('content_entries')
        .select('published_links')
        .eq('id', entryId)
        .single();

      if (fetchError) {
        return { error: fetchError };
      }

      // Asegurar que published_links es un objeto
      const currentLinks = parsePublishedLinks(currentEntry?.published_links);

      // Actualizar con el nuevo link
      const updatedLinks = {
        ...currentLinks,
        [platform]: link
      };

      const { data, error } = await supabase
        .from('content_entries')
        .update({ published_links: updatedLinks })
        .eq('id', entryId)
        .select()
        .single();

      return { data, error };
    } catch (error) {
      console.error('Error updating published link:', error);
      return { data: null, error };
    }
  },

  // Nueva función para actualizar el estado de publicación
  async updatePublishStatus(entryId: string, platform: string, status: 'published' | 'pending' | 'error') {
    try {
      const statusField = `status_${platform}`;
      
      const { data, error } = await supabase
        .from('content_entries')
        .update({ [statusField]: status })
        .eq('id', entryId)
        .select()
        .single();

      return { data, error };
    } catch (error) {
      console.error('Error updating publish status:', error);
      return { data: null, error };
    }
  },

  // Nueva función para publicar contenido inmediatamente
  async publishContent(entryId: string, platform: string, postType?: string) {
    console.log('Publishing content for entry:', entryId, 'platform:', platform, 'postType:', postType);
    
    try {
      // Obtener el usuario actual
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      // Obtener el entry y su contenido
      const { data: entry, error: entryError } = await supabase
        .from('content_entries')
        .select('*')
        .eq('id', entryId)
        .eq('user_id', user.id)
        .single();

      if (entryError || !entry) {
        throw new Error('No se pudo encontrar el contenido');
      }

      // Obtener el webhook URL del perfil del usuario
      const { data: profile, error: profileError } = await profileService.getUserProfile(user.id);
      
      if (profileError || !profile?.webhook_url) {
        throw new Error('Webhook no configurado en el perfil del usuario');
      }

      console.log('Sending publish request to user webhook:', profile.webhook_url);

      // Primero actualizamos el estado a 'pending'
      await this.updatePublishStatus(entryId, platform, 'pending');

      // Preparar el payload del webhook incluyendo el post_type si está disponible
      const webhookPayload: any = {
        action: 'publish',
        platform: platform,
        entryId: entryId,
        content: entry.platform_content[platform],
        userEmail: user.email
      };

      // Agregar post_type si está disponible
      if (postType) {
        webhookPayload.post_type = postType;
      }

      const response = await fetch(profile.webhook_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookPayload)
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('HTTP error response:', errorText);
        
        // Actualizar estado a error
        await this.updatePublishStatus(entryId, platform, 'error');
        
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      // Check if response has content before trying to parse JSON
      const responseText = await response.text();
      let data = null;
      
      if (responseText.trim()) {
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.error('Failed to parse JSON response:', parseError);
          console.log('Response text:', responseText);
          throw new Error('Respuesta inválida del webhook');
        }
      } else {
        console.log('Empty response from webhook, treating as success');
        data = { status: 'published' };
      }

      console.log('Publish response:', data);

      // Manejar la respuesta según el estado específico de cada plataforma
      const platformPublishedStatus = `${platform}Published`;
      
      if (data?.status === platformPublishedStatus) {
        // Actualizar estado a publicado
        await this.updatePublishStatus(entryId, platform, 'published');
        
        // Guardar el link si está disponible
        if (data.link) {
          await this.updatePublishedLink(entryId, platform, data.link);
        }
      } else if (!responseText.trim()) {
        // Para respuestas vacías, mantener como pending hasta recibir confirmación
        console.log('Empty response, keeping as pending');
      } else {
        // Si no es un estado de éxito claro, mantener como pending
        console.warn('Unexpected response status:', data?.status);
        console.log('Expected status for', platform, ':', platformPublishedStatus);
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error publishing content:', error);
      
      // Actualizar estado a error en caso de excepción
      try {
        await this.updatePublishStatus(entryId, platform, 'error');
      } catch (statusError) {
        console.error('Failed to update status to error:', statusError);
      }
      
      return { data: null, error };
    }
  },

  // Nueva función para descargar slides usando el webhook del usuario
  async downloadSlidesWithUserWebhook(slidesURL: string, contentName: string) {
    console.log('Attempting to download slides using user webhook for URL:', slidesURL, 'Content:', contentName);
    
    try {
      // Obtener el usuario actual
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      // Obtener el webhook URL del perfil del usuario
      const { data: profile, error: profileError } = await profileService.getUserProfile(user.id);
      
      if (profileError || !profile?.webhook_url) {
        throw new Error('Webhook no configurado en el perfil del usuario');
      }

      console.log('Sending download slides request to user webhook:', profile.webhook_url);

      const response = await fetch(profile.webhook_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'download_slides',
          slidesURL: slidesURL,
          contentName: contentName,
          userEmail: user.email
        })
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('HTTP error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Download successful:', data);
      
      // El webhook puede devolver slideImages o slidesImages, normalizamos a slideImages
      const slideImages = data.slideImages || data.slidesImages || [];
      
      return { 
        data: { 
          slideImages: slideImages 
        }, 
        error: null 
      };
    } catch (error) {
      console.error('Error downloading slides:', error);
      return { data: null, error };
    }
  },

  // Mantener la función original como respaldo
  async downloadSlidesAsImages(slidesURL: string) {
    console.log('Attempting to download slides from URL:', slidesURL);
    
    try {
      const response = await fetch('https://webhookn8n.ignaciorimini.site/webhook/contentflow-carousel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          slidesURL: slidesURL
        })
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('HTTP error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Download successful:', data);
      return { data, error: null };
    } catch (error) {
      console.error('Error downloading slides:', error);
      return { data: null, error };
    }
  }
};
