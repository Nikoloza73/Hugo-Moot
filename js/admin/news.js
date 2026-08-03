/* ==========================================================================
   Admin: News management (add / edit / delete).
   ========================================================================== */

(function (window, document) {
  'use strict';

  var els = {};
  var featuredUpload = null;
  var galleryImages = [];
  var editingId = null;

  function icon(name) {
    if (name === 'edit') {
      return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>';
    }
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></svg>';
  }

  function rowTemplate(article) {
    var esc = window.HM.util.escapeHtml;
    return (
      '<div class="admin-row" data-id="' + article.id + '">' +
        '<div class="admin-row__thumb"><img src="' + window.HM.util.resolveImage(article.image) + '" alt=""></div>' +
        '<div class="admin-row__body">' +
          '<div class="admin-row__title">' + esc(article.title) + '</div>' +
          '<div class="admin-row__meta">' + window.HM.util.formatDate(article.date, 'short') + ' &middot; ' + esc(article.category || 'News') + '</div>' +
        '</div>' +
        '<div class="admin-row__actions">' +
          '<button type="button" class="icon-btn js-edit" aria-label="Edit">' + icon('edit') + '</button>' +
          '<button type="button" class="icon-btn icon-btn--danger js-delete" aria-label="Delete">' + icon('delete') + '</button>' +
        '</div>' +
      '</div>'
    );
  }

  function renderList() {
    var items = window.HM.news.getAll().slice().sort(function (a, b) { return new Date(b.date) - new Date(a.date); });
    if (!items.length) {
      els.list.innerHTML = '<div class="empty-state">No news articles yet. Click "Add News" to publish your first one.</div>';
      return;
    }
    els.list.innerHTML = items.map(rowTemplate).join('');

    els.list.querySelectorAll('.js-edit').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.closest('.admin-row').getAttribute('data-id');
        openModal(window.HM.news.getById(id));
      });
    });
    els.list.querySelectorAll('.js-delete').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var row = btn.closest('.admin-row');
        var id = row.getAttribute('data-id');
        var article = window.HM.news.getById(id);
        window.HM.ui.confirmDialog({
          title: 'Delete this article?',
          message: '"' + article.title + '" will be permanently removed from the website.',
          confirmLabel: 'Delete'
        }).then(function (confirmed) {
          if (!confirmed) return;
          window.HM.news.delete(id);
          window.HM.activity.log('Deleted news article "' + article.title + '"');
          window.HM.ui.toast('Article deleted.', 'success');
          renderList();
        });
      });
    });
  }

  function renderGalleryPreview() {
    els.galleryPreview.innerHTML = galleryImages.map(function (src, i) {
      return (
        '<div class="admin-gallery-item">' +
          '<div class="admin-gallery-item__img"><img src="' + window.HM.util.resolveImage(src) + '" alt=""></div>' +
          '<button type="button" class="admin-gallery-item__delete js-remove-gallery-img" data-index="' + i + '" aria-label="Remove image">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>' +
          '</button>' +
        '</div>'
      );
    }).join('');

    els.galleryPreview.querySelectorAll('.js-remove-gallery-img').forEach(function (btn) {
      btn.addEventListener('click', function () {
        galleryImages.splice(Number(btn.getAttribute('data-index')), 1);
        renderGalleryPreview();
      });
    });
  }

  function resetForm() {
    editingId = null;
    els.form.reset();
    galleryImages = [];
    renderGalleryPreview();
    featuredUpload.reset('');
    els.modalTitle.textContent = 'Add News Article';
    els.submitBtn.textContent = 'Publish News';
  }

  function openModal(article) {
    resetForm();
    if (article) {
      editingId = article.id;
      document.getElementById('newsTitle').value = article.title || '';
      document.getElementById('newsDate').value = article.date || '';
      document.getElementById('newsCategory').value = article.category || '';
      document.getElementById('newsSummary').value = article.summary || '';
      document.getElementById('newsContent').value = article.content || '';
      featuredUpload.reset(article.image || '');
      galleryImages = (article.gallery || []).slice();
      renderGalleryPreview();
      els.modalTitle.textContent = 'Edit News Article';
      els.submitBtn.textContent = 'Save Changes';
    } else {
      document.getElementById('newsDate').value = new Date().toISOString().slice(0, 10);
    }
    els.modal.classList.add('is-open');
  }

  function closeModal() {
    els.modal.classList.remove('is-open');
  }

  function handleSubmit(e) {
    e.preventDefault();
    var data = {
      title: document.getElementById('newsTitle').value.trim(),
      date: document.getElementById('newsDate').value,
      category: document.getElementById('newsCategory').value.trim() || 'News',
      summary: document.getElementById('newsSummary').value.trim(),
      content: document.getElementById('newsContent').value.trim(),
      image: featuredUpload.getValue() || 'images/placeholder-card.svg',
      gallery: galleryImages.slice()
    };

    if (editingId) {
      window.HM.news.update(editingId, data);
      window.HM.activity.log('Updated news article "' + data.title + '"');
      window.HM.ui.toast('Article updated successfully.', 'success');
    } else {
      window.HM.news.add(data);
      window.HM.activity.log('Published news article "' + data.title + '"');
      window.HM.ui.toast('Article published successfully.', 'success');
    }

    closeModal();
    renderList();
  }

  function initGalleryUpload() {
    var input = els.galleryUpload.querySelector('input[type="file"]');
    input.addEventListener('change', function () {
      var files = Array.prototype.slice.call(input.files || []);
      files.forEach(function (file) {
        window.HM.util.fileToDataUrl(file, function (dataUrl) {
          if (!dataUrl) return;
          galleryImages.push(dataUrl);
          renderGalleryPreview();
        });
      });
      input.value = '';
    });
  }

  function init() {
    els.list = document.getElementById('newsList');
    els.modal = document.getElementById('newsModal');
    els.modalTitle = document.getElementById('newsModalTitle');
    els.form = document.getElementById('newsForm');
    els.submitBtn = document.getElementById('newsSubmitBtn');
    els.galleryUpload = document.getElementById('newsGalleryUpload');
    els.galleryPreview = document.getElementById('newsGalleryPreview');

    featuredUpload = window.HM.admin.wireImageUpload(document.getElementById('newsImageUpload'), '', function () {});

    document.getElementById('addNewsBtn').addEventListener('click', function () { openModal(null); });
    document.getElementById('newsModalClose').addEventListener('click', closeModal);
    document.getElementById('newsModalCancel').addEventListener('click', closeModal);
    els.modal.addEventListener('click', function (e) { if (e.target === els.modal) closeModal(); });
    els.form.addEventListener('submit', handleSubmit);
    initGalleryUpload();

    renderList();
  }

  window.HM.ready(init);
})(window, document);
