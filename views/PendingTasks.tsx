
import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  ArrowRight,
  X,
  Trash2,
  Calendar,
  MoreVertical,
  Building2,
  MapPin,
  ClipboardCheck,
  ChevronDown,
  LayoutGrid,
  Zap,
  Activity,
  UserCheck
} from 'lucide-react';
import { Pharmacy, PendingRecord } from '../types';

interface PendingTasksProps {
  pharmacies: Pharmacy[];
  records: PendingRecord[];
  onAdd: (record: PendingRecord) => void;
  onUpdateStatus: (id: string, status: 'Pendiente' | 'En Proceso' | 'Solventado') => void;
  onDelete: (id: string) => void;
}

const PendingTasks: React.FC<PendingTasksProps> = ({ 
  pharmacies, 
  records, 
  onAdd, 
  onUpdateStatus,
  onDelete
}) => {
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'Pendiente' | 'Solventado'>('Pendiente');
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ id: string; title: string } | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    locationType: 'pharmacy' as 'pharmacy' | 'other',
    pharmacyId: '',
    customLocation: '',
    title: '',
    description: '',
    priority: 'Media' as 'Alta' | 'Media' | 'Baja',
    actionDate: ''
  });

  const confirmDelete = () => {
    if (deleteConfirmation) {
      onDelete(deleteConfirmation.id);
      setDeleteConfirmation(null);
    }
  };

  const filteredRecords = records.filter(r => {
    const locName = r.pharmacyId 
      ? pharmacies.find(p => p.id === r.pharmacyId)?.name || '' 
      : r.customLocation || 'Gestión General';
      
    const matchesSearch = 
      r.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      r.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      locName.toLowerCase().includes(searchTerm.toLowerCase());
      
    // Logic: "Pendiente" tab shows both Pendiente and En Proceso. "Solventado" only Solventado.
    const matchesStatus = filterStatus === 'Solventado' 
      ? r.status === 'Solventado' 
      : (r.status === 'Pendiente' || r.status === 'En Proceso');
    
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    if (a.status === b.status) {
      const pMap = { 'Alta': 3, 'Media': 2, 'Baja': 1 };
      return pMap[b.priority] - pMap[a.priority];
    }
    return a.status === 'Pendiente' ? -1 : 1;
  });

  const handleSave = () => {
    if (formData.locationType === 'pharmacy' && !formData.pharmacyId) {
      alert("Seleccione una farmacia del listado.");
      return;
    }
    if (formData.locationType === 'other' && !formData.customLocation) {
      alert("Indique el nombre del lugar (Oficina, Almacén, etc.).");
      return;
    }
    if (!formData.title) {
      alert("El título del hallazgo es obligatorio.");
      return;
    }

    const newRecord: PendingRecord = {
      id: `task-${Date.now()}`,
      pharmacyId: formData.locationType === 'pharmacy' ? formData.pharmacyId : undefined,
      customLocation: formData.locationType === 'other' ? formData.customLocation : undefined,
      date: new Date().toLocaleDateString('es-ES'),
      actionDate: formData.actionDate || undefined,
      title: formData.title,
      description: formData.description,
      priority: formData.priority,
      status: 'Pendiente'
    };

    onAdd(newRecord);
    setShowModal(false);
    setFormData({ 
      locationType: 'pharmacy', 
      pharmacyId: '', 
      customLocation: '', 
      title: '', 
      description: '', 
      priority: 'Media',
      actionDate: ''
    });
  };

  const getPriorityStyle = (p: string) => {
    switch(p) {
      case 'Alta': return 'text-red-700 bg-red-50 border-red-100';
      case 'Media': return 'text-orange-700 bg-orange-50 border-orange-100';
      case 'Baja': return 'text-blue-700 bg-blue-50 border-blue-100';
      default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto p-10 animate-in fade-in duration-700 pb-20">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-white/10 backdrop-blur-md rounded-[1.25rem] text-white shadow-2xl border border-white/20">
              <ClipboardCheck className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-4xl font-black text-white tracking-tighter drop-shadow-md">Pendientes</h2>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
                <p className="text-slate-300 font-bold uppercase tracking-[0.2em] text-[10px]">Gestión de Requerimientos y Sedes</p>
              </div>
            </div>
          </div>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[11px] flex items-center gap-3 shadow-xl hover:bg-white/20 transition-all transform active:scale-95"
        >
          <Plus className="w-5 h-5 text-orange-400" />
          Registrar Hallazgo
        </button>
      </div>

      {/* FILTERS BAR */}
      <div className="flex flex-col lg:flex-row gap-6 mb-10 items-center">
        <div className="bg-white/80 backdrop-blur-md p-1.5 rounded-2xl flex border border-white/20 shadow-sm w-full lg:w-fit">
          {(['Pendiente', 'Solventado'] as const).map(f => (
            <button 
              key={f}
              onClick={() => setFilterStatus(f)}
              className={`flex-1 lg:flex-none px-8 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
                filterStatus === f ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {f === 'Pendiente' ? 'En Curso / Activos' : 'Solventados'}
            </button>
          ))}
        </div>

        <div className="relative flex-1 w-full group">
          <Search className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Filtrar por sede, título o detalle..."
            className="w-full pl-14 pr-6 py-4 border border-white/20 rounded-[1.5rem] outline-none focus:ring-4 focus:ring-orange-500/10 bg-white shadow-sm transition-all font-medium text-slate-800 placeholder:text-slate-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* LISTING */}
      <div className="grid grid-cols-1 gap-6">
        {filteredRecords.map(record => {
           const pharmacy = pharmacies.find(p => p.id === record.pharmacyId);
           const locationDisplay = pharmacy ? pharmacy.name : (record.customLocation || 'Gestión General');
           const isManualLoc = !record.pharmacyId;

           return (
             <div 
               key={record.id} 
               className={`bg-white rounded-[2rem] border border-white shadow-xl shadow-black/10 transition-all flex flex-col md:flex-row overflow-hidden group ${
                 record.status === 'Solventado' ? 'opacity-60 bg-slate-50/50 grayscale-[0.5]' : 'hover:shadow-2xl hover:-translate-y-0.5'
               }`}
             >
               <div className={`w-full md:w-2 ${
                 record.status === 'Solventado' ? 'bg-emerald-500' : 
                 record.status === 'En Proceso' ? 'bg-indigo-500' : 'bg-orange-500'
               }`}></div>

               <div className="p-8 flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-lg border shadow-sm ${getPriorityStyle(record.priority)}`}>
                        {record.priority}
                      </span>
                      <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <Calendar className="w-3.5 h-3.5" />
                        {record.date}
                      </div>
                      
                      {/* Nombre del Responsable añadido para perspectiva de Gerencia/Líder */}
                      <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest border-l pl-3 border-slate-100">
                         <UserCheck className="w-3.5 h-3.5 text-orange-500" />
                         Responsable: <span className="text-slate-600">{record.createdBy || 'Sistema'}</span>
                      </div>

                      {record.actionDate && (
                        <div className="flex items-center gap-2 text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100 uppercase tracking-widest">
                          <Clock className="w-3.5 h-3.5" />
                          Planificado: {record.actionDate}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                       <button 
                         onClick={() => setDeleteConfirmation({ id: record.id, title: record.title })}
                         className="text-slate-300 hover:text-red-500 p-2 hover:bg-red-50 rounded-xl transition-all"
                       >
                         <Trash2 className="w-5 h-5" />
                       </button>
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                       <div className={`p-2 rounded-xl border ${isManualLoc ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-orange-50 border-orange-100 text-orange-600'}`}>
                          {isManualLoc ? <LayoutGrid className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
                       </div>
                       <span className={`text-sm font-black uppercase tracking-tight ${isManualLoc ? 'text-slate-500' : 'text-orange-600'}`}>
                         {locationDisplay}
                       </span>
                    </div>
                    <h3 className={`text-2xl font-black tracking-tight mb-2 ${record.status === 'Solventado' ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                      {record.title}
                    </h3>
                    <p className="text-slate-500 text-base leading-relaxed font-medium">
                      {record.description || 'Sin observaciones adicionales registradas.'}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 pt-6 border-t border-slate-50">
                     <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mr-auto">Estatus Operativo</p>
                     
                     <div className="bg-slate-50 p-1.5 rounded-2xl flex gap-2 border border-slate-100">
                        {(['Pendiente', 'En Proceso', 'Solventado'] as const).map(s => (
                          <button 
                            key={s}
                            onClick={() => onUpdateStatus(record.id, s)}
                            className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${
                              record.status === s 
                                ? s === 'Solventado' ? 'bg-emerald-600 text-white shadow-lg' : 
                                  s === 'En Proceso' ? 'bg-indigo-600 text-white shadow-lg' : 
                                  'bg-orange-600 text-white shadow-lg'
                                : 'text-slate-400 hover:text-slate-600 hover:bg-white hover:shadow-sm'
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                     </div>
                  </div>
               </div>
             </div>
           );
        })}

        {filteredRecords.length === 0 && (
          <div className="py-32 text-center bg-white/5 backdrop-blur-md rounded-[3rem] border-2 border-dashed border-white/10">
            <div className="bg-white/10 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
              <ClipboardCheck className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-black text-white mb-2 tracking-tight">Sin Requerimientos</h3>
            <p className="text-slate-400 font-medium max-w-sm mx-auto">No hay tareas {filterStatus === 'Solventado' ? 'solventadas' : 'pendientes'} que coincidan con los parámetros actuales.</p>
          </div>
        )}
      </div>

      {/* MODAL: NEW PENDING - ACTUALIZADO CON SCROLL Y ALTURA CONTROLADA */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-[100] flex items-center justify-center p-6">
          <div className="bg-white rounded-[3.5rem] w-full max-w-2xl shadow-3xl animate-in zoom-in-95 duration-300 overflow-hidden border border-white/20 flex flex-col max-h-[95vh]">
            <div className="p-12 border-b border-slate-50 flex justify-between items-center bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-6">
                <div className="p-5 bg-orange-600 rounded-[2rem] text-white shadow-2xl shadow-orange-200">
                  <Zap className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-3xl font-black text-slate-900 tracking-tighter">Nuevo Hallazgo</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Definición de Acción Correctiva</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="p-4 hover:bg-white rounded-full transition-all">
                <X className="w-7 h-7 text-slate-400" />
              </button>
            </div>
            
            <div className="p-12 space-y-10 overflow-y-auto flex-1 custom-scrollbar">
              {/* Location Linking Strategy */}
              <div className="space-y-5">
                 <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">Vinculación Territorial</label>
                 <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => setFormData({...formData, locationType: 'pharmacy'})}
                      className={`p-5 rounded-[1.5rem] border-2 transition-all flex flex-col items-center gap-2 ${
                        formData.locationType === 'pharmacy' ? 'border-indigo-600 bg-indigo-50/30' : 'border-slate-50 bg-slate-50/50 text-slate-400 hover:border-slate-200'
                      }`}
                    >
                       <Building2 className={`w-6 h-6 ${formData.locationType === 'pharmacy' ? 'text-indigo-600' : 'text-slate-300'}`} />
                       <span className={`text-[10px] font-black uppercase ${formData.locationType === 'pharmacy' ? 'text-indigo-700' : ''}`}>Sede / Farmacia</span>
                    </button>
                    <button 
                      onClick={() => setFormData({...formData, locationType: 'other'})}
                      className={`p-5 rounded-[1.5rem] border-2 transition-all flex flex-col items-center gap-2 ${
                        formData.locationType === 'other' ? 'border-orange-600 bg-orange-50/30' : 'border-slate-50 bg-slate-50/50 text-slate-400 hover:border-slate-200'
                      }`}
                    >
                       <LayoutGrid className={`w-6 h-6 ${formData.locationType === 'other' ? 'text-orange-600' : 'text-slate-300'}`} />
                       <span className={`text-[10px] font-black uppercase ${formData.locationType === 'other' ? 'text-orange-700' : ''}`}>Otro (Almacén/Oficina)</span>
                    </button>
                 </div>

                 {formData.locationType === 'pharmacy' ? (
                    <div className="animate-in slide-in-from-top-2 duration-300">
                       <div className="relative">
                          <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-500" />
                          <select 
                            className="w-full p-5 pl-14 border-2 border-slate-100 rounded-[1.5rem] outline-none focus:border-indigo-600 bg-white font-black text-slate-800 appearance-none transition-all cursor-pointer"
                            value={formData.pharmacyId}
                            onChange={(e) => setFormData({...formData, pharmacyId: e.target.value})}
                          >
                            <option value="">Seleccione Sede...</option>
                            {pharmacies.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                          </select>
                          <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 pointer-events-none" />
                       </div>
                    </div>
                 ) : (
                    <div className="animate-in slide-in-from-top-2 duration-300">
                       <div className="relative">
                          <Activity className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-orange-500" />
                          <input 
                            type="text" 
                            placeholder="Ej. Almacén Principal, Traslado, Corporativo..."
                            className="w-full p-5 pl-14 border-2 border-slate-100 rounded-[1.5rem] outline-none focus:border-orange-600 bg-white font-black text-slate-800 transition-all"
                            value={formData.customLocation}
                            onChange={(e) => setFormData({...formData, customLocation: e.target.value})}
                          />
                       </div>
                    </div>
                 )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                 <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-4 ml-1">Título del Requerimiento</label>
                    <div className="relative">
                       <Zap className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-orange-500" />
                       <input 
                         type="text"
                         placeholder="Resumen corto de la tarea"
                         className="w-full p-5 pl-14 border-2 border-slate-100 rounded-[1.5rem] outline-none focus:border-indigo-600 font-black text-slate-900 transition-all placeholder:text-slate-200"
                         value={formData.title}
                         onChange={(e) => setFormData({...formData, title: e.target.value})}
                       />
                    </div>
                 </div>
                 <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-4 ml-1">Prioridad</label>
                    <div className="bg-slate-50 p-1.5 rounded-[1.5rem] flex gap-2 border border-slate-100">
                       {(['Baja', 'Media', 'Alta'] as const).map(p => (
                         <button
                           key={p}
                           onClick={() => setFormData({...formData, priority: p})}
                           className={`flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                             formData.priority === p 
                               ? p === 'Alta' ? 'bg-red-600 text-white shadow-lg' : 
                                 p === 'Media' ? 'bg-orange-50 text-white shadow-lg' : 
                                 'bg-blue-600 text-white shadow-lg'
                               : 'text-slate-400 hover:text-slate-800'
                           }`}
                         >
                           {p}
                         </button>
                       ))}
                    </div>
                 </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-4 ml-1">Fecha de Acción (Opcional - Integra al Calendario)</label>
                <div className="relative">
                   <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                   <input 
                     type="date"
                     className="w-full p-5 pl-14 border-2 border-slate-100 rounded-[1.5rem] outline-none focus:border-indigo-600 bg-slate-50 font-black text-slate-800 transition-all"
                     value={formData.actionDate}
                     onChange={(e) => setFormData({...formData, actionDate: e.target.value})}
                   />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-4 ml-1">Descripción Técnica</label>
                <textarea 
                  className="w-full p-8 border-2 border-slate-100 rounded-[2.5rem] h-40 outline-none focus:border-indigo-600 resize-none font-medium text-slate-600 transition-all text-lg"
                  placeholder="Detalle los pormenores y pasos a seguir..."
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>
            </div>

            <div className="p-12 bg-slate-50 border-t border-slate-100 flex gap-8 shrink-0">
              <button 
                onClick={() => setShowModal(false)}
                className="flex-1 py-5 text-slate-500 font-black uppercase tracking-[0.25em] text-[11px] hover:bg-slate-100 rounded-[1.5rem] transition-all"
              >
                Cerrar
              </button>
              <button 
                onClick={handleSave}
                className="flex-[2] bg-indigo-600 hover:bg-indigo-700 text-white py-5 rounded-[1.5rem] font-black uppercase tracking-[0.25em] text-[11px] shadow-3xl shadow-indigo-600/30 transition-all transform active:scale-95"
              >
                Integrar al Control
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {deleteConfirmation && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-[110] flex items-center justify-center p-6">
          <div className="bg-white rounded-[3rem] w-full max-w-md p-10 shadow-3xl animate-in zoom-in-95 duration-200 text-center border border-white/20">
             <div className="w-20 h-20 bg-red-100 rounded-[2rem] flex items-center justify-center mb-6 mx-auto text-red-600 shadow-inner">
                <Trash2 className="w-10 h-10" />
             </div>
             <h3 className="text-3xl font-black text-slate-900 tracking-tighter mb-3">¿Eliminar Tarea?</h3>
             <p className="text-slate-500 font-medium mb-10">Estás por remover permanentemente "<strong>{deleteConfirmation.title}</strong>".</p>
             
             <div className="flex gap-4">
                <button 
                  onClick={() => setDeleteConfirmation(null)}
                  className="flex-1 py-4 rounded-2xl border-2 border-slate-100 text-slate-500 font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 transition-all"
                >
                  Regresar
                </button>
                <button 
                  onClick={confirmDelete}
                  className="flex-1 py-4 rounded-2xl bg-red-600 text-white font-black uppercase tracking-widest text-[10px] shadow-xl shadow-red-200 transition-all transform active:scale-95"
                >
                  Eliminar Registro
                </button>
             </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default PendingTasks;
