import React, { useState, useEffect } from 'react';
import { User, CreditCard, Lock, Eye, EyeOff, MessageCircle, Save } from 'lucide-react';
import { supabase } from '../../utils/supabase';
import { useAuth } from '../context/AuthContext';

const PIX_TIPOS = ['CPF', 'CNPJ', 'Email', 'Telefone', 'Aleatória'];

export default function Configuracoes() {
  const { user, refreshUser } = useAuth();

  const [perfil, setPerfil] = useState({ nome: '', email: '', telefone: '' });
  const [pix, setPix] = useState({ pix_chave: '', pix_tipo: 'email' });
  const [senha, setSenha] = useState({ atual: '', nova: '', confirmar: '' });
  const [showAtual, setShowAtual] = useState(false);
  const [showNova, setShowNova] = useState(false);
  const [showConfirmar, setShowConfirmar] = useState(false);

  const [savingPerfil, setSavingPerfil] = useState(false);
  const [savingPix, setSavingPix] = useState(false);
  const [savingSenha, setSavingSenha] = useState(false);

  const [msgPerfil, setMsgPerfil] = useState('');
  const [msgPix, setMsgPix] = useState('');
  const [msgSenha, setMsgSenha] = useState('');
  const [errSenha, setErrSenha] = useState('');

  useEffect(() => {
    if (user) {
      setPerfil({ nome: user.nome || '', email: user.email || '', telefone: user.telefone || '' });
      setPix({ pix_chave: user.pix_chave || '', pix_tipo: user.pix_tipo || 'email' });
    }
  }, [user]);

  // Salva apenas nome e telefone — email é gerenciado pelo Supabase Auth
  const salvarPerfil = async () => {
    if (!user) return;
    setSavingPerfil(true);
    setMsgPerfil('');
    const { error } = await supabase
      .from('proprietarios')
      .update({ nome: perfil.nome, telefone: perfil.telefone })
      .eq('id', user.id);
    if (error) {
      setMsgPerfil('Erro: ' + error.message);
    } else {
      setMsgPerfil('Perfil salvo com sucesso!');
      await refreshUser();
    }
    setSavingPerfil(false);
    setTimeout(() => setMsgPerfil(''), 3000);
  };

  const salvarPix = async () => {
    if (!user) return;
    setSavingPix(true);
    setMsgPix('');
    const { error } = await supabase
      .from('proprietarios')
      .update({ pix_chave: pix.pix_chave, pix_tipo: pix.pix_tipo.toLowerCase() })
      .eq('id', user.id);
    if (error) {
      setMsgPix('Erro: ' + error.message);
    } else {
      setMsgPix('Chave PIX salva com sucesso!');
      await refreshUser();
    }
    setSavingPix(false);
    setTimeout(() => setMsgPix(''), 3000);
  };

  // Troca de senha via Supabase Auth:
  // 1. Verifica a senha atual fazendo um re-login
  // 2. Se correto, atualiza via updateUser
  const salvarSenha = async () => {
    if (!user) return;
    setErrSenha('');
    setMsgSenha('');

    if (senha.nova.length < 6) {
      setErrSenha('Nova senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (senha.nova !== senha.confirmar) {
      setErrSenha('As senhas não coincidem.');
      return;
    }

    setSavingSenha(true);

    // Verifica senha atual re-autenticando
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: senha.atual,
    });

    if (signInError) {
      setErrSenha('Senha atual incorreta.');
      setSavingSenha(false);
      return;
    }

    // Atualiza para a nova senha
    const { error } = await supabase.auth.updateUser({ password: senha.nova });
    if (error) {
      setErrSenha('Erro: ' + error.message);
    } else {
      setMsgSenha('Senha alterada com sucesso!');
      setSenha({ atual: '', nova: '', confirmar: '' });
    }
    setSavingSenha(false);
    setTimeout(() => setMsgSenha(''), 3000);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Configurações</h1>
        <p className="text-gray-500 text-sm mt-0.5">Gerencie seu perfil e configurações do sistema</p>
      </div>

      {/* Perfil */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-5">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
            <User size={18} className="text-blue-500" />
          </div>
          <h2 className="font-bold text-gray-800 text-base">Perfil</h2>
        </div>
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1.5">Nome completo</label>
            <input
              type="text"
              value={perfil.nome}
              onChange={(e) => setPerfil({ ...perfil, nome: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1.5">
              E-mail{' '}
              <span className="text-gray-400 text-xs font-normal">(gerenciado pelo Supabase Auth)</span>
            </label>
            <input
              type="email"
              value={perfil.email}
              disabled
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1.5">WhatsApp</label>
            <div className="relative">
              <input
                type="text"
                value={perfil.telefone}
                onChange={(e) => setPerfil({ ...perfil, telefone: e.target.value })}
                placeholder="11999999999"
                className="w-full px-3 py-2.5 pr-10 border border-gray-200 rounded-xl text-sm outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100"
              />
              <MessageCircle size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </div>
          {msgPerfil && (
            <p className={`text-sm ${msgPerfil.startsWith('Erro') ? 'text-red-500' : 'text-green-600'}`}>{msgPerfil}</p>
          )}
          <button
            onClick={salvarPerfil}
            disabled={savingPerfil}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-medium w-fit hover:opacity-90 transition-all disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}
          >
            <Save size={15} />
            {savingPerfil ? 'Salvando...' : 'Salvar perfil'}
          </button>
        </div>
      </div>

      {/* Chave PIX */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-5">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center">
            <CreditCard size={18} className="text-green-500" />
          </div>
          <div>
            <h2 className="font-bold text-gray-800 text-base">Chave PIX</h2>
            <p className="text-gray-400 text-xs">Usada para gerar mensagens de pagamento no WhatsApp</p>
          </div>
        </div>
        <div className="flex flex-col gap-4 mt-5">
          <div>
            <label className="block text-sm text-gray-600 mb-2">Tipo de chave</label>
            <div className="flex gap-2 flex-wrap">
              {PIX_TIPOS.map((tipo) => (
                <button
                  key={tipo}
                  onClick={() => setPix({ ...pix, pix_tipo: tipo.toLowerCase() })}
                  className={`px-3.5 py-1.5 rounded-xl text-sm border transition-all ${
                    pix.pix_tipo.toLowerCase() === tipo.toLowerCase()
                      ? 'border-green-500 bg-green-50 text-green-700 font-medium'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {tipo}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1.5">Chave PIX</label>
            <input
              type="text"
              value={pix.pix_chave}
              onChange={(e) => setPix({ ...pix, pix_chave: e.target.value })}
              placeholder="admin@kitnet.com"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100"
            />
          </div>
          {msgPix && (
            <p className={`text-sm ${msgPix.startsWith('Erro') ? 'text-red-500' : 'text-green-600'}`}>{msgPix}</p>
          )}
          <button
            onClick={salvarPix}
            disabled={savingPix}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-medium w-fit hover:opacity-90 transition-all disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}
          >
            <Save size={15} />
            {savingPix ? 'Salvando...' : 'Salvar chave PIX'}
          </button>
        </div>
      </div>

      {/* Alterar senha */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center">
            <Lock size={18} className="text-orange-500" />
          </div>
          <h2 className="font-bold text-gray-800 text-base">Alterar Senha</h2>
        </div>
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1.5">Senha atual</label>
            <div className="relative">
              <input
                type={showAtual ? 'text' : 'password'}
                value={senha.atual}
                onChange={(e) => setSenha({ ...senha, atual: e.target.value })}
                className="w-full px-3 py-2.5 pr-10 border border-gray-200 rounded-xl text-sm outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100"
              />
              <button type="button" onClick={() => setShowAtual(!showAtual)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showAtual ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1.5">Nova senha</label>
            <div className="relative">
              <input
                type={showNova ? 'text' : 'password'}
                value={senha.nova}
                onChange={(e) => setSenha({ ...senha, nova: e.target.value })}
                className="w-full px-3 py-2.5 pr-10 border border-gray-200 rounded-xl text-sm outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100"
              />
              <button type="button" onClick={() => setShowNova(!showNova)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showNova ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1.5">Confirmar nova senha</label>
            <div className="relative">
              <input
                type={showConfirmar ? 'text' : 'password'}
                value={senha.confirmar}
                onChange={(e) => setSenha({ ...senha, confirmar: e.target.value })}
                className="w-full px-3 py-2.5 pr-10 border border-gray-200 rounded-xl text-sm outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100"
              />
              <button type="button" onClick={() => setShowConfirmar(!showConfirmar)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showConfirmar ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          {errSenha && <p className="text-red-500 text-sm">{errSenha}</p>}
          {msgSenha && <p className="text-green-600 text-sm">{msgSenha}</p>}
          <button
            onClick={salvarSenha}
            disabled={savingSenha}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-medium w-fit hover:opacity-90 transition-all disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}
          >
            <Lock size={15} />
            {savingSenha ? 'Alterando...' : 'Alterar senha'}
          </button>
        </div>
      </div>
    </div>
  );
}
