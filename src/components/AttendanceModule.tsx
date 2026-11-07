import React, { useState, useMemo } from 'react';
import { Attendance, User, AttendanceStatus, Sucursal } from '../types';
import { formatDate } from '../utils/formatters';
import { getTodayDateString, getCurrentTimeString } from '../services/storage';
import { 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  UserCheck, 
  Search, 
  Calendar, 
  Plus, 
  Trash2, 
  Edit, 
  X,
  LogOut,
  Building2
} from 'lucide-react';

interface AttendanceModuleProps {
  attendance: Attendance[];
  users: User[];
  currentUser: User;
  onRegisterAttendance: (record: Omit<Attendance, 'id'>) => { success: boolean; error?: string };
  onUpdateAttendance: (record: Attendance) => void;
  onDeleteAttendance: (attendanceId: string) => void;
}

export const AttendanceModule: React.FC<AttendanceModuleProps> = ({
  attendance,
  users,
  currentUser,
  onRegisterAttendance,
  onUpdateAttendance,
  onDeleteAttendance,
}) => {
  const today = getTodayDateString();
  const currentTime = getCurrentTimeString();

  const sellers = useMemo(() => users.filter((u) => u.role === 'Vendedor'), [users]);

  // Quick mark today
  const [selectedSellerCode, setSelectedSellerCode] = useState<string>(
    currentUser.role === 'Vendedor' ? currentUser.code : sellers[0]?.code || 'VEND01'
  );
  const [entryTime, setEntryTime] = useState<string>(currentTime);
  const [status, setStatus] = useState<AttendanceStatus>('A tiempo');
  const [notes, setNotes] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Filters
  const [search, setSearch] = useState<string>('');
  const [filterSeller, setFilterSeller] = useState<string>('all');
  const [filterBranch, setFilterBranch] = useState<'all' | Sucursal>('all');
  const [filterDate, setFilterDate] = useState<string>('');

  // Edit Modal
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingRecord, setEditingRecord] = useState<Attendance | null>(null);
  const [modalDepartureTime, setModalDepartureTime] = useState<string>('');

  const selectedSeller = useMemo(() => {
    return users.find((u) => u.code === selectedSellerCode);
  }, [users, selectedSellerCode]);

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!selectedSeller) {
      setErrorMessage('Selecciona una vendedora válida.');
      return;
    }

    // Check if already registered for today
    const existing = attendance.find(
      (a) => a.date === today && a.sellerCode === selectedSellerCode
    );

    if (existing) {
      setErrorMessage(
        `${selectedSeller.name} (${selectedSeller.code}) ya tiene registro de entrada hoy a las ${existing.entryTime}. Puedes editar su salida en la tabla inferior.`
      );
      return;
    }

    // Auto determine status if not manually changed: e.g. entry after 09:05 AM is considered Tardanza
    let determinedStatus = status;
    const [hours, mins] = entryTime.split(':').map(Number);
    if (status === 'A tiempo' && (hours > 9 || (hours === 9 && mins > 5))) {
      determinedStatus = 'Tardanza';
    }

    const res = onRegisterAttendance({
      date: today,
      sucursal: selectedSeller.sucursal || 'Sucursal 1',
      sellerCode: selectedSeller.code,
      sellerName: selectedSeller.name,
      entryTime,
      departureTime: '',
      status: determinedStatus,
      notes: notes.trim() || undefined,
    });

    if (!res.success) {
      setErrorMessage(res.error || 'Error al guardar la asistencia.');
    } else {
      setSuccessMessage(
        `¡Entrada registrada para ${selectedSeller.name} en ${selectedSeller.sucursal} a las ${entryTime} (${determinedStatus})!`
      );
      setNotes('');
    }
  };

  const openClockOutModal = (record: Attendance) => {
    setEditingRecord(record);
    setModalDepartureTime(record.departureTime || getCurrentTimeString());
    setIsModalOpen(true);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;

    onUpdateAttendance({
      ...editingRecord,
      departureTime: modalDepartureTime,
    });
    setIsModalOpen(false);
  };

  const filteredAttendance = useMemo(() => {
    return attendance
      .filter((a) => {
        // If current user is Vendedor, only show her own records!
        if (currentUser.role === 'Vendedor' && a.sellerCode !== currentUser.code) {
          return false;
        }

        const matchSearch =
          a.sellerName.toLowerCase().includes(search.toLowerCase()) ||
          a.sellerCode.toLowerCase().includes(search.toLowerCase()) ||
          (a.notes && a.notes.toLowerCase().includes(search.toLowerCase())) ||
          (a.sucursal && a.sucursal.toLowerCase().includes(search.toLowerCase()));

        const matchSeller = filterSeller === 'all' || a.sellerCode === filterSeller;
        const matchBranch = filterBranch === 'all' || a.sucursal === filterBranch;
        const matchDate = !filterDate || a.date === filterDate;

        return matchSearch && matchSeller && matchBranch && matchDate;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [attendance, search, filterSeller, filterBranch, filterDate, currentUser]);

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
              <span className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <Clock className="w-5 h-5" />
              </span>
              <h1 className="text-xl font-bold text-white tracking-tight">
                Control Diario de Asistencia por Sucursal
              </h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Registro diario de la hora de llegada de las vendedoras por sucursal para el control del Administrador y seguimiento de puntualidad.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-900 px-4 py-2 rounded-lg border border-slate-700 text-xs">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-400">Fecha del Sistema:</span>
            <span className="font-mono font-bold text-white">{formatDate(today)}</span>
          </div>
        </div>
      </div>

      {/* Quick Mark Card (Top) */}
      <div className="bg-slate-850 border border-slate-700/80 rounded-xl p-6 shadow-lg">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-emerald-400" />
            Registrar Hora de Entrada de Vendedora (Hoy)
          </h2>
          <span className="text-xs text-slate-400">
            Horario habitual de ingreso: 09:00 AM
          </span>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleQuickSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs items-end">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Vendedora y Sucursal *
            </label>
            <select
              value={selectedSellerCode}
              onChange={(e) => setSelectedSellerCode(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-medium focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              {sellers.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.code} - {s.name} ({s.sucursal})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Hora de Entrada *
            </label>
            <input
              type="time"
              value={entryTime}
              onChange={(e) => setEntryTime(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
              required
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Observación (Opcional)
            </label>
            <input
              type="text"
              placeholder="ej. Apertura de turno en mostrador..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Marcar Entrada Hoy
            </button>
          </div>
        </form>
      </div>

      {/* Attendance History Filter & Wide Table */}
      <div className="space-y-4">
        {/* Table Filters */}
        <div className="bg-slate-850 border border-slate-700/80 rounded-xl p-4 shadow-lg flex flex-col xl:flex-row items-center justify-between gap-4">
          <div className="relative w-full xl:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por vendedora, sucursal o código..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto justify-between xl:justify-end">
            {/* Filter by Branch */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-400 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" />
                Sucursal:
              </span>
              <select
                value={filterBranch}
                onChange={(e) => setFilterBranch(e.target.value as any)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="all">Todas</option>
                <option value="Sucursal 1">Sucursal 1</option>
                <option value="Sucursal 2">Sucursal 2</option>
                <option value="Sucursal 3">Sucursal 3</option>
              </select>
            </div>

            {/* Filter by Seller */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-400">Vendedora:</span>
              <select
                value={filterSeller}
                onChange={(e) => setFilterSeller(e.target.value)}
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

            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-400">Fecha:</span>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
              {filterDate && (
                <button
                  onClick={() => setFilterDate('')}
                  className="text-xs text-slate-400 hover:text-white cursor-pointer"
                >
                  Limpiar
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Wide Attendance Table */}
        <div className="bg-slate-850 border border-slate-700/80 rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4">Sucursal</th>
                  <th className="py-3 px-4">Código</th>
                  <th className="py-3 px-4">Vendedora</th>
                  <th className="py-3 px-4 text-center">Hora de Entrada</th>
                  <th className="py-3 px-4 text-center">Hora de Salida</th>
                  <th className="py-3 px-4">Puntualidad</th>
                  <th className="py-3 px-4">Observaciones</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 font-medium">
                {filteredAttendance.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-semibold text-white whitespace-nowrap">
                      {formatDate(record.date)}
                      {record.date === today && (
                        <span className="ml-1.5 text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-1.5 py-0.2 rounded font-sans">
                          Hoy
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${getBranchBadgeStyle(record.sucursal)}`}>
                        {record.sucursal}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-300">
                      {record.sellerCode}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-white">
                      {record.sellerName}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-emerald-400 text-sm tabular-nums">
                      {record.entryTime}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-slate-300 tabular-nums">
                      {record.departureTime ? (
                        <span>{record.departureTime}</span>
                      ) : (
                        <button
                          onClick={() => openClockOutModal(record)}
                          className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
                        >
                          <LogOut className="w-3 h-3 text-amber-400" />
                          Marcar Salida
                        </button>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold ${
                          record.status === 'A tiempo'
                            ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                            : 'bg-amber-950/80 text-amber-300 border border-amber-800'
                        }`}
                      >
                        {record.status === 'A tiempo' ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : (
                          <AlertCircle className="w-3 h-3" />
                        )}
                        {record.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                      {record.notes || '-'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openClockOutModal(record)}
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors cursor-pointer"
                          title="Editar / registrar salida"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm('¿Deseas eliminar este registro de asistencia?')) {
                              onDeleteAttendance(record.id);
                            }
                          }}
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                          title="Eliminar registro"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredAttendance.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400 text-xs">
                      No se encontraron registros de asistencia con los filtros seleccionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Clock Out / Edit Departure Modal */}
      {isModalOpen && editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-sm w-full overflow-hidden">
            <div className="bg-slate-800 px-6 py-4 flex items-center justify-between border-b border-slate-700">
              <h2 className="font-bold text-white text-base">Registrar Hora de Salida</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="p-6 space-y-4 text-xs">
              <div>
                <p className="text-slate-300 font-semibold">
                  Vendedora: <span className="text-white">{editingRecord.sellerName} ({editingRecord.sellerCode})</span>
                </p>
                <p className="text-slate-400 mt-1">
                  Sucursal: <span className="text-amber-400 font-bold">{editingRecord.sucursal}</span>
                </p>
                <p className="text-slate-400 mt-0.5">
                  Fecha: {formatDate(editingRecord.date)} · Entrada: {editingRecord.entryTime}
                </p>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Hora de Salida *
                </label>
                <input
                  type="time"
                  value={modalDepartureTime}
                  onChange={(e) => setModalDepartureTime(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-sm cursor-pointer"
                >
                  Guardar Salida
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
