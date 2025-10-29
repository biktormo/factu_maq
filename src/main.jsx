import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Estilos
import '@picocss/pico/css/pico.min.css';
import './index.css';

// Componentes y Páginas
import App from './App.jsx';
import Dashboard from './components/dashboard/Dashboard.jsx';
import Reportes from './pages/Reportes.jsx';
import Admin from './pages/Admin.jsx';
import Login from './pages/Login.jsx';
import RutaProtegida from './components/auth/RutaProtegida';
import AnalisisVendedor from './pages/AnalisisVendedor.jsx';
import CargarOperacion from './pages/CargarOperacion.jsx';

// Creamos el router con todas las rutas de la aplicación
const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <RutaProtegida>
        <App />
      </RutaProtegida>
    ),
    // Rutas hijas que se renderizarán dentro del <Outlet> de App.jsx
    children: [
      {
        index: true, // Esta es la página por defecto para la ruta "/"
        element: <Dashboard />,
      },
      {
        path: "reportes", // Se accede con "/reportes"
        element: <Reportes />,
      },
      { path: "vendedores", element: <AnalisisVendedor /> },
      { path: "cargar-operacion", element: <CargarOperacion /> },
      {
        path: "admin", // Se accede con "/admin"
        element: <Admin />,
      },
    ],
  },
  {
    path: "/login", // Ruta pública para el formulario de inicio de sesión
    element: <Login />,
  }
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>,
);