/* ==========================================================================
   Populates footer & header brand text from Website Settings (localStorage)
   so admin edits to org name / contact / social links propagate everywhere.
   ========================================================================== */

(function (window, document) {
  'use strict';

  function fillText(selector, value) {
    document.querySelectorAll(selector).forEach(function (el) {
      if (value) el.textContent = value;
    });
  }

  function fillHref(selector, value) {
    document.querySelectorAll(selector).forEach(function (el) {
      if (value) el.setAttribute('href', value);
    });
  }

  function applySettings() {
    var settings = window.HM.settings.get();
    if (!settings) return;

    fillText('[data-settings="orgName"]', settings.orgName);
    fillText('[data-settings="tagline"]', settings.tagline);
    fillText('[data-settings="footerText"]', settings.footerText);
    fillText('[data-settings="email"]', settings.email);
    fillText('[data-settings="phone"]', settings.phone);
    fillText('[data-settings="address"]', settings.address);
    fillText('[data-settings="year"]', new Date().getFullYear());

    if (settings.email) {
      fillHref('[data-settings-href="email"]', 'mailto:' + settings.email);
    }
    if (settings.phone) {
      fillHref('[data-settings-href="phone"]', 'tel:' + settings.phone.replace(/[^+\d]/g, ''));
    }

    if (settings.social) {
      Object.keys(settings.social).forEach(function (key) {
        var url = settings.social[key];
        var links = document.querySelectorAll('[data-social="' + key + '"]');
        links.forEach(function (link) {
          if (!url) {
            link.style.display = 'none';
          } else {
            link.setAttribute('href', url);
          }
        });
      });
    }

    if (settings.logo) {
      document.querySelectorAll('[data-settings-logo]').forEach(function (wrap) {
        wrap.innerHTML = '<img src="' + window.HM.util.resolveImage(settings.logo) + '" alt="' + window.HM.util.escapeHtml(settings.orgName || 'Logo') + '" style="width:100%;height:100%;object-fit:contain;">';
      });
    }
  }

  window.HM.ready(applySettings);
})(window, document);
