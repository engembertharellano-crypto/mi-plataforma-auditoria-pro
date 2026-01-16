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
    'Coordinador de seguridad',
    'Gerente de seguridad', 
    'Lider de investigaciones', 
    'Super Usuario', 
    'Gerente Corporativo de Seguridad'
  ].includes(user.role);

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
              <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-10">
                <div className="flex items-center gap-4">
                   <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                      <Terminal className="w-6 h-6" />
                   </div>
                   <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Consola de Diagnóstico Cloud</h3>
                </div>

                <div className="bg-slate-900 rounded-[2rem] p-8 text-slate-300 shadow-2xl border border-white/10">
                   <div className="flex justify-between items-center mb-8">
                      <div>
                        <p className="text-[10px] font-black uppercase text-orange-500 tracking-widest">Esquema de Datos en Supabase</p>
                        <p className="text-xs text-slate-500 mt-1">Validación de tablas y columnas críticas</p>
                      </div>
                      <button 
                        onClick={runDiagnostics} 
                        disabled={isDiagnosing}
                        className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all"
                      >
                         <RefreshCw className={`w-5 h-5 ${isDiagnosing ? 'animate-spin' : ''}`} />
                      </button>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.keys(diagnostics).length === 0 ? (
                        <div className="col-span-full py-10 text-center opacity-40">
                           <DatabaseZap className="w-10 h-10 mx-auto mb-3" />
                           <p className="text-[10px] font-black uppercase">Presiona el botón de refrescar para escanear esquema</p>
                        </div>
                      ) : (
                        (Object.entries(diagnostics) as [string, { ok: boolean, hasColumns: boolean, error?: string }][]).map(([table, res]) => (
                          <div key={table} className={`flex flex-col p-4 rounded-xl border ${!res.ok ? 'bg-red-500/10 border-red-500/30' : !res.hasColumns ? 'bg-orange-500/10 border-orange-500/30' : 'bg-black/30 border-white/5'}`}>
                             <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                   {res.ok && res.hasColumns ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <AlertCircle className="w-4 h-4 text-red-500" />}
                                   <span className="font-mono text-xs font-bold text-white">{table}</span>
                                </div>
                                <div className="flex gap-2">
                                   {!res.ok && <span className="text-[8px] bg-red-600 text-white px-2 py-0.5 rounded font-black uppercase">FALTA TABLA</span>}
                                   {res.ok && !res.hasColumns && <span className="text-[8px] bg-orange-600 text-white px-2 py-0.5 rounded font-black uppercase">ERROR COLUMNA</span>}
                                </div>
                             </div>
                             {res.ok && !res.hasColumns && (
                               <p className="text-[9px] text-orange-400 font-bold uppercase italic leading-none">Falta 'created_by'</p>
                             )}
                          </div>
                        ))
                      )}
                   </div>

                   {((Object.values(diagnostics) as any[]).some(r => !r.ok || !r.hasColumns)) && (
                     <div className="mt-8 p-6 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-4">
                        <Wrench className="w-6 h-6 text-red-500 shrink-0" />
                        <div>
                           <p className="text-xs font-black text-red-400 uppercase tracking-widest mb-1">Inconsistencia Detectada</p>
                           <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                             Se han detectado tablas inexistentes o con columnas faltantes (como 'created_by'). 
                             Esto impide el guardado de datos. Por favor, ejecute el **Script de Reparación** en su panel de Supabase.
                           </p>
                        </div>
                     </div>
                   )}
                </div>

                <div className="pt-10 border-t border-slate-100">
                   <div className="flex items-center gap-4 mb-6">
                      <AlertTriangle className="w-6 h-6 text-red-500" />
                      <h4 className="font-black text-slate-800 text-sm uppercase tracking-tight">Mantenimiento</h4>
                   </div>
                   
                   <div className="p-8 border-2 border-red-50 rounded-[2.5rem] bg-red-50/20">
                      <p className="text-xs text-slate-500 font-medium mb-6 leading-relaxed">
                        Si los datos no se sincronizan correctamente, puede vaciar la caché local para forzar una descarga limpia desde la nube.
                      </p>
                      <button 
                        onClick={() => setShowResetConfirm(true)}
                        className="flex items-center gap-2 px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-xl transition-all"
                      >
                         <Trash2 className="w-4 h-4" /> Vaciar Caché Local
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