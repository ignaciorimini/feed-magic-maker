import { supabase } from '@/integrations/supabase/client';
import { PostgrestResponse } from '@supabase/supabase-js';

export const createContentEntry = async (content: any) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('content_entries')
      .insert([
        {
          topic: content.topic,
          description: content.description,
          type: content.type,
          user_id: user?.id,
        },
      ])
      .select()

    if (error) {
      console.error("Error creating content entry:", error);
      return { data: null, error };
    }

    if (!data || data.length === 0) {
      console.error("No data returned when creating content entry");
      return { data: null, error: { message: "No data returned from content entry creation" } };
    }

    const newEntry = data[0];

    // Create platform entries
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    const platformsToCreate = content.selectedPlatforms.map((platform: string) => ({
      content_entry_id: newEntry.id,
      platform: platform,
      text: content.generatedContent[platform],
      user_id: currentUser?.id,
      content_type: content.platformTypes[platform] || 'simple'
    }));

    const { data: platformsData, error: platformsError } = await supabase
      .from('content_platforms')
      .insert(platformsToCreate)
      .select();

    if (platformsError) {
      console.error("Error creating platform entries:", platformsError);
      // Optionally, delete the content entry if platform creation fails
      await supabase
        .from('content_entries')
        .delete()
        .eq('id', newEntry.id);
      return { data: null, error: platformsError };
    }

    // Create WordPress posts for WordPress platforms
    if (platformsData) {
      for (const platformData of platformsData) {
        if (platformData.platform === 'wordpress') {
          const { error: wpError } = await supabase
            .from('wordpress_posts')
            .insert({
              content_platform_id: platformData.id,
              title: content.generatedContent.wordpress_title || 'Untitled',
              description: content.generatedContent.wordpress_description || '',
              slug: content.generatedContent.wordpress_slug || 'untitled',
              content: content.generatedContent.wordpress || content.generatedContent[platformData.platform] || ''
            });

          if (wpError) {
            console.error("Error creating WordPress post:", wpError);
          }
        }
      }
    }

    return { data: newEntry, error: null };
  } catch (error: any) {
    console.error("Unexpected error creating content entry:", error);
    return { data: null, error: { message: error.message || "Unexpected error" } };
  }
};

export const getUserContentEntries = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error("No user ID found.");
        return { data: [], error: { message: "No user ID found." } };
      }
  
      const { data, error } = await supabase
        .from('content_entries')
        .select(`
          *,
          platforms:content_platforms (
            *,
            wordpress_post:wordpress_posts(*)
          )
        `)
        .eq('user_id', user.id)
        .order('created_date', { ascending: false });
  
      if (error) {
        console.error("Error fetching content entries:", error);
        return { data: [], error };
      }
  
      return { data, error: null };
    } catch (error: any) {
      console.error("Unexpected error fetching content entries:", error);
      return { data: [], error: { message: error.message || "Unexpected error" } };
    }
  };

export const updatePlatformContent = async (entryId: string, content: any) => {
  try {
    console.log('=== UPDATE PLATFORM CONTENT ===');
    console.log('Entry ID:', entryId);
    console.log('Content to update:', content);
    
    // Extract the original entry ID (remove platform suffix if present)
    const originalEntryId = entryId.includes('__') ? entryId.split('__')[0] : entryId;
    
    // Get the platform from the content or determine it
    const platform = content.platform || (content.title ? 'wordpress' : 'instagram');
    
    console.log('Original Entry ID:', originalEntryId);
    console.log('Platform:', platform);
    
    // First, get the platform record
    const { data: platformData, error: platformFetchError } = await supabase
      .from('content_platforms')
      .select('*')
      .eq('content_entry_id', originalEntryId)
      .eq('platform', platform)
      .single();
    
    if (platformFetchError) {
      console.error('Error fetching platform:', platformFetchError);
      return { data: null, error: platformFetchError };
    }
    
    console.log('Found platform record:', platformData);
    
    // Update content_platforms table
    const platformUpdate: any = {
      updated_at: new Date().toISOString()
    };
    
    // Handle text content for non-WordPress platforms
    if (content.text !== undefined) {
      platformUpdate.text = content.text;
    }
    
    // Handle scheduled date
    if (content.scheduled_at !== undefined) {
      platformUpdate.scheduled_at = content.scheduled_at;
    }
    
    const { error: platformUpdateError } = await supabase
      .from('content_platforms')
      .update(platformUpdate)
      .eq('id', platformData.id);
    
    if (platformUpdateError) {
      console.error('Error updating platform content:', platformUpdateError);
      return { data: null, error: platformUpdateError };
    }
    
    console.log('Platform content updated successfully');
    
    // Handle WordPress-specific updates
    if (platform === 'wordpress' && (content.title || content.description || content.slug || content.content)) {
      console.log('Updating WordPress post data...');
      
      // Check if WordPress post exists
      const { data: existingWpPost, error: wpFetchError } = await supabase
        .from('wordpress_posts')
        .select('*')
        .eq('content_platform_id', platformData.id)
        .maybeSingle();
      
      if (wpFetchError) {
        console.error('Error fetching WordPress post:', wpFetchError);
        return { data: null, error: wpFetchError };
      }
      
      const wpUpdate: any = {
        updated_at: new Date().toISOString()
      };
      
      if (content.title !== undefined) wpUpdate.title = content.title;
      if (content.description !== undefined) wpUpdate.description = content.description;
      if (content.slug !== undefined) wpUpdate.slug = content.slug;
      if (content.content !== undefined) wpUpdate.content = content.content;
      
      if (existingWpPost) {
        // Update existing WordPress post
        const { error: wpUpdateError } = await supabase
          .from('wordpress_posts')
          .update(wpUpdate)
          .eq('content_platform_id', platformData.id);
        
        if (wpUpdateError) {
          console.error('Error updating WordPress post:', wpUpdateError);
          return { data: null, error: wpUpdateError };
        }
        
        console.log('WordPress post updated successfully');
      } else {
        // Create new WordPress post if it doesn't exist
        const { error: wpInsertError } = await supabase
          .from('wordpress_posts')
          .insert({
            content_platform_id: platformData.id,
            title: content.title || 'Untitled',
            description: content.description || '',
            slug: content.slug || 'untitled',
            content: content.content || '',
            ...wpUpdate
          });
        
        if (wpInsertError) {
          console.error('Error creating WordPress post:', wpInsertError);
          return { data: null, error: wpInsertError };
        }
        
        console.log('WordPress post created successfully');
      }
    }
    
    return { data: { success: true }, error: null };
  } catch (error) {
    console.error('Unexpected error in updatePlatformContent:', error);
    return { data: null, error: error };
  }
};

export const deletePlatform = async (platformId: string) => {
  try {
    console.log('=== DELETING PLATFORM ===');
    console.log('Platform ID:', platformId);

    // Extract the content_platforms ID from the composite ID
    const actualPlatformId = await getPlatformIdFromComposite(platformId);

    console.log('Extracted content_platforms ID:', actualPlatformId);

    // First, delete any associated WordPress posts
    const { error: wpDeleteError } = await supabase
      .from('wordpress_posts')
      .delete()
      .eq('content_platform_id', actualPlatformId);

    if (wpDeleteError) {
      console.error('Error deleting WordPress posts:', wpDeleteError);
      return { data: null, error: wpDeleteError };
    }

    console.log('WordPress posts deleted (if any)');

    // Then, delete the platform entry
    const { error: platformDeleteError } = await supabase
      .from('content_platforms')
      .delete()
      .eq('id', actualPlatformId);

    if (platformDeleteError) {
      console.error('Error deleting platform:', platformDeleteError);
      return { data: null, error: platformDeleteError };
    }

    console.log('Platform deleted successfully');

    return { data: { success: true }, error: null };
  } catch (error) {
    console.error('Unexpected error in deletePlatform:', error);
    return { data: null, error: error };
  }
};

export const getPlatformIdFromComposite = async (platformId: string): Promise<string> => {
  // Extract the content_platforms ID from the composite ID
  const parts = platformId.split('__');
  if (parts.length !== 2) {
    throw new Error('Invalid platform ID format');
  }
  return parts[1];
};

export const updatePlatformSchedule = async (entryId: string, scheduled_at: string) => {
  try {
    console.log('=== UPDATING PLATFORM SCHEDULE ===');
    console.log('Entry ID:', entryId);
    console.log('Scheduled at:', scheduled_at);

    const { data, error } = await supabase
      .from('content_platforms')
      .update({ scheduled_at: scheduled_at })
      .eq('content_entry_id', entryId);

    if (error) {
      console.error('Error updating platform schedule:', error);
      return { data: null, error };
    }

    console.log('Platform schedule updated successfully');
    return { data: { success: true }, error: null };
  } catch (error) {
    console.error('Unexpected error in updatePlatformSchedule:', error);
    return { data: null, error: error };
  }
};

export const downloadSlidesForPlatform = async (entryId: string, slidesURL: string, topic: string) => {
  try {
    console.log('=== DOWNLOADING SLIDES FOR PLATFORM ===');
    console.log('Entry ID:', entryId);
    console.log('Slides URL:', slidesURL);
    console.log('Topic:', topic);

    const { data: { user } } = await supabase.auth.getUser();
    const { data: userProfile, error: userError } = await supabase
      .from('profiles')
      .select('webhook_url')
      .eq('id', user?.id)
      .single();

    if (userError) {
      console.error('Error fetching user profile:', userError);
      return { data: null, error: userError };
    }

    const webhookURL = userProfile?.webhook_url;

    if (!webhookURL) {
      console.error('User webhook URL is not defined in profile.');
      return { data: null, error: { message: 'User webhook URL is not defined.' } };
    }

    const response = await fetch(webhookURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        entry_id: entryId,
        slides_url: slidesURL,
        topic: topic,
        user_id: user?.id,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error response from webhook:', errorData);
      return { data: null, error: { message: `Webhook failed with status ${response.status}: ${errorData.error || 'Unknown error'}` } };
    }

    const responseData = await response.json();
    console.log('Webhook response:', responseData);

    return { data: responseData, error: null };
  } catch (error: any) {
    console.error('Unexpected error in downloadSlidesForPlatform:', error);
    return { data: null, error: { message: error.message || 'Unexpected error' } };
  }
};

export const downloadSlidesWithUserWebhook = async (slidesURL: string, topic: string) => {
  try {
    console.log('=== DOWNLOADING SLIDES WITH USER WEBHOOK ===');
    console.log('Slides URL:', slidesURL);
    console.log('Topic:', topic);

    const { data: { user } } = await supabase.auth.getUser();
    const { data: userProfile, error: userError } = await supabase
      .from('profiles')
      .select('webhook_url')
      .eq('id', user?.id)
      .single();

    if (userError) {
      console.error('Error fetching user profile:', userError);
      return { data: null, error: userError };
    }

    const webhookURL = userProfile?.webhook_url;

    if (!webhookURL) {
      console.error('User webhook URL is not defined in profile.');
      return { data: null, error: { message: 'User webhook URL is not defined.' } };
    }

    const response = await fetch(webhookURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        slides_url: slidesURL,
        topic: topic,
        user_id: user?.id,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error response from webhook:', errorData);
      return { data: null, error: { message: `Webhook failed with status ${response.status}: ${errorData.error || 'Unknown error'}` } };
    }

    const responseData = await response.json();
    console.log('Webhook response:', responseData);

    return { data: responseData, error: null };
  } catch (error: any) {
    console.error('Unexpected error in downloadSlidesWithUserWebhook:', error);
    return { data: null, error: { message: error.message || 'Unexpected error' } };
  }
};

export const generateImageForPlatform = async (entryId: string, platform: string, topic: string, description: string) => {
  try {
    console.log('=== GENERATING IMAGE FOR PLATFORM ===');
    console.log('Entry ID:', entryId);
    console.log('Platform:', platform);
    console.log('Topic:', topic);
    console.log('Description:', description);

    const { data: { user } } = await supabase.auth.getUser();
    const { data: userProfile, error: userError } = await supabase
      .from('profiles')
      .select('webhook_url')
      .eq('id', user?.id)
      .single();

    if (userError) {
      console.error('Error fetching user profile:', userError);
      return { data: null, error: userError };
    }

    const webhookURL = userProfile?.webhook_url;

    if (!webhookURL) {
      console.error('Webhook URL is not defined in user profile.');
      return { data: null, error: { message: 'Webhook URL is not defined.' } };
    }

    const response = await fetch(webhookURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        entry_id: entryId,
        platform: platform,
        topic: topic,
        description: description,
        user_id: user?.id,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error response from webhook:', errorData);
      return { data: null, error: { message: `Webhook failed with status ${response.status}: ${errorData.error || 'Unknown error'}` } };
    }

    const responseData = await response.json();
    console.log('Webhook response:', responseData);

    return { data: responseData, error: null };
  } catch (error: any) {
    console.error('Unexpected error in generateImageForPlatform:', error);
    return { data: null, error: { message: error.message || 'Unexpected error' } };
  }
};

export const publishContent = async (entryId: string, platform: string) => {
  try {
    console.log('=== PUBLISHING CONTENT ===');
    console.log('Entry ID:', entryId);
    console.log('Platform:', platform);

    const { data: { user } } = await supabase.auth.getUser();
    const { data: userProfile, error: userError } = await supabase
      .from('profiles')
      .select('webhook_url')
      .eq('id', user?.id)
      .single();

    if (userError) {
      console.error('Error fetching user profile:', userError);
      return { data: null, error: userError };
    }

    const webhookURL = userProfile?.webhook_url;

    if (!webhookURL) {
      console.error('Publish webhook URL is not defined in user profile.');
      return { data: null, error: { message: 'Publish webhook URL is not defined.' } };
    }

    const response = await fetch(webhookURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        entry_id: entryId,
        platform: platform,
        user_id: user?.id,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error response from webhook:', errorData);
      return { data: null, error: { message: `Webhook failed with status ${response.status}: ${errorData.error || 'Unknown error'}` } };
    }

    const responseData = await response.json();
    console.log('Webhook response:', responseData);

    return { data: responseData, error: null };
  } catch (error: any) {
    console.error('Unexpected error in publishContent:', error);
    return { data: null, error: { message: error.message || 'Unexpected error' } };
  }
};

export const saveSlideImages = async (entryId: string, slideImages: string[]) => {
  try {
    console.log('=== SAVING SLIDE IMAGES ===');
    console.log('Entry ID:', entryId);
    console.log('Slide Images:', slideImages);

    // Get the platform record for this entry
    const { data: platformData, error: platformError } = await supabase
      .from('content_platforms')
      .select('id')
      .eq('content_entry_id', entryId)
      .single();

    if (platformError) {
      console.error('Error fetching platform data:', platformError);
      return { data: null, error: platformError };
    }

    // Delete existing slide images for this platform
    const { error: deleteError } = await supabase
      .from('slide_images')
      .delete()
      .eq('content_platform_id', platformData.id);

    if (deleteError) {
      console.error('Error deleting existing slide images:', deleteError);
      return { data: null, error: deleteError };
    }

    // Insert new slide images
    const slideImageRecords = slideImages.map((imageUrl, index) => ({
      content_platform_id: platformData.id,
      image_url: imageUrl,
      position: index + 1
    }));

    const { data, error } = await supabase
      .from('slide_images')
      .insert(slideImageRecords)
      .select();

    if (error) {
      console.error('Error saving slide images:', error);
      return { data: null, error };
    }

    console.log('Slide images saved successfully:', data);
    return { data, error: null };
  } catch (error: any) {
    console.error('Unexpected error saving slide images:', error);
    return { data: null, error: { message: error.message || 'Unexpected error' } };
  }
};
