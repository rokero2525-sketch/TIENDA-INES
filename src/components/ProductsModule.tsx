import React, { useState, useMemo } from 'react';
import { Product, Sucursal } from '../types';
import { formatCurrency, getStockStatus } from '../utils/formatters';
import { SUCURSALES } from '../services/storage';
import { 
  Package, 
  Plus, 
  Search, 
  AlertTriangle, 
  AlertOctagon, 
  CheckCircle2, 
  Edit, 
  Trash2, 
  X, 
  Building2,
  Store,
  Layers
} from 'lucide-react';

interface ProductsModuleProps {
  products: Product[];
  onAddProduct: (product: Omit<Product, 'id' | 'updatedAt'>) => { success: boolean; error?: string };
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => { success: boolean; error?: string };
  onAdjustStock: (productId: string, amount: number) => void;
}

export const ProductsModule: React.FC<ProductsModuleProps> = ({
  products,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onAdjustStock,
}) => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [branchFilter, setBranchFilter] = useState<'all' | Sucursal>('all');
  const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'low_stock' | 'optimal'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form State
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Golosinas');
  const [sucursal, setSucursal] = useState<Sucursal>('Sucursal 1');
  const [price, setPrice] = useState<number | string>(3.50);
  const [stockActual, setStockActual] = useState<number | string>(20);
  const [stockMinimo, setStockMinimo] = useState<number | string>(8);
  const [description, setDescription] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Critical Low Stock Products (can be filtered by active branch)
  const lowStockProducts = useMemo(() => {
    return products.filter((p) => {
      const matchBranch = branchFilter === 'all' || p.sucursal === branchFilter;
      return matchBranch && p.stockActual <= p.stockMinimo;
    });
  }, [products, branchFilter]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

  const openAddModal = () => {
    setEditingProduct(null);
    setCode('PRD-01');
    setName('Dulces Surtidos');
    setCategory('Golosinas');
    setSucursal(branchFilter === 'all' ? 'Sucursal 1' : branchFilter);
    setPrice(3.50);
    setStockActual(20);
    setStockMinimo(8);
    setDescription('');
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setCode(p.code);
    setName(p.name);
    setCategory(p.category);
    setSucursal(p.sucursal || 'Sucursal 1');
    setPrice(p.price);
    setStockActual(p.stockActual);
    setStockMinimo(p.stockMinimo);
    setDescription(p.description || '');
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) {
      setErrorMessage('El código y el nombre del producto son requeridos.');
      return;
    }

    const numPrice = Number(price);
    const numActual = Number(stockActual);
    const numMin = Number(stockMinimo);

    if (isNaN(numPrice) || numPrice < 0) {
      setErrorMessage('El precio debe ser un número válido mayor o igual a 0.');
      return;
    }
    if (isNaN(numActual) || numActual < 0) {
      setErrorMessage('El stock actual debe ser un número mayor o igual a 0.');
      return;
    }
    if (isNaN(numMin) || numMin < 0) {
      setErrorMessage('El stock mínimo debe ser un número mayor o igual a 0.');
      return;
    }

    if (editingProduct) {
      onUpdateProduct({
        ...editingProduct,
        code: code.trim().toUpperCase(),
        name: name.trim(),
        category: category.trim(),
        sucursal,
        price: numPrice,
        stockActual: numActual,
        stockMinimo: numMin,
        description: description.trim(),
        updatedAt: new Date().toISOString().slice(0, 10),
      });
      setIsModalOpen(false);
    } else {
      const res = onAddProduct({
        code: code.trim().toUpperCase(),
        name: name.trim(),
        category: category.trim(),
        sucursal,
        price: numPrice,
        stockActual: numActual,
        stockMinimo: numMin,
        description: description.trim(),
      });
      if (!res.success) {
        setErrorMessage(res.error || 'Error al agregar producto.');
      } else {
        setIsModalOpen(false);
      }
    }
  };

  const handleDelete = (p: Product) => {
    if (window.confirm(`¿Estás seguro de eliminar el registro de "${p.name}" en ${p.sucursal}?`)) {
      onDeleteProduct(p.id);
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.code.toLowerCase().includes(search.toLowerCase()) ||
        p.category.toLowerCase().includes(search.toLowerCase());

      const matchCategory = categoryFilter === 'all' || p.category === categoryFilter;
      const matchBranch = branchFilter === 'all' || p.sucursal === branchFilter;

      let matchStock = true;
      if (stockStatusFilter === 'low_stock') {
        matchStock = p.stockActual <= p.stockMinimo;
      } else if (stockStatusFilter === 'optimal') {
        matchStock = p.stockActual > p.stockMinimo;
      }

      return matchSearch && matchCategory && matchBranch && matchStock;
    });
  }, [products, search, categoryFilter, branchFilter, stockStatusFilter]);

  return (
    <div className="space-y-6">
      {/* Visual Stock Alert Banner by Branch */}
      {lowStockProducts.length > 0 && (
        <div className="bg-gradient-to-r from-amber-950/90 via-red-950/80 to-amber-950/90 border-2 border-amber-500/60 rounded-xl p-5 shadow-2xl relative overflow-hidden animate-in fade-in duration-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 shrink-0">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-amber-200 uppercase tracking-wide">
                    Cartel Visual de Alerta: Falta Stock en {branchFilter === 'all' ? 'las Sucursales' : branchFilter}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 text-xs font-black">
                    {lowStockProducts.length} {lowStockProducts.length === 1 ? 'ARTÍCULO' : 'ARTÍCULOS'}
                  </span>
                </div>
                <p className="text-xs text-amber-100/80 mt-1 max-w-3xl">
                  Artículos con existencias por debajo del stock mínimo por sucursal. Requieren abastecimiento inmediato:
                </p>
                <div className="flex flex-wrap gap-2 mt-2.5">
                  {lowStockProducts.slice(0, 6).map((p) => (
                    <span
                      key={p.id}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-black/40 border border-amber-500/40 text-amber-300 font-mono text-xs font-bold"
                    >
                      <span className="text-[10px] text-amber-400 font-sans px-1 rounded bg-amber-950 border border-amber-700/60">
                        {p.sucursal}
                      </span>
                      <span>{p.name}:</span>
                      <span className="text-rose-400 font-extrabold">{p.stockActual} unds</span>
                      <span className="text-slate-400 font-normal">/ mín {p.stockMinimo}</span>
                    </span>
                  ))}
                  {lowStockProducts.length > 6 && (
                    <span className="text-xs text-amber-300 self-center font-bold">
                      +{lowStockProducts.length - 6} más...
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setStockStatusFilter('low_stock');
                setSearch('');
              }}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs shadow-lg transition-colors whitespace-nowrap self-start md:self-center cursor-pointer"
            >
              Filtrar Solo Falta Stock
            </button>
          </div>
        </div>
      )}

      {/* Main Section Header */}
      <div className="bg-slate-850 border border-slate-700/80 rounded-xl p-6 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <Package className="w-5 h-5" />
              </span>
              <h1 className="text-xl font-bold text-white tracking-tight">
                Almacén & Catálogo de Productos por Sucursal
              </h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Inventario independiente de los 12 productos oficiales con registro individual de existencias para Sucursal 1, Sucursal 2 y Sucursal 3.
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-md transition-all cursor-pointer self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            Registrar Fila en Almacén
          </button>
        </div>

        {/* Branch Filter Tabs as requested */}
        <div className="mt-5 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5 mr-1">
              <Building2 className="w-4 h-4 text-emerald-400" />
              Filtrar por Sucursal:
            </span>
            <div className="p-1 bg-slate-900 rounded-xl border border-slate-700 flex items-center gap-1 text-xs">
              <button
                onClick={() => setBranchFilter('all')}
                className={`px-3.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  branchFilter === 'all'
                    ? 'bg-slate-800 text-white shadow-xs border border-slate-600'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Todas las Sucursales ({products.length})
              </button>
              {SUCURSALES.map((suc) => {
                const count = products.filter((p) => p.sucursal === suc).length;
                const low = products.filter((p) => p.sucursal === suc && p.stockActual <= p.stockMinimo).length;
                return (
                  <button
                    key={suc}
                    onClick={() => setBranchFilter(suc)}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      branchFilter === suc
                        ? 'bg-emerald-600 text-white shadow-sm border border-emerald-500'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>{suc}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/40 text-slate-300">
                      {count}
                    </span>
                    {low > 0 && (
                      <span className="w-2 h-2 rounded-full bg-amber-400" title={`${low} alertas`} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar dulce, soda o código..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="p-1 bg-slate-900 rounded-lg border border-slate-700 flex items-center gap-1 text-xs">
              <button
                onClick={() => setStockStatusFilter('all')}
                className={`px-2.5 py-1 rounded-md font-medium ${
                  stockStatusFilter === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setStockStatusFilter('low_stock')}
                className={`px-2.5 py-1 rounded-md font-medium flex items-center gap-1 ${
                  stockStatusFilter === 'low_stock' ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'text-slate-400 hover:text-white'
                }`}
              >
                <AlertTriangle className="w-3 h-3 text-amber-400" />
                Bajo Stock
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Wide Desktop Warehouse Table */}
      <div className="bg-slate-850 border border-slate-700/80 rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Código</th>
                <th className="py-3 px-4">Producto</th>
                <th className="py-3 px-4">Sucursal</th>
                <th className="py-3 px-4">Categoría</th>
                <th className="py-3 px-4 text-right">Precio</th>
                <th className="py-3 px-4 text-center">Stock Actual</th>
                <th className="py-3 px-4 text-center">Stock Mínimo</th>
                <th className="py-3 px-4">Estado de Almacén</th>
                <th className="py-3 px-4 text-center">Reposición (+5 / +10)</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 font-medium">
              {filteredProducts.map((p) => {
                const status = getStockStatus(p.stockActual, p.stockMinimo);
                return (
                  <tr
                    key={p.id}
                    className={`transition-colors ${
                      status.isCritical
                        ? 'bg-amber-950/15 hover:bg-amber-950/30'
                        : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-white bg-slate-800 px-2.5 py-1 rounded border border-slate-700">
                        {p.code}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-white text-sm">{p.name}</p>
                      {p.description && (
                        <p className="text-[11px] text-slate-400 truncate max-w-xs">{p.description}</p>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold ${
                          p.sucursal === 'Sucursal 1'
                            ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                            : p.sucursal === 'Sucursal 2'
                            ? 'bg-blue-950/80 text-blue-300 border border-blue-800'
                            : 'bg-purple-950/80 text-purple-300 border border-purple-800'
                        }`}
                      >
                        <Building2 className="w-3.5 h-3.5" />
                        {p.sucursal}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-slate-300 bg-slate-800/60 px-2 py-0.5 rounded text-[11px]">
                        {p.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400 text-sm tabular-nums">
                      {formatCurrency(p.price)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`font-mono font-extrabold text-base tabular-nums ${
                          status.isCritical ? 'text-amber-400' : 'text-white'
                        }`}
                      >
                        {p.stockActual}
                      </span>
                      <span className="text-[10px] text-slate-400 block">unidades</span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-slate-400 tabular-nums">
                      {p.stockMinimo} unds
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold ${status.badgeBg}`}
                      >
                        {status.isCritical ? (
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        )}
                        {status.label}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => onAdjustStock(p.id, 5)}
                          className="px-2 py-1 bg-slate-800 hover:bg-emerald-700 text-slate-300 hover:text-white rounded border border-slate-700 text-[11px] font-mono transition-colors cursor-pointer"
                          title={`Sumar +5 unidades al stock de ${p.sucursal}`}
                        >
                          +5
                        </button>
                        <button
                          onClick={() => onAdjustStock(p.id, 10)}
                          className="px-2 py-1 bg-slate-800 hover:bg-emerald-700 text-slate-300 hover:text-white rounded border border-slate-700 text-[11px] font-mono transition-colors cursor-pointer"
                          title={`Sumar +10 unidades al stock de ${p.sucursal}`}
                        >
                          +10
                        </button>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditModal(p)}
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                          title="Editar producto o stock"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(p)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
                          title="Eliminar registro"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-800/80 px-6 py-4 flex items-center justify-between border-b border-slate-700">
              <h2 className="font-bold text-white text-base">
                {editingProduct ? 'Editar Producto del Almacén' : 'Nuevo Producto en Almacén'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
              {errorMessage && (
                <div className="p-3 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-300 flex items-center gap-2">
                  <AlertOctagon className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Código de Producto *
                  </label>
                  <input
                    type="text"
                    placeholder="ej. PRD-01"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono uppercase focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Categoría *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                    required
                  >
                    <option value="Golosinas">Golosinas</option>
                    <option value="Bebidas">Bebidas</option>
                    <option value="Abarrotes">Abarrotes</option>
                    <option value="Snacks">Snacks</option>
                  </select>
                </div>
              </div>

              {/* Requirement 2: Branch selection for product */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Sucursal de este Inventario *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {SUCURSALES.map((suc) => (
                    <button
                      type="button"
                      key={suc}
                      onClick={() => setSucursal(suc)}
                      className={`py-2 px-2 rounded-lg border text-center font-bold text-xs flex items-center justify-center gap-1 transition-all ${
                        sucursal === suc
                          ? 'bg-emerald-950 border-emerald-500 text-emerald-300 shadow-sm'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      <Building2 className="w-3.5 h-3.5" />
                      {suc}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Nombre del Producto *
                </label>
                <input
                  type="text"
                  placeholder="ej. Soda Coca-Cola 2L"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Precio Venta ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Stock en Sucursal *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={stockActual}
                    onChange={(e) => setStockActual(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Stock Mínimo *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={stockMinimo}
                    onChange={(e) => setStockMinimo(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-sm transition-colors"
                >
                  {editingProduct ? 'Guardar Cambios' : 'Registrar en Almacén'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
