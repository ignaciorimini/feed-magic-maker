import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SlideDownloadNotificationPayload {
  action: string;
  slidesURL: string;
  slideImages: string[];
  topic?: string;
  platform_id?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const payload: SlideDownloadNotificationPayload = await req.json();
    
    console.log('Received slide download notification:', payload);

    // Validate required fields
    if (!payload.action || payload.action !== 'download_slides' || !payload.slidesURL || !payload.slideImages) {
      return new Response(JSON.stringify({ 
        error: 'Missing required fields: action, slidesURL, and slideImages are required' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Initialize Supabase client with service role key for database operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Find the platform(s) with this slides URL
    const { data: platforms, error: platformError } = await supabase
      .from('content_platforms')
      .select('id, content_entry_id')
      .eq('slides_url', payload.slidesURL);

    if (platformError || !platforms || platforms.length === 0) {
      console.error('Platform not found for slides URL:', payload.slidesURL, platformError);
      return new Response(JSON.stringify({ 
        error: 'Platform not found for the provided slides URL' 
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Save slide images for each platform that has this slides URL
    for (const platform of platforms) {
      console.log('Saving slide images for platform:', platform.id);

      // Delete existing slide images for this platform
      const { error: deleteError } = await supabase
        .from('slide_images')
        .delete()
        .eq('content_platform_id', platform.id);

      if (deleteError) {
        console.error('Error deleting existing slide images:', deleteError);
        continue; // Continue with next platform instead of failing completely
      }

      // Insert new slide images
      const slidesToInsert = payload.slideImages.map((image_url, index) => ({
        content_platform_id: platform.id,
        image_url: image_url,
        position: index
      }));

      const { error: insertError } = await supabase
        .from('slide_images')
        .insert(slidesToInsert);

      if (insertError) {
        console.error('Error saving slide images for platform:', platform.id, insertError);
        continue; // Continue with next platform instead of failing completely
      }

      console.log('Successfully saved slide images for platform:', platform.id);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Slide images saved successfully',
      platforms_updated: platforms.length,
      slides_count: payload.slideImages.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in slide-download-notification function:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});