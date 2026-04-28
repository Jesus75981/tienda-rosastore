import { useState, useEffect } from 'react';
import axios from 'axios';
import { Package, Search } from 'lucide-react';

const ProductosPage = () => {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchProductos = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/productos`);
      setProductos(res.data);
    } catch (error) {
      console.error("Error al cargar productos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductos();
  }, []);

  const filteredProductos = productos.filter(p => 
    (p.nombre && p.nombre.toLowerCase().includes(searchTerm.toLowerCase())) || 
    (p.marca && p.marca.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (p.categoria && p.categoria.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (p.codigo && p.codigo.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) return <div className="p-8 text-center text-kitty-pink">Cargando catálogo... 🎀</div>;

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
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProductos.map((producto) => (
          <div key={producto._id} className="kitty-card flex flex-col transition-transform hover:-translate-y-1">
            <div className="bg-pink-50 h-40 flex items-center justify-center border-b border-pink-100 overflow-hidden relative">
              {producto.imagen ? (
                <img src={`import.meta.env.VITE_API_URL${producto.imagen}`} alt={producto.nombre} className="w-full h-full object-cover transition-transform hover:scale-105" />
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

      {filteredProductos.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No hay productos disponibles en el catálogo en este momento. 🎀
        </div>
      )}
    </div>
  );
};

export default ProductosPage;




