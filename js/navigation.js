/* ==========================================================================
   Site header behavior: sticky shadow, mobile menu, active link.
   ========================================================================== */

(function (window, document) {
  'use strict';

  function initHeaderScroll() {
    var header = document.querySelector('.site-header');
    if (!header) return;
    function onScroll() {
      header.classList.toggle('is-scrolled', window.scrollY > 8);
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  function initMobileMenu() {
    var toggle = document.querySelector('.nav-toggle');
    var nav = document.querySelector('.main-nav');
    if (!toggle || !nav) return;

    function close() {
      toggle.classList.remove('is-open');
      nav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }

    function open() {
      toggle.classList.add('is-open');
      nav.classList.add('is-open');
      toggle.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    }

    toggle.addEventListener('click', function () {
      var isOpen = nav.classList.contains('is-open');
      if (isOpen) close(); else open();
    });

    nav.querySelectorAll('.main-nav__link').forEach(function (link) {
      link.addEventListener('click', close);
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 900) close();
    });
  }

  function initActiveLink() {
    var page = document.body.getAttribute('data-page');
    if (!page) return;
    document.querySelectorAll('.main-nav__link[data-page]').forEach(function (link) {
      if (link.getAttribute('data-page') === page) {
        link.classList.add('is-active');
        link.setAttribute('aria-current', 'page');
      }
    });
  }

  window.HM.ready(function () {
    initHeaderScroll();
    initMobileMenu();
    initActiveLink();
  });
})(window, document);
