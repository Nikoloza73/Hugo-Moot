/* ==========================================================================
   Gallery page: category filters + lightbox with prev/next navigation.
   ========================================================================== */

(function (window, document) {
  'use strict';

  var state = {
    all: [],
    filtered: [],
    activeCategory: 'All',
    activeEventId: null,
    lightboxIndex: -1
  };

  var els = {};

  async function renderEventNotice() {
    if (!els.eventNotice) return;
    if (!state.activeEventId) {
      els.eventNotice.innerHTML = '';
      return;
    }
    var event = await window.HM.events.getById(state.activeEventId);
    var name = event ? event.name : 'this event';
    els.eventNotice.innerHTML =
      '<div class="event-filter-notice">Showing photos from <strong>' + window.HM.util.escapeHtml(name) + '</strong> &nbsp;' +
      '<button type="button" class="btn-text" id="clearEventFilter">Show All Photos</button></div>';
    document.getElementById('clearEventFilter').addEventListener('click', function () {
      state.activeEventId = null;
      var url = new URL(window.location.href);
      url.searchParams.delete('event');
      window.history.replaceState({}, '', url);
      renderEventNotice();
      renderGrid();
    });
  }

  function renderFilters() {
    var cats = state.all.map(function (p) { return p.category; }).filter(Boolean);
    var categories = ['All'].concat(cats.filter(function (c, i) { return cats.indexOf(c) === i; }));

    els.filters.innerHTML = categories.map(function (cat) {
      var active = cat === state.activeCategory ? ' is-active' : '';
      return '<button type="button" class="gallery-filter' + active + '" data-category="' + window.HM.util.escapeHtml(cat) + '">' + window.HM.util.escapeHtml(cat) + '</button>';
    }).join('');

    els.filters.querySelectorAll('.gallery-filter').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.activeCategory = btn.getAttribute('data-category');
        renderFilters();
        renderGrid();
      });
    });
  }

  function itemTemplate(photo, index) {
    var esc = window.HM.util.escapeHtml;
    return (
      '<figure class="gallery-item reveal" data-index="' + index + '" tabindex="0" role="button" aria-label="View photo: ' + esc(photo.caption) + '">' +
        '<img src="' + window.HM.util.resolveImage(photo.src) + '" alt="' + esc(photo.caption) + '" loading="lazy">' +
        '<figcaption class="gallery-item__overlay"><span class="gallery-item__caption">' + esc(photo.caption) + '</span></figcaption>' +
      '</figure>'
    );
  }

  function renderGrid() {
    state.filtered = state.all.filter(function (p) {
      var categoryMatch = state.activeCategory === 'All' || p.category === state.activeCategory;
      var eventMatch = !state.activeEventId || p.eventId === state.activeEventId;
      return categoryMatch && eventMatch;
    });

    if (!state.filtered.length) {
      els.grid.innerHTML = '<div class="empty-state">No photos in this category yet.</div>';
      return;
    }

    els.grid.innerHTML = state.filtered.map(itemTemplate).join('');

    els.grid.querySelectorAll('.gallery-item').forEach(function (item) {
      item.addEventListener('click', function () {
        openLightbox(Number(item.getAttribute('data-index')));
      });
      item.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openLightbox(Number(item.getAttribute('data-index')));
        }
      });
    });

    window.HM.ui.initScrollReveal();
  }

  function showLightboxItem(index) {
    var photo = state.filtered[index];
    if (!photo) return;
    state.lightboxIndex = index;
    els.lightboxImage.src = window.HM.util.resolveImage(photo.src);
    els.lightboxImage.alt = photo.caption || '';
    els.lightboxCaption.textContent = photo.caption || '';
  }

  function openLightbox(index) {
    showLightboxItem(index);
    els.lightbox.hidden = false;
    document.body.style.overflow = 'hidden';
    els.lightboxClose.focus();
  }

  function closeLightbox() {
    els.lightbox.hidden = true;
    document.body.style.overflow = '';
  }

  function stepLightbox(delta) {
    var next = (state.lightboxIndex + delta + state.filtered.length) % state.filtered.length;
    showLightboxItem(next);
  }

  function initLightboxControls() {
    els.lightboxClose.addEventListener('click', closeLightbox);
    els.lightboxPrev.addEventListener('click', function () { stepLightbox(-1); });
    els.lightboxNext.addEventListener('click', function () { stepLightbox(1); });

    els.lightbox.addEventListener('click', function (e) {
      if (e.target === els.lightbox) closeLightbox();
    });

    document.addEventListener('keydown', function (e) {
      if (els.lightbox.hidden) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') stepLightbox(-1);
      if (e.key === 'ArrowRight') stepLightbox(1);
    });
  }

  async function init() {
    els.filters = document.getElementById('galleryFilters');
    els.grid = document.getElementById('galleryGrid');
    els.lightbox = document.getElementById('lightbox');
    els.lightboxImage = document.getElementById('lightboxImage');
    els.lightboxCaption = document.getElementById('lightboxCaption');
    els.lightboxClose = document.getElementById('lightboxClose');
    els.lightboxPrev = document.getElementById('lightboxPrev');
    els.lightboxNext = document.getElementById('lightboxNext');
    els.eventNotice = document.getElementById('eventFilterNotice');

    state.all = await window.HM.gallery.getAll();
    state.activeEventId = new URLSearchParams(window.location.search).get('event');

    renderFilters();
    await renderEventNotice();
    renderGrid();
    initLightboxControls();
  }

  window.HM.ready(init);
})(window, document);
