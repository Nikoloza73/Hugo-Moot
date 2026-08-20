/* ==========================================================================
   Committee page: renders the intro paragraph and member list.
   ========================================================================== */

(function (window, document) {
  'use strict';

  function renderMembers(members) {
    var esc = window.HM.util.escapeHtml;
    var resolveImage = window.HM.util.resolveImage;
    var list = document.getElementById('committeeList');

    if (!members.length) {
      list.innerHTML = '<div class="empty-state">Committee members will appear here once added.</div>';
      return;
    }

    list.innerHTML = members.map(function (member) {
      return (
        '<div class="committee-member reveal">' +
          '<img class="committee-member__photo" src="' + resolveImage(member.photo) + '" alt="">' +
          '<div class="committee-member__text">' + window.HM.util.paragraphs(member.text) + '</div>' +
        '</div>'
      );
    }).join('');
  }

  async function init() {
    var committee = await window.HM.committee.get();
    document.getElementById('committeeIntro').innerHTML = window.HM.util.paragraphs(committee.intro);
    renderMembers(committee.members || []);
    window.HM.ui.initScrollReveal();
  }

  window.HM.ready(init);
})(window, document);
