import React, { useMemo, useState } from 'react';
import { Plus, Search, Package, Warehouse, Wrench, ArrowRightLeft, ShieldCheck } from 'lucide-react';
import { Pharmacy, TechnicalInventoryItem, TechnicalInventoryMovement } from '../types';

interface TechnicalInventoryProps {
  pharmacies: Pharmacy[];
  items: TechnicalInventoryItem[];
  movements: TechnicalInventoryMovement[];
  onAddItem: (item: TechnicalInventoryItem) => void;
}

const TechnicalInventory: React.FC<TechnicalInventoryProps> = ({
  pharmacies,
  items,
  movements,
  onAddItem
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);

  const [formData, setFormData] = useState<Partial<TechnicalInventoryItem>>({
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
    entryDate: new Date().toLocaleDateString('sv-SE'),
    currentLocationType: 'Almacen',
    currentLocationName: 'Almacén Principal',
    notes: ''
  });

  const filteredItems = use
