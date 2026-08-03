/* ==========================================================================
   Admin login (UI only — no real authentication).
   ========================================================================== */

(function (window, document) {
  'use strict';

  function init() {
    if (window.HM.auth.isLoggedIn()) {
      window.location.href = 'dashboard.html';
      return;
    }

    var form = document.getElementById('loginForm');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      window.HM.auth.login();
      window.location.href = 'dashboard.html';
    });
  }

  window.HM.ready(init);
})(window, document);
