import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, Eye, EyeOff, Store } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { girisYap } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [sifre, setSifre] = useState('');
  const [sifreGoster, setSifreGoster] = useState(false);
  const [beniHatirla, setBeniHatirla] = useState(true);
  const [hata, setHata] = useState('');
  const [gonderiliyor, setGonderiliyor] = useState(false);

  async function gonder(e) {
    e.preventDefault();
    setHata('');
    setGonderiliyor(true);
    try {
      await girisYap(email, sifre, beniHatirla);
      navigate('/');
    } catch (err) {
      setHata(err.response?.data?.hata || 'Giriş yapılamadı. Bilgilerinizi kontrol edin.');
    } finally {
      setGonderiliyor(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-marka/20 rounded-full blur-3xl" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-antrasit/10 rounded-full blur-3xl" />

      <div className="w-full max-w-md animate-fadeUp">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-antrasit flex items-center justify-center shadow-marka-glow mb-4">
            <Store className="text-marka-light" size={30} />
          </div>
          <h1 className="font-display text-2xl font-bold text-antrasit">EFSUN Market</h1>
          <p className="text-antrasit/50 text-sm mt-1">Finans, Kasa, Veresiye ve Stok Yönetimi</p>
        </div>

        <form onSubmit={gonder} className="glass-panel p-8 space-y-5">
          <div>
            <label className="label-field">E-posta</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-antrasit/40" size={18} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@efsunmarket.com"
                className="input-field pl-10"
              />
            </div>
          </div>

          <div>
            <label className="label-field">Şifre</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-antrasit/40" size={18} />
              <input
                type={sifreGoster ? 'text' : 'password'}
                required
                value={sifre}
                onChange={(e) => setSifre(e.target.value)}
                placeholder="••••••••"
                className="input-field pl-10 pr-10"
              />
              <button
                type="button"
                onClick={() => setSifreGoster((v) => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-antrasit/40 hover:text-antrasit"
              >
                {sifreGoster ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-antrasit/70 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={beniHatirla}
              onChange={(e) => setBeniHatirla(e.target.checked)}
              className="w-4 h-4 rounded accent-marka"
            />
            Beni hatırla, oturumu açık tut
          </label>

          {hata && (
            <div className="text-sm text-marka bg-marka/10 border border-marka/20 rounded-xl px-4 py-2.5">
              {hata}
            </div>
          )}

          <button type="submit" disabled={gonderiliyor} className="btn-marka w-full">
            {gonderiliyor ? 'Giriş yapılıyor…' : 'Giriş Yap'}
          </button>
        </form>

        <p className="text-center text-xs text-antrasit/40 mt-6">
          EFSUN Market Yönetim Sistemi © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
