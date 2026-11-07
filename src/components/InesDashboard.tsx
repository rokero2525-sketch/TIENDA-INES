import React, { useState, useMemo } from 'react';
import { User, Product, Sale, Attendance, StockNotice, Sucursal } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { getTodayDateString } from '../services/storage';
import { 
  Crown, 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  Clock, 
  Users, 
  Receipt, 
  AlertTriangle, 
  Award,
  Layers,
  Sparkles,
  BarChart3,
  Calendar,
  CheckCircle2,
  Building2,
  Store,
  Flame,
  ArrowUpRight
} from 'lucide-react';

interface InesDashboardProps {
  users: User[];
  sales: Sale[];
  products: Product[];
  attendance: Attendance[];
  stockNotices: StockNotice[];
  onViewReceipt: (sale: Sale) => void;
}

export const InesDashboard: React.FC<InesDashboardProps> = ({
  users,
  sales,
  products,
  attendance,
  stockNotices,
  onViewReceipt,
}) => {
  const today = getTodayDateString();
  const [selectedSucursal, setSelectedSucursal] = useState<'all' | Sucursal>('all');
  const [period, setPeriod] = useState<'today' | 'all'>('today');
  const [selectedSellerCode, setSelectedSellerCode] = useState<string>('VEND01');

  const branches: Sucursal[] = ['Sucursal 1', 'Sucursal 2', 'Sucursal 3'];

  // All sellers, optionally filtered by sucursal
  const allSellers = useMemo(() => users.filter((u) => u.role === 'Vendedor'), [users]);
  const activeSellers = useMemo(() => {
    if (selectedSucursal === 'all') return allSellers;
    return allSellers.filter((s) => s.sucursal === selectedSucursal);
  }, [allSellers, selectedSucursal]);

  // Base sales filtered by period
  const periodSales = useMemo(() => {
    if (period === 'today') {
      return sales.filter((s) => s.date.startsWith(today));
    }
    return sales;
  }, [sales, period, today]);

  // Sales filtered by both period and selected branch
  const activeSales = useMemo(() => {
    if (selectedSucursal === 'all') return periodSales;
    return periodSales.filter((s) => s.sucursal === selectedSucursal);
  }, [periodSales, selectedSucursal]);

  // Global Financial KPIs
  const totalMoneyToday = useMemo(() => {
    const todaySales = sales.filter((s) => s.date.startsWith(today));
    const filtered = selectedSucursal === 'all' 
      ? todaySales 
      : todaySales.filter((s) => s.sucursal === selectedSucursal);
    return filtered.reduce((sum, s) => sum + s.total, 0);
  }, [sales, today, selectedSucursal]);

  const totalMoneyPeriod = useMemo(() => {
    return activeSales.reduce((sum, s) => sum + s.total, 0);
  }, [activeSales]);

  const totalTicketsPeriod = activeSales.length;

  const totalUnitsPeriod = useMemo(() => {
    return activeSales.reduce((sum, s) => sum + s.quantity, 0);
  }, [activeSales]);

  const averageTicketPeriod = totalTicketsPeriod > 0 ? totalMoneyPeriod / totalTicketsPeriod : 0;

  // Daily target goal ($150 across all, or $50 per branch)
  const dailyTarget = selectedSucursal === 'all' ? 150.00 : 50.00;
  const targetProgress = Math.min(100, (totalMoneyToday / dailyTarget) * 100);

  // BRANCH COMPARISON METRICS (¿Qué sucursal está vendiendo más?)
  const branchComparison = useMemo(() => {
    const totalAllBranches = periodSales.reduce((acc, s) => acc + s.total, 0);

    const stats = branches.map((branch) => {
      const bSales = periodSales.filter((s) => s.sucursal === branch);
      const total = bSales.reduce((acc, s) => acc + s.total, 0);
      const units = bSales.reduce((acc, s) => acc + s.quantity, 0);
      const tickets = bSales.length;
      const share = totalAllBranches > 0 ? (total / totalAllBranches) * 100 : 0;
      const sellersInBranch = allSellers.filter((s) => s.sucursal === branch);
      
      // Low stock items count in this branch
      const lowStockCount = products.filter(
        (p) => p.sucursal === branch && p.stockActual <= p.stockMinimo
      ).length;

      return {
        branch,
        total,
        units,
        tickets,
        share,
        sellersCount: sellersInBranch.length,
        lowStockCount,
      };
    });

    // Sort to determine leader
    const sorted = [...stats].sort((a, b) => b.total - a.total);
    const leader = sorted[0]?.total > 0 ? sorted[0].branch : null;

    return { stats, leader, totalAllBranches };
  }, [periodSales, branches, allSellers, products]);

  // Sales by Category
  const salesByCategory = useMemo(() => {
    const map: Record<string, { total: number; units: number }> = {
      Golosinas: { total: 0, units: 0 },
      Bebidas: { total: 0, units: 0 },
      Abarrotes: { total: 0, units: 0 },
      Snacks: { total: 0, units: 0 },
    };

    activeSales.forEach((s) => {
      const prod = products.find((p) => p.code === s.productCode);
      const cat = prod?.category || 'Otros';
      if (!map[cat]) map[cat] = { total: 0, units: 0 };
      map[cat].total += s.total;
      map[cat].units += s.quantity;
    });

    return map;
  }, [activeSales, products]);

  // Top products sold
  const topProducts = useMemo(() => {
    const map: Record<string, { code: string; name: string; category: string; units: number; total: number }> = {};
    activeSales.forEach((s) => {
      if (!map[s.productCode]) {
        const prod = products.find((p) => p.code === s.productCode);
        map[s.productCode] = {
          code: s.productCode,
          name: s.productName,
          category: prod?.category || 'General',
          units: 0,
          total: 0,
        };
      }
      map[s.productCode].units += s.quantity;
      map[s.productCode].total += s.total;
    });
    return Object.values(map).sort((a, b) => b.total - a.total).slice(0, 5);
  }, [activeSales, products]);

  // Sellers Performance Breakdown
  const sellersPerformance = useMemo(() => {
    return activeSellers.map((seller) => {
      const sellerSales = activeSales.filter(
        (s) => s.sellerCode.toUpperCase() === seller.code.toUpperCase()
      );
      const totalSold = sellerSales.reduce((acc, s) => acc + s.total, 0);
      const unitsSold = sellerSales.reduce((acc, s) => acc + s.quantity, 0);
      const ticketsCount = sellerSales.length;
      const todayAtt = attendance.find(
        (a) => a.date === today && a.sellerCode.toUpperCase() === seller.code.toUpperCase()
      );

      const contributionPercent = totalMoneyPeriod > 0 ? (totalSold / totalMoneyPeriod) * 100 : 0;

      return {
        seller,
        totalSold,
        unitsSold,
        ticketsCount,
        avgTicket: ticketsCount > 0 ? totalSold / ticketsCount : 0,
        contributionPercent,
        todayAtt,
        sales: sellerSales,
      };
    }).sort((a, b) => b.totalSold - a.totalSold);
  }, [activeSellers, activeSales, attendance, today, totalMoneyPeriod]);

  // Selected seller details for deep dive
  const auditedSeller = useMemo(() => {
    return sellersPerformance.find((sp) => sp.seller.code === selectedSellerCode) || sellersPerformance[0];
  }, [sellersPerformance, selectedSellerCode]);

  // Low stock products alert by branch (¿En cuál de ellas falta mercancía?)
  const lowStockItems = useMemo(() => {
    return products
      .filter((p) => {
        const isLow = p.stockActual <= p.stockMinimo;
        const matchesBranch = selectedSucursal === 'all' || p.sucursal === selectedSucursal;
        return isLow && matchesBranch;
      })
      .sort((a, b) => a.stockActual - b.stockActual);
  }, [products, selectedSucursal]);

  // Filtered Stock Notices
  const filteredNotices = useMemo(() => {
    if (selectedSucursal === 'all') return stockNotices;
    return stockNotices.filter((n) => n.sucursal === selectedSucursal);
  }, [stockNotices, selectedSucursal]);

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
      {/* Executive Gold Header for Inés */}
      <div className="bg-gradient-to-r from-amber-950/60 via-slate-900 to-amber-950/40 border-2 border-amber-500/40 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-950/50 shrink-0">
              <Crown className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-extrabold text-white tracking-tight">
                  Panel de Control Directivo · Dueña Inés
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/50 text-xs font-bold uppercase tracking-wider">
                  Acceso Jefa
                </span>
              </div>
              <p className="text-xs text-amber-100/70 mt-1 max-w-2xl">
                Monitoreo ejecutivo en tiempo real de ingresos por sucursal, rendimiento de vendedoras, alertas de desabastecimiento y comparativa comercial multitienda.
              </p>
            </div>
          </div>

          {/* Dual Filters: Sucursal Filter & Period Selector */}
          <div className="flex flex-wrap items-center gap-3 self-start xl:self-center">
            {/* Filter by Sucursal */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 rounded-xl border border-slate-700 text-xs shadow-inner">
              <span className="text-slate-400 pl-2 pr-1 font-semibold flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-amber-400" />
                Sucursal:
              </span>
              {(['all', 'Sucursal 1', 'Sucursal 2', 'Sucursal 3'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSelectedSucursal(s)}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    selectedSucursal === s
                      ? 'bg-amber-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {s === 'all' ? 'Todas' : s}
                </button>
              ))}
            </div>

            {/* Period selector */}
            <div className="p-1 bg-slate-900/90 rounded-xl border border-slate-700 flex items-center gap-1 text-xs shadow-inner">
              <button
                onClick={() => setPeriod('today')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  period === 'today'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Solo Hoy
              </button>
              <button
                onClick={() => setPeriod('all')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  period === 'all'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Histórico
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Core Financial Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Money Sold */}
        <div className="bg-slate-850 border border-slate-700 rounded-xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {period === 'today' ? 'Dinero Vendido Hoy' : 'Total Ventas Acumuladas'}
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-3xl font-black text-white font-mono tabular-nums">
              {formatCurrency(totalMoneyPeriod)}
            </p>
            <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
              <span>{selectedSucursal === 'all' ? 'Todas las sucursales' : selectedSucursal}</span>
              <span className="text-emerald-400 font-semibold font-mono">{totalTicketsPeriod} boletas</span>
            </div>
          </div>
        </div>

        {/* Daily Goal Target */}
        <div className="bg-slate-850 border border-slate-700 rounded-xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Meta Diaria {selectedSucursal !== 'all' ? `(${selectedSucursal})` : 'Global'}
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline justify-between">
              <p className="text-3xl font-black text-amber-400 font-mono tabular-nums">
                {targetProgress.toFixed(0)}%
              </p>
              <span className="text-xs font-mono text-slate-400">
                Meta: {formatCurrency(dailyTarget)}
              </span>
            </div>
            {/* Progress Bar */}
            <div className="w-full bg-slate-800 h-2 rounded-full mt-2.5 overflow-hidden border border-slate-700/50">
              <div
                className="bg-gradient-to-r from-amber-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${targetProgress}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5">
              {totalMoneyToday >= dailyTarget ? '¡Meta superada con éxito!' : `Faltan ${formatCurrency(Math.max(0, dailyTarget - totalMoneyToday))} para la meta`}
            </p>
          </div>
        </div>

        {/* Units Dispatched */}
        <div className="bg-slate-850 border border-slate-700 rounded-xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Unidades Despachadas
            </span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-3xl font-black text-white font-mono tabular-nums">
              {totalUnitsPeriod} <span className="text-sm font-normal text-slate-400">unds</span>
            </p>
            <p className="text-xs text-slate-400 mt-2">
              Dulces, sodas y abarrotes entregados
            </p>
          </div>
        </div>

        {/* Average Ticket */}
        <div className="bg-slate-850 border border-slate-700 rounded-xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Ticket Promedio / Compra
            </span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-3xl font-black text-purple-300 font-mono tabular-nums">
              {formatCurrency(averageTicketPeriod)}
            </p>
            <p className="text-xs text-slate-400 mt-2">
              Promedio por cliente atendido
            </p>
          </div>
        </div>
      </div>

      {/* SPECIAL REQUIREMENT 3: COMPARATIVA DE VENTAS POR SUCURSAL */}
      <div className="bg-slate-850 border-2 border-slate-700/80 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-amber-400" />
              Comparativa de Ventas por Sucursal · ¿Cuál está vendiendo más?
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Análisis comparativo de facturación, volumen de clientes y alertas de mercancía entre las 3 sucursales.
            </p>
          </div>
          {branchComparison.leader && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-emerald-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold">
              <Crown className="w-4 h-4 text-amber-400" />
              <span>Sucursal Líder en Ventas: {branchComparison.leader}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {branchComparison.stats.map((b) => {
            const isLeader = branchComparison.leader === b.branch;
            const isFilterActive = selectedSucursal === b.branch;
            return (
              <div
                key={b.branch}
                onClick={() => setSelectedSucursal(selectedSucursal === b.branch ? 'all' : b.branch)}
                className={`p-4 rounded-xl border-2 transition-all cursor-pointer relative ${
                  isFilterActive
                    ? 'bg-slate-800/90 border-amber-500 shadow-xl'
                    : 'bg-slate-900/80 border-slate-700/80 hover:border-slate-600'
                }`}
              >
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 ${getBranchBadgeStyle(b.branch)}`}>
                      <Store className="w-3.5 h-3.5" />
                      {b.branch}
                    </span>
                    {isLeader && (
                      <span className="flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded bg-amber-500 text-slate-950">
                        <Award className="w-3 h-3" /> N° 1
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">{b.sellersCount} vendedora(s)</span>
                </div>

                {/* Main Revenue */}
                <div className="mt-3.5 space-y-1">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-slate-400 font-semibold">Total Facturado:</span>
                    <span className="text-2xl font-black text-emerald-400 font-mono tabular-nums">
                      {formatCurrency(b.total)}
                    </span>
                  </div>

                  {/* Share Bar */}
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-2">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        b.branch === 'Sucursal 1'
                          ? 'bg-blue-500'
                          : b.branch === 'Sucursal 2'
                          ? 'bg-purple-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(b.share, 100)}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-[11px] text-slate-400 pt-1">
                    <span>Participación global:</span>
                    <span className="font-mono font-bold text-white">{b.share.toFixed(1)}%</span>
                  </div>
                </div>

                {/* Sub metrics */}
                <div className="mt-3 pt-3 border-t border-slate-800 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">Boletas Emitidas</span>
                    <span className="font-mono font-bold text-white">{b.tickets} ventas</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">Unidades Vendidas</span>
                    <span className="font-mono font-bold text-white">{b.units} unds</span>
                  </div>
                </div>

                {/* Stock Shortage Alert Indicator */}
                <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400">Stock Crítico:</span>
                  {b.lowStockCount > 0 ? (
                    <span className="text-rose-400 font-bold font-mono text-[11px] flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {b.lowStockCount} ítems agotándose
                    </span>
                  ) : (
                    <span className="text-emerald-400 font-semibold text-[11px] flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Abastecido
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Visual Chart Strip: Sales by Category & Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sales by Category (5 cols) */}
        <div className="lg:col-span-5 bg-slate-850 border border-slate-700 rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-amber-400" />
              Ventas por Categoría de Producto
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">Total: {formatCurrency(totalMoneyPeriod)}</span>
          </div>

          <div className="space-y-3.5">
            {Object.entries(salesByCategory).map(([category, data]) => {
              const pct = totalMoneyPeriod > 0 ? (data.total / totalMoneyPeriod) * 100 : 0;
              return (
                <div key={category} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-200">{category}</span>
                    <div className="flex items-center gap-2 font-mono">
                      <span className="text-slate-400">{data.units} unds</span>
                      <span className="font-bold text-emerald-400 tabular-nums">{formatCurrency(data.total)}</span>
                      <span className="text-[10px] text-slate-500 w-9 text-right font-sans font-medium">({pct.toFixed(0)}%)</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        category === 'Golosinas'
                          ? 'bg-pink-500'
                          : category === 'Bebidas'
                          ? 'bg-blue-500'
                          : category === 'Abarrotes'
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top 5 Best Selling Products (7 cols) */}
        <div className="lg:col-span-7 bg-slate-850 border border-slate-700 rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              Ranking de Productos Más Vendidos
            </h3>
            <span className="text-xs text-slate-400">
              {selectedSucursal === 'all' ? 'Todas las sucursales' : selectedSucursal}
            </span>
          </div>

          {topProducts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                    <th className="py-2 pr-3">Puesto & Producto</th>
                    <th className="py-2 px-3">Categoría</th>
                    <th className="py-2 px-3 text-right">Cant. Vendida</th>
                    <th className="py-2 pl-3 text-right">Total Recaudado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {topProducts.map((p, idx) => (
                    <tr key={p.code} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 pr-3">
                        <div className="flex items-center gap-2">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            idx === 0 ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                          }`}>
                            #{idx + 1}
                          </span>
                          <div>
                            <span className="font-bold text-white">{p.name}</span>
                            <span className="text-[10px] font-mono text-slate-400 ml-1.5">[{p.code}]</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-300">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-medium border border-slate-700">
                          {p.category}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-200 tabular-nums">
                        {p.units} unds
                      </td>
                      <td className="py-2.5 pl-3 text-right font-mono font-extrabold text-emerald-400 tabular-nums">
                        {formatCurrency(p.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400 text-xs">
              No hay ventas registradas para este período o sucursal.
            </div>
          )}
        </div>
      </div>

      {/* Sellers Performance Grid (Rendimiento de Cada Vendedora) */}
      <div className="bg-slate-850 border border-slate-700 rounded-xl p-6 shadow-lg space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-400" />
              Rendimiento de Cada Vendedora por Sucursal
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Comparativa de ventas, transacciones y hora de llegada de cada vendedora asignada.
            </p>
          </div>
          <span className="text-xs text-amber-400 font-semibold px-3 py-1 rounded-lg bg-amber-950/60 border border-amber-800 self-start sm:self-auto">
            {activeSellers.length} vendedoras {selectedSucursal !== 'all' ? `en ${selectedSucursal}` : 'en total'}
          </span>
        </div>

        {/* Seller Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {sellersPerformance.map((sp) => {
            const isSelected = selectedSellerCode === sp.seller.code;
            return (
              <div
                key={sp.seller.code}
                onClick={() => setSelectedSellerCode(sp.seller.code)}
                className={`p-4.5 rounded-xl border-2 transition-all cursor-pointer relative ${
                  isSelected
                    ? 'bg-slate-800/90 border-amber-500 shadow-xl shadow-amber-950/30'
                    : 'bg-slate-900/80 border-slate-700/80 hover:border-slate-600'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center text-white font-extrabold text-sm shadow-md">
                      {sp.seller.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-white">{sp.seller.name}</h4>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[11px] font-mono font-bold text-amber-400">{sp.seller.code}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${getBranchBadgeStyle(sp.seller.sucursal)}`}>
                          {sp.seller.sucursal}
                        </span>
                      </div>
                    </div>
                  </div>
                  {isSelected && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500 text-slate-950">
                      Seleccionada
                    </span>
                  )}
                </div>

                {/* Metrics */}
                <div className="mt-4 pt-3 border-t border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between items-baseline">
                    <span className="text-slate-400">Total Vendido:</span>
                    <span className="font-mono font-extrabold text-lg text-emerald-400 tabular-nums">
                      {formatCurrency(sp.totalSold)}
                    </span>
                  </div>

                  <div className="flex justify-between text-slate-400">
                    <span>Aporte a ventas:</span>
                    <span className="font-mono text-slate-200">{sp.contributionPercent.toFixed(1)}%</span>
                  </div>

                  <div className="flex justify-between text-slate-400">
                    <span>Productos vendidos:</span>
                    <span className="font-mono text-slate-200">{sp.unitsSold} unidades</span>
                  </div>

                  <div className="flex justify-between text-slate-400">
                    <span>Boletas emitidas:</span>
                    <span className="font-mono text-slate-200">{sp.ticketsCount} ventas</span>
                  </div>

                  {/* Arrival Time Today */}
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">Llegó hoy:</span>
                    {sp.todayAtt ? (
                      <span className="font-mono font-bold text-white text-xs flex items-center gap-1.5">
                        {sp.todayAtt.entryTime}
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded font-sans font-semibold ${
                            sp.todayAtt.status === 'A tiempo'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : 'bg-amber-950 text-amber-300 border border-amber-800'
                          }`}
                        >
                          {sp.todayAtt.status}
                        </span>
                      </span>
                    ) : (
                      <span className="text-[11px] text-amber-400 font-semibold">
                        Sin marcar hoy
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Deep Dive Breakdown for Selected Seller */}
        {auditedSeller && (
          <div className="mt-4 pt-4 border-t border-slate-800 grid grid-cols-1 xl:grid-cols-12 gap-6">
            {/* Products sold by this seller (5 cols) */}
            <div className="xl:col-span-5 bg-slate-900/90 rounded-xl p-4 border border-slate-800 space-y-3">
              <h4 className="font-bold text-xs text-white uppercase tracking-wider flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-amber-400" />
                Artículos vendidos por {auditedSeller.seller.name} ({auditedSeller.seller.sucursal})
              </h4>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {auditedSeller.sales.map((sale) => (
                  <div
                    key={sale.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-800/60 border border-slate-700/50 text-xs"
                  >
                    <div>
                      <p className="font-bold text-white">{sale.productName}</p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {sale.quantity} unds x {formatCurrency(sale.unitPrice)} · {sale.sucursal}
                      </p>
                    </div>
                    <span className="font-mono font-bold text-emerald-400 tabular-nums">
                      {formatCurrency(sale.total)}
                    </span>
                  </div>
                ))}
                {auditedSeller.sales.length === 0 && (
                  <p className="text-center py-6 text-slate-500 text-xs">
                    Sin ventas en este período.
                  </p>
                )}
              </div>
            </div>

            {/* Sales transactions table (7 cols) */}
            <div className="xl:col-span-7 bg-slate-900/90 rounded-xl p-4 border border-slate-800 space-y-3">
              <h4 className="font-bold text-xs text-white uppercase tracking-wider flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-400" />
                Boletas registradas por {auditedSeller.seller.name}
              </h4>
              <div className="overflow-x-auto max-h-56 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-[10px] text-slate-400 uppercase tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-1.5 px-2">N° Boleta</th>
                      <th className="py-1.5 px-2">Sucursal</th>
                      <th className="py-1.5 px-2">Hora</th>
                      <th className="py-1.5 px-2">Producto</th>
                      <th className="py-1.5 px-2 text-right">Total</th>
                      <th className="py-1.5 px-2 text-center">Ticket</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {auditedSeller.sales.map((sale) => (
                      <tr key={sale.id} className="hover:bg-slate-800/40">
                        <td className="py-2 px-2 font-mono font-bold text-emerald-400">{sale.code}</td>
                        <td className="py-2 px-2 font-bold">
                          <span className={`text-[10px] px-1.5 py-0.2 rounded ${getBranchBadgeStyle(sale.sucursal)}`}>
                            {sale.sucursal}
                          </span>
                        </td>
                        <td className="py-2 px-2 text-slate-400 font-mono text-[11px]">{formatDate(sale.date)}</td>
                        <td className="py-2 px-2 text-white truncate max-w-[130px]">{sale.productName}</td>
                        <td className="py-2 px-2 text-right font-mono font-bold text-white tabular-nums">{formatCurrency(sale.total)}</td>
                        <td className="py-2 px-2 text-center">
                          <button
                            onClick={() => onViewReceipt(sale)}
                            className="p-1 text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Warehouse Stock Health & Missing Items Notices for Inés by Branch */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Low Stock Warning by Branch */}
        <div className="bg-slate-850 border border-slate-700 rounded-xl p-5 shadow-lg space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Mercancía Faltante por Sucursal ({lowStockItems.length})
            </h3>
            <span className="text-[11px] text-amber-400 font-bold">
              {selectedSucursal === 'all' ? 'Alerta Multitienda' : selectedSucursal}
            </span>
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto">
            {lowStockItems.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-3 rounded-lg bg-amber-950/20 border border-amber-500/30 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-white">{p.name}</p>
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${getBranchBadgeStyle(p.sucursal)}`}>
                      {p.sucursal}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                    {p.code} · {p.category} · Precio: {formatCurrency(p.price)}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`font-mono font-black text-sm block tabular-nums ${p.stockActual <= 0 ? 'text-rose-400' : 'text-amber-400'}`}>
                    {p.stockActual} unds {p.stockActual <= 0 && '(AGOTADO)'}
                  </span>
                  <span className="text-[10px] text-slate-400">mínimo {p.stockMinimo}</span>
                </div>
              </div>
            ))}
            {lowStockItems.length === 0 && (
              <p className="text-center py-8 text-slate-500 text-xs">
                No hay productos con stock bajo en {selectedSucursal === 'all' ? 'ninguna sucursal' : selectedSucursal}.
              </p>
            )}
          </div>
        </div>

        {/* Notices reported by sellers */}
        <div className="bg-slate-850 border border-slate-700 rounded-xl p-5 shadow-lg space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-400" />
              Avisos de Faltantes Reportados ({filteredNotices.length})
            </h3>
            <span className="text-[11px] text-slate-400">Mostrador</span>
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto">
            {filteredNotices.map((n) => (
              <div
                key={n.id}
                className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs space-y-1"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{n.productName} ({n.productCode})</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${getBranchBadgeStyle(n.sucursal)}`}>
                      {n.sucursal}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800">
                    {n.urgency}
                  </span>
                </div>
                <p className="text-slate-300 text-[11px]">"{n.notes}"</p>
                <div className="text-[10px] text-slate-500 flex justify-between pt-1 border-t border-slate-800/60">
                  <span>Reportado por: {n.sellerName} ({n.sellerCode})</span>
                  <span>Hora: {n.reportedAt}</span>
                </div>
              </div>
            ))}
            {filteredNotices.length === 0 && (
              <p className="text-center py-8 text-slate-500 text-xs">
                No hay avisos pendientes de mostrador.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
