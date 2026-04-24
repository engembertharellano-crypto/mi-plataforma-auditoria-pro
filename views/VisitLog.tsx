import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Globe,
  Pencil,
  CalendarDays,
  Trash2,
  AlertTriangle,
  X
} from 'lucide-react';
import { AuditState, CCTVInventoryRecord, PhysicalInventoryRecord, ManagementVisitRecord, Pharmacy } from '../types';

interface VisitLogProps {
  pharmacies: Pharmacy[];
  audits: AuditState[];
  cctvRecords: CCTVInventoryRecord[];
  physicalRecords: PhysicalInventoryRecord[];
  managementRecords: ManagementVisitRecord[];
  users: any[];
  currentUser: any;
  onDeleteAudit: (id: string) => void;
  onDeleteCCTV: (id: string) => void;
  onDeletePhysical: (id: string) => void;
  onDeleteManagement: (id: string) => void;
  onEditAudit?: (audit: AuditState) => void;
  hasAdminPrivileges: boolean;
}

const ZONES = ['Gran Caracas Llanos', 'Gran Caracas Oriente', 'Centro Occidente'];

const VisitLog: React.FC<VisitLogProps> = ({ 
  pharmacies, 
  audits, 
  cctvRecords, 
  physicalRecords, 
  managementRecords, 
  currentUser,
  onDeleteAudit,
  onDeleteCCTV,
  onDeletePhysical,
  onDeleteManagement,
  onEditAudit,
  hasAdminPrivileges
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('Todos');
  const [filterZone, setFilterZone] = useState('Todas');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [recordToDelete, setRecordToDelete] = useState<any | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);

  const isReadOnly = (currentUser?.email || '').trim().toLowerCase() === 'directiva@xana.com';

  const getRiskLevel = (score: number): 'Bajo' | 'Moderado' | 'Medio' | 'Alto' | 'Extremo' => {
    if (score >= 95) return 'Bajo';
    if (score >= 85) return 'Moderado';
    if (score >= 75) return 'Medio';
    if (score >= 65) return 'Alto';
    return 'Extremo';
  };

  const getCurrentMonthKey = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  };
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonthKey());

  const canFilterByZone = useMemo(() => {
    if (!currentUser) return false;
    const role = (currentUser.role || '').toLowerCase();
    const email = (currentUser.email || '').toLowerCase();
    return role.includes('gerente') || role.includes('lider') || role === 'super usuario' || email === 'directiva@xana.com';
  }, [currentUser]);

  const parseRecordDate = (raw: string) => {
    if (!raw) return null;

    if (raw.includes('/')) {
      const parts = raw.split('/');
      if (parts.length === 3) {
        const [dd, mm, yyyy] = parts;
        const iso = `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
        const d = new Date(iso);
        return isNaN(d.getTime()) ? null : d;
      }
    }

    const d = new Date(raw);
    return isNaN(d.getTime()) ? null : d;
  };

  const monthKeyFromDate = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  };

  const monthLabel = (monthKey: string) => {
    const [y, m] = monthKey.split('-');
    const d = new Date(Number(y), Number(m) - 1, 1);
    return new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(d);
  };

  const allRecords = useMemo(() => {
    const format = (list: any[], type: string, dateKey: string) => 
      list.map(item => {
        const pId = item.pharmacyId || (item.pharmacy && item.pharmacy.id);
        const pharmacyData = pharmacies.find(p => p.id === pId);

        let textoObservacion = "";
        if (type === 'Auditoría') {
          const score = item.score || 0;
          const riskLevel = getRiskLevel(score);
          textoObservacion = `Nivel de cumplimiento: ${score}%. Nivel de riesgo: ${riskLevel}. El análisis detallado de los hallazgos y métricas se encuentra disponible en el Dashboard.`;
        } 
        else if (type === 'Inventario CCTV' || type === 'Infraestructura') {
          textoObservacion = item.observations || item.notes || item.comments || "Sin observaciones registradas.";
        } 
        else if (type === 'Visita de Gestión') {
          textoObservacion = item.reason || item.observations || item.notes || "Visita de gestión.";
        }

        return {
          id: item.id,
          type,
          date: item[dateKey] || item.date, 
          pharmacy: pharmacyData ? pharmacyData.name : (item.pharmacy?.name || 'Sede Desconocida'),
          pharmacyZone: pharmacyData ? pharmacyData.zone : (item.pharmacy?.zone || 'Zona No Identificada'), 
          details: textoObservacion,
          original: item
        };
      });

    return [
      ...format(audits, 'Auditoría', 'date'),
      ...format(cctvRecords, 'Inventario CCTV', 'date'),
      ...format(physicalRecords, 'Infraestructura', 'date'),
      ...format(managementRecords, 'Visita de Gestión', 'date')
    ].sort((a, b) => {
       const dateA = parseRecordDate(a.date);
       const dateB = parseRecordDate(b.date);
       const tA = dateA ? dateA.getTime() : 0;
       const tB = dateB ? dateB.getTime() : 0;
       return tB - tA;
    });
  }, [audits, cctvRecords, physicalRecords, managementRecords, pharmacies]);

  const availableMonths = useMemo(() => {
    const set = new Set<string>();

    allRecords.forEach(r => {
      const d = parseRecordDate(r.date);
      if (!d) return;
      set.add(monthKeyFromDate(d));
    });

    set.add(getCurrentMonthKey());
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [allRecords]);

  const filteredRecords = allRecords.filter(rec => {
    const matchesSearch = rec.pharmacy.toLowerCase().includes(searchTerm.toLowerCase()) || rec.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'Todos' || rec.type === filterType;
    const matchesZone = !canFilterByZone || (filterZone === 'Todas' || rec.pharmacyZone === filterZone);

    let matchesMonth = true;
    if (selectedMonth !== 'Todos') {
      const d = parseRecordDate(rec.date);
      if (!d) matchesMonth = false;
      else matchesMonth = monthKeyFromDate(d) === selectedMonth;
    }

    let matchesDate = true;
    if (dateRange.start && dateRange.end) {
      const recDate = parseRecordDate(rec.date);
      const start = new Date(dateRange.start);
      const end = new Date(dateRange.end);
      if (!recDate) matchesDate = false;
      else matchesDate = recDate >= start && recDate <= end;
    }

    return matchesSearch && matchesType && matchesZone && matchesMonth && matchesDate;
  });

  const canDeleteRecord = (record: any) => {
    if (isReadOnly) return false;
    if (hasAdminPrivileges) return true;
    return record.original?.createdBy === currentUser?.fullName;
  };

  const handleDeleteRecord = (record: any) => {
    if (!canDeleteRecord(record)) return;
    setRecordToDelete(record);
  };

  const confirmDeleteRecord = () => {
    if (!recordToDelete) return;

    if (recordToDelete.type === 'Auditoría') onDeleteAudit(recordToDelete.id);
    if (recordToDelete.type === 'Inventario CCTV') onDeleteCCTV(recordToDelete.id);
    if (recordToDelete.type === 'Infraestructura') onDeletePhysical(recordToDelete.id);
    if (recordToDelete.type === 'Visita de Gestión') onDeleteManagement(recordToDelete.id);

    setRecordToDelete(null);
  };

  const closeDeleteModal = () => {
    setRecordToDelete(null);
  };

  const renderVisitDetailContent = () => {
    if (!selectedRecord || selectedRecord.type !== 'Visita de Gestión') return null;

    const data = selectedRecord.original;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Sede</p>
            <p className="text-lg font-black text-slate-900">{selectedRecord.pharmacy}</p>
          </div>

          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Zona</p>
            <p className="text-lg font-black text-slate-900">{selectedRecord.pharmacyZone}</p>
          </div>

          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Fecha</p>
            <p className="text-lg font-black text-slate-900">{selectedRecord.date}</p>
          </div>

          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Responsable</p>
            <p className="text-lg font-black text-slate-900">{data.createdBy || 'No disponible'}</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-slate-50 rounded-[2rem] p-6 border border-blue-100">
          <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-4">
            Detalle de la visita
          </p>

          <div className="space-y-5">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                Motivo de la visita
              </p>
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <p className="text-base font-semibold text-slate-900">
                  {data.reason || 'No registrado'}
                </p>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                Observaciones
              </p>
              <div className="bg-white rounded-xl border border-slate-200 p-4 min-h-[110px]">
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {data.observations || data.notes || 'Sin observaciones registradas'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-8 animate-in fade-in duration-500 pb-24">
      
      <div className="mb-10">
        <h2 className="text-5xl font-black text-white tracking-normal uppercase mb-2">BITÁCORA GLOBAL</h2>
        <p className="text-slate-300 font-bold uppercase tracking-[0.18em] text-sm">Trazabilidad y Reportes de Campo</p>
      </div>

      <div className="bg-white p-4 rounded-[2rem] shadow-xl border border-slate-100 mb-8 flex flex-col md:flex-row items-center gap-4">
          <div className="relative group flex-1 w-full">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar sede o detalle..." 
              className="w-full pl-14 pr-6 py-4 bg-transparent border-none outline-none font-bold text-slate-700 placeholder-slate-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="relative w-full md:w-64">
            <CalendarDays className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <select
              className="w-full pl-12 pr-10 py-4 bg-white border border-slate-200 rounded-xl outline-none font-bold text-slate-700 appearance-none transition-all"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              title="Filtrar por mes"
            >
              <option value={getCurrentMonthKey()}>
                Mes en curso — {monthLabel(getCurrentMonthKey())}
              </option>
              <option value="Todos">Todos los meses</option>
              {availableMonths
                .filter(m => m !== getCurrentMonthKey())
                .map(m => (
                  <option key={m} value={m}>
                    {monthLabel(m)}
                  </option>
                ))}
            </select>
          </div>

          <div className="relative w-full md:w-64">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <select 
              className="w-full pl-12 pr-10 py-4 bg-white border border-slate-200 rounded-xl outline-none font-bold text-slate-700 appearance-none transition-all"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="Todos">Todos los Tipos</option>
              <option value="Auditoría">Auditoría</option>
              <option value="Inventario CCTV">Inventario CCTV</option>
              <option value="Infraestructura">Infraestructura</option>
              <option value="Visita de Gestión">Visita de Gestión</option>
            </select>
          </div>

          {canFilterByZone && (
            <div className="relative w-full md:w-64">
              <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <select 
                className="w-full pl-12 pr-10 py-4 bg-white border border-slate-200 rounded-xl outline-none font-bold text-slate-700 appearance-none transition-all"
                value={filterZone}
                onChange={(e) => setFilterZone(e.target.value)}
              >
                <option value="Todas">Todas las Zonas</option>
                {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
              </select>
            </div>
          )}

          <div className="flex gap-2 w-full md:w-auto">
            <input 
              type="date" 
              className="px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none font-bold text-slate-600 text-sm"
              value={dateRange.start}
              onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
            />
            <input 
              type="date" 
              className="px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none font-bold text-slate-600 text-sm"
              value={dateRange.end}
              onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
            />
          </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-xl border border-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-white border-b border-slate-100">
                <th className="py-6 px-8 text-left text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Fecha</th>
                <th className="py-6 px-8 text-left text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Naturaleza</th>
                <th className="py-6 px-8 text-left text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Sede / Ubicación</th>
                <th className="py-6 px-8 text-left text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">OBSERVACIONES REGISTRADAS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredRecords.length > 0 ? filteredRecords.map((record) => (
                <tr 
                  key={`${record.type}-${record.id}`} 
                  className={`group transition-colors ${
                    record.type === 'Visita Gerencial'
                      ? 'hover:bg-slate-50/50 cursor-pointer'
                      : 'cursor-default'
                  }`}
                  onClick={() => {
                    if (record.type === 'Visita Gerencial') {
                      setSelectedRecord(record);
                    }
                  }}
                >
                  <td className="py-6 px-8 align-top">
                    <span className="text-sm font-bold text-slate-800">{record.date}</span>
                  </td>
                  <td className="py-6 px-8 align-top">
                    <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                      record.type === 'Auditoría' ? 'bg-orange-100 text-orange-700' :
                      record.type === 'Inventario CCTV' ? 'bg-blue-100 text-blue-700' :
                      record.type === 'Infraestructura' ? 'bg-purple-100 text-purple-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {record.type.toUpperCase()}
                    </span>
                    <div className="mt-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-1">
                      {record.pharmacyZone}
                    </div>
                  </td>
                  <td className="py-6 px-8 align-top">
  <div className="flex items-center gap-3">
    <div className="font-black text-slate-900 text-lg uppercase tracking-normal">
      {record.pharmacy}
    </div>
    
    {!isReadOnly && record.type === 'Auditoría' && onEditAudit && record.original.createdBy === currentUser?.fullName && (
      <button 
        onClick={(e) => {
          e.stopPropagation();
          onEditAudit(record.original);
        }}
        className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all shadow-sm border border-blue-100"
        title="Editar Auditoría"
      >
        <Pencil className="w-3.5 h-3.5" />
      </button>
    )}

    {/* ✅ CAMBIO: ahora el botón borrar aparece para TODOS los tipos */}
    {!isReadOnly && canDeleteRecord(record) && (
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleDeleteRecord(record);
        }}
        className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all shadow-sm border border-red-100"
        title="Eliminar Registro"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    )}
  </div>
</td>
                  <td className="py-6 px-8 align-top">
                    <p className="text-sm text-slate-600 font-medium leading-relaxed italic max-w-2xl whitespace-pre-wrap">
                      {record.details}
                    </p>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="py-20 text-center text-slate-400 font-medium">
                    No hay registros disponibles.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedRecord && selectedRecord.type === 'Visita Gerencial' && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-[2rem] shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-start justify-between gap-4 sticky top-0 bg-white z-10">
              <div>
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-normal">
                  Detalle de Visita de Gestión
                </h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                  Consulta ampliada del registro
                </p>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="p-3 rounded-2xl bg-slate-100 text-slate-500 hover:bg-slate-200 transition-all"
                title="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 md:p-8">
              {renderVisitDetailContent()}
            </div>
          </div>
        </div>
      )}

      {recordToDelete && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-[2rem] shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="w-7 h-7 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-normal">
                    Confirmar eliminación
                  </h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                    Esta acción no se puede deshacer
                  </p>
                </div>
              </div>
              <button
                onClick={closeDeleteModal}
                className="p-2 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 transition-all"
                title="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6">
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 mb-6">
                <p className="text-sm text-slate-600 leading-relaxed">
                  ¿Deseas eliminar este registro de <span className="font-black text-slate-900">{recordToDelete.type}</span> de la sede{' '}
                  <span className="font-black text-slate-900">{recordToDelete.pharmacy}</span>?
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-end">
                <button
                  onClick={closeDeleteModal}
                  className="px-5 py-3 rounded-xl bg-slate-100 text-slate-700 font-black uppercase tracking-widest text-[10px] hover:bg-slate-200 transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDeleteRecord}
                  className="px-5 py-3 rounded-xl bg-red-600 text-white font-black uppercase tracking-widest text-[10px] hover:bg-red-700 transition-all shadow-lg"
                >
                  Sí, eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VisitLog; 
