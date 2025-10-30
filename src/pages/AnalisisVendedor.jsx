import React, { useState, useMemo } from 'react';
import { useVentas } from '../hooks/useVentas';
import KpiCard from '../components/dashboard/KpiCard';
import { calcularMargenPorOperacion, getColorParaMargen, generarRankingVendedores } from '../utils/calculations';

// --- FUNCIONES AUXILIARES ESPECÍFICAS DE ESTA PÁGINA ---
const getAñoFiscal = (fecha) => {
    if (!(fecha instanceof Date) || isNaN(fecha)) return null;
    const año = fecha.getFullYear();
    const mes = fecha.getMonth();
    return mes >= 10 ? año + 1 : año;
};

const calcularKPIsVendedor = (ventasVendedor) => {
    if (!ventasVendedor || ventasVendedor.length === 0) {
        return { totalRevenueUSD: 0, totalMarginUSD: 0, averageMargin: '0.00%', salesVolume: 0, products: 0 };
    }
    let totalRevenueUSD = 0, totalMarginUSD = 0, salesVolume = 0;
    ventasVendedor.forEach(venta => {
        const ventaBruta = venta.ventaBrutaUSD || 0;
        const costoNeto = venta.costoNetoUSD || venta.costoUSD || 0;
        if (ventaBruta > 0 && costoNeto > 0) {
            salesVolume++;
            totalRevenueUSD += ventaBruta;
            const margenBrutoUSD = ventaBruta - costoNeto;
            totalMarginUSD += margenBrutoUSD;
        }
    });
    const averageMargin = (totalMarginUSD / totalRevenueUSD) * 100;
    return {
        totalRevenueUSD,
        totalMarginUSD,
        averageMargin: (isNaN(averageMargin) ? 0 : averageMargin).toFixed(2) + '%',
        salesVolume,
        products: new Set(ventasVendedor.map(v => v.modelo)).size,
    };
};

// --- COMPONENTE PRINCIPAL ---
export default function AnalisisVendedor() {
    const { ventas: ventasOriginales, loading, error } = useVentas();
    const [vendedorSeleccionado, setVendedorSeleccionado] = useState('');
    const [filtroAñoFiscal, setFiltroAñoFiscal] = useState('TODOS');
    
    const [ordenarPor, setOrdenarPor] = useState('facturacionTotal');
    const [orden, setOrden] = useState('desc');

    const { vendedoresUnicos, añosFiscalesUnicos } = useMemo(() => {
        if (!ventasOriginales) return { vendedoresUnicos: [], añosFiscalesUnicos: [] };
        const vendedores = ventasOriginales.map(v => v.vendedor?.trim().toUpperCase()).filter(Boolean);
        const años = ventasOriginales.map(v => getAñoFiscal(v.fechaVenta)).filter(Boolean);
        return {
            vendedoresUnicos: [...new Set(vendedores)].sort(),
            añosFiscalesUnicos: ['TODOS', ...[...new Set(años)].sort((a, b) => b - a)],
        };
    }, [ventasOriginales]);

    const ventasFiltradasPorAño = useMemo(() => {
        if (!ventasOriginales) return [];
        return ventasOriginales.filter(v => {
            return filtroAñoFiscal === 'TODOS' || getAñoFiscal(v.fechaVenta) === parseInt(filtroAñoFiscal);
        });
    }, [ventasOriginales, filtroAñoFiscal]);

    const rankingVendedores = useMemo(() => {
        const ranking = generarRankingVendedores(ventasFiltradasPorAño);
        return ranking.sort((a, b) => {
            if (a[ordenarPor] < b[ordenarPor]) return orden === 'asc' ? -1 : 1;
            if (a[ordenarPor] > b[ordenarPor]) return orden === 'asc' ? 1 : -1;
            return 0;
        });
    }, [ventasFiltradasPorAño, ordenarPor, orden]);

    const ventasVendedor = useMemo(() => {
        if (!vendedorSeleccionado) return [];
        return ventasFiltradasPorAño.filter(v => v.vendedor?.trim().toUpperCase() === vendedorSeleccionado);
    }, [ventasFiltradasPorAño, vendedorSeleccionado]);

    const kpisVendedor = useMemo(() => calcularKPIsVendedor(ventasVendedor), [ventasVendedor]);

    const handleOrdenar = (columna) => {
        if (ordenarPor === columna) {
            setOrden(prev => (prev === 'asc' ? 'desc' : 'asc'));
        } else {
            setOrdenarPor(columna);
            setOrden('desc');
        }
    };

    if (loading) return <main className="container" aria-busy="true">Cargando datos...</main>;
    if (error) return <main className="container"><article>Error: {error}</article></main>;

    return (
        <main className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <h1>Análisis de Vendedores</h1>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ minWidth: '300px' }}>
                        <label htmlFor="select-vendedor">Seleccionar Vendedor</label>
                        <select
                            id="select-vendedor"
                            value={vendedorSeleccionado}
                            onChange={(e) => setVendedorSeleccionado(e.target.value)}
                        >
                            <option value="">-- Elija un vendedor --</option>
                            {vendedoresUnicos.map(vendedor => (
                                <option key={vendedor} value={vendedor}>{vendedor}</option>
                            ))}
                        </select>
                    </div>
                    <div style={{ minWidth: '200px' }}>
                        <label htmlFor="filtro-fy-vendedor">Filtrar por Año Fiscal</label>
                        <select id="filtro-fy-vendedor" value={filtroAñoFiscal} onChange={(e) => setFiltroAñoFiscal(e.target.value)}>
                            {añosFiscalesUnicos.map(año => <option key={año} value={año}>{año === 'TODOS' ? 'TODOS' : `FY${año}`}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {vendedorSeleccionado && (
                <div style={{ marginTop: '2rem' }}>
                    <h4>Rendimiento de: <strong>{vendedorSeleccionado}</strong> (en {filtroAñoFiscal === 'TODOS' ? 'todos los períodos' : `FY${filtroAñoFiscal}`})</h4>
                    <div className="grid">
                        <div><KpiCard title="Facturación Total (USD)" value={new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'USD' }).format(kpisVendedor.totalRevenueUSD)} subtext={`Total generado por ${vendedorSeleccionado}`} /></div>
                        <div><KpiCard title="Margen Total (USD)" value={new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'USD' }).format(kpisVendedor.totalMarginUSD)} subtext="Ganancia total generada" /></div>
                        <div><KpiCard title="Margen Promedio" value={kpisVendedor.averageMargin} subtext="Promedio de margen en sus ventas" /></div>
                        <div><KpiCard title="Operaciones" value={kpisVendedor.salesVolume} subtext="Total de unidades vendidas" /></div>
                    </div>
                </div>
            )}

            <article style={{ marginTop: '2rem' }}>
                <header>
                    <h5>Ranking de Vendedores ({filtroAñoFiscal === 'TODOS' ? 'General' : `FY${filtroAñoFiscal}`})</h5>
                </header>
                <div style={{ overflowX: 'auto' }}>
                    <table>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th><button onClick={() => handleOrdenar('nombre')} className="outline contrast" style={{padding: '0.25rem 0.5rem', border: 'none', background: 'transparent'}}>{'Vendedor '}{ordenarPor === 'nombre' && (orden === 'asc' ? '▲' : '▼')}</button></th>
                                <th><button onClick={() => handleOrdenar('facturacionTotal')} className="outline contrast" style={{padding: '0.25rem 0.5rem', border: 'none', background: 'transparent'}}>{'Facturación Total '}{ordenarPor === 'facturacionTotal' && (orden === 'asc' ? '▲' : '▼')}</button></th>
                                <th><button onClick={() => handleOrdenar('ticketPromedio')} className="outline contrast" style={{padding: '0.25rem 0.5rem', border: 'none', background: 'transparent'}}>{'Ticket Promedio '}{ordenarPor === 'ticketPromedio' && (orden === 'asc' ? '▲' : '▼')}</button></th>
                                <th><button onClick={() => handleOrdenar('operaciones')} className="outline contrast" style={{padding: '0.25rem 0.5rem', border: 'none', background: 'transparent'}}>{'Operaciones '}{ordenarPor === 'operaciones' && (orden === 'asc' ? '▲' : '▼')}</button></th>
                                <th><button onClick={() => handleOrdenar('margenPromedio')} className="outline contrast" style={{padding: '0.25rem 0.5rem', border: 'none', background: 'transparent'}}>{'Margen Promedio % '}{ordenarPor === 'margenPromedio' && (orden === 'asc' ? '▲' : '▼')}</button></th>
                            </tr>
                        </thead>
                        <tbody>
                            {rankingVendedores.map((vendedor, index) => (
                                <tr key={vendedor.nombre} style={{ backgroundColor: vendedor.nombre === vendedorSeleccionado ? 'var(--pico-form-element-focus-color)' : 'transparent' }}>
                                    <td><strong>{index + 1}</strong></td>
                                    <td>{vendedor.nombre}</td>
                                    <td>{new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'USD' }).format(vendedor.facturacionTotal)}</td>
                                    <td>{new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'USD' }).format(vendedor.ticketPromedio)}</td>
                                    <td style={{ textAlign: 'center' }}>{vendedor.operaciones}</td>
                                    <td style={{ textAlign: 'center' }}>
                                        <strong style={{ color: getColorParaMargen(vendedor.margenPromedio) }}>
                                            {vendedor.margenPromedio.toFixed(2)}%
                                        </strong>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </article>
        </main>
    );
}