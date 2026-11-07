import React, { useState, useMemo } from 'react';
import { User, Product, Sale, Attendance, Sucursal } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { getTodayDateString } from '../services/storage';
import { 
  ShieldCheck, 
  Search, 
  DollarSign, 
  ShoppingBag, 
  Clock, 
  Receipt, 
  TrendingUp, 
  CheckCircle, 
  AlertCircle,
  FileSpreadsheet,
  Calendar,
  Eye,
  Filter,
  Building2,
  Store
} from 'lucide-react';

interface AdminInspectorProps {
  users: User[];
  sales: Sale[];
  products: Product[];
  attendance: Attendance[];
  onViewReceipt: (sale: Sale) => void;
}

export const AdminInspector: React.FC<AdminInspectorProps> = ({
  users,
  sales,
  products,
  attendance,
  onViewReceipt,
}) => {
  // Default to Pilar VEND01 as requested
  const [selectedSellerCode, setSelectedSellerCode] = useState<string>('VEND01');
  const [branchFilter, setBranchFilter] = useState<'all' | Sucursal>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'month'>('all');

  const today = getTodayDateString();

  // All registered sellers
  const allSellers = useMemo(() => {
    return users.filter((u) => u.role === 'Vendedor');
  }, [users]);

  // Filtered sellers by branch
  const sellers = useMemo(() => {
    if (branchFilter === 'all') return allSellers;
    return allSellers.filter((s) => s.sucursal === branchFilter);
  }, [allSellers, branchFilter]);

  // Current selected seller object
  const currentSeller = useMemo(() => {
    const found = users.find((u) => u.code.toUpperCase() === selectedSellerCode.toUpperCase());
    if (found) return found;
    return sellers[0] || allSellers[0] || null;
  }, [users, selectedSellerCode, sellers, allSellers]);

  // Filter sales for the selected seller
  const sellerSales = useMemo(() => {
    if (!currentSeller) return [];
    return sales.filter((s) => {
      const matchSeller = s.sellerCode.toUpperCase() === currentSeller.code.toUpperCase();
      if (!matchSeller) return false;
      if (dateFilter === 'today') {
        return s.date.startsWith(today);
      }
      if (dateFilter === 'month') {
        const thisMonth = today.slice(0, 7);
        return s.date.startsWith(thisMonth);
      }
      return true;
    });
  }, [sales, currentSeller, dateFilter, today]);

  // Total sales metrics for this seller
  const totalAmountSold = useMemo(() => {
    return sellerSales.reduce((acc, s) => acc + s.total, 0);
  }, [sellerSales]);

  const totalUnitsSold = useMemo(() => {
    return sellerSales.reduce((acc, s) => acc + s.quantity, 0);
  }, [sellerSales]);

  const averageTicket = useMemo(() => {
    return sellerSales.length > 0 ? totalAmountSold / sellerSales.length : 0;
  }, [sellerSales, totalAmountSold]);

  // Today's attendance for this seller
  const todayAttendance = useMemo(() => {
    if (!currentSeller) return null;
    return attendance.find(
      (a) => a.date === today && a.sellerCode.toUpperCase() === currentSeller.code.toUpperCase()
    );
  }, [attendance, currentSeller, today]);

  // Breakdown of products sold by this seller
  const productsSoldBreakdown = useMemo(() => {
    const map = new Map<
      string,
      {
        productCode: string;
        productName: string;
        quantity: number;
        totalAmount: number;
      }
    >();

    sellerSales.forEach((sale) => {
      const existing = map.get(sale.productCode);
      if (existing) {
        existing.quantity += sale.quantity;
        existing.totalAmount += sale.total;
      } else {
        map.set(sale.productCode, {
          productCode: sale.productCode,
          productName: sale.productName,
          quantity: sale.quantity,
          totalAmount: sale.total,
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => b.totalAmount - a.totalAmount);
  }, [sellerSales]);

  // Attendance history for this seller
  const sellerAttendanceHistory = useMemo(() => {
    if (!currentSeller) return [];
    return attendance
      .filter((a) => a.sellerCode.toUpperCase() === currentSeller.code.toUpperCase())
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [attendance, currentSeller]);

  const getBranchBadgeStyle = (branch: Sucursal) => {
    switch (branch) {
      case 'Sucursal 1':
        return 'bg-blue-950/80 text-blue-300 border border-blue-800';
      case 'Sucursal 2':
        return 'bg-purple-950/80 text-purple-300 border border-purple-800';
      case 'Sucursal 3':
        return 'bg-emerald-950/80 text-emerald-300 border border-emerald-800';
      default:
        return 'bg-slate-800 text-slate-300 border border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Executive Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-700/80 rounded-xl p-6 shadow-xl">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40">
                <ShieldCheck className="w-5 h-5" />
              </span>
              <h1 className="text-xl font-bold text-white tracking-tight">
                Panel Exclusivo del Administrador (Desarrollador)
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-medium">
                Auditoría Multitienda & Control de Vendedoras
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-3xl">
              Filtre por cualquier código de vendedora o sucursal para auditar en el acto su volumen de ventas total, los productos que ha colocado y su hora de llegada hoy.
            </p>
          </div>

          {/* Quick Branch & Seller Selectors */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-700 px-2.5 py-1 rounded-lg text-xs">
              <Building2 className="w-3.5 h-3.5 text-amber-400" />
              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value as any)}
                className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-slate-900 text-white">Todas las Sucursales</option>
                <option value="Sucursal 1" className="bg-slate-900 text-white">Sucursal 1</option>
                <option value="Sucursal 2" className="bg-slate-900 text-white">Sucursal 2</option>
                <option value="Sucursal 3" className="bg-slate-900 text-white">Sucursal 3</option>
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {sellers.map((s) => (
                <button
                  key={s.code}
                  onClick={() => setSelectedSellerCode(s.code)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    currentSeller?.code === s.code
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950 border border-emerald-500'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
                  }`}
                >
                  <span>{s.code} · {s.name}</span>
                  <span className={`text-[10px] px-1 py-0.2 rounded font-mono ${getBranchBadgeStyle(s.sucursal)}`}>
                    {s.sucursal.replace('Sucursal ', 'S')}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Search input & period filters */}
        <div className="mt-5 pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por código (ej. VEND01) o nombre..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                const match = allSellers.find(
                  (s) =>
                    s.code.toUpperCase() === e.target.value.toUpperCase().trim() ||
                    s.name.toLowerCase().includes(e.target.value.toLowerCase().trim())
                );
                if (match) {
                  setSelectedSellerCode(match.code);
                }
              }}
              className="w-full bg-slate-800/90 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className="text-xs text-slate-400 font-medium">Período de Ventas:</span>
            <div className="p-1 bg-slate-800 rounded-lg border border-slate-700 flex items-center gap-1 text-xs">
              <button
                onClick={() => setDateFilter('all')}
                className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  dateFilter === 'all'
                    ? 'bg-slate-700 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Histórico Total
              </button>
              <button
                onClick={() => setDateFilter('today')}
                className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  dateFilter === 'today'
                    ? 'bg-slate-700 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Solo Hoy
              </button>
              <button
                onClick={() => setDateFilter('month')}
                className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  dateFilter === 'month'
                    ? 'bg-slate-700 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Este Mes
              </button>
            </div>
          </div>
        </div>
      </div>

      {currentSeller ? (
        <>
          {/* Real-Time Seller Snapshot Strip */}
          <div className="bg-slate-850 border border-slate-700 rounded-xl p-5 shadow-lg">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white font-bold text-lg shadow-inner">
                  {currentSeller.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-lg font-bold text-white tracking-tight">
                      {currentSeller.name}
                    </h2>
                    <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-xs font-mono font-bold">
                      {currentSeller.code}
                    </span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${getBranchBadgeStyle(currentSeller.sucursal)}`}>
                      {currentSeller.sucursal}
                    </span>
                    <span className="text-xs text-slate-400">· Vendedora Registrada</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                    <span>Tel: {currentSeller.phone || 'No registrado'}</span>
                    <span>·</span>
                    <span>Correo: {currentSeller.email || 'No registrado'}</span>
                    <span>·</span>
                    <span>Desde: {formatDate(currentSeller.createdAt)}</span>
                  </div>
                </div>
              </div>

              {/* Status indicator */}
              <div className="flex items-center gap-2 bg-slate-900/80 px-4 py-2 rounded-lg border border-slate-700">
                <span className="text-xs text-slate-400">Estado:</span>
                <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                  <CheckCircle className="w-3.5 h-3.5" /> Activa en {currentSeller.sucursal}
                </span>
              </div>
            </div>

            {/* 4 Core KPI Cards for This Seller */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
              {/* Card 1: Total Sold Amount */}
              <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-4.5 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Total Vendido
                  </span>
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2">
                  <p className="text-2xl font-extrabold text-white font-mono tabular-nums">
                    {formatCurrency(totalAmountSold)}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-emerald-400" />
                    <span>En {currentSeller.sucursal}</span>
                  </p>
                </div>
              </div>

              {/* Card 2: Today's Arrival Time */}
              <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-4.5 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Hora de Llegada Hoy
                  </span>
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2">
                  {todayAttendance ? (
                    <div>
                      <p className="text-2xl font-extrabold text-white font-mono tabular-nums flex items-baseline gap-2">
                        {todayAttendance.entryTime}
                        <span
                          className={`text-xs px-2 py-0.5 rounded font-sans font-semibold ${
                            todayAttendance.status === 'A tiempo'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : 'bg-amber-950 text-amber-300 border border-amber-800'
                          }`}
                        >
                          {todayAttendance.status}
                        </span>
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Registrado para hoy en {todayAttendance.sucursal}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-base font-bold text-amber-400 flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4" /> Sin registro hoy
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        La vendedora no ha registrado entrada hoy
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Card 3: Total Units Sold */}
              <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-4.5 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Productos Despachados
                  </span>
                  <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2">
                  <p className="text-2xl font-extrabold text-white font-mono tabular-nums">
                    {totalUnitsSold} <span className="text-sm font-normal text-slate-400">unidades</span>
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    En {productsSoldBreakdown.length} productos diferentes
                  </p>
                </div>
              </div>

              {/* Card 4: Tickets & Average */}
              <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-4.5 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Boletas & Ticket Medio
                  </span>
                  <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    <Receipt className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2">
                  <p className="text-2xl font-extrabold text-white font-mono tabular-nums">
                    {sellerSales.length} <span className="text-sm font-normal text-slate-400">ventas</span>
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Promedio: <span className="font-mono text-emerald-400">{formatCurrency(averageTicket)}</span> / boleta
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Two-Column Wide Layout for Deep Inspection */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
            {/* Products Sold Breakdown (Left Column - 5 cols) */}
            <div className="xl:col-span-5 bg-slate-850 border border-slate-700 rounded-xl p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-emerald-400" />
                  <h3 className="font-bold text-sm text-white">
                    Productos que vendió {currentSeller.name}
                  </h3>
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  {productsSoldBreakdown.length} ítems
                </span>
              </div>

              {productsSoldBreakdown.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                        <th className="py-2 pr-2">Producto</th>
                        <th className="py-2 px-2 text-right">Cant.</th>
                        <th className="py-2 pl-2 text-right">Total ($)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-medium">
                      {productsSoldBreakdown.map((item) => {
                        const percentage = totalAmountSold > 0 ? (item.totalAmount / totalAmountSold) * 100 : 0;
                        return (
                          <tr key={item.productCode} className="hover:bg-slate-800/40 transition-colors">
                            <td className="py-2.5 pr-2">
                              <p className="text-white font-semibold">{item.productName}</p>
                              <span className="text-[11px] font-mono text-slate-400">{item.productCode}</span>
                              <div className="w-full bg-slate-800 h-1 rounded-full mt-1.5 overflow-hidden">
                                <div
                                  className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                                  style={{ width: `${Math.min(percentage, 100)}%` }}
                                />
                              </div>
                            </td>
                            <td className="py-2.5 px-2 text-right font-mono text-slate-200 tabular-nums">
                              {item.quantity} unds
                            </td>
                            <td className="py-2.5 pl-2 text-right font-mono font-bold text-emerald-400 tabular-nums">
                              {formatCurrency(item.totalAmount)}
                              <span className="block text-[10px] text-slate-500 font-normal">
                                {percentage.toFixed(1)}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-10 text-slate-400 text-xs">
                  <p>No hay ventas registradas para {currentSeller.name} en el período seleccionado.</p>
                </div>
              )}
            </div>

            {/* Sales Transaction History (Right Column - 7 cols) */}
            <div className="xl:col-span-7 bg-slate-850 border border-slate-700 rounded-xl p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-emerald-400" />
                  <h3 className="font-bold text-sm text-white">
                    Historial de Boletas / Ventas de {currentSeller.name}
                  </h3>
                </div>
                <span className="text-xs text-slate-400">
                  {sellerSales.length} transacciones registradas
                </span>
              </div>

              {sellerSales.length > 0 ? (
                <div className="overflow-x-auto max-h-[380px] overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="sticky top-0 bg-slate-850 border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider z-10">
                      <tr>
                        <th className="py-2 pr-3">Boleta N°</th>
                        <th className="py-2 px-3">Sucursal</th>
                        <th className="py-2 px-3">Fecha & Hora</th>
                        <th className="py-2 px-3">Producto</th>
                        <th className="py-2 px-3 text-right">Cant.</th>
                        <th className="py-2 px-3 text-right">Total</th>
                        <th className="py-2 px-3">Pago</th>
                        <th className="py-2 pl-3 text-center">Ticket</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-medium">
                      {sellerSales.map((sale) => (
                        <tr key={sale.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-2.5 pr-3 font-mono font-bold text-emerald-400 whitespace-nowrap">
                            {sale.code}
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${getBranchBadgeStyle(sale.sucursal)}`}>
                              {sale.sucursal}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-300 whitespace-nowrap font-mono text-[11px]">
                            {formatDate(sale.date)}
                          </td>
                          <td className="py-2.5 px-3 text-white max-w-[160px] truncate">
                            {sale.productName}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-200 tabular-nums">
                            {sale.quantity}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-white tabular-nums">
                            {formatCurrency(sale.total)}
                          </td>
                          <td className="py-2.5 px-3 text-slate-300 text-[11px] whitespace-nowrap">
                            {sale.paymentMethod}
                          </td>
                          <td className="py-2.5 pl-3 text-center">
                            <button
                              onClick={() => onViewReceipt(sale)}
                              className="p-1 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                              title="Ver Comprobante Detallado"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-10 text-slate-400 text-xs">
                  <p>No se encontraron boletas en el filtro actual.</p>
                </div>
              )}
            </div>
          </div>

          {/* Attendance History for this Seller */}
          <div className="bg-slate-850 border border-slate-700 rounded-xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-400" />
                <h3 className="font-bold text-sm text-white">
                  Historial de Asistencia y Puntualidad de {currentSeller.name} ({currentSeller.code})
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {sellerAttendanceHistory.length} registros guardados
              </span>
            </div>

            {sellerAttendanceHistory.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                      <th className="py-2 px-3">Fecha</th>
                      <th className="py-2 px-3">Sucursal</th>
                      <th className="py-2 px-3">Hora de Entrada</th>
                      <th className="py-2 px-3">Hora de Salida</th>
                      <th className="py-2 px-3">Estado</th>
                      <th className="py-2 px-3">Observaciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {sellerAttendanceHistory.map((att) => (
                      <tr key={att.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-2.5 px-3 text-white font-mono font-semibold">
                          {formatDate(att.date)} {att.date === today && <span className="text-emerald-400 text-[10px] ml-1">(Hoy)</span>}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${getBranchBadgeStyle(att.sucursal)}`}>
                            {att.sucursal}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-emerald-400 font-bold tabular-nums">
                          {att.entryTime}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-400 tabular-nums">
                          {att.departureTime || 'En jornada activa'}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                              att.status === 'A tiempo'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                : 'bg-amber-950 text-amber-300 border border-amber-800'
                            }`}
                          >
                            {att.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                          {att.notes || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400 text-xs">
                <p>No hay registros de asistencia para esta vendedora.</p>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="bg-slate-850 border border-slate-700 rounded-xl p-12 text-center text-slate-400">
          <p>No se encontró ninguna vendedora con el filtro especificado.</p>
        </div>
      )}
    </div>
  );
};
