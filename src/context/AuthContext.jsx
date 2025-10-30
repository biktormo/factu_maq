import React, { createContext, useState, useEffect, useContext } from 'react';
import { auth } from '../firebase/config';
import { onAuthStateChanged } from 'firebase/auth';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null); // <-- NUEVO ESTADO PARA EL ROL
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          // Cuando el usuario inicia sesión, obtenemos su token JWT
          const idTokenResult = await user.getIdTokenResult();
          // Leemos los custom claims del token (el rol que asignaremos)
          const role = idTokenResult.claims.role || 'viewer'; // Por defecto, es 'viewer'
          setUserRole(role);
        } catch (error) {
          console.error("Error al obtener el rol del usuario:", error);
          setUserRole('viewer'); // Si hay error, asignamos el rol más restrictivo
        }
      } else {
        setUserRole(null); // No hay rol si no hay usuario
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userRole, // <-- EXPORTAMOS EL ROL
    isAdmin: userRole === 'admin',
    isCargador: userRole === 'admin' || userRole === 'cargador',
    isViewer: userRole === 'admin' || userRole === 'cargador' || userRole === 'viewer',
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}