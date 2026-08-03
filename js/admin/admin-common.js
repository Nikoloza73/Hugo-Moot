/* ==========================================================================
   Admin panel shared behavior: auth guard, sidebar, logout, small helpers.
   Loaded on every admin page except login.html.
   ========================================================================== */

(function (window, document) {
  'use strict';

  function guardAuth() {
    if (!window.HM.auth.isLoggedIn()) {
      window.location.href = 'login.html';
    }
  }

  function initSidebar() {
    var toggle = document.getElementById('adminMobileToggle');
    var sidebar = document.getElementById('adminSidebar');
    var overlay = document.getElementById('sidebarOverlay');
    if (!toggle || !sidebar) return;

    function close() {
      sidebar.classList.remove('is-open');
      if (overlay) overlay.classList.remove('is-open');
    }
    function open() {
      sidebar.classList.add('is-open');
      if (overlay) overlay.classList.add('is-open');
    }

    toggle.addEventListener('click', function () {
      if (sidebar.classList.contains('is-open')) close(); else open();
    });
    if (overlay) overlay.addEventListener('click', close);
  }

  function initActiveLink() {
    var page = document.body.getAttribute('data-page');
    document.querySelectorAll('.admin-nav__link[data-page]').forEach(function (link) {
      if (link.getAttribute('data-page') === page) {
        link.classList.add('is-active');
      }
    });
  }

  function initLogout() {
    var btn = document.getElementById('logoutBtn');
    if (!btn) return;
    btn.addEventListener('click', function () {
      window.HM.auth.logout();
      window.location.href = 'login.html';
    });
  }

  /* ---- Image upload helper -------------------------------------------
     Wires a .image-upload control: <div class="image-upload"><input type="file">…</div>
     `getValue`/`setValue` let the caller keep the current data-URL in sync.
  --------------------------------------------------------------------- */

  function wireImageUpload(container, initialSrc, onChange) {
    var input = container.querySelector('input[type="file"]');
    var preview = container.querySelector('.image-upload__preview');
    var label = container.querySelector('.image-upload__label');
    var current = initialSrc || '';

    function renderPreview() {
      if (current) {
        if (!preview) {
          preview = document.createElement('img');
          preview.className = 'image-upload__preview';
          container.insertBefore(preview, container.firstChild);
        }
        preview.src = window.HM.util.resolveImage(current);
        preview.style.display = 'block';
        if (label) label.textContent = 'Click or drag to replace image';
      } else if (preview) {
        preview.style.display = 'none';
        if (label) label.textContent = 'Click or drag to upload an image';
      }
    }

    input.addEventListener('change', function () {
      var file = input.files && input.files[0];
      if (!file) return;
      window.HM.util.fileToDataUrl(file, function (dataUrl) {
        if (!dataUrl) return;
        current = dataUrl;
        renderPreview();
        onChange(dataUrl);
      });
    });

    renderPreview();

    return {
      getValue: function () { return current; },
      reset: function (src) { current = src || ''; renderPreview(); }
    };
  }

  window.HM.admin = {
    guardAuth: guardAuth,
    initSidebar: initSidebar,
    initActiveLink: initActiveLink,
    initLogout: initLogout,
    wireImageUpload: wireImageUpload
  };

  guardAuth();
  window.HM.ready(function () {
    initSidebar();
    initActiveLink();
    initLogout();
  });
})(window, document);
