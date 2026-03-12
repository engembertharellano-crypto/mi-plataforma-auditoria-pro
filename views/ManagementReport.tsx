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
import { Pharmacy, AuditState, CCTVInventoryRecord, PhysicalInventoryRecord, ManagementVisitRecord } from '../types';
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
        Eres ${coordinatorName}, ocupando el cargo de ${coordinatorRole} en XANA.
        Estás redactando tu INFORME DE GESTIÓN MENSUAL.

        DATOS:
        ${JSON.stringify(statsContext, null, 2)}

        Escribe en primera persona.
        Responde en JSON.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { 
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              desempeno: { type: Type.STRING },
              vulnerabilidades: { type: Type.STRING },
              tecnologia: { type: Type.STRING },
              estrategia: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["desempeno","vulnerabilidades","tecnologia","estrategia"]
          }
        }
      });

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

  return (
    <div className="max-w-6xl mx-auto p-10 animate-in fade-in duration-500 pb-20">
    </div>
  );
};

export default ManagementReport;
