import { User, Product, Sale, Attendance, StockNotice, Sucursal } from '../types';

const USERS_KEY = 'tienda_ines_users_v4';
const PRODUCTS_KEY = 'tienda_ines_products_v4';
const SALES_KEY = 'tienda_ines_sales_v4';
const ATTENDANCE_KEY = 'tienda_ines_attendance_v4';
const NOTICES_KEY = 'tienda_ines_notices_v4';
const SESSION_KEY = 'tienda_ines_active_session_v4';

export const SUCURSALES: Sucursal[] = ['Sucursal 1', 'Sucursal 2', 'Sucursal 3'];

export function loadActiveSessionUserCode(): string | null {
  try {
    return sessionStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

export function saveActiveSessionUserCode(code: string): void {
  try {
    sessionStorage.setItem(SESSION_KEY, code);
  } catch {}
}

export function clearActiveSession(): void {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {}
}

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getCurrentTimeString(): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

// Initial users with assigned branch and default PIN 1234
export const INITIAL_USERS: User[] = [
  {
    id: 'u-admin-1',
    code: 'ADMIN123',
    pin: '1234',
    name: 'Admin Desarrollador',
    role: 'Administrador',
    sucursal: 'Sucursal 1',
    phone: '+51 987 654 321',
    email: 'desarrollador@tiendaines.com',
    active: true,
    createdAt: '2026-01-10',
  },
  {
    id: 'u-ines-1',
    code: 'INES01',
    pin: '1234',
    name: 'Inés Morales (Jefa / Dueña)',
    role: 'Inés',
    sucursal: 'Sucursal 1',
    phone: '+51 999 888 777',
    email: 'jefa.ines@tiendaines.com',
    active: true,
    createdAt: '2026-01-10',
  },
  {
    id: 'u-vend-1',
    code: 'VEND01',
    pin: '1234',
    name: 'Pilar',
    role: 'Vendedor',
    sucursal: 'Sucursal 1',
    phone: '+51 912 345 678',
    email: 'pilar.ventas@tiendaines.com',
    active: true,
    createdAt: '2026-01-15',
  },
  {
    id: 'u-vend-2',
    code: 'VEND02',
    pin: '1234',
    name: 'Carmen Solís',
    role: 'Vendedor',
    sucursal: 'Sucursal 2',
    phone: '+51 923 456 789',
    email: 'carmen.ventas@tiendaines.com',
    active: true,
    createdAt: '2026-02-01',
  },
  {
    id: 'u-vend-3',
    code: 'VEND03',
    pin: '1234',
    name: 'Lucía Mendoza',
    role: 'Vendedor',
    sucursal: 'Sucursal 3',
    phone: '+51 934 567 890',
    email: 'lucia.ventas@tiendaines.com',
    active: true,
    createdAt: '2026-02-18',
  },
];

// The 12 official products base catalog
const CATALOG_BASE = [
  { code: 'PRD-01', name: 'Dulces Surtidos', category: 'Golosinas', price: 3.50, min: 10, desc: 'Bolsa surtida de caramelos y gomitas de sabores frutales.' },
  { code: 'PRD-02', name: 'Chocolates Crunch', category: 'Golosinas', price: 4.80, min: 10, desc: 'Tableta de chocolate con leche y arroz inflado crocante.' },
  { code: 'PRD-03', name: 'Pastillas Mentitas', category: 'Golosinas', price: 1.50, min: 15, desc: 'Cajita de pastillas refrescantes sabor menta intensa.' },
  { code: 'PRD-04', name: 'Cereales Ángel', category: 'Abarrotes', price: 8.50, min: 6, desc: 'Caja de hojuelas de maíz fortificadas con vitaminas.' },
  { code: 'PRD-05', name: 'Soda Coca-Cola 2L', category: 'Bebidas', price: 9.80, min: 8, desc: 'Gaseosa Coca-Cola Original botella familiar 2L.' },
  { code: 'PRD-06', name: 'Soda Fanta Naranja 2L', category: 'Bebidas', price: 8.50, min: 6, desc: 'Gaseosa sabor naranja botella de 2 Litros.' },
  { code: 'PRD-07', name: 'Soda Sprite 2L', category: 'Bebidas', price: 8.50, min: 6, desc: 'Gaseosa lima-limón botella familiar 2 Litros.' },
  { code: 'PRD-08', name: 'Pipocas de Maíz', category: 'Snacks', price: 2.80, min: 8, desc: 'Bolsa de maíz inflado pop corn con sal y mantequilla.' },
  { code: 'PRD-09', name: 'Chocolates Barra Sublime', category: 'Golosinas', price: 2.50, min: 12, desc: 'Barra clásica de chocolate con leche y maní tostado.' },
  { code: 'PRD-10', name: 'Pastillas Tic Tac', category: 'Golosinas', price: 2.00, min: 10, desc: 'Estuche de caramelos sabor menta o naranja.' },
  { code: 'PRD-11', name: 'Cereales Zucaritas', category: 'Abarrotes', price: 11.90, min: 5, desc: 'Hojuelas de maíz escarchadas con azúcar fortificadas.' },
  { code: 'PRD-12', name: 'Soda Coca-Cola Zero 500ml', category: 'Bebidas', price: 3.50, min: 8, desc: 'Bebida gaseosa sin azúcar presentación personal 500ml.' },
];

// Generate independent inventory stock rows per branch
export const INITIAL_PRODUCTS: Product[] = [
  // SUCURSAL 1 (Tienda Central)
  ...CATALOG_BASE.map((b, idx) => ({
    id: `prd-s1-${idx + 1}`,
    code: b.code,
    name: b.name,
    category: b.category,
    price: b.price,
    sucursal: 'Sucursal 1' as Sucursal,
    stockActual: b.code === 'PRD-09' ? 2 : b.code === 'PRD-02' ? 5 : b.code === 'PRD-06' ? 4 : 25,
    stockMinimo: b.min,
    description: b.desc,
    updatedAt: '2026-03-01',
  })),

  // SUCURSAL 2 (Tienda Norte)
  ...CATALOG_BASE.map((b, idx) => ({
    id: `prd-s2-${idx + 1}`,
    code: b.code,
    name: b.name,
    category: b.category,
    price: b.price,
    sucursal: 'Sucursal 2' as Sucursal,
    stockActual: b.code === 'PRD-06' ? 2 : b.code === 'PRD-05' ? 3 : b.code === 'PRD-08' ? 5 : 18,
    stockMinimo: b.min,
    description: b.desc,
    updatedAt: '2026-03-01',
  })),

  // SUCURSAL 3 (Tienda Sur)
  ...CATALOG_BASE.map((b, idx) => ({
    id: `prd-s3-${idx + 1}`,
    code: b.code,
    name: b.name,
    category: b.category,
    price: b.price,
    sucursal: 'Sucursal 3' as Sucursal,
    stockActual: b.code === 'PRD-08' ? 0 : b.code === 'PRD-03' ? 4 : b.code === 'PRD-11' ? 3 : 20,
    stockMinimo: b.min,
    description: b.desc,
    updatedAt: '2026-03-01',
  })),
];

export function getInitialSales(): Sale[] {
  const today = getTodayDateString();
  return [
    // Sucursal 1 (Pilar)
    {
      id: 'vta-001',
      code: 'VTA-001',
      date: `${today} 09:30:15`,
      sucursal: 'Sucursal 1',
      sellerCode: 'VEND01',
      sellerName: 'Pilar',
      productCode: 'PRD-05',
      productName: 'Soda Coca-Cola 2L',
      quantity: 3,
      unitPrice: 9.80,
      total: 29.40,
      paymentMethod: 'Tarjeta Débito/Crédito',
      notes: 'Cliente llevó gaseosas para evento',
    },
    {
      id: 'vta-002',
      code: 'VTA-002',
      date: `${today} 10:15:40`,
      sucursal: 'Sucursal 1',
      sellerCode: 'VEND01',
      sellerName: 'Pilar',
      productCode: 'PRD-09',
      productName: 'Chocolates Barra Sublime',
      quantity: 4,
      unitPrice: 2.50,
      total: 10.00,
      paymentMethod: 'Yape / Plin',
      notes: 'Compra de mostrador golosinas',
    },
    {
      id: 'vta-003',
      code: 'VTA-003',
      date: `${today} 11:45:00`,
      sucursal: 'Sucursal 1',
      sellerCode: 'VEND01',
      sellerName: 'Pilar',
      productCode: 'PRD-11',
      productName: 'Cereales Zucaritas',
      quantity: 2,
      unitPrice: 11.90,
      total: 23.80,
      paymentMethod: 'Efectivo',
      notes: 'Pago en efectivo exacto',
    },
    // Sucursal 2 (Carmen)
    {
      id: 'vta-004',
      code: 'VTA-004',
      date: `${today} 10:30:10`,
      sucursal: 'Sucursal 2',
      sellerCode: 'VEND02',
      sellerName: 'Carmen Solís',
      productCode: 'PRD-02',
      productName: 'Chocolates Crunch',
      quantity: 2,
      unitPrice: 4.80,
      total: 9.60,
      paymentMethod: 'Tarjeta Débito/Crédito',
    },
    {
      id: 'vta-005',
      code: 'VTA-005',
      date: `${today} 12:20:10`,
      sucursal: 'Sucursal 2',
      sellerCode: 'VEND02',
      sellerName: 'Carmen Solís',
      productCode: 'PRD-05',
      productName: 'Soda Coca-Cola 2L',
      quantity: 2,
      unitPrice: 9.80,
      total: 19.60,
      paymentMethod: 'Yape / Plin',
    },
    // Sucursal 3 (Lucía)
    {
      id: 'vta-006',
      code: 'VTA-006',
      date: `${today} 11:10:05`,
      sucursal: 'Sucursal 3',
      sellerCode: 'VEND03',
      sellerName: 'Lucía Mendoza',
      productCode: 'PRD-07',
      productName: 'Soda Sprite 2L',
      quantity: 2,
      unitPrice: 8.50,
      total: 17.00,
      paymentMethod: 'Efectivo',
    },
    {
      id: 'vta-007',
      code: 'VTA-007',
      date: `${today} 13:45:30`,
      sucursal: 'Sucursal 3',
      sellerCode: 'VEND03',
      sellerName: 'Lucía Mendoza',
      productCode: 'PRD-10',
      productName: 'Pastillas Tic Tac',
      quantity: 5,
      unitPrice: 2.00,
      total: 10.00,
      paymentMethod: 'Yape / Plin',
    },
  ];
}

export function getInitialAttendance(): Attendance[] {
  const today = getTodayDateString();
  return [
    {
      id: 'att-001',
      date: today,
      sucursal: 'Sucursal 1',
      sellerCode: 'VEND01',
      sellerName: 'Pilar',
      entryTime: '08:45',
      departureTime: '',
      status: 'A tiempo',
      notes: 'Llegó puntual para apertura de Sucursal 1',
    },
    {
      id: 'att-002',
      date: today,
      sucursal: 'Sucursal 2',
      sellerCode: 'VEND02',
      sellerName: 'Carmen Solís',
      entryTime: '09:18',
      departureTime: '',
      status: 'Tardanza',
      notes: 'Retraso de transporte público hacia Sucursal 2',
    },
    {
      id: 'att-003',
      date: today,
      sucursal: 'Sucursal 3',
      sellerCode: 'VEND03',
      sellerName: 'Lucía Mendoza',
      entryTime: '08:55',
      departureTime: '',
      status: 'A tiempo',
      notes: 'Puntual en Sucursal 3',
    },
  ];
}

export const INITIAL_STOCK_NOTICES: StockNotice[] = [
  {
    id: 'not-001',
    productCode: 'PRD-09',
    productName: 'Chocolates Barra Sublime',
    sucursal: 'Sucursal 1',
    sellerCode: 'VEND01',
    sellerName: 'Pilar',
    date: getTodayDateString(),
    reportedAt: '10:30',
    urgency: 'Agotado (Urgente)',
    notes: 'Solo quedan 2 barras en el exhibidor de Sucursal 1.',
    status: 'Pendiente',
  },
  {
    id: 'not-002',
    productCode: 'PRD-06',
    productName: 'Soda Fanta Naranja 2L',
    sucursal: 'Sucursal 2',
    sellerCode: 'VEND02',
    sellerName: 'Carmen Solís',
    date: getTodayDateString(),
    reportedAt: '12:00',
    urgency: 'Bajo Stock',
    notes: 'Quedan solo 2 botellas en refrigerador de Sucursal 2.',
    status: 'Pendiente',
  },
  {
    id: 'not-003',
    productCode: 'PRD-08',
    productName: 'Pipocas de Maíz',
    sucursal: 'Sucursal 3',
    sellerCode: 'VEND03',
    sellerName: 'Lucía Mendoza',
    date: getTodayDateString(),
    reportedAt: '11:15',
    urgency: 'Agotado (Urgente)',
    notes: 'Se acabaron por completo las pipocas en Sucursal 3.',
    status: 'Pendiente',
  },
];

// Storage helpers
export function loadUsers(): User[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) {
      saveUsers(INITIAL_USERS);
      return INITIAL_USERS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed.some(u => u.sucursal)) {
      saveUsers(INITIAL_USERS);
      return INITIAL_USERS;
    }
    return parsed;
  } catch {
    return INITIAL_USERS;
  }
}

export function saveUsers(users: User[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function loadProducts(): Product[] {
  try {
    const raw = localStorage.getItem(PRODUCTS_KEY);
    if (!raw) {
      saveProducts(INITIAL_PRODUCTS);
      return INITIAL_PRODUCTS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length !== 36 || !parsed.some(p => p.sucursal === 'Sucursal 1')) {
      saveProducts(INITIAL_PRODUCTS);
      return INITIAL_PRODUCTS;
    }
    return parsed;
  } catch {
    return INITIAL_PRODUCTS;
  }
}

export function saveProducts(products: Product[]): void {
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
}

export function loadSales(): Sale[] {
  try {
    const raw = localStorage.getItem(SALES_KEY);
    if (!raw) {
      const initial = getInitialSales();
      saveSales(initial);
      return initial;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed.some(s => s.sucursal)) {
      const initial = getInitialSales();
      saveSales(initial);
      return initial;
    }
    return parsed;
  } catch {
    return getInitialSales();
  }
}

export function saveSales(sales: Sale[]): void {
  localStorage.setItem(SALES_KEY, JSON.stringify(sales));
}

export function loadAttendance(): Attendance[] {
  try {
    const raw = localStorage.getItem(ATTENDANCE_KEY);
    if (!raw) {
      const initial = getInitialAttendance();
      saveAttendance(initial);
      return initial;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed.some(a => a.sucursal)) {
      const initial = getInitialAttendance();
      saveAttendance(initial);
      return initial;
    }
    return parsed;
  } catch {
    return getInitialAttendance();
  }
}

export function saveAttendance(records: Attendance[]): void {
  localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(records));
}

export function loadStockNotices(): StockNotice[] {
  try {
    const raw = localStorage.getItem(NOTICES_KEY);
    if (!raw) {
      saveStockNotices(INITIAL_STOCK_NOTICES);
      return INITIAL_STOCK_NOTICES;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed.some(n => n.sucursal)) {
      saveStockNotices(INITIAL_STOCK_NOTICES);
      return INITIAL_STOCK_NOTICES;
    }
    return parsed;
  } catch {
    return INITIAL_STOCK_NOTICES;
  }
}

export function saveStockNotices(notices: StockNotice[]): void {
  localStorage.setItem(NOTICES_KEY, JSON.stringify(notices));
}

export function resetAllData(): {
  users: User[];
  products: Product[];
  sales: Sale[];
  attendance: Attendance[];
  notices: StockNotice[];
} {
  saveUsers(INITIAL_USERS);
  saveProducts(INITIAL_PRODUCTS);
  const sales = getInitialSales();
  saveSales(sales);
  const attendance = getInitialAttendance();
  saveAttendance(attendance);
  saveStockNotices(INITIAL_STOCK_NOTICES);
  return {
    users: INITIAL_USERS,
    products: INITIAL_PRODUCTS,
    sales,
    attendance,
    notices: INITIAL_STOCK_NOTICES,
  };
}
