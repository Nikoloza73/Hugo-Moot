/* ==========================================================================
   Generic custom page template: reads ?slug= from the URL and renders
   whatever page the admin created under that slug.
   ========================================================================== */

(function (window, document) {
  'use strict';

  function getSlugFromUrl() {
    return new URLSearchParams(window.location.search).get('slug');
  }

  function renderNotFound() {
    document.getElementById('pageHeading').textContent = 'Page Not Found';
    document.getElementById('pageBreadcrumb').textContent = 'Not Found';
    document.getElementById('pageBody').innerHTML =
      '<p class="muted" style="margin-bottom: var(--space-md);">The page you are looking for does not exist or may have been removed.</p>' +
      '<a href="../index.html" class="btn btn-primary">Back to Home</a>';
  }

  function renderPage(page) {
    var esc = window.HM.util.escapeHtml;
    document.getElementById('docTitle').textContent = page.title + ' | Hugo Moot';
    document.getElementById('pageHeading').textContent = page.title;
    document.getElementById('pageBreadcrumb').textContent = page.title;

    var imageHtml = page.image
      ? '<img class="page-featured-image" src="' + window.HM.util.resolveImage(page.image) + '" alt="' + esc(page.title) + '">'
      : '';

    document.getElementById('pageBody').innerHTML = imageHtml + window.HM.util.paragraphs(page.content);
  }

  async function init() {
    var slug = getSlugFromUrl();
    var page = null;
    try {
      page = slug ? await window.HM.customPages.getBySlug(slug) : null;
    } catch (err) {
      console.error('HM: failed to load page', err);
    }
    if (!page) {
      renderNotFound();
      return;
    }
    renderPage(page);
  }

  window.HM.ready(init);
})(window, document);
