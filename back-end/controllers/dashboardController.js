import Venta from '../models/Venta.js';
import Producto from '../models/Producto.js';
import Cliente from '../models/Cliente.js';

export const getDashboardStats = async (req, res) => {
  try {
    // Calcular total de ventas
    const ventas = await Venta.find();
    const totalVentas = ventas.reduce((sum, venta) => sum + venta.total, 0);
    const ventasCount = ventas.length;

    // Calcular productos con stock bajo
    const productosBajoStock = await Producto.find({ $expr: { $lte: ["$stock", "$stockMinimo"] } });
    const bajoStockCount = productosBajoStock.length;

    // Total Clientes
    const clientesCount = await Cliente.countDocuments();

    // Ventas recientes (ultimas 5)
    const ventasRecientes = await Venta.find()
      .sort({ fecha: -1 })
      .limit(5)
      .populate('cliente', 'nombre apellidos');

    // Datos para gráfico de ventas (últimos 7 días)
    const sieteDiasAtras = new Date();
    sieteDiasAtras.setDate(sieteDiasAtras.getDate() - 7);
    
    const ventasGrafico = await Venta.aggregate([
      { $match: { fecha: { $gte: sieteDiasAtras } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$fecha" } },
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
