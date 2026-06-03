import mongoose from 'mongoose';

const clienteSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  apellidos: { type: String },
  email: { type: String },
  telefono: { type: String },
  direccion: { type: String },
  historialCompras: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Venta' }]
}, { timestamps: true });

clienteSchema.pre('save', async function() {
  if (this.isModified('nombre')) {
    const cleanNombre = this.nombre.trim();
    const escapedNombre = cleanNombre.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const existing = await mongoose.model('Cliente').findOne({
      nombre: { $regex: new RegExp(`^\\s*${escapedNombre}\\s*$`, 'i') }
    });
    if (existing && existing._id.toString() !== this._id.toString()) {
      throw new Error('Ya existe un cliente registrado con ese nombre.');
    }
  }
});

export default mongoose.model('Cliente', clienteSchema);

