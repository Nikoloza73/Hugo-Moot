/* ==========================================================================
   Admin: Pages management (add / edit / delete custom pages).
   Pages marked "Show in website menu" automatically appear in the site nav.
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

  function rowTemplate(page) {
    var esc = window.HM.util.escapeHtml;
    var navLabel = page.showInNav ? 'Shown in menu' : 'Hidden from menu';
    return (
      '<div class="admin-row" data-id="' + page.id + '">' +
        '<div class="admin-row__thumb"><img src="' + window.HM.util.resolveImage(page.image) + '" alt=""></div>' +
        '<div class="admin-row__body">' +
          '<div class="admin-row__title">' + esc(page.title) + '</div>' +
          '<div class="admin-row__meta">/pages/page.html?slug=' + esc(page.slug) + ' &middot; ' + navLabel + '</div>' +
        '</div>' +
        '<div class="admin-row__actions">' +
          '<button type="button" class="icon-btn js-edit" aria-label="Edit">' + icon('edit') + '</button>' +
          '<button type="button" class="icon-btn icon-btn--danger js-delete" aria-label="Delete">' + icon('delete') + '</button>' +
        '</div>' +
      '</div>'
    );
  }

  async function renderList() {
    var items = (await window.HM.customPages.getAll()).sort(function (a, b) {
      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    });
    if (!items.length) {
      els.list.innerHTML = '<div class="empty-state">No extra pages yet. Click "Add Page" to create your first one.</div>';
      return;
    }
    els.list.innerHTML = items.map(rowTemplate).join('');

    els.list.querySelectorAll('.js-edit').forEach(function (btn) {
      btn.addEventListener('click', async function () {
        var id = btn.closest('.admin-row').getAttribute('data-id');
        openModal(await window.HM.customPages.getById(id));
      });
    });
    els.list.querySelectorAll('.js-delete').forEach(function (btn) {
      btn.addEventListener('click', async function () {
        var id = btn.closest('.admin-row').getAttribute('data-id');
        var page = await window.HM.customPages.getById(id);
        var confirmed = await window.HM.ui.confirmDialog({
          title: 'Delete this page?',
          message: '"' + page.title + '" will be permanently removed from the website and the menu.',
          confirmLabel: 'Delete'
        });
        if (!confirmed) return;
        try {
          await window.HM.customPages.delete(id);
          await window.HM.util.deleteImage(page.image);
          await window.HM.activity.log('Deleted page "' + page.title + '"');
          window.HM.ui.toast('Page deleted.', 'success');
          renderList();
        } catch (err) {
          window.HM.ui.toast('Could not delete this page. Please try again.', 'danger');
        }
      });
    });
  }

  function resetForm() {
    editingId = null;
    originalImage = '';
    els.form.reset();
    document.getElementById('pageShowInNav').checked = true;
    imageUpload.reset('');
    els.modalTitle.textContent = 'Add Page';
    els.submitBtn.textContent = 'Save Page';
  }

  function openModal(page) {
    resetForm();
    if (page) {
      editingId = page.id;
      originalImage = page.image || '';
      document.getElementById('pageTitleInput').value = page.title || '';
      document.getElementById('pageContentInput').value = page.content || '';
      document.getElementById('pageShowInNav').checked = !!page.showInNav;
      imageUpload.reset(page.image || '');
      els.modalTitle.textContent = 'Edit Page';
      els.submitBtn.textContent = 'Save Changes';
    }
    els.modal.classList.add('is-open');
  }

  function closeModal() {
    els.modal.classList.remove('is-open');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    var title = document.getElementById('pageTitleInput').value.trim();

    els.submitBtn.disabled = true;

    try {
      var data = {
        title: title,
        content: document.getElementById('pageContentInput').value.trim(),
        image: imageUpload.getValue() || '',
        showInNav: document.getElementById('pageShowInNav').checked
      };

      if (editingId) {
        await window.HM.customPages.update(editingId, data);
        if (originalImage && originalImage !== data.image) {
          await window.HM.util.deleteImage(originalImage);
        }
        await window.HM.activity.log('Updated page "' + data.title + '"');
        window.HM.ui.toast('Page updated successfully.', 'success');
      } else {
        data.slug = await window.HM.customPages.generateUniqueSlug(title);
        await window.HM.customPages.add(data);
        await window.HM.activity.log('Created page "' + data.title + '"');
        window.HM.ui.toast('Page created successfully.', 'success');
      }
      closeModal();
      renderList();
    } catch (err) {
      window.HM.ui.toast('Could not save this page. Please try again.', 'danger');
    } finally {
      els.submitBtn.disabled = false;
    }
  }

  function init() {
    els.list = document.getElementById('pagesList');
    els.modal = document.getElementById('pageModal');
    els.modalTitle = document.getElementById('pageModalTitle');
    els.form = document.getElementById('pageForm');
    els.submitBtn = document.getElementById('pageSubmitBtn');

    imageUpload = window.HM.admin.wireImageUpload(document.getElementById('pageImageUpload'), '', function () {}, 'pages');

    document.getElementById('addPageBtn').addEventListener('click', function () { openModal(null); });
    document.getElementById('pageModalClose').addEventListener('click', closeModal);
    document.getElementById('pageModalCancel').addEventListener('click', closeModal);
    els.modal.addEventListener('click', function (e) { if (e.target === els.modal) closeModal(); });
    els.form.addEventListener('submit', handleSubmit);

    renderList();
  }

  window.HM.ready(init);
})(window, document);
