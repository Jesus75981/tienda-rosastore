import { useState, useEffect } from 'react';
import axios from 'axios';
import { Package, Search, AlertTriangle, Edit, Trash2, X, ChevronLeft, ChevronRight, Archive, FileDown } from 'lucide-react';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { TableSkeleton } from '../components/Skeleton.jsx';

const InventarioPage = () => {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({});
  const [imagenFile, setImagenFile] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [mostrarArchivados, setMostrarArchivados] = useState(false);
  const [stats, setStats] = useState({ activos: 0, muertos: 0, total: 0 });
  const [isExporting, setIsExporting] = useState(false);

  // Pagination state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 15;

  const fetchProductos = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/productos`, {
        params: { page, limit, search: searchTerm, archivado: mostrarArchivados }
      });
      if (res.data.data) {
        setProductos(res.data.data);
        setTotalPages(res.data.totalPages);
      } else {
        setProductos(res.data);
        setTotalPages(1);
      }
    } catch (error) {
      console.error("Error al cargar inventario:", error);
      toast.error("Error al cargar el inventario");
    } finally {
      setLoading(false);
    }
  };

  const handleArchivarToggle = async (id, currentStatus) => {
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/api/productos/${id}`, { archivado: !currentStatus });
      fetchProductos();
      toast.success(currentStatus ? "Producto restaurado exitosamente" : "Producto archivado exitosamente");
    } catch (error) {
      console.error("Error al archivar:", error);
      toast.error("Error al actualizar estado del producto");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este producto del inventario?')) {
      try {
        await axios.delete(`${import.meta.env.VITE_API_URL}/api/productos/${id}`);
        setProductos(productos.filter(p => p._id !== id));
        toast.success("Producto eliminado exitosamente");
      } catch (error) {
        console.error("Error al eliminar:", error);
        toast.error("Error al eliminar el producto");
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
      const keysToExclude = ['imagen', '_id', '__v', 'createdAt', 'updatedAt'];
      Object.keys(formData).forEach(key => {
        if (!keysToExclude.includes(key) && formData[key] !== null && formData[key] !== undefined) {
          submitData.append(key, formData[key]);
        }
      });
      if (imagenFile) {
        submitData.append('imagen', imagenFile);
      }

      const res = await axios.put(`${import.meta.env.VITE_API_URL}/api/productos/${editingId}`, submitData);
      
      setProductos(productos.map(p => p._id === editingId ? res.data : p));
      setShowModal(false);
      toast.success("Producto actualizado exitosamente 🎀");
    } catch (error) {
      console.error("Error al actualizar:", error);
      const errorMsg = error.response?.data?.message || "Error al actualizar el producto";
      toast.error(errorMsg);
    }
  };

  const fetchStats = async () => {
    try {
      const [activosRes, muertosRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/api/productos`, { params: { limit: 1, archivado: false } }),
        axios.get(`${import.meta.env.VITE_API_URL}/api/productos`, { params: { limit: 1, archivado: true } })
      ]);
      const activos = activosRes.data.totalItems || 0;
      const muertos = muertosRes.data.totalItems || 0;
      setStats({ activos, muertos, total: activos + muertos });
    } catch (e) {
      console.error("Error stats", e);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchProductos();
      fetchStats();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, page, mostrarArchivados]);

  const exportarPDF = async () => {
    try {
      setIsExporting(true);
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/productos`, {
        params: { limit: 0, archivado: 'all' }
      });
      const todosLosProductos = res.data;

      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text("Inventario General - Rosastore", 14, 22);
      
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(`Total Productos: ${stats.total} | Activos: ${stats.activos} | Archivo Muerto: ${stats.muertos}`, 14, 30);
      
      const tableColumn = ["Código", "Producto", "Marca", "Categoría", "Stock", "P. Compra", "P. Venta", "Estado"];
      const tableRows = [];

      todosLosProductos.forEach(producto => {
        const estado = producto.archivado ? "Muerto" : "Activo";
        const rowData = [
          producto.codigo || '-',
          producto.nombre,
          producto.marca || '-',
          producto.categoria || 'General',
          producto.stock.toString(),
          `Bs. ${producto.precioCompra.toFixed(2)}`,
          `Bs. ${producto.precioVenta.toFixed(2)}`,
          estado
        ];
        tableRows.push(rowData);
      });

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 35,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [255, 105, 180] }
      });

      doc.save("Inventario_Rosastore.pdf");
      toast.success("PDF generado exitosamente");
    } catch (error) {
      console.error("Error al exportar PDF:", error);
      toast.error("Error al generar el PDF");
    } finally {
      setIsExporting(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  return (
    <div className="p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-kitty-pink mb-2 flex items-center gap-2">
            <Package size={32} /> Inventario General
          </h1>
          <p className="text-gray-600">Revisión de stock, costos y precios de venta</p>
        </div>
        
        <div className="flex flex-col items-end gap-3">
          <button 
            onClick={exportarPDF}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 transition-colors shadow-sm disabled:opacity-50"
          >
            <FileDown size={18} /> {isExporting ? "Generando PDF..." : "Exportar Inventario (PDF)"}
          </button>
          
          <div className="flex gap-2 text-xs md:text-sm font-bold">
            <span className="bg-pink-50 text-kitty-pink px-3 py-1.5 rounded-lg border border-pink-100 shadow-sm">Total: {stats.total}</span>
            <span className="bg-green-50 text-green-600 px-3 py-1.5 rounded-lg border border-green-100 shadow-sm">Activos: {stats.activos}</span>
            <span className="bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm">Muertos: {stats.muertos}</span>
          </div>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <button 
          onClick={() => { setMostrarArchivados(false); setPage(1); }} 
          className={`px-6 py-2 rounded-xl font-bold transition-all ${!mostrarArchivados ? 'bg-kitty-pink text-white shadow-md' : 'bg-white text-gray-500 border border-pink-100 hover:bg-pink-50'}`}
        >
          Inventario Activo
        </button>
        <button 
          onClick={() => { setMostrarArchivados(true); setPage(1); }} 
          className={`px-6 py-2 rounded-xl font-bold transition-all ${mostrarArchivados ? 'bg-gray-500 text-white shadow-md' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'}`}
        >
          Archivo Muerto
        </button>
      </div>

      <div className="kitty-card p-6 mb-8 flex items-center gap-4">
        <Search className="text-gray-400" />
        <input 
          type="text" 
          placeholder="Buscar por código, nombre o marca..." 
          className="flex-1 outline-none text-slate-700 bg-transparent"
          value={searchTerm}
          onChange={handleSearchChange}
        />
      </div>

      {loading ? (
        <TableSkeleton rows={10} columns={8} />
      ) : (
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
                {productos.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="p-8 text-center text-gray-500">
                      No hay productos registrados en el inventario. 🎀
                    </td>
                  </tr>
                ) : (
                  productos.map(producto => {
                    const stockCritico = producto.stock <= producto.stockMinimo;
                    return (
                      <tr key={producto._id} className="hover:bg-pink-50/50 transition-colors border-b border-pink-50 last:border-0">
                        <td className="p-4">
                          {producto.imagen ? (
                            <img src={producto.imagen?.startsWith('http') ? producto.imagen : `${import.meta.env.VITE_API_URL}${producto.imagen}`} alt="Prod" className="w-12 h-12 rounded-lg object-cover border border-pink-100 shadow-sm" />
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
                            {mostrarArchivados ? (
                              <button onClick={() => handleArchivarToggle(producto._id, true)} className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors" title="Desarchivar / Restaurar">
                                <Package size={16} />
                              </button>
                            ) : (
                              <button 
                                onClick={() => handleArchivarToggle(producto._id, false)} 
                                disabled={producto.stock > 0}
                                className={`p-2 rounded-lg transition-colors ${producto.stock === 0 ? 'bg-gray-100 text-gray-600 hover:bg-gray-200 cursor-pointer' : 'bg-gray-50 text-gray-300 cursor-not-allowed'}`} 
                                title={producto.stock === 0 ? "Archivar Producto" : "El stock debe ser 0 para archivar"}
                              >
                                <Archive size={16} />
                              </button>
                            )}
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
      )}

      {/* Controles de Paginación */}
      {!loading && totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-8">
          <button 
            onClick={() => setPage(p => Math.max(1, p - 1))} 
            disabled={page === 1}
            className="p-2 rounded-full bg-white border border-pink-200 text-kitty-pink disabled:opacity-50 hover:bg-pink-50 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="font-bold text-slate-600">
            Página {page} de {totalPages}
          </span>
          <button 
            onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
            disabled={page === totalPages}
            className="p-2 rounded-full bg-white border border-pink-200 text-kitty-pink disabled:opacity-50 hover:bg-pink-50 transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}

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
