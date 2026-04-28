import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { ShoppingBag, FileText, Truck, Package, Banknote, Home, Box, ClipboardList, BarChart2, LogOut, User } from 'lucide-react';
import Logo from './images/Logo.png';
import FondoMenu from './images/Fondo de mi menu.png';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';

// Lazy loading — cada página se carga solo cuando se necesita
const DashboardPage  = lazy(() => import('./pages/DashboardPage.jsx'));
const ProductosPage  = lazy(() => import('./pages/ProductosPage.jsx'));
const VentasPage     = lazy(() => import('./pages/VentasPage.jsx'));
const ReportesPage   = lazy(() => import('./pages/ReportesPage.jsx'));
const InventarioPage = lazy(() => import('./pages/InventarioPage.jsx'));
const ComprasPage    = lazy(() => import('./pages/ComprasPage.jsx'));
const FinanzasPage   = lazy(() => import('./pages/FinanzasPage.jsx'));
const LogisticaPage  = lazy(() => import('./pages/LogisticaPage.jsx'));
const LoginPage      = lazy(() => import('./pages/LoginPage.jsx'));

// Spinner de carga
const PageLoader = () => (
  <div className="flex-1 flex items-center justify-center p-8">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-pink-200 border-t-kitty-pink rounded-full animate-spin" />
      <p className="text-kitty-pink font-bold">Cargando... 🎀</p>
    </div>
  </div>
);

// Páginas Mocks
const ProveedoresPage = () => <div className="p-8"><h1 className="text-3xl font-bold text-kitty-pink mb-4">Proveedores ✨</h1></div>;

// Ruta protegida
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  return user ? children : <Navigate to="/login" replace />;
};

// Menú Central
const MainMenu = () => {
  const { user, logout } = useAuth();
  const menuItems = [
    { to: "/dashboard", icon: BarChart2, label: "Resumen / Dashboard", color: "text-pink-500" },
    { to: "/productos",  icon: Package,    label: "Productos",           color: "text-rose-500" },
    { to: "/ventas",     icon: ShoppingBag,label: "Ventas",              color: "text-fuchsia-500" },
    { to: "/reportes",   icon: FileText,   label: "Reportes",            color: "text-purple-500" },
    { to: "/inventario", icon: Box,        label: "Inventario",          color: "text-indigo-500" },
    { to: "/compras",    icon: ClipboardList, label: "Compras",          color: "text-blue-500" },
    { to: "/proveedores",icon: Truck,      label: "Proveedores",         color: "text-cyan-500" },
    { to: "/logistica",  icon: Truck,      label: "Logística",           color: "text-teal-500" },
    { to: "/finanzas",   icon: Banknote,   label: "Finanzas",            color: "text-emerald-500" },
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 z-10 relative">
      {/* Info de usuario */}
      <div className="absolute top-4 right-4 flex items-center gap-3">
        <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-pink-100 shadow-sm">
          <User size={14} className="text-kitty-pink" />
          <span className="text-xs font-bold text-slate-600">{user?.nombre}</span>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-1.5 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-pink-100 shadow-sm text-xs font-bold text-slate-500 hover:text-red-500 hover:border-red-200 transition-colors"
        >
          <LogOut size={14} /> Salir
        </button>
      </div>

      <img src={Logo} alt="Logo Central" className="w-64 h-auto object-contain drop-shadow-lg mb-2 hover:scale-105 transition-transform duration-300" />
      <h2 className="text-5xl font-extrabold text-kitty-pink mb-12 drop-shadow-md text-center tracking-wide uppercase">ROSESTORE</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 max-w-5xl w-full">
        {menuItems.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="kitty-card p-8 flex flex-col items-center justify-center gap-4 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:border-kitty-pink bg-white/90 backdrop-blur-sm cursor-pointer group"
          >
            <div className={`p-4 rounded-full bg-pink-50 group-hover:bg-pink-100 transition-colors ${item.color}`}>
              <item.icon size={48} />
            </div>
            <span className="text-xl font-bold text-slate-700 group-hover:text-kitty-pink">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
};

const Layout = ({ children }) => {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const { logout, user } = useAuth();

  return (
    <div className="flex flex-col h-screen bg-kitty-cream relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img src={FondoMenu} alt="Fondo Rosestore" className="w-full h-full object-cover opacity-90" />
      </div>

      {!isHome && (
        <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-pink-100 z-20 sticky top-0 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={Logo} alt="Logo" className="w-10 h-10 object-contain" />
            <h1 className="text-xl font-bold text-kitty-pink tracking-tight">Rosestore</h1>
          </div>
          <div className="flex items-center gap-3">
            {user && (
              <span className="text-xs font-medium text-gray-500 hidden sm:block">
                👤 {user.nombre}
              </span>
            )}
            <Link to="/" className="flex items-center gap-2 kitty-button text-sm">
              <Home size={18} /> Menú Central
            </Link>
            <button onClick={logout} className="flex items-center gap-2 px-3 py-2 text-sm font-bold text-red-400 hover:bg-red-50 rounded-lg transition-colors">
              <LogOut size={16} /> Salir
            </button>
          </div>
        </header>
      )}

      <main className="flex-1 overflow-y-auto flex flex-col z-10 relative">
        {children}
      </main>
    </div>
  );
};

function AppRoutes() {
  return (
    <Router>
      <AuthProvider>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Ruta pública */}
            <Route path="/login" element={<LoginPage />} />
            {/* Rutas protegidas */}
            <Route path="/*" element={
              <PrivateRoute>
                <Layout>
                  <Routes>
                    <Route path="/"           element={<MainMenu />} />
                    <Route path="/dashboard"  element={<DashboardPage />} />
                    <Route path="/productos"  element={<ProductosPage />} />
                    <Route path="/reportes"   element={<ReportesPage />} />
                    <Route path="/proveedores"element={<ProveedoresPage />} />
                    <Route path="/ventas"     element={<VentasPage />} />
                    <Route path="/compras"    element={<ComprasPage />} />
                    <Route path="/inventario" element={<InventarioPage />} />
                    <Route path="/logistica"  element={<LogisticaPage />} />
                    <Route path="/finanzas"   element={<FinanzasPage />} />
                  </Routes>
                </Layout>
              </PrivateRoute>
            } />
          </Routes>
        </Suspense>
      </AuthProvider>
    </Router>
  );
}

export default AppRoutes;
