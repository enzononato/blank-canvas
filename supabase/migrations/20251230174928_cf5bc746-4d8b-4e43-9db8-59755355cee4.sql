-- Trigger function para deletar user_role quando user_profile for excluído
CREATE OR REPLACE FUNCTION public.handle_user_profile_deleted()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Deletar o user_role correspondente usando o email para encontrar o user_id
  DELETE FROM public.user_roles 
  WHERE user_id IN (
    SELECT id FROM auth.users WHERE email = OLD.user_email
  );
  RETURN OLD;
END;
$$;

-- Trigger que dispara antes de deletar um user_profile
CREATE TRIGGER on_user_profile_deleted
  BEFORE DELETE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_profile_deleted();

-- Trigger function para sincronizar user_roles quando user_profiles.nivel for atualizado
CREATE OR REPLACE FUNCTION public.handle_user_profile_nivel_updated()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Se o nível mudou, atualizar o role correspondente
  IF OLD.nivel IS DISTINCT FROM NEW.nivel AND NEW.nivel IS NOT NULL THEN
    UPDATE public.user_roles 
    SET role = NEW.nivel::app_role
    WHERE user_id IN (
      SELECT id FROM auth.users WHERE email = NEW.user_email
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger que dispara após atualizar um user_profile
CREATE TRIGGER on_user_profile_nivel_updated
  AFTER UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_profile_nivel_updated();