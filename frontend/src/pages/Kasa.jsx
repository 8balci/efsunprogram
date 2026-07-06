import { useEffect, useState, useCallback } from 'react';
import { Wallet, Lock, Unlock, Clock3 } from 'lucide-react';
import api from '../api/client';

const tlFormat = new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' });

export default function Kasa() {
  const [kasa, setKasa] = useState(undefined); // undefined = yukleniyor, null = bugun acilmamis
  const [acilisTutari, setAcilisTutari] = useState('');
  const [acilisNot, setAcilisNot] = useState('');
  const [sayilanKasa, setSayilanKasa] = useState('');
  const [kapanisNot, setKapanisNot] = useState('');
  const [islemYapiliyor, setIslemYapiliyor] = useState(false);
  const [hata, setHata] = useState('');
  const [gecmis, setGecmis] = useState([]);

  const yukle = useCallback(async () => {
    const [{ data: bugunData }, { data: gecmisData }] = await Promise.all([
      api.get('/kasa/bugun'),
      api.get('/kasa?adet=10'),
    ]);
    setKasa(bugunData);
    setGecmis(gecmisData.kayitlar.filter((k) => k.id !== bugunData?.id));
  }, []);

  useEffect(() => { yukle(); }, [yukle]);

  async function kasaAc(e) {
    e.preventDefault();
    setHata(''); setIslemYapiliyor(true);
    try {
      await api.post('/kasa/ac', { acilisTutari: parseFloat(acilisTutari), not: acilisNot });
      setAcilisTutari(''); setAcilisNot('');
      await yukle();
    } catch (err) {
      setHata(err.response?.data?.hata || 'Kasa açılamadı.');
    } finally { setIslemYapiliyor(false); }
  }

  async function kasaKapat(e) {
    e.preventDefault();
    setHata(''); setIslemYapiliyor(true);
    try {
      await api.post(`/kasa/${kasa.id}/kapat`, { sayilanGercekKasa: parseFloat(sayilanKasa), not: kapanisNot });
      setSayilanKasa(''); setKapanisNot('');
      await yukle();
    } catch (err) {
      setHata(err.response?.data?.hata || 'Kasa kapatılamadı.');
    } finally { setIslemYapiliyor(false); }
  }

  if (kasa === undefined) return <div className="text-antrasit/50 py-20 text-center">Yükleniyor…</div>;

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="font-display text-2xl font-bold text-antrasit">Günlük Kasa</h1>
        <p className="text-antrasit/50 text-sm mt-0.5">Kasa açılışı, kapanışı ve fark hesaplaması</p>
      </div>

      {hata && <div className="text-sm text-marka bg-marka/10 border border-marka/20 rounded-xl px-4 py-2.5">{hata}</div>}

      {!kasa && (
        <form onSubmit={kasaAc} className="glass-panel p-6 space-y-4 max-w-lg">
          <div className="flex items-center gap-2 text-antrasit font-display font-bold text-lg">
            <Unlock className="text-marka" size={20} /> Kasa Aç
          </div>
          <div>
            <label className="label-field">Açılış Tutarı (₺)</label>
            <input type="number" step="0.01" min="0" required value={acilisTutari}
              onChange={(e) => setAcilisTutari(e.target.value)} className="input-field" placeholder="0.00" />
          </div>
          <div>
            <label className="label-field">Not (opsiyonel)</label>
            <textarea value={acilisNot} onChange={(e) => setAcilisNot(e.target.value)} className="input-field" rows={2} />
          </div>
          <button type="submit" disabled={islemYapiliyor} className="btn-marka w-full">
            {islemYapiliyor ? 'Açılıyor…' : 'Kasa Açıldı'}
          </button>
        </form>
      )}

      {kasa && (
        <div className="glass-card p-6 space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 text-antrasit font-display font-bold text-lg">
              <Wallet className="text-marka" size={20} />
              {new Date(kasa.tarih).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })}
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${kasa.durum === 'ACIK' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-antrasit/10 text-antrasit/60'}`}>
              {kasa.durum === 'ACIK' ? 'Açık' : 'Kapalı'}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono">
            <MiniIstatistik etiket="Açılış" deger={kasa.acilisTutari} />
            <MiniIstatistik etiket="Gelir" deger={kasa.toplamGelir ?? '—'} pozitif />
            <MiniIstatistik etiket="Gider" deger={kasa.toplamGider ?? '—'} negatif />
            <MiniIstatistik etiket="Beklenen Kasa" deger={kasa.beklenenKasa ?? '—'} vurgu />
          </div>

          {kasa.durum === 'ACIK' ? (
            <form onSubmit={kasaKapat} className="border-t border-antrasit/10 pt-6 space-y-4 max-w-lg">
              <div className="flex items-center gap-2 text-antrasit font-semibold">
                <Lock className="text-marka" size={18} /> Kasa Kapat
              </div>
              <div>
                <label className="label-field">Sayılan Gerçek Kasa (₺)</label>
                <input type="number" step="0.01" min="0" required value={sayilanKasa}
                  onChange={(e) => setSayilanKasa(e.target.value)} className="input-field" placeholder="0.00" />
              </div>
              <div>
                <label className="label-field">Not (opsiyonel)</label>
                <textarea value={kapanisNot} onChange={(e) => setKapanisNot(e.target.value)} className="input-field" rows={2} />
              </div>
              <button type="submit" disabled={islemYapiliyor} className="btn-marka w-full">
                {islemYapiliyor ? 'Kapatılıyor…' : 'Kasa Kapat'}
              </button>
            </form>
          ) : (
            <div className="border-t border-antrasit/10 pt-6 flex items-center gap-6 flex-wrap">
              <MiniIstatistik etiket="Sayılan Gerçek Kasa" deger={kasa.sayilanGercekKasa} />
              <div className={`px-4 py-2 rounded-xl font-mono font-semibold ${Number(kasa.kasaFarki) < 0 ? 'bg-rose-500/10 text-rose-600' : 'bg-emerald-500/10 text-emerald-600'}`}>
                Kasa Farkı: {Number(kasa.kasaFarki) >= 0 ? '+' : ''}{tlFormat.format(kasa.kasaFarki)}
              </div>
            </div>
          )}
        </div>
      )}

      {gecmis.length > 0 && (
        <div className="glass-card p-6">
          <h3 className="font-display font-bold text-antrasit mb-4 flex items-center gap-2"><Clock3 size={18} className="text-marka" /> Geçmiş Kasa Kayıtları</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-antrasit/50 border-b border-antrasit/10">
                  <th className="py-2 pr-4 font-medium">Tarih</th>
                  <th className="py-2 pr-4 font-medium">Açılış</th>
                  <th className="py-2 pr-4 font-medium">Beklenen</th>
                  <th className="py-2 pr-4 font-medium">Sayılan</th>
                  <th className="py-2 pr-4 font-medium">Fark</th>
                </tr>
              </thead>
              <tbody className="font-mono">
                {gecmis.map((k) => (
                  <tr key={k.id} className="border-b border-antrasit/5 last:border-0">
                    <td className="py-2.5 pr-4">{new Date(k.tarih).toLocaleDateString('tr-TR')}</td>
                    <td className="py-2.5 pr-4">{tlFormat.format(k.acilisTutari)}</td>
                    <td className="py-2.5 pr-4">{k.beklenenKasa ? tlFormat.format(k.beklenenKasa) : '—'}</td>
                    <td className="py-2.5 pr-4">{k.sayilanGercekKasa ? tlFormat.format(k.sayilanGercekKasa) : '—'}</td>
                    <td className={`py-2.5 pr-4 font-semibold ${Number(k.kasaFarki) < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {k.kasaFarki !== null ? tlFormat.format(k.kasaFarki) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function MiniIstatistik({ etiket, deger, pozitif, negatif, vurgu }) {
  const renk = vurgu ? 'text-marka' : negatif ? 'text-rose-600' : pozitif ? 'text-emerald-600' : 'text-antrasit';
  return (
    <div>
      <p className="text-xs text-antrasit/50 uppercase tracking-wide mb-1">{etiket}</p>
      <p className={`font-semibold text-lg ${renk}`}>{typeof deger === 'number' ? tlFormat.format(deger) : deger}</p>
    </div>
  );
}
