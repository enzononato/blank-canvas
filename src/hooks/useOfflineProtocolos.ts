import { useState, useEffect, useCallback } from 'react';
import { Protocolo } from '@/types';
import { toast } from '@/hooks/use-toast';

const OFFLINE_STORAGE_KEY = 'offline_protocolos';
const SYNC_STATUS_KEY = 'offline_sync_pending';

interface OfflineProtocolo {
  protocolo: Protocolo;
  createdAt: string;
  synced: boolean;
}

export function useOfflineProtocolos() {
  const [pendingProtocolos, setPendingProtocolos] = useState<OfflineProtocolo[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);

  // Carregar protocolos pendentes do localStorage
  useEffect(() => {
    const stored = localStorage.getItem(OFFLINE_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as OfflineProtocolo[];
        setPendingProtocolos(parsed.filter(p => !p.synced));
      } catch {
        localStorage.removeItem(OFFLINE_STORAGE_KEY);
      }
    }
  }, []);

  // Monitorar status de conexão
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: 'Conexão restaurada',
        description: 'Sincronizando protocolos pendentes...',
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: 'Sem conexão',
        description: 'Os protocolos serão salvos localmente',
        variant: 'destructive',
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Salvar protocolo offline
  const saveOffline = useCallback((protocolo: Protocolo) => {
    const offlineProtocolo: OfflineProtocolo = {
      protocolo,
      createdAt: new Date().toISOString(),
      synced: false,
    };

    const stored = localStorage.getItem(OFFLINE_STORAGE_KEY);
    const existing: OfflineProtocolo[] = stored ? JSON.parse(stored) : [];
    const updated = [...existing, offlineProtocolo];
    
    localStorage.setItem(OFFLINE_STORAGE_KEY, JSON.stringify(updated));
    localStorage.setItem(SYNC_STATUS_KEY, 'true');
    setPendingProtocolos(updated.filter(p => !p.synced));

    toast({
      title: 'Salvo localmente',
      description: 'O protocolo será enviado quando a conexão for restaurada',
    });

    return offlineProtocolo;
  }, []);

  // Sincronizar protocolos pendentes
  const syncPending = useCallback(async (
    addProtocolo: (protocolo: Protocolo) => Promise<Protocolo>
  ) => {
    if (!isOnline || isSyncing || pendingProtocolos.length === 0) return;

    setIsSyncing(true);
    const stored = localStorage.getItem(OFFLINE_STORAGE_KEY);
    const all: OfflineProtocolo[] = stored ? JSON.parse(stored) : [];
    
    let syncedCount = 0;
    const updated = [...all];

    for (let i = 0; i < updated.length; i++) {
      if (updated[i].synced) continue;

      try {
        await addProtocolo(updated[i].protocolo);
        updated[i].synced = true;
        syncedCount++;
      } catch (error) {
        console.error('Erro ao sincronizar protocolo:', error);
      }
    }

    localStorage.setItem(OFFLINE_STORAGE_KEY, JSON.stringify(updated));
    setPendingProtocolos(updated.filter(p => !p.synced));

    if (syncedCount > 0) {
      toast({
        title: 'Sincronização concluída',
        description: `${syncedCount} protocolo(s) enviado(s) com sucesso`,
      });
    }

    // Limpar se todos foram sincronizados
    if (updated.every(p => p.synced)) {
      localStorage.removeItem(SYNC_STATUS_KEY);
    }

    setIsSyncing(false);
  }, [isOnline, isSyncing, pendingProtocolos]);

  // Verificar se há protocolos pendentes
  const hasPending = pendingProtocolos.length > 0;
  const pendingCount = pendingProtocolos.length;

  return {
    isOnline,
    isSyncing,
    hasPending,
    pendingCount,
    pendingProtocolos,
    saveOffline,
    syncPending,
  };
}
