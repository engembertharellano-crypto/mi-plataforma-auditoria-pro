import React, { useMemo, useState } from 'react';
import {
  UserCheck,
  UserX,
  ShieldAlert,
  Mail,
  User,
  Clock,
  Trash2,
  CheckCircle2,
  ShieldOff,
  Ban,
  MapPin,
  Pencil,
  X
} from 'lucide-react';

interface AccessManagementProps {
  users: any[];
  onApprove: (email: string) => void;
  onBlock: (email: string) => void;
  onDelete: (email: string) => void;

  // ✅ NUEVO: actualizar zona
  onUpdateZone: (email: string, zone: string) => void;
}

const ZONES = ['Gran Caracas Llanos', 'Gran Caracas Oriente', 'Centro Occidente', 'Global'];

const AccessManagement: React.FC<AccessManagementProps> = ({ users, onApprove, onBlock, onDelete, onUpdateZone }) => {
  const [managementRequest, setManagementRequest] = useState<any | null>(null);

  // ✅ Modal de cambio de zona
  const [zoneRequest, setZoneRequest] = useState<{ email: string; fullName: string; currentZone: string } | null>(null);
  const [selectedZone, setSelectedZone] = useState<string>('');

  const ADMIN_EMAILS = ['engemberth.arellano@gmail.com', 'gustavo.fernandez@dronena.com'];
  const ADMIN_ROLES = ['Super Usuario', 'Gerente Corporativo de Seguridad'];

  const isProtected = (user: any) => {
    return ADMIN_EMAILS.includes(user.email) || ADMIN_ROLES.includes(user.role);
  };

  const pendingUsers = useMemo(() => users.filter(u => !u.isApproved && !isProtected(u) && !u.isBlocked), [users]);
  const activeUsers = useMemo(() => users.filter(u => (u.isApproved || isProtected(u)) && !isProtected(u) && !u.isBlocked), [users]);
  const blockedUsers = useMemo(() => users.filter(u => u.isBlocked && !isProtected(u)), [users]);

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

  const openZoneModal = (user: any) => {
    setZoneRequest({
      email: user.email,
      fullName: user.fullName,
      currentZone: user.zone || 'Global'
    });
    setSelectedZone(user.zone || 'Global');
  };

  const confirmZoneChange = () => {
    if (!zoneRequest) return;
    onUpdateZone(zoneRequest.email, selectedZone);
    setZoneRequest(null);
    setSelectedZone('');
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
                      <span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border ${user.role === 'Super Usuario'
                        ? 'bg-indigo-50 text-indigo-600 border-indigo-100'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                        {user.role === 'Super Usuario' ? 'Administrador de Sistemas' : user.role}
                      </span>
                    </td>

                    {/* ✅ Zona + botón de edición */}
                    <td className="p-8">
                      <div className="flex items-center gap-3">
                        <span className="text-slate-500 font-bold text-sm uppercase">{user.zone}</span>

                        <button
                          onClick={() => openZoneModal(user)}
                          className="p-2 rounded-xl border border-slate-100 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                          title="Cambiar Zona"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      </div>
                    </td>

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
            <p className="text-slate-500 font-medium mb-10 text-sm text-center leading-relaxed">
              Usted está gestionando el perfil de <strong>{managementRequest.fullName}</strong>.<br />Elija el nivel de restricción requerido:
            </p>

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

      {/* ✅ MODAL CAMBIO DE ZONA */}
      {zoneRequest && (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-xl z-[210] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-lg p-12 shadow-3xl border border-white/20 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start mb-8">
              <div className="w-20 h-20 bg-indigo-100 rounded-[2rem] flex items-center justify-center text-indigo-600 shadow-inner">
                <MapPin className="w-10 h-10" />
              </div>
              <button
                onClick={() => setZoneRequest(null)}
                className="p-3 rounded-2xl hover:bg-slate-50 transition-all text-slate-400"
                title="Cerrar"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <h3 className="text-3xl font-black text-slate-900 tracking-tighter mb-3">Cambiar Zona</h3>
            <p className="text-slate-500 font-medium mb-10 text-sm leading-relaxed">
              Usuario: <strong>{zoneRequest.fullName}</strong><br />
              Zona actual: <strong>{zoneRequest.currentZone}</strong>
            </p>

            <div className="space-y-3">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                Nueva Zona
              </label>

              <select
                className="w-full p-5 border-2 border-slate-100 rounded-[1.5rem] outline-none focus:border-indigo-600 bg-white font-black text-slate-800 transition-all cursor-pointer"
                value={selectedZone}
                onChange={(e) => setSelectedZone(e.target.value)}
              >
                {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
              </select>
            </div>

            <div className="mt-10 flex gap-4">
              <button
                onClick={() => setZoneRequest(null)}
                className="flex-1 py-4 rounded-2xl border-2 border-slate-100 text-slate-500 font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={confirmZoneChange}
                className="flex-1 py-4 rounded-2xl bg-indigo-600 text-white font-black uppercase tracking-widest text-[10px] shadow-xl shadow-indigo-200 transition-all transform active:scale-95"
              >
                Aplicar Cambio
              </button>
            </div>

            <p className="mt-6 text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
              Nota: si este usuario está logueado, el cambio se aplica de inmediato.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccessManagement;
