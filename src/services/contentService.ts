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

      // Transform the data to include slideImages as an array of URLs
      const transformedEntries = entries?.map(entry => ({
        ...entry,
        platforms: entry.platforms.map((platform: any) => ({
          ...platform,
          slideImages: platform.slideImages?.sort((a: any, b: any) => a.position - b.position).map((img: any) => img.image_url) || [],
          uploadedImages: platform.uploadedImages?.map((img: any) => img.image_url) || []
        }))
      })) || [];

      console.log('Transformed entries:', transformedEntries);

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

      console.log('=== GENERATING IMAGE FOR PLATFORM ===');
      console.log('Platform ID:', platformId);
      console.log('Platform:', platform);
      console.log('User ID:', user.id);

      // First, verify the platform exists and belongs to the user
      const { data: platformCheck, error: checkError } = await supabase
        .from('content_platforms')
        .select(`
          id,
          content_entry_id,
          platform,
          content_entries!inner(user_id)
        `)
        .eq('id', platformId)
        .single();

      if (checkError) {
        console.error('Error checking platform:', checkError);
        throw new Error(`Platform not found: ${checkError.message}`);
      }

      if (platformCheck.content_entries.user_id !== user.id) {
        throw new Error('Platform does not belong to authenticated user');
      }

      console.log('Platform verified:', platformCheck);

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
      
      // Handle the new webhook response format: [{ "imageURL": "..." }]
      let imageUrl = null;
      
      if (Array.isArray(result) && result.length > 0) {
        const firstResult = result[0];
        if (firstResult.imageURL) {
          imageUrl = firstResult.imageURL;
        }
      }

      if (!imageUrl) {
        console.error('No imageURL in webhook response:', result);
        throw new Error('No image URL received from webhook');
      }

      console.log('=== UPDATING PLATFORM WITH IMAGE URL ===');
      console.log('Platform ID:', platformId);
      console.log('Image URL:', imageUrl);
      
      // Step 1: Update the platform with the new image URL
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

      // Step 2: Verify the update was successful by fetching the record again
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

      // Step 3: Test that we can query the updated record with our current user context
      const { data: userContextTest, error: userContextError } = await supabase
        .from('content_platforms')
        .select(`
          id, 
          image_url, 
          platform,
          content_entries!inner(user_id, topic)
        `)
        .eq('id', platformId)
        .single();

      if (userContextError) {
        console.error('Error testing user context after update:', userContextError);
        console.warn('Update succeeded but user context test failed - this might be an RLS issue');
      } else {
        console.log('✅ User context test passed:', userContextTest);
      }

      return { data: { imageUrl }, error: null };
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
