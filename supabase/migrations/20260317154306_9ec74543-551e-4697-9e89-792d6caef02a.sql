DROP POLICY IF EXISTS "Autenticados podem inserir alteracao_pedidos_log" ON public.alteracao_pedidos_log;

CREATE POLICY "Permitir insert publico alteracao_pedidos_log"
ON public.alteracao_pedidos_log
FOR INSERT
TO anon, authenticated
WITH CHECK (true);