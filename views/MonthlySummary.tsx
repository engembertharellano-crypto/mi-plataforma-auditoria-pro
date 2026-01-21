import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  Target,
  BarChart3,
  Calendar, 
  Globe,
  Award,
  CheckCircle2,
  ArrowRight,
  MapPin,
  ListTodo
} from 'lucide-react';
import { Pharmacy, AuditState, CCTVInventoryRecord, PhysicalInventoryRecord, ManagementVisitRecord, PendingRecord } from '../types';

interface MonthlySummaryProps {
  pharmacies: Pharmacy[];
  audits: AuditState[];
  cctvRecords: CCTVInventoryRecord[];
  physicalRecords: PhysicalInventoryRecord[];
  managementRecords: ManagementVisitRecord[];
  pendingRecords?: PendingRecord[];
  currentUser: any;
}

const ZONES = ['Gran Caracas Llanos', 'Gran Caracas Oriente', 'Centro Occidente'];

const MonthlySummary: React.FC<MonthlySummaryProps> = ({
  pharmacies,
  audits,
  cctvRecords,
  physicalRecords,
  managementRecords,
  pendingRecords = [],
  currentUser
}) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedZone, setSelectedZone] = useState('Todas');

  // PERMISOS
  const isGlobalView = useMemo(() => {
    const role = (currentUser?.role || '').toLowerCase();
    const email = (currentUser?.email || '').toLowerCase();
    return role.includes('gerente') || role.includes('lider') || role === 'super usuario' || email === 'directiva@xana.com';
  }, [currentUser]);

  // HELPER: Obtener datos seguros
  const getPharmacyData = (record: any) => {
    const pId = record.pharmacyId || (record.pharmacy && record.pharmacy.id);
    const pharmacy = pharmacies.find(p => p.id === pId);
    return {
      id: pId,
      name: pharmacy ? pharmacy.name : (record.pharmacy?.name || 'Sede Desconocida'),
      zone: pharmacy ? pharmacy.zone : (record.pharmacy?.zone || 'Zona General')
    };
  };

  // 1. FILTRAR FARMACIAS (Para calcular cobertura base)
  const zonePharmacies = useMemo(() => {
    return pharmacies.filter(p => {
      const matchesZone = !isGlobalView || (selectedZone === 'Todas' || p.zone === selectedZone);
      return matchesZone;
    });
  }, [pharmacies, selectedZone, isGlobalView]);

  // 2. HELPER DE FILTRADO GENERAL
  const filterData = (items: any[], month: number) => {
    return items.filter(item => {
      const d = new Date(item.date.includes('/') ? item.date.split('/').reverse().join('-') : item.date);
      const matchesMonth = d.getMonth() === month;
      const { zone } = getPharmacyData(item);
      const matchesZone = !isGlobalView || (selectedZone === 'Todas' || zone === selectedZone);
      return matchesMonth && matchesZone;
    });
  };

  // DATOS DEL MES ACTUAL
  const currentAudits = filterData(audits, selectedMonth);
  const currentCCTV = filterData(cctvRecords, selectedMonth);
  const currentPhysical = filterData(physicalRecords, selectedMonth);
  
  // PENDIENTES DEL MES (Para eficiencia real)
  const currentPendings = pendingRecords.filter(p => {
    const d = new Date(p.date.includes('/') ? p.date.split('/').reverse().join('-') : p.date);
    const matchesMonth = d.getMonth() === selectedMonth;
    
    // Buscar zona del pendiente
    const ph = pharmacies.find(pharm => pharm.id === p.pharmacyId);
    const pZone = ph?.zone || '';
    const matchesZone = !isGlobalView || (selectedZone === 'Todas' || pZone === selectedZone);
    
    return matchesMonth && matchesZone;
  });

  // DATOS DEL MES ANTERIOR (Para comparar tendencias)
  const prevMonthIndex = selectedMonth === 0 ? 11 : selectedMonth - 1;
  const prevAudits = filterData(audits, prevMonthIndex);

  // CÁLCULOS ESTADÍSTICOS
  const stats = useMemo(() => {
    // A. Promedio General
    const currentAvg = currentAudits.length > 0 
      ? currentAudits.reduce((acc, curr) => acc + (curr.score || 0), 0) / currentAudits.length 
      : 0;
    
    const prevAvg = prevAudits.length > 0 
      ? prevAudits.reduce((acc, curr) => acc + (curr.score || 0), 0) / prevAudits.length 
      : 0;

    const trend = currentAvg - prevAvg;
    const hasPreviousData = prevAudits.length > 0;

    // B. Cobertura de Zona (Unique Pharmacies Visited / Total Zone Pharmacies)
    const uniqueVisitedIds = new Set(currentAudits.map(a => {
        const data = getPharmacyData(a);
        return data.id;
    }));
    const coveragePercentage = zonePharmacies.length > 0 
        ? (uniqueVisitedIds.size / zonePharmacies.length) * 100 
        : 0;

    // C. Eficiencia de Resolución (Real del mes)
    const solvedThisMonth = currentPendings.filter(p => p.status === 'Solventado').length;
    const totalPendingsThisMonth = currentPendings.length;
    // Si no hubo pendientes este mes, asumimos 100% de eficiencia operativa (sin deudas)
    const efficiencyRate = totalPendingsThisMonth > 0 
        ? (solvedThisMonth / totalPendingsThisMonth) * 100 
        : 100;

    // D. Top Ofensores
    const pharmacyScores: Record<string, { total: number, count: number, name: string }> = {};
    currentAudits.forEach(a => {
        const { name } = getPharmacyData(a);
        if (!pharmacyScores[name]) pharmacyScores[name] = { total: 0, count: 0, name };
        pharmacyScores[name].total += (a.score || 0);
        pharmacyScores[name].count += 1;
    });
    
    const leaderboard = Object.values(pharmacyScores)
        .map(p => ({ name: p.name, avg: p.total / p.count }))
        .sort((a, b) => a.avg - b.avg); 

    const worstPerformers = leaderboard.slice(0, 3);
    const bestPerformers = [...leaderboard].reverse().slice(0, 3);

    // E. Auditorías Críticas
    const criticalAudits = currentAudits.filter(a => (a.score || 0) < 70).length;

    return {
      currentAvg,
      prevAvg,
      trend,
      hasPreviousData,
      totalActivity: currentAudits.length + currentCCTV.length + currentPhysical.length,
      efficiencyRate,
      worstPerformers,
      bestPerformers,
      criticalAudits,
      coveragePercentage,
      totalPendingsThisMonth,
      uniqueVisitedCount: uniqueVisitedIds.size,
      totalZonePharmacies: zonePharmacies.length
    };
  }, [currentAudits, prevAudits, currentCCTV, currentPhysical, currentPendings, zonePharmacies]);

  const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  // GENERADOR DE MENSAJE DE DIAGNÓSTICO
  const getInsightMessage = () => {
    if (!stats.hasPreviousData) {
      // Mensaje de estado puro (sin comparación)
      if (stats.currentAvg >= 90) return "Excelente inicio de gestión. La zona mantiene estándares óptimos de seguridad.";
      if (stats.currentAvg >= 80) return "Gestión estable. Se registran niveles aceptables de cumplimiento en la zona.";
      if (stats.currentAvg > 0) return "Se detectan oportunidades de mejora. Se recomienda reforzar el plan de auditorías.";
      return "No hay suficiente data en el mes actual para generar un diagnóstico.";
    }

    // Mensaje comparativo
    if (stats.trend > 0) return `La zona muestra una TENDENCIA POSITIVA con una mejora del ${stats.trend.toFixed(1)}% respecto al mes anterior.`;
    if (stats.trend < 0) return `ALERTA DE TENDENCIA: Se registra una caída del ${Math.abs(stats.trend).toFixed(1)}% en el cumplimiento. Revisar sedes críticas.`;
    return "El rendimiento se mantiene estable respecto al mes anterior. Buscar oportunidades de mejora operativa.";
  };

  return (
    <div className="max-w-[1600px] mx-auto p-8 animate-in fade-in duration-500 pb-20">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
        <div>
          <h2 className="text-5xl font-black text-white tracking-tighter uppercase mb-2">INTELIGENCIA DE ZONA</h2>
          <p className="text-slate-300 font-bold text-sm uppercase tracking-widest">Análisis de Desempeño y Cumplimiento</p>
        </div>
        
        <div className="flex gap-4">
          {isGlobalView && (
            <div className="relative group">
              <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
              <select 
                value={selectedZone}
                onChange={(e) => setSelectedZone(e.target.value)}
                className="pl-12 pr-10 py-4 bg-white border-none rounded-2xl outline-none ring-4 ring-transparent focus:ring-orange-500/20 text-slate-800 font-black uppercase text-xs tracking-widest shadow-xl cursor-pointer min-w-[220px]"
              >
                <option value="Todas">Todas las Zonas</option>
                {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
              </select>
            </div>
          )}

          <div className="relative group">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
            <select 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="pl-12 pr-10 py-4 bg-white border-none rounded-2xl outline-none ring-4 ring-transparent focus:ring-orange-500/20 text-slate-800 font-black uppercase text-xs tracking-widest shadow-xl cursor-pointer min-w-[180px]"
            >
              {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* KPI STRIP */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        
        {/* SCORE CARD */}
        <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-100 flex flex-col justify-between h-48 relative overflow-hidden">
           <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-50 rounded-full blur-2xl"></div>
           <div className="relative z-10">
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Cumplimiento Promedio</span>
             <div className="flex items-baseline gap-2 mt-2">
               <span className="text-5xl font-black text-slate-800 tracking-tighter">{stats.currentAvg.toFixed(0)}%</span>
               {/* Solo mostramos tendencia si existe data previa */}
               {stats.hasPreviousData && stats.trend !== 0 && (
                 <span className={`text-xs font-black px-2 py-1 rounded-lg flex items-center ${stats.trend > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                   {stats.trend > 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                   {Math.abs(stats.trend).toFixed(1)}%
                 </span>
               )}
             </div>
           </div>
           <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-1000 ${stats.currentAvg >= 80 ? 'bg-indigo-500' : stats.currentAvg >= 60 ? 'bg-orange-500' : 'bg-red-500'}`} style={{ width: `${stats.currentAvg}%` }}></div>
           </div>
        </div>

        {/* RISK CARD */}
        <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-100 flex flex-col justify-between h-48 relative overflow-hidden">
           <div className="absolute -right-4 -top-4 w-24 h-24 bg-red-50 rounded-full blur-2xl"></div>
           <div className="relative z-10">
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Auditorías Críticas</span>
             <div className="flex items-baseline gap-2 mt-2">
               <span className={`text-5xl font-black tracking-tighter ${stats.criticalAudits > 0 ? 'text-red-500' : 'text-slate-800'}`}>{stats.criticalAudits}</span>
               <span className="text-xs font-bold text-slate-400 uppercase">Sedes &lt; 70%</span>
             </div>
           </div>
           <div>
             {stats.criticalAudits === 0 ? (
               <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs bg-emerald-50 px-3 py-2 rounded-xl w-fit">
                 <CheckCircle2 className="w-4 h-4" /> Zona Estable
               </div>
             ) : (
               <div className="flex items-center gap-2 text-red-600 font-bold text-xs bg-red-50 px-3 py-2 rounded-xl w-fit">
                 <AlertTriangle className="w-4 h-4" /> Atención Requerida
               </div>
             )}
           </div>
        </div>

        {/* EFFICIENCY CARD (REAL) */}
        <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-100 flex flex-col justify-between h-48 relative overflow-hidden">
           <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-50 rounded-full blur-2xl"></div>
           <div className="relative z-10">
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Resolución (Mes)</span>
             <div className="flex items-baseline gap-2 mt-2">
               <span className="text-5xl font-black text-slate-800 tracking-tighter">{stats.efficiencyRate.toFixed(0)}%</span>
             </div>
             <p className="text-[10px] font-bold text-slate-400 mt-1">{stats.totalPendingsThisMonth} Casos reportados este mes</p>
           </div>
           <div className="flex gap-1">
              {[1,2,3,4,5].map(bar => (
                <div key={bar} className={`h-2 flex-1 rounded-full ${stats.efficiencyRate >= bar * 20 ? 'bg-emerald-500' : 'bg-slate-100'}`}></div>
              ))}
           </div>
        </div>

        {/* COVERAGE CARD (NUEVA: COBERTURA DE ZONA) */}
        <div className="bg-slate-900 p-6 rounded-[2.5rem] shadow-xl shadow-slate-900/20 flex flex-col justify-between h-48 relative overflow-hidden text-white">
           <div className="relative z-10">
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Cobertura de Zona</span>
             <div className="flex items-baseline gap-2 mt-2">
               <span className="text-5xl font-black tracking-tighter text-white">{stats.coveragePercentage.toFixed(0)}%</span>
               <span className="text-xs font-bold text-orange-500 uppercase">Auditado</span>
             </div>
           </div>
           <div className="text-[10px] font-bold text-slate-400 flex flex-col gap-1">
              <div className="flex items-center gap-2">
                 <MapPin className="w-3 h-3 text-orange-500" />
                 {stats.uniqueVisitedCount} sedes visitadas
              </div>
              <div className="flex items-center gap-2 opacity-60">
                 <Target className="w-3 h-3" />
                 {stats.totalZonePharmacies} sedes totales
              </div>
           </div>
        </div>
      </div>

      {/* DETAILED INSIGHTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* TOP & BOTTOM PERFORMERS */}
        <div className="bg-white p-8 rounded-[3rem] shadow-2xl border border-slate-100">
           <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-slate-50 rounded-2xl text-slate-800">
                 <Target className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Ranking de Desempeño</h3>
           </div>

           <div className="space-y-8">
              {/* Worst Performers */}
              <div>
                 <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <TrendingDown className="w-4 h-4" /> Sedes Críticas (Prioridad)
                 </p>
                 <div className="space-y-3">
                    {stats.worstPerformers.length > 0 && stats.worstPerformers[0].avg > 0 ? stats.worstPerformers.map((p, i) => (
                       <div key={i} className="flex justify-between items-center p-4 bg-red-50/50 rounded-2xl border border-red-50">
                          <span className="font-bold text-slate-700 text-xs uppercase">{p.name}</span>
                          <span className="font-black text-red-600 text-sm">{p.avg.toFixed(1)}%</span>
                       </div>
                    )) : (
                       <div className="text-center py-4 text-slate-400 text-xs font-medium italic">Sin datos suficientes para determinar criticidad.</div>
                    )}
                 </div>
              </div>

              {/* Best Performers */}
              <div>
                 <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Award className="w-4 h-4" /> Líderes en Cumplimiento
                 </p>
                 <div className="space-y-3">
                    {stats.bestPerformers.length > 0 && stats.bestPerformers[0].avg > 0 ? stats.bestPerformers.map((p, i) => (
                       <div key={i} className="flex justify-between items-center p-4 bg-emerald-50/50 rounded-2xl border border-emerald-50">
                          <span className="font-bold text-slate-700 text-xs uppercase">{p.name}</span>
                          <span className="font-black text-emerald-600 text-sm">{p.avg.toFixed(1)}%</span>
                       </div>
                    )) : (
                       <div className="text-center py-4 text-slate-400 text-xs font-medium italic">Sin datos suficientes para el ranking.</div>
                    )}
                 </div>
              </div>
           </div>
        </div>

        {/* ACTIVITY BREAKDOWN & CATEGORIES */}
        <div className="space-y-8">
           <div className="bg-white p-8 rounded-[3rem] shadow-2xl border border-slate-100">
              <div className="flex items-center gap-3 mb-8">
                 <div className="p-3 bg-slate-50 rounded-2xl text-slate-800">
                    <BarChart3 className="w-6 h-6" />
                 </div>
                 <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Distribución Operativa</h3>
              </div>
              
              <div className="space-y-5">
                 {[
                    { label: 'Auditorías de Seguridad', val: currentAudits.length, color: 'bg-orange-500', icon: <Target className="w-4 h-4 text-white" /> },
                    { label: 'Inventarios CCTV', val: currentCCTV.length, color: 'bg-blue-500', icon: <Target className="w-4 h-4 text-white" /> },
                    { label: 'Revisiones Infraestructura', val: currentPhysical.length, color: 'bg-purple-500', icon: <Target className="w-4 h-4 text-white" /> },
                    // REEMPLAZO: Visitas Gerenciales -> Incidentes Reportados (Pendientes del mes)
                    { label: 'Incidentes Reportados', val: currentPendings.length, color: 'bg-emerald-500', icon: <ListTodo className="w-4 h-4 text-white" /> },
                 ].map((item, i) => (
                    <div key={i} className="group">
                       <div className="flex justify-between items-end mb-2">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                             {item.label}
                          </span>
                          <span className="font-black text-slate-800">{item.val}</span>
                       </div>
                       <div className="h-4 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                          {/* Calculamos barra en base a un total estimado para visualización */}
                          <div 
                             className={`h-full rounded-full ${item.color} transition-all duration-1000 shadow-sm`} 
                             style={{ width: `${Math.min(100, (item.val / (stats.totalActivity + currentPendings.length || 1)) * 100)}%` }}
                          ></div>
                       </div>
                    </div>
                 ))}
              </div>
           </div>

           {/* INSIGHT CARD */}
           <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-8 rounded-[3rem] shadow-2xl shadow-orange-500/20 text-white relative overflow-hidden">
              <div className="relative z-10">
                 <h4 className="text-lg font-black uppercase tracking-tight mb-2">Diagnóstico Rápido</h4>
                 <p className="text-xs font-medium opacity-90 leading-relaxed">
                    {getInsightMessage()}
                 </p>
              </div>
              <ArrowRight className="absolute bottom-6 right-6 w-24 h-24 text-white opacity-10" />
           </div>
        </div>

      </div>
    </div>
  );
};

export default MonthlySummary;
