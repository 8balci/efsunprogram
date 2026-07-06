import { useEffect, useState, useCallback } from 'react';
import { Plus, Trash2, TrendingUp } from 'lucide-react';
import api from '../api/client';

const tlFormat = new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' });
const ODEME_TURLERI = [
  { deger: 'NAKIT', etiket: 'Nakit' }, { deger: 'KART', etiket: 'Kart' },
  { deger: 'HAVALE', etiket: 'Havale' }, { deger: 'FAST', etiket: 'FAST' },
  { deger: 'QR', etiket: 'QR' }, { deger: 'DIGER', etiket: 'Diğer' },
];
const KATEGORI_ONERILERI = ['Satış Geliri', 'Diğer Gelir', 'Nakit Girişi', 'İade'];

function bugun() { return new Date().toISOString().slice(0, 10); }

export default function Gelir() {
  const [kayitlar, setKayitlar] = useState([]);
  const [toplamTutar, setToplamTutar] = useState(0);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState('');
  const [form, setForm] = useState({ tarih: bugun(), tutar: '', kategori: 'Satış Geliri', aciklama: '', odemeTuru: 'NAKIT' });
  const [gonderiliyor, setGonderiliyor] = useState(false);

  const yukle = useCallback(async () => {
    setYukleniyor(true);
    try {
      const { data } = await api.get('/gelir', { params: { adet: 100 } });
      setKayitlar(data.kayitlar);
      setToplamTutar(data.toplamTutar);
    } finally { setYukleniyor(false); }
  }, []);

  useEffect(() => { yukle(); }, [yukle]);

  async function ekle(e) {
    e.preventDefault();
    setHata(''); setGonderiliyor(true);
    try {
      await api.post('/gelir', { ...form, tutar: parseFloat(form.tutar) });
      setForm({ tarih: bugun(), tutar: '', kategori: 'Satış Geliri', aciklama: '', odemeTuru: 'NAKIT' });
      await yukle();
    } catch (err) {
      setHata(err.response?.data?.hata || 'Gelir eklenemedi.');
    } finally { setGonderiliyor(false); }
  }

  async function sil(id) {
    if (!confirm('Bu gelir kaydını silmek istediğinize emin misiniz?')) return;
    await api.delete(`/gelir/${id}`);
    await yukle();
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-antrasit">Gelir Yönetimi</h1>
          <p className="text-antrasit/50 text-sm mt-0.5">Tüm gelir kayıtlarınızı buradan yönetin</p>
        </div>
        <div className="glass-card px-5 py-3">
          <p className="text-xs text-antrasit/50 uppercase tracking-wide">Listelenen Toplam</p>
          <p className="font-mono font-bold text-emerald-600 text-lg">{tlFormat.format(toplamTutar)}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <form onSubmit={ekle} className="glass-panel p-6 space-y-4 lg:col-span-1 h-fit">
          <div className="flex items-center gap-2 text-antrasit font-display font-bold">
            <Plus className="text-marka" size={20} /> Yeni Gelir Ekle
          </div>
          {hata && <div className="text-sm text-marka bg-marka/10 border border-marka/20 rounded-xl px-3 py-2">{hata}</div>}
          <div>
            <label className="label-field">Tarih</label>
            <input type="date" required value={form.tarih} onChange={(e) => setForm({ ...form, tarih: e.target.value })} className="input-field" />
          </div>
          <div>
            <label className="label-field">Tutar (₺)</label>
            <input type="number" step="0.01" min="0" required value={form.tutar} onChange={(e) => setForm({ ...form, tutar: e.target.value })} className="input-field" placeholder="0.00" />
          </div>
          <div>
            <label className="label-field">Kategori</label>
            <input list="kategori-onerileri" required value={form.kategori} onChange={(e) => setForm({ ...form, kategori: e.target.value })} className="input-field" />
            <datalist id="kategori-onerileri">
              {KATEGORI_ONERILERI.map((k) => <option key={k} value={k} />)}
            </datalist>
          </div>
          <div>
            <label className="label-field">Ödeme Türü</label>
            <select value={form.odemeTuru} onChange={(e) => setForm({ ...form, odemeTuru: e.target.value })} className="input-field">
              {ODEME_TURLERI.map((o) => <option key={o.deger} value={o.deger}>{o.etiket}</option>)}
            </select>
          </div>
          <div>
            <label className="label-field">Açıklama</label>
            <textarea value={form.aciklama} onChange={(e) => setForm({ ...form, aciklama: e.target.value })} className="input-field" rows={2} />
          </div>
          <button type="submit" disabled={gonderiliyor} className="btn-marka w-full">
            {gonderiliyor ? 'Ekleniyor…' : 'Geliri Kaydet'}
          </button>
        </form>

        <div className="glass-card p-6 lg:col-span-2">
          <h3 className="font-display font-bold text-antrasit mb-4 flex items-center gap-2"><TrendingUp size={18} className="text-marka" /> Gelir Kayıtları</h3>
          {yukleniyor ? (
            <p className="text-antrasit/40 py-8 text-center text-sm">Yükleniyor…</p>
          ) : kayitlar.length === 0 ? (
            <p className="text-antrasit/40 py-8 text-center text-sm">Henüz gelir kaydı yok.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-antrasit/50 border-b border-antrasit/10">
                    <th className="py-2 pr-3 font-medium">Tarih</th>
                    <th className="py-2 pr-3 font-medium">Kategori</th>
                    <th className="py-2 pr-3 font-medium">Ödeme</th>
                    <th className="py-2 pr-3 font-medium text-right">Tutar</th>
                    <th className="py-2 pr-2 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {kayitlar.map((g) => (
                    <tr key={g.id} className="border-b border-antrasit/5 last:border-0 hover:bg-white/40">
                      <td className="py-2.5 pr-3 whitespace-nowrap">{new Date(g.tarih).toLocaleDateString('tr-TR')}</td>
                      <td className="py-2.5 pr-3">{g.kategori}</td>
                      <td className="py-2.5 pr-3 text-antrasit/50">{ODEME_TURLERI.find((o) => o.deger === g.odemeTuru)?.etiket}</td>
                      <td className="py-2.5 pr-3 text-right font-mono font-semibold text-emerald-600 whitespace-nowrap">{tlFormat.format(g.tutar)}</td>
                      <td className="py-2.5 pr-2 text-right">
                        <button onClick={() => sil(g.id)} className="text-antrasit/30 hover:text-marka p-1"><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
