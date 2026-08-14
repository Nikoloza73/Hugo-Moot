/* ==========================================================================
   Home page: renders latest news cards from localStorage.
   ========================================================================== */

(function (window, document) {
  'use strict';

  function newsCardTemplate(article) {
    var img = window.HM.util.resolveImage(article.image);
    var url = 'pages/news-details.html?id=' + encodeURIComponent(article.id);
    var esc = window.HM.util.escapeHtml;
    return (
      '<article class="card card--link reveal">' +
        '<a class="card__media" href="' + url + '" tabindex="-1" aria-hidden="true">' +
          '<img src="' + img + '" alt="' + esc(article.title) + '" loading="lazy">' +
        '</a>' +
        '<div class="card__body">' +
          '<div class="card__meta">' +
            '<span>' + esc(article.category || 'News') + '</span>' +
            '<span aria-hidden="true">&middot;</span>' +
            '<time datetime="' + esc(article.date) + '">' + window.HM.util.formatDate(article.date, 'short') + '</time>' +
          '</div>' +
          '<h3 class="card__title"><a href="' + url + '">' + esc(article.title) + '</a></h3>' +
          '<p class="card__excerpt">' + esc(article.summary) + '</p>' +
          '<span class="btn-text">Read More →</span>' +
        '</div>' +
      '</article>'
    );
  }

  async function renderLatestNews() {
    var grid = document.getElementById('latestNewsGrid');
    if (!grid) return;
    var items = await window.HM.news.getLatest(6);

    if (!items.length) {
      grid.innerHTML = '<div class="empty-state">No news articles yet. Check back soon.</div>';
      return;
    }

    grid.innerHTML = items.map(newsCardTemplate).join('');
    window.HM.ui.initScrollReveal();
  }

  function eventCardTemplate(event) {
    var esc = window.HM.util.escapeHtml;
    var url = 'pages/gallery.html?event=' + encodeURIComponent(event.id);
    return (
      '<a class="event-card reveal" href="' + url + '">' +
        '<div class="event-card__media"><img src="' + window.HM.util.resolveImage(event.coverImage) + '" alt="' + esc(event.name) + '" loading="lazy"></div>' +
        '<div class="event-card__body">' +
          '<div class="event-card__year">' + esc(event.year) + '</div>' +
          '<h3 class="event-card__name">' + esc(event.name) + '</h3>' +
          '<div class="event-card__date">' + window.HM.util.formatDate(event.date, 'short') + '</div>' +
          '<p class="event-card__desc">' + esc(event.description) + '</p>' +
          '<span class="btn-text">View Event Photos →</span>' +
        '</div>' +
      '</a>'
    );
  }

  async function renderEvents() {
    var grid = document.getElementById('eventsGrid');
    if (!grid) return;
    var items = (await window.HM.events.getSorted()).slice(0, 4);

    if (!items.length) {
      grid.innerHTML = '<div class="empty-state">No events yet. Check back soon.</div>';
      return;
    }

    grid.innerHTML = items.map(eventCardTemplate).join('');
    window.HM.ui.initScrollReveal();
  }

  function fillIfPresent(id, value) {
    if (!value) return;
    document.getElementById(id).textContent = value;
  }

  async function renderHomeContent() {
    var content;
    try {
      content = await window.HM.home.get();
    } catch (err) {
      console.error('HM: failed to load homepage content', err);
      return;
    }
    if (!content) return;

    fillIfPresent('heroEyebrow', content.heroEyebrow);
    fillIfPresent('heroHeading', content.heroHeading);
    fillIfPresent('heroText', content.heroText);
    fillIfPresent('heroPrimaryBtn', content.heroPrimaryBtn);
    fillIfPresent('heroSecondaryBtn', content.heroSecondaryBtn);
    fillIfPresent('introEyebrow', content.introEyebrow);
    fillIfPresent('introHeading', content.introHeading);
    fillIfPresent('introLead', content.introLead);
    if (content.introBody) {
      document.getElementById('introBody').innerHTML = window.HM.util.paragraphs(content.introBody);
    }
  }

  window.HM.ready(function () {
    renderLatestNews();
    renderEvents();
    renderHomeContent();
  });
})(window, document);
