/* ==========================================================================
   Shared UI helpers: toasts, confirm dialogs, scroll reveal.
   Depends on: data-store.js (window.HM)
   ========================================================================== */

(function (window, document) {
  'use strict';

  function ensureToastStack() {
    var stack = document.querySelector('.toast-stack');
    if (!stack) {
      stack = document.createElement('div');
      stack.className = 'toast-stack';
      stack.setAttribute('aria-live', 'polite');
      document.body.appendChild(stack);
    }
    return stack;
  }

  function toast(message, type, duration) {
    var stack = ensureToastStack();
    var el = document.createElement('div');
    el.className = 'toast' + (type ? ' toast--' + type : '');
    el.textContent = message;
    stack.appendChild(el);
    window.setTimeout(function () {
      el.style.opacity = '0';
      el.style.transition = 'opacity 200ms ease';
      window.setTimeout(function () { el.remove(); }, 200);
    }, duration || 3200);
  }

  function ensureConfirmModal() {
    var overlay = document.querySelector('.js-confirm-overlay');
    if (overlay) return overlay;

    overlay = document.createElement('div');
    overlay.className = 'modal-overlay js-confirm-overlay';
    overlay.innerHTML =
      '<div class="modal" role="alertdialog" aria-modal="true" aria-labelledby="confirmTitle">' +
      '<h3 id="confirmTitle" class="js-confirm-title">Are you sure?</h3>' +
      '<p class="js-confirm-message">This action cannot be undone.</p>' +
      '<div class="modal__actions">' +
      '<button type="button" class="btn btn-secondary js-confirm-cancel">Cancel</button>' +
      '<button type="button" class="btn btn-primary js-confirm-ok">Delete</button>' +
      '</div></div>';
    document.body.appendChild(overlay);
    return overlay;
  }

  function confirmDialog(options) {
    return new Promise(function (resolve) {
      var overlay = ensureConfirmModal();
      overlay.querySelector('.js-confirm-title').textContent = (options && options.title) || 'Are you sure?';
      overlay.querySelector('.js-confirm-message').textContent = (options && options.message) || 'This action cannot be undone.';
      var okBtn = overlay.querySelector('.js-confirm-ok');
      okBtn.textContent = (options && options.confirmLabel) || 'Delete';
      var cancelBtn = overlay.querySelector('.js-confirm-cancel');

      function close(result) {
        overlay.classList.remove('is-open');
        okBtn.removeEventListener('click', onOk);
        cancelBtn.removeEventListener('click', onCancel);
        overlay.removeEventListener('click', onOverlay);
        document.removeEventListener('keydown', onKey);
        resolve(result);
      }
      function onOk() { close(true); }
      function onCancel() { close(false); }
      function onOverlay(e) { if (e.target === overlay) close(false); }
      function onKey(e) { if (e.key === 'Escape') close(false); }

      okBtn.addEventListener('click', onOk);
      cancelBtn.addEventListener('click', onCancel);
      overlay.addEventListener('click', onOverlay);
      document.addEventListener('keydown', onKey);

      requestAnimationFrame(function () { overlay.classList.add('is-open'); });
    });
  }

  function initScrollReveal() {
    var items = document.querySelectorAll('.reveal');
    if (!items.length) return;
    if (!('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    items.forEach(function (el) { observer.observe(el); });
  }

  function ready(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  window.HM = window.HM || {};
  window.HM.ready = ready;
  window.HM.ui = {
    toast: toast,
    confirmDialog: confirmDialog,
    initScrollReveal: initScrollReveal
  };

  ready(initScrollReveal);
})(window, document);
