<div align="center">

<h1>KitnetPro</h1>

<p>Painel administrativo para gestão de kitnets  unidades, inquilinos e pagamentos em um único lugar.</p>

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3.1-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.3.5-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-2.x-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.1-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/license-MIT-22c55e?style=flat-square)](LICENSE)
[![Deploy](https://img.shields.io/badge/deploy-Vercel-000000?style=flat-square&logo=vercel&logoColor=white)](https://kitnetprodevapp.vercel.app)

<br/>


</div>

---

## Visão Geral

Gerenciar kitnets com planilhas, cadernos ou conversas no WhatsApp gera confusão e perda de controle. O **KitnetPro** resolve esse problema com uma interface web limpa, objetiva e funcional — desenvolvida especificamente para o pequeno proprietário que precisa de clareza, agilidade e controle sobre seu patrimônio.

> Projeto desenvolvido por **Kaio Moreira de Morais** como Projeto Integrador das disciplinas de Modelagem de Sistemas, Paradigmas de Programação e Tecnologias e Linguagens de Bancos de Dados — **Universidade de Balsas (Unibalsas), 2026**.

## Equipe: 

**Kaio Moreira de Morais**  Desenvolvedor Full Stack  
Universidade de Balsas (Unibalsas)  Projeto Integrador 2026


## Funcionalidades

- **Dashboard** com métricas em tempo real: unidades ocupadas, disponíveis, em manutenção, receita potencial e receita recebida no mês
- **Gestão de kitnets**: cadastro e edição de unidades com número, valor, andar e status
- **Gestão de inquilinos**: cadastro completo com datas de entrada e saída
- **Controle de pagamentos**: acompanhamento mensal com status (pago, pendente, atrasado) e navegação entre meses
- **Cobrança via WhatsApp**: envio automático de mensagem com chave Pix do proprietário embutida
- **Recuperação de senha**: fluxo completo via link por e-mail
- **Configurações**: atualização de perfil, chave Pix e senha

---

## Tecnologias utilizadas 

| Tecnologia | Versão | Função |
|---|---|---|
| TypeScript | 5.x | Tipagem estática em todo o projeto |
| React | 18.3.1 | Biblioteca de interface com componentes reativos |
| Vite | 6.3.5 | Build tool e servidor de desenvolvimento |
| React Router | 7.13 | Roteamento e proteção de rotas autenticadas |
| Supabase | ^2.100 | Backend as a Service: PostgreSQL, REST API e Auth |
| Tailwind CSS | 4.1 | Estilização utilitária |
| Radix UI | — | Componentes acessíveis (diálogos, selects, dropdowns) |
| Lucide React | 0.487 | Ícones SVG |
| date-fns | 3.6 | Formatação de datas em pt-BR |
| Sonner | 2.0 | Notificações toast |
| canvas-confetti | 1.9 | Feedback visual ao registrar pagamentos |

---

## Estrutura do Projeto

```
kitnetpro_dev_app/
├── database/
│   └── schema.sql              # Schema completo com RLS
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   ├── ui/             # Componentes reutilizáveis (Radix UI + Tailwind)
│   │   │   ├── DatabaseSetup.tsx
│   │   │   └── Layout.tsx      # Sidebar + estrutura do painel
│   │   ├── context/
│   │   │   └── AuthContext.tsx # Estado global de autenticação
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Kitnets.tsx
│   │   │   ├── Inquilinos.tsx
│   │   │   ├── Pagamentos.tsx
│   │   │   ├── Configuracoes.tsx
│   │   │   ├── Login.tsx
│   │   │   ├── EsqueceuSenha.tsx
│   │   │   └── RedefinirSenha.tsx
│   │   ├── App.tsx
│   │   └── routes.tsx
│   ├── styles/
│   └── utils/
│       └── supabase.ts         # Cliente Supabase e tipos TypeScript
├── .env.example
├── package.json
├── vite.config.ts
└── README.md
```

---

## Como Executar Localmente

### Pré-requisitos

- Node.js 18 ou superior
- npm ou pnpm
- Conta gratuita no [Supabase](https://supabase.com/)

### 1. Clone o repositório

```bash
git clone https://github.com/kaiomoreirabr-cyber/kitnetpro_dev_app.git
cd kitnetpro_dev_app
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure o banco de dados

1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard) e crie um novo projeto
2. Navegue até **SQL Editor → New query**
3. Cole e execute o conteúdo do arquivo `database/schema.sql`

Isso criará as tabelas `proprietarios`, `kitnets`, `inquilinos` e `pagamentos`, além de configurar as políticas de Row Level Security (RLS).

4. Em **Authentication → Users → Add User**, crie o usuário administrador com o e-mail e senha desejados.

### 4. Configure as variáveis de ambiente

```bash
cp .env.example .env
```

Preencha com os valores do seu projeto, disponíveis em **Supabase → Settings → API**:

```env
VITE_SUPABASE_URL=https://SEU_PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=sua_anon_key_aqui
```

### 5. Configure os Redirect URLs

No **Supabase Dashboard → Authentication → URL Configuration**, adicione em **Redirect URLs**:

```
http://localhost:5173/redefinir-senha
https://kitnetprodevapp.vercel.app/redefinir-senha
```

### 6. Inicie o servidor de desenvolvimento

```bash
npm run dev
```

Acesse `http://localhost:5173` e faça login com as credenciais criadas no passo 3.

### Build para produção

```bash
npm run build
```

Os arquivos serão gerados em `dist/`, prontos para deploy em Vercel, Netlify ou similar.

---

## Segurança

- Credenciais do Supabase carregadas via `import.meta.env` — nunca expostas no código-fonte
- `.env` listado no `.gitignore` e fora do versionamento
- Row Level Security (RLS) ativado em todas as tabelas
- Autenticação via Supabase Auth com senhas armazenadas em hash

---

## Roadmap

**v1  Curto prazo**
 Geração de link de pagamento via WhatsApp
Lembrete automático por WhatsApp próximo ao vencimento

**v2  Médio prazo**
 Integração completa com `auth.users.id` do Supabase para isolamento de dados por proprietário
 Responsividade completa para dispositivos móveis

**v3  Longo prazo**
 Aplicativo web responsivo para todas as telas  (React Native)
 recuperação de senhas via e-mail
 Integração via vercel para uso do app com dominio proprio 



<div align="center">
  <sub>KitnetPro  2026  Kaio Moreira de Morais  Unibalsas</sub>
</div>