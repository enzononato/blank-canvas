## Alterações no formulário de Troca (Portal RN)

**Arquivo:** `src/components/rn/TrocaForm.tsx`

### 1. Lista de motivos sem números e correção de "Mal Cheio"
Substituir `CAUSAS_TROCA` para exibir apenas o texto, sem prefixo numérico, e corrigir "Mal Cheio" → "Mal cheiro":
- Vencido
- Embalagem Avariada
- Sabor Alterado
- Impureza
- Mal cheiro
- Sem data de Validade
- Fora do Prazo Comercial
- Produto Impróprio

Isso afeta tanto o `<Select>` quanto o valor salvo em `causa` no banco e no webhook (passa a ir só o texto limpo).

### 2. Novo campo "NF de origem"
Adicionar novo state `notaFiscal` com input que aceita apenas dígitos (`onChange` com `replace(/\D/g, '')`), `inputMode="numeric"`, label "NF de origem". Campo opcional (não bloqueia submit).

Posicionar logo abaixo do PDV e antes do Motivo da Troca.

No `insert` do Supabase: passar `nota_fiscal: notaFiscal.trim() || null`.

No payload do webhook n8n: `notaFiscal: notaFiscal.trim()` (hoje vai vazio fixo).

Incluir também na mensagem de WhatsApp gerada (`buildMensagem`) quando preenchido, e em `dadosCriado` para persistir após envio.

Reset no `resetForm`.
