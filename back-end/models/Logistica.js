import mongoose from 'mongoose';

const logisticaSchema = new mongoose.Schema({
  venta: { type: mongoose.Schema.Types.ObjectId, ref: 'Venta', required: true },
  tipoEnvio: { 
    type: String, 
    enum: ['Envio a Domicilio', 'Envio Nacional', 'Punto de Entrega'], 
    default: 'Envio a Domicilio' 
  },
  direccionEntrega: { type: String, default: '' },
  puntoEntrega: { type: String, default: '' }, // Descripción del punto de recogida coordinado
  costoEnvio: { type: Number, default: 0 },
  estadoEntrega: { 
    type: String, 
    enum: ['Pendiente', 'Recibido'], 
    default: 'Pendiente' 
  },
  fechaEstimada: { type: Date },
  fechaEntregaReal: { type: Date },
  repartidor: { type: String }
}, { timestamps: true });

export default mongoose.model('Logistica', logisticaSchema);
