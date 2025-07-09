import { supabase } from '@/integrations/supabase/client';

export const contentService = {
  getUserContentEntries: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { data: null, error: new Error('User not authenticated') };
      }

      const { data, error } = await supabase
        .from('content_entries')
        .select(`
          *,
          platforms:content_platforms(
            id,
            platform,
            status,
            text,
            image_url,
            slides_url,
            content_type,
            published_url,
            scheduled_at,
            wordpress_post:wordpress_posts(
              title,
              description,
              slug,
              content
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching content entries:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Unexpected error fetching content entries:', error);
      return { data: null, error };
    }
  },

  createContentEntry: async (entryData: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { data: null, error: new Error('User not authenticated') };
      }

      // Create content entry
      const { data: entry, error: entryError } = await supabase
        .from('content_entries')
        .insert([{
          topic: entryData.topic,
          description: entryData.description,
          type: entryData.type,
          user_id: user.id
        }])
        .select()
        .single();

      if (entryError) {
        console.error('Error creating content entry:', entryError);
        return { data: null, error: entryError };
      }

      // Create platform content
      const platformInserts = [];
      for (const platform of entryData.selectedPlatforms) {
        const content = entryData.generatedContent[platform];
        platformInserts.push({
          content_entry_id: entry.id,
          platform: platform,
          text: content.text || '',
          image_url: content.image_url || null,
          slides_url: content.slidesURL || null,
          content_type: entryData.platformTypes?.[platform] || 'simple',
          status: 'generated'
        });
      }

      const { error: platformError } = await supabase
        .from('content_platforms')
        .insert(platformInserts);

      if (platformError) {
        console.error('Error creating platform content:', platformError);
        return { data: null, error: platformError };
      }

      return { data: entry, error: null };
    } catch (error) {
      console.error('Unexpected error creating content entry:', error);
      return { data: null, error };
    }
  },

  updateContentEntry: async (entryId: string, updateData: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { data: null, error: new Error('User not authenticated') };
      }

      const { data, error } = await supabase
        .from('content_entries')
        .update(updateData)
        .eq('id', entryId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating content entry:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Unexpected error updating content entry:', error);
      return { data: null, error };
    }
  },

  getContentEntryById: async (entryId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { data: null, error: new Error('User not authenticated') };
      }

      const { data, error } = await supabase
        .from('content_entries')
        .select(`
          *,
          platforms:content_platforms(
            id,
            platform,
            status,
            text,
            image_url,
            slides_url,
            content_type,
            published_url,
            scheduled_at,
            wordpress_post:wordpress_posts(
              title,
              description,
              slug,
              content
            )
          )
        `)
        .eq('id', entryId)
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching content entry:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Unexpected error fetching content entry:', error);
      return { data: null, error };
    }
  },

  updatePlatformContent: async (entryId: string, content: any) => {
    try {
      const { error } = await supabase
        .from('content_platforms')
        .update({
          text: content.text,
          image_url: content.image_url,
          slides_url: content.slidesURL,
          content_type: content.contentType,
          scheduled_at: content.scheduledAt
        })
        .eq('id', entryId);

      if (error) {
        console.error('Error updating platform content:', error);
        return { data: null, error };
      }

      return { data: null, error: null };
    } catch (error) {
      console.error('Unexpected error updating platform content:', error);
      return { data: null, error };
    }
  },

  updatePlatformSchedule: async (entryId: string, scheduledAt: string) => {
    try {
      const [contentEntryId, platform] = entryId.split('__');

      const updateData = scheduledAt ? { scheduled_at: scheduledAt } : { scheduled_at: null };

      const { error } = await supabase
        .from('content_platforms')
        .update(updateData)
        .eq('content_entry_id', contentEntryId)
        .eq('platform', platform as 'instagram' | 'linkedin' | 'twitter' | 'wordpress');

      if (error) {
        console.error('Error updating platform schedule:', error);
        return { data: null, error };
      }

      return { data: null, error: null };
    } catch (error) {
      console.error('Unexpected error updating platform schedule:', error);
      return { data: null, error };
    }
  },

  deletePlatform: async (platformId: string) => {
    try {
      const [contentEntryId, platform] = platformId.split('__');

      const { error } = await supabase
        .from('content_platforms')
        .delete()
        .eq('content_entry_id', contentEntryId)
        .eq('platform', platform as 'instagram' | 'linkedin' | 'twitter' | 'wordpress');

      if (error) {
        console.error('Error deleting platform:', error);
        return { data: null, error };
      }

      return { data: null, error: null };
    } catch (error) {
      console.error('Unexpected error deleting platform:', error);
      return { data: null, error };
    }
  },

  getPlatformIdFromComposite: async (compositeId: string) => {
    try {
      const [entryId, platform] = compositeId.split('__');
      
      const { data, error } = await supabase
        .from('content_platforms')
        .select('id')
        .eq('content_entry_id', entryId)
        .eq('platform', platform as 'instagram' | 'linkedin' | 'twitter' | 'wordpress')
        .single();

      if (error) {
        console.error('Error getting platform ID:', error);
        return null;
      }

      return data.id;
    } catch (error) {
      console.error('Unexpected error getting platform ID:', error);
      return null;
    }
  },

  updatePlatformStatus: async (platformId: string, status: 'published' | 'pending' | 'error', publishedUrl?: string) => {
    try {
      console.log('=== UPDATING PLATFORM STATUS ===');
      console.log('Platform ID:', platformId);
      console.log('Status:', status);
      console.log('Published URL:', publishedUrl);

      // Extract the actual platform ID from composite ID if needed
      const actualPlatformId = await contentService.getPlatformIdFromComposite(platformId);
      
      const updateData: any = {
        status: status,
        updated_at: new Date().toISOString(),
      };

      // Set published_at if status is published
      if (status === 'published') {
        updateData.published_at = new Date().toISOString();
      }

      // Set published_url if provided
      if (publishedUrl) {
        updateData.published_url = publishedUrl;
      }

      const { data, error } = await supabase
        .from('content_platforms')
        .update(updateData)
        .eq('id', actualPlatformId)
        .select()
        .single();

      if (error) {
        console.error('Error updating platform status:', error);
        throw error;
      }

      console.log('✅ Platform status updated successfully:', data);
      return { data, error: null };

    } catch (error) {
      console.error('Error in updatePlatformStatus:', error);
      return { data: null, error };
    }
  },

  publishContent: async (platformId: string, platform: string) => {
    try {
      const publishContentURL = process.env.NEXT_PUBLIC_PUBLISH_CONTENT_URL;

      if (!publishContentURL) {
        throw new Error('Publish content URL is not defined in environment variables.');
      }

      const [contentEntryId] = platformId.split('__');

      const { data: entryData, error: entryError } = await supabase
        .from('content_entries')
        .select('*')
        .eq('id', contentEntryId)
        .single();

      if (entryError) {
        console.error('Error fetching content entry:', entryError);
        return { data: null, error: entryError };
      }

      const { data: platformData, error: platformError } = await supabase
        .from('content_platforms')
        .select('*')
        .eq('content_entry_id', contentEntryId)
        .eq('platform', platform as 'instagram' | 'linkedin' | 'twitter' | 'wordpress')
        .single();

      if (platformError) {
        console.error('Error fetching platform content:', platformError);
        return { data: null, error: platformError };
      }

      const response = await fetch(publishContentURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content_entry: entryData,
          content_platform: platformData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error publishing content:', errorData);
        throw new Error(`Failed to publish content: ${response.statusText}`);
      }

      const result = await response.json();
      return { data: result, error: null };
    } catch (error) {
      console.error('Error in publishContent:', error);
      return { data: null, error };
    }
  },

  generateImageForPlatform: async (entryId: string, platform: string, topic: string, description: string) => {
    try {
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Get the user's webhook URL from their profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('webhook_url')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching user profile:', profileError);
        throw new Error('Failed to fetch user profile');
      }

      if (!profile?.webhook_url) {
        throw new Error('Webhook URL is not configured in your profile. Please set up your webhook URL in profile settings.');
      }

      const response = await fetch(profile.webhook_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'generate_image',
          topic: topic,
          description: description,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error generating image:', errorData);
        throw new Error(`Failed to generate image: ${response.statusText}`);
      }

      const result = await response.json();
      const imageURL = result.imageURL;

      if (!imageURL) {
        throw new Error('No image URL returned from webhook');
      }

      const [contentEntryId, platformName] = entryId.split('__');

      const { data, error } = await supabase
        .from('content_platforms')
        .update({ image_url: imageURL })
        .eq('content_entry_id', contentEntryId)
        .eq('platform', platformName as 'instagram' | 'linkedin' | 'twitter' | 'wordpress');

      if (error) {
        console.error('Error saving generated image URL to database:', error);
        return { data: null, error };
      }

      return { data: { imageURL }, error: null };
    } catch (error) {
      console.error('Error in generateImageForPlatform:', error);
      return { data: null, error };
    }
  },

  deleteImageFromPlatform: async (entryId: string, imageUrl?: string, isUploaded?: boolean) => {
    try {
      const [contentEntryId, platform] = entryId.split('__');

      const { data, error } = await supabase
        .from('content_platforms')
        .update({ image_url: null })
        .eq('content_entry_id', contentEntryId)
        .eq('platform', platform as 'instagram' | 'linkedin' | 'twitter' | 'wordpress');

      if (error) {
        console.error('Error deleting image from platform:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Unexpected error deleting image from platform:', error);
      return { data: null, error };
    }
  },

  uploadCustomImage: async (entryId: string, imageUrl: string) => {
    try {
      const [contentEntryId, platform] = entryId.split('__');
      
      const { data, error } = await supabase
        .from('content_platforms')
        .update({ image_url: imageUrl })
        .eq('content_entry_id', contentEntryId)
        .eq('platform', platform as 'instagram' | 'linkedin' | 'twitter' | 'wordpress');

      if (error) {
        console.error('Error uploading custom image:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Unexpected error uploading custom image:', error);
      return { data: null, error };
    }
  },

  downloadSlidesWithUserWebhook: async (slidesURL: string, topic: string) => {
    try {
      const slidesToImagesURL = process.env.NEXT_PUBLIC_SLIDES_TO_IMAGES_URL;

      if (!slidesToImagesURL) {
        throw new Error('Slides to images URL is not defined in environment variables.');
      }

      const response = await fetch(slidesToImagesURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          slidesURL: slidesURL,
          topic: topic,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error downloading slides:', errorData);
        throw new Error(`Failed to download slides: ${response.statusText}`);
      }

      const result = await response.json();
      return { data: result, error: null };
    } catch (error) {
      console.error('Error in downloadSlidesWithUserWebhook:', error);
      return { data: null, error };
    }
  },

  downloadSlidesForPlatform: async (platformId: string, slidesURL: string, topic: string) => {
    try {
      const slidesToImagesURL = process.env.NEXT_PUBLIC_SLIDES_TO_IMAGES_URL;

      if (!slidesToImagesURL) {
        throw new Error('Slides to images URL is not defined in environment variables.');
      }

      const response = await fetch(slidesToImagesURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          slidesURL: slidesURL,
          topic: topic,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error downloading slides:', errorData);
        throw new Error(`Failed to download slides: ${response.statusText}`);
      }

      const result = await response.json();

      await contentService.saveSlideImages(platformId, result[0].slideImages);

      return { data: result, error: null };
    } catch (error) {
      console.error('Error in downloadSlidesForPlatform:', error);
      return { data: null, error };
    }
  },

  saveSlideImages: async (platformId: string, slideImages: string[]) => {
    try {
      const { error: deleteError } = await supabase
        .from('slide_images')
        .delete()
        .eq('content_platform_id', platformId);

      if (deleteError) {
        console.error('Error deleting existing slide images:', deleteError);
        return { data: null, error: deleteError };
      }

      const slidesToInsert = slideImages.map((image_url, index) => ({
        content_platform_id: platformId,
        image_url: image_url,
        position: index
      }));

      const { data, error } = await supabase
        .from('slide_images')
        .insert(slidesToInsert);

      if (error) {
        console.error('Error saving slide images:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Unexpected error saving slide images:', error);
      return { data: null, error };
    }
  },

  getSlideImages: async (platformId: string) => {
    try {
      const { data, error } = await supabase
        .from('slide_images')
        .select('*')
        .eq('content_platform_id', platformId)
        .order('position');

      if (error) {
        console.error('Error fetching slide images:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Unexpected error fetching slide images:', error);
      return { data: null, error };
    }
  },

  getScheduledContent: async () => {
    try {
      const { data, error } = await supabase
        .from('content_platforms')
        .select(`
          *,
          content_entries!content_platforms_content_entry_id_fkey (
            id,
            topic,
            description,
            type,
            user_id
          )
        `)
        .not('scheduled_at', 'is', null)
        .order('scheduled_at', { ascending: true });

      if (error) {
        console.error('Error fetching scheduled content:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Unexpected error fetching scheduled content:', error);
      return { data: null, error };
    }
  },
};
