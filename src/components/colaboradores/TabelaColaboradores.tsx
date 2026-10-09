import { Colaborador } from '@/types/colaborador';
import { StatusBadge } from './StatusBadge';

interface TabelaProps {
  colaboradores: Colaborador[];
  aoSelecionar: (colaborador: Colaborador) => void;
}

export function TabelaColaboradores({ colaboradores, aoSelecionar }: TabelaProps) {
  if (colaboradores.length === 0) {
    return (
      <div className="p-12 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
        Nenhum colaborador encontrado para os filtros selecionados.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
      <table className="w-full text-left border-collapse text-sm">
        <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase text-slate-600">
          <tr>
            <th className="px-4 py-3">Reg.</th>
            <th className="px-4 py-3">Nome Completo</th>
            <th className="px-4 py-3">Função</th>
            <th className="px-4 py-3">Unidade</th>
            <th className="px-4 py-3 text-center">Estado</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {colaboradores.map((colab) => (
            <tr
              key={colab.id}
              onClick={() => aoSelecionar(colab)}
              className="hover:bg-emerald-50/40 cursor-pointer transition-colors"
            >
              <td className="px-4 py-3 text-slate-500 font-mono text-xs">
                {colab.registro || '-'}
              </td>
              <td className="px-4 py-3 font-medium text-slate-900">
                {colab.nome}
                <div className="text-xs text-slate-400 font-normal">{colab.cpf}</div>
              </td>
              <td className="px-4 py-3 text-slate-600">{colab.funcao || 'Não informada'}</td>
              <td className="px-4 py-3 text-slate-600">{colab.matriz_filial || '-'}</td>
              <td className="px-4 py-3 text-center">
                <StatusBadge status={colab.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}