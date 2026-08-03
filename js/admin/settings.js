/* ==========================================================================
   Admin: Website Settings — org name, logo, contact, social, footer.
   ========================================================================== */

(function (window, document) {
  'use strict';

  var logoUpload = null;

  function loadData() {
    var settings = window.HM.settings.get();
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
  }

  function handleSubmit(e) {
    e.preventDefault();

    window.HM.settings.save({
      orgName: document.getElementById('settingOrgName').value.trim(),
      tagline: document.getElementById('settingTagline').value.trim(),
      logo: logoUpload.getValue() || '',
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

    window.HM.activity.log('Updated website settings');
    window.HM.ui.toast('Website settings saved successfully.', 'success');
  }

  function init() {
    logoUpload = window.HM.admin.wireImageUpload(document.getElementById('logoUpload'), '', function () {});
    document.getElementById('settingsForm').addEventListener('submit', handleSubmit);
    loadData();
  }

  window.HM.ready(init);
})(window, document);
