/* ==========================================================================
   Admin: Website Settings — org name, logo, hero image, contact, social, footer.
   ========================================================================== */

(function (window, document) {
  'use strict';

  var logoUpload = null;
  var heroImageUpload = null;
  var originalLogo = '';
  var originalHeroImage = '';

  async function loadData() {
    var settings = await window.HM.settings.get();
    originalLogo = settings.logo || '';
    originalHeroImage = settings.heroImage || '';
    document.getElementById('settingOrgName').value = settings.orgName || '';
    document.getElementById('settingTagline').value = settings.tagline || '';
    document.getElementById('settingEmail').value = settings.email || '';
    document.getElementById('settingPhone').value = settings.phone || '';
    document.getElementById('settingAddress').value = settings.address || '';
    document.getElementById('settingFooterText').value = settings.footerText || '';

    var social = settings.social || {};
    document.getElementById('settingFacebook').value = social.facebook || '';
    document.getElementById('settingTwitter').value = social.twitter || '';
    document.getElementById('settingInstagram').value = social.instagram || '';
    document.getElementById('settingLinkedin').value = social.linkedin || '';

    logoUpload.reset(settings.logo || '');
    heroImageUpload.reset(settings.heroImage || '');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    var submitBtn = document.querySelector('#settingsForm button[type="submit"]');
    submitBtn.disabled = true;

    try {
      var newLogo = logoUpload.getValue() || '';
      var newHeroImage = heroImageUpload.getValue() || '';
      await window.HM.settings.save({
        orgName: document.getElementById('settingOrgName').value.trim(),
        tagline: document.getElementById('settingTagline').value.trim(),
        logo: newLogo,
        heroImage: newHeroImage,
        email: document.getElementById('settingEmail').value.trim(),
        phone: document.getElementById('settingPhone').value.trim(),
        address: document.getElementById('settingAddress').value.trim(),
        footerText: document.getElementById('settingFooterText').value.trim(),
        social: {
          facebook: document.getElementById('settingFacebook').value.trim(),
          twitter: document.getElementById('settingTwitter').value.trim(),
          instagram: document.getElementById('settingInstagram').value.trim(),
          linkedin: document.getElementById('settingLinkedin').value.trim()
        }
      });

      if (originalLogo && originalLogo !== newLogo) {
        await window.HM.util.deleteImage(originalLogo);
      }
      originalLogo = newLogo;

      if (originalHeroImage && originalHeroImage !== newHeroImage) {
        await window.HM.util.deleteImage(originalHeroImage);
      }
      originalHeroImage = newHeroImage;

      await window.HM.activity.log('Updated website settings');
      window.HM.ui.toast('Website settings saved successfully.', 'success');
    } catch (err) {
      window.HM.ui.toast('Could not save settings. Please try again.', 'danger');
    } finally {
      submitBtn.disabled = false;
    }
  }

  function init() {
    logoUpload = window.HM.admin.wireImageUpload(document.getElementById('logoUpload'), '', function () {}, 'settings');
    heroImageUpload = window.HM.admin.wireImageUpload(document.getElementById('heroImageUpload'), '', function () {}, 'settings');
    document.getElementById('settingsForm').addEventListener('submit', handleSubmit);
    loadData();
  }

  window.HM.ready(init);
})(window, document);
