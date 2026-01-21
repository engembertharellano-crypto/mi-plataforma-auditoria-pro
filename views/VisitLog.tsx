import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Trash2,
  Globe,
  X,
  Pencil // Nuevo icono para editar
} from 'lucide-react';
import { AuditState, CCTVInventoryRecord, PhysicalInventoryRecord, ManagementVisitRecord, Pharmacy } from '../types';

interface VisitLogProps {
  pharmacies: Pharmacy[];
  audits: AuditState[];
  cctvRecords: CCTVInventoryRecord[];
  physicalRecords: PhysicalInventoryRecord[];
  managementRecords: ManagementVisitRecord[];
  users: any[];
  currentUser: any; // Necesario para saber si soy el creador
  onDeleteAudit: (id: string) => void;
  onDeleteCCTV: (id: string) => void;
  onDeletePhysical: (id: string) => void;
  onDeleteManagement: (id: string) => void;
  onEditAudit?: (audit: AuditState) => void; // Nueva función para editar
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
  
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ id: string; type: string } | null>(null);

  const canFilterByZone = useMemo(() => {
    if (!currentUser) return false;
    const role = (currentUser.role || '').toLowerCase();
    const email = (currentUser.email || '').toLowerCase();
    return role.includes('gerente') || 
           role.includes('lider') || 
           role === 'super usuario' || 
           email === 'directiva@xana.com';
  }, [currentUser]);

  const allRecords = useMemo(() => {
    const format = (list: any[], type: string, dateKey: string) => 
      list.map(item => {
        const pId = item.pharmacyId || (item.pharmacy && item.pharmacy.id);
        const pharmacyData = pharmacies.find(p => p.id === pId);

        return {
          id: item.id,
          type,
          date: item[dateKey] || item.date, 
          pharmacy: pharmacyData ? pharmacyData.name : (item.pharmacy?.name || 'Sede Desconocida'),
          pharmacyZone: pharmacyData ? pharmacyData.zone : (item.pharmacy?.zone || 'Zona No Identificada'), 
          details: type === 'Auditoría' ? `Cumplimiento: ${item.score}%` : 
                   type === 'Inventario CCTV' ? `${item.cameras?.length || 0} Cámaras` :
                   type === 'Infraestructura' ? `${Object.keys(item.areas || {}).length} Áreas` :
                   item.reason || 'Visita de Gestión',
          original: item
        };
      });

    return [
      ...format(audits, 'Auditoría', 'date'),
      ...format(cctvRecords, 'Inventario CCTV', 'date'),
      ...format(physicalRecords, 'Infraestructura', 'date'),
      ...format(managementRecords, 'Visita Gerencial', 'date')
    ].sort((a, b) => {
       const dateA = new Date(a.date.includes('/') ? a.date.split('/').reverse().join('-') : a.date);
       const dateB = new Date(b.date.includes('/') ? b.date.split('/').reverse().join('-') : b.date);
       return dateB.getTime() - dateA.getTime();
    });
  }, [audits, cctvRecords, physicalRecords, managementRecords, pharmacies]);

  const filteredRecords = allRecords.filter(rec => {
    const matchesSearch = 
      rec.pharmacy.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.type.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'Todos' || rec.type === filterType;
    const matchesZone = !canFilterByZone || (filterZone === 'Todas' || rec.pharmacyZone === filterZone);

    let matchesDate = true;
    if (dateRange.start && dateRange.end) {
      const recDate = new Date(rec.date.includes('/') ? rec.date.split('/').reverse().join('-') : rec.date);
      const start = new Date(dateRange.start);
      const end = new Date(dateRange.end);
      matchesDate = recDate >= start && recDate <= end;
    }

    return matchesSearch && matchesType && matchesZone && matchesDate;
  });

  const requestDelete = (record: any) => {
    if (!hasAdminPrivileges) return;
    setDeleteConfirmation({ id: record.id, type: record.type });
  };

  const confirmDelete = () => {
    if (!deleteConfirmation) return;
    if (deleteConfirmation.type === 'Auditoría') onDeleteAudit(deleteConfirmation.id);
    if (deleteConfirmation.type === 'Inventario CCTV') onDeleteCCTV(deleteConfirmation.id);
    if (deleteConfirmation.type === 'Infraestructura') onDeletePhysical(deleteConfirmation.id);
    if (deleteConfirmation.type === 'Visita Gerencial') onDeleteManagement(deleteConfirmation.id);
    setDeleteConfirmation(null);
  };

  return (
    <div className="max-w-7xl mx-auto p-8 animate-in fade-in duration-500 pb-24">
      
      <div className="mb-10">
        <h2 className="text-5xl font-black text-white tracking-tighter uppercase mb-2">BITÁCORA GLOBAL</h2>
        <p className="text-slate-300 font-bold uppercase tracking-widest text-sm">Trazabilidad y Reportes de Campo</p>
      </div>

      <div className="bg-white p-4 rounded-[2rem] shadow-xl border border-slate-100 mb-8 flex flex-col md:flex-row items-center gap-4">
          <div className="relative group flex-1 w-full">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Buscar sede o detalle..." 
              className="w-full pl-14 pr-6 py-4 bg-transparent border-none outline-none font-bold text-slate-700 placeholder-slate-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="h-10 w-px bg-slate-200 hidden md:block"></div>

          <div className="relative w-full md:w-64">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <select 
              className="w-full pl-12 pr-10 py-4 bg-white border border-slate-200 rounded-xl outline-none focus:border-orange-500 font-bold text-slate-700 appearance-none transition-all"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="Todos">Todos los Tipos</option>
              <option value="Auditoría">Auditoría</option>
              <option value="Inventario CCTV">Inventario CCTV</option>
              <option value="Infraestructura">Infraestructura</option>
              <option value="Visita Gerencial">Visita Gerencial</option>
            </select>
          </div>

          {canFilterByZone && (
            <div className="relative w-full md:w-64">
              <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <select 
                className="w-full pl-12 pr-10 py-4 bg-white border border-slate-200 rounded-xl outline-none focus:border-orange-500 font-bold text-slate-700 appearance-none transition-all"
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
              className="w-full md:w-40 px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-orange-500 font-bold text-slate-600 text-sm"
              value={dateRange.start}
              onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
            />
            <input 
              type="date" 
              className="w-full md:w-40 px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-orange-500 font-bold text-slate-600 text-sm"
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
                <th className="py-6 px-8 text-left text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Hallazgos y Observaciones</th>
                <th className="py-6 px-8 text-right text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredRecords.length > 0 ? filteredRecords.map((record) => (
                <tr key={`${record.type}-${record.id}`} className="group hover:bg-slate-50/50 transition-colors">
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
                    <div className="font-black text-slate-900 text-lg uppercase tracking-tight">{record.pharmacy}</div>
                  </td>
                  <td className="py-6 px-8 align-top">
                    <p className="text-sm text-slate-500 font-medium leading-relaxed italic max-w-lg">{record.details}</p>
                  </td>
                  <td className="py-6 px-8 align-top text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      
                      {/* BOTÓN EDITAR: Solo para el creador y si es auditoría */}
                      {record.type === 'Auditoría' && onEditAudit && record.original.createdBy === currentUser?.fullName && (
                        <button 
                          onClick={() => onEditAudit(record.original)}
                          className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors mr-2" 
                          title="Editar Auditoría"
                        >
                          <Pencil className="w-5 h-5" />
                        </button>
                      )}

                      {hasAdminPrivileges && (
                        <button 
                          onClick={() => requestDelete(record)}
                          className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors" 
                          title="Eliminar registro"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="py-20 text-center text-slate-400 font-medium">
                    No se encontraron registros que coincidan con los filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {deleteConfirmation && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[180] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-md p-8 shadow-2xl text-center transform transition-all scale-100">
             <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 className="w-8 h-8 text-red-600" />
             </div>
             <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">¿Eliminar Registro?</h3>
             <p className="text-slate-500 font-medium mb-8 leading-relaxed">
               Estás a punto de eliminar un registro de tipo <span className="font-bold text-slate-800">{deleteConfirmation.type}</span>. Esta acción no se puede deshacer.
             </p>
             <div className="flex gap-4">
               <button 
                 onClick={() => setDeleteConfirmation(null)} 
                 className="flex-1 py-3.5 rounded-xl border-2 border-slate-100 font-bold text-slate-600 hover:bg-slate-50 transition-colors uppercase text-xs tracking-widest"
               >
                 Cancelar
               </button>
               <button 
                 onClick={confirmDelete} 
                 className="flex-1 py-3.5 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-200 uppercase text-xs tracking-widest"
               >
                 Eliminar
               </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VisitLog;
