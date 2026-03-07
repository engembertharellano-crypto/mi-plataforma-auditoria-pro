import React, { useState, useRef, useEffect } from 'react';
import { 
  Key, 
  Plus, 
  Search, 
  Trash2, 
  User, 
  Clock, 
  Building2, 
  CheckCircle2, 
  ArrowUpRight,
  ClipboardList,
  History,
  Archive,
  X,
  MapPin,
  Camera,
  Upload,
  ImageIcon,
  Maximize2,
  Layers,
  Zap,
  ChevronRight,
  Truck,
  Info,
  RefreshCw,
  AlertTriangle,
  Pencil,
  LogOut,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Pharmacy, Asset, AssetLoan, AssetComponent } from '../types';

interface AssetControlProps {
  pharmacies: Pharmacy[];
  assets: Asset[];
  loans: AssetLoan[];
  onAddAsset: (asset: Asset) => void;
  onUpdateAsset: (asset: Asset) => void;
  onDeleteAsset: (id: string) => void;
  onSaveLoan: (loan: AssetLoan) => void;
  onReturnLoan: (loanId: string, actualReturnDate: string, notes: string) => void;
}

const AssetControl: React.FC<AssetControlProps> = ({ 
  pharmacies, 
  assets, 
  loans, 
  onAddAsset, 
  onUpdateAsset, 
  onDeleteAsset, 
  onSaveLoan, 
  onReturnLoan 
}) => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'active-loans' | 'history'>('active-loans');
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [editingAssetId, setEditingAssetId] = useState<string | null>(null);
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState<AssetLoan | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showPermanentExitConfirm, setShowPermanentExitConfirm] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null);

  // Asset Form State
  const [assetFormData, setAssetFormData] = useState<Partial<Asset>>({
    name: '',
    category: 'Llaves',
    description: '',
    pharmacyId: '',
    status: 'Disponible',
    photo: '',
    createdAt: new Date().toLocaleDateString('es-ES')
  });
  const [tempComponents, setTempComponents] = useState<AssetComponent[]>([]);
  const [newCompName, setNewCompName] = useState('');
  const [newCompQty, setNewCompQty] = useState(1);

  // Loan Form State
  const [loanFormData, setLoanFormData] = useState<Partial<AssetLoan> & { customDept?: string }>({
    assetId: '', borrowerName: '', department: 'Operaciones', expectedReturnDate: '', notes: '', loanPhoto: '', customDept: ''
  });
  const [loanLentComponents, setLoanLentComponents] = useState<AssetComponent[]>([]);
  const [returnNotes, setReturnNotes] = useState('');

  // Camera State
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const loanFileInputRef = useRef<HTMLInputElement>(null);
  const [cameraConfig, setCameraConfig] = useState<{ active: boolean, mode: 'asset' | 'loan' }>({ active: false, mode: 'asset' });
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);

  const formatDateForInput = (dateString?: string) => {
    if (!dateString) return '';
    const parts = dateString.split('/');
    if (parts.length === 3) {
      const [day, month, year] = parts;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    return dateString;
  };

  const formatDateFromInput = (dateString: string) => {
    if (!dateString) return '';
    const parts = dateString.split('-');
    if (parts.length === 3) {
      const [year, month, day] = parts;
      return `${day}/${month}/${year}`;
    }
    return dateString;
  };

  // --- LÓGICA DE INVENTARIO REAL ---
  const getAssetStock = (asset: Asset) => {
    const activeLoansForAsset = loans.filter(l => l.assetId === asset.id && l.status === 'Activo');
    const currentComponents = asset.components.map(origComp => {
      const lentQty = activeLoansForAsset.reduce((sum, loan) => {
        const found = loan.lentComponents.find(lc => lc.name === origComp.name);
        return sum + (found ? found.quantity : 0);
      }, 0);
      return { ...origComp, quantity: Math.max(0, origComp.quantity - lentQty) };
    });
    const totalAvailable = currentComponents.reduce((sum, c) => sum + c.quantity, 0);
    return { components: currentComponents, totalAvailable };
  };

  useEffect(() => {
    if (loanFormData.assetId) {
      const selectedAsset = assets.find(a => a.id === loanFormData.assetId);
      if (selectedAsset) {
        const stock = getAssetStock(selectedAsset);
        setLoanLentComponents(stock.components.map(c => ({ ...c })));
      }
    }
  }, [loanFormData.assetId, assets, loans]);

  // --- SISTEMA DE CÁMARA ROBUSTO ---
  useEffect(() => {
    let stream: MediaStream | null = null;
    const startStreaming = async () => {
      if (!cameraConfig.active) return;
      try {
        setIsCameraReady(false);
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false
        });
        setCameraStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play();
            setIsCameraReady(true);
          };
        }
      } catch (err) {
        console.error("Camera Error:", err);
        alert("No se pudo acceder a la cámara. Verifique permisos.");
        setCameraConfig({ active: false, mode: 'asset' });
      }
    };
    startStreaming();
    return () => {
      if (stream) stream.getTracks().forEach(track => track.stop());
    };
  }, [cameraConfig.active]);

  const capturePhoto = () => {
    if (!isCameraReady || !videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      if (cameraConfig.mode === 'asset') setAssetFormData(prev => ({ ...prev, photo: dataUrl }));
      else setLoanFormData(prev => ({ ...prev, loanPhoto: dataUrl }));
      stopCamera();
    }
  };

  const stopCamera = () => {
    if (cameraStream) cameraStream.getTracks().forEach(t => t.stop());
    setCameraStream(null);
    setIsCameraReady(false);
    setCameraConfig({ active: false, mode: 'asset' });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, mode: 'asset' | 'loan') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (mode === 'asset') setAssetFormData(prev => ({ ...prev, photo: reader.result as string }));
        else setLoanFormData(prev => ({ ...prev, loanPhoto: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const addComponent = () => {
    if (!newCompName.trim()) return;
    setTempComponents([...tempComponents, { id: `comp-${Date.now()}`, name: newCompName, quantity: newCompQty }]);
    setNewCompName('');
    setNewCompQty(1);
  };

  const removeComponent = (id: string) => {
    setTempComponents(tempComponents.filter(c => c.id !== id));
  };

  const handleOpenAssetModal = (asset?: Asset) => {
    if (asset) {
      setEditingAssetId(asset.id);
      setAssetFormData({ ...asset });
      setTempComponents([...asset.components]);
    } else {
      setEditingAssetId(null);
      setAssetFormData({
        name: '',
        category: 'Llaves',
        description: '',
        pharmacyId: '',
        status: 'Disponible',
        photo: '',
        createdAt: new Date().toLocaleDateString('es-ES')
      });
      setTempComponents([]);
    }
    setShowAssetModal(true);
  };

  const handleSaveAsset = () => {
    if (!assetFormData.name) return;
    const finalAsset: Asset = {
      id: editingAssetId || `asset-${Date.now()}`,
      name: assetFormData.name!,
      category: assetFormData.category as any,
      description: assetFormData.description || '',
      pharmacyId: assetFormData.pharmacyId,
      status: (assetFormData.status as any) || 'Disponible',
      components: tempComponents,
      photo: assetFormData.photo,
      createdAt: assetFormData.createdAt || new Date().toLocaleDateString('es-ES')
    };
    editingAssetId ? onUpdateAsset(finalAsset) : onAddAsset(finalAsset);
    setShowAssetModal(false);
  };

  const handleAddLoan = () => {
    if (!loanFormData.assetId || !loanFormData.borrowerName || !loanFormData.expectedReturnDate) {
      alert("Por favor complete los campos obligatorios.");
      return;
    }

    const dateParts = loanFormData.expectedReturnDate!.split('-');
    const formattedExpDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;

    const finalDept = loanFormData.department === 'Otros' ? (loanFormData.customDept || 'Otros') : loanFormData.department;
    
    onSaveLoan({
      id: `loan-${Date.now()}`,
      assetId: loanFormData.assetId!,
      borrowerName: loanFormData.borrowerName!,
      department: finalDept as any,
      loanDate: new Date().toLocaleDateString('es-ES'),
      expectedReturnDate: formattedExpDate,
      status: 'Activo',
      notes: loanFormData.notes || '',
      lentComponents: loanLentComponents.filter(c => c.quantity > 0),
      loanPhoto: loanFormData.loanPhoto
    });

    setShowLoanModal(false);
    setLoanFormData({ assetId: '', borrowerName: '', department: 'Operaciones', expectedReturnDate: '', notes: '', loanPhoto: '', customDept: '' });
    setLoanLentComponents([]);
  };

  const handleFinalizeTransferFromReturn = () => {
    if (showReturnModal) {
      const asset = assets.find(a => a.id === showReturnModal.assetId);
      if (asset) {
        const updatedComponents = asset.components.map(origC => {
          const lentC = showReturnModal.lentComponents.find(lc => lc.name === origC.name);
          return { ...origC, quantity: Math.max(0, origC.quantity - (lentC ? lentC.quantity : 0)) };
        });
        const remainingTotal = updatedComponents.reduce((sum, c) => sum + c.quantity, 0);
        if (remainingTotal === 0) onDeleteAsset(asset.id);
        else onUpdateAsset({ ...asset, components: updatedComponents });
        onReturnLoan(showReturnModal.id, new Date().toLocaleDateString('es-ES'), `SALIDA DEFINITIVA A SEDE. ${returnNotes}`);
      }
      setShowReturnModal(null);
      setReturnNotes('');
    }
  };

  const filteredAssets = assets.filter(a => 
    a.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (pharmacies.find(p => p.id === a.pharmacyId)?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- LÓGICA DE HISTORIAL DE MOVIMIENTOS ---
  const allHistory = [...loans].sort((a, b) => {
    const dateA = a.loanDate.split('/').reverse().join('');
    const dateB = b.loanDate.split('/').reverse().join('');
    return dateB.localeCompare(dateA);
  });

  return (
    <div className="max-w-7xl mx-auto p-10 animate-in fade-in duration-700 pb-20">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
        <div>
          <div className="flex items-center gap-4 mb-2">
             <div className="p-3 bg-orange-600 rounded-2xl text-white shadow-xl">
                <Key className="w-8 h-8" />
             </div>
             <h2 className="text-4xl font-black text-white tracking-tighter drop-shadow-md uppercase">Control de Custodia</h2>
          </div>
          <p className="text-slate-300 font-bold uppercase tracking-[0.2em] text-[10px] ml-1">Stock Real e Inventario Táctico</p>
        </div>
        <div className="flex gap-4">
           <button 
             onClick={() => handleOpenAssetModal()}
             className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-6 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 hover:bg-white/20 transition-all"
           >
             <Archive className="w-4 h-4" /> Registrar Activo
           </button>
           <button 
             onClick={() => setShowLoanModal(true)}
             className="bg-orange-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 shadow-xl shadow-orange-600/20 hover:bg-orange-500 transition-all"
           >
             <ArrowUpRight className="w-4 h-4" /> Nuevo Préstamo
           </button>
        </div>
      </div>

      {/* TABS & SEARCH */}
      <div className="flex flex-col lg:flex-row gap-6 mb-10 items-center">
        <div className="bg-white/80 backdrop-blur-md p-1.5 rounded-2xl flex border border-white/20 shadow-sm w-full lg:w-fit">
          {[
            { id: 'active-loans', label: 'En Préstamo', icon: Clock },
            { id: 'inventory', label: 'Disponible', icon: ClipboardList },
            { id: 'history', label: 'Historial', icon: History }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === tab.id ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 w-full group">
          <Search className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Buscar activos, responsables o farmacias..."
            className="w-full pl-14 pr-6 py-4 border border-white/20 rounded-[1.5rem] outline-none focus:ring-4 focus:ring-orange-500/10 bg-white shadow-sm transition-all font-medium text-slate-800"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* ACTIVE LOANS VIEW */}
      {activeTab === 'active-loans' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           {loans.filter(l => l.status === 'Activo').map(loan => {
             const asset = assets.find(a => a.id === loan.assetId);
             const pharmacy = pharmacies.find(p => p.id === asset?.pharmacyId);
             return (
               <div key={loan.id} className="bg-white rounded-[2.5rem] overflow-hidden border border-white shadow-xl hover:shadow-2xl transition-all group flex flex-col">
                  {loan.loanPhoto || asset?.photo ? (
                    <div className="h-44 relative group/img overflow-hidden">
                       <img src={loan.loanPhoto || asset?.photo} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="Asset" />
                       <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                          <button onClick={() => setViewingPhoto((loan.loanPhoto || asset?.photo) || null)} className="bg-white/20 backdrop-blur-md p-3 rounded-full text-white"><Maximize2 className="w-5 h-5" /></button>
                       </div>
                       <div className="absolute top-4 left-4">
                          <span className="bg-orange-600 text-white px-3 py-1 rounded-lg text-[9px] font-black uppercase shadow-lg">En Tránsito</span>
                       </div>
                    </div>
                  ) : null}
                  <div className="p-8 flex-1">
                     <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-slate-100 rounded-lg text-slate-400">
                           <Key className="w-5 h-5" />
                        </div>
                        <h3 className="text-xl font-black text-slate-800 tracking-tight uppercase truncate">{asset?.name || 'Recurso Removido'}</h3>
                     </div>
                     <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">
                        <Building2 className="w-3.5 h-3.5" />
                        {pharmacy?.name || 'Sede General'}
                     </div>
                     <div className="space-y-4 mb-8">
                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-2"><Layers className="w-3 h-3" /> Entregado:</p>
                        <div className="flex flex-wrap gap-2">
                           {loan.lentComponents?.map(c => (
                             <span key={c.id} className="bg-slate-50 border border-slate-100 px-2 py-1 rounded-md text-[9px] font-bold text-slate-500 uppercase">{c.quantity}x {c.name}</span>
                           ))}
                        </div>
                     </div>
                     <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                        <div className="flex items-center gap-3 mb-3">
                           <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 font-black text-sm uppercase">{loan.borrowerName.charAt(0)}</div>
                           <div>
                              <p className="text-sm font-black text-slate-800 leading-none">{loan.borrowerName}</p>
                              <p className="text-[9px] font-bold text-orange-600 uppercase tracking-widest mt-1">{loan.department}</p>
                           </div>
                        </div>
                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase">
                           <span>Retorno: <span className="text-slate-800">{loan.expectedReturnDate}</span></span>
                           <Clock className="w-3.5 h-3.5" />
                        </div>
                     </div>
                  </div>
                  <div className="p-4 bg-slate-50/50 border-t border-slate-50">
                    <button onClick={() => setShowReturnModal(loan)} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2"><CheckCircle2 className="w-4 h-4" /> Recibir Devolución</button>
                  </div>
               </div>
             );
           })}
        </div>
      )}

      {/* INVENTORY VIEW */}
      {activeTab === 'inventory' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
           {filteredAssets.map(asset => {
             const pharmacy = pharmacies.find(p => p.id === asset.pharmacyId);
             const stock = getAssetStock(asset);
             if (stock.totalAvailable === 0) return null;
             return (
               <div key={asset.id} className="bg-white rounded-[2rem] overflow-hidden border border-white shadow-xl hover:shadow-2xl transition-all group flex flex-col">
                  <div className="h-32 bg-slate-50 relative overflow-hidden shrink-0">
                     {asset.photo ? <img src={asset.photo} className="w-full h-full object-cover" alt="Asset" /> : <div className="w-full h-full flex items-center justify-center text-slate-200"><ImageIcon className="w-12 h-12" /></div>}
                     <div className="absolute top-3 left-3"><span className="px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg text-[8px] font-black uppercase shadow-sm">Disponible</span></div>
                     <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleOpenAssetModal(asset)} className="p-2 bg-white/90 backdrop-blur-md rounded-lg text-slate-600 hover:text-orange-600 shadow-sm transition-colors"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => setShowDeleteConfirm(asset.id)} className="p-2 bg-white/90 backdrop-blur-md rounded-lg text-slate-600 hover:text-red-600 shadow-sm transition-colors"><Trash2 className="w-4 h-4" /></button>
                     </div>
                  </div>
                  <div className="p-6 flex-1 flex flex-col">
                     <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-4 truncate">{asset.name}</h4>
                     <div className="space-y-2 mb-6 flex-1">
                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-2">Stock en Oficina:</p>
                        {stock.components.map(c => (
                          <div key={c.id} className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                             <span className={c.quantity === 0 ? 'text-slate-300 line-through' : ''}>{c.name}</span>
                             <span className={`font-black ${c.quantity === 0 ? 'text-red-400' : 'text-slate-800'}`}>x{c.quantity}</span>
                          </div>
                        ))}
                     </div>
                     <div className="flex items-center justify-between border-t pt-4 mt-auto">
                        <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400 uppercase"><MapPin className="w-3 h-3 text-orange-500" /> {pharmacy?.name || 'Sede General'}</div>
                        <button onClick={() => setShowPermanentExitConfirm(asset.id)} className="bg-slate-100 hover:bg-slate-200 p-2 rounded-xl text-slate-400 hover:text-slate-600 transition-all flex items-center gap-2 text-[8px] font-black uppercase tracking-widest"><LogOut className="w-3 h-3" /> Salida</button>
                     </div>
                  </div>
               </div>
             );
           })}
        </div>
      )}

      {/* HISTORY VIEW (BITÁCORA COMPLETA) */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-3xl border border-white animate-in slide-in-from-bottom-4 duration-500">
           <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-3">
                 <History className="w-5 h-5 text-orange-600" />
                 <h3 className="font-black text-slate-800 uppercase tracking-tight">Bitácora de Movimientos</h3>
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Auditoría completa de entradas y salidas</p>
           </div>
           <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                 <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-100">
                       <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Activo / Recurso</th>
                       <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Responsable</th>
                       <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Período de Custodia</th>
                       <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Estatus</th>
                       <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Evidencia</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                    {allHistory.map(loan => {
                       const asset = assets.find(a => a.id === loan.assetId);
                       const pharmacy = pharmacies.find(p => p.id === asset?.pharmacyId);
                       
                       const today = new Date();
                       today.setHours(0, 0, 0, 0);

                       const expParts = loan.expectedReturnDate.split('/');
                       const expDate = new Date(parseInt(expParts[2]), parseInt(expParts[1]) - 1, parseInt(expParts[0]));
                       expDate.setHours(0, 0, 0, 0);

                       const isDelayed = loan.status === 'Activo' && today.getTime() > expDate.getTime();

                       return (
                          <tr key={loan.id} className="hover:bg-slate-50/50 transition-colors">
                             <td className="p-6">
                                <p className="font-black text-slate-800 text-sm uppercase tracking-tight">{asset?.name || 'Recurso Removido'}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{pharmacy?.name || 'Sede General'}</p>
                             </td>
                             <td className="p-6">
                                <p className="font-bold text-slate-700 text-sm">{loan.borrowerName}</p>
                                <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest">{loan.department}</p>
                             </td>
                             <td className="p-6">
                                <div className="flex flex-col gap-1">
                                   <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                                      <span className="w-2 h-2 rounded-full bg-orange-400"></span> Salida: {loan.loanDate}
                                   </div>
                                   {loan.status === 'Devuelto' ? (
                                      <div className="flex items-center gap-2 text-xs font-bold text-emerald-600">
                                         <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Entrada: {loan.actualReturnDate}
                                      </div>
                                   ) : (
                                      <div className={`flex items-center gap-2 text-xs font-bold ${isDelayed ? 'text-red-500' : 'text-slate-400'}`}>
                                         <span className={`w-2 h-2 rounded-full ${isDelayed ? 'bg-red-500' : 'bg-slate-300'}`}></span> Estimado: {loan.expectedReturnDate}
                                      </div>
                                   )}
                                </div>
                             </td>
                             <td className="p-6">
                                {loan.status === 'Devuelto' ? (
                                   <span className="bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase border border-emerald-100 shadow-sm flex items-center gap-2 w-fit">
                                      <CheckCircle2 className="w-3 h-3" /> Devuelto
                                   </span>
                                ) : isDelayed ? (
                                   <span className="bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase border border-red-100 shadow-sm flex items-center gap-2 w-fit">
                                      <AlertCircle className="w-3 h-3 animate-pulse" /> Retrasado
                                   </span>
                                ) : (
                                   <span className="bg-orange-50 text-orange-600 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase border border-orange-100 shadow-sm flex items-center gap-2 w-fit">
                                      <Truck className="w-3 h-3" /> En Préstamo
                                   </span>
                                )}
                             </td>
                             <td className="p-6 text-center">
                                {loan.loanPhoto ? (
                                   <button onClick={() => setViewingPhoto(loan.loanPhoto!)} className="w-10 h-10 rounded-xl overflow-hidden border border-slate-200 hover:border-orange-500 transition-all shadow-sm group/btn relative inline-block">
                                      <img src={loan.loanPhoto} className="w-full h-full object-cover transition-transform group-hover/btn:scale-125" alt="Historial" />
                                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/btn:opacity-100 flex items-center justify-center transition-opacity">
                                         <Maximize2 className="w-3 h-3 text-white" />
                                      </div>
                                   </button>
                                ) : (
                                   <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Sin Foto</span>
                                )}
                             </td>
                          </tr>
                       );
                    })}
                    {allHistory.length === 0 && (
                       <tr>
                          <td colSpan={5} className="p-24 text-center">
                             <div className="flex flex-col items-center gap-4 opacity-20 grayscale">
                                <History className="w-16 h-16" />
                                <p className="font-black uppercase tracking-[0.3em] text-xs">Sin movimientos registrados</p>
                             </div>
                          </td>
                       </tr>
                    )}
                 </tbody>
              </table>
           </div>
        </div>
      )}

      {/* ASSET MODAL (NEW/EDIT) */}
      {showAssetModal && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-[150] flex items-center justify-center p-6">
          <div className="bg-white rounded-[3.5rem] w-full max-w-4xl shadow-3xl animate-in zoom-in-95 duration-200 overflow-hidden border border-white/20 flex flex-col max-h-[90vh]">
             <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
                <div className="flex items-center gap-4">
                   <div className="p-3 bg-slate-900 rounded-2xl text-white shadow-xl"><Archive className="w-6 h-6" /></div>
                   <h3 className="text-2xl font-black text-slate-800 tracking-tighter uppercase">{editingAssetId ? 'Modificar Activo' : 'Registrar Activo'}</h3>
                </div>
                <button onClick={() => setShowAssetModal(false)} className="p-2 hover:bg-white rounded-full text-slate-300"><X className="w-7 h-7" /></button>
             </div>
             <div className="p-12 overflow-y-auto flex-1 custom-scrollbar">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                   <div className="space-y-8">
                      <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Nombre del Activo</label><input type="text" className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl font-black text-slate-800 outline-none focus:border-orange-500" value={assetFormData.name} onChange={e => setAssetFormData({...assetFormData, name: e.target.value})} placeholder="Ej. Llavero Sede Caracas" /></div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Categoría</label><select className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl font-black text-slate-800 outline-none focus:border-orange-500" value={assetFormData.category} onChange={e => setAssetFormData({...assetFormData, category: e.target.value as any})}><option value="Llaves">Llaves</option><option value="Equipos">Equipos</option><option value="Tokens">Tokens</option><option value="Otros">Otros</option></select></div>
                        <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Farmacia / Sede</label><select className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl font-black text-slate-800 outline-none focus:border-orange-500" value={assetFormData.pharmacyId} onChange={e => setAssetFormData({...assetFormData, pharmacyId: e.target.value})}><option value="">Sede General</option>{pharmacies.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Fecha de Creación</label>
                        <input
                          type="date"
                          className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl font-black text-slate-800 outline-none focus:border-orange-500"
                          value={formatDateForInput(assetFormData.createdAt)}
                          onChange={e => setAssetFormData({ ...assetFormData, createdAt: formatDateFromInput(e.target.value) })}
                        />
                      </div>

                      <div className="space-y-4">
                         <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Evidencia Fotográfica</label>
                         <div className="aspect-video bg-slate-50 rounded-3xl border-4 border-dashed border-slate-100 overflow-hidden relative group">
                            {assetFormData.photo ? <img src={assetFormData.photo} className="w-full h-full object-cover" alt="Asset" /> : <div className="w-full h-full flex flex-col items-center justify-center text-slate-200"><ImageIcon className="w-16 h-16 mb-2" /><p className="text-[10px] font-black uppercase tracking-widest">Sin Captura</p></div>}
                            <div className="absolute inset-0 flex items-center justify-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 backdrop-blur-sm">
                               <button onClick={() => setCameraConfig({ active: true, mode: 'asset' })} className="bg-orange-600 text-white p-4 rounded-2xl shadow-2xl hover:scale-110 transition-transform"><Camera className="w-6 h-6" /></button>
                               <button onClick={() => fileInputRef.current?.click()} className="bg-slate-900 text-white p-4 rounded-2xl shadow-2xl hover:scale-110 transition-transform"><Upload className="w-6 h-6" /></button>
                               <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'asset')} />
                            </div>
                         </div>
                      </div>
                   </div>
                   <div className="space-y-8">
                      <div><div className="flex justify-between items-center mb-4"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Componentes (Stock)</label><Zap className="w-4 h-4 text-orange-400" /></div>
                         <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 space-y-4 mb-6">
                            <div className="flex gap-3"><input type="text" placeholder="Ej. Llave Acceso" className="flex-1 p-3 bg-white border-2 border-slate-100 rounded-xl font-bold text-xs outline-none focus:border-orange-500" value={newCompName} onChange={e => setNewCompName(e.target.value)} /><input type="number" className="w-20 p-3 bg-white border-2 border-slate-100 rounded-xl text-center font-black text-xs" value={newCompQty} onChange={e => setNewCompQty(parseInt(e.target.value) || 1)} /><button onClick={addComponent} className="bg-slate-900 text-white p-3 rounded-xl hover:bg-black transition-all shadow-md"><Plus className="w-5 h-5" /></button></div>
                         </div>
                         <div className="space-y-3">{tempComponents.map(c => (<div key={c.id} className="flex justify-between items-center p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow"><div className="flex items-center gap-3"><div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center text-orange-600 font-black text-xs">{c.quantity}</div><span className="font-bold text-slate-700 text-sm uppercase tracking-tight">{c.name}</span></div><button onClick={() => removeComponent(c.id)} className="text-slate-200 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button></div>))}</div>
                      </div>
                      <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Notas Técnicas</label><textarea className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl h-24 font-medium text-slate-600 outline-none focus:border-orange-500 resize-none transition-all" value={assetFormData.description} onChange={e => setAssetFormData({...assetFormData, description: e.target.value})} placeholder="Detalle fallas o requerimientos..." /></div>
                   </div>
                </div>
             </div>
             <div className="p-10 border-t border-slate-100 flex gap-6 bg-slate-50/50 shrink-0"><button onClick={() => setShowAssetModal(false)} className="px-10 py-4 text-slate-400 font-black uppercase text-[10px] hover:text-slate-600 transition-colors">Cerrar</button><button onClick={handleSaveAsset} className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] shadow-xl hover:bg-black transition-all">Sincronizar Inventario</button></div>
          </div>
        </div>
      )}

      {/* LOAN MODAL (ASIGNAR PRÉSTAMO) */}
      {showLoanModal && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-[150] flex items-center justify-center p-6">
          <div className="bg-white rounded-[3.5rem] w-full max-w-5xl shadow-3xl animate-in zoom-in-95 duration-200 overflow-hidden border border-white/20 flex flex-col max-h-[90vh]">
             <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
                <div className="flex items-center gap-4">
                   <div className="p-3 bg-orange-600 rounded-2xl text-white shadow-xl"><ArrowUpRight className="w-6 h-6" /></div>
                   <h3 className="text-2xl font-black text-slate-800 tracking-tighter uppercase">Formalizar Préstamo</h3>
                </div>
                <button onClick={() => setShowLoanModal(false)} className="p-2 hover:bg-white rounded-full text-slate-300"><X className="w-7 h-7" /></button>
             </div>
             <div className="p-12 overflow-y-auto flex-1 custom-scrollbar">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                   <div className="lg:col-span-5 space-y-8">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Seleccionar Activo con Stock</label>
                        <select 
                          className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl font-black text-slate-800 outline-none focus:border-orange-500" 
                          value={loanFormData.assetId} 
                          onChange={e => setLoanFormData({...loanFormData, assetId: e.target.value})}
                        >
                          <option value="">--- Seleccionar Activo ---</option>
                          {assets.filter(a => getAssetStock(a).totalAvailable > 0).map(a => {
                            const p = pharmacies.find(ph => ph.id === a.pharmacyId);
                            return <option key={a.id} value={a.id}>{a.name} ({p ? p.name : 'Sede General'})</option>;
                          })}
                        </select>
                      </div>
                      <div className="space-y-6">
                         <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Responsable del Retiro</label><div className="relative"><User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" /><input type="text" className="w-full p-4 pl-12 bg-slate-50 border-2 border-slate-50 rounded-2xl font-black text-slate-800 outline-none focus:border-orange-500" value={loanFormData.borrowerName} onChange={e => setLoanFormData({...loanFormData, borrowerName: e.target.value})} placeholder="Nombre completo..." /></div></div>
                         <div className="grid grid-cols-2 gap-4">
                            <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Unidad / Dept.</label><select className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl font-black text-slate-800 outline-none focus:border-orange-500" value={loanFormData.department} onChange={e => setLoanFormData({...loanFormData, department: e.target.value as any})}><option value="Operaciones">Operaciones</option><option value="TI">TI</option><option value="Mantenimiento">Mantenimiento</option><option value="Otros">Otros</option></select></div>
                            <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Retorno Estimado</label><input type="date" className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl font-black text-slate-800 outline-none focus:border-orange-500" value={loanFormData.expectedReturnDate} onChange={e => setLoanFormData({...loanFormData, expectedReturnDate: e.target.value})} /></div>
                         </div>
                         {loanFormData.department === 'Otros' && <div className="animate-in slide-in-from-top-2 duration-200"><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Especificar Departamento</label><input type="text" className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl font-black text-slate-800 outline-none focus:border-orange-500 shadow-sm" value={loanFormData.customDept} onChange={e => setLoanFormData({...loanFormData, customDept: e.target.value})} placeholder="Indique la unidad..." /></div>}
                      </div>
                      <div className="space-y-4">
                         <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Foto de Entrega (Evidencia)</label>
                         <div className="aspect-video bg-slate-50 rounded-3xl border-4 border-dashed border-slate-100 overflow-hidden relative group">
                            {loanFormData.loanPhoto ? <img src={loanFormData.loanPhoto} className="w-full h-full object-cover" alt="Loan Photo" /> : <div className="w-full h-full flex flex-col items-center justify-center text-slate-200"><Camera className="w-12 h-12 mb-2" /><p className="text-[10px] font-black uppercase tracking-widest">Capturar Entrega</p></div>}
                            <div className="absolute inset-0 flex items-center justify-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 backdrop-blur-sm">
                               <button onClick={() => setCameraConfig({ active: true, mode: 'loan' })} className="bg-orange-600 text-white p-4 rounded-2xl shadow-2xl hover:scale-110 transition-transform"><Camera className="w-6 h-6" /></button>
                               <button onClick={() => loanFileInputRef.current?.click()} className="bg-slate-900 text-white p-4 rounded-2xl shadow-2xl hover:scale-110 transition-transform"><Upload className="w-6 h-6" /></button>
                               <input type="file" ref={loanFileInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'loan')} />
                            </div>
                         </div>
                      </div>
                   </div>
                   <div className="lg:col-span-7 space-y-8">
                      <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 min-h-full">
                         <div className="flex items-center gap-3 mb-6"><ClipboardList className="w-5 h-5 text-orange-600" /><h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">¿Qué se está entregando hoy?</h4></div>
                         {loanLentComponents.length > 0 ? (
                           <div className="space-y-4">
                              {loanLentComponents.map((c, idx) => {
                                 const asset = assets.find(a => a.id === loanFormData.assetId);
                                 const currentStock = asset ? getAssetStock(asset).components.find(orig => orig.name === c.name)?.quantity || 0 : 0;
                                 return (
                                   <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                                      <div className="flex items-center gap-4"><div className={`w-3 h-3 rounded-full ${c.quantity > 0 ? 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.4)]' : 'bg-slate-200'}`}></div><div><span className={`text-sm font-black uppercase tracking-tight ${c.quantity > 0 ? 'text-slate-800' : 'text-slate-300'}`}>{c.name}</span><p className="text-[8px] font-black text-slate-400 mt-0.5">DISPONIBLE: {currentStock}</p></div></div>
                                      <div className="flex items-center gap-4 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                                         <button onClick={() => { const next = [...loanLentComponents]; next[idx].quantity = Math.max(0, next[idx].quantity - 1); setLoanLentComponents(next); }} className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-red-500 font-black">-</button>
                                         <span className="w-12 text-center font-black text-slate-700 text-sm">{c.quantity}</span>
                                         <button onClick={() => { const next = [...loanLentComponents]; next[idx].quantity = Math.min(currentStock, next[idx].quantity + 1); setLoanLentComponents(next); }} className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-emerald-500 font-black">+</button>
                                      </div>
                                   </div>
                                 );
                              })}
                           </div>
                         ) : <div className="py-20 text-center text-slate-300"><Archive className="w-12 h-12 mx-auto mb-4 opacity-20" /><p className="text-[10px] font-black uppercase tracking-widest">Seleccione un activo con stock</p></div>}
                         <div className="mt-10"><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Observaciones de Entrega</label><textarea className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl h-24 font-medium text-slate-600 outline-none focus:border-orange-500 resize-none transition-all" value={loanFormData.notes} onChange={e => setLoanFormData({...loanFormData, notes: e.target.value})} placeholder="Condiciones físicas al entregar..." /></div>
                      </div>
                   </div>
                </div>
             </div>
             <div className="p-10 border-t border-slate-100 flex justify-end gap-6 bg-slate-50/50 shrink-0"><button onClick={() => setShowLoanModal(false)} className="px-10 py-4 text-slate-400 font-black uppercase text-[10px]">Cancelar</button><button onClick={handleAddLoan} className="flex-1 py-4 bg-orange-600 text-white rounded-2xl font-black uppercase text-[10px] shadow-xl shadow-orange-600/20 hover:bg-orange-500 transition-all">Emitir Custodia</button></div>
          </div>
        </div>
      )}

      {/* RETURN/TRANSFER MODAL */}
      {showReturnModal && (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-xl z-[160] flex items-center justify-center p-6 animate-in zoom-in-95 duration-200">
           <div className="bg-white rounded-[3.5rem] w-full max-w-xl p-12 shadow-3xl text-center border border-white/20">
              <div className="w-24 h-24 bg-emerald-100 rounded-[2.5rem] flex items-center justify-center mb-8 mx-auto text-emerald-600 shadow-inner"><CheckCircle2 className="w-12 h-12" /></div>
              <h3 className="text-3xl font-black text-slate-900 tracking-tighter mb-4">Cerrar Custodia</h3>
              <p className="text-slate-500 font-medium mb-10 text-sm uppercase leading-relaxed tracking-wide">Gestionando retorno de <strong>{assets.find(a => a.id === showReturnModal.assetId)?.name}</strong>.</p>
              <div className="space-y-4 mb-10">
                <button onClick={() => { onReturnLoan(showReturnModal.id, new Date().toLocaleDateString('es-ES'), returnNotes); setShowReturnModal(null); setReturnNotes(''); }} className="w-full group p-6 rounded-3xl border-2 border-slate-50 hover:border-emerald-200 hover:bg-emerald-50 transition-all text-left flex items-start gap-4"><div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl group-hover:bg-emerald-600 group-hover:text-white transition-all"><RefreshCw className="w-6 h-6" /></div><div><p className="font-black text-slate-800 uppercase text-xs tracking-widest mb-1">Regresar al Inventario</p><p className="text-[10px] text-slate-400 font-medium">Las piezas regresan a Seguridad.</p></div><ChevronRight className="w-5 h-5 ml-auto text-slate-200 mt-3" /></button>
                <button onClick={handleFinalizeTransferFromReturn} className="w-full group p-6 rounded-3xl border-2 border-slate-50 hover:border-blue-200 hover:bg-blue-50 transition-all text-left flex items-start gap-4"><div className="p-3 bg-blue-100 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-all"><Truck className="w-6 h-6" /></div><div><p className="font-black text-slate-800 uppercase text-xs tracking-widest mb-1">Entrega Definitiva a Sede</p><p className="text-[10px] text-slate-400 font-medium">Salen de custodia permanentemente.</p></div><ChevronRight className="w-5 h-5 ml-auto text-slate-200 mt-3" /></button>
              </div>
              <div className="mb-10 text-left ml-2"><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Notas de Recepción</label><textarea className="w-full p-6 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] h-24 font-medium text-slate-600 outline-none focus:border-emerald-500 resize-none" value={returnNotes} onChange={e => setReturnNotes(e.target.value)} placeholder="¿Recibió todo conforme?" /></div>
              <button onClick={() => setShowReturnModal(null)} className="w-full py-5 rounded-2xl border-2 border-slate-100 text-slate-400 font-black uppercase tracking-widest text-[10px]">Cerrar</button>
           </div>
        </div>
      )}

      {/* CONFIRMATION DIALOGS */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[200] flex items-center justify-center p-6">
           <div className="bg-white rounded-[2.5rem] w-full max-w-md p-10 shadow-3xl text-center">
              <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6"><Trash2 className="w-10 h-10" /></div>
              <h3 className="text-2xl font-black text-slate-900 mb-2 uppercase">¿Eliminar Activo?</h3>
              <p className="text-slate-500 text-sm mb-10">Se removerá el activo y todo su historial de préstamos del sistema de forma permanente.</p>
              <div className="flex gap-4">
                 <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 py-4 bg-slate-100 rounded-xl font-black uppercase text-[10px] text-slate-500">Cancelar</button>
                 <button onClick={() => { onDeleteAsset(showDeleteConfirm); setShowDeleteConfirm(null); }} className="flex-1 py-4 bg-red-600 rounded-xl font-black uppercase text-[10px] text-white shadow-xl">Eliminar</button>
              </div>
           </div>
        </div>
      )}

      {showPermanentExitConfirm && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[200] flex items-center justify-center p-6">
           <div className="bg-white rounded-[2.5rem] w-full max-w-md p-10 shadow-3xl text-center">
              <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6"><Truck className="w-10 h-10" /></div>
              <h3 className="text-2xl font-black text-slate-900 mb-2 uppercase">¿Salida Definitiva?</h3>
              <p className="text-slate-500 text-sm mb-10">El activo regresará permanentemente a la sede y ya no figurará bajo custodia de seguridad.</p>
              <div className="flex gap-4">
                 <button onClick={() => setShowPermanentExitConfirm(null)} className="flex-1 py-4 bg-slate-100 rounded-xl font-black uppercase text-[10px] text-slate-500">Cancelar</button>
                 <button onClick={() => { onDeleteAsset(showPermanentExitConfirm); setShowPermanentExitConfirm(null); }} className="flex-1 py-4 bg-blue-600 rounded-xl font-black uppercase text-[10px] text-white shadow-xl">Confirmar Salida</button>
              </div>
           </div>
        </div>
      )}

      {/* CAMERA OVERLAY */}
      {cameraConfig.active && (
        <div className="fixed inset-0 bg-black z-[250] flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="w-full max-w-lg aspect-square bg-slate-900 rounded-[3rem] overflow-hidden border-8 border-white/10 relative">
              <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover transition-opacity duration-500 ${isCameraReady ? 'opacity-100' : 'opacity-0'}`} />
              {!isCameraReady && <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-white"><Loader2 className="w-12 h-12 animate-spin text-orange-500" /><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Iniciando Cámara...</p></div>}
              <div className="absolute inset-0 pointer-events-none border-4 border-orange-500/30 rounded-[2rem] m-8 border-dashed"></div>
           </div>
           <div className="mt-12 flex items-center gap-12">
              <button onClick={stopCamera} className="w-16 h-16 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-all"><X className="w-8 h-8" /></button>
              <button onClick={capturePhoto} disabled={!isCameraReady} className={`w-24 h-24 rounded-full bg-white border-8 border-orange-600 shadow-[0_0_50px_rgba(234,88,12,0.4)] active:scale-90 transition-all ${!isCameraReady ? 'grayscale opacity-50 cursor-not-allowed' : ''}`}></button>
              <div className="w-16 h-16"></div>
           </div>
           <canvas ref={canvasRef} className="hidden" />
        </div>
      )}

      {/* PHOTO VIEWER */}
      {viewingPhoto && (
        <div className="fixed inset-0 bg-slate-900/95 z-[300] flex items-center justify-center p-10 animate-in zoom-in-95" onClick={() => setViewingPhoto(null)}>
           <div className="max-w-4xl w-full h-full flex flex-col" onClick={e => e.stopPropagation()}>
              <div className="flex justify-end mb-4"><button onClick={() => setViewingPhoto(null)} className="p-4 bg-white/10 rounded-full text-white"><X className="w-8 h-8" /></button></div>
              <div className="flex-1 rounded-[3rem] overflow-hidden shadow-3xl bg-slate-800 border border-white/10">
                 <img src={viewingPhoto} className="w-full h-full object-contain" alt="Vista" />
              </div>
           </div>
        </div>
      )}

    </div>
  );
};

export default AssetControl;
