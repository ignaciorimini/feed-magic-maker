
-- Create wordpress_posts table to store WordPress-specific fields
CREATE TABLE public.wordpress_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_platform_id UUID NOT NULL REFERENCES public.content_platforms(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  slug TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security (RLS) to ensure users can only see their own WordPress posts
ALTER TABLE public.wordpress_posts ENABLE ROW LEVEL SECURITY;

-- Create policy that allows users to manage their own WordPress posts
CREATE POLICY "Users can manage their own WordPress posts" 
  ON public.wordpress_posts 
  FOR ALL 
  USING (EXISTS (
    SELECT 1 
    FROM content_platforms cp
    JOIN content_entries ce ON ce.id = cp.content_entry_id
    WHERE cp.id = wordpress_posts.content_platform_id 
    AND ce.user_id = auth.uid()
  ));

-- Add trigger to automatically update updated_at timestamp
CREATE TRIGGER update_wordpress_posts_updated_at
  BEFORE UPDATE ON public.wordpress_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Add content_type column to content_platforms to store type per platform
ALTER TABLE public.content_platforms 
ADD COLUMN content_type TEXT;
