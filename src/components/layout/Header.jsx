import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const headerStyles = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.5rem 1.5rem',
    borderBottom: '1px solid var(--card-border-color)',
    background: 'var(--background-color)',
    zIndex: 5,
};

const logoStyles = {
    height: '50px', // Tamaño del logo aumentado
};

// Inyectamos un pequeño bloque de CSS para controlar la visibilidad del botón de menú
const responsiveCSS = `
  .menu-button {
    display: none; /* Oculto por defecto en pantallas grandes */
  }
  @media (max-width: 768px) {
    .menu-button {
      display: block; /* Visible solo en pantallas pequeñas */
    }
  }
`;

export default function Header({ onMenuClick }) {
    const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'auto');

    useEffect(() => {
        if (theme === 'auto') {
            document.documentElement.removeAttribute('data-theme');
            localStorage.removeItem('theme');
        } else {
            document.documentElement.setAttribute('data-theme', theme);
            localStorage.setItem('theme', theme);
        }
    }, [theme]);

    const toggleTheme = () => {
        setTheme(currentTheme => {
            if (currentTheme === 'light') return 'dark';
            if (currentTheme === 'dark') return 'auto';
            return 'light';
        });
    };

    const getThemeIcon = () => {
        if (theme === 'light') return '☀️';
        if (theme === 'dark') return '🌙';
        return '💻';
    };

    return (
        <header style={headerStyles}>
            <style>{responsiveCSS}</style>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button 
                    className="secondary outline menu-button" 
                    onClick={onMenuClick} 
                    aria-label="Abrir menú"
                    style={{ padding: '0.25rem 0.5rem' }}
                >
                    ☰
                </button>
                <Link to="/">
                    <img src="/Sartor_Logos_1.png" alt="Logo Sartor" style={logoStyles} />
                </Link>
            </div>
            <div>
                <button onClick={toggleTheme} className="secondary outline">
                    {getThemeIcon()}
                </button>
            </div>
        </header>
    );
}