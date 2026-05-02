import { useState, useEffect } from 'react';
import axios from 'axios';
import { Package, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { CardSkeleton } from '../components/Skeleton.jsx';

const ProductosPage = () => {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 12; // 12 cards per page fits nicely in grid

  const fetchProductos = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/productos`, {
        params: { page, limit, search: searchTerm }
      });
      if (res.data.data) {
        setProductos(res.data.data);
        setTotalPages(res.data.totalPages);
      } else {
        // Fallback for non-paginated endpoints
        setProductos(res.data);
        setTotalPages(1);
      }
    } catch (error) {
      console.error("Error al cargar productos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchProductos();
    }, 300); // Debounce search
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, page]);

  // Si busca algo, volvemos a la página 1
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-kitty-pink mb-2 flex items-center gap-2">
            <Package size={32} /> Catálogo de Productos
          </h1>
          <p className="text-gray-600">Visualiza los productos disponibles para la venta</p>
        </div>
      </div>

      <div className="kitty-card p-6 mb-8 flex items-center gap-4">
        <Search className="text-gray-400" />
        <input 
          type="text" 
          placeholder="Buscar por código, nombre, marca o categoría..." 
          className="flex-1 outline-none text-slate-700 bg-transparent"
          value={searchTerm}
          onChange={handleSearchChange}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {loading ? (
          // Mostrar Skeletons
          Array(limit).fill(0).map((_, i) => <CardSkeleton key={i} />)
        ) : productos.map((producto) => (
          <div key={producto._id} className="kitty-card flex flex-col transition-transform hover:-translate-y-1">
            <div className="bg-pink-50 h-40 flex items-center justify-center border-b border-pink-100 overflow-hidden relative">
              {producto.imagen ? (
                <img src={producto.imagen?.startsWith('http') ? producto.imagen : `${import.meta.env.VITE_API_URL}${producto.imagen}`} alt={producto.nombre} className="w-full h-full object-cover transition-transform hover:scale-105" />
              ) : (
                <Package size={48} className="text-pink-200" />
              )}
            </div>
            <div className="p-5 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-bold text-kitty-rose bg-pink-100 px-2 py-1 rounded-full flex gap-1">
                  {producto.codigo && <span className="text-pink-400">{producto.codigo} |</span>} {producto.categoria}
                </span>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${producto.stock <= producto.stockMinimo ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                  Stock: {producto.stock}
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-800 leading-tight mb-1">{producto.nombre}</h3>
              <p className="text-sm text-gray-500 mb-4">{producto.marca}</p>
              
              <div className="mt-auto border-t border-pink-50 pt-4">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-500 font-medium">Precio Venta</p>
                  <p className="font-bold text-kitty-pink text-xl">Bs. {producto.precioVenta}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {!loading && productos.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No hay productos disponibles en el catálogo en este momento. 🎀
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
    </div>
  );
};

export default ProductosPage;
