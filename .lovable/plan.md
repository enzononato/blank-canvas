
Objetivo: identificar por que os nós do n8n/Supabase “não retornam nada” para `alteracao_pedidos_log` e corrigir a causa mais provável.

O que eu confirmei
- A tabela `public.alteracao_pedidos_log` tem dados reais.
- Consulta recente no banco retornou vários registros, por exemplo:
  - `76d45274-5e3b-49f6-a97e-14ce2a1fcec7`
  - `33e6eae4-cdfa-4a03-b8ac-55d505603834`
- Então o problema não é “a tabela está vazia”.

O que também confirmei no app
- O frontend está inserindo primeiro na tabela e só depois chama o webhook.
- O `log_id` é enviado corretamente no payload para o n8n.
- A policy de `INSERT` já está liberada para `anon` e `authenticated`.
- A policy de `UPDATE` também está liberada para `anon` e `authenticated`.

Diagnóstico mais provável do n8n
Pelo workflow que você mostrou, o problema tende a estar no node Supabase do n8n, não no app nem no RLS atual.

1. Possível causa principal: credencial/projeto errado no n8n
- Seu workflow usa a credencial Supabase chamada `Reposição DB`.
- Se essa credencial estiver apontando para outro projeto/base, o node pode consultar a tabela errada ou uma base onde `alteracao_pedidos_log` não existe/não tem dados.

2. Possível causa forte: node “Get many rows” sem filtro e depois do merge dos ramos
- O fluxo atual termina em:
  - `sucesso` ou `erro`
  - `No Operation`
  - `Get many rows`
- Esse `Get many rows` busca a tabela inteira, sem filtro por `log_id`.
- Isso não ajuda a confirmar o item atual e pode parecer inconsistente no retorno.

3. Possível causa de branch de erro
- Você usa expressões diferentes para o `log_id`:
  - `$('Webhook').item.json.body.log_id`
  - `$('Webhook').first().json.body.log_id`
- Em workflows com múltiplos itens, isso pode gerar comportamento confuso. O ideal é padronizar.

4. Possível causa de execução “sem retorno útil”
- O node `sucesso` faz `update`, mas não necessariamente retorna a linha atualizada como você talvez espere visualizar.
- Dependendo da configuração/version do node Supabase no n8n, `update` pode devolver pouco ou nenhum dado útil se você não fizer um `get row` filtrado depois.

Plano de correção
1. Validar se o n8n está conectado ao mesmo backend
- Conferir na credencial `Reposição DB`:
  - URL do projeto
  - chave usada
- Ela precisa apontar para a mesma base onde o app grava os logs.

2. Trocar o `Get many rows` por busca filtrada do item atual
- Em vez de buscar tudo da tabela, buscar apenas:
  - `id = {{$('Webhook').item.json.body.log_id}}`
- Isso confirma exatamente a linha atualizada e evita a sensação de “não retorna nada”.

3. Padronizar a expressão do `log_id`
- Usar a mesma referência nos dois nodes (`sucesso` e `erro`), preferencialmente baseada no item do `Webhook`.
- Evita inconsistência entre `.item` e `.first()`.

4. Melhorar o branch de erro
- No node `erro`, além de `sucesso = false`, gravar também `erro_mensagem`.
- Assim você consegue validar no banco que o update aconteceu mesmo quando o envio falha.

5. Confirmar se o problema é leitura ou atualização
- Se o node Supabase “update” executa sem erro, mas você não vê retorno, a correção é de observabilidade do workflow.
- Se ele nem encontra/atualiza a linha, aí quase certamente é credencial errada, tabela errada ou expressão errada do `log_id`.

Configuração recomendada no n8n
```text
Webhook
  -> Send template
    -> sucesso (update alteracao_pedidos_log where id = log_id, sucesso = true)
    -> erro    (update alteracao_pedidos_log where id = log_id, sucesso = false, erro_mensagem = ...)

Depois disso:
  -> Get row / Get many rows COM filtro por id = log_id
```

O que eu implementaria na próxima etapa
- Revisar o workflow do n8n com você e te passar a configuração exata dos nodes:
  - `sucesso`
  - `erro`
  - node final de leitura filtrada por `log_id`
- E, no app, alinhar `HistoricoEnvios.tsx` para ter o mesmo padrão robusto da tela principal.

Resultado esperado
- O n8n vai conseguir localizar exatamente a linha recém-criada.
- O retorno do node Supabase deixará de parecer vazio, porque ele passará a consultar a linha correta.
- O histórico da aplicação vai mostrar com clareza sucesso ou erro para cada envio.

Detalhes técnicos
- Tabela: `public.alteracao_pedidos_log`
- Estado atual confirmado:
  - há registros
  - `INSERT` público está ativo
  - `UPDATE` público está ativo
- Arquivos do app já coerentes:
  - `src/pages/AlteracaoPedidos.tsx`
  - `src/components/HistoricoEnvios.tsx`
- Ponto mais suspeito fora do app:
  - credencial Supabase do n8n (`Reposição DB`)
  - node final sem filtro por `log_id`
