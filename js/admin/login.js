/* ==========================================================================
   Admin login — real Supabase Auth (email + password).
   ========================================================================== */

(function (window, document) {
  'use strict';

  function showError(message) {
    var el = document.getElementById('loginError');
    el.textContent = message;
    el.style.display = 'block';
  }

  function hideError() {
    document.getElementById('loginError').style.display = 'none';
  }

  async function init() {
    if (await window.HM.auth.isLoggedIn()) {
      window.location.href = 'dashboard.html';
      return;
    }

    var form = document.getElementById('loginForm');
    var submitBtn = document.getElementById('loginSubmitBtn');

    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      hideError();
      submitBtn.disabled = true;
      submitBtn.textContent = 'Logging in…';

      var email = document.getElementById('loginEmail').value.trim();
      var password = document.getElementById('loginPass').value;

      try {
        await window.HM.auth.login(email, password);
        window.location.href = 'dashboard.html';
      } catch (err) {
        showError(err.message === 'Invalid login credentials'
          ? 'Incorrect email or password.'
          : 'Login failed: ' + err.message);
        submitBtn.disabled = false;
        submitBtn.textContent = 'Log In';
      }
    });
  }

  window.HM.ready(init);
})(window, document);
