// === VERITAS NOTÍCIAS – Curtidas, Salvos, Comentários e Estatísticas ===

import { db } from "./firebase-config.js";
import {
  doc, getDoc, setDoc, deleteDoc, collection, getDocs, addDoc,
  serverTimestamp, increment, updateDoc, query, orderBy
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// --- VISUALIZAÇÕES ---
export async function registrarVisualizacao(noticiaId) {
  try {
    await setDoc(doc(db, "estatisticas", noticiaId), { visualizacoes: increment(1) }, { merge: true });
  } catch (e) { console.error("Erro ao registrar visualização:", e); }
}

// --- CURTIDAS ---
export async function curtidaDoUsuario(noticiaId, uid) {
  if (!uid) return false;
  const snap = await getDoc(doc(db, "curtidas", noticiaId, "usuarios", uid));
  return snap.exists();
}

export async function contarCurtidas(noticiaId) {
  const snap = await getDocs(collection(db, "curtidas", noticiaId, "usuarios"));
  return snap.size;
}

export async function alternarCurtida(noticiaId, uid) {
  const refCurtida = doc(db, "curtidas", noticiaId, "usuarios", uid);
  const refStats = doc(db, "estatisticas", noticiaId);
  const jaExiste = await curtidaDoUsuario(noticiaId, uid);

  if (jaExiste) {
    await deleteDoc(refCurtida);
    await setDoc(refStats, { curtidas: increment(-1) }, { merge: true });
    return false;
  } else {
    await setDoc(refCurtida, { criadoEm: serverTimestamp() });
    await setDoc(refStats, { curtidas: increment(1) }, { merge: true });
    return true;
  }
}

// --- LER MAIS TARDE (salvar para depois) ---
export async function estaSalvoParaDepois(noticiaId, uid) {
  if (!uid) return false;
  const snap = await getDoc(doc(db, "ler_mais_tarde", uid, "noticias", noticiaId));
  return snap.exists();
}

export async function alternarSalvarParaDepois(noticiaId, uid, dadosNoticia = {}) {
  const ref = doc(db, "ler_mais_tarde", uid, "noticias", noticiaId);
  const jaSalvo = await estaSalvoParaDepois(noticiaId, uid);

  if (jaSalvo) {
    await deleteDoc(ref);
    return false;
  } else {
    await setDoc(ref, {
      titulo: dadosNoticia.titulo || "",
      imagemUrl: dadosNoticia.imagemUrl || "",
      categoria: dadosNoticia.categoria || "",
      salvoEm: serverTimestamp()
    });
    return true;
  }
}

export async function listarSalvosParaDepois(uid) {
  const snap = await getDocs(query(collection(db, "ler_mais_tarde", uid, "noticias"), orderBy("salvoEm", "desc")));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// --- COMENTÁRIOS (sem moderação — aparecem na hora) ---
export async function criarComentario(noticiaId, uid, nomeAutor, texto) {
  await addDoc(collection(db, "noticias", noticiaId, "comentarios"), {
    autorUid: uid,
    autorNome: nomeAutor || "Leitor",
    texto: texto.trim(),
    criadoEm: serverTimestamp()
  });
  await setDoc(doc(db, "estatisticas", noticiaId), { comentarios: increment(1) }, { merge: true });
}

export async function listarComentarios(noticiaId) {
  const snap = await getDocs(query(collection(db, "noticias", noticiaId, "comentarios"), orderBy("criadoEm", "desc")));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function excluirComentario(noticiaId, comentarioId) {
  await deleteDoc(doc(db, "noticias", noticiaId, "comentarios", comentarioId));
  await setDoc(doc(db, "estatisticas", noticiaId), { comentarios: increment(-1) }, { merge: true });
}

// --- ESTATÍSTICAS (para o admin ver visualizações/curtidas/salvos/comentários) ---
export async function obterEstatisticas(noticiaId) {
  const snap = await getDoc(doc(db, "estatisticas", noticiaId));
  const salvosTotal = await contarSalvos(noticiaId);
  if (!snap.exists()) {
    return { visualizacoes: 0, curtidas: 0, comentarios: 0, salvos: salvosTotal };
  }
  const dados = snap.data();
  return {
    visualizacoes: dados.visualizacoes || 0,
    curtidas: dados.curtidas || 0,
    comentarios: dados.comentarios || 0,
    salvos: salvosTotal
  };
}

async function contarSalvos(noticiaId) {
  try {
    const usuariosSnap = await getDocs(collection(db, "usuarios"));
    let total = 0;
    for (const u of usuariosSnap.docs) {
      const refSalvo = doc(db, "ler_mais_tarde", u.id, "noticias", noticiaId);
      const snapSalvo = await getDoc(refSalvo);
      if (snapSalvo.exists()) total++;
    }
    return total;
  } catch (e) {
    console.error("Erro ao contar salvos:", e);
    return 0;
  }
}
