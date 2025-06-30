
-- Add missing RLS policies for content_platforms table
CREATE POLICY "Users can update their own content platforms" 
ON public.content_platforms 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.content_entries 
    WHERE content_entries.id = content_platforms.content_entry_id 
    AND content_entries.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own content platforms" 
ON public.content_platforms 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.content_entries 
    WHERE content_entries.id = content_platforms.content_entry_id 
    AND content_entries.user_id = auth.uid()
  )
);
