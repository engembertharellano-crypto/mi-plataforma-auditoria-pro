import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './views/Dashboard';
import AIAssistant from './views/AIAssistant';
import AuditWizard from './views/AuditWizard';
import AuditResults from './views/AuditResults';
import CCTVInventory from './views/CCTVInventory';
import PhysicalInventory from './views/PhysicalInventory';
import VisitLog from './views/VisitLog';
import MonthlySummary from './views/MonthlySummary';
import ManagementReport from './views/ManagementReport';
import PendingTasks from './views/PendingTasks';
import PharmacyList from './views/PharmacyList';
import StaffDirectory from './views/StaffDirectory';
import SupportDirectory from './views/SupportDirectory';
import DeliveryReceipts from './views/DeliveryReceipts';
import AssetControl from './views/AssetControl';
import NewVisit from './views/NewVisit';
import AccessManagement from './views/AccessManagement';
import Settings from './views/Settings';
import Login from './views/Login';
import { Menu, CheckCircle2, XCircle, Loader2, WifiOff } from 'lucide-react';
import { ViewName, Pharmacy, AuditState, CCTVInventoryRecord, PhysicalInventoryRecord, ManagementVisitRecord, PendingRecord, StaffRecord, SupportRecord, DeliveryReceipt, ScheduleEntry, BriefingData, Asset, AssetLoan } from './types';
import { supabase } from './lib/supabase';

const DATA_VERSION = "11.3-GHOST-MODE";

interface UserData {
  version: string;
  pharmacies: Pharmacy[];
  audits: AuditState[];
  cctvRecords: CCTVInventoryRecord[];
  physicalRecords: PhysicalInventoryRecord[];
  managementRecords: ManagementVisitRecord[];
  pendingRecords: PendingRecord[];
  staffRecords: StaffRecord[];
  supportRecords: SupportRecord[];
  deliveryReceipts: DeliveryReceipt[];
  schedule: ScheduleEntry[];
  assets: Asset[];
  loans: AssetLoan[];
  users: any[];
  dailyBriefing?: BriefingData;
}

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'sync';
}

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentView, setCurrentView] = useState<ViewName>('dashboard');
  const [selectedAudit, setSelectedAudit] = useState<AuditState | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const syncInProgress = useRef(false);

  const [userData, setUserData] = useState<UserData>(() => {
    const saved = localStorage.getItem('xana_hybrid_cache');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          version: DATA_VERSION,
          pharmacies: parsed.pharmacies || [],
          audits: parsed.audits || [],
          cctvRecords: parsed.cctvRecords || [],
          physicalRecords: parsed.physicalRecords || [],
          managementRecords: parsed.managementRecords || [],
          pendingRecords: parsed.pendingRecords || [],
          staffRecords: parsed.staffRecords || [],
          supportRecords: parsed.supportRecords || [],
          deliveryReceipts: parsed.deliveryReceipts || [],
          schedule: parsed.schedule || [],
          assets: parsed.assets || [],
          loans: parsed.loans || [],
          users: parsed.users || [],
          dailyBriefing: parsed.dailyBriefing
        };
      } catch (e) { console.error(e); }
    }
    return {
      version: DATA_VERSION, pharmacies: [], audits: [], cctvRecords: [], physicalRecords: [],
      managementRecords: [], pendingRecords: [], staffRecords: [], supportRecords: [],
      deliveryReceipts: [], schedule: [], assets: [], loans: [], users: [], dailyBriefing: undefined
    };
  });

  const isReadOnly = useMemo(() => {
    if (!currentUser || !currentUser.email) return false;
    return currentUser.email.trim().toLowerCase() === 'directiva@xana.com';
  }, [currentUser]);

  const isBoss = useMemo(() => {
    if (!currentUser) return false;
    const email = currentUser.email ? currentUser.email.trim().toLowerCase() : '';
    if (email === 'directiva@xana.com') return true; 
    const role = (currentUser.role || '').toLowerCase();
    return ['super usuario', 'gerente corporativo de seguridad', 'gerente de seguridad', 'lider de investigaciones', 'coordinador de seguridad'].includes(role);
  }, [currentUser]);

  const addToast = useCallback((message: string, type: 'success' | 'error' | 'sync') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  }, []);

  useEffect(() => {
    localStorage.setItem('xana_hybrid_cache', JSON.stringify(userData));
  }, [userData]);

  useEffect(() => {
    const sessionUser = sessionStorage.getItem('xana_active_user');
    if (sessionUser) setCurrentUser(JSON.parse(sessionUser));
  }, []);

  const fullSync = useCallback(async (user: any) => {
    if (!user || !supabase || syncInProgress.current) return;
    syncInProgress.current = true;
    setIsSyncing(true);

    try {
      const getTableData = async (table: string) => {
        let q = supabase.from(table).select('*');
        if (!isBoss && !['pharmacies', 'users'].includes(table)) {
          q = q.eq('created_by', user.fullName);
        }
        const { data, error } = await q;
        if (error) throw error;
        return data || [];
      };

      const [pharms, auds, cctvs, phys, mgmts, pends, stfs, supps, recs, assts, lns, dbUsers, schs] = await Promise.all([
        supabase.from('pharmacies').select('*').order('name'),
        getTableData('audits'),
        getTableData('cctv_records'),
        getTableData('physical_records'),
        getTableData('management_visits'),
        getTableData('pending_tasks'),
        getTableData('staff'),
        getTableData('support_contacts'),
        getTableData('delivery_receipts'),
        getTableData('assets'),
        getTableData('loans'),
        supabase.from('users').select('*'),
        getTableData('schedule')
      ]);

      const process = (items: any[]) => items.map(item => {
        if (item.data && typeof item.data === 'object' && !Array.isArray(item.data)) {
          return { ...item.data, id: item.id || item.data.id, createdBy: item.created_by || item.data.createdBy };
        }
        return { ...item, createdBy: item.created_by || item.createdBy };
      });

      setUserData(prev => {
        const cloudPharms = (pharms.data || []).map((p: any) => ({
          id: p.id, name: p.name, address: p.address, zone: p.zone, status: p.status,
          risk: p.risk, corporatePhone: p.corporate_phone, photo: p.photo, location: p.location
        }));

        if (cloudPharms.length === 0 && prev.pharmacies.length > 0) return prev;

        return {
          ...prev,
          pharmacies: cloudPharms,
          audits: process(auds),
          cctvRecords: process(cctvs),
          physicalRecords: process(phys),
          managementRecords: process(mgmts),
          pendingRecords: process(pends),
          staffRecords: process(stfs),
          supportRecords: process(supps),
          deliveryReceipts: process(recs),
          assets: process(assts),
          loans: process(lns),
          schedule: process(schs),
          users: (dbUsers.data || []).map((u: any) => ({ 
            ...u, fullName: u.full_name, isApproved: u.is_approved, isBlocked: u.is_blocked 
          }))
        };
      });

      addToast("Datos Sincronizados", "sync");
    } catch (e) {
      console.error("Sync error:", e);
      addToast("Modo Offline Activo", "sync");
    } finally {
      setIsSyncing(false);
      syncInProgress.current = false;
    }
  }, [isBoss, addToast]);

  useEffect(() => {
    if (currentUser) fullSync(currentUser);
  }, [currentUser, fullSync]);

  const checkPermission = () => {
    if (isReadOnly) { addToast("Modo Lectura: Acceso Denegado", "error"); return false; }
    return true;
  };

  const saveToCloud = async (table: string, id: string, data: any) => {
    if (!checkPermission()) return;
    if (!supabase || !currentUser) return;
    try {
      const payload: any = { id, data, created_by: currentUser.fullName, zone: currentUser.zone || 'Global' };
      const pharmacyId = data.pharmacyId || (data.pharmacy && data.pharmacy.id);
      if (pharmacyId) payload.pharmacy_id = pharmacyId;
      const { error } = await supabase.from(table).upsert(payload);
      if (error) throw error;
      addToast("Guardado", "success");
    } catch (e) { addToast("Error al Guardar", "error"); }
  };

  const deleteFromCloud = async (table: string, id: string) => {
    if (!checkPermission()) return;
    if (!supabase) return;
    try {
      await supabase.from(table).delete().eq('id', id);
      addToast("Eliminado", "success");
    } catch (e) { addToast("Error al borrar", "error"); }
  };

  const handleUpdateUser = async (email: string, updates: any) => {
    if (!checkPermission()) return;
    if (!supabase) return;
    try {
      const dbUpdates: any = {};
      if (updates.isApproved !== undefined) dbUpdates.is_approved = updates.isApproved;
      if (updates.isBlocked !== undefined) dbUpdates.is_blocked = updates.isBlocked;
      await supabase.from('users').update(dbUpdates).eq('email', email);
      setUserData(prev => ({ ...prev, users: prev.users.map(u => u.email === email ? { ...u, ...updates } : u) }));
      addToast("Usuario actualizado", "success");
    } catch (e) { addToast("Error", "error"); }
  };

  const handleFinishAudit = async (audit: AuditState) => {
    if (!checkPermission()) return;
    const auditId = `audit-${Date.now()}`;
    const score = calculateAuditScore(audit);
    const completedAudit = { ...audit, id: auditId, date: new Date().toLocaleDateString('es-ES'), score, createdBy: currentUser.fullName };
    setUserData(prev => ({ ...prev, audits: [completedAudit, ...prev.audits] }));
    await saveToCloud('audits', auditId, completedAudit);
    setSelectedAudit(completedAudit);
    setCurrentView('audit-results');
  };

  const calculateAuditScore = (audit: AuditState) => {
    let total = 0; let ok = 0;
    Object.values(audit.hardwareAnswers).forEach(a => { if (a.status !== 'N/A') { total++; if (a.status === 'Operativo') ok++; } });
    Object.values(audit.processAnswers).forEach(a => { if (a.status !== 'N/A') { total++; if (a.status === 'SI') ok++; } });
    return total > 0 ? Math.round((ok / total) * 100) : 0;
  };

  // --- FILTRO DE USUARIOS PARA VISTAS (Aquí escondemos al Super Usuario) ---
  const getFilteredUsers = () => {
    return userData.users.filter(u => {
      const email = (u.email || '').toLowerCase();
      const role = (u.role || '').toLowerCase();
      // Escondemos Directiva Y escondemos Super Usuario
      return email !== 'directiva@xana.com' && role !== 'super usuario';
    });
  };

  if (!currentUser && supabase) return <Login onLogin={(u) => { setCurrentUser(u); sessionStorage.setItem('xana_active_user', JSON.stringify(u)); }} />;

  return (
    <div className="flex min-h-screen font-sans text-slate-900 overflow-x-hidden">
      <div className="fixed top-6 right-6 z-[250] space-y-3 pointer-events-none">
        {toasts.map(toast => (
          <div key={toast.id} className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border backdrop-blur-xl animate-in slide-in-from-right-10 duration-300 pointer-events-auto ${toast.type === 'success' ? 'bg-emerald-500 text-white' : toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-slate-800 text-white'}`}>
            {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : toast.type === 'error' ? <XCircle className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
            <span className="text-[10px] font-black uppercase tracking-widest">{toast.message}</span>
          </div>
        ))}
      </div>

      {supabase && (
        <>
          <Sidebar currentView={currentView} onNavigate={setCurrentView} user={currentUser} onLogout={() => { setCurrentUser(null); sessionStorage.removeItem('xana_active_user'); }} isSyncing={isSyncing} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
          <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden fixed top-6 left-6 z-50 p-4 bg-slate-900/80 backdrop-blur-md text-white rounded-2xl shadow-2xl border border-white/10"><Menu className="w-6 h-6" /></button>

          <main className={`flex-1 transition-all duration-300 lg:ml-80 p-4 md:p-6 ${isSidebarOpen ? 'blur-sm pointer-events-none lg:blur-none lg:pointer-events-auto' : ''}`}>
            {currentView === 'dashboard' && <Dashboard onNavigate={setCurrentView} pharmacies={userData.pharmacies} audits={userData.audits} cctvRecords={userData.cctvRecords} physicalRecords={userData.physicalRecords} managementRecords={userData.managementRecords} onSelectAudit={(a) => { setSelectedAudit(a); setCurrentView('audit-results'); }} />}
            
            {/* VISTAS CON PERMISOS Y FILTROS APLICADOS */}
            
            {currentView === 'ai-assistant' && !isReadOnly && <AIAssistant pharmacies={userData.pharmacies} audits={userData.audits} cctvRecords={userData.cctvRecords} physicalRecords={userData.physicalRecords} pendingRecords={userData.pendingRecords} staffRecords={userData.staffRecords} schedule={userData.schedule} dailyBriefing={userData.dailyBriefing} onSaveSchedule={async (s) => { if(!checkPermission()) return; setUserData(prev => ({...prev, schedule: s})); if (s.length > 0) await saveToCloud('schedule', s[0].id, s[0]); }} onSaveBriefing={(b) => setUserData(prev => ({...prev, dailyBriefing: b}))} onAddPending={async (p) => { if(!checkPermission()) return; setUserData(prev => ({...prev, pendingRecords: [p, ...prev.pendingRecords]})); await saveToCloud('pending_tasks', p.id, p); }} />}
            
            {currentView === 'audit-wizard' && <AuditWizard onCancel={() => setCurrentView('dashboard')} onFinish={handleFinishAudit} pharmacies={userData.pharmacies} onAddPharmacy={async (p) => { if(!checkPermission()) return; setUserData(prev => ({ ...prev, pharmacies: [...prev.pharmacies, p] })); await supabase.from('pharmacies').insert({ id: p.id, name: p.name, address: p.address, zone: p.zone, status: p.status, risk: p.risk, corporate_phone: p.corporatePhone, photo: p.photo, location: p.location }); }} />}
            
            {currentView === 'audit-results' && selectedAudit && <AuditResults audit={selectedAudit} onBack={() => setCurrentView('dashboard')} onSaveReport={async (id, text) => { if(!checkPermission()) return; const updated = userData.audits.map(a => a.id === id ? {...a, reportText: text} : a); setUserData(prev => ({...prev, audits: updated})); const aud = updated.find(x => x.id === id); if(aud) await saveToCloud('audits', id, aud); }} />}
            
            {currentView === 'new-visit' && <NewVisit pharmacies={userData.pharmacies} onCancel={() => setCurrentView('dashboard')} onSave={async (r) => { if(!checkPermission()) return; const rec = { ...r, createdBy: currentUser.fullName }; setUserData(prev => ({...prev, managementRecords: [rec, ...prev.managementRecords]})); await saveToCloud('management_visits', rec.id, rec); setCurrentView('visit-log'); }} />}
            
            {currentView === 'cctv-inventory' && <CCTVInventory pharmacies={userData.pharmacies} records={userData.cctvRecords} onBack={() => setCurrentView('dashboard')} onSave={async (r) => { if(!checkPermission()) return; const rec = { ...r, createdBy: currentUser.fullName }; setUserData(prev => ({...prev, cctvRecords: [...prev.cctvRecords, rec]})); await saveToCloud('cctv_records', rec.id, rec); }} onAddPharmacy={() => {}} />}
            
            {currentView === 'physical-inventory' && <PhysicalInventory pharmacies={userData.pharmacies} records={userData.physicalRecords} onBack={() => setCurrentView('dashboard')} onSave={async (r) => { if(!checkPermission()) return; const rec = { ...r, createdBy: currentUser.fullName }; setUserData(prev => ({...prev, physicalRecords: [...prev.physicalRecords, rec]})); await saveToCloud('physical_records', rec.id, rec); }} onAddPharmacy={() => {}} />}
            
            {currentView === 'pending-tasks' && <PendingTasks pharmacies={userData.pharmacies} records={userData.pendingRecords} onAdd={async (r) => { if(!checkPermission()) return; const rec = { ...r, createdBy: currentUser.fullName }; setUserData(prev => ({...prev, pendingRecords: [rec, ...prev.pendingRecords]})); await saveToCloud('pending_tasks', rec.id, rec); }} onUpdateStatus={async (id, status) => { if(!checkPermission()) return; const updated = userData.pendingRecords.map(r => r.id === id ? {...r, status} : r); setUserData(prev => ({...prev, pendingRecords: updated})); const p = updated.find(x => x.id === id); if(p) await saveToCloud('pending_tasks', id, p); }} onDelete={async (id) => { if(!checkPermission()) return; setUserData(prev => ({...prev, pendingRecords: prev.pendingRecords.filter(r => r.id !== id)})); await deleteFromCloud('pending_tasks', id); }} />}
            
            {currentView === 'delivery-receipts' && <DeliveryReceipts receipts={userData.deliveryReceipts} onAdd={async (r) => { if(!checkPermission()) return; const rec = { ...r, createdBy: currentUser.fullName }; setUserData(prev => ({...prev, deliveryReceipts: [rec, ...prev.deliveryReceipts]})); await saveToCloud('delivery_receipts', rec.id, rec); }} onDelete={async (id) => { if(!checkPermission()) return; setUserData(prev => ({...prev, deliveryReceipts: prev.deliveryReceipts.filter(r => r.id !== id)})); await deleteFromCloud('delivery_receipts', id); }} />}
            
            {currentView === 'asset-control' && <AssetControl pharmacies={userData.pharmacies} assets={userData.assets} loans={userData.loans} onAddAsset={async (a) => { if(!checkPermission()) return; setUserData(prev => ({...prev, assets: [...prev.assets, a]})); await saveToCloud('assets', a.id, a); }} onUpdateAsset={async (a) => { if(!checkPermission()) return; setUserData(prev => ({...prev, assets: prev.assets.map(x => x.id === a.id ? a : x)})); await saveToCloud('assets', a.id, a); }} onDeleteAsset={async (id) => { if(!checkPermission()) return; setUserData(prev => ({...prev, assets: prev.assets.filter(x => x.id !== id)})); await deleteFromCloud('assets', id); }} onSaveLoan={async (l) => { if(!checkPermission()) return; const ln = { ...l, createdBy: currentUser.fullName }; setUserData(prev => ({...prev, loans: [ln, ...prev.loans]})); await saveToCloud('loans', ln.id, ln); }} onReturnLoan={async (id, date, notes) => { if(!checkPermission()) return; const updated = userData.loans.map(l => l.id === id ? {...l, status: 'Devuelto' as const, actualReturnDate: date, notes: l.notes + " | RETORNO: " + notes} : l); setUserData(p => ({...p, loans: updated})); const ln = updated.find(x => x.id === id); if(ln) await saveToCloud('loans', id, ln); }} />}
            
            {/* AQUÍ APLICAMOS EL FILTRO QUE ESCONDE AL SUPER USUARIO (getFilteredUsers) */}
            {currentView === 'visit-log' && <VisitLog pharmacies={userData.pharmacies} audits={userData.audits} cctvRecords={userData.cctvRecords} physicalRecords={userData.physicalRecords} managementRecords={userData.managementRecords} users={getFilteredUsers()} onDeleteAudit={id => { if(!checkPermission()) return; setUserData(p => ({...p, audits: p.audits.filter(x => x.id !== id)})); deleteFromCloud('audits', id); }} onDeleteCCTV={id => { if(!checkPermission()) return; setUserData(p => ({...p, cctvRecords: p.cctvRecords.filter(x => x.id !== id)})); deleteFromCloud('cctv_records', id); }} onDeletePhysical={id => { if(!checkPermission()) return; setUserData(p => ({...p, physicalRecords: p.physicalRecords.filter(x => x.id !== id)})); deleteFromCloud('physical_records', id); }} onDeleteManagement={id => { if(!checkPermission()) return; setUserData(p => ({...p, managementRecords: p.managementRecords.filter(x => x.id !== id)})); deleteFromCloud('management_visits', id); }} hasAdminPrivileges={isBoss} />}
            
            {/* TAMBIÉN AQUÍ EN ESTADÍSTICAS */}
            {currentView === 'monthly-summary' && <MonthlySummary pharmacies={userData.pharmacies} audits={userData.audits} cctvRecords={userData.cctvRecords} physicalRecords={userData.physicalRecords} managementRecords={userData.managementRecords} users={getFilteredUsers()} currentUser={currentUser} />}
            
            {currentView === 'management-report' && !isReadOnly && <ManagementReport pharmacies={userData.pharmacies} audits={userData.audits} cctvRecords={userData.cctvRecords} physicalRecords={userData.physicalRecords} managementRecords={userData.managementRecords} />}
            
            {currentView === 'pharmacy-list' && <PharmacyList pharmacies={userData.pharmacies} staffRecords={userData.staffRecords} onUpdate={async (p) => { if(!checkPermission()) return; setUserData(prev => ({ ...prev, pharmacies: prev.pharmacies.map(x => x.id === p.id ? p : x) })); await supabase.from('pharmacies').upsert({ id: p.id, name: p.name, address: p.address, zone: p.zone, status: p.status, risk: p.risk, corporate_phone: p.corporatePhone, photo: p.photo, location: p.location }); }} onDelete={async (id) => { if(!checkPermission()) return; setUserData(prev => ({ ...prev, pharmacies: prev.pharmacies.filter(x => x.id !== id) })); await supabase.from('pharmacies').delete().eq('id', id); }} onAdd={async (p) => { if(!checkPermission()) return; setUserData(prev => ({ ...prev, pharmacies: [...prev.pharmacies, p] })); await supabase.from('pharmacies').insert({ id: p.id, name: p.name, address: p.address, zone: p.zone, status: p.status, risk: p.risk, corporate_phone: p.corporate_phone, photo: p.photo, location: p.location }); }} currentUser={currentUser} />}
            
            {currentView === 'staff-directory' && <StaffDirectory pharmacies={userData.pharmacies} staffRecords={userData.staffRecords} readOnly={isReadOnly} onAddStaff={async (s) => { if(!checkPermission()) return; setUserData(prev => ({...prev, staffRecords: [s, ...prev.staffRecords]})); await saveToCloud('staff', s.id, s); }} onDeleteStaff={async (id) => { if(!checkPermission()) return; setUserData(prev => ({...prev, staffRecords: prev.staffRecords.filter(x => x.id !== id)})); await deleteFromCloud('staff', id); }} />}
            
            {currentView === 'support-directory' && <SupportDirectory pharmacies={userData.pharmacies} supportRecords={userData.supportRecords} onAddContact={async (c) => { if(!checkPermission()) return; setUserData(prev => ({...prev, supportRecords: [c, ...prev.supportRecords]})); await saveToCloud('support_contacts', c.id, c); }} onDeleteContact={async (id) => { if(!checkPermission()) return; setUserData(prev => ({...prev, supportRecords: prev.supportRecords.filter(x => x.id !== id)})); await deleteFromCloud('support_contacts', id); }} />}
            
            {currentView === 'access-management' && !isReadOnly && <AccessManagement users={userData.users} onApprove={(email) => handleUpdateUser(email, { isApproved: true, isBlocked: false })} onBlock={(email) => handleUpdateUser(email, { isBlocked: true })} onDelete={async (email) => { if(!checkPermission()) return; setUserData(prev => ({...prev, users: prev.users.filter(u => u.email !== email)})); await supabase.from('users').delete().eq('email', email); }} />}
            
            {currentView === 'settings' && <Settings user={currentUser} onLogout={() => { setCurrentUser(null); sessionStorage.removeItem('xana_active_user'); }} />}
          </main>
        </>
      )}
    </div>
  );
};

export default App;
