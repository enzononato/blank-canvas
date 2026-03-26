ALTER TABLE protocolos 
ADD COLUMN IF NOT EXISTS enviado_lancar_status text DEFAULT 'pendente',
ADD COLUMN IF NOT EXISTS enviado_lancar_erro text,
ADD COLUMN IF NOT EXISTS enviado_encerrar_status text DEFAULT 'pendente',
ADD COLUMN IF NOT EXISTS enviado_encerrar_erro text,
ADD COLUMN IF NOT EXISTS cliente_telefone text;