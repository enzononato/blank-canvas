import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Iniciando teste de webhook de criação de protocolo...');
    
    const webhookUrl = 'https://n8n.revalle.com.br/webhook/reposicaowpp';
    
    // Payload simulando criação de protocolo
    const webhookPayload = {
      tipo: 'criacao_protocolo',
      numero: 'TESTE-CRIACAO-' + Date.now(),
      data: '02/01/2026',
      hora: '15:00:00',
      motoristaNome: 'MOTORISTA TESTE WEBHOOK',
      motoristaCodigo: 'MT001',
      motoristaUnidade: 'Revalle Juazeiro',
      motoristaWhatsapp: '74999999999',
      motoristaEmail: 'teste@teste.com',
      mapa: '12345',
      codigoPdv: 'PDV001',
      notaFiscal: 'NF123456',
      tipoReposicao: 'Avaria',
      produtos: [
        {
          produto: 'Produto Teste 1',
          quantidade: 10,
          unidade: 'UN'
        },
        {
          produto: 'Produto Teste 2',
          quantidade: 5,
          unidade: 'CX'
        }
      ],
      fotoMotoristaPdv: 'https://exemplo.com/foto1.jpg',
      fotoLoteProduto: 'https://exemplo.com/foto2.jpg',
      fotoAvaria: 'https://exemplo.com/foto3.jpg',
      whatsappContato: '74988888888',
      emailContato: 'contato@teste.com',
      observacaoGeral: 'Protocolo de teste para verificar campo tipo no webhook'
    };

    console.log('Payload do webhook:', JSON.stringify(webhookPayload, null, 2));

    // Enviar webhook
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookPayload),
    });

    const responseText = await response.text();
    
    console.log('Status da resposta:', response.status);
    console.log('Resposta do webhook:', responseText);

    const result = {
      sucesso: response.ok,
      status: response.status,
      resposta: responseText,
      payloadEnviado: webhookPayload,
      executadoEm: new Date().toISOString()
    };

    return new Response(JSON.stringify(result, null, 2), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    console.error('Erro no teste de webhook:', error);
    
    return new Response(JSON.stringify({
      sucesso: false,
      erro: error instanceof Error ? error.message : String(error),
      executadoEm: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
