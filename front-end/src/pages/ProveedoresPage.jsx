import { useState, useEffect } from 'react';
import axios from 'axios';
import { Truck, Phone, Mail, MapPin, Search, Plus, X, List, ExternalLink, Calendar, Package, Edit2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { CardSkeleton } from '../components/Skeleton.jsx';

const ProveedoresPage = () => {
  const [proveedores, setProveedores] = useState([]);
  const [compras, setCompras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetalleOpen, setIsDetalleOpen] = useState(false);
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState(null);
  const [modalMode, setModalMode] = useState('crear'); // crear, editar
  const [editId, setEditId] = useState(null);
  
  const [nuevoProveedor, setNuevoProveedor] = useState({
    nombreEmpresa: '',
    contacto: '',
    email: '',
    telefono: '',
    direccion: '',
    categoriaSuministro: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [provRes, compRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/api/proveedores`),
        axios.get(`${import.meta.env.VITE_API_URL}/api/compras`)
      ]);
      setProveedores(provRes.data);
      setCompras(compRes.data);
    } catch (error) {
      console.error("Error cargando proveedores:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleGuardarProveedor = async (e) => {
    e.preventDefault();
    try {
      if (modalMode === 'crear') {
        await axios.post(`${import.meta.env.VITE_API_URL}/api/proveedores`, nuevoProveedor);
        toast.success("Proveedor registrado con éxito. 🎀");
      } else {
        await axios.put(`${import.meta.env.VITE_API_URL}/api/proveedores/${editId}`, nuevoProveedor);
        toast.success("Proveedor actualizado con éxito. 📝");
      }
      fetchData();
      setIsModalOpen(false);
      setNuevoProveedor({ nombreEmpresa: '', contacto: '', email: '', telefono: '', direccion: '', categoriaSuministro: '' });
    } catch (error) {
      console.error(error);
      toast.error("Error al guardar proveedor.");
    }
  };

  const handleEliminarProveedor = async (id) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar este proveedor? Esto no borrará sus compras pasadas pero ya no aparecerá en la lista.")) {
      try {
        await axios.delete(`${import.meta.env.VITE_API_URL}/api/proveedores/${id}`);
        fetchData();
        toast.success("Proveedor eliminado. 🗑️");
      } catch (error) {
        console.error(error);
        toast.error("Error al eliminar el proveedor.");
      }
    }
  };

  const abrirModalCrear = () => {
    setModalMode('crear');
    setEditId(null);
    setNuevoProveedor({ nombreEmpresa: '', contacto: '', email: '', telefono: '', direccion: '', categoriaSuministro: '' });
    setIsModalOpen(true);
  };

  const abrirModalEditar = (p) => {
    setModalMode('editar');
    setEditId(p._id);
    setNuevoProveedor({
      nombreEmpresa: p.nombreEmpresa || p.nombre || '',
      contacto: p.contacto || '',
      email: p.email || '',
      telefono: p.telefono || '',
      direccion: p.direccion || '',
      categoriaSuministro: p.categoriaSuministro || ''
    });
    setIsModalOpen(true);
  };

  const verDetalleCompras = (proveedor) => {
    const susCompras = compras.filter(c => c.proveedor === proveedor._id || (c.proveedor?._id === proveedor._id));
    setProveedorSeleccionado({ ...proveedor, compras: susCompras });
    setIsDetalleOpen(true);
  };

  const proveedoresFiltrados = proveedores.filter(p => 
    (p.nombreEmpresa || p.nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.contacto || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // if (loading && proveedores.length === 0) return ...;

  return (
    <div className="flex-1 flex flex-col p-6 bg-slate-50">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
            <Truck className="text-kitty-pink" size={36} /> Directorio de Proveedores
          </h1>
          <p className="text-slate-500 font-medium">Gestión y control de suministros para Rosestore</p>
        </div>
        <button onClick={abrirModalCrear} className="kitty-button flex items-center gap-2">
          <Plus size={20} /> Registrar Proveedor
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-pink-100 mb-8 flex items-center">
        <Search className="text-pink-300 mr-3" />
        <input 
          type="text" 
          placeholder="Buscar por empresa o contacto..." 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 bg-transparent outline-none text-slate-700 font-medium"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array(6).fill(0).map((_, i) => <CardSkeleton key={i} />)
        ) : proveedoresFiltrados.map(p => {
          const susCompras = compras.filter(c => (c.proveedor === p._id) || (c.proveedor?._id === p._id));
          const totalInvertido = susCompras.reduce((acc, curr) => acc + curr.total, 0);

          return (
            <div key={p._id} className="bg-white rounded-3xl p-6 border border-pink-50 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-pink-50 rounded-bl-full -mr-8 -mt-8 transition-all group-hover:bg-pink-100 -z-0" />
              
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex gap-2">
                    <button onClick={() => abrirModalEditar(p)} className="p-2 bg-blue-50 text-blue-500 rounded-xl hover:bg-blue-500 hover:text-white transition-all shadow-sm"><Edit2 size={16} /></button>
                    <button onClick={() => handleEliminarProveedor(p._id)} className="p-2 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-sm"><Trash2 size={16} /></button>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-slate-800 mb-1">{p.nombreEmpresa || p.nombre || 'Empresa S/N'}</h3>
                <p className="text-sm text-slate-400 font-medium mb-4 flex items-center gap-1">
                  <List size={12} /> {p.contacto || 'Sin contacto'}
                </p>

                <div className="space-y-2 mb-6">
                  {p.telefono && <p className="text-xs text-slate-600 flex items-center gap-2"><Phone size={14} className="text-pink-300" /> {p.telefono}</p>}
                  {p.email && <p className="text-xs text-slate-600 flex items-center gap-2"><Mail size={14} className="text-pink-300" /> {p.email}</p>}
                  {p.direccion && <p className="text-xs text-slate-600 flex items-center gap-2 line-clamp-1"><MapPin size={14} className="text-pink-300" /> {p.direccion}</p>}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Total Comprado</p>
                    <p className="text-lg font-black text-slate-700">Bs. {totalInvertido.toFixed(2)}</p>
                  </div>
                  <button 
                    onClick={() => verDetalleCompras(p)}
                    className="p-2 bg-pink-50 text-kitty-pink rounded-xl hover:bg-kitty-pink hover:text-white transition-all shadow-sm"
                  >
                    <ExternalLink size={20} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Nuevo Proveedor */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden border border-pink-100">
            <div className="bg-kitty-light px-8 py-6 flex justify-between items-center border-b border-pink-100">
              <h2 className="text-2xl font-black text-kitty-dark">{modalMode === 'crear' ? 'Registrar Proveedor ✨' : 'Editar Proveedor 📝'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-kitty-pink transition-colors"><X size={28} /></button>
            </div>
            <form onSubmit={handleGuardarProveedor} className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-1">Nombre de la Empresa *</label>
                  <input required type="text" value={nuevoProveedor.nombreEmpresa} onChange={e=>setNuevoProveedor({...nuevoProveedor, nombreEmpresa: e.target.value})} className="w-full border border-pink-100 rounded-xl px-4 py-2 focus:ring-2 focus:ring-kitty-pink outline-none font-medium" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Contacto Personal</label>
                  <input type="text" value={nuevoProveedor.contacto} onChange={e=>setNuevoProveedor({...nuevoProveedor, contacto: e.target.value})} className="w-full border border-pink-100 rounded-xl px-4 py-2 focus:ring-2 focus:ring-kitty-pink outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Categoría</label>
                  <input type="text" placeholder="Ej. Maquillaje" value={nuevoProveedor.categoriaSuministro} onChange={e=>setNuevoProveedor({...nuevoProveedor, categoriaSuministro: e.target.value})} className="w-full border border-pink-100 rounded-xl px-4 py-2 focus:ring-2 focus:ring-kitty-pink outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Teléfono</label>
                  <input type="text" value={nuevoProveedor.telefono} onChange={e=>setNuevoProveedor({...nuevoProveedor, telefono: e.target.value})} className="w-full border border-pink-100 rounded-xl px-4 py-2 focus:ring-2 focus:ring-kitty-pink outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Email</label>
                  <input type="email" value={nuevoProveedor.email} onChange={e=>setNuevoProveedor({...nuevoProveedor, email: e.target.value})} className="w-full border border-pink-100 rounded-xl px-4 py-2 focus:ring-2 focus:ring-kitty-pink outline-none" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-1">Dirección</label>
                  <input type="text" value={nuevoProveedor.direccion} onChange={e=>setNuevoProveedor({...nuevoProveedor, direccion: e.target.value})} className="w-full border border-pink-100 rounded-xl px-4 py-2 focus:ring-2 focus:ring-kitty-pink outline-none" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-6 border-t border-slate-50">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 py-2 rounded-full border border-slate-200 text-slate-500 font-bold hover:bg-slate-50 transition-colors">Cancelar</button>
                <button type="submit" className="kitty-button">{modalMode === 'crear' ? 'Guardar Registro' : 'Actualizar Datos'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detalle Compras */}
      {isDetalleOpen && proveedorSeleccionado && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden border border-pink-100">
            <div className="bg-slate-800 text-white px-8 py-6 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-black">{proveedorSeleccionado.nombreEmpresa || proveedorSeleccionado.nombre}</h2>
                <p className="text-xs text-white/60 uppercase tracking-widest font-bold">Historial de Compras Realizadas</p>
              </div>
              <button onClick={() => setIsDetalleOpen(false)} className="text-white/60 hover:text-white transition-colors"><X size={28} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8">
              {proveedorSeleccionado.compras.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="mx-auto text-slate-200 mb-4" size={64} />
                  <p className="text-slate-400 font-medium">Aún no has registrado compras con este proveedor.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {proveedorSeleccionado.compras.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).map(c => (
                    <div key={c._id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between hover:border-pink-200 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 shadow-sm">
                          <Calendar size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-700">{new Date(c.createdAt).toLocaleDateString()}</p>
                          <p className="text-xs text-slate-400">{c.productos?.length || 0} productos recibidos</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-black text-slate-800 font-mono">Bs. {c.total.toFixed(2)}</p>
                        <span className="text-[9px] font-black bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full uppercase">PAGADO</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button onClick={() => setIsDetalleOpen(false)} className="px-8 py-2 bg-slate-800 text-white rounded-full font-bold hover:bg-slate-700 transition-colors shadow-md">Cerrar Historial</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProveedoresPage;
