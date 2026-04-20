

## Objetivo

Replicar o campo de **Quantidade** do formulário de Reposição (no MotoristaPortal) dentro do formulário de **Pós-Rota** (Sobras), mantendo o mesmo visual e comportamento: botões `[-]` e `[+]` ao redor do input numérico, em vez do input simples atual.

## Como está hoje

**Pós-Rota** (`PosRota.tsx`, linhas ~754–778): um simples `<Input type="number">` para quantidade.

**Reposição** (`MotoristaPortal.tsx`, linhas ~1393–1433): layout `[Botão -] [Input] [Botão +]` com:
- Botão `-` (ícone Minus, h-9 w-9), desabilitado quando qtd ≤ 1
- Input centralizado, w-14, `inputMode="numeric"`, com `onFocus={e => e.target.select()}`
- Botão `+` (ícone Plus, h-9 w-9), incrementa em 1

## Mudança proposta

No arquivo `src/components/motorista/PosRota.tsx`, substituir o bloco do campo "Qtd" dentro do `produtos.map` por um stepper idêntico ao da Reposição:

- Importar o ícone `Minus` (já existem `Plus`, `Trash2` etc.)
- Trocar o `<Input>` único por um wrapper flex contendo: botão `-`, input centralizado, botão `+`
- Lógica:
  - `-`: `updateProduto(index, 'quantidade', Math.max(1, produto.quantidade - 1))`
  - `+`: `updateProduto(index, 'quantidade', produto.quantidade + 1)`
  - Input: mesmas classes (`h-9 text-sm text-center w-14`), `onFocus={e => e.target.select()}`, `inputMode="numeric"`, mantendo o parser `parseInt(e.target.value) || 1`
- O Select de Unidade ao lado permanece como está (UN/CX/PCT — escopo do Pós-Rota).

Tipo de `quantidade` em PosRota continua `number` (não vou mudar para string, evita risco em outras partes do submit/payload). A lógica do stepper trabalha em number e produz number — compatível com o restante.

## Detalhes técnicos

Arquivo afetado: `src/components/motorista/PosRota.tsx`
- Adicionar `Minus` ao import do `lucide-react` (linha 20).
- Substituir o `<div className="space-y-1">` da Qtd (linhas ~755–764) pelo bloco com 3 elementos no padrão da Reposição.
- Manter o grid `grid-cols-2` atual (Qtd | Unidade), apenas trocando o conteúdo da coluna Qtd.

## Fora de escopo

- Não alterar o Select de Unidade (mantém UN/CX/PCT do Pós-Rota — diferente de UND da reposição, é intencional pelo backend).
- Não adicionar campo de validade no Pós-Rota.
- Não mexer nos demais formulários ou no payload do webhook.

