import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const Index = () => {
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');
  const [details, setDetails] = useState('');

  useEffect(() => {
    const test = async () => {
      try {
        const { error } = await supabase.auth.getSession();
        if (error) {
          setStatus('error');
          setDetails(error.message);
        } else {
          setStatus('ok');
          setDetails('Conexão com Supabase funcionando!');
        }
      } catch (e: any) {
        setStatus('error');
        setDetails(e.message || 'Erro desconhecido');
      }
    };
    test();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold">Teste de Conexão</h1>
        {status === 'loading' && <p className="text-muted-foreground">Testando...</p>}
        {status === 'ok' && <p className="text-green-600 font-semibold">✅ {details}</p>}
        {status === 'error' && <p className="text-red-600 font-semibold">❌ {details}</p>}
      </div>
    </div>
  );
};

export default Index;
