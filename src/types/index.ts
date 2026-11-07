export type UserRole = 'Administrador' | 'Inés' | 'Vendedor';

export type Sucursal = 'Sucursal 1' | 'Sucursal 2' | 'Sucursal 3';

export interface User {
  id: string;
  code: string; // e.g. ADMIN123, INES01, VEND01
  pin?: string; // 4-digit PIN for secure authentication
  name: string;
  role: UserRole;
  sucursal: Sucursal;
  phone?: string;
  email?: string;
  active: boolean;
  createdAt: string;
}

export interface Product {
  id: string;
  code: string; // e.g. PRD-01
  name: string;
  category: string;
  price: number;
  sucursal: Sucursal;
  stockActual: number;
  stockMinimo: number;
  description?: string;
  updatedAt: string;
}

export type PaymentMethod = 'Efectivo' | 'Tarjeta Débito/Crédito' | 'Transferencia Bancaria' | 'Yape / Plin';

export interface Sale {
  id: string;
  code: string; // e.g. VTA-2026-001
  date: string; // YYYY-MM-DD HH:mm:ss
  sucursal: Sucursal;
  sellerCode: string; // e.g. VEND01
  sellerName: string; // e.g. Pilar
  productCode: string; // e.g. PRD-01
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number; // quantity * unitPrice
  paymentMethod: PaymentMethod;
  notes?: string;
}

export type AttendanceStatus = 'A tiempo' | 'Tardanza' | 'Justificado' | 'Falta';

export interface Attendance {
  id: string;
  date: string; // YYYY-MM-DD
  sucursal: Sucursal;
  sellerCode: string;
  sellerName: string;
  entryTime: string; // HH:mm
  departureTime?: string; // HH:mm
  status: AttendanceStatus;
  notes?: string;
}

export interface StockNotice {
  id: string;
  productCode: string;
  productName: string;
  sucursal: Sucursal;
  sellerCode: string;
  sellerName: string;
  date: string;
  reportedAt: string;
  notes: string;
  urgency: 'Agotado (Urgente)' | 'Bajo Stock' | 'Por Terminar';
  status: 'Pendiente' | 'Atendido';
}
