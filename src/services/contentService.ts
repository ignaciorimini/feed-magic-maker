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
            slideImages:slide_images(image_url, position),
            uploadedImages:uploaded_images(image_url)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Database error fetching entries:', error);
        throw error;
      }

      console.log('Raw entries from database:', entries);

      // Transform the data with improved image_url handling
      const transformedEntries = entries?.map(entry => ({
        ...entry,
        platforms: entry.platforms.map((platform: any) => {
          console.log(`Processing platform ${platform.platform} - image_url:`, platform.image_url);
          
          return {
            ...platform,
            // Keep image_url as a single string (the main field from database)
            image_url: platform.image_url || null,
            // Transform slideImages array
            slideImages: platform.slideImages?.sort((a: any, b: any) => a.position - b.position).map((img: any) => img.image_url) || [],
            // Transform uploadedImages array  
            uploadedImages: platform.uploadedImages?.map((img: any) => img.image_url) || []
          };
        })
      })) || [];

      console.log('Transformed entries with image_url handling:', transformedEntries);

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
      console.log('=== DELETING CONTENT ENTRY ===');
      console.log('Entry ID received:', entryId);
      console.log('Entry ID type:', typeof entryId);
      console.log('Entry ID length:', entryId.length);
      
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
        .eq('content_entry_id', entryId); // Use complete entry ID

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

      // Delete all platforms for this entry using complete entry ID
      console.log('Deleting platforms for entry:', entryId);
      const { error: deletePlatformsError } = await supabase
        .from('content_platforms')
        .delete()
        .eq('content_entry_id', entryId); // Use complete entry ID

      if (deletePlatformsError) {
        console.error('Error deleting platforms:', deletePlatformsError);
        throw deletePlatformsError;
      }

      // Delete the main entry using complete entry ID
      console.log('Deleting main entry:', entryId);
      const { error: deleteEntryError } = await supabase
        .from('content_entries')
        .delete()
        .eq('id', entryId); // Use complete entry ID

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
      console.log('User ID:', user.id);
  
      const { data: platformRecord, error: platformError } = await supabase
        .from('content_platforms')
        .select(`
          id,
          content_entry_id,
          platform,
          content_entries!inner(user_id)
        `)
        .eq('content_entry_id', entryId)
        .eq('platform', platform as 'instagram' | 'linkedin' | 'twitter' | 'wordpress')
        .single();
  
      if (platformError) {
        console.error('Error finding platform record:', platformError);
        throw new Error(`Platform record not found: ${platformError.message}`);
      }
  
      if (platformRecord.content_entries.user_id !== user.id) {
        throw new Error('Platform does not belong to authenticated user');
      }
  
      const platformId = platformRecord.id;
  
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
  
      let imageUrl = null;
  
      if (Array.isArray(result) && result.length > 0 && result[0].imageURL) {
        imageUrl = result[0].imageURL;
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
  
      // Cambio puntual: usar .single() para que updateData sea objeto y no array
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
  
      const { data: verifyData, error: verifyError } = await supabase
        .from('content_platforms')
        .select('id, image_url, platform, status')
        .eq('id', platformId)
        .single();
  
      if (verifyError) {
        console.error('Error verifying update:', verifyError);
        throw verifyError;
      } else {
        console.log('Verification: Platform after update:', verifyData);
        if (verifyData.image_url !== imageUrl) {
          console.error('WARNING: Image URL was not saved correctly!');
          console.error('Expected:', imageUrl);
          console.error('Actual:', verifyData.image_url);
          throw new Error('Image URL was not saved correctly in database');
        } else {
          console.log('✅ Image URL saved correctly in database');
        }
      }
  
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
      console.log('Platform ID type:', typeof platformId);
      console.log('Platform ID length:', platformId.length);
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
      console.log('Platform ID type:', typeof platformId);
      console.log('Platform ID length:', platformId.length);
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
      console.log('Platform ID type:', typeof platformId);
      console.log('Platform ID length:', platformId.length);
      console.log('Slide images count:', slideImages.length);

      // Ensure we have a complete platform UUID
      if (!platformId || platformId.length !== 36 || !platformId.includes('-')) {
        console.error('Invalid platform ID format:', platformId);
        throw new Error(`Invalid platform ID format: ${platformId}. Expected full UUID.`);
      }

      // First, delete existing slide images for this platform using complete platform ID
      await supabase
        .from('slide_images')
        .delete()
        .eq('content_platform_id', platformId); // Use complete platform ID

      // Insert new slide images using complete platform ID
      const slideImagesData = slideImages.map((imageUrl, index) => ({
        content_platform_id: platformId, // Use complete platform ID
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
      console.log('=== PUBLISHING CONTENT ===');
      console.log('Platform ID:', platformId);
      console.log('Platform ID type:', typeof platformId);
      console.log('Platform ID length:', platformId.length);
      console.log('Platform:', platform);

      // Ensure we have a complete platform UUID
      if (!platformId || platformId.length !== 36 || !platformId.includes('-')) {
        console.error('Invalid platform ID format:', platformId);
        throw new Error(`Invalid platform ID format: ${platformId}. Expected full UUID.`);
      }

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
          platformId: platformId, // Use complete platform ID
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
