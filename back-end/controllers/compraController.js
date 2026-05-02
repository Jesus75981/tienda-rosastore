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

    // 2. Aumentar stock y actualizar precios
    for (let item of productos) {
      const updateData = {
        $inc: { stock: item.cantidad },
        $set: { precioCompra: item.costoUnitario } // Actualizar al costo más reciente
      };
      
      if (item.precioVentaNuevo !== undefined && item.precioVentaNuevo !== null) {
        updateData.$set.precioVenta = item.precioVentaNuevo;
      }

      await Producto.findByIdAndUpdate(item.producto, updateData);

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

export const anularCompra = async (req, res) => {
  try {
    const { id } = req.params;
    const compra = await Compra.findById(id);

    if (!compra) return res.status(404).json({ message: 'Compra no encontrada' });
    if (compra.estado === 'Anulada') return res.status(400).json({ message: 'La compra ya está anulada' });

    // 1. Revertir Inventario (Restar lo que se compró)
    for (let item of compra.productos) {
      const producto = await Producto.findById(item.producto);
      if (producto) {
        producto.stock -= item.cantidad;
        if (producto.stock < 0) producto.stock = 0; // Evitar stock negativo si ya se vendió
        await producto.save();
      }
    }

    // 2. Revertir Finanzas (Devolver el dinero como un ingreso por devolución)
    const devolucionFinanzas = new Finanzas({
      tipoTransaccion: 'Ingreso',
      monto: compra.total,
      cuenta: compra.cuentaOrigen || 'Caja Tienda',
      categoria: 'Devolución',
      descripcion: `Anulación de compra: ${compra._id}`,
      referenciaId: compra._id,
      referenciaModelo: 'Compra'
    });
    await devolucionFinanzas.save();

    // 3. Marcar compra como anulada
    compra.estado = 'Anulada';
    await compra.save();

    res.status(200).json({ message: "Compra anulada, stock y dinero revertidos." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
