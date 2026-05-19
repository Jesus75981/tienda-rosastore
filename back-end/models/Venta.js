import mongoose from 'mongoose';

const ventaSchema = new mongoose.Schema({
  cliente: { type: mongoose.Schema.Types.ObjectId, ref: 'Cliente' }, // Puede ser null para ventas rápidas
  productos: [{
    producto: { type: mongoose.Schema.Types.ObjectId, ref: 'Producto', required: true },
    cantidad: { type: Number, required: true },
    cantidadDevuelta: { type: Number, default: 0 },
    precioUnitario: { type: Number, required: true },
    costoHistorico: { type: Number, required: true, default: 0 },
    subtotal: { type: Number, required: true },
    esPrecioMayorista: { type: Boolean, default: false }
  }],
  subtotalProductos: { type: Number, default: 0 }, // Total antes del descuento
  descuento: {
    tipo: { type: String, enum: ['porcentaje', 'fijo', 'ninguno'], default: 'ninguno' },
    valor: { type: Number, default: 0 },
    montoAplicado: { type: Number, default: 0 }  // Bs. descontados reales
  },
  total: { type: Number, required: true },
  metodoPago: { type: String, enum: ['Efectivo', 'Tarjeta', 'Transferencia', 'Otro'], default: 'Efectivo' },
  cuentaDestino: { type: String, required: true, default: 'Caja Tienda' },
  fecha: { type: Date, default: Date.now },
  estado: { type: String, enum: ['Completada', 'Pendiente', 'Cancelada', 'Anulada'], default: 'Completada' }
}, { timestamps: true });

export default mongoose.model('Venta', ventaSchema);
