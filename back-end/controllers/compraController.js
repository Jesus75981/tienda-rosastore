import Compra from '../models/Compra.js';
import Producto from '../models/Producto.js';
import Finanzas from '../models/Finanzas.js';

export const registrarCompra = async (req, res) => {
  try {
    const { proveedor, productos, total, cuentaOrigen, metodoPago } = req.body;

    // 1. Crear la compra
    const nuevaCompra = new Compra({
      proveedor: proveedor || null,
      productos,
      total,
      estado: 'Recibido' // Asumimos que si se registra, ya se recibió el stock
    });

    const compraGuardada = await nuevaCompra.save();

    // 2. Aumentar el stock de los productos
    for (let item of productos) {
      await Producto.findByIdAndUpdate(item.producto, {
        $inc: { stock: item.cantidad }
        // Podríamos actualizar el precioCompra si quisiéramos, pero lo dejamos manual
      });
    }

    // 3. Registrar el egreso en Finanzas
    const nuevoEgreso = new Finanzas({
      tipoTransaccion: 'Egreso',
      monto: total,
      cuenta: cuentaOrigen || 'Caja Tienda',
      categoria: 'Pago a Proveedor',
      descripcion: `Compra de mercadería pagada por ${metodoPago}`,
      referenciaId: compraGuardada._id
    });
    await nuevoEgreso.save();

    res.status(201).json(compraGuardada);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
