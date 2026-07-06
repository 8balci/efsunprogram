import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [kullanici, setKullanici] = useState(null);
  const [yukleniyor, setYukleniyor] = useState(true);

  const oturumuYukle = useCallback(async () => {
    const token = localStorage.getItem('efsun_token') || sessionStorage.getItem('efsun_token');
    if (!token) {
      setYukleniyor(false);
      return;
    }
    try {
      const { data } = await api.get('/auth/me');
      setKullanici(data);
    } catch {
      localStorage.removeItem('efsun_token');
      sessionStorage.removeItem('efsun_token');
    } finally {
      setYukleniyor(false);
    }
  }, []);

  useEffect(() => { oturumuYukle(); }, [oturumuYukle]);

  async function girisYap(email, sifre, beniHatirla) {
    const { data } = await api.post('/auth/login', { email, sifre, beniHatirla });
    if (beniHatirla) localStorage.setItem('efsun_token', data.token);
    else sessionStorage.setItem('efsun_token', data.token);
    setKullanici(data.kullanici);
    return data;
  }

  async function cikisYap() {
    try { await api.post('/auth/cikis'); } catch { /* sessizce devam */ }
    localStorage.removeItem('efsun_token');
    sessionStorage.removeItem('efsun_token');
    setKullanici(null);
  }

  return (
    <AuthContext.Provider value={{ kullanici, yukleniyor, girisYap, cikisYap }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth, AuthProvider içinde kullanılmalıdır.');
  return ctx;
}
