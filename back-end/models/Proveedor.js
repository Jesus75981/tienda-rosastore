import mongoose from 'mongoose';

const proveedorSchema = new mongoose.Schema({
  nombreEmpresa: { type: String, required: true },
  contacto: { type: String },
  email: { type: String },
  telefono: { type: String },
  direccion: { type: String },
  categoriaSuministro: { type: String } // ej. Maquillaje, Limpieza
}, { timestamps: true });

export default mongoose.model('Proveedor', proveedorSchema);
