CREATE TABLE public.rn_login_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  identificador text NOT NULL,
  sucesso boolean NOT NULL DEFAULT false,
  erro text,
  representante_id uuid,
  representante_nome text,
  unidade text,
  ip_info text
);

ALTER TABLE public.rn_login_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados podem ler logs de login rn"
ON public.rn_login_logs FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Inserção pública de logs de login rn"
ON public.rn_login_logs FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE INDEX idx_rn_login_logs_created_at ON public.rn_login_logs (created_at DESC);