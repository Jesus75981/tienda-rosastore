import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Usuario from '../models/Usuario.js';

const JWT_SECRET = process.env.JWT_SECRET || 'rosastore_secret_key_2025';

// Login
export const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const usuario = await Usuario.findOne({ username });
    if (!usuario) return res.status(401).json({ message: 'Usuario o contraseña incorrectos' });

    const passwordValida = await bcrypt.compare(password, usuario.password);
    if (!passwordValida) return res.status(401).json({ message: 'Usuario o contraseña incorrectos' });

    const token = jwt.sign(
      { id: usuario._id, username: usuario.username, rol: usuario.rol },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({ token, nombre: usuario.nombre, username: usuario.username, rol: usuario.rol });
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

// Verificar token (middleware)
export const verificarToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Acceso denegado' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.usuario = decoded;
    next();
  } catch {
    res.status(401).json({ message: 'Token inválido o expirado' });
  }
};

// Crear admin (solo se usa una vez para crear el usuario inicial)
export const crearAdmin = async (req, res) => {
  try {
    const existe = await Usuario.findOne({ username: 'admin.rosastore' });
    if (existe) return res.status(400).json({ message: 'El admin ya existe' });

    const hash = await bcrypt.hash('R0s@St0r3#2025!', 12);
    const admin = new Usuario({
      username: 'admin.rosastore',
      password: hash,
      nombre: 'Administrador',
      rol: 'admin'
    });
    await admin.save();
    res.status(201).json({ message: '✅ Admin creado correctamente' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
