CREATE POLICY "Permitir leitura anon alteracao_pedidos_log"
ON public.alteracao_pedidos_log
FOR SELECT
TO anon
USING (true);