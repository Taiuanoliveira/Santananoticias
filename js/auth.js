// === SANTANA.COM – Autenticação, Cargos do Sistema e Cargos Editoriais ===
import { auth, db } from "./firebase-config.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  query,
  limit,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export const CARGOS = {
  ADMIN: "administrador",
  EDITOR: "editor",
  COLUNISTA: "colunista",
  REVISOR: "revisor",
  LEITOR: "leitor"
};

export const CARGOS_EDITORIAIS = {
  EDITOR_CHEFE: "editor-chefe",
  JORNALISTA: "jornalista",
  COLUNISTA: "colunista",
  REVISOR: "revisor",
  EDITOR_DE_TEXTO: "editor-de-texto",
  CORRESPONDENTE: "correspondente",
  EDITOR_CHEFE_JORNALISTA: "editor-chefe-jornalista"
};

export const LABELS_CARGO_EDITORIAL = {
  "editor-chefe": "Editor-chefe",
  "jornalista": "Jornalista",
  "colunista": "Colunista",
  "revisor": "Revisor",
  "editor-de-texto": "Editor de Texto",
  "correspondente": "Correspondente",
  "editor-chefe-jornalista": "Editor-chefe e Jornalista"
};

function mostrarErroFatal(titulo, detalhe) {
  document.body.innerHTML = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 60px auto; padding: 30px; background: #fff3f3; border-left: 5px solid #c0392b;">
      <h2 style="color:#c0392b; margin-bottom: 10px;">⚠️ ${titulo}</h2>
      <p style="color:#333; line-height:1.6;">${detalhe}</p>
      <p style="margin-top:20px;"><a href="/Santananoticias/login.html" style="color:#00cc66; font-weight:bold;">← Voltar para o login</a></p>
    </div>
  `;
}

async function ehPrimeiroUsuario() {
  const snap = await getDocs(query(collection(db, "usuarios"), limit(1)));
  return snap.empty;
}

export async function cadastrarUsuario(nome, email, senha) {
  const credencial = await createUserWithEmailAndPassword(auth, email, senha);
  const primeiro = await ehPrimeiroUsuario();
  await setDoc(doc(db, "usuarios", credencial.user.uid), {
    nome,
    email,
    cargo: primeiro ? CARGOS.ADMIN : CARGOS.LEITOR,
    cargoEditorial: primeiro ? CARGOS_EDITORIAIS.EDITOR_CHEFE : "",
    ativo: true,
    criadoEm: serverTimestamp()
  });
  return credencial.user;
}

export async function entrarComGoogle() {
  const provider = new GoogleAuthProvider();
  const credencial = await signInWithPopup(auth, provider);
  const refUsuario = doc(db, "usuarios", credencial.user.uid);
  const snap = await getDoc(refUsuario);
  if (!snap.exists()) {
    const primeiro = await ehPrimeiroUsuario();
    await setDoc(refUsuario, {
      nome: credencial.user.displayName || "",
      email: credencial.user.email,
      cargo: primeiro ? CARGOS.ADMIN : CARGOS.LEITOR,
      cargoEditorial: primeiro ? CARGOS_EDITORIAIS.EDITOR_CHEFE : "",
      ativo: true,
      criadoEm: serverTimestamp()
    });
  }
  return credencial.user;
}

export async function entrarComEmail(email, senha) {
  const credencial = await signInWithEmailAndPassword(auth, email, senha);
  return credencial.user;
}

export async function recuperarSenha(email) {
  await sendPasswordResetEmail(auth, email);
}

export async function sair() {
  await signOut(auth);
}

export async function obterCargo(uid) {
  const snap = await getDoc(doc(db, "usuarios", uid));
  if (!snap.exists()) return null;
  return snap.data().cargo || null;
}

export function observarLogin(callback) {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      callback(null, null);
      return;
    }
    try {
      const cargo = await obterCargo(user.uid);
      callback(user, cargo);
    } catch (e) {
      mostrarErroFatal(
        "Erro ao verificar permissões",
        "Não foi possível consultar seu cadastro no banco de dados. Detalhe técnico: " + e.message
      );
    }
  });
}

export function protegerPagina(cargosPermitidos, aoAutorizar) {
  observarLogin((user, cargo) => {
    if (!user) {
      window.location.href = "/Santananoticias/login.html";
      return;
    }
    if (!cargo) {
      mostrarErroFatal(
        "Conta sem cargo definido",
        "Não foi possível identificar seu cargo do sistema."
      );
      return;
    }
    if (!cargosPermitidos.includes(cargo)) {
      mostrarErroFatal(
        "Acesso negado",
        "Seu cargo atual é <strong>" + cargo + "</strong>, e esta página exige: " + cargosPermitidos.join(", ") + "."
      );
      return;
    }
    try {
      aoAutorizar(user, cargo);
    } catch (e) {
      mostrarErroFatal("Erro ao carregar a página", "Detalhe técnico: " + e.message);
    }
  });
}
