
-- Deletar profile órfão
DELETE FROM public.user_profiles WHERE user_email = 'controle@revalle.com.br';

-- Corrigir trigger para usar ON CONFLICT
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.user_profiles (user_email, nome)
  VALUES (NEW.email, COALESCE(NEW.raw_user_meta_data ->> 'nome', NEW.email))
  ON CONFLICT (user_email) DO UPDATE
    SET nome = EXCLUDED.nome;
  RETURN NEW;
END;
$$;
