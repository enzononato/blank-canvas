import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Upload, FileSpreadsheet, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { usePdvsDB, PdvImport } from '@/hooks/usePdvsDB';
import * as XLSX from 'xlsx';

const UNIDADES = [
  { codigo: 'BF', nome: 'Revalle Bonfim' },
  { codigo: 'PE', nome: 'Revalle Petrolina' },
  { codigo: 'RP', nome: 'Revalle Ribeira do Pombal' },
  { codigo: 'AL', nome: 'Revalle Alagoinhas' },
  { codigo: 'SE', nome: 'Revalle Serrinha' },
  { codigo: 'JZ', nome: 'Revalle Juazeiro' },
  { codigo: 'PA', nome: 'Revalle Paulo Afonso' },
];

interface ImportarPdvsDialogProps {
  onSuccess?: () => void;
}

export function ImportarPdvsDialog({ onSuccess }: ImportarPdvsDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedUnidade, setSelectedUnidade] = useState<string>('');
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [preview, setPreview] = useState<PdvImport[]>([]);
  const [totalPdvs, setTotalPdvs] = useState(0);
  const [importResult, setImportResult] = useState<{ success: boolean; total: number; error?: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { importPdvs, isImporting } = usePdvsDB();

  const parseCSV = (content: string): PdvImport[] => {
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const header = lines[0].toLowerCase();
    const separator = header.includes(';') ? ';' : ',';
    const headers = header.split(separator).map(h => h.trim());

    const codigoIdx = headers.findIndex(h => h.includes('codigo'));
    const nomeIdx = headers.findIndex(h => h.includes('fantasia') || h.includes('nome'));
    const bairroIdx = headers.findIndex(h => h.includes('bairro'));
    const cnpjIdx = headers.findIndex(h => h.includes('cnpj'));
    const enderecoIdx = headers.findIndex(h => h.includes('endereco') || h.includes('endereço'));
    const cidadeIdx = headers.findIndex(h => h.includes('cidade'));

    const pdvs: PdvImport[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(separator).map(v => v.trim());
      
      const codigo = codigoIdx >= 0 ? values[codigoIdx] : '';
      const nome = nomeIdx >= 0 ? values[nomeIdx] : '';

      if (codigo && nome) {
        pdvs.push({
          codigo: codigo.replace(/\./g, '').replace(/,/g, ''),
          nome,
          bairro: bairroIdx >= 0 ? values[bairroIdx] : undefined,
          cnpj: cnpjIdx >= 0 ? values[cnpjIdx] : undefined,
          endereco: enderecoIdx >= 0 ? values[enderecoIdx] : undefined,
          cidade: cidadeIdx >= 0 ? values[cidadeIdx] : undefined,
        });
      }
    }

    return pdvs;
  };

  const parseXLSX = (data: ArrayBuffer): PdvImport[] => {
    const workbook = XLSX.read(data, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

    const pdvs: PdvImport[] = [];

    for (const row of jsonData) {
      const codigo = String(row['Codigo Cliente'] || row['codigo'] || row['Codigo'] || '').replace(/\./g, '').replace(/,/g, '');
      const nome = String(row['Nome Fantasia'] || row['nome'] || row['Nome'] || '');
      const bairro = String(row['Bairro'] || row['bairro'] || '');
      const cnpj = String(row['CNPJ'] || row['cnpj'] || '');
      const endereco = String(row['Endereço'] || row['Endereco'] || row['endereco'] || '');
      const cidade = String(row['Cidade'] || row['cidade'] || '');

      if (codigo && nome) {
        pdvs.push({
          codigo,
          nome,
          bairro: bairro || undefined,
          cnpj: cnpj || undefined,
          endereco: endereco || undefined,
          cidade: cidade || undefined,
        });
      }
    }

    return pdvs;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setArquivo(file);
    setImportResult(null);

    try {
      let pdvs: PdvImport[] = [];

      if (file.name.endsWith('.csv')) {
        const content = await file.text();
        pdvs = parseCSV(content);
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        const data = await file.arrayBuffer();
        pdvs = parseXLSX(data);
      } else {
        toast.error('Formato inválido. Use CSV ou XLSX');
        return;
      }

      if (pdvs.length === 0) {
        toast.error('Nenhum PDV encontrado no arquivo');
        return;
      }

      setTotalPdvs(pdvs.length);
      setPreview(pdvs.slice(0, 5));
      toast.success(`${pdvs.length} clientes encontrados`);
    } catch (error) {
      console.error('Erro ao processar arquivo:', error);
      toast.error('Erro ao processar arquivo');
    }
  };

  const handleImport = async () => {
    if (!arquivo || !selectedUnidade) {
      toast.error('Selecione a unidade e o arquivo');
      return;
    }

    try {
      let pdvs: PdvImport[] = [];

      if (arquivo.name.endsWith('.csv')) {
        const content = await arquivo.text();
        pdvs = parseCSV(content);
      } else {
        const data = await arquivo.arrayBuffer();
        pdvs = parseXLSX(data);
      }

      const result = await importPdvs(pdvs, selectedUnidade);
      setImportResult(result);

      if (result.success) {
        toast.success(`${result.total} clientes importados com sucesso!`);
        onSuccess?.();
        setTimeout(() => {
          resetForm();
          setOpen(false);
        }, 1500);
      } else {
        toast.error(result.error || 'Erro na importação');
      }
    } catch (error) {
      console.error('Erro ao importar:', error);
      toast.error('Erro inesperado na importação');
    }
  };

  const resetForm = () => {
    setArquivo(null);
    setPreview([]);
    setTotalPdvs(0);
    setImportResult(null);
    setSelectedUnidade('');
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) resetForm();
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload size={16} className="mr-2" />
          Importar Planilha
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Importar Clientes (PDVs)
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Unidade *</Label>
            <Select value={selectedUnidade} onValueChange={setSelectedUnidade}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a unidade" />
              </SelectTrigger>
              <SelectContent>
                {UNIDADES.map(u => (
                  <SelectItem key={u.codigo} value={u.codigo}>
                    {u.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Arquivo (CSV ou Excel)</Label>
            <input
              ref={inputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
              id="pdv-import-input"
            />
            <Button
              variant="outline"
              onClick={() => inputRef.current?.click()}
              className="w-full justify-start"
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              {arquivo ? arquivo.name : 'Selecionar arquivo...'}
            </Button>
            <p className="text-xs text-muted-foreground">
              Colunas: Codigo Cliente, Nome Fantasia, Bairro, CNPJ, Endereço, Cidade
            </p>
          </div>

          {preview.length > 0 && (
            <div className="border rounded-lg p-3 bg-muted/50">
              <p className="text-sm font-medium mb-2">
                Preview ({totalPdvs} registros):
              </p>
              <div className="space-y-1 text-xs">
                {preview.map((pdv, i) => (
                  <div key={i} className="flex gap-2">
                    <span className="font-mono bg-background px-1 rounded">{pdv.codigo}</span>
                    <span className="truncate flex-1">{pdv.nome}</span>
                  </div>
                ))}
                {totalPdvs > 5 && (
                  <div className="text-muted-foreground pt-1">
                    ... e mais {totalPdvs - 5} registros
                  </div>
                )}
              </div>
            </div>
          )}

          {importResult && (
            <div className={`flex items-center gap-2 p-3 rounded-lg ${
              importResult.success 
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
            }`}>
              {importResult.success ? (
                <>
                  <CheckCircle className="h-5 w-5" />
                  <span>{importResult.total} clientes importados!</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5" />
                  <span>Erro: {importResult.error}</span>
                </>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleImport}
              disabled={!arquivo || !selectedUnidade || isImporting}
              className="flex-1"
            >
              {isImporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Importar
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
