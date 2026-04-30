import { useState, useEffect } from 'react';
import axios from 'axios';
import { ShoppingBag, Plus, Minus, Trash2, CreditCard, Banknote, QrCode, Search, User, Truck, MapPin } from 'lucide-react';

const VentasPage = () => {
  const [productos, setProductos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [carrito, setCarrito] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Estado de la venta actual
  const [clienteSeleccionado, setClienteSeleccionado] = useState('');
  const [metodoPago, setMetodoPago] = useState('Efectivo');
  const [cuentaDestino, setCuentaDestino] = useState('');
  const [cuentasDb, setCuentasDb] = useState([]);
  const [saldos, setSaldos] = useState({});
  const [isClienteModalOpen, setIsClienteModalOpen] = useState(false);
  const [nuevoCliente, setNuevoCliente] = useState({ nombre: '', telefono: '' });
  
  // Estado Logística
  const [tipoEnvio, setTipoEnvio] = useState('Envio a Domicilio');
  const [costoEnvio, setCostoEnvio] = useState(0);
  const [direccionEntrega, setDireccionEntrega] = useState('');
  const [puntoEntrega, setPuntoEntrega] = useState('');

  // Helpers de tipo de envío
  const esPuntoEntrega = tipoEnvio === 'Punto de Entrega';
  const esEnvioNacional = tipoEnvio === 'Envio Nacional';
  
  const metodosPago = [
    { id: 'Efectivo', icon: Banknote },
    { id: 'Transferencia', icon: CreditCard },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [prodRes, cliRes, cuentaRes, finRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL}/api/productos`),
          axios.get(`${import.meta.env.VITE_API_URL}/api/clientes`),
          axios.get(`${import.meta.env.VITE_API_URL}/api/cuentas`),
          axios.get(`${import.meta.env.VITE_API_URL}/api/finanzas/resumen`)
        ]);
        // Solo mostrar productos con stock
        setProductos(prodRes.data.filter(p => p.stock > 0));
        setClientes(cliRes.data);
        setCuentasDb(cuentaRes.data);
        setSaldos(finRes.data.saldos || {});
        if (cuentaRes.data.length > 0) {
          setCuentaDestino(cuentaRes.data[0].nombre);
        } else {
          setCuentaDestino('Caja Tienda');
        }
      } catch (error) {
        console.error("Error cargando datos:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const agregarAlCarrito = (producto) => {
    const itemExistente = carrito.find(item => item.producto._id === producto._id);
    
    if (itemExistente) {
      if (itemExistente.cantidad >= producto.stock) {
        alert("No hay más stock disponible de este producto.");
        return;
      }
      setCarrito(carrito.map(item => 
        item.producto._id === producto._id 
          ? { ...item, cantidad: item.cantidad + 1, subtotal: (item.cantidad + 1) * item.precioUnitario }
          : item
      ));
    } else {
      setCarrito([...carrito, {
        producto,
        cantidad: 1,
        precioUnitario: producto.precioVenta,
        subtotal: producto.precioVenta
      }]);
    }
  };

  const modificarCantidad = (id, delta) => {
    setCarrito(carrito.map(item => {
      if (item.producto._id === id) {
        const nuevaCantidad = item.cantidad + delta;
        if (nuevaCantidad === 0) return item; // No bajar de 1 aquí, usar eliminar
        if (nuevaCantidad > item.producto.stock) {
          alert("Stock máximo alcanzado");
          return item;
        }
        return { ...item, cantidad: nuevaCantidad, subtotal: nuevaCantidad * item.precioUnitario };
      }
      return item;
    }));
  };

  const eliminarDelCarrito = (id) => {
    setCarrito(carrito.filter(item => item.producto._id !== id));
  };

  const totalCarrito = carrito.reduce((sum, item) => sum + item.subtotal, 0);
  // En Punto de Entrega no hay costo de envío
  const costoEnvioEfectivo = esPuntoEntrega ? 0 : Number(costoEnvio);
  const totalVenta = totalCarrito + costoEnvioEfectivo;

  const confirmarVenta = async () => {
    if (carrito.length === 0) return alert("El carrito está vacío");
    // Validar campo según tipo de envío
    if (!esPuntoEntrega && !direccionEntrega.trim()) {
      return alert("Debe ingresar una dirección de entrega.");
    }
    if (esPuntoEntrega && !puntoEntrega.trim()) {
      return alert("Debe ingresar la descripción del punto de entrega.");
    }
    
    const ventaData = {
      cliente: clienteSeleccionado || null,
      productos: carrito.map(item => ({
        producto: item.producto._id,
        cantidad: item.cantidad,
        precioUnitario: item.precioUnitario,
        subtotal: item.subtotal
      })),
      total: totalVenta,
      metodoPago,
      cuentaDestino,
      logistica: {
        tipoEnvio,
        costoEnvio: costoEnvioEfectivo,
        direccionEntrega: esPuntoEntrega ? '' : direccionEntrega,
        puntoEntrega: esPuntoEntrega ? puntoEntrega : ''
      }
    };

    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/ventas`, ventaData);
      alert("¡Venta registrada con éxito! 🎀");
      // Limpiar carrito y actualizar stock
      setCarrito([]);
      setClienteSeleccionado('');
      setMetodoPago('Efectivo');
      if (cuentasDb.length > 0) setCuentaDestino(cuentasDb[0].nombre);
      setTipoEnvio('Envio a Domicilio');
      setCostoEnvio(0);
      setDireccionEntrega('');
      setPuntoEntrega('');
      
      // Recargar productos para actualizar stock
      const prodRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/productos`);
      setProductos(prodRes.data.filter(p => p.stock > 0));
    } catch (error) {
      console.error("Error al registrar venta:", error);
      alert("Hubo un error al registrar la venta.");
    }
  };

  const handleCrearCliente = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/clientes`, nuevoCliente);
      setClientes([...clientes, res.data]);
      setClienteSeleccionado(res.data._id);
      setIsClienteModalOpen(false);
      setNuevoCliente({ nombre: '', telefono: '' });
      alert("Cliente registrado rápidamente. 🎀");
    } catch (error) {
      console.error("Error al registrar cliente:", error);
      alert("Hubo un error al registrar el cliente.");
    }
  };

  const productosFiltrados = productos.filter(p => 
    (p.nombre && p.nombre.toLowerCase().includes(searchTerm.toLowerCase())) || 
    (p.marca && p.marca.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (p.codigo && p.codigo.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) return <div className="p-8 text-center text-kitty-pink">Cargando sistema de ventas... 🎀</div>;

  return (
    <>
      <div className="flex h-full bg-kitty-cream">
        {/* Lado Izquierdo: Catálogo para agregar al carrito */}
        <div className="flex-1 flex flex-col p-6 overflow-hidden border-r border-pink-100">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-kitty-pink flex items-center gap-2 mb-4">
              <ShoppingBag /> Punto de Venta
            </h1>
            <div className="kitty-card p-2 flex items-center gap-2">
              <Search className="text-gray-400 ml-2" />
              <input 
                type="text" 
                placeholder="Buscar producto para vender..." 
                className="flex-1 outline-none text-slate-700 bg-transparent p-2"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
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
                    {producto.codigo && <span className="text-pink-400">{producto.codigo} |</span>} {producto.categoria}
                  </span>
                  <h3 className="font-bold text-slate-800 text-sm mb-1 line-clamp-2">{producto.nombre}</h3>
                  <p className="text-xs text-gray-400 mb-3">{producto.marca}</p>
                  <div className="mt-auto flex justify-between items-end">
                    <p className="font-bold text-kitty-pink">Bs. {producto.precioVenta}</p>
                    <p className="text-xs text-gray-500 font-medium">Stock: {producto.stock}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Lado Derecho: El Carrito y Checkout */}
        <div className="w-[400px] bg-white flex flex-col shadow-[-4px_0_24px_rgba(255,105,180,0.05)] z-10">
          <div className="p-6 border-b border-pink-50 bg-kitty-light/20">
            <h2 className="text-xl font-bold text-slate-800">Carrito Actual 🛒</h2>
          </div>

          {/* Lista del Carrito */}
          <div className="flex-1 overflow-y-auto p-6">
            {carrito.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <ShoppingBag size={48} className="mb-4 opacity-20" />
                <p>El carrito está vacío</p>
              </div>
            ) : (
              <div className="space-y-4">
                {carrito.map(item => (
                  <div key={item.producto._id} className="flex gap-3 border-b border-pink-50 pb-4">
                    <div className="flex-1">
                      <p className="font-bold text-slate-800 text-sm leading-tight">{item.producto.nombre}</p>
                      <p className="text-kitty-pink font-bold text-sm mt-1">Bs. {item.precioUnitario}</p>
                    </div>
                    <div className="flex flex-col items-end justify-between">
                      <button onClick={() => eliminarDelCarrito(item.producto._id)} className="text-red-400 hover:text-red-600 transition-colors mb-2">
                        <Trash2 size={16} />
                      </button>
                      <div className="flex items-center gap-3 bg-pink-50 rounded-full px-2 py-1">
                        <button onClick={() => modificarCantidad(item.producto._id, -1)} className="text-kitty-pink hover:text-kitty-rose">
                          <Minus size={14} />
                        </button>
                        <span className="font-bold text-sm w-4 text-center">{item.cantidad}</span>
                        <button onClick={() => modificarCantidad(item.producto._id, 1)} className="text-kitty-pink hover:text-kitty-rose">
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Totales y Checkout */}
          <div className="p-6 bg-slate-50 border-t border-pink-100">
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                  <User size={14} /> Cliente (Opcional)
                </label>
                <button onClick={() => setIsClienteModalOpen(true)} className="text-xs text-kitty-pink font-bold hover:underline flex items-center gap-1">
                  <Plus size={12} /> Nuevo
                </button>
              </div>
              <select 
                value={clienteSeleccionado} 
                onChange={(e) => setClienteSeleccionado(e.target.value)}
                className="w-full bg-white border border-pink-100 rounded-lg p-2 outline-none focus:border-kitty-pink text-sm"
              >
                <option value="">Consumidor Final</option>
                {clientes.map(c => (
                  <option key={c._id} value={c._id}>{c.nombre} {c.apellidos}</option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Caja / Cuenta Destino</label>
              <select 
                value={cuentaDestino} 
                onChange={(e) => setCuentaDestino(e.target.value)}
                className="w-full bg-white border border-pink-100 rounded-lg p-2 outline-none focus:border-kitty-pink text-sm font-medium text-slate-700"
              >
                {cuentasDb.map(c => (
                  <option key={c._id} value={c.nombre}>{c.nombre} - Bs. {(saldos[c.nombre] || 0).toFixed(2)}</option>
                ))}
              </select>
              {cuentaDestino && (
                <p className="mt-1 text-[10px] text-right font-bold text-emerald-500 uppercase tracking-widest">
                  Se sumará al saldo actual
                </p>
              )}
            </div>

            {/* Logística */}
            <div className="mb-6 bg-pink-50/50 p-4 rounded-xl border border-pink-100">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                <Truck size={14} /> Opciones de Entrega
              </label>
              <select 
                value={tipoEnvio} 
                onChange={(e) => { setTipoEnvio(e.target.value); setCostoEnvio(0); setDireccionEntrega(''); setPuntoEntrega(''); }}
                className="w-full bg-white border border-pink-200 rounded-lg p-2 outline-none focus:border-kitty-pink text-sm font-medium mb-3"
              >
                <option value="Envio a Domicilio">🏠 Envío a Domicilio</option>
                <option value="Envio Nacional">🚚 Envío Nacional</option>
                <option value="Punto de Entrega">📍 Punto de Entrega</option>
              </select>

              {/* Badge informativo según tipo */}
              {tipoEnvio === 'Envio Nacional' && (
                <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 text-xs rounded-lg px-3 py-2 mb-3">
                  <Truck size={12} />
                  <span>La tienda cobra y paga al servicio de encomienda</span>
                </div>
              )}
              {esPuntoEntrega && (
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-lg px-3 py-2 mb-3">
                  <MapPin size={12} />
                  <span>Sin costo de envío — el cliente recoge en punto coordinado</span>
                </div>
              )}

              <div className="space-y-3 mt-2">
                {/* Campo Costo de Envío: solo si NO es Punto de Entrega */}
                {!esPuntoEntrega && (
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Costo de Envío (Bs.)</label>
                    <input 
                      type="number" 
                      min="0"
                      value={costoEnvio} 
                      onChange={(e) => setCostoEnvio(e.target.value)}
                      className="w-full bg-white border border-pink-200 rounded-lg p-2 outline-none focus:border-kitty-pink text-sm"
                      placeholder="0.00"
                    />
                  </div>
                )}

                {/* Campo Dirección: Domicilio y Nacional */}
                {!esPuntoEntrega && (
                  <div>
                    <label className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                      <MapPin size={12}/>
                      {esEnvioNacional ? 'Ciudad / Departamento destino' : 'Dirección de Entrega'}
                    </label>
                    <input 
                      type="text" 
                      placeholder={esEnvioNacional ? 'Ej. Santa Cruz, Beni...' : 'Ej. Av. Principal #123'}
                      value={direccionEntrega} 
                      onChange={(e) => setDireccionEntrega(e.target.value)}
                      className="w-full bg-white border border-pink-200 rounded-lg p-2 outline-none focus:border-kitty-pink text-sm"
                    />
                  </div>
                )}

                {/* Campo Punto de Entrega */}
                {esPuntoEntrega && (
                  <div>
                    <label className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                      <MapPin size={12}/> Descripción del Punto de Entrega
                    </label>
                    <input 
                      type="text" 
                      placeholder="Ej. Farmacia Central, esquina calle X"
                      value={puntoEntrega} 
                      onChange={(e) => setPuntoEntrega(e.target.value)}
                      className="w-full bg-white border border-pink-200 rounded-lg p-2 outline-none focus:border-kitty-pink text-sm"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="mb-6">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Método de Pago</label>
              <div className="grid grid-cols-2 gap-2">
                {metodosPago.map(metodo => (
                  <button 
                    key={metodo.id}
                    onClick={() => setMetodoPago(metodo.id)}
                    className={`flex items-center gap-2 p-2 rounded-lg border text-sm transition-colors ${metodoPago === metodo.id ? 'border-kitty-pink bg-pink-50 text-kitty-pink font-bold' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                  >
                    <metodo.icon size={16} /> {metodo.id}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-slate-500 font-medium">Subtotal productos</span>
                <span className="font-bold text-slate-700">Bs. {totalCarrito.toFixed(2)}</span>
              </div>
              {!esPuntoEntrega && Number(costoEnvio) > 0 && (
                <div className="flex justify-between items-center mb-2 text-kitty-pink">
                  <span className="text-sm font-medium">
                    {esEnvioNacional ? '🚚 + Encomienda' : '🏠 + Envío'}
                  </span>
                  <span className="font-bold">Bs. {Number(costoEnvio).toFixed(2)}</span>
                </div>
              )}
              {esPuntoEntrega && (
                <div className="flex justify-between items-center mb-2 text-emerald-600">
                  <span className="text-sm font-medium">📍 Sin costo de envío</span>
                  <span className="font-bold">Bs. 0.00</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                <span className="text-lg text-slate-600 font-medium">Total a Cobrar</span>
                <span className="text-3xl font-black text-kitty-dark">Bs. {totalVenta.toFixed(2)}</span>
              </div>
            </div>

            <button 
              onClick={confirmarVenta}
              disabled={carrito.length === 0}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all shadow-lg flex justify-center items-center gap-2
                ${carrito.length === 0 
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none' 
                  : 'bg-kitty-pink text-white hover:bg-kitty-rose hover:-translate-y-1'
                }`}
            >
              <ShoppingBag /> Confirmar Venta
            </button>
          </div>
        </div>
      </div>
      
      {/* Modal Cliente Rápido */}
      {isClienteModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="bg-kitty-light px-6 py-4 border-b border-pink-100">
              <h2 className="text-lg font-bold text-kitty-dark">Registro Rápido ✨</h2>
            </div>
            <form onSubmit={handleCrearCliente} className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre (o Apodo)</label>
                <input required type="text" value={nuevoCliente.nombre} onChange={e => setNuevoCliente({...nuevoCliente, nombre: e.target.value})} className="w-full border border-pink-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-kitty-pink" placeholder="Ej. María" />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Celular (Opcional)</label>
                <input type="text" value={nuevoCliente.telefono} onChange={e => setNuevoCliente({...nuevoCliente, telefono: e.target.value})} className="w-full border border-pink-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-kitty-pink" placeholder="Ej. 78945612" />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setIsClienteModalOpen(false)} className="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 font-medium">Cancelar</button>
                <button type="submit" className="kitty-button py-2">Registrar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default VentasPage;
