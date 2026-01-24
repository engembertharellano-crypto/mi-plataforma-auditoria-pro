import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  MapPin, 
  Calendar, 
  Briefcase, 
  AlertTriangle,
  Building2,
  Trophy,
  Siren,
  Target,
  Zap,
  Camera,
  BrickWall,
  Filter
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

const QUESTION_MAP: Record<string, string> = {
  'p1.1': 'Uniforme y Presencia',
  'p1.2': 'Libro de Novedades',
  'p1.3': 'Control de Accesos',
  'p1.4': 'Reporte de Novedades',
  'p2.1': 'Limpieza y Orden',
  'p2.2': 'Iluminación Perimetral',
  'cctv': 'Sistema CCTV',
  'dvr': 'Grabador DVR',
  'alarma': 'Sistema de Alarma',
  'control_acceso': 'Biométrico/Control',
  'radio': 'Equipos de Radio'
};

// HELPER: Fuerza bruta para convertir cualquier cosa a número
const safeInt = (val: any): number => {
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    const parsed = parseInt(val, 10);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

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

  const [selectedZone, setSelectedZone] = useState<string>('Todas');

  const zones = useMemo(() => {
    const uniqueZones = new Set(pharmacies.map(p => p.zone).filter(Boolean));
    return ['Todas', ...Array.from(uniqueZones)];
  }, [pharmacies]);

  const filteredData = useMemo(() => {
    const filteredPharmacies = selectedZone === 'Todas' 
      ? pharmacies 
      : pharmacies.filter(p => p.zone === selectedZone);
    
    const pharmacyIds = new Set(filteredPharmacies.map(p => p.id));

    return {
      pharmacies: filteredPharmacies,
      audits: audits.filter(a => a.pharmacy?.id && pharmacyIds.has(a.pharmacy.id)),
      cctv: cctvRecords.filter(r => pharmacyIds.has(r.pharmacyId)),
      physical: physicalRecords.filter(r => pharmacyIds.has(r.pharmacyId)),
      management: managementRecords.filter(r => pharmacyIds.has(r.pharmacyId)),
      cases: cases.filter(c => true) 
    };
  }, [selectedZone, pharmacies, audits, cctvRecords, physicalRecords, managementRecords, cases]);

  const { 
    pharmacies: currentPharmacies, 
    audits: currentAudits, 
    cctv: currentCCTV, 
    physical: currentPhysical, 
    management: currentManagement, 
    cases: currentCases 
  } = filteredData;

  // --- KPI LOGIC ---
  const auditScores = currentAudits.map(a => a.score || 0);
  const avgAuditScore = auditScores.length > 0 
    ? Math.round(auditScores.reduce((a, b) => a + b, 0) / auditScores.length) 
    : 0;

  const totalPharmaciesCount = currentPharmacies.length;
  const visitedPharmacies = new Set([
    ...currentAudits.map(a => a.pharmacy?.id),
    ...currentCCTV.map(r => r.pharmacyId),
    ...currentPhysical.map(r => r.pharmacyId),
    ...currentManagement.map(r => r.pharmacyId)
  ]).size;
  const coverage = totalPharmaciesCount > 0 ? Math.round((visitedPharmacies / totalPharmaciesCount) * 100) : 0;

  const totalCases = currentCases.length;
  const closedCases = currentCases.filter(c => c.status === 'Cerrado').length;
  const efficiency = totalCases > 0 ? Math.round((closedCases / totalCases) * 100) : 0;

  const totalActivities = currentAudits.length + currentCCTV.length + currentPhysical.length + currentManagement.length;

  // =========================================================================
  // LÓGICA DE INVENTARIOS A PRUEBA DE FALLOS (FUERZA BRUTA + CONVERSIÓN TIPOS)
  // =========================================================================

  // 1. CCTV (Búsqueda recursiva de totales)
  let totalCamerasSum = 0;
  let activeCamerasSum = 0;

  currentCCTV.forEach((record: any) => {
    // Intento 1: Estructura conocida (Analog/IP)
    if (record.analogCameras) {
       totalCamerasSum += safeInt(record.analogCameras.total);
       // Busca cualquier variante de "bueno"
       activeCamerasSum += safeInt(record.analogCameras.ok || record.analogCameras.working || record.analogCameras.operative);
    }
    if (record.ipCameras) {
       totalCamerasSum += safeInt(record.ipCameras.total);
       activeCamerasSum += safeInt(record.ipCameras.ok || record.ipCameras.working || record.ipCameras.operative);
    }

    // Intento 2: Propiedades planas (Si están en la raíz)
    if (record.totalCameras) totalCamerasSum += safeInt(record.totalCameras);
    if (record.operativeCameras) activeCamerasSum += safeInt(record.operativeCameras);
    
    // Intento 3: Buscar en "cameraCounts"
    if (record.cameraCounts) {
       totalCamerasSum += safeInt(record.cameraCounts.total);
       activeCamerasSum += safeInt(record.cameraCounts.ok || record.cameraCounts.working);
    }
  });

  const cctvHealth = totalCamerasSum > 0 
    ? Math.round((activeCamerasSum / totalCamerasSum) * 100) 
    : 0;

  // 2. INFRAESTRUCTURA (Búsqueda recursiva de items)
  let totalInfraSum = 0;
  let goodInfraSum = 0;

  currentPhysical.forEach((record: any) => {
    // Estrategia: Recorrer TODAS las propiedades del objeto record
    // Si alguna propiedad es un objeto y tiene 'installed', la sumamos.
    const keys = Object.keys(record);
    
    keys.forEach(key => {
      const val = record[key];
      // Verificamos si es un objeto (como 'santamarias', 'iluminacion')
      if (val && typeof val === 'object') {
        // ¿Tiene la llave 'installed' o 'total'?
        if ('installed' in val || 'total' in val) {
           const inst = safeInt(val.installed || val.total);
           const oper = safeInt(val.operative || val.good || val.working || val.ok);
           
           if (inst > 0) {
             totalInfraSum += inst;
             goodInfraSum += oper;
           }
        }
      }
    });

    // Estrategia B: Si existe un array 'items' explícito
    if (record.items && Array.isArray(record.items)) {
      record.items.forEach((item: any) => {
         const inst = safeInt(item.installed || item.total);
         const oper = safeInt(item.operative || item.good || item.working || item.ok);
         if (inst > 0) {
           totalInfraSum += inst;
           goodInfraSum += oper;
         }
      });
    }
  });

  const infraHealth = totalInfraSum > 0 
    ? Math.round((goodInfraSum / totalInfraSum) * 100) 
    : 0;
  
  // =========================================================================

  // --- ORDENAMIENTO ---
  const sortedAudits = [...currentAudits].sort((a, b) => (a.score || 0) - (b.score || 0));
  const lowPerforming = sortedAudits.slice(0, 3);
  const topPerforming = [...sortedAudits].reverse().slice(0, 3);

  // --- LÓGICA INTELIGENTE (FOCOS DE RIESGO) ---
  const failureCounts: Record<string, number> = {};
  currentAudits.forEach(audit => {
    if (audit.processAnswers) {
      Object.entries(audit.processAnswers).forEach(([key, value]: any) => {
        if (value.status === 'NO') {
          const readableName = QUESTION_MAP[key] || key; 
          failureCounts[readableName] = (failureCounts[readableName] || 0) + 1;
        }
      });
    }
    if (audit.hardwareAnswers) {
      Object.entries(audit.hardwareAnswers).forEach(([key, value]: any) => {
        if (value.status !== 'Operativo' && value.status !== 'N/A') {
          const readableName = QUESTION_MAP[key] || key;
          failureCounts[readableName] = (failureCounts[readableName] || 0) + 1;
        }
      });
    }
  });
  const topFailure = Object.entries(failureCounts).sort((a, b) => b[1] - a[1])[0];

  const caseTypeCounts: Record<string, number> = {};
  currentCases.forEach(c => {
    let type = c.type;
    if (!type || type === 'General' || type === '') {
      const titleLower = (c.title || '').toLowerCase();
      if (titleLower.includes('cámara') || titleLower.includes('cctv') || titleLower.includes('dvr')) {
        type = 'Falla Técnica CCTV';
      } else if (titleLower.includes('hurto') || titleLower.includes('robo')) {
        type = 'Delito contra la Propiedad';
      } else if (titleLower.includes('procedimiento') || titleLower.includes('protocolo')) {
        type = 'Falla de Procedimiento';
      } else {
        type = 'Pendiente de Clasificar';
      }
    }
    caseTypeCounts[type] = (caseTypeCounts[type] || 0) + 1;
  });
  const topCaseType = Object.entries(caseTypeCounts).sort((a, b) => b[1] - a[1])[0];

  const highPriorityOpen = currentCases.filter(c => c.priority === 'Alta' && c.status !== 'Cerrado').length;

  return (
    <div className="max-w-[1600px] mx-auto p-6 md:p-10 pb-20 animate-in fade-in duration-500">
      
      {/* HEADER CON FILTRO */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center shadow-2xl shrink-0 border border-slate-700">
            <BarChart3 className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tighter uppercase drop-shadow-md">Resumen Estadístico</h1>
            <p className="text-slate-300 font-bold text-xs uppercase tracking-widest">Métricas Clave de Rendimiento</p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-white p-2 pr-6 rounded-xl shadow-lg">
          <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500">
            <Filter className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Filtrar por Zona</label>
            <select 
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              className="bg-transparent font-bold text-slate-800 outline-none cursor-pointer min-w-[150px]"
            >
              {zones.map(zone => (
                <option key={zone} value={zone}>{zone}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        
        {/* Auditoría */}
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

        {/* Cobertura */}
        <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-slate-100 relative overflow-hidden group hover:scale-[1.02] transition-transform">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-[4rem] -mr-4 -mt-4 transition-colors group-hover:bg-emerald-100"></div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 relative z-10">Cobertura Mensual</p>
          <div className="flex items-end gap-3 relative z-10">
            <span className="text-5xl font-black text-slate-800 tracking-tighter">{coverage}%</span>
            <MapPin className="w-6 h-6 mb-2 text-emerald-500" />
          </div>
          <div className="mt-4 text-xs font-bold text-slate-400">
            {visitedPharmacies} de {totalPharmaciesCount} farmacias visitadas
          </div>
        </div>

        {/* Eficiencia */}
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

        {/* Actividad */}
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

      {/* ESTADO DE FUERZA (CCTV + INFRAESTRUCTURA) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        
        {/* Blindaje CCTV */}
        <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400">
              <Camera className="w-6 h-6" />
            </div>
            <div>
              <p className="text-white font-black uppercase text-sm">Blindaje CCTV</p>
              <p className="text-slate-400 text-xs font-bold">Operatividad Tecnológica</p>
            </div>
          </div>
          <div className="text-right">
             <span className={`text-3xl font-black ${cctvHealth >= 90 ? 'text-emerald-400' : cctvHealth >= 70 ? 'text-orange-400' : 'text-red-400'}`}>
               {cctvHealth}%
             </span>
             <p className="text-[10px] text-slate-500 font-bold uppercase">{totalCamerasSum} Cámaras Auditadas</p>
          </div>
        </div>

        {/* Infraestructura */}
        <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-teal-500/20 rounded-2xl flex items-center justify-center text-teal-400">
              <BrickWall className="w-6 h-6" />
            </div>
            <div>
              <p className="text-white font-black uppercase text-sm">Estado Infraestructura</p>
              <p className="text-slate-400 text-xs font-bold">Condiciones Físicas</p>
            </div>
          </div>
          <div className="text-right">
             <span className={`text-3xl font-black ${infraHealth >= 90 ? 'text-emerald-400' : infraHealth >= 70 ? 'text-orange-400' : 'text-red-400'}`}>
               {infraHealth}%
             </span>
             <p className="text-[10px] text-slate-500 font-bold uppercase">{totalInfraSum} Elementos Rev.</p>
          </div>
        </div>

      </div>

      {/* SECCIÓN INFERIOR */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl border border-slate-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
          
          <h3 className="text-lg font-black text-white uppercase mb-8 flex items-center gap-3 relative z-10">
            <Siren className="w-6 h-6 text-red-500 animate-pulse" /> Inteligencia de Riesgos
          </h3>
          
          <div className="space-y-6 relative z-10">
            
            <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm transition-colors hover:bg-white/10">
              <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-500 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Hallazgo más Repetido</p>
                <p className="text-white font-bold leading-tight text-sm">
                  {topFailure ? topFailure[0] : "Sin hallazgos recurrentes"}
                </p>
                <p className="text-xs text-orange-400 mt-1">
                  {topFailure ? `${topFailure[1]} veces detectado` : "Excelente cumplimiento"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm transition-colors hover:bg-white/10">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-500 shrink-0">
                <Target className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Tipología Predominante</p>
                <p className="text-white font-bold leading-tight text-sm">
                  {topCaseType ? topCaseType[0] : "Sin actividad delictiva"}
                </p>
                <p className="text-xs text-blue-400 mt-1">
                  {topCaseType ? `Principal causa (${topCaseType[1]})` : "Sin reportes"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm transition-colors hover:bg-white/10">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center text-red-500 shrink-0">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Urgencia Operativa</p>
                <p className="text-white font-bold leading-tight text-sm">
                  {highPriorityOpen > 0 ? `${highPriorityOpen} Casos de Alta Prioridad` : "Sin urgencias activas"}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {highPriorityOpen > 0 ? "Requiere gestión inmediata" : "Operación estable"}
                </p>
              </div>
            </div>

          </div>
        </div>

        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          
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
