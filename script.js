// === VERITAS NOTÍCIAS – Script Principal ===

// Data atual em português
function exibirData() {
  const agora = new Date();
  const opcoes = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };
  const dataFormatada = agora.toLocaleDateString('pt-BR', opcoes);
  const el = document.getElementById('data-atual');
  if (el) {
    // Capitaliza primeira letra
    el.textContent = dataFormatada.charAt(0).toUpperCase() + dataFormatada.slice(1);
  }
}

// Menu lateral
function toggleMenu() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('overlay');
  sidebar.classList.toggle('open');
  overlay.classList.toggle('active');
  document.body.style.overflow = sidebar.classList.contains('open') ? 'hidden' : '';
}

// Fechar menu com ESC
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    const sidebar = document.getElementById('sidebar');
    if (sidebar.classList.contains('open')) toggleMenu();
  }
});

// Busca: a função real é definida em index.html (módulo que usa Firestore).
// Mantemos aqui apenas o gatilho de Enter, que funciona com qualquer implementação de window.buscar.

document.getElementById('searchInput')?.addEventListener('keydown', function(e) {
  if (e.key === 'Enter' && typeof window.buscar === 'function') window.buscar();
});

// Nav ativa
document.querySelectorAll('.main-nav a').forEach(link => {
  link.addEventListener('click', function() {
    document.querySelectorAll('.main-nav a').forEach(l => l.classList.remove('active'));
    this.classList.add('active');
  });
});

// Inicializa
exibirData();

// === ALTERNAR TEMA ===
function alternarTema() {
  const body = document.body;
  const btn = document.getElementById('btnTema');
  const temaEscuro = body.classList.toggle('tema-escuro');
  btn.textContent = temaEscuro ? '☀️ Tema Claro' : '🌙 Tema Escuro';
  localStorage.setItem('tema', temaEscuro ? 'escuro' : 'claro');
}

// Carrega tema salvo
(function() {
  const temaSalvo = localStorage.getItem('tema');
  const btn = document.getElementById('btnTema');
  if (temaSalvo === 'escuro') {
    document.body.classList.add('tema-escuro');
    if (btn) btn.textContent = '☀️ Tema Claro';
  }
})();
