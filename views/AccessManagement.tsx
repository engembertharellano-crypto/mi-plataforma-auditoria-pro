import React, { useState, useEffect } from 'react';
import { 
  UserCheck, 
  UserX, 
  ShieldAlert, 
  Mail, 
  User, 
  Clock, 
  Trash2, 
  CheckCircle2, 
  X, 
  ShieldOff, 
  Ban,
  Globe,
  Save
} from 'lucide-react';

interface AccessManagementProps {
  users: any[];
  onApprove: (email: string) => void;
  onBlock: (email: string) => void;
  onDelete: (email: string) => void;

  // ✅ NUEVO: cambiar zona (lo ejecuta App.tsx / Supabase)
  onUpdateZone?: (email: string, zone: string) => void;
}

const AccessManagement: React.FC<AccessManagementProps> = ({ 
  users, 
  onApprove, 
  onBlock, 
  onDelete,
  onUpdateZone
}) => {
  const [managementRequest, setManagementRequest] = useState<any | null>(null);

  // ✅ NUEVO: borrador de zona en modal
  const [zoneDraft, setZoneDraft] = useState<string>('');

  const ADMIN_EMAILS = ['engemberth.arellano@gmail.com', 'gustavo.fernandez@dronena.com'];
  const ADMIN_ROLES = ['Super Usuario', 'Gerente Corporativo de Seguridad'];

  // ✅ catálogo de zonas (usa el mismo criterio que en tu app)
  const ZONES = ['Gran Caracas Llanos', 'Gran Caracas Oriente', 'Centro Occidente'];

  const isProtected = (user: any) => {
    return ADMIN_EMAILS.includes(user.email) || ADMIN_ROLES.includes(user.role);
  };

  const pendingUsers = users.filter(u => !u.isApproved && !isProtected(u) && !u.isBlocked);
  const activeUsers = users.filter(u => (u.isApproved || isProtected(u)) && !isProtected(u) && !u.isBlocked);
  const blockedUsers = users.filter(u => u.isBlocked && !isProtected(u));

  // ✅ cuando abres el modal, precarga la zona actual
  useEffect(() => {
    if (managementRequest) {
      setZoneDraft(managementRequest.zone || '');
    } else {
      setZoneDraft('');
    }
  }, [managementRequest]);

  const handleBlockAction = () => {
    if (managementRequest) {
      onBlock(managementRequest.email);
      setManagementRequest(null);
    }
  };

  const handleDeleteAction = () => {
    if (managementRequest) {
      onDelete(managementRequest.email);
      setManagementRequest(null);
    }
  };

  const handleZoneSave = () => {
    if (!managementRequest) return;
    if (!onUpdateZone) return;

    const newZone = (zoneDraft || '').trim();
    if (!newZone) return;

    // Evita acción si no cambió
    const current = (managementRequest.zone || '').trim();
    if (newZone === current) {
      setManagementRequest(null);
      return;
    }

    onUpdateZone(managementRequest.email, newZone);
    setManagementRequest(null);
  };

  return (
    <div className="max-w-6xl mx-auto p-10 animate-in fade-in duration-500">
      <div className="mb-12">
        <h2 className="text-4xl font-black text-white tracking-tighter drop-shadow-md uppercase">Gestión de Accesos</h2>
        <p className="text-slate-300 mt-2 font-bold uppercase tracking-[0.2em] text-[10px]">Administración de Identidades y Privilegios</p>
      </div>

      <div className="grid grid-cols-1 gap-12">
        
        {/* PENDING REQUESTS */}
        <section>
          <h3 className="text-sm font-black text-orange-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
             <Clock className="w-5 h-5" /> Solicitudes Pendientes ({pendingUsers.length})
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pendingUsers.map(user => (
              <div key={user.email} className="bg-white rounded-[2.5rem] p-8 border border-white shadow-2xl animate-in zoom-in-95">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300">
                    <User className="w-8 h-8" />
                  </div>
                  <span className="text-[9px] font-black uppercase bg-orange-50 text-orange-600 px-3 py-1 rounded-full border border-orange-100">Por Aprobar</span>
                </div>
                
                <h4 className="text-xl font-black text-slate-800 tracking-tight mb-1">{user.fullName}</h4>
                <div className="flex items-center gap-2 text-xs text-slate-400 font-bold mb-6">
                   <Mail className="w-3.5 h-3.5" /> {user.email}
                </div>
                
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-8">
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Cargo Solicitado</p>
                   <p className="text-sm font-bold text-slate-700 uppercase tracking-tight">{user.role}</p>
                   <p className="text-[10px] text-slate-400 mt-1">Zona: {user.zone}</p>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => setManagementRequest(user)}
                    className="flex-1 py-4 bg-red-50 text-red-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-100 transition-all flex items-center justify-center gap-2"
                  >
                    <UserX className="w-4 h-4" /> Descartar
                  </button>
                  <button 
                    onClick={() => onApprove(user.email)}
                    className="flex-[2] py-4 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 shadow-xl transition-all flex items-center justify-center gap-2"
                  >
                    <UserCheck className="w-4 h-4" /> Aprobar
                  </button>
                </div>
              </div>
            ))}
            {pendingUsers.length === 0 && (
              <div className="col-span-full py-16 bg-white/5 backdrop-blur-md rounded-[3rem] border-2 border-dashed border-white/10 flex flex-col items-center justify-center text-slate-400 opacity-60">
                 <ShieldAlert className="w-12 h-12 mb-4" />
                 <p className="font-bold uppercase tracking-widest text-xs">Sin solicitudes en curso</p>
              </div>
            )}
          </div>
        </section>

        {/* ACTIVE USERS TABLE */}
        <section>
           <h3 className="text-sm font-black text-black uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
             <CheckCircle2 className="w-5 h-5 text-emerald-400" /> Colaboradores Activos ({activeUsers.length})
           </h3>
           <div className="bg-white rounded-[3rem] overflow-hidden shadow-3xl border border-white">
              <table className="w-full text-left border-collapse">
                 <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                       <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Identidad Corporativa</th>
                       <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cargo</th>
                       <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Zona</th>
                       <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Gestión</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                    {activeUsers.map(user => (
                       <tr key={user.email} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="p-8">
                             <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 font-black text-xl shadow-inner">
                                   {user.fullName?.charAt(0) || 'U'}
                                </div>
                                <div>
                                   <p className="font-black text-slate-800 text-base">{user.fullName}</p>
                                   <p className="text-xs text-slate-400 font-medium">{user.email}</p>
                                </div>
                             </div>
                          </td>
                          <td className="p-8">
                             <span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border ${
                                user.role === 'Super Usuario' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-slate-100 text-slate-600 border-slate-200'
                             }`}>
                                {user.role === 'Super Usuario' ? 'Administrador de Sistemas' : user.role}
                             </span>
                          </td>
                          <td className="p-8 text-slate-500 font-bold text-sm uppercase">{user.zone}</td>
                          <td className="p-8 text-center">
                             <button 
                               onClick={() => setManagementRequest(user)}
                               className="p-4 text-slate-200 hover:text-orange-600 hover:bg-orange-50 rounded-2xl transition-all"
                               title="Gestionar Acceso"
                             >
                                <ShieldOff className="w-6 h-6" />
                             </button>
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </section>

        {/* BLOCKED USERS */}
        {blockedUsers.length > 0 && (
          <section>
             <h3 className="text-sm font-black text-red-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
               <Ban className="w-5 h-5" /> Accesos Suspendidos ({blockedUsers.length})
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {blockedUsers.map(user => (
                   <div key={user.email} className="bg-slate-900 rounded-[2.5rem] p-8 border border-white/10 shadow-2xl relative overflow-hidden group grayscale hover:grayscale-0 transition-all">
                      <div className="absolute top-0 right-0 p-4">
                         <Ban className="w-8 h-8 text-red-500/30 group-hover:text-red-500 transition-colors" />
                      </div>
                      <h4 className="text-xl font-black text-white tracking-tight mb-1">{user.fullName}</h4>
                      <p className="text-xs text-slate-500 font-bold mb-8">{user.email}</p>
                      
                      <div className="flex gap-3">
                        <button 
                          onClick={() => setManagementRequest(user)}
                          className="flex-1 py-3 bg-white/5 text-slate-400 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all"
                        >
                          Eliminar
                        </button>
                        <button 
                          onClick={() => onApprove(user.email)}
                          className="flex-[2] py-3 bg-emerald-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-emerald-500 transition-all"
                        >
                          Reactivar Acceso
                        </button>
                      </div>
                   </div>
                ))}
             </div>
          </section>
        )}

      </div>

      {/* REFINED MANAGEMENT MODAL */}
      {managementRequest && (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-xl z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-lg p-12 shadow-3xl border border-white/20 animate-in zoom-in-95 duration-200">
             <div className="w-24 h-24 bg-orange-100 rounded-[2.5rem] flex items-center justify-center mb-8 mx-auto text-orange-600 shadow-inner">
                <ShieldAlert className="w-12 h-12" />
             </div>
             <h3 className="text-3xl font-black text-slate-900 tracking-tighter mb-4 text-center">Protocolo de Seguridad</h3>
             <p className="text-slate-500 font-medium mb-8 text-sm text-center leading-relaxed">
               Usted está gestionando el perfil de <strong>{managementRequest.fullName}</strong>.<br/>Elija el nivel de restricción requerido:
             </p>

             {/* ✅ NUEVO: CAMBIO DE ZONA */}
             {onUpdateZone && !isProtected(managementRequest) && (
               <div className="mb-6 p-6 rounded-3xl border-2 border-slate-50 bg-slate-50/40">
                 <div className="flex items-center gap-3 mb-4">
                   <div className="p-3 bg-white rounded-2xl border border-slate-100 text-slate-600">
                     <Globe className="w-5 h-5" />
                   </div>
                   <div>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reasignación Territorial</p>
                     <p className="text-sm font-black text-slate-800 uppercase tracking-tight">Actualizar Zona del Usuario</p>
                   </div>
                 </div>

                 <select
                   className="w-full px-5 py-4 rounded-2xl border-2 border-slate-100 bg-white font-black text-slate-800 outline-none focus:border-indigo-600 transition-all"
                   value={zoneDraft}
                   onChange={(e) => setZoneDraft(e.target.value)}
                 >
                   <option value="">Seleccione zona...</option>
                   {ZONES.map(z => (
                     <option key={z} value={z}>{z}</option>
                   ))}
                 </select>

                 <button
                   onClick={handleZoneSave}
                   disabled={!zoneDraft || (zoneDraft || '').trim() === (managementRequest.zone || '').trim()}
                   className={`mt-4 w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all ${
                     !zoneDraft || (zoneDraft || '').trim() === (managementRequest.zone || '').trim()
                       ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                       : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-200'
                   }`}
                 >
                   <Save className="w-4 h-4" /> Guardar Zona
                 </button>

                 <p className="mt-3 text-[10px] text-slate-400 font-medium">
                   Zona actual: <span className="font-black text-slate-600">{managementRequest.zone || 'No definida'}</span>
                 </p>
               </div>
             )}
             
             <div className="space-y-4">
                {!managementRequest.isBlocked && (
                  <button 
                    onClick={handleBlockAction}
                    className="w-full group flex items-start gap-4 p-6 rounded-3xl border-2 border-slate-50 hover:border-orange-200 hover:bg-orange-50 transition-all text-left"
                  >
                    <div className="p-3 bg-orange-100 text-orange-600 rounded-2xl group-hover:bg-orange-600 group-hover:text-white transition-all">
                       <Ban className="w-6 h-6" />
                    </div>
                    <div>
                       <p className="font-black text-slate-800 uppercase text-xs tracking-widest mb-1">Bloquear Usuario</p>
                       <p className="text-[10px] text-slate-400 font-medium leading-relaxed">Suspende el acceso inmediatamente. Los registros históricos se mantienen.</p>
                    </div>
                  </button>
                )}

                <button 
                  onClick={handleDeleteAction}
                  className="w-full group flex items-start gap-4 p-6 rounded-3xl border-2 border-slate-50 hover:border-red-200 hover:bg-red-50 transition-all text-left"
                >
                  <div className="p-3 bg-red-100 text-red-600 rounded-2xl group-hover:bg-red-600 group-hover:text-white transition-all">
                     <Trash2 className="w-6 h-6" />
                  </div>
                  <div>
                     <p className="font-black text-slate-800 uppercase text-xs tracking-widest mb-1">Eliminar Permanentemente</p>
                     <p className="text-[10px] text-slate-400 font-medium leading-relaxed">Elimina la ficha de usuario y su rastro en los filtros activos de Gerencia.</p>
                  </div>
                </button>
             </div>

             <div className="mt-10 pt-8 border-t border-slate-100 text-center">
                <button 
                  onClick={() => setManagementRequest(null)} 
                  className="px-10 py-3 rounded-xl text-slate-400 font-black uppercase tracking-widest text-[9px] hover:text-slate-800 transition-all"
                >
                  Regresar sin cambios
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccessManagement;
