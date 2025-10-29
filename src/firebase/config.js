import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBBvxm8CLq9j1WgXSS-LWuxuJ-y-Yg-I5I",
  authDomain: "facturacion-maq.firebaseapp.com",
  projectId: "facturacion-maq",
  storageBucket: "facturacion-maq.firebasestorage.app",
  messagingSenderId: "606745563939",
  appId: "1:606745563939:web:fcc010e09dde55b9c0b296"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };