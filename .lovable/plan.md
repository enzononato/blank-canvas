

## Plan: Show friendly error messages on motorista login

### Problem
When the edge function returns HTTP 401 (wrong password) or 404 (not found), `supabase.functions.invoke` puts the response in the `error` field with a generic message like "Edge function returned 401". The actual JSON body with `"Senha incorreta"` is lost.

### Solution
Update `MotoristaAuthContext.tsx` login function to parse the error response body and extract the friendly message.

### Changes

**File: `src/contexts/MotoristaAuthContext.tsx`** (~lines 58-64)

Replace the error handling block to attempt parsing the error context for the original message:

```typescript
const { data, error } = await supabase.functions.invoke('motorista-login', {
  body: { identificador, senha },
});

if (error) {
  // supabase.functions.invoke wraps non-2xx responses as errors
  // Try to extract the friendly message from the error context
  try {
    const errorBody = error.context ? await error.context.json() : null;
    if (errorBody?.error) {
      return { success: false, error: errorBody.error };
    }
  } catch {}
  return { success: false, error: error.message || 'Erro ao fazer login' };
}
```

This way, "Senha incorreta", "CPF ou código não encontrado", etc. will be shown as friendly toast messages instead of the raw edge function error.

