import mongoose from 'mongoose';

const finanzasSchema = new mongoose.Schema({
  tipoTransaccion: { type: String, enum: ['Ingreso', 'Egreso', 'Transferencia'], required: true },
  monto: { type: Number, required: true },
  moneda: { type: String, enum: ['BOB', 'USD'], default: 'BOB' },
  cuenta: { type: String, required: true, default: 'Caja Tienda' }, // Usada como cuentaDestino en transferencias
  cuentaOrigen: { type: String }, // Solo para transferencias
  categoria: { type: String, required: true }, // ej. 'Venta', 'Pago a Proveedor', 'Servicios', 'Transferencia Interna'
  descripcion: { type: String },
  referenciaId: { type: mongoose.Schema.Types.ObjectId }, // Referencia a Venta o Compra
  referenciaModelo: { type: String, enum: ['Venta', 'Compra'] },
  metodoPago: { type: String, enum: ['Efectivo', 'Transferencia', 'Tarjeta', 'Cheque', 'Otro'], default: 'Efectivo' },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  fecha: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('Finanzas', finanzasSchema);
