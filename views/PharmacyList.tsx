import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  MapPin, 
  Edit2, 
  Trash2, 
  X, 
  Store, 
  Save,
  Phone,
  Mail,
  User,
  Navigation, // Icono para GPS
  ShieldCheck, // Icono Seguridad Activa
  ShieldAlert // Icono Seguridad Inactiva
} from 'lucide-react';
import { Pharmacy } from '../types';

interface PharmacyListProps {
  pharmacies: Pharmacy[];
  onAdd: (pharmacy: Omit<Pharmacy, 'id'>) => void;
  onEdit: (id: string, data: Partial<Pharmacy>) => void;
  onDelete: (id: string) => void;
}

const PharmacyList: React.FC<PharmacyListProps> = ({ 
  pharmacies, 
  onAdd, 
  onEdit, 
  onDelete 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);

  // Estado del formulario con el nuevo campo hasSecurityOfficer
  const [formData, setFormData] = useState<{
    name: string;
    address: string;
    zone: string;
    corporatePhone: string;
    coordinates: string; // string temporal para el input
    hasSecurityOfficer: boolean; // NUEVO
  }>({
    name: '',
    address: '',
    zone: 'Gran Caracas',
    corporatePhone: '',
    coordinates: '',
    hasSecurityOfficer: false // Valor por defecto
  });

  const handleOpenModal = (pharmacy?: Pharmacy) => {
    if (pharmacy) {
      setEditingId(pharmacy.id);
      setFormData({
        name: pharmacy.name,
        address: pharmacy.address,
        zone: pharmacy.zone || 'Gran Caracas',
        corporatePhone: pharmacy.corporatePhone || '',
        coordinates: pharmacy.location ? `${pharmacy.location.lat}, ${pharmacy.location.lng}` : '',
        hasSecurityOfficer: pharmacy.hasSecurityOfficer || false // Cargar valor existente
      });
    } else {
      setEditingId(null);
      setFormData({
        name: '',
        address: '',
        zone: 'Gran Caracas',
        corporatePhone: '',
        coordinates: '',
        hasSecurityOfficer: false
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Parsear coordenadas
    let location = null;
    if (formData.coordinates.includes(',')) {
      const [lat, lng] = formData.coordinates.split(',').map(s => parseFloat(s.trim()));
      if (!isNaN(lat) && !isNaN(lng)) {
        location = { lat, lng };
      }
    }

    const payload = {
      name: formData.name,
      address: formData.address,
      zone: formData.zone,
      corporatePhone: formData.corporatePhone,
      location,
      hasSecurityOfficer: formData.hasSecurityOfficer
    };

    if (editingId) {
      onEdit(editingId, payload);
    } else {
      onAdd(payload);
    }
    setIsModalOpen(false);
  };

  const filteredPharmacies = pharmacies.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.zone || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const viewingPharmacy = viewingId ? pharmacies.find(p => p.id === viewingId) : null;

  // Función para abrir GPS
  const openGPS = (lat: number, lng: number) => {
    // Abre Google Maps en modo navegación
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
  };

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-10 animate-in fade-in duration-500 pb-24">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Directorio de Farmacias</h1>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">Gestión de Sedes y Ubicaciones</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg shadow-orange-500/30 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" /> Nueva Farmacia
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
        {/* Buscador */}
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Buscar farmacia..." 
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium text-slate-700 placeholder:text-slate-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-400 text-[10px] uppercase tracking-widest font-black border-b border-slate-100">
                <th className="p-6">Nombre</th>
                <th className="p-6">Zona</th>
                <th className="p-6">Teléfono</th>
                <th className="p-6">Seguridad</th> {/* COLUMNA NUEVA */}
                <th className="p-6 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {filteredPharmacies.map((pharmacy) => (
                <tr key={pharmacy.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                  <td className="p-6">
                    <div className="font-bold text-slate-800">{pharmacy.name}</div>
                    <div className="text-xs text-slate-400 font-medium truncate max-w-[250px]">{pharmacy.address}</div>
                  </td>
                  <td className="p-6">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-wide">
                      {pharmacy.zone || 'Sin Zona'}
                    </span>
                  </td>
                  <td className="p-6 font-mono text-slate-500 text-xs">
                    {pharmacy.corporatePhone || 'N/A'}
                  </td>
                  <td className="p-6">
                    {/* INDICADOR EN TABLA */}
                    {pharmacy.hasSecurityOfficer ? (
                      <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg w-fit border border-emerald-100">
                        <ShieldCheck className="w-3 h-3" />
                        <span className="text-[9px] font-black uppercase">Vigilante</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-slate-400 bg-slate-100 px-2 py-1 rounded-lg w-fit border border-slate-200">
                        <ShieldAlert className="w-3 h-3" />
                        <span className="text-[9px] font-black uppercase">Sin Personal</span>
                      </div>
                    )}
                  </td>
                  <td className="p-6 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => setViewingId(pharmacy.id)}
                        className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                        title="Ver Detalles"
                      >
                        <Store className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleOpenModal(pharmacy)}
                        className="p-2 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-all"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => onDelete(pharmacy.id)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL CREAR / EDITAR */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-black text-slate-900 uppercase">{editingId ? 'Editar Farmacia' : 'Registrar Farmacia'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nombre</label>
                <input 
                  required
                  type="text" 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-bold text-slate-700"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Zona</label>
                  <select 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-bold text-slate-700"
                    value={formData.zone}
                    onChange={e => setFormData({...formData, zone: e.target.value})}
                  >
                    <option value="Gran Caracas">Gran Caracas</option>
                    <option value="Gran Caracas Llanos">Gran Caracas Llanos</option>
                    <option value="Oriente">Oriente</option>
                    <option value="Occidente">Occidente</option>
                    <option value="Andes">Andes</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Teléfono</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-bold text-slate-700"
                    value={formData.corporatePhone}
                    onChange={e => setFormData({...formData, corporatePhone: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dirección</label>
                <textarea 
                  rows={2}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium text-slate-700"
                  value={formData.address}
                  onChange={e => setFormData({...formData, address: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Coordenadas (Lat, Lng)</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-mono text-sm font-bold text-slate-700"
                    placeholder="Ej: 10.4806, -66.9036"
                    value={formData.coordinates}
                    onChange={e => setFormData({...formData, coordinates: e.target.value})}
                  />
                </div>
              </div>

              {/* SWITCH DE SEGURIDAD NUEVO */}
              <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 flex items-center justify-between mt-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 text-sm">Oficial de Seguridad</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">¿Posee vigilancia?</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={formData.hasSecurityOfficer}
                    onChange={e => setFormData({...formData, hasSecurityOfficer: e.target.checked})}
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                </label>
              </div>

              <button 
                type="submit" 
                className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold uppercase tracking-widest text-xs transition-all shadow-lg mt-6"
              >
                Guardar Datos
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DETALLES (OJITO) */}
      {viewingPharmacy && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 relative">
            
            <div className="h-28 bg-slate-900 relative flex items-center justify-center">
              <button 
                onClick={() => setViewingId(null)}
                className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition-all"
              >
                <X className="w-5 h-5" />
              </button>
              <Store className="w-12 h-12 text-orange-500" />
            </div>

            <div className="p-8 text-center -mt-10 relative">
              <div className="bg-white p-4 rounded-2xl shadow-lg inline-block mb-4">
                <h2 className="text-xl font-black text-slate-900">{viewingPharmacy.name}</h2>
              </div>
              
              <div className="space-y-4 text-left">
                {/* INDICADOR SEGURIDAD DETALLE */}
                <div className="flex justify-center mb-6">
                  {viewingPharmacy.hasSecurityOfficer ? (
                    <span className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wide flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4" /> Oficial Asignado
                    </span>
                  ) : (
                    <span className="bg-slate-100 text-slate-500 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wide flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4" /> Sin Oficial
                    </span>
                  )}
                </div>

                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Zona</p>
                  <p className="font-bold text-slate-700">{viewingPharmacy.zone || 'N/A'}</p>
                </div>
                
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Dirección</p>
                  <p className="font-medium text-slate-600 text-sm">{viewingPharmacy.address}</p>
                </div>

                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Teléfono</p>
                  <p className="font-mono text-slate-600 text-sm">{viewingPharmacy.corporatePhone || 'N/A'}</p>
                </div>

                {/* BOTÓN GPS NUEVO */}
                {viewingPharmacy.location ? (
                  <button 
                    onClick={() => openGPS(viewingPharmacy.location!.lat, viewingPharmacy.location!.lng)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/30 mt-6"
                  >
                    <Navigation className="w-4 h-4" /> Navegar con GPS
                  </button>
                ) : (
                  <p className="text-center text-xs text-slate-400 italic mt-6">Sin coordenadas GPS para navegación</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default PharmacyList;
