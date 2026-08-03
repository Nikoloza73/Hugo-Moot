/* ==========================================================================
   Admin: About Us management — description, mission, vision, values.
   ========================================================================== */

(function (window, document) {
  'use strict';

  var els = {};
  var values = [];

  function valueRowTemplate(value, index) {
    var esc = window.HM.util.escapeHtml;
    return (
      '<div class="value-repeater__item" data-index="' + index + '">' +
        '<button type="button" class="value-repeater__remove js-remove-value" aria-label="Remove value">' +
          '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>' +
        '</button>' +
        '<div class="form-field">' +
          '<label>Value Title</label>' +
          '<input type="text" class="js-value-title" value="' + esc(value.title) + '" placeholder="e.g. Integrity">' +
        '</div>' +
        '<div class="form-field" style="margin-bottom:0;">' +
          '<label>Short Description</label>' +
          '<input type="text" class="js-value-desc" value="' + esc(value.description) + '" placeholder="One sentence describing this value.">' +
        '</div>' +
      '</div>'
    );
  }

  function renderValues() {
    els.repeater.innerHTML = values.map(valueRowTemplate).join('');
    els.repeater.querySelectorAll('.js-remove-value').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var index = Number(btn.closest('.value-repeater__item').getAttribute('data-index'));
        syncValuesFromDom();
        values.splice(index, 1);
        renderValues();
      });
    });
  }

  function syncValuesFromDom() {
    var items = els.repeater.querySelectorAll('.value-repeater__item');
    values = Array.prototype.map.call(items, function (item) {
      return {
        title: item.querySelector('.js-value-title').value.trim(),
        description: item.querySelector('.js-value-desc').value.trim()
      };
    });
  }

  function loadData() {
    var about = window.HM.about.get();
    document.getElementById('aboutIntroInput').value = about.intro || '';
    document.getElementById('aboutMissionInput').value = about.mission || '';
    document.getElementById('aboutVisionInput').value = about.vision || '';
    values = (about.values || []).slice();
    renderValues();
  }

  function handleSubmit(e) {
    e.preventDefault();
    syncValuesFromDom();
    values = values.filter(function (v) { return v.title || v.description; });

    window.HM.about.save({
      intro: document.getElementById('aboutIntroInput').value.trim(),
      mission: document.getElementById('aboutMissionInput').value.trim(),
      vision: document.getElementById('aboutVisionInput').value.trim(),
      values: values
    });

    window.HM.activity.log('Updated About Us content');
    window.HM.ui.toast('About Us page updated successfully.', 'success');
    renderValues();
  }

  function init() {
    els.repeater = document.getElementById('valueRepeater');

    document.getElementById('addValueBtn').addEventListener('click', function () {
      syncValuesFromDom();
      values.push({ title: '', description: '' });
      renderValues();
    });

    document.getElementById('aboutForm').addEventListener('submit', handleSubmit);

    loadData();
  }

  window.HM.ready(init);
})(window, document);
