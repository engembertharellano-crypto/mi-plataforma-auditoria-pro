import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  RefreshCw, 
  Download, 
  Loader2, 
  Calendar,
  ShieldCheck,
  FileText,
  AlertTriangle
} from 'lucide-react';
// Remove Type from ../types import
import { Pharmacy, AuditState, CCTVInventoryRecord, PhysicalInventoryRecord, ManagementVisitRecord } from '../types';
// Add Type to @google/genai import
import { GoogleGenAI, Type } from "@google/genai";

interface ManagementReportProps {
  pharmacies: Pharmacy[];
  audits: AuditState[];
  cctvRecords: CCTVInventoryRecord[];
  physicalRecords: PhysicalInventoryRecord[];
  managementRecords: ManagementVisitRecord[];
}

const ManagementReport: React.FC<ManagementReportProps> = ({
  pharmacies,
  audits,
  cctvRecords,
  physicalRecords,
  managementRecords
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isGenerating, setIsGenerating] = useState(false);
  const [analysis, setAnalysis] = useState<{
    desempeno: string;
    vulnerabilidades: string;
    tecnologia: string;
    estrategia: string[];
  } | null>(null);

  const currentUser = JSON.parse(sessionStorage.getItem('xana_active_user') || '{}');
  const coordinatorName = (currentUser.fullName || 'COORDINADOR').toUpperCase();
  const coordinatorRole = (currentUser.role || 'ESPECIALISTA DE SEGURIDAD').toUpperCase();
  const userZone = currentUser.zone || 'No asignada';

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const monthName = currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }).toUpperCase();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const isSelectedMonth = (dateStr?: string) => {
    if (!dateStr) return false;
    const parts = dateStr.split('/');
    if (parts.length !== 3) return false;
    return (parseInt(parts[1], 10) - 1) === currentMonth && parseInt(parts[2], 10) === currentYear;
  };

  const getRiskLevel = (score: number): 'Bajo' | 'Moderado' | 'Medio' | 'Alto' | 'Extremo' => {
    if (score >= 95) return 'Bajo';
    if (score >= 85) return 'Moderado';
    if (score >= 75) return 'Medio';
    if (score >= 65) return 'Alto';
    return 'Extremo';
  };

  const getRiskColor = (score: number) => {
    const risk = getRiskLevel(score);
    if (risk === 'Bajo') return '#10b981';
    if (risk === 'Moderado') return '#22c55e';
    if (risk === 'Medio') return '#f59e0b';
    if (risk === 'Alto') return '#f97316';
    return '#ef4444';
  };

  const monthlyAudits = audits.filter(a => isSelectedMonth(a.date));
  const monthlyCCTV = cctvRecords.filter(r => isSelectedMonth(r.date));
  const monthlyPhysical = physicalRecords.filter(r => isSelectedMonth(r.date));
  const monthlyMgmt = managementRecords.filter(r => isSelectedMonth(r.date));

  const avgCompliance = monthlyAudits.length > 0 
    ? monthlyAudits.reduce((sum, a) => sum + (a.score || 0), 0) / monthlyAudits.length 
    : 0;

  let totalCams = 0, operativeCams = 0;
  monthlyCCTV.forEach(r => {
    totalCams += (r.cameras.analogTotal + r.cameras.ipTotal);
    operativeCams += (r.cameras.analogOperative + r.cameras.ipOperative);
  });
  const cctvHealth = totalCams > 0 ? (operativeCams / totalCams) * 100 : 0;

  let totalPhys = 0, operativePhys = 0;
  monthlyPhysical.forEach(r => {
    totalPhys += (r.santamarias.required + r.candados.required + r.espejos.required + r.iluminacion.required);
    operativePhys += (r.santamarias.good + r.candados.good + r.espejos.good + r.iluminacion.good);
  });
  const physicalHealth = totalPhys > 0 ? (operativePhys / totalPhys) * 100 : 0;

  const totalActivities = monthlyAudits.length + monthlyCCTV.length + monthlyPhysical.length + monthlyMgmt.length;

  const generateDeepAnalysis = async () => {
    setIsGenerating(true);
    try {
      // Create new instance of GoogleGenAI using environment variable
      const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });
      
      const statsContext = {
        usuario: coordinatorName,
        cargo: coordinatorRole,
        zona: userZone,
        mes: monthName,
        metricas: {
          cumplimientoGlobal: `${avgCompliance.toFixed(2)}%`,
          saludCCTV: `${cctvHealth.toFixed(2)}%`,
          estadoInfraestructura: `${physicalHealth.toFixed(2)}%`,
          totalOperaciones: totalActivities,
          desglose: {
            auditorias: monthlyAudits.length,
            censosCCTV: monthlyCCTV.length,
            inventariosFisicos: monthlyPhysical.length,
            gestionesEspeciales: monthlyMgmt.length
          }
        }
      };

      const prompt = `
        Eres ${coordinatorName}, ocupando el cargo de ${coordinatorRole} en XANA. Estás redactando tu INFORME DE GESTIÓN MENSUAL para presentarlo ante la Dirección y otros departamentos interesados.
        
        UTILIZA ESTOS DATOS REALES DE TU GESTIÓN:
        ${JSON.stringify(statsContext, null, 2)}

        INSTRUCCIONES DE REDACCIÓN (CRÍTICAS):
        1. Escribe EXCLUSIVAMENTE en primera persona (Ej: "He logrado", "Mi gestión se ha enfocado", "Durante mis visitas").
        2. NO hables de ti mismo en tercera persona. Evita frases como "La gestión del coordinador" o "Se observa que el usuario".
        3. El tono debe ser profesional, ejecutivo, seguro y orientado a resultados. Estás presentando TUS logros y hallazgos.
        4. En "desempeno", presenta el cumplimiento del ${avgCompliance.toFixed(2)}% como resultado de tu supervisión directa y justifica el impacto de tus ${totalActivities} actividades realizadas.
        5. En "vulnerabilidades", expón los riesgos que HAS IDENTIFICADO en tu zona según el ${physicalHealth.toFixed(2)}% de estado físico.
        6. En "tecnologia", explica el estado del CCTV (${cctvHealth.toFixed(2)}%) bajo tu custodia técnica.

        REQUERIMIENTO DE SALIDA: Responde estrictamente en formato JSON.
      `;

      // Define a structured response schema for consistent Gemini API JSON output
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { 
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              desempeno: {
                type: Type.STRING,
                description: 'Análisis de resultados operativos en primera persona.'
              },
              vulnerabilidades: {
                type: Type.STRING,
                description: 'Evaluación de riesgos detectados en el territorio.'
              },
              tecnologia: {
                type: Type.STRING,
                description: 'Balance del parque tecnológico supervisado.'
              },
              estrategia: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Lista de acciones tácticas para el próximo ciclo.'
              }
            },
            required: ["desempeno", "vulnerabilidades", "tecnologia", "estrategia"]
          },
          temperature: 0.7 
        }
      });

      // Use .text property to access response content
      setAnalysis(JSON.parse(response.text || '{}'));
    } catch (e) {
      console.error("Gemini Error:", e);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    setAnalysis(null);
    generateDeepAnalysis();
  }, [currentDate]);

  const exportToWord = () => {
    const today = new Date().toLocaleDateString('es-ES');
    const html = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' lang="es">
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Arial', sans-serif; color: #1e293b; line-height: 1.4; }
          p { margin: 0; padding: 0; }
          .section-number { background-color: #000000; color: #ffffff; width: 35px; height: 35px; text-align: center; vertical-align: middle; font-weight: bold; font-size: 14pt; }
        </style>
      </head>
      <body style="padding: 40px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 40px;">
          <tr>
            <td width="65%" valign="top">
              <h1 style="font-size: 36pt; font-weight: 900; color: #0f172a; margin: 0; line-height: 1;">INFORME DE<br>GESTIÓN MENSUAL</h1>
              <p style="color: #f97316; font-weight: bold; text-transform: uppercase; letter-spacing: 3pt; font-size: 10pt; margin-top: 15px;">PRESENTACIÓN DE RESULTADOS OPERATIVOS</p>
              <p style="color: #64748b; font-weight: bold; text-transform: uppercase; font-size: 9pt; margin-top: 5px;">ZONA DE GESTIÓN: ${userZone}</p>
            </td>
            <td width="35%" valign="top" align="right">
              <table cellpadding="15" cellspacing="0" border="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; text-align: left;">
                <tr>
                  <td>
                    <p style="font-size: 8pt; color: #94a3b8; font-weight: bold; text-transform: uppercase; margin-bottom: 2px;">${coordinatorRole}</p>
                    <p style="font-size: 22pt; font-weight: bold; color: #0f172a; margin: 0;">${coordinatorName}</p>
                    <p style="font-size: 8pt; color: #94a3b8; font-weight: bold; margin-top: 8px;">Fecha: ${today}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <table width="100%" cellpadding="0" cellspacing="10" border="0" style="margin-bottom: 30px;">
          <tr>
            <td width="25%" style="background-color: #f8fafc; border-left: 6px solid #f97316; padding: 15px;">
              <p style="font-size: 7pt; font-weight: bold; color: #64748b; text-transform: uppercase; margin-bottom: 5px;">CUMPLIMIENTO</p>
              <p style="font-size: 24pt; font-weight: bold; color: #0f172a; margin: 0;">${avgCompliance.toFixed(0)}%</p>
              <p style="font-size: 8pt; color: #94a3b8; margin: 0;">Global</p>
            </td>
            <td width="25%" style="background-color: #f8fafc; border-left: 6px solid #3b82f6; padding: 15px;">
              <p style="font-size: 7pt; font-weight: bold; color: #64748b; text-transform: uppercase; margin-bottom: 5px;">SALUD CCTV</p>
              <p style="font-size: 24pt; font-weight: bold; color: #0f172a; margin: 0;">${cctvHealth.toFixed(0)}%</p>
              <p style="font-size: 8pt; color: #94a3b8; margin: 0;">Operativo</p>
            </td>
            <td width="25%" style="background-color: #f8fafc; border-left: 6px solid #64748b; padding: 15px;">
              <p style="font-size: 7pt; font-weight: bold; color: #64748b; text-transform: uppercase; margin-bottom: 5px;">INFRAESTRUCTURA</p>
              <p style="font-size: 24pt; font-weight: bold; color: #0f172a; margin: 0;">${physicalHealth.toFixed(0)}%</p>
              <p style="font-size: 8pt; color: #94a3b8; margin: 0;">Física</p>
            </td>
            <td width="25%" style="background-color: #f8fafc; border-left: 6px solid #a855f7; padding: 15px;">
              <p style="font-size: 7pt; font-weight: bold; color: #64748b; text-transform: uppercase; margin-bottom: 5px;">GESTIÓN</p>
              <p style="font-size: 24pt; font-weight: bold; color: #0f172a; margin: 0;">${totalActivities}</p>
              <p style="font-size: 8pt; color: #94a3b8; margin: 0;">Actividades</p>
            </td>
          </tr>
        </table>

        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 20px; margin-bottom: 10px;">
          <tr>
            <td width="40" height="40" align="center" bgcolor="#000000" style="color: #ffffff; font-weight: bold; font-size: 14pt;">1</td>
            <td style="padding-left: 15px;"><h2 style="font-size: 16pt; font-weight: bold; color: #0f172a; text-transform: uppercase; margin: 0;">EVALUACIÓN DE MI DESEMPEÑO OPERATIVO</h2></td>
          </tr>
        </table>
        <p style="font-size: 11pt; color: #475569; text-align: justify; margin-bottom: 30px; line-height: 1.6;">${analysis?.desempeno || 'Generando mi análisis de resultados...'}</p>

        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 20px; margin-bottom: 10px;">
          <tr>
            <td width="40" height="40" align="center" bgcolor="#000000" style="color: #ffffff; font-weight: bold; font-size: 14pt;">2</td>
            <td style="padding-left: 15px;"><h2 style="font-size: 16pt; font-weight: bold; color: #0f172a; text-transform: uppercase; margin: 0;">HALLAZGOS Y VULNERABILIDADES DETECTADAS</h2></td>
          </tr>
        </table>
        <p style="font-size: 11pt; color: #475569; text-align: justify; margin-bottom: 30px; line-height: 1.6;">${analysis?.vulnerabilidades || 'Analizando riesgos territoriales identificados...'}</p>

        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 20px; margin-bottom: 10px;">
          <tr>
            <td width="40" height="40" align="center" bgcolor="#000000" style="color: #ffffff; font-weight: bold; font-size: 14pt;">3</td>
            <td style="padding-left: 15px;"><h2 style="font-size: 16pt; font-weight: bold; color: #0f172a; text-transform: uppercase; margin: 0;">BALANCE TÉCNICO BAJO MI SUPERVISIÓN</h2></td>
          </tr>
        </table>
        <p style="font-size: 11pt; color: #475569; text-align: justify; margin-bottom: 30px; line-height: 1.6;">${analysis?.tecnologia || 'Evaluando indicadores técnicos de mi zona...'}</p>

        <table width="100%" cellpadding="30" cellspacing="0" border="0" style="background-color: #fffaf5; border: 2px solid #ffedd5; margin-top: 30px;">
          <tr>
            <td>
              <p style="color: #ea580c; font-size: 12pt; font-weight: bold; text-transform: uppercase; margin-bottom: 15px; letter-spacing: 1pt;">MI HOJA DE RUTA ESTRATÉGICA (PRÓXIMO CICLO)</p>
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                ${(analysis?.estrategia || ["Sincronizando mi plan táctico..."]).map((item, i) => `
                  <tr>
                    <td width="30" valign="top" style="font-size: 11pt; font-weight: bold; color: #ea580c; padding-bottom: 10px;">${i + 1}.</td>
                    <td valign="top" style="font-size: 11pt; font-weight: bold; color: #1e293b; text-transform: uppercase; padding-bottom: 10px;">${item}</td>
                  </tr>
                `).join('')}
              </table>
            </td>
          </tr>
        </table>

        <div style="page-break-before: always; margin-top: 50px;">
          <p style="font-size: 12pt; font-weight: bold; color: #94a3b8; text-transform: uppercase; letter-spacing: 2pt; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px; margin-bottom: 20px;">A N E X O : D E T A L L E D E G E S T I Ó N T E R R I T O R I A L</p>
          <table width="100%" cellpadding="10" cellspacing="0" border="0" style="font-size: 10pt;">
            <thead>
              <tr style="background-color: #f1f5f9; color: #64748b;">
                <th align="left" style="text-transform: uppercase; font-size: 8pt; font-weight: bold; border-bottom: 2px solid #e2e8f0;">FARMACIA</th>
                <th align="left" style="text-transform: uppercase; font-size: 8pt; font-weight: bold; border-bottom: 2px solid #e2e8f0;">FECHA</th>
                <th align="left" style="text-transform: uppercase; font-size: 8pt; font-weight: bold; border-bottom: 2px solid #e2e8f0;">CUMPLIMIENTO</th>
                <th align="right" style="text-transform: uppercase; font-size: 8pt; font-weight: bold; border-bottom: 2px solid #e2e8f0;">ESTADO</th>
              </tr>
            </thead>
            <tbody>
              ${monthlyAudits.length > 0 ? monthlyAudits.map(a => `
                <tr>
                  <td style="font-weight: bold; text-transform: uppercase; border-bottom: 1px solid #f1f5f9;">${a.pharmacy?.name}</td>
                  <td style="color: #64748b; border-bottom: 1px solid #f1f5f9;">${a.date}</td>
                  <td style="font-weight: bold; border-bottom: 1px solid #f1f5f9;">${a.score?.toFixed(2)}%</td>
                  <td align="right" style="font-weight: bold; color: ${getRiskColor(a.score || 0)}; border-bottom: 1px solid #f1f5f9;">${getRiskLevel(a.score || 0).toUpperCase()}</td>
                </tr>
              `).join('') : `<tr><td colspan="4" align="center" style="color: #cbd5e1; padding: 40px;">SIN ACTIVIDADES DE AUDITORÍA EN ESTE PERIODO</td></tr>`}
            </tbody>
          </table>
        </div>

        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 60px; border-top: 1px solid #f1f5f9; padding-top: 15px;">
          <tr>
            <td style="font-size: 8pt; color: #cbd5e1; text-transform: uppercase;">XANA PRO - REPORTE DE GESTIÓN PERSONALIZADO</td>
            <td align="right" style="font-size: 8pt; color: #cbd5e1; text-transform: uppercase;">AUTORIZADO POR: ${coordinatorName}</td>
          </tr>
        </table>
      </body>
      </html>
    `;
    const converted = (window as any).htmlDocx.asBlob(html);
    (window as any).saveAs(converted, `Mi_Reporte_Gestion_${monthName.replace(' ', '_')}.docx`);
  };

  return (
    <div className="max-w-6xl mx-auto p-10 animate-in fade-in duration-500 pb-20">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 no-print">
        <div className="flex items-center gap-6 bg-slate-900 p-2 rounded-2xl border border-white/10 shadow-2xl">
           <button onClick={prevMonth} className="p-3 hover:bg-white/10 rounded-xl text-white transition-all"><ChevronLeft className="w-6 h-6" /></button>
           <span className="font-black text-white w-56 text-center uppercase tracking-[0.2em] text-[11px]">{monthName}</span>
           <button onClick={nextMonth} className="p-3 hover:bg-white/10 rounded-xl text-white transition-all"><ChevronRight className="w-6 h-6" /></button>
        </div>
        <div className="flex gap-4">
           <button onClick={generateDeepAnalysis} disabled={isGenerating} className="bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-xl font-black text-[11px] uppercase tracking-widest flex items-center gap-3 border border-white/20 transition-all shadow-xl">
              <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} /> Generar Mi Análisis
           </button>
           <button onClick={exportToWord} className="bg-white text-slate-900 px-10 py-4 rounded-xl font-black text-[11px] uppercase tracking-widest flex items-center gap-3 hover:bg-orange-50 transition-all shadow-2xl">
              <Download className="w-4 h-4 text-orange-600" /> Exportar Word
           </button>
        </div>
      </div>

      <div className="bg-white shadow-[0_40px_100px_-20px_rgba(0,0,0,0.4)] p-20 md:p-32 min-h-[1400px] flex flex-col mx-auto w-full relative border border-slate-200 overflow-hidden">
        <div className="flex justify-between items-start mb-20 border-b-2 border-slate-100 pb-10">
          <div className="space-y-2">
             <h1 className="text-[52px] font-black text-slate-900 leading-none tracking-tighter uppercase">INFORME DE<br/>GESTIÓN MENSUAL</h1>
             <p className="text-[#f97316] font-black text-[11px] uppercase tracking-[0.4em] mt-5">Presentación de Resultados Operativos</p>
          </div>
          <div className="text-right">
             <div className="bg-[#f8fafc] p-8 px-12 rounded-3xl border border-slate-100 shadow-sm inline-block">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{coordinatorRole}</p>
                <p className="text-3xl font-black text-slate-800 tracking-tight">{coordinatorName}</p>
                <p className="text-[10px] font-bold text-slate-400 mt-4 uppercase tracking-[0.2em]">ZONA: {userZone}</p>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-20">
           <div className="bg-[#f8fafc] border-l-[10px] border-l-[#f97316] p-8 shadow-sm">
              <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-4">Cumplimiento</p>
              <div className="flex items-baseline gap-1">
                <p className="text-5xl font-black text-slate-900 tracking-tighter">{avgCompliance.toFixed(0)}%</p>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Global</span>
              </div>
           </div>
           <div className="bg-[#f8fafc] border-l-[10px] border-l-[#3b82f6] p-8 shadow-sm">
              <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-4">Salud CCTV</p>
              <div className="flex items-baseline gap-1">
                <p className="text-5xl font-black text-slate-900 tracking-tighter">{cctvHealth.toFixed(0)}%</p>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Operativo</span>
              </div>
           </div>
           <div className="bg-[#f8fafc] border-l-[10px] border-l-[#64748b] p-8 shadow-sm">
              <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-4">Infraestructura</p>
              <div className="flex items-baseline gap-1">
                <p className="text-5xl font-black text-slate-900 tracking-tighter">{physicalHealth.toFixed(0)}%</p>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Física</span>
              </div>
           </div>
           <div className="bg-[#f8fafc] border-l-[10px] border-l-[#a855f7] p-8 shadow-sm">
              <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-4">Gestión</p>
              <div className="flex items-baseline gap-1">
                <p className="text-5xl font-black text-slate-900 tracking-tighter">{totalActivities}</p>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Actividades</span>
              </div>
           </div>
        </div>

        <div className="flex-1 space-y-16 relative">
           {isGenerating && (
             <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-10 flex flex-col items-center justify-center pt-20">
                <Loader2 className="w-16 h-16 animate-spin text-orange-500 mb-6" />
                <p className="text-sm font-black uppercase tracking-[0.4em] text-slate-400">Sincronizando Mis Resultados...</p>
             </div>
           )}

           <section>
              <div className="flex items-center gap-6 mb-6 border-b-4 border-slate-900 pb-4">
                 <div className="bg-black text-white w-10 h-10 flex items-center justify-center font-black text-xl rounded-xl">1</div>
                 <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Evaluación General de Mi Desempeño</h2>
              </div>
              <p className="text-lg text-slate-600 leading-[1.8] text-justify font-medium">
                 {analysis?.desempeno || "Preparando mi balance operativo..."}
              </p>
           </section>

           <section>
              <div className="flex items-center gap-6 mb-6 border-b-4 border-slate-900 pb-4">
                 <div className="bg-black text-white w-10 h-10 flex items-center justify-center font-black text-xl rounded-xl">2</div>
                 <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Hallazgos y Vulnerabilidades en Mi Zona</h2>
              </div>
              <p className="text-lg text-slate-600 leading-[1.8] text-justify font-medium">
                 {analysis?.vulnerabilidades || "Resumiendo los riesgos que he identificado..."}
              </p>
           </section>

           <section>
              <div className="flex items-center gap-6 mb-6 border-b-4 border-slate-900 pb-4">
                 <div className="bg-black text-white w-10 h-10 flex items-center justify-center font-black text-xl rounded-xl">3</div>
                 <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Estado Tecnológico Bajo Mi Supervisión</h2>
              </div>
              <p className="text-lg text-slate-600 leading-[1.8] text-justify font-medium">
                 {analysis?.tecnologia || "Detallando mi balance técnico de red..."}
              </p>
           </section>

           <section className="bg-[#fffaf5] border-2 border-[#ffedd5] p-12 mt-16 rounded-[2.5rem] shadow-xl relative">
              <div className="absolute -top-5 left-10 bg-white px-6 py-2 border-2 border-[#ffedd5] rounded-full">
                <h3 className="text-[10px] font-black text-[#ea580c] uppercase tracking-[0.3em]">Mi Plan Estratégico</h3>
              </div>
              <div className="space-y-6">
                 {(analysis?.estrategia || ["Fortalecer mi control preventivo", "Garantizar mi continuidad operativa"]).map((item, i) => (
                    <div key={i} className="flex gap-6 items-start">
                       <span className="font-black text-2xl text-[#ea580c] mt-1">{i + 1}.</span>
                       <p className="text-lg font-black text-slate-800 uppercase tracking-tight leading-snug">{item}</p>
                    </div>
                 ))}
              </div>
           </section>
        </div>

        <div className="mt-20 pt-10 border-t-2 border-slate-900 flex justify-between items-center text-slate-400">
           <p className="text-[9px] font-black uppercase tracking-[0.5em]">Generado por XANA Security Audit System V3.0</p>
           <div className="text-right">
              <p className="text-[9px] font-black uppercase tracking-widest">Documento de Uso Gerencial</p>
              <p className="text-[9px] font-bold">AUTOR: {coordinatorName}</p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ManagementReport;
