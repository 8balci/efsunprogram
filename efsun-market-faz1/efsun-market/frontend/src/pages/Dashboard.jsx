import { useEffect, useState, useCallback } from 'react';
import {
  Wallet, TrendingUp, TrendingDown, PiggyBank, CalendarDays,
  Users, Package, AlertTriangle, ShoppingCart, Clock, RefreshCw,
} from 'lucide-react';
import api from '../api/client';
import StatKart from '../components/StatKart';

const tlFormat = new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 });
const tarihFormat = (t) => new Date(t).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' });
const saatFormat = (t) => new Date(t).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

export default function Dashboard() {
  const [veri, setVeri] = useState(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState('');

  const yukle = useCallback(async () => {
    setYukleniyor(true);
    try {
      const { data } = await api.get('/dashboard');
      setVeri(data);
      setHata('');
    } catch {
      setHata('Veriler yüklenemedi. Bağlantınızı kontrol edin.');
    } finally {
      setYukleniyor(false);
    }
  }, []);

  useEffect(() => { yukle(); }, [yukle]);

  if (yukleniyor && !veri) {
    return <div className="text-antrasit/50 py-20 text-center">Yükleniyor…</div>;
  }
  if (hata && !veri) {
    return <div className="text-marka py-20 text-center">{hata}</div>;
  }

  const kasaBaslikDurum = { ACIK: 'Kasa Açık', KAPALI: 'Kasa Kapalı', YOK: 'Bugün Henüz Açılmadı' }[veri.kasa.durum];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-antrasit">Dashboard</h1>
          <p className="text-antrasit/50 text-sm mt-0.5">Canlı finans ve kasa özeti</p>
        </div>
        <button onClick={yukle} className="btn-ghost flex items-center gap-2 text-sm">
          <RefreshCw size={16} className={yukleniyor ? 'animate-spin' : ''} />
          Yenile
        </button>
      </div>

      {/* Kasa durum banner - imza ogesi */}
      <div className="glass-card p-6 flex items-center justify-between flex-wrap gap-4 relative">
        <div className="flex items-center gap-4">
          <div className={`w-3 h-3 rounded-full ${veri.kasa.durum === 'ACIK' ? 'bg-emerald-500 animate-pulseRing' : 'bg-antrasit/30'}`} />
          <div>
            <p className="font-display text-lg font-bold text-antrasit">{kasaBaslikDurum}</p>
            <p className="text-sm text-antrasit/50">Güncel kasa nakiti: <span className="font-mono font-semibold text-antrasit">{tlFormat.format(veri.kasa.guncelNakit)}</span></p>
          </div>
        </div>
        {veri.kasa.kasaFarki !== null && (
          <div className={`px-4 py-2 rounded-xl font-mono font-semibold text-sm ${veri.kasa.kasaFarki < 0 ? 'bg-rose-500/10 text-rose-600' : 'bg-emerald-500/10 text-emerald-600'}`}>
            Kasa Farkı: {veri.kasa.kasaFarki >= 0 ? '+' : ''}{tlFormat.format(veri.kasa.kasaFarki)}
          </div>
        )}
      </div>

      <section>
        <h2 className="text-sm font-semibold text-antrasit/50 uppercase tracking-wide mb-3">Bugün</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatKart baslik="Bugünkü Kasa (Açılış)" deger={veri.kasa.acilisTutari} icon={Wallet} renk="antrasit" />
          <StatKart baslik="Bugünkü Gelir" deger={veri.bugun.gelir} icon={TrendingUp} renk="yesil" />
          <StatKart baslik="Bugünkü Gider" deger={veri.bugun.gider} icon={TrendingDown} renk="kirmizi" />
          <StatKart baslik="Bugünkü Net Kâr" deger={veri.bugun.netKar} icon={PiggyBank} renk="marka" />
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-antrasit/50 uppercase tracking-wide mb-3">Bu Ay</h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatKart baslik="Bu Ay Gelir" deger={veri.buAy.gelir} icon={TrendingUp} renk="yesil" />
          <StatKart baslik="Bu Ay Gider" deger={veri.buAy.gider} icon={TrendingDown} renk="kirmizi" />
          <StatKart baslik="Bu Ay Net Kâr" deger={veri.buAy.netKar} icon={PiggyBank} renk="marka" />
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-antrasit/50 uppercase tracking-wide mb-3">Diğer Göstergeler</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatKart baslik="Toplam Veresiye" deger={veri.veresiye.toplamBorc} icon={Users} renk="marka" hazir={veri.veresiye.hazir} />
          <StatKart baslik="Tahsil Edilecek" deger={veri.veresiye.tahsilEdilecek} icon={Wallet} renk="marka" hazir={veri.veresiye.hazir} />
          <StatKart baslik="Toplam Ürün" deger={veri.stok.toplamUrun} tip="adet" icon={Package} renk="antrasit" hazir={veri.stok.hazir} />
          <StatKart baslik="Azalan Stok" deger={veri.stok.azalanStokSayisi} tip="adet" icon={AlertTriangle} renk="kirmizi" hazir={veri.stok.hazir} />
          <StatKart baslik="Bugünkü Satış Sayısı" deger={veri.satis.bugunkuSatisSayisi} tip="adet" icon={ShoppingCart} renk="antrasit" hazir={veri.satis.hazir} />
          <StatKart baslik="Toplam Müşteri" deger={veri.satis.toplamMusteri} tip="adet" icon={Users} renk="antrasit" hazir={veri.satis.hazir} />
          <StatKart baslik="Yaklaşan Ödemeler" deger={veri.yaklasanOdemeler.adet} tip="adet" icon={CalendarDays} renk="marka" hazir={veri.yaklasanOdemeler.hazir} />
        </div>
      </section>

      <section className="grid lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h3 className="font-display font-bold text-antrasit mb-4 flex items-center gap-2"><Clock size={18} className="text-marka" /> Son İşlemler</h3>
          <div className="space-y-1">
            {veri.sonIslemler.length === 0 && <p className="text-sm text-antrasit/40 py-4">Henüz işlem bulunmuyor.</p>}
            {veri.sonIslemler.map((i) => (
              <div key={`${i.tip}-${i.id}`} className="flex items-center justify-between py-2.5 border-b border-antrasit/5 last:border-0">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-antrasit truncate">{i.aciklama || (i.tip === 'GELIR' ? 'Gelir' : 'Gider')}</p>
                  <p className="text-xs text-antrasit/40">{tarihFormat(i.tarih)} · {saatFormat(i.saat)} · {i.ekleyen}</p>
                </div>
                <span className={`font-mono text-sm font-semibold shrink-0 ml-3 ${i.tip === 'GELIR' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {i.tip === 'GELIR' ? '+' : '−'}{tlFormat.format(i.tutar)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="font-display font-bold text-antrasit mb-4 flex items-center gap-2"><TrendingDown size={18} className="text-marka" /> Son Giderler</h3>
          <div className="space-y-1">
            {veri.sonGiderler.length === 0 && <p className="text-sm text-antrasit/40 py-4">Henüz gider bulunmuyor.</p>}
            {veri.sonGiderler.map((g) => (
              <div key={g.id} className="flex items-center justify-between py-2.5 border-b border-antrasit/5 last:border-0">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-antrasit truncate">{g.kategori}</p>
                  <p className="text-xs text-antrasit/40">{tarihFormat(g.tarih)}</p>
                </div>
                <span className="font-mono text-sm font-semibold text-rose-600 shrink-0 ml-3">{tlFormat.format(g.tutar)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
