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
 Filter,
 CheckCircle2,
 XCircle,
 FileText,
 Boxes
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
 'p1.1': 'Retiro de dinero de cajas para fondo aprobado',
 'p1.2': 'Gerente/Senior verifica cuadre y firma conformidad',
 'p2.1': 'Cierre de control de efectivo y reporte diario',
 'p2.2': 'Entrega de control de efectivo entre Gerente y Senior',
 'p2.3': 'Registro y soporte de faltantes/sobrantes firmado',
 'p2.4': 'Control de devoluciones autorizadas por Gerente',
 'p2.5': 'Control de transacciones canceladas (anulaciones)',
 'p2.6': 'Dinero resguardado en lugares seguros',
 'p2.7': 'Remesa de efectivo en zonas previstas',
 'p3.1': 'Recepción adecuada de mercancía de proveedores',
 'p3.2': 'Reclamo generado por discrepancias de inventario',
 'p3.3': 'Control de registro de productos dañados/usados',
 'p3.4': 'Proveedores sin libre acceso a áreas internas',
 'p4.1': 'Revisión de pertenencias del personal al salir',
 'p4.2': 'Revisión aleatoria de bolsas de basura',
 'p4.3': 'Llaves entregadas a APV nocturno en sobre sellado',
 'p4.4': 'Vigilantes cumplen actividades y puestos',
 'p4.5': 'Apertura/Cierre por personal autorizado (no APV)',

 'h1.1': 'Pulsadores anti robo',
 'h1.2': 'Router para transmisión de datos',
 'h1.3': 'Sistema de protección contra incendios',
 'h2.1': 'Dispositivos de grabación DVR/NVR y periféricos',
 'h2.2': 'Monitores',
 'h2.3': 'Cámaras de misceláneos / OTC',
 'h2.4': 'Cámaras de farmacia detrás de línea de cajas',
 'h2.5': 'Cámaras de otras áreas',
 'h3.1': 'Cajas de resguardo de efectivo',
 'h4.1': 'Santa María',
 'h4.2': 'Puertas de entrada',
 'h4.3': 'Ventanas de turno',
 'h4.4': 'Candados para Santa María',
 'h4.5': 'Llaves para bajar Santa María',
 'h4.6': 'Manilla para bajar Santa María',
 'h4.7': 'Llaves para puertas de acceso',
 'h4.8': 'Candados para puertas de acceso',
 'h5.1': 'Lámparas de iluminación de periferia',
 'h5.2': 'Espejos convexos',

 'cctv': 'Sistema CCTV',
 'dvr': 'Grabador DVR',
 'alarma': 'Sistema de Alarma',
 'control_acceso': 'Biométrico/Control',
 'radio': 'Equipos de Radio'
};

const getNum = (val: any): number => {
 if (typeof val === 'number') return val;
 if (typeof val === 'string') return parseFloat(val) || 0;
 return 0;
};

const parseData = (data: any): any => {
 if (!data) return {};
 if (typeof data === 'object') return data;
 if (typeof data === 'string') {
   try { return JSON.parse(data); } catch (e) { return {}; }
 }
 return {};
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

 const now = new Date();
 const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
 const currentYear = now.getFullYear();

 const [selectedZone, setSelectedZone] = useState<string>(() => {
   const userZone = currentUser?.zone;
   if (!userZone || userZone.toUpperCase() === 'GLOBAL' || userZone === '') {
     return 'Todas';
   }
   return userZone;
 });

 const zones = useMemo(() => {
   const uniqueZones = new Set(pharmacies.map(p => p.zone).filter(Boolean));
   return ['Todas', ...Array.from(uniqueZones)];
 }, [pharmacies]);

 const getRiskLevel = (score: number): 'Bajo' | 'Moderado' | 'Medio' | 'Alto' | 'Extremo' => {
   if (score >= 95) return 'Bajo';
   if (score >= 85) return 'Moderado';
   if (score >= 75) return 'Medio';
   if (score >= 65) return 'Alto';
   return 'Extremo';
 };

 const getRiskColorClass = (risk: string) => {
   if (risk === 'Bajo') return 'text-emerald-400';
   if (risk === 'Moderado') return 'text-yellow-400';
   if (risk === 'Medio') return 'text-orange-400';
   if (risk === 'Alto') return 'text-red-400';
   return 'text-red-500';
 };

 // CORRECCIÓN TÉCNICA DE FECHA: Posicionando el mes correctamente en el split
 const isCurrentMonth = (dateStr?: string) => {
   if (!dateStr) return false;

   if (dateStr.includes('/')) {
     const parts = dateStr.split('/');
     if (parts.length === 3) {
       const month = parseInt(parts[1], 10) - 1; // Ajuste: El mes está en la posición 1 (DD/MM/AAAA)
       const year = parseInt(parts[2], 10);
       return month === selectedMonth && year === currentYear;
     }
   }

   const d = new Date(dateStr);
   if (isNaN(d.getTime())) return false;

   return d.getMonth() === selectedMonth && d.getFullYear() === currentYear;
 };

 const getZoneForRecord = (item: any) => {
   const pId = item.pharmacyId || item.pharmacy?.id;
   if (!pId) return undefined;
   return pharmacies.find(p => String(p.id) === String(pId))?.zone;
 };

 const filteredData = useMemo(() => {
   const filterByZoneAndOwner = (item: any) => {
     const matchesZone = selectedZone === 'Todas' || getZoneForRecord(item) === selectedZone;
     const isOwner = item.createdBy === currentUser?.fullName;
     return matchesZone || isOwner;
   };

   const filteredPharmacies = selectedZone === 'Todas' 
     ? pharmacies 
     : pharmacies.filter(p => p.zone === selectedZone);
   
   return {
     pharmacies: filteredPharmacies.filter(p => p.operativa !== false),
     audits: audits.filter(filterByZoneAndOwner),
     cctv: cctvRecords.filter(filterByZoneAndOwner),
     physical: physicalRecords.filter(filterByZoneAndOwner),
     management: managementRecords.filter(filterByZoneAndOwner),
     cases: cases.filter(filterByZoneAndOwner)
   };
 }, [selectedZone, pharmacies, audits, cctvRecords, physicalRecords, managementRecords, cases, currentUser]);

 const { 
   pharmacies: currentPharmacies, 
   audits: currentAudits, 
   cctv: currentCCTV, 
   physical: currentPhysical, 
   management: currentManagement, 
   cases: currentCases 
 } = filteredData;

 const monthlyAudits = currentAudits.filter(a => isCurrentMonth(a.date));
 const monthlyManagementCount = currentManagement.filter(r => isCurrentMonth(r.date)).length;
 const monthlyCctvCount = currentCCTV.filter(r => isCurrentMonth(r.date)).length;
 const monthlyPhysicalCount = currentPhysical.filter(r => isCurrentMonth(r.date)).length;
 const monthlyAuditsCount = monthlyAudits.length;

 const auditScores = monthlyAudits.map(a => a.score || 0);
 const avgAuditScore = auditScores.length > 0 
   ? Math.round(auditScores.reduce((a, b) => a + b, 0) / auditScores.length) 
   : 0;

 const totalPharmaciesCount = currentPharmacies.length;

 const visitedPharmaciesSet = new Set([
   ...monthlyAudits.map(a => String(a.pharmacy?.id || a.pharmacyId)).filter(id => id && id !== 'undefined' && id !== 'null'),
   ...currentManagement
     .filter(r => isCurrentMonth(r.date))
     .map(r => String(r.pharmacyId))
     .filter(id => id && id !== 'undefined' && id !== 'null')
 ]);

 const visitedPharmacies = Array.from(visitedPharmaciesSet).filter(id => 
   currentPharmacies.some(p => String(p.id) === id)
 ).length;

 const coverage = totalPharmaciesCount > 0 ? Math.round((visitedPharmacies / totalPharmaciesCount) * 100) : 0;

 const casesInSelectedMonth = currentCases.filter(c => isCurrentMonth(c.date));
 const totalCases = casesInSelectedMonth.length;
 const closedCases = casesInSelectedMonth.filter(c => c.status === 'Cerrado').length;
 const efficiency = totalCases > 0 ? Math.round((closedCases / totalCases) * 100) : 0;

 const totalActivities = monthlyAuditsCount + monthlyCctvCount + monthlyPhysicalCount + monthlyManagementCount;

  let cctvTotal = 0; 
  let cctvOk = 0;
  let cctvBad = 0;
  const cctvFailuresDetails: Record<string, number> = {};
  
  currentCCTV.filter(r => isCurrentMonth(r.date)).forEach((rawRecord: any) => {
    const r = parseData(rawRecord);
    const pharmacyName = pharmacies.find(p => String(p.id) === String(rawRecord.pharmacyId))?.name || 'Desconocida';
    const cams = r.cameras || {};
    const totalLocal = (cams.analogTotal || 0) + (cams.ipTotal || 0);
    const okLocal = (cams.analogOperative || 0) + (cams.ipOperative || 0);
    const badLocal = totalLocal - okLocal;
    
    cctvTotal += totalLocal;
    cctvOk += okLocal;
    cctvBad += badLocal;
    
    if (badLocal > 0) {
      cctvFailuresDetails[pharmacyName] = (cctvFailuresDetails[pharmacyName] || 0) + badLocal;
    }
  });

 const cctvHealth = cctvTotal > 0 ? Math.round((cctvOk / cctvTotal) * 100) : 0;

 let infraTotal = 0; 
 let infraOk = 0;
 
  const infraFailures: Record<string, { count: number, pharms: Record<string, number> }> = {
    'Santamaría': { count: 0, pharms: {} },
    'Candado': { count: 0, pharms: {} },
    'Espejo': { count: 0, pharms: {} },
    'Iluminación': { count: 0, pharms: {} }
  };
  
  currentPhysical.filter(r => isCurrentMonth(r.date)).forEach((rawRecord: any) => {
    const r = parseData(rawRecord);
    const pharmacyName = pharmacies.find(p => String(p.id) === String(rawRecord.pharmacyId))?.name || 'Desconocida';
    
    const s = r.santamarias || {};
    const c = r.candados || {};
    const e = r.espejos || {};
    const i = r.iluminacion || {};

    const reqS = s.required || 0; const goodS = s.good || 0;
    const reqC = c.required || 0; const goodC = c.good || 0;
    const reqE = e.required || 0; const goodE = e.good || 0;
    const reqI = i.required || 0; const goodI = i.good || 0;

    infraTotal += (reqS + reqC + reqE + reqI);
    infraOk += (goodS + goodC + goodE + goodI);

    if (reqS > goodS) {
      const diff = reqS - goodS;
      infraFailures['Santamaría'].count += diff;
      infraFailures['Santamaría'].pharms[pharmacyName] = (infraFailures['Santamaría'].pharms[pharmacyName] || 0) + diff;
    }
    if (reqC > goodC) {
      const diff = reqC - goodC;
      infraFailures['Candado'].count += diff;
      infraFailures['Candado'].pharms[pharmacyName] = (infraFailures['Candado'].pharms[pharmacyName] || 0) + diff;
    }
    if (reqE > goodE) {
      const diff = reqE - goodE;
      infraFailures['Espejo'].count += diff;
      infraFailures['Espejo'].pharms[pharmacyName] = (infraFailures['Espejo'].pharms[pharmacyName] || 0) + diff;
    }
    if (reqI > goodI) {
      const diff = reqI - goodI;
      infraFailures['Iluminación'].count += diff;
      infraFailures['Iluminación'].pharms[pharmacyName] = (infraFailures['Iluminación'].pharms[pharmacyName] || 0) + diff;
    }
  });

 const infraHealth = infraTotal > 0 ? Math.round((infraOk / infraTotal) * 100) : 0;

  const infraFailureList = Object.entries(infraFailures)
    .filter(([_, data]) => data.count > 0)
    .map(([name, data]) => ({ name, count: data.count, pharms: data.pharms }));

 const sortedAudits = [...monthlyAudits].sort((a, b) => (a.score || 0) - (b.score || 0));
 const lowPerforming = sortedAudits.slice(0, 3);
 const topPerforming = [...sortedAudits].reverse().slice(0, 3);

 const failureCounts: Record<string, number> = {};
 monthlyAudits.forEach(audit => {
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

 const riskCounts: Record<string, number> = {};
 monthlyAudits.forEach(audit => {
   const risk = getRiskLevel(audit.score || 0);
   riskCounts[risk] = (riskCounts[risk] || 0) + 1;
 });
 const predominantRisk = Object.entries(riskCounts).sort((a, b) => b[1] - a[1])[0];

 const highPriorityOpen = casesInSelectedMonth.filter(c => c.priority === 'Alta' && c.status !== 'Cerrado').length;

 const monthNames = [
   "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
   "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
 ];

 return (
   <div className="max-w-[1600px] mx-auto p-6 md:p-10 pb-20 animate-in fade-in duration-500">
     
     <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
       <div className="flex items-center gap-4">
         <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center shadow-2xl shrink-0 border border-slate-700">
           <BarChart3 className="w-7 h-7 text-white" />
         </div>
         <div>
           <h1 className="text-3xl font-black text-white tracking-normal uppercase drop-shadow-md">Resumen Estadístico</h1>
           <p className="text-slate-300 font-bold text-xs uppercase tracking-[0.18em]">Gestión de {monthNames[selectedMonth]} {currentYear}</p>
         </div>
       </div>

       <div className="flex flex-wrap items-center gap-4">
         <div className="flex items-center gap-3 bg-white p-2 pr-6 rounded-xl shadow-lg">
           <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500">
             <Calendar className="w-5 h-5" />
           </div>
           <div className="flex flex-col">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Mes de Consulta</label>
             <select 
               value={selectedMonth}
               onChange={(e) => setSelectedMonth(Number(e.target.value))}
               className="bg-transparent font-bold text-slate-800 outline-none cursor-pointer min-w-[120px]"
             >
               {monthNames.map((m, i) => (
                 <option key={i} value={i}>{m}</option>
               ))}
             </select>
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
     </div>

     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
       
       <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-slate-100 relative overflow-hidden group hover:scale-[1.02] transition-transform">
         <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-[4rem] -mr-4 -mt-4 transition-colors group-hover:bg-blue-100"></div>
         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 relative z-10">Promedio Inspección</p>
         <div className="flex items-end gap-3 relative z-10">
           <span className="text-5xl font-black text-slate-800 tracking-normal">{avgAuditScore}%</span>
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
           <span className="text-5xl font-black text-slate-800 tracking-normal">{coverage}%</span>
           <MapPin className="w-6 h-6 mb-2 text-emerald-500" />
         </div>
         <div className="mt-4 text-xs font-bold text-slate-400">
           {visitedPharmacies} de {totalPharmaciesCount} farmacias operativas
         </div>
       </div>

       <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-slate-100 relative overflow-hidden group hover:scale-[1.02] transition-transform">
         <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50 rounded-bl-[4rem] -mr-4 -mt-4 transition-colors group-hover:bg-purple-100"></div>
         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 relative z-10">Eficiencia Resolución</p>
         <div className="flex items-end gap-3 relative z-10">
           <span className="text-5xl font-black text-slate-800 tracking-normal">{efficiency}%</span>
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
           <span className="text-5xl font-black text-slate-800 tracking-normal">{totalActivities}</span>
           <Calendar className="w-6 h-6 mb-2 text-orange-500" />
         </div>
         
         <div className="mt-4 pt-4 border-t border-slate-50 space-y-1.5 relative z-10">
           <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-wider text-slate-400">
             <span className="flex items-center gap-1.5"><FileText className="w-2.5 h-2.5" /> Inspecciones</span>
             <span className="text-slate-600">{monthlyAuditsCount}</span>
           </div>
           <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-wider text-slate-400">
             <span className="flex items-center gap-1.5"><Briefcase className="w-2.5 h-2.5" /> Gestión</span>
             <span className="text-slate-600">{monthlyManagementCount}</span>
           </div>
           <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-wider text-slate-400">
             <span className="flex items-center gap-1.5"><Camera className="w-2.5 h-2.5" /> Protección CCTV</span>
             <span className="text-slate-600">{monthlyCctvCount}</span>
           </div>
           <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-wider text-slate-400">
             <span className="flex items-center gap-1.5"><Boxes className="w-2.5 h-2.5" /> Infraestructura</span>
             <span className="text-slate-600">{monthlyPhysicalCount}</span>
           </div>
         </div>
       </div>

     </div>

     <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
       
       <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 flex items-center justify-between relative shadow-2xl">
         <div className="flex items-center gap-4 relative z-10">
           <div className="w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400">
             <Camera className="w-6 h-6" />
           </div>
           <div>
             <p className="text-white font-black uppercase text-sm tracking-normal">Blindaje CCTV</p>
             <p className="text-slate-400 text-xs font-bold">Operatividad Tecnológica</p>
           </div>
         </div>
         <div className="text-right relative z-10">
            <span className={`text-3xl font-black ${cctvHealth >= 90 ? 'text-emerald-400' : cctvHealth >= 70 ? 'text-orange-400' : 'text-red-400'}`}>
              {cctvHealth}%
            </span>
            {cctvBad > 0 ? (
              <div className="group relative">
                <p className="text-[10px] text-red-400 font-bold uppercase flex items-center justify-end gap-1 mt-1 cursor-pointer">
                  <XCircle className="w-3 h-3" /> {cctvBad} Cámaras Inactivas
                </p>
                <div className="absolute right-0 top-full mt-3 hidden group-hover:block bg-slate-900/95 backdrop-blur-xl border border-slate-700 p-4 rounded-2xl shadow-2xl z-[100] min-w-[220px] animate-in fade-in zoom-in-95 duration-200 pointer-events-none group-hover:pointer-events-auto">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 border-b border-white/10 pb-2">Detalle por Sede</p>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
                    {Object.entries(cctvFailuresDetails).map(([pName, count]) => (
                      <div key={pName} className="flex justify-between items-center gap-4">
                        <span className="text-[10px] font-bold text-white uppercase truncate max-w-[140px]">{pName}</span>
                        <span className="text-xs font-black text-red-400 bg-red-400/10 px-2 py-0.5 rounded-md">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-[10px] text-emerald-400 font-bold uppercase flex items-center justify-end gap-1 mt-1">
                <CheckCircle2 className="w-3 h-3" /> 100% Operativo
              </p>
            )}
         </div>
       </div>

       <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 flex items-center justify-between relative shadow-2xl">
         <div className="flex items-center gap-4 relative z-10">
           <div className="w-12 h-12 bg-teal-500/20 rounded-2xl flex items-center justify-center text-teal-400">
             <BrickWall className="w-6 h-6" />
           </div>
           <div>
             <p className="text-white font-black uppercase text-sm tracking-normal">Estado Infraestructura</p>
             <p className="text-slate-400 text-xs font-bold">Condiciones Físicas</p>
           </div>
         </div>
         <div className="text-right relative z-10">
            <span className={`text-3xl font-black ${infraHealth >= 90 ? 'text-emerald-400' : infraHealth >= 70 ? 'text-orange-400' : 'text-red-400'}`}>
              {infraHealth}%
            </span>
            {infraFailureList.length > 0 ? (
              <div className="flex flex-col items-end mt-1 space-y-1">
                {infraFailureList.map((fail, i) => (
                  <div key={i} className="group relative">
                    <p className="text-[9px] text-red-400 font-bold uppercase flex items-center gap-1 cursor-pointer">
                      <AlertTriangle className="w-3 h-3" /> {fail.count} {fail.name}{fail.count > 1 ? 's' : ''}
                    </p>
                    <div className="absolute right-0 top-full mt-3 hidden group-hover:block bg-slate-900/95 backdrop-blur-xl border border-slate-700 p-4 rounded-2xl shadow-2xl z-[100] min-w-[220px] animate-in fade-in zoom-in-95 duration-200 pointer-events-none group-hover:pointer-events-auto">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 border-b border-white/10 pb-2">{fail.name}s por Sede</p>
                      <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
                        {Object.entries(fail.pharms).map(([pName, count]) => (
                          <div key={pName} className="flex justify-between items-center gap-4">
                            <span className="text-[10px] font-bold text-white uppercase truncate max-w-[140px]">{pName}</span>
                            <span className="text-xs font-black text-red-400 bg-red-400/10 px-2 py-0.5 rounded-md">{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-emerald-400 font-bold uppercase flex items-center justify-end gap-1 mt-1">
                <CheckCircle2 className="w-3 h-3" /> Sin Novedades
              </p>
            )}
         </div>
       </div>

     </div>

     <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
       
       <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl border border-slate-800 relative overflow-hidden">
         <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
         
         <h3 className="text-lg font-black text-white uppercase tracking-normal mb-8 flex items-center gap-3 relative z-10">
           <Siren className="w-6 h-6 text-red-500 animate-pulse" /> Inteligencia de Riesgos
         </h3>
         
         <div className="space-y-6 relative z-10">
           
           <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm transition-colors hover:bg-white/10">
             <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-500 shrink-0">
               <AlertTriangle className="w-6 h-6" />
             </div>
             <div>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Incumplimiento más repetido</p>
               <p className="text-white font-bold leading-tight text-sm">
                 {topFailure ? topFailure[0] : "Sin hallazgos recurrentes"}
               </p>
               <p className="text-xs text-orange-400 mt-1">
                 {topFailure ? `Detectado en ${topFailure[1]} inspección(es)` : "Excelente cumplimiento"}
               </p>
             </div>
           </div>

           <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm transition-colors hover:bg-white/10">
             <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-500 shrink-0">
               <Target className="w-6 h-6" />
             </div>
             <div>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Nivel de riesgo predominante</p>
               <p className={`font-bold leading-tight text-sm ${predominantRisk ? getRiskColorClass(predominantRisk[0]) : 'text-white'}`}>
                 {predominantRisk ? predominantRisk[0] : "Sin inspecciones registradas"}
               </p>
               <p className="text-xs text-blue-400 mt-1">
                 {predominantRisk ? `${predominantRisk[1]} inspección(es) en este nivel` : "Sin datos suficientes"}
               </p>
             </div>
           </div>

           <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm transition-colors hover:bg-white/10">
             <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center text-red-500 shrink-0">
               <Zap className="w-6 h-6" />
             </div>
             <div>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Casos críticos abiertos</p>
               <p className="text-white font-bold leading-tight text-sm">
                 {highPriorityOpen > 0 ? `${highPriorityOpen} caso(s) abiertos` : "Sin casos abiertos"}
               </p>
             </div>
           </div>

         </div>
       </div>

       <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
         
         <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100">
           <h3 className="text-lg font-black text-slate-800 uppercase tracking-normal mb-6 flex items-center gap-2">
             <Trophy className="w-5 h-5 text-emerald-500" /> Top Rendimiento
           </h3>
           <div className="space-y-4">
             {topPerforming.length > 0 ? topPerforming.map(a => (
               <div key={a.id} className="flex justify-between items-center p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                 <div className="flex items-center gap-3">
                   <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-xs"><Building2 className="w-4 h-4"/></div>
                   <div>
                     <p className="font-bold text-slate-800 text-xs uppercase tracking-normal">{a.pharmacy?.name}</p>
                     <p className="text-[10px] text-emerald-600 font-bold">{a.date}</p>
                     <p className="text-[10px] text-slate-500 font-bold uppercase">{getRiskLevel(a.score || 0)}</p>
                   </div>
                 </div>
                 <span className="text-xl font-black text-emerald-600">{a.score}%</span>
               </div>
             )) : <p className="text-slate-400 text-xs text-center py-4">Sin datos suficientes</p>}
           </div>
         </div>

         <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100">
           <h3 className="text-lg font-black text-slate-800 uppercase tracking-normal mb-6 flex items-center gap-2">
             <AlertTriangle className="w-5 h-5 text-red-500" /> Puntos Críticos
           </h3>
           <div className="space-y-4">
             {lowPerforming.length > 0 ? lowPerforming.map(a => (
               <div key={a.id} className="flex justify-between items-center p-3 bg-red-50 rounded-xl border border-red-100">
                 <div className="flex items-center gap-3">
                   <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white font-bold text-xs"><AlertTriangle className="w-4 h-4"/></div>
                   <div>
                     <p className="font-bold text-slate-800 text-xs uppercase tracking-normal">{a.pharmacy?.name}</p>
                     <p className="text-[10px] text-red-600 font-bold">{a.date}</p>
                     <p className="text-[10px] text-slate-500 font-bold uppercase">{getRiskLevel(a.score || 0)}</p>
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
