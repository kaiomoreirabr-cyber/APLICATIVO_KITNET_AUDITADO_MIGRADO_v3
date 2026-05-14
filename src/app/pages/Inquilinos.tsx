import React, { useEffect, useState } from 'react';
import { Plus, Search, Edit2, Trash2, MessageCircle, Phone, Mail, Calendar, Home } from 'lucide-react';
import { supabase, Inquilino, Kitnet } from '../../utils/supabase';
import { format } from 'date-fns';

const fmtMoeda = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

type StatusFilter = 'todos' | 'ativo' | 'inativo';

const EMPTY_FORM = {
  nome: '',
  cpf: '',
  telefone: '',
  email: '',
  kitnet_id: '',
  data_entrada: '',
  data_saida: '',
  status: 'ativo' as Inquilino['status'],
  observacoes: '',
};

function initials(nome: string) {
  return nome.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
}

function fmtDate(d: string | null) {
  if (!d) return '—';
  try { return format(new Date(d + 'T12:00:00'), 'dd/MM/yyyy'); } catch { return d; }
}

export default function Inquilinos() {
  const [inquilinos, setInquilinos] = useState<Inquilino[]>([]);
  const [kitnets, setKitnets] = useState<Kitnet[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<StatusFilter>('todos');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Inquilino | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [error, setError] = useState('');

  const load = async () => {
    const [i, k] = await Promise.all([
      supabase.from('inquilinos').select('*').order('nome'),
      supabase.from('kitnets').select('*').order('numero'),
    ]);
    setInquilinos((i.data as Inquilino[]) || []);
    setKitnets((k.data as Kitnet[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditItem(null);
    setForm(EMPTY_FORM);
    setError('');
    setShowModal(true);
  };

  const openEdit = (inq: Inquilino) => {
    setEditItem(inq);
    setForm({
      nome: inq.nome,
      cpf: inq.cpf || '',
      telefone: inq.telefone || '',
      email: inq.email || '',
      kitnet_id: inq.kitnet_id || '',
      data_entrada: inq.data_entrada || '',
      data_saida: inq.data_saida || '',
      status: inq.status,
      observacoes: inq.observacoes || '',
    });
    setError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.nome) { setError('Nome é obrigatório.'); return; }
    setSaving(true);
    setError('');

    const payload = {
      nome: form.nome.trim(),
      cpf: form.cpf.trim(),
      telefone: form.telefone.trim(),
      email: form.email.trim(),
      kitnet_id: form.kitnet_id || null,
      data_entrada: form.data_entrada || null,
      data_saida: form.data_saida || null,
      status: form.status,
      observacoes: form.observacoes.trim(),
    };

    if (editItem) {
      const { error: err } = await supabase.from('inquilinos').update(payload).eq('id', editItem.id);
      if (err) { setError(err.message); setSaving(false); return; }

      // Update kitnet status
      if (payload.kitnet_id) {
        await supabase.from('kitnets').update({ status: payload.status === 'ativo' ? 'ocupada' : 'disponivel', inquilino_id: payload.status === 'ativo' ? editItem.id : null }).eq('id', payload.kitnet_id);
      }
    } else {
      const { data: newInq, error: err } = await supabase.from('inquilinos').insert(payload).select().single();
      if (err) { setError(err.message); setSaving(false); return; }

      // Update kitnet
      if (payload.kitnet_id && newInq) {
        await supabase.from('kitnets').update({ status: 'ocupada', inquilino_id: newInq.id }).eq('id', payload.kitnet_id);
      }
    }

    setSaving(false);
    setShowModal(false);
    load();
  };

  const handleDelete = async (id: string) => {
    const inq = inquilinos.find((i) => i.id === id);
    await supabase.from('inquilinos').delete().eq('id', id);
    if (inq?.kitnet_id) {
      await supabase.from('kitnets').update({ status: 'disponivel', inquilino_id: null }).eq('id', inq.kitnet_id);
    }
    setConfirmDelete(null);
    load();
  };

  const openWhatsApp = (tel: string, nome: string) => {
    const num = tel.replace(/\D/g, '');
    const msg = encodeURIComponent(`Olá ${nome}, tudo bem?`);
    window.open(`https://wa.me/55${num}?text=${msg}`, '_blank');
  };

  const filtered = inquilinos.filter((i) => {
    const matchSearch =
      i.nome.toLowerCase().includes(search.toLowerCase()) ||
      (i.cpf || '').includes(search) ||
      (i.telefone || '').includes(search);
    const matchFilter = filter === 'todos' || i.status === filter;
    return matchSearch && matchFilter;
  });

  const ativos = inquilinos.filter((i) => i.status === 'ativo').length;

  if (loading) {
    return <div className="flex items-center justify-center h-full"><div className="text-gray-400 text-sm">Carregando...</div></div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Inquilinos</h1>
          <p className="text-gray-500 text-sm mt-0.5">{ativos} ativos</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-medium hover:opacity-90 transition-all"
          style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}
        >
          <Plus size={16} />
          Novo Inquilino
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, CPF, telefone..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100"
          />
        </div>
        <div className="flex gap-1.5 bg-gray-100 p-1 rounded-xl">
          {(['todos', 'ativo', 'inativo'] as StatusFilter[]).map((key) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all capitalize ${
                filter === key ? 'bg-gray-800 text-white' : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              {key === 'todos' ? 'Todos' : key === 'ativo' ? 'Ativos' : 'Inativos'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-6 py-3 text-xs text-gray-400 uppercase tracking-wider">Nome</th>
                <th className="text-left px-6 py-3 text-xs text-gray-400 uppercase tracking-wider">Contato</th>
                <th className="text-left px-6 py-3 text-xs text-gray-400 uppercase tracking-wider">Kitnet</th>
                <th className="text-left px-6 py-3 text-xs text-gray-400 uppercase tracking-wider">Entrada / Saída</th>
                <th className="text-left px-6 py-3 text-xs text-gray-400 uppercase tracking-wider">Status</th>
                <th className="text-right px-6 py-3 text-xs text-gray-400 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400 text-sm">
                    Nenhum inquilino encontrado
                  </td>
                </tr>
              ) : (
                filtered.map((inq) => {
                  const kit = kitnets.find((k) => k.id === inq.kitnet_id);
                  return (
                    <tr key={inq.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 bg-green-100 text-green-700">
                            {initials(inq.nome)}
                          </div>
                          <div>
                            <div className="text-gray-800 font-medium text-sm">{inq.nome}</div>
                            <div className="text-gray-400 text-xs">{inq.cpf || '—'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5 text-gray-600 text-sm">
                            <Phone size={12} className="text-gray-400" />
                            {inq.telefone || '—'}
                          </div>
                          <div className="flex items-center gap-1.5 text-gray-500 text-xs">
                            <Mail size={11} className="text-gray-400" />
                            {inq.email || '—'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {kit ? (
                          <div className="flex items-center gap-1.5">
                            <Home size={13} className="text-gray-400" />
                            <span className="text-gray-700 text-sm">Kitnet {kit.numero}</span>
                            <span className="text-green-600 text-xs font-medium">{fmtMoeda(Number(kit.valor))}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5 text-gray-600 text-xs">
                            <Calendar size={11} className="text-gray-400" />
                            Entrada: {fmtDate(inq.data_entrada)}
                          </div>
                          {inq.data_saida && (
                            <div className="flex items-center gap-1.5 text-gray-400 text-xs">
                              <Calendar size={11} className="text-gray-300" />
                              Saída: {fmtDate(inq.data_saida)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                            inq.status === 'ativo'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {inq.status === 'ativo' ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {inq.telefone && (
                            <button
                              onClick={() => openWhatsApp(inq.telefone, inq.nome)}
                              title="WhatsApp"
                              className="w-8 h-8 rounded-lg bg-green-50 hover:bg-green-100 flex items-center justify-center transition-colors"
                            >
                              <MessageCircle size={15} className="text-green-600" />
                            </button>
                          )}
                          <button
                            onClick={() => openEdit(inq)}
                            className="w-8 h-8 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors"
                          >
                            <Edit2 size={14} className="text-gray-500" />
                          </button>
                          <button
                            onClick={() => setConfirmDelete(inq.id)}
                            className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors"
                          >
                            <Trash2 size={14} className="text-red-500" />
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
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-gray-800 font-bold text-lg mb-5">
              {editItem ? 'Editar Inquilino' : 'Novo Inquilino'}
            </h2>
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1.5">Nome completo *</label>
                <input type="text" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  placeholder="João da Silva" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1.5">CPF</label>
                  <input type="text" value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })}
                    placeholder="123.456.789-00" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1.5">Telefone</label>
                  <input type="text" value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                    placeholder="11999999999" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1.5">E-mail</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="joao@email.com" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1.5">Kitnet</label>
                <select value={form.kitnet_id} onChange={(e) => setForm({ ...form, kitnet_id: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 bg-white">
                  <option value="">Selecionar kitnet</option>
                  {kitnets.filter((k) => k.status !== 'ocupada' || k.inquilino_id === editItem?.id).map((k) => (
                    <option key={k.id} value={k.id}>Kitnet {k.numero} — {fmtMoeda(Number(k.valor))}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1.5">Data de entrada</label>
                  <input type="date" value={form.data_entrada} onChange={(e) => setForm({ ...form, data_entrada: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1.5">Data de saída</label>
                  <input type="date" value={form.data_saida} onChange={(e) => setForm({ ...form, data_saida: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1.5">Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Inquilino['status'] })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 bg-white">
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1.5">Observações</label>
                <textarea value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
                  placeholder="Observações adicionais..."
                  rows={2}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 resize-none" />
              </div>
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

      {/* Confirm Delete */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={22} className="text-red-500" />
            </div>
            <h3 className="font-bold text-gray-800 mb-2">Excluir inquilino?</h3>
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
