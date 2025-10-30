import React, { useState, useEffect } from 'react';

const headerStyles = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.5rem 1.5rem',
    borderBottom: '1px solid var(--card-border-color)',
    background: 'var(--background-color)',
    zIndex: 5, // Asegura que esté por encima del contenido pero debajo de la sidebar si se superpone
};

const logoStyles = {
    height: '40px',
};

// Inyectamos un pequeño bloque de CSS para controlar la visibilidad del botón de menú
// Esto es más simple que crear otro archivo CSS solo para esto.
const responsiveCSS = `
  .menu-button {
    display: none; /* Oculto por defecto */
  }
  @media (max-width: 768px) {
    .menu-button {
      display: block; /* Visible en pantallas pequeñas */
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
            return 'light'; // De 'auto' a 'light'
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
                <img src="/Sartor_Logos_1.png" alt="Logo Concesionario" style={logoStyles} />
            </div>
            <div>
                <button onClick={toggleTheme} className="secondary outline">
                    {getThemeIcon()}
                </button>
            </div>
        </header>
    );
}