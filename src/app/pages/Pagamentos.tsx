import React, { useEffect, useState, useCallback } from 'react';
import {
  ChevronLeft, ChevronRight, Plus, Edit2, Trash2, MessageCircle,
  CheckCircle, AlertTriangle, Clock, Copy, RefreshCw
} from 'lucide-react';
import { supabase, Pagamento, Inquilino, Kitnet, Proprietario } from '../../utils/supabase';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const fmtMoeda = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function fmtDate(d: string | null) {
  if (!d) return '—';
  try { return format(new Date(d + 'T12:00:00'), 'dd/MM/yyyy'); } catch { return d; }
}

const STATUS_CONFIG = {
  pago: { label: 'Pago', badge: 'bg-green-100 text-green-700', icon: CheckCircle, iconColor: 'text-green-500' },
  pendente: { label: 'Pendente', badge: 'bg-yellow-100 text-yellow-700', icon: Clock, iconColor: 'text-yellow-500' },
  atrasado: { label: 'Atrasado', badge: 'bg-red-100 text-red-700', icon: AlertTriangle, iconColor: 'text-red-500' },
};

type PagamentoFilter = 'todos' | 'pago' | 'pendente' | 'atrasado';

const EMPTY_FORM = {
  inquilino_id: '',
  kitnet_id: '',
  valor: '',
  status: 'pendente' as Pagamento['status'],
  data_pagamento: '',
};

function initials(nome: string) {
  return nome.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
}

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export default function Pagamentos() {
  const now = new Date();
  const [mes, setMes] = useState(now.getMonth() + 1);
  const [ano, setAno] = useState(now.getFullYear());

  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [inquilinos, setInquilinos] = useState<Inquilino[]>([]);
  const [kitnets, setKitnets] = useState<Kitnet[]>([]);
  const [proprietario, setProprietario] = useState<Proprietario | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<PagamentoFilter>('todos');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Pagamento | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [editingValor, setEditingValor] = useState<string | null>(null);
  const [editValorTmp, setEditValorTmp] = useState('');
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);

  const load = useCallback(async () => {
    const [p, i, k, pr] = await Promise.all([
      supabase.from('pagamentos').select('*').eq('mes', mes).eq('ano', ano),
      supabase.from('inquilinos').select('*').eq('status', 'ativo').order('nome'),
      supabase.from('kitnets').select('*').order('numero'),
      supabase.from('proprietarios').select('*').limit(1).single(),
    ]);
    setPagamentos((p.data as Pagamento[]) || []);
    setInquilinos((i.data as Inquilino[]) || []);
    setKitnets((k.data as Kitnet[]) || []);
    if (pr.data) setProprietario(pr.data as Proprietario);
    setLoading(false);
  }, [mes, ano]);

  useEffect(() => { setLoading(true); load(); }, [load]);

  const navMes = (dir: -1 | 1) => {
    let m = mes + dir;
    let a = ano;
    if (m < 1) { m = 12; a -= 1; }
    if (m > 12) { m = 1; a += 1; }
    setMes(m);
    setAno(a);
  };

  const gerarCobranças = async () => {
    setGenerating(true);
    for (const inq of inquilinos) {
      if (!inq.kitnet_id) continue;
      const kit = kitnets.find((k) => k.id === inq.kitnet_id);
      if (!kit) continue;
      // Check if already exists
      const { data: existing } = await supabase
        .from('pagamentos')
        .select('id')
        .eq('inquilino_id', inq.id)
        .eq('mes', mes)
        .eq('ano', ano)
        .single();
      if (!existing) {
        await supabase.from('pagamentos').insert({
          inquilino_id: inq.id,
          kitnet_id: inq.kitnet_id,
          mes,
          ano,
          valor: kit.valor,
          status: 'pendente',
          data_pagamento: null,
        });
      }
    }
    setGenerating(false);
    load();
  };

  const marcarPago = async (id: string) => {
    await supabase.from('pagamentos').update({
      status: 'pago',
      data_pagamento: new Date().toISOString().split('T')[0],
    }).eq('id', id);
    load();
  };

  const salvarValor = async (id: string) => {
    const val = parseFloat(editValorTmp);
    if (isNaN(val)) { setEditingValor(null); return; }
    await supabase.from('pagamentos').update({ valor: val }).eq('id', id);
    setEditingValor(null);
    load();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('pagamentos').delete().eq('id', id);
    setConfirmDelete(null);
    load();
  };

  const openNew = () => {
    setEditItem(null);
    setForm(EMPTY_FORM);
    setError('');
    setShowModal(true);
  };

  const openEdit = (p: Pagamento) => {
    setEditItem(p);
    setForm({
      inquilino_id: p.inquilino_id,
      kitnet_id: p.kitnet_id,
      valor: String(p.valor),
      status: p.status,
      data_pagamento: p.data_pagamento || '',
    });
    setError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.inquilino_id || !form.valor) { setError('Inquilino e valor são obrigatórios.'); return; }
    setSaving(true);
    setError('');

    const inq = inquilinos.find((i) => i.id === form.inquilino_id);
    const payload = {
      inquilino_id: form.inquilino_id,
      kitnet_id: form.kitnet_id || inq?.kitnet_id || null,
      mes,
      ano,
      valor: parseFloat(form.valor),
      status: form.status,
      data_pagamento: form.data_pagamento || null,
    };

    if (editItem) {
      const { error: err } = await supabase.from('pagamentos').update(payload).eq('id', editItem.id);
      if (err) { setError(err.message); setSaving(false); return; }
    } else {
      const { error: err } = await supabase.from('pagamentos').insert(payload);
      if (err) { setError(err.message); setSaving(false); return; }
    }

    setSaving(false);
    setShowModal(false);
    load();
  };

  const sendPixWhatsApp = (p: Pagamento) => {
    const inq = inquilinos.find((i) => i.id === p.inquilino_id);
    const kit = kitnets.find((k) => k.id === p.kitnet_id);
    if (!inq?.telefone) return;
    const num = inq.telefone.replace(/\D/g, '');
    const pix = proprietario?.pix_chave || '';
    const pixTipo = proprietario?.pix_tipo || '';
    const msg = encodeURIComponent(
      `Olá ${inq.nome}! 👋\n\n` +
      `Lembrando sobre o aluguel de ${MESES[p.mes - 1]}/${p.ano} da ${kit ? 'Kitnet ' + kit.numero : 'sua kitnet'}.\n\n` +
      `💰 Valor: ${fmtMoeda(Number(p.valor))}\n` +
      `🔑 Chave PIX (${pixTipo}): ${pix}\n\n` +
      `Qualquer dúvida, estou à disposição! 😊`
    );
    window.open(`https://wa.me/55${num}?text=${msg}`, '_blank');
  };

  const copyPix = () => {
    if (proprietario?.pix_chave) {
      navigator.clipboard.writeText(proprietario.pix_chave);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const filtered = pagamentos.filter((p) => filter === 'todos' || p.status === filter);

  const totalEsperado = pagamentos.reduce((s, p) => s + Number(p.valor), 0);
  const recebido = pagamentos.filter((p) => p.status === 'pago').reduce((s, p) => s + Number(p.valor), 0);
  const pendente = pagamentos.filter((p) => p.status === 'pendente').reduce((s, p) => s + Number(p.valor), 0);
  const atrasado = pagamentos.filter((p) => p.status === 'atrasado').reduce((s, p) => s + Number(p.valor), 0);

  const mesStr = `${MESES[mes - 1]} ${ano}`;

  if (loading) {
    return <div className="flex items-center justify-center h-full"><div className="text-gray-400 text-sm">Carregando...</div></div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Pagamentos</h1>
          <p className="text-gray-500 text-sm mt-0.5">Controle de recebimentos mensais</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={gerarCobranças}
            disabled={generating}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-gray-600 text-sm font-medium border border-gray-200 hover:bg-gray-50 transition-all disabled:opacity-60"
          >
            <RefreshCw size={15} className={generating ? 'animate-spin' : ''} />
            Gerar cobranças
          </button>
          <button
            onClick={openNew}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-medium hover:opacity-90 transition-all"
            style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}
          >
            <Plus size={16} />
            Novo Pagamento
          </button>
        </div>
      </div>

      {/* Month nav */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-5 flex items-center justify-between">
        <button onClick={() => navMes(-1)} className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
          <ChevronLeft size={18} className="text-gray-500" />
        </button>
        <h2 className="font-bold text-gray-800 text-lg">{mesStr}</h2>
        <button onClick={() => navMes(1)} className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
          <ChevronRight size={18} className="text-gray-500" />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        {[
          { label: 'Total esperado', value: fmtMoeda(totalEsperado), sub: `${pagamentos.length} cobrança(s)`, color: 'text-gray-800', bg: 'bg-white', border: 'border-gray-100' },
          { label: 'Recebido', value: fmtMoeda(recebido), sub: `${pagamentos.filter(p => p.status === 'pago').length} pago(s)`, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100' },
          { label: 'Pendente', value: fmtMoeda(pendente), sub: `${pagamentos.filter(p => p.status === 'pendente').length} pendente(s)`, color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-100' },
          { label: 'Atrasado', value: fmtMoeda(atrasado), sub: `${pagamentos.filter(p => p.status === 'atrasado').length} atrasado(s)`, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100' },
        ].map(({ label, value, sub, color, bg, border }) => (
          <div key={label} className={`${bg} rounded-2xl border ${border} p-4 shadow-sm`}>
            <div className="text-gray-500 text-xs mb-1">{label}</div>
            <div className={`font-bold text-lg ${color}`}>{value}</div>
            <div className="text-gray-400 text-xs">{sub}</div>
          </div>
        ))}
      </div>

      {/* PIX bar */}
      {proprietario?.pix_chave && (
        <div
          className="rounded-2xl p-4 mb-5 flex items-center justify-between"
          style={{ background: '#0f1c2e' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-bold">PIX</span>
            </div>
            <div>
              <div className="text-white/60 text-xs">Chave PIX para recebimento</div>
              <div className="text-white font-medium text-sm">{proprietario.pix_chave}</div>
              <div className="text-white/40 text-xs capitalize">{proprietario.pix_tipo}</div>
            </div>
          </div>
          <button
            onClick={copyPix}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm transition-colors"
          >
            <Copy size={14} />
            {copied ? 'Copiado!' : 'Copiar'}
          </button>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4">
        {([
          { key: 'todos', label: 'Todos' },
          { key: 'pago', label: '✓ Pagos' },
          { key: 'pendente', label: '⏰ Pendentes' },
          { key: 'atrasado', label: '⚠ Atrasados' },
        ] as { key: PagamentoFilter; label: string }[]).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              filter === key
                ? 'bg-gray-800 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-6 py-3 text-xs text-gray-400 uppercase tracking-wider">Inquilino</th>
                <th className="text-left px-6 py-3 text-xs text-gray-400 uppercase tracking-wider">Kitnet</th>
                <th className="text-left px-6 py-3 text-xs text-gray-400 uppercase tracking-wider">Valor</th>
                <th className="text-left px-6 py-3 text-xs text-gray-400 uppercase tracking-wider">Dt. Pagamento</th>
                <th className="text-left px-6 py-3 text-xs text-gray-400 uppercase tracking-wider">Status</th>
                <th className="text-right px-6 py-3 text-xs text-gray-400 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400 text-sm">
                    Nenhum pagamento encontrado
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const inq = inquilinos.find((i) => i.id === p.inquilino_id);
                  const kit = kitnets.find((k) => k.id === p.kitnet_id);
                  const cfg = STATUS_CONFIG[p.status];
                  const nome = inq?.nome || '—';
                  return (
                    <tr key={p.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600 flex-shrink-0">
                            {nome !== '—' ? initials(nome) : '?'}
                          </div>
                          <span className="text-gray-800 text-sm font-medium">{nome}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-sm">
                        {kit ? `Kitnet ${kit.numero}` : '—'}
                      </td>
                      <td className="px-6 py-4">
                        {editingValor === p.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              autoFocus
                              type="number"
                              value={editValorTmp}
                              onChange={(e) => setEditValorTmp(e.target.value)}
                              onBlur={() => salvarValor(p.id)}
                              onKeyDown={(e) => { if (e.key === 'Enter') salvarValor(p.id); if (e.key === 'Escape') setEditingValor(null); }}
                              className="w-28 px-2 py-1 border border-green-400 rounded-lg text-sm outline-none"
                            />
                          </div>
                        ) : (
                          <button
                            onClick={() => { setEditingValor(p.id); setEditValorTmp(String(p.valor)); }}
                            className="text-gray-800 text-sm font-medium hover:text-green-600 transition-colors"
                            title="Clique para editar"
                          >
                            {fmtMoeda(Number(p.valor))}
                          </button>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-sm">{fmtDate(p.data_pagamento)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${cfg.badge}`}>
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1.5">
                          {p.status !== 'pago' && (
                            <>
                              <button
                                onClick={() => marcarPago(p.id)}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-green-50 hover:bg-green-100 text-green-600 text-xs font-medium transition-colors"
                                title="Marcar como pago"
                              >
                                <CheckCircle size={12} /> Pago
                              </button>
                              <button
                                onClick={() => sendPixWhatsApp(p)}
                                className="w-7 h-7 rounded-lg bg-green-50 hover:bg-green-100 flex items-center justify-center transition-colors"
                                title="Enviar lembrete PIX no WhatsApp"
                              >
                                <MessageCircle size={13} className="text-green-600" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => openEdit(p)}
                            className="w-7 h-7 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors"
                          >
                            <Edit2 size={13} className="text-gray-500" />
                          </button>
                          <button
                            onClick={() => setConfirmDelete(p.id)}
                            className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors"
                          >
                            <Trash2 size={13} className="text-red-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-gray-800 font-bold text-lg mb-5">
              {editItem ? 'Editar Pagamento' : 'Novo Pagamento'}
            </h2>
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1.5">Inquilino *</label>
                <select
                  value={form.inquilino_id}
                  onChange={(e) => {
                    const inq = inquilinos.find((i) => i.id === e.target.value);
                    setForm({ ...form, inquilino_id: e.target.value, kitnet_id: inq?.kitnet_id || '', valor: inq?.kitnet_id ? String(kitnets.find((k) => k.id === inq.kitnet_id)?.valor || '') : form.valor });
                  }}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 bg-white"
                >
                  <option value="">Selecionar inquilino</option>
                  {inquilinos.map((i) => (
                    <option key={i.id} value={i.id}>{i.nome}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1.5">Valor (R$) *</label>
                <input type="number" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })}
                  placeholder="800"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1.5">Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Pagamento['status'] })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 bg-white">
                  <option value="pendente">Pendente</option>
                  <option value="pago">Pago</option>
                  <option value="atrasado">Atrasado</option>
                </select>
              </div>
              {form.status === 'pago' && (
                <div>
                  <label className="block text-sm text-gray-600 mb-1.5">Data do pagamento</label>
                  <input type="date" value={form.data_pagamento} onChange={(e) => setForm({ ...form, data_pagamento: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100" />
                </div>
              )}
              {error && <p className="text-red-500 text-sm">{error}</p>}
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50">
                Cancelar
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 py-2.5 text-white rounded-xl text-sm font-medium disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}>
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={22} className="text-red-500" />
            </div>
            <h3 className="font-bold text-gray-800 mb-2">Excluir pagamento?</h3>
            <p className="text-gray-500 text-sm mb-5">Esta ação não pode ser desfeita.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50">
                Cancelar
              </button>
              <button onClick={() => handleDelete(confirmDelete)}
                className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600">
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
