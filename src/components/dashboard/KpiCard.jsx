import React from 'react';

export default function KpiCard({ title, value, subtext }) {
  const cardStyle = {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    textAlign: 'center',
  };
  
  const contentWrapperStyle = {
    flexGrow: 1, // Ocupa el espacio disponible
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center', // <-- CENTRA VERTICALMENTE
  };

  const valueStyle = {
    fontSize: '2.25rem', // Reducimos un poco el tamaño
    lineHeight: 1.1,
    margin: '0.25rem 0', // Ajustamos el margen
    color: 'var(--primary)',
    fontWeight: 'bold',
  };

  const valueAsString = String(value);

  return (
    <article style={cardStyle}>
      <div style={contentWrapperStyle}>
        <p style={{ margin: 0, fontWeight: 'bold' }}>{title}</p>
        <h2 style={valueStyle}>
          {valueAsString}
        </h2>
      </div>
      
      <p style={{ margin: 0 }}><small>{subtext}</small></p>
    </article>
  );
}