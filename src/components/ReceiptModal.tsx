import React from 'react';
import { Sale } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { Printer, X, CheckCircle2 } from 'lucide-react';

interface ReceiptModalProps {
  sale: Sale | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ sale, onClose }) => {
  if (!sale) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-800/80 px-6 py-4 flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center gap-2 text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-semibold text-white">Comprobante de Venta</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Ticket Content */}
        <div className="p-6 bg-white text-slate-900 font-mono text-sm space-y-4 shadow-inner">
          <div className="text-center pb-3 border-b border-dashed border-slate-300">
            <h2 className="text-xl font-bold tracking-tight text-slate-950 font-sans uppercase">Tienda Inés</h2>
            <p className="text-xs text-slate-500 font-sans">Sistema de Punto de Venta & Almacén</p>
            <p className="text-xs text-slate-500 font-sans mt-0.5">RUC: 20459871231 · Calle Comercio 450</p>
          </div>

          <div className="space-y-1 text-xs border-b border-dashed border-slate-300 pb-3">
            <div className="flex justify-between">
              <span className="text-slate-500">Ticket N°:</span>
              <span className="font-semibold">{sale.code}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Sucursal:</span>
              <span className="font-bold text-slate-900">{sale.sucursal || 'Sucursal 1'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Fecha y Hora:</span>
              <span>{formatDate(sale.date)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Atendido por:</span>
              <span className="font-semibold text-slate-900">{sale.sellerName} ({sale.sellerCode})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Medio de Pago:</span>
              <span className="font-medium">{sale.paymentMethod}</span>
            </div>
          </div>

          {/* Product detail */}
          <div className="space-y-2 border-b border-dashed border-slate-300 pb-3">
            <div className="flex justify-between font-bold text-xs uppercase text-slate-700">
              <span>Descripción / Cant.</span>
              <span>Importe</span>
            </div>
            <div className="flex justify-between items-start text-xs">
              <div>
                <p className="font-semibold text-slate-900">{sale.productName}</p>
                <p className="text-slate-500 text-[11px]">
                  Cód: {sale.productCode} · {sale.quantity} unds x {formatCurrency(sale.unitPrice)}
                </p>
              </div>
              <span className="font-semibold tabular-nums text-slate-900 text-sm">
                {formatCurrency(sale.total)}
              </span>
            </div>
          </div>

          {/* Total */}
          <div className="pt-1 flex justify-between items-baseline">
            <span className="font-sans font-bold text-base uppercase text-slate-900">Total a Pagar:</span>
            <span className="font-sans font-extrabold text-xl tabular-nums text-emerald-700">
              {formatCurrency(sale.total)}
            </span>
          </div>

          {sale.notes && (
            <p className="text-[11px] text-slate-500 italic pt-1 border-t border-slate-100">
              Nota: {sale.notes}
            </p>
          )}

          <div className="text-center pt-2 text-[11px] text-slate-400 font-sans">
            ¡Gracias por su compra en Tienda Inés!
            <br />
            Conserve este comprobante para cambios dentro de 7 días.
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 bg-slate-800/90 border-t border-slate-700 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-300 hover:text-white rounded-lg hover:bg-slate-700 transition-colors"
          >
            Cerrar
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 text-sm font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg flex items-center gap-2 shadow-sm transition-colors"
          >
            <Printer className="w-4 h-4" />
            Imprimir Ticket
          </button>
        </div>
      </div>
    </div>
  );
};
