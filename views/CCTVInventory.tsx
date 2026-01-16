
import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Save, 
  Video, 
  FileSpreadsheet, 
  Plus, 
  Pencil, 
  AlertTriangle, 
  Calendar, 
  Globe, 
  Server, 
  Database, 
  Bell, 
  Monitor, 
  MousePointer2, 
  Battery, 
  MessageSquare, 
  X, 
  Download,
  Check,
  AlertCircle
} from 'lucide-react';
import { Pharmacy, CCTVInventoryRecord } from '../types';

interface CCTVInventoryProps {
  pharmacies: Pharmacy[];
  records: CCTVInventoryRecord[];
  onBack: () => void;
  onSave: (record: CCTVInventoryRecord) => void;
  onAddPharmacy: (pharmacy: Pharmacy) => void;
}

const CCTVInventory: React.FC<CCTVInventoryProps> = ({ pharmacies, records, onBack, onSave, onAddPharmacy }) => {
  const [selectedPharmacy, setSelectedPharmacy] = useState<Pharmacy | null>(null);
  const [showConsolidated, setShowConsolidated] = useState(false);
  
  const [formData, setFormData] = useState({
    recorderType: 'DVR',
    dvrQuantity: 1,
    dvrStatus: 'Operativo',
    hddStatus: 'Operativo',
    daysRecording: 0,
    remoteStatus: 'Conectado' as 'Conectado' | 'Desconectado',
    upsStatus: 'Operativo' as 'Operativo' | 'Dañado' | 'No Posee',
    rackStatus: 'Ordenado' as 'Ordenado' | 'Desordenado' | 'No Posee',
    analogTotal: 0,
    analogOperative: 0,
    ipTotal: 0,
    ipOperative: 0,
    hasAlarm: true,
    alarmStatus: 'Operativa',
    monitorStatus: 'OK',
    mouseStatus: 'OK',
    notes: ''
  });

  useEffect(() => {
    if (selectedPharmacy) {
      const pharmRecords = records.filter(r => r.pharmacyId === selectedPharmacy.id);
      const record = pharmRecords.length > 0 ? pharmRecords[pharmRecords.length - 1] : undefined;
      if (record) {
        setFormData({
          recorderType: record.equipment.recorderType,
          dvrQuantity: record.equipment.dvrQuantity,
          dvrStatus: record.equipment.dvrStatus,
          hddStatus: record.equipment.hddStatus,
          daysRecording: record.equipment.daysRecording,
          remoteStatus: record.equipment.remoteStatus,
          upsStatus: record.equipment.upsStatus,
          rackStatus: record.equipment.rackStatus,
          analogTotal: record.cameras.analogTotal,
          analogOperative: record.cameras.analogOperative,
          ipTotal: record.cameras.ipTotal,
          ipOperative: record.cameras.ipOperative,
          hasAlarm: record.alarm.hasAlarm,
          alarmStatus: record.alarm.status,
          monitorStatus: record.equipment.monitorStatus,
          mouseStatus: record.equipment.mouseStatus,
          notes: record.notes
        });
      } else {
        setFormData({
          recorderType: 'DVR', dvrQuantity: 1, dvrStatus: 'Operativo', hddStatus: 'Operativo', 
          daysRecording: 0, remoteStatus: 'Conectado', upsStatus: 'Operativo', rackStatus: 'Ordenado',
          analogTotal: 0, analogOperative: 0, ipTotal: 0, ipOperative: 0, hasAlarm: true, 
          alarmStatus: 'Operativa', monitorStatus: 'OK', mouseStatus: 'OK', notes: ''
        });
      }
    }
  }, [selectedPharmacy, records]);

  const handleSaveInventory = () => {
    if (!selectedPharmacy) return;
    onSave({
      id: `cctv-${Date.now()}`,
      pharmacyId: selectedPharmacy.id,
      date: new Date().toLocaleDateString('es-ES'),
      equipment: {
        recorderType: formData.recorderType,
        dvrQuantity: formData.dvrQuantity,
        dvrStatus: formData.dvrStatus,
        hddStatus: formData.hddStatus,
        daysRecording: formData.daysRecording,
        monitorStatus: formData.monitorStatus,
        mouseStatus: formData.mouseStatus,
        remoteStatus: formData.remoteStatus,
        upsStatus: formData.upsStatus,
        rackStatus: formData.rackStatus
      },
      cameras: {
        analogTotal: formData.analogTotal,
        analogOperative: formData.analogOperative,
        analogDamaged: Math.max(0, formData.analogTotal - formData.analogOperative),
        ipTotal: formData.ipTotal,
        ipOperative: formData.ipOperative
      },
      alarm: {
        hasAlarm: formData.hasAlarm,
        status: formData.hasAlarm ? formData.alarmStatus : 'N/A'
      },
      notes: formData.notes
    });
    alert("Inventario técnico guardado exitosamente");
    setSelectedPharmacy(null);
  };

  const downloadCSV = () => {
    const headers = [
      'FARMACIA', 'ACTUALIZACION', 'DVR (CANT)', 'REMOTO', 'UPS', 
      'RACK', 'DISCO DURO', 'DIAS GRAB', 'CAMARAS', 'OK', 'MALAS', 'ALARMA'
    ];
    
    const rows = pharmacies.map(p => {
      const r = records.filter(x => x.pharmacyId === p.id).pop();
      if (!r) return [p.name, 'Sin inventario', '', '', '', '', '', '', '', '', '', ''];
      
      const totalCams = r.cameras.analogTotal + r.cameras.ipTotal;
      const okCams = r.cameras.analogOperative + r.cameras.ipOperative;
      const badCams = totalCams - okCams;
      
      return [
        p.name,
        r.date,
        `${r.equipment.recorderType} (${r.equipment.dvrQuantity})`,
        r.equipment.remoteStatus,
        r.equipment.upsStatus,
        r.equipment.rackStatus,
        r.equipment.hddStatus,
        r.equipment.daysRecording.toString(),
        totalCams.toString(),
        okCams.toString(),
        badCams.toString(),
        r.alarm.hasAlarm ? r.alarm.status : 'No Posee'
      ];
    });

    const escapeCsv = (str: string) => `"${str.replace(/"/g, '""')}"`;
    const content = [headers, ...rows].map(row => row.map(escapeCsv).join(";")).join("\n");
    
    // Add UTF-8 BOM for Excel compatibility
    const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Consolidado_CCTV_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (!selectedPharmacy) {
    return (
      <div className="max-w-7xl mx-auto p-8 animate-in fade-in duration-500">
        <div className="flex justify-between items-center mb-10">
          <h2 className="text-3xl font-black text-white tracking-tighter uppercase drop-shadow-md">Inventario Técnico CCTV</h2>
          <div className="flex gap-4">
            <button 
              onClick={() => setShowConsolidated(true)}
              className="bg-white text-slate-900 px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-xl hover:bg-slate-50 transition-all border border-slate-100"
            >
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" /> Consolidado General
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {pharmacies.map(p => {
            const pharmRecords = records.filter(r => r.pharmacyId === p.id);
            const record = pharmRecords.length > 0 ? pharmRecords[pharmRecords.length - 1] : undefined;

            return (
              <div 
                key={p.id} 
                onClick={() => setSelectedPharmacy(p)}
                className="bg-white rounded-[2rem] border border-white shadow-xl hover:shadow-2xl cursor-pointer transition-all hover:-translate-y-1 group relative flex flex-col min-h-[300px]"
              >
                {record && (
                  <div className="absolute -top-3 right-6 z-10">
                    <div className="bg-orange-600 text-white text-[10px] font-black px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-2 border border-white uppercase tracking-widest">
                      <Calendar className="w-3.5 h-3.5" /> {record.date}
                    </div>
                  </div>
                )}
                <div className="p-8 flex-1">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-3">
                      <Video className="w-6 h-6 text-orange-600" />
                      <h3 className="font-black text-slate-800 text-2xl tracking-tighter uppercase">{p.name}</h3>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-lg text-slate-300 group-hover:text-orange-500 transition-colors">
                      <Pencil className="w-4 h-4" />
                    </div>
                  </div>

                  {record ? (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center text-slate-400">
                        <span className="text-[10px] font-black uppercase tracking-widest">Equipos Principales:</span>
                        <div className="flex gap-3">
                          <Globe className={`w-5 h-5 ${record.equipment.remoteStatus === 'Conectado' ? 'text-blue-500' : 'text-slate-200'}`} />
                          <Video className={`w-5 h-5 ${record.equipment.dvrStatus === 'Operativo' ? 'text-emerald-500' : 'text-slate-200'}`} />
                        </div>
                      </div>
                      
                      <div className="text-center py-4">
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-1">TOTAL CÁMARAS</p>
                        <p className="text-6xl font-black text-slate-800 tracking-tighter">{record.cameras.analogTotal + record.cameras.ipTotal}</p>
                      </div>

                      <div className="pt-4 border-t border-slate-50 flex justify-center">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado Rack: <span className="text-slate-800">{record.equipment.rackStatus}</span></span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 opacity-30 group-hover:opacity-100 transition-opacity">
                      <AlertTriangle className="w-12 h-12 text-slate-300 mb-4" />
                      <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Sin registro previo</p>
                      <p className="text-[10px] font-black text-orange-600 mt-2 uppercase tracking-widest">Click para iniciar</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {showConsolidated && (
          <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-xl z-[100] flex items-center justify-center p-6">
            <div className="bg-white rounded-2xl w-full max-w-[95vw] h-[85vh] flex flex-col shadow-3xl overflow-hidden border border-white/20">
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-white">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-50 rounded-xl">
                    <FileSpreadsheet className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">Consolidado General CCTV</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Estado técnico e infraestructura por farmacia</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <button onClick={downloadCSV} className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center gap-2 shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all">
                    <Download className="w-4 h-4" /> Exportar CSV
                  </button>
                  <button onClick={() => setShowConsolidated(false)} className="p-3 hover:bg-slate-100 rounded-full transition-all text-slate-400">
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-auto bg-slate-50/30">
                <table className="w-full text-[10px] font-bold text-left uppercase tracking-tighter border-collapse">
                  <thead className="bg-slate-100/80 sticky top-0 z-10 backdrop-blur-md">
                    <tr className="text-slate-500 font-black border-b border-slate-200">
                      <th className="p-4 pl-8">FARMACIA</th>
                      <th className="p-4 text-center">ACTUALIZACIÓN</th>
                      <th className="p-4 text-center">DVR (CANT.)</th>
                      <th className="p-4 text-center">REMOTO</th>
                      <th className="p-4 text-center">UPS</th>
                      <th className="p-4 text-center">RACK</th>
                      <th className="p-4 text-center">DISCO DURO</th>
                      <th className="p-4 text-center">DÍAS GRAB.</th>
                      <th className="p-4 text-center">CÁMARAS</th>
                      <th className="p-4 text-center">OK</th>
                      <th className="p-4 text-center">MALAS</th>
                      <th className="p-4 text-center">ALARMA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {pharmacies.map(p => {
                      const r = records.filter(x => x.pharmacyId === p.id).pop();
                      
                      if (!r) return (
                        <tr key={p.id} className="hover:bg-slate-50">
                          <td className="p-4 pl-8 font-black text-slate-900 text-sm">{p.name}</td>
                          <td colSpan={11} className="p-4 text-center text-slate-300 italic font-medium">Sin inventario</td>
                        </tr>
                      );

                      const totalCams = r.cameras.analogTotal + r.cameras.ipTotal;
                      const opCams = r.cameras.analogOperative + r.cameras.ipOperative;
                      const badCams = totalCams - opCams;

                      return (
                        <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-4 pl-8 font-black text-slate-900 text-sm">{p.name}</td>
                          <td className="p-4 text-center text-slate-400 font-mono">{r.date}</td>
                          <td className="p-4 text-center font-black text-slate-700">{r.equipment.recorderType} ({r.equipment.dvrQuantity})</td>
                          <td className="p-4 text-center">
                            <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase ${r.equipment.remoteStatus === 'Conectado' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                              {r.equipment.remoteStatus}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase ${r.equipment.upsStatus === 'Operativo' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                              {r.equipment.upsStatus}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase ${r.equipment.rackStatus === 'Ordenado' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                              {r.equipment.rackStatus}
                            </span>
                          </td>
                          <td className="p-4 text-center font-black text-slate-700">{r.equipment.hddStatus}</td>
                          <td className="p-4 text-center font-black text-slate-700">{r.equipment.daysRecording}</td>
                          <td className="p-4 text-center font-black text-slate-900 text-sm">{totalCams}</td>
                          <td className="p-4 text-center font-black text-emerald-600 text-sm">{opCams}</td>
                          <td className="p-4 text-center font-black text-red-600 text-sm">{badCams}</td>
                          <td className="p-4 text-center pr-8">
                             <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase ${r.alarm.hasAlarm && r.alarm.status === 'Operativa' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}>
                                {r.alarm.hasAlarm ? r.alarm.status : 'Sin Alarma'}
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
    <div className="max-w-6xl mx-auto p-10 animate-in fade-in duration-700 pb-20">
      <div className="flex items-center gap-4 mb-10">
        <button onClick={() => setSelectedPharmacy(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight uppercase">Inventario Técnico CCTV</h1>
          <p className="text-orange-400 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
            <Check className="w-3 h-3" /> {selectedPharmacy.name}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Card: Equipos de Grabación */}
        <div className="space-y-8">
          <div className="bg-white rounded-[2rem] p-8 shadow-xl border border-white">
            <div className="flex items-center gap-3 text-orange-600 font-black uppercase text-xs tracking-widest mb-8">
              <Server className="w-5 h-5" /> Equipos de Grabación
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">GRABADOR (DVR/NVR)</label>
                <select className="w-full p-3 bg-slate-50 border-2 border-slate-50 rounded-xl font-bold text-slate-800 outline-none focus:border-orange-500" value={formData.recorderType} onChange={e => setFormData({...formData, recorderType: e.target.value})}>
                  <option value="DVR">DVR</option><option value="NVR">NVR</option><option value="XVR">XVR</option><option value="PC-SERVER">PC-SERVER</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">CANTIDAD</label>
                <input type="number" className="w-full p-3 bg-slate-50 border-2 border-slate-50 rounded-xl font-black text-slate-800 text-center outline-none focus:border-orange-500" value={formData.dvrQuantity} onChange={e => setFormData({...formData, dvrQuantity: parseInt(e.target.value) || 0})} />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">ESTADO GRABADOR</label>
                <select className="w-full p-3 bg-emerald-50 border-2 border-emerald-100 rounded-xl font-bold text-emerald-700 outline-none focus:border-emerald-500" value={formData.dvrStatus} onChange={e => setFormData({...formData, dvrStatus: e.target.value})}>
                  <option value="Operativo">Operativo</option><option value="Dañado">Dañado</option><option value="Faltante">Faltante</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">DISCO DURO</label>
                <select className="w-full p-3 bg-slate-50 border-2 border-slate-50 rounded-xl font-bold text-slate-800 outline-none focus:border-orange-500" value={formData.hddStatus} onChange={e => setFormData({...formData, hddStatus: e.target.value})}>
                  <option value="Operativo">Operativo</option><option value="Dañado">Dañado</option><option value="Faltante">Faltante</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">DÍAS GRABACIÓN</label>
                <input type="number" className="w-full p-3 bg-slate-50 border-2 border-slate-50 rounded-xl font-black text-slate-800 text-center outline-none focus:border-orange-500" value={formData.daysRecording} onChange={e => setFormData({...formData, daysRecording: parseInt(e.target.value) || 0})} />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">ACCESO REMOTO</label>
                <select className="w-full p-3 bg-blue-50 border-2 border-blue-100 rounded-xl font-bold text-blue-700 outline-none focus:border-blue-500" value={formData.remoteStatus} onChange={e => setFormData({...formData, remoteStatus: e.target.value as any})}>
                  <option value="Conectado">Conectado</option><option value="Desconectado">Desconectado</option>
                </select>
              </div>
            </div>
          </div>

          {/* Card: Infraestructura */}
          <div className="bg-white rounded-[2rem] p-8 shadow-xl border border-white">
            <div className="flex items-center gap-3 text-orange-600 font-black uppercase text-xs tracking-widest mb-8">
              <Database className="w-5 h-5" /> Infraestructura de Soporte
            </div>
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <Battery className="w-5 h-5 text-slate-400" />
                  <span className="text-sm font-bold text-slate-600">UPS de Respaldo</span>
                </div>
                <select className="bg-emerald-50 text-emerald-700 font-bold p-2 rounded-lg border border-emerald-200 outline-none" value={formData.upsStatus} onChange={e => setFormData({...formData, upsStatus: e.target.value as any})}>
                  <option value="Operativo">Operativo</option><option value="Dañado">Dañado</option><option value="No Posee">No Posee</option>
                </select>
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <Server className="w-5 h-5 text-slate-400" />
                  <span className="text-sm font-bold text-slate-600">Estado del Rack</span>
                </div>
                <select className="bg-emerald-50 text-emerald-700 font-bold p-2 rounded-lg border border-emerald-200 outline-none" value={formData.rackStatus} onChange={e => setFormData({...formData, rackStatus: e.target.value as any})}>
                  <option value="Ordenado">Ordenado</option><option value="Desordenado">Desordenado</option><option value="No Posee">No Posee</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Card: Cámaras */}
        <div className="space-y-8">
          <div className="bg-white rounded-[2rem] p-8 shadow-xl border border-white">
            <div className="flex items-center gap-3 text-orange-600 font-black uppercase text-xs tracking-widest mb-8">
              <Video className="w-5 h-5" /> Conteo de Cámaras
            </div>
            <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-6 text-center mb-8">
              <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">TOTAL CÁMARAS EN TIENDA</p>
              <p className="text-6xl font-black text-blue-900 tracking-tighter">{formData.analogTotal + formData.ipTotal}</p>
            </div>
            <div className="space-y-8">
              <div>
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-4">CÁMARAS ANÁLOGAS</p>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-slate-50 p-4 rounded-2xl text-center border border-slate-100">
                    <p className="text-[9px] font-bold text-slate-400 uppercase">TOTAL</p>
                    <input type="number" className="w-full bg-transparent text-center font-black text-xl outline-none" value={formData.analogTotal} onChange={e => setFormData({...formData, analogTotal: parseInt(e.target.value) || 0})} />
                  </div>
                  <div className="bg-emerald-50 p-4 rounded-2xl text-center border border-emerald-100">
                    <p className="text-[9px] font-bold text-emerald-600 uppercase">OK</p>
                    <input type="number" className="w-full bg-transparent text-center font-black text-xl text-emerald-700 outline-none" value={formData.analogOperative} onChange={e => setFormData({...formData, analogOperative: parseInt(e.target.value) || 0})} />
                  </div>
                  <div className="bg-red-50 p-4 rounded-2xl text-center border border-red-100">
                    <p className="text-[9px] font-bold text-red-600 uppercase">DAÑADAS</p>
                    <p className="font-black text-xl text-red-700">{Math.max(0, formData.analogTotal - formData.analogOperative)}</p>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-4">CÁMARAS IP / ADICIONALES</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-2xl flex justify-between items-center border border-slate-100">
                    <span className="text-[9px] font-bold text-slate-400">TOTAL IP</span>
                    <input type="number" className="w-16 bg-transparent text-right font-black text-xl outline-none" value={formData.ipTotal} onChange={e => setFormData({...formData, ipTotal: parseInt(e.target.value) || 0})} />
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl flex justify-between items-center border border-slate-100">
                    <span className="text-[9px] font-bold text-slate-400">OK IP</span>
                    <input type="number" className="w-16 bg-transparent text-right font-black text-xl outline-none" value={formData.ipOperative} onChange={e => setFormData({...formData, ipOperative: parseInt(e.target.value) || 0})} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card: Alarma y Periféricos */}
          <div className="bg-white rounded-[2rem] p-8 shadow-xl border border-white">
            <div className="flex items-center gap-3 text-orange-600 font-black uppercase text-xs tracking-widest mb-8">
              <Bell className="w-5 h-5" /> Alarma y Periféricos
            </div>
            <div className="space-y-6">
              <div className="flex items-center justify-between p-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" className="w-5 h-5 accent-orange-600 rounded" checked={formData.hasAlarm} onChange={e => setFormData({...formData, hasAlarm: e.target.checked})} />
                  <span className="font-bold text-slate-700">Posee Alarma</span>
                </label>
                <select 
                  disabled={!formData.hasAlarm}
                  className={`p-2 rounded-lg border font-bold transition-all outline-none ${formData.hasAlarm ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-slate-100 text-slate-300 border-slate-100 cursor-not-allowed grayscale'}`}
                  value={formData.alarmStatus} 
                  onChange={e => setFormData({...formData, alarmStatus: e.target.value})}
                >
                  <option value="Operativa">Operativa</option>
                  <option value="Dañada">Dañada</option>
                  <option value="Inactiva">Inactiva</option>
                  <option value="Sin Test">Sin Test</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                <div className="bg-slate-50 p-4 rounded-2xl flex justify-between items-center border border-slate-100">
                  <span className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2"><Monitor className="w-4 h-4" /> Monitor</span>
                  <select className="bg-transparent font-black text-slate-800 text-sm outline-none" value={formData.monitorStatus} onChange={e => setFormData({...formData, monitorStatus: e.target.value})}>
                    <option value="OK">OK</option>
                    <option value="FAIL">FAIL</option>
                  </select>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl flex justify-between items-center border border-slate-100">
                  <span className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2"><MousePointer2 className="w-4 h-4" /> Mouse</span>
                  <select className="bg-transparent font-black text-slate-800 text-sm outline-none" value={formData.mouseStatus} onChange={e => setFormData({...formData, mouseStatus: e.target.value})}>
                    <option value="OK">OK</option>
                    <option value="FAIL">FAIL</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-[2rem] p-8 shadow-xl border border-white">
        <div className="flex items-center gap-3 text-orange-600 font-black uppercase text-xs tracking-widest mb-4">
          <MessageSquare className="w-5 h-5" /> Observaciones del Levantamiento
        </div>
        <textarea 
          className="w-full h-32 p-6 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none focus:border-orange-500 font-medium text-slate-600 transition-all" 
          placeholder="Detalle fallas de red, obsolescencia, requerimientos UPS..." 
          value={formData.notes} 
          onChange={e => setFormData({...formData, notes: e.target.value})} 
        />
      </div>

      <div className="mt-12 flex justify-end items-center gap-8">
        <button onClick={() => setSelectedPharmacy(null)} className="text-slate-400 font-black uppercase tracking-widest text-xs hover:text-slate-600 transition-colors">Cancelar</button>
        <button onClick={handleSaveInventory} className="bg-orange-600 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl shadow-orange-600/20 flex items-center gap-3 hover:bg-orange-500 transition-all transform active:scale-95">
          <Save className="w-5 h-5" /> Guardar Inventario
        </button>
      </div>
    </div>
  );
};

export default CCTVInventory;
