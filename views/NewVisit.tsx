import React, { useState } from 'react';
import { 
  MapPin, 
  Calendar, 
  FileText, 
  Save, 
  X, 
  Briefcase, 
  Navigation
} from 'lucide-react';
import { Pharmacy, ManagementVisitRecord } from '../types';

interface NewVisitProps {
  pharmacies: Pharmacy[];
  onCancel: () => void;
  onSave: (record: ManagementVisitRecord) => void;
}

const NewVisit: React.FC<NewVisitProps> = ({ pharmacies, onCancel, onSave }) => {
  const [formData, setFormData] = useState({
    pharmacyId: '',
    customLocation: '', // Para sedes fuera de lista
    date: new Date().toISOString().split('T')[0],
    reason: 'Supervisión Operativa',
    customReason: '', // Para actividades personalizadas
    notes: ''
  });

  const REASONS = [
    'Supervisión Operativa',
    'Revisión de Bóveda',
    'Auditoría de Procesos',
    'Incidencia de Seguridad',
    'Capacitación de Personal',
    'Reunión Gerencial',
    'Entrega de Insumos',
    'Levantamiento de CCTV',
    'OTRA ACTIVIDAD' // Opción gatillo
  ];

  const handleSubmit = () => {
    // Validaciones
    if (!formData.pharmacyId) return alert("Por favor seleccione una sede o ubicación.");
    if (formData.pharmacyId === 'external' && !formData.customLocation.trim()) return alert("Por favor especifique el nombre de la ubicación externa.");
    if (formData.reason === 'OTRA ACTIVIDAD' && !formData.customReason.trim()) return alert("Por favor especifique el nombre de la actividad.");

    // Construcción inteligente del registro
    const isExternal = formData.pharmacyId === 'external';
    const isCustomReason = formData.reason === 'OTRA ACTIVIDAD';

    // Si es externa, no mandamos ID, mandamos un objeto farmacia "mock" con el nombre manual
    const finalPharmacyData = isExternal 
      ? { name: formData.customLocation.toUpperCase(), zone: 'Externa/No Registrada' }
      : undefined; // Si es interna, App.tsx lo resolverá por el ID

    const visitRecord: any = {
      id: `visit-${Date.now()}`,
      pharmacyId: isExternal ? null : formData.pharmacyId,
      pharmacy: finalPharmacyData, // Guardamos el nombre manual aquí si aplica
      date: formData.date, // Formato YYYY-MM-DD para compatibilidad
      reason: isCustomReason ? formData.customReason.toUpperCase() : formData.reason,
      notes: formData.notes
    };

    onSave(visitRecord);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-[100] flex flex-col items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-300">
      
      {/* ENCABEZADO CORREGIDO (Estilo Xana Pro - Texto Blanco) */}
      <div className="w-full max-w-2xl mb-8 flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-black text-white tracking-tighter uppercase drop-shadow-md leading-none">
            Registrar Visita
          </h2>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.2em] mt-2">
            Bitácora de Gestión Diaria
          </p>
        </div>
        <button 
          onClick={onCancel} 
          className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all backdrop-blur-md border border-white/10"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl border border-white/20 overflow-hidden">
        <div className="p-8 md:p-10 space-y-6">
          
          {/* SELECCIÓN DE SEDE / UBICACIÓN */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Sede o Ubicación</label>
            <div className="relative group">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
              <select 
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-orange-500 font-bold text-slate-700 appearance-none transition-all cursor-pointer"
                value={formData.pharmacyId}
                onChange={(e) => setFormData({...formData, pharmacyId: e.target.value})}
              >
                <option value="">Seleccionar Ubicación...</option>
                <option value="external">📍 OTRA SEDE / EXTERNA</option>
                <optgroup label="Farmacias Registradas">
                  {pharmacies.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </optgroup>
              </select>
            </div>
            
            {/* INPUT CONDICIONAL PARA UBICACIÓN EXTERNA */}
            {formData.pharmacyId === 'external' && (
              <div className="mt-3 animate-in fade-in slide-in-from-top-2">
                <div className="relative group">
                  <Navigation className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-orange-500" />
                  <input 
                    type="text" 
                    placeholder="Escriba el nombre de la sede o lugar..." 
                    className="w-full pl-12 pr-4 py-3 bg-orange-50 border-2 border-orange-100 rounded-2xl outline-none focus:border-orange-500 font-bold text-slate-800 placeholder-slate-400 transition-all"
                    value={formData.customLocation}
                    onChange={(e) => setFormData({...formData, customLocation: e.target.value})}
                    autoFocus
                  />
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* FECHA */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Fecha</label>
              <div className="relative group">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                <input 
                  type="date" 
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-orange-500 font-bold text-slate-700 transition-all"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                />
              </div>
            </div>

            {/* SELECCIÓN DE ACTIVIDAD */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Motivo de Visita</label>
              <div className="relative group">
                <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                <select 
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-orange-500 font-bold text-slate-700 appearance-none transition-all cursor-pointer"
                  value={formData.reason}
                  onChange={(e) => setFormData({...formData, reason: e.target.value})}
                >
                  {REASONS.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* INPUT CONDICIONAL PARA ACTIVIDAD PERSONALIZADA */}
          {formData.reason === 'OTRA ACTIVIDAD' && (
            <div className="animate-in fade-in slide-in-from-top-2">
               <label className="block text-[10px] font-black text-orange-400 uppercase tracking-widest mb-2 ml-1">Especifique Actividad</label>
              <input 
                type="text" 
                placeholder="Describa la actividad realizada..." 
                className="w-full px-6 py-4 bg-blue-50 border-2 border-blue-100 rounded-2xl outline-none focus:border-blue-500 font-bold text-slate-800 placeholder-slate-400 transition-all"
                value={formData.customReason}
                onChange={(e) => setFormData({...formData, customReason: e.target.value})}
                autoFocus
              />
            </div>
          )}

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Observaciones / Resultados</label>
            <div className="relative group">
              <FileText className="absolute left-4 top-5 w-5 h-5 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
              <textarea 
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-orange-500 font-medium text-slate-700 resize-none h-32 transition-all"
                placeholder="Describa brevemente los hallazgos o acuerdos..."
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
              ></textarea>
            </div>
          </div>

          <div className="pt-4 flex gap-4">
            <button 
              onClick={onCancel}
              className="flex-1 py-4 rounded-2xl border-2 border-slate-100 font-black text-slate-500 hover:bg-slate-50 transition-colors uppercase text-xs tracking-widest"
            >
              Cancelar
            </button>
            <button 
              onClick={handleSubmit}
              className="flex-1 py-4 rounded-2xl bg-slate-900 text-white font-black hover:bg-slate-800 transition-all shadow-xl uppercase text-xs tracking-widest flex items-center justify-center gap-2 transform active:scale-95"
            >
              <Save className="w-4 h-4" /> Registrar Visita
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default NewVisit;
