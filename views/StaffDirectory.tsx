
import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Phone, 
  UserCircle, 
  Briefcase, 
  Grid, 
  List, 
  X,
  Trash2,
  Building2,
  UserPlus,
  Table,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  ChevronDown
} from 'lucide-react';
import { Pharmacy, StaffRecord } from '../types';

interface StaffDirectoryProps {
  pharmacies: Pharmacy[];
  staffRecords: StaffRecord[];
  onAddStaff: (record: StaffRecord) => void;
  onDeleteStaff: (id: string) => void;
}

// Configuración de Jerarquía para el ordenamiento automático
const ROLE_HIERARCHY: Record<string, number> = {
  'Gerente': 1,
  'Gerente/Regente': 2,
  'Regente': 3,
  'Senior': 4,
  'Aprendiz de Farmacia': 5,
  'APV': 6
};

const StaffDirectory: React.FC<StaffDirectoryProps> = ({ 
  pharmacies, 
  staffRecords, 
  onAddStaff, 
  onDeleteStaff 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [showModal, setShowModal] = useState(false);
  const [showConsolidated, setShowConsolidated] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ id: string; name: string } | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    pharmacyId: '',
    fullName: '',
    role: 'Gerente', // Default value from the hierarchy
    phone: ''
  });

  const confirmDelete = () => {
    if (deleteConfirmation) {
      onDeleteStaff(deleteConfirmation.id);
      setDeleteConfirmation(null);
    }
  };

  const handleSave = () => {
    if (!formData.pharmacyId || !formData.fullName || !formData.role) {
      alert("Por favor complete todos los campos obligatorios.");
      return;
    }

    const newStaff: StaffRecord = {
      id: `staff-${Date.now()}`,
      pharmacyId: formData.pharmacyId,
      fullName: formData.fullName,
      role: formData.role,
      phone: formData.phone
    };

    onAddStaff(newStaff);
    setShowModal(false);
    setFormData({ pharmacyId: '', fullName: '', role: 'Gerente', phone: '' });
  };

  // Helper function to sort staff by hierarchy
  const sortStaffByHierarchy = (staff: StaffRecord[]) => {
    return [...staff].sort((a, b) => {
      const rankA = ROLE_HIERARCHY[a.role] || 99;
      const rankB = ROLE_HIERARCHY[b.role] || 99;
      return rankA - rankB;
    });
  };

  const filteredStaff = sortStaffByHierarchy(
    staffRecords.filter(s => 
      s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      s.role.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // --- CSV EXPORT LOGIC (Con Jerarquía) ---
  const downloadConsolidatedCSV = () => {
    const headers = [
      'Sede / Farmacia',
      'Nombre Completo',
      'Cargo / Rol',
      'Teléfono de Contacto',
      'Teléfono Corporativo Sede'
    ];

    const escapeCsvCell = (cellData: any): string => {
      if (cellData === null || cellData === undefined) return '""';
      const str = String(cellData);
      return `"${str.replace(/"/g, '""').replace(/\n/g, ' ')}"`;
    };

    const rows: string[][] = [];

    pharmacies.forEach(p => {
      // Get staff and sort them by hierarchy before pushing to CSV rows
      const staffInPharmacy = sortStaffByHierarchy(
        staffRecords.filter(s => s.pharmacyId === p.id)
      );
      
      if (staffInPharmacy.length === 0) {
        rows.push([
          p.name,
          'Sin personal registrado',
          '---',
          '---',
          p.corporatePhone || 'No registrado'
        ].map(escapeCsvCell));
      } else {
        staffInPharmacy.forEach(staff => {
          rows.push([
            p.name,
            staff.fullName,
            staff.role,
            staff.phone || '---',
            p.corporatePhone || 'No registrado'
          ].map(escapeCsvCell));
        });
      }
    });

    const csvContent = [
      headers.map(escapeCsvCell).join(';'),
      ...rows.map(row => row.join(';'))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Consolidado_Personal_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- RENDER MODAL CONSOLIDADO ---
  const renderConsolidatedModal = () => (
    <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm z-[80] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-6xl h-[85vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
           <div className="flex items-center gap-3">
              <div className="bg-orange-100 p-2 rounded-lg text-orange-700">
                 <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                 <h3 className="text-xl font-bold text-slate-800">Consolidado Jerárquico de Personal</h3>
                 <p className="text-xs text-slate-500 font-medium">Listado maestro clasificado por nivel de cargo</p>
              </div>
           </div>
           <div className="flex gap-3">
              <button 
                onClick={downloadConsolidatedCSV}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-sm shadow-sm transition-colors"
              >
                <Download className="w-4 h-4" /> Exportar CSV
              </button>
              <button 
                onClick={() => setShowConsolidated(false)}
                className="p-2 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
           </div>
        </div>

        <div className="flex-1 overflow-auto">
           <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-slate-100 text-slate-600 uppercase text-xs font-bold sticky top-0 z-10 shadow-sm">
                 <tr>
                    <th className="p-4 border-b border-r border-slate-200 min-w-[200px]">Sede / Farmacia</th>
                    <th className="p-4 border-b border-r border-slate-200">Nombre del Colaborador</th>
                    <th className="p-4 border-b border-r border-slate-200">Cargo / Posición</th>
                    <th className="p-4 border-b border-r border-slate-200 text-center">Teléfono Personal</th>
                    <th className="p-4 border-b border-slate-200 text-center">Tel. Corporativo Sede</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                 {pharmacies.map((p, pIdx) => {
                    // Sorting staff by hierarchy here
                    const staffInPharmacy = sortStaffByHierarchy(
                      staffRecords.filter(s => s.pharmacyId === p.id)
                    );
                    const rowClass = pIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30';

                    if (staffInPharmacy.length === 0) {
                      return (
                        <tr key={p.id} className={`${rowClass} hover:bg-slate-50 transition-colors`}>
                           <td className="p-4 font-bold text-slate-700 border-r border-slate-100">{p.name}</td>
                           <td colSpan={3} className="p-4 text-center text-slate-400 italic text-xs">Sin personal registrado</td>
                           <td className="p-4 text-center font-mono text-xs text-slate-500">{p.corporatePhone || '---'}</td>
                        </tr>
                      );
                    }

                    return staffInPharmacy.map((staff, sIdx) => (
                      <tr key={staff.id} className={`${rowClass} hover:bg-slate-50 transition-colors`}>
                         {sIdx === 0 ? (
                           <td 
                             className="p-4 font-bold text-slate-800 border-r border-slate-100 align-top" 
                             rowSpan={staffInPharmacy.length}
                           >
                              <div className="sticky top-16">
                                {p.name}
                                <p className="text-[10px] text-orange-600 font-black mt-1">({staffInPharmacy.length} Personas)</p>
                              </div>
                           </td>
                         ) : null}
                         <td className="p-4 border-r border-slate-100 font-medium text-slate-700">{staff.fullName}</td>
                         <td className="p-4 border-r border-slate-100">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase border shadow-sm ${
                              staff.role.includes('Gerente') ? 'bg-orange-50 text-orange-600 border-orange-100' :
                              staff.role === 'Regente' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                              staff.role === 'Senior' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                              staff.role === 'APV' ? 'bg-red-50 text-red-600 border-red-100' :
                              'bg-slate-100 text-slate-600 border-slate-200'
                            }`}>
                              {staff.role}
                            </span>
                         </td>
                         <td className="p-4 border-r border-slate-100 text-center font-mono text-slate-600 text-xs">
                            {staff.phone || '---'}
                         </td>
                         {sIdx === 0 ? (
                            <td 
                              className="p-4 text-center align-top font-mono text-xs text-slate-500" 
                              rowSpan={staffInPharmacy.length}
                            >
                               {p.corporatePhone || '---'}
                            </td>
                         ) : null}
                      </tr>
                    ));
                 })}
              </tbody>
           </table>
        </div>
        <div className="p-4 bg-slate-50 border-t border-slate-100 text-right">
           <p className="text-xs text-slate-400 font-bold uppercase">Total de colaboradores registrados en red: <span className="text-slate-800 ml-1">{staffRecords.length}</span></p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-8 animate-in fade-in duration-500">
      
      {/* HEADER SECTION - Ajuste de contraste para el fondo oscuro */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight drop-shadow-md">Directorio de Personal</h2>
          <p className="text-slate-300 mt-1 font-medium">Gestión operativa y jerárquica</p>
        </div>
        <div className="flex gap-3">
          <button 
              onClick={() => setShowConsolidated(true)}
              className="bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-sm transition-all"
          >
              <Table className="w-5 h-5 text-orange-400" /> Consolidado General
          </button>
          <div className="bg-white/10 backdrop-blur-md p-1 rounded-xl border border-white/20 shadow-sm flex">
            <button 
              onClick={() => setViewMode('cards')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'cards' ? 'bg-white text-orange-600' : 'text-slate-400 hover:text-white'}`}
              title="Vista por Farmacia"
            >
              <Grid className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'table' ? 'bg-white text-orange-600' : 'text-slate-400 hover:text-white'}`}
              title="Vista Consolidada (Tabla)"
            >
              <List className="w-5 h-5" />
            </button>
          </div>
          <button 
            onClick={() => setShowModal(true)}
            className="bg-orange-600 hover:bg-orange-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-orange-600/20 transition-all transform hover:-translate-y-0.5"
          >
            <UserPlus className="w-5 h-5" /> Registrar Personal
          </button>
        </div>
      </div>

      {/* SEARCH */}
      <div className="mb-8 relative">
        <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input 
          type="text" 
          placeholder="Buscar por nombre o cargo..."
          className="w-full pl-12 pr-4 py-4 border border-white/20 rounded-2xl outline-none focus:ring-4 focus:ring-orange-500/10 bg-white/80 backdrop-blur-sm shadow-sm text-lg transition-all"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* VIEW MODES */}
      {viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {pharmacies.map(pharmacy => {
            const staffInPharmacy = filteredStaff.filter(s => s.pharmacyId === pharmacy.id);
            if (searchTerm && staffInPharmacy.length === 0) return null;

            return (
              <div key={pharmacy.id} className="glass-card rounded-[2rem] overflow-hidden flex flex-col border border-white/60 shadow-lg hover:shadow-2xl transition-all duration-300 group">
                <div className="bg-slate-50/80 px-8 py-5 border-b border-slate-100 flex items-center gap-4 backdrop-blur-sm">
                   <div className="p-3 bg-white rounded-2xl border border-slate-100 shadow-sm text-orange-600 group-hover:scale-110 transition-transform">
                     <Building2 className="w-6 h-6" />
                   </div>
                   <div>
                     <h3 className="font-black text-slate-800 text-lg leading-none">{pharmacy.name}</h3>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Sede Registrada</p>
                   </div>
                </div>

                <div className="bg-orange-50/40 px-8 py-3 border-b border-orange-100/50 flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-orange-500" />
                      <span className="font-bold text-slate-700 text-sm">{pharmacy.corporatePhone || 'Sin corporativo'}</span>
                   </div>
                   <span className="bg-white/60 px-2 py-0.5 rounded-lg text-[9px] font-black text-slate-400 border border-slate-100">TELÉFONO SEDE</span>
                </div>
                
                <div className="p-6 flex-1 bg-white/40">
                  {staffInPharmacy.length > 0 ? (
                    <div className="space-y-4">
                      {staffInPharmacy.map(staff => (
                        <div key={staff.id} className="flex items-start justify-between p-4 rounded-2xl bg-white/60 hover:bg-white border border-transparent hover:border-slate-100 transition-all shadow-sm hover:shadow group/item">
                          <div className="flex gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center text-slate-400 font-black border border-slate-200 text-xl shadow-inner">
                              {staff.fullName.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-slate-800 text-base">{staff.fullName}</p>
                              <div className={`flex items-center gap-2 text-[10px] font-black uppercase px-2 py-0.5 rounded-md mb-1 border ${
                                staff.role.includes('Gerente') ? 'bg-orange-50 text-orange-600 border-orange-100' :
                                staff.role === 'Regente' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                                staff.role === 'Senior' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                staff.role === 'APV' ? 'bg-red-50 text-red-600 border-red-100' :
                                'bg-slate-50 text-slate-500 border-slate-200'
                              }`}>
                                <Briefcase className="w-3.5 h-3.5" />
                                {staff.role}
                              </div>
                              {staff.phone && (
                                <a href={`tel:${staff.phone}`} className="flex items-center gap-2 text-xs text-slate-400 font-mono hover:text-blue-600 transition-colors">
                                  <Phone className="w-3.5 h-3.5" />
                                  {staff.phone}
                                </a>
                              )}
                            </div>
                          </div>
                          <button 
                            onClick={() => setDeleteConfirmation({ id: staff.id, name: staff.fullName })}
                            className="text-slate-300 hover:text-red-500 opacity-0 group-hover/item:opacity-100 transition-opacity p-2 hover:bg-red-50 rounded-xl"
                            title="Eliminar"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-slate-300 flex flex-col items-center">
                      <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4 border border-dashed border-slate-200">
                        <Users className="w-8 h-8 opacity-20" />
                      </div>
                      <p className="text-sm font-bold">Sin personal asignado</p>
                      <button 
                        onClick={() => {
                          setFormData(prev => ({ ...prev, pharmacyId: pharmacy.id }));
                          setShowModal(true);
                        }}
                        className="text-xs text-orange-600 font-black mt-3 hover:underline tracking-widest uppercase"
                      >
                        + Agregar Colaborador
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // TABLE VIEW (CONSOLIDATED IN-PAGE)
        <div className="glass-card rounded-[2rem] overflow-hidden shadow-xl border border-white/60">
           <table className="w-full text-left border-collapse">
             <thead>
               <tr className="bg-slate-50/80 border-b border-slate-200 backdrop-blur-sm">
                 <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest pl-8">Colaborador</th>
                 <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest">Cargo / Posición</th>
                 <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest">Sede (Farmacia)</th>
                 <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest text-center">Teléfono</th>
                 <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest text-center">Acciones</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-slate-100">
               {filteredStaff.map(staff => {
                 const pharmacy = pharmacies.find(p => p.id === staff.pharmacyId);
                 return (
                   <tr key={staff.id} className="hover:bg-slate-50/50 transition-colors group">
                     <td className="p-6 pl-8 font-bold text-slate-800 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-black text-base shadow-sm">
                          {staff.fullName.charAt(0)}
                        </div>
                        {staff.fullName}
                     </td>
                     <td className="p-6">
                       <span className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-tight shadow-sm border ${
                         staff.role.includes('Gerente') ? 'bg-orange-50 text-orange-600 border-orange-100' :
                         staff.role === 'Regente' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                         staff.role === 'Senior' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                         'bg-white text-slate-600 border-slate-200'
                       }`}>
                         {staff.role}
                       </span>
                     </td>
                     <td className="p-6 text-sm text-slate-600 font-bold">
                        <div className="flex items-center gap-2">
                           <Building2 className="w-4 h-4 text-slate-300" />
                           {pharmacy?.name || '---'}
                        </div>
                     </td>
                     <td className="p-6 text-center text-sm text-slate-500 font-mono font-bold">{staff.phone || 'N/A'}</td>
                     <td className="p-6 text-center">
                       <button 
                         onClick={() => setDeleteConfirmation({ id: staff.id, name: staff.fullName })}
                         className="text-slate-300 hover:text-red-500 p-3 rounded-xl hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                       >
                         <Trash2 className="w-5 h-5" />
                       </button>
                     </td>
                   </tr>
                 );
               })}
               {filteredStaff.length === 0 && (
                 <tr>
                   <td colSpan={5} className="p-20 text-center text-slate-300">
                     <div className="flex flex-col items-center gap-4">
                        <Users className="w-12 h-12 opacity-10" />
                        <p className="font-bold text-lg">No se encontró personal registrado.</p>
                     </div>
                   </td>
                 </tr>
               )}
             </tbody>
           </table>
        </div>
      )}

      {/* CONFIRMATION MODAL */}
      {deleteConfirmation && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
             <div className="flex flex-col items-center text-center">
                <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-600">
                   <Trash2 className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-black text-slate-800 mb-2">¿Eliminar {deleteConfirmation.name}?</h3>
                <p className="text-slate-500 mb-6">Esta persona será eliminada permanentemente del directorio de personal.</p>
                
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

      {/* MODAL FORM */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-200 overflow-hidden border border-white/20">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
                <UserCircle className="w-7 h-7 text-orange-600" />
                Registrar Personal
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-8 space-y-6">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Farmacia (Sede)</label>
                <select 
                  className="w-full p-4 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 bg-slate-50 font-bold text-slate-700 transition-all"
                  value={formData.pharmacyId}
                  onChange={(e) => setFormData({...formData, pharmacyId: e.target.value})}
                >
                  <option value="">Seleccione una sede...</option>
                  {pharmacies.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Nombre Completo</label>
                <input 
                  type="text"
                  placeholder="Ej. María González"
                  className="w-full p-4 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 font-bold text-slate-800 transition-all placeholder:text-slate-300"
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Cargo / Rol</label>
                  <div className="relative">
                    <select 
                      className="w-full p-4 pr-10 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 font-bold text-slate-800 transition-all appearance-none bg-white"
                      value={formData.role}
                      onChange={(e) => setFormData({...formData, role: e.target.value})}
                    >
                      {Object.keys(ROLE_HIERARCHY).map(role => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                    <ChevronDown className="w-5 h-5 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Teléfono</label>
                  <input 
                    type="tel"
                    placeholder="0414-0000000"
                    className="w-full p-4 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 font-mono font-bold text-slate-800 transition-all"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div className="p-8 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 rounded-b-3xl">
              <button 
                onClick={() => setShowModal(false)}
                className="px-8 py-3 rounded-2xl text-slate-600 font-black uppercase tracking-widest text-xs hover:bg-slate-200 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSave}
                className="px-8 py-3 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-black uppercase tracking-widest text-xs shadow-lg shadow-orange-500/30 transition-all transform active:scale-95"
              >
                Guardar Personal
              </button>
            </div>
          </div>
        </div>
      )}

      {showConsolidated && renderConsolidatedModal()}

    </div>
  );
};

export default StaffDirectory;
