/* ==========================================================================
   Admin: Home Page management — hero banner text.
   ========================================================================== */

(function (window, document) {
  'use strict';

  async function loadData() {
    var content = await window.HM.home.get();
    document.getElementById('heroEyebrowInput').value = content.heroEyebrow || '';
    document.getElementById('heroHeadingInput').value = content.heroHeading || '';
    document.getElementById('heroTextInput').value = content.heroText || '';
    document.getElementById('heroPrimaryBtnInput').value = content.heroPrimaryBtn || '';
    document.getElementById('heroSecondaryBtnInput').value = content.heroSecondaryBtn || '';
  }

  async function handleSubmit(e) {
    e.preventDefault();
    var submitBtn = document.querySelector('#homeForm button[type="submit"]');
    submitBtn.disabled = true;

    try {
      await window.HM.home.save({
        heroEyebrow: document.getElementById('heroEyebrowInput').value.trim(),
        heroHeading: document.getElementById('heroHeadingInput').value.trim(),
        heroText: document.getElementById('heroTextInput').value.trim(),
        heroPrimaryBtn: document.getElementById('heroPrimaryBtnInput').value.trim(),
        heroSecondaryBtn: document.getElementById('heroSecondaryBtnInput').value.trim()
      });

      await window.HM.activity.log('Updated homepage text');
      window.HM.ui.toast('Homepage updated successfully.', 'success');
    } catch (err) {
      window.HM.ui.toast('Could not save changes. Please try again.', 'danger');
    } finally {
      submitBtn.disabled = false;
    }
  }

  function init() {
    document.getElementById('homeForm').addEventListener('submit', handleSubmit);
    loadData();
  }

  window.HM.ready(init);
})(window, document);
