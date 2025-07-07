import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export const contentService = {
  getUserContentEntries: async () => {
    try {
      const { data, error } = await supabase
        .from('content_entries')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching content entries:', error);
        return { data: null, error };
      }

      // Fetch platform content for each entry
      const entriesWithPlatformContent = await Promise.all(
        data.map(async (entry) => {
          const { data: platformContent, error: platformError } = await supabase
            .from('content_platforms')
            .select('*')
            .eq('content_entry_id', entry.id);

          if (platformError) {
            console.error('Error fetching platform content:', platformError);
            return entry; // Return entry without platform content in case of error
          }

          // Structure platform content by platform
          const platformContentByPlatform = platformContent.reduce((acc, item) => {
            acc[item.platform] = item;
            return acc;
          }, {});

          return { ...entry, platformContent: platformContentByPlatform };
        })
      );

      return { data: entriesWithPlatformContent, error: null };
    } catch (error) {
      console.error('Unexpected error fetching content entries:', error);
      return { data: null, error };
    }
  },

  getContentEntryById: async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('content_entries')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching content entry by id:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Unexpected error fetching content entry by id:', error);
      return { data: null, error };
    }
  },

  addContentEntry: async (topic: string, description: string, type: string, userId: string) => {
    try {
      const id = uuidv4();
      const { data, error } = await supabase
        .from('content_entries')
        .insert([{ id: id, topic, description, type, user_id: userId }]);

      if (error) {
        console.error('Error adding content entry:', error);
        return { data: null, error };
      }

      return { data: { id: id }, error: null };
    } catch (error) {
      console.error('Unexpected error adding content entry:', error);
      return { data: null, error };
    }
  },

  updateContentEntry: async (id: string, topic: string, description: string, type: string) => {
    try {
      const { data, error } = await supabase
        .from('content_entries')
        .update({ topic, description, type })
        .eq('id', id);

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

  deleteContentEntry: async (id: string) => {
    try {
      // First, delete related records in content_platforms
      const { error: deletePlatformsError } = await supabase
        .from('content_platforms')
        .delete()
        .eq('content_entry_id', id);

      if (deletePlatformsError) {
        console.error('Error deleting related content_platforms:', deletePlatformsError);
        return { data: null, error: deletePlatformsError };
      }

      // Then, delete the content entry
      const { data, error } = await supabase
        .from('content_entries')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting content entry:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Unexpected error deleting content entry:', error);
      return { data: null, error };
    }
  },

  getPlatformContent: async (entryId: string, platform: string) => {
    try {
      const { data, error } = await supabase
        .from('content_platforms')
        .select('*')
        .eq('content_entry_id', entryId)
        .eq('platform', platform)
        .single();

      if (error) {
        console.error('Error fetching platform content:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Unexpected error fetching platform content:', error);
      return { data: null, error };
    }
  },

  updatePlatformContent: async (entryId: string, content: any) => {
    try {
      const { platform, ...contentWithoutPlatform } = content;
      const { data, error } = await supabase
        .from('content_platforms')
        .update(contentWithoutPlatform)
        .eq('content_entry_id', entryId)
        .eq('platform', platform);

      if (error) {
        console.error('Error updating platform content:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Unexpected error updating platform content:', error);
      return { data: null, error };
    }
  },

  addPlatformContent: async (entryId: string, platform: string, content: any) => {
    try {
      const { data, error } = await supabase
        .from('content_platforms')
        .insert([{ content_entry_id: entryId, platform, ...content }]);

      if (error) {
        console.error('Error adding platform content:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Unexpected error adding platform content:', error);
      return { data: null, error };
    }
  },

  deletePlatformContent: async (entryId: string, platform: string) => {
    try {
      const { data, error } = await supabase
        .from('content_platforms')
        .delete()
        .eq('content_entry_id', entryId)
        .eq('platform', platform);

      if (error) {
        console.error('Error deleting platform content:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Unexpected error deleting platform content:', error);
      return { data: null, error };
    }
  },

  uploadCustomImage: async (entryId: string, imageUrl: string) => {
    try {
      // Determine the platform from the entryId
      const [contentEntryId, platform] = entryId.split('__');

      // Update the image_url in content_platforms table
      const { data, error } = await supabase
        .from('content_platforms')
        .update({ image_url: imageUrl })
        .eq('content_entry_id', contentEntryId)
        .eq('platform', platform);

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

  generateImageForPlatform: async (entryId: string, platform: string, topic: string, description: string) => {
    try {
      const generateImageUrl = process.env.NEXT_PUBLIC_IMAGE_GENERATION_URL;

      if (!generateImageUrl) {
        throw new Error('Image generation URL is not defined in environment variables.');
      }

      const response = await fetch(generateImageUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
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

      // Save the generated image URL to the database
      const { data, error } = await supabase
        .from('content_platforms')
        .update({ image_url: imageURL })
        .eq('content_entry_id', entryId)
        .eq('platform', platform);

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

      // Save slide images to database using the specific platform ID
      await contentService.saveSlideImages(platformId, result[0].slideImages);

      return { data: result, error: null };
    } catch (error) {
      console.error('Error in downloadSlidesForPlatform:', error);
      return { data: null, error };
    }
  },

  saveSlideImages: async (platformId: string, slideImages: string[]) => {
    try {
      // Delete existing slide images for this platform
      const { error: deleteError } = await supabase
        .from('slide_images')
        .delete()
        .eq('platform_id', platformId);

      if (deleteError) {
        console.error('Error deleting existing slide images:', deleteError);
        return { data: null, error: deleteError };
      }

      // Insert new slide images
      const slidesToInsert = slideImages.map(image_url => ({
        platform_id: platformId,
        image_url: image_url,
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
        .eq('platform_id', platformId);

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

  publishContent: async (entryId: string, platform: string) => {
    try {
      const publishContentURL = process.env.NEXT_PUBLIC_PUBLISH_CONTENT_URL;

      if (!publishContentURL) {
        throw new Error('Publish content URL is not defined in environment variables.');
      }

      const [contentEntryId, _platform] = entryId.split('__');

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
        .eq('platform', platform)
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

  updatePlatformSchedule: async (entryId: string, scheduledAt: string) => {
    try {
      // Determine the platform from the entryId
      const [contentEntryId, platform] = entryId.split('__');

      // Update the scheduled_at in content_platforms table
      const { data, error } = await supabase
        .from('content_platforms')
        .update({ scheduled_at: scheduledAt })
        .eq('content_entry_id', contentEntryId)
        .eq('platform', platform);

      if (error) {
        console.error('Error updating platform schedule:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Unexpected error updating platform schedule:', error);
      return { data: null, error };
    }
  },

  // Get scheduled content from content_platforms table
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
