
import { supabase } from '@/integrations/supabase/client';
import { profileService } from './profileService';

export interface ContentEntry {
  id: string;
  topic: string;
  description: string;
  type: string;
  createdDate: string;
  imageUrl?: string;
  platforms: ContentPlatform[];
}

export interface ContentPlatform {
  id: string;
  content_entry_id: string;
  platform: 'instagram' | 'linkedin' | 'wordpress' | 'twitter';
  status: 'pending' | 'generated' | 'edited' | 'scheduled' | 'published';
  text?: string;
  images: string[];
  slides_url?: string;
  publish_date?: string;
  generated_at?: string;
  published_at?: string;
  slideImages?: string[];
  publishedLink?: string;
}

export const contentService = {
  // Create new content entry with platforms
  async createContentEntry(entryData: {
    topic: string;
    description: string;
    type: string;
    selectedPlatforms: string[];
    generatedContent?: any;
  }) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      // Create the content entry first
      const { data: entry, error: entryError } = await supabase
        .from('content_entries')
        .insert({
          topic: entryData.topic,
          description: entryData.description,
          type: entryData.type,
          user_id: user.id,
          image_url: entryData.generatedContent?.imageURL || null
        })
        .select()
        .single();

      if (entryError) throw entryError;

      // Create platform entries for each selected platform
      const platformInserts = entryData.selectedPlatforms.map(platform => ({
        content_entry_id: entry.id,
        platform: platform as 'instagram' | 'linkedin' | 'wordpress' | 'twitter',
        status: 'pending' as const,
        text: entryData.generatedContent?.[platform]?.text || `Generando contenido para ${platform}...`,
        images: [] as string[],
        slides_url: entryData.generatedContent?.slidesURL || null
      }));

      const { data: platforms, error: platformsError } = await supabase
        .from('content_platforms')
        .insert(platformInserts)
        .select();

      if (platformsError) throw platformsError;

      return { data: { entry, platforms }, error: null };
    } catch (error) {
      console.error('Error creating content entry:', error);
      return { data: null, error };
    }
  },

  // Get user's content entries with their platforms
  async getUserContentEntries() {
    try {
      const { data: entries, error: entriesError } = await supabase
        .from('content_entries')
        .select(`
          *,
          content_platforms (
            *,
            slide_images (*)
          )
        `)
        .order('created_at', { ascending: false });

      if (entriesError) throw entriesError;

      // Transform data to match the expected format
      const transformedEntries: ContentEntry[] = entries?.map(entry => ({
        id: entry.id,
        topic: entry.topic,
        description: entry.description || '',
        type: entry.type,
        createdDate: entry.created_date,
        imageUrl: entry.image_url,
        platforms: (entry as any).content_platforms?.map((platform: any) => ({
          id: platform.id,
          content_entry_id: platform.content_entry_id,
          platform: platform.platform,
          status: platform.status,
          text: platform.text,
          images: platform.images || [],
          slides_url: platform.slides_url,
          publish_date: platform.publish_date,
          generated_at: platform.generated_at,
          published_at: platform.published_at,
          slideImages: platform.slide_images?.map((img: any) => img.image_url) || []
        })) || []
      })) || [];

      return { data: transformedEntries, error: null };
    } catch (error) {
      console.error('Error loading entries:', error);
      return { data: null, error };
    }
  },

  // Update platform content
  async updatePlatformContent(platformId: string, content: any) {
    try {
      const { data, error } = await supabase
        .from('content_platforms')
        .update({
          text: content.text,
          images: content.images || [],
          slides_url: content.slides_url,
          publish_date: content.publish_date
        })
        .eq('id', platformId)
        .select()
        .single();

      return { data, error };
    } catch (error) {
      console.error('Error updating platform content:', error);
      return { data: null, error };
    }
  },

  // Update platform status
  async updatePlatformStatus(platformId: string, status: 'pending' | 'generated' | 'edited' | 'scheduled' | 'published') {
    try {
      const { data, error } = await supabase
        .from('content_platforms')
        .update({ 
          status,
          published_at: status === 'published' ? new Date().toISOString() : null
        })
        .eq('id', platformId)
        .select()
        .single();

      return { data, error };
    } catch (error) {
      console.error('Error updating platform status:', error);
      return { data: null, error };
    }
  },

  // Save slide images for a platform
  async saveSlideImages(platformId: string, slideImages: string[]) {
    try {
      // First, delete existing slide images
      await supabase
        .from('slide_images')
        .delete()
        .eq('content_platform_id', platformId);

      // Insert new slide images
      const slideInserts = slideImages.map((imageUrl, index) => ({
        content_platform_id: platformId,
        image_url: imageUrl,
        position: index
      }));

      const { data, error } = await supabase
        .from('slide_images')
        .insert(slideInserts)
        .select();

      return { data, error };
    } catch (error) {
      console.error('Error saving slide images:', error);
      return { data: null, error };
    }
  },

  // Delete content entry (cascades to platforms and images)
  async deleteContentEntry(entryId: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      const { error } = await supabase
        .from('content_entries')
        .delete()
        .eq('id', entryId)
        .eq('user_id', user.id);

      return { error };
    } catch (error) {
      console.error('Error deleting content entry:', error);
      return { error };
    }
  },

  // Generate content using webhook
  async generateContent(topic: string, description: string, contentType: string, selectedPlatforms: string[]) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      const { data: profile, error: profileError } = await profileService.getUserProfile(user.id);
      if (profileError || !profile?.webhook_url) {
        throw new Error('Webhook no configurado en el perfil del usuario');
      }

      const webhookData = {
        action: 'generate_content',
        topic,
        description,
        contentType,
        selectedPlatforms,
        userEmail: user.email
      };

      const response = await fetch(profile.webhook_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webhookData)
      });

      if (!response.ok) {
        throw new Error(`Webhook error: ${response.status} ${response.statusText}`);
      }

      const webhookResponse = await response.json();
      
      // Create entry with generated content
      return await this.createContentEntry({
        topic,
        description,
        type: contentType,
        selectedPlatforms,
        generatedContent: webhookResponse
      });
    } catch (error) {
      console.error('Error generating content:', error);
      return { data: null, error };
    }
  },

  // Download slides using user webhook
  async downloadSlidesWithUserWebhook(slidesURL: string, contentName: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      const { data: profile, error: profileError } = await profileService.getUserProfile(user.id);
      if (profileError || !profile?.webhook_url) {
        throw new Error('Webhook no configurado en el perfil del usuario');
      }

      const response = await fetch(profile.webhook_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'download_slides',
          slidesURL: slidesURL,
          contentName: contentName,
          userEmail: user.email
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const rawData = await response.json();
      return { data: rawData, error: null };
    } catch (error) {
      console.error('Error downloading slides:', error);
      return { data: null, error };
    }
  },

  // Publish content to platform
  async publishContent(platformId: string, platform: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      // Get platform data
      const { data: platformData, error: platformError } = await supabase
        .from('content_platforms')
        .select('*, content_entries(*)')
        .eq('id', platformId)
        .single();

      if (platformError) throw platformError;

      // Get webhook URL
      const { data: profile, error: profileError } = await profileService.getUserProfile(user.id);
      if (profileError || !profile?.webhook_url) {
        throw new Error('Webhook no configurado en el perfil del usuario');
      }

      // Update status to pending
      await this.updatePlatformStatus(platformId, 'pending');

      const webhookPayload = {
        action: 'publish_content',
        entryId: platformData.content_entry_id,
        platformId: platformId,
        platform: platform,
        userEmail: user.email,
        topic: (platformData as any).content_entries.topic,
        description: (platformData as any).content_entries.description,
        content: {
          text: platformData.text,
          images: platformData.images,
          slides_url: platformData.slides_url
        }
      };

      const response = await fetch(profile.webhook_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webhookPayload)
      });

      if (!response.ok) {
        await this.updatePlatformStatus(platformId, 'error');
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.status === `${platform}Published`) {
        await this.updatePlatformStatus(platformId, 'published');
        
        // Update published links in content_entries
        if (result.link) {
          const currentLinks = (platformData as any).content_entries.published_links || {};
          const updatedLinks = { ...currentLinks, [platform]: result.link };
          
          await supabase
            .from('content_entries')
            .update({ published_links: updatedLinks })
            .eq('id', platformData.content_entry_id);
        }
      }

      return { data: result, error: null };
    } catch (error) {
      console.error('Error publishing content:', error);
      return { data: null, error };
    }
  }
};
