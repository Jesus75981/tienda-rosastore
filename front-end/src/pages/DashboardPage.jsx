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
  const [periodo, setPeriodo] = useState('general');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/dashboard/stats?periodo=${periodo}`);
        setStats(response.data);
      } catch (error) {
        console.error("Error cargando dashboard:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [periodo]);

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
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-kitty-pink mb-2">Bienvenida al Dashboard 🎀</h1>
          <p className="text-gray-600">Resumen general de Tienda Rosestore</p>
        </div>
        <div className="flex bg-pink-50 p-1 rounded-xl shadow-sm border border-pink-100">
          {[
            { id: 'general', label: 'Todo' },
            { id: 'dia', label: 'Hoy' },
            { id: 'semana', label: '7 Días' },
            { id: 'mes', label: 'Mes' },
            { id: 'año', label: 'Año' }
          ].map((opt) => (
            <button
              key={opt.id}
              onClick={() => setPeriodo(opt.id)}
              className={`px-4 py-2 text-sm font-bold rounded-lg transition-all duration-300 ${
                periodo === opt.id 
                  ? 'bg-kitty-pink text-white shadow-md transform scale-105' 
                  : 'text-gray-500 hover:text-kitty-pink hover:bg-pink-100'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
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
          <h2 className="text-lg font-bold text-slate-800 mb-6">
            Gráfico de Ventas {periodo === 'dia' ? '(Hoy)' : periodo === 'semana' ? '(Últimos 7 días)' : periodo === 'mes' ? '(Último mes)' : periodo === 'año' ? '(Último año)' : '(Últimos 7 días por defecto)'}
          </h2>
          <div className="h-72">
            {stats.ventasGrafico.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.ventasGrafico} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF69B4" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#FF69B4" stopOpacity={0.2}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#fce7f3" />
                  <XAxis 
                    dataKey="_id" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#9ca3af', fontSize: 12 }} 
                    dy={10}
                    tickFormatter={(dateStr) => {
                      if (!dateStr) return '';
                      const partes = dateStr.split('-');
                      if (partes.length === 3) return `${partes[2]}/${partes[1]}`; // DD/MM
                      if (partes.length === 2) {
                        const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
                        const mesIndex = parseInt(partes[1], 10) - 1;
                        return `${meses[mesIndex] || partes[1]} ${partes[0].substring(2)}`; // Ene 26
                      }
                      return dateStr;
                    }}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                    tickFormatter={(value) => `Bs.${value}`} 
                  />
                  <Tooltip 
                    cursor={{fill: 'rgba(255, 105, 180, 0.05)'}} 
                    contentStyle={{ 
                      borderRadius: '16px', 
                      border: 'none', 
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      padding: '12px 16px'
                    }} 
                    itemStyle={{ color: '#FF69B4', fontWeight: 'bold' }}
                    formatter={(value) => [`Bs. ${value.toFixed(2)}`, 'Total']}
                    labelStyle={{ color: '#6b7280', marginBottom: '4px' }}
                  />
                  <Bar 
                    dataKey="total" 
                    fill="url(#colorTotal)" 
                    radius={[6, 6, 0, 0]} 
                    barSize={40}
                    animationDuration={1500}
                    animationEasing="ease-out"
                  />
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
