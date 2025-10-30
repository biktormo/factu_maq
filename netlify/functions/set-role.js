import admin from 'firebase-admin';

const serviceAccount = {
  type: "service_account",
  project_id: process.env.VITE_FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'), // Esta línea reconstruye la clave
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
};

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } catch (e) {
    console.error('Error de inicialización de Firebase Admin:', e.message);
  }
}

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Método no permitido.' }) };
  }
  try {
    const idToken = event.headers.authorization?.split('Bearer ')[1];
    if (!idToken) return { statusCode: 401, body: JSON.stringify({ error: 'Token no proporcionado.' }) };
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    if (decodedToken.role !== 'admin') {
      return { statusCode: 403, body: JSON.stringify({ error: 'Acción no autorizada.' }) };
    }
    const { email, role } = JSON.parse(event.body);
    const ROLES_VALIDOS = ['admin', 'cargador', 'viewer'];
    if (!email || !role || !ROLES_VALIDOS.includes(role)) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Parámetros inválidos.' }) };
    }
    const userToUpdate = await admin.auth().getUserByEmail(email);
    await admin.auth().setCustomUserClaims(userToUpdate.uid, { role: role });
    return {
      statusCode: 200,
      body: JSON.stringify({ message: `Rol '${role}' asignado a ${email}.` }),
    };
  } catch (error) {
    console.error("Error en función set-role:", error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Error en el servidor.' }) };
  }
}