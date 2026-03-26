import React, { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { Activity, BarChart3, Calendar, LogOut, Menu, Settings, Users, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { href: '/dashboard',    label: 'Dashboard',    icon: Activity },
  { href: '/consultas',    label: 'Consultas',    icon: Calendar },
  { href: '/appointments',  label: 'Atendimentos',  icon: BarChart3 },
  { href: '/profissionais',  label: 'Profissionais', icon: Users },
  { href: '/configuracoes',  label: 'Configurações',  icon: Settings },
];

// ─── NavLinks definido FORA do InstitutionLayout ──────────────────────────────
// Crítico: definir dentro do componente cria uma nova referência de função a cada
// render, causando unmount/remount desnecessário de todos os links.
interface NavLinksProps { pathname: string; onClick?: () => void; }

function NavLinks({ pathname, onClick }: NavLinksProps) {
  return (
    <>
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link key={href} to={href} onClick={onClick}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
              ${active
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}>
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </Link>
        );
      })}
    </>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────
export function InstitutionLayout({ children }: { children: ReactNode }) {
  const loc           = useLocation();
  const { logout }    = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-200 fixed h-full z-10">
        <div className="p-6 border-b border-gray-100">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
              style={{ backgroundColor: 'var(--hf-primary)' }}>
              <Activity className="w-5 h-5" />
            </div>
            <span className="font-bold text-gray-900">HealthFlow</span>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <NavLinks pathname={loc.pathname} />
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button onClick={logout}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors">
            <LogOut className="w-4 h-4" /> Sair
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-gray-200 z-20 flex items-center justify-between px-4">
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white"
            style={{ backgroundColor: 'var(--hf-primary)' }}>
            <Activity className="w-4 h-4" />
          </div>
          <span className="font-bold text-gray-900 text-sm">HealthFlow</span>
        </Link>
        <button onClick={() => setOpen(!open)} className="p-2 rounded-lg hover:bg-gray-100">
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-10 bg-black/20" onClick={() => setOpen(false)}>
          <aside className="absolute left-0 top-14 bottom-0 w-64 bg-white border-r border-gray-200"
            onClick={(e) => e.stopPropagation()}>
            <nav className="p-4 space-y-1">
              <NavLinks pathname={loc.pathname} onClick={() => setOpen(false)} />
            </nav>
            <div className="p-4 border-t border-gray-100">
              <button onClick={logout}
                className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors">
                <LogOut className="w-4 h-4" /> Sair
              </button>
            </div>
          </aside>
        </div>
      )}

      <main className="flex-1 lg:ml-64 mt-14 lg:mt-0">{children}</main>
    </div>
  );
}
