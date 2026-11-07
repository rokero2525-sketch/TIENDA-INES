import React from 'react';
import { User, Product, StockNotice } from '../types';
import { 
  Store, 
  ShieldCheck, 
  Crown, 
  ShoppingCart, 
  Package, 
  Clock, 
  Users, 
  AlertTriangle, 
  BarChart3, 
  Flame, 
  KeyRound,
  UserCheck,
  Lock,
  LogOut
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  currentUser: User;
  users: User[];
  onSelectUser: (user: User) => void;
  products: Product[];
  stockNotices: StockNotice[];
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  currentUser,
  users,
  onSelectUser,
  products,
  stockNotices,
  onLogout,
}) => {
  const lowStockCount = products.filter((p) => p.stockActual <= p.stockMinimo).length;
  const pendingNoticesCount = stockNotices.filter((n) => n.status === 'Pendiente').length;

  // Build menu items strictly based on role as requested
  const getMenuItems = () => {
    if (currentUser.role === 'Administrador') {
      return [
        {
          id: 'admin',
          label: 'Panel General & Auditoría',
          sublabel: 'Supervisión de todo el sistema',
          icon: ShieldCheck,
          badge: 'Total',
        },
        {
          id: 'users',
          label: 'Gestión de Personal',
          sublabel: 'Control de accesos, códigos y roles',
          icon: KeyRound,
          badge: 'Exclusivo',
          badgeVariant: 'purple',
        },
        {
          id: 'products',
          label: 'Catálogo & Almacén',
          sublabel: '12 productos oficiales',
          icon: Package,
          badge: lowStockCount > 0 ? `${lowStockCount} alertas` : undefined,
          badgeVariant: 'warning',
        },
        {
          id: 'sales',
          label: 'Ventas & Caja',
          sublabel: 'Punto de venta y registros',
          icon: ShoppingCart,
        },
        {
          id: 'attendance',
          label: 'Control de Asistencia',
          sublabel: 'Registro de todo el personal',
          icon: Clock,
        },
        {
          id: 'shortages',
          label: 'Avisos de Faltantes',
          sublabel: 'Reportes de mostrador',
          icon: Flame,
          badge: pendingNoticesCount > 0 ? `${pendingNoticesCount}` : undefined,
        },
      ];
    }

    if (currentUser.role === 'Inés') {
      return [
        {
          id: 'ines_dashboard',
          label: 'Panel Directivo Jefa Inés',
          sublabel: 'Dinero total del día y gráficos',
          icon: Crown,
          badge: 'Jefa',
          badgeVariant: 'gold',
        },
        {
          id: 'admin',
          label: 'Rendimiento Vendedoras',
          sublabel: 'Ventas y llegada de cada una',
          icon: BarChart3,
        },
        {
          id: 'attendance',
          label: 'Supervisión Asistencia',
          sublabel: 'Puntualidad diaria',
          icon: Clock,
        },
        {
          id: 'products',
          label: 'Estado de Almacén',
          sublabel: 'Monitoreo de existencias',
          icon: Package,
          badge: lowStockCount > 0 ? `${lowStockCount} falta stock` : undefined,
          badgeVariant: 'warning',
        },
      ];
    }

    // Role 'Vendedor' - STRICTLY 3 SCREENS ONLY
    return [
      {
        id: 'sales',
        label: '1. Registrar Ventas (POS)',
        sublabel: 'Seleccionar dulces y sodas',
        icon: ShoppingCart,
        badge: 'Caja',
      },
      {
        id: 'shortages',
        label: '2. Faltantes / Alertas Stock',
        sublabel: 'Avisar qué producto falta',
        icon: AlertTriangle,
        badge: lowStockCount > 0 ? `${lowStockCount}` : undefined,
        badgeVariant: 'warning',
      },
      {
        id: 'attendance',
        label: '3. Marcar Asistencia Diario',
        sublabel: 'Mi registro de llegada hoy',
        icon: Clock,
        badge: 'Diario',
      },
    ];
  };

  const menuItems = getMenuItems();

  return (
    <aside className="w-64 xl:w-72 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 select-none min-h-screen">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-lg shadow-emerald-950 shrink-0">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-extrabold text-base tracking-tight text-white leading-tight">
              TIENDA INÉS
            </h1>
            <p className="text-[11px] text-slate-400">Sistema Comercial para PC</p>
          </div>
        </div>

        {/* Current Active Role Badge */}
        <div className="mt-4 p-3 rounded-xl bg-slate-850 border border-slate-700/80">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
              Sesión Activa:
            </span>
            <span
              className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                currentUser.role === 'Administrador'
                  ? 'bg-purple-950 text-purple-300 border-purple-700'
                  : currentUser.role === 'Inés'
                  ? 'bg-amber-950 text-amber-300 border-amber-600'
                  : 'bg-blue-950 text-blue-300 border-blue-700'
              }`}
            >
              {currentUser.role === 'Inés' ? '👑 Jefa Inés' : currentUser.role}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-xs font-bold text-white">
              {currentUser.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-bold text-white truncate">{currentUser.name}</p>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-800 text-amber-400 border border-slate-700">
                  {currentUser.sucursal || 'Sucursal 1'}
                </span>
              </div>
              <p className="text-[10px] font-mono text-emerald-400">{currentUser.code}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Role-Specific Navigation Menu */}
      <div className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          {currentUser.role === 'Administrador'
            ? 'Menú de Administración'
            : currentUser.role === 'Inés'
            ? 'Menú Directivo Jefa Inés'
            : 'Menú de Vendedora (3 Pantallas)'}
        </div>

        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer ${
                isActive
                  ? currentUser.role === 'Inés'
                    ? 'bg-amber-500/15 text-white border border-amber-500/40 shadow-sm'
                    : 'bg-purple-600 text-white shadow-md shadow-purple-950 border border-purple-500'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive
                      ? currentUser.role === 'Inés'
                        ? 'text-amber-400'
                        : 'text-white'
                      : 'text-slate-500'
                  }`}
                />
                <div className="truncate">
                  <p className="text-xs font-semibold leading-tight">{item.label}</p>
                  <p className="text-[10px] text-slate-500 truncate mt-0.5">{item.sublabel}</p>
                </div>
              </div>

              {item.badge && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded ml-2 shrink-0 ${
                    item.badgeVariant === 'warning'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : item.badgeVariant === 'gold'
                      ? 'bg-amber-500 text-slate-950 font-black'
                      : item.badgeVariant === 'purple'
                      ? 'bg-purple-500 text-white font-bold'
                      : 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Session Controls & Logout */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/80 space-y-3">
        {currentUser.role === 'Administrador' && (
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-purple-400" />
              Simular Vista (Modo Desarrollador):
            </label>
            <select
              value={currentUser.code}
              onChange={(e) => {
                const selected = users.find((u) => u.code === e.target.value);
                if (selected) {
                  if (selected.active === false) {
                    window.alert(
                      `⛔ ACCESO BLOQUEADO:\n\nEl empleado "${selected.name}" con código "${selected.code}" ha sido DADO DE BAJA por el Administrador.`
                    );
                    return;
                  }
                  onSelectUser(selected);
                  if (selected.role === 'Inés') setCurrentTab('ines_dashboard');
                  else if (selected.role === 'Vendedor') setCurrentTab('sales');
                  else setCurrentTab('admin');
                }
              }}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-white focus:outline-none focus:border-purple-500 cursor-pointer"
            >
              {users.map((u) => (
                <option
                  key={u.id}
                  value={u.code}
                  className={`bg-slate-900 ${!u.active ? 'text-rose-400 font-bold' : 'text-white'}`}
                >
                  {!u.active ? '⛔ [BLOQUEADO] ' : ''}
                  {u.code} · {u.name} ({u.role} · {u.sucursal})
                </option>
              ))}
            </select>
          </div>
        )}

        <button
          onClick={() => {
            if (window.confirm(`¿Deseas cerrar la sesión activa de ${currentUser.name}?`)) {
              onLogout();
            }
          }}
          className="w-full py-2.5 px-3 rounded-xl bg-slate-800/80 hover:bg-rose-950/70 border border-slate-700 hover:border-rose-800 text-slate-300 hover:text-rose-200 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
        >
          <LogOut className="w-3.5 h-3.5 text-rose-400" />
          <span>Cerrar Sesión / Salir</span>
        </button>

        <p className="text-[10px] text-slate-500 text-center font-mono">
          Sesión: {currentUser.code} · {currentUser.sucursal}
        </p>
      </div>
    </aside>
  );
};
