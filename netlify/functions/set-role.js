const admin = require('firebase-admin');

// --- CONFIGURACIÓN DE CREDENCIALES DE SERVICIO ---
// Guardaremos las credenciales como variables de entorno en Netlify
const serviceAccount = {
  type: "service_account",
  project_id: process.env.VITE_FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'), // Reemplaza los saltos de línea
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
};

// Inicializamos Firebase Admin solo si no ha sido inicializado antes
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

exports.handler = async function (event, context) {
  // 1. Verificamos que sea una solicitud POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // 2. Verificamos que el usuario que llama a la función sea un administrador
  const { user } = context.clientContext;
  if (!user || !user.app_metadata.roles?.includes('admin')) {
    return { statusCode: 401, body: JSON.stringify({ error: 'No tienes permisos de administrador.' }) };
  }

  // 3. Obtenemos el email y el rol del cuerpo de la solicitud
  const { email, role } = JSON.parse(event.body);
  const ROLES_VALIDOS = ['admin', 'cargador', 'viewer'];

  if (!email || !role || !ROLES_VALIDOS.includes(role)) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Email y rol son requeridos y el rol debe ser válido.' }) };
  }

  try {
    // 4. Buscamos al usuario por su email
    const userToUpdate = await admin.auth().getUserByEmail(email);

    // 5. Asignamos el custom claim (rol) al usuario
    await admin.auth().setCustomUserClaims(userToUpdate.uid, { role });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: `Rol '${role}' asignado correctamente al usuario ${email}` }),
    };
  } catch (error) {
    console.error("Error al asignar rol:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};