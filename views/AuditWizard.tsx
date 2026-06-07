import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  MapPin, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2,
  Banknote,
  RotateCcw,
  Loader2
} from 'lucide-react';
import { Pharmacy, AuditState, VaultCount } from '../types';
import { HARDWARE_CHECKLIST, PROCESS_CHECKLIST } from '../constants';

interface AuditWizardProps {
  onCancel: () => void;
  onFinish: (audit: AuditState) => void | Promise<void>;
  pharmacies: Pharmacy[];
  initialAudit?: AuditState | null;
  onAddPharmacy: (pharmacy: Pharmacy) => void;
}

interface WorkingFundCount {
  assigned: number;
  physical: number;
  difference: number;
}

interface WorkingFund {
  boxCount: number;
  usd: WorkingFundCount;
  ves: WorkingFundCount;
  responsiblePerson: string;
  notes: string;
}

const AuditWizard: React.FC<AuditWizardProps> = ({ 
  onCancel, 
  onFinish, 
  pharmacies, 
  initialAudit,
  onAddPharmacy 
}) => {
  const [step, setStep] = useState(1);
  const [selectedPharmacy, setSelectedPharmacy] = useState<Pharmacy | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [newPharmacyMode, setNewPharmacyMode] = useState(false);
  const [newPharmacyData, setNewPharmacyData] = useState<Partial<Pharmacy>>({});

  const [inCharge, setInCharge] = useState({ nombre: '', apellido: '' });
  
  const [hardwareAnswers, setHardwareAnswers] = useState<Record<string, { quantity?: number, status: string, notes: string }>>({});
  const [processAnswers, setProcessAnswers] = useState<Record<string, { status: string, notes: string }>>({});
  
  const [vaultCount, setVaultCount] = useState<VaultCount>({
    usd: { system: 0, physical: 0, difference: 0 },
    ves: { system: 0, physical: 0, difference: 0 },
    notes: '',
    responsiblePerson: ''
  });

  const [workingFund, setWorkingFund] = useState<WorkingFund>({
    boxCount: 0,
    usd: { assigned: 0, physical: 0, difference: 0 },
    ves: { assigned: 0, physical: 0, difference: 0 },
    responsiblePerson: '',
    notes: ''
  });

  const [photos, setPhotos] = useState<string[]>([]);

  useEffect(() => {
    if (initialAudit) {
      const pharm = pharmacies.find(p => p.id === initialAudit.pharmacy?.id);
      if (pharm) setSelectedPharmacy(pharm);
      else if (initialAudit.pharmacy) setSelectedPharmacy(initialAudit.pharmacy);

      setInCharge(initialAudit.inCharge || { nombre: '', apellido: '' });
      setHardwareAnswers((initialAudit.hardwareAnswers || {}) as any);
      setProcessAnswers((initialAudit.processAnswers || {}) as any);

      if (initialAudit.vaultCount) setVaultCount(initialAudit.vaultCount);

      const initialWorkingFund = (initialAudit as any).workingFund;
      if (initialWorkingFund) {
        setWorkingFund({
          boxCount: initialWorkingFund.boxCount || 0,
          usd: {
            assigned: initialWorkingFund.usd?.assigned || 0,
            physical: initialWorkingFund.usd?.physical || 0,
            difference: initialWorkingFund.usd?.difference || 0
          },
          ves: {
            assigned: initialWorkingFund.ves?.assigned || 0,
            physical: initialWorkingFund.ves?.physical || 0,
            difference: initialWorkingFund.ves?.difference || 0
          },
          responsiblePerson: initialWorkingFund.responsiblePerson || '',
          notes: initialWorkingFund.notes || ''
        });
      }

      if (initialAudit.photos) setPhotos(initialAudit.photos);
    }
  }, [initialAudit, pharmacies]);

  const isHardwareStepComplete = () => {
    return HARDWARE_CHECKLIST.every(item => {
      const status = hardwareAnswers[item.id]?.status;
      return status === 'Operativo' || status === 'Inactivo' || status === 'N/A';
    });
  };

  const isProcessStepComplete = () => {
    return PROCESS_CHECKLIST.every(item => {
      const status = processAnswers[item.id]?.status;
      return status === 'SI' || status === 'NO' || status === 'N/A';
    });
  };

  const handleNext = () => {
    if (isSubmitting) return;

    if (step === 1 && !selectedPharmacy && !newPharmacyMode) return;

    if (step === 1 && newPharmacyMode) {
      if (!newPharmacyData.name) return;
      const newPharm: Pharmacy = {
        id: `pharm-${Date.now()}`,
        name: newPharmacyData.name || '',
        address: newPharmacyData.address || '',
        zone: newPharmacyData.zone || 'Gran Caracas Llanos',
        status: 'Activa',
        risk: undefined,
        corporatePhone: '',
        photo: 'https://images.unsplash.com/photo-1586015555751-63c660067e81?auto=format&fit=crop&q=80&w=200'
      };
      onAddPharmacy(newPharm);
      setSelectedPharmacy(newPharm);
      setNewPharmacyMode(false);
    }

    if (step === 2 && !isHardwareStepComplete()) {
      alert('Debes seleccionar un estado en todos los ítems de Seguridad Física antes de continuar.');
      return;
    }

    if (step === 3 && !isProcessStepComplete()) {
      alert('Debes seleccionar un estado en todos los ítems de Procesos y Protocolos antes de continuar.');
      return;
    }

    setStep(prev => prev + 1);
  };

  const handleBack = () => {
    if (isSubmitting) return;
    setStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (!selectedPharmacy || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const auditData: any = {
        id: initialAudit?.id || '',
        date: initialAudit?.date || new Date().toLocaleDateString('es-ES'),
        pharmacyId: selectedPharmacy.id,
        pharmacy: selectedPharmacy,
        inCharge,
        hardwareAnswers,
        processAnswers,
        vaultCount,
        workingFund,
        photos,
        score: 0,
        reportText: initialAudit?.reportText
      };

      await Promise.resolve(onFinish(auditData));
    } catch (error) {
      console.error('Error guardando inspección:', error);
      alert('Ocurrió un error al guardar la inspección. Intenta nuevamente.');
      setIsSubmitting(false);
    }
  };

  const handleHardwareChange = (id: string, field: string, value: any) => {
    setHardwareAnswers(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: value }
    }));
  };

  const handleProcessChange = (id: string, field: string, value: any) => {
    setProcessAnswers(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: value }
    }));
  };

  return (
    <div className="max-w-4xl mx-auto p-6 pb-24 animate-in slide-in-from-bottom-4 duration-500">
      
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter">
            {initialAudit ? 'Editar Inspección' : 'Nueva Inspección'}
          </h2>
          <p className="text-slate-400 font-medium">Paso {step} de 5</p>
        </div>
        <button
          onClick={onCancel}
          disabled={isSubmitting}
          className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors text-white disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl min-h-[500px] relative">
        
        {step === 1 && (
          <div className="space-y-6">
            <h3 className="text-xl font-black text-slate-800 uppercase flex items-center gap-2">
              <MapPin className="w-6 h-6 text-orange-500" /> Selección de Sede
            </h3>
            
            {initialAudit ? (
               <div className="p-6 bg-slate-50 border-2 border-slate-200 rounded-2xl">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Sede Seleccionada</p>
                  <p className="text-2xl font-black text-slate-800">{selectedPharmacy?.name}</p>
               </div>
            ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {pharmacies.map(p => (
                   <button 
                     key={p.id} 
                     onClick={() => setSelectedPharmacy(p)}
                     disabled={isSubmitting}
                     className={`p-4 rounded-xl border-2 text-left transition-all ${selectedPharmacy?.id === p.id ? 'border-orange-500 bg-orange-50' : 'border-slate-100 hover:border-slate-300'} disabled:opacity-60`}
                   >
                     <p className="font-bold text-slate-800">{p.name}</p>
                     <p className="text-xs text-slate-500 uppercase">{p.zone}</p>
                   </button>
                 ))}
               </div>
            )}

            <div className="pt-6 border-t border-slate-100">
               <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Responsable de Sede (Gerente)</label>
               <div className="grid grid-cols-2 gap-4">
                 <input type="text" placeholder="Nombre" className="w-full p-3 bg-slate-50 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-orange-500" value={inCharge.nombre} onChange={e => setInCharge({...inCharge, nombre: e.target.value})} disabled={isSubmitting} />
                 <input type="text" placeholder="Apellido" className="w-full p-3 bg-slate-50 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-orange-500" value={inCharge.apellido} onChange={e => setInCharge({...inCharge, apellido: e.target.value})} disabled={isSubmitting} />
               </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
             <h3 className="text-xl font-black text-slate-800 uppercase flex items-center gap-2"><ShieldCheck className="w-6 h-6 text-orange-500" /> Seguridad Física</h3>
             <div className="h-[400px] overflow-y-auto pr-2 space-y-6 custom-scrollbar">
                {Object.keys(HARDWARE_CHECKLIST.reduce((acc, i) => ({...acc, [i.category]: 1}), {})).map(cat => (
                   <div key={cat}>
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 sticky top-0 bg-white py-2 z-10">{cat}</h4>
                      <div className="space-y-3">
                         {HARDWARE_CHECKLIST.filter(i => i.category === cat).map(item => (
                            <div key={item.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                               <div className="flex justify-between mb-3">
                                  <span className="font-bold text-slate-700 text-sm w-2/3">{item.name}</span>
                                  <div className="flex gap-2">
                                     {['Operativo', 'Inactivo', 'N/A'].map(opt => (
                                        <button key={opt} onClick={() => handleHardwareChange(item.id, 'status', opt)} disabled={isSubmitting} className={`px-2 py-1 text-[10px] font-black uppercase rounded-lg transition-all ${hardwareAnswers[item.id]?.status === opt ? (opt === 'Operativo' ? 'bg-emerald-500 text-white' : opt === 'Inactivo' ? 'bg-red-500 text-white' : 'bg-slate-500 text-white') : 'bg-white border border-slate-200 text-slate-400'} disabled:opacity-60`}>
                                           {opt}
                                        </button>
                                     ))}
                                  </div>
                               </div>
                               <input type="text" placeholder="Observaciones..." className="w-full bg-white p-2 rounded-lg text-xs font-medium text-slate-600 outline-none border border-transparent focus:border-slate-200" value={hardwareAnswers[item.id]?.notes || ''} onChange={e => handleHardwareChange(item.id, 'notes', e.target.value)} disabled={isSubmitting} />
                            </div>
                         ))}
                      </div>
                   </div>
                ))}
             </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
             <h3 className="text-xl font-black text-slate-800 uppercase flex items-center gap-2"><CheckCircle2 className="w-6 h-6 text-blue-500" /> Procesos y Protocolos</h3>
             <div className="h-[400px] overflow-y-auto pr-2 space-y-6 custom-scrollbar">
                {Object.keys(PROCESS_CHECKLIST.reduce((acc, i) => ({...acc, [i.category]: 1}), {})).map(cat => (
                   <div key={cat}>
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 sticky top-0 bg-white py-2 z-10">{cat}</h4>
                      <div className="space-y-3">
                         {PROCESS_CHECKLIST.filter(i => i.category === cat).map(item => (
                            <div key={item.id} className="p-4 bg-blue-50/30 rounded-xl border border-blue-50">
                               <div className="flex justify-between mb-3">
                                  <span className="font-bold text-slate-700 text-sm w-2/3">{item.text}</span>
                                  <div className="flex gap-2">
                                     {['SI', 'NO', 'N/A'].map(opt => (
                                        <button key={opt} onClick={() => handleProcessChange(item.id, 'status', opt)} disabled={isSubmitting} className={`px-3 py-1 text-[10px] font-black uppercase rounded-lg transition-all ${processAnswers[item.id]?.status === opt ? (opt === 'SI' ? 'bg-emerald-500 text-white' : opt === 'NO' ? 'bg-red-500 text-white' : 'bg-slate-500 text-white') : 'bg-white border border-blue-100 text-slate-400'} disabled:opacity-60`}>
                                           {opt}
                                        </button>
                                     ))}
                                  </div>
                               </div>
                               <input type="text" placeholder="Observaciones..." className="w-full bg-white p-2 rounded-lg text-xs font-medium text-slate-600 outline-none border border-transparent focus:border-blue-100" value={processAnswers[item.id]?.notes || ''} onChange={e => handleProcessChange(item.id, 'notes', e.target.value)} disabled={isSubmitting} />
                            </div>
                         ))}
                      </div>
                   </div>
                ))}
             </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
             <h3 className="text-xl font-black text-slate-800 uppercase flex items-center gap-2"><Banknote className="w-6 h-6 text-emerald-500" /> Arqueo de Bóveda</h3>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100">
                   <p className="text-emerald-700 font-black text-sm uppercase tracking-widest mb-4">Dólares (USD)</p>
                   <div className="space-y-4">
                      <div><label className="text-[10px] font-bold text-slate-400 uppercase">Saldo Sistema</label><input type="number" className="w-full p-3 rounded-xl font-black text-xl text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500" value={vaultCount.usd.system} onChange={e => { const val = parseFloat(e.target.value) || 0; setVaultCount(prev => ({...prev, usd: {...prev.usd, system: val, difference: prev.usd.physical - val}})) }} disabled={isSubmitting} /></div>
                      <div><label className="text-[10px] font-bold text-slate-400 uppercase">Conteo Físico</label><input type="number" className="w-full p-3 rounded-xl font-black text-xl text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500" value={vaultCount.usd.physical} onChange={e => { const val = parseFloat(e.target.value) || 0; setVaultCount(prev => ({...prev, usd: {...prev.usd, physical: val, difference: val - prev.usd.system}})) }} disabled={isSubmitting} /></div>
                      <div className={`p-3 rounded-xl text-center font-black ${vaultCount.usd.difference === 0 ? 'bg-emerald-200 text-emerald-800' : 'bg-red-200 text-red-800'}`}>Dif: {vaultCount.usd.difference.toFixed(2)}</div>
                   </div>
                </div>

                <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100">
                   <p className="text-blue-700 font-black text-sm uppercase tracking-widest mb-4">Bolívares (VES)</p>
                   <div className="space-y-4">
                      <div><label className="text-[10px] font-bold text-slate-400 uppercase">Saldo Sistema</label><input type="number" className="w-full p-3 rounded-xl font-black text-xl text-slate-800 outline-none focus:ring-2 focus:ring-blue-500" value={vaultCount.ves.system} onChange={e => { const val = parseFloat(e.target.value) || 0; setVaultCount(prev => ({...prev, ves: {...prev.ves, system: val, difference: prev.ves.physical - val}})) }} disabled={isSubmitting} /></div>
                      <div><label className="text-[10px] font-bold text-slate-400 uppercase">Conteo Físico</label><input type="number" className="w-full p-3 rounded-xl font-black text-xl text-slate-800 outline-none focus:ring-2 focus:ring-blue-500" value={vaultCount.ves.physical} onChange={e => { const val = parseFloat(e.target.value) || 0; setVaultCount(prev => ({...prev, ves: {...prev.ves, physical: val, difference: val - prev.ves.system}})) }} disabled={isSubmitting} /></div>
                      <div className={`p-3 rounded-xl text-center font-black ${vaultCount.ves.difference === 0 ? 'bg-blue-200 text-blue-800' : 'bg-red-200 text-red-800'}`}>Dif: {vaultCount.ves.difference.toFixed(2)}</div>
                   </div>
                </div>
             </div>
             
             <div className="p-4 bg-slate-50 rounded-xl">
                <input type="text" placeholder="Nombre del responsable del conteo (Testigo)" className="w-full bg-transparent outline-none font-bold text-slate-700 text-sm mb-2" value={vaultCount.responsiblePerson} onChange={e => setVaultCount({...vaultCount, responsiblePerson: e.target.value})} disabled={isSubmitting} />
                <textarea placeholder="Justificación de diferencias..." className="w-full bg-white p-3 rounded-lg text-sm text-slate-600 outline-none h-20 resize-none" value={vaultCount.notes} onChange={e => setVaultCount({...vaultCount, notes: e.target.value})} disabled={isSubmitting}></textarea>
             </div>

             <div className="pt-4 border-t border-slate-100">
               <h3 className="text-xl font-black text-slate-800 uppercase flex items-center gap-2 mb-6">
                 <Banknote className="w-6 h-6 text-slate-700" /> Fondo de Trabajo Consolidado
               </h3>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100">
                     <p className="text-emerald-700 font-black text-sm uppercase tracking-widest mb-4">Dólares (USD)</p>
                     <div className="space-y-4">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Monto Asignado</label>
                          <input
                            type="number"
                            className="w-full p-3 rounded-xl font-black text-xl text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                            value={workingFund.usd.assigned}
                            onChange={e => {
                              const val = parseFloat(e.target.value) || 0;
                              setWorkingFund(prev => ({
                                ...prev,
                                usd: {
                                  ...prev.usd,
                                  assigned: val,
                                  difference: prev.usd.physical - val
                                }
                              }));
                            }}
                            disabled={isSubmitting}
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Conteo Físico</label>
                          <input
                            type="number"
                            className="w-full p-3 rounded-xl font-black text-xl text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                            value={workingFund.usd.physical}
                            onChange={e => {
                              const val = parseFloat(e.target.value) || 0;
                              setWorkingFund(prev => ({
                                ...prev,
                                usd: {
                                  ...prev.usd,
                                  physical: val,
                                  difference: val - prev.usd.assigned
                                }
                              }));
                            }}
                            disabled={isSubmitting}
                          />
                        </div>
                        <div className={`p-3 rounded-xl text-center font-black ${workingFund.usd.difference === 0 ? 'bg-emerald-200 text-emerald-800' : 'bg-red-200 text-red-800'}`}>
                          Dif: {workingFund.usd.difference.toFixed(2)}
                        </div>
                     </div>
                  </div>

                  <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100">
                     <p className="text-blue-700 font-black text-sm uppercase tracking-widest mb-4">Bolívares (VES)</p>
                     <div className="space-y-4">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Monto Asignado</label>
                          <input
                            type="number"
                            className="w-full p-3 rounded-xl font-black text-xl text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                            value={workingFund.ves.assigned}
                            onChange={e => {
                              const val = parseFloat(e.target.value) || 0;
                              setWorkingFund(prev => ({
                                ...prev,
                                ves: {
                                  ...prev.ves,
                                  assigned: val,
                                  difference: prev.ves.physical - val
                                }
                              }));
                            }}
                            disabled={isSubmitting}
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Conteo Físico</label>
                          <input
                            type="number"
                            className="w-full p-3 rounded-xl font-black text-xl text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                            value={workingFund.ves.physical}
                            onChange={e => {
                              const val = parseFloat(e.target.value) || 0;
                              setWorkingFund(prev => ({
                                ...prev,
                                ves: {
                                  ...prev.ves,
                                  physical: val,
                                  difference: val - prev.ves.assigned
                                }
                              }));
                            }}
                            disabled={isSubmitting}
                          />
                        </div>
                        <div className={`p-3 rounded-xl text-center font-black ${workingFund.ves.difference === 0 ? 'bg-blue-200 text-blue-800' : 'bg-red-200 text-red-800'}`}>
                          Dif: {workingFund.ves.difference.toFixed(2)}
                        </div>
                     </div>
                  </div>
               </div>

               <div className="mt-6 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                 <label className="text-[10px] font-bold text-slate-400 uppercase">Cantidad de Cajas</label>
                 <input
                   type="number"
                   className="w-full mt-2 p-3 rounded-xl font-black text-xl text-slate-800 outline-none focus:ring-2 focus:ring-slate-400"
                   value={workingFund.boxCount}
                   onChange={e => setWorkingFund(prev => ({ ...prev, boxCount: parseInt(e.target.value || '0', 10) || 0 }))}
                   disabled={isSubmitting}
                 />
               </div>

               <div className="mt-6 p-4 bg-slate-50 rounded-xl">
                  <input
                    type="text"
                    placeholder="Nombre del responsable del fondo de trabajo"
                    className="w-full bg-transparent outline-none font-bold text-slate-700 text-sm mb-2"
                    value={workingFund.responsiblePerson}
                    onChange={e => setWorkingFund({ ...workingFund, responsiblePerson: e.target.value })}
                    disabled={isSubmitting}
                  />
                  <textarea
                    placeholder="Observaciones del fondo de trabajo..."
                    className="w-full bg-white p-3 rounded-lg text-sm text-slate-600 outline-none h-20 resize-none"
                    value={workingFund.notes}
                    onChange={e => setWorkingFund({ ...workingFund, notes: e.target.value })}
                    disabled={isSubmitting}
                  />
               </div>
             </div>
          </div>
        )}

        {step === 5 && (
           <div className="text-center py-10">
              <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                 <CheckCircle2 className="w-12 h-12 text-emerald-600" />
              </div>
              <h3 className="text-2xl font-black text-slate-800 uppercase mb-2">Inspección Completa</h3>
              <p className="text-slate-500 max-w-md mx-auto mb-8">
                 Has completado todos los pasos. Al finalizar, se generará el reporte y podrás exportarlo.
                 {initialAudit && <span className="block mt-2 font-bold text-orange-500">ESTÁS EN MODO EDICIÓN: Se actualizará el registro existente.</span>}
              </p>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl hover:shadow-2xl transform hover:-translate-y-1 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:bg-slate-900 disabled:hover:shadow-xl disabled:hover:translate-y-0 flex items-center justify-center gap-3 mx-auto min-w-[280px]"
              >
                 {isSubmitting ? (
                   <>
                     <Loader2 className="w-5 h-5 animate-spin" />
                     Guardando...
                   </>
                 ) : (
                   initialAudit ? 'Actualizar Inspección' : 'Finalizar y Guardar'
                 )}
              </button>
           </div>
        )}

      </div>

      {step < 5 && (
        <div className="flex justify-between mt-8">
           {step > 1 ? (
              <button onClick={handleBack} disabled={isSubmitting} className="px-6 py-3 rounded-xl bg-white/10 text-white font-bold hover:bg-white/20 transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
                <ArrowLeft className="w-4 h-4" /> Anterior
              </button>
           ) : <div></div>}
           
           <button onClick={handleNext} disabled={isSubmitting} className="px-8 py-3 rounded-xl bg-orange-500 text-white font-bold hover:bg-orange-600 transition-all shadow-lg flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
              Siguiente <ArrowRight className="w-4 h-4" />
           </button>
        </div>
      )}
    </div>
  );
};

export default AuditWizard;
