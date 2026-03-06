

## Correção: "Encerrados Hoje" conta apenas protocolos criados hoje

### Problema
Na linha 617 do Dashboard, o card "Encerrados Hoje" filtra por `isToday(parseISO(p.createdAt))` — ou seja, verifica a **data de criação**, não a **data de encerramento**. Protocolos encerrados hoje mas criados em dias anteriores não aparecem.

### Solução
Alterar o filtro do card "Encerrados Hoje" (linhas 616-618) para usar a data de encerramento extraída do `observacoesLog` (função `getDataEncerramentoFromLog` já existe no arquivo).

Em vez de:
```typescript
isToday(parseISO(p.createdAt))
```

Usar:
```typescript
const dataEnc = getDataEncerramentoFromLog(p.observacoesLog);
if (dataEnc) {
  const parsed = parse(dataEnc, 'dd/MM/yyyy', new Date());
  return isToday(parsed);
}
return false;
```

### Arquivo alterado
- `src/pages/Dashboard.tsx` — apenas o filtro do card "Encerrados Hoje" (linhas 614-618)

