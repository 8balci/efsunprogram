import { useState } from 'react';
import { KeyRound } from 'lucide-react';
import api from '../api/client';

export default function Ayarlar() {
  const [form, setForm] = useState({ mevcutSifre: '', yeniSifre: '', yeniSifreTekrar: '' });
  const [mesaj, setMesaj] = useState('');
  const [hata, setHata] = useState('');
  const [gonderiliyor, setGonderiliyor] = useState(false);

  async function gonder(e) {
    e.preventDefault();
    setHata(''); setMesaj('');
    if (form.yeniSifre !== form.yeniSifreTekrar) {
      setHata('Yeni şifreler eşleşmiyor.');
      return;
    }
    setGonderiliyor(true);
    try {
      const { data } = await api.post('/auth/sifre-degistir', { mevcutSifre: form.mevcutSifre, yeniSifre: form.yeniSifre });
      setMesaj(data.mesaj);
      setForm({ mevcutSifre: '', yeniSifre: '', yeniSifreTekrar: '' });
    } catch (err) {
      setHata(err.response?.data?.hata || 'Şifre güncellenemedi.');
    } finally { setGonderiliyor(false); }
  }

  return (
    <div className="max-w-lg space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-antrasit">Ayarlar</h1>
        <p className="text-antrasit/50 text-sm mt-0.5">Hesap ve güvenlik ayarlarınız</p>
      </div>

      <form onSubmit={gonder} className="glass-panel p-6 space-y-4">
        <div className="flex items-center gap-2 text-antrasit font-display font-bold">
          <KeyRound className="text-marka" size={20} /> Şifre Değiştir
        </div>
        {hata && <div className="text-sm text-marka bg-marka/10 border border-marka/20 rounded-xl px-3 py-2">{hata}</div>}
        {mesaj && <div className="text-sm text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2">{mesaj}</div>}
        <div>
          <label className="label-field">Mevcut Şifre</label>
          <input type="password" required value={form.mevcutSifre} onChange={(e) => setForm({ ...form, mevcutSifre: e.target.value })} className="input-field" />
        </div>
        <div>
          <label className="label-field">Yeni Şifre</label>
          <input type="password" required minLength={6} value={form.yeniSifre} onChange={(e) => setForm({ ...form, yeniSifre: e.target.value })} className="input-field" />
        </div>
        <div>
          <label className="label-field">Yeni Şifre (Tekrar)</label>
          <input type="password" required minLength={6} value={form.yeniSifreTekrar} onChange={(e) => setForm({ ...form, yeniSifreTekrar: e.target.value })} className="input-field" />
        </div>
        <button type="submit" disabled={gonderiliyor} className="btn-marka w-full">
          {gonderiliyor ? 'Güncelleniyor…' : 'Şifreyi Güncelle'}
        </button>
      </form>
    </div>
  );
}
