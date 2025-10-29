import React from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function PieChart({ data, title, isDarkMode }) {
  // Las opciones del gráfico se definen dentro del componente para acceder a 'isDarkMode'
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          // Lógica condicional para el color del texto
          color: isDarkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)',
        }
      },
    },
  };

  return (
    <article>
      <header>
        <h3>{title}</h3>
      </header>
      <div style={{ position: 'relative', height: '300px' }}>
        {/* Pasamos los datos y las opciones dinámicas al componente Doughnut */}
        <Doughnut data={data} options={options} />
      </div>
    </article>
  );
}