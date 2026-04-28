import { useState, useEffect } from 'react';
import axios from 'axios';
import { FileText, TrendingUp, Calendar, CheckCircle, XCircle } from 'lucide-react';

const ReportesPage = () => {
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReportes = async () => {
      try {
        // En el futuro podemos cargar compras también
        const res = await axios.get('import.meta.env.VITE_API_URL/api/ventas');
        // Ordenar por fecha descendente
        const ventasOrdenadas = res.data.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
        setVentas(ventasOrdenadas);
      } catch (error) {
        console.error("Error al cargar reportes:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchReportes();
  }, []);

  const totalVendido = ventas.reduce((sum, v) => sum + (v.estado !== 'Anulada' ? v.total : 0), 0);

  if (loading) return <div className="p-8 text-center text-kitty-pink">Cargando reportes... 🎀</div>;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-kitty-pink mb-2 flex items-center gap-2">
            <FileText size={32} /> Reportes del Sistema
          </h1>
          <p className="text-gray-600">Revisa el historial de ventas y movimientos</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="kitty-card p-6 flex items-center gap-4 border-l-4 border-kitty-pink">
          <div className="p-4 bg-pink-100 rounded-full text-kitty-pink">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-bold uppercase tracking-wider">Total Generado</p>
            <p className="text-2xl font-black text-slate-800">Bs. {totalVendido.toFixed(2)}</p>
          </div>
        </div>
        <div className="kitty-card p-6 flex items-center gap-4 border-l-4 border-fuchsia-400">
          <div className="p-4 bg-fuchsia-100 rounded-full text-fuchsia-500">
            <CheckCircle size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-bold uppercase tracking-wider">Ventas Exitosas</p>
            <p className="text-2xl font-black text-slate-800">
              {ventas.filter(v => v.estado !== 'Anulada').length}
            </p>
          </div>
        </div>
        <div className="kitty-card p-6 flex items-center gap-4 border-l-4 border-gray-400">
          <div className="p-4 bg-gray-100 rounded-full text-gray-500">
            <Calendar size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-bold uppercase tracking-wider">Total Operaciones</p>
            <p className="text-2xl font-black text-slate-800">{ventas.length}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-pink-100 overflow-hidden">
        <div className="bg-kitty-light px-6 py-4 border-b border-pink-100">
          <h2 className="text-lg font-bold text-kitty-dark">Historial de Ventas</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-sm uppercase tracking-wider">
                <th className="p-4 border-b border-pink-100 font-bold">Fecha y Hora</th>
                <th className="p-4 border-b border-pink-100 font-bold">Método Pago</th>
                <th className="p-4 border-b border-pink-100 font-bold">Cuenta Destino</th>
                <th className="p-4 border-b border-pink-100 font-bold text-right">Total (Bs.)</th>
                <th className="p-4 border-b border-pink-100 font-bold text-center">Estado</th>
              </tr>
            </thead>
            <tbody>
              {ventas.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-500">
                    No hay ventas registradas aún. 🛍️
                  </td>
                </tr>
              ) : (
                ventas.map(venta => (
                  <tr key={venta._id} className="hover:bg-pink-50/50 transition-colors border-b border-pink-50 last:border-0">
                    <td className="p-4 text-slate-700">
                      {new Date(venta.fecha).toLocaleString()}
                    </td>
                    <td className="p-4 text-slate-600 font-medium">
                      {venta.metodoPago}
                    </td>
                    <td className="p-4 text-slate-600">
                      {venta.cuentaDestino || 'N/A'}
                    </td>
                    <td className="p-4 text-kitty-pink font-bold text-right">
                      Bs. {venta.total.toFixed(2)}
                    </td>
                    <td className="p-4 text-center">
                      {venta.estado === 'Completada' ? (
                        <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold">
                          <CheckCircle size={12} /> Exitoso
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-bold">
                          <XCircle size={12} /> Anulada
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReportesPage;

