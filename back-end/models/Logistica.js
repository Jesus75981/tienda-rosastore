import mongoose from 'mongoose';

const logisticaSchema = new mongoose.Schema({
  venta: { type: mongoose.Schema.Types.ObjectId, ref: 'Venta', required: true },
  tipoEnvio: { 
    type: String, 
    enum: ['Envio a Domicilio', 'Envio Nacional'], 
    default: 'Envio a Domicilio' 
  },
  direccionEntrega: { type: String, default: '' },
  costoEnvio: { type: Number, default: 0 },
  estadoEntrega: { 
    type: String, 
    enum: ['Preparando', 'En Camino', 'Entregado', 'Devuelto'], 
    default: 'Preparando' 
  },
  fechaEstimada: { type: Date },
  fechaEntregaReal: { type: Date },
  repartidor: { type: String }
}, { timestamps: true });

export default mongoose.model('Logistica', logisticaSchema);
