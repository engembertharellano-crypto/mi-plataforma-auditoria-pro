import React from 'react';
import { FileText, Briefcase, MapPin, Plus, ArrowRight, TrendingUp, Activity, PieChart } from 'lucide-react';
import { ViewName, Pharmacy, AuditState, CCTVInventoryRecord, PhysicalInventoryRecord, ManagementVisitRecord } from '../types';

interface DashboardProps {
  onNavigate: (view: ViewName) => void;
  pharmacies: Pharmacy[];
  audits: AuditState[];
  cctvRecords: CCTVInventoryRecord[];
  physicalRecords: PhysicalInventoryRecord[];
  managementRecords: ManagementVisitRecord[];
  onSelectAudit: (audit: AuditState) => void;
  readOnly?: boolean; // ✅ NUEVO
}

const Dashboard: React.FC<DashboardProps> = ({ 
  onNavigate, 
  pharmacies,
  audits, 
  cctvRecords,
  physicalRecords,
  managementRecords,
  onSelectAudit,
  readOnly = false
}) => {
  const parseAuditDate = (dateStr?: string) => {
    if (!dateStr) return new Date(0);

    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      return new Date(year, month, day);
    }

    const fallback = new Date(dateStr);
    return isNaN(fallback.getTime()) ? new Date(0) : fallback;
  };

  const history = [...audits]
    .sort((a, b) => parseAuditDate(b.date).getTime() - parseAuditDate(a.date).getTime())
    .slice(0, 5);

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const isCurrentMonth = (dateStr?: string) => {
    if (!dateStr) return false;

    if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10);
        return month === currentMonth && year === currentYear;
      }
    }

    const parsed = new Date(dateStr);
    if (isNaN(parsed.getTime())) return false;

    return parsed.getMonth() === currentMonth && parsed.getFullYear() === currentYear;
  };

  const auditsCount = audits.filter(a => isCurrentMonth(a.date)).length;
  const cctvCount = cctvRecords.filter(r => isCurrentMonth(r.date)).length;
  const physicalCount = physicalRecords.filter(r => isCurrentMonth(r.date)).length;
  const managementCount = managementRecords.filter(r => isCurrentMonth(r.date)).length;

  const visitedPharmacyIds = new Set<string>();
  const addVisitedPharmacies = (items: any[]) => {
    items.forEach(item => {
      const pharmId = (item.pharmacy && item.pharmacy.id) ? item.pharmacy.id : item.pharmacyId;
      if (pharmId && isCurrentMonth(item.date)) {
        visitedPharmacyIds.add(String(pharmId));
      }
    });
  };

  addVisitedPharmacies(audits);
  addVisitedPharmacies(managementRecords);

  const totalUniqueVisits = visitedPharmacyIds.size;
  const totalPharmacies = pharmacies.length;
  const coveragePercentage = totalPharmacies > 0
    ? Math.round((totalUniqueVisits / totalPharmacies) * 100)
    : 0;

  const monthName = now.toLocaleDateString('es-ES', { month: 'long' });

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pt-4 pb-12">
      
      {/* Header */}
      <div className="glass-card rounded-[2rem] p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        
        <div className="relative z-10">
          <h1 className="text-4xl font-black text-slate-800 tracking-normal">Centro de Operaciones</h1>
          <p className="text-slate-500 mt-2 font-medium flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
            Resumen de gestión - {monthName.charAt(0).toUpperCase() + monthName.slice(1)} {currentYear}
          </p>
        </div>

        {!readOnly && (
          <button 
            onClick={() => onNavigate('audit-wizard')}
            className="relative z-10 group bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-2xl shadow-xl shadow-slate-900/20 transition-all flex items-center gap-3 font-bold transform hover:-translate-y-1 active:translate-y-0 active:scale-95"
          >
            <div className="bg-orange-50 p-1.5 rounded-lg group-hover:rotate-90 transition-transform duration-300">
              <Plus className="w-5 h-5" />
            </div>
            Nueva Auditoría
          </button>
        )}
      </div>

      {/* Hero Stats Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] rounded-[2rem] p-10 shadow-2xl relative overflow-hidden group border border-slate-700/50">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-600/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 group-hover:bg-orange-600/30 transition-colors duration-1000"></div>
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-600/20 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/3"></div>
          
          <div className="relative z-10 flex flex-col h-full justify-between">
             <div className="flex justify-between items-start">
               <div>
                  <h2 className="text-slate-400 font-bold uppercase tracking-[0.24em] text-xs mb-2">Impacto Mensual</h2>
                  <h3 className="text-white text-4xl font-black tracking-normal">Visitas Efectivas</h3>
               </div>
               <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-inner group-hover:scale-110 transition-transform duration-500">
                 <MapPin className="w-8 h-8 text-orange-400" />
               </div>
             </div>
             
             <div className="mt-12">
               <div className="flex items-baseline gap-4">
                 <span className="text-8xl font-black text-white tracking-normal drop-shadow-lg">{totalUniqueVisits}</span>
                 <span className="text-xl text-slate-400 font-medium">sedes visitadas</span>
               </div>
               <div className="w-full bg-slate-700/30 h-3 rounded-full mt-8 overflow-hidden backdrop-blur-sm border border-white/5">
                  <div
                    className="bg-gradient-to-r from-orange-500 via-red-500 to-orange-500 h-full rounded-full animate-[shimmer_2s_linear_infinite] shadow-[0_0_20px_rgba(249,115,22,0.5)] bg-[length:200%_100%]"
                    style={{ width: `${coveragePercentage}%` }}
                  ></div>
               </div>
             </div>
          </div>
        </div>

        <div className="space-y-6">
          <div 
             className="glass-card p-8 rounded-[2rem] hover:-translate-y-2 transition-all duration-300 cursor-pointer group border-l-4 border-l-blue-500" 
             onClick={() => onNavigate('visit-log')}
          >
             <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-blue-50 rounded-2xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors shadow-sm">
                   <Activity className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-black text-slate-400 bg-slate-100/50 px-3 py-1 rounded-full border border-slate-100 uppercase">Este Mes</span>
             </div>
             <p className="text-5xl font-black text-slate-800 mb-1">{auditsCount + cctvCount + physicalCount + managementCount}</p>
             <p className="text-slate-500 font-bold text-sm">Actividades Totales</p>
          </div>

          <div className="glass-card p-8 rounded-[2rem] hover:-translate-y-2 transition-all duration-300 group border-l-4 border-l-emerald-500">
             <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors shadow-sm">
                   <TrendingUp className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-black text-slate-400 bg-slate-100/50 px-3 py-1 rounded-full border border-slate-100 uppercase">KPI</span>
             </div>
             <p className="text-5xl font-black text-slate-800 mb-1">{coveragePercentage}%</p>
             <p className="text-slate-500 font-bold text-sm">Índice de Cobertura</p>
          </div>
        </div>
      </div>

      {/* Detail Grid */}
      <div>
        <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3 tracking-normal">
          <div className="p-2 bg-slate-100 rounded-lg">
             <PieChart className="w-5 h-5 text-slate-600" />
          </div>
          Desglose de Gestión
        </h3>
        
        <div className="grid grid-cols-2 lg:grid-cols-2 gap-6">
          {[
            { label: 'Auditorías', count: auditsCount, icon: FileText, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
            { label: 'Visitas Gestión', count: managementCount, icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
          ].map((item, i) => (
            <div key={i} className={`glass-card p-6 rounded-[1.5rem] hover:shadow-2xl transition-all duration-300 group hover:-translate-y-2 border-t-4 ${item.border}`}>
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3.5 rounded-2xl ${item.bg} ${item.color} group-hover:scale-110 transition-transform shadow-sm`}>
                  <item.icon className="w-6 h-6" />
                </div>
                <span className="text-4xl font-black text-slate-800">{item.count}</span>
              </div>
              <p className="text-slate-500 font-bold text-sm tracking-normal">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* History Table */}
      <div className="glass-card rounded-[2rem] overflow-hidden border border-white/60 shadow-xl">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-white/40 backdrop-blur-sm">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3 tracking-normal">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
            </span>
            Auditorías Recientes
          </h2>
          <button 
             onClick={() => onNavigate('visit-log')}
             className="text-sm font-bold text-orange-600 hover:text-orange-700 flex items-center gap-2 hover:gap-3 transition-all bg-orange-50/50 hover:bg-orange-100 px-5 py-2.5 rounded-xl border border-orange-100"
          >
            Ver Bitácora Completa <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-wider pl-8">Farmacia</th>
                <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-wider">Fecha</th>
                <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-wider">Puntaje</th>
                <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-wider">Riesgo</th>
                <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody>
              {history.map((audit) => {
                const score = audit.score || 0;
                let auditRiskLabel = 'Extremo';
                if (score >= 95) auditRiskLabel = 'Bajo';
                else if (score >= 85) auditRiskLabel = 'Moderado';
                else if (score >= 75) auditRiskLabel = 'Medio';
                else if (score >= 65) auditRiskLabel = 'Alto';

                return (
                  <tr 
                    key={audit.id} 
                    onClick={() => onSelectAudit(audit)}
                    className="border-b border-slate-50 last:border-0 hover:bg-white/60 transition-colors cursor-pointer group"
                  >
                    <td className="p-6 pl-8 font-bold text-slate-700 group-hover:text-orange-600 transition-colors">{audit.pharmacy?.name}</td>
                    <td className="p-6 text-slate-500 font-medium text-sm">
                       <span className="bg-slate-100 px-3 py-1 rounded-lg text-slate-600 font-mono text-xs font-bold">{audit.date}</span>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-4">
                        <span className="font-black text-slate-800 min-w-[45px] text-right">{score}%</span>
                        <div className="flex-1 max-w-[100px] h-2.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                           <div 
                             className={`h-full rounded-full shadow-sm transition-all duration-500 ${
                               score >= 95
                                 ? 'bg-emerald-500'
                                 : score >= 85
                                 ? 'bg-yellow-400'
                                 : score >= 75
                                 ? 'bg-orange-400'
                                 : score >= 65
                                 ? 'bg-red-500'
                                 : 'bg-red-700'
                             }`} 
                             style={{width: `${score}%`}}
                           ></div>
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      <span className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-[0.08em] border shadow-sm ${
                        auditRiskLabel === 'Bajo' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                        auditRiskLabel === 'Moderado' ? 'bg-yellow-50 text-yellow-600 border-yellow-100' :
                        auditRiskLabel === 'Medio' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                        auditRiskLabel === 'Alto' ? 'bg-red-50 text-red-600 border-red-100' :
                        'bg-red-100 text-red-800 border-red-200'
                      }`}>
                        {auditRiskLabel}
                      </span>
                    </td>
                    <td className="p-6 text-right pr-8">
                      <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-300 group-hover:text-orange-600 group-hover:border-orange-200 transition-all shadow-sm">
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </td>
                  </tr>
                );
              })}
              {history.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-16 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-4">
                       <div className="p-6 bg-slate-50 rounded-full border border-slate-100">
                          <FileText className="w-10 h-10 opacity-20" />
                       </div>
                       <span className="font-medium">No hay auditorías recientes.</span>
                    </div>
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

export default Dashboard;
