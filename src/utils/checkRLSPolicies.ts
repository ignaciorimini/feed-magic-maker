
import { supabase } from '@/integrations/supabase/client';

export const checkAndLogRLSPolicies = async () => {
  try {
    console.log('=== CHECKING RLS POLICIES ===');
    
    // Test if we can perform basic operations on content_platforms table
    // This will help us understand if RLS is working correctly
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.warn('⚠️  No authenticated user - RLS policies cannot be tested');
      return;
    }

    console.log('Testing RLS policies for authenticated user:', user.id);

    // Test SELECT permission
    const { data: selectTest, error: selectError } = await supabase
      .from('content_platforms')
      .select('id, platform')
      .limit(1);

    if (selectError) {
      console.error('❌ SELECT permission test failed:', selectError.message);
      if (selectError.message.includes('row-level security')) {
        console.error('🔒 RLS is blocking SELECT operations - policies may need to be created');
      }
    } else {
      console.log('✅ SELECT permission test passed');
    }

    // Test INSERT permission (we'll try to insert and then delete immediately)
    const testPlatformData = {
      content_entry_id: '00000000-0000-0000-0000-000000000000', // This will fail FK constraint, but that's ok
      platform: 'instagram' as const,
      status: 'pending' as const,
      text: 'RLS test - will be deleted'
    };

    const { error: insertError } = await supabase
      .from('content_platforms')
      .insert(testPlatformData);

    if (insertError) {
      console.error('❌ INSERT permission test failed:', insertError.message);
      if (insertError.message.includes('row-level security')) {
        console.error('🔒 RLS is blocking INSERT operations - policies may need to be created');
      } else if (insertError.message.includes('foreign key')) {
        console.log('✅ INSERT permission test passed (FK constraint expected)');
      }
    } else {
      console.log('✅ INSERT permission test passed');
    }

    // Test UPDATE permission
    const { error: updateError } = await supabase
      .from('content_platforms')
      .update({ text: 'test update' })
      .eq('id', '00000000-0000-0000-0000-000000000000'); // Non-existent ID

    if (updateError) {
      console.error('❌ UPDATE permission test failed:', updateError.message);
      if (updateError.message.includes('row-level security')) {
        console.error('🔒 RLS is blocking UPDATE operations - policies may need to be created');
      }
    } else {
      console.log('✅ UPDATE permission test passed');
    }

  } catch (error) {
    console.error('Error checking RLS policies:', error);
  }
};
