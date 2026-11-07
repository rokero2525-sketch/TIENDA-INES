import React, { useState, useEffect } from 'react';
import { User, Product } from '../types';
import { 
  Store, 
  ShieldCheck, 
  Users, 
  Package, 
  ShoppingCart, 
  Clock, 
  AlertTriangle, 
  RotateCcw,
  UserCheck
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  currentUser: User;
  users: User[];
  onSelectUser: (user: User) => void;
  products: Product[];
  onResetData: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  currentUser,
  users,
  onSelectUser,
  products,
  onResetData,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
      setCurrentDate(
        now.toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Calculate low stock products count
  const lowStockCount = products.filter((p) => p.stockActual <= p.stockMinimo).length;

  const navItems = [
    {
      id: 'admin',
      label: 'Panel Administrador',
      icon: ShieldCheck,
      badge: 'Exclusivo',
      adminOnly: true,
    },
    {
      id: 'sales',
      label: 'Ventas y Caja',
      icon: ShoppingCart,
      adminOnly: false,
    },
    {
      id: 'products',
      label: 'Productos y Almacén',
      icon: Package,
      badge: lowStockCount > 0 ? `${lowStockCount} alertas` : undefined,
      badgeVariant: 'warning',
      adminOnly: false,
    },
    {
      id: 'attendance',
      label: 'Control Asistencia',
      icon: Clock,
      adminOnly: false,
    },
    {
      id: 'users',
      label: 'Usuarios y Personal',
      icon: Users,
      adminOnly: true,
    },
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 select-none">
      {/* Top Utility Bar */}
      <div className="max-w-[1720px] mx-auto px-6 py-2.5 flex items-center justify-between border-b border-slate-800/80 text-xs">
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-950">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-white">TIENDA INÉS</span>
              <span className="text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                Sistema Central PC
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">Control de Stock, Ventas, Asistencia y Gestión Administrativa</p>
          </div>
        </div>

        {/* Center: Stock Alert banner if items are low */}
        {lowStockCount > 0 && (
          <button
            onClick={() => setCurrentTab('products')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500/25 transition-all cursor-pointer"
            title="Ver productos con alerta de stock"
          >
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 animate-bounce" />
            <span className="font-semibold text-xs">
              {lowStockCount} {lowStockCount === 1 ? 'producto requiere' : 'productos requieren'} reposición urgente
            </span>
            <span className="text-[11px] underline text-amber-200">Ver Almacén →</span>
          </button>
        )}

        {/* Right: Live Clock & User Active Switcher */}
        <div className="flex items-center gap-4">
          {/* Clock */}
          <div className="hidden xl:flex items-center gap-2 text-slate-400 px-3 py-1 rounded bg-slate-800/60 border border-slate-700/50">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span className="capitalize">{currentDate}</span>
            <span className="text-slate-600">·</span>
            <span className="font-mono font-semibold text-emerald-400 tabular-nums">{currentTime}</span>
          </div>

          {/* Active User Switcher */}
          <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
            <UserCheck className="w-4 h-4 text-emerald-400" />
            <div className="text-left">
              <span className="text-[10px] uppercase text-slate-400 block leading-tight">Usuario Activo:</span>
              <select
                value={currentUser.code}
                onChange={(e) => {
                  const selected = users.find((u) => u.code === e.target.value);
                  if (selected) onSelectUser(selected);
                }}
                className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer pr-1"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.code} className="bg-slate-900 text-white">
                    {u.code} - {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
              currentUser.role === 'Administrador' 
                ? 'bg-purple-900/60 text-purple-300 border border-purple-700' 
                : 'bg-blue-900/60 text-blue-300 border border-blue-700'
            }`}>
              {currentUser.role}
            </span>
          </div>

          {/* Reset Demo Data */}
          <button
            onClick={() => {
              if (window.confirm('¿Deseas restablecer los datos de prueba iniciales (ADMIN123, VEND01 Pilar, productos y ventas de ejemplo)?')) {
                onResetData();
              }
            }}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg border border-transparent hover:border-slate-700 transition-colors"
            title="Restablecer datos de prueba de inicio"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="max-w-[1720px] mx-auto px-6">
        <nav className="flex items-center gap-1 overflow-x-auto py-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap cursor-pointer relative ${
                  isActive
                    ? 'bg-slate-800 text-white shadow-inner border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? (item.id === 'admin' ? 'text-amber-400' : 'text-emerald-400') : 'text-slate-500'
                  }`}
                />
                <span className="font-semibold">{item.label}</span>
                {item.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      item.badgeVariant === 'warning'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
                {isActive && (
                  <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-emerald-500 rounded-full" />
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
