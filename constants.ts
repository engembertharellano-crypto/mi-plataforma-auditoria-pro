
import { Pharmacy, HardwareItem, ProcessItem } from './types';

// Database initialized empty as per user request. 
// Users must add pharmacies manually via the app.
export const PHARMACIES: Pharmacy[] = [];

export const HARDWARE_CHECKLIST: HardwareItem[] = [
  // 1. ALARMAS Y DISPOSITIVOS
  { id: 'h1.1', category: '1. ALARMAS Y DISPOSITIVOS', name: 'Pulsadores anti robo', expected: 1 },
  { id: 'h1.2', category: '1. ALARMAS Y DISPOSITIVOS', name: 'Router para transmisión datos', expected: 1 },
  { id: 'h1.3', category: '1. ALARMAS Y DISPOSITIVOS', name: 'Sistema Protección Contra Incendios', expected: 1 },
  
  // 2. SISTEMAS CCTV
  { id: 'h2.1', category: '2. SISTEMAS CCTV', name: 'Dispositivos grabación (DVR/NVR) y periféricos', expected: 1 },
  { id: 'h2.2', category: '2. SISTEMAS CCTV', name: 'Monitores', expected: 1 },
  { id: 'h2.3', category: '2. SISTEMAS CCTV', name: 'Cámaras de misceláneos / OTC', expected: 0 },
  { id: 'h2.4', category: '2. SISTEMAS CCTV', name: 'Cámaras de farmacia (detrás línea cajas)', expected: 0 },
  { id: 'h2.5', category: '2. SISTEMAS CCTV', name: 'Cámaras de otras áreas', expected: 0 },

  // 3. CAJAS FUERTES
  { id: 'h3.1', category: '3. CAJAS FUERTES', name: 'Cajas de resguardo de efectivo', expected: 1 },

  // 4. ACCESOS Y PROTECTORES
  { id: 'h4.1', category: '4. ACCESOS Y PROTECTORES', name: 'Santa Maria', expected: 1 },
  { id: 'h4.2', category: '4. ACCESOS Y PROTECTORES', name: 'Puertas de entrada', expected: 1 },
  { id: 'h4.3', category: '4. ACCESOS Y PROTECTORES', name: 'Ventanas de turno', expected: 1 },
  { id: 'h4.4', category: '4. ACCESOS Y PROTECTORES', name: 'Candados para Santa Maria', expected: 2 },
  { id: 'h4.5', category: '4. ACCESOS Y PROTECTORES', name: 'Llaves para bajar santa marías', expected: 3 },
  { id: 'h4.6', category: '4. ACCESOS Y PROTECTORES', name: 'Manilla para bajar santa marías', expected: 1 },
  { id: 'h4.7', category: '4. ACCESOS Y PROTECTORES', name: 'Llaves para puertas de acceso', expected: 0 },
  { id: 'h4.8', category: '4. ACCESOS Y PROTECTORES', name: 'Candados para puertas de acceso', expected: 0 },

  // 5. OTROS
  { id: 'h5.1', category: '5. OTROS', name: 'Lamparas iluminación periferia', expected: 4 },
  { id: 'h5.2', category: '5. OTROS', name: 'Espejos Convexos', expected: 2 },
];

export const PROCESS_CHECKLIST: ProcessItem[] = [
  // 1. CAJA
  { id: 'p1.1', category: '1. CAJA (10%)', text: 'Retiro de dinero cajas (solo $) para fondo aprobado.', verification: 'CCTV/Presencial' },
  { id: 'p1.2', category: '1. CAJA (10%)', text: 'Gerente/Senior verifica cuadre presencia empleado, firma conformidad.', verification: 'Libro/CCTV' },

  // 2. ADMINISTRATIVO
  { id: 'p2.1', category: '2. ADMINISTRATIVO (25%)', text: 'Cierre control efectivo y reporte ingresos diario.', verification: 'Validar telefonicamente' },
  { id: 'p2.2', category: '2. ADMINISTRATIVO (25%)', text: 'Entrega control efectivo entre Gerente y Senior.', verification: 'Presencial' },
  { id: 'p2.3', category: '2. ADMINISTRATIVO (25%)', text: 'Registro y soporte faltantes/sobrantes caja firmado.', verification: 'Carpeta Arqueo' },
  { id: 'p2.4', category: '2. ADMINISTRATIVO (25%)', text: 'Control de devoluciones autorizadas por Gerente.', verification: 'Carpeta/CCTV' },
  { id: 'p2.5', category: '2. ADMINISTRATIVO (25%)', text: 'Control de transacciones canceladas (anulaciones).', verification: 'Sistema' },
  { id: 'p2.6', category: '2. ADMINISTRATIVO (25%)', text: 'Dinero resguardado lugares seguros (Caja llave paso).', verification: 'Presencial' },
  { id: 'p2.7', category: '2. ADMINISTRATIVO (25%)', text: 'Remesa de efectivo en zonas previstas.', verification: 'CCTV' },

  // 3. INVENTARIO
  { id: 'p3.1', category: '3. INVENTARIO (50%)', text: 'Mercancía proveedores recibida adecuadamente.', verification: 'CCTV/Presencial' },
  { id: 'p3.2', category: '3. INVENTARIO (50%)', text: 'Discrepancias (sobrantes/faltantes) reclamo generado.', verification: 'Reporte Ajuste' },
  { id: 'p3.3', category: '3. INVENTARIO (50%)', text: 'Control registro productos dañados/usados.', verification: 'Registro Físico' },
  { id: 'p3.4', category: '3. INVENTARIO (50%)', text: 'Proveedores sin libre acceso a áreas internas.', verification: 'CCTV/Sitio' },

  // 4. PREVENCION
  { id: 'p4.1', category: '4. PREVENCIÓN (15%)', text: 'Revisión pertenencias personal al salir.', verification: 'CCTV' },
  { id: 'p4.2', category: '4. PREVENCIÓN (15%)', text: 'Revisión aleatoria bolsas de basura.', verification: 'CCTV' },
  { id: 'p4.3', category: '4. PREVENCIÓN (15%)', text: 'Llaves entregadas a APV nocturno en sobre sellado.', verification: 'Presencial' },
  { id: 'p4.4', category: '4. PREVENCIÓN (15%)', text: 'Vigilantes cumplen actividades/puestos.', verification: 'Libro/CCTV' },
  { id: 'p4.5', category: '4. PREVENCIÓN (15%)', text: 'Apertura/Cierre realizado por personal autorizado (no APV).', verification: 'CCTV' },
];
