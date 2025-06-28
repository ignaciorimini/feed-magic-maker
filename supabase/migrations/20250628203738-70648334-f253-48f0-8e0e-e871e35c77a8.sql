
-- Create enum types only if they don't exist
DO $$ BEGIN
    CREATE TYPE platform_type AS ENUM ('instagram', 'linkedin', 'twitter', 'wordpress');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE content_status AS ENUM ('pending', 'generated', 'edited', 'scheduled', 'published');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create content_platforms table to replace the denormalized columns
CREATE TABLE IF NOT EXISTS public.content_platforms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_entry_id UUID NOT NULL REFERENCES public.content_entries(id) ON DELETE CASCADE,
  platform platform_type NOT NULL,
  status content_status DEFAULT 'pending',
  text TEXT,
  images TEXT[] DEFAULT '{}',
  slides_url TEXT,
  publish_date TIMESTAMP WITH TIME ZONE,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create slide_images table for Google Slides exports
CREATE TABLE IF NOT EXISTS public.slide_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_platform_id UUID NOT NULL REFERENCES public.content_platforms(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create uploaded_images table for manually uploaded images
CREATE TABLE IF NOT EXISTS public.uploaded_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_platform_id UUID NOT NULL REFERENCES public.content_platforms(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add indexes for better query performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_content_platforms_content_entry_id ON public.content_platforms(content_entry_id);
CREATE INDEX IF NOT EXISTS idx_content_platforms_platform ON public.content_platforms(platform);
CREATE INDEX IF NOT EXISTS idx_content_platforms_status ON public.content_platforms(status);
CREATE INDEX IF NOT EXISTS idx_slide_images_content_platform_id ON public.slide_images(content_platform_id);
CREATE INDEX IF NOT EXISTS idx_slide_images_position ON public.slide_images(content_platform_id, position);
CREATE INDEX IF NOT EXISTS idx_uploaded_images_content_platform_id ON public.uploaded_images(content_platform_id);

-- Add triggers for updated_at (drop first if exists)
DROP TRIGGER IF EXISTS update_content_platforms_updated_at ON public.content_platforms;
CREATE TRIGGER update_content_platforms_updated_at
  BEFORE UPDATE ON public.content_platforms
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Now remove the denormalized columns from content_entries
ALTER TABLE public.content_entries 
DROP COLUMN IF EXISTS platform_content,
DROP COLUMN IF EXISTS status_instagram,
DROP COLUMN IF EXISTS status_linkedin, 
DROP COLUMN IF EXISTS status_wordpress,
DROP COLUMN IF EXISTS status_twitter;

-- Drop the check constraints that were added earlier
ALTER TABLE public.content_entries 
DROP CONSTRAINT IF EXISTS status_instagram_check,
DROP CONSTRAINT IF EXISTS status_linkedin_check,
DROP CONSTRAINT IF EXISTS status_wordpress_check,
DROP CONSTRAINT IF EXISTS status_twitter_check;
