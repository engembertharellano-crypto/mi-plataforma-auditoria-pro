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
  HelpCircle,
  FolderOpen
} from 'lucide-react';
import { Pharmacy, TheftRecord, TheftProductItem, TheftType, TheftStatus } from '../types';

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
  'Piso de Venta',
  'Perfumería y Cuidado Personal',
  'Medicamentos y Mostrador',
  'Área de Cajas',
  'Depósito / Almacén',
  'Pasillos Centrales',
  'Góndolas Promocionales',
  'Entrada / Salida',
  'Otra'
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
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterType, setFilterType] = useState<string>('ALL');

  // Estado del formulario
  const now = new Date();
  const defaultDate = now.toLocaleDateString('sv-SE');
  const defaultTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const [formData, setFormData] = useState<Omit<TheftRecord, 'id' | 'createdAt'> & { id?: string }>({
    incidentNumber: '',
    pharmacyId: '',
    pharmacyName: '',
    date: defaultDate,
    time: defaultTime,
    shift: 'Tarde',
    theftType: 'Externo',
    zoneInPharmacy: 'Piso de Venta',
    modusOperandi: '',
    products: [],
    totalLossUSD: 0,
    totalRecoveredUSD: 0,
    evidenceDriveUrl: '',
    adjustmentDriveUrl: '',
    cctvCameraReference: '',
    cctvTimestamp: '',
    suspectDetails: '',
    status: 'Reportado',
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

  // Modal para confirmar eliminación
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Rol del usuario actual
  const userRole = (currentUser?.role || '').toLowerCase();
  const canEditOrAdd = true; // Tanto CECOM como Coordinadores y Admin pueden agregar/editar

  // ==========================================
  // CÁLCULOS Y KPIs
  // ==========================================
  const stats = useMemo(() => {
    let totalLoss = 0;
    let totalRecovered = 0;
    const incidentsByPharm: Record<string, number> = {};

    theftRecords.forEach(r => {
      totalLoss += Number(r.totalLossUSD || 0);
      totalRecovered += Number(r.totalRecoveredUSD || 0);
      if (r.pharmacyName) {
        incidentsByPharm[r.pharmacyName] = (incidentsByPharm[r.pharmacyName] || 0) + 1;
      }
    });

    let topPharm = 'N/A';
    let maxIncidents = 0;
    Object.entries(incidentsByPharm).forEach(([name, count]) => {
      if (count > maxIncidents) {
        maxIncidents = count;
        topPharm = name;
      }
    });

    return {
      totalLoss,
      totalRecovered,
      totalIncidents: theftRecords.length,
      topPharm,
      topPharmCount: maxIncidents
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
      const matchStatus = filterStatus === 'ALL' || r.status === filterStatus;
      const matchType = filterType === 'ALL' || r.theftType === filterType;

      return matchSearch && matchPharm && matchStatus && matchType;
    });
  }, [theftRecords, searchTerm, filterPharmacy, filterStatus, filterType]);

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
      shift: 'Tarde',
      theftType: 'Externo',
      zoneInPharmacy: 'Piso de Venta',
      modusOperandi: '',
      products: [],
      totalLossUSD: 0,
      totalRecoveredUSD: 0,
      evidenceDriveUrl: '',
      adjustmentDriveUrl: '',
      cctvCameraReference: '',
      cctvTimestamp: '',
      suspectDetails: '',
      status: 'Reportado',
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
    setFormData({
      ...record
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
      // Editar existente
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
      // Crear nuevo
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

        {/* Tarjetas KPI de Resumen en USD */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Pérdida Total Neta
              </p>
              <h3 className="text-2xl font-black text-rose-600">
                ${stats.totalLoss.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
              <p className="text-[11px] font-semibold text-slate-500 mt-1">
                Total sustraído en USD
              </p>
            </div>
            <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
              <TrendingDown className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Monto Recuperado
              </p>
              <h3 className="text-2xl font-black text-emerald-600">
                ${stats.totalRecovered.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
              <p className="text-[11px] font-semibold text-slate-500 mt-1">
                Recuperado en el sitio
              </p>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Total Incidentes
              </p>
              <h3 className="text-2xl font-black text-slate-800">
                {stats.totalIncidents}
              </h3>
              <p className="text-[11px] font-semibold text-slate-500 mt-1">
                Casos registrados
              </p>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Layers className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Farmacia más Afectada
              </p>
              <h3 className="text-base font-black text-slate-800 truncate max-w-[170px]" title={stats.topPharm}>
                {stats.topPharm}
              </h3>
              <p className="text-[11px] font-semibold text-slate-500 mt-1">
                {stats.topPharmCount > 0 ? `${stats.topPharmCount} incidentes reportados` : 'Sin registros'}
              </p>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <Building2 className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Barra de Filtros */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="relative md:col-span-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por caso, farmacia, modus operandi o producto..."
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
                <option value="ALL">Todos los Tipos (Externo/Interno)</option>
                <option value="Externo">Externo (Clientes / Mecheros)</option>
                <option value="Interno">Interno (Personal / Contratista)</option>
                <option value="Mixto">Mixto (Colusión)</option>
              </select>
            </div>

            <div>
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="w-full py-2 px-3 text-xs font-medium rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 bg-white"
              >
                <option value="ALL">Todos los Estados</option>
                <option value="Reportado">Reportado</option>
                <option value="En Investigación">En Investigación</option>
                <option value="Ajustado">Ajustado</option>
                <option value="Recuperado">Recuperado</option>
                <option value="Cerrado">Cerrado</option>
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
                {searchTerm || filterPharmacy !== 'ALL' || filterStatus !== 'ALL' || filterType !== 'ALL'
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
                    <th className="py-3 px-4">Farmacia / Ubicación</th>
                    <th className="py-3 px-4">Tipo & Zona</th>
                    <th className="py-3 px-4">Pérdida (USD)</th>
                    <th className="py-3 px-4">Evidencia Drive</th>
                    <th className="py-3 px-4">Estado</th>
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredRecords.map(record => {
                    const statusColors: Record<TheftStatus, string> = {
                      'Reportado': 'bg-amber-50 text-amber-700 border-amber-200',
                      'En Investigación': 'bg-blue-50 text-blue-700 border-blue-200',
                      'Ajustado': 'bg-purple-50 text-purple-700 border-purple-200',
                      'Recuperado': 'bg-emerald-50 text-emerald-700 border-emerald-200',
                      'Cerrado': 'bg-slate-100 text-slate-600 border-slate-200'
                    };

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
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            Reportado por: {record.createdByName} ({record.createdByRole})
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className={`inline-block px-2 py-0.5 rounded-md font-bold text-[10px] ${
                            record.theftType === 'Externo'
                              ? 'bg-orange-50 text-orange-700'
                              : record.theftType === 'Interno'
                              ? 'bg-rose-50 text-rose-700'
                              : 'bg-indigo-50 text-indigo-700'
                          }`}>
                            {record.theftType}
                          </span>
                          <div className="text-[11px] text-slate-500 font-medium mt-1">
                            {record.zoneInPharmacy}
                          </div>
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
                            {record.evidenceDriveUrl ? (
                              <a
                                href={record.evidenceDriveUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline"
                              >
                                <FolderOpen className="w-3.5 h-3.5 text-blue-500" />
                                Evidencia Drive
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            ) : (
                              <span className="text-[11px] text-slate-400 italic">Sin enlace CCTV</span>
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

                        <td className="py-3.5 px-4">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${statusColors[record.status] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                            {record.status}
                          </span>
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
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
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
              1. Localización y Horario del Hurto
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
                      pharmacyName: p ? p.name : ''
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

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Estado del Caso
                </label>
                <select
                  value={formData.status}
                  onChange={e => setFormData(prev => ({ ...prev, status: e.target.value as TheftStatus }))}
                  className="w-full text-xs font-medium py-2.5 px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 bg-white"
                >
                  <option value="Reportado">Reportado</option>
                  <option value="En Investigación">En Investigación</option>
                  <option value="Ajustado">Ajustado en ERP/Sistema</option>
                  <option value="Recuperado">Recuperado en el Sitio</option>
                  <option value="Cerrado">Cerrado</option>
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

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Turno
                </label>
                <select
                  value={formData.shift}
                  onChange={e => setFormData(prev => ({ ...prev, shift: e.target.value as any }))}
                  className="w-full text-xs font-medium py-2.5 px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 bg-white"
                >
                  <option value="Mañana">Mañana</option>
                  <option value="Tarde">Tarde</option>
                  <option value="Noche">Noche</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: TIPIFICACIÓN Y MODUS OPERANDI */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-500" />
              2. Tipificación y Modus Operandi
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tipo de Hurto
                </label>
                <select
                  value={formData.theftType}
                  onChange={e => setFormData(prev => ({ ...prev, theftType: e.target.value as TheftType }))}
                  className="w-full text-xs font-medium py-2.5 px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 bg-white"
                >
                  <option value="Externo">Externo (Clientes, Mecheros, Bandas)</option>
                  <option value="Interno">Interno (Personal, Empleados, Contratistas)</option>
                  <option value="Mixto">Mixto (Colusión Interna + Externa)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Zona Específica en Farmacia
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

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Descripción del Modus Operandi
                </label>
                <textarea
                  rows={2}
                  placeholder="Detalle cómo ocurrió: ocultamiento en morral, cambio de cajas, consumo dentro de tienda, distracción al farmacéutico, etc..."
                  value={formData.modusOperandi}
                  onChange={e => setFormData(prev => ({ ...prev, modusOperandi: e.target.value }))}
                  className="w-full text-xs font-medium p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Descripción o Datos del Sospechoso / Implicados
                </label>
                <input
                  type="text"
                  placeholder="Vestimenta, características físicas, si fue identificado o si es reincidente..."
                  value={formData.suspectDetails || ''}
                  onChange={e => setFormData(prev => ({ ...prev, suspectDetails: e.target.value }))}
                  className="w-full text-xs font-medium py-2.5 px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
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

            {/* Formulario rápido para agregar ítem */}
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

          {/* SECCIÓN 4: ENLACES GOOGLE DRIVE (PESO CERO EN DB) Y CCTV */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                  4. Enlaces de Google Drive & Soportes Digitales
                </h3>
                <p className="text-xs text-slate-500">
                  Suba las fotos, videos y archivos pesados a Google Drive y pegue los enlaces compartidos aquí (0 costo en base de datos).
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Carpeta / Archivo de Evidencias (Videos / Fotos CCTV)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    placeholder="https://drive.google.com/drive/folders/..."
                    value={formData.evidenceDriveUrl || ''}
                    onChange={e => setFormData(prev => ({ ...prev, evidenceDriveUrl: e.target.value }))}
                    className="w-full text-xs font-medium py-2.5 px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  {formData.evidenceDriveUrl && (
                    <a
                      href={formData.evidenceDriveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl transition-colors flex-shrink-0"
                      title="Probar enlace"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 block">
                  Enlace de Drive con permisos de lectura/visualización para el equipo.
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Enlace al Soporte de Ajuste (Excel / PDF / Google Sheets)
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
                <span className="text-[10px] text-slate-400 block">
                  Planilla de merma, ajuste contable del ERP o acta firmada.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Referencia de Cámara CCTV
                </label>
                <input
                  type="text"
                  placeholder="Ej: CAM-04 Pasillo 2 (DVR Principal)"
                  value={formData.cctvCameraReference || ''}
                  onChange={e => setFormData(prev => ({ ...prev, cctvCameraReference: e.target.value }))}
                  className="w-full text-xs font-medium py-2.5 px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Rango de Tiempo / Timestamp de Grabación
                </label>
                <input
                  type="text"
                  placeholder="Ej: 15:42:00 a 15:46:30"
                  value={formData.cctvTimestamp || ''}
                  onChange={e => setFormData(prev => ({ ...prev, cctvTimestamp: e.target.value }))}
                  className="w-full text-xs font-medium py-2.5 px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>
            </div>
          </div>

          {/* SECCIÓN 5: ACCIONES LEGALES Y NOTAS */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-600" />
              5. Acciones Legales y Observaciones Finales
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
                  Notas de Cierre u Observaciones del Auditor / CECOM
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
              className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
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
      </div>
    );
  }

  // ==========================================
  // RENDER: VISTA DETALLADA / EXPEDIENTE
  // ==========================================
  if (view === 'detail' && selectedRecord) {
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
                Expediente de Hurto: {selectedRecord.pharmacyName}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-6 border-b border-slate-100">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">FECHA & HORA</span>
              <span className="text-xs font-black text-slate-800">{selectedRecord.date} {selectedRecord.time}</span>
              <span className="text-[10px] text-slate-400 block">Turno: {selectedRecord.shift || 'N/A'}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">TIPIFICACIÓN</span>
              <span className="text-xs font-black text-slate-800">{selectedRecord.theftType}</span>
              <span className="text-[10px] text-slate-400 block">{selectedRecord.zoneInPharmacy}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">PÉRDIDA NETA</span>
              <span className="text-base font-black text-rose-600">
                ${Number(selectedRecord.totalLossUSD || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">ESTADO</span>
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700 mt-1">
                {selectedRecord.status}
              </span>
            </div>
          </div>

          {/* Modus Operandi & Sospechoso */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-100">
              <span className="text-xs font-black text-slate-700 uppercase tracking-wider block mb-1">
                Modus Operandi:
              </span>
              <p className="text-xs text-slate-600 leading-relaxed">
                {selectedRecord.modusOperandi || 'Sin descripción de la modalidad registrada.'}
              </p>
            </div>

            <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-100">
              <span className="text-xs font-black text-slate-700 uppercase tracking-wider block mb-1">
                Datos del Sospechoso / Implicados:
              </span>
              <p className="text-xs text-slate-600 leading-relaxed">
                {selectedRecord.suspectDetails || 'No se registraron datos del sospechoso.'}
              </p>
            </div>
          </div>

          {/* Enlaces Google Drive */}
          <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 space-y-3">
            <span className="text-xs font-black text-blue-900 uppercase tracking-wider block flex items-center gap-1.5">
              <FolderOpen className="w-4 h-4 text-blue-600" />
              Soportes y Evidencias en Google Drive
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {selectedRecord.evidenceDriveUrl ? (
                <a
                  href={selectedRecord.evidenceDriveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 bg-white rounded-xl border border-blue-200/80 hover:border-blue-400 hover:shadow-sm transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <Video className="w-5 h-5 text-blue-600" />
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">Carpeta de Videos y Fotos</span>
                      <span className="text-[10px] text-slate-400">Ver evidencias en Google Drive</span>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-blue-500" />
                </a>
              ) : (
                <div className="p-3 bg-white/60 rounded-xl border border-dashed border-slate-200 text-xs text-slate-400 italic">
                  Sin enlace a evidencias de video/foto
                </div>
              )}

              {selectedRecord.adjustmentDriveUrl ? (
                <a
                  href={selectedRecord.adjustmentDriveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 bg-white rounded-xl border border-emerald-200/80 hover:border-emerald-400 hover:shadow-sm transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">Soporte de Ajuste de Merma</span>
                      <span className="text-[10px] text-slate-400">Ver Excel / PDF en Drive</span>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-emerald-500" />
                </a>
              ) : (
                <div className="p-3 bg-white/60 rounded-xl border border-dashed border-slate-200 text-xs text-slate-400 italic">
                  Sin enlace a planilla o ajuste contable
                </div>
              )}
            </div>

            {(selectedRecord.cctvCameraReference || selectedRecord.cctvTimestamp) && (
              <div className="text-[11px] text-slate-600 pt-1 flex items-center gap-4">
                {selectedRecord.cctvCameraReference && (
                  <span><strong>Cámara:</strong> {selectedRecord.cctvCameraReference}</span>
                )}
                {selectedRecord.cctvTimestamp && (
                  <span><strong>Timestamp:</strong> {selectedRecord.cctvTimestamp}</span>
                )}
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
