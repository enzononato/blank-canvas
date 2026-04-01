
DROP POLICY IF EXISTS "Usuários podem atualizar próprio perfil ou admin" ON public.user_profiles;

CREATE POLICY "Usuários podem atualizar próprio perfil ou admin"
ON public.user_profiles
FOR UPDATE
TO authenticated
USING (
  user_email = (auth.jwt() ->> 'email')
  OR has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  user_email = (auth.jwt() ->> 'email')
  OR has_role(auth.uid(), 'admin'::app_role)
);
