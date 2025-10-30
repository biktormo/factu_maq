import React, { useState } from 'react';
import Papa from 'papaparse';
import { db } from '../firebase/config';
import { collection, writeBatch, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

// --- FUNCIONES DE LIMPIEZA PARA EL CSV ---
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

// --- COMPONENTE PRINCIPAL ---
export default function Admin() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  
  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRole] = useState('viewer');
  const [roleStatus, setRoleStatus] = useState('');
  const [roleLoading, setRoleLoading] = useState(false);
  
  const { currentUser } = useAuth();

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsUploading(true);
    setUploadStatus('Leyendo archivo CSV...');

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        setUploadStatus(`Archivo leído. ${results.data.length} filas encontradas. Procesando...`);
        const ventasProcesadas = results.data.map(row => {
            const fechaVenta = parsearFecha(row['FECHA']);
            if (!fechaVenta) return null;
            return {
              tipoProducto: row['MAQUINARIA'] || 'No especificado', fechaVenta, modelo: row['MODELO'] || 'No especificado',
              numeroFactura: row['FACTURA'] || '', cliente: row['CLIENTE'] || 'No especificado', vendedor: row['VENDEDOR'] || 'No especificado',
              sucursal: row['SUCURSAL'] || 'No especificado', costoUSD: limpiarMoneda(row[' COSTO U$S']), costoNetoUSD: limpiarMoneda(row[' COSTO NETO U$D']),
              ventaBrutaUSD: limpiarMoneda(row[' VENTA U$S']), tipoDeCambio: limpiarMoneda(row['T.C.']), totalIncentivos: limpiarMoneda(row['TOTAL INCENTIVOS']),
              fleteARS: 0, fleteAbsorbido: true,
              incentivos: { retail: limpiarPorcentaje(row['RETAIL']), plaPowertool: limpiarPorcentaje(row['PLA POWERTOUR']), volumen: limpiarPorcentaje(row['VOLUMEN']), combo: limpiarPorcentaje(row['COMBO']), agroactiva: limpiarPorcentaje(row['AGROACTIVA']), agronea: limpiarPorcentaje(row['AGRONEA']), expoagro: limpiarPorcentaje(row['EXPOAGRO']), contra: limpiarPorcentaje(row['CONTRA']), fojd: limpiarPorcentaje(row['FOJD']), preventa: limpiarPorcentaje(row['PREVENTA']), expJDeere: limpiarPorcentaje(row['EXP.J.DEERE']), adPrev: limpiarPorcentaje(row['AD.PREV']) },
              tomaUsado: { seTomo: row['ENT.USADO'] === 'SI', modelo: row['MODELO2'] || '', precioTomaUSD: limpiarMoneda(row['PCIO TOMA']) }
            };
          }).filter(Boolean);

        setUploadStatus(`Procesamiento completo. ${ventasProcesadas.length} registros válidos. NO CIERRES ESTA PÁGINA.`);
        
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

  const handleSetRole = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      setRoleStatus('Error: Debes estar autenticado para realizar esta acción.');
      return;
    }
    setRoleLoading(true);
    setRoleStatus('');

    try {
      const idToken = await currentUser.getIdToken();
      
      const response = await fetch('/.netlify/functions/set-role', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: userEmail, role: userRole }),
      });
      
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ocurrió un error en el servidor.');
      }

      setRoleStatus(data.message);
      setUserEmail('');
    } catch (error) {
      setRoleStatus(`Error: ${error.message}`);
    } finally {
      setRoleLoading(false);
    }
  };

  return (
    <main className="container">
      <article>
        <header>
          <h2>Actualización Masiva de Ventas</h2>
        </header>
        <p>
          Sube un archivo <code>.csv</code> para reemplazar <strong>TODOS</strong> los datos de ventas existentes.
          Asegúrate de que el archivo tenga las columnas correctas. Este proceso no se puede deshacer.
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

      <article style={{ marginTop: '2rem' }}>
        <header>
          <h3>Gestión de Roles de Usuario</h3>
        </header>
        <p>Asigna roles a los usuarios por su correo electrónico. El usuario debe cerrar y volver a iniciar sesión para que los cambios tomen efecto.</p>
        <form onSubmit={handleSetRole}>
          <div className="grid">
            <div>
              <label htmlFor="user-email">Correo Electrónico del Usuario</label>
              <input 
                type="email" 
                id="user-email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                placeholder="usuario@ejemplo.com"
                required
              />
            </div>
            <div>
              <label htmlFor="user-role">Asignar Rol</label>
              <select 
                id="user-role" 
                value={userRole} 
                onChange={(e) => setUserRole(e.target.value)}
              >
                <option value="viewer">Visor (Gerencial)</option>
                <option value="cargador">Operador de Carga</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
          </div>
          <button type="submit" aria-busy={roleLoading} disabled={roleLoading}>
            {roleLoading ? 'Asignando...' : 'Asignar Rol'}
          </button>
        </form>
        {roleStatus && <p style={{ marginTop: '1rem' }}>{roleStatus}</p>}
      </article>
    </main>
  );
}