import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Kasa from './pages/Kasa';
import Gelir from './pages/Gelir';
import Gider from './pages/Gider';
import Ayarlar from './pages/Ayarlar';

function KorumaliRota({ children }) {
  const { kullanici, yukleniyor } = useAuth();
  if (yukleniyor) return <div className="min-h-screen flex items-center justify-center text-antrasit/50">Yükleniyor…</div>;
  if (!kullanici) return <Navigate to="/giris" replace />;
  return children;
}

function GirisRotasi() {
  const { kullanici, yukleniyor } = useAuth();
  if (yukleniyor) return <div className="min-h-screen flex items-center justify-center text-antrasit/50">Yükleniyor…</div>;
  if (kullanici) return <Navigate to="/" replace />;
  return <Login />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/giris" element={<GirisRotasi />} />
          <Route
            path="/"
            element={
              <KorumaliRota>
                <Layout />
              </KorumaliRota>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="kasa" element={<Kasa />} />
            <Route path="gelir" element={<Gelir />} />
            <Route path="gider" element={<Gider />} />
            <Route path="ayarlar" element={<Ayarlar />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
