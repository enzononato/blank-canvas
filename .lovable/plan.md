

## Plan: Melhorar Layout da Página de Usuários

### O que será feito

Refinamento visual da página de Usuários para um layout mais polido e profissional:

1. **Cards de estatísticas** — Reorganizar para 4 cards na mesma linha (5 cards ficam desalinhados no grid `grid-cols-4`). Adicionar ícones maiores, sombras e hover effects. Mover "Controle" para dentro do grid de 4 colunas agrupando com Conferentes.

2. **Tabela** — Melhorar espaçamento, avatar com iniciais do usuário em vez de ícone genérico, badges de nível mais destacados, e linhas com melhor contraste no hover.

3. **Filtros** — Alinhar busca e select de nível com melhor proporção e visual.

4. **Header** — Subtítulo mais descritivo, espaçamento refinado.

5. **Cards de estatísticas corrigidos** — O grid atual tem 5 cards em `grid-cols-4`, causando desalinhamento. Reagrupar para 4 cards: Total, Admins, Operacional (Distribuição + Controle), Conferentes.

### Detalhes Técnicos

**Arquivo: `src/pages/Usuarios.tsx`**

- Refatorar grid de stats para 4 cards com ícones dentro de círculos coloridos e animação fade-in
- Adicionar avatar com iniciais do nome do usuário (2 primeiras letras) na coluna "Usuário" da tabela
- Melhorar badges de nível com ícone + texto
- Ajustar proporção dos filtros (`flex-1` para busca, `w-52` para select)
- Adicionar `shadow-sm hover:shadow-md transition-shadow` nos cards de stats
- Unidades na tabela com badges mais consistentes usando `Badge` component

