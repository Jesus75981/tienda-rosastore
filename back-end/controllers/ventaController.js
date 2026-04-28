import Venta from '../models/Venta.js';
import Producto from '../models/Producto.js';
import Finanzas from '../models/Finanzas.js';
import Logistica from '../models/Logistica.js';

export const registrarVenta = async (req, res) => {
  try {
    const { cliente, productos, total, metodoPago, cuentaDestino, logistica } = req.body;

    // 1. Validar stock antes de vender
    for (let item of productos) {
      const productoDb = await Producto.findById(item.producto);
      if (!productoDb) {
        return res.status(404).json({ message: `Producto no encontrado` });
      }
      if (productoDb.stock < item.cantidad) {
        return res.status(400).json({ message: `Stock insuficiente para ${productoDb.nombre}` });
      }
    }

    // 2. Crear la venta
    const nuevaVenta = new Venta({
      cliente: cliente || null,
      productos,
      total,
      metodoPago,
      cuentaDestino
    });

    const ventaGuardada = await nuevaVenta.save();

    // 3. Reducir el stock de los productos
    for (let item of productos) {
      await Producto.findByIdAndUpdate(item.producto, {
        $inc: { stock: -item.cantidad }
      });
    }

    // 4. Registrar en Finanzas el ingreso
    const nuevoIngreso = new Finanzas({
      tipoTransaccion: 'Ingreso',
      monto: total,
      cuenta: cuentaDestino || 'Caja Tienda',
      categoria: 'Venta',
      descripcion: `Venta registrada por ${metodoPago}`,
      referenciaId: ventaGuardada._id,
      referenciaModelo: 'Venta',
      metodoPago: metodoPago
    });
    await nuevoIngreso.save();

    // 5. Registrar Logistica si aplica
    if (logistica) {
      const nuevaLogistica = new Logistica({
        venta: ventaGuardada._id,
        tipoEnvio: logistica.tipoEnvio || 'Envio a Domicilio',
        direccionEntrega: logistica.direccionEntrega || '',
        costoEnvio: logistica.costoEnvio || 0,
        estadoEntrega: 'Preparando'
      });
      await nuevaLogistica.save();
    }

    res.status(201).json(ventaGuardada);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const anularVenta = async (req, res) => {
  try {
    const { id } = req.params;
    const venta = await Venta.findById(id);
    
    if (!venta) return res.status(404).json({ message: 'Venta no encontrada' });
    if (venta.estado === 'Anulada') return res.status(400).json({ message: 'La venta ya está anulada' });

    // Devolver stock
    for (let item of venta.productos) {
      await Producto.findByIdAndUpdate(item.producto, {
        $inc: { stock: item.cantidad }
      });
    }

    venta.estado = 'Anulada';
    await venta.save();

    res.status(200).json(venta);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
