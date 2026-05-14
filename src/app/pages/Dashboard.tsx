import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Building2,
  Users,
  CheckCircle,
  AlertTriangle,
  Wrench,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';
import { supabase, Kitnet, Inquilino, Pagamento } from '../../utils/supabase';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const fmtMoeda = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const STATUS_BADGE: Record<string, string> = {
  pago: 'bg-green-100 text-green-700',
  pendente: 'bg-yellow-100 text-yellow-700',
  atrasado: 'bg-red-100 text-red-700',
};

const STATUS_LABEL: Record<string, string> = {
  pago: 'Pago',
  pendente: 'Pendente',
  atrasado: 'Atrasado',
};

export default function Dashboard() {
  const navigate = useNavigate();
  const now = new Date();
  const mes = now.getMonth() + 1;
  const ano = now.getFullYear();

  const [kitnets, setKitnets] = useState<Kitnet[]>([]);
  const [inquilinos, setInquilinos] = useState<Inquilino[]>([]);
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [k, i, p] = await Promise.all([
      supabase.from('kitnets').select('*'),
      supabase.from('inquilinos').select('*').eq('status', 'ativo'),
      supabase.from('pagamentos').select('*').eq('mes', mes).eq('ano', ano),
    ]);
    setKitnets((k.data as Kitnet[]) || []);
    setInquilinos((i.data as Inquilino[]) || []);
    setPagamentos((p.data as Pagamento[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const totalKitnets = kitnets.length;
  const ocupadas = kitnets.filter((k) => k.status === 'ocupada').length;
  const disponiveis = kitnets.filter((k) => k.status === 'disponivel').length;
  const manutencao = kitnets.filter((k) => k.status === 'manutencao').length;

  const receitaTotal = pagamentos.reduce((s, p) => s + Number(p.valor), 0);
  const receitaPotencial = kitnets
    .filter((k) => k.status === 'ocupada')
    .reduce((s, k) => s + Number(k.valor), 0);
  const receitaRecebida = pagamentos
    .filter((p) => p.status === 'pago')
    .reduce((s, p) => s + Number(p.valor), 0);

  const pagos = pagamentos.filter((p) => p.status === 'pago').length;
  const pendentes = pagamentos.filter((p) => p.status === 'pendente').length;
  const atrasados = pagamentos.filter((p) => p.status === 'atrasado').length;

  const pct = receitaPotencial > 0 ? Math.round((receitaRecebida / receitaPotencial) * 100) : 0;

  // Join payments with inquilinos and kitnets for table
  const pagamentosComDetalhes = pagamentos.map((p) => {
    const inq = inquilinos.find((i) => i.id === p.inquilino_id);
    const kit = kitnets.find((k) => k.id === p.kitnet_id);
    return { ...p, inquilino_nome: inq?.nome || '—', kitnet_numero: kit ? `Kitnet ${kit.numero}` : '—' };
  });

  const dataStr = format(now, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR });
  const mesStr = format(now, "MMM/yyyy", { locale: ptBR }).replace(/^\w/, (c) => c.toUpperCase());

  const statCards = [
    { label: 'Total Kitnets', value: totalKitnets, icon: Building2, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Ocupadas', value: ocupadas, icon: Users, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Disponíveis', value: disponiveis, icon: CheckCircle, color: 'text-indigo-500', bg: 'bg-indigo-50' },
    { label: 'Manutenção', value: manutencao, icon: Wrench, color: 'text-orange-500', bg: 'bg-orange-50' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-400 text-sm">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1 capitalize">{dataStr}</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
              <Icon size={22} className={color} />
            </div>
            <div>
              <div className="text-gray-500 text-xs">{label}</div>
              <div className="text-2xl font-bold text-gray-800">{value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Middle Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Receita */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-sm">Receita {mesStr}</span>
            <TrendingUp size={16} className="text-green-500" />
          </div>
          <div className="text-3xl font-bold text-gray-800 mb-1">{fmtMoeda(receitaRecebida)}</div>
          <div className="text-gray-400 text-xs mb-3">de {fmtMoeda(receitaPotencial)} potencial</div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div
              className="h-2 rounded-full bg-green-500 transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="text-gray-400 text-xs mt-1">{pct}% recebido</div>
        </div>

        {/* Pagamentos */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="text-gray-500 text-sm mb-4">Pagamentos — {mesStr}</div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle size={15} className="text-green-500" />
                <span className="text-gray-600 text-sm">Pagos</span>
              </div>
              <span className="text-gray-800 font-medium">{pagos}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle size={15} className="text-yellow-500" />
                <span className="text-gray-600 text-sm">Pendentes</span>
              </div>
              <span className="text-gray-800 font-medium">{pendentes}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle size={15} className="text-red-500" />
                <span className="text-gray-600 text-sm">Atrasados</span>
              </div>
              <span className="text-gray-800 font-medium">{atrasados}</span>
            </div>
          </div>
          <button
            onClick={() => navigate('/pagamentos')}
            className="mt-4 text-green-600 text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all"
          >
            Ver pagamentos <ArrowRight size={14} />
          </button>
        </div>

        {/* Inquilinos */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="text-gray-500 text-sm mb-2">Inquilinos ativos</div>
          <div className="text-3xl font-bold text-gray-800 mb-3">{inquilinos.length}</div>
          <div className="flex flex-col gap-2 max-h-28 overflow-y-auto">
            {inquilinos.slice(0, 5).map((inq) => {
              const kit = kitnets.find((k) => k.id === inq.kitnet_id);
              return (
                <div key={inq.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-bold">
                      {inq.nome.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-gray-700 text-sm">{inq.nome.split(' ')[0]}</span>
                  </div>
                  <span className="text-gray-400 text-xs">{kit?.numero || '—'}</span>
                </div>
              );
            })}
          </div>
          <button
            onClick={() => navigate('/inquilinos')}
            className="mt-3 text-green-600 text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all"
          >
            Ver inquilinos <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* Recent Payments Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Pagamentos de {mesStr}</h2>
          <button
            onClick={() => navigate('/pagamentos')}
            className="text-green-600 text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all"
          >
            Ver todos <ArrowRight size={14} />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-50">
                <th className="text-left px-6 py-3 text-xs text-gray-400 uppercase tracking-wider">Inquilino</th>
                <th className="text-left px-6 py-3 text-xs text-gray-400 uppercase tracking-wider">Kitnet</th>
                <th className="text-left px-6 py-3 text-xs text-gray-400 uppercase tracking-wider">Valor</th>
                <th className="text-left px-6 py-3 text-xs text-gray-400 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {pagamentosComDetalhes.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-400 text-sm">
                    Nenhum pagamento registrado este mês
                  </td>
                </tr>
              ) : (
                pagamentosComDetalhes.map((p) => (
                  <tr key={p.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                    <td className="px-6 py-4 text-gray-800 text-sm">{p.inquilino_nome}</td>
                    <td className="px-6 py-4 text-gray-500 text-sm">{p.kitnet_numero}</td>
                    <td className="px-6 py-4 text-gray-800 text-sm font-medium">{fmtMoeda(Number(p.valor))}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_BADGE[p.status]}`}>
                        {STATUS_LABEL[p.status]}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
