import React, { useState, useRef, useEffect } from 'react';
    import { 
      MapPin, 
      User, 
      CheckCircle2, 
      XCircle, 
      AlertCircle, 
      Eye, 
      ThumbsUp, 
      ThumbsDown, 
      Minus,
      ArrowRight,
      AlertTriangle,
      Banknote,
      TrendingUp,
      TrendingDown,
      PenTool,
      UserCheck
    } from 'lucide-react';
    import { HARDWARE_CHECKLIST, PROCESS_CHECKLIST } from '../constants';
    import { Pharmacy, AuditState, HardwareStatus, VaultCount } from '../types';

    interface AuditWizardProps {
      onCancel: () => void;
      onFinish: (audit: AuditState) => void;
      pharmacies: Pharmacy[];
      onAddPharmacy: (pharmacy: Pharmacy) => void;
    }

    const AuditWizard: React.FC<AuditWizardProps> = ({ onCancel, onFinish, pharmacies }) => {
      const [audit, setAudit] = useState<AuditState>(() => {
        const initialHardware: any = {};
        HARDWARE_CHECKLIST.forEach(item => {
          initialHardware[item.id] = { quantity: item.expected, status: undefined, notes: '' };
        });
        const initialProcess: any = {};
        PROCESS_CHECKLIST.forEach(item => {
          initialProcess[item.id] = { status: undefined, notes: '' };
        });
        return { 
          step: 0, 
          pharmacy: null, 
          inCharge: { nombre: '', apellido: '', cargo: '' }, 
          hardwareAnswers: initialHardware, 
          processAnswers: initialProcess, 
          customerServiceRating: null,
          vaultCount: {
            ves: { system: 0, physical: 0, difference: 0 },
            usd: { system: 0, physical: 0, difference: 0 },
            responsiblePerson: '',
            notes: ''
          }
        };
      });

      const [showValidationErrors, setShowValidationErrors] = useState(false);
      const [errorModal, setErrorModal] = useState<{show: boolean, missingCount: number, section: string}>({ show: false, missingCount: 0, section: '' });

      const validateStep = (currentStep: number): boolean => {
        setShowValidationErrors(true);
        if (currentStep === 2) {
          const missing = HARDWARE_CHECKLIST.filter(item => !audit.hardwareAnswers[item.id]?.status);
          if (missing.length > 0) { setErrorModal({ show: true, missingCount: missing.length, section: 'Hardware' }); return false; }
        }
        if (currentStep === 3) {
          const missing = PROCESS_CHECKLIST.filter(item => !audit.processAnswers[item.id]?.status);
          if (missing.length > 0) { setErrorModal({ show: true, missingCount: missing.length, section: 'Procesos' }); return false; }
          if (!audit.customerServiceRating) { setErrorModal({ show: true, missingCount: 1, section: 'Atención al Cliente' }); return false; }
        }
        if (currentStep === 4) {
          if (!audit.vaultCount?.responsiblePerson) {
             alert("Es obligatorio ingresar el nombre de la persona responsable del ingreso.");
             return false;
          }
          const hasDiff = (audit.vaultCount.usd.difference !== 0 || audit.vaultCount.ves.difference !== 0);
          if (hasDiff && !audit.vaultCount.notes) {
             alert("Debe ingresar una justificación para la diferencia detectada en bóveda.");
             return false;
          }
        }
        setShowValidationErrors(false);
        return true;
      };

      const nextStep = () => { if (validateStep(audit.step)) { setAudit(prev => ({ ...prev, step: prev.step + 1 })); window.scrollTo(0, 0); } };
      const prevStep = () => setAudit(prev => ({ ...prev, step: prev.step - 1 }));
      const handleFinishAudit = () => { if (validateStep(4)) onFinish(audit); };

      const updateVaultField = (currency: 'ves' | 'usd', field: 'system' | 'physical', value: number) => {
        setAudit(prev => {
          if (!prev.vaultCount) return prev;
          const current = prev.vaultCount[currency];
          const updatedCurrency = { ...current, [field]: value };
          updatedCurrency.difference = updatedCurrency.physical - updatedCurrency.system;
          
          return {
            ...prev,
            vaultCount: {
              ...prev.vaultCount,
              [currency]: updatedCurrency
            }
          };
        });
      };

      const renderPharmacySelection = () => (
        <div className="max-w-6xl mx-auto p-8 relative">
          <h2 className="text-4xl font-black text-white tracking-tighter drop-shadow-2xl mb-12 uppercase">Sede a Auditar</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {pharmacies.map(p => (
              <div 
                key={p.id}
                onClick={() => setAudit(prev => ({ ...prev, pharmacy: p, step: 1 }))}
                className="bg-white p-8 rounded-[2rem] border border-white hover:border-orange-500 cursor-pointer transition-all shadow-2xl hover:-translate-y-2 group relative overflow-hidden"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-orange-50 rounded-2xl text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-all shadow-sm">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <ArrowRight className="w-6 h-6 text-slate-200 group-hover:text-orange-500 transition-colors" />
                </div>
                <h3 className="font-black text-slate-800 text-xl mb-1 group-hover:text-orange-600 transition-colors">{p.name}</h3>
                <p className="text-slate-400 text-sm font-medium leading-relaxed mb-6">{p.address}</p>
                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                   <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{p.status}</span>
                   {p.risk && <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${p.risk === 'Alto' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>RIESGO {p.risk.toUpperCase()}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      );

      return (
        <div className="animate-in fade-in duration-700">
          {audit.step === 0 && renderPharmacySelection()}
          {audit.step === 1 && (
            <div className="max-w-2xl mx-auto p-10 mt-10">
              <div className="mb-10 text-center">
                 <h2 className="text-4xl font-black text-white tracking-tighter drop-shadow-2xl uppercase">Datos Operativos</h2>
                 <p className="text-slate-300 mt-2 font-bold uppercase tracking-[0.25em] text-xs">Identificación del responsable</p>
              </div>
              <div className="bg-white rounded-[3rem] shadow-3xl p-12 border border-white">
                <div className="space-y-8">
                  <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Nombres</label><input type="text" value={audit.inCharge.nombre} onChange={e => setAudit(prev => ({...prev, inCharge: {...prev.inCharge, nombre: e.target.value.toUpperCase()}}))} className="w-full p-4 border-2 border-slate-50 bg-slate-50/50 rounded-2xl focus:border-orange-500 outline-none transition-all font-black text-slate-800" /></div>
                  <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Apellidos</label><input type="text" value={audit.inCharge.apellido} onChange={e => setAudit(prev => ({...prev, inCharge: {...prev.inCharge, apellido: e.target.value.toUpperCase()}}))} className="w-full p-4 border-2 border-slate-50 bg-slate-50/50 rounded-2xl focus:border-orange-500 outline-none transition-all font-black text-slate-800" /></div>
                  <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Cargo en Sede</label><input type="text" value={audit.inCharge.cargo} onChange={e => setAudit(prev => ({...prev, inCharge: {...prev.inCharge, cargo: e.target.value}}))} className="w-full p-4 border-2 border-slate-50 bg-slate-50/50 rounded-2xl focus:border-orange-500 outline-none transition-all font-bold text-slate-600" /></div>
                  <button onClick={nextStep} disabled={!audit.inCharge.nombre || !audit.inCharge.apellido} className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl shadow-2xl hover:bg-slate-800 transition-all uppercase tracking-[0.25em] text-[11px] disabled:opacity-30">Iniciar Auditoría</button>
                  <button onClick={() => setAudit(prev => ({ ...prev, step: 0 }))} className="w-full text-slate-300 hover:text-slate-500 text-[10px] font-black uppercase tracking-widest transition-all">Cancelar y Volver</button>
                </div>
              </div>
            </div>
          )}
          {audit.step === 2 && (
            <div className="max-w-5xl mx-auto p-10">
              <div className="flex justify-between items-end mb-10">
                <div>
                   <h2 className="text-4xl font-black text-white tracking-tighter drop-shadow-2xl uppercase">Hardware</h2>
                   <p className="text-slate-300 mt-1 font-bold uppercase tracking-[0.25em] text-[10px]">Paso 01: Evaluación Técnica</p>
                </div>
                <span className="bg-orange-600 text-white text-[10px] font-black px-4 py-2 rounded-xl uppercase tracking-widest shadow-xl">Fase 1 de 4</span>
              </div>
              <div className="space-y-8 bg-white rounded-[3rem] p-12 shadow-3xl border border-white overflow-hidden">
                {Array.from(new Set(HARDWARE_CHECKLIST.map(h => h.category))).map((cat, idx) => (
                  <div key={cat} className={`${idx > 0 ? 'pt-8 border-t border-slate-100' : ''}`}>
                    <h3 className="font-black text-slate-300 uppercase tracking-[0.25em] text-[10px] mb-8 ml-2 flex items-center gap-3"><div className="w-4 h-px bg-slate-200"></div> {cat}</h3>
                    <div className="space-y-6">
                      {HARDWARE_CHECKLIST.filter(item => item.category === cat).map(item => {
                        const ans = audit.hardwareAnswers[item.id] || { quantity: item.expected, status: undefined, notes: '' };
                        const isMissing = showValidationErrors && ans.status === undefined;
                        return (
                          <div key={item.id} className={`p-8 rounded-[2rem] transition-all border-2 ${isMissing ? 'bg-red-50/50 border-red-200' : 'bg-slate-50/50 border-transparent hover:bg-white hover:border-slate-100 hover:shadow-xl'}`}>
                            <div className="flex flex-col lg:flex-row lg:items-start gap-10">
                              <div className="flex-1">
                                 <p className={`font-black text-lg tracking-tight ${isMissing ? 'text-red-700' : 'text-slate-800'}`}>{item.name}</p>
                                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 opacity-60">ID: {item.id} | Esperado: {item.expected}</p>
                                 <div className="flex items-center gap-6 mt-6">
                                    <div className="flex flex-col gap-1.5"><span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Cant.</span><input type="number" className="w-20 p-3 bg-white border-2 border-slate-100 rounded-xl text-center font-black text-slate-700 outline-none focus:border-orange-500 transition-all" value={ans.quantity} onChange={(e) => setAudit(p => ({...p, hardwareAnswers: {...p.hardwareAnswers, [item.id]: {...ans, quantity: parseInt(e.target.value) || 0}}}))} /></div>
                                    <div className="flex-1 flex flex-col gap-1.5"><span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Estado Técnico</span><div className="flex bg-white rounded-xl p-1.5 gap-1.5 border-2 border-slate-100">{(['Operativo', 'Inactivo', 'N/A'] as HardwareStatus[]).map(s => (<button key={s} onClick={() => setAudit(p => ({...p, hardwareAnswers: {...p.hardwareAnswers, [item.id]: {...ans, status: s}}}))} className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${ans.status === s ? s === 'Operativo' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' : s === 'Inactivo' ? 'bg-red-500 text-white shadow-lg shadow-red-200' : 'bg-slate-800 text-white shadow-lg' : 'text-slate-300 hover:text-slate-600 hover:bg-slate-50'}`}>{s}</button>))}</div></div>
                                 </div>
                              </div>
                              <div className="w-full lg:w-1/3 flex flex-col gap-1.5"><span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Observaciones</span><textarea placeholder="Detalle hallazgos..." className="w-full h-32 p-4 bg-white border-2 border-slate-100 rounded-2xl resize-none text-sm font-medium text-slate-600 outline-none focus:border-orange-500 transition-all" value={ans.notes} onChange={(e) => setAudit(p => ({...p, hardwareAnswers: {...p.hardwareAnswers, [item.id]: {...ans, notes: e.target.value}}}))} /></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-end mt-10"><button onClick={nextStep} className="bg-slate-900 text-white px-10 py-5 rounded-2xl font-black uppercase tracking-[0.25em] text-[11px] flex items-center gap-3 shadow-2xl hover:bg-slate-800 transition-all">Siguiente: Protocolos <ArrowRight className="w-5 h-5" /></button></div>
            </div>
          )}
          {audit.step === 3 && (
            <div className="max-w-5xl mx-auto p-10">
              <div className="flex justify-between items-end mb-10">
                <div>
                   <h2 className="text-4xl font-black text-white tracking-tighter drop-shadow-2xl uppercase">Procesos</h2>
                   <p className="text-slate-300 mt-1 font-bold uppercase tracking-[0.25em] text-[10px]">Paso 02: Cumplimiento Normativo</p>
                </div>
                <span className="bg-blue-600 text-white text-[10px] font-black px-4 py-2 rounded-xl uppercase tracking-widest shadow-xl">Fase 2 de 4</span>
              </div>
              <div className="space-y-8 bg-white rounded-[3rem] p-12 shadow-3xl border border-white mb-10">
                {Array.from(new Set(PROCESS_CHECKLIST.map(h => h.category))).map((cat, idx) => (
                  <div key={cat} className={`${idx > 0 ? 'pt-8 border-t border-slate-100' : ''}`}>
                    <h3 className="font-black text-slate-300 uppercase tracking-[0.25em] text-[10px] mb-8 ml-2 flex items-center gap-3"><div className="w-4 h-px bg-slate-200"></div> {cat}</h3>
                    <div className="space-y-6">
                      {PROCESS_CHECKLIST.filter(item => item.category === cat).map(item => {
                        const ans = audit.processAnswers[item.id] || { status: undefined, notes: '' };
                        const isMissing = showValidationErrors && ans.status === undefined;
                        return (
                          <div key={item.id} className={`p-8 rounded-[2.5rem] transition-all border-2 ${isMissing ? 'bg-red-50/50 border-red-200' : 'bg-slate-50/50 border-transparent hover:bg-white hover:border-slate-100 hover:shadow-xl'}`}>
                            <div className="flex flex-col gap-6">
                               <div>
                                  <p className={`font-black text-lg tracking-tight leading-tight ${isMissing ? 'text-red-700' : 'text-slate-800'}`}>{item.text}</p>
                                  <div className="flex items-center gap-2 mt-2 font-black uppercase text-[10px] tracking-widest text-blue-500 bg-blue-50 w-fit px-3 py-1 rounded-full"><Eye className="w-3.5 h-3.5" /> Verificación: {item.verification}</div>
                               </div>
                               <div className="flex flex-col sm:flex-row gap-6">
                                  <div className="bg-white rounded-xl p-1.5 flex gap-1.5 border-2 border-slate-100 self-start">
                                    {(['SI', 'NO', 'N/A'] as const).map(s => (<button key={s} onClick={() => setAudit(p => ({...p, processAnswers: {...p.processAnswers, [item.id]: {...ans, status: s}}}))} className={`px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${ans.status === s ? s === 'SI' ? 'bg-emerald-500 text-white shadow-lg' : s === 'NO' ? 'bg-red-500 text-white shadow-lg' : 'bg-slate-800 text-white' : 'text-slate-300 hover:text-slate-600'}`}>{s}</button>))}
                                  </div>
                                  <input type="text" placeholder="Anotaciones de control..." className="flex-1 p-4 bg-white border-2 border-slate-100 rounded-2xl outline-none focus:border-orange-500 transition-all font-medium text-sm" value={ans.notes} onChange={(e) => setAudit(p => ({...p, processAnswers: {...p.processAnswers, [item.id]: {...ans, notes: e.target.value}}}))} />
                               </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              <div className={`bg-white rounded-[3rem] p-12 border shadow-3xl mb-12 ${showValidationErrors && !audit.customerServiceRating ? 'border-red-400 ring-4 ring-red-100' : 'border-white'}`}>
                 <h3 className="text-xl font-black text-slate-800 mb-2 uppercase tracking-tighter">Atención al Cliente</h3>
                 <p className="text-slate-400 text-sm font-medium mb-8">Nivel de calidad percibido durante la visita.</p>
                 <div className="grid grid-cols-3 gap-6">
                   {(['Bajo', 'Medio', 'Alto'] as const).map(r => (<button key={r} onClick={() => setAudit(p => ({...p, customerServiceRating: r}))} className={`p-10 rounded-[2.5rem] border-4 flex flex-col items-center gap-4 transition-all ${audit.customerServiceRating === r ? r === 'Bajo' ? 'border-red-500 bg-red-50 text-red-600' : r === 'Medio' ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-emerald-500 bg-emerald-50 text-emerald-600' : 'border-slate-50 text-slate-300 bg-slate-50/50 hover:border-slate-200 hover:bg-white'}`}>{r === 'Alto' ? <ThumbsUp className="w-10 h-10" /> : r === 'Bajo' ? <ThumbsDown className="w-10 h-10" /> : <Minus className="w-10 h-10" />}<span className="font-black uppercase tracking-[0.25em] text-[10px]">{r}</span></button>))}
                 </div>
              </div>
              <div className="flex justify-between items-center"><button onClick={prevStep} className="text-white/40 hover:text-white font-black uppercase tracking-widest text-[10px] px-8 py-4 transition-all">Regresar</button><button onClick={nextStep} className="bg-slate-900 text-white px-10 py-5 rounded-2xl font-black uppercase tracking-[0.25em] text-[11px] shadow-2xl hover:bg-slate-800 transition-all flex items-center gap-3">Siguiente: Arqueo Bóveda <ArrowRight className="w-5 h-5" /></button></div>
            </div>
          )}
          {audit.step === 4 && (
            <div className="max-w-5xl mx-auto p-10 animate-in slide-in-from-bottom-6">
              <div className="flex justify-between items-end mb-12">
                <div>
                   <h2 className="text-4xl font-black text-white tracking-tighter drop-shadow-2xl uppercase">Arqueo de Bóveda</h2>
                   <p className="text-slate-300 mt-1 font-bold uppercase tracking-[0.25em] text-[10px]">Paso 03: Validación de Ingresos</p>
                </div>
                <span className="bg-emerald-600 text-white text-[10px] font-black px-6 py-2 rounded-xl uppercase tracking-widest shadow-xl">Fase 3 de 4</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                {/* Panel VES */}
                <div className="bg-white rounded-[3rem] p-10 shadow-3xl border-t-[12px] border-blue-600 relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity"><Banknote className="w-32 h-32 text-blue-900" /></div>
                   <h3 className="text-2xl font-black text-blue-900 mb-8 uppercase tracking-tighter flex items-center gap-3"><Banknote className="w-6 h-6" /> Bolívares (VES)</h3>
                   
                   <div className="space-y-8 relative z-10">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Monto Reportado (Sistema)</label>
                        <input type="number" step="0.01" className="w-full p-5 bg-slate-50 border-2 border-slate-50 rounded-2xl font-black text-2xl text-slate-800 focus:border-blue-500 outline-none transition-all" value={audit.vaultCount?.ves.system} onChange={e => updateVaultField('ves', 'system', parseFloat(e.target.value) || 0)} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Conteo Físico (Auditor)</label>
                        <input type="number" step="0.01" className="w-full p-5 bg-blue-50/50 border-2 border-blue-100 rounded-2xl font-black text-2xl text-blue-700 focus:border-blue-500 outline-none transition-all" value={audit.vaultCount?.ves.physical} onChange={e => updateVaultField('ves', 'physical', parseFloat(e.target.value) || 0)} />
                      </div>
                      <div className={`mt-6 p-6 rounded-3xl border-2 flex items-center justify-between shadow-inner ${audit.vaultCount!.ves.difference === 0 ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
                         <div className="flex items-center gap-3">
                            {audit.vaultCount!.ves.difference >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                            <span className="text-[10px] font-black uppercase tracking-widest">Diferencia Final</span>
                         </div>
                         <span className="text-2xl font-black tracking-tight">{audit.vaultCount!.ves.difference.toFixed(2)} Bs.</span>
                      </div>
                   </div>
                </div>

                {/* Panel USD */}
                <div className="bg-white rounded-[3rem] p-10 shadow-3xl border-t-[12px] border-emerald-500 relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity"><Banknote className="w-32 h-32 text-emerald-900" /></div>
                   <h3 className="text-2xl font-black text-emerald-900 mb-8 uppercase tracking-tighter flex items-center gap-3"><Banknote className="w-6 h-6" /> Dólares (USD)</h3>
                   
                   <div className="space-y-8 relative z-10">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Monto Reportado (Sistema)</label>
                        <input type="number" step="0.01" className="w-full p-5 bg-slate-50 border-2 border-slate-50 rounded-2xl font-black text-2xl text-slate-800 focus:border-emerald-500 outline-none transition-all" value={audit.vaultCount?.usd.system} onChange={e => updateVaultField('usd', 'system', parseFloat(e.target.value) || 0)} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Conteo Físico (Auditor)</label>
                        <input type="number" step="0.01" className="w-full p-5 bg-emerald-50/50 border-2 border-emerald-100 rounded-2xl font-black text-2xl text-emerald-700 focus:border-emerald-500 outline-none transition-all" value={audit.vaultCount?.usd.physical} onChange={e => updateVaultField('usd', 'physical', parseFloat(e.target.value) || 0)} />
                      </div>
                      <div className={`mt-6 p-6 rounded-3xl border-2 flex items-center justify-between shadow-inner ${audit.vaultCount!.usd.difference === 0 ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
                         <div className="flex items-center gap-3">
                            {audit.vaultCount!.usd.difference >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                            <span className="text-[10px] font-black uppercase tracking-widest">Diferencia Final</span>
                         </div>
                         <span className="text-2xl font-black tracking-tight">{audit.vaultCount!.usd.difference.toFixed(2)} $</span>
                      </div>
                   </div>
                </div>
              </div>

              <div className="bg-white rounded-[3rem] p-10 shadow-3xl border border-white space-y-10">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Encargado de Control de Ingresos (Validación)</label>
                      <div className="relative">
                        <UserCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-orange-600" />
                        <input type="text" className="w-full p-5 pl-14 bg-slate-50 border-2 border-slate-50 rounded-2xl font-black text-slate-800 focus:border-orange-500 outline-none transition-all" placeholder="NOMBRE COMPLETO..." value={audit.vaultCount?.responsiblePerson} onChange={e => setAudit(p => ({...p, vaultCount: {...p.vaultCount!, responsiblePerson: e.target.value.toUpperCase()}}))} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Observaciones de Cuadre</label>
                      <div className="relative">
                        <PenTool className="absolute left-4 top-5 w-6 h-6 text-slate-300" />
                        <textarea className="w-full h-32 p-5 pl-14 bg-slate-50 border-2 border-slate-50 rounded-3xl font-medium text-slate-700 outline-none focus:border-orange-500 resize-none transition-all" placeholder="Explique diferencias detectadas o incidencias..." value={audit.vaultCount?.notes} onChange={e => setAudit(p => ({...p, vaultCount: {...p.vaultCount!, notes: e.target.value}}))} />
                      </div>
                    </div>
                 </div>
              </div>

              <div className="flex justify-between items-center mt-12"><button onClick={prevStep} className="text-white/40 hover:text-white font-black uppercase tracking-widest text-[10px] px-8 py-4 transition-all">Regresar</button><button onClick={handleFinishAudit} className="bg-orange-600 text-white px-10 py-5 rounded-2xl font-black uppercase tracking-[0.25em] text-[11px] shadow-2xl hover:bg-orange-500 transition-all transform active:scale-95 flex items-center gap-3">Generar Reporte Final <ArrowRight className="w-5 h-5" /></button></div>
            </div>
          )}
          {errorModal.show && (
            <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-[110] flex items-center justify-center p-6 animate-in zoom-in-95 duration-200"><div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-3xl p-10 text-center border border-white/20"><div className="w-20 h-20 bg-red-100 rounded-[2rem] flex items-center justify-center mb-6 mx-auto text-red-600 shadow-inner"><AlertTriangle className="w-10 h-10" /></div><h3 className="text-2xl font-black text-slate-900 tracking-tighter mb-2">Evaluación Incompleta</h3><p className="text-slate-500 font-medium text-sm mb-8 leading-relaxed">Faltan <span className="font-black text-red-600">{errorModal.missingCount}</span> puntos críticos por calificar en la sección de <span className="font-black text-slate-800">{errorModal.section}</span>.</p><button onClick={() => setErrorModal({ ...errorModal, show: false })} className="w-full bg-slate-900 text-white font-black py-4 rounded-xl shadow-xl uppercase tracking-widest text-[10px]">Revisar Puntos</button></div></div>
          )}
        </div>
      );
    };

    export default AuditWizard;