-- Adicionar política de DELETE para user_profiles (apenas admins)
CREATE POLICY "Admins can delete user_profiles"
ON public.user_profiles
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);