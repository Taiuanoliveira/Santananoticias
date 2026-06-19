// === SANTANA.COM – Autenticação e Cargos (Roles) ===

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
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Cargos possíveis. "pendente" é o estado inicial até um Administrador aprovar e definir o cargo real.
export const CARGOS = {
  ADMIN: "administrador",
  EDITOR: "editor",
  COLUNISTA: "colunista",
  REVISOR: "revisor",
  PENDENTE: "pendente"
};

// --- CADASTRO COM E-MAIL/SENHA ---
// Novo usuário sempre nasce com cargo "pendente" — só um Administrador pode promovê-lo depois.
export async function cadastrarUsuario(nome, email, senha) {
  const credencial = await createUserWithEmailAndPassword(auth, email, senha);
  await setDoc(doc(db, "usuarios", credencial.user.uid), {
    nome,
    email,
    cargo: CARGOS.PENDENTE,
    criadoEm: serverTimestamp()
  });
  return credencial.user;
}

// --- LOGIN COM E-MAIL/SENHA ---
export async function entrarComEmail(email, senha) {
  const credencial = await signInWithEmailAndPassword(auth, email, senha);
  return credencial.user;
}

// --- LOGIN COM GOOGLE ---
export async function entrarComGoogle() {
  const provider = new GoogleAuthProvider();
  const credencial = await signInWithPopup(auth, provider);

  // Se for o primeiro login desse usuário, cria o documento dele na coleção "usuarios"
  const refUsuario = doc(db, "usuarios", credencial.user.uid);
  const snap = await getDoc(refUsuario);
  if (!snap.exists()) {
    await setDoc(refUsuario, {
      nome: credencial.user.displayName || "Sem nome",
      email: credencial.user.email,
      cargo: CARGOS.PENDENTE,
      criadoEm: serverTimestamp()
    });
  }
  return credencial.user;
}

// --- RECUPERAÇÃO DE SENHA ---
export async function recuperarSenha(email) {
  await sendPasswordResetEmail(auth, email);
}

// --- LOGOUT ---
export async function sair() {
  await signOut(auth);
}

// --- BUSCAR CARGO DO USUÁRIO ATUAL ---
export async function obterCargo(uid) {
  const snap = await getDoc(doc(db, "usuarios", uid));
  if (!snap.exists()) return null;
  return snap.data().cargo;
}

// --- OBSERVADOR DE ESTADO DE LOGIN ---
// Use isso em qualquer página para saber se há usuário logado e qual o cargo dele.
export function observarLogin(callback) {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      callback(null, null);
      return;
    }
    const cargo = await obterCargo(user.uid);
    callback(user, cargo);
  });
}

// --- PROTEGER PÁGINAS DO PAINEL ADMINISTRATIVO ---
// cargosPermitidos: array de cargos que podem acessar a página atual.
// Redireciona para login.html se não estiver logado, ou para admin/dashboard.html se não tiver permissão.
export function protegerPagina(cargosPermitidos, aoAutorizar) {
  observarLogin((user, cargo) => {
    if (!user) {
      window.location.href = "/login.html";
      return;
    }
    if (cargo === CARGOS.PENDENTE || !cargo) {
      alert("Sua conta ainda não tem um cargo definido. Aguarde a aprovação de um administrador.");
      window.location.href = "/index.html";
      return;
    }
    if (!cargosPermitidos.includes(cargo)) {
      alert("Você não tem permissão para acessar esta página.");
      window.location.href = "/admin/dashboard.html";
      return;
    }
    aoAutorizar(user, cargo);
  });
}
