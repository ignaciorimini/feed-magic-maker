
-- Add the missing status_twitter column to the content_entries table
ALTER TABLE public.content_entries 
ADD COLUMN status_twitter TEXT DEFAULT 'pending';
