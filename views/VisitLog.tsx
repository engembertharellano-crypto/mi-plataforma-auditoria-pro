import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Globe,
  Pencil,
  Trash2
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
  onEditAudit,
  onDeleteAudit
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('Todos');
  const [filterZone, setFilterZone] = useState('Todas');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const canFilterByZone = useMemo(() => {
    if (!currentUser) return false;
    const role = (currentUser.role || '').toLowerCase();
    const email = (currentUser.email || '').toLowerCase();
    return role.includes('gerente') || role.includes('lider') || role === 'super usuario' || email === 'directiva@xana.com';
  }, [currentUser]);

  const allRecords = useMemo(() => {
    const format = (list: any[], type: string, dateKey: string) => 
      list.map(item => {
        const pId = item.pharmacyId || (item.pharmacy && item.pharmacy.id);
        const pharmacyData = pharmacies.find(p => p.id === pId);

        let textoObservacion = "";
        if (type === 'Auditoría') {
          textoObservacion = `Nivel de cumplimiento: ${item.score}%. El análisis detallado de los hallazgos y métricas se encuentra disponible en el Dashboard.`;
        } 
        else if (type === 'Inventario CCTV' || type === 'Infraestructura') {
          textoObservacion = item.observations || item.notes || item.comments || "Sin observaciones registradas.";
        } 
        else if (type === 'Visita Gerencial') {
          textoObservacion = item.reason || item.observations || "Visita de gestión.";
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
      ...format(managementRecords, 'Visita Gerencial', 'date')
    ].sort((a, b) => {
       const dateA = new Date(a.date.includes('/') ? a.date.split('/').reverse().join('-') : a.date);
       const dateB = new Date(b.date.includes('/') ? b.date.split('/').reverse().join('-') : b.date);
       return dateB.getTime() - dateA.getTime();
    });
  }, [audits, cctvRecords, physicalRecords, managementRecords, pharmacies]);

  const filteredRecords = allRecords.filter(rec => {
    const matchesSearch = rec.pharmacy.toLowerCase().includes(searchTerm.toLowerCase()) || rec.type.toLowerCase().includes(searchTerm.toLowerCase());
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

  const handleDeleteAudit = (auditId: string) => {
    const ok = window.confirm('¿Seguro que deseas eliminar esta auditoría? Esta acción no se puede deshacer.');
    if (!ok) return;
    onDeleteAudit(auditId);
  };

  return (
    <div className="max-w-7xl mx-auto p-8 animate-in fade-in duration-500 pb-24">
      
      <div className="mb-10">
        <h2 className="text-5xl font-black text-white tracking-tighter uppercase mb-2">BITÁCORA GLOBAL</h2>
        <p className="text-slate-300 font-bold uppercase tracking-widest text-sm">Trazabilidad y Reportes de Campo</p>
      </div>

      {/* FILTROS */}
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
              <option value="Visita Gerencial">Visita Gerencial</option>
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
                <th className="py-6 px-8 text-right text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredRecords.length > 0 ? filteredRecords.map((record) => {
                const isAudit = record.type === 'Auditoría';
                const isCreator = record.original?.createdBy === currentUser?.fullName;
                const canDeleteThisAudit = isAudit && isCreator;

                return (
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
                      <div className="flex items-center gap-3">
                        <div className="font-black text-slate-900 text-lg uppercase tracking-tight">
                          {record.pharmacy}
                        </div>
                        
                        {/* LÁPIZ DE EDICIÓN: solo si es Auditoría y el usuario es el creador */}
                        {isAudit && onEditAudit && isCreator && (
                          <button 
                            onClick={() => onEditAudit(record.original)}
                            className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all shadow-sm border border-blue-100"
                            title="Editar Auditoría"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="py-6 px-8 align-top">
                      <p className="text-sm text-slate-600 font-medium leading-relaxed italic max-w-2xl whitespace-pre-wrap">
                        {record.details}
                      </p>
                    </td>
                    <td className="py-6 px-8 align-top text-right">
                      {canDeleteThisAudit ? (
                        <button
                          onClick={() => handleDeleteAudit(record.id)}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 text-red-600 border border-red-100 hover:bg-red-600 hover:text-white transition-all shadow-sm"
                          title="Eliminar Auditoría"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="text-[10px] font-black uppercase tracking-widest">Eliminar</span>
                        </button>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                          —
                        </span>
                      )}
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={5} className="py-20 text-center text-slate-400 font-medium">
                    No hay registros disponibles.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default VisitLog;
