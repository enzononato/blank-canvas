
Objetivo: desbloquear o INSERT na tabela `alteracao_pedidos_log` com RLS e confirmar a sequência correta no frontend.

Plano proposto

1. Ajustar a policy de INSERT da tabela
- O problema está no RLS da tabela `alteracao_pedidos_log`: hoje o `INSERT` está liberado só para `authenticated`.
- Como você quer permitir inserção para usuários públicos e autenticados, a policy precisa incluir `anon` e `authenticated`.

SQL exato para rodar no SQL Editor
```sql
DROP POLICY IF EXISTS "Autenticados podem inserir alteracao_pedidos_log"
ON public.alteracao_pedidos_log;

CREATE POLICY "Allow INSERT for anon and authenticated users"
ON public.alteracao_pedidos_log
FOR INSERT
TO anon, authenticated
WITH CHECK (true);
```

2. Validar a lógica atual do frontend
Pelo código atual de `src/pages/AlteracaoPedidos.tsx`, a sequência principal já está correta:
- primeiro faz `insert` em `alteracao_pedidos_log`
- usa `.select('id').single()` para capturar o `id`
- só depois chama o webhook
- envia `log_id` junto no payload JSON

Fluxo atual identificado no código
```text
CSV -> parseCSV()
-> INSERT em alteracao_pedidos_log
-> captura logData.id
-> fetch POST para o webhook com log_id
-> se webhook falhar, faz UPDATE no mesmo log com sucesso=false e erro_mensagem
```

3. Garantia de não disparar webhook se o INSERT falhar
Isso também já está implementado no loop principal:
- se `logError` existir:
  - mostra erro na interface com `toast.error(...)`
  - faz `continue`
  - não executa o `fetch` daquela linha

Ou seja, o comportamento pedido já existe nessa parte.

4. Ponto extra a revisar
- O componente `HistoricoEnvios.tsx` ainda faz reenvio sem validar `response.ok` do webhook.
- Se a ideia é padronizar totalmente a confiabilidade, esse mesmo tratamento de erro deveria ser replicado ali também.

Resultado esperado
- O envio do CSV volta a conseguir gravar logs mesmo quando a sessão estiver usando role pública.
- Cada linha cria primeiro um log no banco.
- O webhook recebe o `log_id`.
- Se o INSERT falhar, a linha para ali e o webhook não é disparado.
- Se o webhook falhar, o log é atualizado com erro e passa a aparecer corretamente na interface.

Detalhes técnicos
- Tabela afetada: `public.alteracao_pedidos_log`
- Policy atual problemática: `INSERT` apenas para `authenticated`
- Arquivo principal revisado: `src/pages/AlteracaoPedidos.tsx`
- Comportamento já confirmado no frontend:
  - `insert(...).select('id').single()`
  - bloqueio do webhook em caso de erro no insert
  - envio de `log_id` no payload
  - update do log quando o webhook falha

Se eu for implementar depois da sua aprovação, eu faria em duas frentes:
1. aplicar a nova policy de RLS
2. alinhar o `HistoricoEnvios.tsx` com a mesma lógica de validação robusta que já existe na tela principal
