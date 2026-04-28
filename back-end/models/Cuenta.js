import mongoose from 'mongoose';

const cuentaSchema = new mongoose.Schema({
  nombre: { type: String, required: true, unique: true },
  tipo: { type: String, enum: ['Efectivo', 'Banco'], required: true, default: 'Banco' },
  moneda: { type: String, enum: ['BOB', 'USD'], default: 'BOB' },
  descripcion: { type: String }
}, { timestamps: true });

export default mongoose.model('Cuenta', cuentaSchema);
