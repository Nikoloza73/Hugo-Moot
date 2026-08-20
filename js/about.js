/* ==========================================================================
   About Us page: renders content from localStorage.
   ========================================================================== */

(function (window, document) {
  'use strict';

  var esc = null;
  var resolveImage = null;

  function renderIntro(about) {
    var introEl = document.getElementById('aboutIntro');
    var imgEl = document.getElementById('aboutIntroImage');
    introEl.innerHTML = window.HM.util.paragraphs(about.intro);
    document.getElementById('aboutMission').textContent = about.mission || '';
    document.getElementById('aboutVision').textContent = about.vision || '';
    imgEl.src = resolveImage(about.introImage);

    var paras = introEl.querySelectorAll('p');
    for (var i = 0; i < paras.length; i++) {
      if (paras[i].textContent.trim().toLowerCase() === 'about hugo sinzheimer') {
        paras[i].insertAdjacentElement('afterend', imgEl);
        break;
      }
    }
  }

  function renderValues(about) {
    var grid = document.getElementById('valuesGrid');
    var values = about.values || [];
    if (!values.length) {
      grid.innerHTML = '<div class="empty-state">Values will appear here once added.</div>';
      return;
    }
    grid.innerHTML = values.map(function (v) {
      return (
        '<div class="value-card reveal">' +
          '<h3>' + esc(v.title) + '</h3>' +
          '<p>' + esc(v.description) + '</p>' +
        '</div>'
      );
    }).join('');
  }

  function renderTeam(about) {
    var grid = document.getElementById('teamGrid');
    var team = about.team || [];
    if (!team.length) {
      grid.innerHTML = '<div class="empty-state">Team members will appear here once added.</div>';
      return;
    }
    grid.innerHTML = team.map(function (member) {
      return (
        '<div class="team-card reveal">' +
          '<div class="team-card__photo"><img src="' + resolveImage(member.photo) + '" alt="' + esc(member.name) + '" loading="lazy"></div>' +
          '<div class="team-card__body">' +
            '<div class="team-card__name">' + esc(member.name) + '</div>' +
            '<div class="team-card__role">' + esc(member.role) + '</div>' +
            '<p class="team-card__bio">' + esc(member.bio) + '</p>' +
          '</div>' +
        '</div>'
      );
    }).join('');
  }

  function renderPartners(about) {
    var grid = document.getElementById('partnersGrid');
    var partners = about.partners || [];
    if (!partners.length) {
      grid.innerHTML = '<div class="empty-state">Partner organizations will appear here once added.</div>';
      return;
    }
    grid.innerHTML = partners.map(function (p) {
      return (
        '<div class="partner-logo reveal">' +
          '<img src="' + resolveImage(p.logo) + '" alt="' + esc(p.name) + '" loading="lazy">' +
        '</div>'
      );
    }).join('');
  }

  async function init() {
    esc = window.HM.util.escapeHtml;
    resolveImage = window.HM.util.resolveImage;
    var about = await window.HM.about.get();
    renderIntro(about);
    renderValues(about);
    renderTeam(about);
    renderPartners(about);
    window.HM.ui.initScrollReveal();
  }

  window.HM.ready(init);
})(window, document);
