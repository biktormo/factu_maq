import React, { useMemo } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const getAñoFiscal = (fecha) => {
  if (!(fecha instanceof Date) || isNaN(fecha)) return null;
  const año = fecha.getFullYear();
  const mes = fecha.getMonth();
  return mes >= 10 ? año + 1 : año;
};

const procesarDatosParaGrafico = (ventas, añoFiscalFiltrado) => {
  const esVistaAnual = añoFiscalFiltrado === 'TODOS';
  
  if (esVistaAnual) {
    const ventasPorAñoFiscal = {};
    ventas.forEach(venta => {
      const fy = getAñoFiscal(venta.fechaVenta);
      if (fy) {
        ventasPorAñoFiscal[fy] = (ventasPorAñoFiscal[fy] || 0) + 1;
      }
    });

    const labels = Object.keys(ventasPorAñoFiscal).sort((a, b) => a - b).map(fy => `FY${fy}`);
    const dataPoints = Object.keys(ventasPorAñoFiscal).sort((a, b) => a - b).map(fy => ventasPorAñoFiscal[fy]);
    
    return { labels, dataPoints, title: 'Resumen de Ventas por Año Fiscal' };

  } else {
    const ventasPorMes = {};
    const nombresMeses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const añoInicio = parseInt(añoFiscalFiltrado) - 1;
    const mesInicio = 10;
    for (let i = 0; i < 12; i++) {
      const d = new Date(añoInicio, mesInicio + i, 1);
      const anio = d.getFullYear();
      const mes = d.getMonth();
      const clave = `${anio}-${mes}`;
      ventasPorMes[clave] = { label: `${nombresMeses[mes]} '${String(anio).slice(2)}`, count: 0 };
    }
    ventas.forEach(venta => {
      if (!venta.fechaVenta) return;
      const fecha = venta.fechaVenta;
      const anio = fecha.getFullYear();
      const mes = fecha.getMonth();
      const clave = `${anio}-${mes}`;
      if (ventasPorMes[clave]) {
        ventasPorMes[clave].count++;
      }
    });
    const labels = Object.values(ventasPorMes).map(mes => mes.label);
    const dataPoints = Object.values(ventasPorMes).map(mes => mes.count);
    return { labels, dataPoints, title: `Resumen de Ventas Mensuales (FY${añoFiscalFiltrado})` };
  }
};

export default function SalesChart({ ventas, añoFiscal, isDarkMode }) {
  const { labels, dataPoints, title } = useMemo(() => procesarDatosParaGrafico(ventas, añoFiscal), [ventas, añoFiscal]);

  const data = useMemo(() => ({
    labels,
    datasets: [{
      label: 'Unidades Vendidas',
      data: dataPoints,
      backgroundColor: '#367C2B',
      borderColor: '#2a6322',
      borderWidth: 1,
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
  };;

  return (
    <article>
        <header>
            <h3>{title}</h3>
        </header>
        <div style={{ position: 'relative', height: '300px' }}>
            <Bar options={options} data={data} />
        </div>
    </article>
  );
}