
-- Remove the published_links column from content_entries table
ALTER TABLE content_entries DROP COLUMN IF EXISTS published_links;

-- Add published_url column to content_platforms table
ALTER TABLE content_platforms ADD COLUMN published_url TEXT NULL;
