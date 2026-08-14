/* ==========================================================================
   Admin: Gallery management — upload photos, delete them, assign a
   year and/or event. Every field auto-saves on change. Years are
   managed as their own admin-curated list (see "Gallery Years" above
   the upload box) rather than free-text categories.
   ========================================================================== */

(function (window, document) {
  'use strict';

  var els = {};
  var state = { years: [] };

  function closeIcon() {
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

  function yearOptions(selectedValue) {
    var names = state.years.map(function (y) { return y.name; });
    if (selectedValue && names.indexOf(selectedValue) === -1) {
      names.push(selectedValue); // keep an existing (e.g. legacy) value selectable even if not in the managed list
    }
    var opts = '<option value="">— Select Year —</option>';
    opts += names.map(function (name) {
      var sel = name === selectedValue ? ' selected' : '';
      return '<option value="' + window.HM.util.escapeHtml(name) + '"' + sel + '>' + window.HM.util.escapeHtml(name) + '</option>';
    }).join('');
    return opts;
  }

  function cardTemplate(photo, events) {
    var esc = window.HM.util.escapeHtml;
    return (
      '<div class="admin-gallery-card" data-id="' + photo.id + '">' +
        '<div class="admin-gallery-card__img">' +
          '<img src="' + window.HM.util.resolveImage(photo.src) + '" alt="">' +
          '<button type="button" class="admin-gallery-card__delete js-delete-photo" aria-label="Delete photo">' + closeIcon() + '</button>' +
        '</div>' +
        '<div class="admin-gallery-card__fields">' +
          '<div>' +
            '<label>Caption</label>' +
            '<input type="text" class="js-field-caption" value="' + esc(photo.caption) + '" placeholder="Describe this photo">' +
          '</div>' +
          '<div>' +
            '<label>Year</label>' +
            '<select class="js-field-category">' + yearOptions(photo.category) + '</select>' +
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

  function flashSaved(card) {
    var hint = card.querySelector('.js-saved-hint');
    hint.textContent = 'Saved ✓';
    window.setTimeout(function () { hint.textContent = ''; }, 1500);
  }

  /* ---- Year management ---------------------------------------------------*/

  function yearChipTemplate(year) {
    return (
      '<span class="year-chip" data-id="' + year.id + '">' +
        window.HM.util.escapeHtml(year.name) +
        '<button type="button" class="year-chip__remove js-remove-year" aria-label="Remove year">' +
          '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>' +
        '</button>' +
      '</span>'
    );
  }

  async function loadYears() {
    try {
      state.years = await window.HM.galleryYears.getSorted();
    } catch (err) {
      console.error('HM: failed to load gallery years', err);
      state.years = [];
    }
  }

  function renderYearChips() {
    if (!state.years.length) {
      els.yearChips.innerHTML = '<span class="muted" style="font-size:var(--fs-small);">No years added yet.</span>';
    } else {
      els.yearChips.innerHTML = state.years.map(yearChipTemplate).join('');
    }

    els.yearChips.querySelectorAll('.js-remove-year').forEach(function (btn) {
      btn.addEventListener('click', async function () {
        var chip = btn.closest('.year-chip');
        var id = chip.getAttribute('data-id');
        var year = state.years.find(function (y) { return y.id === id; });
        var confirmed = await window.HM.ui.confirmDialog({
          title: 'Remove ' + (year ? year.name : 'this year') + '?',
          message: 'This only removes it from the filter list — any photos already tagged with this year keep their tag.',
          confirmLabel: 'Remove'
        });
        if (!confirmed) return;
        try {
          await window.HM.galleryYears.delete(id);
          await window.HM.activity.log('Removed gallery year "' + (year ? year.name : '') + '"');
          window.HM.ui.toast('Year removed.', 'success');
          await loadYears();
          renderYearChips();
          renderGrid();
        } catch (err) {
          window.HM.ui.toast('Could not remove this year. Please try again.', 'danger');
        }
      });
    });
  }

  function initYearForm() {
    var input = document.getElementById('newYearInput');
    var btn = document.getElementById('addYearBtn');

    async function addYear() {
      var name = input.value.trim();
      if (!name) return;
      btn.disabled = true;
      try {
        await window.HM.galleryYears.add({ name: name });
        await window.HM.activity.log('Added gallery year "' + name + '"');
        window.HM.ui.toast('Year added.', 'success');
        input.value = '';
        await loadYears();
        renderYearChips();
        renderGrid();
      } catch (err) {
        var msg = (err && err.code === '23505') ? 'That year has already been added.' : 'Could not add this year. Please try again.';
        window.HM.ui.toast(msg, 'danger');
      } finally {
        btn.disabled = false;
      }
    }

    btn.addEventListener('click', addYear);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); addYear(); }
    });
  }

  /* ---- Photo grid ----------------------------------------------------------*/

  async function renderGrid() {
    var photos = await window.HM.gallery.getAll();
    if (!photos.length) {
      els.grid.innerHTML = '<div class="empty-state">No photos yet. Upload your first photo above.</div>';
      return;
    }
    var events = await window.HM.events.getSorted();
    els.grid.innerHTML = photos.map(function (p) { return cardTemplate(p, events); }).join('');
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
          await window.HM.gallery.update(id, { category: e.target.value });
          flashSaved(card);
        } catch (err) {
          window.HM.ui.toast('Could not save the year. Please try again.', 'danger');
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
              category: '',
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

  async function init() {
    els.grid = document.getElementById('adminGalleryGrid');
    els.yearChips = document.getElementById('yearChips');

    initYearForm();
    initUpload();

    await loadYears();
    renderYearChips();
    renderGrid();
  }

  window.HM.ready(init);
})(window, document);
