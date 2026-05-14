import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router';
import {
  LayoutDashboard,
  Building2,
  Users,
  CreditCard,
  Settings,
  LogOut,
  Home,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/kitnets', icon: Building2, label: 'Kitnets' },
  { to: '/inquilinos', icon: Users, label: 'Inquilinos' },
  { to: '/pagamentos', icon: CreditCard, label: 'Pagamentos' },
  { to: '/configuracoes', icon: Settings, label: 'Configurações' },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.nome
    ? user.nome.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : 'A';

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}>
          <Home size={20} color="white" />
        </div>
        <div>
          <div className="text-white font-bold text-base leading-tight">KitnetPro</div>
          <div className="text-white/50 text-xs">Gestão de Kitnets</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 flex flex-col gap-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all duration-150 ${
                isActive
                  ? 'bg-green-600 text-white font-medium'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={18} className={isActive ? 'text-white' : 'text-white/60'} />
                <span>{label}</span>
                {isActive && <span className="ml-auto text-white">›</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div className="px-3 py-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white text-sm font-medium truncate">{user?.nome || 'Administrador'}</div>
            <div className="text-white/50 text-xs truncate">{user?.email || ''}</div>
          </div>
          <button
            onClick={handleLogout}
            className="text-white/50 hover:text-white transition-colors p-1 rounded"
            title="Sair"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Desktop Sidebar */}
      <aside
        className="hidden md:flex flex-col w-60 flex-shrink-0"
        style={{ background: '#0f1c2e' }}
      >
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-60 z-50 flex flex-col transition-transform duration-200 md:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ background: '#0f1c2e' }}
      >
        <SidebarContent />
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-600">
            <Menu size={22} />
          </button>
          <span className="font-bold text-gray-800">KitnetPro</span>
        </div>

        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
