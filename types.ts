export type ViewName = 'dashboard' | 'ai-assistant' | 'audit-wizard' | 'new-visit' | 'audit-results' | 'cctv-inventory' | 'physical-inventory' | 'pending-tasks' | 'pharmacy-list' | 'visit-log' | 'monthly-summary' | 'management-report' | 'staff-directory' | 'support-directory' | 'delivery-receipts' | 'settings' | 'access-management' | 'asset-control' | 'case-management' | 'technical-inventory';

export interface Pharmacy {
  id: string;
  name: string;
  address: string;
  zone?: string;
  status?: string;
  risk?: 'Bajo' | 'Moderado' | 'Medio' | 'Alto' | 'Extremo';
  corporatePhone?: string;
  photo?: string;
  location?: {
    lat: number;
    lng: number;
  } | null;
  hasSecurityOfficer?: boolean;
  activa?: boolean;
  operativa?: boolean;
}

export interface HardwareItem {
  id: string;
  category: string;
  name: string;
  expected: number;
}

export interface ProcessItem {
  id: string;
  category: string;
  text: string;
  verification: string;
}

export type HardwareStatus = 'Operativo' | 'Inactivo' | 'N/A';

export interface VaultCount {
  ves: {
    system: number;
    physical: number;
    difference: number;
  };
  usd: {
    system: number;
    physical: number;
    difference: number;
  };
  responsiblePerson: string;
  notes: string;
}

export interface AuditState {
  id?: string;
  pharmacyId?: string;
  step: number;
  pharmacy: Pharmacy | null;
  inCharge: {
    nombre: string;
    apellido: string;
    cargo: string;
  };
  hardwareAnswers: Record<string, {
    quantity: number;
    status: HardwareStatus | undefined;
    notes: string;
  }>;
  processAnswers: Record<string, {
    status: 'SI' | 'NO' | 'N/A' | undefined;
    notes: string;
  }>;
  vaultCount?: VaultCount;
  customerServiceRating: 'Bajo' | 'Medio' | 'Alto' | null;
  date?: string;
  score?: number;
  reportText?: string;
  createdBy?: string;
  reportLocked?: boolean;
  photos?: string[];
}

export interface CCTVInventoryRecord {
  id: string;
  pharmacyId: string;
  date: string;
  equipment: {
    recorderType: string;
    dvrQuantity: number;
    dvrStatus: string;
    hddStatus: string;
    daysRecording: number;
    remoteStatus: 'Conectado' | 'Desconectado';
    upsStatus: 'Operativo' | 'Dañado' | 'No Posee';
    rackStatus: 'Ordenado' | 'Desordenado' | 'No Posee';
    monitorStatus: string;
    mouseStatus: string;
  };
  cameras: {
    analogTotal: number;
    analogOperative: number;
    analogDamaged: number;
    ipTotal: number;
    ipOperative: number;
  };
  alarm: {
    hasAlarm: boolean;
    status: string;
  };
  notes: string;
  createdBy?: string;
}

export interface PhysicalInventoryRecord {
  id: string;
  pharmacyId: string;
  date: string;
  santamarias: {
    required: number;
    good: number;
  };
  candados: {
    required: number;
    good: number;
  };
  espejos: {
    required: number;
    good: number;
  };
  iluminacion: {
    required: number;
    good: number;
  };
  notes: string;
  createdBy?: string;
}

export interface ManagementVisitRecord {
  id: string;
  pharmacyId: string;
  date: string;
  type: 'Gestión' | 'Reunión' | 'Incidente' | 'Investigación' | 'Otra';
  notes: string;
  createdBy?: string;
}

export interface PendingRecord {
  id: string;
  pharmacyId?: string;
  customLocation?: string;
  date: string;
  actionDate?: string;
  title: string;
  description: string;
  priority: 'Alta' | 'Media' | 'Baja';
  status: 'Pendiente' | 'En Proceso' | 'Solventado';
  createdBy?: string;
}

export interface StaffRecord {
  id: string;
  pharmacyId: string;
  fullName: string;
  role: string;
  phone?: string;
}

export interface SupportRecord {
  id: string;
  pharmacyId: string;
  category: string;
  institutionName: string;
  phone: string;
}

export interface ReceiptItem {
  description: string;
  quantity: number;
  serial: string;
}

export interface DeliveryReceipt {
  id: string;
  controlNumber: string;
  deliveredBy: string;
  deliveredByRole: string;
  receivedBy: string;
  receivedByRole: string;
  location: string;
  reason: string;
  origin: string;
  destination: string;
  notes: string;
  date: string;
  items: ReceiptItem[];
  createdBy?: string;
}

export interface ScheduleEntry {
  id: string;
  date: string;
  title: string;
  description: string;
  pharmacyId?: string | null;
  type: string;
  priority: 'Alta' | 'Media' | 'Baja';
  isFromAI: boolean;
  createdBy?: string;
}

export interface BriefingData {
  date: string;
  content: string;
  summaryStats: {
    todayTasks: number;
    highRiskPharmacies: number;
    pendingCount: number;
  };
}

export interface AssetComponent {
  id: string;
  name: string;
  quantity: number;
}

export interface Asset {
  id: string;
  name: string;
  category: 'Llaves' | 'Equipos' | 'Tokens' | 'Otros';
  description: string;
  pharmacyId?: string;
  status: 'Disponible' | 'Prestado' | 'Mantenimiento' | 'Extraviado';
  components: AssetComponent[];
  photo?: string;
  createdAt: string;
}

export interface AssetLoan {
  id: string;
  assetId: string;
  borrowerName: string;
  department: 'Operaciones' | 'Hábitat y Diseño' | 'TI' | 'Mantenimiento' | 'Ventas' | 'Otros';
  loanDate: string;
  expectedReturnDate: string;
  actualReturnDate?: string;
  status: 'Activo' | 'Devuelto' | 'Retrasado';
  notes: string;
  createdBy?: string;
  lentComponents: AssetComponent[];
  loanPhoto?: string;
}

export interface CaseTimelineEntry {
  id: string;
  date: string;
  note: string;
  author: string;
}

export interface CaseRecord {
  id: string;
  officialId?: string;
  status: 'Abierto' | 'En Proceso' | 'Cerrado';
  priority: 'Alta' | 'Media' | 'Baja';
  date: string;
  reporterName: string;
  channel: 'Llamada' | 'WhatsApp' | 'Correo' | 'Verbal' | 'Sistema';
  locationType: 'Farmacia' | 'Corporativo' | 'CEDIS' | 'Otro';
  locationName: string;
  pharmacyId?: string;
  title: string;
  description: string;
  timeline: CaseTimelineEntry[];
  conclusion?: string;
  closedDate?: string;
  createdBy: string;
}

// =====================================
// INVENTARIO TÉCNICO
// =====================================

export type InventoryCategory =
  | 'Camara'
  | 'DVR'
  | 'NVR'
  | 'Disco'
  | 'Monitor'
  | 'UPS'
  | 'Router'
  | 'Switch'
  | 'Biometrico'
  | 'Accesorio'
  | 'Otro';

export type InventoryCondition =
  | 'Nuevo'
  | 'Operativo'
  | 'Usado'
  | 'Dañado'
  | 'Reparacion'
  | 'Baja';

export type InventoryStatus =
  | 'Disponible'
  | 'Asignado'
  | 'Almacen'
  | 'Transito'
  | 'Reparacion'
  | 'Descartado';

export type InventoryOrigin =
  | 'Compra'
  | 'Desinstalacion'
  | 'Traslado'
  | 'Recuperacion';

export type InventoryUnitType =
  | 'Unidad'
  | 'Lote';

export interface TechnicalInventoryItem {
  id: string;
  itemCode?: string;
  name: string;
  category: InventoryCategory;
  brand?: string;
  model?: string;
  serialNumber?: string;
  quantity: number;
  unitType: InventoryUnitType;
  condition: InventoryCondition;
  status: InventoryStatus;
  originType: InventoryOrigin;
  originReference?: string;
  entryDate: string;
  currentLocationType?: string;
  currentLocationId?: string;
  currentLocationName?: string;
  assignedTo?: string;
  notes?: string;
  createdBy?: string;
}

// =====================================
// MOVIMIENTOS DE INVENTARIO
// =====================================

export type InventoryMovementType =
  | 'Ingreso'
  | 'Asignacion'
  | 'Traslado'
  | 'Devolucion'
  | 'Reparacion'
  | 'Baja'
  | 'Ajuste';

export interface TechnicalInventoryMovement {
  id: string;
  inventoryItemId: string;
  movementType: InventoryMovementType;
  date: string;
  fromLocationType?: string;
  fromLocationId?: string;
  fromLocationName?: string;
  toLocationType?: string;
  toLocationId?: string;
  toLocationName?: string;
  quantity: number;
  reason?: string;
  notes?: string;
  createdBy?: string;
}
