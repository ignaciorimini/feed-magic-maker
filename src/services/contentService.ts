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
            slide_images(
              id,
              image_url,
              position
            ),
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

      const { data: platformData, error: platformError } = await supabase
        .from('content_platforms')
        .insert(platformInserts)
        .select();

      if (platformError) {
        console.error('Error creating platform content:', platformError);
        return { data: null, error: platformError };
      }

      // Create WordPress posts for WordPress platforms
      console.log('Checking for WordPress platforms to create posts...');
      for (const platformRecord of platformData) {
        if (platformRecord.platform === 'wordpress') {
          console.log('Creating WordPress post for platform:', platformRecord.id);
          
          const platform = entryData.selectedPlatforms.find(p => p === 'wordpress');
          const wordpressContent = entryData.generatedContent[platform];
          
          if (wordpressContent) {
            const { error: wpError } = await supabase
              .from('wordpress_posts')
              .insert({
                content_platform_id: platformRecord.id,
                title: wordpressContent.title || entryData.topic,
                description: wordpressContent.description || entryData.description,
                slug: wordpressContent.slug || entryData.topic.toLowerCase().replace(/\s+/g, '-'),
                content: wordpressContent.content || ''
              });

            if (wpError) {
              console.error('Error creating WordPress post:', wpError);
              // Don't fail the entire operation, but log the error
            } else {
              console.log('WordPress post created successfully for platform:', platformRecord.id);
            }
          }
        }
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
            slide_images(
              id,
              image_url,
              position
            ),
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

  updatePlatformContent: async (platformId: string, content: any) => {
    try {
      console.log('=== UPDATE PLATFORM CONTENT ===');
      console.log('Platform ID:', platformId);
      console.log('Content to update:', content);

      // Get the actual platform ID from composite ID if needed
      const actualPlatformId = await contentService.getPlatformIdFromComposite(platformId);
      const idToUse = actualPlatformId || platformId;

      console.log('Using platform ID:', idToUse);

      // First, get the platform to check if it's WordPress
      const { data: platformData, error: platformError } = await supabase
        .from('content_platforms')
        .select('platform')
        .eq('id', idToUse)
        .single();

      if (platformError) {
        console.error('Error fetching platform:', platformError);
        return { data: null, error: platformError };
      }

      // Update the content_platforms table
      const platformUpdate: any = {
        text: content.text || '',
        image_url: content.image_url || null,
        slides_url: content.slidesURL || null,
        content_type: content.contentType || 'simple',
        updated_at: new Date().toISOString()
      };

      if (content.scheduled_at) {
        platformUpdate.scheduled_at = content.scheduled_at;
      }

      const { error: updateError } = await supabase
        .from('content_platforms')
        .update(platformUpdate)
        .eq('id', idToUse);

      if (updateError) {
        console.error('Error updating platform content:', updateError);
        return { data: null, error: updateError };
      }

      // If it's WordPress, also update the WordPress post
      if (platformData.platform === 'wordpress') {
        console.log('Updating WordPress post...');
        
        const wordpressUpdate: any = {
          updated_at: new Date().toISOString()
        };

        if (content.title) wordpressUpdate.title = content.title;
        if (content.description) wordpressUpdate.description = content.description;
        if (content.slug) wordpressUpdate.slug = content.slug;
        if (content.text) wordpressUpdate.content = content.text;

        const { error: wpError } = await supabase
          .from('wordpress_posts')
          .update(wordpressUpdate)
          .eq('content_platform_id', idToUse);

        if (wpError) {
          console.error('Error updating WordPress post:', wpError);
          return { data: null, error: wpError };
        }

        console.log('WordPress post updated successfully');
      }

      console.log('Platform content updated successfully');
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
      console.log('=== STARTING PUBLISH CONTENT ===');
      console.log('Platform ID:', platformId);
      console.log('Platform:', platform);

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

      console.log('Webhook URL found:', profile.webhook_url);

      const [contentEntryId] = platformId.split('__');

      // Get content entry data
      const { data: entryData, error: entryError } = await supabase
        .from('content_entries')
        .select('*')
        .eq('id', contentEntryId)
        .single();

      if (entryError) {
        console.error('Error fetching content entry:', entryError);
        throw new Error('Failed to fetch content entry');
      }

      // Get platform data
      const { data: platformData, error: platformError } = await supabase
        .from('content_platforms')
        .select(`
          *,
          wordpress_post:wordpress_posts(
            title,
            description,
            slug,
            content
          )
        `)
        .eq('content_entry_id', contentEntryId)
        .eq('platform', platform as 'instagram' | 'linkedin' | 'twitter' | 'wordpress')
        .single();

      if (platformError) {
        console.error('Error fetching platform content:', platformError);
        throw new Error('Failed to fetch platform content');
      }

      console.log('Sending data to webhook:', {
        action: 'publish_content',
        content_entry: entryData,
        content_platform: platformData,
      });

      // Send request to N8N webhook
      const response = await fetch(profile.webhook_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'publish_content',
          content_entry: entryData,
          content_platform: platformData,
        }),
      });

      console.log('Webhook response status:', response.status);
      console.log('Webhook response headers:', response.headers);

      if (!response.ok) {
        console.error('Webhook response not OK:', response.status, response.statusText);
        throw new Error(`Failed to publish content: ${response.status} ${response.statusText}`);
      }

      // Handle different response types
      let result;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        try {
          result = await response.json();
          console.log('JSON response received:', result);
        } catch (jsonError) {
          console.warn('Failed to parse JSON response:', jsonError);
          // If JSON parsing fails, treat as success but with empty result
          result = { status: 'success', message: 'Content sent to N8N successfully' };
        }
      } else {
        // Handle non-JSON responses (text, HTML, etc.)
        const textResponse = await response.text();
        console.log('Non-JSON response received:', textResponse);
        result = { 
          status: 'success', 
          message: 'Content sent to N8N successfully',
          response: textResponse 
        };
      }

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
          action: 'download_slides',
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
      console.log('Slides downloaded successfully:', result);
      return { data: result, error: null };
    } catch (error) {
      console.error('Error in downloadSlidesWithUserWebhook:', error);
      return { data: null, error };
    }
  },

  downloadSlidesForPlatform: async (platformId: string, slidesURL: string, topic: string) => {
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
          action: 'download_slides',
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
      console.log('Slides downloaded successfully:', result);
      
      // Save the slide images to the database if they exist in the response
      if (Array.isArray(result) && result.length > 0 && result[0].slideImages && Array.isArray(result[0].slideImages)) {
        const actualPlatformId = await contentService.getPlatformIdFromComposite(platformId);
        if (actualPlatformId) {
          await contentService.saveSlideImages(actualPlatformId, result[0].slideImages);
        }
      }
      
      return { data: result, error: null };
    } catch (error) {
      console.error('Error in downloadSlidesForPlatform:', error);
      return { data: null, error };
    }
  },

  saveSlideImages: async (platformId: string, slideImages: string[]) => {
    try {
      console.log('Saving slide images for platform:', platformId, 'Images:', slideImages);
      
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

      console.log('Slide images saved successfully:', data);
      return { data, error: null };
    } catch (error) {
      console.error('Unexpected error saving slide images:', error);
      return { data: null, error };
    }
  },

  getSlideImages: async (platformId: string) => {
    try {
      // Get the actual platform ID if it's a composite ID
      const actualPlatformId = await contentService.getPlatformIdFromComposite(platformId);
      const idToUse = actualPlatformId || platformId;
      
      console.log('Getting slide images for platform ID:', idToUse);
      
      const { data, error } = await supabase
        .from('slide_images')
        .select('*')
        .eq('content_platform_id', idToUse)
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
