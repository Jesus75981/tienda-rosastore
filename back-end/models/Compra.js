import mongoose from 'mongoose';

const compraSchema = new mongoose.Schema({
  proveedor: { type: mongoose.Schema.Types.ObjectId, ref: 'Proveedor', required: true },
  productos: [{
    producto: { type: mongoose.Schema.Types.ObjectId, ref: 'Producto', required: true },
    cantidad: { type: Number, required: true },
    costoUnitario: { type: Number, required: true },
    subtotal: { type: Number, required: true }
  }],
  total: { type: Number, required: true },
  fecha: { type: Date, default: Date.now },
  estado: { type: String, enum: ['Recibido', 'Pendiente', 'Cancelado'], default: 'Pendiente' }
}, { timestamps: true });

export default mongoose.model('Compra', compraSchema);
