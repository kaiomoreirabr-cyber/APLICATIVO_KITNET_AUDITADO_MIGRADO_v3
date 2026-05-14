import React, { useState } from 'react';
import { Copy, Check, Database } from 'lucide-react';

const SQL = `-- Run this SQL in your Supabase SQL Editor to create the required tables
-- Go to: Supabase Dashboard > SQL Editor > New query

-- 1. Proprietários (Admin)
CREATE TABLE IF NOT EXISTS proprietarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  senha TEXT NOT NULL,
  telefone TEXT,
  pix_chave TEXT,
  pix_tipo TEXT DEFAULT 'email',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Kitnets
CREATE TABLE IF NOT EXISTS kitnets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  numero TEXT UNIQUE NOT NULL,
  descricao TEXT,
  valor NUMERIC(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'disponivel' CHECK (status IN ('disponivel','ocupada','manutencao')),
  andar TEXT,
  inquilino_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Inquilinos
CREATE TABLE IF NOT EXISTS inquilinos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  cpf TEXT UNIQUE,
  telefone TEXT UNIQUE,
  email TEXT UNIQUE,
  kitnet_id UUID REFERENCES kitnets(id) ON DELETE SET NULL,
  data_entrada DATE,
  data_saida DATE,
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo','inativo')),
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Pagamentos
CREATE TABLE IF NOT EXISTS pagamentos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  inquilino_id UUID NOT NULL REFERENCES inquilinos(id) ON DELETE CASCADE,
  kitnet_id UUID NOT NULL REFERENCES kitnets(id) ON DELETE CASCADE,
  mes INTEGER NOT NULL CHECK (mes BETWEEN 1 AND 12),
  ano INTEGER NOT NULL,
  valor NUMERIC(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pago','pendente','atrasado')),
  data_pagamento DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(inquilino_id, mes, ano)
);

-- Disable RLS on all tables
ALTER TABLE proprietarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE kitnets DISABLE ROW LEVEL SECURITY;
ALTER TABLE inquilinos DISABLE ROW LEVEL SECURITY;
ALTER TABLE pagamentos DISABLE ROW LEVEL SECURITY;

-- Insert default admin
INSERT INTO proprietarios (nome, email, senha, telefone, pix_chave, pix_tipo)
VALUES ('Administrador', 'admin@kitnet.com', 'admin123', '11999999999', 'admin@kitnet.com', 'email')
ON CONFLICT (email) DO NOTHING;`;

export function DatabaseSetup() {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(SQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ background: 'linear-gradient(135deg, #0f1c2e 0%, #1a3a4a 50%, #0f2a1e 100%)' }}
    >
      <div className="bg-white rounded-2xl p-8 w-full max-w-2xl shadow-2xl">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
            <Database size={20} className="text-orange-500" />
          </div>
          <div>
            <h2 className="font-bold text-gray-800 text-lg">Configurar Banco de Dados</h2>
            <p className="text-gray-500 text-sm">Execute o SQL abaixo no seu Supabase</p>
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4 relative overflow-hidden">
          <button
            onClick={copy}
            className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors"
          >
            {copied ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
            {copied ? 'Copiado!' : 'Copiar'}
          </button>
          <pre className="text-xs text-gray-600 overflow-auto max-h-80 pr-16 whitespace-pre-wrap font-mono leading-relaxed">
            {SQL}
          </pre>
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
          <p className="text-blue-700 text-sm font-medium mb-1">Como executar:</p>
          <ol className="text-blue-600 text-sm space-y-1 list-decimal list-inside">
            <li>Acesse seu <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="underline">Supabase Dashboard</a></li>
            <li>Vá em <strong>SQL Editor → New query</strong></li>
            <li>Cole o SQL acima e clique em <strong>Run</strong></li>
            <li>Recarregue esta página</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
