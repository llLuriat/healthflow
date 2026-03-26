import { adminTokenStore } from '../lib/api';
import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { 
  Activity,
  Users,
  CreditCard,
  BarChart3,
  FileText,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { Button } from '../components/ui/button';

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    adminTokenStore.clear();
    navigate('/admin');
  };

  const navItems = [
    { path: '/admin/clientes', icon: Users, label: 'Clientes' },
    { path: '/admin/assinaturas', icon: CreditCard, label: 'Assinaturas' },
  ];

  const isActivePath = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
            <Activity className="w-5 h-5" />
          </div>
          <span className="font-semibold text-white">HealthFlow Admin</span>
        </div>
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label={sidebarOpen ? 'Fechar menu' : 'Abrir menu'}
          className="p-2 hover:bg-gray-700 rounded-lg text-white"
        >
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar */}
      <div 
        className={`fixed left-0 top-0 h-full w-64 bg-gray-800 border-r border-gray-700 flex flex-col z-40 transition-transform lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-gray-700">
          <Link to="/admin/clientes" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <div className="font-semibold text-white">HealthFlow</div>
              <div className="text-xs text-gray-400">Administração</div>
            </div>
          </Link>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const isActive = isActivePath(item.path);
            return (
              <Link key={item.path} to={item.path}>
                <button 
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white font-medium'
                      : 'text-gray-300 hover:bg-gray-700'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </button>
              </Link>
            );
          })}
        </nav>
        
        {/* User */}
        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-gray-300">AD</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm text-white truncate">
                Admin
              </div>
              <div className="text-xs text-gray-400">Sistema</div>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full justify-start text-gray-300 hover:bg-gray-700"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </div>
      
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
      
      {/* Main Content */}
      <div className="lg:ml-64 pt-16 lg:pt-0 min-h-screen bg-gray-900">
        {children}
      </div>
    </div>
  );
}
