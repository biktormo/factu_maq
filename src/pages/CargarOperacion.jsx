import React, { useState, useMemo } from 'react';
import Modal from 'react-modal';
import { db } from '../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useVentas } from '../hooks/useVentas';

const INCENTIVOS_BASE = [
  'RETAIL', 'PLA POWERTOUR', 'VOLUMEN', 'COMBO', 'AGROACTIVA', 'AGRONEA', 
  'EXPOAGRO', 'CONTRA', 'FOJD', 'PREVENTA', 'EXP.J.DEERE', 'AD.PREV'
];

const customModalStyles = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
    maxWidth: '600px',
    width: '90%',
    background: 'var(--card-background-color)',
    color: 'var(--contrast)',
    border: '1px solid var(--card-border-color)',
    padding: '2rem',
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    zIndex: 1000,
  },
};

Modal.setAppElement('#root');

export default function CargarOperacion() {
  const [tipoProducto, setTipoProducto] = useState('');
  const [modelo, setModelo] = useState('');
  const [costoUSD, setCostoUSD] = useState('');
  const [ventaUSD, setVentaUSD] = useState('');
  const [cliente, setCliente] = useState('');
  const [vendedor, setVendedor] = useState('');
  const [fechaVenta, setFechaVenta] = useState('');
  const [incentivos, setIncentivos] = useState({});
  const [listaIncentivos, setListaIncentivos] = useState(INCENTIVOS_BASE);
  const [nuevoIncentivo, setNuevoIncentivo] = useState('');
  const [incluyeUsado, setIncluyeUsado] = useState(false);
  const [modeloUsado, setModeloUsado] = useState('');
  const [precioTomaUSD, setPrecioTomaUSD] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [datosParaGuardar, setDatosParaGuardar] = useState(null);

  const { ventas: ventasOriginales } = useVentas();
  const clientesUnicos = useMemo(() => [...new Set((ventasOriginales || []).map(v => v.cliente).filter(Boolean))].sort(), [ventasOriginales]);
  const vendedoresUnicos = useMemo(() => [...new Set((ventasOriginales || []).map(v => v.vendedor?.trim().toUpperCase()).filter(Boolean))].sort(), [ventasOriginales]);
  const tiposDeProductoUnicos = useMemo(() => [...new Set((ventasOriginales || []).map(v => v.tipoProducto).filter(Boolean))].sort(), [ventasOriginales]);

  const handleIncentivoChange = (nombre, valor) => {
    setIncentivos(prev => ({ ...prev, [nombre]: parseFloat(valor) || 0 }));
  };

  const handleCheckIncentivo = (nombre, isChecked) => {
    setIncentivos(prev => {
      const newIncentivos = { ...prev };
      if (isChecked) {
        newIncentivos[nombre] = newIncentivos[nombre] || 0;
      } else {
        delete newIncentivos[nombre];
      }
      return newIncentivos;
    });
  };

  const handleAddNuevoIncentivo = () => {
    const nuevo = nuevoIncentivo.trim().toUpperCase();
    if (nuevo && !listaIncentivos.includes(nuevo)) {
      setListaIncentivos(prev => [...prev, nuevo].sort());
      setNuevoIncentivo('');
    }
  };

  const resetForm = () => {
    setTipoProducto('');
    setModelo('');
    setCostoUSD('');
    setVentaUSD('');
    setCliente('');
    setVendedor('');
    setFechaVenta('');
    setIncentivos({});
    setIncluyeUsado(false);
    setModeloUsado('');
    setPrecioTomaUSD('');
    setError(null);
  };

  const handlePreview = (e) => {
    e.preventDefault();
    if (!tipoProducto || !modelo || !costoUSD || !ventaUSD || !fechaVenta || !vendedor) {
      setError("Por favor, complete todos los campos principales.");
      window.scrollTo(0, document.body.scrollHeight);
      return;
    }
    setError(null);
    
    const costoNum = parseFloat(costoUSD);
    const ventaNum = parseFloat(ventaUSD);
    const precioTomaNum = parseFloat(precioTomaUSD) || 0;
    const totalPorcentajeIncentivos = Object.values(incentivos).reduce((sum, val) => sum + val, 0);
    const totalIncentivosUSD = costoNum * (totalPorcentajeIncentivos / 100);
    const costoNetoFinalUSD = costoNum - totalIncentivosUSD;

    const previsualizacion = {
      tipoProducto, modelo, costoUSD: costoNum, ventaBrutaUSD: ventaNum, cliente, vendedor, fechaVenta,
      totalIncentivos: totalIncentivosUSD,
      costoNetoUSD: costoNetoFinalUSD,
      tomaUsado: { seTomo: incluyeUsado, modelo: modeloUsado, precioTomaUSD: precioTomaNum },
      incentivos,
    };
    setDatosParaGuardar(previsualizacion);
    setModalIsOpen(true);
  };

  const handleConfirmSave = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await addDoc(collection(db, 'ventas'), {
        ...datosParaGuardar,
        tipoProducto: datosParaGuardar.tipoProducto.toUpperCase(),
        modelo: datosParaGuardar.modelo.toUpperCase(),
        tomaUsado: {
            ...datosParaGuardar.tomaUsado,
            modelo: datosParaGuardar.tomaUsado.modelo.toUpperCase(),
        },
        fechaVenta: new Date(datosParaGuardar.fechaVenta),
        createdAt: serverTimestamp(),
      });
      setSuccess('¡Operación cargada con éxito! El formulario ha sido reseteado.');
      setModalIsOpen(false);
      resetForm();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container">
      <article>
        <header><h2>Cargar Nueva Operación</h2></header>
        <form>
          <div className="grid">
            <div>
              <label htmlFor="tipo-producto">Tipo de Maquinaria</label>
              <input type="text" id="tipo-producto" value={tipoProducto} onChange={e => setTipoProducto(e.target.value)} required list="tipos-producto-list" />
              <datalist id="tipos-producto-list">{tiposDeProductoUnicos.map(tipo => <option key={tipo} value={tipo} />)}</datalist>
            </div>
            <div>
              <label htmlFor="modelo">Modelo</label>
              <input type="text" id="modelo" value={modelo} onChange={e => setModelo(e.target.value)} required />
            </div>
          </div>
          <div className="grid">
            <div>
              <label htmlFor="costo-usd">Costo (USD)</label>
              <input type="number" id="costo-usd" value={costoUSD} onChange={e => setCostoUSD(e.target.value)} required step="0.01" />
            </div>
            <div>
              <label htmlFor="venta-usd">Venta (USD)</label>
              <input type="number" id="venta-usd" value={ventaUSD} onChange={e => setVentaUSD(e.target.value)} required step="0.01" />
            </div>
            <div>
              <label htmlFor="fecha-venta">Fecha de Venta</label>
              <input type="date" id="fecha-venta" value={fechaVenta} onChange={e => setFechaVenta(e.target.value)} required />
            </div>
          </div>
          <div className="grid">
            <div>
              <label htmlFor="cliente">Cliente</label>
              <input type="text" id="cliente" value={cliente} onChange={e => setCliente(e.target.value)} required list="clientes-list" />
              <datalist id="clientes-list">{clientesUnicos.map(c => <option key={c} value={c} />)}</datalist>
            </div>
            <div>
              <label htmlFor="vendedor">Vendedor</label>
              <select id="vendedor" value={vendedor} onChange={e => setVendedor(e.target.value)} required>
                <option value="" disabled>Seleccione un vendedor</option>
                {vendedoresUnicos.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
          </div>
          <hr />
          <fieldset>
            <legend>Incentivos</legend>
            <p><small>Seleccione los incentivos a aplicar e ingrese el porcentaje.</small></p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              {listaIncentivos.map(nombre => (
                <label key={nombre} htmlFor={`check-${nombre}`} style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: 0 }}>
                  <input type="checkbox" id={`check-${nombre}`} checked={incentivos[nombre] !== undefined} onChange={e => handleCheckIncentivo(nombre, e.target.checked)} />
                  <span>{nombre}</span>
                  {incentivos[nombre] !== undefined && (
                    <input type="number" placeholder="%" step="0.01" style={{ width: '80px', marginLeft: 'auto', marginBottom: 0 }} onChange={e => handleIncentivoChange(nombre, e.target.value)} />
                  )}
                </label>
              ))}
            </div>
            <div className="grid" style={{ marginTop: '1.5rem' }}>
              <div>
                <input type="text" value={nuevoIncentivo} onChange={e => setNuevoIncentivo(e.target.value)} placeholder="Nombre del nuevo incentivo" />
              </div>
              <div>
                <button type="button" onClick={handleAddNuevoIncentivo} className="secondary outline">Añadir Incentivo</button>
              </div>
            </div>
          </fieldset>
          <hr />
          <fieldset>
            <label htmlFor="switch-usado">
              <input type="checkbox" id="switch-usado" name="switch-usado" role="switch" checked={incluyeUsado} onChange={e => setIncluyeUsado(e.target.checked)} />
              Incluye Toma de Usado
            </label>
            {incluyeUsado && (
              <div className="grid">
                <div>
                  <label htmlFor="modelo-usado">Modelo del Usado</label>
                  <input type="text" id="modelo-usado" value={modeloUsado} onChange={e => setModeloUsado(e.target.value)} required />
                </div>
                <div>
                  <label htmlFor="precio-toma">Precio de Toma (USD)</label>
                  <input type="number" id="precio-toma" value={precioTomaUSD} onChange={e => setPrecioTomaUSD(e.target.value)} required step="0.01" />
                </div>
              </div>
            )}
          </fieldset>
          <hr />
        </form>

        <button onClick={handlePreview} aria-busy={loading} disabled={loading}>
          Previsualizar y Guardar
        </button>

        {error && <p style={{ color: 'var(--pico-color-red-500)', marginTop: '1rem' }}><strong>Error:</strong> {error}</p>}
        {success && <p style={{ color: 'var(--pico-color-green-500)', marginTop: '1rem' }}><strong>Éxito:</strong> {success}</p>}

        <Modal
          isOpen={modalIsOpen}
          onRequestClose={() => setModalIsOpen(false)}
          contentLabel="Confirmar Operación"
          style={customModalStyles}
        >
          {datosParaGuardar && (
            <>
              <h3>Confirmar Datos de la Operación</h3>
              <div className="grid">
                <div><strong>Tipo:</strong> {datosParaGuardar.tipoProducto.toUpperCase()}</div>
                <div><strong>Modelo:</strong> {datosParaGuardar.modelo.toUpperCase()}</div>
              </div>
              <div className="grid">
                <div><strong>Cliente:</strong> {datosParaGuardar.cliente}</div>
                <div><strong>Vendedor:</strong> {datosParaGuardar.vendedor}</div>
              </div>
              <p><strong>Fecha:</strong> {new Date(datosParaGuardar.fechaVenta + 'T00:00:00').toLocaleDateString('es-ES')}</p>
              <hr/>
              <p><strong>Venta USD:</strong> {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'USD' }).format(datosParaGuardar.ventaBrutaUSD)}</p>
              <p><strong>Costo Bruto USD:</strong> {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'USD' }).format(datosParaGuardar.costoUSD)}</p>
              <p><strong>Total Incentivos (calculado):</strong> <span style={{color: '#E53935'}}>-{new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'USD' }).format(datosParaGuardar.totalIncentivos)}</span></p>
              <p><strong>Costo Neto (calculado):</strong> <strong>{new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'USD' }).format(datosParaGuardar.costoNetoUSD)}</strong></p>
              <hr/>
              {datosParaGuardar.tomaUsado.seTomo && (
                <p><strong>Toma Usado:</strong> {datosParaGuardar.tomaUsado.modelo.toUpperCase()} por {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'USD' }).format(datosParaGuardar.tomaUsado.precioTomaUSD)}</p>
              )}
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button onClick={handleConfirmSave} aria-busy={loading}>Confirmar y Guardar</button>
                <button className="secondary" onClick={() => setModalIsOpen(false)} disabled={loading}>Cancelar</button>
              </div>
            </>
          )}
        </Modal>
      </article>
    </main>
  );
}