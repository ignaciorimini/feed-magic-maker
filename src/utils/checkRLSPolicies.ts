
import { supabase } from '@/integrations/supabase/client';

export const checkAndLogRLSPolicies = async () => {
  try {
    console.log('=== CHECKING RLS POLICIES ===');
    
    // Check if RLS is enabled on content_platforms
    const { data: rlsStatus, error: rlsError } = await supabase
      .from('pg_class')
      .select('relname, relrowsecurity')
      .eq('relname', 'content_platforms')
      .single();
    
    if (!rlsError && rlsStatus) {
      console.log('RLS enabled on content_platforms:', rlsStatus.relrowsecurity);
    }

    // Check policies
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'content_platforms');
    
    if (!policiesError && policies) {
      console.log('Policies on content_platforms:', policies);
      if (policies.length === 0) {
        console.warn('⚠️  No RLS policies found on content_platforms table!');
        console.warn('This might prevent users from updating their content.');
      }
    }

  } catch (error) {
    console.error('Error checking RLS policies:', error);
  }
};
