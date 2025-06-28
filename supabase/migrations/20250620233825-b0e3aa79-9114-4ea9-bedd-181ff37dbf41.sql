
-- Modificar la tabla content_entries para hacer los campos de estado nullable por defecto
-- y solo establecer valores cuando las plataformas sean seleccionadas

-- Cambiar el default de los campos de estado a NULL en lugar de 'pending'
ALTER TABLE public.content_entries 
ALTER COLUMN status_instagram DROP DEFAULT,
ALTER COLUMN status_linkedin DROP DEFAULT, 
ALTER COLUMN status_wordpress DROP DEFAULT,
ALTER COLUMN status_twitter DROP DEFAULT;

-- Establecer NULL como valor por defecto para estos campos
ALTER TABLE public.content_entries 
ALTER COLUMN status_instagram SET DEFAULT NULL,
ALTER COLUMN status_linkedin SET DEFAULT NULL,
ALTER COLUMN status_wordpress SET DEFAULT NULL, 
ALTER COLUMN status_twitter SET DEFAULT NULL;

-- Actualizar entradas existentes para que tengan NULL en plataformas no utilizadas
-- (esto requerirá lógica específica basada en el contenido de platform_content)
UPDATE public.content_entries 
SET status_instagram = NULL 
WHERE platform_content->>'instagram' IS NULL OR platform_content->'instagram' IS NULL;

UPDATE public.content_entries 
SET status_linkedin = NULL 
WHERE platform_content->>'linkedin' IS NULL OR platform_content->'linkedin' IS NULL;

UPDATE public.content_entries 
SET status_wordpress = NULL 
WHERE platform_content->>'wordpress' IS NULL OR platform_content->'wordpress' IS NULL;

UPDATE public.content_entries 
SET status_twitter = NULL 
WHERE platform_content->>'twitter' IS NULL OR platform_content->'twitter' IS NULL;
