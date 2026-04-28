import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Search, 
  MapPin, 
  Pencil, 
  Trash2, 
  Store,
  X,
  Crosshair,
  Map as MapIcon,
  Loader2,
  Save,
  Plus,
  Camera,
  Phone,
  Globe,
  Eye,
  ImageIcon,
  Upload,
  Crop,
  RotateCw,
  Minus,
  Maximize,
  AlertTriangle,
  UserCheck,
  Users,
  Navigation,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';
import { Pharmacy, StaffRecord } from '../types';

interface PharmacyListProps {
  pharmacies: Pharmacy[];
  staffRecords: StaffRecord[];
  onUpdate: (pharmacy: Pharmacy) => void;
  onDelete: (id: string) => void;
  onAdd: (pharmacy: Pharmacy) => void;
  currentUser: any;
  isTravelMode: boolean;
}

const ZONES = ['Gran Caracas Llanos', 'Gran Caracas Oriente', 'Centro Occidente'] as const;

const PharmacyList: React.FC<PharmacyListProps> = ({ 
  pharmacies, 
  staffRecords, 
  onUpdate, 
  onDelete, 
  onAdd, 
  currentUser,
  isTravelMode 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingPharmacy, setEditingPharmacy] = useState<Pharmacy | null>(null);
  const [viewingPharmacy, setViewingPharmacy] = useState<Pharmacy | null>(null);
  const [showNewPharmacyModal, setShowNewPharmacyModal] = useState(false);
  const [showGlobalMap, setShowGlobalMap] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ id: string; name: string } | null>(null);

  // ✅ MODO LECTURA: DIRECTIVA
  const isReadOnly = useMemo(() => {
    const email = (currentUser?.email || '').trim().toLowerCase();
    return email === 'directiva@xana.com';
  }, [currentUser]);

  const isAdmin = useMemo(() => {
    const adminRoles = ['Gerente de seguridad', 'Lider de investigaciones', 'Super Usuario'];
    return adminRoles.includes(currentUser?.role);
  }, [currentUser]);

  // Si está en modo viaje o es admin, permite elegir zona. Si no, usa su zona por defecto.
  const initialZone = (isAdmin || isTravelMode) ? 'Gran Caracas Llanos' : (currentUser?.zone || 'Gran Caracas Llanos');

  const [newPharmacyData, setNewPharmacyData] = useState({
    name: '',
    address: '',
    corporatePhone: '',
    zone: initialZone as Pharmacy['zone'],
    location: null as { lat: number; lng: number } | null,
    photo: null as string | null,
    hasSecurityOfficer: false,
    activa: true
  });

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    corporatePhone: '',
    zone: initialZone as Pharmacy['zone'],
    location: null as { lat: number; lng: number } | null,
    photo: null as string | null,
    hasSecurityOfficer: false,
    activa: true
  });
  const [showMapModal, setShowMapModal] = useState(false);
  const [mapMode, setMapMode] = useState<'edit' | 'create'>('edit');
  const [showCropModal, setShowCropModal] = useState(false);
  const [tempImage, setTempImage] = useState<string | null>(null); 
  const [cropScale, setCropScale] = useState(1);
  const [cropRotation, setCropRotation] = useState(0);
  const [cropOffset, setCropOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [editorMode, setEditorMode] = useState<'create' | 'edit'>('create');
  
  const imageRef = useRef<HTMLImageElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const globalMapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const globalMapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [isLocating, setIsLocating] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [tempLocation, setTempLocation] = useState<{ lat: number; lng: number } | null>(null);

  // --- MAP INITIALIZATION ---
  useEffect(() => {
    if (!showMapModal) return;
    const timeout = setTimeout(() => {
      if (!mapContainerRef.current) return;
      const L = (window as any).L;
      if (!L) return;
      const initialLat = tempLocation?.lat || 10.4806;
      const initialLng = tempLocation?.lng || -66.9036;
      if (mapInstanceRef.current) mapInstanceRef.current.remove();
      try {
        const map = L.map(mapContainerRef.current, { zoomControl: false, attributionControl: false }).setView([initialLat, initialLng], 15);
        L.control.zoom({ position: 'topright' }).addTo(map);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
        const marker = L.marker([initialLat, initialLng], { draggable: true }).addTo(map);
        marker.on('dragend', () => { const pos = marker.getLatLng(); setTempLocation({ lat: pos.lat, lng: pos.lng }); });
        map.on('click', (e: any) => { marker.setLatLng(e.latlng); setTempLocation({ lat: e.latlng.lat, lng: e.latlng.lng }); });
        mapInstanceRef.current = map; markerRef.current = marker;
        map.invalidateSize(); setTimeout(() => map.invalidateSize(), 100);
      } catch (err) { console.error(err); }
    }, 350);
    return () => { clearTimeout(timeout); if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; } };
  }, [showMapModal]);

  // --- GLOBAL MAP ---
  useEffect(() => {
    if (!showGlobalMap) return;
    const timeout = setTimeout(() => {
      if (!globalMapRef.current) return;
      const L = (window as any).L;
      if (!L) return;
      if (globalMapInstanceRef.current) globalMapInstanceRef.current.remove();
      try {
        const map = L.map(globalMapRef.current, { zoomControl: false, attributionControl: false }).setView([10.4806, -66.9036], 12);
        L.control.zoom({ position: 'topright' }).addTo(map);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
        const orangeIcon = L.divIcon({ className: 'custom-marker', html: `<div style="background-color: #ea580c; width: 24px; height: 24px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 2px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.3);"></div>`, iconSize: [24, 24], iconAnchor: [12, 24], tooltipAnchor: [15, -15] });
        
        const zonePharmacies = pharmacies.filter(p => p.location);
        const bounds = L.latLngBounds([]);
        zonePharmacies.forEach(p => {
          if (p.location) {
            const marker = L.marker([p.location.lat, p.location.lng], { icon: orangeIcon }).addTo(map);
            marker.bindTooltip(`<div style="padding: 4px; font-family: sans-serif;"><p style="margin: 0; font-weight: 900; color: #1e293b; text-transform: uppercase; font-size: 10px;">${p.name}</p><p style="margin: 2px 0 0 0; color: #64748b; font-size: 9px;">${p.address.substring(0, 40)}...</p></div>`, { direction: 'top', opacity: 0.9 });
            marker.on('click', () => { map.flyTo([p.location!.lat, p.location!.lng], 18, { animate: true, duration: 1.5 }); });
            bounds.extend([p.location.lat, p.location.lng]);
          }
        });
        if (zonePharmacies.length > 0) map.fitBounds(bounds, { padding: [50, 50] }); else map.setView([10.4806, -66.9036], 11);
        globalMapInstanceRef.current = map; map.invalidateSize();
      } catch (err) { console.error(err); }
    }, 350);
    return () => { clearTimeout(timeout); if (globalMapInstanceRef.current) { globalMapInstanceRef.current.remove(); globalMapInstanceRef.current = null; } };
  }, [showGlobalMap, pharmacies]);

  const openGPS = (lat: number, lng: number) => window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => { 
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude }; 
        setTempLocation(coords); 
        if (mapInstanceRef.current && markerRef.current) { 
          mapInstanceRef.current.setView([coords.lat, coords.lng], 17); 
          markerRef.current.setLatLng([coords.lat, coords.lng]); 
        } 
        setIsLocating(false); 
      },
      () => { setIsLocating(false); alert("No se pudo obtener la ubicación actual."); },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  const filteredPharmacies = pharmacies.filter(p => {
    if (p.activa === false) return false;
    return p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
           p.address.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleEditClick = (pharmacy: Pharmacy) => {
    if (isReadOnly) return; // ✅ BLOQUEO DIRECTIVA
    setEditingPharmacy(pharmacy);
    setFormData({ 
      name: pharmacy.name, 
      address: pharmacy.address, 
      corporatePhone: pharmacy.corporatePhone || '', 
      zone: pharmacy.zone, 
      location: pharmacy.location || null, 
      photo: pharmacy.photo || null, 
      hasSecurityOfficer: pharmacy.hasSecurityOfficer || false,
      activa: pharmacy.activa !== false
    });
  };

  const handleSaveEdit = () => { 
    if (isReadOnly) return; // ✅ BLOQUEO DIRECTIVA
    if (!editingPharmacy) return; 
    onUpdate({ 
      ...editingPharmacy, 
      ...formData, 
      location: formData.location || undefined,  
      photo: formData.photo || undefined, 
      hasSecurityOfficer: formData.hasSecurityOfficer,
      activa: formData.activa
    }); 
    setEditingPharmacy(null); 
  };

  const handleSaveNew = () => { 
    if (isReadOnly) return; // ✅ BLOQUEO DIRECTIVA
    if (!newPharmacyData.name || !newPharmacyData.address) { 
      alert("Nombre y dirección obligatorios"); 
      return; 
    } 
    onAdd({ 
      id: `new-${Date.now()}`, 
      ...newPharmacyData, 
      location: newPharmacyData.location || undefined, 
      status: 'Sin auditorías previas', 
      photo: newPharmacyData.photo || undefined, 
      hasSecurityOfficer: newPharmacyData.hasSecurityOfficer,
      activa: newPharmacyData.activa
    }); 
    setShowNewPharmacyModal(false); 
    setNewPharmacyData({ 
      name: '', 
      address: '', 
      corporatePhone: '', 
      zone: initialZone as Pharmacy['zone'], 
      location: null, 
      photo: null, 
      hasSecurityOfficer: false 
    }); 
  };

  const startImageEditor = (imageData: string, mode: 'create' | 'edit') => { 
    if (isReadOnly) return; // ✅ BLOQUEO DIRECTIVA
    setTempImage(imageData); 
    setEditorMode(mode); 
    setCropScale(1); 
    setCropRotation(0); 
    setCropOffset({ x: 0, y: 0 }); 
    setShowCropModal(true); 
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, mode: 'create' | 'edit') => { 
    if (isReadOnly) { event.target.value = ''; return; } // ✅ BLOQUEO DIRECTIVA
    const file = event.target.files?.[0]; 
    if (file) { 
      const reader = new FileReader(); 
      reader.onloadend = () => startImageEditor(reader.result as string, mode); 
      reader.readAsDataURL(file); 
    } 
    event.target.value = ''; 
  };

  const startCamera = async () => { 
    if (isReadOnly) return; // ✅ BLOQUEO DIRECTIVA
    setShowCameraModal(true); 
    try { 
      setIsCameraReady(false); 
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment', 
          width: { ideal: 1280 }, 
          height: { ideal: 720 } 
        } 
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
      setShowCameraModal(false); 
      alert("No se pudo acceder a la cámara. Verifique los permisos."); 
    } 
  };

  const capturePhoto = () => { 
    if (isReadOnly) return; // ✅ BLOQUEO DIRECTIVA
    if (isCameraReady && videoRef.current && canvasRef.current) { 
      const canvas = canvasRef.current; 
      canvas.width = videoRef.current.videoWidth; 
      canvas.height = videoRef.current.videoHeight; 
      canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0); 
      const photoData = canvas.toDataURL('image/jpeg', 0.8); 
      stopCamera(); 
      startImageEditor(photoData, editingPharmacy ? 'edit' : 'create'); 
    } 
  };

  const stopCamera = () => { 
    if (cameraStream) { 
      cameraStream.getTracks().forEach(track => track.stop()); 
      setCameraStream(null); 
    } 
    setIsCameraReady(false); 
    setShowCameraModal(false); 
  };

  const confirmCrop = () => { 
    if (isReadOnly) return; // ✅ BLOQUEO DIRECTIVA
    if (!imageRef.current) return; 
    const canvas = document.createElement('canvas'); 
    canvas.width = 800; 
    canvas.height = 450; 
    const ctx = canvas.getContext('2d'); 
    if (ctx) { 
      ctx.fillStyle = '#f8fafc'; 
      ctx.fillRect(0, 0, canvas.width, canvas.height); 
      ctx.translate(canvas.width / 2, canvas.height / 2); 
      ctx.translate(cropOffset.x, cropOffset.y); 
      ctx.rotate((cropRotation * Math.PI) / 180); 
      ctx.scale(cropScale, cropScale); 
      ctx.drawImage(imageRef.current, -imageRef.current.naturalWidth / 2, -imageRef.current.naturalHeight / 2); 
      const finalImage = canvas.toDataURL('image/jpeg', 0.6); 
      if (editorMode === 'edit') setFormData(prev => ({ ...prev, photo: finalImage })); 
      else setNewPharmacyData(prev => ({ ...prev, photo: finalImage })); 
      setShowCropModal(false); 
    } 
  };

  const handleOpenMap = (mode: 'edit' | 'create') => { 
    if (isReadOnly) return; // ✅ BLOQUEO DIRECTIVA
    setMapMode(mode); 
    setTempLocation(mode === 'edit' ? formData.location : newPharmacyData.location || { lat: 10.4806, lng: -66.9036 }); 
    setShowMapModal(true); 
  };

  const confirmLocation = () => { 
    if (isReadOnly) return; // ✅ BLOQUEO DIRECTIVA
    if (tempLocation) { 
      mapMode === 'edit' ? setFormData(prev => ({ ...prev, location: tempLocation })) : setNewPharmacyData(prev => ({ ...prev, location: tempLocation })); 
    } 
    setShowMapModal(false); 
  };

  const renderCropModal = () => ( 
    <div className="fixed inset-0 bg-black/95 z-[400] flex flex-col p-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-center text-white mb-6">
        <div>
          <h3 className="text-xl font-bold">Ajustar Imagen</h3>
          <p className="text-xs text-white/50 uppercase tracking-widest mt-1">Arrastra para mover • Rueda para zoom</p>
        </div>
        <button onClick={() => setShowCropModal(false)} className="p-3 hover:bg-white/10 rounded-full transition-all">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div
        className="flex-1 relative overflow-hidden bg-slate-900 rounded-3xl flex items-center justify-center cursor-move"
        onMouseDown={(e) => { setIsDragging(true); setDragStart({ x: e.clientX - cropOffset.x, y: e.clientY - cropOffset.y }); }}
        onMouseMove={(e) => { if (isDragging) setCropOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y }); }}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
        onWheel={(e) => setCropScale(prev => Math.max(0.1, Math.min(5, prev - e.deltaY * 0.001)))}
      >
        <div className="absolute inset-0 border-4 border-orange-500/50 z-10 pointer-events-none flex items-center justify-center">
          <div className="w-[800px] h-[450px] max-w-full border-2 border-white/50 shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]"></div>
        </div>

        {tempImage && (
          <img
            ref={imageRef}
            src={tempImage}
            alt="Crop"
            draggable={false}
            className="max-w-none transition-transform duration-75 select-none"
            style={{ transform: `translate(${cropOffset.x}px, ${cropOffset.y}px) rotate(${cropRotation}deg) scale(${cropScale})` }}
          />
        )}
      </div>

      <div className="mt-8 flex flex-col md:flex-row items-center justify-between gap-8 bg-slate-800/50 p-6 rounded-3xl backdrop-blur-md">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setCropScale(prev => Math.max(0.1, prev - 0.1))} className="p-2 bg-white/10 rounded-lg text-white"><Minus className="w-5 h-5" /></button>
            <span className="text-white text-xs font-black w-12 text-center">{Math.round(cropScale * 100)}%</span>
            <button onClick={() => setCropScale(prev => Math.min(5, prev + 0.1))} className="p-2 bg-white/10 rounded-lg text-white"><Maximize className="w-5 h-5" /></button>
          </div>
          <button onClick={() => setCropRotation(prev => (prev + 90) % 360)} className="flex items-center gap-2 text-white text-xs font-black uppercase bg-white/10 px-4 py-2 rounded-xl"><RotateCw className="w-4 h-4" /> Rotar 90°</button>
        </div>
        <div className="flex gap-4">
          <button onClick={() => setShowCropModal(false)} className="px-8 py-3 text-white font-black uppercase text-[10px] tracking-widest">Cancelar</button>
          <button onClick={confirmCrop} className="bg-orange-600 text-white px-10 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center gap-2"><Save className="w-4 h-4" /> Finalizar</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-8 animate-in fade-in duration-500 pb-20">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h2 className="text-4xl font-black text-white tracking-normal drop-shadow-md">Sedes</h2>
          <p className="text-slate-300 mt-1 font-medium">
            {isAdmin ? 'Administración Global' : (isTravelMode ? 'Directorio Nacional' : `Zona: ${currentUser?.zone}`)}
          </p>
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => setShowGlobalMap(true)}
            className="bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-sm transition-all"
          >
            <Globe className="w-5 h-5 text-orange-400" /> Ver Mapa
          </button>

          {/* ✅ DIRECTIVA: NO VE "Registrar" */}
          {!isReadOnly && (
            <button
              onClick={() => setShowNewPharmacyModal(true)}
              className="bg-orange-600 hover:bg-orange-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all transform hover:-translate-y-0.5"
            >
              <Plus className="w-5 h-5" /> Registrar
            </button>
          )}
        </div>
      </div>

      <div className="relative mb-8 group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="w-5 h-5 text-slate-400 group-focus-within:text-orange-500" />
        </div>
        <input
          type="text"
          placeholder="Buscar farmacia..."
          className="w-full pl-12 pr-4 py-4 border border-white/20 rounded-2xl outline-none focus:ring-4 bg-white shadow-sm transition-all text-lg"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredPharmacies.length > 0 ? filteredPharmacies.map(pharmacy => (
          <div key={pharmacy.id} className="glass-card rounded-[2rem] p-1 border border-white/60 shadow-lg hover:shadow-2xl transition-all duration-300 group hover:-translate-y-2">
            <div className="h-44 bg-slate-100 rounded-t-[1.8rem] rounded-b-xl relative overflow-hidden">
              {pharmacy.photo ? (
                <img src={pharmacy.photo} alt={pharmacy.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-slate-50 flex items-center justify-center">
                  <Store className="w-16 h-16 text-slate-200" />
                </div>
              )}

              <div className="absolute top-3 right-3 flex gap-2">
                <button
                  onClick={() => setViewingPharmacy(pharmacy)}
                  className="p-2.5 bg-white/90 backdrop-blur-md rounded-xl text-slate-600 hover:text-blue-600 shadow-sm"
                >
                  <Eye className="w-4 h-4" />
                </button>

                {/* ✅ DIRECTIVA: NO VE EDITAR */}
                {!isReadOnly && (
                  <button
                    onClick={() => handleEditClick(pharmacy)}
                    className="p-2.5 bg-white/90 backdrop-blur-md rounded-xl text-slate-600 hover:text-orange-600 shadow-sm"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="absolute bottom-3 left-3 flex gap-1">
                <span className="bg-black/60 backdrop-blur text-white text-[9px] font-bold px-2 py-1 rounded-lg uppercase">
                  {pharmacy.zone}
                </span>
                {pharmacy.hasSecurityOfficer && (
                  <span className="bg-emerald-600/90 backdrop-blur text-white text-[9px] font-bold px-2 py-1 rounded-lg uppercase flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Vigilancia
                  </span>
                )}
              </div>
            </div>

            <div className="p-6">
              <h3 className="text-xl font-bold text-slate-800 mb-1 leading-tight">{pharmacy.name}</h3>
              <p className="text-sm text-slate-500 line-clamp-2 min-h-[40px] mb-4 font-medium">{pharmacy.address}</p>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100/50">
                <span
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wide border shadow-sm ${
                    pharmacy.risk === 'Bajo' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                    pharmacy.risk === 'Moderado' ? 'bg-yellow-50 text-yellow-600 border-yellow-100' :
                    pharmacy.risk === 'Medio' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                    pharmacy.risk === 'Alto' ? 'bg-red-50 text-red-600 border-red-100' :
                    pharmacy.risk === 'Extremo' ? 'bg-red-100 text-red-800 border-red-200' :
                    'bg-slate-50 text-slate-500 border-slate-100'
                  }`}
                >
                  {pharmacy.risk ? `Riesgo ${pharmacy.risk}` : 'Sin Evaluar'}
                </span>

                {/* ✅ DIRECTIVA: NO VE ELIMINAR */}
                {!isReadOnly && (
                  <button
                    onClick={() => setDeleteConfirmation({ id: pharmacy.id, name: pharmacy.name })}
                    className="text-slate-300 hover:text-red-500 rounded-lg p-2 transition-all"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )) : (
          <div className="col-span-full py-20 text-center">
            <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/20">
              <Store className="w-10 h-10 text-white/50" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No se encontraron farmacias</h3>
            <p className="text-slate-300 text-sm">Activa el "Modo Viaje" en el menú lateral si buscas una sede de otra zona.</p>
          </div>
        )}
      </div>

      {/* MODAL: ZONE MAP */}
      {showGlobalMap && (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-md z-[150] flex flex-col">
          <div className="p-6 border-b border-white/10 flex justify-between items-center text-white bg-slate-900 shadow-xl">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-600 rounded-2xl shadow-lg">
                <Globe className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-2xl font-black tracking-normal uppercase">Mapa de Cobertura</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.18em]">
                  {isAdmin ? 'Red Nacional de Sedes' : (isTravelMode ? 'Directorio Nacional (Modo Viaje)' : `Sedes de Zona: ${currentUser?.zone}`)}
                </p>
              </div>
            </div>
            <button onClick={() => setShowGlobalMap(false)} className="p-4 hover:bg-white/10 rounded-full transition-all">
              <X className="w-8 h-8" />
            </button>
          </div>

          <div className="flex-1 relative bg-slate-100">
            <div ref={globalMapRef} className="absolute inset-0 w-full h-full min-h-[500px]"></div>
            <div className="absolute bottom-8 left-8 z-[1000] bg-white/90 backdrop-blur-md p-5 rounded-[2rem] shadow-2xl border border-white max-w-xs">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Guía de Mapa</p>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-[#ea580c] rounded-full border-2 border-white shadow-sm"></div>
                  <span className="text-xs font-bold text-slate-700">Sede Registrada</span>
                </div>
                <p className="text-[10px] text-slate-500 font-medium leading-relaxed italic">
                  Mostrando {filteredPharmacies.length} sedes según el filtro activo.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ✅ DIRECTIVA: NO renderizar modales de crear/editar */}
      {!isReadOnly && showNewPharmacyModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl animate-in fade-in zoom-in duration-200 overflow-hidden border border-white/20">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-xl font-bold text-slate-800">Nueva Farmacia</h3>
              <button onClick={() => setShowNewPharmacyModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-6 h-6" /></button>
            </div>

            <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Nombre</label>
                  <input type="text" className="w-full p-3 border border-slate-200 rounded-xl outline-none" value={newPharmacyData.name} onChange={e => setNewPharmacyData({...newPharmacyData, name: e.target.value})} />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Zona</label>
                  {isAdmin || isTravelMode ? (
                    <select className="w-full p-3 border border-slate-200 rounded-xl outline-none" value={newPharmacyData.zone} onChange={e => setNewPharmacyData({...newPharmacyData, zone: e.target.value as any})}>
                      {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
                    </select>
                  ) : (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-600">{currentUser?.zone}</div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Teléfono Corporativo</label>
                  <input type="tel" placeholder="Ej. 0412-0000000" className="w-full p-3 border border-slate-200 rounded-xl outline-none" value={newPharmacyData.corporatePhone} onChange={e => setNewPharmacyData({...newPharmacyData, corporatePhone: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Seguridad</label>
                  <div className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl bg-slate-50">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={newPharmacyData.hasSecurityOfficer} onChange={e => setNewPharmacyData({...newPharmacyData, hasSecurityOfficer: e.target.checked})} />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                    </label>
                    <span className="text-sm font-medium text-slate-600">{newPharmacyData.hasSecurityOfficer ? "Con Oficial" : "Sin Oficial"}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Dirección</label>
                <textarea rows={2} className="w-full p-3 border border-slate-200 rounded-xl outline-none resize-none" value={newPharmacyData.address} onChange={e => setNewPharmacyData({...newPharmacyData, address: e.target.value})} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button onClick={() => handleOpenMap('create')} className={`p-4 border rounded-xl flex flex-col items-center justify-center gap-2 ${newPharmacyData.location ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-slate-50'}`}>
                  <MapIcon className="w-5 h-5" />
                  <span className="text-[10px] font-black uppercase">{newPharmacyData.location ? 'GPS Listo' : 'Definir GPS'}</span>
                </button>
                <button onClick={startCamera} className={`p-4 border rounded-xl flex flex-col items-center justify-center gap-2 ${newPharmacyData.photo ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50'}`}>
                  <Camera className="w-5 h-5" />
                  <span className="text-[10px] font-black uppercase">Tomar Foto</span>
                </button>
                <button onClick={() => fileInputRef.current?.click()} className={`p-4 border rounded-xl flex flex-col items-center justify-center gap-2 bg-slate-50`}>
                  <Upload className="w-5 h-5" />
                  <span className="text-[10px] font-black uppercase">Cargar Imagen</span>
                </button>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'create')} />
              </div>

              {newPharmacyData.photo && (
                <div className="mt-4 flex justify-center">
                  <img src={newPharmacyData.photo} alt="Preview" className="h-32 rounded-xl shadow-md border-2 border-slate-100" />
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
              <button onClick={() => setShowNewPharmacyModal(false)} className="px-6 py-2.5 rounded-xl text-slate-600 font-bold">Cancelar</button>
              <button onClick={handleSaveNew} className="px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold">Guardar Farmacia</button>
            </div>
          </div>
        </div>
      )}

      {!isReadOnly && editingPharmacy && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl animate-in fade-in zoom-in duration-200 overflow-hidden border border-white/20">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-xl font-bold text-slate-800">Editar Farmacia</h3>
              <button onClick={() => setEditingPharmacy(null)} className="text-slate-400 hover:text-slate-600"><X className="w-6 h-6" /></button>
            </div>

            <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Nombre</label>
                  <input type="text" className="w-full p-3 border border-slate-200 rounded-xl outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Zona</label>
                  {isAdmin || isTravelMode ? (
                    <select className="w-full p-3 border border-slate-200 rounded-xl outline-none" value={formData.zone} onChange={e => setFormData({...formData, zone: e.target.value as any})}>
                      {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
                    </select>
                  ) : (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-600">{formData.zone}</div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Teléfono Corporativo</label>
                  <input type="tel" className="w-full p-3 border border-slate-200 rounded-xl outline-none" value={formData.corporatePhone} onChange={e => setFormData({...formData, corporatePhone: e.target.value})} />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Seguridad</label>
                  <div className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl bg-slate-50">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={formData.hasSecurityOfficer} onChange={e => setFormData({...formData, hasSecurityOfficer: e.target.checked})} />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                    </label>
                    <span className="text-sm font-medium text-slate-600">{formData.hasSecurityOfficer ? "Con Oficial" : "Sin Oficial"}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Dirección</label>
                <textarea rows={2} className="w-full p-3 border border-slate-200 rounded-xl outline-none resize-none" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button onClick={() => handleOpenMap('edit')} className={`p-4 border rounded-xl flex flex-col items-center justify-center gap-2 ${formData.location ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-slate-50'}`}>
                  <MapIcon className="w-5 h-5" />
                  <span className="text-[10px] font-black uppercase">Actualizar GPS</span>
                </button>
                <button onClick={startCamera} className={`p-4 border rounded-xl flex flex-col items-center justify-center gap-2 bg-slate-50`}>
                  <Camera className="w-5 h-5" />
                  <span className="text-[10px] font-black uppercase">Nueva Foto</span>
                </button>
                <button onClick={() => fileInputRef.current?.click()} className={`p-4 border rounded-xl flex flex-col items-center justify-center gap-2 bg-slate-50`}>
                  <Upload className="w-5 h-5" />
                  <span className="text-[10px] font-black uppercase">Cargar Foto</span>
                </button>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'edit')} />
              </div>

              {formData.photo && (
                <div className="mt-4 flex justify-center">
                  <img src={formData.photo} alt="Preview" className="h-32 rounded-xl shadow-md border-2 border-slate-100" />
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
              <button onClick={() => setEditingPharmacy(null)} className="px-6 py-2.5 rounded-xl text-slate-600 font-bold">Cancelar</button>
              <button onClick={handleSaveEdit} className="px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold">Guardar Cambios</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: VIEW DETAILS (igual, solo lectura OK) */}
      {viewingPharmacy && (() => {
        const pharmacyStaff = staffRecords.filter(s => s.pharmacyId === viewingPharmacy.id);
        const manager = pharmacyStaff.find(s => s.role === 'Gerente') || pharmacyStaff.find(s => s.role === 'Gerente/Regente');
        const staffCount = pharmacyStaff.length;

        return (
          <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-[120] flex items-center justify-center p-4">
            <div className="bg-white rounded-[2.5rem] w-full max-w-4xl shadow-3xl animate-in zoom-in-95 duration-300 overflow-hidden border border-white/20 flex flex-col max-h-[90vh]">
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white rounded-2xl border border-slate-100 shadow-sm text-orange-600">
                    <Store className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-800 tracking-normal">{viewingPharmacy.name}</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{viewingPharmacy.zone}</p>
                  </div>
                </div>
                <button onClick={() => setViewingPharmacy(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <X className="w-7 h-7 text-slate-400" />
                </button>
              </div>

              <div className="p-8 overflow-y-auto flex-1 bg-white">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-8">
                    {viewingPharmacy.photo ? (
                      <div className="rounded-3xl overflow-hidden shadow-xl border-4 border-slate-50 bg-slate-100 aspect-video relative">
                        <img src={viewingPharmacy.photo} alt={viewingPharmacy.name} className="w-full h-full object-cover" />
                        <div className="absolute top-4 left-4">
                          {viewingPharmacy.hasSecurityOfficer ? (
                            <span className="bg-emerald-600/90 backdrop-blur text-white text-xs font-black px-3 py-1.5 rounded-xl uppercase flex items-center gap-2 shadow-lg">
                              <ShieldCheck className="w-4 h-4" /> Oficial de Seguridad
                            </span>
                          ) : (
                            <span className="bg-slate-800/80 backdrop-blur text-white text-xs font-black px-3 py-1.5 rounded-xl uppercase flex items-center gap-2 shadow-lg">
                              <ShieldAlert className="w-4 h-4" /> Sin Vigilancia
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-3xl border-4 border-dashed border-slate-100 aspect-video flex flex-col items-center justify-center text-slate-200 relative">
                        <ImageIcon className="w-16 h-16" />
                        <p className="text-xs font-black uppercase tracking-widest mt-4">Sin registro fotográfico</p>
                        <div className="absolute top-4 left-4">
                          {viewingPharmacy.hasSecurityOfficer ? (
                            <span className="bg-emerald-50 text-emerald-600 text-xs font-black px-3 py-1.5 rounded-xl uppercase flex items-center gap-2 border border-emerald-100">
                              <ShieldCheck className="w-4 h-4" /> Oficial de Seguridad
                            </span>
                          ) : (
                            <span className="bg-slate-100 text-slate-500 text-xs font-black px-3 py-1.5 rounded-xl uppercase flex items-center gap-2 border border-slate-200">
                              <ShieldAlert className="w-4 h-4" /> Sin Vigilancia
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="bg-slate-50 rounded-3xl p-8 space-y-6">
                      <div>
                        <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest block mb-2">Dirección de Sede</label>
                        <div className="flex gap-3">
                          <MapPin className="w-5 h-5 text-orange-500 shrink-0" />
                          <p className="text-slate-700 font-bold leading-relaxed">{viewingPharmacy.address}</p>
                        </div>
                      </div>
                      {viewingPharmacy.corporatePhone && (
                        <div>
                          <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest block mb-2">Contacto Corporativo</label>
                          <a href={`tel:${viewingPharmacy.corporatePhone}`} className="flex items-center gap-3 text-blue-600 hover:text-blue-700 font-black text-lg transition-colors">
                            <Phone className="w-5 h-5" />
                            {viewingPharmacy.corporatePhone}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white border-2 border-slate-50 p-6 rounded-2xl shadow-sm flex flex-col">
                        <div className="flex items-center gap-2 mb-3">
                          <UserCheck className="w-4 h-4 text-orange-500" />
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Gerente de Sede</p>
                        </div>
                        {manager ? (
                          <>
                            <p className="text-slate-800 font-black text-xs uppercase truncate mb-1">{manager.fullName}</p>
                            <p className="text-orange-600 font-mono text-[10px] font-bold">{manager.phone || 'Sin teléfono'}</p>
                          </>
                        ) : (
                          <p className="text-slate-300 font-bold text-[10px] uppercase italic">Sin asignar</p>
                        )}
                      </div>

                      <div className="bg-white border-2 border-slate-50 p-6 rounded-2xl shadow-sm flex flex-col">
                        <div className="flex items-center gap-2 mb-3">
                          <Users className="w-4 h-4 text-indigo-500" />
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Fuerza de Trabajo</p>
                        </div>
                        <p className="text-slate-800 font-black text-lg tracking-normal leading-none">{staffCount}</p>
                        <p className="text-slate-400 font-bold text-[9px] uppercase mt-1">Colaboradores</p>
                      </div>
                    </div>

                    <div className="h-64 rounded-3xl overflow-hidden border-2 border-slate-50 shadow-inner bg-slate-100 relative group">
                      {viewingPharmacy.location ? (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-blue-50">
                          <div className="text-center mb-4">
                            <Globe className="w-12 h-12 text-blue-300 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Coordenadas Registradas</p>
                            <p className="text-[10px] font-mono font-bold text-blue-300 mt-1">{viewingPharmacy.location.lat.toFixed(6)}, {viewingPharmacy.location.lng.toFixed(6)}</p>
                          </div>
                          <button 
                            onClick={() => openGPS(viewingPharmacy.location!.lat, viewingPharmacy.location!.lng)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-blue-500/30 transition-all transform hover:-translate-y-0.5"
                          >
                            <Navigation className="w-4 h-4" /> Ir con GPS
                          </button>
                        </div>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                          <MapIcon className="w-12 h-12 mb-2" />
                          <p className="text-[10px] font-black uppercase tracking-widest">Sin GPS definido</p>
                        </div>
                      )}
                    </div>

                    <div className="bg-orange-50/50 p-6 rounded-2xl border-2 border-orange-100/50">
                      <div className="flex items-center gap-3 text-orange-600 mb-3">
                        <AlertTriangle className="w-5 h-5" />
                        <h4 className="text-xs font-black uppercase tracking-widest">Gestión de Sede</h4>
                      </div>
                      <p className="text-[11px] text-orange-700/70 font-medium leading-relaxed">
                        Utilice esta ficha para validar datos en campo. En caso de discrepancias en la dirección o contacto, solicite actualización al Administrador Global.
                      </p>
                    </div>

                  </div>
                </div>
              </div>

              <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-4">
                <button 
                  onClick={() => setViewingPharmacy(null)}
                  className="px-8 py-3 rounded-xl bg-slate-900 text-white font-black uppercase tracking-widest text-[10px] shadow-xl hover:bg-slate-800 transition-all"
                >
                  Cerrar Ficha
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {showCropModal && renderCropModal()}

      {/* Cámara / mapa / delete confirmation: directiva nunca los abrirá porque no tiene botones,
          pero igual los dejamos protegidos por isReadOnly arriba (handlers no hacen nada). */}
      {showCameraModal && (
        <div className="fixed inset-0 bg-black z-[500] flex flex-col animate-in fade-in duration-300">
          <div className="p-6 flex justify-between items-center text-white bg-black/50 absolute top-0 w-full z-[510] backdrop-blur-md">
            <div>
              <h3 className="font-black uppercase tracking-widest">Capturar Foto Sede</h3>
              <p className="text-[10px] text-white/60 font-bold uppercase mt-0.5">Ajuste el encuadre a la fachada</p>
            </div>
            <button onClick={stopCamera} className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-all">
              <X className="w-7 h-7" />
            </button>
          </div>
          <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-black">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-[505]">
              <div className="w-[85%] h-[60%] border-2 border-white/20 rounded-3xl border-dashed"></div>
            </div>
          </div>
          <canvas ref={canvasRef} className="hidden" />
          <div className="fixed bottom-10 left-0 right-0 flex justify-center items-center z-[600] pointer-events-none">
            <button
              onClick={capturePhoto}
              disabled={!isCameraReady}
              className={`w-20 h-20 rounded-full bg-white border-[6px] border-slate-300 ring-4 ring-orange-500 ring-offset-4 ring-offset-black shadow-[0_0_50px_rgba(249,115,22,0.5)] transition-all active:scale-90 hover:scale-105 flex items-center justify-center group pointer-events-auto ${!isCameraReady ? 'opacity-50 grayscale' : ''}`}
            >
              <div className="w-16 h-16 rounded-full border-2 border-slate-100 group-active:bg-slate-100 transition-colors"></div>
            </button>
          </div>
          <div className="fixed bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-black/80 to-transparent z-[515] pointer-events-none"></div>
        </div>
      )}

      {showMapModal && (
        <div className="fixed inset-0 bg-black/80 z-[140] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-4xl h-[600px] flex flex-col relative overflow-hidden shadow-2xl animate-in zoom-in">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-white">
              <h3 className="font-bold text-lg">{mapMode === 'create' ? 'Definir Ubicación' : 'Actualizar Ubicación'}</h3>
              <button onClick={() => setShowMapModal(false)} className="hover:bg-slate-100 p-2 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 relative bg-slate-100">
              <div ref={mapContainerRef} className="absolute inset-0 w-full h-full min-h-[400px]"></div>
              <button
                onClick={handleGetCurrentLocation}
                disabled={isLocating}
                className="absolute bottom-10 right-6 z-[1000] p-4 bg-white hover:bg-slate-50 text-slate-800 rounded-2xl shadow-2xl border border-slate-100 transition-all active:scale-95 flex items-center gap-3"
              >
                {isLocating ? <Loader2 className="w-6 h-6 animate-spin text-orange-500" /> : <Crosshair className="w-6 h-6 text-orange-600" />}
                <span className="font-black uppercase tracking-widest text-[10px]">Mi Ubicación Actual</span>
              </button>
            </div>
            <div className="p-4 border-t flex justify-end gap-3 bg-white">
              <button onClick={confirmLocation} className="bg-orange-600 text-white px-8 py-2.5 rounded-xl font-bold hover:bg-orange-700 shadow-lg">
                Confirmar Ubicación
              </button>
            </div>
          </div>
        </div>
      )}

      {!isReadOnly && deleteConfirmation && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[180] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl text-center">
            <Trash2 className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h3 className="text-2xl font-black mb-2 tracking-normal">¿Eliminar {deleteConfirmation.name}?</h3>
            <p className="text-slate-500 mb-6">Esta acción borrará permanentemente la sede y todos sus registros asociados.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirmation(null)} className="flex-1 py-3 rounded-xl border font-bold">Cancelar</button>
              <button
                onClick={() => {
                  onDelete(deleteConfirmation.id);
                  setDeleteConfirmation(null);
                }}
                className="flex-1 py-3 rounded-xl bg-red-600 text-white font-bold"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PharmacyList;
