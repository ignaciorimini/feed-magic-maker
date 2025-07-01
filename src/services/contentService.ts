
import { supabase } from '@/integrations/supabase/client';

type PlatformType = 'instagram' | 'linkedin' | 'twitter' | 'wordpress';

class ContentService {
  async getUserContentEntries() {
    console.log('=== GETTING USER CONTENT ENTRIES ===');
    
    try {
      // First get content entries with their platforms
      const { data: entries, error: entriesError } = await supabase
        .from('content_entries')
        .select(`
          *,
          platforms:content_platforms(
            *,
            wordpress_post:wordpress_posts(*)
          )
        `)
        .order('created_at', { ascending: false });

      if (entriesError) {
        console.error('Error fetching content entries:', entriesError);
        return { data: null, error: entriesError };
      }

      console.log('Content entries with platforms:', entries);
      return { data: entries, error: null };
    } catch (error) {
      console.error('Unexpected error in getUserContentEntries:', error);
      return { data: null, error };
    }
  }

  async createContentEntry(data: any) {
    console.log('=== CREATING CONTENT ENTRY ===');
    console.log('Data received:', data);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Create the main content entry
      const { data: entry, error: entryError } = await supabase
        .from('content_entries')
        .insert({
          user_id: user.id,
          topic: data.topic,
          description: data.description,
          type: data.type,
          published_links: {}
        })
        .select()
        .single();

      if (entryError) {
        console.error('Error creating content entry:', entryError);
        throw entryError;
      }

      console.log('Content entry created:', entry);

      // Create platform-specific entries
      const platformPromises = data.selectedPlatforms.map(async (platform: string) => {
        const platformData = data.generatedContent[platform];
        const contentType = data.platformTypes[platform];
        
        console.log(`Creating platform entry for ${platform}:`, platformData);

        // Ensure platform is properly typed
        const typedPlatform = platform as PlatformType;

        // Create the content_platform entry
        const { data: platformEntry, error: platformError } = await supabase
          .from('content_platforms')
          .insert({
            content_entry_id: entry.id,
            platform: typedPlatform,
            content_type: contentType,
            slides_url: platformData?.slidesURL || null,
            text: platform === 'wordpress' ? null : (platformData?.text || null),
            status: 'pending'
          })
          .select()
          .single();

        if (platformError) {
          console.error(`Error creating platform entry for ${platform}:`, platformError);
          throw platformError;
        }

        console.log(`Platform entry created for ${platform}:`, platformEntry);

        // If it's WordPress, also create the wordpress_posts entry
        if (platform === 'wordpress' && platformData) {
          const { error: wpError } = await supabase
            .from('wordpress_posts')
            .insert({
              content_platform_id: platformEntry.id,
              title: platformData.title || '',
              description: platformData.description || '',
              slug: platformData.slug || '',
              content: platformData.content || ''
            });

          if (wpError) {
            console.error('Error creating WordPress post:', wpError);
            throw wpError;
          }

          console.log('WordPress post created successfully');
        }

        return platformEntry;
      });

      await Promise.all(platformPromises);

      console.log('All platform entries created successfully');
      return { data: entry, error: null };

    } catch (error) {
      console.error('Error in createContentEntry:', error);
      return { data: null, error };
    }
  }

  async updatePlatformContent(platformId: string, content: any) {
    console.log('=== UPDATING PLATFORM CONTENT ===');
    console.log('Platform ID:', platformId);
    console.log('Content to update:', content);

    try {
      // Extract the actual platform ID from composite ID if needed
      const actualPlatformId = await this.getPlatformIdFromComposite(platformId);
      
      // First, get the platform info to check if it's WordPress
      const { data: platformInfo, error: platformError } = await supabase
        .from('content_platforms')
        .select('platform, content_type')
        .eq('id', actualPlatformId)
        .single();

      if (platformError) {
        throw platformError;
      }

      // Update the content_platforms table
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      // For WordPress, don't store text in content_platforms
      if (platformInfo.platform !== 'wordpress') {
        updateData.text = content.text || content.content || '';
      }

      // Update images if provided
      if (content.images && content.images.length > 0) {
        updateData.image_url = content.images[0];
      }

      const { error: updateError } = await supabase
        .from('content_platforms')
        .update(updateData)
        .eq('id', actualPlatformId);

      if (updateError) {
        throw updateError;
      }

      // If it's WordPress, also update the wordpress_posts table
      if (platformInfo.platform === 'wordpress') {
        const { error: wpUpdateError } = await supabase
          .from('wordpress_posts')
          .update({
            title: content.title || '',
            description: content.description || '',
            slug: content.slug || '',
            content: content.text || content.content || '', // Handle both text and content fields
            updated_at: new Date().toISOString()
          })
          .eq('content_platform_id', actualPlatformId);

        if (wpUpdateError) {
          throw wpUpdateError;
        }
      }

      return { error: null };
    } catch (error) {
      console.error('Error updating platform content:', error);
      return { error };
    }
  }

  async deleteContentEntry(entryId: string) {
    console.log('=== DELETING CONTENT ENTRY ===');
    console.log('Entry ID:', entryId);
    
    try {
      // The cascade delete will handle related records automatically
      const { error } = await supabase
        .from('content_entries')
        .delete()
        .eq('id', entryId);

      if (error) {
        console.error('Error deleting content entry:', error);
        throw error;
      }

      console.log('Content entry deleted successfully');
      return { error: null };
    } catch (error) {
      console.error('Error in deleteContentEntry:', error);
      return { error };
    }
  }

  async downloadSlidesWithUserWebhook(slidesURL: string, topic: string) {
    console.log('=== DOWNLOADING SLIDES WITH USER WEBHOOK ===');
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Get user's webhook URL
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('webhook_url')
        .eq('id', user.id)
        .single();

      if (profileError || !profile?.webhook_url) {
        throw new Error('Webhook URL not configured');
      }

      // Call user's webhook for slide download
      const response = await fetch(profile.webhook_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'download_slides',
          slidesURL,
          topic,
          userEmail: user.email
        }),
      });

      if (!response.ok) {
        throw new Error(`Webhook error: ${response.status}`);
      }

      return { data: 'Download initiated', error: null };
    } catch (error) {
      console.error('Error downloading slides:', error);
      return { data: null, error };
    }
  }

  async generateImageForPlatform(platformId: string, platform: string, topic: string, description: string) {
    try {
      console.log('=== GENERATE IMAGE FOR PLATFORM ===');
      console.log('Platform ID:', platformId);
      console.log('Platform:', platform);
      console.log('Topic:', topic);
      console.log('Description:', description);

      // Get user profile to check for webhook URL
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('webhook_url')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        throw new Error('No se pudo obtener el perfil del usuario');
      }

      if (!profile?.webhook_url) {
        throw new Error('No se ha configurado un webhook URL. Ve a tu perfil para configurarlo.');
      }

      // Extract the actual platform ID from the composite ID
      const actualPlatformId = await this.getPlatformIdFromComposite(platformId);
      
      // Prepare the webhook payload
      const webhookPayload = {
        type: 'generate_image',
        platform: platform,
        platformId: actualPlatformId,
        topic: topic,
        description: description,
        timestamp: new Date().toISOString()
      };

      console.log('Sending webhook payload:', webhookPayload);

      // Send request to user's webhook
      const response = await fetch(profile.webhook_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookPayload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Webhook response error:', errorText);
        throw new Error(`Error del webhook: ${response.status} - ${errorText}`);
      }

      const webhookResult = await response.json();
      console.log('Webhook result:', webhookResult);

      // If the webhook returns an imageURL, save it to the database
      if (webhookResult.imageURL) {
        console.log('Saving image URL to database:', webhookResult.imageURL);
        
        const { error: updateError } = await supabase
          .from('content_platforms')
          .update({ image_url: webhookResult.imageURL })
          .eq('id', actualPlatformId);

        if (updateError) {
          console.error('Error updating image URL:', updateError);
          throw new Error('No se pudo guardar la imagen generada');
        }

        console.log('Image URL saved successfully');
      }

      return { data: webhookResult, error: null };
    } catch (error) {
      console.error('Error in generateImageForPlatform:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Error desconocido al generar imagen') 
      };
    }
  }

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
  }

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
  }

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
  }

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
  }

  // Helper function to get the actual platform ID from composite ID
  async getPlatformIdFromComposite(platformId: string): Promise<string> {
    // Check if it's a composite ID (contains __)
    if (platformId.includes('__')) {
      const [entryId, platform] = platformId.split('__');
      
      // Ensure platform is properly typed
      const typedPlatform = platform as PlatformType;
      
      // Get the actual platform ID from the database
      const { data, error } = await supabase
        .from('content_platforms')
        .select('id')
        .eq('content_entry_id', entryId)
        .eq('platform', typedPlatform)
        .single();

      if (error || !data) {
        throw new Error(`Platform not found for composite ID: ${platformId}`);
      }

      return data.id;
    }
    
    // If it's already a direct platform ID, return as is
    return platformId;
  }
}

export const contentService = new ContentService();
