import React, { useState } from 'react';
import { Link } from 'react-router';
import { Home, Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { supabase } from '../../utils/supabase';

export default function EsqueceuSenha() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      // Troque pela URL do seu app em produção, ex: https://meuapp.com/redefinir-senha
      redirectTo: `${window.location.origin}/redefinir-senha`,
    });

    setLoading(false);

    if (err) {
      setError('Não foi possível enviar o e-mail. Verifique o endereço informado.');
    } else {
      setEnviado(true);
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
        <p className="text-white/50 text-sm mt-1">Recuperar senha</p>
      </div>

      {/* Card */}
      <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">
        {enviado ? (
          /* Estado: e-mail enviado */
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle size={48} className="text-green-500" />
            </div>
            <h2 className="text-gray-800 text-xl font-semibold mb-2">E-mail enviado!</h2>
            <p className="text-gray-500 text-sm mb-6">
              Verifique sua caixa de entrada em{' '}
              <span className="font-medium text-gray-700">{email}</span> e clique
              no link para redefinir sua senha.
            </p>
            <p className="text-gray-400 text-xs mb-6">
              Não recebeu? Verifique a pasta de spam ou tente novamente.
            </p>
            <button
              onClick={() => { setEnviado(false); setEmail(''); }}
              className="text-green-600 text-sm font-medium hover:underline"
            >
              Tentar com outro e-mail
            </button>
          </div>
        ) : (
          /* Estado: formulário */
          <>
            <h2 className="text-gray-800 text-xl font-semibold text-center mb-2">
              Esqueceu sua senha?
            </h2>
            <p className="text-gray-500 text-sm text-center mb-6">
              Informe seu e-mail e enviaremos um link para redefinir sua senha.
            </p>

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
                {loading ? 'Enviando...' : 'Enviar link de recuperação'}
              </button>
            </form>
          </>
        )}

        {/* Voltar ao login */}
        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-gray-400 text-sm hover:text-gray-600 transition-colors"
          >
            <ArrowLeft size={14} />
            Voltar para o login
          </Link>
        </div>
      </div>

      <p className="mt-6 text-white/30 text-xs">KitnetPro © 2026 — Gestão simplificada</p>
    </div>
  );
}
