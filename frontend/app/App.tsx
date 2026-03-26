import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router';
import { Toaster } from 'sonner';
import { ErrorBoundary }    from './components/ErrorBoundary';
import { AuthProvider }     from './context/AuthContext';
import { ProtectedRoute }   from './components/ProtectedRoute';

import HomePage           from './pages/HomePage';
import HowItWorksPage     from './pages/HowItWorksPage';
import SegmentsPage       from './pages/SegmentsPage';
import PricingPage        from './pages/PricingPage';
import LoginPage          from './pages/LoginPage';
import PrimeiroAcessoPage from './pages/PrimeiroAcessoPage';
import DashboardPage      from './pages/DashboardPage';
import ConsultasPage      from './pages/ConsultasPage';
import AppointmentsPage   from './pages/AppointmentsPage';
import ProfissionaisPage  from './pages/ProfissionaisPage';
import ConfiguracoesPage  from './pages/ConfiguracoesPage';
import PatientViewPage    from './pages/PatientViewPage';
import AdminLoginPage     from './pages/AdminLoginPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminClientesPage  from './pages/AdminClientesPage';
import AdminAssinaturasPage from './pages/AdminAssinaturasPage';
import NotFoundPage       from './pages/NotFoundPage';

const P = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute>{children}</ProtectedRoute>
);

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Toaster position="top-right" richColors closeButton
            toastOptions={{ style: { fontFamily: 'system-ui, -apple-system, sans-serif' } }} />
          <Routes>
            {/* Páginas públicas */}
            <Route path="/"              element={<HomePage />} />
            <Route path="/como-funciona" element={<HowItWorksPage />} />
            <Route path="/segmentos"     element={<SegmentsPage />} />
            <Route path="/planos"        element={<PricingPage />} />

            {/* Autenticação */}
            <Route path="/login"           element={<LoginPage />} />
            <Route path="/primeiro-acesso" element={<PrimeiroAcessoPage />} />

            {/* Acompanhamento público do paciente */}
            <Route path="/patient-view" element={<PatientViewPage />} />

            {/* Área protegida da clínica */}
            <Route path="/dashboard"     element={<P><DashboardPage /></P>} />
            <Route path="/consultas"     element={<P><ConsultasPage /></P>} />
            <Route path="/appointments"  element={<P><AppointmentsPage /></P>} />
            <Route path="/profissionais" element={<P><ProfissionaisPage /></P>} />
            <Route path="/configuracoes" element={<P><ConfiguracoesPage /></P>} />

            {/* Área administrativa */}
            <Route path="/admin/login"       element={<AdminLoginPage />} />
            <Route path="/admin/dashboard"   element={<AdminDashboardPage />} />
            <Route path="/admin/clientes"    element={<AdminClientesPage />} />
            <Route path="/admin/assinaturas" element={<AdminAssinaturasPage />} />

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}
