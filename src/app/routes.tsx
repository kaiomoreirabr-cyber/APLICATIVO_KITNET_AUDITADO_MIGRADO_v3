import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router';
import { Layout } from './components/Layout';
import Login from './pages/Login';
import EsqueceuSenha from './pages/EsqueceuSenha';
import RedefinirSenha from './pages/RedefinirSenha';
import Dashboard from './pages/Dashboard';
import Kitnets from './pages/Kitnets';
import Inquilinos from './pages/Inquilinos';
import Pagamentos from './pages/Pagamentos';
import Configuracoes from './pages/Configuracoes';
import { useAuth } from './context/AuthContext';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-gray-400 text-sm">Carregando...</div>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0f1c2e' }}>
      <div className="text-white/40 text-sm">Carregando...</div>
    </div>
  );
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <PublicRoute><Login /></PublicRoute>,
  },
  // Rotas de recuperação de senha — públicas, mas SEM redirecionar se logado
  // (o usuário pode chegar aqui pelo link do e-mail, mesmo com sessão temporária)
  {
    path: '/esqueceu-senha',
    element: <EsqueceuSenha />,
  },
  {
    path: '/redefinir-senha',
    element: <RedefinirSenha />,
  },
  {
    path: '/',
    element: <ProtectedRoute><Dashboard /></ProtectedRoute>,
  },
  {
    path: '/kitnets',
    element: <ProtectedRoute><Kitnets /></ProtectedRoute>,
  },
  {
    path: '/inquilinos',
    element: <ProtectedRoute><Inquilinos /></ProtectedRoute>,
  },
  {
    path: '/pagamentos',
    element: <ProtectedRoute><Pagamentos /></ProtectedRoute>,
  },
  {
    path: '/configuracoes',
    element: <ProtectedRoute><Configuracoes /></ProtectedRoute>,
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
