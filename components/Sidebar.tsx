import React from 'react';
import { 
  LayoutDashboard, 
  Bot, 
  FileText, 
  CheckSquare, 
  Store, 
  Users, 
  Phone, 
  Settings, 
  LogOut, 
  BarChart3, 
  FileSpreadsheet, 
  Truck, 
  ShieldCheck, 
  Key,
  Briefcase,
  Package
} from 'lucide-react';
import { ViewName } from '../types';

interface SidebarProps {
  currentView: ViewName;
  onNavigate: (view: ViewName) => void;
  user: any;
  onLogout: () => void;
  isSyncing: boolean;
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, 
  onNavigate, 
  user, 
  onLogout, 
  isSyncing,
  isOpen,
  onClose
}) => {
  
  const handleNav = (view: ViewName) => {
    onNavigate(view);
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  // ESTILOS (TEMA CLARO)
  const isActive = (view: ViewName) => currentView === view 
    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30' 
    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900';

  // CORRECCIÓN AQUÍ: Ahora es una variable booleana directa, no una función.
  const isReadOnlyUser = user?.email === 'directiva@xana.com';

  const isBoss = () => {
    if (!user) return false;
    const role = (user.role || '').toLowerCase();
    const email = (user.email || '').toLowerCase();
    return ['super usuario', 'gerente corporativo de seguridad', 'gerente de seguridad', 'lider de investigaciones', 'coordinador de seguridad'].includes(role) || email === 'directiva@xana.com';
  };

  return (
    <>
      {/* Overlay móvil */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[200] lg:hidden"
          onClick={onClose}
        />
      )}

      {/* SIDEBAR BLANCO */}
      <aside className={`fixed top-0 left-0 h-full w-80 bg-white text-slate-800 p-6 flex flex-col z-[210] transition-transform duration-300 ease-in-out border-r border-slate-100 overflow-y-auto custom-scrollbar ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-10 px-2">
          <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20 shrink-0">
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tighter leading-none text-slate-900">XANA PRO</h1>
            <p className="text-[10px] font-bold text-slate-400 tracking-[0.2em] mt-1">SEGURIDAD</p>
          </div>
        </div>

        {/* Navegación */}
        <nav className="flex-1 space-y-8">
          
          <div className="space-y-2">
            <button onClick={() => handleNav('dashboard')} className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all font-bold text-sm ${isActive('dashboard')}`}>
              <LayoutDashboard className="w-5 h-5" /> Dashboard
            </button>
            
            {/* LÓGICA CORREGIDA: Si NO es solo lectura, MUESTRA el Asistente */}
            {!isReadOnlyUser && (
              <button onClick={() => handleNav('ai-assistant')} className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all font-bold text-sm ${isActive('ai-assistant')}`}>
                <Bot className="w-5 h-5" /> Asistente IA
              </button>
            )}
          </div>

          <div>
            <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Gestión</p>
            <div className="space-y-2">
              <button onClick={() => handleNav('visit-log')} className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all font-bold text-sm ${isActive('visit-log')}`}>
                <FileText className="w-5 h-5" /> Bitácora
              </button>
              <button onClick={() => handleNav('pending-tasks')} className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all font-bold text-sm ${isActive('pending-tasks')}`}>
                <CheckSquare className="w-5 h-5" /> Pendientes
              </button>
              {/* BOTÓN: GESTIÓN DE CASOS */}
              <button onClick={() => handleNav('case-management')} className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all font-bold text-sm ${isActive('case-management')}`}>
                <Briefcase className="w-5 h-5" /> Gestión de Casos
              </button>
            </div>
          </div>

          <div>
            <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Activos</p>
            <div className="space-y-2">
              <button onClick={() => handleNav('asset-control')} className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all font-bold text-sm ${isActive('asset-control')}`}>
                <Key className="w-5 h-5" /> Control Préstamos
              </button>
              <button onClick={() => handleNav('delivery-receipts')} className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all font-bold text-sm ${isActive('delivery-receipts')}`}>
                <Truck className="w-5 h-5" /> Recepciones
              </button>
            </div>
          </div>

          <div>
            <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Directorios</p>
            <div className="space-y-2">
              <button onClick={() => handleNav('pharmacy-list')} className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all font-bold text-sm ${isActive('pharmacy-list')}`}>
                <Store className="w-5 h-5" /> Farmacias
              </button>
              <button onClick={() => handleNav('staff-directory')} className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all font-bold text-sm ${isActive('staff-directory')}`}>
                <Users className="w-5 h-5" /> Personal
              </button>
              <button onClick={() => handleNav('support-directory')} className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all font-bold text-sm ${isActive('support-directory')}`}>
                <Phone className="w-5 h-5" /> Soporte
              </button>
            </div>
          </div>

          <div>
            <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Reportes</p>
            <div className="space-y-2">
              <button onClick={() => handleNav('monthly-summary')} className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all font-bold text-sm ${isActive('monthly-summary')}`}>
                <BarChart3 className="w-5 h-5" /> Estadísticas
              </button>
              {!isReadOnlyUser && (
                <button onClick={() => handleNav('management-report')} className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all font-bold text-sm ${isActive('management-report')}`}>
                  <FileSpreadsheet className="w-5 h-5" /> Reporte Gerencial
                </button>
              )}
            </div>
          </div>

          <div>
            <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Sistema</p>
            <div className="space-y-2">
              {!isReadOnlyUser && isBoss() && (
                <button onClick={() => handleNav('access-management')} className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all font-bold text-sm ${isActive('access-management')}`}>
                  <ShieldCheck className="w-5 h-5" /> Accesos
                </button>
              )}
              <button onClick={() => handleNav('settings')} className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all font-bold text-sm ${isActive('settings')}`}>
                <Settings className="w-5 h-5" /> Configuración
              </button>
            </div>
          </div>

        </nav>

        {/* Footer User */}
        <div className="mt-8 pt-6 border-t border-slate-100">
          <div className="flex items-center gap-3 px-2 mb-4">
            <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center font-black text-orange-500 border border-slate-100">
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="font-bold text-sm text-slate-800 truncate">{user?.fullName}</p>
              <p className="text-[10px] font-medium text-slate-400 truncate">{user?.role}</p>
            </div>
          </div>
          
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-orange-500 animate-pulse' : 'bg-emerald-500'}`}></span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {isSyncing ? 'Sincronizando...' : 'Conectado'}
              </span>
            </div>
            <button onClick={onLogout} className="text-slate-400 hover:text-red-500 transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

      </aside>
    </>
  );
};

export default Sidebar;
