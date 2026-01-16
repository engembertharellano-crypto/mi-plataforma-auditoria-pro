import React, { useState, useMemo } from 'react';
import { 
  Search,
  Trash2,
  AlertTriangle,
  X,
  ShieldAlert,
  Users,
  ChevronDown,
  MessageSquare,
  User as UserIcon
} from 'lucide-react';
import { 
  Pharmacy, 
  AuditState, 
  CCTVInventoryRecord, 
  PhysicalInventoryRecord, 
  ManagementVisitRecord 
} from '../types';

interface VisitLogProps {
  pharmacies: Pharmacy[];
  audits: AuditState[];
  cctvRecords: CCTVInventoryRecord[];
  physicalRecords: PhysicalInventoryRecord[];
  managementRecords: ManagementVisitRecord[];
  users: any[];
  onDeleteAudit?: (id: string) => void;
  onDeleteCCTV?: (id: string) => void;
  onDeletePhysical?: (id: string) => void;
  onDeleteManagement?: (id: string) => void;
  hasAdminPrivileges?: boolean;
}

interface LogEntry {
  id: string;
  date: string;
  type: string;
  pharmacyName: string;
  details: string;
  user: string;
  originalRecordId: string;
  recordType: 'AUDIT' | 'CCTV' | 'PHYSICAL' | 'MGMT';
}

const VisitLog: React.FC<VisitLogProps> = ({ 
  pharmacies, 
  audits, 
  cctvRecords, 
  physicalRecords, 
  managementRecords,
  users,
  onDeleteAudit,
  onDeleteCCTV,
  onDeletePhysical,
  onDeleteManagement,
  hasAdminPrivileges = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<string>('todos');
  const [deleteConfirmation, setDeleteConfirmation] = useState<LogEntry | null>(null);
  
  const currentUser = JSON.parse(sessionStorage.getItem('xana_active_user') || '{}');
  // Se incluye a los Coordinadores como rol con privilegios de seguimiento
  const isHighRole = ['Gerente de seguridad', 'Lider de investigaciones', 'Super Usuario', 'Gerente Corporativo de Seguridad', 'Coordinador de seguridad'].includes(currentUser.role);

  const allUsers = useMemo(() => {
    return users.filter((u: any) => (u.isApproved || u.role === 'Gerente Corporativo de Seguridad' || u.role === 'Super Usuario'));
  }, [users]);

  const getAllEntries = (): LogEntry[] => {
    const entries: LogEntry[] = [];
    
    audits.forEach(a => { 
      entries.push({ 
        id: a.id || `audit-${Math.random()}`, 
        originalRecordId: a.id || '', 
        recordType: 'AUDIT', 
        date: a.date || '', 
        type: 'AUDITORÍA', 
        pharmacyName: a.pharmacy?.name || 'UBICACIÓN EXTERNA', 
        details: a.reportText ? a.reportText.substring(0, 150) + '...' : `Auditoría finalizada con puntaje de ${a.score}%. Encargado: ${a.inCharge.nombre} ${a.inCharge.apellido}.`, 
        user: a.createdBy || 'AUDITOR' 
      }); 
    });
    
    cctvRecords.forEach(c => { 
      const p = pharmacies.find(ph => ph.id === c.pharmacyId); 
      entries.push({ 
        id: c.id, 
        originalRecordId: c.id, 
        recordType: 'CCTV', 
        date: c.date, 
        type: 'INVENTARIO CCTV', 
        pharmacyName: p?.name || 'UBICACIÓN EXTERNA', 
        details: c.notes || `Levantamiento técnico de cámaras y equipos de grabación. Detectadas ${c.cameras.analogDamaged} cámaras con falla.`, 
        user: c.createdBy || 'AUDITOR' 
      }); 
    });
    
    physicalRecords.forEach(p => { 
      const pharm = pharmacies.find(ph => ph.id === p.pharmacyId); 
      entries.push({ 
        id: p.id, 
        originalRecordId: p.id, 
        recordType: 'PHYSICAL', 
        date: p.date, 
        type: 'INVENTARIO FÍSICO', 
        pharmacyName: pharm?.name || 'UBICACIÓN EXTERNA', 
        details: p.notes || `Censo perimetral de santamarías, candados e iluminación. Estado de cierres: ${p.santamarias.good}/${p.santamarias.required} operativos.`, 
        user: p.createdBy || 'AUDITOR' 
      }); 
    });
    
    managementRecords.forEach(m => { 
      const p = pharmacies.find(ph => ph.id === m.pharmacyId); 
      entries.push({ 
        id: m.id, 
        originalRecordId: m.id, 
        recordType: 'MGMT', 
        date: m.date, 
        type: m.type.toUpperCase(), 
        pharmacyName: p?.name || 'UBICACIÓN EXTERNA', 
        details: m.notes || `Gestión de campo realizada el ${m.date}.`, 
        user: m.createdBy || 'AUDITOR' 
      }); 
    });

    return entries
      .filter(entry => {
        const matchesSearch = entry.pharmacyName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            entry.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            entry.details.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesUser = selectedUser === 'todos' || entry.user === selectedUser;
        return matchesSearch && matchesUser;
      })
      .sort((a, b) => { 
        const dateA = a.date.split('/').reverse().join(''); 
        const dateB = b.date.split('/').reverse().join(''); 
        return dateB.localeCompare(dateA); 
      });
  };

  const confirmDelete = () => {
    if (deleteConfirmation) {
      const entry = deleteConfirmation;
      if (entry.recordType === 'AUDIT' && onDeleteAudit) onDeleteAudit(entry.originalRecordId);
      else if (entry.recordType === 'CCTV' && onDeleteCCTV) onDeleteCCTV(entry.originalRecordId);
      else if (entry.recordType === 'PHYSICAL' && onDeletePhysical) onDeletePhysical(entry.originalRecordId);
      else if (entry.recordType === 'MGMT' && onDeleteManagement) onDeleteManagement(entry.originalRecordId);
      setDeleteConfirmation(null);
    }
  };

  const filteredEntries = getAllEntries();

  return (
    <div className="max-w-[1600px] mx-auto p-10 animate-in fade-in duration-500">
      
      <div className="flex flex-col md:flex-row justify-between items-start mb-16 gap-8">
        <div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase">Bitácora Global</h1>
          <p className="text-slate-400 mt-2 font-bold uppercase tracking-[0.3em] text-[11px]">Trazabilidad y Reportes de Campo</p>
        </div>
        
        {isHighRole && (
          <div className="relative group">
            <div className="bg-white border border-slate-200 rounded-2xl p-1.5 flex items-center gap-2 shadow-sm hover:shadow-md transition-all cursor-pointer">
               <div className="bg-orange-50 p-2.5 rounded-xl text-orange-600">
                  <Users className="w-5 h-5" />
               </div>
               <div className="px-4 pr-10 relative">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Analista</p>
                  <select 
                    className="bg-transparent font-black text-slate-800 uppercase text-[11px] tracking-widest outline-none appearance-none cursor-pointer w-full"
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                  >
                    <option value="todos">Mostrar Todos</option>
                    {allUsers.map((user: any) => (
                      <option key={user.email} value={user.fullName}>{user.fullName}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
               </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="p-10 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] w-48">Fecha</th>
                <th className="p-10 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] w-64">Naturaleza</th>
                <th className="p-10 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] w-72">Sede / Ubicación</th>
                <th className="p-10 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Hallazgos y Observaciones</th>
                <th className="p-10 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] text-center w-32">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredEntries.map((entry) => (
                <tr key={entry.id} className="hover:bg-slate-50/30 transition-all group">
                  <td className="p-10 align-top">
                    <span className="text-slate-600 font-bold text-sm">{entry.date}</span>
                  </td>
                  <td className="p-10 align-top">
                    <div className="space-y-3">
                       <span className={`inline-block px-4 py-1.5 rounded-lg border text-[9px] font-black uppercase tracking-widest ${
                         entry.type === 'AUDITORÍA' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                         entry.type === 'INVENTARIO CCTV' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                         entry.type === 'INVENTARIO FÍSICO' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                         'bg-slate-50 text-slate-500 border-slate-100'
                       }`}>
                         {entry.type}
                       </span>
                       <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest pl-1">
                          {entry.user}
                       </p>
                    </div>
                  </td>
                  <td className="p-10 align-top">
                    <h3 className="font-black text-slate-900 text-lg tracking-tighter uppercase leading-tight">
                       {entry.pharmacyName}
                    </h3>
                  </td>
                  <td className="p-10 align-top">
                    <div className="flex gap-4">
                       <MessageSquare className="w-5 h-5 text-slate-200 shrink-0 mt-1" />
                       <p className="text-slate-500 font-medium text-sm leading-relaxed italic">
                         {entry.details}
                       </p>
                    </div>
                  </td>
                  <td className="p-10 align-top text-center">
                    <button 
                      onClick={() => setDeleteConfirmation(entry)}
                      className="p-3 rounded-xl text-slate-200 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-6 h-6" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredEntries.length === 0 && (
                 <tr>
                   <td colSpan={5} className="p-40 text-center">
                      <div className="flex flex-col items-center gap-6 opacity-20 grayscale">
                         <AlertTriangle className="w-20 h-20" />
                         <span className="font-black uppercase tracking-[0.5em] text-sm">Registro de actividad vacío</span>
                      </div>
                   </td>
                 </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-full max-w-xl px-6 z-50">
        <div className="bg-slate-900/90 backdrop-blur-xl p-4 rounded-[2rem] shadow-3xl border border-white/10 flex gap-4 items-center">
           <Search className="w-5 h-5 text-slate-500 ml-4" />
           <input 
             type="text" 
             placeholder="Filtrar por sede o detalle..."
             className="bg-transparent border-none outline-none text-white font-bold text-sm w-full placeholder:text-slate-600"
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
           />
           {searchTerm && (
             <button onClick={() => setSearchTerm('')} className="p-2 text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
             </button>
           )}
        </div>
      </div>

      {deleteConfirmation && (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-xl z-[100] flex items-center justify-center p-6 animate-in zoom-in-95 duration-200">
          <div className="bg-white rounded-[3rem] w-full max-w-md p-12 shadow-3xl text-center border border-white/20">
             <div className="w-24 h-24 bg-red-100 rounded-[2.5rem] flex items-center justify-center mb-8 mx-auto text-red-600 shadow-inner">
                <Trash2 className="w-12 h-12" />
             </div>
             <h3 className="text-3xl font-black text-slate-900 tracking-tighter mb-4">¿Eliminar Registro?</h3>
             <p className="text-slate-500 font-medium mb-10 text-sm uppercase leading-relaxed tracking-wide">Vas a eliminar una entrada del historial oficial de {deleteConfirmation.pharmacyName}. Esta acción es permanente.</p>
             <div className="flex gap-4">
                <button onClick={() => setDeleteConfirmation(null)} className="flex-1 py-5 rounded-2xl border-2 border-slate-100 text-slate-400 font-black uppercase tracking-widest text-[10px]">Cancelar</button>
                <button onClick={confirmDelete} className="flex-1 py-5 rounded-2xl bg-red-600 text-white font-black uppercase tracking-widest text-[10px] shadow-2xl">Confirmar</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VisitLog;