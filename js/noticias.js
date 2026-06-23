// === VERITAS NOTÍCIAS – Notícias (CRUD e Fluxo de Publicação) ===

import { db, storage } from "./firebase-config.js";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

// Status possíveis de uma notícia no fluxo editorial
export const STATUS = {
  RASCUNHO: "rascunho",       // Colunista ainda escrevendo
  EM_REVISAO: "em_revisao",   // Enviado, esperando o Revisor
  APROVADO: "aprovado",       // Revisor aprovou, esperando publicação do Editor/Admin
  PUBLICADO: "publicado",     // Visível no site
  DEVOLVIDO: "devolvido"      // Revisor pediu ajustes
};

const COL = "noticias";

// --- CRIAR NOTÍCIA ---
export async function criarNoticia(dados, autorUid, autorNome) {
  const docRef = await addDoc(collection(db, COL), {
    titulo: dados.titulo,
    resumo: dados.resumo,
    conteudo: dados.conteudo,
    categoria: dados.categoria,
    imagemUrl: dados.imagemUrl || null,
    autorUid,
    autorNome,
    status: dados.status || STATUS.RASCUNHO,
    criadoEm: serverTimestamp(),
    atualizadoEm: serverTimestamp()
  });
  return docRef.id;
}

// --- ATUALIZAR NOTÍCIA ---
export async function atualizarNoticia(id, dados) {
  await updateDoc(doc(db, COL, id), {
    ...dados,
    atualizadoEm: serverTimestamp()
  });
}

// --- EXCLUIR NOTÍCIA ---
export async function excluirNoticia(id) {
  await deleteDoc(doc(db, COL, id));
}

// --- BUSCAR UMA NOTÍCIA PELO ID ---
export async function obterNoticia(id) {
  const snap = await getDoc(doc(db, COL, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

// --- LISTAR NOTÍCIAS PUBLICADAS (para o site público) ---
export async function listarPublicadas(qtde = 20) {
  const q = query(
    collection(db, COL),
    where("status", "==", STATUS.PUBLICADO),
    orderBy("criadoEm", "desc"),
    limit(qtde)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// --- LISTAR POR CATEGORIA ---
export async function listarPorCategoria(categoria, qtde = 20) {
  const q = query(
    collection(db, COL),
    where("status", "==", STATUS.PUBLICADO),
    where("categoria", "==", categoria),
    orderBy("criadoEm", "desc"),
    limit(qtde)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// --- LISTAR NOTÍCIAS DE UM AUTOR (para o Colunista ver só as próprias) ---
export async function listarPorAutor(autorUid) {
  const q = query(
    collection(db, COL),
    where("autorUid", "==", autorUid),
    orderBy("atualizadoEm", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// --- LISTAR POR STATUS (para o Revisor ver a fila de revisão, etc.) ---
export async function listarPorStatus(status) {
  const q = query(
    collection(db, COL),
    where("status", "==", status),
    orderBy("atualizadoEm", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// --- BUSCA SIMPLES POR TÍTULO (busca local após carregar publicadas) ---
// Observação: Firestore não tem busca textual nativa. Para um portal deste porte,
// carregamos as publicadas e filtramos no navegador. Se o volume de notícias crescer
// muito, vale migrar para Algolia ou Typesense no futuro.
export function filtrarPorTermo(noticias, termo) {
  const t = termo.toLowerCase();
  return noticias.filter(n =>
    n.titulo.toLowerCase().includes(t) ||
    (n.resumo && n.resumo.toLowerCase().includes(t))
  );
}

// --- UPLOAD DE IMAGEM (Cloudinary) ---
import { enviarImagemCloudinary } from './cloudinary.js';
export async function enviarImagem(arquivo, noticiaId) {
  return await enviarImagemCloudinary(arquivo);
}
