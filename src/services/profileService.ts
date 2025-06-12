
import { supabase } from '@/integrations/supabase/client';

export interface BrandGuidelines {
  colors: string[];
  logo_url?: string;
  brand_description?: string;
}

export interface PostingGuidelines {
  tone: string;
  language: string;
  target_audience: string;
  additional_notes?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  brand_guidelines: BrandGuidelines;
  posting_guidelines: PostingGuidelines;
  webhook_url?: string;
  selected_platforms: string[];
  created_at: string;
  updated_at: string;
}

// Type guards to safely check if data matches our interfaces
const isBrandGuidelines = (data: any): data is BrandGuidelines => {
  return data && Array.isArray(data.colors);
};

const isPostingGuidelines = (data: any): data is PostingGuidelines => {
  return data && typeof data.tone === 'string' && typeof data.language === 'string' && typeof data.target_audience === 'string';
};

export const profileService = {
  // Get user profile
  async getUserProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    return { data, error };
  },

  // Update user profile
  async updateUserProfile(userId: string, profileData: {
    brand_guidelines?: BrandGuidelines;
    posting_guidelines?: PostingGuidelines;
    webhook_url?: string | null;
    selected_platforms?: string[];
  }) {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        brand_guidelines: profileData.brand_guidelines as any,
        posting_guidelines: profileData.posting_guidelines as any,
        webhook_url: profileData.webhook_url,
        selected_platforms: profileData.selected_platforms as any,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    return { data, error };
  },

  // Check if profile needs setup (first time user)
  async checkProfileSetup(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('brand_guidelines, posting_guidelines, webhook_url, selected_platforms')
      .eq('id', userId)
      .maybeSingle();

    if (error) return { needsSetup: true, error };

    // If no profile exists or the guidelines are null/empty, user needs setup
    const needsSetup = !data || !data.brand_guidelines || !data.posting_guidelines;
    return { needsSetup, error: null };
  },

  // Helper functions to safely extract typed data
  getBrandGuidelines: (data: any): BrandGuidelines | null => {
    if (isBrandGuidelines(data)) {
      return data;
    }
    return null;
  },

  getPostingGuidelines: (data: any): PostingGuidelines | null => {
    if (isPostingGuidelines(data)) {
      return data;
    }
    return null;
  }
};
