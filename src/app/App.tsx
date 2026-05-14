import React, { useState, useEffect } from 'react';
import { RouterProvider } from 'react-router';
import { router } from './routes';
import { AuthProvider } from './context/AuthContext';
import { DatabaseSetup } from './components/DatabaseSetup';
import { supabase } from '../utils/supabase';

function AppContent() {
  const [dbReady, setDbReady] = useState<boolean | null>(null);

  useEffect(() => {
    const check = async () => {
      try {
        const { error } = await supabase.from('proprietarios').select('id').limit(1);
        if (error && (error.code === '42P01' || error.message?.includes('does not exist'))) {
          setDbReady(false);
        } else {
          setDbReady(true);
        }
      } catch {
        setDbReady(true); // assume ready on network errors
      }
    };
    check();
  }, []);

  if (dbReady === null) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: '#0f1c2e' }}
      >
        <div className="text-white/40 text-sm">Iniciando...</div>
      </div>
    );
  }

  if (dbReady === false) {
    return <DatabaseSetup />;
  }

  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

export default function App() {
  return <AppContent />;
}
