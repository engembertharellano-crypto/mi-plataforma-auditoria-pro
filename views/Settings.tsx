import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  User, 
  Lock, 
  Database, 
  ChevronRight, 
  Trash2, 
  Save, 
  AlertTriangle,
  AlertCircle,
  LogOut,
  RefreshCw,
  CheckCircle2,
  Terminal,
  DatabaseZap,
  Wrench,
  KeyRound,
  Eye,
  EyeOff,
  Loader2
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface SettingsProps {
  user: any;
  onLogout: () => void;
}

const Settings: React.FC<SettingsProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'system'>('profile');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [diagnostics, setDiagnostics] = useState<Record<string, { ok: boolean, hasColumns: boolean, error?: string }>>({});
  
  // Password Change State
  const [pwdForm, setPwdForm] = useState({ old: '', new: '', confirm: '' });
  const [isUpdatingPwd, setIsUpdatingPwd] = useState(false);
  const [pwdStatus, setPwdStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);
  const [showPwds, setShowPwds] = useState({ old: false, new: false, confirm: false });

  const canAccessSystem = [
    'Super Usuario', 
    'Gerente de seguridad'
  ].includes(user.role) || user.email === 'engemberth.arellano@xana.com';

  const menuItems = [
    { id: 'profile', label: 'Mi Perfil', icon: User },
    { id: 'security', label: 'Seguridad', icon: Lock },
    ...(canAccessSystem ? [{ id: 'system', label: 'Sistema y Datos', icon: Database }] : []),
  ];

  const handleResetDatabase = () => {
    localStorage.removeItem('xana_hybrid_cache');
    window.location.reload();
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setPwdStatus(null);

    // Validaciones básicas
    if (pwdForm.old !== user.password) {
      setPwdStatus({ type: 'error', msg: 'La contraseña actual no es correcta.' });
      return;
    }
    if (pwdForm.new.length < 6) {
      setPwdStatus({ type: 'error', msg: 'La nueva clave debe tener al menos 6 caracteres.' });
      return;
    }
    if (pwdForm.new !== pwdForm.confirm) {
      setPwdStatus({ type: 'error', msg: 'Las nuevas contraseñas no coinciden.' });
      return;
    }

    setIsUpdatingPwd(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({ password: pwdForm.new })
        .eq('email', user.email);

      if (error) throw error;

      setPwdStatus({ type: 'success', msg: 'Contraseña actualizada correctamente.' });
      setPwdForm({ old: '', new: '', confirm: '' });
    } catch (err: any) {
      setPwdStatus({ type: 'error', msg: 'Error de red al intentar actualizar.' });
    } finally {
      setIsUpdatingPwd(false);
    }
  };

  const runDiagnostics = async () => {
    if (!supabase || !canAccessSystem) return;
    setIsDiagnosing(true);
    
    const operationalTables = [
      'audits', 'cctv_records', 'physical_records', 
      'management_visits', 'pending_tasks', 'staff', 'support_contacts', 
      'delivery_receipts', 'assets', 'loans', 'schedule'
    ];

    const masterTables = ['pharmacies', 'users'];
    const allTables = [...masterTables, ...operationalTables];
    const results: any = {};

    for (const table of allTables) {
      const needsCreatedBy = operationalTables.includes(table);
      const fieldToCheck = table === 'users' ? 'email' : 'id';
      const selectFields = needsCreatedBy ? `${fieldToCheck}, created_by` : fieldToCheck;

      const { error } = await supabase.from(table).select(selectFields).limit(1);
      
      if (!error) {
        results[table] = { ok: true, hasColumns: true };
      } else {
        const isMissingColumn = error.message.includes('column "created_by" does not exist');
        const isTableMissing = error.message.includes('does not exist') && !isMissingColumn;

        results[table] = { 
          ok: !isTableMissing, 
          hasColumns: !isMissingColumn,
          error: error.message 
        };
      }
    }
    setDiagnostics(results);
    setIsDiagnosing(false);
  };

  const getDisplayRole = (role: string) => {
    if (role === 'Super Usuario') return 'Administrador de Sistemas';
    return role;
  };

  return (
    <div className="max-w-5xl mx-auto p-10 animate-in fade-in duration-500 pb-20">
      <div className="flex items-center gap-5 mb-12">
        <div className="p-4 bg-white/10 backdrop-blur-md rounded-[1.5rem] shadow-2xl text-white border border-white/20">
          <SettingsIcon className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-4xl font-black text-white tracking-tighter drop-shadow-md uppercase">Configuración</h2>
          <p className="text-slate-300 mt-1 font-bold uppercase tracking-[0.2em] text-[10px]">Preferencias y Mantenimiento del Sistema</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center justify-between p-5 rounded-[1.5rem] transition-all duration-300 group ${
                activeTab === item.id 
                ? 'bg-white text-slate-900 shadow-xl translate-x-2' 
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-4">
                <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-orange-500' : 'text-slate-500'}`} />
                <span className="font-black uppercase tracking-widest text-[10px]">{item.label}</span>
              </div>
              <ChevronRight className={`w-4 h-4 transition-transform ${activeTab === item.id ? 'rotate-90' : ''}`} />
            </button>
          ))}
          
          <div className="pt-10">
            <button 
              onClick={onLogout}
              className="w-full flex items-center gap-4 p-5 rounded-[1.5rem] text-red-400 hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/20"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-black uppercase tracking-widest text-[10px]">Cerrar Sesión</span>
            </button>
          </div>
        </div>

        <div className="lg:col-span-8">
          <div className="bg-white rounded-[3rem] shadow-3xl border border-white p-10 min-h-[500px]">
            
            {activeTab === 'profile' && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex items-center gap-6 mb-12">
                   <div className="w-20 h-20 bg-slate-900 rounded-[2rem] flex items-center justify-center text-white text-3xl font-black shadow-2xl">
                     {user.fullName?.charAt(0)}
                   </div>
                   <div>
                     <h3 className="text-2xl font-black text-slate-800 tracking-tight">{user.fullName}</h3>
                     <p className="text-orange-600 font-black uppercase tracking-widest text-[10px]">{getDisplayRole(user.role)}</p>
                   </div>
                </div>

                <div className="space-y-8">
                   <div className="grid grid-cols-2 gap-6">
                      <div className="p-6 bg-slate-50 rounded-[1.5rem] border border-slate-100">
                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Correo Electrónico</p>
                         <p className="font-bold text-slate-700">{user.email}</p>
                      </div>
                      <div className="p-6 bg-slate-50 rounded-[1.5rem] border border-slate-100">
                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Zona Asignada</p>
                         <p className="font-bold text-slate-700 uppercase">{user.zone}</p>
                      </div>
                   </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex items-center gap-4 mb-10">
                   <div className="p-3 bg-orange-50 text-orange-600 rounded-2xl">
                      <KeyRound className="w-6 h-6" />
                   </div>
                   <div>
                      <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Cambiar Contraseña</h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Actualización de credenciales corporativas</p>
                   </div>
                </div>

                <form onSubmit={handleUpdatePassword} className="space-y-6 max-w-sm">
                   {pwdStatus && (
                     <div className={`p-4 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 border ${pwdStatus.type === 'success' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                        {pwdStatus.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                        {pwdStatus.msg}
                     </div>
                   )}

                   <div className="space-y-4">
                      <div>
                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Contraseña Actual</label>
                        <div className="relative">
                          <input 
                            type={showPwds.old ? "text" : "password"}
                            className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none focus:border-orange-500 font-bold text-slate-700 transition-all"
                            value={pwdForm.old}
                            onChange={e => setPwdForm({...pwdForm, old: e.target.value})}
                          />
                          <button type="button" onClick={() => setShowPwds({...showPwds, old: !showPwds.old})} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300">
                             {showPwds.old ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Nueva Contraseña</label>
                        <div className="relative">
                          <input 
                            type={showPwds.new ? "text" : "password"}
                            className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none focus:border-orange-500 font-bold text-slate-700 transition-all"
                            value={pwdForm.new}
                            onChange={e => setPwdForm({...pwdForm, new: e.target.value})}
                          />
                          <button type="button" onClick={() => setShowPwds({...showPwds, new: !showPwds.new})} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300">
                             {showPwds.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Confirmar Nueva Contraseña</label>
                        <div className="relative">
                          <input 
                            type={showPwds.confirm ? "text" : "password"}
                            className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none focus:border-orange-500 font-bold text-slate-700 transition-all"
                            value={pwdForm.confirm}
                            onChange={e => setPwdForm({...pwdForm, confirm: e.target.value})}
                          />
                          <button type="button" onClick={() => setShowPwds({...showPwds, confirm: !showPwds.confirm})} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300">
                             {showPwds.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                   </div>

                   <button 
                    disabled={isUpdatingPwd}
                    type="submit"
                    className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                   >
                      {isUpdatingPwd ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Actualizar Credenciales
                   </button>
                </form>
              </div>
            )}

            {activeTab === 'system' && canAccessSystem && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-12">
                {/* Header Section */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    <div className="p-4 bg-slate-900 text-orange-500 rounded-[1.5rem] shadow-xl border border-slate-800">
                      <Terminal className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Core System Analytics</h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Diagnóstico avanzado de infraestructura cloud</p>
                    </div>
                  </div>
                  <button 
                    onClick={runDiagnostics} 
                    disabled={isDiagnosing}
                    className="group relative flex items-center gap-3 px-6 py-3 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl hover:bg-slate-800 transition-all disabled:opacity-50 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <RefreshCw className={`w-4 h-4 text-orange-500 ${isDiagnosing ? 'animate-spin' : ''}`} />
                    <span className="relative">Ejecutar Escaneo</span>
                  </button>
                </div>

                {/* Status Dashboard */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex flex-col items-center text-center">
                    <Database className="w-6 h-6 text-slate-400 mb-3" />
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Base de Datos</p>
                    <p className="font-bold text-slate-800">Supabase Cloud</p>
                  </div>
                  <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex flex-col items-center text-center">
                    <RefreshCw className="w-6 h-6 text-slate-400 mb-3" />
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Sincronización</p>
                    <p className="font-bold text-slate-800">Híbrida (Local/Push)</p>
                  </div>
                  <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex flex-col items-center text-center">
                    <Lock className="w-6 h-6 text-slate-400 mb-3" />
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Seguridad</p>
                    <p className="font-bold text-slate-800">RLS Activo</p>
                  </div>
                </div>

                {/* Console Section */}
                <div className="relative">
                  <div className="absolute -top-3 left-8 px-4 py-1 bg-slate-900 text-orange-500 text-[8px] font-black uppercase tracking-[0.3em] rounded-full z-10 border border-orange-500/30">
                    System Output
                  </div>
                  <div className="bg-slate-950 rounded-[2.5rem] p-10 text-slate-300 shadow-3xl border border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                      <DatabaseZap className="w-40 h-40" />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                      {Object.keys(diagnostics).length === 0 ? (
                        <div className="col-span-full py-20 text-center">
                          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/10 group-hover:scale-110 transition-transform duration-500">
                             <DatabaseZap className="w-8 h-8 text-slate-600" />
                          </div>
                          <p className="text-xs font-black uppercase text-slate-500 tracking-[0.2em]">Esperando inicialización de diagnóstico...</p>
                        </div>
                      ) : (
                        (Object.entries(diagnostics) as [string, { ok: boolean, hasColumns: boolean, error?: string }][]).map(([table, res]) => (
                          <div 
                            key={table} 
                            className={`flex items-center justify-between p-5 rounded-2xl border transition-all duration-300 ${
                              !res.ok 
                              ? 'bg-red-500/5 border-red-500/20 hover:border-red-500/40' 
                              : !res.hasColumns 
                              ? 'bg-orange-500/5 border-orange-500/20 hover:border-orange-500/40' 
                              : 'bg-white/5 border-white/10 hover:bg-white/10'
                            }`}
                          >
                            <div className="flex items-center gap-4">
                              <div className={`p-2 rounded-lg ${!res.ok ? 'bg-red-500/20' : !res.hasColumns ? 'bg-orange-500/20' : 'bg-emerald-500/20'}`}>
                                {res.ok && res.hasColumns ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                ) : (
                                  <AlertCircle className="w-4 h-4 text-red-400" />
                                )}
                              </div>
                              <div>
                                <p className="font-mono text-[11px] font-bold text-white tracking-tight">{table}</p>
                                <p className="text-[8px] font-black uppercase text-slate-500 mt-0.5">Schema verified</p>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                               {!res.ok ? (
                                 <span className="text-[8px] bg-red-600/20 text-red-400 border border-red-600/30 px-2 py-0.5 rounded-md font-black uppercase">Critical Failure</span>
                               ) : !res.hasColumns ? (
                                 <span className="text-[8px] bg-orange-600/20 text-orange-400 border border-orange-600/30 px-2 py-0.5 rounded-md font-black uppercase">Missing Fields</span>
                               ) : (
                                 <span className="text-[8px] text-emerald-400 font-black uppercase tracking-widest opacity-50">Operational</span>
                               )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {((Object.values(diagnostics) as any[]).some(r => !r.ok || !r.hasColumns)) && (
                      <div className="mt-10 p-8 bg-gradient-to-br from-red-500/10 to-transparent border border-red-500/20 rounded-[2rem] flex items-start gap-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 blur-3xl -mr-10 -mt-10" />
                        <Wrench className="w-8 h-8 text-red-500 shrink-0 mt-1" />
                        <div className="relative z-10">
                           <p className="text-sm font-black text-white uppercase tracking-widest mb-2">Protocolo de Reparación Requerido</p>
                           <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                             Se han detectado inconsistencias en el esquema de datos. Esto puede comprometer la integridad de los reportes. 
                             Contacte a soporte o ejecute el script <span className="text-orange-500 font-mono">XANA_DB_PATCH_2024.sql</span> en la consola de Supabase.
                           </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Maintenance Actions */}
                <div className="pt-10 border-t border-slate-100">
                   <div className="flex items-center gap-4 mb-8">
                      <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-red-500">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-black text-slate-800 text-base uppercase tracking-tight">Zona de Mantenimiento</h4>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Acciones destructivas y recuperación</p>
                      </div>
                   </div>
                   
                   <div className="p-10 border-2 border-red-50 rounded-[3rem] bg-gradient-to-br from-red-50/30 to-transparent flex flex-col md:flex-row items-center justify-between gap-8">
                      <div className="max-w-md">
                        <p className="text-xs text-slate-600 font-bold uppercase tracking-wide mb-2">Reseteo de Persistencia Local</p>
                        <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                          Si experimenta errores visuales o datos fantasma, vaciar la caché forzará una descarga completa desde el servidor. Los datos en la nube no se verán afectados.
                        </p>
                      </div>
                      <button 
                        onClick={() => setShowResetConfirm(true)}
                        className="group flex items-center gap-3 px-10 py-5 bg-red-600 hover:bg-red-700 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-red-200 transition-all hover:scale-105 active:scale-95"
                      >
                         <Trash2 className="w-4 h-4 group-hover:rotate-12 transition-transform" /> 
                         <span>Vaciar Caché Local</span>
                      </button>
                   </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showResetConfirm && (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-xl z-[200] flex items-center justify-center p-6">
           <div className="bg-white rounded-[3rem] w-full max-w-md p-12 shadow-3xl text-center border border-white/20 animate-in zoom-in-95 duration-200">
              <div className="w-24 h-24 bg-red-100 rounded-[2.5rem] flex items-center justify-center mb-8 mx-auto text-red-600 shadow-inner">
                 <AlertTriangle className="w-12 h-12" />
              </div>
              <h3 className="text-3xl font-black text-slate-900 tracking-tighter mb-4">¿Confirmar Borrado?</h3>
              <p className="text-slate-500 font-medium mb-10 text-sm uppercase leading-relaxed tracking-wide">
                Esto limpiará la memoria del navegador. No se borrarán los datos guardados en la nube.
              </p>
              <div className="flex gap-4">
                 <button onClick={() => setShowResetConfirm(false)} className="flex-1 py-5 rounded-2xl border-2 border-slate-100 text-slate-400 font-black uppercase tracking-widest text-[10px]">Cancelar</button>
                 <button onClick={handleResetDatabase} className="flex-1 py-5 rounded-2xl bg-red-600 text-white font-black uppercase tracking-widest text-[10px] shadow-2xl">Confirmar</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Settings;