import React from 'react';
import { calcularMargenPorOperacion, getColorParaMargen } from '../../utils/calculations';

export default function VentasRecientes({ ventas }) {
  const ventasAMostrar = ventas.slice(0, 10);

  return (
    <article>
      <header>
        <h3>Ventas Recientes</h3>
      </header>
      <div style={{ overflowX: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th scope="col">Tipo</th>
              <th scope="col">Modelo</th>
              <th scope="col">Costo Neto (USD)</th> {/* <-- CAMBIO DE TEXTO */}
              <th scope="col">Venta (USD)</th>
              <th scope="col">Margen %</th>
              <th scope="col">Vendedor</th>
            </tr>
          </thead>
          <tbody>
            {ventasAMostrar.map((venta) => {
              const ventaBruta = venta.ventaBrutaUSD || 0;
              // Usamos costoNetoUSD como fuente principal, y costoUSD como fallback
              const costoNeto = venta.costoNetoUSD || venta.costoUSD || 0;

              let displayMargen;
              if (ventaBruta <= 0) {
                displayMargen = <span style={{ fontStyle: 'italic', color: 'var(--muted-color)' }}>STOCK</span>;
              } else if (costoNeto <= 0) {
                displayMargen = <span style={{ fontStyle: 'italic', color: 'var(--muted-color)' }}>PLAN AHORRO</span>;
              } else {
                const margen = calcularMargenPorOperacion(venta);
                displayMargen = (
                  <strong style={{ color: getColorParaMargen(margen) }}>
                    {margen.toFixed(2)}%
                  </strong>
                );
              }

              return (
                <tr key={venta.id}>
                  <td>{venta.tipoProducto}</td>
                  <td>{venta.modelo}</td>
                  {/* --- CAMBIO DE CAMPO A MOSTRAR --- */}
                  <td>{new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'USD' }).format(costoNeto)}</td>
                  <td>{new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'USD' }).format(ventaBruta)}</td>
                  <td style={{ textAlign: 'center' }}>
                    {displayMargen}
                  </td>
                  <td>{venta.vendedor}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <footer>
        <a href="#/reportes" role="button" className="outline" onClick={(e) => e.preventDefault()}>Ver todos los reportes →</a>
      </footer>
    </article>
  );
}