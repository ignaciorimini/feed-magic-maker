
-- Agregar columna separada para imagen en content_entries
ALTER TABLE public.content_entries 
ADD COLUMN image_url TEXT;

-- Migrar imágenes existentes desde platform_content hacia la nueva columna
UPDATE public.content_entries 
SET image_url = (
  CASE 
    WHEN platform_content->'instagram'->'images'->0 IS NOT NULL 
      AND platform_content->'instagram'->'images'->0 != '"null"'::jsonb
      AND platform_content->'instagram'->'images'->0 != '"/placeholder.svg"'::jsonb
    THEN platform_content->'instagram'->'images'->>0
    WHEN platform_content->'linkedin'->'images'->0 IS NOT NULL 
      AND platform_content->'linkedin'->'images'->0 != '"null"'::jsonb
      AND platform_content->'linkedin'->'images'->0 != '"/placeholder.svg"'::jsonb
    THEN platform_content->'linkedin'->'images'->>0
    WHEN platform_content->'wordpress'->'images'->0 IS NOT NULL 
      AND platform_content->'wordpress'->'images'->0 != '"null"'::jsonb
      AND platform_content->'wordpress'->'images'->0 != '"/placeholder.svg"'::jsonb
    THEN platform_content->'wordpress'->'images'->>0
    WHEN platform_content->'twitter'->'images'->0 IS NOT NULL 
      AND platform_content->'twitter'->'images'->0 != '"null"'::jsonb
      AND platform_content->'twitter'->'images'->0 != '"/placeholder.svg"'::jsonb
    THEN platform_content->'twitter'->'images'->>0
    ELSE NULL
  END
)
WHERE image_url IS NULL;
