import { useState, useEffect } from 'react';
import axios from 'axios';
import { Banknote, ShoppingBag, AlertTriangle, Users } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const DashboardPage = () => {
  const [stats, setStats] = useState({
    resumen: { totalVentas: 0, ventasCount: 0, bajoStockCount: 0, clientesCount: 0 },
    ventasRecientes: [],
    ventasGrafico: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/dashboard/stats`);
        setStats(response.data);
      } catch (error) {
        console.error("Error cargando dashboard:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const StatCard = ({ title, value, icon: Icon, colorClass }) => (
    <div className="kitty-card p-6 flex items-center justify-between transition-transform hover:-translate-y-1">
      <div>
        <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
        <h3 className="text-3xl font-bold text-slate-800">{value}</h3>
      </div>
      <div className={`p-4 rounded-full ${colorClass}`}>
        <Icon size={28} />
      </div>
    </div>
  );

  if (loading) return <div className="p-8 text-center text-kitty-pink">Cargando dashboard... 🎀</div>;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-kitty-pink mb-2">Bienvenida al Dashboard 🎀</h1>
        <p className="text-gray-600">Resumen general de Tienda Rosestore</p>
      </div>

      {/* Tarjetas de Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Ingresos Totales" 
          value={`Bs. ${stats.resumen.totalVentas.toFixed(2)}`} 
          icon={Banknote} 
          colorClass="bg-pink-100 text-kitty-pink" 
        />
        <StatCard 
          title="Ventas Realizadas" 
          value={stats.resumen.ventasCount} 
          icon={ShoppingBag} 
          colorClass="bg-blue-100 text-blue-500" 
        />
        <StatCard 
          title="Alertas de Stock" 
          value={stats.resumen.bajoStockCount} 
          icon={AlertTriangle} 
          colorClass="bg-yellow-100 text-yellow-600" 
        />
        <StatCard 
          title="Clientes Registrados" 
          value={stats.resumen.clientesCount} 
          icon={Users} 
          colorClass="bg-purple-100 text-purple-500" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Gráfico */}
        <div className="kitty-card p-6 lg:col-span-2">
          <h2 className="text-lg font-bold text-slate-800 mb-6">Ventas de los últimos 7 días</h2>
          <div className="h-72">
            {stats.ventasGrafico.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.ventasGrafico}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#fdf2f8" />
                  <XAxis dataKey="_id" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `Bs. ${value}`} />
                  <Tooltip cursor={{fill: '#fce7f3'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="total" fill="#FF69B4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-gray-400">
                No hay datos de ventas recientes para graficar.
              </div>
            )}
          </div>
        </div>

        {/* Lista de Ventas Recientes */}
        <div className="kitty-card p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Últimas Ventas</h2>
          <div className="space-y-4">
            {stats.ventasRecientes.length > 0 ? (
              stats.ventasRecientes.map((venta) => (
                <div key={venta._id} className="flex justify-between items-center border-b border-pink-50 pb-3 last:border-0">
                  <div>
                    <p className="font-medium text-slate-800">
                      {venta.cliente ? `${venta.cliente.nombre}` : 'Cliente Rápido'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(venta.fecha).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="font-bold text-kitty-dark">
                    Bs. {venta.total.toFixed(2)}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm text-center py-4">No hay ventas registradas aún.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
