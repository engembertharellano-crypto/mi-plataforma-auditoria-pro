import React from 'react';
import { 
  Shield, 
  LayoutDashboard, 
  FileText, 
  Video, 
  Lock, 
  History, 
  BarChart, 
  FileSearch,
  LogOut,
  ClipboardList,
  Store,
  Users,
  Siren,
  Briefcase,
  PackageCheck,
  Sparkles,
  UserCheck,
  Settings,
  Key,
  X
} from 'lucide-react';
import { ViewName } from '../types';

interface SidebarProps {
  currentView: ViewName;
  onNavigate: (view: ViewName) => void;
  user?: { fullName: string; role: string };
  onLogout?: () => void;
  isSyncing?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
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
  
  const menuItemClass = (active: boolean) => 
    `flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 cursor-pointer group mb-1 ${
      active 
        ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/30 translate-x-1' 
        : 'text-slate-500 hover:bg-slate-100/80 hover:text-slate-900 hover:translate-x-1'
    }`;

  const isAuthManager = user && ['Gerente de seguridad', 'Lider de investigaciones', 'Super Usuario', 'Gerente Corporativo de Seguridad'].includes(user.role);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const getDisplayRole = (role: string) => {
    if (role === 'Super Usuario') return 'Administrador de Sistemas';
    return role;
  };

  const handleNavigation = (view: ViewName) => {
    onNavigate(view);
    if (onClose) onClose(); // Cierra el menú en móvil tras navegar
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[55] lg:hidden animate-in fade-in duration-300"
          onClick={onClose}
        />
      )}

      <div className={`w-72 h-[96vh] fixed left-4 top-4 glass-sidebar rounded-[2rem] flex flex-col z-[60] overflow-hidden border border-white/60 shadow-2xl transition-transform duration-500 ease-in-out lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-[calc(100%+2rem)]'}`}>
        {/* Header */}
        <div className="p-8 flex items-center justify-between border-b border-slate-100/50 bg-white/40">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-orange-500 to-red-600 p-2.5 rounded-xl shadow-lg shadow-orange-500/30 ring-2 ring-white">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-slate-800 font-black text-xl tracking-tight leading-none">XANA PRO</h1>
              <p className="text-slate-500 text-[10px] font-bold tracking-widest uppercase mt-1">SEGURIDAD</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden p-2 text-slate-400 hover:text-slate-900 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-1 scrollbar-hide">
          <div 
            onClick={() => handleNavigation('dashboard')}
            className={menuItemClass(currentView === 'dashboard')}
          >
            <LayoutDashboard className={`w-5 h-5 ${currentView === 'dashboard' ? 'animate-pulse' : ''}`} />
            <span>Dashboard</span>
          </div>

          <div 
            onClick={() => handleNavigation('ai-assistant')}
            className={menuItemClass(currentView === 'ai-assistant')}
          >
            <Sparkles className={`w-5 h-5 ${currentView === 'ai-assistant' ? 'text-white' : 'text-orange-500'}`} />
            <span>Asistente IA</span>
          </div>

          {isAuthManager && (
            <div 
              onClick={() => handleNavigation('access-management')}
              className={menuItemClass(currentView === 'access-management')}
            >
              <UserCheck className={`w-5 h-5 ${currentView === 'access-management' ? 'text-white' : 'text-indigo-500'}`} />
              <span>Accesos</span>
            </div>
          )}

          <div className="mt-6 mb-3 px-4 flex items-center gap-2">
            <div className="h-px bg-slate-200 flex-1"></div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gestión</span>
            <div className="h-px bg-slate-200 flex-1"></div>
          </div>
          
          <div onClick={() => handleNavigation('audit-wizard')} className={menuItemClass(currentView === 'audit-wizard')}><FileText className="w-5 h-5" /><span>Auditoría</span></div>
          <div onClick={() => handleNavigation('new-visit')} className={menuItemClass(currentView === 'new-visit')}><Briefcase className="w-5 h-5" /><span>Visita</span></div>
          <div onClick={() => handleNavigation('delivery-receipts')} className={menuItemClass(currentView === 'delivery-receipts')}><PackageCheck className="w-5 h-5" /><span>Actas</span></div>
          <div onClick={() => handleNavigation('asset-control')} className={menuItemClass(currentView === 'asset-control')}><Key className={`w-5 h-5 ${currentView === 'asset-control' ? 'text-white' : 'text-orange-500'}`} /><span>Custodia</span></div>
          <div onClick={() => handleNavigation('cctv-inventory')} className={menuItemClass(currentView === 'cctv-inventory')}><Video className="w-5 h-5" /><span>CCTV</span></div>
          <div onClick={() => handleNavigation('physical-inventory')} className={menuItemClass(currentView === 'physical-inventory')}><Lock className="w-5 h-5" /><span>Infraestructura</span></div>
          <div onClick={() => handleNavigation('pending-tasks')} className={menuItemClass(currentView === 'pending-tasks')}><ClipboardList className="w-5 h-5" /><span>Pendientes</span></div>

          <div className="mt-6 mb-3 px-4 flex items-center gap-2">
             <div className="h-px bg-slate-200 flex-1"></div>
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Directorios</span>
             <div className="h-px bg-slate-200 flex-1"></div>
          </div>
          <div onClick={() => handleNavigation('pharmacy-list')} className={menuItemClass(currentView === 'pharmacy-list')}><Store className="w-5 h-5" /><span>Farmacias</span></div>
          <div onClick={() => handleNavigation('staff-directory')} className={menuItemClass(currentView === 'staff-directory')}><Users className="w-5 h-5" /><span>Personal</span></div>
          <div onClick={() => handleNavigation('support-directory')} className={menuItemClass(currentView === 'support-directory')}><Siren className="w-5 h-5" /><span>Emergencias</span></div>

          <div className="mt-6 mb-3 px-4 flex items-center gap-2">
            <div className="h-px bg-slate-200 flex-1"></div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reportes</span>
            <div className="h-px bg-slate-200 flex-1"></div>
          </div>
          <div onClick={() => handleNavigation('visit-log')} className={menuItemClass(currentView === 'visit-log')}><History className="w-5 h-5" /><span>Bitácora</span></div>
          <div onClick={() => handleNavigation('monthly-summary')} className={menuItemClass(currentView === 'monthly-summary')}><BarChart className="w-5 h-5" /><span>Estadísticas</span></div>
          <div onClick={() => handleNavigation('management-report')} className={menuItemClass(currentView === 'management-report')}><FileSearch className="w-5 h-5" /><span>Reporte Gerencial</span></div>
          
          <div className="mt-4">
             <div 
               onClick={() => handleNavigation('settings')}
               className={menuItemClass(currentView === 'settings')}
             >
               <Settings className="w-5 h-5" />
               <span>Configuración</span>
             </div>
          </div>
        </div>

        {/* Modern Footer */}
        <div className="p-4 mx-2 mb-2 bg-gradient-to-br from-slate-50 to-white rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between px-2 mb-4">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-orange-500 animate-pulse' : 'bg-emerald-500'}`}></div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {isSyncing ? 'En Línea' : 'Conectado'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
            <div className="w-10 h-10 rounded-2xl bg-slate-800 flex items-center justify-center text-white font-bold text-xs shadow-md ring-2 ring-slate-100">
              {user ? getInitials(user.fullName) : 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-slate-800 text-sm font-bold truncate">
                {user ? user.fullName.split(' ')[0] : 'Usuario'}
              </p>
              <p className="text-slate-400 text-[10px] uppercase font-bold truncate">
                {user ? getDisplayRole(user.role) : 'Auditor'}
              </p>
            </div>
            <button 
              onClick={onLogout}
              className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-2.5 rounded-xl transition-all"
              title="Cerrar Sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;