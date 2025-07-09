
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PublishNotificationPayload {
  platform_id: string;
  status: 'published' | 'error';
  published_url?: string;
  published_at?: string;
  api_key?: string;
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
    const payload: PublishNotificationPayload = await req.json();
    
    console.log('Received publish notification:', payload);

    // Validate required fields
    if (!payload.platform_id || !payload.status) {
      return new Response(JSON.stringify({ 
        error: 'Missing required fields: platform_id and status are required' 
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

    // Verify the platform exists
    const { data: platform, error: platformError } = await supabase
      .from('content_platforms')
      .select('id, content_entry_id')
      .eq('id', payload.platform_id)
      .single();

    if (platformError || !platform) {
      console.error('Platform not found:', platformError);
      return new Response(JSON.stringify({ 
        error: 'Platform not found' 
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Prepare update data
    const updateData: any = {
      status: payload.status,
      updated_at: new Date().toISOString(),
    };

    // Set published_at if status is published
    if (payload.status === 'published') {
      updateData.published_at = payload.published_at || new Date().toISOString();
    }

    // Set published_url if provided
    if (payload.published_url) {
      updateData.published_url = payload.published_url;
    }

    // Update the platform status
    const { data: updatedPlatform, error: updateError } = await supabase
      .from('content_platforms')
      .update(updateData)
      .eq('id', payload.platform_id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating platform:', updateError);
      return new Response(JSON.stringify({ 
        error: 'Failed to update platform status' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Successfully updated platform:', updatedPlatform);

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Platform status updated successfully',
      platform_id: payload.platform_id,
      status: payload.status
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in publish-notification function:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
