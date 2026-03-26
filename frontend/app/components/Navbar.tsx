import { Link, useLocation } from 'react-router';
import { Activity, Menu, X } from 'lucide-react';
import { Button } from './ui/button';
import { useState } from 'react';

export function Navbar() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const isActivePath = (path: string) => {
    return location.pathname === path;
  };
  
  const navLinks = [
    { path: '/', label: 'Início' },
    { path: '/como-funciona', label: 'Como Funciona' },
    { path: '/planos', label: 'Planos' },
  ];
  
  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="hf-container">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
              style={{ backgroundColor: 'var(--hf-primary)' }}
            >
              <Activity className="w-5 h-5" />
            </div>
            <span className="font-semibold text-lg text-gray-900">HealthFlow</span>
          </Link>
          
          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/como-funciona" className="text-gray-600 hover:text-gray-900">
              Como Funciona
            </Link>
            <Link to="/segmentos" className="text-gray-600 hover:text-gray-900">
              Segmentos
            </Link>
            <Link to="/planos" className="text-gray-600 hover:text-gray-900">
              Planos
            </Link>
            <Link to="/design-system" className="text-gray-600 hover:text-gray-900 text-sm opacity-60">
              Design System
            </Link>
          </div>
          
          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm">
                Entrar
              </Button>
            </Link>
            <Link to="/primeiro-acesso">
              <Button 
                size="sm"
                className="text-white"

              >
                Teste Grátis
              </Button>
            </Link>
          </div>
          
          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
        
        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`text-sm py-2 ${
                    isActivePath(link.path)
                      ? 'font-medium'
                      : 'text-gray-600'
                  }`}
                  style={isActivePath(link.path) ? { color: 'var(--hf-primary)' } : {}}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="flex flex-col gap-2 pt-2">
                <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full">
                    Entrar
                  </Button>
                </Link>
                <Link to="/primeiro-acesso" onClick={() => setMobileMenuOpen(false)}>
                  <Button 
                    className="w-full text-white"

                  >
                    Teste Grátis
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}