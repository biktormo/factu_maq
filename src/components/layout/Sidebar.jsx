import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { auth } from '../../firebase/config';
import { signOut } from 'firebase/auth';
import { useAuth } from '../../context/AuthContext';

// Estilos para los enlaces de navegación
const activeLinkStyle = {
  backgroundColor: 'var(--primary)',
  color: 'var(--primary-inverse)',
};

const inactiveLinkStyle = {
  backgroundColor: 'transparent',
  color: 'var(--contrast)',
};

const logoStyles = {
  textAlign: 'center',
  marginBottom: '2rem',
  color: 'var(--jd-green, #367C2B)',
  fontSize: '1.5rem',
  fontWeight: 'bold',
};

export default function Sidebar({ isOpen, closeSidebar }) {
  const navigate = useNavigate();
  const { userRole, isCargador, isAdmin } = useAuth();

  const handleLinkClick = () => {
    // Si la pantalla es pequeña (móvil), cerramos la sidebar al navegar
    if (window.innerWidth <= 768) {
      closeSidebar();
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error("Error al cerrar sesión", error);
    }
  };

  return (
    // Aplicamos la clase 'sidebar' y, condicionalmente, 'is-open'
    <aside className={`sidebar ${isOpen ? 'is-open' : ''}`}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ flexGrow: 1 }}>
          <div style={logoStyles}>
            Facturación Maquinaria
          </div>
          <nav>
            <ul>
              {/* Dashboard y Reportes: Todos los roles logueados */}
              <li><NavLink to="/" style={({ isActive }) => (isActive ? activeLinkStyle : inactiveLinkStyle)} onClick={handleLinkClick}>Dashboard</NavLink></li>
              <li><NavLink to="/reportes" style={({ isActive }) => (isActive ? activeLinkStyle : inactiveLinkStyle)} onClick={handleLinkClick}>Reportes</NavLink></li>
              
              {/* Vendedores: Solo Viewer y Admin */}
              {(userRole === 'viewer' || isAdmin) && (
                <li><NavLink to="/vendedores" style={({ isActive }) => (isActive ? activeLinkStyle : inactiveLinkStyle)} onClick={handleLinkClick}>Vendedores</NavLink></li>
              )}
              
              {/* Cargar Operación: Cargador y Admin */}
              {isCargador && (
                <li><NavLink to="/cargar-operacion" style={({ isActive }) => (isActive ? activeLinkStyle : inactiveLinkStyle)} onClick={handleLinkClick}>Cargar Operación</NavLink></li>
              )}

              {/* Administración: solo Admin */}
              {isAdmin && (
                <li><NavLink to="/admin" style={({ isActive }) => (isActive ? activeLinkStyle : inactiveLinkStyle)} onClick={handleLinkClick}>Administración</NavLink></li>
              )}
            </ul>
          </nav>
        </div>

        <div style={{ marginTop: 'auto' }}>
          <button onClick={handleLogout} className="contrast outline">
            Cerrar Sesión
          </button>
        </div>
      </div>
    </aside>
  );
}