import { Search, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { STATUS_COLABORADOR } from '@/lib/colaborador';

interface FiltrosProps {
  busca: string;
  onBuscaChange: (v: string) => void;
  status: string;
  onStatusChange: (v: string) => void;
  aoExportarExcel: () => void;
  totalFiltrados: number;
}

export function FiltrosColaboradores({
  busca,
  onBuscaChange,
  status,
  onStatusChange,
  aoExportarExcel,
  totalFiltrados,
}: FiltrosProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
      {/* Pesquisa Instantânea */}
      <div className="relative w-full sm:w-96">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={busca}
          onChange={(e) => onBuscaChange(e.target.value)}
          placeholder="Pesquisar por nome, CPF ou registro..."
          className="w-full h-10 pl-9 pr-4 rounded-lg border border-slate-300 bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
        />
      </div>

      {/* Ações e Filtros */}
      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
        <select
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
          className="h-10 px-3 rounded-lg border border-slate-300 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
        >
          <option value="TODOS">Todos os Estados</option>
          {STATUS_COLABORADOR.map((st) => (
            <option key={st} value={st}>
              {st}
            </option>
          ))}
        </select>

        <Button
          type="button"
          variante="secondary"
          onClick={aoExportarExcel}
          disabled={totalFiltrados === 0}
          className="h-10 px-3.5 text-emerald-800 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 flex items-center gap-2 text-sm font-medium cursor-pointer"
          title="Exportar registros filtrados para Excel"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
          <span>Exportar ({totalFiltrados})</span>
        </Button>
      </div>
    </div>
  );
}