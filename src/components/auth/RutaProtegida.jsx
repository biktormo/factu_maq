import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function RutaProtegida({ children }) {
  const { currentUser, isCargador } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" />;
  }
  if (!isCargador) {
    // Si no es Cargador (o Admin), no tiene permiso. Lo mandamos al dashboard.
    return <Navigate to="/" />;
  }

  return children;
}