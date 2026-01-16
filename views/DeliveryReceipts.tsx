
import React, { useState, useRef } from 'react';
import { 
  PackageCheck, 
  Plus, 
  Search, 
  Trash2, 
  Download, 
  Loader2, 
  X,
  User,
  MapPin,
  Calendar,
  Box,
  ArrowRight,
  ShieldCheck,
  FileText
} from 'lucide-react';
import { DeliveryReceipt, ReceiptItem } from '../types';

interface DeliveryReceiptsProps {
  receipts: DeliveryReceipt[];
  onAdd: (receipt: DeliveryReceipt) => void;
  onDelete: (id: string) => void;
}

const DeliveryReceipts: React.FC<DeliveryReceiptsProps> = ({ receipts, onAdd, onDelete }) => {
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewingReceipt, setViewingReceipt] = useState<DeliveryReceipt | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    deliveredBy: '',
    deliveredByRole: '',
    receivedBy: '',
    receivedByRole: '',
    location: '',
    reason: '',
    origin: '',
    destination: '',
    notes: '',
    date: new Date().toISOString().split('T')[0]
  });

  const [items, setItems] = useState<ReceiptItem[]>([{ description: '', quantity: 1, serial: '' }]);

  const handleAddItem = () => setItems([...items, { description: '', quantity: 1, serial: '' }]);
  const handleRemoveItem = (index: number) => { if (items.length > 1) { const newItems = [...items]; newItems.splice(index, 1); setItems(newItems); } };
  const handleItemChange = (index: number, field: keyof ReceiptItem, value: any) => { const newItems = [...items]; newItems[index] = { ...newItems[index], [field]: value }; setItems(newItems); };

  const handleSave = () => {
    if (!formData.deliveredBy || !formData.receivedBy || !formData.destination || !formData.reason) { alert("Por favor complete los campos obligatorios."); return; }
    const validItems = items.filter(i => i.description.trim() !== ''); if (validItems.length === 0) { alert("Debe agregar al menos un ítem."); return; }
    let year = '00'; let month = '00'; if (formData.date) { const parts = formData.date.split('-'); if (parts.length === 3) { year = parts[0].slice(-2); month = parts[1]; } }
    const prefix = `${year}${month}`;
    const existingInMonth = receipts.filter(r => r.controlNumber && r.controlNumber.startsWith(prefix));
    let maxSeq = 0; existingInMonth.forEach(r => { const suffix = r.controlNumber ? r.controlNumber.slice(4) : '0'; const seq = parseInt(suffix, 10); if (!isNaN(seq) && seq > maxSeq) maxSeq = seq; });
    const controlNum = `${prefix}${(maxSeq + 1).toString().padStart(2, '0')}`;
    onAdd({ id: `receipt-${Date.now()}`, controlNumber: controlNum, ...formData, items: validItems });
    setShowModal(false);
    setFormData({ deliveredBy: '', deliveredByRole: '', receivedBy: '', receivedByRole: '', location: '', reason: '', origin: '', destination: '', notes: '', date: new Date().toISOString().split('T')[0] });
    setItems([{ description: '', quantity: 1, serial: '' }]);
  };

  const confirmDelete = () => { if (deleteConfirmation) { onDelete(deleteConfirmation); setDeleteConfirmation(null); } };
  
  const handleDownload = async (receiptId: string) => {
    const element = document.getElementById(`receipt-preview-${receiptId}`); if (!element) return;
    setIsGenerating(true); 
    try { 
      const html2canvas = (window as any).html2canvas; 
      const canvas = await html2canvas(element, { 
        scale: 2, 
        useCORS: true, 
        backgroundColor: '#ffffff'
      }); 
      canvas.toBlob((blob: Blob) => { 
        if (blob) { 
          const url = URL.createObjectURL(blob); 
          const link = document.createElement('a'); 
          link.href = url; 
          link.download = `Acta_Entrega_${receiptId}.png`; 
          link.click(); 
          URL.revokeObjectURL(url); 
        } 
      }); 
    } catch (err) { 
      console.error(err); 
    } finally { 
      setIsGenerating(false); 
    }
  };

  const filteredReceipts = receipts.filter(r => r.deliveredBy.toLowerCase().includes(searchTerm.toLowerCase()) || r.receivedBy.toLowerCase().includes(searchTerm.toLowerCase()) || r.destination.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="max-w-7xl mx-auto p-10 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 mb-16">
        <div>
          <h2 className="text-5xl font-black text-white tracking-tighter drop-shadow-2xl uppercase">Actas</h2>
          <p className="text-slate-300 mt-2 font-bold uppercase tracking-[0.25em] text-xs">Gestión de Traslado de Equipos</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-orange-600 hover:bg-orange-500 text-white px-10 py-5 rounded-[2rem] font-black uppercase tracking-[0.25em] text-[10px] flex items-center gap-3 shadow-3xl shadow-orange-600/30 transition-all transform hover:-translate-y-1"
        >
          <Plus className="w-5 h-5" /> Nueva Entrega
        </button>
      </div>

      <div className="mb-12 relative group max-w-2xl">
        <Search className="w-6 h-6 absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-orange-500 transition-colors" />
        <input 
          type="text" 
          placeholder="Filtrar por responsable o sede..."
          className="w-full pl-16 pr-8 py-5 border-2 border-white/10 rounded-[2.5rem] outline-none focus:border-orange-500/50 bg-white/5 backdrop-blur-xl shadow-2xl text-white font-bold placeholder:text-white/20"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {filteredReceipts.map(receipt => (
          <div key={receipt.id} className="bg-white rounded-[3rem] p-10 border border-white shadow-3xl transition-all group flex flex-col hover:-translate-y-2">
             <div className="flex justify-between items-start mb-8">
                <div className="p-4 bg-orange-50 rounded-[1.5rem] text-orange-600 shadow-inner">
                   <PackageCheck className="w-8 h-8" />
                </div>
                <div className="text-right">
                   <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">Registro Nº</p>
                   <p className="font-black text-slate-800 font-mono text-xl">{receipt.controlNumber}</p>
                </div>
             </div>
             <div className="flex-1 space-y-6 mb-10">
                <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-2"><MapPin className="w-3 h-3" /> Destino</p>
                   <p className="font-black text-slate-800 text-lg leading-tight">{receipt.destination}</p>
                </div>
                <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-2"><User className="w-3 h-3" /> Recibe</p>
                   <p className="font-bold text-slate-700 text-sm truncate bg-slate-50 px-4 py-2 rounded-xl">{receipt.receivedBy}</p>
                </div>
                <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Resumen de Carga</p>
                   <div className="flex flex-wrap gap-2">
                      {receipt.items.slice(0, 3).map((item, idx) => (
                        <span key={idx} className="bg-slate-50 text-slate-500 px-3 py-1.5 rounded-lg font-black text-[9px] border border-slate-100 uppercase">{item.quantity}x {item.description.split(' ')[0]}</span>
                      ))}
                      {receipt.items.length > 3 && <span className="bg-orange-50 text-orange-600 px-3 py-1.5 rounded-lg font-black text-[9px] border border-orange-100 uppercase">+{receipt.items.length - 3} Ítems</span>}
                   </div>
                </div>
             </div>
             <div className="flex gap-3 pt-8 border-t border-slate-50">
                <button 
                  onClick={() => setViewingReceipt(receipt)}
                  className="flex-1 py-4 rounded-2xl bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl"
                >
                  Abrir Acta
                </button>
                <button 
                  onClick={() => setDeleteConfirmation(receipt.id)}
                  className="p-4 rounded-2xl bg-red-50 text-red-200 hover:text-red-600 hover:bg-red-100 transition-all"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
             </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-[3.5rem] w-full max-w-4xl shadow-3xl flex flex-col max-h-[90vh] overflow-hidden">
             <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-4">
                   <div className="p-3 bg-orange-600 rounded-2xl text-white shadow-xl">
                     <PackageCheck className="w-7 h-7" />
                   </div>
                   <h3 className="text-3xl font-black text-slate-800 tracking-tighter uppercase">Generar Acta</h3>
                </div>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white rounded-full text-slate-300 hover:text-slate-600"><X className="w-7 h-7" /></button>
             </div>
             <div className="p-12 overflow-y-auto flex-1 space-y-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                   <div className="space-y-6">
                      <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.25em] border-b pb-4">Contexto Logístico</h4>
                      <div><label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Fecha</label><input type="date" className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl font-bold outline-none" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} /></div>
                      <div><label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Sede Activa</label><input type="text" className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl font-bold outline-none" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} /></div>
                      <div><label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Motivo Traslado</label><input type="text" className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl font-bold outline-none" value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} /></div>
                      <div className="flex gap-4"><div className="flex-1"><label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Origen</label><input type="text" className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl font-bold outline-none" value={formData.origin} onChange={e => setFormData({...formData, origin: e.target.value})} /></div><div className="flex-1"><label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Destino</label><input type="text" className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl font-bold outline-none" value={formData.destination} onChange={e => setFormData({...formData, destination: e.target.value})} /></div></div>
                   </div>
                   <div className="space-y-6">
                      <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.25em] border-b pb-4">Personal Involucrado</h4>
                      <div className="bg-slate-50/50 p-6 rounded-[2rem] border-2 border-slate-100/50"><label className="block text-[9px] font-black text-slate-500 uppercase mb-4 tracking-widest">Entregado Por</label><input type="text" className="w-full p-3 bg-white border-2 border-slate-200 rounded-xl mb-3 text-sm font-bold" placeholder="Nombre completo" value={formData.deliveredBy} onChange={e => setFormData({...formData, deliveredBy: e.target.value})} /><input type="text" className="w-full p-3 bg-white/50 border-2 border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest" placeholder="Cargo / Departamento" value={formData.deliveredByRole} onChange={e => setFormData({...formData, deliveredByRole: e.target.value})} /></div>
                      <div className="bg-slate-50/50 p-6 rounded-[2rem] border-2 border-slate-100/50"><label className="block text-[9px] font-black text-slate-500 uppercase mb-4 tracking-widest">Recibido Por</label><input type="text" className="w-full p-3 bg-white border-2 border-slate-200 rounded-xl mb-3 text-sm font-bold" placeholder="Nombre completo" value={formData.receivedBy} onChange={e => setFormData({...formData, receivedBy: e.target.value})} /><input type="text" className="w-full p-3 bg-white/50 border-2 border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest" placeholder="Cargo / Departamento" value={formData.receivedByRole} onChange={e => setFormData({...formData, receivedByRole: e.target.value})} /></div>
                   </div>
                </div>
                <div>
                   <div className="flex justify-between items-center border-b pb-4 mb-6"><h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.25em]">Relación de Equipos</h4><button onClick={handleAddItem} className="text-[10px] font-black text-orange-600 uppercase tracking-widest bg-orange-50 px-4 py-2 rounded-lg">+ Añadir Ítem</button></div>
                   <div className="space-y-4">{items.map((item, idx) => (<div key={idx} className="flex gap-4 items-center bg-slate-50/50 p-4 rounded-2xl border-2 border-slate-100/50"><div className="w-20"><input type="number" min="1" className="w-full p-3 bg-white border-2 border-slate-100 rounded-xl text-center font-black" value={item.quantity} onChange={(e) => handleItemChange(idx, 'quantity', parseInt(e.target.value))} /></div><div className="flex-1"><input type="text" className="w-full p-3 bg-white border-2 border-slate-100 rounded-xl font-bold" placeholder="Descripción del equipo" value={item.description} onChange={(e) => handleItemChange(idx, 'description', e.target.value)} /></div><div className="w-1/3"><input type="text" className="w-full p-3 bg-white border-2 border-slate-100 rounded-xl font-medium" placeholder="Serial / Obs." value={item.serial} onChange={(e) => handleItemChange(idx, 'serial', e.target.value)} /></div><button onClick={() => handleRemoveItem(idx)} className="p-3 text-slate-300 hover:text-red-500 transition-colors"><Trash2 className="w-5 h-5" /></button></div>))}</div>
                </div>
                <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Notas Finales</label><textarea className="w-full p-6 bg-slate-50 border-2 border-slate-50 rounded-[2rem] h-32 resize-none font-medium text-slate-600" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} /></div>
             </div>
             <div className="p-12 border-t border-slate-100 flex justify-end gap-6 bg-slate-50/50 rounded-b-[3.5rem]"><button onClick={() => setShowModal(false)} className="px-10 py-5 rounded-2xl font-black text-slate-400 uppercase tracking-widest text-[10px] hover:text-slate-600 transition-all">Cancelar</button><button onClick={handleSave} className="bg-slate-900 text-white px-12 py-5 rounded-2xl font-black uppercase tracking-[0.25em] text-[10px] shadow-2xl hover:bg-slate-800 transition-all">Formalizar Acta</button></div>
          </div>
        </div>
      )}

      {viewingReceipt && (
        <div className="fixed inset-0 bg-slate-950 z-[60] flex flex-col">
           <div className="w-full px-8 py-6 flex justify-between items-center text-white bg-slate-900 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-4">
                 <div className="p-2 bg-orange-600 rounded-xl"><FileText className="w-6 h-6" /></div>
                 <div>
                    <h3 className="font-black uppercase tracking-widest text-xs">Visor de Acta de Entrega</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Nº CONTROL: {viewingReceipt.controlNumber}</p>
                 </div>
              </div>
              <div className="flex items-center gap-4">
                 <button onClick={() => handleDownload(viewingReceipt.id)} disabled={isGenerating} className="bg-white text-slate-900 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-orange-50 transition-all shadow-xl">
                   {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Descargar Imagen
                 </button>
                 <button onClick={() => setViewingReceipt(null)} className="p-3 bg-white/10 rounded-full hover:bg-white/20 transition-all">
                   <X className="w-6 h-6" />
                 </button>
              </div>
           </div>

           <div className="flex-1 overflow-y-auto p-10 flex justify-center items-start bg-slate-900">
              <div id={`receipt-preview-${viewingReceipt.id}`} className="bg-white p-16 w-full max-w-[850px] min-h-[1100px] text-slate-900 font-sans border-2 border-white flex flex-col">
                 <div className="flex justify-between items-start border-b-8 border-slate-900 pb-10 mb-12">
                    <div className="flex items-center gap-6">
                       <div className="bg-orange-600 text-white p-5 rounded-[1.5rem]"><ShieldCheck className="w-14 h-14" /></div>
                       <div><h1 className="text-4xl font-black text-slate-900 tracking-tighter leading-none uppercase">XANA</h1><p className="text-[10px] font-black tracking-[0.5em] text-slate-400 uppercase mt-2">Security Audit</p></div>
                    </div>
                    <div className="text-right">
                       <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Acta de Entrega</h2>
                       <p className="text-sm font-black text-orange-600 mt-2 uppercase tracking-widest border-t-2 border-orange-500 pt-2 inline-block">Control: {viewingReceipt.controlNumber}</p>
                    </div>
                 </div>

                 <div className="grid grid-cols-3 gap-0 mb-12 border-2 border-slate-100 rounded-[2rem] overflow-hidden">
                    <div className="bg-slate-50 p-8 border-r border-slate-100">
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Fecha de Emisión</p>
                       <p className="font-black text-slate-800 text-lg">{viewingReceipt.date}</p>
                    </div>
                    <div className="bg-slate-50 p-8 border-r border-slate-100 text-center">
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Propósito</p>
                       <p className="font-black text-slate-800 text-lg uppercase">{viewingReceipt.reason}</p>
                    </div>
                    <div className="bg-slate-50 p-8 text-right">
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Localidad</p>
                       <p className="font-black text-slate-800 text-lg uppercase">{viewingReceipt.location}</p>
                    </div>
                 </div>

                 <div className="flex items-center gap-6 mb-16">
                    <div className="flex-1 p-6 border-2 border-slate-100 rounded-[1.5rem] relative bg-white"><p className="text-[9px] font-black text-slate-300 uppercase absolute -top-2.5 left-6 bg-white px-2 tracking-widest">Origen</p><div className="flex items-center gap-4"><MapPin className="w-6 h-6 text-orange-500" /><span className="font-black text-xl text-slate-800 uppercase tracking-tighter">{viewingReceipt.origin || 'No indicado'}</span></div></div>
                    <ArrowRight className="w-8 h-8 text-slate-200" />
                    <div className="flex-1 p-6 border-2 border-slate-100 rounded-[1.5rem] relative bg-white"><p className="text-[9px] font-black text-slate-300 uppercase absolute -top-2.5 left-6 bg-white px-2 tracking-widest">Destino</p><div className="flex items-center gap-4"><MapPin className="w-6 h-6 text-blue-500" /><span className="font-black text-xl text-slate-800 uppercase tracking-tighter">{viewingReceipt.destination}</span></div></div>
                 </div>

                 <div className="mb-16">
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.4em] border-b-4 border-slate-900 pb-3 mb-8">Manifiesto de Carga</h3>
                    <table className="w-full">
                       <thead><tr className="bg-slate-100 text-slate-500 uppercase text-[10px] font-black tracking-widest"><th className="py-4 px-6 text-center">Ctd.</th><th className="py-4 px-6 text-left">Especificación del Bien</th><th className="py-4 px-6 text-left">Codificación / Serial</th></tr></thead>
                       <tbody className="divide-y-2 divide-slate-50">
                          {viewingReceipt.items.map((item, idx) => (<tr key={idx}><td className="py-6 px-6 text-center font-black text-slate-800 text-lg bg-slate-50/30">{item.quantity}</td><td className="py-6 px-6 font-bold text-slate-700 uppercase text-sm">{item.description}</td><td className="py-6 px-6 text-slate-500 font-mono text-xs font-bold">{item.serial || '---'}</td></tr>))}
                       </tbody>
                    </table>
                 </div>

                 {viewingReceipt.notes && <div className="mb-16 bg-slate-50 p-8 rounded-[2rem] border-2 border-slate-100 text-sm italic text-slate-600 font-medium"><strong>Nota:</strong> {viewingReceipt.notes}</div>}

                 <div className="grid grid-cols-2 gap-20 mt-auto pt-10">
                    <div className="text-center">
                       <div className="h-24 border-b-2 border-slate-200 mb-6"></div>
                       <p className="font-black text-slate-900 text-sm uppercase tracking-widest">{viewingReceipt.deliveredBy}</p>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{viewingReceipt.deliveredByRole || 'Cédula / Firma'}</p>
                       <p className="text-[9px] text-orange-600 font-black uppercase mt-4 tracking-[0.3em]">Entregado Por</p>
                    </div>
                    <div className="text-center">
                       <div className="h-24 border-b-2 border-slate-200 mb-6"></div>
                       <p className="font-black text-slate-900 text-sm uppercase tracking-widest">{viewingReceipt.receivedBy}</p>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{viewingReceipt.receivedByRole || 'Cédula / Firma'}</p>
                       <p className="text-[9px] text-blue-600 font-black uppercase mt-4 tracking-[0.3em]">Recibido Por</p>
                    </div>
                 </div>

                 <div className="mt-12 text-center">
                    <p className="text-[9px] text-slate-300 font-black uppercase tracking-[0.6em]">Documento Oficial XANA Security Systems</p>
                 </div>
              </div>
           </div>
        </div>
      )}

      {deleteConfirmation && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md p-10 shadow-2xl animate-in zoom-in-95 duration-200 text-center border border-white/20">
             <div className="w-20 h-20 bg-red-100 rounded-[2rem] flex items-center justify-center mb-6 mx-auto text-red-600 shadow-inner">
                <Trash2 className="w-10 h-10" />
             </div>
             <h3 className="text-3xl font-black text-slate-900 tracking-tighter mb-3">¿Eliminar Acta?</h3>
             <p className="text-slate-500 font-medium mb-10">¿Estás seguro de eliminar este registro de traslado? Esta acción no se puede deshacer.</p>
             
             <div className="flex gap-4">
                <button 
                  onClick={() => setDeleteConfirmation(null)}
                  className="flex-1 py-4 rounded-2xl border-2 border-slate-100 text-slate-500 font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 transition-all"
                >
                  Regresar
                </button>
                <button 
                  onClick={confirmDelete}
                  className="flex-1 py-4 rounded-2xl bg-red-600 text-white font-black uppercase tracking-widest text-[10px] shadow-xl shadow-red-200 transition-all transform active:scale-95"
                >
                  Confirmar
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryReceipts;
