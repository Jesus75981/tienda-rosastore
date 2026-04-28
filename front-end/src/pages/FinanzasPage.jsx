import { useState, useEffect } from 'react';
import axios from 'axios';
import { Wallet, TrendingUp, TrendingDown, Filter, FileText, Plus, Search, X, Download, Edit2, Trash2, List } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const FinanzasPage = () => {
  const [resumen, setResumen] = useState({ ingresos: 0, egresos: 0, balance: 0, saldos: {} });
  const [transacciones, setTransacciones] = useState([]);
  const [cuentas, setCuentas] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState('transacciones'); // transacciones, cuentas
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCuentaModalOpen, setIsCuentaModalOpen] = useState(false);
  const [cuentaModalMode, setCuentaModalMode] = useState('crear');
  const [cuentaEditId, setCuentaEditId] = useState(null);
  
  const allAccountsNames = Array.from(new Set([...cuentas.map(c => c.nombre), ...Object.keys(resumen.saldos)]));
  
  // Filtros
  const [filtroTipo, setFiltroTipo] = useState('Todos');
  const [filtroFechaInicio, setFiltroFechaInicio] = useState('');
  const [filtroFechaFin, setFiltroFechaFin] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Formulario de Transacción
  const [nuevaTransaccion, setNuevaTransaccion] = useState({
    tipoTransaccion: 'Ingreso',
    monto: '',
    cuenta: 'Caja Tienda',
    cuentaOrigen: '',
    categoria: '',
    descripcion: '',
    metodoPago: 'Efectivo'
  });
  // Formulario de Cuenta
  const [nuevaCuenta, setNuevaCuenta] = useState({ nombre: '', tipo: 'Efectivo', saldoInicial: '0' });

  const categoriasIngreso = ['Venta', 'Ingreso Manual', 'Inversión', 'Otros Ingresos'];
  const categoriasEgreso = ['Compra de Mercadería', 'Pago a Proveedor', 'Servicios (Luz/Agua)', 'Sueldos', 'Gasto Operativo', 'Otros Gastos'];

  const fetchData = async () => {
    try {
      setLoading(true);
      // Query parameters for the summary and transactions
      let query = '';
      if (filtroFechaInicio && filtroFechaFin) {
        query = `?startDate=${filtroFechaInicio}&endDate=${filtroFechaFin}`;
      }

      const [resResumen, resTrans, resCuentas] = await Promise.all([
        axios.get(`https://tienda-rosastore.onrender.com/api/finanzas/resumen${query}`),
        axios.get(`https://tienda-rosastore.onrender.com/api/finanzas`), // Get all transactions (could also pass query, but generic API returns all by default)
        axios.get(`https://tienda-rosastore.onrender.com/api/cuentas`)
      ]);
      
      setResumen(resResumen.data);
      setCuentas(resCuentas.data);
      
      // Filtro local de transacciones
      let filtered = resTrans.data.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      
      if (filtroFechaInicio) filtered = filtered.filter(t => new Date(t.fecha) >= new Date(filtroFechaInicio));
      if (filtroFechaFin) filtered = filtered.filter(t => new Date(t.fecha) <= new Date(filtroFechaFin));
      
      setTransacciones(filtered);
    } catch (error) {
      console.error("Error al cargar finanzas:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filtroFechaInicio, filtroFechaFin]);

  const transaccionesVisibles = transacciones.filter(t => {
    if (filtroTipo !== 'Todos' && t.tipoTransaccion !== filtroTipo) return false;
    const searchLow = searchTerm.toLowerCase();
    if (searchTerm && !t.descripcion?.toLowerCase().includes(searchLow) && !t.categoria.toLowerCase().includes(searchLow) && !t.cuenta.toLowerCase().includes(searchLow)) {
      return false;
    }
    return true;
  });

  const handleCrearTransaccion = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/finanzas`, {
        ...nuevaTransaccion,
        monto: parseFloat(nuevaTransaccion.monto)
      });
      setIsModalOpen(false);
      setNuevaTransaccion({ tipoTransaccion: 'Ingreso', monto: '', cuenta: 'Caja Tienda', cuentaOrigen: '', categoria: '', descripcion: '', metodoPago: 'Efectivo' });
      fetchData();
      alert('Transacción registrada con éxito. 🎀');
    } catch (error) {
      console.error(error);
      alert('Error al registrar la transacción.');
    }
  };

  const handleGuardarCuenta = async (e) => {
    e.preventDefault();
    try {
      if (cuentaModalMode === 'crear') {
        // 1. Crear la cuenta
        await axios.post(`${import.meta.env.VITE_API_URL}/api/cuentas`, {
          nombre: nuevaCuenta.nombre,
          tipo: nuevaCuenta.tipo
        });

        // 2. Registrar saldo inicial
        if (nuevaCuenta.saldoInicial && parseFloat(nuevaCuenta.saldoInicial) >= 0) {
          await axios.post(`${import.meta.env.VITE_API_URL}/api/finanzas`, {
            tipoTransaccion: 'Ingreso',
            monto: parseFloat(nuevaCuenta.saldoInicial),
            cuenta: nuevaCuenta.nombre,
            categoria: 'Saldo Inicial',
            descripcion: 'Apertura de cuenta'
          });
        }
        alert('Cuenta registrada con éxito. 🎀');
      } else {
        // Editar cuenta
        await axios.put(`https://tienda-rosastore.onrender.com/api/cuentas/${cuentaEditId}`, {
          nombre: nuevaCuenta.nombre,
          tipo: nuevaCuenta.tipo
        });
        alert('Cuenta actualizada con éxito.');
      }

      setIsCuentaModalOpen(false);
      setNuevaCuenta({ nombre: '', tipo: 'Efectivo', saldoInicial: '0' });
      fetchData();
    } catch (error) {
      console.error(error);
      alert('Error al guardar la cuenta. ' + (error.response?.data?.message || ''));
    }
  };

  const handleEliminarCuenta = async (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta cuenta? Los movimientos asociados seguirán existiendo en el historial.')) {
      try {
        await axios.delete(`https://tienda-rosastore.onrender.com/api/cuentas/${id}`);
        fetchData();
        alert('Cuenta eliminada.');
      } catch (error) {
        console.error(error);
        alert('Error al eliminar la cuenta.');
      }
    }
  };

  const abrirModalEditarCuenta = (cuenta) => {
    setCuentaModalMode('editar');
    setCuentaEditId(cuenta._id);
    setNuevaCuenta({ nombre: cuenta.nombre, tipo: cuenta.tipo, saldoInicial: '0' });
    setIsCuentaModalOpen(true);
  };

  const abrirModalCrearCuenta = () => {
    setCuentaModalMode('crear');
    setCuentaEditId(null);
    setNuevaCuenta({ nombre: '', tipo: 'Efectivo', saldoInicial: '0' });
    setIsCuentaModalOpen(true);
  };

  const verMovimientosCuenta = (nombre) => {
    setSearchTerm(nombre);
    setActiveTab('transacciones');
  };

  const exportarPDF = () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const fechaActual = new Date().toLocaleDateString();

    doc.setFontSize(18);
    doc.setTextColor(255, 105, 180); // Kitty Pink
    doc.text('Reporte Financiero Ejecutivo - ROSESTORE', 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Fecha de emisión: ${fechaActual}`, 14, 28);
    doc.text(`Período: ${filtroFechaInicio || 'Inicio'} hasta ${filtroFechaFin || 'Hoy'}`, 14, 33);

    // Resumen KPIs
    doc.setDrawColor(255, 192, 203);
    doc.rect(14, 40, 182, 20);
    doc.setFont('helvetica', 'bold');
    doc.text(`Ingresos: Bs. ${resumen.ingresos.toFixed(2)}`, 20, 52);
    doc.text(`Egresos: Bs. ${resumen.egresos.toFixed(2)}`, 80, 52);
    doc.text(`BALANCE: Bs. ${resumen.balance.toFixed(2)}`, 140, 52);

    const tableColumn = ["Fecha", "Tipo", "Categoría / Desc", "Cuenta", "Monto (Bs)"];
    const tableRows = transaccionesVisibles.map(t => [
      new Date(t.fecha).toLocaleDateString(),
      t.tipoTransaccion,
      `${t.categoria} ${t.descripcion ? '- ' + t.descripcion : ''}`,
      t.tipoTransaccion === 'Transferencia' ? `${t.cuentaOrigen} ➡️ ${t.cuenta}` : t.cuenta,
      `${t.tipoTransaccion === 'Egreso' ? '-' : ''}${t.monto.toFixed(2)}`
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 70,
      theme: 'striped',
      headStyles: { fillColor: [255, 105, 180] },
      styles: { fontSize: 9 }
    });

    doc.save(`Reporte_Finanzas_${fechaActual.replace(/\//g, '-')}.pdf`);
  };

  if (loading && transacciones.length === 0) return <div className="p-8 text-center text-kitty-pink">Calculando finanzas... 💰🎀</div>;

  return (
    <div className="flex flex-col h-full bg-slate-50 relative">
      <div className="p-6">
        {/* Cabecera y KPIs */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-kitty-pink flex items-center gap-2">
            <Wallet size={32} /> Dashboard Ejecutivo
          </h1>
          <div className="flex gap-3">
            <button onClick={exportarPDF} className="flex items-center gap-2 px-4 py-2 bg-white border border-pink-200 text-kitty-pink font-bold rounded-lg hover:bg-pink-50 transition-colors shadow-sm">
              <Download size={18} /> Exportar PDF
            </button>
            <button onClick={() => setIsModalOpen(true)} className="kitty-button flex items-center gap-2 py-2">
              <Plus size={18} /> Nueva Transacción
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-emerald-100 flex items-center justify-between">
            <div>
              <p className="text-emerald-600 font-bold text-sm mb-1 uppercase tracking-wider">Total Ingresos</p>
              <h2 className="text-3xl font-black text-slate-800">Bs. {resumen.ingresos.toFixed(2)}</h2>
            </div>
            <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500">
              <TrendingUp size={24} />
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-rose-100 flex items-center justify-between">
            <div>
              <p className="text-rose-500 font-bold text-sm mb-1 uppercase tracking-wider">Total Egresos</p>
              <h2 className="text-3xl font-black text-slate-800">Bs. {resumen.egresos.toFixed(2)}</h2>
            </div>
            <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center text-rose-500">
              <TrendingDown size={24} />
            </div>
          </div>

          <div className={`bg-gradient-to-r ${resumen.balance >= 0 ? 'from-kitty-rose to-kitty-pink' : 'from-rose-400 to-red-500'} rounded-2xl p-6 shadow-md flex items-center justify-between text-white`}>
            <div>
              <p className="font-bold text-sm mb-1 text-white/80 uppercase tracking-wider">Balance Total</p>
              <h2 className="text-4xl font-black">Bs. {resumen.balance.toFixed(2)}</h2>
            </div>
            <span className="text-4xl font-black opacity-80">Bs.</span>
          </div>
        </div>

        {/* Controles y Filtros */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-pink-50 mb-6 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-2 bg-slate-100 p-1 rounded-lg">
            <button onClick={() => setActiveTab('transacciones')} className={`px-4 py-2 text-sm font-bold rounded-md transition-colors ${activeTab === 'transacciones' ? 'bg-white text-kitty-pink shadow-sm' : 'text-slate-500'}`}>Transacciones</button>
            <button onClick={() => setActiveTab('cuentas')} className={`px-4 py-2 text-sm font-bold rounded-md transition-colors ${activeTab === 'cuentas' ? 'bg-white text-kitty-pink shadow-sm' : 'text-slate-500'}`}>Saldos por Cuenta</button>
          </div>

          {activeTab === 'transacciones' && (
            <div className="flex gap-4 items-center">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-500 uppercase">Desde</span>
                <input type="date" value={filtroFechaInicio} onChange={e => setFiltroFechaInicio(e.target.value)} className="border border-pink-100 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-kitty-pink" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-500 uppercase">Hasta</span>
                <input type="date" value={filtroFechaFin} onChange={e => setFiltroFechaFin(e.target.value)} className="border border-pink-100 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-kitty-pink" />
              </div>
              <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)} className="border border-pink-100 rounded-lg px-3 py-1.5 text-sm font-bold text-slate-700 outline-none focus:border-kitty-pink bg-white">
                <option value="Todos">Todos los Movimientos</option>
                <option value="Ingreso">Solo Ingresos</option>
                <option value="Egreso">Solo Egresos</option>
                <option value="Transferencia">Solo Transferencias</option>
              </select>
            </div>
          )}

          {activeTab === 'cuentas' && (
            <button onClick={abrirModalCrearCuenta} className="kitty-button flex items-center gap-2 py-1.5 px-3 text-sm">
              <Plus size={16} /> Nueva Cuenta
            </button>
          )}
        </div>

        {/* Contenido Principal */}
        {activeTab === 'transacciones' ? (
          <div className="bg-white rounded-2xl shadow-sm border border-pink-100 overflow-hidden">
            <div className="p-4 border-b border-pink-50 flex items-center bg-kitty-light/20">
              <Search className="text-pink-300 mr-3" />
              <input type="text" placeholder="Buscar por categoría, cuenta o descripción..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="flex-1 bg-transparent outline-none text-slate-700" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-bold">
                    <th className="p-4 border-b border-pink-50">Fecha</th>
                    <th className="p-4 border-b border-pink-50">Tipo</th>
                    <th className="p-4 border-b border-pink-50">Categoría</th>
                    <th className="p-4 border-b border-pink-50">Cuenta</th>
                    <th className="p-4 border-b border-pink-50 text-right">Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {transaccionesVisibles.map(t => (
                    <tr key={t._id} className="hover:bg-pink-50/30 transition-colors border-b border-slate-50 last:border-0">
                      <td className="p-4 text-sm text-slate-600">{new Date(t.fecha).toLocaleString()}</td>
                      <td className="p-4">
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${t.tipoTransaccion === 'Ingreso' ? 'bg-emerald-100 text-emerald-600' : t.tipoTransaccion === 'Egreso' ? 'bg-rose-100 text-rose-500' : 'bg-blue-100 text-blue-600'}`}>
                          {t.tipoTransaccion}
                        </span>
                      </td>
                      <td className="p-4">
                        <p className="font-bold text-slate-700 text-sm">{t.categoria}</p>
                        <p className="text-xs text-slate-400 line-clamp-1">{t.descripcion}</p>
                        {t.metodoPago && <p className="text-xs text-kitty-pink font-medium mt-1">Pago: {t.metodoPago}</p>}
                      </td>
                      <td className="p-4 text-sm font-medium text-slate-600">
                        {t.tipoTransaccion === 'Transferencia' ? `${t.cuentaOrigen} ➡️ ${t.cuenta}` : t.cuenta}
                      </td>
                      <td className={`p-4 text-right font-black ${t.tipoTransaccion === 'Ingreso' ? 'text-emerald-500' : t.tipoTransaccion === 'Egreso' ? 'text-rose-500' : 'text-blue-500'}`}>
                        {t.tipoTransaccion === 'Egreso' ? '-' : t.tipoTransaccion === 'Ingreso' ? '+' : ''}Bs. {t.monto.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                  {transaccionesVisibles.length === 0 && (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-slate-400">No hay transacciones para mostrar.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allAccountsNames.map(nombreCuenta => {
              const cuentaDb = cuentas.find(c => c.nombre === nombreCuenta);
              const tipo = cuentaDb ? cuentaDb.tipo : 'Histórica';
              return (
              <div key={nombreCuenta} className="bg-white rounded-2xl p-6 shadow-sm border border-pink-100 flex flex-col justify-between hover:border-kitty-pink transition-colors group">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center text-kitty-pink">
                      <FileText size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">{nombreCuenta}</h3>
                      {cuentaDb && <p className="text-xs text-slate-400">{tipo}</p>}
                    </div>
                  </div>
                  <div className="flex gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-100 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => verMovimientosCuenta(nombreCuenta)} className="p-1.5 text-slate-400 hover:text-kitty-pink hover:bg-white rounded-md transition-all shadow-sm" title="Ver Movimientos"><List size={14} /></button>
                    {cuentaDb && (
                      <>
                        <button onClick={() => abrirModalEditarCuenta(cuentaDb)} className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-white rounded-md transition-all shadow-sm" title="Editar"><Edit2 size={14} /></button>
                        <button onClick={() => handleEliminarCuenta(cuentaDb._id)} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-white rounded-md transition-all shadow-sm" title="Eliminar"><Trash2 size={14} /></button>
                      </>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Saldo Actual</p>
                  <p className="text-3xl font-black text-slate-800">Bs. {(resumen.saldos[nombreCuenta] || 0).toFixed(2)}</p>
                </div>
              </div>
            )})}
            {allAccountsNames.length === 0 && (
              <div className="col-span-full p-8 text-center text-slate-400">No hay cuentas registradas. Crea una para comenzar.</div>
            )}
          </div>
        )}
      </div>

      {/* Modal Nueva Transacción */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="bg-kitty-light px-6 py-4 flex justify-between items-center border-b border-pink-100">
              <h2 className="text-xl font-bold text-kitty-dark">Registrar Movimiento 💸</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-kitty-pink"><X size={24} /></button>
            </div>
            <form onSubmit={handleCrearTransaccion} className="p-6">
              
              <div className="mb-4">
                <label className="block text-sm font-bold text-gray-700 mb-2">Tipo de Movimiento</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Ingreso', 'Egreso', 'Transferencia'].map(tipo => (
                    <button 
                      key={tipo} type="button" 
                      onClick={() => setNuevaTransaccion({...nuevaTransaccion, tipoTransaccion: tipo, categoria: ''})}
                      className={`py-2 text-sm font-bold rounded-lg border transition-colors ${nuevaTransaccion.tipoTransaccion === tipo ? 'bg-kitty-pink text-white border-kitty-pink' : 'bg-white text-slate-600 border-pink-200 hover:bg-pink-50'}`}
                    >
                      {tipo}
                    </button>
                  ))}
                </div>
              </div>

              {nuevaTransaccion.tipoTransaccion === 'Transferencia' ? (
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">De (Cuenta Origen)</label>
                    <input type="text" list="cuentas-list" required value={nuevaTransaccion.cuentaOrigen} onChange={e=>setNuevaTransaccion({...nuevaTransaccion, cuentaOrigen: e.target.value})} className="w-full border border-pink-200 rounded-lg px-3 py-2 outline-none focus:border-kitty-pink" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">A (Cuenta Destino)</label>
                    <input type="text" list="cuentas-list" required value={nuevaTransaccion.cuenta} onChange={e=>setNuevaTransaccion({...nuevaTransaccion, cuenta: e.target.value})} className="w-full border border-pink-200 rounded-lg px-3 py-2 outline-none focus:border-kitty-pink" />
                  </div>
                </div>
              ) : (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cuenta Bancaria / Caja</label>
                  <input type="text" list="cuentas-list" required value={nuevaTransaccion.cuenta} onChange={e=>setNuevaTransaccion({...nuevaTransaccion, cuenta: e.target.value})} className="w-full border border-pink-200 rounded-lg px-3 py-2 outline-none focus:border-kitty-pink" />
                </div>
              )}
              
              <datalist id="cuentas-list">
                {allAccountsNames.map(c => <option key={c} value={c} />)}
              </datalist>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Monto (Bs.)</label>
                  <input type="number" step="0.01" required value={nuevaTransaccion.monto} onChange={e=>setNuevaTransaccion({...nuevaTransaccion, monto: e.target.value})} className="w-full border border-pink-200 rounded-lg px-3 py-2 outline-none focus:border-kitty-pink text-lg font-bold" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Método de Pago</label>
                  <select value={nuevaTransaccion.metodoPago} onChange={e=>setNuevaTransaccion({...nuevaTransaccion, metodoPago: e.target.value})} className="w-full border border-pink-200 rounded-lg px-3 py-2 outline-none focus:border-kitty-pink bg-white">
                    <option value="Efectivo">Efectivo</option>
                    <option value="Transferencia">Transferencia</option>
                    <option value="Tarjeta">Tarjeta</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                <input 
                  type="text" required 
                  list={nuevaTransaccion.tipoTransaccion === 'Ingreso' ? 'categorias-ingreso' : 'categorias-egreso'}
                  value={nuevaTransaccion.tipoTransaccion === 'Transferencia' ? 'Transferencia Interna' : nuevaTransaccion.categoria} 
                  onChange={e=>setNuevaTransaccion({...nuevaTransaccion, categoria: e.target.value})} 
                  className="w-full border border-pink-200 rounded-lg px-3 py-2 outline-none focus:border-kitty-pink" 
                  disabled={nuevaTransaccion.tipoTransaccion === 'Transferencia'}
                />
                <datalist id="categorias-ingreso">{categoriasIngreso.map(c => <option key={c} value={c} />)}</datalist>
                <datalist id="categorias-egreso">{categoriasEgreso.map(c => <option key={c} value={c} />)}</datalist>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción / Referencia</label>
                <input type="text" value={nuevaTransaccion.descripcion} onChange={e=>setNuevaTransaccion({...nuevaTransaccion, descripcion: e.target.value})} className="w-full border border-pink-200 rounded-lg px-3 py-2 outline-none focus:border-kitty-pink" />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-pink-50">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2 rounded-full border border-pink-200 text-gray-600 font-medium">Cancelar</button>
                <button type="submit" className="kitty-button">Guardar Movimiento</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Nueva/Editar Cuenta */}
      {isCuentaModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="bg-kitty-light px-6 py-4 flex justify-between items-center border-b border-pink-100">
              <h2 className="text-xl font-bold text-kitty-dark">{cuentaModalMode === 'crear' ? 'Registrar Cuenta 🏦' : 'Editar Cuenta 📝'}</h2>
              <button onClick={() => setIsCuentaModalOpen(false)} className="text-gray-500 hover:text-kitty-pink"><X size={24} /></button>
            </div>
            <form onSubmit={handleGuardarCuenta} className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la Cuenta / Caja</label>
                <input type="text" required value={nuevaCuenta.nombre} onChange={e=>setNuevaCuenta({...nuevaCuenta, nombre: e.target.value})} className="w-full border border-pink-200 rounded-lg px-3 py-2 outline-none focus:border-kitty-pink" placeholder="Ej. Banco Bisa, Caja Chica..." />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select value={nuevaCuenta.tipo} onChange={e=>setNuevaCuenta({...nuevaCuenta, tipo: e.target.value})} className="w-full border border-pink-200 rounded-lg px-3 py-2 outline-none focus:border-kitty-pink bg-white">
                  <option value="Efectivo">Efectivo (Caja)</option>
                  <option value="Banco">Banco</option>
                </select>
              </div>
              {cuentaModalMode === 'crear' && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Saldo Inicial (Bs.) *</label>
                  <input type="number" step="0.01" min="0" required value={nuevaCuenta.saldoInicial} onChange={e=>setNuevaCuenta({...nuevaCuenta, saldoInicial: e.target.value})} className="w-full border border-pink-200 rounded-lg px-3 py-2 outline-none focus:border-kitty-pink" placeholder="Ej. 150.00" />
                  <p className="text-xs text-slate-400 mt-1">Este campo es obligatorio. Si no tiene saldo, pon 0.</p>
                </div>
              )}
              <div className="flex justify-end gap-3 pt-4 border-t border-pink-50">
                <button type="button" onClick={() => setIsCuentaModalOpen(false)} className="px-6 py-2 rounded-full border border-pink-200 text-gray-600 font-medium">Cancelar</button>
                <button type="submit" className="kitty-button">{cuentaModalMode === 'crear' ? 'Guardar' : 'Actualizar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default FinanzasPage;
