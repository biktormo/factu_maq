/**
 * Calcula el margen bruto porcentual de una venta individual usando el Costo Neto.
 * NUEVA FÓRMULA: (VENTA U$S - COSTO NETO U$D) / VENTA U$S
 * @param {object} venta El objeto de la venta, que AHORA CONTIENE costoNetoUSD.
 * @returns {number} El porcentaje de margen.
 */
 export const calcularMargenPorOperacion = (venta) => {
  const ventaBruta = venta.ventaBrutaUSD || 0;
  // AHORA leemos el costoNetoUSD directamente desde los datos de Firebase.
  // Usamos costoUSD como fallback por si algún dato antiguo no tiene costoNetoUSD.
  const costoNeto = venta.costoNetoUSD || venta.costoUSD || 0;

  // Si no hay venta o no hay un costo neto válido, no hay margen.
  if (ventaBruta <= 0 || costoNeto <= 0) {
    return 0;
  }
  
  // La fórmula ahora es mucho más simple:
  const margenBrutoUSD = ventaBruta - costoNeto;

  const margenPorcentaje = (margenBrutoUSD / ventaBruta) * 100;
  
  return isNaN(margenPorcentaje) ? 0 : margenPorcentaje;
};

/**
 * Devuelve el color apropiado para un valor de margen.
 * @param {number} margen El porcentaje de margen.
 * @returns {string} El código de color.
 */
export const getColorParaMargen = (margen) => {
  if (margen >= 10) return '#43A047';   // Verde para 10% o más
  if (margen >= 6) return '#FDD835';    // Amarillo para 6% a 9.99%
  return '#E53935';                      // Rojo para menos de 6%
};

/**
 * Agrupa las ventas por modelo y calcula métricas de rentabilidad para cada uno.
 * @param {Array} ventas La lista de ventas a procesar.
 * @returns {Array} Un array de objetos, cada uno representando un modelo con sus métricas.
 */
 export const analizarRentabilidadPorModelo = (ventas) => {
  if (!ventas || ventas.length === 0) return [];

  const modelosMap = new Map();

  ventas.forEach(venta => {
    const ventaBruta = venta.ventaBrutaUSD || 0;
    const costoNeto = venta.costoNetoUSD || venta.costoUSD || 0;
    const modelo = venta.modelo;

    // Solo procesamos ventas válidas para el análisis de rentabilidad
    if (!modelo || ventaBruta <= 0 || costoNeto <= 0) {
      return;
    }

    const margenBrutoUSD = ventaBruta - costoNeto;

    if (!modelosMap.has(modelo)) {
      modelosMap.set(modelo, {
        unidadesVendidas: 0,
        facturacionTotal: 0,
        margenTotal: 0,
      });
    }

    const stats = modelosMap.get(modelo);
    stats.unidadesVendidas += 1;
    stats.facturacionTotal += ventaBruta;
    stats.margenTotal += margenBrutoUSD;
  });

  // Convertimos el mapa a un array y calculamos los promedios
  const resultado = Array.from(modelosMap.entries()).map(([modelo, stats]) => {
    const margenPromedio = (stats.margenTotal / stats.facturacionTotal) * 100;
    return {
      modelo,
      unidadesVendidas: stats.unidadesVendidas,
      facturacionTotal: stats.facturacionTotal,
      margenPromedio: isNaN(margenPromedio) ? 0 : margenPromedio,
      margenTotal: stats.margenTotal,
    };
  });

  // Ordenamos por el modelo que más margen total ha generado
  return resultado.sort((a, b) => b.margenTotal - a.margenTotal);
};

/**
 * Genera un ranking de vendedores basado en varias métricas.
 * @param {Array} ventas La lista completa de ventas a procesar.
 * @returns {Array} Un array de objetos, cada uno representando a un vendedor con sus estadísticas.
 */
 export const generarRankingVendedores = (ventas) => {
  if (!ventas || ventas.length === 0) return [];

  const vendedoresMap = new Map();

  ventas.forEach(venta => {
    const vendedor = venta.vendedor?.trim().toUpperCase();
    const ventaBruta = venta.ventaBrutaUSD || 0;
    const costoNeto = venta.costoNetoUSD || venta.costoUSD || 0;

    if (!vendedor || ventaBruta <= 0 || costoNeto <= 0) {
      return; // Ignorar ventas inválidas o sin vendedor
    }

    if (!vendedoresMap.has(vendedor)) {
      vendedoresMap.set(vendedor, {
        operaciones: 0,
        facturacionTotal: 0,
        margenTotal: 0,
      });
    }

    const stats = vendedoresMap.get(vendedor);
    const margenBrutoUSD = ventaBruta - costoNeto;

    stats.operaciones += 1;
    stats.facturacionTotal += ventaBruta;
    stats.margenTotal += margenBrutoUSD;
  });

  const ranking = Array.from(vendedoresMap.entries()).map(([nombre, stats]) => {
    const ticketPromedio = stats.facturacionTotal / stats.operaciones;
    const margenPromedio = (stats.margenTotal / stats.facturacionTotal) * 100;

    return {
      nombre,
      ...stats,
      ticketPromedio: isNaN(ticketPromedio) ? 0 : ticketPromedio,
      margenPromedio: isNaN(margenPromedio) ? 0 : margenPromedio,
    };
  });

  // Ordenamos por facturación total de mayor a menor
  return ranking.sort((a, b) => b.facturacionTotal - a.facturacionTotal);
};