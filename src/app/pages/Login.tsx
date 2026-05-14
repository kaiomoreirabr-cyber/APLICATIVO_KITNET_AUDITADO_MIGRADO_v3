import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { Home, Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [showSenha, setShowSenha] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error: err } = await login(email, senha);
    setLoading(false);
    if (err) {
      setError(err);
    } else {
      navigate('/');
    }
  };

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
        <p className="text-white/50 text-sm mt-1">Painel do Administrador</p>
      </div>

      {/* Card */}
      <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">
        <h2 className="text-gray-800 text-xl font-semibold text-center mb-6">Acesse sua conta</h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1.5">E-mail</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-gray-800 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all"
              />
            </div>
          </div>

          <div>
            {/* Label com link "Esqueceu a senha?" na mesma linha */}
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm text-gray-600">Senha</label>
              <Link
                to="/esqueceu-senha"
                className="text-xs text-green-600 hover:text-green-700 font-medium transition-colors"
              >
                Esqueceu a senha?
              </Link>
            </div>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type={showSenha ? 'text' : 'password'}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl text-gray-800 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowSenha(!showSenha)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showSenha ? <EyeOff size={16} /> : <Eye size={16} />}
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
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="mt-5 text-center border border-gray-100 rounded-xl p-3 bg-gray-50">
          <p className="text-gray-500 text-xs">
            Use as credenciais cadastradas no{' '}
            <span className="text-green-600 font-medium">Supabase Auth</span>.
          </p>
          <p className="text-gray-400 text-xs mt-1">
            Altere sua senha em{' '}
            <span className="text-green-600">Configurações</span> após entrar.
          </p>
        </div>
      </div>

      <p className="mt-6 text-white/30 text-xs">KitnetPro © 2026 — Gestão simplificada</p>
    </div>
  );
}
