-- Criar bucket para fotos de protocolos
INSERT INTO storage.buckets (id, name, public)
VALUES ('fotos-protocolos', 'fotos-protocolos', true)
ON CONFLICT (id) DO NOTHING;

-- Política para upload de fotos (qualquer pessoa pode fazer upload)
CREATE POLICY "Qualquer pessoa pode fazer upload de fotos"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'fotos-protocolos');

-- Política para visualização pública das fotos
CREATE POLICY "Fotos de protocolos são públicas"
ON storage.objects
FOR SELECT
USING (bucket_id = 'fotos-protocolos');

-- Política para deleção de fotos
CREATE POLICY "Qualquer pessoa pode deletar fotos"
ON storage.objects
FOR DELETE
USING (bucket_id = 'fotos-protocolos');