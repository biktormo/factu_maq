// Usamos import en lugar de require para un estilo más moderno, aunque Netlify lo convierte por debajo.
import admin from 'firebase-admin';

// --- CONFIGURACIÓN DE CREDENCIALES DE SERVICIO ---
// Estas variables deben estar configuradas en el entorno de Netlify.
const serviceAccount = {
  type: "service_account",
  project_id: process.env.VITE_FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  // Netlify maneja los saltos de línea automáticamente, no necesitamos .replace()
  private_key: process.env.FIREBASE_PRIVATE_KEY, 
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
};

// Inicializamos Firebase Admin solo si no ha sido inicializado antes
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } catch (e) {
    console.error('Error de inicialización de Firebase Admin en la función set-role:', e);
  }
}

// --- HANDLER DE LA FUNCIÓN ---
export async function handler(event) {
  // Solo permitimos solicitudes POST
  if (event.httpMethod !== 'POST') {
    return { 
      statusCode: 405, 
      body: JSON.stringify({ error: 'Método no permitido.' }) 
    };
  }

  try {
    // 1. Obtener y validar el token del usuario que hace la llamada
    const idToken = event.headers.authorization?.split('Bearer ')[1];
    if (!idToken) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Token de autenticación no proporcionado.' }) };
    }
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    
    // 2. Verificar que el llamador es un administrador
    if (decodedToken.role !== 'admin') {
      return { statusCode: 403, body: JSON.stringify({ error: 'Acción no autorizada.' }) };
    }

    // 3. Obtener los datos para la actualización
    const { email, role } = JSON.parse(event.body);
    const ROLES_VALIDOS = ['admin', 'cargador', 'viewer'];

    if (!email || !role || !ROLES_VALIDOS.includes(role)) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Parámetros inválidos.' }) };
    }

    // 4. Realizar la acción de asignar el rol
    const userToUpdate = await admin.auth().getUserByEmail(email);
    await admin.auth().setCustomUserClaims(userToUpdate.uid, { role: role });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: `Rol '${role}' asignado a ${email}.` }),
    };

  } catch (error) {
    console.error("Error en la función set-role:", error);
    // Devolvemos un mensaje de error genérico para el cliente
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Ocurrió un error en el servidor.' }),
    };
  }
}