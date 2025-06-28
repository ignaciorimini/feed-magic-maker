import { supabase } from '@/integrations/supabase/client';
import { profileService } from '@/services/profileService';

export interface ContentPlatform {
  id: string;
  content_entry_id: string;
  platform: 'instagram' | 'linkedin' | 'twitter' | 'wordpress';
  status: 'pending' | 'generated' | 'edited' | 'scheduled' | 'published';
  text?: string;
  images: string[];
  slides_url?: string;
  publish_date?: string;
  generated_at?: string;
  published_at?: string;
  created_at: string;
  updated_at: string;
  slideImages?: string[];
  publishedLink?: string;
}

export interface ContentEntry {
  id: string;
  user_id: string;
  topic: string;
  description?: string;
  type: string;
  created_date: string;
  created_at: string;
  updated_at: string;
  published_links?: any;
  imageUrl?: string;
  platforms: ContentPlatform[];
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
      if (!user) throw new Error('User not authenticated');

      // Create the main content entry
      const { data: entry, error: entryError } = await supabase
        .from('content_entries')
        .insert({
          user_id: user.id,
          topic: entryData.topic,
          description: entryData.description,
          type: entryData.type,
        })
        .select()
        .single();

      if (entryError) throw entryError;

      // Create platform entries for each selected platform
      const platformEntries = entryData.selectedPlatforms.map(platform => ({
        content_entry_id: entry.id,
        platform: platform as 'instagram' | 'linkedin' | 'twitter' | 'wordpress',
        status: 'pending' as const,
        text: entryData.generatedContent?.[platform]?.text || '',
        images: entryData.generatedContent?.[platform]?.images || [],
        slides_url: entryData.generatedContent?.[platform]?.slidesURL || null,
      }));

      const { data: platforms, error: platformsError } = await supabase
        .from('content_platforms')
        .insert(platformEntries)
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: entries, error: entriesError } = await supabase
        .from('content_entries')
        .select(`
          *,
          platforms:content_platforms(
            *,
            slideImages:slide_images(image_url, position)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (entriesError) throw entriesError;

      // Transform the data to match the expected format
      const transformedEntries = entries?.map(entry => ({
        ...entry,
        platforms: entry.platforms?.map((platform: any) => ({
          ...platform,
          slideImages: platform.slideImages
            ?.sort((a: any, b: any) => a.position - b.position)
            ?.map((img: any) => img.image_url) || []
        })) || []
      })) || [];

      return { data: transformedEntries, error: null };
    } catch (error) {
      console.error('Error fetching content entries:', error);
      return { data: null, error };
    }
  },

  // Update platform content
  async updatePlatformContent(platformId: string, content: any) {
    try {
      const { error } = await supabase
        .from('content_platforms')
        .update({
          text: content.text,
          images: content.images,
          slides_url: content.slidesURL,
          publish_date: content.publishDate,
          updated_at: new Date().toISOString()
        })
        .eq('id', platformId);

      return { error };
    } catch (error) {
      console.error('Error updating platform content:', error);
      return { error };
    }
  },

  // Update platform status
  async updatePlatformStatus(platformId: string, status: 'pending' | 'generated' | 'edited' | 'scheduled' | 'published') {
    try {
      const { error } = await supabase
        .from('content_platforms')
        .update({ 
          status,
          published_at: status === 'published' ? new Date().toISOString() : null
        })
        .eq('id', platformId);

      return { error };
    } catch (error) {
      console.error('Error updating platform status:', error);
      return { error };
    }
  },

  // Add the missing updateImageUrl method
  async updateImageUrl(entryId: string, imageUrl: string | null) {
    try {
      const { error } = await supabase
        .from('content_entries')
        .update({ 
          image_url: imageUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', entryId);

      return { error };
    } catch (error) {
      console.error('Error updating image URL:', error);
      return { error };
    }
  },

  // Delete content entry (cascades to platforms and images)
  async deleteContentEntry(entryId: string) {
    try {
      const { error } = await supabase
        .from('content_entries')
        .delete()
        .eq('id', entryId);

      return { error };
    } catch (error) {
      console.error('Error deleting content entry:', error);
      return { error };
    }
  },

  // Add the missing saveSlideImages method
  async saveSlideImages(platformId: string, slideImages: string[]) {
    try {
      // First, delete existing slide images for this platform
      await supabase
        .from('slide_images')
        .delete()
        .eq('content_platform_id', platformId);

      // Insert new slide images
      if (slideImages.length > 0) {
        const slideImageData = slideImages.map((imageUrl, index) => ({
          content_platform_id: platformId,
          image_url: imageUrl,
          position: index
        }));

        const { error } = await supabase
          .from('slide_images')
          .insert(slideImageData);

        if (error) throw error;
      }

      return { error: null };
    } catch (error) {
      console.error('Error saving slide images:', error);
      return { error };
    }
  },

  // Generate content using webhook
  async generateContent(topic: string, description: string, contentType: string, selectedPlatforms: string[]) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: profile, error: profileError } = await profileService.getUserProfile(user.id);
      if (profileError || !profile?.webhook_url) {
        throw new Error('Webhook not configured in the user profile');
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
      if (!user) throw new Error('User not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('webhook_url')
        .eq('id', user.id)
        .single();

      if (!profile?.webhook_url) {
        throw new Error('No webhook URL configured');
      }

      const response = await fetch(profile.webhook_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'download_slides',
          slidesURL,
          contentName,
          userEmail: user.email
        }),
      });

      if (!response.ok) {
        throw new Error(`Webhook responded with status: ${response.status}`);
      }

      const data = await response.json();
      return { data, error: null };
    } catch (error) {
      console.error('Error downloading slides:', error);
      return { data: null, error };
    }
  },

  // Publish content to platform
  async publishContent(platformId: string, platform: 'instagram' | 'linkedin' | 'wordpress' | 'twitter', contentType?: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('webhook_url')
        .eq('id', user.id)
        .single();

      if (!profile?.webhook_url) {
        throw new Error('No webhook URL configured');
      }

      // Get platform content
      const { data: platformData } = await supabase
        .from('content_platforms')
        .select(`
          *,
          content_entry:content_entries(topic, description, type)
        `)
        .eq('id', platformId)
        .single();

      if (!platformData) {
        throw new Error('Platform content not found');
      }

      const response = await fetch(profile.webhook_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'publish_content',
          platform,
          content: {
            text: platformData.text,
            images: platformData.images,
            topic: platformData.content_entry?.topic,
            description: platformData.content_entry?.description,
            type: platformData.content_entry?.type
          },
          userEmail: user.email
        }),
      });

      if (!response.ok) {
        throw new Error(`Webhook responded with status: ${response.status}`);
      }

      const result = await response.json();

      // Update status to published if successful
      if (result.success) {
        await this.updatePlatformStatus(platformId, 'published');
      }

      return { data: result, error: null };
    } catch (error) {
      console.error('Error publishing content:', error);
      return { data: null, error };
    }
  }
};
