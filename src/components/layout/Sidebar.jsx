import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { auth } from '../../firebase/config';
import { signOut } from 'firebase/auth';
import { useAuth } from '../../context/AuthContext';

// Estilos para el layout de la barra lateral
const sidebarStyles = {
  width: '240px',
  position: 'fixed',
  top: 0,
  left: 0,
  height: '100vh',
  padding: '1rem',
  background: 'var(--card-background-color)',
  borderRight: '1px solid var(--card-border-color)',
  zIndex: 1000,
  display: 'flex',
  flexDirection: 'column',
  transition: 'transform 0.3s ease-in-out',
};

const logoStyles = {
  textAlign: 'center',
  marginBottom: '2rem',
  color: 'var(--jd-green, #367C2B)',
  fontSize: '1.5rem',
  fontWeight: 'bold',
};

// --- ESTA ES LA CONSTANTE QUE FALTABA ---
const navStyles = {
  flexGrow: 1, // Hace que la navegación ocupe el espacio disponible
};
// ------------------------------------

const activeLinkStyle = {
  backgroundColor: 'var(--primary)',
  color: 'var(--primary-inverse)',
  padding: '0.5rem 1rem',
  borderRadius: 'var(--border-radius)',
  display: 'block',
  textDecoration: 'none',
  marginBottom: '0.5rem',
};

const inactiveLinkStyle = {
  backgroundColor: 'transparent',
  color: 'var(--contrast)',
  padding: '0.5rem 1rem',
  display: 'block',
  textDecoration: 'none',
  marginBottom: '0.5rem',
};

export default function Sidebar({ isOpen, closeSidebar }) {
  const navigate = useNavigate();
  const { userRole, isCargador, isAdmin } = useAuth();

  const handleLinkClick = () => {
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
    <aside className={`sidebar ${isOpen ? 'is-open' : ''}`}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div>
          <div style={logoStyles}>
            Facturación Maquinaria
          </div>
          <nav style={navStyles}>
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