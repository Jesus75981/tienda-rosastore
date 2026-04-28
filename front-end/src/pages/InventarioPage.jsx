import { useState, useEffect } from 'react';
import axios from 'axios';
import { Package, Search, AlertTriangle, Edit, Trash2, X } from 'lucide-react';

const InventarioPage = () => {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({});
  const [imagenFile, setImagenFile] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const fetchProductos = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/productos`);
      setProductos(res.data);
    } catch (error) {
      console.error("Error al cargar inventario:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este producto del inventario?')) {
      try {
        await axios.delete(`import.meta.env.VITE_API_URL/api/productos/${id}`);
        setProductos(productos.filter(p => p._id !== id));
      } catch (error) {
        console.error("Error al eliminar:", error);
        alert("Error al eliminar el producto");
      }
    }
  };

  const handleEdit = (producto) => {
    setFormData({ ...producto });
    setEditingId(producto._id);
    setImagenFile(null);
    setShowModal(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const submitData = new FormData();
      Object.keys(formData).forEach(key => {
        if (key !== 'imagen' && formData[key] !== null) {
          submitData.append(key, formData[key]);
        }
      });
      if (imagenFile) {
        submitData.append('imagen', imagenFile);
      }

      const res = await axios.put(`import.meta.env.VITE_API_URL/api/productos/${editingId}`, submitData);
      
      setProductos(productos.map(p => p._id === editingId ? res.data : p));
      setShowModal(false);
    } catch (error) {
      console.error("Error al actualizar:", error);
      alert("Error al actualizar el producto");
    }
  };

  useEffect(() => {
    fetchProductos();
  }, []);

  const productosFiltrados = productos.filter(p => 
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.marca?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="p-8 text-center text-kitty-pink">Cargando maestro de inventario... 🎀</div>;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-kitty-pink mb-2 flex items-center gap-2">
            <Package size={32} /> Inventario General
          </h1>
          <p className="text-gray-600">Revisión de stock, costos y precios de venta</p>
        </div>
      </div>

      <div className="kitty-card p-6 mb-8 flex items-center gap-4">
        <Search className="text-gray-400" />
        <input 
          type="text" 
          placeholder="Buscar por código, nombre o marca..." 
          className="flex-1 outline-none text-slate-700 bg-transparent"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-pink-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider">
                <th className="p-4 border-b border-pink-100 font-bold w-16">Img</th>
                <th className="p-4 border-b border-pink-100 font-bold">Código, Producto y Marca</th>
                <th className="p-4 border-b border-pink-100 font-bold">Categoría</th>
                <th className="p-4 border-b border-pink-100 font-bold text-center">Stock Físico</th>
                <th className="p-4 border-b border-pink-100 font-bold text-right">Costo Unit. (Bs)</th>
                <th className="p-4 border-b border-pink-100 font-bold text-right">Costo Total (Bs)</th>
                <th className="p-4 border-b border-pink-100 font-bold text-right">Venta (Bs)</th>
                <th className="p-4 border-b border-pink-100 font-bold text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {productosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-gray-500">
                    No hay productos registrados en el inventario. 🎀
                  </td>
                </tr>
              ) : (
                productosFiltrados.map(producto => {
                  const stockCritico = producto.stock <= producto.stockMinimo;
                  return (
                    <tr key={producto._id} className="hover:bg-pink-50/50 transition-colors border-b border-pink-50 last:border-0">
                      <td className="p-4">
                        {producto.imagen ? (
                          <img src={`import.meta.env.VITE_API_URL${producto.imagen}`} alt="Prod" className="w-12 h-12 rounded-lg object-cover border border-pink-100 shadow-sm" />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-pink-50 flex items-center justify-center text-pink-300 border border-pink-100">
                            <Package size={20} />
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <p className="font-bold text-slate-800">
                          {producto.codigo && <span className="text-pink-500 text-xs mr-2">{producto.codigo}</span>}
                          {producto.nombre}
                        </p>
                        <p className="text-xs text-gray-500">{producto.marca || 'Sin marca'}</p>
                      </td>
                      <td className="p-4">
                        <span className="text-xs font-bold text-kitty-rose bg-pink-50 px-2 py-1 rounded-full">
                          {producto.categoria || 'General'}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold ${stockCritico ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>
                          {stockCritico && <AlertTriangle size={14} />}
                          {producto.stock}
                        </div>
                      </td>
                      <td className="p-4 text-slate-600 font-semibold text-right">
                        Bs. {producto.precioCompra.toFixed(2)}
                      </td>
                      <td className="p-4 text-slate-600 font-bold text-right bg-slate-50/50">
                        Bs. {(producto.stock * producto.precioCompra).toFixed(2)}
                      </td>
                      <td className="p-4 text-kitty-pink font-bold text-right">
                        Bs. {producto.precioVenta.toFixed(2)}
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex justify-center gap-2">
                          <button onClick={() => handleEdit(producto)} className="p-2 bg-blue-50 text-blue-500 rounded-lg hover:bg-blue-100 transition-colors" title="Editar">
                            <Edit size={16} />
                          </button>
                          <button onClick={() => handleDelete(producto._id)} className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors" title="Eliminar">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Edición */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-2 bg-pink-50 text-pink-500 rounded-full hover:bg-pink-100 transition-colors"
            >
              <X size={20} />
            </button>
            <h2 className="text-2xl font-bold text-kitty-pink mb-6 flex items-center gap-2">
              <Edit size={24} /> Editar Producto
            </h2>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {formData.codigo && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-1">Código del Producto</label>
                    <input type="text" value={formData.codigo} disabled className="w-full px-4 py-2 rounded-xl border border-pink-100 bg-pink-50/50 text-pink-500 font-bold focus:outline-none cursor-not-allowed" />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Nombre</label>
                  <input type="text" value={formData.nombre || ''} onChange={e => setFormData({...formData, nombre: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-pink-100 focus:outline-none focus:ring-2 focus:ring-pink-300" required />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Marca</label>
                  <input type="text" value={formData.marca || ''} onChange={e => setFormData({...formData, marca: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-pink-100 focus:outline-none focus:ring-2 focus:ring-pink-300" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Categoría</label>
                  <input type="text" value={formData.categoria || ''} onChange={e => setFormData({...formData, categoria: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-pink-100 focus:outline-none focus:ring-2 focus:ring-pink-300" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Stock Actual</label>
                  <input type="number" value={formData.stock || 0} onChange={e => setFormData({...formData, stock: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-pink-100 focus:outline-none focus:ring-2 focus:ring-pink-300" required />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Stock Mínimo</label>
                  <input type="number" value={formData.stockMinimo || 0} onChange={e => setFormData({...formData, stockMinimo: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-pink-100 focus:outline-none focus:ring-2 focus:ring-pink-300" required />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Precio Compra (Bs)</label>
                  <input type="number" step="0.01" value={formData.precioCompra || 0} onChange={e => setFormData({...formData, precioCompra: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-pink-100 focus:outline-none focus:ring-2 focus:ring-pink-300" required />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Precio Venta (Bs)</label>
                  <input type="number" step="0.01" value={formData.precioVenta || 0} onChange={e => setFormData({...formData, precioVenta: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-pink-100 focus:outline-none focus:ring-2 focus:ring-pink-300" required />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Nueva Imagen (opcional)</label>
                  <input type="file" accept="image/*" onChange={e => setImagenFile(e.target.files[0])} className="w-full px-4 py-2 rounded-xl border border-pink-100 focus:outline-none focus:ring-2 focus:ring-pink-300" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-pink-100">
                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-colors">Cancelar</button>
                <button type="submit" className="px-6 py-2 bg-kitty-pink text-white rounded-xl font-bold hover:bg-pink-600 transition-colors shadow-sm">Guardar Cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventarioPage;




