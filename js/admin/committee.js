/* ==========================================================================
   Admin: Committee page management — intro text and member list.
   ========================================================================== */

(function (window, document) {
  'use strict';

  var els = {};
  var members = [];

  function memberRowTemplate(member, index) {
    var esc = window.HM.util.escapeHtml;
    return (
      '<div class="value-repeater__item" data-index="' + index + '">' +
        '<button type="button" class="value-repeater__remove js-remove-member" aria-label="Remove member">' +
          '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>' +
        '</button>' +
        '<div class="form-field">' +
          '<label>Photo</label>' +
          '<div class="image-upload js-member-image-upload">' +
            '<img class="image-upload__preview" style="display:none;">' +
            '<span class="image-upload__label">Click or drag to upload a photo</span>' +
            '<input type="file" accept="image/*">' +
          '</div>' +
        '</div>' +
        '<div class="form-field" style="margin-bottom:0;">' +
          '<label>Paragraph</label>' +
          '<textarea class="js-member-text" placeholder="Write this member&#39;s paragraph here.">' + esc(member.text) + '</textarea>' +
        '</div>' +
      '</div>'
    );
  }

  function renderMembers() {
    els.repeater.innerHTML = members.map(memberRowTemplate).join('');

    els.repeater.querySelectorAll('.value-repeater__item').forEach(function (item) {
      var index = Number(item.getAttribute('data-index'));
      window.HM.admin.wireImageUpload(item.querySelector('.js-member-image-upload'), members[index].photo || '', function (url) {
        members[index].photo = url;
      }, 'committee');
    });

    els.repeater.querySelectorAll('.js-remove-member').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var index = Number(btn.closest('.value-repeater__item').getAttribute('data-index'));
        syncMembersFromDom();
        members.splice(index, 1);
        renderMembers();
      });
    });
  }

  function syncMembersFromDom() {
    var items = els.repeater.querySelectorAll('.value-repeater__item');
    Array.prototype.forEach.call(items, function (item, i) {
      members[i].text = item.querySelector('.js-member-text').value.trim();
    });
  }

  async function loadData() {
    var committee = await window.HM.committee.get();
    document.getElementById('committeeIntroInput').value = committee.intro || '';
    members = (committee.members || []).map(function (m) {
      return { photo: m.photo || '', text: m.text || '' };
    });
    renderMembers();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    syncMembersFromDom();
    var cleanMembers = members.filter(function (m) { return m.photo || m.text; });

    var submitBtn = els.form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;

    try {
      await window.HM.committee.save({
        intro: document.getElementById('committeeIntroInput').value.trim(),
        members: cleanMembers
      });
      members = cleanMembers;
      await window.HM.activity.log('Updated Committee page content');
      window.HM.ui.toast('Committee page updated successfully.', 'success');
      renderMembers();
    } catch (err) {
      window.HM.ui.toast('Could not save changes. Please try again.', 'danger');
    } finally {
      submitBtn.disabled = false;
    }
  }

  function init() {
    els.repeater = document.getElementById('memberRepeater');
    els.form = document.getElementById('committeeForm');

    document.getElementById('addMemberBtn').addEventListener('click', function () {
      syncMembersFromDom();
      members.push({ photo: '', text: '' });
      renderMembers();
    });

    els.form.addEventListener('submit', handleSubmit);

    loadData();
  }

  window.HM.ready(init);
})(window, document);
