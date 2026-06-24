// === VERITAS NOTÍCIAS – Sistema de Publicidade ===
// Módulo central: toda página que quiser mostrar anúncios importa funções daqui.
// Cadastro dos banners é feito só em admin/publicidade-admin.html.

import { db } from "./firebase-config.js";
import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let _cacheBanners = null;

// Busca todos os banners ativos uma única vez por carregamento de página (evita repetir leituras no banco).
export async function obterBannersAtivos() {
  if (_cacheBanners) return _cacheBanners;
  try {
    const q = query(collection(db, "publicidade"), where("ativo", "==", true));
    const snap = await getDocs(q);
    _cacheBanners = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.error("Erro ao carregar banners de publicidade:", e);
    _cacheBanners = [];
  }
  return _cacheBanners;
}

function htmlBanner(banner, classeExtra = "") {
  if (!banner) return `<div class="banner-pub-vazio ${classeExtra}"></div>`;
  return `
    <a href="${banner.link || '#'}" target="_blank" rel="noopener noreferrer" class="banner-pub ${classeExtra}" title="${banner.nomeAnunciante || ''}">
      <img src="${banner.imagemUrl || ''}" alt="${banner.nomeAnunciante || 'Publicidade'}" loading="lazy">
    </a>
  `;
}

// --- CARROSSEL ROTATIVO (topo da home e categorias) ---
// Mostra todos os banners ativos, trocando automaticamente a cada 5 segundos.
export async function montarCarrossel(elementoContainer) {
  const banners = await obterBannersAtivos();
  if (!elementoContainer || banners.length === 0) {
    if (elementoContainer) elementoContainer.style.display = "none";
    return;
  }
  elementoContainer.style.display = "block";
  elementoContainer.innerHTML = `
    <div class="carrossel-pub-wrap">
      ${banners.map((b, i) => `<div class="carrossel-pub-slide${i === 0 ? ' ativo' : ''}">${htmlBanner(b)}</div>`).join("")}
    </div>
  `;

  if (banners.length > 1) {
    let atual = 0;
    const slides = elementoContainer.querySelectorAll(".carrossel-pub-slide");
    setInterval(() => {
      slides[atual].classList.remove("ativo");
      atual = (atual + 1) % slides.length;
      slides[atual].classList.add("ativo");
    }, 5000);
  }
}

// --- BLOCOS DE 4 BANNERS ENTRE NOTÍCIAS ---
// Cada vez que essa função é chamada (uma vez por notícia da listagem), avança para o próximo
// grupo de 4 anunciantes em sequência — assim, ao longo da página, todo anunciante aparece,
// em vez de sempre os mesmos 4 ficarem fixos no topo da lista.
let _ponteiroBloco = 0;
export async function montarProximoBlocoDeBanners() {
  const banners = await obterBannersAtivos();
  if (banners.length === 0) return "";

  const grupo = [];
  for (let i = 0; i < 4; i++) {
    grupo.push(banners[_ponteiroBloco % banners.length]);
    _ponteiroBloco++;
  }

  return `
    <div class="bloco-pub-entre-noticias">
      ${grupo.map(b => htmlBanner(b, "banner-pub-bloco")).join("")}
    </div>
  `;
}

// Reinicia o ponteiro de rodízio — chame isso ao começar a montar uma nova listagem de notícias,
// para que cada página comece do anunciante 1 (evita comportamento estranho ao navegar entre páginas).
export function reiniciarRodizioBlocos() {
  _ponteiroBloco = 0;
}

// --- BANNER ÚNICO DENTRO DA NOTÍCIA (meio do texto) ---
// Cada notícia visitada usa um anunciante diferente, em rodízio simples (baseado no id da notícia).
export async function montarBannerDeNoticia(idNoticia) {
  const banners = await obterBannersAtivos();
  if (banners.length === 0) return "";
  // Usa o id da notícia para "escolher" sempre o mesmo anunciante para aquela notícia específica,
  // mas variando de notícia para notícia — assim cada matéria tem seu próprio anunciante fixo.
  let soma = 0;
  for (const ch of String(idNoticia)) soma += ch.charCodeAt(0);
  const banner = banners[soma % banners.length];
  return `<div class="banner-pub-noticia">${htmlBanner(banner)}</div>`;
}

// --- RODAPÉ: 5 espaços fixos, com rotação automática se houver 6+ anunciantes ---
export async function montarBannersRodape(elementoContainer) {
  const banners = await obterBannersAtivos();
  if (!elementoContainer || banners.length === 0) {
    if (elementoContainer) elementoContainer.style.display = "none";
    return;
  }
  elementoContainer.style.display = "flex";

  if (banners.length <= 5) {
    elementoContainer.innerHTML = banners.map(b => htmlBanner(b, "banner-pub-rodape")).join("");
    return;
  }

  // Mais de 5 anunciantes: mostra 5 por vez e troca o grupo inteiro a cada poucos segundos.
  let inicio = 0;
  function renderizarGrupo() {
    const grupo = [];
    for (let i = 0; i < 5; i++) grupo.push(banners[(inicio + i) % banners.length]);
    elementoContainer.innerHTML = grupo.map(b => htmlBanner(b, "banner-pub-rodape")).join("");
  }
  renderizarGrupo();
  setInterval(() => {
    inicio = (inicio + 5) % banners.length;
    renderizarGrupo();
  }, 6000);
}
