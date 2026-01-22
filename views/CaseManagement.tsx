import React, { useState } from 'react';
import { 
  Briefcase, 
  Plus, 
  Search, 
  MapPin, 
  Calendar, 
  User, 
  MessageSquare, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Building2,
  Truck,
  MoreHorizontal,
  FileText,
  ArrowLeft
} from 'lucide-react';
import { Pharmacy, CaseRecord, CaseTimelineEntry } from '../types';

interface CaseManagementProps {
  pharmacies: Pharmacy[];
  cases: CaseRecord[];
  onAddCase: (newCase: CaseRecord) => void;
  onUpdateCase: (updatedCase: CaseRecord) => void;
  currentUser: any;
}

const CaseManagement: React.FC<CaseManagementProps> = ({ 
  pharmacies, 
  cases = [], 
  onAddCase, 
  onUpdateCase,
  currentUser 
}) => {
  const [view, setView] = useState<'list' | 'new' | 'detail'>('list');
  const [selectedCase, setSelectedCase] = useState<CaseRecord | null>(null);
  
  // Filtros
  const [filterStatus, setFilterStatus] = useState<'Activos' | 'Cerrados'>('Activos');
  const [searchTerm, setSearchTerm] = useState('');

  // Formulario Nuevo Caso
  const [formData, setFormData] = useState<Partial<CaseRecord>>({
    priority: 'Media',
    channel: 'WhatsApp',
    locationType: 'Farmacia',
    locationName: '',
    reporterName: '',
    title: '',
    description: ''
  });
  // Auxiliar para selección de farmacia
  const [selectedPharmacyId, setSelectedPharmacyId] = useState('');

  // Formulario de Seguimiento
  const [newTimelineNote, setNewTimelineNote] = useState('');
  const [conclusionText, setConclusionText] = useState('');
  const [isClosing, setIsClosing] = useState(false);

  // --- LOGICA DE VISUALIZACIÓN ---
  const filteredCases = cases.filter(c => {
    const matchesStatus = filterStatus === 'Activos' ? c.status !== 'Cerrado' : c.status === 'Cerrado';
    const matchesSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.locationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.id.includes(searchTerm);
    return matchesStatus && matchesSearch;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // --- MANEJADORES ---

  const handleCreateCase = () => {
    if (!formData.title || !formData.description || !formData.reporterName) return alert("Complete los campos obligatorios");
    
    // Resolver Nombre de Ubicación
    let finalLocationName = formData.locationName;
    if (formData.locationType === 'Farmacia') {
       const p = pharmacies.find(ph => ph.id === selectedPharmacyId);
       if (!p) return alert("Seleccione una farmacia");
       finalLocationName = p.name;
    } else if (!finalLocationName) {
       return alert("Especifique el nombre de la ubicación");
    }

    const newCase: CaseRecord = {
      id: `CASE-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString(),
      status: 'Abierto',
      priority: formData.priority as any,
      channel: formData.channel as any,
      reporterName: formData.reporterName!,
      locationType: formData.locationType as any,
      locationName: finalLocationName!,
      pharmacyId: selectedPharmacyId || undefined,
      title: formData.title!,
      description: formData.description!,
      timeline: [],
      createdBy: currentUser.fullName
    };

    onAddCase(newCase);
    setView('list');
    // Reset form
    setFormData({ priority: 'Media', channel: 'WhatsApp', locationType: 'Farmacia', locationName: '', reporterName: '', title: '', description: '' });
    setSelectedPharmacyId('');
  };

  const handleAddTimeline = () => {
    if (!selectedCase || !newTimelineNote.trim()) return;

    const newEntry: CaseTimelineEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      note: newTimelineNote,
      author: currentUser.fullName
    };

    const updatedCase = {
      ...selectedCase,
      status: 'En Proceso' as const, // Pasa a En Proceso al interactuar
      timeline: [newEntry, ...selectedCase.timeline]
    };

    onUpdateCase(updatedCase);
    setSelectedCase(updatedCase);
    setNewTimelineNote('');
  };

  const handleCloseCase = () => {
    if (!selectedCase || !conclusionText.trim()) return alert("Debe ingresar una conclusión para cerrar el caso.");

    const closingEntry: CaseTimelineEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      note: `CASO CERRADO. Conclusión: ${conclusionText}`,
      author: currentUser.fullName
    };

    const updatedCase = {
      ...selectedCase,
      status: 'Cerrado' as const,
      conclusion: conclusionText,
      closedDate: new Date().toISOString(),
      timeline: [closingEntry, ...selectedCase.timeline]
    };

    onUpdateCase(updatedCase);
    setSelectedCase(updatedCase);
    setIsClosing(false);
  };

  // --- RENDERIZADORES ---

  const getPriorityColor = (p: string) => {
    switch(p) {
      case 'Alta': return 'bg-red-100 text-red-700 border-red-200';
      case 'Media': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'Baja': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusBadge = (s: string) => {
    switch(s) {
      case 'Abierto': return <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-widest flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Abierto</span>;
      case 'En Proceso': return <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-[10px] font-black uppercase tracking-widest flex items-center gap-1"><Clock className="w-3 h-3" /> En Proceso</span>;
      case 'Cerrado': return <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Cerrado</span>;
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto p-6 md:p-10 animate-in fade-in duration-500 pb-20">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tighter uppercase mb-2">Gestión de Casos</h1>
          <p className="text-slate-500 font-bold text-sm uppercase tracking-widest">Control de Novedades e Incidentes</p>
        </div>
        {view === 'list' && (
          <button 
            onClick={() => setView('new')}
            className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-xl flex items-center gap-2"
          >
            <Plus className="w-5 h-5" /> Nuevo Caso
          </button>
        )}
      </div>

      {/* VISTA: LISTA DE CASOS */}
      {view === 'list' && (
        <div className="space-y-6">
          {/* Filtros */}
          <div className="flex flex-col md:flex-row gap-4">
             <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm w-fit">
                <button onClick={() => setFilterStatus('Activos')} className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${filterStatus === 'Activos' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>Activos</button>
                <button onClick={() => setFilterStatus('Cerrados')} className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${filterStatus === 'Cerrados' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>Histórico</button>
             </div>
             <div className="relative flex-1 max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Buscar por título, ID o sede..." 
                  className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-orange-500 font-bold text-slate-700"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
             </div>
          </div>

          {/* Grid de Casos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {filteredCases.map(c => (
                <div 
                  key={c.id} 
                  onClick={() => { setSelectedCase(c); setView('detail'); }}
                  className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-lg hover:shadow-xl hover:scale-[1.01] transition-all cursor-pointer group relative overflow-hidden"
                >
                   <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-10 ${c.priority === 'Alta' ? 'bg-red-500' : 'bg-slate-500'}`}></div>
                   
                   <div className="flex justify-between items-start mb-4 relative">
                      <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase border ${getPriorityColor(c.priority)}`}>
                        {c.priority}
                      </span>
                      {getStatusBadge(c.status)}
                   </div>

                   <h3 className="text-lg font-black text-slate-800 leading-tight mb-2 line-clamp-2 uppercase">{c.title}</h3>
                   
                   <div className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-4">
                      {c.locationType === 'Farmacia' ? <MapPin className="w-4 h-4 text-orange-500" /> : 
                       c.locationType === 'Corporativo' ? <Building2 className="w-4 h-4 text-blue-500" /> :
                       <Truck className="w-4 h-4 text-purple-500" />}
                      <span className="uppercase truncate">{c.locationName}</span>
                   </div>

                   <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      <span>ID: {c.id}</span>
                      <span>{new Date(c.date).toLocaleDateString()}</span>
                   </div>
                </div>
             ))}
             
             {filteredCases.length === 0 && (
               <div className="col-span-full py-20 text-center text-slate-400 font-medium">
                 No hay casos {filterStatus.toLowerCase()} que coincidan con la búsqueda.
               </div>
             )}
          </div>
        </div>
      )}

      {/* VISTA: NUEVO CASO */}
      {view === 'new' && (
        <div className="max-w-2xl mx-auto bg-white rounded-[2.5rem] shadow-2xl p-8 border border-slate-100">
           <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black text-slate-800 uppercase">Registrar Novedad</h2>
              <button onClick={() => setView('list')} className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><X className="w-6 h-6" /></button>
           </div>

           <div className="space-y-6">
              {/* Prioridad y Canal */}
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Prioridad</label>
                    <select 
                      className="w-full p-3 bg-slate-50 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-orange-500"
                      value={formData.priority}
                      onChange={(e) => setFormData({...formData, priority: e.target.value as any})}
                    >
                      <option value="Baja">Baja (Informativo)</option>
                      <option value="Media">Media (Gestión)</option>
                      <option value="Alta">Alta (Urgente)</option>
                    </select>
                 </div>
                 <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Canal de Recepción</label>
                    <select 
                      className="w-full p-3 bg-slate-50 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-orange-500"
                      value={formData.channel}
                      onChange={(e) => setFormData({...formData, channel: e.target.value as any})}
                    >
                      <option value="WhatsApp">WhatsApp</option>
                      <option value="Llamada">Llamada</option>
                      <option value="Correo">Correo Electrónico</option>
                      <option value="Verbal">Verbal / Presencial</option>
                      <option value="Sistema">Sistema</option>
                    </select>
                 </div>
              </div>

              {/* UBICACIÓN FLEXIBLE */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                 <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Ubicación del Incidente</label>
                 
                 <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
                    {['Farmacia', 'Corporativo', 'CEDIS', 'Otro'].map(type => (
                       <button 
                          key={type}
                          onClick={() => setFormData({...formData, locationType: type as any})}
                          className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all whitespace-nowrap ${formData.locationType === type ? 'bg-slate-800 text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200'}`}
                       >
                          {type}
                       </button>
                    ))}
                 </div>

                 {formData.locationType === 'Farmacia' ? (
                    <select 
                      className="w-full p-3 bg-white rounded-xl font-bold text-slate-700 outline-none border border-slate-200 focus:border-orange-500"
                      value={selectedPharmacyId}
                      onChange={(e) => setSelectedPharmacyId(e.target.value)}
                    >
                       <option value="">Seleccione Farmacia...</option>
                       {pharmacies.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                 ) : (
                    <input 
                      type="text" 
                      placeholder={formData.locationType === 'Corporativo' ? "Ej. Oficina Presidencia" : formData.locationType === 'CEDIS' ? "Ej. Área de Despacho" : "Especifique lugar..."}
                      className="w-full p-3 bg-white rounded-xl font-bold text-slate-700 outline-none border border-slate-200 focus:border-orange-500"
                      value={formData.locationName}
                      onChange={(e) => setFormData({...formData, locationName: e.target.value})}
                    />
                 )}
              </div>

              {/* Detalles */}
              <div>
                 <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">¿Quién reporta?</label>
                 <input 
                    type="text" 
                    placeholder="Nombre y Cargo"
                    className="w-full p-3 bg-slate-50 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-orange-500"
                    value={formData.reporterName}
                    onChange={(e) => setFormData({...formData, reporterName: e.target.value})}
                 />
              </div>

              <div>
                 <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Título Corto</label>
                 <input 
                    type="text" 
                    placeholder="Ej. Hurto de mercancía en pasillo 2"
                    className="w-full p-3 bg-slate-50 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-orange-500"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                 />
              </div>

              <div>
                 <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Descripción Detallada</label>
                 <textarea 
                    placeholder="Describa los hechos..."
                    className="w-full p-3 bg-slate-50 rounded-xl font-medium text-slate-700 outline-none focus:ring-2 focus:ring-orange-500 h-32 resize-none"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                 />
              </div>

              <button onClick={handleCreateCase} className="w-full py-4 bg-slate-900 text-white rounded-xl font-black uppercase tracking-widest hover:bg-slate-800 shadow-xl">
                 Crear Expediente
              </button>
           </div>
        </div>
      )}

      {/* VISTA: EXPEDIENTE DETALLADO (TIMELINE) */}
      {view === 'detail' && selectedCase && (
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* COLUMNA IZQUIERDA: DATOS FIJOS */}
            <div className="space-y-6">
               <button onClick={() => setView('list')} className="flex items-center gap-2 text-slate-500 font-bold hover:text-slate-800 transition-colors mb-4">
                  <ArrowLeft className="w-4 h-4" /> Volver a lista
               </button>

               <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-slate-100">
                  <div className="flex justify-between items-start mb-6">
                     <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase border ${getPriorityColor(selectedCase.priority)}`}>
                        {selectedCase.priority}
                     </span>
                     {getStatusBadge(selectedCase.status)}
                  </div>
                  
                  <h2 className="text-2xl font-black text-slate-800 uppercase leading-tight mb-4">{selectedCase.title}</h2>
                  
                  <div className="space-y-4">
                     <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                        <MapPin className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                        <div>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ubicación</p>
                           <p className="font-bold text-slate-700 uppercase">{selectedCase.locationName}</p>
                           <p className="text-xs text-slate-500">{selectedCase.locationType}</p>
                        </div>
                     </div>

                     <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                        <User className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                        <div>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reportado Por</p>
                           <p className="font-bold text-slate-700 uppercase">{selectedCase.reporterName}</p>
                           <p className="text-xs text-slate-500">Vía {selectedCase.channel}</p>
                        </div>
                     </div>

                     <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                        <FileText className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                        <div>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Descripción</p>
                           <p className="text-sm font-medium text-slate-600 leading-relaxed">{selectedCase.description}</p>
                        </div>
                     </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-slate-100">
                     <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Acciones</p>
                     {selectedCase.status !== 'Cerrado' ? (
                        <button 
                           onClick={() => setIsClosing(true)}
                           className="w-full py-3 border-2 border-slate-100 text-slate-600 rounded-xl font-bold uppercase text-xs hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all"
                        >
                           Cerrar Caso
                        </button>
                     ) : (
                        <div className="p-4 bg-slate-100 rounded-xl">
                           <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Conclusión Final</p>
                           <p className="text-sm font-medium text-slate-700">{selectedCase.conclusion}</p>
                           <p className="text-[10px] text-slate-400 mt-2 text-right">Cerrado el {new Date(selectedCase.closedDate!).toLocaleDateString()}</p>
                        </div>
                     )}
                  </div>
               </div>
            </div>

            {/* COLUMNA DERECHA: TIMELINE (SEGUIMIENTO) */}
            <div className="lg:col-span-2 space-y-6">
               <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                  <MoreHorizontal className="w-5 h-5 text-orange-500" /> Bitácora de Seguimiento
               </h3>

               {/* Input de Nuevo Seguimiento */}
               {selectedCase.status !== 'Cerrado' && !isClosing && (
                  <div className="bg-white p-4 rounded-[2rem] shadow-lg border border-slate-100 flex gap-4 items-start">
                     <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                        <MessageSquare className="w-5 h-5 text-slate-500" />
                     </div>
                     <div className="flex-1">
                        <textarea 
                           placeholder="Escriba un nuevo avance, gestión o nota..."
                           className="w-full bg-transparent outline-none text-slate-700 font-medium resize-none h-20 placeholder-slate-400"
                           value={newTimelineNote}
                           onChange={(e) => setNewTimelineNote(e.target.value)}
                        />
                        <div className="flex justify-end mt-2">
                           <button 
                              onClick={handleAddTimeline}
                              disabled={!newTimelineNote.trim()}
                              className="px-6 py-2 bg-slate-900 text-white rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                           >
                              Registrar Avance
                           </button>
                        </div>
                     </div>
                  </div>
               )}

               {/* Modal/Area de Cierre */}
               {isClosing && (
                  <div className="bg-red-50 p-6 rounded-[2rem] border border-red-100 animate-in fade-in slide-in-from-top-2">
                     <h4 className="text-lg font-black text-red-800 uppercase mb-2">Cierre de Caso</h4>
                     <p className="text-sm text-red-600 mb-4">Para cerrar el caso, es obligatorio indicar la conclusión o resolución final.</p>
                     <textarea 
                        className="w-full p-4 bg-white rounded-xl outline-none text-slate-700 border border-red-200 focus:border-red-500 h-24 resize-none mb-4"
                        placeholder="Escriba la conclusión final..."
                        value={conclusionText}
                        onChange={(e) => setConclusionText(e.target.value)}
                     />
                     <div className="flex justify-end gap-3">
                        <button onClick={() => setIsClosing(false)} className="px-4 py-2 text-slate-500 font-bold text-xs uppercase">Cancelar</button>
                        <button onClick={handleCloseCase} className="px-6 py-2 bg-red-600 text-white rounded-lg font-bold text-xs uppercase shadow-lg hover:bg-red-700">Confirmar Cierre</button>
                     </div>
                  </div>
               )}

               {/* Lista de Eventos */}
               <div className="space-y-6 relative before:absolute before:left-5 before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-200">
                  {selectedCase.timeline.map((entry, idx) => (
                     <div key={entry.id} className="relative pl-14 group">
                        <div className="absolute left-3 top-1 w-4 h-4 bg-white border-2 border-orange-500 rounded-full z-10"></div>
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 group-hover:shadow-md transition-all">
                           <div className="flex justify-between items-center mb-2">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(entry.date).toLocaleString()}</span>
                              <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-md uppercase">{entry.author}</span>
                           </div>
                           <p className="text-sm text-slate-700 font-medium leading-relaxed whitespace-pre-wrap">{entry.note}</p>
                        </div>
                     </div>
                  ))}
                  
                  {/* Evento de Creación */}
                  <div className="relative pl-14">
                     <div className="absolute left-3 top-1 w-4 h-4 bg-slate-300 rounded-full z-10"></div>
                     <div className="text-xs font-bold text-slate-400 uppercase tracking-widest pt-1">
                        Caso abierto por {selectedCase.createdBy} el {new Date(selectedCase.date).toLocaleString()}
                     </div>
                  </div>
               </div>
            </div>

         </div>
      )}

    </div>
  );
};

export default CaseManagement;
