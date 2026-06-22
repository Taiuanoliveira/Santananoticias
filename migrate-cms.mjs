import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDlDgm3PAvdqBnX0JHH0gFpzxb6Benhrg0",
  authDomain: "santanacom-e543e.firebaseapp.com",
  projectId: "santanacom-e543e",
  storageBucket: "santanacom-e543e.firebasestorage.app",
  messagingSenderId: "141469420917",
  appId: "1:141469420917:web:2ae7b4076a44fba0cc173c"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function migrar() {
  console.log("🚀 Iniciando migração...");

  await setDoc(doc(db, "configuracoes", "geral"), {
    logoTexto: "Santana.com",
    tagline: "A voz do Recôncavo Baiano",
    enderecoContato: "Santana de Ipanema, Alagoas",

    emailContato: "contato@santana.com",
    telefoneContato: "(82) 9 9999-0000",

    facebook: "",
    instagram: "",
    youtube: "",
    whatsapp: "",

    breakingNews: [
      "Câmara Municipal aprova novo plano diretor da cidade",
      "Produção agrícola do município bate recorde histórico",
      "Prefeitura anuncia obra de pavimentação"
    ],

    editorialTitulo: "O papel da imprensa local",
    editorialTexto: "Texto inicial...",
    editorialAutorNome: "João Santana",
    editorialAutorCargo: "Editor-Chefe",
    editorialAutorBio: "Jornalista há 20 anos",

    adTitulo: "Seu anúncio aqui",
    adTexto: "Fale com nossa equipe",

    footerDescricao: "Portal de notícias regional",
    footerCnpj: "00.000.000/0001-00",

    criadoEm: serverTimestamp()
  }, { merge: true });

  console.log("✔ MIGRAÇÃO CONCLUÍDA COM SUCESSO");
}

migrar().catch(console.error);
