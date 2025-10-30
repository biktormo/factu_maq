import React, { useMemo } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function PieChart({ data, title }) {
  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: 'rgba(128, 128, 128, 0.9)', // Color gris fijo para ambos temas
        }
      },
    },
  }), []);

  return (
    <article>
      <header><h3>{title}</h3></header>
      <div style={{ position: 'relative', height: '300px' }}>
        <Doughnut data={data} options={options} />
      </div>
    </article>
  );
}