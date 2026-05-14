import { createClient } from '@supabase/supabase-js';

// ⚠️ Certifique-se de que o arquivo .env existe na raiz do projeto com:
//    VITE_SUPABASE_URL=https://SEU_PROJETO.supabase.co
//    VITE_SUPABASE_ANON_KEY=sua_anon_key_aqui

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    '❌ Variáveis de ambiente do Supabase não encontradas!\n' +
    'Crie um arquivo .env na raiz do projeto com:\n' +
    'VITE_SUPABASE_URL=...\n' +
    'VITE_SUPABASE_ANON_KEY=...'
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Senha removida: credenciais gerenciadas pelo Supabase Auth
export type Proprietario = {
  id: string;
  nome: string;
  email: string;    // vem do auth.users, não da tabela proprietarios
  telefone: string;
  pix_chave: string;
  pix_tipo: string;
};

export type Kitnet = {
  id: string;
  numero: string;
  descricao: string;
  valor: number;
  status: 'disponivel' | 'ocupada' | 'manutencao';
  andar: string;
  inquilino_id: string | null;
};

export type Inquilino = {
  id: string;
  nome: string;
  cpf: string;
  telefone: string;
  email: string;
  kitnet_id: string | null;
  data_entrada: string;
  data_saida: string | null;
  status: 'ativo' | 'inativo';
  observacoes: string;
};

export type Pagamento = {
  id: string;
  inquilino_id: string;
  kitnet_id: string;
  mes: number;
  ano: number;
  valor: number;
  status: 'pago' | 'pendente' | 'atrasado';
  data_pagamento: string | null;
};
