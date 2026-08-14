/* ==========================================================================
   Single event page: reads ?id= from the URL and renders the event's
   description plus its photo gallery (with lightbox).
   ========================================================================== */

(function (window, document) {
  'use strict';

  var state = { photos: [], lightboxIndex: -1 };
  var els = {};

  function getIdFromUrl() {
    return new URLSearchParams(window.location.search).get('id');
  }

  function renderNotFound() {
    document.getElementById('eventRoot').innerHTML =
      '<div class="container section-tight text-center">' +
        '<h1>Event Not Found</h1>' +
        '<p class="muted" style="margin-bottom: var(--space-md);">The event you are looking for does not exist or may have been removed.</p>' +
        '<a href="events.html" class="btn btn-primary">Back to Events</a>' +
      '</div>';
  }

  function photoItemTemplate(photo, index) {
    var esc = window.HM.util.escapeHtml;
    return (
      '<figure class="gallery-item reveal" data-index="' + index + '" tabindex="0" role="button" aria-label="View photo: ' + esc(photo.caption) + '">' +
        '<img src="' + window.HM.util.resolveImage(photo.src) + '" alt="' + esc(photo.caption) + '" loading="lazy">' +
        '<figcaption class="gallery-item__overlay"><span class="gallery-item__caption">' + esc(photo.caption) + '</span></figcaption>' +
      '</figure>'
    );
  }

  function renderEvent(event, photos) {
    var esc = window.HM.util.escapeHtml;
    document.getElementById('docTitle').textContent = event.name + ' | Hugo Moot';
    state.photos = photos;

    var photosHtml = photos.length
      ? '<div class="container section-tight event-photos"><div class="section-heading"><span class="eyebrow">Photos</span><h2>Event Gallery</h2></div><div class="gallery-grid" id="eventPhotoGrid">' + photos.map(photoItemTemplate).join('') + '</div></div>'
      : '';

    var html =
      '<div class="event-hero">' +
        '<img src="' + window.HM.util.resolveImage(event.coverImage) + '" alt="' + esc(event.name) + '">' +
      '</div>' +
      '<div class="container event-header">' +
        '<a href="events.html" class="back-link">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg>' +
          'Back to Events' +
        '</a>' +
        '<div class="event-meta">' + esc(event.year) + ' &middot; ' + window.HM.util.formatDate(event.date) + '</div>' +
        '<h1>' + esc(event.name) + '</h1>' +
      '</div>' +
      '<div class="container section-tight">' +
        '<div class="event-body">' + window.HM.util.paragraphs(event.description) + '</div>' +
      '</div>' +
      photosHtml;

    document.getElementById('eventRoot').innerHTML = html;

    if (photos.length) {
      els.grid = document.getElementById('eventPhotoGrid');
      wirePhotoClicks();
      window.HM.ui.initScrollReveal();
    }
  }

  function wirePhotoClicks() {
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
  }

  function showLightboxItem(index) {
    var photo = state.photos[index];
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
    var next = (state.lightboxIndex + delta + state.photos.length) % state.photos.length;
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
    els.lightbox = document.getElementById('lightbox');
    els.lightboxImage = document.getElementById('lightboxImage');
    els.lightboxCaption = document.getElementById('lightboxCaption');
    els.lightboxClose = document.getElementById('lightboxClose');
    els.lightboxPrev = document.getElementById('lightboxPrev');
    els.lightboxNext = document.getElementById('lightboxNext');
    initLightboxControls();

    var id = getIdFromUrl();
    var event = null;
    var photos = [];
    try {
      event = id ? await window.HM.events.getById(id) : null;
      if (event) {
        photos = (await window.HM.gallery.getAll()).filter(function (p) { return p.eventId === id; });
      }
    } catch (err) {
      console.error('HM: failed to load event', err);
    }

    if (!event) {
      renderNotFound();
      return;
    }
    renderEvent(event, photos);
  }

  window.HM.ready(init);
})(window, document);
