import React from 'react';

export default function KpiCard({ title, value, subtext }) {
  const cardStyle = {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    justifyContent: 'space-between',
  };

  const mainContentStyle = {};
  
  const valueStyle = {
    display: 'flex',
    flexDirection: 'column',
    lineHeight: 1.1,
  };

  // --- CORRECCIÓN AQUÍ ---
  // Primero, nos aseguramos de que el valor sea un string antes de intentar dividirlo.
  const valueAsString = String(value);
  const valueParts = valueAsString.split(' ');

  return (
    <article style={cardStyle}>
      <div style={mainContentStyle}>
        <p style={{ margin: 0, fontWeight: 'bold' }}>{title}</p>
        
        <h2 style={valueStyle}>
          {/* Si el valor tiene más de una parte (ej: "$ 123 M"), lo separamos. */}
          {/* Si no, simplemente mostramos el valor completo. */}
          {valueParts.length > 1 ? (
            <>
              <span>{valueParts[0]}</span>
              <span style={{ fontSize: '1.5rem' }}>{valueParts[1]}</span>
            </>
          ) : (
            <span>{valueAsString}</span>
          )}
        </h2>
      </div>
      
      <p style={{ margin: 0 }}><small>{subtext}</small></p>
    </article>
  );
}