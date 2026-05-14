import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, Proprietario } from '../../utils/supabase';

type AuthContextType = {
  user: Proprietario | null;
  loading: boolean;
  login: (email: string, senha: string) => Promise<{ error: string | null }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Proprietario | null>(null);
  const [loading, setLoading] = useState(true);

  // Carrega ou cria o perfil complementar na tabela proprietarios
  const loadProfile = async (userId: string, email: string) => {
    const { data, error } = await supabase
      .from('proprietarios')
      .select('*')
      .eq('id', userId)
      .single();

    if (data && !error) {
      setUser({ ...data, email } as Proprietario);
    } else {
      // Primeiro acesso: cria o perfil automaticamente
      const { data: created } = await supabase
        .from('proprietarios')
        .insert({
          id: userId,
          nome: 'Administrador',
          telefone: '',
          pix_chave: '',
          pix_tipo: 'email',
        })
        .select()
        .single();

      if (created) {
        setUser({ ...created, email } as Proprietario);
      }
    }
  };

  const refreshUser = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.user) {
      await loadProfile(session.user.id, session.user.email ?? '');
    }
  };

  useEffect(() => {
    // onAuthStateChange dispara uma vez na inicialização com a sessão atual (ou null)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        loadProfile(session.user.id, session.user.email ?? '').finally(() =>
          setLoading(false)
        );
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (
    email: string,
    senha: string
  ): Promise<{ error: string | null }> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });

    if (error || !data.session) {
      return { error: 'E-mail ou senha incorretos.' };
    }

    // Carrega o perfil de forma síncrona para que o user esteja disponível
    // antes do navigate('/') em Login.tsx
    await loadProfile(data.session.user.id, data.session.user.email ?? '');

    return { error: null };
  };

  const logout = () => {
    // Limpa o estado imediatamente (evita flicker em ProtectedRoute)
    setUser(null);
    supabase.auth.signOut(); // fire and forget
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
