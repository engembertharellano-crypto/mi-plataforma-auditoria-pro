
import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowLeft, 
  Save, 
  Lock, 
  ArrowRight,
  Plus,
  X,
  MapPin,
  Camera,
  Upload,
  Loader2,
  Crosshair,
  Pencil,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  XCircle,
  Lightbulb,
  Eye,
  Crop,
  RotateCw,
  Minus,
  Table,
  Download,
  FileSpreadsheet,
  Check
} from 'lucide-react';
import { Pharmacy, PhysicalInventoryRecord } from '../types';

interface PhysicalInventoryProps {
  pharmacies: Pharmacy[];
  records: PhysicalInventoryRecord[];
  onBack: () => void;
  onSave: (record: PhysicalInventoryRecord) => void;
  onAddPharmacy: (pharmacy: Pharmacy) => void;
}

const PhysicalInventory: React.FC<PhysicalInventoryProps> = ({ pharmacies, records, onBack, onSave, onAddPharmacy }) => {
  const [selectedPharmacy, setSelectedPharmacy] = useState<Pharmacy | null>(null);
  const [showConsolidated, setShowConsolidated] = useState(false);

  const [formData, setFormData] = useState({
    smReq: 1, smGood: 1, cdReq: 2, cdGood: 2, espReq: 2, espGood: 2, iluReq: 4, iluGood: 4, notes: ''
  });

  useEffect(() => {
    if (selectedPharmacy) {
      const pharmRecords = records.filter(r => r.pharmacyId === selectedPharmacy.id);
      const record = pharmRecords.length > 0 ? pharmRecords[pharmRecords.length - 1] : undefined;
      if (record) {
        setFormData({ smReq: record.santamarias.required, smGood: record.santamarias.good, cdReq: record.candados.required, cdGood: record.candados.good, espReq: record.espejos.required, espGood: record.espejos.good, iluReq: record.iluminacion.required, iluGood: record.iluminacion.good, notes: record.notes });
      } else {
        setFormData({ smReq: 1, smGood: 1, cdReq: 2, cdGood: 2, espReq: 2, espGood: 2, iluReq: 4, iluGood: 4, notes: '' });
      }
    }
  }, [selectedPharmacy, records]);

  const handleSaveInventory = () => { 
    if (!selectedPharmacy) return; 
    onSave({ 
      id: `phys-${Date.now()}`, 
      pharmacyId: selectedPharmacy.id, 
      date: new Date().toLocaleDateString('es-ES'), 
      santamarias: { required: formData.smReq, good: formData.smGood }, 
      candados: { required: formData.cdReq, good: formData.cdGood }, 
      espejos: { required: formData.espReq, good: formData.espGood }, 
      iluminacion: { required: formData.iluReq, good: formData.iluGood }, 
      notes: formData.notes 
    }); 
    alert("Inventario técnico guardado exitosamente"); 
    setSelectedPharmacy(null); 
  };

  const downloadCSV = () => {
    const headers = [
      'FARMACIA', 'ACTUALIZACION', 'SANTAMARIAS', 'CANDADOS', 'ESPEJOS', 'ILUMINACION', 'EFICIENCIA (%)'
    ];
    
    const rows = pharmacies.map(p => {
      const r = records.filter(x => x.pharmacyId === p.id).pop();
      if (!r) return [p.name, 'Sin registro', '', '', '', '', '0%'];
      
      const totalReq = r.santamarias.required + r.candados.required + r.espejos.required + r.iluminacion.required;
      const totalGood = r.santamarias.good + r.candados.good + r.espejos.good + r.iluminacion.good;
      const health = totalReq > 0 ? (totalGood / totalReq) * 100 : 0;
      
      // Se utiliza el formato "X de Y" para evitar que Excel autoformatee como fecha
      return [
        p.name,
        r.date,
        `${r.santamarias.good} de ${r.santamarias.required}`,
        `${r.candados.good} de ${r.candados.required}`,
        `${r.espejos.good} de ${r.espejos.required}`,
        `${r.iluminacion.good} de ${r.iluminacion.required}`,
        `${health.toFixed(1)}%`
      ];
    });

    const escapeCsv = (str: string) => `"${str.replace(/"/g, '""')}"`;
    const content = [headers, ...rows].map(row => row.map(escapeCsv).join(";")).join("\n");
    
    const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Consolidado_Infraestructura_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const renderItemRow = (title: string, icon: any, req: number, setReq: (v: number) => void, good: number, setGood: (v: number) => void) => {
    const bad = Math.max(0, req - good);
    return (
      <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 p-8 flex flex-col md:flex-row gap-10 items-center">
         <div className="flex items-center gap-6 w-full md:w-1/3">
            <div className="p-5 bg-slate-50 rounded-[1.5rem] text-slate-800 shadow-inner border border-slate-100">{icon}</div>
            <h3 className="text-xl font-black text-slate-800 tracking-tight uppercase">{title}</h3>
         </div>
         <div className="flex-1 w-full grid grid-cols-3 gap-6">
            <div className="text-center"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Instalados</label><input type="number" className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl font-black text-slate-800 text-center text-xl outline-none focus:border-orange-500" value={req} onChange={e => setReq(parseInt(e.target.value) || 0)} /></div>
            <div className="text-center"><label className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-3 block">Operativos</label><input type="number" className="w-full p-4 bg-emerald-50/50 border-2 border-emerald-100 rounded-2xl font-black text-emerald-700 text-center text-xl outline-none focus:border-emerald-500" value={good} onChange={e => setGood(parseInt(e.target.value) || 0)} /></div>
            <div className="text-center"><label className="text-[9px] font-black text-red-600 uppercase tracking-widest mb-3 block">Fallas</label><div className="w-full p-4 bg-red-50/50 border-2 border-red-100 rounded-2xl font-black text-red-700 text-center text-xl">{bad}</div></div>
         </div>
      </div>
    );
  };

  if (!selectedPharmacy) {
    return (
      <div className="max-w-7xl mx-auto p-10 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 mb-16">
            <div>
              <h2 className="text-4xl font-black text-white tracking-tighter drop-shadow-md uppercase">Infraestructura</h2>
              <p className="text-slate-300 mt-2 font-bold uppercase tracking-[0.25em] text-xs">Censo de Elementos Perimetrales</p>
            </div>
            <div className="flex gap-4">
               <button onClick={() => setShowConsolidated(true)} className="bg-white text-slate-900 border border-slate-200 px-8 py-4 rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] flex items-center gap-3 shadow-xl hover:bg-slate-50">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600" /> Consolidado General
               </button>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {pharmacies.map(p => {
             const r = records.filter(x => x.pharmacyId === p.id).pop();
             return (
               <div key={p.id} onClick={() => setSelectedPharmacy(p)} className="bg-white rounded-[3rem] border border-white hover:border-orange-500 cursor-pointer transition-all shadow-3xl hover:-translate-y-2 group relative">
                 {r && <div className="absolute -top-3 right-6 z-10"><div className="bg-orange-600 text-white text-[9px] font-black px-4 py-2 rounded-xl shadow-lg border border-white tracking-widest uppercase"><Calendar className="w-3.5 h-3.5" /> {r.date}</div></div>}
                 <div className="p-10">
                    <div className="flex justify-between items-start mb-8">
                        <div className="flex items-center gap-3 text-orange-600 font-black text-xl tracking-tighter"><Lock className="w-7 h-7" /><span className="truncate uppercase">{p.name}</span></div>
                        <div className="bg-slate-50 p-3 rounded-2xl text-slate-200 group-hover:text-orange-500 transition-all"><Pencil className="w-4 h-4" /></div>
                    </div>
                    {r ? (
                      <div className="space-y-4">
                        <div className="flex justify-between text-[11px] font-black uppercase bg-slate-50 p-3 rounded-xl border border-slate-100">
                           <span className="text-slate-400">Cortinas/Cierres:</span>
                           <span className="text-slate-800">{r.santamarias.good}/{r.santamarias.required} OK</span>
                        </div>
                        <div className="flex justify-between text-[11px] font-black uppercase bg-slate-50 p-3 rounded-xl border border-slate-100">
                           <span className="text-slate-400">Iluminación:</span>
                           <span className="text-slate-800">{r.iluminacion.good}/{r.iluminacion.required} OK</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-10 text-slate-200 gap-3 grayscale opacity-30">
                        <AlertTriangle className="w-10 h-10" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Sin Levantamiento</span>
                      </div>
                    )}
                 </div>
               </div>
             );
          })}
        </div>

        {showConsolidated && (
           <div className="fixed inset-0 bg-slate-900/95 z-[100] flex items-center justify-center p-6">
              <div className="bg-white rounded-[2rem] w-full max-w-[95vw] h-[85vh] flex flex-col shadow-3xl overflow-hidden">
                <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-white">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-50 rounded-xl"><FileSpreadsheet className="w-6 h-6 text-blue-600" /></div>
                    <div>
                      <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">Consolidado General Infraestructura</h3>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Censo de protección perimetral</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <button onClick={downloadCSV} className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center gap-2 hover:bg-emerald-700 shadow-xl shadow-emerald-100">
                      <Download className="w-4 h-4" /> Exportar CSV
                    </button>
                    <button onClick={() => setShowConsolidated(false)} className="p-3 hover:bg-slate-100 rounded-full text-slate-400"><X className="w-6 h-6" /></button>
                  </div>
                </div>
                
                <div className="flex-1 overflow-auto bg-slate-50/30">
                  <table className="w-full text-[10px] font-bold text-left uppercase tracking-tighter border-collapse">
                    <thead className="bg-slate-100/80 sticky top-0 z-10 backdrop-blur-md">
                      <tr className="text-slate-500 font-black border-b border-slate-200">
                        <th className="p-4 pl-8">FARMACIA</th>
                        <th className="p-4 text-center">ACTUALIZACIÓN</th>
                        <th className="p-4 text-center">SANTAMARIAS</th>
                        <th className="p-4 text-center">CANDADOS</th>
                        <th className="p-4 text-center">ESPEJOS</th>
                        <th className="p-4 text-center">LUZ EXT.</th>
                        <th className="p-4 text-center">EFICIENCIA</th>
                        <th className="p-4 pr-8 text-center">ESTATUS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {pharmacies.map(p => {
                        const r = records.filter(x => x.pharmacyId === p.id).pop();
                        if (!r) return (
                          <tr key={p.id} className="hover:bg-slate-50">
                            <td className="p-4 pl-8 font-black text-slate-900 text-sm uppercase">{p.name}</td>
                            <td colSpan={7} className="p-4 text-center text-slate-300 italic font-medium">Sin levantamiento</td>
                          </tr>
                        );
                        const totalReq = r.santamarias.required + r.candados.required + r.espejos.required + r.iluminacion.required;
                        const totalGood = r.santamarias.good + r.candados.good + r.espejos.good + r.iluminacion.good;
                        const health = totalReq > 0 ? (totalGood / totalReq) * 100 : 0;
                        return (
                          <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                            <td className="p-4 pl-8 font-black text-slate-900 text-sm uppercase">{p.name}</td>
                            <td className="p-4 text-center text-slate-400 font-mono">{r.date}</td>
                            <td className="p-4 text-center">{r.santamarias.good} / {r.santamarias.required}</td>
                            <td className="p-4 text-center">{r.candados.good} / {r.candados.required}</td>
                            <td className="p-4 text-center">{r.espejos.good} / {r.espejos.required}</td>
                            <td className="p-4 text-center">{r.iluminacion.good} / {r.iluminacion.required}</td>
                            <td className="p-4 text-center">
                              <span className={`px-2 py-1 rounded-lg border font-black ${health >= 90 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                                {health.toFixed(1)}%
                              </span>
                            </td>
                            <td className="p-4 pr-8 text-center">
                               <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase ${health === 100 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                                  {health === 100 ? 'Operativo' : 'Con Fallas'}
                               </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
           </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-10 animate-in fade-in duration-700 pb-20">
      <div className="flex items-center gap-6 mb-12">
        <button onClick={() => setSelectedPharmacy(null)} className="p-4 bg-white/10 hover:bg-white/20 rounded-[1.5rem] transition-all text-white border border-white/20"><ArrowLeft className="w-7 h-7" /></button>
        <div>
          <h2 className="text-3xl font-black text-white tracking-tighter uppercase">Infraestructura</h2>
          <div className="flex items-center gap-2 text-orange-400 font-black uppercase text-[10px] tracking-widest mt-1">
            <Check className="w-4 h-4" /> <span>{selectedPharmacy.name}</span>
          </div>
        </div>
      </div>
      
      <div className="space-y-8 mb-12">
         {renderItemRow("Santamarías", <Lock className="w-8 h-8" />, formData.smReq, (v) => setFormData({...formData, smReq: v}), formData.smGood, (v) => setFormData({...formData, smGood: v}))}
         {renderItemRow("Candados", <Lock className="w-8 h-8" />, formData.cdReq, (v) => setFormData({...formData, cdReq: v}), formData.cdGood, (v) => setFormData({...formData, cdGood: v}))}
         {renderItemRow("Espejos Convexos", <Eye className="w-8 h-8" />, formData.espReq, (v) => setFormData({...formData, espReq: v}), formData.espGood, (v) => setFormData({...formData, espGood: v}))}
         {renderItemRow("Iluminación", <Lightbulb className="w-8 h-8" />, formData.iluReq, (v) => setFormData({...formData, iluReq: v}), formData.iluGood, (v) => setFormData({...formData, iluGood: v}))}
      </div>
      
      <div className="bg-white p-10 rounded-[3.5rem] shadow-xl border border-white mb-12">
        <h3 className="font-black text-xl text-slate-800 mb-6 uppercase tracking-tighter flex items-center gap-3"><Pencil className="w-5 h-5 text-orange-500" /> Observaciones</h3>
        <textarea className="w-full h-32 p-6 bg-slate-50 border-2 border-slate-50 rounded-[2rem] outline-none focus:border-orange-500 font-medium text-slate-600 transition-all" value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} />
      </div>
      
      <div className="flex justify-end gap-6 items-center">
        <button onClick={() => setSelectedPharmacy(null)} className="text-white/40 hover:text-white font-black uppercase tracking-widest text-[10px]">Cancelar</button>
        <button onClick={handleSaveInventory} className="bg-orange-600 text-white px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-orange-600/20 hover:bg-orange-500 transition-all">
          <Save className="w-5 h-5" /> Guardar Auditoría
        </button>
      </div>
    </div>
  );
};

export default PhysicalInventory;
