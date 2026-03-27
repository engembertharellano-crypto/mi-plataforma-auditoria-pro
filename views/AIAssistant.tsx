import React, { useState, useEffect, useMemo } from 'react';
import { 
  Sparkles, 
  Calendar as CalendarIcon, 
  BrainCircuit, 
  ChevronLeft, 
  ChevronRight, 
  Check,
  CheckCircle2,
  X,
  Plus,
  Trash2,
  Building2,
  Briefcase,
  AlertTriangle,
  RefreshCw,
  Target,
  UserCheck,
  Coffee,
  Zap,
  ShieldCheck,
  Clock,
  ArrowUpRight,
  LayoutGrid,
  FileText,
  Activity,
  Loader2,
  ChevronDown,
  Layers,
  MapPin,
  ClipboardCheck,
  ExternalLink,
  History,
  TrendingUp,
  Layout,
  AlertOctagon,
  PenTool
} from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import { 
  Pharmacy, 
  AuditState, 
  CCTVInventoryRecord, 
  PendingRecord, 
  StaffRecord, 
  PhysicalInventoryRecord,
  ScheduleEntry,
  BriefingData
} from '../types';

const getLocalDateISO = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const local = new Date(now.getTime() - offset * 60000);
  return local.toISOString().split('T')[0];
};

interface AIAssistantProps {
  pharmacies: Pharmacy[];
  audits: AuditState[];
  cctvRecords: CCTVInventoryRecord[];
  physicalRecords: PhysicalInventoryRecord[];
  pendingRecords: PendingRecord[];
  staffRecords: StaffRecord[];
  schedule: ScheduleEntry[];
  dailyBriefing?: BriefingData;
  onSaveSchedule: (schedule: ScheduleEntry[]) => void;
  onSaveBriefing: (briefing: BriefingData) => void;
  onAddPending: (record: PendingRecord) => void;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ 
  pharmacies, 
  audits, 
  cctvRecords, 
  physicalRecords, 
  pendingRecords, 
  staffRecords,
  schedule,
  dailyBriefing,
  onSaveSchedule,
  onSaveBriefing,
  onAddPending
}) => {
  const [isThinkingBriefing, setIsThinkingBriefing] = useState(false);
  const [isThinkingPlanning, setIsThinkingPlanning] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<ScheduleEntry[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showManualModal, setShowManualModal] = useState(false);
  
  const [proposalToSchedule, setProposalToSchedule] = useState<ScheduleEntry | null>(null);
  const [schedulingDate, setSchedulingDate] = useState(getLocalDateISO());

  const [manualData, setManualData] = useState({
    locationType: 'pharmacy' as 'pharmacy' | 'other',
    pharmacyId: '',
    customLocation: '',
    title: '', 
    description: '', 
    type: 'Auditoría', 
    customType: '',
    priority: 'Media' as 'Alta'|'Media'|'Baja', 
    date: getLocalDateISO()
  });

  const currentUser = JSON.parse(sessionStorage.getItem('xana_active_user') || '{}');
  const userFirstName = currentUser.fullName?.split(' ')[0] || 'Usuario';
  const todayISO = getLocalDateISO();

  const isGlobalRole = useMemo(() => {
    return ['Gerente de seguridad', 'Lider de investigaciones', 'Super Usuario', 'Gerente Corporativo de Seguridad'].includes(currentUser.role);
  }, [currentUser]);

  // INTEGRACIÓN CRÍTICA: Combinamos Agenda + Pendientes con Fecha
  const combinedSchedule = useMemo(() => {
    const base = isGlobalRole ? schedule : schedule.filter(s => s.createdBy === currentUser.fullName);
    
    // Filtramos pendientes activos que tengan fecha de acción
    const fromPending = (isGlobalRole ? pendingRecords : pendingRecords.filter(p => p.createdBy === currentUser.fullName))
      .filter(p => p.actionDate && p.status !== 'Solventado')
      .map(p => ({
        id: p.id,
        date: p.actionDate!,
        title: p.title,
        description: p.description,
        priority: p.priority,
        type: 'Pendiente',
        createdBy: p.createdBy,
        isFromAI: false
      }));
      
    return [...base, ...fromPending];
  }, [schedule, pendingRecords, isGlobalRole, currentUser]);

  const getNextWorkingDay = (from: Date) => {
    const next = new Date(from);
    next.setDate(next.getDate() + 1);
    while (next.getDay() === 6 || next.getDay() === 0) {
      next.setDate(next.getDate() + 1);
    }
    return next;
  };

  const tomorrow = useMemo(() => getNextWorkingDay(new Date()), []);
  const tomorrowISO = (() => {
    const offset = tomorrow.getTimezoneOffset();
    const local = new Date(tomorrow.getTime() - offset * 60000);
    return local.toISOString().split('T')[0];
  })();

  const totalCoverage = useMemo(() => {
    const uniqueVisited = new Set([
      ...audits.map(a => a.pharmacy?.id),
      ...cctvRecords.map(c => c.pharmacyId),
      ...physicalRecords.map(p => p.pharmacyId)
    ]).size;
    return pharmacies.length > 0 ? (uniqueVisited / pharmacies.length) * 100 : 0;
  }, [audits, cctvRecords, physicalRecords, pharmacies]);

  const activePending = useMemo(() => pendingRecords.filter(p => p.status !== 'Solventado'), [pendingRecords]);
  
  const allRequirements = useMemo(() => {
    const items = activePending.map(p => {
      const pharmacy = pharmacies.find(ph => ph.id === p.pharmacyId);
      const location = pharmacy ? pharmacy.name : (p.customLocation || 'Gestión General');
      return {
        id: p.id,
        date: p.actionDate || p.date,
        title: p.title,
        location: location,
        priority: p.priority
      };
    });

    const parseDate = (d: string) => {
      if (d.includes('/')) {
        const parts = d.split('/');
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
      return d;
    };

    return items.sort((a, b) => parseDate(a.date).localeCompare(parseDate(b.date)));
  }, [activePending, pharmacies]);

  const generateDailyBriefing = async () => {
    setIsThinkingBriefing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });
      const highRiskNames = pharmacies.filter(p => p.risk === 'Alto').map(p => p.name).join(', ');
      
      const todayTasks = combinedSchedule.filter(s => s.date === todayISO).map(t => t.title).join(', ');
      const tomorrowTasks = combinedSchedule.filter(s => s.date === tomorrowISO).map(t => t.title).join(', ');

      const prompt = `
        Eres el Asistente Táctico de XANA. Genera un informe MINIMALISTA, CORTO y EJECUTIVO para el usuario ${currentUser.fullName}.
        
        CONTEXTO DE HOY (${todayISO}):
        - Actividades programadas para hoy: ${todayTasks || 'Ninguna actividad agendada'}
        - Sedes en riesgo crítico: ${highRiskNames || 'Operación estable'}
        - Pendientes acumulados: ${activePending.length}
        
        PROYECCIÓN MAÑANA (${tomorrowISO}):
        - Actividades programadas: ${tomorrowTasks || 'Sin compromisos agendados aún'}

        INSTRUCCIONES DE REDACCIÓN:
        1. Comienza: "Hola ${userFirstName}. Resumen de operaciones:"
        2. Sé extremadamente conciso. Usa máximo 80-100 palabras en total.
        3. Estructura: 
           - BREVE FOCO HOY: Resume lo urgente de hoy.
           - BREVE PROYECCIÓN MAÑANA: Menciona lo que viene mañana.
           - ALERTA: Menciona el riesgo o pendiente más crítico.
        4. No uses Markdown complejo, solo texto plano profesional.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt
      });

      onSaveBriefing({
        date: todayISO,
        content: response.text || "No se pudo sincronizar el balance operativo.",
        summaryStats: {
          todayTasks: combinedSchedule.filter(s => s.date === todayISO).length,
          highRiskPharmacies: highRiskNames ? highRiskNames.split(',').length : 0,
          pendingCount: activePending.length
        }
      });
    } catch (error) {
      console.error("AI Error:", error);
    } finally {
      setIsThinkingBriefing(false);
    }
  };

  const generatePlanning = async () => {
    setIsThinkingPlanning(true);
    try {
      const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });
      const prompt = `
        Genera 3 propuestas tácticas de seguridad específicas para el usuario ${currentUser.fullName} (${currentUser.role}) en la zona ${currentUser.zone} para el día ${tomorrowISO}.
        
        Las propuestas deben basarse en:
        - Su zona de trabajo.
        - Sus pendientes actuales (${activePending.length} tareas activas).
        - Sus indicadores de cobertura (${totalCoverage.toFixed(1)}%).
        
        Responde estrictamente en formato JSON: 
        { "title": string, "description": string, "type": "Auditoría"|"Soporte"|"Seguimiento", "priority": "Alta"|"Media"|"Baja", "pharmacyId": string|null }
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                type: { type: Type.STRING },
                priority: { type: Type.STRING },
                pharmacyId: { type: Type.STRING, nullable: true }
              }
            }
          }
        }
      });

      const data = JSON.parse(response.text || '[]');
      setAiSuggestions(data.map((s: any, idx: number) => ({
        id: `ai-sugg-${Date.now()}-${idx}`,
        date: tomorrowISO,
        isFromAI: true,
        createdBy: currentUser.fullName, 
        ...s
      })));
    } catch (error) {
      console.error("AI Planning Error:", error);
    } finally {
      setIsThinkingPlanning(false);
    }
  };

  useEffect(() => {
    if (!dailyBriefing || dailyBriefing.date !== todayISO) generateDailyBriefing();
    if (aiSuggestions.length === 0) generatePlanning();
  }, []);

  const handleManualSave = () => {
    if (!manualData.title) return;
    if (manualData.locationType === 'pharmacy' && !manualData.pharmacyId) {
      alert("Seleccione una farmacia del listado.");
      return;
    }
    if (manualData.locationType === 'other' && !manualData.customLocation) {
      alert("Indique el nombre del lugar.");
      return;
    }

    const finalType = manualData.type === 'Otra' ? manualData.customType || 'Otra' : manualData.type;
    
    // Al guardar una tarea manual con fecha, la integramos como un PENDIENTE con fecha de acción.
    onAddPending({
      id: `task-${Date.now()}`,
      pharmacyId: manualData.locationType === 'pharmacy' ? manualData.pharmacyId : undefined,
      customLocation: manualData.locationType === 'other' ? manualData.customLocation : undefined,
      title: `[${finalType}] ${manualData.title}`,
      description: manualData.description,
      priority: manualData.priority,
      date: new Date().toLocaleDateString('es-ES'),
      actionDate: manualData.date,
      status: 'Pendiente',
      createdBy: currentUser.fullName
    });

    setShowManualModal(false);
    setManualData({ 
      locationType: 'pharmacy',
      pharmacyId: '',
      customLocation: '',
      title: '', 
      description: '', 
      type: 'Auditoría', 
      customType: '',
      priority: 'Media', 
      date: todayISO 
    });
  };

  const handleScheduleProposal = () => {
    if (!proposalToSchedule) return;
    
    onAddPending({
      id: proposalToSchedule.id,
      title: `[Propuesta IA] ${proposalToSchedule.title}`,
      description: proposalToSchedule.description,
      priority: proposalToSchedule.priority as any,
      date: new Date().toLocaleDateString('es-ES'),
      actionDate: schedulingDate,
      status: 'Pendiente',
      createdBy: currentUser.fullName
    });

    setAiSuggestions(prev => prev.filter(x => x.id !== proposalToSchedule.id));
    setProposalToSchedule(null);
  };

  const monthLabel = currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }).toUpperCase();
  const daysInMonth = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    return { 
      start: new Date(year, month, 1).getDay(), 
      days: new Date(year, month + 1, 0).getDate() 
    };
  }, [currentDate]);

  return (
    <div className="max-w-[1500px] mx-auto p-10 animate-in fade-in duration-700 pb-20">
      
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10 mb-16">
        <div className="flex items-center gap-6">
           <div className="p-5 bg-gradient-to-br from-slate-800 to-black rounded-[2rem] shadow-2xl text-white border border-white/10">
              <ShieldCheck className="w-12 h-12 text-orange-500" />
           </div>
           <div>
              <h1 className="text-6xl font-black text-white tracking-tighter drop-shadow-lg">Estrategia XANA</h1>
              <p className="text-slate-300 font-bold uppercase text-[11px] mt-2 tracking-[0.3em]">Centro de Inteligencia y Planificación Táctica</p>
           </div>
        </div>
        <div className="flex gap-4">
           <button onClick={() => setShowManualModal(true)} className="bg-white/10 backdrop-blur-md text-white px-8 py-4 rounded-2xl font-black uppercase text-[11px] border border-white/20 shadow-xl hover:bg-white/20 transition-all">Nueva Tarea</button>
           <button onClick={generatePlanning} className="bg-orange-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-[11px] shadow-xl shadow-orange-600/20 hover:bg-orange-500 transition-all"><Sparkles className="w-5 h-5 inline mr-2" /> Análisis Táctico</button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10 items-start">
        
        <div className="xl:col-span-4 space-y-10">
           <div className="bg-white rounded-[3rem] p-10 border border-white shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <BrainCircuit className="w-32 h-32 text-slate-900" />
              </div>
              <div className="flex items-center justify-between mb-10 relative z-10">
                 <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-orange-50 rounded-xl text-orange-600">
                      <Coffee className="w-5 h-5" />
                    </div>
                    <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest">Resumen de Situación</h2>
                 </div>
                 <button onClick={generateDailyBriefing} className="text-slate-300 hover:text-orange-600 transition-colors">
                   <RefreshCw className={`w-4 h-4 ${isThinkingBriefing ? 'animate-spin' : ''}`} />
                 </button>
              </div>
              
              {isThinkingBriefing ? (
                <div className="py-20 text-center">
                   <Loader2 className="w-12 h-12 animate-spin mx-auto text-orange-200 mb-4" />
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sincronizando con la red...</p>
                </div>
              ) : (
                <div className="text-slate-700 leading-relaxed text-sm whitespace-pre-wrap font-medium relative z-10">
                  {dailyBriefing?.content || "Iniciando protocolos de comunicación..."}
                </div>
              )}
           </div>

           <div className="space-y-6">
              <div className="flex items-center gap-3 ml-6 mb-2">
                <TrendingUp className="w-4 h-4 text-indigo-500" />
                <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Propuestas Estratégicas</h3>
              </div>
              {aiSuggestions.map(s => (
                <div key={s.id} className="bg-white rounded-[2.5rem] p-8 border border-white shadow-xl border-l-8 border-l-indigo-600 hover:scale-[1.02] transition-transform cursor-default">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex gap-2">
                       <span className="text-[9px] font-black uppercase bg-indigo-50 text-indigo-700 px-3 py-1 rounded-lg border border-indigo-100">{s.type}</span>
                       <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-lg border ${
                         s.priority === 'Alta' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-slate-50 text-slate-500 border-slate-100'
                       }`}>{s.priority}</span>
                    </div>
                    <Sparkles className="w-4 h-4 text-orange-400 animate-pulse" />
                  </div>
                  <h4 className="font-black text-slate-800 text-lg mb-2 tracking-tight">{s.title}</h4>
                  <p className="text-xs text-slate-500 mb-6 leading-relaxed">{s.description}</p>
                  <button 
                    onClick={() => { setProposalToSchedule(s); setSchedulingDate(s.date); }} 
                    className="w-full py-3 rounded-xl bg-slate-50 text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all border border-indigo-50 shadow-sm"
                  >
                    Integrar a la Agenda
                  </button>
                </div>
              ))}
           </div>
        </div>

        <div className="xl:col-span-8 space-y-10">
           
           <div className="bg-white rounded-[3.5rem] border border-white shadow-2xl overflow-hidden">
              <div className="p-10 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                 <div className="flex items-center gap-4">
                    <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100">
                       <CalendarIcon className="w-6 h-6 text-slate-800" />
                    </div>
                    <span className="font-black text-slate-900 uppercase tracking-[0.2em] text-sm">{monthLabel}</span>
                 </div>
                 <div className="flex gap-2">
                    <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="p-3 bg-white rounded-xl border border-slate-100 shadow-sm hover:bg-slate-50 transition-all"><ChevronLeft className="w-5 h-5 text-slate-600" /></button>
                    <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="p-3 bg-white rounded-xl border border-slate-100 shadow-sm hover:bg-slate-50 transition-all"><ChevronRight className="w-5 h-5 text-slate-600" /></button>
                 </div>
              </div>
              <div className="grid grid-cols-7 border-b border-slate-50 bg-slate-50/50">
                 {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(d => <div key={d} className="text-center py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{d}</div>)}
              </div>
              <div className="grid grid-cols-7">
                 {Array.from({ length: daysInMonth.start }).map((_, i) => <div key={`p-${i}`} className="min-h-[140px] bg-slate-50/10 border-r border-b border-slate-50" />)}
                 {Array.from({ length: daysInMonth.days }).map((_, i) => {
                    const day = i + 1;
                    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const tasks = combinedSchedule.filter(t => t.date === dateStr);
                    const isToday = todayISO === dateStr;
                    return (
                       <div key={day} className={`min-h-[140px] p-3 border-r border-b border-slate-50 hover:bg-slate-50/50 transition-all relative group/day ${isToday ? 'bg-indigo-50/30' : ''}`}>
                          <span className={`text-[11px] font-black px-2.5 py-1.5 rounded-lg inline-block ${isToday ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}>{day}</span>
                          <div className="mt-3 space-y-1.5">
                             {tasks.map(t => (
                               <div key={t.id} className="relative group/task">
                                 <div 
                                    className="text-[9px] font-black uppercase p-2 bg-white border border-slate-100 rounded-xl truncate shadow-sm text-slate-700 flex items-center gap-1.5" 
                                    title={!isGlobalRole ? t.description : undefined}
                                 >
                                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                      t.priority === 'Alta' ? 'bg-red-500 animate-pulse' :
                                      t.type === 'Auditoría' ? 'bg-orange-500' : 
                                      t.type === 'Soporte' ? 'bg-blue-500' : 'bg-indigo-500'
                                    }`}></div>
                                    {t.title}
                                 </div>
                                 
                                 <div className="absolute bottom-full left-0 mb-2 w-56 p-4 bg-slate-900 text-white text-[10px] rounded-2xl shadow-2xl opacity-0 invisible group-hover/task:opacity-100 group-hover/task:visible transition-all z-[100] border border-white/10 pointer-events-none transform -translate-x-2">
                                      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/10">
                                         <div className="w-6 h-6 rounded-lg bg-orange-600 flex items-center justify-center font-black text-[9px]">
                                            {t.createdBy?.charAt(0) || 'S'}
                                         </div>
                                         <div>
                                            <p className="font-black text-orange-400 uppercase tracking-widest">{t.createdBy || 'Sistema'}</p>
                                            <p className="text-[8px] font-bold text-slate-400 uppercase">{t.type}</p>
                                         </div>
                                      </div>
                                      <p className="font-medium leading-relaxed text-slate-300">
                                         {t.description || "Actividad estratégica integrada al cronograma oficial."}
                                      </p>
                                      <div className="mt-3 flex justify-between items-center pt-2 border-t border-white/5 opacity-50">
                                         <span className="font-black uppercase tracking-tighter">Prioridad {t.priority}</span>
                                         <Clock className="w-3 h-3" />
                                      </div>
                                 </div>
                               </div>
                             ))}
                          </div>
                       </div>
                    );
                 })}
              </div>
           </div>

           <div className="grid grid-cols-1 gap-10">
              
              <div className="bg-slate-900/60 backdrop-blur-3xl rounded-[3.5rem] border border-white/10 p-10 shadow-3xl relative overflow-hidden flex flex-col h-[600px] lg:col-span-2">
                 <div className="flex justify-between items-start mb-10 shrink-0">
                    <div className="flex items-center gap-4">
                       <div className="p-4 bg-orange-600 rounded-2xl text-white shadow-xl shadow-orange-600/20">
                          <ClipboardCheck className="w-8 h-8" />
                       </div>
                       <div>
                          <h3 className="text-2xl font-black text-white tracking-tight uppercase">Requerimientos</h3>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1">Sincronización de tareas tácticas</p>
                       </div>
                    </div>
                    <span className="bg-white/10 backdrop-blur-md text-white text-[11px] font-black px-6 py-2 rounded-full uppercase tracking-widest border border-white/20">
                       {allRequirements.length} ACTIVOS
                    </span>
                 </div>
                 
                 <div className="flex-1 overflow-y-auto custom-scrollbar space-y-5 pr-4">
                    {allRequirements.length === 0 ? (
                       <div className="h-full flex flex-col items-center justify-center space-y-6">
                          <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400 border border-emerald-500/30">
                             <CheckCircle2 className="w-10 h-10" />
                          </div>
                          <p className="text-xs font-black text-white uppercase tracking-[0.3em] opacity-40">Operación sin pendientes</p>
                       </div>
                    ) : (
                       allRequirements.map(item => (
                         <div key={item.id} className="p-6 bg-white rounded-3xl border-l-[10px] flex items-center gap-6 shadow-2xl transition-all hover:scale-[1.01]" style={{ borderLeftColor: item.priority === 'Alta' ? '#ef4444' : item.priority === 'Media' ? '#f97316' : '#3b82f6' }}>
                            <div className="flex-1 min-w-0">
                               <div className="flex justify-between items-start mb-2">
                                  <span className="text-base font-black text-slate-900 uppercase truncate pr-4 tracking-tight">{item.title}</span>
                                  <span className="text-[10px] font-black text-white bg-slate-900 px-3 py-1 rounded-lg uppercase shrink-0 shadow-sm">{item.date}</span>
                               </div>
                               <div className="flex items-center gap-3">
                                  <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md">
                                     <MapPin className="w-3.5 h-3.5 text-orange-600" />
                                     <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest truncate">{item.location}</span>
                                  </div>
                                  <div className="h-4 w-px bg-slate-200"></div>
                                  <span className={`text-[10px] font-black uppercase tracking-widest ${item.priority === 'Alta' ? 'text-red-600' : 'text-slate-400'}`}>Prioridad {item.priority}</span>
                               </div>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-2xl text-slate-300">
                               <ChevronRight className="w-5 h-5" />
                            </div>
                         </div>
                       ))
                    )}
                 </div>
              </div>

              <div className="bg-white rounded-[3.5rem] p-10 border border-white shadow-2xl flex flex-col md:flex-row items-center justify-between gap-10">
                 <div className="flex items-center gap-6">
                    <div className="p-5 bg-slate-50 rounded-[2rem] text-slate-400">
                       <Layout className="w-10 h-10" />
                    </div>
                    <div>
                       <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Resumen de Cobertura</h3>
                       <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-1">Has desplegado {audits.length} operaciones estratégicas durante el periodo actual.</p>
                    </div>
                 </div>
                 
                 <div className="w-full md:w-80 space-y-4">
                    <div className="flex justify-between items-end mb-2">
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nivel de Impacto</span>
                       <span className="text-2xl font-black text-slate-900">{totalCoverage.toFixed(0)}%</span>
                    </div>
                    <div className="h-4 bg-slate-100 rounded-full overflow-hidden p-1 border border-slate-50">
                       <div className="h-full bg-gradient-to-r from-orange-500 to-red-600 rounded-full transition-all duration-1000 shadow-lg shadow-orange-200" style={{ width: `${totalCoverage}%` }}></div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* MODAL PLANIFICACIÓN MANUAL */}
      {showManualModal && (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-xl z-[200] flex items-center justify-center p-6">
           <div className="bg-white rounded-[3.5rem] w-full max-w-2xl p-12 shadow-3xl animate-in zoom-in-95 border border-white/20 overflow-y-auto max-h-[95vh] custom-scrollbar">
              <div className="flex items-center gap-6 mb-10">
                 <div className="p-4 bg-slate-900 rounded-[1.5rem] text-white">
                    <CalendarIcon className="w-8 h-8" />
                 </div>
                 <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Planificar Actividad</h3>
              </div>
              
              <div className="space-y-8">
                 <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Vinculación Territorial</label>
                    <div className="grid grid-cols-2 gap-4">
                       <button 
                         onClick={() => setManualData({...manualData, locationType: 'pharmacy'})}
                         className={`p-5 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
                           manualData.locationType === 'pharmacy' ? 'border-orange-600 bg-orange-50/30' : 'border-slate-50 bg-slate-50/50 text-slate-400 hover:border-slate-200'
                         }`}
                       >
                          <Building2 className={`w-6 h-6 ${manualData.locationType === 'pharmacy' ? 'text-orange-600' : 'text-slate-300'}`} />
                          <span className={`text-[10px] font-black uppercase ${manualData.locationType === 'pharmacy' ? 'text-orange-700' : ''}`}>Sede / Farmacia</span>
                       </button>
                       <button 
                         onClick={() => setManualData({...manualData, locationType: 'other'})}
                         className={`p-5 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
                           manualData.locationType === 'other' ? 'border-indigo-600 bg-orange-50/30' : 'border-slate-50 bg-slate-50/50 text-slate-400 hover:border-slate-200'
                         }`}
                       >
                          <LayoutGrid className={`w-6 h-6 ${manualData.locationType === 'other' ? 'text-indigo-600' : 'text-slate-300'}`} />
                          <span className={`text-[10px] font-black uppercase ${manualData.locationType === 'other' ? 'text-indigo-700' : ''}`}>Otro Sitio</span>
                       </button>
                    </div>

                    {manualData.locationType === 'pharmacy' ? (
                       <div className="animate-in slide-in-from-top-2 duration-300">
                          <div className="relative">
                             <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-orange-500" />
                             <select 
                               className="w-full p-5 pl-14 border-2 border-slate-100 rounded-2xl outline-none focus:border-orange-600 bg-white font-black text-slate-800 appearance-none transition-all cursor-pointer"
                               value={manualData.pharmacyId}
                               onChange={(e) => setManualData({...manualData, pharmacyId: e.target.value})}
                             >
                               <option value="">Seleccione Sede...</option>
                               {pharmacies.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                             </select>
                             <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 pointer-events-none" />
                          </div>
                       </div>
                    ) : (
                       <div className="animate-in slide-in-from-top-2 duration-300">
                          <div className="relative">
                             <Activity className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-500" />
                             <input 
                               type="text" 
                               placeholder="Ej. Almacén Principal, Corporativo..."
                               className="w-full p-5 pl-14 border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-600 bg-white font-black text-slate-800 transition-all"
                               value={manualData.customLocation}
                               onChange={(e) => setManualData({...manualData, customLocation: e.target.value})}
                             />
                          </div>
                       </div>
                    )}
                 </div>

                 <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3 ml-1">Título de la Gestión</label>
                    <input type="text" placeholder="Ej. Auditoría de Cierre Trimestral" className="w-full p-5 bg-slate-50 border-2 border-slate-50 rounded-2xl font-black text-slate-800 outline-none focus:border-orange-500 transition-all" value={manualData.title} onChange={e => setManualData({...manualData, title: e.target.value})} />
                 </div>

                 <div className="grid grid-cols-2 gap-6">
                    <div>
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3 ml-1">Fecha de Ejecución</label>
                       <input type="date" className="w-full p-5 bg-slate-50 border-2 border-slate-50 rounded-2xl font-black text-slate-800 outline-none focus:border-orange-500 transition-all" value={manualData.date} onChange={e => setManualData({...manualData, date: e.target.value})} />
                    </div>
                    <div>
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3 ml-1">Tipo de Tarea</label>
                       <select 
                        className="w-full p-5 bg-slate-50 border-2 border-slate-50 rounded-2xl font-black text-slate-800 outline-none focus:border-orange-500 transition-all appearance-none" 
                        value={manualData.type} 
                        onChange={e => setManualData({...manualData, type: e.target.value as any})}
                       >
                          <option value="Auditoría">Auditoría</option>
                          <option value="Soporte">Soporte Técnico</option>
                          <option value="Seguimiento">Seguimiento</option>
                          <option value="Otra">Otra (Especificar...)</option>
                       </select>
                    </div>
                 </div>
                 
                 {manualData.type === 'Otra' && (
                    <div className="animate-in slide-in-from-top-2 duration-300">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3 ml-1">Especificar Tipo de Tarea</label>
                       <div className="relative">
                          <PenTool className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-orange-500" />
                          <input 
                            type="text" 
                            placeholder="Ej. Capacitación, Supervisión Especial..." 
                            className="w-full p-5 pl-14 bg-white border-2 border-slate-100 rounded-2xl font-black text-slate-800 outline-none focus:border-orange-500 transition-all shadow-sm" 
                            value={manualData.customType} 
                            onChange={e => setManualData({...manualData, customType: e.target.value})} 
                          />
                       </div>
                    </div>
                 )}

                 <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3 ml-1">Prioridad de Ejecución</label>
                    <div className="grid grid-cols-3 gap-4">
                       {(['Baja', 'Media', 'Alta'] as const).map(p => (
                         <button
                           key={p}
                           type="button"
                           onClick={() => setManualData({...manualData, priority: p})}
                           className={`p-4 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${
                             manualData.priority === p 
                               ? p === 'Alta' ? 'bg-red-50 border-red-500 text-red-600 shadow-lg' : 
                                 p === 'Media' ? 'bg-orange-50 border-orange-500 text-orange-600 shadow-lg' : 
                                 'bg-blue-50 border-blue-500 text-blue-600 shadow-lg'
                               : 'bg-slate-50 border-slate-50 text-slate-300 hover:text-slate-500'
                           }`}
                         >
                           {p}
                         </button>
                       ))}
                    </div>
                 </div>

                 <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3 ml-1">Instrucciones / Notas</label>
                    <textarea className="w-full p-5 bg-slate-50 border-2 border-slate-50 rounded-2xl h-32 font-medium text-slate-600 outline-none focus:border-orange-500 transition-all resize-none" placeholder="Detalles específicos para la ejecución..." value={manualData.description} onChange={e => setManualData({...manualData, description: e.target.value})} />
                 </div>
              </div>
              <div className="mt-12 flex gap-4">
                 <button onClick={() => setShowManualModal(false)} className="flex-1 py-5 font-black uppercase text-xs text-slate-400 hover:text-slate-600 transition-colors">Descartar</button>
                 <button onClick={handleManualSave} className="flex-[2] py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs shadow-2xl hover:bg-black transition-all transform active:scale-95">Integrar al Cronograma</button>
              </div>
           </div>
        </div>
      )}

      {/* MODAL PARA PLANIFICAR PROPUESTA DE IA */}
      {proposalToSchedule && (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-xl z-[200] flex items-center justify-center p-6">
           <div className="bg-white rounded-[3.5rem] w-full max-w-lg p-12 shadow-3xl animate-in zoom-in-95 border border-white/20">
              <div className="flex items-center gap-6 mb-10">
                 <div className="p-4 bg-indigo-600 rounded-[1.5rem] text-white">
                    <Sparkles className="w-8 h-8" />
                 </div>
                 <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Agendar Propuesta</h3>
              </div>
              
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 mb-8">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Táctica Seleccionada</p>
                 <p className="text-lg font-black text-slate-800 uppercase tracking-tight">{proposalToSchedule.title}</p>
              </div>

              <div className="space-y-6">
                 <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3 ml-1">Fecha de Ejecución</label>
                    <input 
                      type="date" 
                      className="w-full p-5 bg-slate-50 border-2 border-slate-200 rounded-2xl font-black text-slate-800 outline-none focus:border-indigo-600 transition-all" 
                      value={schedulingDate} 
                      onChange={e => setSchedulingDate(e.target.value)} 
                    />
                 </div>
              </div>

              <div className="mt-12 flex gap-4">
                 <button onClick={() => setProposalToSchedule(null)} className="flex-1 py-5 font-black uppercase text-xs text-slate-400 hover:text-slate-600 transition-colors">Cancelar</button>
                 <button onClick={handleScheduleProposal} className="flex-[2] bg-slate-900 text-white py-5 rounded-2xl font-black uppercase text-xs shadow-2xl hover:bg-black transition-all">Confirmar Fecha</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default AIAssistant;
