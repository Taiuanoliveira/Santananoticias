// === VERITAS NOTÍCIAS – Envia notificação push quando uma notícia é publicada ===
// Essa função roda no servidor (Vercel), nunca no navegador.
// As chaves secretas do OneSignal ficam em variáveis de ambiente, não aparecem aqui.

import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDlDgm3PAvdqBnX0JHH0gFpzxb6Benhrg0",
  authDomain: "santanacom-e543e.firebaseapp.com",
  projectId: "santanacom-e543e",
  storageBucket: "santanacom-e543e.firebasestorage.app",
  messagingSenderId: "141469420917",
  appId: "1:141469420917:web:2ae7b4076a44fba0cc173c"
};

let appFirebase;
function obterApp() {
  if (!appFirebase) appFirebase = initializeApp(firebaseConfig);
  return appFirebase;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const { noticiaId } = req.body || {};
  if (!noticiaId) {
    return res.status(400).json({ error: "noticiaId é obrigatório" });
  }

  try {
    // Busca a notícia direto no banco. Só funciona se ela já estiver "publicado"
    // (as regras do Firestore só liberam leitura pública nesse caso).
    const db = getFirestore(obterApp());
    const snap = await getDoc(doc(db, "noticias", noticiaId));

    if (!snap.exists()) {
      return res.status(404).json({ error: "Notícia não encontrada" });
    }

    const noticia = snap.data();
    if (noticia.status !== "publicado") {
      return res.status(403).json({ error: "Essa notícia ainda não está publicada" });
    }

    const tituloNotificacao = noticia.categoria === "editorial"
      ? "✍️ Novo Editorial: " + noticia.titulo
      : noticia.titulo;

    const resposta = await fetch("https://api.onesignal.com/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Key " + process.env.ONESIGNAL_REST_API_KEY
      },
      body: JSON.stringify({
        app_id: "d391c7f0-84aa-434a-b6bd-efc73611e68c",
        included_segments: ["Subscribed Users"],
        headings: { en: "Veritas Notícias", pt: "Veritas Notícias" },
        contents: { en: tituloNotificacao, pt: tituloNotificacao },
        url: "https://veritasnoticias.vercel.app/noticia.html?id=" + noticiaId
      })
    });

    const resultado = await resposta.json();

    if (!resposta.ok) {
      return res.status(500).json({ error: "Erro ao enviar notificação", detalhe: resultado });
    }

    return res.status(200).json({ ok: true, resultado });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
