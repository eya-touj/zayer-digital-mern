const state = {
  cars: [],
  currentFilter: 'all',
  recommendationBusy: false,
  toastTimer: null,
};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]);
}

function showToast(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.add('show');
  window.clearTimeout(state.toastTimer);
  state.toastTimer = window.setTimeout(() => toast.classList.remove('show'), 3400);
}

function categoryFilter(category) {
  const normalized = (category || '').toLowerCase();
  if (normalized.includes('suv')) return 'SUV';
  if (normalized.includes('citadine')) return 'Citadine';
  if (normalized.includes('berline')) return 'Berline premium';
  return category;
}

function carCard(car, index) {
  const filter = categoryFilter(car.category);
  const image = escapeHtml(car.image || '');
  const name = escapeHtml(car.name || 'Véhicule');
  const category = escapeHtml(car.category || 'Véhicule');
  const transmission = escapeHtml(car.transmission || 'À confirmer');
  const fuel = escapeHtml(car.fuel || 'À confirmer');
  const seats = Number(car.seats) || 5;
  const description = escapeHtml(car.description || 'Détails à confirmer auprès de l’agence.');
  const carId = escapeHtml(car.id || 'vehicle');
  return `
    <article class="vehicle-card reveal" data-category="${escapeHtml(filter)}" data-car-id="${carId}" style="transition-delay:${Math.min(index * 65, 195)}ms">
      <div class="vehicle-photo">
        <img src="${image}" alt="${name}, photo d’illustration" loading="lazy" onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80'">
        <span class="vehicle-number">CR / 0${index + 1}</span>
        <button class="vehicle-fav" type="button" aria-label="Ajouter ${name} aux favoris" aria-pressed="false">♡</button>
      </div>
      <div class="vehicle-content">
        <div class="vehicle-topline"><span class="vehicle-category">${category}</span><span class="vehicle-status">À confirmer</span></div>
        <h3>${name}</h3>
        <p class="vehicle-description">${description}</p>
        <div class="vehicle-specs">
          <span class="vehicle-spec"><span>♙</span> ${seats} places</span>
          <span class="vehicle-spec"><span>⌁</span> ${transmission}</span>
          <span class="vehicle-spec"><span>◉</span> ${fuel}</span>
        </div>
        <div class="vehicle-card-bottom"><div class="vehicle-price"><small>Tarif journalier</small><strong>Sur demande</strong></div><button class="vehicle-book" type="button" data-ask-car="${carId}">Choisir <span>↗</span></button></div>
      </div>
    </article>`;
}

function renderCars() {
  const grid = $('#fleet-grid');
  const cars = state.currentFilter === 'all'
    ? state.cars
    : state.cars.filter((car) => categoryFilter(car.category) === state.currentFilter);
  if (!cars.length) {
    grid.innerHTML = '<p class="empty-fleet">Aucun véhicule ne correspond à ce filtre dans l’inventaire de démonstration.</p>';
    return;
  }
  grid.innerHTML = cars.map((car, index) => carCard(car, index)).join('');
  attachCardInteractions();
  attachRevealObserver();
}

function attachCardInteractions() {
  $$('.vehicle-fav').forEach((button) => {
    button.addEventListener('click', () => {
      const active = button.classList.toggle('saved');
      button.setAttribute('aria-pressed', String(active));
      button.textContent = active ? '♥' : '♡';
      showToast(active ? 'Véhicule ajouté à vos favoris pour cette session.' : 'Véhicule retiré des favoris.');
    });
  });
  $$('[data-ask-car]').forEach((button) => {
    button.addEventListener('click', () => {
      const car = state.cars.find((item) => item.id === button.dataset.askCar);
      if (car) {
        openChat();
        $('#chat-input').value = `Je voudrais en savoir plus sur la ${car.name} pour ma location.`;
        $('#chat-input').focus();
      }
    });
  });
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    $$('.vehicle-card').forEach((card) => {
      card.addEventListener('mousemove', (event) => {
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width;
        const y = (event.clientY - rect.top) / rect.height;
        const rotateY = (x - .5) * 3.6;
        const rotateX = (.5 - y) * 3;
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-2px)`;
      });
      card.addEventListener('mouseleave', () => { card.style.transform = ''; });
    });
  }
}

function attachRevealObserver() {
  const elements = $$('.reveal:not(.is-observed)');
  if (!('IntersectionObserver' in window)) {
    elements.forEach((element) => element.classList.add('is-visible'));
    return;
  }
  const observer = new IntersectionObserver((entries, currentObserver) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        currentObserver.unobserve(entry.target);
      }
    });
  }, { threshold: .09, rootMargin: '0px 0px -35px 0px' });
  elements.forEach((element) => {
    element.classList.add('is-observed');
    observer.observe(element);
  });
}

async function fetchCars() {
  try {
    const response = await fetch('data/cars.json');
    if (!response.ok) throw new Error('inventory request failed');
    const data = await response.json();
    state.cars = Array.isArray(data.cars) ? data.cars : [];
    renderCars();
  } catch (error) {
    console.error('Unable to fetch demo inventory:', error);
    $('#fleet-grid').innerHTML = '<div class="fleet-error"><strong>La flotte ne se charge pas.</strong><p>Actualisez la page ou réessayez plus tard.</p></div>';
  }
}

function openChat() {
  const panel = $('#chat-panel');
  panel.classList.add('open');
  panel.setAttribute('aria-hidden', 'false');
  $('#chat-launcher').setAttribute('aria-expanded', 'true');
  window.setTimeout(() => $('#chat-input').focus(), 160);
}

function closeChat() {
  const panel = $('#chat-panel');
  panel.classList.remove('open');
  panel.setAttribute('aria-hidden', 'true');
  $('#chat-launcher').setAttribute('aria-expanded', 'false');
}

function addChatBubble(text, role = 'bot') {
  const messages = $('#chat-messages');
  const bubble = document.createElement('div');
  bubble.className = `chat-bubble ${role === 'user' ? 'user-bubble' : 'bot-bubble'}`;
  bubble.textContent = text;
  messages.appendChild(bubble);
  messages.scrollTop = messages.scrollHeight;
  return bubble;
}

function addTypingIndicator() {
  const messages = $('#chat-messages');
  const typing = document.createElement('div');
  typing.className = 'chat-bubble bot-bubble typing-indicator';
  typing.setAttribute('aria-label', 'Réponse en cours');
  typing.innerHTML = '<i></i><i></i><i></i>';
  messages.appendChild(typing);
  messages.scrollTop = messages.scrollHeight;
  return typing;
}

function addRecommendationCards(matches = []) {
  const messages = $('#chat-messages');
  if (!matches.length) return;
  const wrapper = document.createElement('div');
  wrapper.className = 'recommendation-stack';
  matches.slice(0, 3).forEach((match, index) => {
    const car = match.car || {};
    const card = document.createElement('article');
    card.className = 'recommendation-result';
    const reasons = Array.isArray(match.reasons) ? match.reasons : [];
    card.innerHTML = `
      <img src="${escapeHtml(car.image || '')}" alt="${escapeHtml(car.name || 'Véhicule')} — image d’illustration" loading="lazy" onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=900&q=80'">
      <div class="recommendation-copy"><small>${index === 0 ? 'MEILLEURE CORRESPONDANCE' : `AUTRE OPTION 0${index}`}</small><h4>${escapeHtml(car.name || 'Véhicule')}</h4><p>${escapeHtml(car.category || 'Catégorie à confirmer')} · ${Number(car.seats) || 5} places · ${escapeHtml(car.transmission || 'Transmission à confirmer')}</p><ul class="recommendation-reasons">${reasons.slice(0, 2).map((reason) => `<li>${escapeHtml(reason)}</li>`).join('')}</ul></div>
      <div class="recommendation-actions"><a href="https://wa.me/21626380100?text=${encodeURIComponent(`Bonjour Crystal Car, je souhaite connaître le prix et la disponibilité de la ${car.name || 'voiture'} pour mes dates.`)}" target="_blank" rel="noopener noreferrer">Demander prix & dispo ↗</a><button type="button" data-chat-car="${escapeHtml(car.id || '')}">Comparer</button></div>`;
    wrapper.appendChild(card);
  });
  messages.appendChild(wrapper);
  $$('[data-chat-car]', wrapper).forEach((button) => {
    button.addEventListener('click', () => {
      const car = state.cars.find((item) => item.id === button.dataset.chatCar);
      if (car) {
        $('#chat-input').value = `Compare ${car.name} avec les autres options pour mon trajet.`;
        $('#chat-input').focus();
      }
    });
  });
  messages.scrollTop = messages.scrollHeight;
}

async function submitChat(messageOverride = null) {
  if (state.recommendationBusy) return;
  const input = $('#chat-input');
  const message = (messageOverride ?? input.value).trim();
  if (!message) return;
  input.value = '';
  state.recommendationBusy = true;
  $$('.chat-quick-prompts').forEach((node) => node.remove());
  addChatBubble(message, 'user');
  const typing = addTypingIndicator();
  const normalized = message.toLowerCase();
  const passengers = Number($('#chat-passengers').value || 2);
  try {
    if (!state.cars.length) throw new Error('La flotte de démonstration n’est pas disponible.');
    const ranked = state.cars.map((car) => {
      let score = 0;
      const tags = [...(car.best_for || []), ...(car.keywords || []), car.name || '', car.category || '', car.transmission || ''].join(' ').toLowerCase();
      normalized.split(/\s+/).filter((word) => word.length > 3).forEach((word) => { if (tags.includes(word)) score += 1; });
      if (passengers >= 4 && Number(car.seats || 0) >= passengers) score += 3;
      if (/luxe|premium|mariage|prestige/.test(normalized) && /mercedes|premium|luxe/i.test(`${car.name} ${car.category}`)) score += 4;
      if (/automatique|auto/.test(normalized) && /automatique/i.test(car.transmission || '')) score += 3;
      if (/manuelle|manual/.test(normalized) && /manuelle/i.test(car.transmission || '')) score += 3;
      return { car, score, reasons: [Number(car.seats || 0) >= passengers ? `${car.seats} places adaptées à votre groupe` : 'Option à comparer selon le nombre de passagers', 'Prix et disponibilité à confirmer auprès de l’agence'] };
    }).sort((a, b) => b.score - a.score).slice(0, 3);
    await new Promise((resolve) => window.setTimeout(resolve, 300));
    typing.remove();
    addChatBubble('Voici quelques véhicules de démonstration qui pourraient correspondre. Les prix et disponibilités sont à confirmer auprès de l’agence.');
    addRecommendationCards(ranked);
  } catch (error) {
    typing.remove();
    addChatBubble(error.message || 'Impossible de proposer une recommandation pour le moment.');
  } finally {
    state.recommendationBusy = false;
    input.focus();
  }
}

function initBookingForm() {
  const form = $('#booking-form');
  const start = form.elements.startDate;
  const end = form.elements.endDate;
  const now = new Date();
  const today = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  start.min = today;
  end.min = today;
  start.addEventListener('change', () => {
    end.min = start.value || today;
    if (end.value && start.value && end.value < start.value) end.value = start.value;
  });
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (start.value < today) { showToast('Choisissez une date de départ à partir d’aujourd’hui.'); return; }
    if (end.value < start.value) { showToast('La date de retour doit être le jour du départ ou après.'); return; }
    const values = new FormData(form);
    const detail = {
      pickup: values.get('pickup'),
      startDate: values.get('startDate'),
      endDate: values.get('endDate'),
      category: values.get('category'),
    };
    state.currentFilter = detail.category === 'Tous types' ? 'all' : detail.category;
    $$('.filter-chip').forEach((chip) => chip.classList.toggle('active', chip.dataset.filter === state.currentFilter));
    renderCars();
    $('#booking-feedback').textContent = `Demande indicative : ${detail.pickup} · du ${detail.startDate} au ${detail.endDate}. La disponibilité sera confirmée par l’agence.`;
    $('#fleet').scrollIntoView({ behavior: 'smooth' });
    showToast('Flotte filtrée. Contactez Crystal Car pour confirmer le véhicule et le tarif.');
  });
}

function initFleetFilters() {
  $$('.filter-chip').forEach((chip) => chip.addEventListener('click', () => {
    state.currentFilter = chip.dataset.filter;
    $$('.filter-chip').forEach((item) => item.classList.toggle('active', item === chip));
    renderCars();
  }));
  $('#fleet-prev').addEventListener('click', () => $('#fleet-grid').scrollBy({ left: -360, behavior: 'smooth' }));
  $('#fleet-next').addEventListener('click', () => $('#fleet-grid').scrollBy({ left: 360, behavior: 'smooth' }));
}

function initMobileNav() {
  const toggle = $('.mobile-menu-toggle');
  const nav = $('.desktop-nav');
  toggle.addEventListener('click', () => {
    const expanded = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', String(expanded));
    nav.classList.toggle('open', expanded);
  });
  $$('.desktop-nav a').forEach((link) => link.addEventListener('click', () => {
    nav.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
  }));
  window.addEventListener('scroll', () => $('.site-header').classList.toggle('scrolled', window.scrollY > 15), { passive: true });
}

function initChat() {
  $('#chat-launcher').addEventListener('click', () => $('#chat-panel').classList.contains('open') ? closeChat() : openChat());
  $('#chat-close').addEventListener('click', closeChat);
  $('#chat-form').addEventListener('submit', (event) => { event.preventDefault(); submitChat(); });
  $$('[data-prompt]').forEach((button) => button.addEventListener('click', () => submitChat(button.dataset.prompt)));
  $('#open-chat-from-promo').addEventListener('click', openChat);
  $('#open-chat-from-card').addEventListener('click', openChat);
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeChat(); });
}

function initNewsletter() {
  $('#newsletter-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const email = $('#newsletter-email').value.trim();
    if (!email) return;
    const subject = encodeURIComponent('Demande d’informations — Crystal Rent Car');
    const body = encodeURIComponent(`Bonjour Crystal Car,\n\nJe souhaite recevoir des informations sur vos offres de location.\nMon adresse e-mail : ${email}\n\nMerci.`);
    $('#newsletter-feedback').textContent = 'Votre application e-mail va préparer le message. Aucun abonnement n’est enregistré par cette démo.';
    window.location.href = `mailto:info@crystalrentcar.com?subject=${subject}&body=${body}`;
  });
}

function initRevealOnScroll() {
  attachRevealObserver();
}

function initVideoFallback() {
  const video = $('.hero-video');
  const fallback = $('.hero-image-fallback');
  video.addEventListener('error', () => {
    video.style.display = 'none';
    fallback.style.zIndex = '0';
  });
  // Browsers can block autoplay; the still image remains behind the video.
  video.play().catch(() => { /* Muted background video is progressive enhancement. */ });
}

function init() {
  $('#year').textContent = new Date().getFullYear();
  initBookingForm();
  initFleetFilters();
  initMobileNav();
  initChat();
  initNewsletter();
  initRevealOnScroll();
  initVideoFallback();
  fetchCars();
}

document.addEventListener('DOMContentLoaded', init);
