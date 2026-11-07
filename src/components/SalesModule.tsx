import React, { useState, useMemo, useEffect } from 'react';
import { Sale, Product, User, PaymentMethod, Sucursal } from '../types';
import { formatCurrency, formatDate, getStockStatus } from '../utils/formatters';
import { 
  ShoppingCart, 
  Receipt, 
  Search, 
  Check, 
  AlertTriangle, 
  Eye, 
  Trash2, 
  Sparkles,
  Lock,
  PackageCheck,
  Building2,
  Store
} from 'lucide-react';

interface SalesModuleProps {
  sales: Sale[];
  products: Product[];
  users: User[];
  currentUser: User;
  onRegisterSale: (saleData: {
    sucursal: Sucursal;
    sellerCode: string;
    sellerName: string;
    productCode: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    paymentMethod: PaymentMethod;
    notes?: string;
  }) => { success: boolean; error?: string; sale?: Sale };
  onVoidSale: (saleId: string) => { success: boolean; error?: string };
  onViewReceipt: (sale: Sale) => void;
}

export const SalesModule: React.FC<SalesModuleProps> = ({
  sales,
  products,
  users,
  currentUser,
  onRegisterSale,
  onVoidSale,
  onViewReceipt,
}) => {
  const [activeTab, setActiveTab] = useState<'pos' | 'history'>('pos');

  // POS Form State
  const sellers = useMemo(() => users.filter((u) => u.role === 'Vendedor'), [users]);
  
  // Initial seller defaults to active user if salesperson, or Pilar VEND01
  const defaultSellerCode = useMemo(() => {
    if (currentUser.role === 'Vendedor') return currentUser.code;
    const pilar = sellers.find((s) => s.code === 'VEND01');
    return pilar ? pilar.code : sellers[0]?.code || '';
  }, [currentUser, sellers]);

  const [selectedSellerCode, setSelectedSellerCode] = useState<string>(defaultSellerCode);
  const [manualBranch, setManualBranch] = useState<Sucursal | null>(null);
  const [selectedProductCode, setSelectedProductCode] = useState<string>('PRD-01');
  const [quantity, setQuantity] = useState<number>(1);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Efectivo');
  const [notes, setNotes] = useState<string>('');
  const [posError, setPosError] = useState<string>('');
  const [posSuccessMessage, setPosSuccessMessage] = useState<string>('');

  // History filters
  const [historySearch, setHistorySearch] = useState<string>('');
  const [sellerFilter, setSellerFilter] = useState<string>('all');
  const [sucursalFilter, setSucursalFilter] = useState<'all' | Sucursal>('all');
  const [dateFilter, setDateFilter] = useState<string>('');

  // Selected seller object
  const selectedSeller = useMemo(() => {
    return users.find((u) => u.code === selectedSellerCode) || sellers[0] || null;
  }, [users, selectedSellerCode, sellers]);

  // Active Sucursal:
  // For Vendedor: STRICTLY their assigned branch
  // For Admin / Inés: defaults to selected seller's assigned branch, with optional manual switch
  const activeSucursal: Sucursal = useMemo(() => {
    if (currentUser.role === 'Vendedor') {
      return currentUser.sucursal || 'Sucursal 1';
    }
    if (manualBranch) return manualBranch;
    return selectedSeller?.sucursal || currentUser.sucursal || 'Sucursal 1';
  }, [currentUser, manualBranch, selectedSeller]);

  // Filter products strictly to the ACTIVE SUCURSAL
  // Stock is independent per branch (12 products per branch)
  const branchProducts = useMemo(() => {
    return products.filter((p) => p.sucursal === activeSucursal);
  }, [products, activeSucursal]);

  // Keep selectedProductCode synchronized when branch changes
  useEffect(() => {
    if (branchProducts.length > 0) {
      const match = branchProducts.find((p) => p.code === selectedProductCode);
      if (!match) {
        setSelectedProductCode(branchProducts[0].code);
      }
    }
  }, [activeSucursal, branchProducts, selectedProductCode]);

  // Selected product in the active branch
  const selectedProduct = useMemo(() => {
    return branchProducts.find((p) => p.code === selectedProductCode) || branchProducts[0] || null;
  }, [branchProducts, selectedProductCode]);

  // Group branch products by category for the closed select optgroups
  const productsByCategory = useMemo(() => {
    const groups: Record<string, Product[]> = {};
    branchProducts.forEach((p) => {
      const cat = p.category || 'Otros';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(p);
    });
    return groups;
  }, [branchProducts]);

  // Automatic calculation of Total = quantity * unitPrice
  const unitPrice = selectedProduct ? selectedProduct.price : 0;
  const calculatedTotal = useMemo(() => {
    const qty = Number(quantity) || 0;
    return qty * unitPrice;
  }, [quantity, unitPrice]);

  // Validation: Insufficient stock warning
  const isOutOfStock = selectedProduct ? selectedProduct.stockActual <= 0 : false;
  const isInsufficientStock = selectedProduct
    ? quantity > selectedProduct.stockActual
    : false;

  const handleRegisterSale = (e: React.FormEvent) => {
    e.preventDefault();
    setPosError('');
    setPosSuccessMessage('');

    if (!selectedSeller) {
      setPosError('Por favor selecciona una vendedora.');
      return;
    }
    if (!selectedProduct) {
      setPosError(`No hay productos disponibles en el inventario de ${activeSucursal}.`);
      return;
    }
    if (quantity <= 0) {
      setPosError('La cantidad a vender debe ser al menos 1 unidad.');
      return;
    }
    if (quantity > selectedProduct.stockActual) {
      setPosError(
        `Stock insuficiente en ${activeSucursal}. Solo quedan ${selectedProduct.stockActual} unidades disponibles de "${selectedProduct.name}".`
      );
      return;
    }

    const res = onRegisterSale({
      sucursal: activeSucursal,
      sellerCode: selectedSeller.code,
      sellerName: selectedSeller.name,
      productCode: selectedProduct.code,
      productName: selectedProduct.name,
      quantity,
      unitPrice: selectedProduct.price,
      paymentMethod,
      notes: notes.trim() || undefined,
    });

    if (!res.success) {
      setPosError(res.error || 'Error al procesar la venta.');
    } else {
      setPosSuccessMessage(
        `¡Venta registrada con éxito en ${activeSucursal}! Se descontaron ${quantity} unidades del stock de "${selectedProduct.name}".`
      );
      setQuantity(1);
      setNotes('');
      if (res.sale) {
        onViewReceipt(res.sale);
      }
    }
  };

  // Filtered sales for history
  const filteredSales = useMemo(() => {
    return sales
      .filter((s) => {
        // If logged in as Vendedora, only see her own sales!
        if (currentUser.role === 'Vendedor' && s.sellerCode !== currentUser.code) {
          return false;
        }

        const matchSearch =
          s.code.toLowerCase().includes(historySearch.toLowerCase()) ||
          s.productName.toLowerCase().includes(historySearch.toLowerCase()) ||
          s.sellerName.toLowerCase().includes(historySearch.toLowerCase()) ||
          s.sellerCode.toLowerCase().includes(historySearch.toLowerCase()) ||
          (s.sucursal && s.sucursal.toLowerCase().includes(historySearch.toLowerCase()));

        const matchSeller = sellerFilter === 'all' || s.sellerCode === sellerFilter;
        const matchBranch = sucursalFilter === 'all' || s.sucursal === sucursalFilter;
        const matchDate = !dateFilter || s.date.startsWith(dateFilter);

        return matchSearch && matchSeller && matchBranch && matchDate;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [sales, historySearch, sellerFilter, sucursalFilter, dateFilter, currentUser]);

  const handleVoidSale = (s: Sale) => {
    if (
      window.confirm(
        `¿Deseas anular la venta ${s.code} de ${s.sucursal}? Esta acción devolverá las ${s.quantity} unidades de "${s.productName}" al stock de ${s.sucursal}.`
      )
    ) {
      onVoidSale(s.id);
    }
  };

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
      {/* Section Header */}
      <div className="bg-slate-850 border border-slate-700/80 rounded-xl p-6 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <ShoppingCart className="w-5 h-5" />
              </span>
              <h1 className="text-xl font-bold text-white tracking-tight">
                Módulo de Ventas & Caja · Múltiples Sucursales
              </h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Catálogo cerrado de 12 productos autorizados con menú desplegable, control de stock independiente por sucursal y cálculo automático en vivo.
            </p>
          </div>

          {/* Sub-view toggle */}
          <div className="p-1 bg-slate-900 rounded-lg border border-slate-700 flex items-center gap-1 text-xs self-start md:self-auto">
            <button
              onClick={() => setActiveTab('pos')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
                activeTab === 'pos'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              Punto de Venta (Nueva Venta)
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              Historial de Ventas ({sales.length})
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'pos' ? (
        /* POS Registration View */
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Left Form: Sale configuration (7 cols) */}
          <div className="xl:col-span-7 bg-slate-850 border border-slate-700/80 rounded-xl p-6 shadow-lg space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                Registrar Venta de Mostrador
              </h2>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-md ${getBranchBadgeStyle(activeSucursal)}`}>
                  <Building2 className="w-3.5 h-3.5" />
                  {activeSucursal}
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-emerald-400 border border-slate-700">
                  <Lock className="w-3 h-3" /> 12 Productos
                </span>
              </div>
            </div>

            {posError && (
              <div className="p-3 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{posError}</span>
              </div>
            )}

            {posSuccessMessage && (
              <div className="p-3 rounded-lg bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                <span>{posSuccessMessage}</span>
              </div>
            )}

            <form onSubmit={handleRegisterSale} className="space-y-4 text-xs">
              {/* Step 1: Salesperson & Branch */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-slate-300 font-semibold">
                    1. Vendedora y Sucursal de Atención *
                  </label>
                  {currentUser.role !== 'Vendedor' && (
                    <div className="flex items-center gap-1 text-[11px] text-slate-400">
                      <span>Caja de:</span>
                      {(['Sucursal 1', 'Sucursal 2', 'Sucursal 3'] as Sucursal[]).map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setManualBranch(s)}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                            activeSucursal === s
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {currentUser.role === 'Vendedor' ? (
                  <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/50 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-white text-xs">{currentUser.name}</p>
                        <span className={`px-2 py-0.2 rounded text-[10px] font-bold ${getBranchBadgeStyle(currentUser.sucursal || 'Sucursal 1')}`}>
                          {currentUser.sucursal || 'Sucursal 1'}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">Vendedora en turno activo (mostrador)</p>
                    </div>
                    <span className="font-mono text-xs text-emerald-400 font-bold bg-slate-900 px-2 py-1 rounded border border-emerald-800">
                      {currentUser.code}
                    </span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {sellers.map((s) => (
                      <button
                        type="button"
                        key={s.code}
                        onClick={() => {
                          setSelectedSellerCode(s.code);
                          setManualBranch(s.sucursal);
                        }}
                        className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                          selectedSellerCode === s.code
                            ? 'bg-emerald-950/70 border-emerald-500 text-white shadow-xs'
                            : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs">{s.name}</span>
                          <span className="font-mono text-[10px] text-emerald-400 font-bold bg-slate-800 px-1.5 py-0.5 rounded">
                            {s.code}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-[10px] text-slate-400">Vendedora</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${getBranchBadgeStyle(s.sucursal)}`}>
                            {s.sucursal}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Step 2: CLOSED DROPDOWN LIST (Menú Desplegable) with independent branch stock */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="product-select" className="text-slate-200 font-bold flex items-center gap-1.5">
                    <PackageCheck className="w-4 h-4 text-emerald-400" />
                    2. Seleccionar Producto (Catálogo de {activeSucursal}) *
                  </label>
                  <span className="text-[11px] text-emerald-400 font-mono font-semibold">
                    12 artículos en {activeSucursal}
                  </span>
                </div>

                {/* THE CLOSED SELECT DROPDOWN */}
                <div className="relative">
                  <select
                    id="product-select"
                    value={selectedProductCode}
                    onChange={(e) => setSelectedProductCode(e.target.value)}
                    className="w-full bg-slate-900 border-2 border-slate-700 hover:border-emerald-500 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm font-semibold text-white focus:outline-none shadow-inner transition-colors cursor-pointer"
                    required
                  >
                    {Object.entries(productsByCategory).map(([category, items]) => (
                      <optgroup key={category} label={`─── ${category.toUpperCase()} (${activeSucursal}) ───`} className="bg-slate-950 text-slate-400 font-bold">
                        {items.map((p) => {
                          const isLow = p.stockActual <= p.stockMinimo;
                          const isNone = p.stockActual <= 0;
                          return (
                            <option
                              key={`${p.code}-${p.sucursal}`}
                              value={p.code}
                              className={`bg-slate-900 text-white font-medium py-1 ${
                                isNone ? 'text-rose-400' : isLow ? 'text-amber-300' : 'text-slate-100'
                              }`}
                            >
                              {p.name} [{p.code}] — {formatCurrency(p.price)} — Stock en {activeSucursal}: {p.stockActual} unds {isNone ? '(AGOTADO)' : isLow ? '(BAJO)' : ''}
                            </option>
                          );
                        })}
                      </optgroup>
                    ))}
                  </select>
                </div>

                {/* Active Selected Product Badge Card */}
                {selectedProduct && (
                  <div className="mt-2.5 p-3.5 bg-slate-900/90 border border-slate-700/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-white text-sm">
                          {selectedProduct.name}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-emerald-400 border border-slate-700">
                          {selectedProduct.code}
                        </span>
                        <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800/80 text-slate-300 border border-slate-700">
                          {selectedProduct.category}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${getBranchBadgeStyle(activeSucursal)}`}>
                          {activeSucursal}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Stock independiente registrado en {activeSucursal}.
                      </p>
                    </div>

                    <div className="flex items-center gap-4 shrink-0 sm:border-l sm:border-slate-800 sm:pl-4">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Precio Unitario</span>
                        <span className="font-mono font-extrabold text-emerald-400 text-base tabular-nums">
                          {formatCurrency(selectedProduct.price)}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Stock en {activeSucursal}</span>
                        <span
                          className={`font-mono font-extrabold text-base tabular-nums ${
                            selectedProduct.stockActual <= 0
                              ? 'text-rose-400'
                              : selectedProduct.stockActual <= selectedProduct.stockMinimo
                              ? 'text-amber-400'
                              : 'text-white'
                          }`}
                        >
                          {selectedProduct.stockActual} <span className="text-xs font-normal text-slate-400">unds</span>
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                
                <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                  <span>Catálogo cerrado: la venta se descontará exclusivamente del stock de {activeSucursal}.</span>
                </p>
              </div>

              {/* Step 3: Quantity & Auto Calculation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    3. Cantidad a Vender *
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="w-9 h-9 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg border border-slate-700 flex items-center justify-center text-sm transition-colors cursor-pointer"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={1}
                      max={selectedProduct ? selectedProduct.stockActual : 999}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 text-center text-white font-mono font-bold text-sm focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedProduct && quantity < selectedProduct.stockActual) {
                          setQuantity((q) => q + 1);
                        }
                      }}
                      disabled={selectedProduct ? quantity >= selectedProduct.stockActual : false}
                      className="w-9 h-9 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-lg border border-slate-700 flex items-center justify-center text-sm transition-colors cursor-pointer"
                    >
                      +
                    </button>
                  </div>

                  {/* Stock validation warning */}
                  {selectedProduct && (
                    <div className="mt-1.5">
                      {isInsufficientStock ? (
                        <span className="text-[11px] text-rose-400 font-semibold flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Stock insuficiente en {activeSucursal} (quedan solo {selectedProduct.stockActual} unds)
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">
                          Quedarán {selectedProduct.stockActual - quantity} unidades en {activeSucursal}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    4. Método de Pago *
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Efectivo">Efectivo</option>
                    <option value="Tarjeta Débito/Crédito">Tarjeta Débito/Crédito</option>
                    <option value="Yape / Plin">Yape / Plin</option>
                    <option value="Transferencia Bancaria">Transferencia Bancaria</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Notas de Venta (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="ej. Entrega de mostrador, pago con sencillo..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Submit CTA */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isInsufficientStock || isOutOfStock || !selectedProduct}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg text-sm shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShoppingCart className="w-4 h-4" />
                  Confirmar Venta en {activeSucursal} y Descontar Stock
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Live Sale Summary Ticket Preview (5 cols) */}
          <div className="xl:col-span-5 bg-slate-850 border border-slate-700/80 rounded-xl p-6 shadow-lg flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-bold text-sm text-white uppercase tracking-wider flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-emerald-400" />
                  Resumen de la Transacción en Vivo
                </h3>
                <span className="text-[11px] font-mono text-emerald-400 font-bold">CÁLCULO AUTOMÁTICO</span>
              </div>

              {selectedProduct && selectedSeller ? (
                <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 space-y-3 font-mono text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Sucursal:</span>
                    <span className={`font-bold px-2 py-0.2 rounded text-[11px] ${getBranchBadgeStyle(activeSucursal)}`}>
                      {activeSucursal}
                    </span>
                  </div>

                  <div className="flex justify-between text-slate-400">
                    <span>Vendedora:</span>
                    <span className="text-white font-semibold">{selectedSeller.name} ({selectedSeller.code})</span>
                  </div>

                  <div className="flex justify-between text-slate-400">
                    <span>Producto Seleccionado:</span>
                    <span className="text-white font-semibold text-right">{selectedProduct.name}</span>
                  </div>

                  <div className="flex justify-between text-slate-400">
                    <span>Código de Producto:</span>
                    <span className="text-slate-300">{selectedProduct.code}</span>
                  </div>

                  <div className="flex justify-between text-slate-400">
                    <span>Categoría:</span>
                    <span className="text-slate-300">{selectedProduct.category}</span>
                  </div>

                  <div className="flex justify-between text-slate-400">
                    <span>Precio Unitario:</span>
                    <span className="text-slate-200 tabular-nums">{formatCurrency(selectedProduct.price)}</span>
                  </div>

                  <div className="flex justify-between text-slate-400">
                    <span>Cantidad a Despachar:</span>
                    <span className="text-slate-200 tabular-nums">{quantity} unidades</span>
                  </div>

                  <div className="flex justify-between text-slate-400">
                    <span>Medio de Pago:</span>
                    <span className="text-slate-300">{paymentMethod}</span>
                  </div>

                  {/* Visual calculation row */}
                  <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-500 font-sans italic">
                    Cálculo: {quantity} unidades × {formatCurrency(selectedProduct.price)} = {formatCurrency(calculatedTotal)}
                  </div>

                  {/* Total Banner */}
                  <div className="pt-3 border-t-2 border-slate-800 flex items-baseline justify-between">
                    <span className="font-sans font-bold text-sm uppercase text-slate-300">Total a Cobrar:</span>
                    <span className="text-2xl font-extrabold text-emerald-400 tabular-nums">
                      {formatCurrency(calculatedTotal)}
                    </span>
                  </div>
                </div>
              ) : null}

              {/* Warehouse Impact Notice */}
              <div className="bg-emerald-950/30 border border-emerald-800/40 rounded-lg p-3 text-xs text-emerald-300 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>Conexión Directa con el Almacén ({activeSucursal})</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Al confirmar, el sistema restará automáticamente {quantity} unidad(es) del stock disponible de {activeSucursal}, actualizando en el acto el panel del Administrador y las alertas de stock mínimo.
                </p>
              </div>
            </div>

            <div className="text-center pt-4 text-[11px] text-slate-500">
              Tienda Inés · Catálogo Oficial Limitado a 12 Ítems · Control Multitienda
            </div>
          </div>
        </div>
      ) : (
        /* Historical Sales Table View */
        <div className="space-y-4">
          {/* History Filters */}
          <div className="bg-slate-850 border border-slate-700/80 rounded-xl p-4 shadow-lg flex flex-col xl:flex-row items-center justify-between gap-4">
            <div className="relative w-full xl:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar boleta, producto o sucursal..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto justify-between xl:justify-end">
              {/* Sucursal Filter */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-400 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5" />
                  Sucursal:
                </span>
                <select
                  value={sucursalFilter}
                  onChange={(e) => setSucursalFilter(e.target.value as any)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="all">Todas las Sucursales</option>
                  <option value="Sucursal 1">Sucursal 1</option>
                  <option value="Sucursal 2">Sucursal 2</option>
                  <option value="Sucursal 3">Sucursal 3</option>
                </select>
              </div>

              {/* Seller Filter */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-400">Vendedora:</span>
                <select
                  value={sellerFilter}
                  onChange={(e) => setSellerFilter(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="all">Todas ({sellers.length})</option>
                  {sellers.map((s) => (
                    <option key={s.code} value={s.code}>
                      {s.code} - {s.name} ({s.sucursal})
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Filter */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-400">Fecha:</span>
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
                {dateFilter && (
                  <button
                    onClick={() => setDateFilter('')}
                    className="text-xs text-slate-400 hover:text-white cursor-pointer"
                  >
                    Limpiar
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Historical Table */}
          <div className="bg-slate-850 border border-slate-700/80 rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Boleta N°</th>
                    <th className="py-3 px-4">Sucursal</th>
                    <th className="py-3 px-4">Fecha y Hora</th>
                    <th className="py-3 px-4">Vendedora</th>
                    <th className="py-3 px-4">Producto</th>
                    <th className="py-3 px-4 text-right">Cant.</th>
                    <th className="py-3 px-4 text-right">Precio Unit.</th>
                    <th className="py-3 px-4 text-right">Total Calculado</th>
                    <th className="py-3 px-4">Medio de Pago</th>
                    <th className="py-3 px-4 text-center">Ticket</th>
                    <th className="py-3 px-4 text-right">Anular</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70 font-medium">
                  {filteredSales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-emerald-400 whitespace-nowrap">
                        {sale.code}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${getBranchBadgeStyle(sale.sucursal || 'Sucursal 1')}`}>
                          {sale.sucursal || 'Sucursal 1'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-300 font-mono text-[11px] whitespace-nowrap">
                        {formatDate(sale.date)}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-white">{sale.sellerName}</span>
                        <span className="text-[10px] font-mono text-slate-400 ml-1.5 px-1 bg-slate-800 rounded">
                          {sale.sellerCode}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-white">
                        <p className="font-semibold">{sale.productName}</p>
                        <span className="text-[10px] font-mono text-slate-400">{sale.productCode}</span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-200 tabular-nums">
                        {sale.quantity} unds
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-400 tabular-nums">
                        {formatCurrency(sale.unitPrice)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-extrabold text-emerald-400 text-sm tabular-nums">
                        {formatCurrency(sale.total)}
                      </td>
                      <td className="py-3 px-4 text-slate-300 text-[11px]">
                        {sale.paymentMethod}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => onViewReceipt(sale)}
                          className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                          title="Ver o Imprimir Comprobante"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleVoidSale(sale)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                          title={`Anular venta y reponer stock a ${sale.sucursal || 'Sucursal 1'}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredSales.length === 0 && (
                    <tr>
                      <td colSpan={11} className="py-8 text-center text-slate-400 text-xs">
                        No se encontraron ventas para los filtros seleccionados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
