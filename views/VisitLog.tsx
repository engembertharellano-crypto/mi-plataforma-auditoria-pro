import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  Trash2,
  Globe
} from 'lucide-react';
import { AuditState, CCTVInventoryRecord, PhysicalInventoryRecord, ManagementVisitRecord, Pharmacy } from '../types';

interface VisitLogProps {
  pharmacies: Pharmacy[];
  audits: AuditState[];
  cctvRecords: CCTVInventoryRecord[];
  physicalRecords: PhysicalInventoryRecord[];
  managementRecords: ManagementVisitRecord[];
  users: any[];
  onDeleteAudit: (id: string) => void;
  onDeleteCCTV: (id: string) => void;
  onDeletePhysical: (id: string) => void;
  onDeleteManagement: (id: string) => void;
  hasAdminPrivileges: boolean;
}

const ZONES = ['Gran Caracas Llanos', 'Gran Caracas Oriente', 'Centro Occidente'];

const VisitLog: React.FC<VisitLogProps> = ({ 
  pharmacies, 
  audits, 
  cctvRecords, 
  physicalRecords, 
  managementRecords, 
  onDeleteAudit,
  onDeleteCCTV,
  onDeletePhysical,
  onDeleteManagement,
  hasAdminPrivileges
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('Todos');
  const [filterZone, setFilterZone] = useState('Todas');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  // Obtenemos el usuario actual de la sesión para validar permisos de visualización del filtro
  const currentUser = JSON.parse(sessionStorage.getItem('xana_active_user') || '{}');

  // Lógica estricta: Solo Gerentes, Líderes y Directiva ven el filtro de zonas
  const canFilterByZone = useMemo(() => {
    const role = (currentUser.role || '').toLowerCase();
    const email = (currentUser.email || '').toLowerCase();
    
    return role.includes('gerente') || 
           role.includes('lider') || 
           role === 'super usuario' || 
           email === 'directiva@xana.com';
  }, [currentUser]);

  // Unificamos toda la data
  const allRecords = useMemo(() => {
    const format = (list: any[], type: string, dateKey: string) => 
      list.map(item => ({
        id: item.id,
        type,
        date: item[dateKey] || item.date, // Fallback
        pharmacy: item.pharmacy?.name || 'Sede Desconocida',
        pharmacyZone: item.pharmacy?.zone || 'Zona No Identificada', 
        details: type === 'Auditoría' ? `Cumplimiento: ${item.score}%` : 
                 type === 'Inventario CCTV' ? `${item.cameras?.length || 0} Cámaras` :
                 type === 'Infraestructura' ? `${Object.keys(item.areas || {}).length} Áreas` :
                 item.reason || 'Visita de Gestión',
        original: item
      }));

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
  }, [audits, cctvRecords, physicalRecords, managementRecords]);

  // Filtros
  const filteredRecords = allRecords.filter(rec => {
    const matchesSearch = 
      rec.pharmacy.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.type.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'Todos' || rec.type === filterType;
    
    // Si tiene permiso de gerencia, obedece al filtro seleccionado.
    // Si es usuario normal, obedece a lo que ya viene filtrado por App.tsx (su propia zona).
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

  const exportToCSV = () => {
    const headers = ['Fecha', 'Tipo', 'Sede', 'Zona', 'Detalles'];
    const rows = filteredRecords.map(r => [
      r.date,
      r.type,
      `"${r.pharmacy}"`, 
      `"${r.pharmacyZone}"`,
      `"${r.details}"`
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `Bitacora_XANA_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = (record: any) => {
    if (!hasAdminPrivileges) return;
    if (!window.confirm("¿Estás seguro de eliminar este registro permanentemente?")) return;

    if (record.type === 'Auditoría') onDeleteAudit(record.id);
    if (record.type === 'Inventario CCTV') onDeleteCCTV(record.id);
    if (record.type === 'Infraestructura') onDeletePhysical(record.id);
    if (record.type === 'Visita Gerencial') onDeleteManagement(record.id);
  };

  return (
    <div className="max-w-7xl mx-auto p-8 animate-in fade-in duration-500 pb-24">
      <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tighter uppercase mb-2">Bitácora Global</h2>
          <p className="text-slate-500 font-medium">Trazabilidad y Reportes de Campo</p>
        </div>
        <button onClick={exportToCSV} className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all transform hover:-translate-y-0.5">
          <Download className="w-5 h-5" /> Exportar Reporte
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-100 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative group">
            <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Buscar sede o detalle..." 
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
            <select 
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium appearance-none"
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

          {/* FILTRO DE ZONA: SOLO VISIBLE PARA GERENCIA, LÍDER, DIRECTIVA */}
          {canFilterByZone ? (
            <div className="relative">
              <Globe className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
              <select 
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium appearance-none"
                value={filterZone}
                onChange={(e) => setFilterZone(e.target.value)}
              >
                <option value="Todas">Todas las Zonas</option>
                {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
              </select>
            </div>
          ) : (
            <div className="hidden md:block"></div>
          )}

          <div className="flex gap-2">
            <input 
              type="date" 
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium text-sm text-slate-600"
              value={dateRange.start}
              onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
            />
            <input 
              type="date" 
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium text-sm text-slate-600"
              value={dateRange.end}
              onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="py-5 px-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha</th>
                <th className="py-5 px-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Naturaleza</th>
                <th className="py-5 px-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Sede / Ubicación</th>
                <th className="py-5 px-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Hallazgos y Observaciones</th>
                <th className="py-5 px-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredRecords.length > 0 ? filteredRecords.map((record) => (
                <tr key={`${record.type}-${record.id}`} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="py-5 px-6 align-top">
                    <span className="text-sm font-bold text-slate-700">{record.date}</span>
                  </td>
                  <td className="py-5 px-6 align-top">
                    <span className={`inline-flex items-center px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide border ${
                      record.type === 'Auditoría' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                      record.type === 'Inventario CCTV' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                      record.type === 'Infraestructura' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                      'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      {record.type.toUpperCase()}
                    </span>
                    {/* ZONA EN LUGAR DE USUARIO */}
                    <div className="mt-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-1">
                      {record.pharmacyZone}
                    </div>
                  </td>
                  <td className="py-5 px-6 align-top">
                    <div className="font-black text-slate-800 uppercase">{record.pharmacy}</div>
                  </td>
                  <td className="py-5 px-6 align-top">
                    <p className="text-sm text-slate-600 font-medium leading-relaxed max-w-lg">{record.details}</p>
                  </td>
                  <td className="py-5 px-6 align-top text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {hasAdminPrivileges && (
                        <button 
                          onClick={() => handleDelete(record)}
                          className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors" 
                          title="Eliminar registro"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 font-medium">
                    No se encontraron registros que coincidan con los filtros.
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
