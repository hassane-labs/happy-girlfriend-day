// ===================================================================
// Bonne fête Dantou — script.js
// Charge contenu.json, injecte le texte/les images, gère la navigation,
// les favoris (localStorage), le scroll et le lecteur vidéo modal.
// ===================================================================

const FAV_STORAGE_KEY = 'dantou-video-favorites';

async function init() {
  let data;
  try {
    const res = await fetch('contenu.json');
    data = await res.json();
  } catch (err) {
    console.warn('Impossible de charger contenu.json', err);
    return;
  }

  renderAccueil(data.accueil);
  renderGalerie(data.galerie);
  renderMessage(data.message);

  setupNavigation();
  setupScrollButtons();
  setupHearts();
  setupVideoModal();
}

// ---------- Écran 1 : Accueil ----------
function renderAccueil(accueil) {
  document.getElementById('titreHautAccueil').textContent = accueil.titreHaut;
  document.getElementById('heroPhoto').src = accueil.photo;
  document.getElementById('titreAccueil').textContent = accueil.titre;
  document.getElementById('texteAccueil').textContent = accueil.texte;
  document.getElementById('texteBouton').textContent = accueil.bouton;
  document.getElementById('scrollHintText').textContent = accueil.scrollHint;

  document.getElementById('btnMessage').addEventListener('click', () => {
    goToScreen(2);
  });
}

// ---------- Écran 2 : Galerie vidéos ----------
function renderGalerie(galerie) {
  document.getElementById('surTitreGalerie').textContent = galerie.surTitre;
  document.getElementById('titreGalerie').textContent = galerie.titre;

  const favorites = getFavorites();
  const list = document.getElementById('videoList');
  list.innerHTML = '';

  galerie.videos.forEach((video) => {
    const card = document.createElement('article');
    card.className = 'video-card';
    card.setAttribute('role', 'listitem');

    const isFav = favorites.includes(video.id);

    card.innerHTML = `
      <div class="video-thumb-wrap" data-video-id="${video.id}" data-video-src="${video.source || ''}" data-video-title="${escapeHtml(video.titre)}">
        <img src="${video.miniature}" alt="${escapeHtml(video.titre)}" loading="lazy">
        <div class="video-play-btn">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
        </div>
        <button class="video-fav-btn ${isFav ? 'active' : ''}" data-fav-id="${video.id}" aria-label="Ajouter aux favoris">
          <svg viewBox="0 0 24 24" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.8">
            <path d="M12 21s-7.5-4.6-10-9.1C.6 8.5 2 5 5.4 5c2 0 3.4 1.1 4.6 2.7C11.2 6.1 12.6 5 14.6 5 18 5 19.4 8.5 22 11.9 19.5 16.4 12 21 12 21z"/>
          </svg>
        </button>
      </div>
      <div class="video-info">
        <h3>${escapeHtml(video.titre)}</h3>
        <p>${escapeHtml(video.description)}</p>
      </div>
    `;
    list.appendChild(card);
  });

  // Favoris
  list.querySelectorAll('.video-fav-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-fav-id');
      toggleFavorite(id, btn);
    });
  });

  // Ouverture du lecteur vidéo
  list.querySelectorAll('.video-thumb-wrap').forEach((thumb) => {
    thumb.addEventListener('click', () => {
      const title = thumb.getAttribute('data-video-title');
      const src = thumb.getAttribute('data-video-src');
      openVideoModal(title, src);
    });
  });
}

function getFavorites() {
  try {
    return JSON.parse(localStorage.getItem(FAV_STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function toggleFavorite(id, btn) {
  let favs = getFavorites();
  const svg = btn.querySelector('svg');
  if (favs.includes(id)) {
    favs = favs.filter((f) => f !== id);
    btn.classList.remove('active');
    svg.setAttribute('fill', 'none');
  } else {
    favs.push(id);
    btn.classList.add('active');
    svg.setAttribute('fill', 'currentColor');
  }
  try {
    localStorage.setItem(FAV_STORAGE_KEY, JSON.stringify(favs));
  } catch (err) {
    console.warn('localStorage indisponible', err);
  }
}

// ---------- Écran 3 : Message ----------
function renderMessage(message) {
  document.getElementById('titreHautMessage').textContent = message.titreHaut;
  document.getElementById('encadreTitre').textContent = message.encadreTitre;
  document.getElementById('salutation').textContent = message.salutation;

  const corps = document.getElementById('corpsLettre');
  corps.innerHTML = '';
  message.corps.forEach((paragraphe) => {
    const p = document.createElement('p');
    p.textContent = paragraphe;
    corps.appendChild(p);
  });

  document.getElementById('signatureFete').textContent = message.signatureFete;
  document.getElementById('signatureCoeur').textContent = message.signatureCoeur;
  document.getElementById('photoFinale').src = message.photoFinale;
  document.getElementById('cloture').textContent = message.cloture;
}

// ---------- Navigation entre écrans ----------
function setupNavigation() {
  const dots = document.querySelectorAll('.dot');
  dots.forEach((dot) => {
    dot.addEventListener('click', () => {
      const idx = parseInt(dot.getAttribute('data-target'), 10);
      goToScreen(idx);
    });
  });

  const app = document.getElementById('app');
  const screens = document.querySelectorAll('.screen');

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && entry.intersectionRatio > 0.6) {
          const idx = entry.target.getAttribute('data-index');
          dots.forEach((d) => d.classList.remove('active'));
          const activeDot = document.querySelector(`.dot[data-target="${idx}"]`);
          if (activeDot) activeDot.classList.add('active');
        }
      });
    },
    { root: app, threshold: [0.6] }
  );

  screens.forEach((s) => observer.observe(s));
}

function goToScreen(index) {
  const target = document.getElementById(`screen-${index}`);
  if (target) target.scrollIntoView({ behavior: 'smooth' });
}

// ---------- Bouton "remonter en haut" ----------
function setupScrollButtons() {
  const galerieScreen = document.getElementById('screen-1');
  const messageScreen = document.getElementById('screen-2');
  const btnTopGalerie = document.getElementById('btnTopGalerie');
  const btnTopMessage = document.getElementById('btnTopMessage');

  galerieScreen.addEventListener('scroll', () => {
    btnTopGalerie.classList.toggle('visible', galerieScreen.scrollTop > 200);
  });
  messageScreen.addEventListener('scroll', () => {
    btnTopMessage.classList.toggle('visible', messageScreen.scrollTop > 200);
  });

  btnTopGalerie.addEventListener('click', () => {
    galerieScreen.scrollTo({ top: 0, behavior: 'smooth' });
  });
  btnTopMessage.addEventListener('click', () => {
    messageScreen.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// ---------- Cœurs flottants (décor) ----------
function setupHearts() {
  const container = document.querySelector('.hearts-float');
  if (!container) return;

  const heartSVG = () => `
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
      <path d="M12 21s-7.5-4.6-10-9.1C.6 8.5 2 5 5.4 5c2 0 3.4 1.1 4.6 2.7C11.2 6.1 12.6 5 14.6 5 18 5 19.4 8.5 22 11.9 19.5 16.4 12 21 12 21z"/>
    </svg>
  `;

  const heartCount = 8;
  for (let i = 0; i < heartCount; i++) {
    const el = document.createElement('div');
    el.className = 'heart';
    el.innerHTML = heartSVG();
    el.style.left = `${5 + Math.random() * 90}%`;
    el.style.setProperty('--drift', `${(Math.random() - 0.5) * 60}px`);
    el.style.animationDelay = `${Math.random() * 9}s`;
    el.style.animationDuration = `${7 + Math.random() * 5}s`;
    container.appendChild(el);
  }
}

// ---------- Modal lecteur vidéo ----------
function setupVideoModal() {
  const modal = document.getElementById('videoModal');
  const backdrop = document.getElementById('videoModalBackdrop');
  const closeBtn = document.getElementById('videoModalClose');

  backdrop.addEventListener('click', closeVideoModal);
  closeBtn.addEventListener('click', closeVideoModal);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeVideoModal();
  });
}

function openVideoModal(title, src) {
  const modal = document.getElementById('videoModal');
  const body = document.getElementById('videoModalBody');

  if (src) {
    body.innerHTML = `<video src="${src}" controls autoplay playsinline></video>`;
  } else {
    body.innerHTML = `
      <div>
        <p style="font-weight:500; margin-bottom:6px; color:#f5e9df;">${escapeHtml(title)}</p>
        <p>Vidéo à ajouter — remplace le champ "source" de cet élément dans contenu.json.</p>
      </div>
    `;
  }

  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
}

function closeVideoModal() {
  const modal = document.getElementById('videoModal');
  const body = document.getElementById('videoModalBody');
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
  body.innerHTML = '';
}

// ---------- Utilitaire ----------
function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

document.addEventListener('DOMContentLoaded', init);
