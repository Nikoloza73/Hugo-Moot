/* ==========================================================================
   Appends any admin-created custom pages (marked "Show in website menu")
   to the end of the main navigation, on every public page.
   ========================================================================== */

(function (window, document) {
  'use strict';

  function pageUrl(slug) {
    var inPagesDir = window.location.pathname.indexOf('/pages/') !== -1;
    return (inPagesDir ? '' : 'pages/') + 'page.html?slug=' + encodeURIComponent(slug);
  }

  async function injectNavItems() {
    var list = document.querySelector('.main-nav__list');
    if (!list) return;

    var items;
    try {
      items = await window.HM.customPages.getNavItems();
    } catch (err) {
      console.error('HM: failed to load nav pages', err);
      return;
    }
    if (!items.length) return;

    var currentSlug = new URLSearchParams(window.location.search).get('slug');

    items.forEach(function (item) {
      var li = document.createElement('li');
      var a = document.createElement('a');
      a.className = 'main-nav__link';
      a.href = pageUrl(item.slug);
      a.textContent = item.title;
      if (item.slug === currentSlug) {
        a.classList.add('is-active');
        a.setAttribute('aria-current', 'page');
      }
      li.appendChild(a);
      list.appendChild(li);
    });
  }

  window.HM.ready(injectNavItems);
})(window, document);
