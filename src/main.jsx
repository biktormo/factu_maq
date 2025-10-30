import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import '@picocss/pico/css/pico.min.css';
import './index.css';

import App from './App.jsx';
import Dashboard from './components/dashboard/Dashboard.jsx';
import Reportes from './pages/Reportes.jsx';
import AnalisisVendedor from './pages/AnalisisVendedor.jsx';
import CargarOperacion from './pages/CargarOperacion.jsx';
import Admin from './pages/Admin.jsx';
import Login from './pages/Login.jsx';

// --- NUEVOS COMPONENTES DE PROTECCIÓN DE RUTAS ---

// Componente base: solo requiere que el usuario esté logueado
const RutaAutenticada = ({ children }) => {
  const { currentUser } = useAuth();
  return currentUser ? children : <Navigate to="/login" replace />;
};

// Protege rutas para Cargadores y Admins
const RutaCargador = ({ children }) => {
  const { isCargador } = useAuth();
  return isCargador ? children : <Navigate to="/" replace />;
};

// Protege rutas para Viewers y Admins (Vendedores en este caso)
const RutaViewerAdmin = ({ children }) => {
  const { userRole } = useAuth();
  const tieneAcceso = userRole === 'viewer' || userRole === 'admin';
  return tieneAcceso ? children : <Navigate to="/" replace />;
};

// Protege rutas solo para Admins
const RutaAdmin = ({ children }) => {
  const { isAdmin } = useAuth();
  return isAdmin ? children : <Navigate to="/" replace />;
};


// Creamos el router con las rutas y protecciones correctas
const router = createBrowserRouter([
  {
    path: "/",
    element: <RutaAutenticada><App /></RutaAutenticada>,
    children: [
      // Dashboard y Reportes son para todos los usuarios logueados
      { index: true, element: <Dashboard /> },
      { path: "reportes", element: <Reportes /> },
      
      // Vendedores: solo Viewer y Admin
      { 
        path: "vendedores", 
        element: <RutaViewerAdmin><AnalisisVendedor /></RutaViewerAdmin> 
      },
      
      // Cargar Operación: solo Cargador y Admin
      { 
        path: "cargar-operacion", 
        element: <RutaCargador><CargarOperacion /></RutaCargador> 
      },

      // Administración: solo Admin
      { 
        path: "admin", 
        element: <RutaAdmin><Admin /></RutaAdmin> 
      },
    ],
  },
  {
    path: "/login",
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