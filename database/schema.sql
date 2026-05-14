-- ============================================================
-- KITNETPRO - Schema SQL para Supabase (com Supabase Auth + RLS)
-- ============================================================
-- Execute no: Supabase Dashboard > SQL Editor > New query
-- Ordem: execute tudo de uma vez (Ctrl+A → Run)
-- ============================================================

-- ============================================================
-- PASSO 0: CRIAR O USUÁRIO ADMINISTRADOR NO SUPABASE AUTH
-- ============================================================
-- Antes de rodar este script, acesse:
--   Supabase Dashboard → Authentication → Users → Add User
-- Informe o e-mail e senha que deseja usar para entrar no app.
-- O UUID gerado ali será o ID do seu perfil em "proprietarios".
-- ============================================================

-- 1. PROPRIETÁRIOS (perfil complementar — credenciais ficam no Supabase Auth)
-- ============================================================
CREATE TABLE IF NOT EXISTS proprietarios (
  id         UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome       TEXT        NOT NULL DEFAULT 'Administrador',
  telefone   TEXT,
  pix_chave  TEXT,
  pix_tipo   TEXT        DEFAULT 'email',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. KITNETS
-- ============================================================
CREATE TABLE IF NOT EXISTS kitnets (
  id           UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  numero       TEXT         UNIQUE NOT NULL,
  descricao    TEXT,
  valor        NUMERIC(10,2) NOT NULL DEFAULT 0,
  status       TEXT         NOT NULL DEFAULT 'disponivel'
                 CHECK (status IN ('disponivel','ocupada','manutencao')),
  andar        TEXT,
  inquilino_id UUID,
  created_at   TIMESTAMPTZ  DEFAULT NOW()
);

-- 3. INQUILINOS
-- ============================================================
CREATE TABLE IF NOT EXISTS inquilinos (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  nome         TEXT        NOT NULL,
  cpf          TEXT        UNIQUE,
  telefone     TEXT        UNIQUE,
  email        TEXT        UNIQUE,
  kitnet_id    UUID        REFERENCES kitnets(id) ON DELETE SET NULL,
  data_entrada DATE,
  data_saida   DATE,
  status       TEXT        NOT NULL DEFAULT 'ativo'
                 CHECK (status IN ('ativo','inativo')),
  observacoes  TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- 4. PAGAMENTOS
-- ============================================================
CREATE TABLE IF NOT EXISTS pagamentos (
  id             UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  inquilino_id   UUID         NOT NULL REFERENCES inquilinos(id) ON DELETE CASCADE,
  kitnet_id      UUID         NOT NULL REFERENCES kitnets(id)    ON DELETE CASCADE,
  mes            INTEGER      NOT NULL CHECK (mes BETWEEN 1 AND 12),
  ano            INTEGER      NOT NULL,
  valor          NUMERIC(10,2) NOT NULL DEFAULT 0,
  status         TEXT         NOT NULL DEFAULT 'pendente'
                   CHECK (status IN ('pago','pendente','atrasado')),
  data_pagamento DATE,
  created_at     TIMESTAMPTZ  DEFAULT NOW(),
  UNIQUE(inquilino_id, mes, ano)
);

-- ============================================================
-- RLS (Row Level Security) — ATIVADO
-- ============================================================

ALTER TABLE proprietarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE kitnets        ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquilinos     ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagamentos     ENABLE ROW LEVEL SECURITY;

-- Proprietários: cada usuário só acessa o próprio perfil
CREATE POLICY "proprietario_acesso_proprio"
  ON proprietarios FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Kitnets, Inquilinos, Pagamentos:
-- apenas usuários autenticados têm acesso (sistema mono-usuário)
CREATE POLICY "autenticado_kitnets"
  ON kitnets FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "autenticado_inquilinos"
  ON inquilinos FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "autenticado_pagamentos"
  ON pagamentos FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================
-- VERIFICAÇÃO FINAL
-- ============================================================
-- Após rodar, confirme as tabelas:
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public' ORDER BY table_name;
--
-- Confirme as policies ativas:
-- SELECT tablename, policyname FROM pg_policies
-- WHERE schemaname = 'public' ORDER BY tablename;
