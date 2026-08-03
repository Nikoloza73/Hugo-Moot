/* ==========================================================================
   Admin: Gallery management — upload photos, delete them, assign a
   category and/or event. Every field auto-saves on change.
   ========================================================================== */

(function (window, document) {
  'use strict';

  var els = {};

  function icon() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>';
  }

  function eventOptions(events, selectedId) {
    var opts = '<option value="">— No Event —</option>';
    opts += events.map(function (ev) {
      var sel = ev.id === selectedId ? ' selected' : '';
      return '<option value="' + ev.id + '"' + sel + '>' + window.HM.util.escapeHtml(ev.name) + '</option>';
    }).join('');
    return opts;
  }

  function cardTemplate(photo, events) {
    var esc = window.HM.util.escapeHtml;
    return (
      '<div class="admin-gallery-card" data-id="' + photo.id + '">' +
        '<div class="admin-gallery-card__img">' +
          '<img src="' + window.HM.util.resolveImage(photo.src) + '" alt="">' +
          '<button type="button" class="admin-gallery-card__delete js-delete-photo" aria-label="Delete photo">' + icon() + '</button>' +
        '</div>' +
        '<div class="admin-gallery-card__fields">' +
          '<div>' +
            '<label>Caption</label>' +
            '<input type="text" class="js-field-caption" value="' + esc(photo.caption) + '" placeholder="Describe this photo">' +
          '</div>' +
          '<div>' +
            '<label>Category</label>' +
            '<input type="text" class="js-field-category" list="categoryOptions" value="' + esc(photo.category || '') + '" placeholder="e.g. Oral Rounds">' +
          '</div>' +
          '<div>' +
            '<label>Assign to Event</label>' +
            '<select class="js-field-event">' + eventOptions(events, photo.eventId) + '</select>' +
          '</div>' +
          '<div class="admin-gallery-empty-hint js-saved-hint"></div>' +
        '</div>' +
      '</div>'
    );
  }

  function ensureDatalist() {
    if (document.getElementById('categoryOptions')) return;
    var datalist = document.createElement('datalist');
    datalist.id = 'categoryOptions';
    document.body.appendChild(datalist);
  }

  async function refreshDatalist() {
    var datalist = document.getElementById('categoryOptions');
    var categories = await window.HM.gallery.getCategories();
    datalist.innerHTML = categories.map(function (c) { return '<option value="' + window.HM.util.escapeHtml(c) + '">'; }).join('');
  }

  function flashSaved(card) {
    var hint = card.querySelector('.js-saved-hint');
    hint.textContent = 'Saved ✓';
    window.setTimeout(function () { hint.textContent = ''; }, 1500);
  }

  async function renderGrid() {
    var photos = await window.HM.gallery.getAll();
    if (!photos.length) {
      els.grid.innerHTML = '<div class="empty-state">No photos yet. Upload your first photo above.</div>';
      return;
    }
    var events = await window.HM.events.getSorted();
    els.grid.innerHTML = photos.map(function (p) { return cardTemplate(p, events); }).join('');
    refreshDatalist();
    wireCardEvents();
  }

  function wireCardEvents() {
    els.grid.querySelectorAll('.admin-gallery-card').forEach(function (card) {
      var id = card.getAttribute('data-id');

      card.querySelector('.js-field-caption').addEventListener('change', async function (e) {
        try {
          await window.HM.gallery.update(id, { caption: e.target.value.trim() });
          flashSaved(card);
        } catch (err) {
          window.HM.ui.toast('Could not save the caption. Please try again.', 'danger');
        }
      });
      card.querySelector('.js-field-category').addEventListener('change', async function (e) {
        try {
          await window.HM.gallery.update(id, { category: e.target.value.trim() || 'Uncategorized' });
          flashSaved(card);
          refreshDatalist();
        } catch (err) {
          window.HM.ui.toast('Could not save the category. Please try again.', 'danger');
        }
      });
      card.querySelector('.js-field-event').addEventListener('change', async function (e) {
        try {
          await window.HM.gallery.update(id, { eventId: e.target.value || null });
          flashSaved(card);
        } catch (err) {
          window.HM.ui.toast('Could not update the event. Please try again.', 'danger');
        }
      });
      card.querySelector('.js-delete-photo').addEventListener('click', async function () {
        var confirmed = await window.HM.ui.confirmDialog({
          title: 'Delete this photo?',
          message: 'This photo will be permanently removed from the gallery.',
          confirmLabel: 'Delete'
        });
        if (!confirmed) return;
        try {
          var photo = await window.HM.gallery.getById(id);
          await window.HM.gallery.delete(id);
          if (photo) await window.HM.util.deleteImage(photo.src);
          await window.HM.activity.log('Deleted a gallery photo');
          window.HM.ui.toast('Photo deleted.', 'success');
          renderGrid();
        } catch (err) {
          window.HM.ui.toast('Could not delete this photo. Please try again.', 'danger');
        }
      });
    });
  }

  function initUpload() {
    var input = document.getElementById('galleryUploadInput');
    input.addEventListener('change', function () {
      var files = Array.prototype.slice.call(input.files || []);
      if (!files.length) return;

      Promise.all(files.map(function (file) { return window.HM.util.uploadImage(file, 'gallery'); }))
        .then(function (urls) {
          return Promise.all(urls.map(function (url) {
            return window.HM.gallery.add({
              src: url,
              caption: 'New photo',
              category: 'Uncategorized',
              eventId: null
            });
          }));
        })
        .then(async function () {
          await window.HM.activity.log('Uploaded ' + files.length + ' new gallery photo' + (files.length > 1 ? 's' : ''));
          window.HM.ui.toast(files.length > 1 ? 'Photos uploaded successfully.' : 'Photo uploaded successfully.', 'success');
          renderGrid();
        })
        .catch(function () {
          window.HM.ui.toast('Some photos failed to upload. Please try again.', 'danger');
        })
        .then(function () { input.value = ''; });
    });
  }

  function init() {
    els.grid = document.getElementById('adminGalleryGrid');
    ensureDatalist();
    initUpload();
    renderGrid();
  }

  window.HM.ready(init);
})(window, document);
