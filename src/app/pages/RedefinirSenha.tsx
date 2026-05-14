import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Home, Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../../utils/supabase';

export default function RedefinirSenha() {
  const navigate = useNavigate();
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [showNova, setShowNova] = useState(false);
  const [showConfirmar, setShowConfirmar] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [error, setError] = useState('');
  const [tokenValido, setTokenValido] = useState<boolean | null>(null);

  useEffect(() => {
    // Supabase injeta a sessão automaticamente via URL hash quando o usuário
    // chega pelo link do e-mail. Verificamos se há sessão ativa.
    const verificarSessao = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setTokenValido(!!session);
    };

    // Escuta o evento PASSWORD_RECOVERY disparado pelo Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setTokenValido(true);
      }
    });

    verificarSessao();
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (novaSenha.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    if (novaSenha !== confirmarSenha) {
      setError('As senhas não coincidem.');
      return;
    }

    setLoading(true);
    const { error: err } = await supabase.auth.updateUser({ password: novaSenha });
    setLoading(false);

    if (err) {
      setError('Não foi possível redefinir a senha. O link pode ter expirado.');
    } else {
      setSucesso(true);
      // Redireciona para login após 3 segundos
      setTimeout(() => navigate('/login'), 3000);
    }
  };

  // Token inválido ou expirado
  if (tokenValido === false) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center px-4"
        style={{ background: 'linear-gradient(135deg, #0f1c2e 0%, #1a3a4a 50%, #0f2a1e 100%)' }}
      >
        <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl text-center">
          <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
          <h2 className="text-gray-800 text-xl font-semibold mb-2">Link inválido ou expirado</h2>
          <p className="text-gray-500 text-sm mb-6">
            Solicite um novo link de recuperação de senha.
          </p>
          <button
            onClick={() => navigate('/esqueceu-senha')}
            className="w-full py-3 rounded-xl text-white font-medium text-sm"
            style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}
          >
            Solicitar novo link
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: 'linear-gradient(135deg, #0f1c2e 0%, #1a3a4a 50%, #0f2a1e 100%)' }}
    >
      {/* Logo */}
      <div className="mb-8 text-center">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}
        >
          <Home size={32} color="white" />
        </div>
        <h1 className="text-white text-2xl font-bold">KitnetPro</h1>
        <p className="text-white/50 text-sm mt-1">Redefinir senha</p>
      </div>

      {/* Card */}
      <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">
        {sucesso ? (
          <div className="text-center">
            <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
            <h2 className="text-gray-800 text-xl font-semibold mb-2">Senha redefinida!</h2>
            <p className="text-gray-500 text-sm">
              Sua senha foi atualizada com sucesso. Redirecionando para o login...
            </p>
          </div>
        ) : (
          <>
            <h2 className="text-gray-800 text-xl font-semibold text-center mb-2">
              Criar nova senha
            </h2>
            <p className="text-gray-500 text-sm text-center mb-6">
              Escolha uma senha segura com pelo menos 6 caracteres.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Nova senha */}
              <div>
                <label className="block text-sm text-gray-600 mb-1.5">Nova senha</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showNova ? 'text' : 'password'}
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl text-gray-800 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNova(!showNova)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showNova ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Confirmar senha */}
              <div>
                <label className="block text-sm text-gray-600 mb-1.5">Confirmar nova senha</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showConfirmar ? 'text' : 'password'}
                    value={confirmarSenha}
                    onChange={(e) => setConfirmarSenha(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl text-gray-800 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmar(!showConfirmar)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmar ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl text-white font-medium text-sm transition-all mt-1 disabled:opacity-60"
                style={{ background: loading ? '#86efac' : 'linear-gradient(135deg, #22c55e, #16a34a)' }}
              >
                {loading ? 'Salvando...' : 'Redefinir senha'}
              </button>
            </form>
          </>
        )}
      </div>

      <p className="mt-6 text-white/30 text-xs">KitnetPro © 2026  Gestão simplificada</p>
    </div>
  );
}
