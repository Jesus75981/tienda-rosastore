import mongoose from 'mongoose';

const usuarioSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true },
  nombre: { type: String, default: 'Administrador' },
  rol: { type: String, default: 'admin' }
}, { timestamps: true });

const Usuario = mongoose.model('Usuario', usuarioSchema);
export default Usuario;
