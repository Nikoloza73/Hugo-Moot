/* ==========================================================================
   Admin dashboard: recent activity feed.
   ========================================================================== */

(function (window, document) {
  'use strict';

  function render() {
    var list = document.getElementById('activityList');
    var items = window.HM.activity.getRecent(8);
    if (!items.length) {
      list.innerHTML = '<li>No recent activity yet.</li>';
      return;
    }
    list.innerHTML = items.map(function (item) {
      return '<li><span>' + window.HM.util.escapeHtml(item.message) + '</span><time>' + window.HM.util.timeAgo(item.timestamp) + '</time></li>';
    }).join('');
  }

  window.HM.ready(render);
})(window, document);
