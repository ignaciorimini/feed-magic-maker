import { supabase } from '@/integrations/supabase/client';

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
  platforms: ContentPlatform[];
}

export interface ContentPlatform {
  id: string;
  content_entry_id: string;
  platform: string;
  status: string;
  text?: string;
  images?: string[];
  slides_url?: string;
  publish_date?: string;
  slideImages?: string[];
  uploadedImages?: string[];
}

export const contentService = {
  async createContentEntry(entryData: {
    topic: string;
    description: string;
    type: string;
    selectedPlatforms: string[];
    generatedContent?: any;
  }) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

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

      // Create platform entries with proper type casting
      const platformsData = entryData.selectedPlatforms.map(platform => ({
        content_entry_id: entry.id,
        platform: platform as 'instagram' | 'linkedin' | 'twitter' | 'wordpress',
        status: 'pending' as 'pending' | 'generated' | 'edited' | 'scheduled' | 'published',
        text: entryData.generatedContent?.[platform]?.text || '',
        images: entryData.generatedContent?.[platform]?.images || [],
        slides_url: entryData.generatedContent?.[platform]?.slidesURL || null,
      }));

      const { data: platforms, error: platformsError } = await supabase
        .from('content_platforms')
        .insert(platformsData)
        .select();

      if (platformsError) throw platformsError;

      return { data: { entry, platforms }, error: null };
    } catch (error) {
      console.error('Error creating content entry:', error);
      return { data: null, error };
    }
  },

  async getUserContentEntries() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { data: entries, error } = await supabase
        .from('content_entries')
        .select(`
          *,
          platforms:content_platforms(
            id,
            platform,
            status,
            text,
            images,
            slides_url,
            publish_date,
            slideImages:slide_images(image_url, position),
            uploadedImages:uploaded_images(image_url)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform the data to include slideImages as an array of URLs
      const transformedEntries = entries?.map(entry => ({
        ...entry,
        platforms: entry.platforms.map((platform: any) => ({
          ...platform,
          slideImages: platform.slideImages?.sort((a: any, b: any) => a.position - b.position).map((img: any) => img.image_url) || [],
          uploadedImages: platform.uploadedImages?.map((img: any) => img.image_url) || []
        }))
      })) || [];

      return { data: transformedEntries, error: null };
    } catch (error) {
      console.error('Error fetching content entries:', error);
      return { data: null, error };
    }
  },

  async updatePlatformContent(platformId: string, content: any) {
    try {
      const { error } = await supabase
        .from('content_platforms')
        .update({
          text: content.text,
          images: content.images || [],
          slides_url: content.slidesURL,
        })
        .eq('id', platformId);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Error updating platform content:', error);
      return { error };
    }
  },

  async deleteContentEntry(entryId: string) {
    try {
      console.log('Deleting content entry with ID:', entryId);
      
      // Get all platforms for this entry
      const { data: platforms, error: platformsError } = await supabase
        .from('content_platforms')
        .select('id')
        .eq('content_entry_id', entryId);

      if (platformsError) {
        console.error('Error fetching platforms for deletion:', platformsError);
        throw platformsError;
      }

      console.log('Found platforms to delete:', platforms);

      // Delete slide images for all platforms
      if (platforms && platforms.length > 0) {
        const platformIds = platforms.map(p => p.id);
        
        console.log('Deleting slide images for platforms:', platformIds);
        await supabase
          .from('slide_images')
          .delete()
          .in('content_platform_id', platformIds);

        console.log('Deleting uploaded images for platforms:', platformIds);
        await supabase
          .from('uploaded_images')
          .delete()
          .in('content_platform_id', platformIds);
      }

      // Delete all platforms for this entry
      console.log('Deleting platforms for entry:', entryId);
      const { error: deletePlatformsError } = await supabase
        .from('content_platforms')
        .delete()
        .eq('content_entry_id', entryId);

      if (deletePlatformsError) {
        console.error('Error deleting platforms:', deletePlatformsError);
        throw deletePlatformsError;
      }

      // Delete the main entry
      console.log('Deleting main entry:', entryId);
      const { error: deleteEntryError } = await supabase
        .from('content_entries')
        .delete()
        .eq('id', entryId);

      if (deleteEntryError) {
        console.error('Error deleting main entry:', deleteEntryError);
        throw deleteEntryError;
      }

      console.log('Successfully deleted content entry:', entryId);
      return { error: null };
    } catch (error) {
      console.error('Error deleting content entry:', error);
      return { error };
    }
  },

  async downloadSlidesWithUserWebhook(slidesURL: string, topic: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('webhook_url')
        .eq('id', user.id)
        .single();

      if (profileError || !profile?.webhook_url) {
        throw new Error('Webhook URL not configured');
      }

      const response = await fetch(profile.webhook_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'download_slides',
          slidesURL: slidesURL,
          topic: topic,
          userEmail: user.email
        }),
      });

      if (!response.ok) {
        throw new Error(`Webhook error: ${response.status}`);
      }

      const result = await response.json();
      return { data: result, error: null };
    } catch (error) {
      console.error('Error downloading slides:', error);
      return { data: null, error };
    }
  },

  async generateImageForPlatform(platformId: string, platform: string, topic: string, description: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      console.log('Generating image for platform:', platformId, platform);

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('webhook_url')
        .eq('id', user.id)
        .single();

      if (profileError || !profile?.webhook_url) {
        throw new Error('Webhook URL not configured');
      }

      const webhookPayload = {
        action: 'generate_image',
        platform: platform,
        platformId: platformId,
        topic: topic,
        description: description,
        userEmail: user.email
      };

      console.log('Sending webhook payload:', webhookPayload);

      const response = await fetch(profile.webhook_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookPayload),
      });

      if (!response.ok) {
        throw new Error(`Webhook error: ${response.status}`);
      }

      const result = await response.json();
      console.log('Webhook response:', result);
      
      // Handle the array response format
      if (Array.isArray(result) && result.length > 0) {
        const responseData = result[0]?.response?.body;
        if (responseData?.imageURL) {
          console.log('Updating platform with new image URL:', responseData.imageURL);
          
          // Update the platform with the new image
          const { error: updateError } = await supabase
            .from('content_platforms')
            .update({
              images: [responseData.imageURL]
            })
            .eq('id', platformId);

          if (updateError) {
            console.error('Error updating platform with image:', updateError);
            throw updateError;
          }

          return { data: { imageUrl: responseData.imageURL }, error: null };
        }
      }

      // Fallback for direct response format
      if (result.imageURL) {
        console.log('Updating platform with new image URL (direct format):', result.imageURL);
        
        const { error: updateError } = await supabase
          .from('content_platforms')
          .update({
            images: [result.imageURL]
          })
          .eq('id', platformId);

        if (updateError) {
          console.error('Error updating platform with image:', updateError);
          throw updateError;
        }

        return { data: { imageUrl: result.imageURL }, error: null };
      }

      throw new Error('No image URL received from webhook');
    } catch (error) {
      console.error('Error generating image:', error);
      return { data: null, error };
    }
  },

  async uploadCustomImage(platformId: string, imageUrl: string) {
    try {
      const { error } = await supabase
        .from('uploaded_images')
        .insert({
          content_platform_id: platformId,
          image_url: imageUrl
        });

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Error uploading custom image:', error);
      return { error };
    }
  },

  async deleteImageFromPlatform(platformId: string, imageUrl: string, isUploaded: boolean) {
    try {
      if (isUploaded) {
        // Delete from uploaded_images table
        const { error } = await supabase
          .from('uploaded_images')
          .delete()
          .eq('content_platform_id', platformId)
          .eq('image_url', imageUrl);

        if (error) throw error;
      } else {
        // Remove from images array in content_platforms
        const { data: platform, error: fetchError } = await supabase
          .from('content_platforms')
          .select('images')
          .eq('id', platformId)
          .single();

        if (fetchError) throw fetchError;

        const updatedImages = (platform.images || []).filter((img: string) => img !== imageUrl);

        const { error: updateError } = await supabase
          .from('content_platforms')
          .update({ images: updatedImages })
          .eq('id', platformId);

        if (updateError) throw updateError;
      }

      return { error: null };
    } catch (error) {
      console.error('Error deleting image:', error);
      return { error };
    }
  },

  async saveSlideImages(platformId: string, slideImages: string[]) {
    try {
      // First, delete existing slide images for this platform
      await supabase
        .from('slide_images')
        .delete()
        .eq('content_platform_id', platformId);

      // Insert new slide images
      const slideImagesData = slideImages.map((imageUrl, index) => ({
        content_platform_id: platformId,
        image_url: imageUrl,
        position: index
      }));

      const { error } = await supabase
        .from('slide_images')
        .insert(slideImagesData);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Error saving slide images:', error);
      return { error };
    }
  },

  async publishContent(platformId: string, platform: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('webhook_url')
        .eq('id', user.id)
        .single();

      if (profileError || !profile?.webhook_url) {
        throw new Error('Webhook URL not configured');
      }

      const response = await fetch(profile.webhook_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'publish_content',
          platformId: platformId,
          platform: platform,
          userEmail: user.email
        }),
      });

      if (!response.ok) {
        throw new Error(`Webhook error: ${response.status}`);
      }

      const result = await response.json();
      return { data: result, error: null };
    } catch (error) {
      console.error('Error publishing content:', error);
      return { data: null, error };
    }
  }
};
