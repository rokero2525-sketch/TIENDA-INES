export function formatCurrency(amount: number): string {
  return `$ ${amount.toLocaleString('es-PE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    const parts = dateStr.split(' ');
    const datePart = parts[0];
    const timePart = parts[1];
    const [year, month, day] = datePart.split('-');
    
    if (timePart) {
      return `${day}/${month}/${year} ${timePart.slice(0, 5)}`;
    }
    return `${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
}

export function getStockStatus(stockActual: number, stockMinimo: number): {
  isCritical: boolean;
  isLow: boolean;
  label: string;
  colorClass: string;
  badgeBg: string;
} {
  if (stockActual <= 0) {
    return {
      isCritical: true,
      isLow: true,
      label: 'Sin Stock (Agotado)',
      colorClass: 'text-rose-400',
      badgeBg: 'bg-rose-950/80 text-rose-300 border border-rose-800',
    };
  }
  if (stockActual <= stockMinimo) {
    return {
      isCritical: true,
      isLow: true,
      label: `Alerta: Stock Bajo (${stockActual}/${stockMinimo})`,
      colorClass: 'text-amber-400',
      badgeBg: 'bg-amber-950/80 text-amber-300 border border-amber-800',
    };
  }
  if (stockActual <= stockMinimo * 1.5) {
    return {
      isCritical: false,
      isLow: false,
      label: 'Stock Próximo al Mínimo',
      colorClass: 'text-yellow-400',
      badgeBg: 'bg-yellow-950/60 text-yellow-300 border border-yellow-800',
    };
  }
  return {
    isCritical: false,
    isLow: false,
    label: 'Stock Óptimo',
    colorClass: 'text-emerald-400',
    badgeBg: 'bg-emerald-950/60 text-emerald-300 border border-emerald-800',
  };
}
