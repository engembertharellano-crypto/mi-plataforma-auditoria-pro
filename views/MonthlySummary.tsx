import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  FileText, 
  Video, 
  Lock, 
  Briefcase,
  MapPin,
  Calendar,
  Users,
  ChevronDown,
  AlertTriangle
} from 'lucide-react';
import { Pharmacy, AuditState, CCTVInventoryRecord, PhysicalInventoryRecord, ManagementVisitRecord } from '../types';

interface MonthlySummaryProps {
  pharmacies: Pharmacy[];
  audits: AuditState[];
  cctvRecords: CCTVInventoryRecord[];
  physicalRecords: PhysicalInventoryRecord[];
  managementRecords: ManagementVisitRecord[];
  users: any[];
  currentUser: any;
}

const MonthlySummary: React.FC<MonthlySummaryProps> = ({
  pharmacies,
  audits,
  cctvRecords,
  physicalRecords,
  managementRecords,
  users,
  currentUser
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedUser, setSelectedUser] = useState<string>('todos');

  const isHighRole = ['Gerente de seguridad', 'Lider de investigaciones', 'Super Usuario', 'Gerente Corporativo de Seguridad'].includes(currentUser.role);
  
  const allUsers = useMemo(() => {
    return users.filter((u: any) => (u.isApproved || u.role === 'Gerente Corporativo de Seguridad') && u.role !== 'Super Usuario');
  }, [users]);

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const monthName = currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }).toUpperCase();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const isSelectedMonth = (dateStr?: string) => {
    if (!dateStr) return false;
    const parts = dateStr.split('/');
    if (parts.length !== 3) return false;
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    return month === currentMonth && year === currentYear;
  };

  const matchesUser = (createdBy?: string) => {
    if (selectedUser === 'todos') return true;
    return createdBy === selectedUser;
  };

  const monthlyAudits = audits.filter(a => isSelectedMonth(a.date) && matchesUser(a.createdBy));
  const monthlyCCTV = cctvRecords.filter(r => isSelectedMonth(r.date) && matchesUser(r.createdBy));
  const monthlyPhysical = physicalRecords.filter(r => isSelectedMonth(r.date) && matchesUser(r.createdBy));
  const monthlyManagement = managementRecords.filter(r => isSelectedMonth(r.date) && matchesUser(r.createdBy));

  const totalActivities = monthlyAudits.length + monthlyCCTV.length + monthlyPhysical.length + monthlyManagement.length;

  const uniqueVisitKeys = new Set<string>();
  const addVisit = (date?: string, pharmId?: string) => {
    if (date && pharmId) uniqueVisitKeys.add(`${date}-${pharmId}`);
  };
  monthlyAudits.forEach(a => addVisit(a.date, a.pharmacy?.id));
  monthlyCCTV.forEach(r => addVisit(r.date, r.pharmacyId));
  monthlyPhysical.forEach(r => addVisit(r.date, r.pharmacyId));
  monthlyManagement.forEach(r => addVisit(r.date, r.pharmacyId));
  const uniqueVisitsCount = uniqueVisitKeys.size;

  const totalScore = monthlyAudits.reduce((sum, a) => sum + (a.score || 0), 0);
  const avgCompliance = monthlyAudits.length > 0 ? Math.round(totalScore / monthlyAudits.length) : 0;

  let totalCameras = 0;
  let damagedCameras = 0;
  monthlyCCTV.forEach(r => {
    const total = r.cameras.analogTotal + r.cameras.ipTotal;
    const damaged = r.cameras.analogDamaged + (r.cameras.ipTotal - r.cameras.ipOperative);
    totalCameras += total;
    damagedCameras += damaged;
  });

  const pharmDates = new Map<string, Set<string>>();
  const trackPharmDate = (pharmId: string, date: string) => {
    if (!pharmDates.has(pharmId)) pharmDates.set(pharmId, new Set());
    pharmDates.get(pharmId)?.add(date);
  };

  monthlyAudits.forEach(a => { if(a.pharmacy?.id && a.date) trackPharmDate(a.pharmacy.id, a.date) });
  monthlyCCTV.forEach(r => trackPharmDate(r.pharmacyId, r.date));
  monthlyPhysical.forEach(r => trackPharmDate(r.pharmacyId, r.date));
  monthlyManagement.forEach(r => trackPharmDate(r.pharmacyId, r.date));

  const frequencyList: { name: string; count: number }[] = [];
  pharmDates.forEach((dates, pharmId) => {
    const p = pharmacies.find(ph => ph.id === pharmId);
    if (p) {
      frequencyList.push({ name: p.name, count: dates.size });
    }
  });

  return (
    <div className="max-w-7xl mx-auto p-8 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row justify-between lg:items-center mb-10 gap-6">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight drop-shadow-md uppercase">Resultados de Gestión</h2>
          <p className="text-slate-300 font-bold uppercase tracking-widest text-[10px] mt-1">Inteligencia de Datos y Cumplimiento</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
           {isHighRole && (
             <div className="relative group min-w-[220px]">
               <div className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500 z-10">
                 <Users className="w-4 h-4" />
               </div>
               <select 
                 className="w-full pl-11 pr-10 py-3.5 bg-slate-800/80 backdrop-blur-md border border-white/10 rounded-2xl text-white font-black uppercase text-[10px] tracking-widest outline-none focus:ring-2 focus:ring-orange-500 transition-all appearance-none cursor-pointer"
                 value={selectedUser}
                 onChange={(e) => setSelectedUser(e.target.value)}
               >
                 <option value="todos">Toda la Red (General)</option>
                 {allUsers.map((user: any) => (
                   <option key={user.email} value={user.fullName}>{user.fullName}</option>
                 ))}
               </select>
               <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none group-hover:text-white transition-colors w-4 h-4" />
             </div>
           )}

           <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md px-2 py-2 rounded-2xl shadow-xl border border-white/20">
              <button onClick={prevMonth} className="p-2 hover:bg-white/10 rounded-xl text-slate-300">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2 font-black text-white min-w-[180px] justify-center text-xs uppercase tracking-widest">
                <Calendar className="w-4 h-4 text-orange-400" />
                <span>{monthName}</span>
              </div>
              <button onClick={nextMonth} className="p-2 hover:bg-white/10 rounded-xl text-slate-300">
                <ChevronRight className="w-5 h-5" />
              </button>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-3xl p-8 border border-white shadow-2xl">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">VISITAS EN CAMPO</p>
           <p className="text-5xl font-black text-slate-800 tracking-tighter mb-1">{uniqueVisitsCount}</p>
           <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Sedes Impactadas</p>
        </div>
        <div className="bg-white rounded-3xl p-8 border border-white shadow-2xl">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">OPERACIONES</p>
           <p className="text-5xl font-black text-slate-800 tracking-tighter mb-1">{totalActivities}</p>
           <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Total Gestiones</p>
        </div>
        <div className="bg-white rounded-3xl p-8 border border-white shadow-2xl border-l-8 border-l-orange-500">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">CUMPLIMIENTO RED</p>
           <div className="flex items-baseline gap-2">
             <p className="text-5xl font-black text-orange-600 tracking-tighter mb-1">{avgCompliance}%</p>
             <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Promedio</span>
           </div>
        </div>
        <div className="bg-white rounded-3xl p-8 border border-white shadow-2xl border-l-8 border-l-blue-600">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">PARQUE CCTV</p>
           <p className="text-5xl font-black text-blue-600 tracking-tighter mb-1">{totalCameras}</p>
           <p className="text-xs text-red-500 font-black uppercase tracking-widest flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5" /> {damagedCameras} Fallas Detectadas
           </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-white">
           <div className="flex items-center gap-4 mb-10">
             <div className="p-3 bg-slate-900 rounded-2xl text-white shadow-lg">
               <Briefcase className="w-6 h-6" />
             </div>
             <div>
               <h3 className="font-black text-xl text-slate-800 tracking-tight uppercase">Distribución por Naturaleza</h3>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Actividades filtradas del periodo</p>
             </div>
           </div>
           <div className="space-y-4">
              <div className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100 group hover:bg-orange-50 hover:border-orange-100 transition-all">
                 <div className="flex items-center gap-4">
                    <div className="bg-orange-600 p-3 rounded-2xl text-white shadow-xl group-hover:scale-110 transition-transform"><FileText className="w-6 h-6" /></div>
                    <div><span className="font-black text-slate-800 text-sm uppercase tracking-tight">Auditorías de Control</span><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Evaluación de Riesgos</p></div>
                 </div>
                 <span className="text-3xl font-black text-slate-800">{monthlyAudits.length}</span>
              </div>
              <div className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100 group hover:bg-blue-50 hover:border-blue-100 transition-all">
                 <div className="flex items-center gap-4">
                    <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-xl group-hover:scale-110 transition-transform"><Video className="w-6 h-6" /></div>
                    <div><span className="font-black text-slate-800 text-sm uppercase tracking-tight">Censos de Seguridad Electrónica</span><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Inventario Tecnológico</p></div>
                 </div>
                 <span className="text-3xl font-black text-slate-800">{monthlyCCTV.length}</span>
              </div>
              <div className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100 group hover:bg-slate-800 hover:border-slate-900 transition-all">
                 <div className="flex items-center gap-4">
                    <div className="bg-slate-700 p-3 rounded-2xl text-white shadow-xl group-hover:scale-110 transition-transform"><Lock className="w-6 h-6" /></div>
                    <div><span className="font-black text-slate-800 text-sm uppercase tracking-tight group-hover:text-white">Inventarios de Cierres</span><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-slate-500">Protección Perimetral</p></div>
                 </div>
                 <span className="text-3xl font-black text-slate-800 group-hover:text-white">{monthlyPhysical.length}</span>
              </div>
           </div>
        </div>

        <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-white flex flex-col">
           <div className="flex items-center gap-4 mb-10">
             <div className="p-3 bg-orange-100 rounded-2xl text-orange-600 shadow-sm"><MapPin className="w-6 h-6" /></div>
             <div><h3 className="font-black text-xl text-slate-800 tracking-tight uppercase">Presencia en Sedes</h3><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Frecuencia de visitas del auditor</p></div>
           </div>
           <div className="flex-1 overflow-hidden rounded-[2rem] border border-slate-100">
             <table className="w-full text-left border-collapse">
               <thead className="bg-slate-50">
                 <tr>
                   <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Sede Farmacia</th>
                   <th className="p-6 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Días de Gestión</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                 {frequencyList.map((item, idx) => (
                   <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                     <td className="p-6 font-black text-slate-800 text-sm uppercase tracking-tight">{item.name}</td>
                     <td className="p-6 text-center"><span className="bg-orange-50 text-orange-600 px-4 py-1.5 rounded-xl font-black text-base shadow-sm border border-orange-100">{item.count}</span></td>
                   </tr>
                 ))}
                 {frequencyList.length === 0 && (
                   <tr>
                     <td colSpan={2} className="p-20 text-center text-slate-300">
                        <div className="flex flex-col items-center gap-4 grayscale opacity-40">
                           <Calendar className="w-12 h-12" />
                           <span className="font-black uppercase tracking-widest text-xs">Sin registros para los filtros seleccionados</span>
                        </div>
                     </td>
                   </tr>
                 )}
               </tbody>
             </table>
           </div>
        </div>
      </div>
    </div>
  );
};

export default MonthlySummary;