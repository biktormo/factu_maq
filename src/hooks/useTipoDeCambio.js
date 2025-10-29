import { useState, useEffect } from 'react';

// URL de la API pública de cotizaciones del BCRA
const BCRA_API_URL = 'https://api.bcra.gob.ar/estadisticascambiarias/v1.0/Cotizaciones';
const VALOR_POR_DEFECTO = 1000.0; // Un valor por defecto realista

export function useTipoDeCambio() {
  const [tipoDeCambio, setTipoDeCambio] = useState(VALOR_POR_DEFECTO);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTipoDeCambio = async () => {
      try {
        // Hacemos la llamada directa a la API del BCRA
        const response = await fetch(BCRA_API_URL);
        if (!response.ok) {
          throw new Error(`Respuesta de red no fue ok: ${response.statusText}`);
        }
        const data = await response.json();

        // El resultado es un array de cotizaciones
        // Buscamos la del Dólar Estadounidense (USD)
        const dolarData = data.results.detalle.find(
          (moneda) => moneda.codigoMoneda === 'USD'
        );

        if (dolarData && dolarData.tipoCotizacion) {
          // El valor ya viene como número, no necesita parseo
          setTipoDeCambio(dolarData.tipoCotizacion);
        } else {
          throw new Error('No se encontró la cotización del USD en la respuesta del BCRA.');
        }
      } catch (err) {
        console.error("No se pudo obtener el tipo de cambio del BCRA, se usará el valor por defecto. Error:", err.message);
        // Si hay cualquier error, la app seguirá funcionando con el valor por defecto
        // y no se mostrará un error al usuario.
      } finally {
        setLoading(false);
      }
    };

    fetchTipoDeCambio();
  }, []);

  return { tipoDeCambio, setTipoDeCambio, loading };
}