import React, { useMemo } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { calcularMargenPorOperacion } from '../../utils/calculations';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const getTrimestre = (fecha) => {
  const mes = fecha.getMonth();
  const año = String(fecha.getFullYear()).slice(2);
  if (mes <= 2) return `Q1 '${año}`;
  if (mes <= 5) return `Q2 '${año}`;
  if (mes <= 8) return `Q3 '${año}`;
  return `Q4 '${año}`;
};

const procesarDatosParaGrafico = (ventas) => {
  if (!ventas || ventas.length === 0) {
    return { labels: [], dataPoints: [] };
  }
  const margenesPorTrimestre = {};
  ventas.forEach(venta => {
    if ((venta.ventaBrutaUSD || 0) > 0 && (venta.costoNetoUSD || venta.costoUSD || 0) > 0) {
      const trimestre = getTrimestre(venta.fechaVenta);
      if (!margenesPorTrimestre[trimestre]) {
        margenesPorTrimestre[trimestre] = [];
      }
      margenesPorTrimestre[trimestre].push(calcularMargenPorOperacion(venta));
    }
  });
  const labelsOrdenadas = Object.keys(margenesPorTrimestre).sort((a, b) => {
    const [, añoA] = a.split("'");
    const [, añoB] = b.split("'");
    if (añoA !== añoB) return parseInt(añoA) - parseInt(añoB);
    return parseInt(a.substring(1, 2)) - parseInt(b.substring(1, 2));
  });
  const dataPoints = labelsOrdenadas.map(trimestre => {
    const margenes = margenesPorTrimestre[trimestre];
    const suma = margenes.reduce((acc, val) => acc + val, 0);
    const promedio = suma / margenes.length;
    return promedio.toFixed(2);
  });
  return { labels: labelsOrdenadas, dataPoints };
};

export default function MarginChart({ ventas, isDarkMode }) {
  const { labels, dataPoints } = useMemo(() => procesarDatosParaGrafico(ventas), [ventas]);

  const data = useMemo(() => ({
    labels,
    datasets: [{
      label: 'Margen Promedio (%)',
      data: dataPoints,
      borderColor: '#FFDE00',
      backgroundColor: 'rgba(255, 222, 0, 0.2)',
      tension: 0.1,
      fill: true,
    }],
  }), [labels, dataPoints]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { /* ... */ },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { 
          // Usamos un color fijo que funciona en ambos temas
          color: 'rgba(128, 128, 128, 0.9)', 
        },
        grid: { color: 'rgba(128, 128, 128, 0.2)' }
      },
      x: {
        ticks: { 
          // Usamos un color fijo que funciona en ambos temas
          color: 'rgba(128, 128, 128, 0.9)', 
        },
        grid: { display: false }
      }
    }
  };

  return (
    <article>
      <header><h3>Tendencia de Margen Promedio (Trimestral)</h3></header>
      <div style={{ position: 'relative', height: '300px' }}>
        <Line options={options} data={data} />
      </div>
    </article>
  );
}