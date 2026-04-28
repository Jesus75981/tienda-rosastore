import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import compression from 'compression';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(compression()); // Gzip para respuestas más rápidas
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rosastoreDB';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Conectado a MongoDB (rosastoreDB)'))
  .catch(err => console.error('❌ Error conectando a MongoDB:', err));

app.get('/', (req, res) => {
  res.send('API de Tienda Rosestore funcionando');
});

import indexRoutes from './routes/index.js';

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api', indexRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
});
