import Compra from '../models/Compra.js';
import Producto from '../models/Producto.js';
import Finanzas from '../models/Finanzas.js';
import Inventario from '../models/Inventario.js';

export const registrarCompra = async (req, res) => {
  try {
    const { proveedor, productos, total, cuentaOrigen, metodoPago } = req.body;

    // 1. Crear la compra
    const nuevaCompra = new Compra({
      proveedor: proveedor || null,
      productos,
      total,
      estado: 'Recibido'
    });

    const compraGuardada = await nuevaCompra.save();

    // 2. Aumentar stock y registrar movimientos de Inventario
    for (let item of productos) {
      await Producto.findByIdAndUpdate(item.producto, {
        $inc: { stock: item.cantidad }
      });

      // Registro en historial de inventario
      const movInventario = new Inventario({
        producto: item.producto,
        tipoMovimiento: 'Entrada',
        cantidad: item.cantidad,
        motivo: 'Compra a Proveedor'
      });
      await movInventario.save();
    }

    // 3. Registrar el egreso en Finanzas
    const nuevoEgreso = new Finanzas({
      tipoTransaccion: 'Egreso',
      monto: total,
      cuenta: cuentaOrigen || 'Caja Tienda',
      categoria: 'Pago a Proveedor',
      descripcion: `Compra de mercadería (${compraGuardada._id}). Pago: ${metodoPago}`,
      referenciaId: compraGuardada._id
    });
    await nuevoEgreso.save();

    res.status(201).json(compraGuardada);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
