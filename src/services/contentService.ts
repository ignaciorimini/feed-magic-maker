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
  image_url?: string;
  slides_url?: string;
  publish_date?: string;
  content_type?: string;
  slideImages?: string[];
  uploadedImages?: string[];
  wordpressPost?: {
    title: string;
    description: string;
    slug: string;
    content: string;
  };
}

export const contentService = {
  async createContentEntry(entryData: {
    topic: string;
    description: string;
    type: string;
    selectedPlatforms: string[];
    generatedContent?: any;
    platformTypes?: Record<string, string>;
  }) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      console.log("=== CREATING CONTENT ENTRY ===");
      console.log("Entry data:", entryData);

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

      if (entryError) {
        console.error("Error creating main entry:", entryError);
        throw entryError;
      }

      console.log("Main entry created:", entry);

      // Create platform entries with the generated content
      const platformsData = entryData.selectedPlatforms.map(platform => {
        const platformContent = entryData.generatedContent?.[platform];
        console.log(`Processing platform ${platform}:`, platformContent);
        
        return {
          content_entry_id: entry.id,
          platform: platform as 'instagram' | 'linkedin' | 'twitter' | 'wordpress',
          status: 'generated' as 'pending' | 'generated' | 'edited' | 'scheduled' | 'published',
          text: platformContent?.text || '',
          slides_url: platformContent?.slidesURL || null,
          content_type: entryData.platformTypes?.[platform] || (platform === 'wordpress' ? 'article' : 'simple'),
        };
      });

      console.log("Platform data to insert:", platformsData);

      const { data: platforms, error: platformsError } = await supabase
        .from('content_platforms')
        .insert(platformsData)
        .select();

      if (platformsError) {
        console.error("Error creating platform entries:", platformsError);
        throw platformsError;
      }

      console.log("Platform entries created:", platforms);

      // Create WordPress posts for WordPress platforms
      const wordpressPlatforms = platforms?.filter(p => p.platform === 'wordpress') || [];
      for (const platform of wordpressPlatforms) {
        const wordpressContent = entryData.generatedContent?.wordpress;
        if (wordpressContent) {
          const { error: wpError } = await supabase
            .from('wordpress_posts')
            .insert({
              content_platform_id: platform.id,
              title: wordpressContent.title || entryData.topic,
              description: wordpressContent.description || entryData.description || '',
              slug: wordpressContent.slug || entryData.topic.toLowerCase().replace(/\s+/g, '-'),
              content: wordpressContent.content || wordpressContent.text || '',
            });

          if (wpError) {
            console.error("Error creating WordPress post:", wpError);
            // Don't throw here, just log the error
          }
        }
      }

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

      console.log('Fetching content entries for user:', user.id);

      const { data: entries, error } = await supabase
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
            publish_date,
            content_type,
            slideImages:slide_images(image_url, position),
            uploadedImages:uploaded_images(image_url),
            wordpressPost:wordpress_posts(title, description, slug, content)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Database error fetching entries:', error);
        throw error;
      }

      console.log('Raw entries from database:', entries);

      // Transform the data with improved image_url handling and slide images
      const transformedEntries = entries?.map(entry => ({
        ...entry,
        platforms: entry.platforms.map((platform: any) => {
          console.log(`Processing platform ${platform.platform} - image_url:`, platform.image_url);
          
          return {
            ...platform,
            // Keep image_url as a single string (the main field from database)
            image_url: platform.image_url || null,
            // Transform slideImages array - sorted by position
            slideImages: platform.slideImages?.sort((a: any, b: any) => a.position - b.position).map((img: any) => img.image_url) || [],
            // Transform uploadedImages array  
            uploadedImages: platform.uploadedImages?.map((img: any) => img.image_url) || [],
            // Transform WordPress post data
            wordpressPost: platform.wordpressPost?.[0] || null
          };
        })
      })) || [];

      console.log('Transformed entries with WordPress data:', transformedEntries);

      return { data: transformedEntries, error: null };
    } catch (error) {
      console.error('Error fetching content entries:', error);
      return { data: null, error };
    }
  },

  async updatePlatformContent(platformId: string, content: any) {
    try {
      // Extract the original platform ID if it contains the separator
      const originalPlatformId = platformId.includes('__') ? 
        await this.getPlatformIdFromComposite(platformId) : platformId;

      const { error } = await supabase
        .from('content_platforms')
        .update({
          text: content.text,
          slides_url: content.slidesURL,
        })
        .eq('id', originalPlatformId);

      if (error) throw error;

      // Update WordPress post if it exists
      if (content.title || content.description || content.slug || content.content) {
        const { error: wpError } = await supabase
          .from('wordpress_posts')
          .upsert({
            content_platform_id: originalPlatformId,
            title: content.title,
            description: content.description,
            slug: content.slug,
            content: content.content,
          });

        if (wpError) {
          console.error("Error updating WordPress post:", wpError);
        }
      }

      return { error: null };
    } catch (error) {
      console.error('Error updating platform content:', error);
      return { error };
    }
  },

  async deleteContentEntry(entryId: string) {
    try {
      console.log('=== DELETING CONTENT ENTRY ===');
      console.log('Entry ID received:', entryId);
      
      // Ensure we have a complete UUID (36 characters with dashes)
      if (!entryId || entryId.length !== 36 || !entryId.includes('-')) {
        console.error('Invalid entry ID format:', entryId);
        throw new Error(`Invalid entry ID format: ${entryId}. Expected full UUID.`);
      }
      
      // Get all platforms for this entry using the complete entry ID
      console.log('Fetching platforms for entry ID:', entryId);
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

        console.log('Deleting WordPress posts for platforms:', platformIds);
        await supabase
          .from('wordpress_posts')
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

  async generateImageForPlatform(entryId: string, platform: string, topic: string, description: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      console.log('=== GENERATING IMAGE FOR PLATFORM ===');
      console.log('Entry ID:', entryId);
      console.log('Platform:', platform);

      // Get the actual platform ID
      const platformId = await this.getPlatformIdFromComposite(entryId, platform);
      
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
      console.log('Webhook response for image generation:', result);
      
      // Handle different webhook response formats
      let imageUrl = null;
      
      if (Array.isArray(result) && result.length > 0) {
        const firstResult = result[0];
        if (firstResult.imageURL) {
          imageUrl = firstResult.imageURL;
        }
      } else if (result && typeof result === 'object' && result.imageURL) {
        imageUrl = result.imageURL;
      }

      if (!imageUrl) {
        console.error('No imageURL in webhook response:', result);
        throw new Error('No image URL received from webhook');
      }

      console.log('=== UPDATING PLATFORM WITH IMAGE URL ===');
      console.log('Platform ID:', platformId);
      console.log('Image URL:', imageUrl);
      
      // Update the specific platform with the new image URL
      const { data: updateData, error: updateError } = await supabase
        .from('content_platforms')
        .update({
          image_url: imageUrl,
          status: 'generated'
        })
        .eq('id', platformId)
        .select('id, image_url, platform, status')
        .single();

      if (updateError) {
        console.error('Error updating platform with image:', updateError);
        throw updateError;
      }

      console.log('Platform updated successfully:', updateData);
      return { data: { imageUrl }, error: null };
    } catch (error) {
      console.error('Error generating image:', error);
      return { data: null, error };
    }
  },

  async uploadCustomImage(platformId: string, imageUrl: string) {
    try {
      console.log('=== UPLOADING CUSTOM IMAGE ===');
      console.log('Platform ID:', platformId);
      console.log('Image URL:', imageUrl);

      // Ensure we have a complete platform UUID
      if (!platformId || platformId.length !== 36 || !platformId.includes('-')) {
        console.error('Invalid platform ID format:', platformId);
        throw new Error(`Invalid platform ID format: ${platformId}. Expected full UUID.`);
      }

      const { error } = await supabase
        .from('uploaded_images')
        .insert({
          content_platform_id: platformId, // Use complete platform ID
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
      console.log('=== DELETING IMAGE FROM PLATFORM ===');
      console.log('Platform ID:', platformId);
      console.log('Image URL:', imageUrl);
      console.log('Is uploaded:', isUploaded);

      // Ensure we have a complete platform UUID
      if (!platformId || platformId.length !== 36 || !platformId.includes('-')) {
        console.error('Invalid platform ID format:', platformId);
        throw new Error(`Invalid platform ID format: ${platformId}. Expected full UUID.`);
      }

      if (isUploaded) {
        // Delete from uploaded_images table using complete platform ID
        const { error } = await supabase
          .from('uploaded_images')
          .delete()
          .eq('content_platform_id', platformId) // Use complete platform ID
          .eq('image_url', imageUrl);

        if (error) throw error;
      }

      return { error: null };
    } catch (error) {
      console.error('Error deleting image:', error);
      return { error };
    }
  },

  async saveSlideImages(platformId: string, slideImages: string[]) {
    try {
      console.log('=== SAVING SLIDE IMAGES ===');
      console.log('Platform ID:', platformId);
      console.log('Slide images count:', slideImages.length);

      // Get the actual platform ID from composite ID if needed
      const actualPlatformId = await this.getPlatformIdFromComposite(platformId);

      // First, delete existing slide images for this platform
      await supabase
        .from('slide_images')
        .delete()
        .eq('content_platform_id', actualPlatformId);

      // Insert new slide images
      const slideImagesData = slideImages.map((imageUrl, index) => ({
        content_platform_id: actualPlatformId,
        image_url: imageUrl,
        position: index
      }));

      const { error } = await supabase
        .from('slide_images')
        .insert(slideImagesData);

      if (error) throw error;
      
      console.log('✅ Slide images saved successfully');
      return { error: null };
    } catch (error) {
      console.error('Error saving slide images:', error);
      return { error };
    }
  },

  async publishContent(platformId: string, platform: string) {
    try {
      console.log('=== PUBLISHING CONTENT ===');
      console.log('Platform ID:', platformId);
      console.log('Platform:', platform);

      // Get the actual platform ID
      const actualPlatformId = await this.getPlatformIdFromComposite(platformId);

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
          platformId: actualPlatformId,
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
  },

  // Helper function to get the actual platform ID from composite ID
  async getPlatformIdFromComposite(compositeId: string, platform?: string): Promise<string> {
    // If it's already a UUID, return as is
    if (compositeId.length === 36 && compositeId.includes('-') && !compositeId.includes('__')) {
      return compositeId;
    }

    // If it's a composite ID (entryId__platform), extract the parts
    if (compositeId.includes('__')) {
      const [entryId, platformName] = compositeId.split('__');
      
      // Query the database to get the actual platform ID
      const { data: platformRecord, error } = await supabase
        .from('content_platforms')
        .select('id')
        .eq('content_entry_id', entryId)
        .eq('platform', platformName as 'instagram' | 'linkedin' | 'twitter' | 'wordpress')
        .single();

      if (error || !platformRecord) {
        throw new Error(`Platform record not found for ${compositeId}`);
      }

      return platformRecord.id;
    }

    // If platform is provided, try to find by entry ID and platform
    if (platform) {
      const { data: platformRecord, error } = await supabase
        .from('content_platforms')
        .select('id')
        .eq('content_entry_id', compositeId)
        .eq('platform', platform as 'instagram' | 'linkedin' | 'twitter' | 'wordpress')
        .single();

      if (error || !platformRecord) {
        throw new Error(`Platform record not found for entry ${compositeId} and platform ${platform}`);
      }

      return platformRecord.id;
    }

    // If we get here, we couldn't resolve the ID
    throw new Error(`Could not resolve platform ID from: ${compositeId}`);
  }
};
