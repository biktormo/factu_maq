import React, { useState, useMemo } from 'react';
import Select from 'react-select';
import { useVentas } from '../hooks/useVentas';
import { calcularMargenPorOperacion, getColorParaMargen, analizarRentabilidadPorModelo } from '../utils/calculations';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Estilos dinámicos para react-select que se adaptan al tema de Pico.css
const customSelectStyles = () => ({
  control: (baseStyles) => ({ ...baseStyles, backgroundColor: 'var(--pico-form-element-background-color)', borderColor: 'var(--pico-form-element-border-color)', boxShadow: 'none', '&:hover': { borderColor: 'var(--pico-form-element-focus-color)' }, }),
  input: (baseStyles) => ({ ...baseStyles, color: 'var(--pico-form-element-color)' }),
  menu: (baseStyles) => ({ ...baseStyles, backgroundColor: 'var(--pico-card-background-color)', border: '1px solid var(--pico-form-element-border-color)' }),
  option: (baseStyles, { isFocused, isSelected }) => ({ ...baseStyles, backgroundColor: isSelected ? 'var(--primary)' : isFocused ? 'var(--pico-form-element-focus-color)' : 'transparent', color: isSelected ? 'var(--primary-inverse)' : 'var(--pico-form-element-color)', ':active': { backgroundColor: 'var(--primary)' }, }),
  placeholder: (baseStyles) => ({ ...baseStyles, color: 'var(--muted-color)' }),
  singleValue: (baseStyles) => ({ ...baseStyles, color: 'var(--pico-form-element-color)' }),
  multiValue: (baseStyles) => ({ ...baseStyles, backgroundColor: 'var(--primary)' }),
  multiValueLabel: (baseStyles) => ({ ...baseStyles, color: 'var(--primary-inverse)' }),
});

const getAñoFiscal = (fecha) => {
    if (!(fecha instanceof Date) || isNaN(fecha)) return null;
    const año = fecha.getFullYear();
    const mes = fecha.getMonth();
    return mes >= 10 ? año + 1 : año;
};

export default function Reportes() {
  const { ventas, loading, error } = useVentas();
  
  const [filtrosTipo, setFiltrosTipo] = useState([]);
  const [filtroVendedor, setFiltroVendedor] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [filtroAñoFiscal, setFiltroAñoFiscal] = useState('TODOS');

  const [ordenRentabilidadPor, setOrdenRentabilidadPor] = useState('margenTotal');
  const [ordenRentabilidad, setOrdenRentabilidad] = useState('desc');
  
  const isDarkMode = window.matchMedia?.('(prefers-color-scheme: dark)').matches;

  const ventasFiltradas = useMemo(() => {
    if (loading || !ventas) return [];
    const desde = fechaDesde ? new Date(fechaDesde) : null;
    const hasta = fechaHasta ? new Date(fechaHasta) : null;
    if (desde) desde.setHours(0, 0, 0, 0);
    if (hasta) hasta.setHours(23, 59, 59, 999);
    return ventas.filter(venta => {
      const tiposSeleccionados = filtrosTipo.map(t => t.value);
      const matchTipo = tiposSeleccionados.length === 0 || tiposSeleccionados.includes(venta.tipoProducto);
      const matchVendedor = filtroVendedor === '' || venta.vendedor?.toLowerCase().includes(filtroVendedor.toLowerCase());
      const fechaVenta = venta.fechaVenta;
      const matchFechaDesde = !desde || fechaVenta >= desde;
      const matchFechaHasta = !hasta || fechaVenta <= hasta;
      const matchAñoFiscal = filtroAñoFiscal === 'TODOS' || getAñoFiscal(venta.fechaVenta) === parseInt(filtroAñoFiscal);
      return matchTipo && matchVendedor && matchFechaDesde && matchFechaHasta && matchAñoFiscal;
    });
  }, [ventas, filtrosTipo, filtroVendedor, fechaDesde, fechaHasta, filtroAñoFiscal, loading]);

  const rentabilidadPorModelo = useMemo(() => {
    const analisis = analizarRentabilidadPorModelo(ventasFiltradas);
    return analisis.sort((a, b) => {
      const valorA = a[ordenRentabilidadPor];
      const valorB = b[ordenRentabilidadPor];
      if (typeof valorA === 'string') {
        return ordenRentabilidad === 'asc' ? valorA.localeCompare(valorB) : valorB.localeCompare(valorA);
      }
      return ordenRentabilidad === 'asc' ? valorA - valorB : valorB - valorA;
    });
  }, [ventasFiltradas, ordenRentabilidadPor, ordenRentabilidad]);

  const opcionesTipoProducto = useMemo(() => {
    if (loading || !ventas) return [];
    const tipos = ventas.map(v => v.tipoProducto).filter(Boolean);
    return [...new Set(tipos)].sort().map(tipo => ({ value: tipo, label: tipo }));
  }, [ventas, loading]);

  const vendedoresUnicos = useMemo(() => {
    if (loading || !ventas) return [];
    const vendedoresLimpios = ventas.map(v => v.vendedor?.trim().toUpperCase()).filter(Boolean);
    return [...new Set(vendedoresLimpios)].sort();
  }, [ventas, loading]);
  
  const añosFiscalesUnicos = useMemo(() => {
    if (loading || !ventas) return [];
    const años = ventas.map(v => getAñoFiscal(v.fechaVenta)).filter(Boolean);
    return ['TODOS', ...[...new Set(años)].sort((a, b) => b - a)];
  }, [ventas, loading]);

  const handleExportExcel = () => {
    const dataToExport = ventasFiltradas.map(v => ({
      'Fecha': v.fechaVenta.toLocaleDateString('es-ES'),
      'Tipo': v.tipoProducto,
      'Modelo': v.modelo,
      'Costo Neto (USD)': v.costoNetoUSD || v.costoUSD || 0,
      'Venta (USD)': v.ventaBrutaUSD || 0,
      'Margen %': calcularMargenPorOperacion(v).toFixed(2),
      'Vendedor': v.vendedor,
      'Cliente': v.cliente,
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Reporte de Ventas");
    XLSX.writeFile(workbook, "ReporteVentas.xlsx");
  };

  const handleExportPdf = () => {
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.autoTable({
      head: [['Fecha', 'Tipo', 'Modelo', 'Costo Neto', 'Venta', 'Margen %', 'Vendedor', 'Cliente']],
      body: ventasFiltradas.map(v => [
        v.fechaVenta.toLocaleDateString('es-ES'),
        v.tipoProducto,
        v.modelo,
        (v.costoNetoUSD || v.costoUSD || 0).toFixed(2),
        (v.ventaBrutaUSD || 0).toFixed(2),
        `${calcularMargenPorOperacion(v).toFixed(2)}%`,
        v.vendedor,
        v.cliente,
      ]),
      styles: { fontSize: 7 },
      headStyles: { fillColor: [54, 124, 43] },
    });
    doc.save('ReporteVentas.pdf');
  };
  
  const handleOrdenarRentabilidad = (columna) => {
    if (ordenRentabilidadPor === columna) {
      setOrdenRentabilidad(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setOrdenRentabilidadPor(columna);
      setOrdenRentabilidad('desc');
    }
  };

  if (loading) return <main className="container" aria-busy="true">Cargando reportes...</main>;
  if (error) return <main className="container"><article>{error}</article></main>;

  return (
    <main className="container">
      <article>
        <header>
          <h2>Análisis de Rentabilidad por Modelo</h2>
          <p>Datos basados en la selección de filtros actual. Haga clic en los encabezados para ordenar.</p>
        </header>
        <div style={{ overflowX: 'auto', maxHeight: '350px' }}>
          <table>
            <thead>
              <tr>
                <th><button className="outline contrast" style={{padding: '0.25rem 0.5rem', border: 'none', background: 'transparent', width: '100%', textAlign: 'left'}} onClick={() => handleOrdenarRentabilidad('modelo')}>Modelo {ordenRentabilidadPor === 'modelo' && (ordenRentabilidad === 'asc' ? '▲' : '▼')}</button></th>
                <th><button className="outline contrast" style={{padding: '0.25rem 0.5rem', border: 'none', background: 'transparent', width: '100%'}} onClick={() => handleOrdenarRentabilidad('unidadesVendidas')}>Unidades {ordenRentabilidadPor === 'unidadesVendidas' && (ordenRentabilidad === 'asc' ? '▲' : '▼')}</button></th>
                <th><button className="outline contrast" style={{padding: '0.25rem 0.5rem', border: 'none', background: 'transparent', width: '100%'}} onClick={() => handleOrdenarRentabilidad('facturacionTotal')}>Facturación Total {ordenRentabilidadPor === 'facturacionTotal' && (ordenRentabilidad === 'asc' ? '▲' : '▼')}</button></th>
                <th><button className="outline contrast" style={{padding: '0.25rem 0.5rem', border: 'none', background: 'transparent', width: '100%'}} onClick={() => handleOrdenarRentabilidad('margenTotal')}>Margen Total {ordenRentabilidadPor === 'margenTotal' && (ordenRentabilidad === 'asc' ? '▲' : '▼')}</button></th>
                <th><button className="outline contrast" style={{padding: '0.25rem 0.5rem', border: 'none', background: 'transparent', width: '100%'}} onClick={() => handleOrdenarRentabilidad('margenPromedio')}>Margen Promedio % {ordenRentabilidadPor === 'margenPromedio' && (ordenRentabilidad === 'asc' ? '▲' : '▼')}</button></th>
              </tr>
            </thead>
            <tbody>
              {rentabilidadPorModelo.map((item) => (
                <tr key={item.modelo}>
                  <td><strong>{item.modelo}</strong></td>
                  <td style={{ textAlign: 'center' }}>{item.unidadesVendidas}</td>
                  <td>{new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'USD' }).format(item.facturacionTotal)}</td>
                  <td>{new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'USD' }).format(item.margenTotal)}</td>
                  <td style={{ textAlign: 'center' }}>
                    <strong style={{ color: getColorParaMargen(item.margenPromedio) }}>
                      {item.margenPromedio.toFixed(2)}%
                    </strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
      
      <article style={{ marginTop: '2rem' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Reporte Detallado de Ventas</h2>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={handleExportExcel} className="outline secondary">Exportar a Excel</button>
            <button onClick={handleExportPdf} className="outline secondary">Exportar a PDF</button>
          </div>
        </header>
        
        <div className="grid">
          <div>
            <label htmlFor="filtro-tipo">Filtrar por Tipo (múltiple)</label>
            <Select
              id="filtro-tipo"
              isMulti
              options={opcionesTipoProducto}
              value={filtrosTipo}
              onChange={setFiltrosTipo}
              placeholder="Seleccione uno o más tipos..."
              styles={customSelectStyles()}
            />
          </div>
          <div>
            <label htmlFor="filtro-vendedor">Filtrar por Vendedor</label>
            <input 
              type="search" 
              id="filtro-vendedor"
              placeholder="Ej: MOCK, GALLEGO..."
              value={filtroVendedor}
              onChange={(e) => setFiltroVendedor(e.target.value)}
              list="vendedores-list"
            />
            <datalist id="vendedores-list">{vendedoresUnicos.map(v => <option key={v} value={v} />)}</datalist>
          </div>
        </div>

        <div className="grid">
          <div>
            <label htmlFor="fecha-desde">Fecha Desde</label>
            <input 
              type="date" 
              id="fecha-desde"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="fecha-hasta">Fecha Hasta</label>
            <input 
              type="date" 
              id="fecha-hasta"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="filtro-fy-reporte">Filtrar por Año Fiscal</label>
            <select id="filtro-fy-reporte" value={filtroAñoFiscal} onChange={(e) => setFiltroAñoFiscal(e.target.value)}>
                {añosFiscalesUnicos.map(año => (<option key={año} value={año}>{año === 'TODOS' ? 'TODOS' : `FY${año}`}</option>))}
            </select>
          </div>
        </div>

        <p style={{ marginTop: '1rem' }}>Mostrando {ventasFiltradas.length} de {ventas.length} registros.</p>
        
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Fecha</th><th>Tipo</th><th>Modelo</th><th>Costo Neto (USD)</th><th>Venta (USD)</th><th>Margen %</th><th>Vendedor</th><th>Cliente</th>
              </tr>
            </thead>
            <tbody>
              {ventasFiltradas.map((venta) => {
                const ventaBruta = venta.ventaBrutaUSD || 0;
                const costoNeto = venta.costoNetoUSD || venta.costoUSD || 0;
                let displayMargen;
                if (ventaBruta <= 0) {
                  displayMargen = <span style={{ fontStyle: 'italic', color: 'var(--muted-color)' }}>STOCK</span>;
                } else if (costoNeto <= 0) {
                  displayMargen = <span style={{ fontStyle: 'italic', color: 'var(--muted-color)' }}>PLAN AHORRO</span>;
                } else {
                  const margen = calcularMargenPorOperacion(venta);
                  displayMargen = <strong style={{ color: getColorParaMargen(margen) }}>{margen.toFixed(2)}%</strong>;
                }
                return (
                  <tr key={venta.id}>
                    <td>{venta.fechaVenta.toLocaleDateString('es-ES')}</td>
                    <td>{venta.tipoProducto}</td>
                    <td>{venta.modelo}</td>
                    <td>{new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'USD' }).format(costoNeto)}</td>
                    <td>{new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'USD' }).format(ventaBruta)}</td>
                    <td style={{ textAlign: 'center' }}>{displayMargen}</td>
                    <td>{venta.vendedor}</td>
                    <td>{venta.cliente}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </article>
    </main>
  );
}