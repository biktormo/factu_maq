import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function RutaAdmin({ children }) {
  const { currentUser, isAdmin } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" />;
  }
  // Solo los administradores pueden pasar
  if (!isAdmin) {
    return <Navigate to="/" />; // Redirige a la página principal si no es admin
  }

  return children;
}