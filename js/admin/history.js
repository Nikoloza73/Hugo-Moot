/* ==========================================================================
   Admin: History management (add / edit / delete timeline milestones).
   ========================================================================== */

(function (window, document) {
  'use strict';

  var els = {};
  var imageUpload = null;
  var editingId = null;
  var originalImage = '';

  function icon(name) {
    if (name === 'edit') {
      return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>';
    }
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></svg>';
  }

  function rowTemplate(item) {
    var esc = window.HM.util.escapeHtml;
    return (
      '<div class="admin-row" data-id="' + item.id + '">' +
        '<div class="admin-row__thumb"><img src="' + window.HM.util.resolveImage(item.image) + '" alt=""></div>' +
        '<div class="admin-row__body">' +
          '<div class="admin-row__title">' + esc(item.title) + '</div>' +
          '<div class="admin-row__meta">' + esc(item.year) + '</div>' +
        '</div>' +
        '<div class="admin-row__actions">' +
          '<button type="button" class="icon-btn js-edit" aria-label="Edit">' + icon('edit') + '</button>' +
          '<button type="button" class="icon-btn icon-btn--danger js-delete" aria-label="Delete">' + icon('delete') + '</button>' +
        '</div>' +
      '</div>'
    );
  }

  async function renderList() {
    var items = await window.HM.history.getSorted();
    if (!items.length) {
      els.list.innerHTML = '<div class="empty-state">No milestones yet. Click "Add Milestone" to create your first one.</div>';
      return;
    }
    els.list.innerHTML = items.map(rowTemplate).join('');

    els.list.querySelectorAll('.js-edit').forEach(function (btn) {
      btn.addEventListener('click', async function () {
        var id = btn.closest('.admin-row').getAttribute('data-id');
        openModal(await window.HM.history.getById(id));
      });
    });
    els.list.querySelectorAll('.js-delete').forEach(function (btn) {
      btn.addEventListener('click', async function () {
        var id = btn.closest('.admin-row').getAttribute('data-id');
        var item = await window.HM.history.getById(id);
        var confirmed = await window.HM.ui.confirmDialog({
          title: 'Delete this milestone?',
          message: '"' + item.title + '" will be permanently removed from the timeline.',
          confirmLabel: 'Delete'
        });
        if (!confirmed) return;
        try {
          await window.HM.history.delete(id);
          await window.HM.util.deleteImage(item.image);
          await window.HM.activity.log('Deleted history milestone "' + item.title + '"');
          window.HM.ui.toast('Milestone deleted.', 'success');
          renderList();
        } catch (err) {
          window.HM.ui.toast('Could not delete this milestone. Please try again.', 'danger');
        }
      });
    });
  }

  function resetForm() {
    editingId = null;
    originalImage = '';
    els.form.reset();
    imageUpload.reset('');
    els.modalTitle.textContent = 'Add Milestone';
    els.submitBtn.textContent = 'Save Milestone';
  }

  function openModal(item) {
    resetForm();
    if (item) {
      editingId = item.id;
      originalImage = item.image || '';
      document.getElementById('milestoneYear').value = item.year || '';
      document.getElementById('milestoneTitle').value = item.title || '';
      document.getElementById('milestoneDescription').value = item.description || '';
      imageUpload.reset(item.image || '');
      els.modalTitle.textContent = 'Edit Milestone';
      els.submitBtn.textContent = 'Save Changes';
    }
    els.modal.classList.add('is-open');
  }

  function closeModal() {
    els.modal.classList.remove('is-open');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    var data = {
      year: document.getElementById('milestoneYear').value.trim(),
      title: document.getElementById('milestoneTitle').value.trim(),
      description: document.getElementById('milestoneDescription').value.trim(),
      image: imageUpload.getValue() || 'images/placeholder-wide.svg'
    };

    els.submitBtn.disabled = true;

    try {
      if (editingId) {
        await window.HM.history.update(editingId, data);
        if (originalImage && originalImage !== data.image) {
          await window.HM.util.deleteImage(originalImage);
        }
        await window.HM.activity.log('Updated history milestone "' + data.title + '"');
        window.HM.ui.toast('Milestone updated successfully.', 'success');
      } else {
        await window.HM.history.add(data);
        await window.HM.activity.log('Added history milestone "' + data.title + '"');
        window.HM.ui.toast('Milestone added successfully.', 'success');
      }
      closeModal();
      renderList();
    } catch (err) {
      window.HM.ui.toast('Could not save this milestone. Please try again.', 'danger');
    } finally {
      els.submitBtn.disabled = false;
    }
  }

  function init() {
    els.list = document.getElementById('historyList');
    els.modal = document.getElementById('historyModal');
    els.modalTitle = document.getElementById('historyModalTitle');
    els.form = document.getElementById('historyForm');
    els.submitBtn = document.getElementById('historySubmitBtn');

    imageUpload = window.HM.admin.wireImageUpload(document.getElementById('milestoneImageUpload'), '', function () {}, 'history');

    document.getElementById('addMilestoneBtn').addEventListener('click', function () { openModal(null); });
    document.getElementById('historyModalClose').addEventListener('click', closeModal);
    document.getElementById('historyModalCancel').addEventListener('click', closeModal);
    els.modal.addEventListener('click', function (e) { if (e.target === els.modal) closeModal(); });
    els.form.addEventListener('submit', handleSubmit);

    renderList();
  }

  window.HM.ready(init);
})(window, document);
