import mongoose from 'mongoose';

const clienteSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  apellidos: { type: String },
  email: { type: String },
  telefono: { type: String },
  direccion: { type: String },
  historialCompras: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Venta' }]
}, { timestamps: true });

export default mongoose.model('Cliente', clienteSchema);
