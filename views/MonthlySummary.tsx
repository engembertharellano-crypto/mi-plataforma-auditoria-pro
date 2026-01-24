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
  Activity,
  Siren,
  Target,
  AlertOctagon
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

  // --- KPI LOGIC ---
  const auditScores = audits.map(a => a.score || 0);
  const avgAuditScore = auditScores.length > 0 
    ? Math.round(auditScores.reduce((a, b) => a + b, 0) / auditScores.length) 
    : 0;

  const totalPharmacies = pharmacies.length;
  const visitedPharmacies = new Set([
    ...audits.map(a => a.pharmacy?.id),
    ...cctvRecords.map(r => r.pharmacyId),
    ...physicalRecords.map(r => r.pharmacyId),
    ...managementRecords.map(r => r.pharmacyId)
  ]).size;
  const coverage = totalPharmacies > 0 ? Math.round((visitedPharmacies / totalPharmacies) * 100) : 0;

  const totalCases = cases.length;
  const closedCases = cases.filter(c => c.status === 'Cerrado').length;
  const efficiency = totalCases > 0 ? Math.round((closedCases / totalCases) * 100) : 0;

  const totalActivities = audits.length + cctvRecords.length + physicalRecords.length + managementRecords.length;

  // --- ORDENAMIENTO PARA LISTAS ---
  const sortedAudits = [...audits].sort((a, b) => (a.score || 0) - (b.score || 0));
  const lowPerforming = sortedAudits.slice(0, 3);
  const topPerforming = [...sortedAudits].reverse().slice(0, 3);

  // --- LÓGICA DE AMENAZAS (NUEVO) ---
  
  // 1. Calcular Falla Recurrente en Auditorías
  const failureCounts: Record<string, number> = {};
  audits.forEach(audit => {
    // Revisar procesos (NO)
    if (audit.processAnswers) {
      Object.entries(audit.processAnswers).forEach(([key, value]: any) => {
        if (value.status === 'NO') {
          const questionText = key; // O el texto de la pregunta si está disponible
          failureCounts[questionText] = (failureCounts[questionText] || 0) + 1;
        }
      });
    }
    // Revisar hardware (No Operativo)
    if (audit.hardwareAnswers) {
      Object.entries(audit.hardwareAnswers).forEach(([key, value]: any) => {
        if (value.status !== 'Operativo' && value.status !== 'N/A') {
          const deviceName = key;
          failureCounts[deviceName] = (failureCounts[deviceName] || 0) + 1;
        }
      });
    }
  });
  const topFailure = Object.entries(failureCounts).sort((a, b) => b[1] - a[1])[0];

  // 2. Calcular Tipo de Caso Frecuente
  const caseTypeCounts: Record<string, number> = {};
  cases.forEach(c => {
    const type = c.type || 'General';
    caseTypeCounts[type] = (caseTypeCounts[type] || 0) + 1;
  });
  const topCaseType = Object.entries(caseTypeCounts).sort((a, b) => b[1] - a[1])[0];

  // 3. Calcular Zona Caliente (Más incidencias)
  const zoneCounts: Record<string, number> = {};
  cases.forEach(c => {
    // Intentar sacar la zona de la farmacia asociada si es posible, o del usuario creador
    // Como simplificación, usaremos los casos para determinar actividad por zona si el dato existe
    // Si no, usamos las auditorías bajas
    const zone = 'General'; // Placeholder si no hay dato de zona directo en el caso
    // Para auditorías es más fácil:
  });
  
  // Mejor enfoque para Zona: Usar las farmacias de los casos o auditorías bajas
  const riskZones: Record<string, number> = {};
  lowPerforming.forEach(a => {
    if (a.pharmacy?.zone) riskZones[a.pharmacy.zone] = (riskZones[a.pharmacy.zone] || 0) + 1;
  });
  cases.forEach(c => {
    // Si tuviéramos la zona en el objeto caso, sumamos. 
    // Asumiremos que el sistema backend filtra, así que mostraremos la zona predominante de las farmacias disponibles
  });
  // Fallback: Usar las auditorías para determinar zona crítica
  const topRiskZone = Object.entries(riskZones).sort((a, b) => b[1] - a[1])[0];


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

        {/* TARJETA DE EFICIENCIA (CASOS) */}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUMNA 1: AMENAZAS ACTIVAS (REEMPLAZA A DISTRIBUCIÓN) */}
        <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl border border-slate-800 relative overflow-hidden">
          {/* Fondo decorativo */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
          
          <h3 className="text-lg font-black text-white uppercase mb-8 flex items-center gap-3 relative z-10">
            <Siren className="w-6 h-6 text-red-500 animate-pulse" /> Focos de Riesgo
          </h3>
          
          <div className="space-y-6 relative z-10">
            
            {/* 1. Falla Recurrente */}
            <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-500 shrink-0">
                <AlertOctagon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Falla Recurrente</p>
                <p className="text-white font-bold leading-tight">
                  {topFailure ? topFailure[0] : "Sin fallas recurrentes detectadas"}
                </p>
                {topFailure && <p className="text-xs text-orange-400 mt-1 font-mono">{topFailure[1]} Incidencias</p>}
              </div>
            </div>

            {/* 2. Caso Frecuente */}
            <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-500 shrink-0">
                <Target className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Incidente Frecuente</p>
                <p className="text-white font-bold leading-tight">
                  {topCaseType ? topCaseType[0] : "Sin data suficiente"}
                </p>
                {topCaseType && <p className="text-xs text-blue-400 mt-1 font-mono">{topCaseType[1]} Casos reportados</p>}
              </div>
            </div>

            {/* 3. Zona Caliente */}
            <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center text-red-500 shrink-0">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Zona Crítica</p>
                <p className="text-white font-bold leading-tight">
                  {topRiskZone ? topRiskZone[0] : "Análisis en curso"}
                </p>
                <p className="text-xs text-slate-500 mt-1">Mayor actividad negativa</p>
              </div>
            </div>

          </div>
        </div>

        {/* Columna 2 y 3: Listas de Desempeño (MANTENIDAS) */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* TOP BUENO */}
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

          {/* TOP MALO (PUNTOS CRÍTICOS) */}
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
