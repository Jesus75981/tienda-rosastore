import { useState, useEffect } from 'react';
import axios from 'axios';
import { Box, Plus, Minus, Trash2, Banknote, QrCode, Search, Truck, X } from 'lucide-react';

const ComprasPage = () => {
  const [productos, setProductos] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [carrito, setCarrito] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Estados de Compra
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState('');
  const [metodoPago, setMetodoPago] = useState('Efectivo');
  const [cuentaOrigen, setCuentaOrigen] = useState('Caja Tienda');
  
  const metodosPago = [
    { id: 'Efectivo', icon: Banknote },
    { id: 'QR', icon: QrCode },
    { id: 'Transferencia', icon: Banknote },
  ];
  const cuentas = ['Caja Tienda', 'Banco BCP', 'Banco BNB', 'Banco Union'];

  // Estados Modal Producto Nuevo
  const [isProductoModalOpen, setIsProductoModalOpen] = useState(false);
  const [nuevoProducto, setNuevoProducto] = useState({
    nombre: '', marca: '', categoria: '', precioCompra: '', precioVenta: '', stock: '0', stockMinimo: '5'
  });
  const [imagenFile, setImagenFile] = useState(null);
  const [categoriasExistentes, setCategoriasExistentes] = useState([]);

  // Estados Modal Proveedor Rápido
  const [isProveedorModalOpen, setIsProveedorModalOpen] = useState(false);
  const [nuevoProveedor, setNuevoProveedor] = useState({ nombre: '', telefono: '', empresa: '' });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [prodRes, provRes, catRes] = await Promise.all([
        axios.get('http://localhost:5000/api/productos'),
        axios.get('http://localhost:5000/api/proveedores'),
        axios.get('http://localhost:5000/api/categorias')
      ]);
      setProductos(prodRes.data);
      setProveedores(provRes.data);
      setCategoriasExistentes(catRes.data);
    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Funciones del Carrito
  const agregarAlCarrito = (producto) => {
    const itemExistente = carrito.find(item => item.producto._id === producto._id);
    if (itemExistente) {
      setCarrito(carrito.map(item => 
        item.producto._id === producto._id 
          ? { ...item, cantidad: item.cantidad + 1, subtotal: (item.cantidad + 1) * item.costoUnitario }
          : item
      ));
    } else {
      setCarrito([...carrito, {
        producto,
        cantidad: 1,
        costoUnitario: producto.precioCompra, // Por defecto el costo registrado
        subtotal: producto.precioCompra
      }]);
    }
  };

  const modificarCantidad = (id, delta) => {
    setCarrito(carrito.map(item => {
      if (item.producto._id === id) {
        const nuevaCantidad = item.cantidad + delta;
        if (nuevaCantidad <= 0) return item;
        return { ...item, cantidad: nuevaCantidad, subtotal: nuevaCantidad * item.costoUnitario };
      }
      return item;
    }));
  };

  const modificarCostoUnidad = (id, nuevoCosto) => {
    const costo = parseFloat(nuevoCosto) || 0;
    setCarrito(carrito.map(item => {
      if (item.producto._id === id) {
        return { ...item, costoUnitario: costo, subtotal: item.cantidad * costo };
      }
      return item;
    }));
  };

  const eliminarDelCarrito = (id) => {
    setCarrito(carrito.filter(item => item.producto._id !== id));
  };

  const totalCarrito = carrito.reduce((sum, item) => sum + item.subtotal, 0);

  // Registro Final
  const confirmarCompra = async () => {
    if (carrito.length === 0) return alert("La lista de ingreso está vacía");
    if (!proveedorSeleccionado) return alert("Debes seleccionar un proveedor");
    
    const compraData = {
      proveedor: proveedorSeleccionado,
      productos: carrito.map(item => ({
        producto: item.producto._id,
        cantidad: item.cantidad,
        costoUnitario: item.costoUnitario,
        subtotal: item.subtotal
      })),
      total: totalCarrito,
      metodoPago,
      cuentaOrigen
    };

    try {
      await axios.post('http://localhost:5000/api/compras', compraData);
      alert("¡Compra registrada y stock actualizado con éxito! 📦");
      setCarrito([]);
      setProveedorSeleccionado('');
      setMetodoPago('Efectivo');
      fetchData(); // Recargar productos
    } catch (error) {
      console.error("Error al registrar compra:", error);
      alert("Hubo un error al registrar la compra.");
    }
  };

  // Crear Producto Rápido
  const handleCrearProducto = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      Object.keys(nuevoProducto).forEach(key => {
        formData.append(key, nuevoProducto[key]);
      });
      if (imagenFile) {
        formData.append('imagen', imagenFile);
      }

      const res = await axios.post('http://localhost:5000/api/productos', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setProductos([...productos, res.data]);
      setIsProductoModalOpen(false);
      // Limpiar y auto-agregar al carrito
      setNuevoProducto({nombre: '', marca: '', categoria: '', precioCompra: '', precioVenta: '', stock: '0', stockMinimo: '5'});
      setImagenFile(null);
      // Actualizar la lista de categorías si es una nueva
      if (!categoriasExistentes.includes(res.data.categoria)) {
        setCategoriasExistentes([...categoriasExistentes, res.data.categoria]);
      }
      agregarAlCarrito(res.data);
      alert("Producto creado y añadido a la lista. 🎀");
    } catch (error) {
      console.error(error);
      alert("Error al crear producto");
    }
  };

  // Crear Proveedor Rápido
  const handleCrearProveedor = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/proveedores', nuevoProveedor);
      setProveedores([...proveedores, res.data]);
      setProveedorSeleccionado(res.data._id);
      setIsProveedorModalOpen(false);
      setNuevoProveedor({ nombre: '', telefono: '', empresa: '' });
      alert("Proveedor registrado rápidamente.");
    } catch (error) {
      console.error(error);
      alert("Error al registrar proveedor");
    }
  };

  const productosFiltrados = productos.filter(p => 
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.marca && p.marca.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) return <div className="p-8 text-center text-kitty-pink">Cargando sistema de compras... 🎀</div>;

  return (
    <>
      <div className="flex h-full bg-kitty-cream">
        {/* Lado Izquierdo: Catálogo y Botón Nuevo Producto */}
        <div className="flex-1 flex flex-col p-6 overflow-hidden border-r border-pink-100">
          <div className="mb-6 flex justify-between items-end">
            <div>
              <h1 className="text-2xl font-bold text-kitty-pink flex items-center gap-2 mb-4">
                <Box /> Registro de Compras
              </h1>
              <div className="kitty-card p-2 flex items-center gap-2 w-96">
                <Search className="text-gray-400 ml-2" />
                <input 
                  type="text" 
                  placeholder="Buscar producto existente..." 
                  className="flex-1 outline-none text-slate-700 bg-transparent p-2"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <button onClick={() => setIsProductoModalOpen(true)} className="kitty-button flex items-center gap-2 py-3">
              <Plus size={20} /> Crear Nuevo Producto
            </button>
          </div>

          <div className="flex-1 overflow-y-auto pr-2">
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {productosFiltrados.map(producto => (
                <div 
                  key={producto._id} 
                  onClick={() => agregarAlCarrito(producto)}
                  className="bg-white p-4 rounded-xl shadow-sm border border-pink-50 cursor-pointer hover:border-kitty-pink hover:shadow-md transition-all flex flex-col"
                >
                  <span className="text-xs font-bold text-kitty-rose bg-pink-50 px-2 py-1 rounded-full w-max mb-2 flex gap-1">
                    {producto.codigo && <span className="text-pink-400">{producto.codigo} |</span>}
                    {producto.categoria || 'General'}
                  </span>
                  <h3 className="font-bold text-slate-800 text-sm mb-1 line-clamp-2">{producto.nombre}</h3>
                  <div className="mt-auto flex justify-between items-end">
                    <p className="font-bold text-slate-500 text-sm">Costo Ref: Bs. {producto.precioCompra}</p>
                    <p className="text-xs text-gray-400">En Inventario: {producto.stock}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Lado Derecho: Lista de Ingreso */}
        <div className="w-[450px] bg-white flex flex-col shadow-[-4px_0_24px_rgba(255,105,180,0.05)] z-10">
          <div className="p-6 border-b border-pink-50 bg-kitty-light/20">
            <h2 className="text-xl font-bold text-slate-800">Lista de Ingreso 📝</h2>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {carrito.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <Box size={48} className="mb-4 opacity-20" />
                <p>No has agregado mercadería aún</p>
              </div>
            ) : (
              <div className="space-y-4">
                {carrito.map(item => (
                  <div key={item.producto._id} className="flex gap-3 border-b border-pink-50 pb-4">
                    <div className="flex-1">
                      <p className="font-bold text-slate-800 text-sm leading-tight mb-2">{item.producto.nombre}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">Costo Unit. (Bs)</span>
                        <input 
                          type="number" 
                          step="0.01"
                          value={item.costoUnitario}
                          onChange={(e) => modificarCostoUnidad(item.producto._id, e.target.value)}
                          className="w-20 border border-pink-200 rounded px-2 py-1 text-sm font-bold text-kitty-pink outline-none focus:border-kitty-pink"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col items-end justify-between">
                      <button onClick={() => eliminarDelCarrito(item.producto._id)} className="text-red-400 hover:text-red-600 transition-colors mb-2">
                        <Trash2 size={16} />
                      </button>
                      <div className="flex items-center gap-2 bg-pink-50 rounded-full px-2 py-1">
                        <button onClick={() => modificarCantidad(item.producto._id, -1)} className="text-kitty-pink hover:text-kitty-rose"><Minus size={14} /></button>
                        <span className="font-bold text-sm w-6 text-center">{item.cantidad}</span>
                        <button onClick={() => modificarCantidad(item.producto._id, 1)} className="text-kitty-pink hover:text-kitty-rose"><Plus size={14} /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Checkout Compras */}
          <div className="p-6 bg-slate-50 border-t border-pink-100">
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                  <Truck size={14} /> Proveedor (Obligatorio)
                </label>
                <button onClick={() => setIsProveedorModalOpen(true)} className="text-xs text-kitty-pink font-bold hover:underline flex items-center gap-1">
                  <Plus size={12} /> Nuevo
                </button>
              </div>
              <select 
                value={proveedorSeleccionado} 
                onChange={(e) => setProveedorSeleccionado(e.target.value)}
                className="w-full bg-white border border-pink-100 rounded-lg p-2 outline-none focus:border-kitty-pink text-sm"
              >
                <option value="">Seleccione un proveedor...</option>
                {proveedores.map(p => (
                  <option key={p._id} value={p._id}>{p.empresa || p.nombre}</option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Cuenta de Egreso (De dónde sale el dinero)</label>
              <select 
                value={cuentaOrigen} 
                onChange={(e) => setCuentaOrigen(e.target.value)}
                className="w-full bg-white border border-pink-100 rounded-lg p-2 outline-none focus:border-kitty-pink text-sm font-medium text-slate-700"
              >
                {cuentas.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="flex justify-between items-center mb-6">
              <span className="text-lg text-slate-600 font-medium">Total Factura</span>
              <span className="text-3xl font-black text-slate-800">Bs. {totalCarrito.toFixed(2)}</span>
            </div>

            <button 
              onClick={confirmarCompra}
              disabled={carrito.length === 0}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all shadow-lg flex justify-center items-center gap-2
                ${carrito.length === 0 
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none' 
                  : 'bg-indigo-500 text-white hover:bg-indigo-600 hover:-translate-y-1'
                }`}
            >
              <Box /> Registrar Ingreso
            </button>
          </div>
        </div>
      </div>

      {/* Modal Nuevo Producto */}
      {isProductoModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden">
            <div className="bg-kitty-light px-6 py-4 flex justify-between items-center border-b border-pink-100">
              <h2 className="text-xl font-bold text-kitty-dark">Registrar Nuevo Producto ✨</h2>
              <button onClick={() => setIsProductoModalOpen(false)} className="text-gray-500 hover:text-kitty-pink transition-colors"><X size={24} /></button>
            </div>
            <form onSubmit={handleCrearProducto} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                  <input required type="text" value={nuevoProducto.nombre} onChange={e=>setNuevoProducto({...nuevoProducto, nombre: e.target.value})} className="w-full border border-pink-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-kitty-pink" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                  <input 
                    required 
                    type="text" 
                    list="categorias-list"
                    value={nuevoProducto.categoria} 
                    onChange={e=>setNuevoProducto({...nuevoProducto, categoria: e.target.value})} 
                    className="w-full border border-pink-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-kitty-pink" 
                    placeholder="Ej. Labiales" 
                  />
                  <datalist id="categorias-list">
                    {categoriasExistentes.map(cat => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Marca</label>
                  <input type="text" value={nuevoProducto.marca} onChange={e=>setNuevoProducto({...nuevoProducto, marca: e.target.value})} className="w-full border border-pink-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-kitty-pink" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Imagen del Producto (Opcional)</label>
                  <input type="file" accept="image/*" onChange={e=>setImagenFile(e.target.files[0])} className="w-full border border-pink-200 rounded-lg px-4 py-1.5 focus:outline-none focus:ring-2 focus:ring-kitty-pink text-sm file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-pink-50 file:text-kitty-pink hover:file:bg-pink-100" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Precio Compra (Costo Bs.)</label>
                  <input required type="number" step="0.01" value={nuevoProducto.precioCompra} onChange={e=>setNuevoProducto({...nuevoProducto, precioCompra: e.target.value})} className="w-full border border-pink-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-kitty-pink" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Precio Venta Público (PVP Bs.)</label>
                  <input required type="number" step="0.01" value={nuevoProducto.precioVenta} onChange={e=>setNuevoProducto({...nuevoProducto, precioVenta: e.target.value})} className="w-full border border-pink-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-kitty-pink" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-pink-50">
                <button type="button" onClick={() => setIsProductoModalOpen(false)} className="px-6 py-2 rounded-full border border-pink-200 text-gray-600 font-medium">Cancelar</button>
                <button type="submit" className="kitty-button">Guardar y Añadir</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Proveedor Rápido */}
      {isProveedorModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="bg-kitty-light px-6 py-4 border-b border-pink-100">
              <h2 className="text-lg font-bold text-kitty-dark">Nuevo Proveedor ✨</h2>
            </div>
            <form onSubmit={handleCrearProveedor} className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Contacto</label>
                <input required type="text" value={nuevoProveedor.nombre} onChange={e => setNuevoProveedor({...nuevoProveedor, nombre: e.target.value})} className="w-full border border-pink-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-kitty-pink" />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Empresa / Distribuidora (Opcional)</label>
                <input type="text" value={nuevoProveedor.empresa} onChange={e => setNuevoProveedor({...nuevoProveedor, empresa: e.target.value})} className="w-full border border-pink-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-kitty-pink" />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Celular (Opcional)</label>
                <input type="text" value={nuevoProveedor.telefono} onChange={e => setNuevoProveedor({...nuevoProveedor, telefono: e.target.value})} className="w-full border border-pink-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-kitty-pink" />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setIsProveedorModalOpen(false)} className="px-4 py-2 rounded-lg text-gray-600">Cancelar</button>
                <button type="submit" className="kitty-button py-2">Registrar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default ComprasPage;
