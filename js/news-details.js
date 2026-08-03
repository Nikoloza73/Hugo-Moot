/* ==========================================================================
   News details page: reads ?id= from the URL and renders the full article.
   ========================================================================== */

(function (window, document) {
  'use strict';

  function getIdFromUrl() {
    var params = new URLSearchParams(window.location.search);
    return params.get('id');
  }

  function relatedCardTemplate(article) {
    var esc = window.HM.util.escapeHtml;
    var url = 'news-details.html?id=' + encodeURIComponent(article.id);
    return (
      '<article class="card card--link">' +
        '<a class="card__media" href="' + url + '" tabindex="-1" aria-hidden="true">' +
          '<img src="' + window.HM.util.resolveImage(article.image) + '" alt="' + esc(article.title) + '" loading="lazy">' +
        '</a>' +
        '<div class="card__body">' +
          '<div class="card__meta"><span>' + esc(article.category || 'News') + '</span><span aria-hidden="true">&middot;</span><time>' + window.HM.util.formatDate(article.date, 'short') + '</time></div>' +
          '<h3 class="card__title"><a href="' + url + '">' + esc(article.title) + '</a></h3>' +
        '</div>' +
      '</article>'
    );
  }

  function renderNotFound() {
    document.getElementById('articleRoot').innerHTML =
      '<div class="container section-tight text-center">' +
        '<h1>Article Not Found</h1>' +
        '<p class="muted" style="margin-bottom: var(--space-md);">The news article you are looking for does not exist or may have been removed.</p>' +
        '<a href="../index.html#news" class="btn btn-primary">Back to News</a>' +
      '</div>';
  }

  async function renderArticle(article) {
    var esc = window.HM.util.escapeHtml;
    document.getElementById('pageTitle').textContent = article.title + ' | Hugo Moot';

    var gallery = (article.gallery || []).map(function (src) {
      return '<img src="' + window.HM.util.resolveImage(src) + '" alt="' + esc(article.title) + ' — additional photo" loading="lazy">';
    }).join('');

    var related = await window.HM.news.getRelated(article.id, 3);

    var html =
      '<div class="article-hero">' +
        '<img src="' + window.HM.util.resolveImage(article.image) + '" alt="' + esc(article.title) + '">' +
      '</div>' +
      '<div class="container article-header">' +
        '<a href="../index.html#news" class="back-link">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg>' +
          'Back to News' +
        '</a>' +
        '<div class="article-meta">' +
          '<span class="badge">' + esc(article.category || 'News') + '</span>' +
          '<time datetime="' + esc(article.date) + '">' + window.HM.util.formatDate(article.date) + '</time>' +
        '</div>' +
        '<h1>' + esc(article.title) + '</h1>' +
      '</div>' +
      '<div class="container section-tight">' +
        '<div class="article-body">' + window.HM.util.paragraphs(article.content || article.summary) + '</div>' +
        (gallery ? '<div class="article-body"><div class="article-gallery">' + gallery + '</div></div>' : '') +
      '</div>' +
      (related.length ? (
        '<div class="container section-tight related-news">' +
          '<div class="section-heading"><span class="eyebrow">Continue Reading</span><h2>Related News</h2></div>' +
          '<div class="related-news__grid">' + related.map(relatedCardTemplate).join('') + '</div>' +
        '</div>'
      ) : '');

    document.getElementById('articleRoot').innerHTML = html;
  }

  async function init() {
    var id = getIdFromUrl();
    var article = id ? await window.HM.news.getById(id) : null;
    if (!article) {
      renderNotFound();
      return;
    }
    await renderArticle(article);
  }

  window.HM.ready(init);
})(window, document);
