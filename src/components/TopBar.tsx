import React, { useState, useEffect } from 'react';
import { User, Product, StockNotice } from '../types';
import { Clock, AlertTriangle, RotateCcw, ShieldAlert, Sparkles, LogOut } from 'lucide-react';

interface TopBarProps {
  currentTab: string;
  currentUser: User;
  products: Product[];
  stockNotices: StockNotice[];
  onResetData: () => void;
  onGoToShortages?: () => void;
  onLogout: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentTab,
  currentUser,
  products,
  stockNotices,
  onResetData,
  onGoToShortages,
  onLogout,
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

  const lowStockCount = products.filter((p) => p.stockActual <= p.stockMinimo).length;
  const pendingNotices = stockNotices.filter((n) => n.status === 'Pendiente').length;

  const getTabTitle = () => {
    switch (currentTab) {
      case 'ines_dashboard':
        return 'Panel Directivo Jefa Inés · Dinero del Día y Métricas';
      case 'admin':
        return currentUser.role === 'Inés' ? 'Rendimiento y Auditoría de Vendedoras' : 'Panel de Control del Administrador & Auditoría';
      case 'sales':
        return 'Punto de Venta & Registro de Boletas (12 Dulces y Sodas)';
      case 'products':
        return 'Catálogo Oficial de Almacén (12 Productos Regulados)';
      case 'attendance':
        return currentUser.role === 'Vendedor' ? 'Mi Registro de Asistencia Diario' : 'Control de Asistencia del Personal';
      case 'users':
        return 'Gestión de Personal & Control de Accesos (Exclusivo Administrador)';
      case 'shortages':
        return 'Faltantes & Alertas de Stock en Mostrador';
      default:
        return 'Sistema Comercial Tienda Inés';
    }
  };

  return (
    <header className="h-16 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between shrink-0 select-none">
      {/* Left: Breadcrumbs & Current Screen */}
      <div className="flex items-center gap-3">
        <div>
          <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
            <span>Tienda Inés</span>
            <span>/</span>
            <span className="capitalize">{currentUser.role === 'Inés' ? 'Dueña Inés' : currentUser.role}</span>
          </div>
          <h2 className="text-sm font-bold text-white tracking-tight leading-tight">
            {getTabTitle()}
          </h2>
        </div>
      </div>

      {/* Center/Right: Stock Alert button & Live clock */}
      <div className="flex items-center gap-4">
        {lowStockCount > 0 && onGoToShortages && (
          <button
            onClick={onGoToShortages}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500/25 transition-all cursor-pointer text-xs"
            title="Ver productos con alerta de stock"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-pulse" />
            <span className="font-semibold">
              {lowStockCount} {lowStockCount === 1 ? 'producto bajo en stock' : 'productos bajos en stock'}
            </span>
          </button>
        )}

        {/* Live Clock */}
        <div className="hidden lg:flex items-center gap-2 text-slate-400 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span className="capitalize">{currentDate}</span>
          <span className="text-slate-600">·</span>
          <span className="font-mono font-bold text-emerald-400 tabular-nums">{currentTime}</span>
        </div>

        {/* Reset Demo Data (available to Admin and Inés) */}
        {(currentUser.role === 'Administrador' || currentUser.role === 'Inés') && (
          <button
            onClick={() => {
              if (window.confirm('¿Deseas restablecer los datos de prueba iniciales (ADMIN123, INES01, VEND01 Pilar y los 12 productos)?')) {
                onResetData();
              }
            }}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer"
            title="Restablecer datos iniciales de demostración"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}

        {/* Logout Button */}
        <button
          onClick={() => {
            if (window.confirm(`¿Deseas cerrar la sesión activa de ${currentUser.name} (${currentUser.code})?`)) {
              onLogout();
            }
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-300 hover:text-white transition-all cursor-pointer text-xs font-semibold shadow-xs"
          title="Cerrar sesión y proteger el sistema"
        >
          <LogOut className="w-3.5 h-3.5 text-rose-400" />
          <span className="hidden sm:inline">Cerrar Sesión</span>
        </button>
      </div>
    </header>
  );
};
