import express from 'express';
import { createCrudController } from '../controllers/crudController.js';
import Producto from '../models/Producto.js';
import Cliente from '../models/Cliente.js';
import Proveedor from '../models/Proveedor.js';
import Venta from '../models/Venta.js';
import Compra from '../models/Compra.js';
import Inventario from '../models/Inventario.js';
import Logistica from '../models/Logistica.js';
import Finanzas from '../models/Finanzas.js';
import Cuenta from '../models/Cuenta.js';
import { login, crearAdmin } from '../controllers/authController.js';

const router = express.Router();

// Rutas de autenticación (públicas)
router.post('/auth/login', login);
router.post('/auth/setup', crearAdmin); // Solo usar una vez para crear el admin

const models = {
  productos: Producto,
  clientes: Cliente,
  proveedores: Proveedor,
  ventas: Venta,
  compras: Compra,
  inventario: Inventario,
  logistica: Logistica,
  finanzas: Finanzas,
  cuentas: Cuenta
};

import { registrarVenta, anularVenta } from '../controllers/ventaController.js';
import { registrarCompra, anularCompra } from '../controllers/compraController.js';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import path from 'path';

// Configuración de Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'rosastore_productos',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
  },
});

const upload = multer({ storage: storage });

// Rutas personalizadas
router.post('/ventas', registrarVenta);
router.put('/ventas/:id/anular', anularVenta);
router.post('/compras', registrarCompra);
router.put('/compras/:id/anular', anularCompra);

import { getResumenFinanciero } from '../controllers/finanzasController.js';
router.get('/finanzas/resumen', getResumenFinanciero);

// Sobrescribir POST de productos para aceptar imágenes
router.post('/productos', (req, res) => {
  upload.single('imagen')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: 'Error de imagen: ' + err.message });
    }
    try {
      const data = { ...req.body };
      if (req.file) {
        data.imagen = req.file.path;
      }

      // Generar código automático
      const categoriaStr = (data.categoria || 'GEN').toUpperCase().trim().replace(/[^A-Z]/g, '');
      const prefijo = categoriaStr.substring(0, 3).padEnd(3, 'X');

      // Buscar el último producto con ese prefijo
      const ultimoProducto = await Producto.findOne({ codigo: new RegExp(`^${prefijo}-\\d{3}$`) })
                                           .sort({ createdAt: -1 });

      let numero = 1;
      if (ultimoProducto && ultimoProducto.codigo) {
        const partes = ultimoProducto.codigo.split('-');
        if (partes.length === 2) {
          const lastNum = parseInt(partes[1], 10);
          if (!isNaN(lastNum)) {
            numero = lastNum + 1;
          }
        }
      }

      data.codigo = `${prefijo}-${numero.toString().padStart(3, '0')}`;

      const nuevoProducto = new Producto(data);
      await nuevoProducto.save();
      res.status(201).json(nuevoProducto);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });
});

// Sobrescribir PUT de productos para aceptar imágenes
router.put('/productos/:id', (req, res) => {
  upload.single('imagen')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: 'Error de imagen: ' + err.message });
    }
    try {
      const data = { ...req.body };
      delete data._id; // Prevent updating immutable field _id
      if (req.file) {
        data.imagen = req.file.path;
      }
      
      const productoActualizado = await Producto.findByIdAndUpdate(req.params.id, data, { new: true });
      if (!productoActualizado) {
        return res.status(404).json({ message: 'Producto no encontrado' });
      }
      res.json(productoActualizado);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });
});

// Endpoint para obtener categorías únicas
router.get('/categorias', async (req, res) => {
  try {
    const categorias = await Producto.distinct('categoria');
    res.json(categorias.filter(c => c)); // Filtrar nulls o vacíos
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Endpoint especial para logística (debe ir antes del CRUD genérico para que no choque con GET /:id)
router.get('/logistica/detalles', async (req, res) => {
  try {
    const entregas = await Logistica.find()
      .populate({
        path: 'venta',
        populate: {
          path: 'cliente'
        }
      })
      .sort({ createdAt: -1 });
    res.json(entregas);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Generar rutas CRUD automáticamente para cada modelo
Object.keys(models).forEach(key => {
  const modelRouter = express.Router();
  const controller = createCrudController(models[key]);

  modelRouter.get('/', controller.getAll);
  modelRouter.get('/:id', controller.getOne);
  modelRouter.post('/', controller.create);
  modelRouter.put('/:id', controller.update);
  modelRouter.delete('/:id', controller.remove);

  router.use(`/${key}`, modelRouter);
});

import { getDashboardStats } from '../controllers/dashboardController.js';
router.get('/dashboard/stats', getDashboardStats);

export default router;
