import React, { useMemo, useState } from 'react';
import {
  Boxes,
  Plus,
  Search,
  Filter,
  Warehouse,
  Building2,
  Wrench,
  Trash2,
  ArrowRightLeft,
  PackageCheck,
  X,
  Save,
  MapPin,
  Shield,
  Cpu,
  HardDrive,
  Monitor,
  Camera,
  Router,
  ScanLine
} from 'lucide-react';
import { Pharmacy, TechnicalInventoryItem, InventoryCategory } from '../types';

interface TechnicalInventoryProps {
  pharmacies: Pharmacy[];
  items: TechnicalInventoryItem[];
  onAddItem: (item: TechnicalInventoryItem) => void;
  onUpdateItem: (item: TechnicalInventoryItem) => void;
  onDeleteItem: (id: string) => void;
  currentUser: any;
}

const CATEGORY_OPTIONS: InventoryCategory[] = [
  'Camara',
  'DVR',
  'NVR',
  'Disco',
  'Monitor',
  'UPS',
  'Router',
  'Switch',
  'Biometrico',
  'Accesorio',
  'Otro'
];

const getCategoryIcon = (category: InventoryCategory) => {
  switch (category) {
    case 'Camara':
      return Camera;
    case 'DVR':
    case 'NVR':
      return Cpu;
    case 'Disco':
      return HardDrive;
    case 'Monitor':
      return Monitor;
    case 'Router':
    case 'Switch':
      return Router;
    case 'Biometrico':
      return ScanLine;
    default:
      return Shield;
  }
};

const TechnicalInventory: React.FC<TechnicalInventoryProps> = ({
  pharmacies,
  items,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  currentUser
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('Todos');
  const [filterCategory, setFilterCategory] = useState('Todas');
  const [showNewModal, setShowNewModal] = useState(false);
  const [itemToAssign, setItemToAssign] = useState<TechnicalInventoryItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TechnicalInventoryItem | null>(null);

  const [newItem, setNewItem] = useState<Partial<TechnicalInventoryItem>>({
    name: '',
    category: 'Camara',
    brand: '',
    model: '',
    serialNumber: '',
    quantity: 1,
    unitType: 'Unidad',
    condition: 'Operativo',
    status: 'Disponible',
    originType: 'Compra',
    originReference: '',
    entryDate: new Date().toISOString().split('T')[0],
    currentLocationType: 'Almacen',
    currentLocationName: 'Almacén Principal',
    notes: ''
  });

  const [assignment, setAssignment] = useState({
    pharmacyId: '',
    notes: ''
  });

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.serialNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.brand || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.model || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.currentLocationName || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = filterStatus === 'Todos' || item.status === filterStatus;
      const matchesCategory = filterCategory === 'Todas' || item.category === filterCategory;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [items, searchTerm, filterStatus, filterCategory]);

  const stats = useMemo(() => {
    return {
      total: items.length,
      available: items.filter(i => i.status === 'Disponible' || i.status === 'Almacen').length,
      assigned: items.filter(i => i.status === 'Asignado').length,
      repair: items.filter(i => i.status === 'Reparacion').length
    };
  }, [items]);

  const handleSaveNew = () => {
    if (!newItem.name || !newItem.category || !newItem.entryDate) return;

    const item: TechnicalInventoryItem = {
      id: `inv-${Date.now()}`,
      itemCode: `IT-${Date.now().toString().slice(-6)}`,
      name: newItem.name,
      category: newItem.category as InventoryCategory,
      brand: newItem.brand || '',
      model: newItem.model || '',
      serialNumber: newItem.serialNumber || '',
      quantity: Number(newItem.quantity || 1),
      unitType: (newItem.unitType as any) || 'Unidad',
      condition: (newItem.condition as any) || 'Operativo',
      status: (newItem.status as any) || 'Disponible',
      originType: (newItem.originType as any) || 'Compra',
      originReference: newItem.originReference || '',
      entryDate: newItem.entryDate,
      currentLocationType: newItem.currentLocationType as any,
      currentLocationId: '',
      currentLocationName: newItem.currentLocationName || 'Almacén Principal',
      assignedTo: '',
      notes: newItem.notes || '',
      createdBy: currentUser?.fullName || currentUser?.email || 'Sistema'
    };

    onAddItem(item);
    setShowNewModal(false);
    setNewItem({
      name: '',
      category: 'Camara',
      brand: '',
      model: '',
      serialNumber: '',
      quantity: 1,
      unitType: 'Unidad',
      condition: 'Operativo',
      status: 'Disponible',
      originType: 'Compra',
      originReference: '',
      entryDate: new Date().toISOString().split('T')[0],
      currentLocationType: 'Almacen',
      currentLocationName: 'Almacén Principal',
      notes: ''
    });
  };

  const handleAssign = () => {
    if (!itemToAssign || !assignment.pharmacyId) return;

    const pharmacy = pharmacies.find(p => p.id === assignment.pharmacyId);
    if (!pharmacy) return;

    onUpdateItem({
      ...itemToAssign,
      status: 'Asignado',
      currentLocationType: 'Farmacia',
      currentLocationId: pharmacy.id,
      currentLocationName: pharmacy.name,
      assignedTo: pharmacy.name,
      notes: assignment.notes
        ? `${itemToAssign.notes || ''}${itemToAssign.notes ? ' | ' : ''}ASIGNACIÓN: ${assignment.notes}`
        : itemToAssign.notes
    });

    setItemToAssign(null);
    setAssignment({ pharmacyId: '', notes: '' });
  };

  const handleSendToRepair = (item: TechnicalInventoryItem) => {
    onUpdateItem({
      ...item,
      status: 'Reparacion',
      condition: 'Reparacion'
    });
  };

  const handleReturnToWarehouse = (item: TechnicalInventoryItem) => {
    onUpdateItem({
      ...item,
      status: 'Almacen',
      currentLocationType: 'Almacen',
      currentLocationId: '',
      currentLocationName: 'Almacén Principal',
      assignedTo: ''
    });
  };

  return (
    <div className="max-w-[1600px] mx-auto p-6 md:p-10 pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center shadow-2xl border border-slate-700">
            <Boxes className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-normal uppercase drop-shadow-md">Inventario Técnico</h1>
            <p className="text-slate-300 font-bold text-xs uppercase tracking-[0.18em]">Control de Equipos de Seguridad</p>
          </div>
        </div>

        <button
          onClick={() => setShowNewModal(true)}
          className="bg-orange-600 hover:bg-orange-500 text-white px-6 py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Registrar Ingreso
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-slate-100">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Total Equipos</p>
          <p className="text-5xl font-black text-slate-800">{stats.total}</p>
        </div>
        <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-slate-100">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Disponibles</p>
          <p className="text-5xl font-black text-emerald-600">{stats.available}</p>
        </div>
        <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-slate-100">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Asignados</p>
          <p className="text-5xl font-black text-blue-600">{stats.assigned}</p>
        </div>
        <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-slate-100">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">En Reparación</p>
          <p className="text-5xl font-black text-orange-600">{stats.repair}</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-[2rem] shadow-xl border border-slate-100 mb-8 flex flex-col md:flex-row items-center gap-4">
        <div className="relative group flex-1 w-full">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar equipo, serial, marca o ubicación..."
            className="w-full pl-14 pr-6 py-4 bg-transparent border-none outline-none font-bold text-slate-700 placeholder-slate-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="relative w-full md:w-64">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <select
            className="w-full pl-12 pr-10 py-4 bg-white border border-slate-200 rounded-xl outline-none font-bold text-slate-700 appearance-none"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="Todas">Todas las categorías</option>
            {CATEGORY_OPTIONS.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="relative w-full md:w-64">
          <Warehouse className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <select
            className="w-full pl-12 pr-10 py-4 bg-white border border-slate-200 rounded-xl outline-none font-bold text-slate-700 appearance-none"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="Todos">Todos los estados</option>
            <option value="Disponible">Disponible</option>
            <option value="Almacen">Almacén</option>
            <option value="Asignado">Asignado</option>
            <option value="Reparacion">Reparación</option>
            <option value="Descartado">Descartado</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-xl border border-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-white border-b border-slate-100">
                <th className="py-6 px-8 text-left text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Equipo</th>
                <th className="py-6 px-8 text-left text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Identificación</th>
                <th className="py-6 px-8 text-left text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Estado</th>
                <th className="py-6 px-8 text-left text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Ubicación</th>
                <th className="py-6 px-8 text-left text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Origen</th>
                <th className="py-6 px-8 text-right text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredItems.length > 0 ? filteredItems.map((item) => {
                const Icon = getCategoryIcon(item.category);

                return (
                  <tr key={item.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="py-6 px-8 align-top">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
                          <Icon className="w-6 h-6 text-slate-600" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900 uppercase">{item.name}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.category}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-6 px-8 align-top">
                      <p className="text-sm font-bold text-slate-800">{item.itemCode || 'Sin código'}</p>
                      <p className="text-xs text-slate-500 mt-1">{item.brand || 'Sin marca'} {item.model || ''}</p>
                      <p className="text-[10px] font-mono text-slate-400 mt-1">
                        {item.serialNumber || `Cantidad: ${item.quantity}`}
                      </p>
                    </td>

                    <td className="py-6 px-8 align-top">
                      <div className="space-y-2">
                        <span className={`inline-flex px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                          item.status === 'Asignado' ? 'bg-blue-100 text-blue-700' :
                          item.status === 'Reparacion' ? 'bg-orange-100 text-orange-700' :
                          item.status === 'Descartado' ? 'bg-red-100 text-red-700' :
                          'bg-emerald-100 text-emerald-700'
                        }`}>
                          {item.status}
                        </span>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          {item.condition}
                        </div>
                      </div>
                    </td>

                    <td className="py-6 px-8 align-top">
                      <p className="text-sm font-bold text-slate-800">{item.currentLocationName || 'Sin ubicación'}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                        {item.currentLocationType || 'No definida'}
                      </p>
                    </td>

                    <td className="py-6 px-8 align-top">
                      <p className="text-sm font-bold text-slate-800">{item.originType}</p>
                      <p className="text-xs text-slate-500 mt-1">{item.originReference || 'Sin referencia'}</p>
                    </td>

                    <td className="py-6 px-8 align-top text-right">
                      <div className="flex items-center justify-end gap-2">
                        {item.status !== 'Asignado' && (
                          <button
                            onClick={() => setItemToAssign(item)}
                            className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all border border-blue-100"
                            title="Asignar"
                          >
                            <PackageCheck className="w-4 h-4" />
                          </button>
                        )}

                        {item.status === 'Asignado' && (
                          <button
                            onClick={() => handleReturnToWarehouse(item)}
                            className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-700 hover:text-white transition-all border border-slate-200"
                            title="Devolver a almacén"
                          >
                            <ArrowRightLeft className="w-4 h-4" />
                          </button>
                        )}

                        {item.status !== 'Reparacion' && item.status !== 'Descartado' && (
                          <button
                            onClick={() => handleSendToRepair(item)}
                            className="p-2 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-600 hover:text-white transition-all border border-orange-100"
                            title="Enviar a reparación"
                          >
                            <Wrench className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          onClick={() => setDeleteTarget(item)}
                          className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all border border-red-100"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={6} className="py-20 text-center text-slate-400 font-medium">
                    No hay equipos registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showNewModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[250] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-3xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-black text-slate-900 uppercase">Registrar Ingreso</h3>
              <button onClick={() => setShowNewModal(false)} className="p-2 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Nombre</label>
                <input
                  type="text"
                  className="w-full p-3 border border-slate-200 rounded-xl outline-none"
                  value={newItem.name || ''}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Categoría</label>
                <select
                  className="w-full p-3 border border-slate-200 rounded-xl outline-none"
                  value={newItem.category || 'Camara'}
                  onChange={(e) => setNewItem({ ...newItem, category: e.target.value as InventoryCategory })}
                >
                  {CATEGORY_OPTIONS.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Marca</label>
                <input
                  type="text"
                  className="w-full p-3 border border-slate-200 rounded-xl outline-none"
                  value={newItem.brand || ''}
                  onChange={(e) => setNewItem({ ...newItem, brand: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Modelo</label>
                <input
                  type="text"
                  className="w-full p-3 border border-slate-200 rounded-xl outline-none"
                  value={newItem.model || ''}
                  onChange={(e) => setNewItem({ ...newItem, model: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Serial</label>
                <input
                  type="text"
                  className="w-full p-3 border border-slate-200 rounded-xl outline-none"
                  value={newItem.serialNumber || ''}
                  onChange={(e) => setNewItem({ ...newItem, serialNumber: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Cantidad</label>
                <input
                  type="number"
                  min={1}
                  className="w-full p-3 border border-slate-200 rounded-xl outline-none"
                  value={newItem.quantity || 1}
                  onChange={(e) => setNewItem({ ...newItem, quantity: Number(e.target.value) })}
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Tipo de unidad</label>
                <select
                  className="w-full p-3 border border-slate-200 rounded-xl outline-none"
                  value={newItem.unitType || 'Unidad'}
                  onChange={(e) => setNewItem({ ...newItem, unitType: e.target.value as any })}
                >
                  <option value="Unidad">Unidad</option>
                  <option value="Lote">Lote</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Condición</label>
                <select
                  className="w-full p-3 border border-slate-200 rounded-xl outline-none"
                  value={newItem.condition || 'Operativo'}
                  onChange={(e) => setNewItem({ ...newItem, condition: e.target.value as any })}
                >
                  <option value="Nuevo">Nuevo</option>
                  <option value="Operativo">Operativo</option>
                  <option value="Usado">Usado</option>
                  <option value="Dañado">Dañado</option>
                  <option value="Reparacion">Reparacion</option>
                  <option value="Baja">Baja</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Origen</label>
                <select
                  className="w-full p-3 border border-slate-200 rounded-xl outline-none"
                  value={newItem.originType || 'Compra'}
                  onChange={(e) => setNewItem({ ...newItem, originType: e.target.value as any })}
                >
                  <option value="Compra">Compra</option>
                  <option value="Desinstalacion">Desinstalacion</option>
                  <option value="Traslado">Traslado</option>
                  <option value="Recuperacion">Recuperacion</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Fecha de ingreso</label>
                <input
                  type="date"
                  className="w-full p-3 border border-slate-200 rounded-xl outline-none"
                  value={newItem.entryDate || ''}
                  onChange={(e) => setNewItem({ ...newItem, entryDate: e.target.value })}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Referencia de origen</label>
                <input
                  type="text"
                  placeholder="Factura, sede origen, proveedor, etc."
                  className="w-full p-3 border border-slate-200 rounded-xl outline-none"
                  value={newItem.originReference || ''}
                  onChange={(e) => setNewItem({ ...newItem, originReference: e.target.value })}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Notas</label>
                <textarea
                  rows={3}
                  className="w-full p-3 border border-slate-200 rounded-xl outline-none resize-none"
                  value={newItem.notes || ''}
                  onChange={(e) => setNewItem({ ...newItem, notes: e.target.value })}
                />
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() => setShowNewModal(false)}
                className="px-6 py-3 rounded-xl bg-slate-100 text-slate-700 font-black uppercase text-[10px]"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveNew}
                className="px-6 py-3 rounded-xl bg-orange-600 text-white font-black uppercase text-[10px] flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {itemToAssign && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[250] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-black text-slate-900 uppercase">Asignar Equipo</h3>
              <button onClick={() => setItemToAssign(null)} className="p-2 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Equipo seleccionado</p>
                <p className="font-black text-slate-900">{itemToAssign.name}</p>
                <p className="text-xs text-slate-500 mt-1">{itemToAssign.serialNumber || itemToAssign.itemCode}</p>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Farmacia destino</label>
                <select
                  className="w-full p-3 border border-slate-200 rounded-xl outline-none"
                  value={assignment.pharmacyId}
                  onChange={(e) => setAssignment({ ...assignment, pharmacyId: e.target.value })}
                >
                  <option value="">Seleccione una farmacia...</option>
                  {pharmacies.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Notas de asignación</label>
                <textarea
                  rows={3}
                  className="w-full p-3 border border-slate-200 rounded-xl outline-none resize-none"
                  value={assignment.notes}
                  onChange={(e) => setAssignment({ ...assignment, notes: e.target.value })}
                />
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() => setItemToAssign(null)}
                className="px-6 py-3 rounded-xl bg-slate-100 text-slate-700 font-black uppercase text-[10px]"
              >
                Cancelar
              </button>
              <button
                onClick={handleAssign}
                className="px-6 py-3 rounded-xl bg-blue-600 text-white font-black uppercase text-[10px] flex items-center gap-2"
              >
                <Building2 className="w-4 h-4" />
                Asignar
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[250] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 text-center">
              <Trash2 className="w-12 h-12 text-red-600 mx-auto mb-4" />
              <h3 className="text-2xl font-black text-slate-900 mb-2">¿Eliminar equipo?</h3>
              <p className="text-slate-500 mb-6">
                Vas a eliminar <span className="font-bold text-slate-800">{deleteTarget.name}</span>.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-700 font-black uppercase text-[10px]"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    onDeleteItem(deleteTarget.id);
                    setDeleteTarget(null);
                  }}
                  className="flex-1 py-3 rounded-xl bg-red-600 text-white font-black uppercase text-[10px]"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TechnicalInventory;
