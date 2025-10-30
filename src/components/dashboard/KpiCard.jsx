import React from 'react';

export default function KpiCard({ title, value, subtext }) {
  const cardStyle = {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    justifyContent: 'space-between',
    textAlign: 'center', // Centramos todo el contenido
  };

  return (
    <article style={cardStyle}>
      <div>
        <p style={{ margin: 0, fontWeight: 'bold' }}>{title}</p>
        {/* Aumentamos el tamaño de fuente y quitamos la lógica de separación */}
        <h2 style={{ fontSize: '2.5rem', margin: '0.5rem 0' }}>{value}</h2>
      </div>
      <p style={{ margin: 0 }}><small>{subtext}</small></p>
    </article>
  );
}