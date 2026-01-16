
import React, { useState } from 'react';
import { 
  Briefcase, 
  MapPin, 
  ArrowRight,
  Plus
} from 'lucide-react';
import { Pharmacy, ManagementVisitRecord } from '../types';

interface NewVisitProps {
  pharmacies: Pharmacy[];
  onSave: (record: ManagementVisitRecord) => void;
  onCancel: () => void;
}

const NewVisit: React.FC<NewVisitProps> = ({ pharmacies, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    pharmacyId: '',
    type: 'Investigación' as 'Gestión' | 'Reunión' | 'Incidente' | 'Investigación' | 'Otra',
    notes: ''
  });

  const handleSubmit = () => {
    if (!formData.pharmacyId) {
      alert("Por favor seleccione una farmacia.");
      return;
    }
    
    onSave({
      id: `mgmt-${Date.now()}`,
      pharmacyId: formData.pharmacyId,
      date: new Date().toLocaleDateString('es-ES'),
      type: formData.type,
      notes: formData.notes
    });
  };

  return (
    <div className="max-w-2xl mx-auto p-10 mt-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="mb-12 text-center">
        <div className="w-20 h-20 bg-white/10 backdrop-blur-xl rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-white/20 shadow-2xl">
          <Briefcase className="w-10 h-10 text-orange-400" />
        </div>
        <h2 className="text-4xl font-black text-white tracking-tighter drop-shadow-2xl uppercase">Nueva Visita</h2>
        <p className="text-slate-300 mt-2 font-bold uppercase tracking-[0.25em] text-[10px]">Gestión Situacional de Sede</p>
      </div>

      <div className="bg-white rounded-[3rem] shadow-3xl border border-white overflow-hidden">
        <div className="p-12 space-y-8">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Farmacia Destino</label>
            <div className="relative">
              <MapPin className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-orange-500" />
              <select 
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none focus:border-orange-500 transition-all font-black text-slate-800 appearance-none"
                value={formData.pharmacyId}
                onChange={(e) => setFormData({...formData, pharmacyId: e.target.value})}
              >
                <option value="">SELECCIONE UNA SEDE...</option>
                {pharmacies.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-1">Propósito de la Gestión</label>
            <div className="grid grid-cols-2 gap-3">
              {['Investigación', 'Gestión', 'Reunión', 'Incidente', 'Otra'].map((type) => (
                <div 
                  key={type}
                  onClick={() => setFormData({...formData, type: type as any})}
                  className={`cursor-pointer p-5 rounded-2xl border-2 flex items-center justify-between transition-all ${
                    formData.type === type 
                      ? 'bg-orange-50 border-orange-500 text-orange-800' 
                      : 'bg-white border-slate-50 text-slate-400 hover:border-slate-200'
                  }`}
                >
                  <span className="text-[10px] font-black uppercase tracking-widest">{type}</span>
                  {formData.type === type && <div className="w-2.5 h-2.5 rounded-full bg-orange-600 shadow-lg shadow-orange-200"></div>}
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Detalle de la Operación</label>
            <textarea 
              className="w-full h-40 p-6 bg-slate-50 border-2 border-slate-50 rounded-[2rem] outline-none focus:border-orange-500 resize-none text-slate-600 font-medium"
              placeholder="Describa el alcance, hallazgos y resoluciones de la visita técnica..."
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
            />
          </div>
        </div>

        <div className="p-10 bg-slate-50/50 border-t border-slate-100 flex gap-6">
          <button 
            onClick={onCancel}
            className="flex-1 py-4 text-slate-400 font-black uppercase tracking-widest text-[10px] hover:text-slate-600 transition-colors"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSubmit}
            className="flex-[2] bg-slate-900 text-white py-4 rounded-xl font-black uppercase tracking-[0.25em] text-[10px] shadow-2xl hover:bg-slate-800 transition-all flex items-center justify-center gap-3 transform active:scale-95"
          >
            <Plus className="w-5 h-5" />
            Integrar a Bitácora
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewVisit;
