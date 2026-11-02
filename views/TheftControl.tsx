import React, { useState, useMemo } from 'react';
import { 
  PackageX, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  Clock, 
  Building2, 
  DollarSign, 
  ExternalLink, 
  FileSpreadsheet, 
  Video, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  Trash2, 
  Edit3, 
  Eye, 
  X, 
  Save, 
  ArrowLeft, 
  Printer, 
  Layers, 
  TrendingDown, 
  ShieldCheck, 
  FileText,
  FolderOpen,
  Users,
  Link,
  UserCheck,
  Upload,
  ClipboardPaste,
  FileCheck,
  Shield,
  ShieldX,
  BarChart3,
  PieChart
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { 
  Pharmacy, 
  TheftRecord, 
  TheftProductItem, 
  TheftType, 
  TheftShift, 
  TheftReporter,
  TheftEvidenceLink 
} from '../types';

interface TheftControlProps {
  pharmacies: Pharmacy[];
  theftRecords: TheftRecord[];
  onAddRecord: (record: TheftRecord) => void;
  onUpdateRecord: (record: TheftRecord) => void;
  onDeleteRecord: (id: string) => void;
  currentUser: any;
  hasAdminPrivileges: boolean;
}

const ZONES_LIST = [
  'Perfumería',
  'Cuidado Personal',
  'Neveras',
  'RX (Medicamentos / Recetario)',
  'Cosmético',
  'Snack',
  'Piso de Venta / Pasillos',
  'Área de Cajas',
  'Góndolas Promocionales',
  'Depósito / Almacén',
  'Entrada / Salida',
  'Otro'
];

const REPORTERS_LIST: TheftReporter[] = [
  'Personal de farmacia',
  'Personal Administrativo',
  'Coordinador de seguridad',
  'Otro cliente',
  'Otro'
];

const THEFT_TYPES: TheftType[] = [
  'Hurto Externo',
  'Hurto Interno',
  'Robo',
  'Cómplice Interno y Externo'
];

const SHIFTS_LIST: TheftShift[] = [
  'Mañana',
  'Mixto',
  'Tarde'
];

export const TheftControl: React.FC<TheftControlProps> = ({
  pharmacies = [],
  theftRecords = [],
  onAddRecord,
  onUpdateRecord,
  onDeleteRecord,
  currentUser,
  hasAdminPrivileges
}) => {
  const [view, setView] = useState<'list' | 'form' | 'detail'>('list');
  const [selectedRecord, setSelectedRecord] = useState<TheftRecord | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPharmacy, setFilterPharmacy] = useState<string>('ALL');
  const [filterReporter, setFilterReporter] = useState<string>('ALL');
  const [filterType, setFilterType] = useState<string>('ALL');

  // Fechas por defecto
  const now = new Date();
  const defaultDate = now.toLocaleDateString('sv-SE');
  const defaultTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  // Estado del formulario
  const [formData, setFormData] = useState<Omit<TheftRecord, 'id' | 'createdAt'> & { id?: string }>({
    incidentNumber: '',
    pharmacyId: '',
    pharmacyName: '',
    date: defaultDate,
    time: defaultTime,
    shift: 'Mañana',
    reportedBySource: 'Personal de farmacia',
    theftType: 'Hurto Externo',
    zoneInPharmacy: 'Perfumería',
    modusOperandi: '',
    hasSecurityOfficerAtIncident: false,
    suspectCount: 1,
    suspectDetails: '',
    products: [],
    totalLossUSD: 0,
    totalRecoveredUSD: 0,
    evidenceLinks: [],
    adjustmentDriveUrl: '',
    policeReportFiled: false,
    policeReportNumber: '',
    createdByRole: currentUser?.role || 'CECOM',
    createdByName: currentUser?.fullName || currentUser?.email || 'Usuario',
    notes: ''
  });

  // Estado para la fila de producto actual a agregar
  const [tempProduct, setTempProduct] = useState<{
    code: string;
    description: string;
    quantity: number;
    unitPriceUSD: number;
    recovered: boolean;
  }>({
    code: '',
    description: '',
    quantity: 1,
    unitPriceUSD: 0,
    recovered: false
  });

  // Estado para el link de evidencia a agregar
  const [tempEvidenceLink, setTempEvidenceLink] = useState<{ name: string; url: string }>({
    name: '',
    url: ''
  });

  // Modal para confirmar eliminación
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Estados para importador de ajuste (Excel / Portapapeles)
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [showExcelPreviewModal, setShowExcelPreviewModal] = useState(false);
  const [excelRows, setExcelRows] = useState<any[]>([]);
  const [excelHeaders, setExcelHeaders] = useState<string[]>([]);
  const [colMapping, setColMapping] = useState<{
    codeCol: string;
    descCol: string;
    qtyCol: string;
    priceCol: string;
    totalCol: string;
  }>({
    codeCol: '',
    descCol: '',
    qtyCol: '',
    priceCol: '',
    totalCol: ''
  });

  const [filterOfficer, setFilterOfficer] = useState<string>('ALL'); // ALL, WITH_OFFICER, WITHOUT_OFFICER
  const [activeTabMetric, setActiveTabMetric] = useState<'overview' | 'areas' | 'officers'>('overview');

  // ==========================================
  // CÁLCULOS Y KPIs ENRIQUECIDOS
  // ==========================================
  const stats = useMemo(() => {
    let totalLoss = 0;
    let totalRecovered = 0;
    let recoveredCount = 0;
    let withOfficerLoss = 0;
    let withoutOfficerLoss = 0;
    let withOfficerCount = 0;
    let withoutOfficerCount = 0;

    const incidentsByPharm: Record<string, { count: number; loss: number }> = {};
    const incidentsByArea: Record<string, { count: number; loss: number }> = {};
    const incidentsByType: Record<string, { count: number; loss: number }> = {};

    theftRecords.forEach(r => {
      const loss = Number(r.totalLossUSD || 0);
      const rec = Number(r.totalRecoveredUSD || 0);
      totalLoss += loss;
      totalRecovered += rec;
      if (rec > 0) {
        recoveredCount += 1;
      }

      // Desglose oficial de seguridad
      if (r.hasSecurityOfficerAtIncident) {
        withOfficerLoss += loss;
        withOfficerCount += 1;
      } else {
        withoutOfficerLoss += loss;
        withoutOfficerCount += 1;
      }

      // Por farmacia
      if (r.pharmacyName) {
        if (!incidentsByPharm[r.pharmacyName]) {
          incidentsByPharm[r.pharmacyName] = { count: 0, loss: 0 };
        }
        incidentsByPharm[r.pharmacyName].count += 1;
        incidentsByPharm[r.pharmacyName].loss += loss;
      }

      // Por área
      const area = r.zoneInPharmacy || 'Otra';
      if (!incidentsByArea[area]) {
        incidentsByArea[area] = { count: 0, loss: 0 };
      }
      incidentsByArea[area].count += 1;
      incidentsByArea[area].loss += loss;

      // Por tipo
      const type = r.theftType || 'Hurto Externo';
      if (!incidentsByType[type]) {
        incidentsByType[type] = { count: 0, loss: 0 };
      }
      incidentsByType[type].count += 1;
      incidentsByType[type].loss += loss;
    });

    let topPharm = 'N/A';
    let maxIncidents = 0;
    Object.entries(incidentsByPharm).forEach(([name, data]) => {
      if (data.count > maxIncidents) {
        maxIncidents = data.count;
        topPharm = name;
      }
    });

    // Top áreas críticas ordenadas por pérdida
    const topAreas = Object.entries(incidentsByArea)
      .map(([name, d]) => ({ name, ...d }))
      .sort((a, b) => b.loss - a.loss)
      .slice(0, 5);

    return {
      totalLoss,
      totalRecovered,
      recoveredCount,
      totalIncidents: theftRecords.length,
      topPharm,
      topPharmCount: maxIncidents,
      withOfficerLoss,
      withoutOfficerLoss,
      withOfficerCount,
      withoutOfficerCount,
      topAreas,
      incidentsByType
    };
  }, [theftRecords]);

  // ==========================================
  // FILTRADO DE REGISTROS
  // ==========================================
  const filteredRecords = useMemo(() => {
    return theftRecords.filter(r => {
      const matchSearch = 
        (r.incidentNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.pharmacyName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.modusOperandi || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.suspectDetails || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.products || []).some(p => p.description.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchPharm = filterPharmacy === 'ALL' || r.pharmacyId === filterPharmacy;
      const matchReporter = filterReporter === 'ALL' || r.reportedBySource === filterReporter;
      const matchType = filterType === 'ALL' || r.theftType === filterType;
      
      const matchOfficer = 
        filterOfficer === 'ALL' || 
        (filterOfficer === 'WITH_OFFICER' && r.hasSecurityOfficerAtIncident) ||
        (filterOfficer === 'WITHOUT_OFFICER' && !r.hasSecurityOfficerAtIncident);

      return matchSearch && matchPharm && matchReporter && matchType && matchOfficer;
    });
  }, [theftRecords, searchTerm, filterPharmacy, filterReporter, filterType, filterOfficer]);

  // ==========================================
  // MANEJADORES DE PRODUCTOS
  // ==========================================
  const handleAddProduct = () => {
    if (!tempProduct.description.trim()) return;
    const qty = Number(tempProduct.quantity) || 1;
    const price = Number(tempProduct.unitPriceUSD) || 0;
    const total = qty * price;

    const newProd: TheftProductItem = {
      id: Math.random().toString(36).substring(2, 9),
      code: tempProduct.code.trim(),
      description: tempProduct.description.trim(),
      quantity: qty,
      unitPriceUSD: price,
      totalUSD: total,
      recovered: tempProduct.recovered
    };

    const updatedProds = [...formData.products, newProd];
    recalculateTotals(updatedProds);

    setTempProduct({
      code: '',
      description: '',
      quantity: 1,
      unitPriceUSD: 0,
      recovered: false
    });
  };

  const handleRemoveProduct = (prodId: string) => {
    const updated = formData.products.filter(p => p.id !== prodId);
    recalculateTotals(updated);
  };

  const handleToggleProductRecovered = (prodId: string) => {
    const updated = formData.products.map(p => {
      if (p.id === prodId) {
        return { ...p, recovered: !p.recovered };
      }
      return p;
    });
    recalculateTotals(updated);
  };

  const recalculateTotals = (productList: TheftProductItem[]) => {
    let loss = 0;
    let rec = 0;
    productList.forEach(p => {
      if (p.recovered) {
        rec += p.totalUSD;
      } else {
        loss += p.totalUSD;
      }
    });
    setFormData(prev => ({
      ...prev,
      products: productList,
      totalLossUSD: loss,
      totalRecoveredUSD: rec
    }));
  };

  // ==========================================
  // IMPORTADOR DE EXCEL (XLSX / CSV)
  // ==========================================
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

        if (data.length === 0) {
          alert('El archivo no contiene filas con datos');
          return;
        }

        const headers = Object.keys(data[0] || {});
        setExcelHeaders(headers);
        setExcelRows(data);

        // Auto-detección inteligente de nombres de columnas
        const findCol = (keywords: string[]) => {
          return headers.find(h => keywords.some(k => h.toLowerCase().includes(k.toLowerCase()))) || '';
        };

        setColMapping({
          codeCol: findCol(['codigo', 'código', 'sku', 'barra', 'artículo', 'articulo', 'cod']),
          descCol: findCol(['descripcion', 'descripción', 'producto', 'nombre', 'detalle', 'item']),
          qtyCol: findCol(['cantidad', 'cant', 'unidades', 'und', 'qty']),
          priceCol: findCol(['precio', 'costo', 'unit', 'usd', 'valor']),
          totalCol: findCol(['total', 'monto', 'subtotal', 'importe'])
        });

        setShowExcelPreviewModal(true);
      } catch (err) {
        console.error(err);
        alert('Error al leer el archivo Excel. Asegúrese de que sea formato .xlsx, .xls o .csv');
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  const handleConfirmExcelImport = () => {
    if (!colMapping.descCol) {
      alert('Debe seleccionar al menos la columna correspondiente a la Descripción del producto');
      return;
    }

    const importedProducts: TheftProductItem[] = [];

    excelRows.forEach(row => {
      const desc = String(row[colMapping.descCol] || '').trim();
      if (!desc) return; // Saltear filas vacías o de totales

      const code = colMapping.codeCol ? String(row[colMapping.codeCol] || '').trim() : '';
      let qty = 1;
      if (colMapping.qtyCol && row[colMapping.qtyCol] !== undefined) {
        const rawQty = Math.abs(parseFloat(String(row[colMapping.qtyCol]).replace(/,/g, '.'))) || 1;
        qty = Math.max(1, Math.round(rawQty));
      }

      let unitPrice = 0;
      if (colMapping.priceCol && row[colMapping.priceCol] !== undefined) {
        unitPrice = Math.abs(parseFloat(String(row[colMapping.priceCol]).replace(/[^0-9.-]+/g, ''))) || 0;
      } else if (colMapping.totalCol && row[colMapping.totalCol] !== undefined) {
        const total = Math.abs(parseFloat(String(row[colMapping.totalCol]).replace(/[^0-9.-]+/g, ''))) || 0;
        unitPrice = qty > 0 ? total / qty : total;
      }

      const totalUSD = qty * unitPrice;

      importedProducts.push({
        id: Math.random().toString(36).substring(2, 9),
        code,
        description: desc,
        quantity: qty,
        unitPriceUSD: unitPrice,
        totalUSD: totalUSD,
        recovered: false
      });
    });

    if (importedProducts.length === 0) {
      alert('No se pudieron extraer productos con la configuración seleccionada');
      return;
    }

    const updated = [...formData.products, ...importedProducts];
    recalculateTotals(updated);
    setShowExcelPreviewModal(false);
    alert(`Se importaron ${importedProducts.length} productos con éxito.`);
  };

  // ==========================================
  // IMPORTADOR POR PORTAPAPELES (COPIAR/PEGAR DE EXCEL O SHEETS)
  // ==========================================
  const handleConfirmPasteImport = () => {
    if (!pasteText.trim()) return;

    const lines = pasteText.trim().split(/\r?\n/);
    const importedProducts: TheftProductItem[] = [];

    lines.forEach(line => {
      if (!line.trim()) return;
      // Dividir por tabuladores (común al copiar de Excel) o punto y coma
      const parts = line.includes('\t') ? line.split('\t') : line.split(';');
      if (parts.length === 0) return;

      let code = '';
      let desc = '';
      let qty = 1;
      let price = 0;

      if (parts.length === 1) {
        desc = parts[0].trim();
      } else if (parts.length === 2) {
        // [Desc, Cant] o [Desc, Precio]
        desc = parts[0].trim();
        const num = parseFloat(parts[1].replace(/,/g, '.').trim()) || 0;
        qty = Math.max(1, Math.round(num));
      } else if (parts.length === 3) {
        // [Codigo, Desc, Cant]
        code = parts[0].trim();
        desc = parts[1].trim();
        qty = Math.max(1, Math.round(parseFloat(parts[2].replace(/,/g, '.').trim()) || 1));
      } else {
        // 4 o más columnas: [Codigo, Desc, Cant, PrecioUSD, ...]
        code = parts[0].trim();
        desc = parts[1].trim();
        qty = Math.max(1, Math.round(parseFloat(parts[2].replace(/,/g, '.').trim()) || 1));
        price = Math.abs(parseFloat(parts[3].replace(/[^0-9.-]+/g, '').trim()) || 0);
      }

      if (desc) {
        importedProducts.push({
          id: Math.random().toString(36).substring(2, 9),
          code,
          description: desc,
          quantity: qty,
          unitPriceUSD: price,
          totalUSD: qty * price,
          recovered: false
        });
      }
    });

    if (importedProducts.length === 0) {
      alert('No se detectaron datos válidos');
      return;
    }

    const updated = [...formData.products, ...importedProducts];
    recalculateTotals(updated);
    setPasteText('');
    setShowPasteModal(false);
    alert(`Se cargaron ${importedProducts.length} productos desde el portapapeles.`);
  };

  // ==========================================
  // MANEJADORES DE ENLACES DE EVIDENCIA (LINK POR LINK)
  // ==========================================
  const handleAddEvidenceLink = () => {
    if (!tempEvidenceLink.url.trim()) return;
    const newLink: TheftEvidenceLink = {
      id: Math.random().toString(36).substring(2, 9),
      name: tempEvidenceLink.name.trim() || `Evidencia ${(formData.evidenceLinks || []).length + 1}`,
      url: tempEvidenceLink.url.trim()
    };

    setFormData(prev => ({
      ...prev,
      evidenceLinks: [...(prev.evidenceLinks || []), newLink]
    }));

    setTempEvidenceLink({ name: '', url: '' });
  };

  const handleRemoveEvidenceLink = (linkId: string) => {
    setFormData(prev => ({
      ...prev,
      evidenceLinks: (prev.evidenceLinks || []).filter(l => l.id !== linkId)
    }));
  };

  // ==========================================
  // INICIAR FORMULARIO
  // ==========================================
  const handleOpenNew = () => {
    const generatedNum = `HUR-${new Date().getFullYear()}-${String(theftRecords.length + 1).padStart(3, '0')}`;
    setFormData({
      incidentNumber: generatedNum,
      pharmacyId: pharmacies[0]?.id || '',
      pharmacyName: pharmacies[0]?.name || '',
      date: defaultDate,
      time: defaultTime,
      shift: 'Mañana',
      reportedBySource: 'Personal de farmacia',
      theftType: 'Hurto Externo',
      zoneInPharmacy: 'Perfumería',
      modusOperandi: '',
      hasSecurityOfficerAtIncident: Boolean(pharmacies[0]?.hasSecurityOfficer),
      suspectCount: 1,
      suspectDetails: '',
      products: [],
      totalLossUSD: 0,
      totalRecoveredUSD: 0,
      evidenceLinks: [],
      adjustmentDriveUrl: '',
      policeReportFiled: false,
      policeReportNumber: '',
      createdByRole: currentUser?.role || 'CECOM',
      createdByName: currentUser?.fullName || currentUser?.email || 'Usuario',
      notes: ''
    });
    setEditingId(null);
    setView('form');
  };

  const handleOpenEdit = (record: TheftRecord) => {
    // Normalizar enlaces si venía de versión previa con string único
    const initialLinks: TheftEvidenceLink[] = Array.isArray(record.evidenceLinks) 
      ? [...record.evidenceLinks] 
      : record.evidenceDriveUrl 
      ? [{ id: 'legacy-1', name: 'Carpeta de Evidencia', url: record.evidenceDriveUrl }] 
      : [];

    setFormData({
      ...record,
      shift: record.shift || 'Mañana',
      reportedBySource: record.reportedBySource || 'Personal de farmacia',
      theftType: record.theftType || 'Hurto Externo',
      hasSecurityOfficerAtIncident: Boolean(record.hasSecurityOfficerAtIncident),
      suspectCount: record.suspectCount || 1,
      evidenceLinks: initialLinks
    });
    setEditingId(record.id);
    setView('form');
  };

  const handleOpenDetail = (record: TheftRecord) => {
    setSelectedRecord(record);
    setView('detail');
  };

  // ==========================================
  // GUARDAR REGISTRO
  // ==========================================
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.pharmacyId) {
      alert('Por favor seleccione una farmacia');
      return;
    }

    const selectedPharm = pharmacies.find(p => p.id === formData.pharmacyId);
    const pName = selectedPharm ? selectedPharm.name : formData.pharmacyName;

    if (editingId) {
      const updated: TheftRecord = {
        ...(formData as TheftRecord),
        id: editingId,
        pharmacyName: pName,
        updatedAt: new Date().toISOString()
      };
      onUpdateRecord(updated);
      setSelectedRecord(updated);
      setView('detail');
    } else {
      const newRecord: TheftRecord = {
        ...(formData as TheftRecord),
        id: Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
        pharmacyName: pName,
        createdAt: new Date().toISOString(),
        createdByRole: currentUser?.role || 'CECOM',
        createdByName: currentUser?.fullName || currentUser?.email || 'Usuario'
      };
      onAddRecord(newRecord);
      setSelectedRecord(newRecord);
      setView('detail');
    }
  };

  // ==========================================
  // RENDER: LISTADO
  // ==========================================
  if (view === 'list') {
    return (
      <div className="max-w-[1600px] mx-auto p-2 md:p-6 space-y-8 animate-in fade-in duration-500 pb-20">
        {/* Cabecera con título y acción alineada al diseño global */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-2">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-normal uppercase mb-2 flex items-center gap-3">
              <PackageX className="w-8 h-8 text-rose-500" />
              Control de Hurtos y Mermas
            </h1>
            <p className="text-slate-300 font-bold text-xs md:text-sm uppercase tracking-[0.18em]">
              Registro forense de pérdidas, modus operandi y enlaces a Google Drive
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleOpenNew}
              className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-xl flex items-center gap-2 border border-white/10 active:scale-95"
            >
              <Plus className="w-5 h-5 text-rose-500" />
              <span>Nuevo Reporte de Hurto</span>
            </button>
          </div>
        </div>

        {/* DASHBOARD EJECUTIVO INTERACTIVO */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tarjeta Principal de Pérdidas y Recuperación con Degradado Premium */}
          <div className="lg:col-span-2 bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] rounded-[2rem] p-8 shadow-2xl relative overflow-hidden group border border-slate-700/50">
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-rose-600/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3"></div>
            <div className="absolute bottom-0 left-0 w-[350px] h-[350px] bg-blue-600/15 rounded-full blur-[90px] translate-y-1/2 -translate-x-1/3"></div>

            <div className="relative z-10 flex flex-col h-full justify-between space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-slate-400 font-bold uppercase tracking-[0.24em] text-xs block mb-1">
                    Balance Forense Financiero
                  </span>
                  <h2 className="text-white text-3xl sm:text-4xl font-black uppercase tracking-tight">
                    Impacto en Farmacias
                  </h2>
                </div>

                {/* Selector interactivo de métricas */}
                <div className="flex bg-slate-800/80 p-1 rounded-xl border border-white/10 text-xs font-bold">
                  <button
                    onClick={() => setActiveTabMetric('overview')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      activeTabMetric === 'overview'
                        ? 'bg-rose-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    General
                  </button>
                  <button
                    onClick={() => setActiveTabMetric('areas')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      activeTabMetric === 'areas'
                        ? 'bg-rose-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Por Áreas
                  </button>
                  <button
                    onClick={() => setActiveTabMetric('officers')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      activeTabMetric === 'officers'
                        ? 'bg-rose-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Oficiales
                  </button>
                </div>
              </div>

              {/* Contenido dinámico según la pestaña activa */}
              {activeTabMetric === 'overview' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                  <div className="bg-slate-900/70 p-5 rounded-2xl border border-rose-500/20 backdrop-blur-md flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-black text-rose-300 uppercase tracking-wider block">
                          PÉRDIDA TOTAL NETA
                        </span>
                        <span className="px-2.5 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-lg text-xs font-black">
                          {stats.totalIncidents} {stats.totalIncidents === 1 ? 'Incidente' : 'Incidentes'}
                        </span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-black text-rose-500">
                          ${stats.totalLoss.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-rose-500/20 flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-semibold">Total de hechos registrados:</span>
                      <span className="font-mono font-black text-rose-400 text-sm bg-rose-950/80 px-2.5 py-0.5 rounded border border-rose-500/30">
                        {stats.totalIncidents}
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-900/70 p-5 rounded-2xl border border-emerald-500/20 backdrop-blur-md flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-black text-emerald-300 uppercase tracking-wider block">
                          MONTO RECUPERADO
                        </span>
                        <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-black">
                          {stats.recoveredCount} {stats.recoveredCount === 1 ? 'Rescate' : 'Rescates'}
                        </span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-black text-emerald-400">
                          ${stats.totalRecovered.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-emerald-500/20 flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-semibold">Interceptados en tienda:</span>
                      <span className="font-mono font-black text-emerald-400 text-sm bg-emerald-950/80 px-2.5 py-0.5 rounded border border-emerald-500/30">
                        {stats.recoveredCount}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {activeTabMetric === 'areas' && (
                <div className="space-y-3 pt-2">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                    Top Áreas con Mayor Fuga de Mercancía:
                  </span>
                  {stats.topAreas.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {stats.topAreas.map((area, idx) => {
                        const percent = stats.totalLoss > 0 ? Math.round((area.loss / stats.totalLoss) * 100) : 0;
                        return (
                          <div key={idx} className="bg-slate-900/60 p-3.5 rounded-xl border border-white/5">
                            <div className="flex justify-between items-center text-xs mb-1">
                              <span className="font-bold text-white truncate mr-2">{area.name}</span>
                              <span className="font-mono text-rose-400 font-bold">${area.loss.toFixed(2)}</span>
                            </div>
                            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                              <div
                                className="bg-gradient-to-r from-rose-500 to-amber-500 h-full rounded-full"
                                style={{ width: `${Math.min(100, Math.max(5, percent))}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-slate-400 mt-1 block">
                              {area.count} caso(s) • {percent}% de las pérdidas totales
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No hay suficientes registros para desglosar áreas.</p>
                  )}
                </div>
              )}

              {activeTabMetric === 'officers' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="bg-emerald-950/40 p-5 rounded-2xl border border-emerald-500/30 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Shield className="w-5 h-5 text-emerald-400" />
                          <span className="text-xs font-black text-emerald-300 uppercase tracking-wide">
                            Farmacias CON Oficial
                          </span>
                        </div>
                        <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-black">
                          {stats.withOfficerCount} {stats.withOfficerCount === 1 ? 'Hecho' : 'Hechos'}
                        </span>
                      </div>
                      <span className="text-3xl font-black text-white block">
                        ${stats.withOfficerLoss.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="mt-3 pt-3 border-t border-emerald-500/20 flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-semibold">Total de eventos bajo custodia:</span>
                      <span className="font-mono font-black text-emerald-400 text-sm bg-emerald-900/60 px-2 py-0.5 rounded">
                        {stats.withOfficerCount}
                      </span>
                    </div>
                  </div>

                  <div className="bg-amber-950/40 p-5 rounded-2xl border border-amber-500/30 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <ShieldX className="w-5 h-5 text-amber-400" />
                          <span className="text-xs font-black text-amber-300 uppercase tracking-wide">
                            Farmacias SIN Oficial
                          </span>
                        </div>
                        <span className="px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-black">
                          {stats.withoutOfficerCount} {stats.withoutOfficerCount === 1 ? 'Hecho' : 'Hechos'}
                        </span>
                      </div>
                      <span className="text-3xl font-black text-white block">
                        ${stats.withoutOfficerLoss.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="mt-3 pt-3 border-t border-amber-500/20 flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-semibold">Total de eventos sin custodia:</span>
                      <span className="font-mono font-black text-amber-400 text-sm bg-amber-900/60 px-2 py-0.5 rounded">
                        {stats.withoutOfficerCount}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Columna Derecha: Tarjetas de Información Práctica */}
          <div className="space-y-4 flex flex-col justify-between">
            {/* Tarjeta Farmacia Crítica */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black text-rose-600 uppercase tracking-wider block mb-1">
                  SEDE DE MAYOR ATENCIÓN
                </span>
                <h3 className="text-lg font-black text-slate-800 truncate max-w-[200px]" title={stats.topPharm}>
                  {stats.topPharm}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {stats.topPharmCount > 0 ? `${stats.topPharmCount} casos registrados` : 'Sin novedades'}
                </p>
              </div>
              <div className="p-3.5 bg-rose-50 text-rose-600 rounded-2xl">
                <Building2 className="w-7 h-7" />
              </div>
            </div>

            {/* Tarjeta de Tasa de Recuperación */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                    EFECTIVIDAD DE RECUPERACIÓN
                  </span>
                  <span className="text-2xl font-black text-slate-800">
                    {stats.totalLoss + stats.totalRecovered > 0
                      ? `${Math.round((stats.totalRecovered / (stats.totalLoss + stats.totalRecovered)) * 100)}%`
                      : '0%'}
                  </span>
                </div>
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                  <ShieldCheck className="w-6 h-6" />
                </div>
              </div>
              <p className="text-[11px] text-slate-500">
                Porcentaje del valor de mercancía rescatada en el acto.
              </p>
            </div>

            {/* Accesos rápidos de filtro directo */}
            <div className="bg-slate-900 text-white rounded-2xl p-4 border border-white/10 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  FILTRO RÁPIDO SEGURIDAD
                </span>
                <span className="text-xs font-bold text-white">
                  {filterOfficer === 'ALL' ? 'Mostrando Todos' : filterOfficer === 'WITH_OFFICER' ? 'Solo Con Oficial' : 'Solo Sin Oficial'}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setFilterOfficer(prev => prev === 'WITH_OFFICER' ? 'ALL' : 'WITH_OFFICER')}
                  className={`p-2 rounded-xl text-xs font-bold transition-colors ${
                    filterOfficer === 'WITH_OFFICER' ? 'bg-emerald-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                  title="Filtrar con oficial"
                >
                  <Shield className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setFilterOfficer(prev => prev === 'WITHOUT_OFFICER' ? 'ALL' : 'WITHOUT_OFFICER')}
                  className={`p-2 rounded-xl text-xs font-bold transition-colors ${
                    filterOfficer === 'WITHOUT_OFFICER' ? 'bg-amber-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                  title="Filtrar sin oficial"
                >
                  <ShieldX className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Barra de Filtros */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
            <div className="relative sm:col-span-2 md:col-span-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar caso, farmacia, producto..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs font-medium rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
            </div>

            <div>
              <select
                value={filterPharmacy}
                onChange={e => setFilterPharmacy(e.target.value)}
                className="w-full py-2 px-3 text-xs font-medium rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 bg-white"
              >
                <option value="ALL">Todas las Farmacias</option>
                {pharmacies.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
                className="w-full py-2 px-3 text-xs font-medium rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 bg-white"
              >
                <option value="ALL">Tipos de Hurto / Robo</option>
                {THEFT_TYPES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={filterReporter}
                onChange={e => setFilterReporter(e.target.value)}
                className="w-full py-2 px-3 text-xs font-medium rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 bg-white"
              >
                <option value="ALL">Reportado por: (Todos)</option>
                {REPORTERS_LIST.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={filterOfficer}
                onChange={e => setFilterOfficer(e.target.value)}
                className="w-full py-2 px-3 text-xs font-medium rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 bg-white"
              >
                <option value="ALL">Oficial de Seguridad (Todos)</option>
                <option value="WITH_OFFICER">Con Oficial de Seguridad</option>
                <option value="WITHOUT_OFFICER">Sin Oficial de Seguridad</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tabla de Registros */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          {filteredRecords.length === 0 ? (
            <div className="py-16 text-center">
              <PackageX className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-700">No se encontraron reportes de hurtos</h3>
              <p className="text-xs text-slate-400 mt-1">
                {searchTerm || filterPharmacy !== 'ALL' || filterReporter !== 'ALL' || filterType !== 'ALL' || filterOfficer !== 'ALL'
                  ? 'Intente cambiando los filtros de búsqueda'
                  : 'Presione "Nuevo Reporte de Hurto" para ingresar el primer incidente'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-black text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Caso / Fecha</th>
                    <th className="py-3 px-4">Farmacia / Turno</th>
                    <th className="py-3 px-4">Seguridad</th>
                    <th className="py-3 px-4">Tipo & Reportado por</th>
                    <th className="py-3 px-4">Sospechosos</th>
                    <th className="py-3 px-4">Pérdida (USD)</th>
                    <th className="py-3 px-4">Evidencias Drive</th>
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredRecords.map(record => {
                    const linksCount = (record.evidenceLinks || []).length || (record.evidenceDriveUrl ? 1 : 0);

                    return (
                      <tr key={record.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-slate-900">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-rose-600 font-bold">{record.incidentNumber}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 font-normal flex items-center gap-1.5 mt-0.5">
                            <Calendar className="w-3 h-3" />
                            {record.date} {record.time && `• ${record.time}`}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-medium text-slate-800">
                          <div className="flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                            <span className="font-bold">{record.pharmacyName}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            Turno: <strong>{record.shift || 'Mañana'}</strong> • Área: {record.zoneInPharmacy}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          {record.hasSecurityOfficerAtIncident ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <Shield className="w-3 h-3 text-emerald-600" />
                              Con Oficial
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold text-[10px] bg-amber-50 text-amber-700 border border-amber-200">
                              <ShieldX className="w-3 h-3 text-amber-600" />
                              Sin Oficial
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <span className={`inline-block px-2 py-0.5 rounded-md font-bold text-[10px] ${
                            record.theftType === 'Robo'
                              ? 'bg-red-100 text-red-800'
                              : record.theftType === 'Hurto Interno'
                              ? 'bg-rose-100 text-rose-800'
                              : record.theftType === 'Cómplice Interno y Externo'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-orange-100 text-orange-800'
                          }`}>
                            {record.theftType || 'Hurto Externo'}
                          </span>
                          <div className="text-[11px] text-slate-500 font-medium mt-1 flex items-center gap-1">
                            <UserCheck className="w-3 h-3 text-slate-400" />
                            {record.reportedBySource || 'Personal de farmacia'}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 font-bold text-slate-800">
                            <Users className="w-3.5 h-3.5 text-slate-400" />
                            <span>{record.suspectCount || 1} implicado(s)</span>
                          </div>
                          {record.suspectDetails && (
                            <p className="text-[11px] text-slate-500 truncate max-w-[150px]" title={record.suspectDetails}>
                              {record.suspectDetails}
                            </p>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-bold text-rose-600">
                            ${Number(record.totalLossUSD || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                          {Number(record.totalRecoveredUSD || 0) > 0 && (
                            <div className="text-[11px] text-emerald-600 font-medium">
                              +${Number(record.totalRecoveredUSD).toLocaleString('en-US', { minimumFractionDigits: 2 })} rec.
                            </div>
                          )}
                          <div className="text-[10px] text-slate-400">
                            {(record.products || []).length} ítems
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex flex-col gap-1">
                            {linksCount > 0 ? (
                              <div className="flex items-center gap-1 text-[11px] font-bold text-blue-600">
                                <Link className="w-3.5 h-3.5 text-blue-500" />
                                <span>{linksCount} link(s) de evidencia</span>
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-400 italic">Sin evidencias</span>
                            )}

                            {record.adjustmentDriveUrl && (
                              <a
                                href={record.adjustmentDriveUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:text-emerald-800 hover:underline"
                              >
                                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
                                Soporte Ajuste
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenDetail(record)}
                              title="Ver expediente completo"
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleOpenEdit(record)}
                              title="Editar registro"
                              className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>

                            {hasAdminPrivileges && (
                              <button
                                onClick={() => setDeleteConfirmId(record.id)}
                                title="Eliminar registro"
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal de confirmación para eliminar */}
        {deleteConfirmId && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95">
              <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mb-4 mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 text-center">¿Eliminar reporte de hurto?</h3>
              <p className="text-xs text-slate-500 text-center mt-2">
                Esta acción borrará el registro del expediente. Los archivos en Google Drive no serán afectados.
              </p>
              <div className="flex items-center justify-center gap-3 mt-6">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    onDeleteRecord(deleteConfirmId);
                    setDeleteConfirmId(null);
                  }}
                  className="px-4 py-2 text-xs font-bold bg-rose-600 text-white rounded-xl shadow-lg shadow-rose-600/20 hover:bg-rose-700"
                >
                  Sí, eliminar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // RENDER: FORMULARIO (NUEVO O EDICIÓN)
  // ==========================================
  if (view === 'form') {
    return (
      <div className="space-y-6 max-w-5xl mx-auto pb-20 animate-in fade-in duration-300">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setView('list')}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight">
                {editingId ? `Editar Reporte: ${formData.incidentNumber}` : 'Nuevo Reporte de Hurto / Merma'}
              </h2>
              <p className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Ingresado por {formData.createdByName} • Rol: {formData.createdByRole}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setView('list')}
              className="px-4 py-2 text-xs font-bold text-slate-300 hover:bg-white/10 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-bold px-5 py-2 text-xs rounded-xl shadow-lg shadow-rose-600/20 transition-all"
            >
              <Save className="w-4 h-4" />
              Guardar Reporte
            </button>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* SECCIÓN 1: DATOS BÁSICOS DEL INCIDENTE */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-4 h-4 text-rose-500" />
              1. Localización, Turno y Notificación
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Farmacia Afectada *
                </label>
                <select
                  value={formData.pharmacyId}
                  onChange={e => {
                    const p = pharmacies.find(x => x.id === e.target.value);
                    setFormData(prev => ({
                      ...prev,
                      pharmacyId: e.target.value,
                      pharmacyName: p ? p.name : '',
                      hasSecurityOfficerAtIncident: p ? Boolean(p.hasSecurityOfficer) : prev.hasSecurityOfficerAtIncident
                    }));
                  }}
                  required
                  className="w-full text-xs font-medium py-2.5 px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 bg-white"
                >
                  <option value="">Seleccione una farmacia...</option>
                  {pharmacies.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Número de Incidente / Código
                </label>
                <input
                  type="text"
                  value={formData.incidentNumber}
                  onChange={e => setFormData(prev => ({ ...prev, incidentNumber: e.target.value }))}
                  required
                  className="w-full text-xs font-mono font-bold py-2.5 px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>

              {/* CAMBIO: Reportado por: */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Reportado por: *
                </label>
                <select
                  value={formData.reportedBySource}
                  onChange={e => setFormData(prev => ({ ...prev, reportedBySource: e.target.value as TheftReporter }))}
                  className="w-full text-xs font-medium py-2.5 px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 bg-white"
                >
                  {REPORTERS_LIST.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Fecha del Hecho
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  required
                  className="w-full text-xs font-medium py-2.5 px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Hora Aproximada
                </label>
                <input
                  type="time"
                  value={formData.time}
                  onChange={e => setFormData(prev => ({ ...prev, time: e.target.value }))}
                  className="w-full text-xs font-medium py-2.5 px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>

              {/* CAMBIO: Turno: Mañana, Mixto, Tarde */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Turno
                </label>
                <select
                  value={formData.shift}
                  onChange={e => setFormData(prev => ({ ...prev, shift: e.target.value as TheftShift }))}
                  className="w-full text-xs font-medium py-2.5 px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 bg-white"
                >
                  {SHIFTS_LIST.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* OFICIAL DE SEGURIDAD EN FARMACIA */}
              <div className="md:col-span-3 pt-2 border-t border-slate-100 flex items-center justify-between bg-slate-50 p-3 rounded-xl">
                <div className="flex items-center gap-2">
                  {formData.hasSecurityOfficerAtIncident ? (
                    <Shield className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <ShieldX className="w-5 h-5 text-amber-500" />
                  )}
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">
                      ¿La farmacia contaba con Oficial de Seguridad presente durante el hecho?
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Permite analizar estadísticas de efectividad disuasiva y hurtos en sedes desprotegidas.
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, hasSecurityOfficerAtIncident: true }))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                      formData.hasSecurityOfficerAtIncident
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    SÍ (Con Oficial)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, hasSecurityOfficerAtIncident: false }))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                      !formData.hasSecurityOfficerAtIncident
                        ? 'bg-amber-600 text-white shadow-md'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    NO (Sin Oficial)
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: TIPIFICACIÓN, SOSPECHOSOS Y MODUS OPERANDI */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-500" />
              2. Tipificación y Sospechosos
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tipo de Hurto / Suceso
                </label>
                <select
                  value={formData.theftType}
                  onChange={e => setFormData(prev => ({ ...prev, theftType: e.target.value as TheftType }))}
                  className="w-full text-xs font-medium py-2.5 px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 bg-white"
                >
                  {THEFT_TYPES.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Área en Farmacia
                </label>
                <select
                  value={formData.zoneInPharmacy}
                  onChange={e => setFormData(prev => ({ ...prev, zoneInPharmacy: e.target.value }))}
                  className="w-full text-xs font-medium py-2.5 px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 bg-white"
                >
                  {ZONES_LIST.map(z => (
                    <option key={z} value={z}>{z}</option>
                  ))}
                </select>
              </div>

              {/* CAMBIO: Número de sospechosos implicados */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Número de Implicados / Sospechosos
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.suspectCount || 1}
                  onChange={e => setFormData(prev => ({ ...prev, suspectCount: Math.max(1, parseInt(e.target.value) || 1) }))}
                  className="w-full text-xs font-bold py-2.5 px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>

              <div className="md:col-span-3">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Descripción o Datos de los Sospechosos
                </label>
                <input
                  type="text"
                  placeholder="Vestimenta, características físicas, sexo, si fueron identificados, cómplices o reincidentes..."
                  value={formData.suspectDetails || ''}
                  onChange={e => setFormData(prev => ({ ...prev, suspectDetails: e.target.value }))}
                  className="w-full text-xs font-medium py-2.5 px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>

              <div className="md:col-span-3">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Descripción del Modus Operandi
                </label>
                <textarea
                  rows={2}
                  placeholder="Detalle cómo ocurrió el hecho: ocultamiento en morral/ropa, distracción, rotura de empaque, consumo dentro del local, etc..."
                  value={formData.modusOperandi}
                  onChange={e => setFormData(prev => ({ ...prev, modusOperandi: e.target.value }))}
                  className="w-full text-xs font-medium p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>
            </div>
          </div>

          {/* SECCIÓN 3: DETALLE DE PRODUCTOS Y VALORACIÓN EN USD */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-rose-500" />
                  3. Mercancía Afectada y Totales (en USD $)
                </h3>
                <p className="text-xs text-slate-500">
                  Agregue los ítems sustraídos con su precio en dólares. El sistema computa automáticamente las pérdidas.
                </p>
              </div>

              {/* Totales en vivo */}
              <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">PÉRDIDA NETA</span>
                  <span className="text-sm font-black text-rose-600">
                    ${formData.totalLossUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="w-px h-6 bg-slate-200" />
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">RECUPERADO</span>
                  <span className="text-sm font-black text-emerald-600">
                    ${formData.totalRecoveredUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* BOTONES DE IMPORTACIÓN INTELIGENTE (EXCEL / PORTAPAPELES) */}
            <div className="flex flex-wrap items-center gap-2.5 p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl">
              <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5 mr-auto">
                <FileCheck className="w-4 h-4 text-emerald-600" />
                ¿Tiene la lista del ajuste de inventario?
              </span>

              {/* Botón Importar Excel */}
              <label className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg cursor-pointer transition-colors shadow-sm active:scale-95">
                <Upload className="w-3.5 h-3.5" />
                <span>Cargar Excel del Ajuste</span>
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {/* Botón Pegar desde Excel/Sheets */}
              <button
                type="button"
                onClick={() => setShowPasteModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs rounded-lg transition-colors shadow-sm active:scale-95"
              >
                <ClipboardPaste className="w-3.5 h-3.5 text-emerald-600" />
                <span>Pegar desde Excel / Sheets</span>
              </button>
            </div>

            {/* Formulario rápido para agregar ítem manual */}
            <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200/80 space-y-3">
              <span className="text-xs font-bold text-slate-700 block">Agregar Producto Sustraído:</span>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    placeholder="Código / SKU"
                    value={tempProduct.code}
                    onChange={e => setTempProduct(prev => ({ ...prev, code: e.target.value }))}
                    className="w-full text-xs py-2 px-3 rounded-lg border border-slate-200 bg-white"
                  />
                </div>
                <div className="sm:col-span-4">
                  <input
                    type="text"
                    placeholder="Descripción del producto o medicamento *"
                    value={tempProduct.description}
                    onChange={e => setTempProduct(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full text-xs py-2 px-3 rounded-lg border border-slate-200 bg-white"
                  />
                </div>
                <div className="sm:col-span-2">
                  <input
                    type="number"
                    min="1"
                    placeholder="Cant."
                    value={tempProduct.quantity}
                    onChange={e => setTempProduct(prev => ({ ...prev, quantity: Math.max(1, parseInt(e.target.value) || 1) }))}
                    className="w-full text-xs py-2 px-3 rounded-lg border border-slate-200 bg-white"
                  />
                </div>
                <div className="sm:col-span-2">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Precio USD ($)"
                    value={tempProduct.unitPriceUSD || ''}
                    onChange={e => setTempProduct(prev => ({ ...prev, unitPriceUSD: parseFloat(e.target.value) || 0 }))}
                    className="w-full text-xs py-2 px-3 rounded-lg border border-slate-200 bg-white"
                  />
                </div>
                <div className="sm:col-span-2 flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleAddProduct}
                    className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-2 px-3 rounded-lg text-xs transition-colors shadow-sm"
                  >
                    + Agregar
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-600">
                  <input
                    type="checkbox"
                    checked={tempProduct.recovered}
                    onChange={e => setTempProduct(prev => ({ ...prev, recovered: e.target.checked }))}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>¿Este producto fue recuperado en el momento?</span>
                </label>
              </div>
            </div>

            {/* Tabla de productos agregados */}
            {formData.products.length > 0 ? (
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                      <th className="py-2.5 px-3">Código</th>
                      <th className="py-2.5 px-3">Descripción</th>
                      <th className="py-2.5 px-3 text-center">Cant.</th>
                      <th className="py-2.5 px-3 text-right">P. Unit ($)</th>
                      <th className="py-2.5 px-3 text-right">Total ($)</th>
                      <th className="py-2.5 px-3 text-center">Estatus</th>
                      <th className="py-2.5 px-3 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {formData.products.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 font-mono text-slate-500">{p.code || 'S/C'}</td>
                        <td className="py-2.5 px-3 font-medium text-slate-800">{p.description}</td>
                        <td className="py-2.5 px-3 text-center font-bold">{p.quantity}</td>
                        <td className="py-2.5 px-3 text-right">${p.unitPriceUSD.toFixed(2)}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900">${p.totalUSD.toFixed(2)}</td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleProductRecovered(p.id)}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black cursor-pointer transition-colors ${
                              p.recovered
                                ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                : 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                            }`}
                          >
                            {p.recovered ? 'RECUPERADO' : 'PERDIDO'}
                          </button>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveProduct(p.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-400">
                No hay productos agregados manualmente. Si tiene la lista de ajuste en un archivo de Google Drive / Excel, puede enlazarlo abajo.
              </div>
            )}
          </div>

          {/* SECCIÓN 4: ENLACES GOOGLE DRIVE (LINK POR LINK + SOPORTE DE AJUSTE) */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                  4. Enlaces de Google Drive (Link por Link)
                </h3>
                <p className="text-xs text-slate-500">
                  Puede agregar varios links independientes (videos de cámaras, fotos de sospechosos, fotos de mercancía, etc.).
                </p>
              </div>
            </div>

            {/* Creador de link individual */}
            <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 space-y-3">
              <span className="text-xs font-bold text-blue-900 block">Agregar nuevo enlace de evidencia:</span>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                <div className="sm:col-span-4">
                  <input
                    type="text"
                    placeholder="Título (Ej: Video Pasillo, Foto Sospechoso)"
                    value={tempEvidenceLink.name}
                    onChange={e => setTempEvidenceLink(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full text-xs py-2 px-3 rounded-lg border border-slate-200 bg-white"
                  />
                </div>
                <div className="sm:col-span-6">
                  <input
                    type="url"
                    placeholder="Enlace de Google Drive (https://drive.google.com/...)"
                    value={tempEvidenceLink.url}
                    onChange={e => setTempEvidenceLink(prev => ({ ...prev, url: e.target.value }))}
                    className="w-full text-xs py-2 px-3 rounded-lg border border-slate-200 bg-white"
                  />
                </div>
                <div className="sm:col-span-2">
                  <button
                    type="button"
                    onClick={handleAddEvidenceLink}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded-lg text-xs transition-colors shadow-sm"
                  >
                    + Añadir Link
                  </button>
                </div>
              </div>
            </div>

            {/* Lista de enlaces agregados */}
            {(formData.evidenceLinks || []).length > 0 && (
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Enlaces agregados a este expediente ({formData.evidenceLinks.length}):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {formData.evidenceLinks.map(linkItem => (
                    <div 
                      key={linkItem.id} 
                      className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs"
                    >
                      <div className="flex items-center gap-2 truncate mr-2">
                        <Video className="w-4 h-4 text-blue-500 flex-shrink-0" />
                        <div className="truncate">
                          <span className="font-bold text-slate-800 block truncate">{linkItem.name}</span>
                          <span className="text-[10px] text-slate-400 block truncate">{linkItem.url}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <a
                          href={linkItem.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Abrir enlace"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        <button
                          type="button"
                          onClick={() => handleRemoveEvidenceLink(linkItem.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                          title="Quitar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Enlace al soporte de ajuste contable */}
            <div className="pt-3 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Enlace al Soporte de Ajuste / Merma (Excel, PDF o Google Sheets)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  value={formData.adjustmentDriveUrl || ''}
                  onChange={e => setFormData(prev => ({ ...prev, adjustmentDriveUrl: e.target.value }))}
                  className="w-full text-xs font-medium py-2.5 px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
                {formData.adjustmentDriveUrl && (
                  <a
                    href={formData.adjustmentDriveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-xl transition-colors flex-shrink-0"
                    title="Probar enlace"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
              <span className="text-[10px] text-slate-400 block mt-1">
                Planilla de ajuste de inventario firmada o reporte del ERP.
              </span>
            </div>
          </div>

          {/* SECCIÓN 5: ACCIONES LEGALES Y NOTAS */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-600" />
              5. Acciones Legales y Observaciones
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <input
                  type="checkbox"
                  id="policeCheck"
                  checked={formData.policeReportFiled}
                  onChange={e => setFormData(prev => ({ ...prev, policeReportFiled: e.target.checked }))}
                  className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
                />
                <label htmlFor="policeCheck" className="text-xs font-bold text-slate-700 cursor-pointer">
                  ¿Se notificó a las autoridades policiales / Cuadrante de Paz?
                </label>
              </div>

              {formData.policeReportFiled && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Número de Acta o Denuncia Policial
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: ACTA-CP-2026-445"
                    value={formData.policeReportNumber || ''}
                    onChange={e => setFormData(prev => ({ ...prev, policeReportNumber: e.target.value }))}
                    className="w-full text-xs font-medium py-2.5 px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  />
                </div>
              )}

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Notas u Observaciones del Coordinador / CECOM
                </label>
                <textarea
                  rows={2}
                  placeholder="Información adicional relevante para la gerencia de seguridad..."
                  value={formData.notes || ''}
                  onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full text-xs font-medium p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>
            </div>
          </div>

          {/* Botones de acción inferiores */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setView('list')}
              className="px-5 py-2.5 text-xs font-bold text-slate-300 hover:bg-white/10 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-bold px-6 py-2.5 text-xs rounded-xl shadow-lg shadow-rose-600/20 transition-all active:scale-95"
            >
              <Save className="w-4 h-4" />
              Guardar Reporte
            </button>
          </div>
        </form>

        {/* MODAL 1: MAPEADOR INTELIGENTE DE COLUMNAS DE EXCEL */}
        {showExcelPreviewModal && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase">
                      Asistente de Importación de Excel / Ajuste
                    </h3>
                    <p className="text-xs text-slate-500">
                      Detectadas {excelRows.length} filas en el archivo. Seleccione qué columna corresponde a cada dato y el sistema ignorará el resto:
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowExcelPreviewModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mapeo de columnas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Descripción del Producto * (Obligatorio)
                  </label>
                  <select
                    value={colMapping.descCol}
                    onChange={e => setColMapping(prev => ({ ...prev, descCol: e.target.value }))}
                    className="w-full py-2 px-3 rounded-lg border border-slate-200 bg-white font-medium"
                  >
                    <option value="">Seleccione columna...</option>
                    {excelHeaders.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Código / SKU / Código de Barra
                  </label>
                  <select
                    value={colMapping.codeCol}
                    onChange={e => setColMapping(prev => ({ ...prev, codeCol: e.target.value }))}
                    className="w-full py-2 px-3 rounded-lg border border-slate-200 bg-white font-medium"
                  >
                    <option value="">(Opcional / Ninguna)</option>
                    {excelHeaders.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Cantidad Sustraída
                  </label>
                  <select
                    value={colMapping.qtyCol}
                    onChange={e => setColMapping(prev => ({ ...prev, qtyCol: e.target.value }))}
                    className="w-full py-2 px-3 rounded-lg border border-slate-200 bg-white font-medium"
                  >
                    <option value="">(Por defecto: 1)</option>
                    {excelHeaders.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Precio Unitario ($) o Monto Total ($)
                  </label>
                  <select
                    value={colMapping.priceCol || colMapping.totalCol}
                    onChange={e => setColMapping(prev => ({ ...prev, priceCol: e.target.value, totalCol: '' }))}
                    className="w-full py-2 px-3 rounded-lg border border-slate-200 bg-white font-medium"
                  >
                    <option value="">(0.00 $)</option>
                    {excelHeaders.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Vista previa de las primeras 3 filas */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Vista Previa (Primeras filas del archivo):
                </span>
                <div className="max-h-40 overflow-auto border border-slate-200 rounded-xl text-[11px]">
                  <table className="w-full text-left bg-white">
                    <thead className="bg-slate-100 text-slate-600 font-bold sticky top-0">
                      <tr>
                        {excelHeaders.slice(0, 5).map(h => (
                          <th key={h} className="py-1.5 px-2.5 truncate max-w-[120px]">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {excelRows.slice(0, 3).map((r, i) => (
                        <tr key={i}>
                          {excelHeaders.slice(0, 5).map(h => (
                            <td key={h} className="py-1.5 px-2.5 text-slate-600 truncate max-w-[120px]">
                              {String(r[h] || '')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Acciones */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowExcelPreviewModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmExcelImport}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Importar a la Lista
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 2: PEGAR DIRECTO DESDE PORTAPAPELES (EXCEL / SHEETS) */}
        {showPasteModal && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                    <ClipboardPaste className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase">
                      Pegar Datos desde Excel o Google Sheets
                    </h3>
                    <p className="text-xs text-slate-500">
                      Copie las celdas en su hoja de cálculo y péguelas aquí directamente:
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPasteModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-1.5">
                <textarea
                  rows={8}
                  placeholder={`Ejemplo de formato admitido (separado por tabulación o punto y coma):\nCOD123   Acetaminofen 500mg   2   1.50\nCOD456   Shampoo Anticaspa    1   4.20`}
                  value={pasteText}
                  onChange={e => setPasteText(e.target.value)}
                  className="w-full text-xs font-mono p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50"
                />
                <span className="text-[11px] text-slate-400 block">
                  El sistema detecta automáticamente columnas de Código, Descripción, Cantidad y Precio en USD.
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasteModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmPasteImport}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/20 transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Procesar y Cargar a la Lista
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // RENDER: VISTA DETALLADA / EXPEDIENTE
  // ==========================================
  if (view === 'detail' && selectedRecord) {
    const detailLinks: TheftEvidenceLink[] = Array.isArray(selectedRecord.evidenceLinks)
      ? selectedRecord.evidenceLinks
      : selectedRecord.evidenceDriveUrl
      ? [{ id: 'leg-1', name: 'Carpeta de Evidencia', url: selectedRecord.evidenceDriveUrl }]
      : [];

    return (
      <div className="space-y-6 max-w-4xl mx-auto pb-20 animate-in fade-in duration-300">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setView('list')}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <span className="text-[10px] font-mono font-black text-rose-400 uppercase bg-slate-900/80 px-2 py-0.5 rounded border border-white/10">
                {selectedRecord.incidentNumber}
              </span>
              <h2 className="text-xl md:text-2xl font-black text-white mt-1 uppercase tracking-tight">
                Expediente: {selectedRecord.pharmacyName}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-colors border border-white/10"
            >
              <Printer className="w-3.5 h-3.5" />
              Imprimir
            </button>
            <button
              onClick={() => handleOpenEdit(selectedRecord)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Editar Expediente
            </button>
          </div>
        </div>

        {/* Tarjeta de Resumen General */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 pb-6 border-b border-slate-100">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">FECHA & TURNO</span>
              <span className="text-xs font-black text-slate-800">{selectedRecord.date} {selectedRecord.time}</span>
              <span className="text-[10px] text-slate-500 font-bold block">Turno: {selectedRecord.shift || 'Mañana'}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">TIPO & ÁREA</span>
              <span className="text-xs font-black text-slate-800">{selectedRecord.theftType || 'Hurto Externo'}</span>
              <span className="text-[10px] text-slate-500 font-bold block">{selectedRecord.zoneInPharmacy}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">SEGURIDAD</span>
              {selectedRecord.hasSecurityOfficerAtIncident ? (
                <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-md font-bold text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Shield className="w-3 h-3 text-emerald-600" />
                  Con Oficial
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-md font-bold text-[10px] bg-amber-50 text-amber-700 border border-amber-200">
                  <ShieldX className="w-3 h-3 text-amber-600" />
                  Sin Oficial
                </span>
              )}
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">REPORTADO POR:</span>
              <span className="text-xs font-black text-blue-700 block mt-0.5">
                {selectedRecord.reportedBySource || 'Personal de farmacia'}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">PÉRDIDA NETA</span>
              <span className="text-base font-black text-rose-600">
                ${Number(selectedRecord.totalLossUSD || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              {Number(selectedRecord.totalRecoveredUSD || 0) > 0 && (
                <span className="text-[10px] text-emerald-600 font-bold block">
                  +${Number(selectedRecord.totalRecoveredUSD).toLocaleString('en-US', { minimumFractionDigits: 2 })} rec.
                </span>
              )}
            </div>
          </div>

          {/* Sospechosos & Modus Operandi */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-100">
              <span className="text-xs font-black text-slate-700 uppercase tracking-wider block mb-1 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-slate-500" />
                Sospechosos Implicados ({selectedRecord.suspectCount || 1}):
              </span>
              <p className="text-xs text-slate-600 leading-relaxed">
                {selectedRecord.suspectDetails || 'No se registraron señas físicas detalladas de los sospechosos.'}
              </p>
            </div>

            <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-100">
              <span className="text-xs font-black text-slate-700 uppercase tracking-wider block mb-1">
                Modus Operandi:
              </span>
              <p className="text-xs text-slate-600 leading-relaxed">
                {selectedRecord.modusOperandi || 'Sin descripción de la modalidad registrada.'}
              </p>
            </div>
          </div>

          {/* Enlaces Google Drive Link por Link */}
          <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 space-y-3">
            <span className="text-xs font-black text-blue-900 uppercase tracking-wider block flex items-center gap-1.5">
              <FolderOpen className="w-4 h-4 text-blue-600" />
              Enlaces de Evidencia en Google Drive ({detailLinks.length})
            </span>

            {detailLinks.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {detailLinks.map((item, idx) => (
                  <a
                    key={item.id || idx}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 bg-white rounded-xl border border-blue-200/80 hover:border-blue-400 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center gap-2.5 truncate mr-2">
                      <Video className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      <div className="truncate">
                        <span className="text-xs font-bold text-slate-800 block truncate">{item.name}</span>
                        <span className="text-[10px] text-slate-400 truncate block">{item.url}</span>
                      </div>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No se adjuntaron enlaces de videos o fotos a este reporte.</p>
            )}

            {selectedRecord.adjustmentDriveUrl && (
              <div className="pt-2 border-t border-blue-100">
                <a
                  href={selectedRecord.adjustmentDriveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 bg-white rounded-xl border border-emerald-200/80 hover:border-emerald-400 hover:shadow-sm transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">Soporte de Ajuste de Merma (ERP / Contable)</span>
                      <span className="text-[10px] text-slate-400">Ver archivo en Google Drive</span>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-emerald-500" />
                </a>
              </div>
            )}
          </div>

          {/* Tabla de Productos Sustraídos */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
              Desglose de Productos Afectados:
            </h4>

            {(selectedRecord.products || []).length > 0 ? (
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                      <th className="py-2.5 px-3">Código</th>
                      <th className="py-2.5 px-3">Descripción</th>
                      <th className="py-2.5 px-3 text-center">Cant.</th>
                      <th className="py-2.5 px-3 text-right">P. Unit ($)</th>
                      <th className="py-2.5 px-3 text-right">Total ($)</th>
                      <th className="py-2.5 px-3 text-center">Estatus</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedRecord.products.map(p => (
                      <tr key={p.id}>
                        <td className="py-2.5 px-3 font-mono text-slate-500">{p.code || 'S/C'}</td>
                        <td className="py-2.5 px-3 font-medium text-slate-800">{p.description}</td>
                        <td className="py-2.5 px-3 text-center font-bold">{p.quantity}</td>
                        <td className="py-2.5 px-3 text-right">${p.unitPriceUSD.toFixed(2)}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900">${p.totalUSD.toFixed(2)}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                            p.recovered ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                          }`}>
                            {p.recovered ? 'RECUPERADO' : 'PERDIDO'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">
                No se registraron productos desglosados en el sistema (consulte el enlace del ajuste en Drive).
              </p>
            )}
          </div>

          {/* Información Policial y Auditoría */}
          <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-500 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              {selectedRecord.policeReportFiled ? (
                <span className="font-bold text-slate-700">
                  Denuncia policial interpuesta: {selectedRecord.policeReportNumber || 'Sí (Sin acta cargada)'}
                </span>
              ) : (
                <span>No se interpuso denuncia policial.</span>
              )}
            </div>
            <div>
              Registrado por: <strong>{selectedRecord.createdByName}</strong> ({selectedRecord.createdByRole})
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default TheftControl;
