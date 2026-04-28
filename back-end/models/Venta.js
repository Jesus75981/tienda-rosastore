import mongoose from 'mongoose';

const ventaSchema = new mongoose.Schema({
  cliente: { type: mongoose.Schema.Types.ObjectId, ref: 'Cliente' }, // Puede ser null para ventas rápidas
  productos: [{
    producto: { type: mongoose.Schema.Types.ObjectId, ref: 'Producto', required: true },
    cantidad: { type: Number, required: true },
    precioUnitario: { type: Number, required: true },
    subtotal: { type: Number, required: true }
  }],
  total: { type: Number, required: true },
  metodoPago: { type: String, enum: ['Efectivo', 'Tarjeta', 'Transferencia', 'Otro'], default: 'Efectivo' },
  cuentaDestino: { type: String, required: true, default: 'Caja Tienda' },
  fecha: { type: Date, default: Date.now },
  estado: { type: String, enum: ['Completada', 'Pendiente', 'Cancelada'], default: 'Completada' }
}, { timestamps: true });

export default mongoose.model('Venta', ventaSchema);
