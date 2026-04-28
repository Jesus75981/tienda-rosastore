import mongoose from 'mongoose';

const productoSchema = new mongoose.Schema({
  codigo: { type: String, unique: true, sparse: true },
  nombre: { type: String, required: true },
  descripcion: { type: String },
  marca: { type: String },
  categoria: { type: String, default: 'General' },
  precioCompra: { type: Number, required: true },
  precioVenta: { type: Number, required: true },
  stock: { type: Number, default: 0 },
  stockMinimo: { type: Number, default: 5 },
  fechaCaducidad: { type: Date },
  imagen: { type: String }
}, { timestamps: true });

export default mongoose.model('Producto', productoSchema);
