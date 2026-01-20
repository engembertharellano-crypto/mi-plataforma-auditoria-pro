import React, { useState, useMemo } from 'react';
import { 
  PieChart, 
  TrendingUp, 
  Map, 
  Calendar, 
  AlertTriangle,
  ShieldCheck,
  Globe
} from 'lucide-react';
import { Pharmacy, AuditState, CCTVInventoryRecord, PhysicalInventoryRecord, ManagementVisitRecord } from '../types';

interface MonthlySummaryProps {
  pharmacies: Pharmacy[];
  audits: AuditState[];
  cctvRecords: CCTVInventoryRecord[];
  physicalRecords: PhysicalInventoryRecord[];
  managementRecords: ManagementVisitRecord[];
  users: any[];
  currentUser: any;
}

const ZONES = ['Gran Caracas Llanos', 'Gran Caracas Oriente', 'Centro Occidente'];

const MonthlySummary: React.FC<MonthlySummaryProps> = ({
  pharmacies,
  audits,
  cctvRecords,
  physicalRecords,
  managementRecords,
  currentUser
}) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedZone, setSelectedZone] = useState('Todas');

  // Permisos para ver el filtro global de zonas
  const isGlobalView = useMemo(() => {
    const role = (currentUser?.role || '').toLowerCase();
    const email = (currentUser?.email || '').toLowerCase();
    return role.includes('gerente') || 
           role.includes('lider') || 
           role === 'super usuario' || 
           email === 'directiva@xana.com';
  }, [currentUser]);

  // Helper para obtener datos seguros de farmacia
  const getPharmacyData = (record: any) => {
    const pId = record.pharmacyId || (record.pharmacy && record.pharmacy.id);
    const pharmacy = pharmacies.find(p => p.id === pId);
    return {
      name: pharmacy ? pharmacy.name : (record.pharmacy?.name || 'Sede Desconocida'),
      zone: pharmacy ? pharmacy.zone : (record.pharmacy?.zone || 'Zona General')
    };
  };

  // Filtrado principal por Mes y Zona
  const filterByDateAndZone = (items: any[]) => {
    return items.filter(item => {
      const d = new Date(item.date.includes('/') ? item.date.split('/').reverse().join('-') : item.date);
      const matchesMonth = d.getMonth() === selectedMonth;
      
      const { zone } = getPharmacyData(item);
      // Si es vista global, usa el selector. Si no, la data ya viene filtrada por App.tsx.
      const matchesZone = !isGlobalView || (selectedZone === 'Todas' || zone === selectedZone);

      return matchesMonth && matchesZone;
    });
  };

  const monthlyAudits = filterByDateAndZone(audits);
  const monthlyCCTV = filterByDateAndZone(cctvRecords);
  const monthlyPhysical = filterByDateAndZone(physicalRecords);
  const monthlyManagement = filterByDateAndZone(managementRecords);

  const stats = useMemo(() => {
    const totalActivities = monthlyAudits.length + monthlyCCTV.length + monthlyPhysical.length + monthlyManagement.length;
    const avgScore = monthlyAudits.length > 0 
      ? Math.round(monthlyAudits.reduce((acc, curr) => acc + (curr.score || 0), 0) / monthlyAudits.length) 
      : 0;
    
    const highRiskCount = monthlyAudits.filter(a => {
        const pId = a.pharmacyId || (a.pharmacy && a.pharmacy.id);
        const pharmacy = pharmacies.find(p => p.id === pId);
        return pharmacy?.risk === 'Alto' || (a.score !== undefined && a.score < 50);
    }).length;

    return { totalActivities, avgScore, highRiskCount };
  }, [monthlyAudits, monthlyCCTV, monthlyPhysical, monthlyManagement, pharmacies]);

  const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  return (
    <div className="max-w-7xl mx-auto p-8 animate-in fade-in duration-500 pb-20">
      
      {/* Header Blanco */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
        <div>
          <h2 className="text-4xl font-black text-white tracking-tighter uppercase">RESULTADOS DE GESTIÓN</h2>
          <p className="text-slate-300 font-bold text-sm uppercase tracking-widest mt-1">INTELIGENCIA DE DATOS Y CUMPLIMIENTO</p>
        </div>
        
        <div className="flex gap-4">
          {/* Selector de Zona solo para Gerencia/Directiva */}
          {isGlobalView && (
            <div className="relative group">
              <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
              <select 
                value={selectedZone}
                onChange={(e) => setSelectedZone(e.target.value)}
                className="pl-12 pr-10 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 appearance-none font-bold text-slate-700 shadow-sm min-w-[200px]"
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
              className="pl-12 pr-10 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 appearance-none font-bold text-slate-700 shadow-sm min-w-[180px]"
            >
              {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <TrendingUp className="w-24 h-24 text-blue-600" />
          </div>
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-blue-50 rounded-2xl text-blue-600"><TrendingUp className="w-6 h-6" /></div>
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Actividad Total</span>
          </div>
          <p className="text-5xl font-black text-slate-800 tracking-tighter">{stats.totalActivities}</p>
          <p className="text-sm font-bold text-slate-400 mt-2">Registros en {isGlobalView && selectedZone !== 'Todas' ? selectedZone : 'Zona Asignada'}</p>
        </div>

        <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <ShieldCheck className="w-24 h-24 text-emerald-600" />
          </div>
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600"><ShieldCheck className="w-6 h-6" /></div>
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Cumplimiento</span>
          </div>
          <p className="text-5xl font-black text-slate-800 tracking-tighter">{stats.avgScore}%</p>
          <p className="text-sm font-bold text-slate-400 mt-2">Promedio en Auditorías</p>
        </div>

        <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <AlertTriangle className="w-24 h-24 text-orange-600" />
          </div>
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-orange-50 rounded-2xl text-orange-600"><AlertTriangle className="w-6 h-6" /></div>
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Riesgos Altos</span>
          </div>
          <p className="text-5xl font-black text-slate-800 tracking-tighter">{stats.highRiskCount}</p>
          <p className="text-sm font-bold text-slate-400 mt-2">Alertas detectadas</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2.5 bg-slate-50 rounded-xl text-slate-600"><PieChart className="w-5 h-5" /></div>
            <h3 className="font-black text-slate-800 uppercase tracking-tight">Distribución por Tipo</h3>
          </div>
          <div className="space-y-6">
            {[
              { label: 'Auditorías', count: monthlyAudits.length, color: 'bg-orange-500' },
              { label: 'CCTV', count: monthlyCCTV.length, color: 'bg-blue-500' },
              { label: 'Infraestructura', count: monthlyPhysical.length, color: 'bg-purple-500' },
              { label: 'Visitas', count: monthlyManagement.length, color: 'bg-emerald-500' }
            ].map((item) => (
              <div key={item.label}>
                <div className="flex justify-between text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">
                  <span>{item.label}</span>
                  <span>{item.count}</span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full ${item.color} rounded-full transition-all duration-1000`} style={{ width: `${stats.totalActivities > 0 ? (item.count / stats.totalActivities) * 100 : 0}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2.5 bg-slate-50 rounded-xl text-slate-600"><Map className="w-5 h-5" /></div>
            <h3 className="font-black text-slate-800 uppercase tracking-tight">Actividad Reciente en Zona</h3>
          </div>
          <div className="space-y-4">
            {monthlyAudits.slice(0, 5).map((audit, i) => {
              const { name, zone } = getPharmacyData(audit);
              return (
                <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                  <div>
                    <p className="font-black text-slate-800 text-sm uppercase">{name}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">{zone}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${audit.score >= 80 ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                    {audit.score}% Cumpl.
                  </span>
                </div>
              );
            })}
            {monthlyAudits.length === 0 && (
              <div className="text-center py-10 text-slate-400 font-medium text-sm">
                No hay actividad registrada en esta zona para el mes seleccionado.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonthlySummary;
