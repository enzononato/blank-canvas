
CREATE TABLE public.alteracao_pedidos_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  cod_pdv text NOT NULL,
  nome_pdv text,
  telefone_pdv text,
  status_pedido text,
  mensagem_cliente text,
  sucesso boolean NOT NULL DEFAULT true,
  erro_mensagem text,
  enviado_por text
);

ALTER TABLE public.alteracao_pedidos_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados podem ler alteracao_pedidos_log"
  ON public.alteracao_pedidos_log FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Autenticados podem inserir alteracao_pedidos_log"
  ON public.alteracao_pedidos_log FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Update público alteracao_pedidos_log"
  ON public.alteracao_pedidos_log FOR UPDATE TO anon, authenticated
  USING (true) WITH CHECK (true);
