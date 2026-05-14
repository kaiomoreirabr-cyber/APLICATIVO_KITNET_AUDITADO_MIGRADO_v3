import React, { useEffect, useState } from 'react';
import { Plus, Search, Edit2, Trash2, Building2, User } from 'lucide-react';
import { supabase, Kitnet, Inquilino } from '../../utils/supabase';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const fmtMoeda = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

type StatusFilter = 'todas' | 'disponivel' | 'ocupada' | 'manutencao';

const STATUS_CONFIG = {
  disponivel: { label: 'Disponível', badge: 'bg-blue-100 text-blue-700', border: 'border-blue-400' },
  ocupada: { label: 'Ocupada', badge: 'bg-green-100 text-green-700', border: 'border-green-500' },
  manutencao: { label: 'Manutenção', badge: 'bg-orange-100 text-orange-700', border: 'border-orange-400' },
};

const EMPTY_FORM = {
  numero: '',
  descricao: '',
  valor: '',
  status: 'disponivel' as Kitnet['status'],
  andar: '',
};

export default function Kitnets() {
  const [kitnets, setKitnets] = useState<Kitnet[]>([]);
  const [inquilinos, setInquilinos] = useState<Inquilino[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<StatusFilter>('todas');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Kitnet | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [error, setError] = useState('');

  const load = async () => {
    const [k, i] = await Promise.all([
      supabase.from('kitnets').select('*').order('numero'),
      supabase.from('inquilinos').select('*').eq('status', 'ativo'),
    ]);
    setKitnets((k.data as Kitnet[]) || []);
    setInquilinos((i.data as Inquilino[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditItem(null);
    setForm(EMPTY_FORM);
    setError('');
    setShowModal(true);
  };

  const openEdit = (k: Kitnet) => {
    setEditItem(k);
    setForm({
      numero: k.numero,
      descricao: k.descricao || '',
      valor: String(k.valor),
      status: k.status,
      andar: k.andar || '',
    });
    setError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.numero || !form.valor) {
      setError('Número e valor são obrigatórios.');
      return;
    }
    setSaving(true);
    setError('');
    const payload = {
      numero: form.numero.trim(),
      descricao: form.descricao.trim(),
      valor: parseFloat(form.valor),
      status: form.status,
      andar: form.andar.trim(),
    };

    if (editItem) {
      const { error: err } = await supabase.from('kitnets').update(payload).eq('id', editItem.id);
      if (err) { setError(err.message); setSaving(false); return; }
    } else {
      const { error: err } = await supabase.from('kitnets').insert(payload);
      if (err) { setError(err.message); setSaving(false); return; }
    }

    setSaving(false);
    setShowModal(false);
    load();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('kitnets').delete().eq('id', id);
    setConfirmDelete(null);
    load();
  };

  const filtered = kitnets.filter((k) => {
    const matchSearch =
      k.numero.toLowerCase().includes(search.toLowerCase()) ||
      (k.descricao || '').toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'todas' || k.status === filter;
    return matchSearch && matchFilter;
  });

  const filterBtns: { key: StatusFilter; label: string }[] = [
    { key: 'todas', label: 'Todas' },
    { key: 'disponivel', label: 'Disponíveis' },
    { key: 'ocupada', label: 'Ocupadas' },
    { key: 'manutencao', label: 'Manutenção' },
  ];

  if (loading) {
    return <div className="flex items-center justify-center h-full"><div className="text-gray-400 text-sm">Carregando...</div></div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Kitnets</h1>
          <p className="text-gray-500 text-sm mt-0.5">{kitnets.length} kitnets cadastradas</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-medium transition-all hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}
        >
          <Plus size={16} />
          Nova Kitnet
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por número ou descrição..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100"
          />
        </div>
        <div className="flex gap-1.5 bg-gray-100 p-1 rounded-xl">
          {filterBtns.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                filter === key ? 'bg-gray-800 text-white' : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((k) => {
          const cfg = STATUS_CONFIG[k.status];
          const inq = inquilinos.find((i) => i.id === k.inquilino_id);
          return (
            <div
              key={k.id}
              className={`bg-white rounded-2xl border-t-4 ${cfg.border} shadow-sm hover:shadow-md transition-shadow p-5`}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-bold text-gray-800">Kitnet {k.numero}</h3>
                  <p className="text-gray-400 text-xs">{k.andar || '1º andar'}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${cfg.badge}`}>
                  {cfg.label}
                </span>
              </div>
              <p className="text-gray-500 text-sm mb-3">{k.descricao || '—'}</p>
              <div className="text-green-600 font-bold text-lg mb-3">
                {fmtMoeda(Number(k.valor))} <span className="text-gray-400 text-xs font-normal">/mês</span>
              </div>

              {inq && (
                <div className="flex items-center gap-2 mb-3 py-2 px-3 bg-gray-50 rounded-xl">
                  <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                    <User size={12} className="text-green-600" />
                  </div>
                  <div>
                    <div className="text-gray-700 text-xs font-medium">{inq.nome}</div>
                    <div className="text-gray-400 text-xs">
                      Desde {inq.data_entrada ? format(new Date(inq.data_entrada + 'T12:00:00'), 'dd/MM/yyyy') : '—'}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2 border-t border-gray-100">
                <button
                  onClick={() => openEdit(k)}
                  className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 text-xs font-medium transition-colors"
                >
                  <Edit2 size={13} /> Editar
                </button>
                <button
                  onClick={() => setConfirmDelete(k.id)}
                  className="flex items-center gap-1.5 text-red-400 hover:text-red-600 text-xs font-medium transition-colors"
                >
                  <Trash2 size={13} /> Excluir
                </button>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="col-span-full text-center py-16 text-gray-400">
            <Building2 size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Nenhuma kitnet encontrada</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-gray-800 font-bold text-lg mb-5">
              {editItem ? 'Editar Kitnet' : 'Nova Kitnet'}
            </h2>
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1.5">Número *</label>
                  <input
                    type="text"
                    value={form.numero}
                    onChange={(e) => setForm({ ...form, numero: e.target.value })}
                    placeholder="101"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1.5">Andar</label>
                  <input
                    type="text"
                    value={form.andar}
                    onChange={(e) => setForm({ ...form, andar: e.target.value })}
                    placeholder="1º andar"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1.5">Descrição</label>
                <input
                  type="text"
                  value={form.descricao}
                  onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                  placeholder="Kitnet standard, 25m²"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1.5">Valor mensal (R$) *</label>
                <input
                  type="number"
                  value={form.valor}
                  onChange={(e) => setForm({ ...form, valor: e.target.value })}
                  placeholder="800"
                  min="0"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1.5">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as Kitnet['status'] })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 bg-white"
                >
                  <option value="disponivel">Disponível</option>
                  <option value="ocupada">Ocupada</option>
                  <option value="manutencao">Manutenção</option>
                </select>
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-2.5 text-white rounded-xl text-sm font-medium disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}
              >
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
            <h3 className="font-bold text-gray-800 mb-2">Excluir kitnet?</h3>
            <p className="text-gray-500 text-sm mb-5">Esta ação não pode ser desfeita.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}