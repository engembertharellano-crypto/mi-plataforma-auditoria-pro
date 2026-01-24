import React from 'react';
import { 
  LayoutDashboard, 
  ClipboardCheck, 
  Video, 
  Warehouse, 
  CalendarDays, 
  FileBarChart, 
  Files, 
  ListTodo, 
  Store, 
  Users, 
  Contact, 
  Receipt, 
  LogOut, 
  Settings, 
  BrainCircuit, 
  KeyRound, 
  Briefcase,
  ShieldAlert,
  Plane, // Icono para el modo viaje
  Map
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
  // Props para el Modo Viaje
  isTravelMode: boolean;
  onToggleTravelMode: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, 
  onNavigate, 
  user, 
  onLogout, 
  isSyncing,
  isOpen,
  onClose,
  isTravelMode,
  onToggleTravelMode
}) => {
  
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'ai-assistant', label: 'Asistente IA', icon: BrainCircuit, highlight: true },
    { id: 'visit-log', label: 'Bitácora', icon: CalendarDays }, // <--- NOMBRE CORREGIDO
    { id: 'case-management', label: 'Gestión de Casos', icon: ShieldAlert },
    { id: 'audit-wizard', label: 'Iniciar Auditoría', icon: ClipboardCheck },
    { id: 'new-visit', label: 'Registrar Visita', icon: Briefcase },
    { id: 'cctv-inventory', label: 'Inventario CCTV', icon: Video },
    { id: 'physical-inventory', label: 'Infraestructura', icon: Warehouse },
    { id: 'asset-control', label: 'Control de Activos', icon: KeyRound },
    { id: 'pending-tasks', label: 'Pendientes', icon: ListTodo },
    { id: 'delivery-receipts', label: 'Recepciones', icon: Receipt },
    { id: 'monthly-summary', label: 'Estadísticas', icon: FileBarChart },
    { id: 'management-report', label: 'Reporte Gerencial', icon: Files },
    { id: 'pharmacy-list', label: 'Farmacias', icon: Store },
    { id: 'staff-directory', label: 'Personal', icon: Users },
    { id: 'support-directory', label: 'Soporte', icon: Contact },
    { id: 'access-management', label: 'Accesos', icon: KeyRound, adminOnly: true },
    { id: 'settings', label: 'Configuración', icon: Settings },
  ];

  const isAdmin = user?.role === 'Super Usuario' || user?.email === 'directiva@xana.com';

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed top-0 left-0 h-full w-80 bg-slate-900 text-white z-50 
        transform transition-transform duration-300 ease-in-out shadow-2xl
        flex flex-col border-r border-white/5
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        
        {/* HEADER */}
        <div className="p-8 pb-4">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
              <span className="font-black text-2xl tracking-tighter">X</span>
            </div>
            <div>
              <h1 className="font-black text-2xl tracking-tight leading-none">XANA</h1>
              <p className="text-[10px] font-bold text-slate-400 tracking-[0.3em] uppercase mt-1">Security Suite</p>
            </div>
          </div>

          {/* PERFIL */}
          <div className="bg-white/5 rounded-2xl p-4 border border-white/5 mb-2">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Sesión Activa</p>
            <p className="font-bold text-sm truncate">{user?.fullName}</p>
            <div className="flex items-center justify-between mt-2">
               <span className="text-[10px] bg-orange-500/20 text-orange-400 px-2 py-1 rounded-lg border border-orange-500/20 uppercase font-bold">
                 {user?.zone || 'Sin Zona'}
               </span>
               {isSyncing && <span className="text-[10px] animate-pulse text-emerald-400 font-bold">Sincronizando...</span>}
            </div>
          </div>

          {/* MODO VIAJE (Solo visible para coordinadores, no admins) */}
          {!isAdmin && (
            <button 
              onClick={onToggleTravelMode}
              className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                isTravelMode 
                  ? 'bg-blue-600 border-blue-500 shadow-lg shadow-blue-500/20' 
                  : 'bg-slate-800 border-slate-700 hover:bg-slate-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-1.5 rounded-lg ${isTravelMode ? 'bg-white/20' : 'bg-slate-600'}`}>
                  {isTravelMode ? <Plane className="w-4 h-4 text-white" /> : <Map className="w-4 h-4 text-slate-400" />}
                </div>
                <div className="text-left">
                  <p className={`text-xs font-black uppercase tracking-wide ${isTravelMode ? 'text-white' : 'text-slate-300'}`}>
                    {isTravelMode ? 'Modo Viaje' : 'Mi Zona'}
                  </p>
                  <p className="text-[9px] font-medium opacity-70">
                    {isTravelMode ? 'Viendo todo el país' : 'Viendo solo asignados'}
                  </p>
                </div>
              </div>
              
              {/* Switch Visual */}
              <div className={`w-8 h-4 rounded-full relative transition-colors ${isTravelMode ? 'bg-white/30' : 'bg-slate-600'}`}>
                <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all shadow-sm ${isTravelMode ? 'left-4.5' : 'left-0.5'}`}></div>
              </div>
            </button>
          )}
        </div>

        {/* MENÚ */}
        <div className="flex-1 overflow-y-auto px-4 space-y-1 custom-scrollbar pb-4">
          <p className="px-4 py-2 text-[10px] font-black text-slate-500 uppercase tracking-widest sticky top-0 bg-slate-900 z-10">Menú Principal</p>
          
          {menuItems.map((item) => {
            if (item.adminOnly && !isAdmin) return null;
            
            const isActive = currentView === item.id;
            const Icon = item.icon;
            
            return (
              <button
                key={item.id}
                onClick={() => { onNavigate(item.id as ViewName); onClose(); }}
                className={`
                  w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group relative
                  ${isActive 
                    ? 'bg-gradient-to-r from-orange-600 to-orange-700 text-white shadow-lg shadow-orange-900/50 translate-x-1' 
                    : 'text-slate-400 hover:bg-white/5 hover:text-white hover:translate-x-1'
                  }
                `}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-white'} ${item.highlight && !isActive ? 'text-blue-400 animate-pulse' : ''}`} />
                <span className="font-bold text-sm tracking-wide">{item.label}</span>
                {isActive && <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>}
              </button>
            );
          })}
        </div>

        {/* FOOTER */}
        <div className="p-4 border-t border-white/5 bg-slate-900/50">
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-red-500/10 hover:text-red-400 rounded-xl transition-all duration-200 group"
          >
            <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-bold text-sm">Cerrar Sesión</span>
          </button>
          <p className="text-center text-[9px] text-slate-600 font-bold mt-3 uppercase tracking-widest opacity-50">v{import.meta.env.VITE_APP_VERSION || '11.0'}</p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
