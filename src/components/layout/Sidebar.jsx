import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { auth } from '../../firebase/config';
import { signOut } from 'firebase/auth';

const sidebarStyles = {
  width: '240px',
  position: 'fixed',
  top: 0,
  left: 0,
  height: '100vh',
  padding: '1rem',
  background: 'var(--card-background-color)',
  borderRight: '1px solid var(--card-border-color)',
  zIndex: 10,
  display: 'flex',
  flexDirection: 'column',
};

const logoStyles = {
  textAlign: 'center',
  marginBottom: '2rem',
  color: 'var(--jd-green, #367C2B)',
  fontSize: '1.5rem',
  fontWeight: 'bold',
};

const navStyles = {
  flexGrow: 1, // Hace que la navegación ocupe el espacio disponible
};

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


export default function Sidebar() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // Redirige al login después de cerrar sesión
      navigate('/login');
    } catch (error) {
      console.error("Error al cerrar sesión", error);
    }
  };

  return (
    <aside style={sidebarStyles}>
      <div>
        <div style={logoStyles}>
          Facturacion Maquinaria
        </div>
        <nav style={navStyles}>
          <ul>
            <li>
              <NavLink 
                to="/" 
                style={({ isActive }) => isActive ? activeLinkStyle : inactiveLinkStyle}
              >
                Dashboard
              </NavLink>
            </li>
            <li>
              <NavLink 
                to="/reportes" 
                style={({ isActive }) => isActive ? activeLinkStyle : inactiveLinkStyle}
              >
                Reportes
              </NavLink>
            </li>
            <li>
              <NavLink 
                to="/vendedores" 
                style={({ isActive }) => isActive ? activeLinkStyle : inactiveLinkStyle}
              >
                Vendedores
              </NavLink>
            </li>
            <li>
              <NavLink 
                to="/cargar-operacion" 
                style={({ isActive }) => isActive ? activeLinkStyle : inactiveLinkStyle}
              >
                Cargar Operación
              </NavLink>
            </li>
            <li>
              <NavLink 
                to="/admin" 
                style={({ isActive }) => isActive ? activeLinkStyle : inactiveLinkStyle}
              >
                Administración
              </NavLink>
            </li>
          </ul>
        </nav>
      </div>

      {/* Botón de Logout al final */}
      <div>
        <button onClick={handleLogout} className="contrast outline">
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}