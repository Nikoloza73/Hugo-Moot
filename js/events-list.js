/* ==========================================================================
   Events page: lists every event grouped by year, newest year first.
   ========================================================================== */

(function (window, document) {
  'use strict';

  function eventCardTemplate(event) {
    var esc = window.HM.util.escapeHtml;
    var url = 'event-details.html?id=' + encodeURIComponent(event.id);
    return (
      '<a class="event-card reveal" href="' + url + '">' +
        '<div class="event-card__media"><img src="' + window.HM.util.resolveImage(event.coverImage) + '" alt="' + esc(event.name) + '" loading="lazy"></div>' +
        '<div class="event-card__body">' +
          '<div class="event-card__date">' + window.HM.util.formatDate(event.date, 'short') + '</div>' +
          '<h3 class="event-card__name">' + esc(event.name) + '</h3>' +
          '<p class="event-card__desc">' + esc(event.description) + '</p>' +
          '<span class="btn-text">View Event →</span>' +
        '</div>' +
      '</a>'
    );
  }

  function groupByYear(events) {
    var order = [];
    var groups = {};
    events.forEach(function (event) {
      var year = event.year || 'Undated';
      if (!groups[year]) {
        groups[year] = [];
        order.push(year);
      }
      groups[year].push(event);
    });
    return order.map(function (year) { return { year: year, events: groups[year] }; });
  }

  function yearGroupTemplate(group) {
    var esc = window.HM.util.escapeHtml;
    return (
      '<div class="year-group">' +
        '<h2 class="year-group__heading">' + esc(group.year) + '</h2>' +
        '<div class="year-group__grid">' + group.events.map(eventCardTemplate).join('') + '</div>' +
      '</div>'
    );
  }

  async function render() {
    var wrap = document.getElementById('eventsByYear');
    var events;
    try {
      events = await window.HM.events.getSorted();
    } catch (err) {
      console.error('HM: failed to load events', err);
      wrap.innerHTML = '<div class="empty-state">Events could not be loaded. Please try again later.</div>';
      return;
    }

    if (!events.length) {
      wrap.innerHTML = '<div class="empty-state">No events yet. Check back soon.</div>';
      return;
    }

    var groups = groupByYear(events);
    wrap.innerHTML = groups.map(yearGroupTemplate).join('');
    window.HM.ui.initScrollReveal();
  }

  window.HM.ready(render);
})(window, document);
