import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status,
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { user_email, new_password } = await req.json()

    if (!user_email || !new_password) {
      return jsonResponse({ error: 'Email e nova senha são obrigatórios' }, 400)
    }

    const emailLower = user_email.toLowerCase()
    let foundUser: { id: string; email?: string } | undefined
    let page = 1
    const perPage = 1000

    // Paginar até encontrar (máx 20k usuários)
    while (!foundUser) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage })
      if (error) {
        console.error('listUsers error:', error.message)
        return jsonResponse({ error: error.message }, 200)
      }
      const users = data?.users ?? []
      foundUser = users.find((u: { email?: string }) => u.email?.toLowerCase() === emailLower)
      if (foundUser || users.length < perPage) break
      page += 1
      if (page > 20) break
    }

    if (!foundUser) {
      console.error('Usuário não encontrado no Auth:', user_email)
      return jsonResponse({ 
        error: `Usuário ${user_email} não encontrado no sistema de autenticação. A senha não pôde ser atualizada.`,
        reason: 'USER_NOT_FOUND'
      }, 200)
    }

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      foundUser.id,
      { password: new_password }
    )

    if (updateError) {
      console.error('updateUserById error:', updateError.message)
      return jsonResponse({ error: updateError.message }, 200)
    }

    return jsonResponse({ success: true, message: 'Senha atualizada com sucesso' })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    console.error('Unhandled error:', message)
    return jsonResponse({ error: message }, 200)
  }
})
