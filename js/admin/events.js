/* ==========================================================================
   Admin: Event management (add / edit / delete).
   Event photos are stored in the central Gallery collection, tagged with
   this event's id, so they automatically appear on the public Gallery page.
   ========================================================================== */

(function (window, document) {
  'use strict';

  var els = {};
  var coverUpload = null;
  var galleryItems = []; // { id: existingGalleryId|null, src }
  var originalGalleryItems = []; // { id, src } snapshot taken when the modal opened
  var editingId = null;
  var originalCoverImage = '';

  function icon(name) {
    if (name === 'edit') {
      return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>';
    }
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></svg>';
  }

  function rowTemplate(event) {
    var esc = window.HM.util.escapeHtml;
    return (
      '<div class="admin-row" data-id="' + event.id + '">' +
        '<div class="admin-row__thumb"><img src="' + window.HM.util.resolveImage(event.coverImage) + '" alt=""></div>' +
        '<div class="admin-row__body">' +
          '<div class="admin-row__title">' + esc(event.name) + '</div>' +
          '<div class="admin-row__meta">' + esc(event.year) + ' &middot; ' + window.HM.util.formatDate(event.date, 'short') + '</div>' +
        '</div>' +
        '<div class="admin-row__actions">' +
          '<button type="button" class="icon-btn js-edit" aria-label="Edit">' + icon('edit') + '</button>' +
          '<button type="button" class="icon-btn icon-btn--danger js-delete" aria-label="Delete">' + icon('delete') + '</button>' +
        '</div>' +
      '</div>'
    );
  }

  async function renderList() {
    var items = await window.HM.events.getSorted();
    if (!items.length) {
      els.list.innerHTML = '<div class="empty-state">No events yet. Click "Add Event" to create this year\'s edition.</div>';
      return;
    }
    els.list.innerHTML = items.map(rowTemplate).join('');

    els.list.querySelectorAll('.js-edit').forEach(function (btn) {
      btn.addEventListener('click', async function () {
        var id = btn.closest('.admin-row').getAttribute('data-id');
        await openModal(await window.HM.events.getById(id));
      });
    });
    els.list.querySelectorAll('.js-delete').forEach(function (btn) {
      btn.addEventListener('click', async function () {
        var id = btn.closest('.admin-row').getAttribute('data-id');
        var event = await window.HM.events.getById(id);
        var confirmed = await window.HM.ui.confirmDialog({
          title: 'Delete this event?',
          message: '"' + event.name + '" and its linked gallery photos will be permanently removed.',
          confirmLabel: 'Delete'
        });
        if (!confirmed) return;
        try {
          var linked = (await window.HM.gallery.getAll()).filter(function (p) { return p.eventId === id; });
          await Promise.all(linked.map(function (p) { return window.HM.gallery.delete(p.id); }));
          await Promise.all(linked.map(function (p) { return window.HM.util.deleteImage(p.src); }));
          await window.HM.events.delete(id);
          await window.HM.util.deleteImage(event.coverImage);
          await window.HM.activity.log('Deleted event "' + event.name + '"');
          window.HM.ui.toast('Event deleted.', 'success');
          renderList();
        } catch (err) {
          window.HM.ui.toast('Could not delete this event. Please try again.', 'danger');
        }
      });
    });
  }

  function renderGalleryPreview() {
    els.galleryPreview.innerHTML = galleryItems.map(function (item, i) {
      return (
        '<div class="admin-gallery-item">' +
          '<div class="admin-gallery-item__img"><img src="' + window.HM.util.resolveImage(item.src) + '" alt=""></div>' +
          '<button type="button" class="admin-gallery-item__delete js-remove-gallery-img" data-index="' + i + '" aria-label="Remove image">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>' +
          '</button>' +
        '</div>'
      );
    }).join('');

    els.galleryPreview.querySelectorAll('.js-remove-gallery-img').forEach(function (btn) {
      btn.addEventListener('click', function () {
        galleryItems.splice(Number(btn.getAttribute('data-index')), 1);
        renderGalleryPreview();
      });
    });
  }

  function resetForm() {
    editingId = null;
    originalCoverImage = '';
    els.form.reset();
    galleryItems = [];
    originalGalleryItems = [];
    renderGalleryPreview();
    coverUpload.reset('');
    els.modalTitle.textContent = 'Add Event';
    els.submitBtn.textContent = 'Save Event';
  }

  async function openModal(event) {
    resetForm();
    if (event) {
      editingId = event.id;
      originalCoverImage = event.coverImage || '';
      document.getElementById('eventName').value = event.name || '';
      document.getElementById('eventYear').value = event.year || '';
      document.getElementById('eventDate').value = event.date || '';
      document.getElementById('eventDescription').value = event.description || '';
      coverUpload.reset(event.coverImage || '');

      var linkedPhotos = (await window.HM.gallery.getAll()).filter(function (p) { return p.eventId === event.id; });
      galleryItems = linkedPhotos.map(function (p) { return { id: p.id, src: p.src }; });
      originalGalleryItems = galleryItems.slice();
      renderGalleryPreview();

      els.modalTitle.textContent = 'Edit Event';
      els.submitBtn.textContent = 'Save Changes';
    }
    els.modal.classList.add('is-open');
  }

  function closeModal() {
    els.modal.classList.remove('is-open');
  }

  async function reconcileGalleryLinks(eventId, eventName) {
    var keptIds = galleryItems.filter(function (item) { return item.id; }).map(function (item) { return item.id; });

    var toDelete = originalGalleryItems.filter(function (item) { return keptIds.indexOf(item.id) === -1; });
    var toAdd = galleryItems.filter(function (item) { return !item.id; });

    await Promise.all(toDelete.map(function (item) { return window.HM.gallery.delete(item.id); }));
    await Promise.all(toDelete.map(function (item) { return window.HM.util.deleteImage(item.src); }));
    await Promise.all(toAdd.map(function (item) {
      return window.HM.gallery.add({
        src: item.src,
        caption: eventName + ' — event photo',
        category: 'Event Photos',
        eventId: eventId
      });
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    var data = {
      name: document.getElementById('eventName').value.trim(),
      year: document.getElementById('eventYear').value.trim(),
      date: document.getElementById('eventDate').value,
      description: document.getElementById('eventDescription').value.trim(),
      coverImage: coverUpload.getValue() || 'images/placeholder-wide.svg'
    };

    els.submitBtn.disabled = true;

    try {
      var savedEvent;
      if (editingId) {
        savedEvent = await window.HM.events.update(editingId, data);
        if (originalCoverImage && originalCoverImage !== data.coverImage) {
          await window.HM.util.deleteImage(originalCoverImage);
        }
        await window.HM.activity.log('Updated event "' + data.name + '"');
        window.HM.ui.toast('Event updated successfully.', 'success');
      } else {
        savedEvent = await window.HM.events.add(data);
        await window.HM.activity.log('Created event "' + data.name + '"');
        window.HM.ui.toast('Event created successfully.', 'success');
      }

      await reconcileGalleryLinks(savedEvent.id, savedEvent.name);
      closeModal();
      renderList();
    } catch (err) {
      window.HM.ui.toast('Could not save this event. Please try again.', 'danger');
    } finally {
      els.submitBtn.disabled = false;
    }
  }

  function initGalleryUpload() {
    var input = els.galleryUpload.querySelector('input[type="file"]');
    var label = els.galleryUpload.querySelector('.image-upload__label');
    var originalLabel = label ? label.textContent : '';

    input.addEventListener('change', function () {
      var files = Array.prototype.slice.call(input.files || []);
      if (!files.length) return;
      if (label) label.textContent = 'Uploading…';

      Promise.all(files.map(function (file) { return window.HM.util.uploadImage(file, 'events'); }))
        .then(function (urls) {
          urls.forEach(function (url) { galleryItems.push({ id: null, src: url }); });
          renderGalleryPreview();
        })
        .catch(function () {
          window.HM.ui.toast('Some images failed to upload. Please try again.', 'danger');
        })
        .then(function () {
          if (label) label.textContent = originalLabel;
          input.value = '';
        });
    });
  }

  function init() {
    els.list = document.getElementById('eventsList');
    els.modal = document.getElementById('eventModal');
    els.modalTitle = document.getElementById('eventModalTitle');
    els.form = document.getElementById('eventForm');
    els.submitBtn = document.getElementById('eventSubmitBtn');
    els.galleryUpload = document.getElementById('eventGalleryUpload');
    els.galleryPreview = document.getElementById('eventGalleryPreview');

    coverUpload = window.HM.admin.wireImageUpload(document.getElementById('eventImageUpload'), '', function () {}, 'events');

    document.getElementById('addEventBtn').addEventListener('click', function () { openModal(null); });
    document.getElementById('eventModalClose').addEventListener('click', closeModal);
    document.getElementById('eventModalCancel').addEventListener('click', closeModal);
    els.modal.addEventListener('click', function (e) { if (e.target === els.modal) closeModal(); });
    els.form.addEventListener('submit', handleSubmit);
    initGalleryUpload();

    renderList();
  }

  window.HM.ready(init);
})(window, document);
