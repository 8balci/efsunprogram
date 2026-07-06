import { useEffect, useState, useCallback } from 'react';
import { Plus, Trash2, TrendingDown, Paperclip } from 'lucide-react';
import api from '../api/client';

const tlFormat = new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' });
const ODEME_TURLERI = [
  { deger: 'NAKIT', etiket: 'Nakit' }, { deger: 'KART', etiket: 'Kart' },
  { deger: 'HAVALE', etiket: 'Havale' }, { deger: 'FAST', etiket: 'FAST' },
  { deger: 'QR', etiket: 'QR' }, { deger: 'DIGER', etiket: 'Diğer' },
];

function bugun() { return new Date().toISOString().slice(0, 10); }

export default function Gider() {
  const [kategoriler, setKategoriler] = useState([]);
  const [kayitlar, setKayitlar] = useState([]);
  const [toplamTutar, setToplamTutar] = useState(0);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState('');
  const [form, setForm] = useState({ tarih: bugun(), tutar: '', kategoriId: '', aciklama: '', odemeTuru: 'NAKIT' });
  const [belge, setBelge] = useState(null);
  const [gonderiliyor, setGonderiliyor] = useState(false);

  const yukle = useCallback(async () => {
    setYukleniyor(true);
    try {
      const [{ data: kategoriData }, { data: giderData }] = await Promise.all([
        api.get('/gider/kategoriler'),
        api.get('/gider', { params: { adet: 100 } }),
      ]);
      setKategoriler(kategoriData);
      setKayitlar(giderData.kayitlar);
      setToplamTutar(giderData.toplamTutar);
      setForm((f) => ({ ...f, kategoriId: f.kategoriId || kategoriData[0]?.id || '' }));
    } finally { setYukleniyor(false); }
  }, []);

  useEffect(() => { yukle(); }, [yukle]);

  async function ekle(e) {
    e.preventDefault();
    setHata(''); setGonderiliyor(true);
    try {
      const veri = new FormData();
      Object.entries(form).forEach(([k, v]) => veri.append(k, v));
      if (belge) veri.append('belge', belge);
      await api.post('/gider', veri, { headers: { 'Content-Type': 'multipart/form-data' } });
      setForm({ tarih: bugun(), tutar: '', kategoriId: kategoriler[0]?.id || '', aciklama: '', odemeTuru: 'NAKIT' });
      setBelge(null);
      await yukle();
    } catch (err) {
      setHata(err.response?.data?.hata || 'Gider eklenemedi.');
    } finally { setGonderiliyor(false); }
  }

  async function sil(id) {
    if (!confirm('Bu gider kaydını silmek istediğinize emin misiniz?')) return;
    await api.delete(`/gider/${id}`);
    await yukle();
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-antrasit">Gider Yönetimi</h1>
          <p className="text-antrasit/50 text-sm mt-0.5">Tüm gider kayıtlarınızı buradan yönetin</p>
        </div>
        <div className="glass-card px-5 py-3">
          <p className="text-xs text-antrasit/50 uppercase tracking-wide">Listelenen Toplam</p>
          <p className="font-mono font-bold text-rose-600 text-lg">{tlFormat.format(toplamTutar)}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <form onSubmit={ekle} className="glass-panel p-6 space-y-4 lg:col-span-1 h-fit">
          <div className="flex items-center gap-2 text-antrasit font-display font-bold">
            <Plus className="text-marka" size={20} /> Yeni Gider Ekle
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
            <select required value={form.kategoriId} onChange={(e) => setForm({ ...form, kategoriId: e.target.value })} className="input-field">
              {kategoriler.map((k) => <option key={k.id} value={k.id}>{k.ad}</option>)}
            </select>
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
          <div>
            <label className="label-field">Fiş / Fatura (JPG, PNG, PDF)</label>
            <label className="input-field flex items-center gap-2 cursor-pointer text-antrasit/60">
              <Paperclip size={16} />
              <span className="truncate">{belge ? belge.name : 'Dosya seçin'}</span>
              <input type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => setBelge(e.target.files[0] || null)} />
            </label>
          </div>
          <button type="submit" disabled={gonderiliyor} className="btn-marka w-full">
            {gonderiliyor ? 'Ekleniyor…' : 'Gideri Kaydet'}
          </button>
        </form>

        <div className="glass-card p-6 lg:col-span-2">
          <h3 className="font-display font-bold text-antrasit mb-4 flex items-center gap-2"><TrendingDown size={18} className="text-marka" /> Gider Kayıtları</h3>
          {yukleniyor ? (
            <p className="text-antrasit/40 py-8 text-center text-sm">Yükleniyor…</p>
          ) : kayitlar.length === 0 ? (
            <p className="text-antrasit/40 py-8 text-center text-sm">Henüz gider kaydı yok.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-antrasit/50 border-b border-antrasit/10">
                    <th className="py-2 pr-3 font-medium">Tarih</th>
                    <th className="py-2 pr-3 font-medium">Kategori</th>
                    <th className="py-2 pr-3 font-medium">Belge</th>
                    <th className="py-2 pr-3 font-medium text-right">Tutar</th>
                    <th className="py-2 pr-2 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {kayitlar.map((g) => (
                    <tr key={g.id} className="border-b border-antrasit/5 last:border-0 hover:bg-white/40">
                      <td className="py-2.5 pr-3 whitespace-nowrap">{new Date(g.tarih).toLocaleDateString('tr-TR')}</td>
                      <td className="py-2.5 pr-3">{g.kategori?.ad}</td>
                      <td className="py-2.5 pr-3">
                        {g.belgeUrl ? (
                          <a href={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:4000'}${g.belgeUrl}`} target="_blank" rel="noreferrer" className="text-marka hover:underline text-xs font-medium">Görüntüle</a>
                        ) : <span className="text-antrasit/30 text-xs">—</span>}
                      </td>
                      <td className="py-2.5 pr-3 text-right font-mono font-semibold text-rose-600 whitespace-nowrap">{tlFormat.format(g.tutar)}</td>
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
