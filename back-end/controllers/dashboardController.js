import Venta from '../models/Venta.js';
import Producto from '../models/Producto.js';
import Cliente from '../models/Cliente.js';

export const getDashboardStats = async (req, res) => {
  try {
    const { periodo } = req.query;
    let filterFecha = {};
    let filterCreatedAt = {};

    if (periodo && periodo !== 'general') {
      const startDate = new Date();
      // Ajustar a 00:00 de Bolivia (UTC-4 => 04:00 UTC)
      startDate.setUTCHours(4, 0, 0, 0);
      
      // Si aún no son las 4 AM UTC, hoy en Bolivia empezó ayer a las 4 AM UTC
      if (new Date().getUTCHours() < 4) {
        startDate.setUTCDate(startDate.getUTCDate() - 1);
      }

      if (periodo === 'semana') {
        startDate.setUTCDate(startDate.getUTCDate() - 7);
      } else if (periodo === 'mes') {
        startDate.setUTCMonth(startDate.getUTCMonth() - 1);
      } else if (periodo === 'año') {
        startDate.setUTCFullYear(startDate.getUTCFullYear() - 1);
      }
      
      filterFecha = { fecha: { $gte: startDate } };
      filterCreatedAt = { createdAt: { $gte: startDate } };
    }

    // Calcular total de ventas y utilidad real
    const ventas = await Venta.find(filterFecha).populate('productos.producto');
    const totalVentas = ventas.reduce((sum, venta) => sum + venta.total, 0);
    const ventasCount = ventas.length;

    const utilidadReal = ventas.reduce((sum, venta) => {
      if (venta.estado === 'Anulada') return sum;
      const utilidadVenta = venta.productos.reduce((acc, item) => {
        const cCompraHistorico = item.costoHistorico || item.producto?.precioCompra || 0; 
        const pVenta = item.precioUnitario || 0;
        return acc + ((pVenta - cCompraHistorico) * item.cantidad);
      }, 0);
      return sum + utilidadVenta;
    }, 0);

    // Calcular productos con stock bajo
    const productosBajoStock = await Producto.find({ $expr: { $lte: ["$stock", "$stockMinimo"] } });
    const bajoStockCount = productosBajoStock.length;

    // Total Clientes
    const clientesCount = await Cliente.countDocuments(filterCreatedAt);

    // Ventas recientes (ultimas 5)
    const ventasRecientes = await Venta.find(filterFecha)
      .sort({ fecha: -1 })
      .limit(5)
      .populate('cliente', 'nombre apellidos');

    // Datos para gráfico de ventas (últimos 7 días por defecto, pero adaptable si es mes o año)
    let fechaGrafico = new Date();
    fechaGrafico.setUTCHours(4, 0, 0, 0);
    if (new Date().getUTCHours() < 4) {
      fechaGrafico.setUTCDate(fechaGrafico.getUTCDate() - 1);
    }

    let dateFormat = "%Y-%m-%d";

    if (periodo === 'año') {
      fechaGrafico.setUTCFullYear(fechaGrafico.getUTCFullYear() - 1);
      dateFormat = "%Y-%m"; // Agrupar por mes si es un año
    } else if (periodo === 'mes') {
      fechaGrafico.setUTCMonth(fechaGrafico.getUTCMonth() - 1);
    } else if (periodo === 'dia') {
      // Ya está en el inicio del día
    } else {
      fechaGrafico.setUTCDate(fechaGrafico.getUTCDate() - 7);
    }
    
    const ventasGrafico = await Venta.aggregate([
      { $match: { fecha: { $gte: fechaGrafico } } },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: "$fecha", timezone: "-04:00" } },
          total: { $sum: "$total" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.status(200).json({
      resumen: {
        totalVentas,
        utilidadReal,
        ventasCount,
        bajoStockCount,
        clientesCount
      },
      ventasRecientes,
      ventasGrafico
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
