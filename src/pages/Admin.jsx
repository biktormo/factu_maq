import React, { useState } from 'react';
import Papa from 'papaparse';
import { db } from '../firebase/config';
import { collection, writeBatch, getDocs, doc, deleteDoc } from 'firebase/firestore';

// Funciones de limpieza (sin cambios)
const limpiarMoneda = (valor) => {
  if (!valor || typeof valor !== 'string') return 0;
  const valorLimpio = valor.replace(/USS|\$|"/g, "").trim().replace(/\./g, '').replace(/,/g, '.');
  return parseFloat(valorLimpio) || 0;
};
const limpiarPorcentaje = (valor) => {
  if (!valor || typeof valor !== 'string') return 0;
  return parseFloat(valor.replace(/%/g, "").trim().replace(/,/g, ".")) || 0;
};
const parsearFecha = (fechaStr) => {
  if (!fechaStr || typeof fechaStr !== 'string') return null;
  const partes = fechaStr.split('/');
  if (partes.length !== 3) return null;
  const fecha = new Date(parseInt(partes[2]), parseInt(partes[1]) - 1, parseInt(partes[0]));
  return isNaN(fecha.getTime()) ? null : fecha;
};

export default function Admin() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsUploading(true);
    setUploadStatus('Leyendo archivo CSV...');

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        setUploadStatus(`Archivo leído. Se encontraron ${results.data.length} filas. Procesando...`);
        
        const ventasProcesadas = results.data.map(row => {
            const fechaVenta = parsearFecha(row['FECHA']);
            if (!fechaVenta) return null;

            // --- ¡NUEVA LÓGICA AQUÍ! ---
            return {
              tipoProducto: row['MAQUINARIA'] || 'No especificado',
              fechaVenta: fechaVenta,
              modelo: row['MODELO'] || 'No especificado',
              numeroFactura: row['FACTURA'] || '',
              cliente: row['CLIENTE'] || 'No especificado',
              vendedor: row['VENDEDOR'] || 'No especificado',
              sucursal: row['SUCURSAL'] || 'No especificado',
              costoUSD: limpiarMoneda(row[' COSTO U$S']),
              costoNetoUSD: limpiarMoneda(row[' COSTO NETO U$D']), // <-- NUEVO CAMPO
              ventaBrutaUSD: limpiarMoneda(row[' VENTA U$S']),
              tipoDeCambio: limpiarMoneda(row['T.C.']),
              totalIncentivos: limpiarMoneda(row['TOTAL INCENTIVOS']), // <-- NUEVO CAMPO
              fleteARS: 0, // Mantenemos por si se usa a futuro
              fleteAbsorbido: true,
              incentivos: { // Seguimos guardando los porcentajes para referencia
                retail: limpiarPorcentaje(row['RETAIL']),
                plaPowertool: limpiarPorcentaje(row['PLA POWERTOUR']), // Corregido el typo
                volumen: limpiarPorcentaje(row['VOLUMEN']),
                combo: limpiarPorcentaje(row['COMBO']),
                agroactiva: limpiarPorcentaje(row['AGROACTIVA']),
                agronea: limpiarPorcentaje(row['AGRONEA']),
                expoagro: limpiarPorcentaje(row['EXPOAGRO']),
                contra: limpiarPorcentaje(row['CONTRA']),
                fojd: limpiarPorcentaje(row['FOJD']),
                preventa: limpiarPorcentaje(row['PREVENTA']),
                expJDeere: limpiarPorcentaje(row['EXP.J.DEERE']),
                adPrev: limpiarPorcentaje(row['AD.PREV'])
              },
              tomaUsado: {
                seTomo: row['ENT.USADO'] === 'SI',
                modelo: row['MODELO2'] || '',
                precioTomaUSD: limpiarMoneda(row['PCIO TOMA'])
              }
            };
          }).filter(Boolean); // Filtra todas las filas que devolvieron null

        setUploadStatus(`Procesamiento completo. ${ventasProcesadas.length} registros válidos para subir. NO CIERRES ESTA PÁGINA.`);
        
        try {
          const ventasCollectionRef = collection(db, 'ventas');
          
          setUploadStatus('Borrando datos antiguos... (Esto puede tardar un momento)');
          const querySnapshot = await getDocs(ventasCollectionRef);
          
          if (!querySnapshot.empty) {
            const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
            await Promise.all(deletePromises);
          }

          setUploadStatus('Datos antiguos borrados. Subiendo nuevos datos...');
          
          if (ventasProcesadas.length > 0) {
            const batches = [];
            let currentBatch = writeBatch(db);
            let operationCount = 0;
            ventasProcesadas.forEach((venta, index) => {
              const newDocRef = doc(ventasCollectionRef); 
              currentBatch.set(newDocRef, venta);
              operationCount++;
              if (operationCount === 499 || index === ventasProcesadas.length - 1) {
                batches.push(currentBatch);
                currentBatch = writeBatch(db);
                operationCount = 0;
              }
            });
            await Promise.all(batches.map(batch => batch.commit()));
          }
          
          setUploadStatus(`¡ÉXITO! Se han actualizado los datos con ${ventasProcesadas.length} nuevos registros. Puedes recargar la página para ver los cambios.`);
        } catch (error) {
          console.error("Error durante la subida masiva:", error);
          setUploadStatus(`ERROR: ${error.message}`);
        } finally {
          setIsUploading(false);
        }
      },
      error: (error) => {
        console.error("Error al parsear el CSV:", error);
        setUploadStatus(`ERROR al leer el archivo: ${error.message}`);
        setIsUploading(false);
      }
    });
  };

  return (
    <article>
      <header>
        <h2>Administración de Datos</h2>
      </header>
      
      <h3>Actualización Masiva de Ventas</h3>
      <p>
        Sube un archivo <code>.csv</code> para reemplazar <strong>TODOS</strong> los datos de ventas existentes.
        Asegúrate de que el archivo tenga las mismas columnas que el original, incluyendo <strong>'COSTO NETO U$D'</strong> y <strong>'TOTAL INCENTIVOS'</strong>.
      </p>

      <form>
        <label htmlFor="csv-upload">Seleccionar archivo CSV</label>
        <input 
          type="file" 
          id="csv-upload" 
          name="csv-upload" 
          accept=".csv"
          onChange={handleFileUpload}
          disabled={isUploading}
        />
      </form>

      {uploadStatus && (
        <div style={{ marginTop: '1rem' }}>
          <p>{uploadStatus}</p>
          {isUploading && <progress />}
        </div>
      )}
    </article>
  );
}