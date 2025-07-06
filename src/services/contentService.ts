
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
            wordpress_post:wordpress_posts(*),
            slide_images(*)
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

      // Create the main content entry - removed published_links field
      const { data: entry, error: entryError } = await supabase
        .from('content_entries')
        .insert({
          user_id: user.id,
          topic: data.topic,
          description: data.description,
          type: data.type
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

  async deletePlatform(platformId: string) {
    console.log('=== DELETING PLATFORM ===');
    console.log('Platform ID:', platformId);
    
    try {
      // Get the actual platform ID from composite ID
      const actualPlatformId = await this.getPlatformIdFromComposite(platformId);
      
      // Delete the specific platform record
      const { error } = await supabase
        .from('content_platforms')
        .delete()
        .eq('id', actualPlatformId);

      if (error) {
        console.error('Error deleting platform:', error);
        throw error;
      }

      console.log('Platform deleted successfully');
      return { error: null };
    } catch (error) {
      console.error('Error in deletePlatform:', error);
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

      // Call user's webhook for slide download - CORREGIDO: usar action en lugar de text
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

      const result = await response.json();
      
      // Si el webhook devuelve slides, guardarlas en la base de datos
      if (result.slideImages && Array.isArray(result.slideImages)) {
        console.log('Received slide images from webhook:', result.slideImages);
        // El platformId debe ser pasado desde donde se llama esta función
        // Por ahora, retornamos las slides para que se procesen externamente
        return { data: { ...result, slideImages: result.slideImages }, error: null };
      }

      return { data: result, error: null };
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
      
      // Prepare the webhook payload - CORREGIDO: usar action
      const webhookPayload = {
        action: 'generate_image',
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

  async getSlideImages(platformId: string) {
    try {
      console.log('=== GETTING SLIDE IMAGES ===');
      console.log('Platform ID:', platformId);

      // Get the actual platform ID from composite ID if needed
      const actualPlatformId = await this.getPlatformIdFromComposite(platformId);

      const { data, error } = await supabase
        .from('slide_images')
        .select('*')
        .eq('content_platform_id', actualPlatformId)
        .order('position', { ascending: true });

      if (error) {
        console.error('Error fetching slide images:', error);
        return { data: null, error };
      }

      console.log('Slide images fetched:', data);
      return { data, error: null };
    } catch (error) {
      console.error('Error in getSlideImages:', error);
      return { data: null, error };
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

  async downloadSlidesForPlatform(platformId: string, slidesURL: string, topic: string) {
    try {
      console.log('=== DOWNLOADING SLIDES FOR PLATFORM ===');
      console.log('Platform ID:', platformId);
      console.log('Slides URL:', slidesURL);

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

      // Get the actual platform ID from composite ID if needed
      const actualPlatformId = await this.getPlatformIdFromComposite(platformId);

      // Call user's webhook for slide download
      const response = await fetch(profile.webhook_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'download_slides',
          platformId: actualPlatformId,
          slidesURL,
          topic,
          userEmail: user.email
        }),
      });

      if (!response.ok) {
        throw new Error(`Webhook error: ${response.status}`);
      }

      const result = await response.json();
      console.log('Webhook result for slides download:', result);

      // Si el webhook devuelve slideImages, guardarlas en la base de datos
      if (result.slideImages && Array.isArray(result.slideImages)) {
        console.log('Saving slide images returned from webhook:', result.slideImages);
        
        const { error: saveError } = await this.saveSlideImages(platformId, result.slideImages);
        
        if (saveError) {
          console.error('Error saving slide images:', saveError);
          throw new Error('No se pudieron guardar las slides');
        }
        
        console.log('✅ Slide images saved successfully to database');
      }

      return { data: result, error: null };
    } catch (error) {
      console.error('Error downloading slides for platform:', error);
      return { data: null, error };
    }
  }

  async publishContent(platformId: string, platform: string, contentType?: string) {
    try {
      console.log('=== PUBLISHING CONTENT ===');
      console.log('Platform ID:', platformId);
      console.log('Platform:', platform);
      console.log('Content Type:', contentType);

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

      // Fetch platform content data including related data
      const { data: platformData, error: platformError } = await supabase
        .from('content_platforms')
        .select(`
          *,
          wordpress_post:wordpress_posts(*)
        `)
        .eq('id', actualPlatformId)
        .single();

      if (platformError || !platformData) {
        throw new Error('Platform content not found');
      }

      // Prepare webhook payload with content data
      const webhookPayload: any = {
        action: 'publish_content',
        platformId: actualPlatformId,
        platform: platform,
        contentType: contentType || 'SimplePost',
        userEmail: user.email
      };

      // Add text content based on platform
      if (platform === 'wordpress' && platformData.wordpress_post && platformData.wordpress_post.length > 0) {
        // For WordPress, use the content from wordpress_posts table
        const wpPost = platformData.wordpress_post[0];
        webhookPayload.text = wpPost.content;
        webhookPayload.title = wpPost.title;
        webhookPayload.description = wpPost.description;
        webhookPayload.slug = wpPost.slug;
      } else {
        // For other platforms, use the text field
        webhookPayload.text = platformData.text || '';
      }

      // Add image URL if available
      if (platformData.image_url) {
        webhookPayload.imageUrl = platformData.image_url;
      }

      // For slide posts, include slides_url and fetch slide images - Updated condition
      if (contentType === 'slide' || contentType === 'SlidePost' || contentType === 'Slide Post') {
        // Add slides_url from platform data
        if (platformData.slides_url) {
          webhookPayload.slidesURL = platformData.slides_url;
        }

        // Fetch and include slide images
        const { data: slideImagesData, error: slideError } = await this.getSlideImages(platformId);
        
        if (!slideError && slideImagesData && slideImagesData.length > 0) {
          webhookPayload.slideImages = slideImagesData.map(slide => slide.image_url);
          console.log('Added slide images to webhook payload:', webhookPayload.slideImages);
        }
      }

      console.log('Publishing content with enhanced payload:', webhookPayload);

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
      return { data: result, error: null };
    } catch (error) {
      console.error('Error publishing content:', error);
      return { data: null, error };
    }
  }

  async updatePlatformStatus(platformId: string, status: 'published' | 'pending' | 'error', publishedUrl?: string) {
    try {
      console.log('=== UPDATING PLATFORM STATUS ===');
      console.log('Platform ID:', platformId);
      console.log('Status:', status);
      console.log('Published URL:', publishedUrl);

      // Get the actual platform ID from composite ID if needed
      const actualPlatformId = await this.getPlatformIdFromComposite(platformId);

      const updateData: any = {
        status: status,
        updated_at: new Date().toISOString()
      };

      // If status is published, add the published_url and published_at
      if (status === 'published') {
        updateData.published_url = publishedUrl || null;
        updateData.published_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('content_platforms')
        .update(updateData)
        .eq('id', actualPlatformId);

      if (error) {
        throw error;
      }

      console.log('✅ Platform status updated successfully');
      return { error: null };
    } catch (error) {
      console.error('Error updating platform status:', error);
      return { error };
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

  // Add method to get all user media images
  async getUserMediaImages() {
    console.log('=== GETTING USER MEDIA IMAGES ===');
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Get platform images
      const { data: platformImages, error: platformError } = await supabase
        .from('content_platforms')
        .select(`
          id,
          image_url,
          created_at,
          platform,
          content_entries!inner(topic, user_id)
        `)
        .eq('content_entries.user_id', user.id)
        .not('image_url', 'is', null);

      // Get uploaded images
      const { data: uploadedImages, error: uploadedError } = await supabase
        .from('uploaded_images')
        .select(`
          id,
          image_url,
          uploaded_at,
          content_platforms!inner(
            content_entries!inner(user_id, topic)
          )
        `)
        .eq('content_platforms.content_entries.user_id', user.id);

      if (platformError) {
        console.error('Error fetching platform images:', platformError);
        return { data: null, error: platformError };
      }

      if (uploadedError) {
        console.error('Error fetching uploaded images:', uploadedError);
        return { data: null, error: uploadedError };
      }

      const allImages = [];

      // Add platform images
      if (platformImages) {
        platformImages.forEach(img => {
          allImages.push({
            id: img.id,
            image_url: img.image_url,
            created_at: img.created_at,
            type: 'platform',
            platform: img.platform,
            content_topic: img.content_entries?.topic
          });
        });
      }

      // Add uploaded images
      if (uploadedImages) {
        uploadedImages.forEach(img => {
          allImages.push({
            id: img.id,
            image_url: img.image_url,
            created_at: img.uploaded_at,
            type: 'uploaded',
            content_topic: img.content_platforms?.content_entries?.topic
          });
        });
      }

      // Sort by date (newest first)
      allImages.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      return { data: allImages, error: null };
    } catch (error) {
      console.error('Error in getUserMediaImages:', error);
      return { data: null, error };
    }
  }
}

export const contentService = new ContentService();
