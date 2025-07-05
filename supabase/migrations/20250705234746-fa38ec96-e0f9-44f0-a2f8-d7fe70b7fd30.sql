
-- Add scheduled_at column to content_platforms table
ALTER TABLE public.content_platforms 
ADD COLUMN scheduled_at timestamp with time zone;

-- Add comment to document the column purpose
COMMENT ON COLUMN public.content_platforms.scheduled_at IS 'Scheduled date and time for automatic publishing. Used by external automation to publish content with status=pending when scheduled_at <= now()';
