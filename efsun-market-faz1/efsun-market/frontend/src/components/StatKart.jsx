const tlFormat = new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 });

export default function StatKart({ baslik, deger, icon: Icon, renk = 'antrasit', tip = 'para', altYazi, hazir = true }) {
  const gosterilenDeger = tip === 'para' ? tlFormat.format(deger || 0) : (deger ?? 0);

  const renkler = {
    antrasit: 'text-antrasit bg-antrasit/10',
    marka: 'text-marka bg-marka/10',
    yesil: 'text-emerald-600 bg-emerald-500/10',
    kirmizi: 'text-rose-600 bg-rose-500/10',
  };

  return (
    <div className="glass-card p-5 relative overflow-hidden">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-antrasit/50 uppercase tracking-wide truncate">{baslik}</p>
          <p className={`font-display text-2xl font-bold mt-1.5 truncate ${!hazir ? 'text-antrasit/30' : 'text-antrasit'}`}>
            {hazir ? gosterilenDeger : '—'}
          </p>
          {altYazi && <p className="text-xs text-antrasit/40 mt-1">{altYazi}</p>}
          {!hazir && <p className="text-[11px] text-marka/70 font-medium mt-1">Sonraki fazda aktif olacak</p>}
        </div>
        {Icon && (
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${renkler[renk]}`}>
            <Icon size={20} />
          </div>
        )}
      </div>
    </div>
  );
}
