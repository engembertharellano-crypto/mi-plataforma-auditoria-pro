import React, { useState, useEffect } from 'react';
import { Shield, ArrowRight, Mail, Lock, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface LoginProps {
  onLogin: (user: any) => void;
}

const ZONES = ['Gran Caracas Llanos', 'Gran Caracas Oriente', 'Centro Occidente'];

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    role: 'Especialista de seguridad',
    zone: 'Gran Caracas Llanos'
  });
  
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    setError('');
    setSuccessMsg('');
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      fullName: '',
      role: 'Especialista de seguridad',
      zone: 'Gran Caracas Llanos'
    });
  }, [isRegistering]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setError('');
    setIsLoading(true);

    try {
      const { data: user, error: dbError } = await supabase
        .from('users')
        .select('*')
        .eq('email', formData.email.toLowerCase())
        .eq('password', formData.password)
        .single();

      if (dbError || !user) {
        setError('Credenciales de acceso incorrectas o usuario no encontrado.');
        setIsLoading(false);
        return;
      }

      if (user.is_blocked) {
        setError('Esta cuenta ha sido suspendida por la Gerencia.');
        setIsLoading(false);
        return;
      }

      const isHighRole = ['Super Usuario', 'Gerente Corporativo de Seguridad'].includes(user.role);
      if (isHighRole || user.is_approved) {
        // Normalizamos los nombres de campos de DB a los esperados por la App
        const sessionUser = {
          ...user,
          fullName: user.full_name,
          isApproved: user.is_approved,
          isBlocked: user.is_blocked
        };
        onLogin(sessionUser);
      } else {
        setError('Tu cuenta aún no ha sido aprobada por la Gerencia.');
      }
    } catch (err) {
      setError('Error de conexión con el servidor de seguridad.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    if (!formData.email || !formData.password || !formData.fullName) {
      setError('Todos los campos son obligatorios.');
      return;
    }

    setIsLoading(true);

    try {
      const emailLower = formData.email.toLowerCase();
      const isSuperUser = emailLower === 'engemberth.arellano@gmail.com';
      const isCorpManager = emailLower === 'gustavo.fernandez@dronena.com';
      const readOnlyRoles = ['Directiva', 'Auditoria', 'Finanzas', 'Mantenimiento', 'Tecnologia', 'Operaciones', 'Seguridad (Lectura)', 'Recursos Humanos'];
      const isGlobalRole = formData.role === 'Gerente de seguridad' || formData.role === 'Lider de investigaciones' || readOnlyRoles.includes(formData.role) || isCorpManager;
      
      const newUser = {
        email: emailLower,
        password: formData.password,
        full_name: formData.fullName,
        role: isSuperUser ? 'Super Usuario' : (isCorpManager ? 'Gerente Corporativo de Seguridad' : formData.role),
        zone: (isSuperUser || isGlobalRole) ? 'Global' : formData.zone,
        is_approved: isSuperUser || isCorpManager,
        is_blocked: false
      };

      const { error: insertError } = await supabase
        .from('users')
        .insert([newUser]);

      if (insertError) {
        if (insertError.code === '23505') {
          setError('Este correo electrónico ya se encuentra registrado.');
        } else {
          setError('Error al crear la cuenta. Intente nuevamente.');
        }
        setIsLoading(false);
        return;
      }

      setSuccessMsg(isSuperUser || isCorpManager ? 'Perfil Administrativo creado exitosamente.' : 'Solicitud de acceso enviada correctamente. En espera de aprobación por la Gerencia.');
      
      setTimeout(() => {
        setIsRegistering(false);
        setSuccessMsg('');
      }, 3000);
    } catch (err) {
      setError('Error de red. Verifique su conexión.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
      <div className="absolute inset-0 bg-slate-900">
         <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[120px] animate-float opacity-50"></div>
         <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-orange-600/20 rounded-full blur-[120px] animate-float opacity-50" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="glass-card rounded-[3rem] shadow-2xl w-full max-w-md overflow-hidden relative z-10 border border-white/10 animate-in fade-in zoom-in duration-500 backdrop-blur-3xl bg-white/5">
        <div className="p-10 relative">
          <div className="flex flex-col items-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center mb-4 shadow-2xl transform rotate-3">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">XANA Security</h1>
            <p className="text-slate-400 font-medium text-sm mt-1 uppercase tracking-widest text-[9px]">SISTEMA DE CONTROL TÉCNICO</p>
          </div>

          {successMsg ? (
             <div className="bg-emerald-500/20 border border-emerald-500/50 text-emerald-200 p-6 rounded-2xl flex items-center gap-4 mb-6">
               <CheckCircle2 className="w-6 h-6 text-emerald-400" />
               <p className="text-sm font-bold leading-relaxed">{successMsg}</p>
             </div>
          ) : (
            <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-4">
              {isRegistering && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 pl-1 tracking-[0.1em]">Nombre Completo</label>
                    <input 
                      disabled={isLoading}
                      type="text" 
                      placeholder="Ej. Juan Pérez"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-bold outline-none focus:border-orange-500/50 transition-all disabled:opacity-50" 
                      value={formData.fullName} 
                      onChange={e => setFormData({...formData, fullName: e.target.value})} 
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 pl-1 tracking-[0.1em]">Cargo Solicitado</label>
                      <select 
                        disabled={isLoading}
                        className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-xl text-white font-bold text-xs outline-none focus:border-orange-500/50 disabled:opacity-50" 
                        value={formData.role} 
                        onChange={e => setFormData({...formData, role: e.target.value})}
                      >
                        <option value="Especialista de seguridad">Especialista de Seguridad</option>
                        <option value="Coordinador de seguridad">Coordinador de Seguridad</option>
                        <option value="Gerente de seguridad">Gerente de Seguridad</option>
                        <option value="Lider de investigaciones">Líder de Investigaciones</option>
                        <option value="Directiva">Directiva (Dueños)</option>
                        <option value="Auditoria">Auditoría (Solo Lectura)</option>
                        <option value="Finanzas">Finanzas (Solo Lectura)</option>
                        <option value="Mantenimiento">Mantenimiento (Solo Lectura)</option>
                        <option value="Tecnologia">Tecnología (Solo Lectura)</option>
                        <option value="Operaciones">Operaciones (Solo Lectura)</option>
                        <option value="Seguridad (Lectura)">Seguridad (Solo Lectura)</option>
                        <option value="Recursos Humanos">Recursos Humanos (Solo Lectura)</option>
                      </select>
                    </div>
                    {!(formData.role === 'Gerente de seguridad' || formData.role === 'Lider de investigaciones' || ['Directiva', 'Auditoria', 'Finanzas', 'Mantenimiento', 'Tecnologia', 'Operaciones', 'Seguridad (Lectura)', 'Recursos Humanos'].includes(formData.role)) && (
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 pl-1 tracking-[0.1em]">Zona Asignada</label>
                        <select 
                          disabled={isLoading}
                          className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-xl text-white font-bold text-xs outline-none focus:border-orange-500/50 disabled:opacity-50" 
                          value={formData.zone} 
                          onChange={e => setFormData({...formData, zone: e.target.value})}
                        >
                          {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1 tracking-[0.1em]">Correo Electrónico</label>
                <div className="relative">
                   <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                   <input 
                     disabled={isLoading}
                     type="email" 
                     placeholder="correo@ejemplo.com"
                     className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-bold outline-none focus:border-orange-500/50 transition-all disabled:opacity-50" 
                     value={formData.email} 
                     onChange={e => setFormData({...formData, email: e.target.value})} 
                   />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 pl-1 tracking-[0.1em]">Contraseña</label>
                <div className="relative">
                   <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                   <input 
                     disabled={isLoading}
                     type="password" 
                     placeholder="••••••••" 
                     className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-bold outline-none focus:border-orange-500/50 transition-all disabled:opacity-50" 
                     value={formData.password} 
                     onChange={e => setFormData({...formData, password: e.target.value})} 
                   />
                </div>
              </div>

              {isRegistering && (
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 pl-1 tracking-[0.1em]">Confirmar Contraseña</label>
                  <input 
                    disabled={isLoading}
                    type="password" 
                    placeholder="••••••••" 
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-bold outline-none focus:border-orange-500/50 transition-all disabled:opacity-50" 
                    value={formData.confirmPassword} 
                    onChange={e => setFormData({...formData, confirmPassword: e.target.value})} 
                  />
                </div>
              )}

              {error && (
                <div className="bg-red-500/20 border border-red-500/50 text-red-200 text-[10px] font-black p-4 rounded-xl flex items-center gap-3 uppercase tracking-widest">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-black py-4 rounded-xl shadow-xl transition-all flex items-center justify-center gap-3 group mt-6 uppercase tracking-[0.2em] text-xs active:scale-95 disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    {isRegistering ? 'Solicitar Registro' : 'Entrar al Sistema'}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          )}

          <div className="mt-8 text-center pt-6 border-t border-white/10">
            <button 
              disabled={isLoading}
              onClick={() => setIsRegistering(!isRegistering)} 
              className="text-slate-400 font-bold text-[10px] uppercase tracking-widest hover:text-white transition-colors disabled:opacity-50"
            >
              {isRegistering ? '¿Ya tienes una cuenta aprobada? Ingresar' : '¿Nuevo colaborador? Solicitar Acceso'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;