import { useState, useEffect, useMemo } from 'react';
import { User, Product, Sale, Attendance, PaymentMethod, StockNotice, Sucursal } from './types';
import { 
  loadUsers, 
  saveUsers, 
  loadProducts, 
  saveProducts, 
  loadSales, 
  saveSales, 
  loadAttendance, 
  saveAttendance, 
  loadStockNotices,
  saveStockNotices,
  resetAllData,
  getTodayDateString,
  getCurrentTimeString,
  loadActiveSessionUserCode,
  saveActiveSessionUserCode,
  clearActiveSession
} from './services/storage';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { LoginScreen } from './components/LoginScreen';
import { InesDashboard } from './components/InesDashboard';
import { SellerShortages } from './components/SellerShortages';
import { AdminInspector } from './components/AdminInspector';
import { UsersModule } from './components/UsersModule';
import { ProductsModule } from './components/ProductsModule';
import { SalesModule } from './components/SalesModule';
import { AttendanceModule } from './components/AttendanceModule';
import { ReceiptModal } from './components/ReceiptModal';

export default function App() {
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [stockNotices, setStockNotices] = useState<StockNotice[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentTab, setCurrentTab] = useState<string>('admin');
  const [activeReceiptSale, setActiveReceiptSale] = useState<Sale | null>(null);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  // Initialize data from LocalStorage
  useEffect(() => {
    const loadedUsers = loadUsers();
    const loadedProducts = loadProducts();
    const loadedSales = loadSales();
    const loadedAttendance = loadAttendance();
    const loadedNotices = loadStockNotices();

    setUsers(loadedUsers);
    setProducts(loadedProducts);
    setSales(loadedSales);
    setAttendance(loadedAttendance);
    setStockNotices(loadedNotices);

    // SECURITY CHECK:
    // Do NOT automatically default to ADMIN123 when opening the link!
    // Check if an authorized session already exists in sessionStorage
    const savedUserCode = loadActiveSessionUserCode();
    if (savedUserCode) {
      const activeUser = loadedUsers.find(
        (u) => u.code.toUpperCase() === savedUserCode.toUpperCase() && u.active
      );
      if (activeUser) {
        setCurrentUser(activeUser);
        if (activeUser.role === 'Inés') setCurrentTab('ines_dashboard');
        else if (activeUser.role === 'Vendedor') setCurrentTab('sales');
        else setCurrentTab('admin');
      } else {
        clearActiveSession();
        setCurrentUser(null);
      }
    } else {
      // Unauthenticated: display Login Screen
      setCurrentUser(null);
    }
    setIsLoaded(true);
  }, []);

  // Safe navigation guard based on role
  const effectiveTab = useMemo(() => {
    if (!currentUser) return currentTab;

    if (currentUser.role === 'Vendedor') {
      // Vendedor can ONLY see: sales, shortages, attendance
      if (!['sales', 'shortages', 'attendance'].includes(currentTab)) {
        return 'sales';
      }
    } else if (currentUser.role === 'Inés') {
      // Inés can see: ines_dashboard, admin, attendance, products, shortages
      if (!['ines_dashboard', 'admin', 'attendance', 'products', 'shortages'].includes(currentTab)) {
        return 'ines_dashboard';
      }
    }
    return currentTab;
  }, [currentTab, currentUser]);

  // Login Handler
  const handleLogin = (user: User) => {
    saveActiveSessionUserCode(user.code);
    setCurrentUser(user);
    if (user.role === 'Inés') {
      setCurrentTab('ines_dashboard');
    } else if (user.role === 'Vendedor') {
      setCurrentTab('sales');
    } else {
      setCurrentTab('admin');
    }
  };

  // Logout Handler
  const handleLogout = () => {
    clearActiveSession();
    setCurrentUser(null);
  };

  // Handle switching user (for Admin simulation)
  const handleSelectUser = (user: User) => {
    saveActiveSessionUserCode(user.code);
    setCurrentUser(user);
    if (user.role === 'Inés') {
      setCurrentTab('ines_dashboard');
    } else if (user.role === 'Vendedor') {
      setCurrentTab('sales');
    } else {
      setCurrentTab('admin');
    }
  };

  // Add Notice from Seller
  const handleAddStockNotice = (noticeData: Omit<StockNotice, 'id' | 'reportedAt' | 'date' | 'status'>) => {
    const newNotice: StockNotice = {
      ...noticeData,
      id: `not-${Date.now()}`,
      date: getTodayDateString(),
      reportedAt: getCurrentTimeString(),
      status: 'Pendiente',
    };
    const updated = [newNotice, ...stockNotices];
    setStockNotices(updated);
    saveStockNotices(updated);
  };

  // User Handlers
  const handleAddUser = (userData: Omit<User, 'id' | 'createdAt'>) => {
    const exists = users.some(
      (u) => u.code.toUpperCase() === userData.code.toUpperCase()
    );
    if (exists) {
      return { success: false, error: `Ya existe un usuario con el código "${userData.code}".` };
    }

    const newUser: User = {
      ...userData,
      id: `u-${Date.now()}`,
      createdAt: getTodayDateString(),
    };
    const updated = [...users, newUser];
    setUsers(updated);
    saveUsers(updated);
    return { success: true };
  };

  const handleUpdateUser = (updatedUser: User) => {
    const updated = users.map((u) => (u.id === updatedUser.id ? updatedUser : u));
    setUsers(updated);
    saveUsers(updated);
    if (currentUser?.id === updatedUser.id) {
      if (!updatedUser.active) {
        const admin = updated.find((u) => u.code === 'ADMIN123') || updated[0];
        setCurrentUser(admin);
        setCurrentTab('users');
      } else {
        setCurrentUser(updatedUser);
      }
    }
  };

  const handleDeleteUser = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (user?.code === 'ADMIN123' || user?.code === 'INES01') {
      return { success: false, error: 'No se puede eliminar las cuentas principales del sistema.' };
    }
    const updated = users.filter((u) => u.id !== userId);
    setUsers(updated);
    saveUsers(updated);
    return { success: true };
  };

  // Products Handlers
  const handleAddProduct = (productData: Omit<Product, 'id' | 'updatedAt'>) => {
    const exists = products.some(
      (p) => p.code.toUpperCase() === productData.code.toUpperCase()
    );
    if (exists) {
      return { success: false, error: `Ya existe un producto con el código "${productData.code}".` };
    }

    const newProd: Product = {
      ...productData,
      id: `p-${Date.now()}`,
      updatedAt: getTodayDateString(),
    };
    const updated = [...products, newProd];
    setProducts(updated);
    saveProducts(updated);
    return { success: true };
  };

  const handleUpdateProduct = (updatedProduct: Product) => {
    const updated = products.map((p) => (p.id === updatedProduct.id ? updatedProduct : p));
    setProducts(updated);
    saveProducts(updated);
  };

  const handleDeleteProduct = (productId: string) => {
    const updated = products.filter((p) => p.id !== productId);
    setProducts(updated);
    saveProducts(updated);
    return { success: true };
  };

  const handleAdjustStock = (productId: string, amount: number) => {
    const updated = products.map((p) => {
      if (p.id === productId) {
        return {
          ...p,
          stockActual: Math.max(0, p.stockActual + amount),
          updatedAt: getTodayDateString(),
        };
      }
      return p;
    });
    setProducts(updated);
    saveProducts(updated);
  };

  // Sales Handlers with AUTOMATIC STOCK REDUCTION per Branch (Sucursal)
  const handleRegisterSale = (saleData: {
    sucursal: Sucursal;
    sellerCode: string;
    sellerName: string;
    productCode: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    paymentMethod: PaymentMethod;
    notes?: string;
  }) => {
    const targetProduct = products.find((p) => p.code === saleData.productCode && p.sucursal === saleData.sucursal);
    if (!targetProduct) {
      return { success: false, error: `Producto no encontrado en inventario de ${saleData.sucursal}.` };
    }

    if (targetProduct.stockActual < saleData.quantity) {
      return {
        success: false,
        error: `Stock insuficiente en ${saleData.sucursal}. Solo quedan ${targetProduct.stockActual} unidades disponibles de "${targetProduct.name}".`,
      };
    }

    // 1. Subtract quantity from product stock in that specific branch
    const updatedProducts = products.map((p) => {
      if (p.code === saleData.productCode && p.sucursal === saleData.sucursal) {
        return {
          ...p,
          stockActual: p.stockActual - saleData.quantity,
          updatedAt: getTodayDateString(),
        };
      }
      return p;
    });

    // 2. Create Sale Record with calculated total and branch
    const now = new Date();
    const todayStr = getTodayDateString();
    const timeStr = `${getCurrentTimeString()}:${String(now.getSeconds()).padStart(2, '0')}`;
    const nextCodeNumber = sales.length + 1;
    const saleCode = `VTA-${String(nextCodeNumber).padStart(4, '0')}`;

    const newSale: Sale = {
      id: `vta-${Date.now()}`,
      code: saleCode,
      date: `${todayStr} ${timeStr}`,
      sucursal: saleData.sucursal,
      sellerCode: saleData.sellerCode,
      sellerName: saleData.sellerName,
      productCode: saleData.productCode,
      productName: saleData.productName,
      quantity: saleData.quantity,
      unitPrice: saleData.unitPrice,
      total: saleData.quantity * saleData.unitPrice,
      paymentMethod: saleData.paymentMethod,
      notes: saleData.notes,
    };

    const updatedSales = [newSale, ...sales];

    // Atomically persist both
    setProducts(updatedProducts);
    saveProducts(updatedProducts);

    setSales(updatedSales);
    saveSales(updatedSales);

    return { success: true, sale: newSale };
  };

  // Void Sale & restore stock to specific branch
  const handleVoidSale = (saleId: string) => {
    const sale = sales.find((s) => s.id === saleId);
    if (!sale) return { success: false, error: 'Venta no encontrada.' };

    // Restore stock to product in the matching sucursal
    const updatedProducts = products.map((p) => {
      if (p.code === sale.productCode && p.sucursal === sale.sucursal) {
        return {
          ...p,
          stockActual: p.stockActual + sale.quantity,
          updatedAt: getTodayDateString(),
        };
      }
      return p;
    });

    const updatedSales = sales.filter((s) => s.id !== saleId);

    setProducts(updatedProducts);
    saveProducts(updatedProducts);
    setSales(updatedSales);
    saveSales(updatedSales);

    return { success: true };
  };

  // Attendance Handlers
  const handleRegisterAttendance = (recordData: Omit<Attendance, 'id'>) => {
    const newRecord: Attendance = {
      ...recordData,
      id: `att-${Date.now()}`,
    };
    const updated = [newRecord, ...attendance];
    setAttendance(updated);
    saveAttendance(updated);
    return { success: true };
  };

  const handleUpdateAttendance = (updatedRecord: Attendance) => {
    const updated = attendance.map((a) => (a.id === updatedRecord.id ? updatedRecord : a));
    setAttendance(updated);
    saveAttendance(updated);
  };

  const handleDeleteAttendance = (attendanceId: string) => {
    const updated = attendance.filter((a) => a.id !== attendanceId);
    setAttendance(updated);
    saveAttendance(updated);
  };

  // Reset to initial seed data
  const handleResetData = () => {
    const initial = resetAllData();
    setUsers(initial.users);
    setProducts(initial.products);
    setSales(initial.sales);
    setAttendance(initial.attendance);
    setStockNotices(initial.notices);
    const admin = initial.users.find((u) => u.code === 'ADMIN123') || initial.users[0];
    setCurrentUser(admin);
    setCurrentTab('admin');
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400 font-mono text-sm">
        Cargando sistema comercial Tienda Inés...
      </div>
    );
  }

  // If not authenticated, display the secure Login Screen!
  if (!currentUser) {
    return <LoginScreen users={users} onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex antialiased">
      {/* Dynamic Desktop Sidebar (Menú Lateral que cambia por Rol) */}
      <Sidebar
        currentTab={effectiveTab}
        setCurrentTab={setCurrentTab}
        currentUser={currentUser}
        users={users}
        onSelectUser={handleSelectUser}
        products={products}
        stockNotices={stockNotices}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto min-h-screen">
        {/* Top Header */}
        <TopBar
          currentTab={effectiveTab}
          currentUser={currentUser}
          products={products}
          stockNotices={stockNotices}
          onResetData={handleResetData}
          onGoToShortages={() => setCurrentTab('shortages')}
          onLogout={handleLogout}
        />

        {/* Content Viewport */}
        <main className="flex-1 p-6 max-w-[1600px] w-full mx-auto">
          {/* 1. Inés Boss Dashboard */}
          {effectiveTab === 'ines_dashboard' && (
            <InesDashboard
              users={users}
              sales={sales}
              products={products}
              attendance={attendance}
              stockNotices={stockNotices}
              onViewReceipt={setActiveReceiptSale}
            />
          )}

          {/* 2. Admin & Sellers Audit Panel */}
          {effectiveTab === 'admin' && (
            <AdminInspector
              users={users}
              sales={sales}
              products={products}
              attendance={attendance}
              onViewReceipt={setActiveReceiptSale}
            />
          )}

          {/* 3. POS Sales Registration & History */}
          {effectiveTab === 'sales' && (
            <SalesModule
              sales={sales}
              products={products}
              users={users}
              currentUser={currentUser}
              onRegisterSale={handleRegisterSale}
              onVoidSale={handleVoidSale}
              onViewReceipt={setActiveReceiptSale}
            />
          )}

          {/* 4. Shortages & Low Stock Alerts Screen */}
          {effectiveTab === 'shortages' && (
            <SellerShortages
              products={products}
              currentUser={currentUser}
              stockNotices={stockNotices}
              onAddNotice={handleAddStockNotice}
            />
          )}

          {/* 5. Products Catalog & Warehouse Master Table */}
          {effectiveTab === 'products' && (
            <ProductsModule
              products={products}
              onAddProduct={handleAddProduct}
              onUpdateProduct={handleUpdateProduct}
              onDeleteProduct={handleDeleteProduct}
              onAdjustStock={handleAdjustStock}
            />
          )}

          {/* 6. Daily Attendance Tracker */}
          {effectiveTab === 'attendance' && (
            <AttendanceModule
              attendance={attendance}
              users={users}
              currentUser={currentUser}
              onRegisterAttendance={handleRegisterAttendance}
              onUpdateAttendance={handleUpdateAttendance}
              onDeleteAttendance={handleDeleteAttendance}
            />
          )}

          {/* 7. Users, Codes & Roles Management */}
          {effectiveTab === 'users' && (
            <UsersModule
              users={users}
              currentUser={currentUser}
              onAddUser={handleAddUser}
              onUpdateUser={handleUpdateUser}
              onDeleteUser={handleDeleteUser}
            />
          )}
        </main>

        {/* Desktop Footer */}
        <footer className="border-t border-slate-900 bg-slate-950/80 py-3.5 px-6 text-xs text-slate-500">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>Tienda Inés · Sistema Integral para Computadora con Roles Protegidos</span>
            <div className="flex items-center gap-3 font-mono text-[11px]">
              <span className="text-purple-400">ADMIN123 (Desarrollador)</span>
              <span>·</span>
              <span className="text-amber-400">INES01 (Jefa)</span>
              <span>·</span>
              <span className="text-blue-400">VEND01 (Pilar)</span>
            </div>
          </div>
        </footer>
      </div>

      {/* Printable Receipt Modal */}
      <ReceiptModal
        sale={activeReceiptSale}
        onClose={() => setActiveReceiptSale(null)}
      />
    </div>
  );
}
