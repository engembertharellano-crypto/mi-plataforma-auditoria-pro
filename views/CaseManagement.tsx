import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  MapPin, 
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
  ArrowLeft, 
  Hash, 
  Pencil, 
  Save, 
  Trash2,
  Calendar // Icono para la fecha
} from 'lucide-react';
import { Pharmacy, CaseRecord, CaseTimelineEntry } from '../types';

interface CaseManagementProps {
  pharmacies: Pharmacy[];
  cases: CaseRecord[];
  onAddCase: (newCase: CaseRecord) => void;
  onUpdateCase: (updatedCase: CaseRecord) => void;
  onDeleteCase: (id: string) => void;
  currentUser: any;
  hasAdminPrivileges: boolean;
}

const CaseManagement: React.FC<CaseManagementProps> = ({ 
  pharmacies, 
  cases = [], 
  onAddCase, 
  onUpdateCase, 
  onDeleteCase, 
  currentUser, 
  hasAdminPrivileges 
}) => {
  const [view, setView] = useState<'list' | 'new' | 'detail'>('list');
  const [selectedCase, setSelectedCase] = useState<CaseRecord | null>(null);
  const [filterStatus, setFilterStatus] = useState<'Activos' | 'Cerrados'>('Activos');
  const [searchTerm, setSearchTerm] = useState('');

  // Estados para Modal de Borrado
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Formulario Nuevo Caso (Incluye fecha manual)
  const [formData, setFormData] = useState<Partial<CaseRecord> & { dateStr: string }>({
    id: '', 
    dateStr: new Date().toISOString().split('T')[0], // Fecha por defecto: HOY
    priority: 'Media', 
    channel: 'WhatsApp', 
    locationType: 'Farmacia', 
    locationName: '', 
    reporterName: '', 
    title: '', 
    description: ''
  });
  
  const [selectedPharmacyId, setSelectedPharmacyId] = useState('');
  const [newTimelineNote, setNewTimelineNote] = useState('');
  const [conclusionText, setConclusionText] = useState('');
  const [isClosing, setIsClosing] = useState(false);
  const [isEditingId, setIsEditingId] = useState(false);
  const [tempOfficialId, setTempOfficialId] = useState('');

  // --- LÓGICA DE VISUALIZACIÓN ---
  const filteredCases = cases.filter(c => {
    const matchesStatus = filterStatus === 'Activos' ? c.status !== 'Cerrado' : c.status === 'Cerrado';
    const term = searchTerm.toLowerCase();
    const matchesSearch = c.title.toLowerCase().includes(term) || 
                          c.locationName.toLowerCase().includes(term) || 
                          c.id.toLowerCase().includes(term) || 
                          (c.officialId && c.officialId.toLowerCase().includes(term));
    return matchesStatus && matchesSearch;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // --- LÓGICA DE PERMISOS ---
  const canDelete = selectedCase && (hasAdminPrivileges || selectedCase.createdBy === currentUser?.fullName);

  // --- MANEJADORES ---
  const handleCreateCase = () => {
    if (!formData.title || !formData.description || !formData.reporterName) return alert("Complete los campos obligatorios.");
    
    let internalId = `NOV-${Date.now().toString().slice(-6)}`;
    let initialOfficialId = formData.id?.trim().toUpperCase() || undefined;

    let finalLocationName = formData.locationName;
    if (formData.locationType === 'Farmacia') {
       const p = pharmacies.find(ph => ph.id === selectedPharmacyId);
       if (!p) return alert("Seleccione una farmacia");
       finalLocationName = p.name;
    } else if (!finalLocationName) {
       return alert("Especifique el nombre de la ubicación");
    }

    // Usar la fecha seleccionada manual o la actual
    const creationDate = formData.dateStr 
      ? new Date(formData.dateStr).toISOString() 
      : new Date().toISOString();

    const newCase: CaseRecord = {
      id: internalId,
      officialId: initialOfficialId,
      date: creationDate, // Guardamos la fecha elegida
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
    setFormData({ 
      id: '', 
      dateStr: new Date().toISOString().split('T')[0], // Reset a Hoy
      priority: 'Media', 
      channel: 'WhatsApp', 
      locationType: 'Farmacia', 
      locationName: '', 
      reporterName: '', 
      title: '', 
      description: '' 
    });
    setSelectedPharmacyId('');
  };

  const confirmDelete = () => {
    if (!selectedCase) return;
    // Ejecutar el borrado
    onDeleteCase(selectedCase.id); 
    // Cerrar modales y volver a la lista inmediatamente
    setShowDeleteModal(false);
    setSelectedCase(null);
    setView('list');
  };

  // Resto de manejadores (Update, Close, Timeline) se mantienen igual...
  const handleSaveOfficialId = () => {
    if (!selectedCase) return;
    const updatedCase = { ...selectedCase, officialId: tempOfficialId.trim().toUpperCase() || undefined };
    onUpdateCase(updatedCase);
    setSelectedCase(updatedCase);
    setIsEditingId(false);
  };

  const handleAddTimeline = () => {
    if (!selectedCase || !newTimelineNote.trim()) return;
    const newEntry: CaseTimelineEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      note: newTimelineNote,
      author: currentUser.fullName
    };
    const updatedCase = { ...selectedCase, status: 'En Proceso' as const, timeline: [newEntry, ...selectedCase.timeline] };
    onUpdateCase(updatedCase);
    setSelectedCase(updatedCase);
    setNewTimelineNote('');
  };

  const handleCloseCase = () => {
    if (!selectedCase || !conclusionText.trim()) return alert("Debe ingresar una conclusión.");
    const closingEntry: CaseTimelineEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      note: `CASO CERRADO. Conclusión: ${conclusionText}`,
      author: currentUser.fullName
    };
    const updatedCase = { ...selectedCase, status: 'Cerrado' as const, conclusion: conclusionText, closedDate: new Date().toISOString(), timeline: [closingEntry, ...selectedCase.timeline] };
    onUpdateCase(updatedCase);
    setSelectedCase(updatedCase);
    setIsClosing(false);
  };

  // --- HELPERS UI ---
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
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase mb-2">Gestión de Casos</h1>
          <p className="text-slate-300 font-bold text-sm uppercase tracking-widest">Control de Novedades e Incidentes</p>
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
          <div className="flex flex-col md:flex-row gap-4">
             <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm w-fit">
                <button onClick={() => setFilterStatus('Activos')} className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${filterStatus === 'Activos' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>Activos</button>
                <button onClick={() => setFilterStatus('Cerrados')} className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${filterStatus === 'Cerrados' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>Histórico</button>
             </div>
             <div className="relative flex-1 max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Buscar por N° Expediente, título o sede..." 
                  className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-orange-500 font-bold text-slate-700"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {filteredCases.map(c => (
                <div 
                  key={c.id} 
                  onClick={() => { setSelectedCase(c); setView('detail'); }}
                  className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-lg hover:shadow-xl hover:scale-[1.01] transition-all cursor-pointer group relative overflow-hidden"
                >
                   <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-10 ${c.priority === 'Alta' ? 'bg-red-500' : 'bg-slate-500'}`}></div>
                   <div className="flex justify-between items-start mb-4 relative">
                      <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase border ${getPriorityColor(c.priority)}`}>{c.priority}</span>
                      {getStatusBadge(c.status)}
                   </div>
                   <h3 className="text-lg font-black text-slate-800 leading-tight mb-2 line-clamp-2 uppercase">{c.title}</h3>
                   <div className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-4">
                      {c.locationType === 'Farmacia' ? <MapPin className="w-4 h-4 text-orange-500" /> : c.locationType === 'Corporativo' ? <Building2 className="w-4 h-4 text-blue-500" /> : <Truck className="w-4 h-4 text-purple-500" />}
                      <span className="uppercase truncate">{c.locationName}</span>
                   </div>
                   <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      <span className="flex items-center gap-1"><Hash className="w-3 h-3" /> {c.officialId ? <span className="text-slate-800">{c.officialId}</span> : c.id}</span>
                      <span>{new Date(c.date).toLocaleDateString()}</span>
                   </div>
                </div>
             ))}
             {filteredCases.length === 0 && <div className="col-span-full py-20 text-center text-slate-400 font-medium">No hay casos {filterStatus.toLowerCase()} encontrados.</div>}
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
              
              {/* CAMPO DE FECHA MANUAL */}
              <div>
                 <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Fecha del Incidente</label>
                 <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input 
                      type="date" 
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 rounded-xl font-bold text-slate-800 outline-none focus:ring-2 focus:ring-orange-500"
                      value={formData.dateStr}
                      onChange={(e) => setFormData({...formData, dateStr: e.target.value})}
                    />
                 </div>
              </div>

              <div>
                 <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Número de Expediente (Opcional)</label>
                 <div className="relative">
                    <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input type="text" placeholder="Dejar vacío si es solo una novedad preliminar" className="w-full pl-12 pr-4 py-3 bg-slate-50 rounded-xl font-bold text-slate-800 outline-none focus:ring-2 focus:ring-orange-500 uppercase placeholder-slate-400" value={formData.id} onChange={(e) => setFormData({...formData, id: e.target.value})} />
                 </div>
                 <p className="text-[10px] text-slate-400 mt-1 ml-2 font-medium">Puede asignar este número más adelante.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Prioridad</label>
                    <select className="w-full p-3 bg-slate-50 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-orange-500" value={formData.priority} onChange={(e) => setFormData({...formData, priority: e.target.value as any})}>
                      <option value="Baja">Baja (Informativo)</option><option value="Media">Media (Gestión)</option><option value="Alta">Alta (Urgente)</option>
                    </select>
                 </div>
                 <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Canal</label>
                    <select className="w-full p-3 bg-slate-50 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-orange-500" value={formData.channel} onChange={(e) => setFormData({...formData, channel: e.target.value as any})}>
                      <option value="WhatsApp">WhatsApp</option><option value="Llamada">Llamada</option><option value="Correo">Correo Electrónico</option><option value="Verbal">Verbal / Presencial</option><option value="Sistema">Sistema</option>
                    </select>
                 </div>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                 <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Ubicación</label>
                 <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
                    {['Farmacia', 'Corporativo', 'CEDIS', 'Otro'].map(type => (
                       <button key={type} onClick={() => setFormData({...formData, locationType: type as any})} className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all whitespace-nowrap ${formData.locationType === type ? 'bg-slate-800 text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200'}`}>{type}</button>
                    ))}
                 </div>
                 {formData.locationType === 'Farmacia' ? (
                    <select className="w-full p-3 bg-white rounded-xl font-bold text-slate-700 outline-none border border-slate-200 focus:border-orange-500" value={selectedPharmacyId} onChange={(e) => setSelectedPharmacyId(e.target.value)}>
                       <option value="">Seleccione Farmacia...</option>{pharmacies.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                 ) : (
                    <input type="text" placeholder="Especifique lugar..." className="w-full p-3 bg-white rounded-xl font-bold text-slate-700 outline-none border border-slate-200 focus:border-orange-500" value={formData.locationName} onChange={(e) => setFormData({...formData, locationName: e.target.value})} />
                 )}
              </div>
              <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">¿Quién reporta?</label><input type="text" placeholder="Nombre y Cargo" className="w-full p-3 bg-slate-50 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-orange-500" value={formData.reporterName} onChange={(e) => setFormData({...formData, reporterName: e.target.value})} /></div>
              <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Título Corto</label><input type="text" placeholder="Ej. Hurto de mercancía" className="w-full p-3 bg-slate-50 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-orange-500" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} /></div>
              <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Descripción Detallada</label><textarea placeholder="Describa los hechos..." className="w-full p-3 bg-slate-50 rounded-xl font-medium text-slate-700 outline-none focus:ring-2 focus:ring-orange-500 h-32 resize-none" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} /></div>
              <button onClick={handleCreateCase} className="w-full py-4 bg-slate-900 text-white rounded-xl font-black uppercase tracking-widest hover:bg-slate-800 shadow-xl">Crear Expediente</button>
           </div>
        </div>
      )}

      {/* VISTA: EXPEDIENTE DETALLADO */}
      {view === 'detail' && selectedCase && (
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="space-y-6">
               <button onClick={() => setView('list')} className="flex items-center gap-2 text-slate-300 font-bold hover:text-white transition-colors mb-4"><ArrowLeft className="w-4 h-4" /> Volver a lista</button>
               <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-slate-100">
                  <div className="flex justify-between items-start mb-6">
                     <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase border ${getPriorityColor(selectedCase.priority)}`}>{selectedCase.priority}</span>
                     {getStatusBadge(selectedCase.status)}
                  </div>
                  <h2 className="text-2xl font-black text-slate-800 uppercase leading-tight mb-4">{selectedCase.title}</h2>
                  <div className="space-y-4">
                     <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 relative group">
                        <Hash className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                        <div className="w-full">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex justify-between">
                             Número de Expediente
                             {!isEditingId && selectedCase.status !== 'Cerrado' && (
                               <button onClick={() => { setIsEditingId(true); setTempOfficialId(selectedCase.officialId || ''); }} className="text-orange-500 hover:text-orange-600 transition-colors"><Pencil className="w-3 h-3" /></button>
                             )}
                           </p>
                           {isEditingId ? (
                             <div className="flex gap-2 mt-1">
                               <input type="text" className="w-full p-2 bg-white border border-slate-300 rounded-lg text-sm font-bold uppercase outline-none focus:border-orange-500" value={tempOfficialId} onChange={(e) => setTempOfficialId(e.target.value)} placeholder="Ej. INV-2024-001" autoFocus />
                               <button onClick={handleSaveOfficialId} className="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"><Save className="w-4 h-4" /></button>
                               <button onClick={() => setIsEditingId(false)} className="p-2 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300"><X className="w-4 h-4" /></button>
                             </div>
                           ) : (
                             <>
                               {selectedCase.officialId ? <p className="font-black text-slate-800 text-lg uppercase">{selectedCase.officialId}</p> : <p className="text-sm font-medium text-slate-400 italic">Sin asignar (Preliminar)</p>}
                               <p className="text-[9px] text-slate-300 font-mono mt-1">REF: {selectedCase.id}</p>
                             </>
                           )}
                        </div>
                     </div>
                     <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl"><MapPin className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" /><div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ubicación</p><p className="font-bold text-slate-700 uppercase">{selectedCase.locationName}</p><p className="text-xs text-slate-500">{selectedCase.locationType}</p></div></div>
                     <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl"><User className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" /><div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reportado Por</p><p className="font-bold text-slate-700 uppercase">{selectedCase.reporterName}</p><p className="text-xs text-slate-500">Vía {selectedCase.channel}</p></div></div>
                     <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl"><FileText className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" /><div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Descripción</p><p className="text-sm font-medium text-slate-600 leading-relaxed">{selectedCase.description}</p></div></div>
                  </div>
                  <div className="mt-8 pt-6 border-t border-slate-100">
                     <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Acciones</p>
                     <div className="space-y-3">
                       {selectedCase.status !== 'Cerrado' ? (
                          <button onClick={() => setIsClosing(true)} className="w-full py-3 border-2 border-slate-100 text-slate-600 rounded-xl font-bold uppercase text-xs hover:bg-slate-50 transition-all">Cerrar Caso</button>
                       ) : (
                          <div className="p-4 bg-slate-100 rounded-xl"><p className="text-[10px] font-black text-slate-500 uppercase mb-1">Conclusión Final</p><p className="text-sm font-medium text-slate-700">{selectedCase.conclusion}</p><p className="text-[10px] text-slate-400 mt-2 text-right">Cerrado el {new Date(selectedCase.closedDate!).toLocaleDateString()}</p></div>
                       )}
                       {canDelete && (
                         <button onClick={() => setShowDeleteModal(true)} className="w-full py-3 bg-red-50 text-red-600 rounded-xl font-bold uppercase text-xs hover:bg-red-100 flex items-center justify-center gap-2">
                           <Trash2 className="w-4 h-4" /> Eliminar Expediente
                         </button>
                       )}
                     </div>
                  </div>
               </div>
            </div>

            <div className="lg:col-span-2 space-y-6">
               <h3 className="text-xl font-black text-slate-300 uppercase tracking-tight flex items-center gap-2"><MoreHorizontal className="w-5 h-5 text-orange-500" /> Bitácora de Seguimiento</h3>
               {selectedCase.status !== 'Cerrado' && !isClosing && (
                  <div className="bg-white p-4 rounded-[2rem] shadow-lg border border-slate-100 flex gap-4 items-start">
                     <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0"><MessageSquare className="w-5 h-5 text-slate-500" /></div>
                     <div className="flex-1"><textarea placeholder="Escriba un nuevo avance, gestión o nota..." className="w-full bg-transparent outline-none text-slate-700 font-medium resize-none h-20 placeholder-slate-400" value={newTimelineNote} onChange={(e) => setNewTimelineNote(e.target.value)} /><div className="flex justify-end mt-2"><button onClick={handleAddTimeline} disabled={!newTimelineNote.trim()} className="px-6 py-2 bg-slate-900 text-white rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed">Registrar Avance</button></div></div>
                  </div>
               )}
               {isClosing && (
                  <div className="bg-red-50 p-6 rounded-[2rem] border border-red-100 animate-in fade-in slide-in-from-top-2">
                     <h4 className="text-lg font-black text-red-800 uppercase mb-2">Cierre de Caso</h4><p className="text-sm text-red-600 mb-4">Para cerrar el caso, es obligatorio indicar la conclusión o resolución final.</p><textarea className="w-full p-4 bg-white rounded-xl outline-none text-slate-700 border border-red-200 focus:border-red-500 h-24 resize-none mb-4" placeholder="Escriba la conclusión final..." value={conclusionText} onChange={(e) => setConclusionText(e.target.value)} /><div className="flex justify-end gap-3"><button onClick={() => setIsClosing(false)} className="px-4 py-2 text-slate-500 font-bold text-xs uppercase">Cancelar</button><button onClick={handleCloseCase} className="px-6 py-2 bg-red-600 text-white rounded-lg font-bold text-xs uppercase shadow-lg hover:bg-red-700">Confirmar Cierre</button></div>
                  </div>
               )}
               <div className="space-y-6 relative before:absolute before:left-5 before:top-4 before:bottom-4 before:w-0.5 before:bg-white/10">
                  {selectedCase.timeline.map((entry, idx) => (
                     <div key={entry.id} className="relative pl-14 group">
                        <div className="absolute left-3 top-1 w-4 h-4 bg-slate-900 border-2 border-orange-500 rounded-full z-10"></div>
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 group-hover:shadow-md transition-all">
                           <div className="flex justify-between items-center mb-2"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(entry.date).toLocaleString()}</span><span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-md uppercase">{entry.author}</span></div><p className="text-sm text-slate-700 font-medium leading-relaxed whitespace-pre-wrap">{entry.note}</p>
                        </div>
                     </div>
                  ))}
                  <div className="relative pl-14"><div className="absolute left-3 top-1 w-4 h-4 bg-slate-500 rounded-full z-10"></div><div className="text-xs font-bold text-slate-400 uppercase tracking-widest pt-1">Caso abierto por {selectedCase.createdBy} el {new Date(selectedCase.date).toLocaleString()}</div></div>
               </div>
            </div>
         </div>
      )}

      {/* MODAL DE BORRADO SEGURO */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[250] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] w-full max-w-md p-8 shadow-2xl text-center transform transition-all scale-100">
             <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 className="w-10 h-10 text-red-600" />
             </div>
             <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">¿Eliminar Expediente?</h3>
             <p className="text-slate-500 font-medium mb-8 leading-relaxed">
               Estás a punto de eliminar el caso <span className="font-bold text-slate-800">{selectedCase?.officialId || selectedCase?.id}</span> permanentemente. <br/><br/>
               <span className="text-red-600 font-bold text-xs uppercase tracking-widest">Esta acción no se puede deshacer.</span>
             </p>
             <div className="flex gap-4">
               <button 
                 type="button" // IMPORTANTE PARA EVITAR SUBMIT
                 onClick={() => setShowDeleteModal(false)} 
                 className="flex-1 py-4 rounded-xl border-2 border-slate-100 font-bold text-slate-600 hover:bg-slate-50 transition-colors uppercase text-xs tracking-widest"
               >
                 Cancelar
               </button>
               <button 
                 type="button" // IMPORTANTE PARA EVITAR SUBMIT
                 onClick={confirmDelete} 
                 className="flex-1 py-4 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-200 uppercase text-xs tracking-widest"
               >
                 Sí, Eliminar
               </button>
             </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CaseManagement;
