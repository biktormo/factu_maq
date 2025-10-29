import React, { useState, useEffect } from 'react';

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
    height: '90px',
};

export default function Header() {
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem('theme') || 'auto';
    });

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
            return 'light'; // De auto a light
        });
    };

    const getThemeIcon = () => {
        if (theme === 'light') return '☀️';
        if (theme === 'dark') return '🌙';
        return '💻'; // Icono para 'auto'
    };

    return (
        <header style={headerStyles}>
            <div>
                {/* La ruta es absoluta desde la raíz del sitio, porque está en la carpeta /public */}
                <img src="/Sartor_Logos_1.png" alt="Logo SARTOR" style={logoStyles} />
            </div>
            <div>
                <button onClick={toggleTheme} className="secondary outline">
                    {getThemeIcon()}
                </button>
            </div>
        </header>
    );
}