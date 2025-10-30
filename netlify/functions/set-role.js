const admin = require('firebase-admin');

// --- CONFIGURACIÓN DE CREDENCIALES DE SERVICIO ---
// Estas variables deben estar configuradas en el entorno de Netlify
const serviceAccount = {
  type: "service_account",
  project_id: process.env.VITE_FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
};

// Inicializamos Firebase Admin solo si no ha sido inicializado antes
try {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }
} catch (e) {
  console.error('Firebase Admin Initialization Error', e);
}


exports.handler = async function (event, context) {
  // Solo permitimos solicitudes de tipo POST
  if (event.httpMethod !== 'POST') {
    return { 
      statusCode: 405, 
      body: JSON.stringify({ error: 'Método no permitido' }) 
    };
  }

  try {
    // 1. Obtener el token de Firebase del header de la solicitud
    const idToken = event.headers.authorization?.split('Bearer ')[1];
    if (!idToken) {
      return { 
        statusCode: 401, 
        body: JSON.stringify({ error: 'No se proporcionó token de autenticación.' }) 
      };
    }

    // 2. Verificar el token y obtener los datos del usuario que hace la llamada
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    
    // 3. Comprobar si el usuario que hace la llamada tiene el rol de 'admin'
    if (decodedToken.role !== 'admin') {
      return { 
        statusCode: 403, // 4