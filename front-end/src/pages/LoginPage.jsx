import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Logo from '../images/Logo.png';

const LoginPage = () => {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/login``, form);
      login(res.data.token, {
        nombre: res.data.nombre,
        username: res.data.username,
        rol: res.data.rol
      });
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-pink-50 via-rose-50 to-fuchsia-50">
      {/* Círculos decorativos */}
      <div className="absolute top-[-80px] left-[-80px] w-80 h-80 bg-pink-200/40 rounded-full blur-3xl" />
      <div className="absolute bottom-[-80px] right-[-80px] w-96 h-96 bg-fuchsia-200/40 rounded-full blur-3xl" />

      <div className="relative z-10 w-full max-w-md mx-4">
        {/* Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-pink-100 p-10">
          {/* Logo y título */}
          <div className="flex flex-col items-center mb-8">
            <img src={Logo} alt="Rosastore" className="w-24 h-24 object-contain drop-shadow-md mb-3" />
            <h1 className="text-3xl font-black text-kitty-pink tracking-wide">ROSESTORE</h1>
            <p className="text-gray-400 text-sm mt-1">Panel de Administración</p>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 mb-5 text-sm font-medium flex items-center gap-2">
              <span>⚠️</span> {error}
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-600 mb-2">Usuario</label>
              <input
                type="text"
                id="login-username"
                placeholder="Ingresa tu usuario"
                value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-pink-200 bg-pink-50/50 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-kitty-pink focus:border-transparent transition-all"
                required
                autoComplete="username"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-600 mb-2">Contraseña</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="login-password"
                  placeholder="Ingresa tu contraseña"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-pink-200 bg-pink-50/50 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-kitty-pink focus:border-transparent transition-all pr-12"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-kitty-pink transition-colors text-lg"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              id="login-submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-kitty-rose to-kitty-pink text-white font-black text-lg rounded-xl shadow-lg hover:shadow-pink-300/50 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? '⏳ Iniciando...' : '🎀 Iniciar Sesión'}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-6">
            © {new Date().getFullYear()} Tienda Rosestore
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;



