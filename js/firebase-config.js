// === VERITAS NOTÍCIAS – Configuração do Firebase ===
// Importa o Firebase via CDN (compatível com HTML/JS puro, sem precisar de build)

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

// Configuração do projeto santanacom-e543e no Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDlDgm3PAvdqBnX0JHH0gFpzxb6Benhrg0",
  authDomain: "santanacom-e543e.firebaseapp.com",
  projectId: "santanacom-e543e",
  storageBucket: "santanacom-e543e.firebasestorage.app",
  messagingSenderId: "141469420917",
  appId: "1:141469420917:web:2ae7b4076a44fba0cc173c"
};

// Inicializa o Firebase e exporta os serviços para uso em outros arquivos JS
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
