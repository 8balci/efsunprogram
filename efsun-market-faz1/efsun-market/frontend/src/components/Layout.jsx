import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';

export default function Layout() {
  const [menuAcik, setMenuAcik] = useState(false);

  return (
    <div className="min-h-screen flex">
      <Sidebar acik={menuAcik} kapat={() => setMenuAcik(false)} />

      <div className="flex-1 min-w-0">
        <header className="lg:hidden sticky top-0 z-20 p-4">
          <div className="glass-panel flex items-center justify-between px-4 py-3">
            <span className="font-display font-bold text-antrasit">EFSUN Market</span>
            <button onClick={() => setMenuAcik(true)} className="p-2 rounded-lg hover:bg-white/70">
              <Menu size={22} />
            </button>
          </div>
        </header>

        <main className="p-4 lg:p-8 max-w-[1600px] mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
