import { useState, useEffect } from 'react';
import axios from 'axios';
import { Truck, MapPin, Search, Package, User, CheckCircle, Clock } from 'lucide-react';

const LogisticaPage = () => {
  const [entregas, setEntregas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchEntregas = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:5000/api/logistica/detalles');
      setEntregas(res.data);
    } catch (error) {
      console.error("Error al cargar logística:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntregas();
  }, []);

  const handleUpdate = async (id, field, value) => {
    try {
      await axios.put(`http://localhost:5000/api/logistica/${id}`, { [field]: value });
      setEntregas(entregas.map(e => e._id === id ? { ...e, [field]: value } : e));
    } catch (error) {
      console.error("Error al actualizar logística:", error);
      alert("No se pudo actualizar el registro.");
    }
  };

  const entregasFiltradas = entregas.filter(e => {
    const cliente = e.venta?.cliente?.nombre || 'Consumidor Final';
    return cliente.toLowerCase().includes(searchTerm.toLowerCase()) || 
           e.tipoEnvio.toLowerCase().includes(searchTerm.toLowerCase()) ||
           (e.direccionEntrega && e.direccionEntrega.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  const getStatusColor = (estado) => {
    switch(estado) {
      case 'Preparando': return 'bg-yellow-100 text-yellow-700';
      case 'En Camino': return 'bg-blue-100 text-blue-700';
      case 'Entregado': return 'bg-green-100 text-green-700';
      case 'Devuelto': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) return <div className="p-8 text-center text-kitty-pink">Cargando módulo de logística... 🚚</div>;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-kitty-pink mb-2 flex items-center gap-2">
            <Truck size={32} /> Logística y Envíos
          </h1>
          <p className="text-gray-600">Gestiona los despachos, envíos a domicilio y retiros</p>
        </div>
      </div>

      <div className="kitty-card p-6 mb-8 flex items-center gap-4">
        <Search className="text-gray-400" />
        <input 
          type="text" 
          placeholder="Buscar por cliente, tipo de envío o dirección..." 
          className="flex-1 outline-none text-slate-700 bg-transparent"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-pink-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider">
                <th className="p-4 border-b border-pink-100 font-bold">Fecha / Venta</th>
                <th className="p-4 border-b border-pink-100 font-bold">Cliente</th>
                <th className="p-4 border-b border-pink-100 font-bold">Envío / Dirección</th>
                <th className="p-4 border-b border-pink-100 font-bold text-center">Estado</th>
                <th className="p-4 border-b border-pink-100 font-bold">Repartidor</th>
              </tr>
            </thead>
            <tbody>
              {entregasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-500">
                    No hay registros de logística. 🚚
                  </td>
                </tr>
              ) : (
                entregasFiltradas.map(entrega => (
                  <tr key={entrega._id} className="hover:bg-pink-50/50 transition-colors border-b border-pink-50 last:border-0">
                    <td className="p-4">
                      <p className="font-bold text-slate-800 text-sm">{new Date(entrega.createdAt).toLocaleDateString()}</p>
                      <p className="text-xs text-gray-400 font-mono">ID: {entrega.venta?._id.substring(0,6)}...</p>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-pink-500">
                          <User size={16} />
                        </div>
                        <span className="font-bold text-slate-700">
                          {entrega.venta?.cliente?.nombre 
                            ? `${entrega.venta.cliente.nombre} ${entrega.venta.cliente.apellidos || ''}` 
                            : 'Consumidor Final'}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-kitty-pink text-sm flex items-center gap-1">
                        <Truck size={14}/>
                        {entrega.tipoEnvio}
                      </p>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                        <MapPin size={12} /> {entrega.direccionEntrega || 'Sin dirección registrada'}
                      </p>
                      {entrega.costoEnvio > 0 && (
                        <p className="text-xs font-bold text-slate-600 mt-1">Costo: Bs. {entrega.costoEnvio}</p>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <select
                        value={entrega.estadoEntrega}
                        onChange={(e) => handleUpdate(entrega._id, 'estadoEntrega', e.target.value)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-full outline-none border-2 border-transparent focus:border-pink-300 appearance-none cursor-pointer ${getStatusColor(entrega.estadoEntrega)}`}
                      >
                        <option value="Preparando">Preparando</option>
                        <option value="En Camino">En Camino</option>
                        <option value="Entregado">Entregado</option>
                        <option value="Devuelto">Devuelto</option>
                      </select>
                    </td>
                    <td className="p-4">
                      <input 
                        type="text" 
                        placeholder="Asignar repartidor..."
                        defaultValue={entrega.repartidor || ''}
                        onBlur={(e) => {
                          if (e.target.value !== entrega.repartidor) {
                            handleUpdate(entrega._id, 'repartidor', e.target.value);
                          }
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm outline-none focus:border-kitty-pink focus:bg-white"
                      />
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

export default LogisticaPage;
