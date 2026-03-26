-- Fix duplicate key errors by scoping uniqueness to (unidade, codigo)

-- Normalize existing rows
UPDATE public.pdvs
SET unidade = 'SEM_UNIDADE'
WHERE unidade IS NULL;

-- Ensure unidade is always present going forward
ALTER TABLE public.pdvs
ALTER COLUMN unidade SET NOT NULL;

-- Drop the old global-unique constraint on codigo
ALTER TABLE public.pdvs
DROP CONSTRAINT IF EXISTS pdvs_codigo_key;

-- Add composite unique constraint per unidade
ALTER TABLE public.pdvs
ADD CONSTRAINT pdvs_unidade_codigo_key UNIQUE (unidade, codigo);

-- Helpful index for unidade filtering
CREATE INDEX IF NOT EXISTS idx_pdvs_unidade ON public.pdvs (unidade);
