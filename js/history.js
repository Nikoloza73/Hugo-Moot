/* ==========================================================================
   History page: renders timeline from localStorage.
   ========================================================================== */

(function (window, document) {
  'use strict';

  function itemTemplate(item) {
    var esc = window.HM.util.escapeHtml;
    var img = window.HM.util.resolveImage(item.image);
    return (
      '<div class="timeline-item reveal">' +
        '<div class="timeline-item__media"><img src="' + img + '" alt="' + esc(item.title) + '" loading="lazy"></div>' +
        '<div class="timeline-item__content">' +
          '<span class="timeline-item__year">' + esc(item.year) + '</span>' +
          '<h3 class="timeline-item__title">' + esc(item.title) + '</h3>' +
          '<p class="timeline-item__desc">' + esc(item.description) + '</p>' +
        '</div>' +
      '</div>'
    );
  }

  async function render() {
    var wrap = document.getElementById('timeline');
    var items = await window.HM.history.getSorted();
    if (!items.length) {
      wrap.innerHTML = '<div class="empty-state">Historical milestones will appear here once added.</div>';
      return;
    }
    wrap.innerHTML = items.map(itemTemplate).join('');
    window.HM.ui.initScrollReveal();
  }

  window.HM.ready(render);
})(window, document);
