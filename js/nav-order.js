/* ==========================================================================
   Reorders the main navigation's built-in links to match the admin-chosen
   order (site_settings.nav_order). Runs before custom-nav.js appends any
   owner-created pages, so those always stay at the end of the menu.
   ========================================================================== */

(function (window, document) {
  'use strict';

  async function applyNavOrder() {
    var list = document.querySelector('.main-nav__list');
    if (!list) return;

    var order;
    try {
      var settings = await window.HM.settings.get();
      order = settings.navOrder;
    } catch (err) {
      console.error('HM: failed to load nav order', err);
      return;
    }
    if (!order || !order.length) return;

    var byKey = {};
    Array.prototype.forEach.call(list.children, function (li) {
      var link = li.querySelector('[data-page]');
      if (link) byKey[link.getAttribute('data-page')] = li;
    });

    order.forEach(function (key) {
      if (byKey[key]) list.appendChild(byKey[key]);
    });
  }

  window.HM.ready(applyNavOrder);
})(window, document);
