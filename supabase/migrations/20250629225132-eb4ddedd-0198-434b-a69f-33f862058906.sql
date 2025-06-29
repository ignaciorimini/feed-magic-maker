
-- Enable RLS on content_platforms table if not already enabled
ALTER TABLE public.content_platforms ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to select content_platforms that belong to their content_entries
CREATE POLICY "Users can view their own content platforms" 
ON public.content_platforms 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.content_entries 
    WHERE content_entries.id = content_platforms.content_entry_id 
    AND content_entries.user_id = auth.uid()
  )
);

-- Create policy to allow users to insert content_platforms for their own content_entries
CREATE POLICY "Users can create content platforms for their entries" 
ON public.content_platforms 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.content_entries 
    WHERE content_entries.id = content_platforms.content_entry_id 
    AND content_entries.user_id = auth.uid()
  )
);

-- Create policy to allow users to update content_platforms that belong to their content_entries
CREATE POLICY "Users can update their own content platforms" 
ON public.content_platforms 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.content_entries 
    WHERE content_entries.id = content_platforms.content_entry_id 
    AND content_entries.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.content_entries 
    WHERE content_entries.id = content_platforms.content_entry_id 
    AND content_entries.user_id = auth.uid()
  )
);

-- Create policy to allow users to delete content_platforms that belong to their content_entries
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
