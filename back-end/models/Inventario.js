import mongoose from 'mongoose';

const inventarioSchema = new mongoose.Schema({
  producto: { type: mongoose.Schema.Types.ObjectId, ref: 'Producto', required: true },
  tipoMovimiento: { type: String, enum: ['Entrada', 'Salida', 'Ajuste'], required: true },
  cantidad: { type: Number, required: true },
  motivo: { type: String }, // ej. 'Venta', 'Compra a Proveedor', 'Producto Dañado'
  fecha: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('Inventario', inventarioSchema);
