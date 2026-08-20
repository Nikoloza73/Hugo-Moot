/* ==========================================================================
   Admin: Website Settings — org name, logo, hero image, contact, social, footer.
   ========================================================================== */

(function (window, document) {
  'use strict';

  var logoUpload = null;
  var heroImageUpload = null;
  var originalLogo = '';
  var originalHeroImage = '';
  var navOrder = [];

  var NAV_LABELS = {
    home: 'Home',
    about: 'About Us',
    committee: 'Committee',
    history: 'History',
    gallery: 'Gallery',
    events: 'Events',
    news: 'News'
  };
  var DEFAULT_NAV_ORDER = ['home', 'about', 'committee', 'history', 'gallery', 'events', 'news'];

  function isValidNavOrder(order) {
    if (!Array.isArray(order) || order.length !== DEFAULT_NAV_ORDER.length) return false;
    return DEFAULT_NAV_ORDER.every(function (key) { return order.indexOf(key) !== -1; });
  }

  function renderNavOrder() {
    var container = document.getElementById('navOrderList');
    container.innerHTML = navOrder.map(function (key, i) {
      return (
        '<div class="nav-order__item">' +
          '<span class="nav-order__label">' + (NAV_LABELS[key] || key) + '</span>' +
          '<div class="nav-order__controls">' +
            '<button type="button" class="nav-order__btn js-nav-up" aria-label="Move up"' + (i === 0 ? ' disabled' : '') + '>↑</button>' +
            '<button type="button" class="nav-order__btn js-nav-down" aria-label="Move down"' + (i === navOrder.length - 1 ? ' disabled' : '') + '>↓</button>' +
          '</div>' +
        '</div>'
      );
    }).join('');

    container.querySelectorAll('.js-nav-up').forEach(function (btn, i) {
      btn.addEventListener('click', function () {
        if (i === 0) return;
        var tmp = navOrder[i]; navOrder[i] = navOrder[i - 1]; navOrder[i - 1] = tmp;
        renderNavOrder();
      });
    });
    container.querySelectorAll('.js-nav-down').forEach(function (btn, i) {
      btn.addEventListener('click', function () {
        if (i === navOrder.length - 1) return;
        var tmp = navOrder[i]; navOrder[i] = navOrder[i + 1]; navOrder[i + 1] = tmp;
        renderNavOrder();
      });
    });
  }

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

    navOrder = isValidNavOrder(settings.navOrder) ? settings.navOrder.slice() : DEFAULT_NAV_ORDER.slice();
    renderNavOrder();
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
        navOrder: navOrder,
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
