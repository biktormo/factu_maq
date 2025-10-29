import { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

export function useVentas() {
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchVentas = async () => {
      try {
        const ventasCollection = collection(db, 'ventas');
        const q = query(ventasCollection, orderBy('fechaVenta', 'desc'));

        const querySnapshot = await getDocs(q);
        
        const ventasData = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            fechaVenta: data.fechaVenta.toDate() // Convertir Timestamp a Date
          };
        });
        
        setVentas(ventasData);
      } catch (err) {
        setError(err.message);
        console.error("Error al obtener documentos: ", err);
      } finally {
        setLoading(false);
      }
    };

    fetchVentas();
  }, []);

  return { ventas, loading, error };
}