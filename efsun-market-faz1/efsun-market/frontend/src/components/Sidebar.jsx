import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Wallet, TrendingUp, TrendingDown, Store, LogOut, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const MENU = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/kasa', label: 'Günlük Kasa', icon: Wallet },
  { to: '/gelir', label: 'Gelir', icon: TrendingUp },
  { to: '/gider', label: 'Gider', icon: TrendingDown },
  { to: '/ayarlar', label: 'Ayarlar', icon: Settings },
];

export default function Sidebar({ acik, kapat }) {
  const { kullanici, cikisYap } = useAuth();

  return (
    <>
      {acik && <div onClick={kapat} className="fixed inset-0 bg-antrasit/30 backdrop-blur-sm z-30 lg:hidden" />}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-72 z-40 transform transition-transform duration-300
        ${acik ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 p-4`}
      >
        <div className="glass-panel h-full flex flex-col p-5">
          <div className="flex items-center gap-3 mb-8 px-1">
            <div className="w-11 h-11 rounded-xl bg-antrasit flex items-center justify-center shadow-marka-glow shrink-0">
              <Store className="text-marka-light" size={22} />
            </div>
            <div>
              <p className="font-display font-bold text-antrasit leading-tight">EFSUN Market</p>
              <p className="text-[11px] text-antrasit/45">Yönetim Sistemi</p>
            </div>
          </div>

          <nav className="flex-1 space-y-1.5">
            {MENU.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                onClick={kapat}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-marka text-white shadow-marka-glow'
                      : 'text-antrasit/70 hover:bg-white/70 hover:text-antrasit'
                  }`
                }
              >
                <Icon size={18} />
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="border-t border-antrasit/10 pt-4 mt-4">
            <div className="px-4 py-2 mb-2">
              <p className="text-sm font-semibold text-antrasit truncate">{kullanici?.adSoyad}</p>
              <p className="text-xs text-antrasit/45 truncate">{kullanici?.rol}</p>
            </div>
            <button
              onClick={cikisYap}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-antrasit/60 hover:bg-marka/10 hover:text-marka transition-all"
            >
              <LogOut size={18} />
              Çıkış Yap
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
