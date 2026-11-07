import React, { useState, useMemo } from 'react';
import { User, UserRole, Sucursal } from '../types';
import { formatDate } from '../utils/formatters';
import { SUCURSALES } from '../services/storage';
import { 
  Users, 
  UserPlus, 
  Search, 
  ShieldCheck, 
  Briefcase, 
  Crown,
  Trash2, 
  Edit, 
  X, 
  Check, 
  AlertCircle,
  Lock,
  Unlock,
  UserX,
  UserCheck,
  KeyRound,
  Building2
} from 'lucide-react';

interface UsersModuleProps {
  users: User[];
  onAddUser: (user: Omit<User, 'id' | 'createdAt'>) => { success: boolean; error?: string };
  onUpdateUser: (user: User) => void;
  onDeleteUser: (userId: string) => { success: boolean; error?: string };
  currentUser: User;
}

export const UsersModule: React.FC<UsersModuleProps> = ({
  users,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  currentUser,
}) => {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [branchFilter, setBranchFilter] = useState<'all' | Sucursal>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'blocked'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form State
  const [code, setCode] = useState('');
  const [pin, setPin] = useState('1234');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('Vendedor');
  const [sucursal, setSucursal] = useState<Sucursal>('Sucursal 1');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [isActive, setIsActive] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successToast, setSuccessToast] = useState('');

  const triggerToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(''), 4500);
  };

  const openAddModal = () => {
    setEditingUser(null);
    const nextVendorNum = users.filter((u) => u.role === 'Vendedor').length + 1;
    setCode(`VEND0${nextVendorNum}`);
    setPin('1234');
    setName('');
    setRole('Vendedor');
    setSucursal('Sucursal 1');
    setPhone('');
    setEmail('');
    setIsActive(true);
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const openEditModal = (u: User) => {
    setEditingUser(u);
    setCode(u.code);
    setPin(u.pin || '1234');
    setName(u.name);
    setRole(u.role);
    setSucursal(u.sucursal || 'Sucursal 1');
    setPhone(u.phone || '');
    setEmail(u.email || '');
    setIsActive(u.active);
    setErrorMessage('');
    setIsModalOpen(true);
  };

  // Toggle user active status (Dar de baja / Reactivar al instante)
  const handleToggleStatus = (u: User) => {
    if (u.code === 'ADMIN123') {
      window.alert('El Administrador principal (Desarrollador) no puede ser bloqueado para garantizar el acceso al sistema.');
      return;
    }

    const newActiveState = !u.active;
    const actionName = newActiveState ? 'reactivar el acceso' : 'dar de baja y bloquear el acceso';
    
    if (window.confirm(`¿Confirmas que deseas ${actionName} para ${u.name} (${u.code})?`)) {
      onUpdateUser({
        ...u,
        active: newActiveState,
      });
      triggerToast(
        newActiveState
          ? `Acceso reactivado para ${u.name}. Ahora puede ingresar al sistema.`
          : `Acceso bloqueado al instante para ${u.name}. No podrá iniciar sesión.`
      );
    }
  };

  // Quick direct branch change
  const handleQuickBranchChange = (u: User, newBranch: Sucursal) => {
    onUpdateUser({
      ...u,
      sucursal: newBranch,
    });
    triggerToast(`Sucursal de ${u.name} cambiada a "${newBranch}".`);
  };

  // Quick direct role change
  const handleQuickRoleChange = (u: User, newRole: UserRole) => {
    if (u.code === 'ADMIN123' && newRole !== 'Administrador') {
      window.alert('La cuenta principal de desarrollo ADMIN123 debe permanecer siempre como Administrador.');
      return;
    }

    onUpdateUser({
      ...u,
      role: newRole,
    });
    triggerToast(`Rol de ${u.name} cambiado a "${newRole}" con éxito.`);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) {
      setErrorMessage('El código de acceso y el nombre del empleado son obligatorios.');
      return;
    }

    if (editingUser) {
      onUpdateUser({
        ...editingUser,
        code: code.trim().toUpperCase(),
        pin: pin.trim() || '1234',
        name: name.trim(),
        role,
        sucursal,
        phone: phone.trim(),
        email: email.trim(),
        active: isActive,
      });
      setIsModalOpen(false);
      triggerToast(`Ficha de personal de ${name} actualizada correctamente.`);
    } else {
      const res = onAddUser({
        code: code.trim().toUpperCase(),
        pin: pin.trim() || '1234',
        name: name.trim(),
        role,
        sucursal,
        phone: phone.trim(),
        email: email.trim(),
        active: isActive,
      });

      if (!res.success) {
        setErrorMessage(res.error || 'Error al agregar empleado.');
      } else {
        setIsModalOpen(false);
        triggerToast(`Nuevo empleado ${name} registrado en ${sucursal} con código ${code.toUpperCase()}.`);
      }
    }
  };

  // Requirement 1: Complete permanent row deletion
  const handleDeleteRow = (u: User) => {
    if (u.code === 'ADMIN123') {
      window.alert('No se puede eliminar la cuenta del Administrador Desarrollador principal (ADMIN123).');
      return;
    }
    if (u.id === currentUser.id) {
      window.alert('No puedes eliminar tu propio usuario en sesión activa.');
      return;
    }
    
    const confirmMessage = `¿ESTÁS SEGURO DE ELIMINAR COMPLETAMENTE LA FILA DE ESTE EMPLEADO?\n\nNombre: ${u.name}\nCódigo: ${u.code}\nRol: ${u.role}\nSucursal: ${u.sucursal}\n\n⚠️ Esta acción borrará la fila permanentemente del sistema.`;
    
    if (window.confirm(confirmMessage)) {
      const res = onDeleteUser(u.id);
      if (res.success) {
        triggerToast(`Fila del usuario ${u.name} (${u.code}) eliminada completamente.`);
      } else {
        window.alert(res.error || 'Error al eliminar el usuario.');
      }
    }
  };

  // Metrics
  const totalEmployees = users.length;
  const activeEmployees = users.filter((u) => u.active).length;
  const blockedEmployees = users.filter((u) => !u.active).length;

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.code.toLowerCase().includes(search.toLowerCase()) ||
        (u.phone && u.phone.includes(search));

      const matchRole = roleFilter === 'all' || u.role === roleFilter;
      const matchBranch = branchFilter === 'all' || u.sucursal === branchFilter;

      let matchStatus = true;
      if (statusFilter === 'active') matchStatus = u.active === true;
      if (statusFilter === 'blocked') matchStatus = u.active === false;

      return matchSearch && matchRole && matchBranch && matchStatus;
    });
  }, [users, search, roleFilter, branchFilter, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-bold animate-in fade-in slide-in-from-bottom-4 duration-200">
          <Check className="w-4 h-4" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Developer Master Header */}
      <div className="bg-gradient-to-r from-purple-950/70 via-slate-900 to-slate-900 border-2 border-purple-500/40 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center text-white shadow-xl shadow-purple-950 shrink-0">
              <KeyRound className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-black text-white tracking-tight">
                  Control de Accesos, Personal & Sucursales
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/50 text-xs font-bold uppercase tracking-wider">
                  Exclusivo Administrador
                </span>
              </div>
              <p className="text-xs text-purple-200/70 mt-1 max-w-3xl">
                Poder absoluto para gestionar el personal en las 3 sucursales: crea empleados, asigna códigos de acceso y sucursal, cambia roles, da de baja para bloquear el acceso y elimina filas por completo con el botón de la papelera.
              </p>
            </div>
          </div>

          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-5 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-950 transition-all cursor-pointer self-start lg:self-center"
          >
            <UserPlus className="w-4 h-4" />
            Crear Nuevo Empleado
          </button>
        </div>
      </div>

      {/* Control KPIs Strip by Branch */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-850 border border-slate-700 rounded-xl p-4.5 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Personal Registrado
            </span>
            <div className="p-2 rounded-lg bg-slate-800 text-slate-300">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-white mt-2 font-mono tabular-nums">
            {totalEmployees} <span className="text-xs font-normal text-slate-400">empleados</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-1">{activeEmployees} con acceso activo · {blockedEmployees} bloqueados</p>
        </div>

        {/* Branch 1 */}
        <div className="bg-slate-850 border border-slate-700 rounded-xl p-4.5 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" />
              Sucursal 1
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
              Tienda Central
            </span>
          </div>
          <p className="text-2xl font-black text-white mt-2 font-mono tabular-nums">
            {users.filter(u => u.sucursal === 'Sucursal 1').length} <span className="text-xs font-normal text-slate-400">asignados</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Pilar (Vendedor) · Admin · Inés</p>
        </div>

        {/* Branch 2 */}
        <div className="bg-slate-850 border border-slate-700 rounded-xl p-4.5 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" />
              Sucursal 2
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
              Tienda Norte
            </span>
          </div>
          <p className="text-2xl font-black text-white mt-2 font-mono tabular-nums">
            {users.filter(u => u.sucursal === 'Sucursal 2').length} <span className="text-xs font-normal text-slate-400">asignados</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Carmen Solís (Vendedora)</p>
        </div>

        {/* Branch 3 */}
        <div className="bg-slate-850 border border-slate-700 rounded-xl p-4.5 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" />
              Sucursal 3
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
              Tienda Sur
            </span>
          </div>
          <p className="text-2xl font-black text-white mt-2 font-mono tabular-nums">
            {users.filter(u => u.sucursal === 'Sucursal 3').length} <span className="text-xs font-normal text-slate-400">asignados</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Lucía Mendoza (Vendedora)</p>
        </div>
      </div>

      {/* Search and Advanced Filters */}
      <div className="bg-slate-850 border border-slate-700/80 rounded-xl p-4 shadow-lg flex flex-col xl:flex-row items-center justify-between gap-4">
        <div className="relative w-full xl:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por código, nombre o teléfono..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto justify-between xl:justify-end">
          {/* Branch Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400 font-medium">Sucursal:</span>
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value as any)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500 cursor-pointer"
            >
              <option value="all">Todas las Sucursales</option>
              <option value="Sucursal 1">Sucursal 1</option>
              <option value="Sucursal 2">Sucursal 2</option>
              <option value="Sucursal 3">Sucursal 3</option>
            </select>
          </div>

          {/* Role Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400 font-medium">Rol:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500 cursor-pointer"
            >
              <option value="all">Todos los roles</option>
              <option value="Administrador">Administrador</option>
              <option value="Inés">Inés (Dueña)</option>
              <option value="Vendedor">Vendedor</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="p-1 bg-slate-900 rounded-lg border border-slate-700 flex items-center gap-1 text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                statusFilter === 'all' ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              Todos ({users.length})
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1 rounded-md font-semibold transition-colors flex items-center gap-1 cursor-pointer ${
                statusFilter === 'active' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800 shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserCheck className="w-3 h-3" />
              Activos ({activeEmployees})
            </button>
            <button
              onClick={() => setStatusFilter('blocked')}
              className={`px-3 py-1 rounded-md font-semibold transition-colors flex items-center gap-1 cursor-pointer ${
                statusFilter === 'blocked' ? 'bg-rose-950 text-rose-300 border border-rose-800 shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserX className="w-3 h-3" />
              Bloqueados ({blockedEmployees})
            </button>
          </div>
        </div>
      </div>

      {/* Main Personnel Access Table */}
      <div className="bg-slate-850 border border-slate-700/80 rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Código Entrada</th>
                <th className="py-3 px-4">Nombre del Empleado</th>
                <th className="py-3 px-4">Sucursal Asignada</th>
                <th className="py-3 px-4">Rol Asignado</th>
                <th className="py-3 px-4">Estado de Acceso</th>
                <th className="py-3 px-4 text-center">Dar de Baja / Reactivar</th>
                <th className="py-3 px-4 text-center">Cambiar Sucursal</th>
                <th className="py-3 px-4 text-center">Cambiar Rol</th>
                <th className="py-3 px-4 text-right">Borrar / Editar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 font-medium">
              {filteredUsers.map((u) => {
                const isMasterAdmin = u.code === 'ADMIN123';
                return (
                  <tr
                    key={u.id}
                    className={`transition-colors ${
                      !u.active ? 'bg-rose-950/10 hover:bg-rose-950/20' : 'hover:bg-slate-800/40'
                    }`}
                  >
                    {/* Código de Entrada */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-white bg-slate-900 px-2.5 py-1 rounded-md border border-slate-700 text-xs">
                          {u.code}
                        </span>
                        {isMasterAdmin && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-800 font-sans">
                            Dev
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Nombre del Empleado */}
                    <td className="py-3.5 px-4 font-semibold text-white">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                            !u.active
                              ? 'bg-rose-950 text-rose-300 border border-rose-800'
                              : u.role === 'Inés'
                              ? 'bg-amber-950 text-amber-300 border border-amber-800'
                              : u.role === 'Administrador'
                              ? 'bg-purple-950 text-purple-300 border border-purple-800'
                              : 'bg-blue-950 text-blue-300 border border-blue-800'
                          }`}
                        >
                          {u.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className={`font-bold ${!u.active ? 'text-slate-400 line-through' : 'text-white'}`}>
                            {u.name}
                          </p>
                          <span className="text-[10px] text-slate-400">
                            Alta: {formatDate(u.createdAt)} {u.phone ? `· ${u.phone}` : ''}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Sucursal Asignada */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold ${
                          u.sucursal === 'Sucursal 1'
                            ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                            : u.sucursal === 'Sucursal 2'
                            ? 'bg-blue-950/80 text-blue-300 border border-blue-800'
                            : 'bg-purple-950/80 text-purple-300 border border-purple-800'
                        }`}
                      >
                        <Building2 className="w-3.5 h-3.5" />
                        {u.sucursal}
                      </span>
                    </td>

                    {/* Rol Asignado */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold ${
                          u.role === 'Administrador'
                            ? 'bg-purple-950/80 text-purple-300 border border-purple-800'
                            : u.role === 'Inés'
                            ? 'bg-amber-950/80 text-amber-300 border border-amber-800'
                            : 'bg-blue-950/80 text-blue-300 border border-blue-800'
                        }`}
                      >
                        {u.role === 'Administrador' ? (
                          <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                        ) : u.role === 'Inés' ? (
                          <Crown className="w-3.5 h-3.5 text-amber-400" />
                        ) : (
                          <Briefcase className="w-3.5 h-3.5 text-blue-400" />
                        )}
                        {u.role === 'Inés' ? 'Inés (Dueña)' : u.role}
                      </span>
                    </td>

                    {/* Estado de Acceso */}
                    <td className="py-3.5 px-4">
                      {u.active ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs font-semibold">
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Activo</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-rose-950/80 border border-rose-800 text-rose-300 text-xs font-bold animate-pulse">
                          <Lock className="w-3.5 h-3.5 text-rose-400" />
                          <span>DADO DE BAJA</span>
                        </span>
                      )}
                    </td>

                    {/* Dar de Baja / Reactivar */}
                    <td className="py-3.5 px-4 text-center">
                      {isMasterAdmin ? (
                        <span className="text-[11px] text-slate-500 font-mono italic">
                          Inmune
                        </span>
                      ) : u.active ? (
                        <button
                          onClick={() => handleToggleStatus(u)}
                          className="px-2.5 py-1 bg-rose-500/15 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 mx-auto"
                          title="Bloquear acceso inmediatamente a este empleado"
                        >
                          <Lock className="w-3 h-3 text-rose-400" />
                          Dar de Baja
                        </button>
                      ) : (
                        <button
                          onClick={() => handleToggleStatus(u)}
                          className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/35 text-emerald-300 border border-emerald-500/50 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 mx-auto"
                          title="Restablecer el acceso al sistema"
                        >
                          <Unlock className="w-3 h-3 text-emerald-400" />
                          Reactivar
                        </button>
                      )}
                    </td>

                    {/* Quick Branch Switcher */}
                    <td className="py-3.5 px-4 text-center">
                      <select
                        value={u.sucursal}
                        onChange={(e) => handleQuickBranchChange(u, e.target.value as Sucursal)}
                        className="bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-purple-500 cursor-pointer"
                      >
                        {SUCURSALES.map((suc) => (
                          <option key={suc} value={suc}>{suc}</option>
                        ))}
                      </select>
                    </td>

                    {/* Quick Role Switcher */}
                    <td className="py-3.5 px-4 text-center">
                      <select
                        value={u.role}
                        onChange={(e) => handleQuickRoleChange(u, e.target.value as UserRole)}
                        disabled={isMasterAdmin}
                        className={`bg-slate-900 border rounded-lg px-2 py-1 text-xs font-semibold focus:outline-none cursor-pointer ${
                          isMasterAdmin
                            ? 'border-slate-800 text-slate-500 cursor-not-allowed'
                            : 'border-slate-700 text-white hover:border-purple-500'
                        }`}
                      >
                        <option value="Vendedor">Vendedor</option>
                        <option value="Inés">Inés (Dueña)</option>
                        <option value="Administrador">Administrador</option>
                      </select>
                    </td>

                    {/* Acciones Ficha: Papelera Borrar Fila + Editar */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(u)}
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                          title="Editar código o datos"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        {/* REQUIREMENT 1: Prominent Delete Trash Button */}
                        <button
                          onClick={() => handleDeleteRow(u)}
                          className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                            isMasterAdmin
                              ? 'text-slate-700 border-slate-800 cursor-not-allowed'
                              : 'bg-rose-950/40 text-rose-400 border-rose-800/80 hover:bg-rose-600 hover:text-white shadow-sm'
                          }`}
                          title={
                            isMasterAdmin
                              ? 'El desarrollador principal no se puede borrar'
                              : 'ELIMINAR FILA POR COMPLETO (Borrar usuario de la base de datos)'
                          }
                          disabled={isMasterAdmin}
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

      {/* Add / Edit Modal with Sucursal Selection */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-800/80 px-6 py-4 flex items-center justify-between border-b border-slate-700">
              <h2 className="font-bold text-white text-base flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-purple-400" />
                {editingUser ? 'Editar Ficha y Sucursal' : 'Crear Nuevo Empleado'}
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
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Código de Entrada *
                  </label>
                  <input
                    type="text"
                    placeholder="ej. VEND04, INES02, ADMIN02"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    disabled={!!editingUser && (editingUser.code === 'ADMIN123')}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono uppercase focus:outline-none focus:border-purple-500 text-sm font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    PIN de Seguridad (4 dígitos)
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="1234"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-purple-500 text-sm font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Nombre Completo del Empleado *
                </label>
                <input
                  type="text"
                  placeholder="ej. Sofía Quispe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              {/* Requirement 2: Branch selector */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Sucursal Asignada *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {SUCURSALES.map((suc) => (
                    <button
                      type="button"
                      key={suc}
                      onClick={() => setSucursal(suc)}
                      className={`py-2 px-2 rounded-lg border text-center font-bold text-xs flex items-center justify-center gap-1 transition-all ${
                        sucursal === suc
                          ? 'bg-purple-950 border-purple-500 text-purple-300 shadow-sm'
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
                  Rol y Nivel de Acceso *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('Vendedor')}
                    className={`py-2 px-2 rounded-lg border text-center font-bold transition-all text-[11px] ${
                      role === 'Vendedor'
                        ? 'bg-blue-950 border-blue-500 text-blue-300 shadow-sm'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    Vendedor(a)
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('Inés')}
                    className={`py-2 px-2 rounded-lg border text-center font-bold transition-all text-[11px] ${
                      role === 'Inés'
                        ? 'bg-amber-950 border-amber-500 text-amber-300 shadow-sm'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    Inés (Dueña)
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('Administrador')}
                    className={`py-2 px-2 rounded-lg border text-center font-bold transition-all text-[11px] ${
                      role === 'Administrador'
                        ? 'bg-purple-950 border-purple-500 text-purple-300 shadow-sm'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    Administrador
                  </button>
                </div>
              </div>

              {/* Access status toggle */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Permiso de Entrada / Estado de Acceso
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setIsActive(true)}
                    className={`py-2 px-3 rounded-lg border font-bold transition-all text-xs flex items-center justify-center gap-1.5 ${
                      isActive
                        ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    Acceso Permitido
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsActive(false)}
                    disabled={editingUser?.code === 'ADMIN123'}
                    className={`py-2 px-3 rounded-lg border font-bold transition-all text-xs flex items-center justify-center gap-1.5 ${
                      !isActive
                        ? 'bg-rose-950 border-rose-500 text-rose-300'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    <Lock className="w-3.5 h-3.5" />
                    Dado de Baja (Bloqueado)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Teléfono (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="+51 900 000 000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Correo (Opcional)
                  </label>
                  <input
                    type="email"
                    placeholder="empleado@tienda.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
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
                  className="px-4 py-2 font-semibold bg-purple-600 hover:bg-purple-500 text-white rounded-lg shadow-sm transition-colors"
                >
                  {editingUser ? 'Guardar Cambios' : 'Registrar Empleado'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
