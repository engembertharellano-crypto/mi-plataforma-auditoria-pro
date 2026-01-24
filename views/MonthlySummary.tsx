import React from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  MapPin, 
  Calendar, 
  Briefcase, 
  AlertTriangle,
  CheckCircle2,
  Building2,
  Trophy,
  Activity
} from 'lucide-react';
import { 
  Pharmacy, 
  AuditState, 
  CCTVInventoryRecord, 
  PhysicalInventoryRecord, 
  ManagementVisitRecord, 
  PendingRecord,
  CaseRecord 
} from '../types';

interface MonthlySummaryProps {
  pharmacies: Pharmacy[];
  audits: AuditState[];
  cctvRecords: CCTVInventoryRecord[];
  physicalRecords: PhysicalInventoryRecord[];
  managementRecords: ManagementVisitRecord[];
  pendingRecords: PendingRecord[];
  cases: CaseRecord[];
  users: any[];
  currentUser: any;
}

const MonthlySummary: React.FC<MonthlySummaryProps> = ({ 
  pharmacies, 
  audits, 
  cctvRecords, 
  physicalRecords, 
  managementRecords, 
  pendingRecords,
  cases = [], 
  users,
  currentUser 
}) => {

  // --- KPI 1: CALIFICACIÓN PROMEDIO ---
  const auditScores = audits.map(a => a.score || 0);
  const avgAuditScore = auditScores.length > 0 
    ? Math.round(auditScores.reduce((a, b) => a + b, 0) / auditScores.length) 
    : 0;

  // --- KPI 2: COBERTURA VISITAS ---
  const totalPharmacies = pharmacies.length;
  const visitedPharmacies = new Set([
    ...audits.map(a => a.pharmacy?.id),
    ...cctvRecords.map(r => r.pharmacyId),
    ...physicalRecords.map(r => r.pharmacyId),
    ...managementRecords.map(r => r.pharmacyId)
  ]).size;
  const coverage = totalPharmacies > 0 ? Math.round((visitedPharmacies / totalPharmacies) * 100) : 0;

  // --- KPI 3: EFICIENCIA (CASOS) ---
  const totalCases = cases.length;
  const closedCases = cases.filter(c => c.status === 'Cerrado').length;
  const efficiency = totalCases > 0 ? Math.round((closedCases / totalCases) * 100) : 0;

  // --- KPI 4: ACTIVIDAD TOTAL ---
  const totalActivities = audits.length + cctvRecords.length + physicalRecords.length + managementRecords.length;

  // --- DATOS PARA SECCIÓN INFERIOR ---
  
  // Ordenar auditorías por puntaje
  const sortedAudits = [...audits].sort((a, b) => (a.score || 0) - (b.score || 0));
  
  // Top 3 Peores (Puntos Críticos)
  const lowPerforming = sortedAudits.slice(0, 3);
  
  // Top 3 Mejores (Top Rendimiento)
  const topPerforming = [...sortedAudits].reverse().slice(0, 3);

  // Distribución de Casos
  const casesByPriority = {
    Alta: cases.filter(c => c.priority === 'Alta').length,
    Media: cases.filter(c => c.priority === 'Media').length,
    Baja: cases.filter(c => c.priority === 'Baja').length,
  };

  return (
    <div className="max-w-[1600px] mx-auto p-6 md:p-10 pb-20 animate-in fade-in duration-500">
      
      {/* HEADER (BLANCO) */}
      <div className="flex items-center gap-4 mb-10">
        <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center shadow-2xl shrink-0 border border-slate-700">
          <BarChart3 className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-white tracking-tighter uppercase drop-shadow-md">Resumen Estadístico</h1>
          <p className="text-slate-300 font-bold text-xs uppercase tracking-widest">Métricas Clave de Rendimiento</p>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        
        {/* KPI 1 */}
        <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-slate-100 relative overflow-hidden group hover:scale-[1.02] transition-transform">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-[4rem] -mr-4 -mt-4 transition-colors group-hover:bg-blue-100"></div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 relative z-10">Promedio Auditoría</p>
          <div className="flex items-end gap-3 relative z-10">
            <span className="text-5xl font-black text-slate-800 tracking-tighter">{avgAuditScore}%</span>
            <TrendingUp className={`w-6 h-6 mb-2 ${avgAuditScore >= 80 ? 'text-emerald-500' : 'text-orange-500'}`} />
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-4 overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${avgAuditScore}%` }}></div>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-slate-100 relative overflow-hidden group hover:scale-[1.02] transition-transform">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-[4rem] -mr-4 -mt-4 transition-colors group-hover:bg-emerald-100"></div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 relative z-10">Cobertura Mensual</p>
          <div className="flex items-end gap-3 relative z-10">
            <span className="text-5xl font-black text-slate-800 tracking-tighter">{coverage}%</span>
            <MapPin className="w-6 h-6 mb-2 text-emerald-500" />
          </div>
          <div className="mt-4 text-xs font-bold text-slate-400">
            {visitedPharmacies} de {totalPharmacies} farmacias visitadas
          </div>
        </div>

        {/* KPI 3 (CASOS) */}
        <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-slate-100 relative overflow-hidden group hover:scale-[1.02] transition-transform">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50 rounded-bl-[4rem] -mr-4 -mt-4 transition-colors group-hover:bg-purple-100"></div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 relative z-10">Eficiencia Resolución</p>
          <div className="flex items-end gap-3 relative z-10">
            <span className="text-5xl font-black text-slate-800 tracking-tighter">{efficiency}%</span>
            <Briefcase className="w-6 h-6 mb-2 text-purple-500" />
          </div>
          <div className="mt-4 text-xs font-bold text-slate-400">
            {closedCases} de {totalCases} Casos Cerrados
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-slate-100 relative overflow-hidden group hover:scale-[1.02] transition-transform">
          <div className="absolute top-0 right-0 w-24 h-24 bg-orange-50 rounded-bl-[4rem] -mr-4 -mt-4 transition-colors group-hover:bg-orange-100"></div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 relative z-10">Actividad Total</p>
          <div className="flex items-end gap-3 relative z-10">
            <span className="text-5xl font-black text-slate-800 tracking-tighter">{totalActivities}</span>
            <Calendar className="w-6 h-6 mb-2 text-orange-500" />
          </div>
          <p className="mt-4 text-xs font-bold text-slate-400">Registros este mes</p>
        </div>

      </div>

      {/* SECCIÓN INFERIOR RECUPERADA (LISTAS DE BUENOS Y MALOS) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Columna 1: Distribución Casos */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100">
          <h3 className="text-lg font-black text-slate-800 uppercase mb-6 flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-500" /> Distribución de Casos
          </h3>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-xs font-black uppercase mb-2 text-slate-500">
                <span>Alta Prioridad</span><span>{casesByPriority.Alta}</span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                <div className="h-full bg-red-500 rounded-full" style={{ width: `${totalCases > 0 ? (casesByPriority.Alta / totalCases) * 100 : 0}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs font-black uppercase mb-2 text-slate-500">
                <span>Media Prioridad</span><span>{casesByPriority.Media}</span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                <div className="h-full bg-orange-500 rounded-full" style={{ width: `${totalCases > 0 ? (casesByPriority.Media / totalCases) * 100 : 0}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs font-black uppercase mb-2 text-slate-500">
                <span>Baja Prioridad</span><span>{casesByPriority.Baja}</span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${totalCases > 0 ? (casesByPriority.Baja / totalCases) * 100 : 0}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Columna 2 y 3: Listas de Desempeño */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* TOP BUENO (Mejores Scores) */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100">
            <h3 className="text-lg font-black text-slate-800 uppercase mb-6 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-emerald-500" /> Top Rendimiento
            </h3>
            <div className="space-y-4">
              {topPerforming.length > 0 ? topPerforming.map(a => (
                <div key={a.id} className="flex justify-between items-center p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-xs"><Building2 className="w-4 h-4"/></div>
                    <div>
                      <p className="font-bold text-slate-800 text-xs uppercase">{a.pharmacy?.name}</p>
                      <p className="text-[10px] text-emerald-600 font-bold">{a.date}</p>
                    </div>
                  </div>
                  <span className="text-xl font-black text-emerald-600">{a.score}%</span>
                </div>
              )) : <p className="text-slate-400 text-xs text-center py-4">Sin datos suficientes</p>}
            </div>
          </div>

          {/* TOP MALO (Puntos Críticos) */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100">
            <h3 className="text-lg font-black text-slate-800 uppercase mb-6 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" /> Puntos Críticos
            </h3>
            <div className="space-y-4">
              {lowPerforming.length > 0 ? lowPerforming.map(a => (
                <div key={a.id} className="flex justify-between items-center p-3 bg-red-50 rounded-xl border border-red-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white font-bold text-xs"><AlertTriangle className="w-4 h-4"/></div>
                    <div>
                      <p className="font-bold text-slate-800 text-xs uppercase">{a.pharmacy?.name}</p>
                      <p className="text-[10px] text-red-600 font-bold">{a.date}</p>
                    </div>
                  </div>
                  <span className="text-xl font-black text-red-600">{a.score}%</span>
                </div>
              )) : <p className="text-slate-400 text-xs text-center py-4">Sin puntos críticos</p>}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default MonthlySummary;
