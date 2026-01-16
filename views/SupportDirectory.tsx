import React, { useState } from 'react';
import { 
  Siren, 
  Search, 
  Phone, 
  Building2, 
  Plus, 
  Trash2, 
  Flame, 
  Stethoscope, 
  ShieldAlert, 
  Car,
  X,
  Download,
  Loader2,
  Check,
  PenTool
} from 'lucide-react';
import { Pharmacy, SupportRecord } from '../types';

interface SupportDirectoryProps {
  pharmacies: Pharmacy[];
  supportRecords: SupportRecord[];
  onAddContact: (record: SupportRecord) => void;
  onDeleteContact: (id: string) => void;
}

const SupportDirectory: React.FC<SupportDirectoryProps> = ({ 
  pharmacies, 
  supportRecords, 
  onAddContact, 
  onDeleteContact 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ id: string; name: string } | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    pharmacyId: '',
    category: 'Policía',
    customCategory: '',
    institutionName: '',
    phone: ''
  });

  const confirmDelete = () => {
    if (deleteConfirmation) {
      onDeleteContact(deleteConfirmation.id);
      setDeleteConfirmation(null);
    }
  };

  const handleSave = () => {
    const finalCategory = formData.category === 'Otro' ? formData.customCategory : formData.category;

    if (!formData.pharmacyId || !finalCategory || !formData.institutionName || !formData.phone) {
      alert("Todos los campos son obligatorios.");
      return;
    }

    const newContact: SupportRecord = {
      id: `supp-${Date.now()}`,
      pharmacyId: formData.pharmacyId,
      category: finalCategory,
      institutionName: formData.institutionName,
      phone: formData.phone
    };

    onAddContact(newContact);
    setShowModal(false);
    setFormData({ 
      pharmacyId: '', 
      category: 'Policía', 
      customCategory: '',
      institutionName: '', 
      phone: '' 
    });
  };

  const handleDownloadCard = async (pharmacyId: string, pharmacyName: string) => {
    const cardElement = document.getElementById(`support-card-${pharmacyId}`);
    if (!cardElement) return;

    setDownloadingId(pharmacyId);
    
    try {
      const html2canvas = (window as any).html2canvas;
      if (!html2canvas) {
        console.error("html2canvas not loaded");
        return;
      }

      const canvas = await html2canvas(cardElement, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });

      canvas.toBlob((blob: Blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `Apoyo_${pharmacyName.replace(/\s+/g, '_')}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }
      });
    } catch (err) {
      console.error("Error capturing card", err);
      alert("No se pudo generar la imagen.");
    } finally {
      setTimeout(() => setDownloadingId(null), 1000);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch(category) {
      case 'Policía': return <ShieldAlert className="w-5 h-5 text-blue-600" />;
      case 'Bomberos': return <Flame className="w-5 h-5 text-red-600" />;
      case 'Ambulancia': return <Stethoscope className="w-5 h-5 text-emerald-600" />;
      case 'Tránsito': return <Car className="w-5 h-5 text-orange-600" />;
      default: return <Siren className="w-5 h-5 text-slate-600" />;
    }
  };

  const getCategoryStyle = (category: string) => {
    switch(category) {
      case 'Policía': return 'bg-blue-50 border-blue-100 text-blue-800';
      case 'Bomberos': return 'bg-red-50 border-red-100 text-red-800';
      case 'Ambulancia': return 'bg-emerald-50 border-emerald-100 text-emerald-800';
      case 'Tránsito': return 'bg-orange-50 border-orange-100 text-orange-800';
      default: return 'bg-slate-50 border-slate-100 text-slate-800';
    }
  };

  // Filter contacts by search
  const filteredContacts = supportRecords.filter(r => 
    r.institutionName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.phone.includes(searchTerm)
  );

  return (
    <div className="max-w-7xl mx-auto p-8 animate-in fade-in duration-500">
      
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight drop-shadow-md">Directorio de Apoyo</h2>
          <p className="text-slate-300 mt-1 font-medium">Contactos de emergencia y autoridades por cuadrante</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-orange-600 hover:bg-orange-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-orange-600/20 transition-all transform hover:-translate-y-0.5"
        >
          <Plus className="w-5 h-5" /> Agregar Contacto
        </button>
      </div>

      <div className="mb-8 relative">
        <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input 
          type="text" 
          placeholder="Buscar estación, categoría o número..."
          className="w-full pl-10 pr-4 py-3 border border-white/20 rounded-xl outline-none focus:ring-4 focus:ring-orange-500/10 bg-white/80 backdrop-blur-sm shadow-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
         {pharmacies.map(pharmacy => {
            const pharmacyContacts = filteredContacts.filter(c => c.pharmacyId === pharmacy.id);

            if (searchTerm && pharmacyContacts.length === 0) return null;

            return (
               <div 
                 key={pharmacy.id} 
                 id={`support-card-${pharmacy.id}`}
                 className="glass-card rounded-2xl flex flex-col overflow-hidden border border-white shadow-lg shadow-black/10"
               >
                  <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-100 flex items-center justify-between backdrop-blur-sm">
                     <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-lg border border-slate-100 shadow-sm text-orange-600">
                           <Building2 className="w-5 h-5" />
                        </div>
                        <h3 className="font-bold text-slate-800">{pharmacy.name}</h3>
                     </div>
                     <button 
                       onClick={() => handleDownloadCard(pharmacy.id, pharmacy.name)}
                       className="text-slate-400 hover:text-orange-600 p-2 hover:bg-white rounded-lg transition-colors"
                       title="Descargar Ficha de Apoyo"
                     >
                       {downloadingId === pharmacy.id ? (
                         <Loader2 className="w-5 h-5 animate-spin" />
                       ) : (
                         <Download className="w-5 h-5" />
                       )}
                     </button>
                  </div>

                  <div className="p-5 flex-1 space-y-3 bg-white/40">
                     {pharmacyContacts.length > 0 ? (
                        pharmacyContacts.map(contact => (
                          <div 
                             key={contact.id} 
                             className={`flex items-center justify-between p-3 rounded-xl border transition-all ${getCategoryStyle(contact.category)}`}
                          >
                             <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/60 rounded-full shadow-sm">
                                  {getCategoryIcon(contact.category)}
                                </div>
                                <div>
                                   <p className="font-bold text-sm">{contact.category}</p>
                                   <p className="text-xs font-semibold opacity-80">{contact.institutionName}</p>
                                </div>
                             </div>

                             <div className="flex items-center gap-2">
                                <a 
                                  href={`tel:${contact.phone}`}
                                  className="flex items-center gap-1.5 bg-white/80 hover:bg-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm transition-colors text-slate-700"
                                >
                                  <Phone className="w-3 h-3" />
                                  {contact.phone}
                                </a>
                                <button 
                                  onClick={() => setDeleteConfirmation({ id: contact.id, name: contact.institutionName })}
                                  className="p-1.5 rounded-lg bg-white/50 hover:bg-white text-red-500 transition-colors no-print"
                                  data-html2canvas-ignore="true"
                                  title="Eliminar"
                                >
                                   <Trash2 className="w-4 h-4" />
                                </button>
                             </div>
                          </div>
                        ))
                     ) : (
                        <div className="text-center py-8 text-slate-400">
                          <Siren className="w-10 h-10 mx-auto mb-2 opacity-10" />
                          <p className="text-sm font-medium">Sin contactos de apoyo</p>
                          <button 
                            onClick={() => {
                              setFormData(prev => ({ ...prev, pharmacyId: pharmacy.id }));
                              setShowModal(true);
                            }}
                            className="text-xs text-orange-600 font-bold mt-2 hover:underline no-print"
                            data-html2canvas-ignore="true"
                          >
                            + Agregar Emergencia
                          </button>
                        </div>
                     )}
                  </div>
               </div>
            );
         })}
      </div>

      {deleteConfirmation && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
             <div className="flex flex-col items-center text-center">
                <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-600">
                   <Trash2 className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-black text-slate-800 mb-2">¿Eliminar Contacto?</h3>
                <p className="text-slate-500 mb-6">¿Estás seguro de eliminar a <strong>{deleteConfirmation.name}</strong> de la lista de apoyo?</p>
                
                <div className="flex gap-3 w-full">
                   <button 
                     onClick={() => setDeleteConfirmation(null)}
                     className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50"
                   >
                     Cancelar
                   </button>
                   <button 
                     onClick={confirmDelete}
                     className="flex-1 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 shadow-lg shadow-red-500/30"
                   >
                     Sí, Eliminar
                   </button>
                </div>
             </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-200 border border-white/20">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Siren className="w-6 h-6 text-orange-600" />
                Agregar Apoyo Externo
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-500 mb-1">Farmacia (Ubicación)</label>
                <select 
                  className="w-full p-3 border border-slate-200 rounded-lg outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 bg-white font-bold"
                  value={formData.pharmacyId}
                  onChange={(e) => setFormData({...formData, pharmacyId: e.target.value})}
                >
                  <option value="">Seleccione la sede...</option>
                  {pharmacies.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-500 mb-1">Categoría</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Policía', 'Bomberos', 'Ambulancia', 'Tránsito', 'Defensa Civil', 'Otro'].map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setFormData({...formData, category: cat})}
                      className={`p-2 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all ${
                        formData.category === cat 
                          ? 'bg-slate-800 text-white border-slate-800 shadow-md' 
                          : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {formData.category === 'Otro' && (
                <div className="animate-in slide-in-from-top-2 duration-300">
                   <label className="block text-sm font-medium text-slate-500 mb-1">Especificar Categoría</label>
                   <div className="relative">
                      <PenTool className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-500" />
                      <input 
                        type="text"
                        placeholder="Ej. Protección Civil, Cerrajería..."
                        className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 font-bold"
                        value={formData.customCategory}
                        onChange={(e) => setFormData({...formData, customCategory: e.target.value})}
                      />
                   </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-500 mb-1">Nombre / Estación</label>
                <input 
                  type="text"
                  placeholder="Ej. Cuadrante 5 Norte"
                  className="w-full p-3 border border-slate-200 rounded-lg outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 font-bold"
                  value={formData.institutionName}
                  onChange={(e) => setFormData({...formData, institutionName: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-500 mb-1">Número Telefónico</label>
                <input 
                  type="tel"
                  placeholder="Ej. 911 ó 0212-5555555"
                  className="w-full p-3 border border-slate-200 rounded-lg outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 font-mono font-bold"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 rounded-b-2xl">
              <button 
                onClick={() => setShowModal(false)}
                className="px-6 py-2.5 rounded-lg text-slate-600 font-medium hover:bg-slate-200 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSave}
                className="px-6 py-2.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-bold shadow-lg shadow-orange-600/20"
              >
                Guardar Contacto
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default SupportDirectory;