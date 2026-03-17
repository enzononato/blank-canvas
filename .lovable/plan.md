
Objetivo: confirmar por que você acha que nada está indo para `alteracao_pedidos_log` e definir a correção mais provável.

O que eu verifiquei
- A página `src/pages/AlteracaoPedidos.tsx` já faz `insert` na tabela antes de chamar o webhook.
- A inserção acontece aqui:
  - `src/pages/AlteracaoPedidos.tsx:256-267`
- A tabela não está vazia:
  - existem 46 registros
  - o mais recente é de `2026-03-17 13:50:32+00`
- Portanto, hoje o problema não parece ser “não grava nada”.

O que isso indica
- Os registros estão sendo criados normalmente no banco.
- O problema mais provável é outro:
  1. todos os logs estão entrando com `sucesso = true`
  2. nenhum processo posterior está mudando para `sucesso = false`
  3. por isso a tela nunca mostra “erros”

Evidência importante
- Consulta no banco:
  - total: 46
  - erros (`sucesso = false`): 0
- Ou seja: está gravando, mas não está marcando falha.
- Também não encontrei código neste projeto que atualize `alteracao_pedidos_log` para erro depois do envio.
- Isso bate com a arquitetura atual: quem marca erro é o fluxo externo do n8n/webhook, não o frontend.

Diagnóstico provável
```text
Frontend:
1. insere log com sucesso=true
2. envia para o webhook com log_id

Esperado:
3. n8n recebe log_id
4. n8n atualiza alteracao_pedidos_log com sucesso=false e erro_mensagem quando falha

Situação atual:
- passo 1 está funcionando
- passo 4 aparentemente não está acontecendo
```

Plano de correção
1. Validar o retorno do webhook no frontend
- Hoje o código faz `fetch(...)` mas não verifica `response.ok` nem lê o corpo da resposta.
- Se o webhook responder erro HTTP, a interface ainda segue como se tivesse dado certo.
- Ajuste planejado:
  - capturar `response.status`
  - ler `response.text()` / JSON
  - se falhar, registrar no console e opcionalmente atualizar o log localmente

2. Confirmar se o n8n está usando o `log_id`
- O payload enviado já inclui `log_id`.
- Precisamos conferir se o workflow externo:
  - recebe esse campo
  - encontra a linha correta
  - faz update em `alteracao_pedidos_log`
  - grava `sucesso = false` e `erro_mensagem`

3. Melhorar a rastreabilidade na UI
- Adicionar logs visíveis no frontend para cada linha:
  - “log criado”
  - “webhook enviado”
  - “webhook respondeu erro”
- Isso separa claramente:
  - falha de insert
  - falha de webhook
  - falha de atualização do log externo

4. Melhorar o valor inicial do log
- Hoje o insert entra com `sucesso: true`.
- Melhor abordagem:
  - criar como “pendente” até o webhook confirmar
  - ou manter `sucesso`, mas marcar erro local se o `fetch` falhar
- Isso evita falso positivo no histórico.

O que eu implementaria
- Em `src/pages/AlteracaoPedidos.tsx`:
  - verificar o resultado do `insert`
  - verificar `response.ok` do webhook
  - logar detalhes do retorno
  - se o webhook falhar, atualizar a própria linha com `sucesso = false` e `erro_mensagem`
- Em `src/components/HistoricoEnvios.tsx`:
  - manter a tabela atual, porque ela já está pronta para mostrar os erros assim que forem gravados

Resultado esperado após o ajuste
- Você continuará vendo os registros na tabela `alteracao_pedidos_log`
- Quando houver falha real:
  - a linha passará para `sucesso = false`
  - `erro_mensagem` será preenchido
  - o item aparecerá automaticamente na coluna de erros da página

Resumo
- Não é que “não tem nada indo para a tabela”.
- Tem sim.
- O problema é que os logs estão entrando, mas nunca estão sendo marcados como erro.
- A correção deve focar na integração com o webhook/n8n e na validação do retorno no frontend.
