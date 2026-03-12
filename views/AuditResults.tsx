import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  User, 
  ShieldCheck, 
  Copy, 
  Save, 
  Camera, 
  Loader2, 
  Check, 
  List, 
  CheckCircle2, 
  XCircle, 
  Minus, 
  Award, 
  ShieldAlert, 
  ClipboardCheck, 
  BrainCircuit, 
  Banknote, 
  AlertOctagon, 
  UserCheck, 
  PenTool,
  RefreshCw,
  Lock
} from 'lucide-react';
import { AuditState } from '../types';
import { HARDWARE_CHECKLIST, PROCESS_CHECKLIST } from '../constants';
import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai";

interface AuditResultsProps {
  audit: AuditState;
  onBack: () => void;
  onSaveReport: (auditId: string, newReportText: string, showAlert?: boolean) => void;
}

const WEIGHTS = {
  hardware: {
    globalWeight: 0.40,
    categories: {
      '1. ALARMAS Y DISPOSITIVOS': 0.10,
      '2. SISTEMAS CCTV': 0.40,
      '3. CAJAS FUERTES': 0.10,
      '4. ACCESOS Y PROTECTORES': 0.30,
      '5. OTROS': 0.10,
    }
  },
  process: {
    globalWeight: 0.60,
    categories: {
      '1. CAJA (10%)': 0.10,
      '2. ADMINISTRATIVO (25%)': 0.25,
      '3. INVENTARIO (50%)': 0.50,
      '4. PREVENCIÓN (15%)': 0.15,
    }
  }
};

const AuditResults: React.FC<AuditResultsProps> = ({ audit, onBack, onSaveReport }) => {
  const sessionUser = useMemo(() => {
    try {
      return JSON.parse(sessionStorage.getItem('xana_active_user') || '{}');
    } catch {
      return {};
    }
  }, []);

  const isAuthor = sessionUser?.fullName === (audit as any)?.createdBy;
  const isReportLocked = Boolean((audit as any)?.reportLocked);
  const canEditReport = isAuthor && !isReportLocked;

  const [reportText, setReportText] = useState(audit.reportText || '');
  const [calculatedData, setCalculatedData] = useState<any>(null);
  const [isCopying, setIsCopying] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'summary' | 'details'>('summary');
  
  const hasGenerated = useRef(false);
  const summaryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setReportText(audit.reportText || '');
  }, [audit.reportText, audit.id]);

  const calculateScores = (auditData: AuditState) => {
    const hwCategories = Object.keys(WEIGHTS.hardware.categories);
    const hwResults: any = {};
    let totalHwScore = 0;

    hwCategories.forEach(cat => {
      const items = HARDWARE_CHECKLIST.filter(i => i.category === cat);
      if (items.length === 0) return;
      let validItems = 0;
      let scoreSum = 0;
      items.forEach(item => {
        const answer = auditData.hardwareAnswers[item.id] || { quantity: item.expected, status: 'N/A', notes: '' };
        if (answer.status && answer.status !== 'N/A') {
          validItems++;
          if (answer.status === 'Operativo') scoreSum += 1;
        }
      });
      const compliance = validItems > 0 ? (scoreSum / validItems) : 0;
      const weight = WEIGHTS.hardware.categories[cat as keyof typeof WEIGHTS.hardware.categories];
      const result = compliance * weight;
      hwResults[cat] = {
        compliance: compliance * 100,
        weight: weight * 100,
        result: result * 100
      };
      totalHwScore += result;
    });

    const procCategories = Object.keys(WEIGHTS.process.categories);
    const procResults: any = {};
    let totalProcScore = 0;
    procCategories.forEach(cat => {
      const items = PROCESS_CHECKLIST.filter(i => i.category === cat);
      if (items.length === 0) return;
      let validItems = 0;
      let scoreSum = 0;
      items.forEach(item => {
        const answer = auditData.processAnswers[item.id] || { status: 'N/A', notes: '' };
        if (answer.status && answer.status !== 'N/A') {
          validItems++;
          if (answer.status === 'SI') scoreSum += 1;
        }
      });
      const compliance = validItems > 0 ? (scoreSum / validItems) : 0;
      const weight = WEIGHTS.process.categories[cat as keyof typeof WEIGHTS.process.categories];
      const result = compliance * weight;
      procResults[cat] = {
        compliance: compliance * 100,
        weight: weight * 100,
        result: result * 100
      };
      totalProcScore += result;
    });

    let finalScore = (totalHwScore * 100 * WEIGHTS.hardware.globalWeight) + (totalProcScore * 100 * WEIGHTS.process.globalWeight);
    
    const vaultDiff = (auditData.vaultCount?.ves.difference || 0) !== 0 || (auditData.vaultCount?.usd.difference || 0) !== 0;
    
    const riskPercentage = 100 - finalScore;

    let riskLevel = 'Extremo';
    if (finalScore >= 95) riskLevel = 'Bajo';
    else if (finalScore >= 85) riskLevel = 'Moderado';
    else if (finalScore >= 75) riskLevel = 'Medio';
    else if (finalScore >= 65) riskLevel = 'Alto';

    return { 
      hwResults, 
      procResults, 
      globalHw: totalHwScore * 100, 
      globalProc: totalProcScore * 100, 
      finalScore, 
      riskPercentage, 
      riskLevel,
      hasVaultIncident: vaultDiff
    };
  };

  const generateExecutiveReport = async (auditData: AuditState, stats: any) => {
    if (!isAuthor || isReportLocked) return;

    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });
      
      const managerName = `${auditData.inCharge.nombre} ${auditData.inCharge.apellido}`.toUpperCase();
      const pharmacyName = (auditData.pharmacy?.name || 'LA SEDE').toUpperCase();
      const auditorName = (JSON.parse(sessionStorage.getItem('xana_active_user') || '{}').fullName || 'AUDITOR XANA').toUpperCase();
      
      const failures: string[] = [];
      Object.entries(auditData.processAnswers).forEach(([id, ans]) => {
        if ((ans as any).status === 'NO') {
          const item = PROCESS_CHECKLIST.find(i => i.id === id);
          if (item) failures.push(item.text.toUpperCase());
        }
      });

      const vaultIncidentText = stats.hasVaultIncident 
        ? `INCIDENCIA EN BÓVEDA: Se detectó descuadre de efectivo (USD: ${auditData.vaultCount?.usd.difference}, VES: ${auditData.vaultCount?.ves.difference}).` 
        : "Integridad financiera en bóveda: CONFORME.";

      const prompt = `Genera un INFORME DE AUDITORÍA DE SEGURIDAD CORPORATIVA formal, técnico y detallado.
      
      DATOS DEL REPORTE:
      - Auditor Responsable: ${auditorName}
      - Sede Auditada: ${pharmacyName}
      - Gerente/Responsable: ${managerName}
      - Nivel de Cumplimiento Global: ${stats.finalScore.toFixed(2)}%
      - Nivel de Riesgo Actual: ${stats.riskLevel.toUpperCase()}
      
      HALLAZGOS ESPECÍFICOS:
      - Fallas de Proceso Detectadas: ${failures.length > 0 ? failures.join(', ') : 'Ninguna falla crítica de proceso detectada.'}
      - Estado de Bóveda: ${vaultIncidentText}
      
      ESTRUCTURA OBLIGATORIA DEL INFORME:
      1. RESUMEN EJECUTIVO: Un párrafo sólido resumiendo el estado general de la seguridad en la sede.
      2. ANÁLISIS DE RIESGOS CRÍTICOS: Detalla las implicaciones de seguridad de los hallazgos negativos (si existen).
      3. EVALUACIÓN DE PROCESOS Y BÓVEDA: Comentario técnico sobre la integridad financiera y el cumplimiento de protocolos.
      4. CONCLUSIONES Y RECOMENDACIONES: Pasos a seguir inmediatos para mitigar los riesgos detectados.
      
      TONO: Estrictamente profesional, corporativo, objetivo y directo. Sin saludos, sin despedidas, sin frases de relleno. Enfócate en la seguridad física y patrimonial.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview', 
        contents: prompt,
        config: {
          safetySettings: [
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
          ]
        }
      });

      const text = response.text || "La IA no devolvió texto. Intente regenerar nuevamente.";
      setReportText(text);

      if (auditData.id) {
        onSaveReport(auditData.id, text, false);
      }
    } catch (e: any) {
      console.error("Error IA:", e);
      if (e.message?.includes('quota')) {
        setReportText("LA IA ESTA EN DESCANSO TEMPORAL (CUOTA EXCEDIDA). POR FAVOR, REDACTA EL INFORME MANUALMENTE.");
      } else {
        setReportText(`Error de conexión con IA: ${e.message}. Por favor presione el botón de Regenerar.`);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (!audit) return;
    setCalculatedData(calculateScores(audit));
  }, [audit.id]);

  useEffect(() => {
    if (
      calculatedData &&
      !audit.reportText &&
      !isGenerating &&
      !hasGenerated.current &&
      isAuthor &&
      !isReportLocked
    ) {
      hasGenerated.current = true;
      generateExecutiveReport(audit, calculatedData);
    }
  }, [calculatedData, audit.reportText, isAuthor, isReportLocked]);

  const handleRegenerate = () => {
    if (calculatedData && canEditReport) {
      generateExecutiveReport(audit, calculatedData);
    }
  };

  const handleSave = () => {
    if (audit.id && canEditReport) {
      onSaveReport(audit.id, reportText, true);
    }
  };

  const handleCopyImage = async () => {
    if (summaryRef.current) {
      setIsCopying(true);
      try {
        const html2canvas = (window as any).html2canvas;
        const canvas = await html2canvas(summaryRef.current, { scale: 1.5, useCORS: true, backgroundColor: '#0f172a' });
        canvas.toBlob((blob: Blob) => {
          if (blob) {
            navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]).then(() => {
              setCopySuccess(true);
              setTimeout(() => setCopySuccess(false), 2000);
            });
          }
        });
      } catch (err) { 
        console.error(err); 
      } finally { 
        setIsCopying(false); 
      }
    }
  };

  if (!calculatedData) {
    return (
      <div className="flex flex-col items-center justify-center p-20 min-h-[60vh] text-white">
        <Loader2 className="w-12 h-12 animate-spin text-orange-500 mb-6" />
        <p className="text-xl font-black uppercase tracking-[0.3em] animate-pulse">Analizando Auditoría...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-20 animate-in fade-in duration-500 px-4">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div className="flex gap-4 items-center">
          <button onClick={onBack} className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-5 py-2.5 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center gap-2 hover:bg-white/20 transition-all shadow-xl"><ArrowLeft className="w-4 h-4" /> Volver</button>
          <div className="bg-white/10 backdrop-blur-md p-1 rounded-xl border border-white/20 flex shadow-2xl">
             <button onClick={() => setActiveTab('summary')} className={`px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'summary' ? 'bg-white text-slate-900 shadow-xl' : 'text-white/60 hover:text-white'}`}>Resumen</button>
             <button onClick={() => setActiveTab('details')} className={`px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'details' ? 'bg-white text-slate-900 shadow-xl' : 'text-white/60 hover:text-white'}`}>Evidencia</button>
          </div>
        </div>
        <button onClick={handleCopyImage} disabled={isCopying || activeTab === 'details'} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 transition-all shadow-2xl ${copySuccess ? 'bg-emerald-50 text-white' : 'bg-white text-slate-900 hover:bg-slate-50'} ${activeTab === 'details' ? 'opacity-30 pointer-events-none' : ''}`}>
          {isCopying ? <Loader2 className="w-4 h-4 animate-spin" /> : copySuccess ? <Check className="w-4 h-4" /> : <Camera className="w-4 h-4 text-orange-500" />}
          {isCopying ? 'Capturando...' : copySuccess ? 'Copiado' : 'Capturar Imagen'}
        </button>
      </div>

      {activeTab === 'summary' ? (
        <div className="animate-in slide-in-from-bottom-4 duration-700">
          <div ref={summaryRef} className="rounded-3xl overflow-hidden shadow-3xl mb-12 border border-white/20 bg-[#0f172a]">
            <div className="p-8 pb-6 flex flex-col lg:flex-row justify-between items-start text-white gap-8">
              <div>
                <h1 className="text-5xl font-black mb-4 tracking-tighter uppercase leading-none drop-shadow-2xl font-serif">REPORTE</h1>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-slate-400 font-bold uppercase tracking-widest text-sm"><MapPin className="w-5 h-5 text-orange-500" />{audit.pharmacy?.name?.toUpperCase()}</div>
                  <div className="flex flex-wrap gap-4 mt-4">
                    <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase"><Calendar className="w-4 h-4" /> {audit.date}</div>
                    <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase"><User className="w-4 h-4" /> {audit.inCharge.nombre?.toLowerCase()} {audit.inCharge.apellido?.toLowerCase()}</div>
                  </div>
                </div>
              </div>
              <div className="flex gap-4 w-full lg:w-auto">
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-5 rounded-2xl text-center flex-1 lg:min-w-[140px] shadow-3xl"><p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1">CUMPLIMIENTO</p><p className="text-5xl font-black text-orange-500 tracking-tighter">{calculatedData.finalScore.toFixed(2)}%</p></div>
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-5 rounded-2xl text-center flex-1 lg:min-w-[140px] shadow-3xl"><p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1">RIESGO</p><p className={`text-4xl font-black tracking-tighter ${
                  calculatedData.riskLevel === 'Bajo'
                    ? 'text-emerald-400'
                    : calculatedData.riskLevel === 'Moderado'
                    ? 'text-yellow-400'
                    : calculatedData.riskLevel === 'Medio'
                    ? 'text-orange-400'
                    : calculatedData.riskLevel === 'Alto'
                    ? 'text-red-400'
                    : 'text-red-600'
                }`}>{calculatedData.riskLevel}</p></div>
              </div>
            </div>
            
            <div className="bg-white p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div>
                  <h3 className="font-black text-slate-900 text-sm mb-4 uppercase tracking-tight">Sistemas de Protección (40%)</h3>
                  <table className="w-full text-[9px] font-bold text-slate-500 uppercase tracking-tight">
                    <thead><tr className="text-slate-300 border-b border-slate-100"><th className="text-left pb-2 font-black">CATEGORÍA</th><th className="text-right pb-2 pr-4 font-black">POND.</th><th className="text-right pb-2 font-black">RES.</th></tr></thead>
                    <tbody className="divide-y divide-slate-50">
                      {Object.entries(calculatedData.hwResults).map(([cat, val]: [string, any]) => (
                        <tr key={cat}><td className="py-2.5 text-slate-600 font-black">{cat.split('. ')[1] || cat}</td><td className="py-2.5 text-right pr-4 text-slate-400">{val.weight.toFixed(0)}%</td><td className="py-2.5 text-right text-slate-900 font-black">{val.result.toFixed(1)}%</td></tr>
                      ))}
                    </tbody>
                    <tfoot><tr className="bg-orange-50/50"><td className="py-2.5 pl-3 text-slate-900 font-black rounded-l-xl uppercase">Total Sistemas</td><td></td><td className="py-2.5 pr-3 text-right text-orange-600 font-black rounded-r-xl text-xs">{calculatedData.globalHw.toFixed(2)}%</td></tr></tfoot>
                  </table>
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-sm mb-4 uppercase tracking-tight">Chequeo de Procesos (60%)</h3>
                  <table className="w-full text-[9px] font-bold text-slate-500 uppercase tracking-tight">
                    <thead><tr className="text-slate-300 border-b border-slate-100"><th className="text-left pb-2 font-black">CATEGORÍA</th><th className="text-right pb-2 pr-4 font-black">POND.</th><th className="text-right pb-2 font-black">RES.</th></tr></thead>
                    <tbody className="divide-y divide-slate-50">
                      {Object.entries(calculatedData.procResults).map(([cat, val]: [string, any]) => (
                        <tr key={cat}><td className="py-2.5 text-slate-600 font-black">{cat.split(' (')[0].split('. ')[1] || cat}</td><td className="py-2.5 text-right pr-4 text-slate-400">{val.weight.toFixed(0)}%</td><td className="py-2.5 text-right text-slate-900 font-black">{val.result.toFixed(1)}%</td></tr>
                      ))}
                    </tbody>
                    <tfoot><tr className="bg-blue-50/50"><td className="py-2.5 pl-3 text-slate-900 font-black rounded-l-xl uppercase">Total Procesos</td><td></td><td className="py-2.5 pr-3 text-right text-blue-600 font-black rounded-r-xl text-xs">{calculatedData.globalProc.toFixed(2)}%</td></tr></tfoot>
                  </table>
                </div>
              </div>
              <div className="mt-10 bg-slate-900 text-white p-6 rounded-[1.5rem] flex items-center justify-between shadow-2xl border border-slate-800">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-orange-600 rounded-xl"><Award className="w-8 h-8 text-white" /></div>
                  <div><p className="text-[8px] font-black uppercase tracking-[0.3em] text-orange-400">Puntaje Definitivo</p><h3 className="text-xl font-black tracking-tight uppercase">Auditoría XANA</h3></div>
                </div>
                <div className="text-right"><p className="text-6xl font-black tracking-tighter text-white">{calculatedData.finalScore.toFixed(2)}%</p></div>
              </div>

              {audit.vaultCount && (
                <div className="mt-8 pt-8 border-t border-slate-100">
                  <div className="bg-slate-50 rounded-[2.5rem] p-10 border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-slate-900 rounded-2xl text-white shadow-lg">
                          <Banknote className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter">Validación de Integridad Financiera</h3>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Arqueo de Bóveda en Sitio</p>
                        </div>
                      </div>
                      <div className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-sm flex items-center gap-2 ${calculatedData.hasVaultIncident ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                        {calculatedData.hasVaultIncident ? <AlertOctagon className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                        {calculatedData.hasVaultIncident ? 'Diferencia Detectada' : 'Certificación Conforme'}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-inner flex flex-col justify-between group hover:border-emerald-200 transition-colors">
                        <div className="flex justify-between items-center mb-6">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dólares (USD)</p>
                          <div className={`p-2 rounded-full ${audit.vaultCount.usd.difference === 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                            {audit.vaultCount.usd.difference === 0 ? <Check className="w-4 h-4" /> : <AlertOctagon className="w-4 h-4" />}
                          </div>
                        </div>
                        <div className="flex justify-between items-end">
                          <p className="text-4xl font-black text-slate-800 tracking-tighter">{audit.vaultCount.usd.physical.toFixed(2)} $</p>
                          <div className="text-right">
                            <p className="text-[9px] font-bold text-slate-300 uppercase">Diferencia</p>
                            <p className={`text-lg font-black ${audit.vaultCount.usd.difference === 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                              {audit.vaultCount.usd.difference >= 0 ? '+' : ''}{audit.vaultCount.usd.difference.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-inner flex flex-col justify-between group hover:border-blue-200 transition-colors">
                        <div className="flex justify-between items-center mb-6">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bolívares (VES)</p>
                          <div className={`p-2 rounded-full ${audit.vaultCount.ves.difference === 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                            {audit.vaultCount.ves.difference === 0 ? <Check className="w-4 h-4" /> : <AlertOctagon className="w-4 h-4" />}
                          </div>
                        </div>
                        <div className="flex justify-between items-end">
                          <p className="text-4xl font-black text-slate-800 tracking-tighter">{audit.vaultCount.ves.physical.toFixed(2)} Bs.</p>
                          <div className="text-right">
                            <p className="text-[9px] font-bold text-slate-300 uppercase">Diferencia</p>
                            <p className={`text-lg font-black ${audit.vaultCount.ves.difference === 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                              {audit.vaultCount.ves.difference >= 0 ? '+' : ''}{audit.vaultCount.ves.difference.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-10 flex flex-col md:flex-row md:items-center justify-between gap-8 pt-8 border-t border-slate-200/60">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-orange-600">
                          <UserCheck className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Validado en presencia de</p>
                          <p className="text-sm font-black text-slate-800 uppercase tracking-tight">{audit.vaultCount.responsiblePerson}</p>
                        </div>
                      </div>
                      {audit.vaultCount.notes && (
                        <div className="flex-1 max-w-lg bg-white px-6 py-4 rounded-2xl border border-slate-100 shadow-sm">
                          <p className="text-[9px] font-black text-orange-500 uppercase mb-1 tracking-widest flex items-center gap-2"><PenTool className="w-3 h-3" /> Justificación del Arqueo</p>
                          <p className="text-[11px] text-slate-500 italic font-medium leading-relaxed">"{audit.vaultCount.notes}"</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-3xl border border-white p-8">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 border-b border-orange-50 pb-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-slate-900 rounded-xl text-white"><ShieldCheck className="w-6 h-6" /></div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">Informe Ejecutivo</h2>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Acta de Control y Gestión</p>
                </div>
              </div>
              <div className="flex gap-2">
                {canEditReport && (
                  <>
                    <button 
                      onClick={handleRegenerate}
                      className="px-4 py-2 bg-orange-50 text-orange-700 rounded-lg font-black uppercase tracking-widest text-[9px] flex items-center gap-2 border border-orange-100 hover:bg-orange-100 transition-all"
                      title="Reintentar generación con IA"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} /> 
                      {isGenerating ? 'Generando...' : 'Regenerar IA'}
                    </button>

                    <button onClick={handleSave} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg">
                      <Save className="w-3.5 h-3.5" /> Guardar y Bloquear
                    </button>
                  </>
                )}

                <button onClick={() => { navigator.clipboard.writeText(reportText); alert("Copiado."); }} className="px-4 py-2 bg-slate-50 text-slate-600 rounded-lg font-black uppercase tracking-widest text-[9px] flex items-center gap-2 border border-slate-100">
                  <Copy className="w-3.5 h-3.5" /> Copiar
                </button>
              </div>
            </div>

            {!isAuthor && (
              <div className="mb-4 p-4 bg-slate-100 border-l-4 border-slate-500 text-slate-700 rounded-lg flex items-start gap-3">
                <Lock className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="text-[10px] font-bold uppercase tracking-wide">
                  Este informe solo puede ser modificado por el auditor que creó la auditoría.
                </div>
              </div>
            )}

            {isReportLocked && (
              <div className="mb-4 p-4 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-800 rounded-lg flex items-start gap-3">
                <Lock className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="text-[10px] font-bold uppercase tracking-wide">
                  El informe fue guardado y bloqueado. Ya no puede modificarse.
                </div>
              </div>
            )}

            <div className="bg-slate-50/50 rounded-2xl p-6 border border-slate-100 relative">
              {isGenerating && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center rounded-2xl">
                   <Loader2 className="w-8 h-8 animate-spin text-orange-600 mb-2" />
                   <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">IA Generando Informe...</p>
                </div>
              )}
              {reportText.includes('CUOTA EXCEDIDA') && (
                <div className="mb-4 p-4 bg-orange-100 border-l-4 border-orange-500 text-orange-800 rounded-lg flex items-start gap-3">
                   <BrainCircuit className="w-5 h-5 shrink-0 mt-1" />
                   <div className="text-[10px] font-bold uppercase tracking-wide">La IA de Google ha pausado el servicio por exceso de cuota. Puede editar este texto manualmente para finalizar su reporte.</div>
                </div>
              )}
              <textarea
                className="w-full min-h-[450px] bg-transparent outline-none text-slate-700 leading-relaxed font-mono text-sm resize-none"
                value={reportText}
                onChange={(e) => setReportText(e.target.value)}
                spellCheck={false}
                readOnly={!canEditReport}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-3xl border border-white overflow-hidden animate-in zoom-in-95 duration-300">
           <div className="bg-slate-900 p-8 flex justify-between items-center text-white">
             <div><h2 className="text-2xl font-black tracking-tighter flex items-center gap-4"><List className="w-8 h-8 text-orange-500" />Evidencia Detallada</h2></div>
           </div>
           <div className="p-8 space-y-12">
             {audit.vaultCount && (
               <div>
                  <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] mb-6 flex items-center gap-4"><Banknote className="w-4 h-4" /> Desglose de Efectivo</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden">
                        <div className="px-4 py-2 bg-blue-600 text-white font-black text-[9px] uppercase tracking-widest">Bolívares (VES)</div>
                        <div className="p-6 space-y-3">
                           <div className="flex justify-between text-xs font-bold"><span className="text-slate-400">Sistema:</span><span className="text-slate-700">{audit.vaultCount.ves.system.toFixed(2)} Bs.</span></div>
                           <div className="flex justify-between text-xs font-bold"><span className="text-slate-400">Físico:</span><span className="text-slate-900">{audit.vaultCount.ves.physical.toFixed(2)} Bs.</span></div>
                           <div className={`pt-3 border-t flex justify-between font-black ${audit.vaultCount.ves.difference === 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                              <span>Diferencia:</span><span>{audit.vaultCount.ves.difference.toFixed(2)} Bs.</span>
                           </div>
                        </div>
                     </div>
                     <div className="bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden">
                        <div className="px-4 py-2 bg-emerald-600 text-white font-black text-[9px] uppercase tracking-widest">Dólares (USD)</div>
                        <div className="p-6 space-y-3">
                           <div className="flex justify-between text-xs font-bold"><span className="text-slate-400">Sistema:</span><span className="text-slate-700">{audit.vaultCount.usd.system.toFixed(2)} $</span></div>
                           <div className="flex justify-between text-xs font-bold"><span className="text-slate-400">Físico:</span><span className="text-slate-900">{audit.vaultCount.usd.physical.toFixed(2)} $</span></div>
                           <div className={`pt-3 border-t flex justify-between font-black ${audit.vaultCount.usd.difference === 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                              <span>Diferencia:</span><span>{audit.vaultCount.usd.difference.toFixed(2)} $</span>
                           </div>
                        </div>
                     </div>
                  </div>
                  {audit.vaultCount.notes && (
                     <div className="mt-6 p-6 bg-orange-50 border-l-4 border-orange-500 rounded-xl">
                        <p className="text-[9px] font-black text-orange-600 uppercase mb-2 tracking-widest">Justificación de Bóveda:</p>
                        <p className="text-sm font-medium italic text-slate-700">"{audit.vaultCount.notes}"</p>
                     </div>
                  )}
               </div>
             )}

             <div>
                 <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] mb-6 flex items-center gap-4"><ShieldAlert className="w-4 h-4" /> Sistemas de Seguridad</h3>
                 <div className="grid grid-cols-1 gap-4">
                    {Object.keys(WEIGHTS.hardware.categories).map(cat => {
                       const items = HARDWARE_CHECKLIST.filter(i => i.category === cat);
                       if (items.length === 0) return null;
                       return (
                         <div key={cat} className="bg-slate-50/50 rounded-2xl border border-slate-100 overflow-hidden">
                            <div className="px-4 py-2 bg-slate-100/50 font-black text-[9px] text-slate-500 uppercase tracking-widest border-b border-slate-100">{cat}</div>
                            <div className="divide-y divide-slate-100">
                               {items.map(item => {
                                  const ans = audit.hardwareAnswers[item.id] || { status: 'N/A', notes: '' };
                                  return (
                                    <div key={item.id} className="p-4 flex items-start gap-4 hover:bg-white transition-all">
                                       <div className="mt-1">{ans.status === 'Operativo' ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : ans.status === 'Inactivo' ? <XCircle className="w-5 h-5 text-red-500" /> : <Minus className="w-5 h-5 text-slate-300" />}</div>
                                       <div className="flex-1"><p className="font-black text-slate-800 text-xs uppercase tracking-tight">{item.name}</p>{ans.notes && <div className="mt-2 text-[10px] bg-orange-50 border-l-2 border-orange-500 p-2 text-slate-700 italic">"{ans.notes}"</div>}</div>
                                    </div>
                                  );
                               })}
                            </div>
                         </div>
                       );
                    })}
                 </div>
             </div>
             <div>
                 <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] mb-6 flex items-center gap-4"><ClipboardCheck className="w-4 h-4" /> Protocolos y Procesos</h3>
                 <div className="grid grid-cols-1 gap-4">
                    {Object.keys(WEIGHTS.process.categories).map(cat => {
                       const items = PROCESS_CHECKLIST.filter(i => i.category === cat);
                       if (items.length === 0) return null;
                       return (
                         <div key={cat} className="bg-blue-50/30 rounded-2xl border border-blue-100 overflow-hidden">
                            <div className="px-4 py-2 bg-blue-50/50 font-black text-[9px] text-blue-600 uppercase tracking-widest border-b border-blue-100">{cat}</div>
                            <div className="divide-y divide-blue-50">
                               {items.map(item => {
                                  const ans = audit.processAnswers[item.id] || { status: 'N/A', notes: '' };
                                  return (
                                    <div key={item.id} className="p-4 flex items-start gap-4 hover:bg-white transition-all">
                                       <div className="mt-1">{ans.status === 'SI' ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : ans.status === 'NO' ? <XCircle className="w-5 h-5 text-red-500" /> : <Minus className="w-5 h-5 text-slate-300" />}</div>
                                       <div className="flex-1"><p className="font-black text-slate-800 text-xs uppercase tracking-tight">{item.text}</p>{ans.notes && <div className="mt-2 text-[10px] bg-blue-50 border-l-2 border-blue-500 p-2 text-slate-700 italic">"{ans.notes}"</div>}</div>
                                    </div>
                                  );
                               })}
                            </div>
                         </div>
                       );
                    })}
                 </div>
             </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default AuditResults;
