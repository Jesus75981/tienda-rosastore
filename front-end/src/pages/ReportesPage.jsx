import { useState, useEffect } from 'react';
import axios from 'axios';
import { FileText, TrendingUp, Calendar, CheckCircle, XCircle, ShoppingCart, ShoppingBag, Package, User, Truck, RotateCcw } from 'lucide-react';

const ReportesPage = () => {
  const [ventas, setVentas] = useState([]);
  const [compras, setCompras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ventas'); // ventas, compras

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resVentas, resCompras] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/api/ventas`),
        axios.get(`${import.meta.env.VITE_API_URL}/api/compras`)
      ]);
      
      setVentas(resVentas.data.sort((a, b) => new Date(b.fecha) - new Date(a.fecha)));
      setCompras(resCompras.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } catch (error) {
      console.error("Error al cargar reportes:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAnularCompra = async (id) => {
    if (window.confirm("¿Estás seguro de ANULAR esta compra? Se descontará el stock ingresado y se devolverá el dinero a la caja como una devolución.")) {
      try {
        await axios.put(`${import.meta.env.VITE_API_URL}/api/compras/${id}/anular`);
        alert("Compra anulada con éxito. Stock y Dinero revertidos. 🔄");
        fetchData(); // Recargar datos
      } catch (error) {
        console.error(error);
        alert("Error al anular compra.");
      }
    }
  };

  const totalVendido = ventas.reduce((sum, v) => sum + (v.estado !== 'Anulada' ? v.total : 0), 0);
  const totalComprado = compras.reduce((sum, c) => sum + (c.estado !== 'Anulada' ? c.total : 0), 0);

  if (loading) return <div className="p-8 text-center text-kitty-pink font-bold">Generando reportes maestros... 🎀📊</div>;

  return (
    <div className="p-8 bg-slate-50 min-h-full">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-black text-slate-800 mb-2 flex items-center gap-3">
            <FileText size={40} className="text-kitty-pink" /> Centro de Reportes
          </h1>
          <p className="text-slate-500 font-medium italic">Análisis detallado de ingresos y egresos de Rosestore</p>
        </div>
      </div>

      {/* KPIs Rápidos */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-emerald-100 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Total Ventas</span>
            <div className="p-2 bg-emerald-50 text-emerald-500 rounded-xl"><ShoppingBag size={20} /></div>
          </div>
          <p className="text-2xl font-black text-slate-800">Bs. {totalVendido.toFixed(2)}</p>
          <p className="text-xs text-slate-400 mt-1">{ventas.filter(v => v.estado !== 'Anulada').length} operaciones exitosas</p>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-rose-100 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Inversión Stock</span>
            <div className="p-2 bg-rose-50 text-rose-500 rounded-xl"><ShoppingCart size={20} /></div>
          </div>
          <p className="text-2xl font-black text-slate-800">Bs. {totalComprado.toFixed(2)}</p>
          <p className="text-xs text-slate-400 mt-1">{compras.filter(c => c.estado !== 'Anulada').length} compras activas</p>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-pink-100 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-black text-kitty-pink uppercase tracking-widest">Utilidad Estimada</span>
            <div className="p-2 bg-pink-50 text-kitty-pink rounded-xl"><TrendingUp size={20} /></div>
          </div>
          <p className="text-2xl font-black text-slate-800">Bs. {(totalVendido - (totalComprado * 0.7)).toFixed(2)}</p>
          <p className="text-xs text-slate-400 mt-1">Margen operativo bruto</p>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Volumen</span>
            <div className="p-2 bg-slate-50 text-slate-500 rounded-xl"><Package size={20} /></div>
          </div>
          <p className="text-2xl font-black text-slate-800">{ventas.length + compras.length}</p>
          <p className="text-xs text-slate-400 mt-1">Movimientos totales</p>
        </div>
      </div>

      {/* Selector de Pestaña */}
      <div className="flex gap-4 mb-6 bg-white p-2 rounded-2xl border border-pink-100 w-fit">
        <button 
          onClick={() => setActiveTab('ventas')}
          className={`flex items-center gap-2 px-6 py-2 rounded-xl font-bold transition-all ${activeTab === 'ventas' ? 'bg-kitty-pink text-white shadow-md' : 'text-slate-500 hover:bg-pink-50'}`}
        >
          <ShoppingBag size={18} /> Historial de Ventas
        </button>
        <button 
          onClick={() => setActiveTab('compras')}
          className={`flex items-center gap-2 px-6 py-2 rounded-xl font-bold transition-all ${activeTab === 'compras' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}
        >
          <ShoppingCart size={18} /> Historial de Compras
        </button>
      </div>

      {/* Tabla Dinámica */}
      <div className="bg-white rounded-3xl shadow-sm border border-pink-100 overflow-hidden">
        {activeTab === 'ventas' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                  <th className="p-5 border-b border-pink-50">Fecha y Hora</th>
                  <th className="p-5 border-b border-pink-50">Cliente</th>
                  <th className="p-5 border-b border-pink-50 text-right">Monto</th>
                  <th className="p-5 border-b border-pink-50">Método / Cuenta</th>
                  <th className="p-5 border-b border-pink-50 text-center">Estado</th>
                </tr>
              </thead>
              <tbody>
                {ventas.map(v => (
                  <tr key={v._id} className="hover:bg-pink-50/30 transition-colors border-b border-slate-50 last:border-0">
                    <td className="p-5">
                      <p className="text-sm font-bold text-slate-700">{new Date(v.fecha).toLocaleDateString()}</p>
                      <p className="text-[10px] text-slate-400">{new Date(v.fecha).toLocaleTimeString()}</p>
                    </td>
                    <td className="p-5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-pink-100 flex items-center justify-center text-kitty-pink text-[10px] font-bold"><User size={14} /></div>
                        <span className="text-sm font-medium text-slate-600">{v.cliente?.nombre || 'Venta Rápida'}</span>
                      </div>
                    </td>
                    <td className="p-5 text-right font-black text-slate-800">Bs. {v.total.toFixed(2)}</td>
                    <td className="p-5">
                      <p className="text-xs font-bold text-slate-600">{v.metodoPago}</p>
                      <p className="text-[10px] text-slate-400">{v.cuentaDestino}</p>
                    </td>
                    <td className="p-5 text-center">
                      <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase ${v.estado === 'Completada' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-500'}`}>
                        {v.estado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                  <th className="p-5 border-b border-slate-100">Fecha</th>
                  <th className="p-5 border-b border-slate-100">Proveedor</th>
                  <th className="p-5 border-b border-slate-100 text-right">Inversión</th>
                  <th className="p-5 border-b border-slate-100">Productos</th>
                  <th className="p-5 border-b border-slate-100 text-center">Estado</th>
                  <th className="p-5 border-b border-slate-100 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {compras.map(c => (
                  <tr key={c._id} className={`hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 ${c.estado === 'Anulada' ? 'opacity-50' : ''}`}>
                    <td className="p-5">
                      <p className="text-sm font-bold text-slate-700">{new Date(c.createdAt).toLocaleDateString()}</p>
                    </td>
                    <td className="p-5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500"><Truck size={14} /></div>
                        <span className="text-sm font-medium text-slate-600">{c.proveedor?.nombreEmpresa || c.proveedor?.nombre || 'Importación'}</span>
                      </div>
                    </td>
                    <td className="p-5 text-right font-black text-slate-800">Bs. {c.total.toFixed(2)}</td>
                    <td className="p-5">
                      <span className="text-xs font-bold text-slate-500">{c.productos?.length || 0} items recibidos</span>
                    </td>
                    <td className="p-5 text-center">
                      <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase ${c.estado === 'Anulada' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                        {c.estado || 'Recibido'}
                      </span>
                    </td>
                    <td className="p-5 text-center">
                      {c.estado !== 'Anulada' && (
                        <button 
                          onClick={() => handleAnularCompra(c._id)}
                          className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all"
                          title="Anular Compra"
                        >
                          <RotateCcw size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportesPage;
