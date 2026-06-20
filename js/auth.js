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

// Mostra uma tela de erro visível no lugar da tela branca
function mostrarErroFatal(titulo, detalhe) {
  document.body.innerHTML = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 60px auto; padding: 30px; background: #fff3f3; border-left: 5px solid #c0392b;">
      <h2 style="color:#c0392b; margin-bottom: 10px;">⚠️ ${titulo}</h2>
      <p style="color:#333; line-height:1.6;">${detalhe}</p>
      <p style="margin-top:20px;"><a href="/Santananoticias/login.html" style="color:#00cc66; font-weight:bold;">← Voltar para o login</a></p>
    </div>
  `;
}

// --- CADASTRO COM E-MAIL/SENHA ---
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
  // Se for primeiro login via Google, cria o documento do usuário como pendente
  const refUsuario = doc(db, "usuarios", credencial.user.uid);
  const snap = await getDoc(refUsuario);
  if (!snap.exists()) {
    await setDoc(refUsuario, {
      nome: credencial.user.displayName || "",
      email: credencial.user.email,
      cargo: CARGOS.PENDENTE,
      criadoEm: serverTimestamp()
    });
  }
  return credencial.user;
}

// --- RECUPERAR SENHA ---
export async function recuperarSenha(email) {
  await sendPasswordResetEmail(auth, email);
}

// --- SAIR ---
export async function sair() {
  await signOut(auth);
}

// --- OBTER CARGO DO USUÁRIO ---
export async function obterCargo(uid) {
  const snap = await getDoc(doc(db, "usuarios", uid));
  if (!snap.exists()) return null;
  return snap.data().cargo || null;
}

// --- OBSERVAR LOGIN (com tratamento de erro) ---
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
        "Não foi possível consultar seu cadastro no banco de dados. Detalhe técnico: " + e.message +
        "<br><br>Isso geralmente acontece quando as Regras de Segurança do Firestore estão bloqueando o acesso, ou quando o documento do usuário não existe na coleção 'usuarios'."
      );
    }
  });
}

// --- PROTEGER PÁGINA (com tratamento de erro visível) ---
export function protegerPagina(cargosPermitidos, aoAutorizar) {
  observarLogin((user, cargo) => {
    if (!user) {
      window.location.href = "/Santananoticias/login.html";
      return;
    }
    if (cargo === CARGOS.PENDENTE || !cargo) {
      mostrarErroFatal(
        "Conta aguardando aprovação",
        "Sua conta ainda não tem um cargo definido. Peça para o administrador liberar seu acesso no Firestore (coleção 'usuarios', campo 'cargo')."
      );
      return;
    }
    if (!cargosPermitidos.includes(cargo)) {
      mostrarErroFatal(
        "Acesso negado",
        "Seu cargo atual é <strong>" + cargo + "</strong>, e esta página exige um dos seguintes cargos: " + cargosPermitidos.join(", ") + "."
      );
      return;
    }
    try {
      aoAutorizar(user, cargo);
    } catch (e) {
      mostrarErroFatal(
        "Erro ao carregar a página",
        "Ocorreu um erro inesperado ao montar esta tela. Detalhe técnico: " + e.message
      );
    }
  });
}
