import React, { useState, useMemo } from 'react';
import { Product, User, StockNotice, Sucursal } from '../types';
import { formatCurrency, getStockStatus } from '../utils/formatters';
import { 
  AlertTriangle, 
  Send, 
  CheckCircle2, 
  PackageX, 
  Check, 
  Clock, 
  Layers, 
  Flame,
  Building2,
  Store
} from 'lucide-react';

interface SellerShortagesProps {
  products: Product[];
  currentUser: User;
  stockNotices: StockNotice[];
  onAddNotice: (notice: Omit<StockNotice, 'id' | 'reportedAt' | 'date' | 'status'>) => void;
}

export const SellerShortages: React.FC<SellerShortagesProps> = ({
  products,
  currentUser,
  stockNotices,
  onAddNotice,
}) => {
  const [selectedBranch, setSelectedBranch] = useState<Sucursal>(
    currentUser.sucursal || 'Sucursal 1'
  );

  // Active branch: For Vendedor, locked to their branch; for Admin/Inés, selectable
  const activeBranch: Sucursal = useMemo(() => {
    if (currentUser.role === 'Vendedor') {
      return currentUser.sucursal || 'Sucursal 1';
    }
    return selectedBranch;
  }, [currentUser, selectedBranch]);

  // Products belonging to the active branch
  const branchProducts = useMemo(() => {
    return products.filter((p) => p.sucursal === activeBranch);
  }, [products, activeBranch]);

  const [selectedProductCode, setSelectedProductCode] = useState<string>('PRD-01');
  const [urgency, setUrgency] = useState<'Agotado (Urgente)' | 'Bajo Stock' | 'Por Terminar'>('Agotado (Urgente)');
  const [notes, setNotes] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  const selectedProduct = branchProducts.find((p) => p.code === selectedProductCode) || branchProducts[0];

  const handleReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    onAddNotice({
      productCode: selectedProduct.code,
      productName: selectedProduct.name,
      sucursal: activeBranch,
      sellerCode: currentUser.code,
      sellerName: currentUser.name,
      urgency,
      notes: notes.trim() || `Reportado por ${currentUser.name} desde ${activeBranch}.`,
    });

    setSuccessMsg(`¡Aviso enviado a la Jefa Inés y al Administrador sobre "${selectedProduct.name}" en ${activeBranch}!`);
    setNotes('');
    setTimeout(() => setSuccessMsg(''), 5000);
  };

  const outOfStock = branchProducts.filter((p) => p.stockActual <= 0);
  const lowStock = branchProducts.filter((p) => p.stockActual > 0 && p.stockActual <= p.stockMinimo);

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
      {/* Header */}
      <div className="bg-slate-850 border border-slate-700/80 rounded-xl p-6 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30">
                <AlertTriangle className="w-5 h-5" />
              </span>
              <h1 className="text-xl font-bold text-white tracking-tight">
                Faltantes & Alertas de Stock en Mostrador
              </h1>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-md ${getBranchBadgeStyle(activeBranch)}`}>
                {activeBranch}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Consulta en tiempo real qué dulces o sodas se están agotando en {activeBranch} y envía avisos inmediatos a la Jefa Inés para reponer mercadería.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {currentUser.role !== 'Vendedor' && (
              <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-lg p-1 text-xs">
                {(['Sucursal 1', 'Sucursal 2', 'Sucursal 3'] as Sucursal[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedBranch(s)}
                    className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                      activeBranch === s
                        ? 'bg-amber-500 text-slate-950 shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
            <div className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-rose-950/70 border border-rose-800 text-rose-300 font-bold">
              <PackageX className="w-4 h-4 text-rose-400" />
              <span>{outOfStock.length} Agotados</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-amber-950/70 border border-amber-800 text-amber-300 font-bold">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>{lowStock.length} Por agotarse</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left Column: Report Form (5 cols) */}
        <div className="xl:col-span-5 bg-slate-850 border border-slate-700/80 rounded-xl p-6 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-400" />
              Reportar Faltante en {activeBranch}
            </h2>
            <span className="text-xs text-slate-400">Atención inmediata</span>
          </div>

          {successMsg && (
            <div className="p-3 rounded-lg bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleReport} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Producto con Falta de Stock en {activeBranch} *
              </label>
              <select
                value={selectedProductCode}
                onChange={(e) => setSelectedProductCode(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-xs font-semibold focus:outline-none focus:border-amber-500 cursor-pointer"
                required
              >
                {branchProducts.map((p) => (
                  <option key={p.id} value={p.code} className="bg-slate-900 text-white">
                    {p.name} [{p.code}] — Stock en {activeBranch}: {p.stockActual} unds
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Nivel de Urgencia *
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'Agotado (Urgente)', label: 'Agotado (0 unds)', color: 'text-rose-400 border-rose-700 bg-rose-950/50' },
                  { id: 'Bajo Stock', label: 'Bajo Stock', color: 'text-amber-400 border-amber-700 bg-amber-950/50' },
                  { id: 'Por Terminar', label: 'Por Terminar', color: 'text-yellow-400 border-yellow-700 bg-yellow-950/50' },
                ].map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => setUrgency(item.id as any)}
                    className={`py-2 px-2 rounded-lg border text-center font-bold text-[11px] transition-all cursor-pointer ${
                      urgency === item.id
                        ? `${item.color} shadow-sm ring-1 ring-amber-500`
                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Detalle / Mensaje para la Jefa Inés y el Administrador
              </label>
              <textarea
                rows={3}
                placeholder="ej. No quedan botellas frías en el exhibidor principal de la sucursal..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              Enviar Aviso de Faltante Ahora
            </button>
          </form>

          {/* Recent notices by this seller */}
          <div className="mt-5 pt-4 border-t border-slate-800">
            <h3 className="font-bold text-xs text-white uppercase tracking-wider mb-2">
              Mis Avisos Enviados Hoy
            </h3>
            <div className="space-y-2 max-h-44 overflow-y-auto">
              {stockNotices
                .filter((n) => n.sellerCode === currentUser.code)
                .map((n) => (
                  <div key={n.id} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-white">{n.productName}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${getBranchBadgeStyle(n.sucursal)}`}>
                          {n.sucursal}
                        </span>
                      </div>
                      <span className="text-[10px] text-amber-400 font-mono">{n.reportedAt}</span>
                    </div>
                    <p className="text-slate-400 text-[11px] mt-0.5">{n.notes}</p>
                  </div>
                ))}
              {stockNotices.filter((n) => n.sellerCode === currentUser.code).length === 0 && (
                <p className="text-slate-500 text-[11px]">No has enviado reportes de faltantes hoy.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Full Status of 12 Products in this branch (7 cols) */}
        <div className="xl:col-span-7 bg-slate-850 border border-slate-700/80 rounded-xl p-6 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              Existencias en {activeBranch} (12 Productos)
            </h2>
            <span className="text-xs text-slate-400">Stock independiente</span>
          </div>

          <div className="overflow-x-auto max-h-[580px] overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-slate-850 border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider z-10">
                <tr>
                  <th className="py-2.5 px-3">Producto</th>
                  <th className="py-2.5 px-3">Categoría</th>
                  <th className="py-2.5 px-3 text-right">Precio</th>
                  <th className="py-2.5 px-3 text-center">Stock en {activeBranch}</th>
                  <th className="py-2.5 px-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 font-medium">
                {branchProducts.map((p) => {
                  const status = getStockStatus(p.stockActual, p.stockMinimo);
                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        status.isCritical ? 'bg-amber-950/15' : ''
                      }`}
                    >
                      <td className="py-3 px-3">
                        <p className="font-bold text-white">{p.name}</p>
                        <span className="text-[10px] font-mono text-slate-400">{p.code}</span>
                      </td>
                      <td className="py-3 px-3 text-slate-300">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] border border-slate-700">
                          {p.category}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400 tabular-nums">
                        {formatCurrency(p.price)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`font-mono font-black text-sm tabular-nums ${
                            p.stockActual <= 0
                              ? 'text-rose-400'
                              : p.stockActual <= p.stockMinimo
                              ? 'text-amber-400'
                              : 'text-white'
                          }`}
                        >
                          {p.stockActual}
                        </span>
                        <span className="text-[10px] text-slate-400 block">mínimo {p.stockMinimo}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold ${status.badgeBg}`}>
                          {status.isCritical ? <AlertTriangle className="w-3 h-3 shrink-0" /> : <Check className="w-3 h-3 shrink-0" />}
                          {status.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
