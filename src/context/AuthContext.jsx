import React, { createContext, useState, useEffect, useContext } from 'react';
import { auth } from '../firebase/config';
import { onAuthStateChanged } from 'firebase/auth';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // onAuthStateChanged es un "oyente" de Firebase que se activa
    // cada vez que el estado de autenticación cambia (login, logout).
    const unsubscribe = onAuthStateChanged(auth, user => {
      setCurrentUser(user);
      setLoading(false);
    });

    // Limpiamos el oyente cuando el componente se desmonta
    return unsubscribe;
  }, []);

  const value = {
    currentUser,
  };

  // Mientras se verifica el estado de autenticación, no mostramos nada.
  // Esto evita parpadeos en la interfaz.
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}