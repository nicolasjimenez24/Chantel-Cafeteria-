import { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AppProvider, useApp } from "@/state/AppContext";
import { AuthProvider, useAuth } from "@/state/AuthContext";
import { LoginPage } from "@/pages/LoginPage";
import { Header } from "@/components/Header";
import { FranjaTitulo } from "@/components/FranjaTitulo";
import { InfoModal } from "@/components/InfoModal";
import { Toast } from "@/components/Toast";
import { CalculadoraPage } from "@/pages/CalculadoraPage";
import { ResultadosPage } from "@/pages/ResultadosPage";
import { AdministracionPage } from "@/pages/AdministracionPage";
import { HistorialPage } from "@/pages/HistorialPage";
import { BodegaPage } from "@/pages/BodegaPage";

function Shell() {
  const { toast, cerrarToast } = useApp();
  const { esAdmin } = useAuth();
  const [showInfo, setShowInfo] = useState(false);

  return (
    <div className="min-h-screen bg-paper text-ink">
      <Header onShowInfo={() => setShowInfo(true)} />
      <FranjaTitulo />
      <main className="max-w-6xl mx-auto px-5 md:px-8 pt-7">
        <Routes>
          <Route path="/" element={<CalculadoraPage />} />
          <Route path="/resultados" element={<ResultadosPage />} />
          <Route path="/bodega" element={<BodegaPage />} />
          <Route
            path="/administracion"
            element={esAdmin ? <AdministracionPage /> : <Navigate to="/" replace />}
          />
          <Route path="/historial" element={<HistorialPage />} />
        </Routes>
      </main>
      {showInfo && <InfoModal onClose={() => setShowInfo(false)} />}
      {toast && <Toast message={toast} onDone={cerrarToast} />}
    </div>
  );
}

// Los datos de la app solo se piden una vez iniciada la sesión; al cerrar sesión
// el AppProvider se desmonta y no queda nada del usuario anterior en memoria.
function Acceso() {
  const { usuario, verificando } = useAuth();
  if (verificando) return <div className="min-h-screen bg-paper" />;
  if (!usuario) return <LoginPage />;
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Acceso />
    </AuthProvider>
  );
}
