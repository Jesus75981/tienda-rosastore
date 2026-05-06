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
      if (periodo === 'dia') {
        startDate.setHours(0, 0, 0, 0);
      } else if (periodo === 'semana') {
        startDate.setDate(startDate.getDate() - 7);
      } else if (periodo === 'mes') {
        startDate.setMonth(startDate.getMonth() - 1);
      } else if (periodo === 'año') {
        startDate.setFullYear(startDate.getFullYear() - 1);
      }
      filterFecha = { fecha: { $gte: startDate } };
      filterCreatedAt = { createdAt: { $gte: startDate } };
    }

    // Calcular total de ventas
    const ventas = await Venta.find(filterFecha);
    const totalVentas = ventas.reduce((sum, venta) => sum + venta.total, 0);
    const ventasCount = ventas.length;

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
    let dateFormat = "%Y-%m-%d";

    if (periodo === 'año') {
      fechaGrafico.setFullYear(fechaGrafico.getFullYear() - 1);
      dateFormat = "%Y-%m"; // Agrupar por mes si es un año
    } else if (periodo === 'mes') {
      fechaGrafico.setMonth(fechaGrafico.getMonth() - 1);
    } else if (periodo === 'dia') {
      fechaGrafico.setHours(0, 0, 0, 0);
    } else {
      fechaGrafico.setDate(fechaGrafico.getDate() - 7);
    }
    
    const ventasGrafico = await Venta.aggregate([
      { $match: { fecha: { $gte: fechaGrafico } } },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: "$fecha" } },
          total: { $sum: "$total" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.status(200).json({
      resumen: {
        totalVentas,
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
