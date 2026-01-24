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
    <div className="max-w-2xl mx-auto p-6 animate-in slide-in-from-bottom-4 duration-500">
      
      {/* --- AQUÍ ESTÁ EL CAMBIO DE COLOR --- */}
      <div className="flex items-center justify-between mb-8">
        <div>
          {/* Título en BLANCO (text-white) */}
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Registrar Visita</h2>
          {/* Subtítulo en GRIS CLARO (text-slate-400) */}
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Bitácora de Gestión Diaria</p>
        </div>
        {/* Botón X en BLANCO con fondo translúcido */}
        <button onClick={onCancel} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white hover:text-white/80">
          <X className="w-6 h-6" />
        </button>
      </div>
      {/* ----------------------------------- */}

      <div className="bg-white rounded-[2rem] p-8 shadow-2xl border border-white">
        <div className="space-y-6">
          
          {/* SELECCIÓN DE SEDE / UBICACIÓN */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Sede o Ubicación</label>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <select 
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-orange-500 font-bold text-slate-700 appearance-none"
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
                <div className="relative">
                  <Navigation className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-orange-500" />
                  <input 
                    type="text" 
                    placeholder="Escriba el nombre de la sede o lugar..." 
                    className="w-full pl-12 pr-4 py-3 bg-orange-50 border border-orange-100 rounded-xl outline-none focus:border-orange-500 font-bold text-slate-800 placeholder-slate-400"
                    value={formData.customLocation}
                    onChange={(e) => setFormData({...formData, customLocation: e.target.value})}
                    autoFocus
                  />
                </div>
              </div>
            )}
          </div>

          {/* FECHA (Sin hora) */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Fecha</label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="date" 
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-orange-500 font-bold text-slate-700"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
              />
            </div>
          </div>

          {/* SELECCIÓN DE ACTIVIDAD */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Motivo de Visita</label>
            <div className="relative">
              <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <select 
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-orange-500 font-bold text-slate-700 appearance-none"
                value={formData.reason}
                onChange={(e) => setFormData({...formData, reason: e.target.value})}
              >
                {REASONS.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            {/* INPUT CONDICIONAL PARA ACTIVIDAD PERSONALIZADA */}
            {formData.reason === 'OTRA ACTIVIDAD' && (
              <div className="mt-3 animate-in fade-in slide-in-from-top-2">
                <input 
                  type="text" 
                  placeholder="Especifique la actividad realizada..." 
                  className="w-full px-4 py-3 bg-blue-50 border border-blue-100 rounded-xl outline-none focus:border-blue-500 font-bold text-slate-800 placeholder-slate-400"
                  value={formData.customReason}
                  onChange={(e) => setFormData({...formData, customReason: e.target.value})}
                  autoFocus
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Observaciones / Resultados</label>
            <div className="relative">
              <FileText className="absolute left-4 top-4 w-5 h-5 text-slate-400" />
              <textarea 
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-orange-500 font-medium text-slate-700 resize-none h-32"
                placeholder="Describa brevemente los hallazgos o acuerdos..."
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
              ></textarea>
            </div>
          </div>

          <div className="pt-4 flex gap-4">
            <button 
              onClick={onCancel}
              className="flex-1 py-4 rounded-xl border-2 border-slate-100 font-bold text-slate-600 hover:bg-slate-50 transition-colors uppercase text-xs tracking-widest"
            >
              Cancelar
            </button>
            <button 
              onClick={handleSubmit}
              className="flex-1 py-4 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-colors shadow-lg uppercase text-xs tracking-widest flex items-center justify-center gap-2"
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
