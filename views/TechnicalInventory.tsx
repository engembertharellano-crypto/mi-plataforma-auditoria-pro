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
  Shield,
  Cpu,
  HardDrive,
  Monitor,
  Camera,
  Router,
  ScanLine,
  Pencil,
  RotateCcw,
  ArchiveX,
  MapPin
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

const STATUS_OPTIONS = [
  'Disponible',
  'Asignado',
  'Almacen',
  'Transito',
  'Reparacion',
  'Descartado'
] as const;

const CONDITION_OPTIONS = [
  'Nuevo',
  'Operativo',
  'Usado',
  'Dañado',
  'Reparacion',
  'Baja'
] as const;

const ORIGIN_OPTIONS = [
  'Compra',
  'Desinstalacion',
  'Traslado',
  'Recuperacion'
] as const;

const LOCATION_TYPE_OPTIONS = [
  'Almacen',
  'Custodia',
  'Farmacia',
  'Reparacion',
  'Desechado',
  'Otro'
] as const;

const CORPORATE_LOCATIONS = [
  'Almacén Central',
  'Almacén Guarenas',
  'Almacén Cubo Negro',
  'Almacén Barquisimeto',
  'Custodia de Coordinación',
  'Custodia de Gerencia',
  'Taller de Reparación',
  'Baja Operativa'
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

const getStatusClasses = (status?: string) => {
  switch (status) {
    case 'Asignado':
      return 'bg-blue-100 text-blue-700';
    case 'Reparacion':
      return 'bg-orange-100 text-orange-700';
    case 'Descartado':
      return 'bg-red-100 text-red-700';
    case 'Transito':
      return 'bg-purple-100 text-purple-700';
    case 'Almacen':
      return 'bg-slate-100 text-slate-700';
    default:
      return 'bg-emerald-100 text-emerald-700';
  }
};

type MoveAction = 'assign' | 'repair' | 'discard';

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
  const [itemToEdit, setItemToEdit] = useState<TechnicalInventoryItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TechnicalInventoryItem | null>(null);

  const [itemToMove, setItemToMove] = useState<TechnicalInventoryItem | null>(null);
  const [moveAction, setMoveAction] = useState<MoveAction | null>(null);

  const emptyForm: Partial<TechnicalInventoryItem> = {
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
    entryDate: new Date().toISOString().split('T')[0],
    currentLocationType: 'Almacen',
    currentLocationName: 'Almacén Central',
    notes: ''
  };

  const [newItem, setNewItem] = useState<Partial<TechnicalInventoryItem>>(emptyForm);
  const [editForm, setEditForm] = useState<Partial<TechnicalInventoryItem>>(emptyForm);

  const [moveForm, setMoveForm] = useState({
    pharmacyId: '',
    quantity: 1,
    notes: ''
  });

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.serialNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.brand || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.model || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.currentLocationName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.itemCode || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = filterStatus === 'Todos' || item.status === filterStatus;
      const matchesCategory = filterCategory === 'Todas' || item.category === filterCategory;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [items, searchTerm, filterStatus, filterCategory]);

  const visibleItems = useMemo(() => {
    if (filterStatus === 'Todos') {
      return filteredItems.filter(
        item =>
          item.status === 'Disponible' ||
          item.status === 'Almacen' ||
          item.status === 'Transito'
      );
    }

    return filteredItems;
  }, [filteredItems, filterStatus]);

  const currentSectionTitle = useMemo(() => {
    if (filterStatus === 'Asignado') return 'Equipos Asignados';
    if (filterStatus === 'Reparacion') return 'Equipos en Reparación';
    if (filterStatus === 'Descartado') return 'Equipos Desechados';
    if (filterStatus === 'Disponible') return 'Equipos Disponibles';
    if (filterStatus === 'Almacen') return 'Equipos en Almacén';
    if (filterStatus === 'Transito') return 'Equipos en Tránsito';
    return 'Stock General';
  }, [filterStatus]);

  const currentSectionSubtitle = useMemo(() => {
    if (filterStatus === 'Asignado') return 'Equipos asignados a farmacias';
    if (filterStatus === 'Reparacion') return 'Equipos enviados a taller';
    if (filterStatus === 'Descartado') return 'Equipos dados de baja';
    if (filterStatus === 'Disponible') return 'Equipos listos para asignación';
    if (filterStatus === 'Almacen') return 'Equipos resguardados en almacén';
    if (filterStatus === 'Transito') return 'Equipos en movimiento';
    return 'Disponible, almacén y tránsito';
  }, [filterStatus]);

  const currentSectionIcon = useMemo(() => {
    if (filterStatus === 'Asignado') return Building2;
    if (filterStatus === 'Reparacion') return Wrench;
    if (filterStatus === 'Descartado') return ArchiveX;
    return Warehouse;
  }, [filterStatus]);

  const currentSectionIconClasses = useMemo(() => {
    if (filterStatus === 'Asignado') return 'bg-blue-100 text-blue-700';
    if (filterStatus === 'Reparacion') return 'bg-orange-100 text-orange-700';
    if (filterStatus === 'Descartado') return 'bg-red-100 text-red-700';
    return 'bg-emerald-100 text-emerald-700';
  }, [filterStatus]);

  const stats = useMemo(() => {
    return {
      total: items.reduce((sum, i) => sum + Number(i.quantity || 1), 0),
      available: items
        .filter(i => i.status === 'Disponible' || i.status === 'Almacen')
        .reduce((sum, i) => sum + Number(i.quantity || 1), 0),
      assigned: items
        .filter(i => i.status === 'Asignado')
        .reduce((sum, i) => sum + Number(i.quantity || 1), 0),
      repair: items
        .filter(i => i.status === 'Reparacion')
        .reduce((sum, i) => sum + Number(i.quantity || 1), 0)
    };
  }, [items]);

  const resetNewForm = () => {
    setNewItem({
      ...emptyForm,
      entryDate: new Date().toISOString().split('T')[0]
    });
  };

  const resetMoveForm = () => {
    setMoveForm({
      pharmacyId: '',
      quantity: 1,
      notes: ''
    });
  };

  const openMoveModal = (item: TechnicalInventoryItem, action: MoveAction) => {
    setItemToMove(item);
    setMoveAction(action);
    setMoveForm({
      pharmacyId: '',
      quantity: 1,
      notes: ''
    });
  };

  const closeMoveModal = () => {
    setItemToMove(null);
    setMoveAction(null);
    resetMoveForm();
  };

  const splitItemQuantity = (
    sourceItem: TechnicalInventoryItem,
    movedQuantity: number,
    overrides: Partial<TechnicalInventoryItem>
  ) => {
    const currentQty = Number(sourceItem.quantity || 1);

    if (movedQuantity <= 0 || movedQuantity > currentQty) return;

    if (movedQuantity === currentQty) {
      onUpdateItem({
        ...sourceItem,
        ...overrides,
        quantity: movedQuantity
      });
      return;
    }

    onUpdateItem({
      ...sourceItem,
      quantity: currentQty - movedQuantity
    });

    const newItem: TechnicalInventoryItem = {
      ...sourceItem,
      ...overrides,
      id: `inv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      itemCode: `IT-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 100)}`,
      quantity: movedQuantity
    };

    onAddItem(newItem);
  };

  const handleSaveNew = () => {
    if (!newItem.name || !newItem.category || !newItem.entryDate) return;

    const normalizedQuantity =
      newItem.unitType === 'Unidad' ? 1 : Math.max(1, Number(newItem.quantity || 1));

    const item: TechnicalInventoryItem = {
      id: `inv-${Date.now()}`,
      itemCode: `IT-${Date.now().toString().slice(-6)}`,
      name: newItem.name,
      category: newItem.category as InventoryCategory,
      brand: newItem.brand || '',
      model: newItem.model || '',
      serialNumber: newItem.serialNumber || '',
      quantity: normalizedQuantity,
      unitType: (newItem.unitType as any) || 'Unidad',
      condition: (newItem.condition as any) || 'Operativo',
      status: (newItem.status as any) || 'Disponible',
      originType: (newItem.originType as any) || 'Compra',
      originReference: '',
      entryDate: newItem.entryDate,
      currentLocationType: newItem.currentLocationType as any,
      currentLocationId: newItem.currentLocationId || '',
      currentLocationName: newItem.currentLocationName || 'Almacén Central',
      assignedTo: newItem.assignedTo || '',
      notes: newItem.notes || '',
      createdBy: currentUser?.fullName || currentUser?.email || 'Sistema'
    };

    onAddItem(item);
    setShowNewModal(false);
    resetNewForm();
  };

  const openEditModal = (item: TechnicalInventoryItem) => {
    setItemToEdit(item);
    setEditForm({
      ...item
    });
  };

  const handleSaveEdit = () => {
    if (!itemToEdit || !editForm.name || !editForm.category || !editForm.entryDate) return;

    const normalizedQuantity =
      editForm.unitType === 'Unidad' ? 1 : Math.max(1, Number(editForm.quantity || 1));

    const updated: TechnicalInventoryItem = {
      ...itemToEdit,
      ...editForm,
      name: editForm.name,
      category: editForm.category as InventoryCategory,
      quantity: normalizedQuantity,
      unitType: (editForm.unitType as any) || 'Unidad',
      condition: (editForm.condition as any) || 'Operativo',
      status: (editForm.status as any) || 'Disponible',
      originType: (editForm.originType as any) || 'Compra',
      originReference: '',
      entryDate: editForm.entryDate
    };

    onUpdateItem(updated);
    setItemToEdit(null);
  };

  const handleConfirmMove = () => {
    if (!itemToMove || !moveAction) return;

    const qty = Math.max(1, Number(moveForm.quantity || 1));
    const availableQty = Number(itemToMove.quantity || 1);

    if (qty > availableQty) return;

    if (moveAction === 'assign') {
      if (!moveForm.pharmacyId) return;

      const pharmacy = pharmacies.find(p => p.id === moveForm.pharmacyId);
      if (!pharmacy) return;

      splitItemQuantity(itemToMove, qty, {
        status: 'Asignado',
        currentLocationType: 'Farmacia',
        currentLocationId: pharmacy.id,
        currentLocationName: pharmacy.name,
        assignedTo: pharmacy.name,
        notes: moveForm.notes
          ? `${itemToMove.notes || ''}${itemToMove.notes ? ' | ' : ''}ASIGNACIÓN: ${moveForm.notes}`
          : itemToMove.notes
      });
    }

    if (moveAction === 'repair') {
      splitItemQuantity(itemToMove, qty, {
        status: 'Reparacion',
        condition: 'Reparacion',
        currentLocationType: 'Reparacion',
        currentLocationId: '',
        currentLocationName: 'Taller de Reparación',
        assignedTo: '',
        notes: moveForm.notes
          ? `${itemToMove.notes || ''}${itemToMove.notes ? ' | ' : ''}REPARACIÓN: ${moveForm.notes}`
          : itemToMove.notes
      });
    }

    if (moveAction === 'discard') {
      splitItemQuantity(itemToMove, qty, {
        status: 'Descartado',
        condition: 'Baja',
        currentLocationType: 'Desechado' as any,
        currentLocationId: '',
        currentLocationName: 'Baja Operativa',
        assignedTo: '',
        notes: moveForm.notes
          ? `${itemToMove.notes || ''}${itemToMove.notes ? ' | ' : ''}DESCARTE: ${moveForm.notes}`
          : itemToMove.notes
      });
    }

    closeMoveModal();
  };

  const handleReturnToWarehouse = (item: TechnicalInventoryItem) => {
    onUpdateItem({
      ...item,
      status: 'Almacen',
      condition: item.condition === 'Reparacion' ? 'Operativo' : item.condition,
      currentLocationType: 'Almacen',
      currentLocationId: '',
      currentLocationName: 'Almacén Central',
      assignedTo: ''
    });
  };

  const handleMarkAvailable = (item: TechnicalInventoryItem) => {
    onUpdateItem({
      ...item,
      status: 'Disponible',
      condition: item.condition === 'Reparacion' ? 'Operativo' : item.condition,
      currentLocationType: 'Almacen',
      currentLocationId: '',
      currentLocationName: 'Almacén Central',
      assignedTo: ''
    });
  };

  const renderLocationFields = (
    form: Partial<TechnicalInventoryItem>,
    setForm: React.Dispatch<React.SetStateAction<Partial<TechnicalInventoryItem>>>
  ) => {
    const currentType = form.currentLocationType || 'Almacen';

    return (
      <>
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
            Tipo de ubicación
          </label>
          <select
            className="w-full p-3 border border-slate-200 rounded-xl outline-none"
            value={currentType}
            onChange={(e) =>
              setForm(prev => ({
                ...prev,
                currentLocationType: e.target.value as any,
                currentLocationName:
                  e.target.value === 'Almacen'
                    ? 'Almacén Central'
                    : e.target.value === 'Reparacion'
                    ? 'Taller de Reparación'
                    : e.target.value === 'Desechado'
                    ? 'Baja Operativa'
                    : prev.currentLocationName || ''
              }))
            }
          >
            {LOCATION_TYPE_OPTIONS.map(opt => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        {currentType === 'Farmacia' ? (
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
              Farmacia
            </label>
            <select
              className="w-full p-3 border border-slate-200 rounded-xl outline-none"
              value={form.currentLocationId || ''}
              onChange={(e) => {
                const pharmacy = pharmacies.find(p => p.id === e.target.value);
                setForm(prev => ({
                  ...prev,
                  currentLocationId: e.target.value,
                  currentLocationName: pharmacy?.name || '',
                  assignedTo: pharmacy?.name || ''
                }));
              }}
            >
              <option value="">Seleccione una farmacia...</option>
              {pharmacies.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
              Nombre de ubicación
            </label>
            <input
              list="corporate-locations"
              type="text"
              className="w-full p-3 border border-slate-200 rounded-xl outline-none"
              value={form.currentLocationName || ''}
              onChange={(e) => setForm(prev => ({ ...prev, currentLocationName: e.target.value }))}
              placeholder="Ej. Almacén Guarenas / Coordinador Juan Pérez"
            />
            <datalist id="corporate-locations">
              {CORPORATE_LOCATIONS.map(location => (
                <option key={location} value={location} />
              ))}
            </datalist>
          </div>
        )}
      </>
    );
  };

  const moveTitle =
    moveAction === 'assign'
      ? 'Asignar Equipos'
      : moveAction === 'repair'
      ? 'Enviar a Reparación'
      : moveAction === 'discard'
      ? 'Desechar Equipos'
      : '';

  const renderTable = (
    tableItems: TechnicalInventoryItem[],
    emptyMessage: string
  ) => (
    <div className="bg-white rounded-[2.5rem] shadow-xl border border-white overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-white border-b border-slate-100">
              <th className="py-6 px-8 text-left text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Equipo</th>
              <th className="py-6 px-8 text-left text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Identificación</th>
              <th className="py-6 px-8 text-left text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Cantidad</th>
              <th className="py-6 px-8 text-left text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Estado</th>
              <th className="py-6 px-8 text-left text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Ubicación</th>
              <th className="py-6 px-8 text-left text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Origen</th>
              <th className="py-6 px-8 text-right text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {tableItems.length > 0 ? (
              tableItems.map((item) => {
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
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            {item.category}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-6 px-8 align-top">
                      <p className="text-sm font-bold text-slate-800">{item.itemCode || 'Sin código'}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {item.brand || 'Sin marca'} {item.model || ''}
                      </p>
                      <p className="text-[10px] font-mono text-slate-400 mt-1">
                        {item.serialNumber || 'Sin serial'}
                      </p>
                    </td>

                    <td className="py-6 px-8 align-top">
                      <p className="text-lg font-black text-slate-900">{Number(item.quantity || 1)}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                        {item.unitType || 'Unidad'}
                      </p>
                    </td>

                    <td className="py-6 px-8 align-top">
                      <div className="space-y-2">
                        <span
                          className={`inline-flex px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${getStatusClasses(item.status)}`}
                        >
                          {item.status}
                        </span>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          {item.condition}
                        </div>
                      </div>
                    </td>

                    <td className="py-6 px-8 align-top">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                        <div>
                          <p className="text-sm font-bold text-slate-800">
                            {item.currentLocationName || 'Sin ubicación'}
                          </p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                            {item.currentLocationType || 'No definida'}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-6 px-8 align-top">
                      <p className="text-sm font-bold text-slate-800">{item.originType}</p>
                    </td>

                    <td className="py-6 px-8 align-top text-right">
                      <div className="flex items-center justify-end gap-2 flex-wrap">
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-700 hover:text-white transition-all border border-slate-200"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>

                        {item.status !== 'Asignado' && item.status !== 'Descartado' && (
                          <button
                            onClick={() => openMoveModal(item, 'assign')}
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
                            onClick={() => openMoveModal(item, 'repair')}
                            className="p-2 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-600 hover:text-white transition-all border border-orange-100"
                            title="Enviar a reparación"
                          >
                            <Wrench className="w-4 h-4" />
                          </button>
                        )}

                        {item.status === 'Reparacion' && (
                          <button
                            onClick={() => handleMarkAvailable(item)}
                            className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all border border-emerald-100"
                            title="Marcar operativo"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}

                        {item.status !== 'Descartado' && (
                          <button
                            onClick={() => openMoveModal(item, 'discard')}
                            className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all border border-red-100"
                            title="Desechar"
                          >
                            <ArchiveX className="w-4 h-4" />
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
              })
            ) : (
              <tr>
                <td colSpan={7} className="py-20 text-center text-slate-400 font-medium">
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const CurrentSectionIcon = currentSectionIcon;

  return (
    <div className="max-w-[1600px] mx-auto p-6 md:p-10 pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center shadow-2xl border border-slate-700">
            <Boxes className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-normal uppercase drop-shadow-md">
              Inventario Técnico
            </h1>
            <p className="text-slate-300 font-bold text-xs uppercase tracking-[0.18em]">
              Control de Equipos de Seguridad
            </p>
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
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Total Unidades</p>
          <p className="text-5xl font-black text-slate-800">{stats.total}</p>
        </div>
        <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-slate-100">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Disponibles</p>
          <p className="text-5xl font-black text-emerald-600">{stats.available}</p>
        </div>
        <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-slate-100">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Asignadas</p>
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
              <option key={cat} value={cat}>
                {cat}
              </option>
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
            {STATUS_OPTIONS.map(status => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <div className="flex items-center gap-3 mb-5">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${currentSectionIconClasses}`}>
            <CurrentSectionIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white uppercase">{currentSectionTitle}</h2>
            <p className="text-slate-300 text-xs font-bold uppercase tracking-widest">
              {currentSectionSubtitle}
            </p>
          </div>
        </div>

        {renderTable(visibleItems, 'No hay equipos para mostrar.')}
      </div>

      {showNewModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[250] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-4xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-black text-slate-900 uppercase">Registrar Ingreso</h3>
              <button
                onClick={() => setShowNewModal(false)}
                className="p-2 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5 max-h-[75vh] overflow-y-auto">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  Nombre
                </label>
                <input
                  type="text"
                  className="w-full p-3 border border-slate-200 rounded-xl outline-none"
                  value={newItem.name || ''}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  Categoría
                </label>
                <select
                  className="w-full p-3 border border-slate-200 rounded-xl outline-none"
                  value={newItem.category || 'Camara'}
                  onChange={(e) => setNewItem({ ...newItem, category: e.target.value as InventoryCategory })}
                >
                  {CATEGORY_OPTIONS.map(cat => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  Marca
                </label>
                <input
                  type="text"
                  className="w-full p-3 border border-slate-200 rounded-xl outline-none"
                  value={newItem.brand || ''}
                  onChange={(e) => setNewItem({ ...newItem, brand: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  Modelo
                </label>
                <input
                  type="text"
                  className="w-full p-3 border border-slate-200 rounded-xl outline-none"
                  value={newItem.model || ''}
                  onChange={(e) => setNewItem({ ...newItem, model: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  Serial
                </label>
                <input
                  type="text"
                  className="w-full p-3 border border-slate-200 rounded-xl outline-none"
                  value={newItem.serialNumber || ''}
                  onChange={(e) => setNewItem({ ...newItem, serialNumber: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  Tipo de unidad
                </label>
                <select
                  className="w-full p-3 border border-slate-200 rounded-xl outline-none"
                  value={newItem.unitType || 'Unidad'}
                  onChange={(e) => {
                    const nextUnitType = e.target.value as any;
                    setNewItem({
                      ...newItem,
                      unitType: nextUnitType,
                      quantity: nextUnitType === 'Unidad' ? 1 : Math.max(1, Number(newItem.quantity || 1))
                    });
                  }}
                >
                  <option value="Unidad">Unidad</option>
                  <option value="Lote">Lote</option>
                </select>
                <p className="text-[10px] text-slate-400 mt-2">
                  Unidad = una sola pieza. Lote = varias piezas del mismo tipo.
                </p>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  Cantidad
                </label>
                <input
                  type="number"
                  min={1}
                  disabled={newItem.unitType === 'Unidad'}
                  className={`w-full p-3 border border-slate-200 rounded-xl outline-none ${
                    newItem.unitType === 'Unidad' ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : ''
                  }`}
                  value={newItem.unitType === 'Unidad' ? 1 : (newItem.quantity || 1)}
                  onChange={(e) => setNewItem({ ...newItem, quantity: Number(e.target.value) })}
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  Condición
                </label>
                <select
                  className="w-full p-3 border border-slate-200 rounded-xl outline-none"
                  value={newItem.condition || 'Operativo'}
                  onChange={(e) => setNewItem({ ...newItem, condition: e.target.value as any })}
                >
                  {CONDITION_OPTIONS.map(option => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  Estado
                </label>
                <select
                  className="w-full p-3 border border-slate-200 rounded-xl outline-none"
                  value={newItem.status || 'Disponible'}
                  onChange={(e) => setNewItem({ ...newItem, status: e.target.value as any })}
                >
                  {STATUS_OPTIONS.map(option => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  Origen
                </label>
                <select
                  className="w-full p-3 border border-slate-200 rounded-xl outline-none"
                  value={newItem.originType || 'Compra'}
                  onChange={(e) => setNewItem({ ...newItem, originType: e.target.value as any })}
                >
                  {ORIGIN_OPTIONS.map(option => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  Fecha de ingreso
                </label>
                <input
                  type="date"
                  className="w-full p-3 border border-slate-200 rounded-xl outline-none"
                  value={newItem.entryDate || ''}
                  onChange={(e) => setNewItem({ ...newItem, entryDate: e.target.value })}
                />
              </div>

              {renderLocationFields(newItem, setNewItem)}

              <div className="md:col-span-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  Notas
                </label>
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
                onClick={() => {
                  setShowNewModal(false);
                  resetNewForm();
                }}
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

      {itemToEdit && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[260] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-4xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-black text-slate-900 uppercase">Editar Activo</h3>
              <button
                onClick={() => setItemToEdit(null)}
                className="p-2 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5 max-h-[75vh] overflow-y-auto">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  Nombre
                </label>
                <input
                  type="text"
                  className="w-full p-3 border border-slate-200 rounded-xl outline-none"
                  value={editForm.name || ''}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  Categoría
                </label>
                <select
                  className="w-full p-3 border border-slate-200 rounded-xl outline-none"
                  value={editForm.category || 'Camara'}
                  onChange={(e) => setEditForm({ ...editForm, category: e.target.value as InventoryCategory })}
                >
                  {CATEGORY_OPTIONS.map(cat => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  Marca
                </label>
                <input
                  type="text"
                  className="w-full p-3 border border-slate-200 rounded-xl outline-none"
                  value={editForm.brand || ''}
                  onChange={(e) => setEditForm({ ...editForm, brand: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  Modelo
                </label>
                <input
                  type="text"
                  className="w-full p-3 border border-slate-200 rounded-xl outline-none"
                  value={editForm.model || ''}
                  onChange={(e) => setEditForm({ ...editForm, model: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  Serial
                </label>
                <input
                  type="text"
                  className="w-full p-3 border border-slate-200 rounded-xl outline-none"
                  value={editForm.serialNumber || ''}
                  onChange={(e) => setEditForm({ ...editForm, serialNumber: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  Tipo de unidad
                </label>
                <select
                  className="w-full p-3 border border-slate-200 rounded-xl outline-none"
                  value={editForm.unitType || 'Unidad'}
                  onChange={(e) => {
                    const nextUnitType = e.target.value as any;
                    setEditForm({
                      ...editForm,
                      unitType: nextUnitType,
                      quantity: nextUnitType === 'Unidad' ? 1 : Math.max(1, Number(editForm.quantity || 1))
                    });
                  }}
                >
                  <option value="Unidad">Unidad</option>
                  <option value="Lote">Lote</option>
                </select>
                <p className="text-[10px] text-slate-400 mt-2">
                  Unidad = una sola pieza. Lote = varias piezas del mismo tipo.
                </p>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  Cantidad
                </label>
                <input
                  type="number"
                  min={1}
                  disabled={editForm.unitType === 'Unidad'}
                  className={`w-full p-3 border border-slate-200 rounded-xl outline-none ${
                    editForm.unitType === 'Unidad' ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : ''
                  }`}
                  value={editForm.unitType === 'Unidad' ? 1 : (editForm.quantity || 1)}
                  onChange={(e) => setEditForm({ ...editForm, quantity: Number(e.target.value) })}
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  Condición
                </label>
                <select
                  className="w-full p-3 border border-slate-200 rounded-xl outline-none"
                  value={editForm.condition || 'Operativo'}
                  onChange={(e) => setEditForm({ ...editForm, condition: e.target.value as any })}
                >
                  {CONDITION_OPTIONS.map(option => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  Estado
                </label>
                <select
                  className="w-full p-3 border border-slate-200 rounded-xl outline-none"
                  value={editForm.status || 'Disponible'}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value as any })}
                >
                  {STATUS_OPTIONS.map(option => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  Origen
                </label>
                <select
                  className="w-full p-3 border border-slate-200 rounded-xl outline-none"
                  value={editForm.originType || 'Compra'}
                  onChange={(e) => setEditForm({ ...editForm, originType: e.target.value as any })}
                >
                  {ORIGIN_OPTIONS.map(option => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  Fecha de ingreso
                </label>
                <input
                  type="date"
                  className="w-full p-3 border border-slate-200 rounded-xl outline-none"
                  value={editForm.entryDate || ''}
                  onChange={(e) => setEditForm({ ...editForm, entryDate: e.target.value })}
                />
              </div>

              {renderLocationFields(editForm, setEditForm)}

              <div className="md:col-span-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  Notas
                </label>
                <textarea
                  rows={3}
                  className="w-full p-3 border border-slate-200 rounded-xl outline-none resize-none"
                  value={editForm.notes || ''}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                />
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() => setItemToEdit(null)}
                className="px-6 py-3 rounded-xl bg-slate-100 text-slate-700 font-black uppercase text-[10px]"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-6 py-3 rounded-xl bg-blue-600 text-white font-black uppercase text-[10px] flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {itemToMove && moveAction && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[250] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-black text-slate-900 uppercase">{moveTitle}</h3>
              <button
                onClick={closeMoveModal}
                className="p-2 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                  Equipo seleccionado
                </p>
                <p className="font-black text-slate-900">{itemToMove.name}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {itemToMove.serialNumber || itemToMove.itemCode}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Disponibles en este registro: <span className="font-black text-slate-800">{itemToMove.quantity || 1}</span>
                </p>
              </div>

              {moveAction === 'assign' && (
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    Farmacia destino
                  </label>
                  <select
                    className="w-full p-3 border border-slate-200 rounded-xl outline-none"
                    value={moveForm.pharmacyId}
                    onChange={(e) => setMoveForm({ ...moveForm, pharmacyId: e.target.value })}
                  >
                    <option value="">Seleccione una farmacia...</option>
                    {pharmacies.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  Cantidad a mover
                </label>
                <input
                  type="number"
                  min={1}
                  max={itemToMove.quantity || 1}
                  className="w-full p-3 border border-slate-200 rounded-xl outline-none"
                  value={moveForm.quantity}
                  onChange={(e) =>
                    setMoveForm({
                      ...moveForm,
                      quantity: Math.max(1, Number(e.target.value || 1))
                    })
                  }
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  Notas
                </label>
                <textarea
                  rows={3}
                  className="w-full p-3 border border-slate-200 rounded-xl outline-none resize-none"
                  value={moveForm.notes}
                  onChange={(e) => setMoveForm({ ...moveForm, notes: e.target.value })}
                />
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={closeMoveModal}
                className="px-6 py-3 rounded-xl bg-slate-100 text-slate-700 font-black uppercase text-[10px]"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmMove}
                className={`px-6 py-3 rounded-xl text-white font-black uppercase text-[10px] flex items-center gap-2 ${
                  moveAction === 'assign'
                    ? 'bg-blue-600'
                    : moveAction === 'repair'
                    ? 'bg-orange-600'
                    : 'bg-red-600'
                }`}
              >
                {moveAction === 'assign' ? (
                  <Building2 className="w-4 h-4" />
                ) : moveAction === 'repair' ? (
                  <Wrench className="w-4 h-4" />
                ) : (
                  <ArchiveX className="w-4 h-4" />
                )}
                Confirmar
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
