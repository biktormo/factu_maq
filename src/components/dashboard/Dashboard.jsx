import React, { useState, useEffect, useMemo } from 'react';
import { useVentas } from '../../hooks/useVentas';
import { useTipoDeCambio } from '../../hooks/useTipoDeCambio';
import KpiCard from './KpiCard';
import VentasRecientes from './VentasRecientes';
import SalesChart from './SalesChart';
import PieChart from './PieChart';
import MarginChart from './MarginChart';

// --- FUNCIONES AUXILIARES ---

const formatCurrencyAbbreviated = (num, currency) => {
  if (typeof num !== 'number' || isNaN(num)) return `${currency} 0`;
  if (Math.abs(num) >= 1_000_000_000) {
    return `${(num / 1_000_000_000).toFixed(2)} G ${currency}`;
  }
  if (Math.abs(num) >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(2)} M ${currency}`;
  }
  if (Math.abs(num) >= 1_000) {
    return `${(num / 1_000).toFixed(1)} K ${currency}`;
  }
  return `${num.toFixed(0)} ${currency}`;
};

const getAñoFiscal = (fecha) => {
  if (!(fecha instanceof Date) || isNaN(fecha)) return null;
  const año = fecha.getFullYear();
  const mes = fecha.getMonth();
  return mes >= 10 ? año + 1 : año;
};

const calcularKPIs = (ventas) => {
  if (!ventas || ventas.length === 0) {
    return { totalRevenueUSD: 0, totalMarginUSD: 0, averageMargin: '0.00%', totalSalesVolume: 0, totalProducts: 0 };
  }
  let totalRevenueUSD = 0, planAhorroRevenueUSD = 0, totalMarginUSD = 0, totalSalesVolume = 0;
  ventas.forEach(venta => {
    const ventaBruta = venta.ventaBrutaUSD || 0;
    const costo = venta.costoUSD || 0;
    if (ventaBruta > 0 && costo <= 0) {
      planAhorroRevenueUSD += ventaBruta;
    } else if (ventaBruta > 0 && costo > 0) {
      totalSalesVolume++;
      totalRevenueUSD += ventaBruta;
      const totalIncentivosPorcentaje = Object.values(venta.incentivos || {}).reduce((sum, val) => sum + val, 0);
      const montoIncentivosUSD = ventaBruta * (totalIncentivosPorcentaje / 100);
      const costoNetoUSD = costo - montoIncentivosUSD;
      const margenBrutoUSD = ventaBruta - costoNetoUSD;
      totalMarginUSD += margenBrutoUSD;
      const margenPorcentaje = (margenBrutoUSD / ventaBruta) * 100;
      if (margenPorcentaje < -5 || margenPorcentaje > 50) {
        console.warn('Posible inconsistencia de datos (margen anómalo):', { modelo: venta.modelo, fecha: venta.fechaVenta.toLocaleDateString(), costo: costo.toFixed(2), venta: ventaBruta.toFixed(2), margen: `${margenPorcentaje.toFixed(2)}%` });
      }
    }
  });
  const averageMargin = (totalMarginUSD / totalRevenueUSD) * 100;
  return {
    totalRevenueUSD: totalRevenueUSD + planAhorroRevenueUSD,
    totalMarginUSD: totalMarginUSD,
    averageMargin: (isNaN(averageMargin) ? 0 : averageMargin).toFixed(2) + '%',
    totalSalesVolume: totalSalesVolume,
    totalProducts: new Set(ventas.map(v => v.modelo)).size,
  };
};

const prepararDatosTorta = (ventas, filtroProducto) => {
    const esFiltroGeneral = filtroProducto === 'TODOS';
    const dataMap = new Map();
    ventas.forEach(venta => {
        const key = esFiltroGeneral ? venta.tipoProducto : venta.modelo;
        if (!key) return;
        dataMap.set(key, (dataMap.get(key) || 0) + 1);
    });
    const sortedData = Array.from(dataMap.entries()).sort((a, b) => b[1] - a[1]);
    const topItems = sortedData.slice(0, 7);
    if (sortedData.length > 7) {
        const otrosCount = sortedData.slice(7).reduce((acc, [, count]) => acc + count, 0);
        topItems.push(['Otros', otrosCount]);
    }
    const labels = topItems.map(([key]) => key);
    const dataPoints = topItems.map(([, count]) => count);
    const data = { labels, datasets: [{ label: 'Unidades', data: dataPoints, backgroundColor: ['#367C2B', '#FFDE00', '#75A234', '#B6D13B', '#555555', '#888888', '#BBBBBB', '#DDDDDD'], borderColor: 'var(--card-background-color)', borderWidth: 2, }] };
    const title = esFiltroGeneral ? 'Participación por Tipo de Producto' : `Participación por Modelo (${filtroProducto})`;
    return { data, title };
};

// --- COMPONENTE PRINCIPAL ---

export default function Dashboard() {
  const { ventas: ventasOriginales, loading: loadingVentas, error: errorVentas } = useVentas();
  const { tipoDeCambio, loading: loadingTC } = useTipoDeCambio();
  
  const [filtroProducto, setFiltroProducto] = useState('TODOS');
  const [filtroAñoFiscal, setFiltroAñoFiscal] = useState('TODOS');
  const [isDarkMode, setIsDarkMode] = useState(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => setIsDarkMode(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const tiposDeProductoUnicos = ['TODOS', ...[...new Set((ventasOriginales || []).map(v => v.tipoProducto).filter(Boolean))].sort()];
  const añosFiscalesUnicos = ['TODOS', ...[...new Set((ventasOriginales || []).map(v => getAñoFiscal(v.fechaVenta)).filter(Boolean))].sort((a, b) => b - a)];

  const ventasFiltradas = useMemo(() => {
    if (!ventasOriginales) return [];
    return ventasOriginales.filter(venta => {
      const matchProducto = filtroProducto === 'TODOS' || venta.tipoProducto === filtroProducto;
      const matchAñoFiscal = filtroAñoFiscal === 'TODOS' || getAñoFiscal(venta.fechaVenta) === parseInt(filtroAñoFiscal);
      return matchProducto && matchAñoFiscal;
    });
  }, [ventasOriginales, filtroProducto, filtroAñoFiscal]);
  
  const kpis = useMemo(() => calcularKPIs(ventasFiltradas), [ventasFiltradas]);
  const datosGraficoTorta = useMemo(() => prepararDatosTorta(ventasFiltradas, filtroProducto), [ventasFiltradas, filtroProducto]);
  
  if (loadingVentas || loadingTC) {
    return <main className="container"><div aria-busy="true">Cargando datos...</div></main>;
  }
  
  if (errorVentas) {
    return <main className="container"><article><header>Error</header><p>{errorVentas}</p></article></main>;
  }

  return (
    <main className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
        <h1>Dashboard</h1>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ minWidth: '250px' }}>
            <label htmlFor="filtro-producto">Filtrar por Tipo</label>
            <select id="filtro-producto" value={filtroProducto} onChange={(e) => setFiltroProducto(e.target.value)}>
              {tiposDeProductoUnicos.map(tipo => (<option key={tipo} value={tipo}>{tipo}</option>))}
            </select>
          </div>
          <div style={{ minWidth: '200px' }}>
            <label htmlFor="filtro-fy">Filtrar por Año Fiscal</label>
            <select id="filtro-fy" value={filtroAñoFiscal} onChange={(e) => setFiltroAñoFiscal(e.target.value)}>
              {añosFiscalesUnicos.map(año => (<option key={año} value={año}>{año === 'TODOS' ? 'TODOS' : `FY${año}`}</option>))}
            </select>
          </div>
        </div>
      </div>
      
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
        <div>
          <KpiCard title="Facturación (USD)" value={formatCurrencyAbbreviated(kpis.totalRevenueUSD, '$')} subtext={new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'USD' }).format(kpis.totalRevenueUSD)} />
        </div>
        <div>
          <KpiCard title="Facturación (Local)" value={formatCurrencyAbbreviated(kpis.totalRevenueUSD * tipoDeCambio, 'ARS')} subtext={new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'ARS' }).format(kpis.totalRevenueUSD * tipoDeCambio)} />
        </div>
        <div>
          <KpiCard title="Margen (USD)" value={formatCurrencyAbbreviated(kpis.totalMarginUSD, '$')} subtext={new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'USD' }).format(kpis.totalMarginUSD)} />
        </div>
        <div>
          <KpiCard title="Margen Promedio" value={kpis.averageMargin} subtext="Sobre ventas con costo" />
        </div>
        <div>
          <KpiCard title="Volumen de Ventas" value={new Intl.NumberFormat('de-DE').format(kpis.totalSalesVolume)} subtext="Unidades con costo" />
        </div>
        <div>
          <KpiCard title="Modelos Únicos" value={kpis.totalProducts} subtext="En la selección actual" />
        </div>
      </div>
      
      <div className="grid" style={{ marginTop: '2rem' }}>
        <div style={{ gridColumn: '1 / span 2' }}>
            <VentasRecientes ventas={ventasFiltradas} />
        </div>
        <div>
            <PieChart data={datosGraficoTorta.data} title={datosGraficoTorta.title} isDarkMode={isDarkMode} />
        </div>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <SalesChart ventas={ventasFiltradas} añoFiscal={filtroAñoFiscal} isDarkMode={isDarkMode} />
      </div>

      <div style={{ marginTop: '2rem' }}>
        <MarginChart ventas={ventasFiltradas} añoFiscal={filtroAñoFiscal} isDarkMode={isDarkMode} />
      </div>
    </main>
  );
}