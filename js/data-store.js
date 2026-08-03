/* ==========================================================================
   Hugo Moot — Data Layer
   Central localStorage-backed "database" simulation + shared utilities.
   Loaded on every page (public + admin) before any page-specific script.
   ========================================================================== */

(function (window) {
  'use strict';

  var STORAGE_PREFIX = 'hugoMoot_';

  var KEYS = {
    SETTINGS: STORAGE_PREFIX + 'settings',
    ABOUT: STORAGE_PREFIX + 'about',
    HISTORY: STORAGE_PREFIX + 'history',
    NEWS: STORAGE_PREFIX + 'news',
    EVENTS: STORAGE_PREFIX + 'events',
    GALLERY: STORAGE_PREFIX + 'gallery',
    ACTIVITY: STORAGE_PREFIX + 'activity',
    AUTH: STORAGE_PREFIX + 'adminLoggedIn',
    SEEDED: STORAGE_PREFIX + 'seeded_v1'
  };

  /* ---- Path resolution --------------------------------------------------
     The same JS runs from three depths: "/", "/pages/", "/admin/".
     Seed data stores root-relative paths like "images/x.svg"; this prefixes
     them correctly no matter which depth the current page lives at.
  --------------------------------------------------------------------- */

  var ASSET_PREFIX = (function () {
    var path = window.location.pathname.replace(/\\/g, '/');
    if (path.indexOf('/pages/') !== -1 || path.indexOf('/admin/') !== -1) {
      return '../';
    }
    return '';
  })();

  function resolveImage(src) {
    if (!src) return ASSET_PREFIX + 'images/placeholder-card.svg';
    if (src.indexOf('data:') === 0 || src.indexOf('http') === 0 || src.indexOf('blob:') === 0) {
      return src;
    }
    return ASSET_PREFIX + src.replace(/^\.\.\//, '');
  }

  /* ---- Generic utilities ------------------------------------------------ */

  function uid(prefix) {
    return (prefix || 'id') + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
  }

  function escapeHtml(str) {
    if (str === undefined || str === null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function nl2br(str) {
    return escapeHtml(str).replace(/\n/g, '<br>');
  }

  function paragraphs(str) {
    if (!str) return '';
    return str
      .split(/\n\s*\n/)
      .map(function (p) { return p.trim(); })
      .filter(Boolean)
      .map(function (p) { return '<p>' + escapeHtml(p).replace(/\n/g, '<br>') + '</p>'; })
      .join('');
  }

  function formatDate(iso, style) {
    if (!iso) return '';
    var d = new Date(iso + 'T00:00:00');
    if (isNaN(d.getTime())) return iso;
    var opts = style === 'short'
      ? { year: 'numeric', month: 'short', day: 'numeric' }
      : { year: 'numeric', month: 'long', day: 'numeric' };
    return d.toLocaleDateString('en-US', opts);
  }

  function readJSON(key, fallback) {
    try {
      var raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      console.error('HM: failed reading', key, e);
      return fallback;
    }
  }

  function writeJSON(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error('HM: failed writing', key, e);
      return false;
    }
  }

  /* ---- Seed data ---------------------------------------------------------- */

  function buildSeedData() {
    var img = {
      hero: 'images/placeholder-hero.svg',
      card: 'images/placeholder-card.svg',
      square: 'images/placeholder-square.svg',
      wide: 'images/placeholder-wide.svg',
      portrait: 'images/placeholder-portrait.svg'
    };

    var settings = {
      orgName: 'Hugo Moot',
      tagline: 'International Moot Court Competition',
      logo: '',
      email: 'info@hugomoot.org',
      phone: '+31 (0)70 123 4567',
      address: 'Peace Palace Avenue 1, 2517 The Hague, The Netherlands',
      social: {
        facebook: '',
        twitter: '',
        instagram: '',
        linkedin: '',
        youtube: ''
      },
      footerText: 'Hugo Moot brings together students of international law from across the globe to argue, debate, and refine the next generation of legal thought.'
    };

    var about = {
      intro: 'Hugo Moot is an international moot court competition dedicated to the study and practice of public international law. Named in honor of the founding principles of modern international legal thought, the competition brings together law students, distinguished academics, and practicing jurists from around the world for a rigorous exchange of ideas.\n\nEach year, participating teams research a hypothetical dispute between states, prepare written memorials, and argue their positions before panels of experienced judges. This is placeholder content and will be replaced with the organization\'s official description.',
      mission: 'To cultivate excellence in the study and application of international law by providing students with a rigorous, realistic, and rewarding platform to develop advocacy, research, and analytical skills. This is placeholder text.',
      vision: 'To be recognized as one of the world\'s foremost academic moot court competitions, fostering a global community of jurists committed to the peaceful resolution of disputes between nations. This is placeholder text.',
      values: [
        { title: 'Integrity', description: 'We hold ourselves and our participants to the highest standards of academic and professional honesty.' },
        { title: 'Excellence', description: 'We pursue rigorous, high-quality legal scholarship and advocacy in every aspect of the competition.' },
        { title: 'Inclusion', description: 'We welcome participants from every nation, background, and legal tradition.' },
        { title: 'Collegiality', description: 'We believe robust legal debate is strengthened, not weakened, by mutual respect.' }
      ],
      team: [
        { id: uid('team'), name: 'Dr. Elena Marchetti', role: 'Executive Director', photo: img.portrait, bio: 'Placeholder biography for the Executive Director of Hugo Moot.' },
        { id: uid('team'), name: 'Prof. Samuel Okafor', role: 'Academic Chair', photo: img.portrait, bio: 'Placeholder biography for the Academic Chair overseeing case development.' },
        { id: uid('team'), name: 'Dr. Amara Lindqvist', role: 'Director of Competitions', photo: img.portrait, bio: 'Placeholder biography for the Director of Competitions.' },
        { id: uid('team'), name: 'Julian Vos', role: 'Head of Partnerships', photo: img.portrait, bio: 'Placeholder biography for the Head of Partnerships.' }
      ],
      partners: [
        { id: uid('partner'), name: 'International Law Institute', logo: img.square },
        { id: uid('partner'), name: 'Global Justice Foundation', logo: img.square },
        { id: uid('partner'), name: 'Peace Palace Association', logo: img.square },
        { id: uid('partner'), name: 'World Legal Forum', logo: img.square }
      ]
    };

    var history = [
      { id: uid('hist'), year: '2010', title: 'Founding of Hugo Moot', description: 'A small group of academics and students convened the first Hugo Moot competition with just eight participating universities. Placeholder description.', image: img.wide },
      { id: uid('hist'), year: '2013', title: 'International Expansion', description: 'The competition welcomed its first teams from outside the founding region, growing to over thirty participating institutions. Placeholder description.', image: img.wide },
      { id: uid('hist'), year: '2016', title: 'New Permanent Venue', description: 'Hugo Moot established a permanent home for its final oral rounds, hosted annually at a dedicated venue. Placeholder description.', image: img.wide },
      { id: uid('hist'), year: '2019', title: 'Milestone: 100 Teams', description: 'For the first time, more than one hundred teams from over fifty countries competed in a single season. Placeholder description.', image: img.wide },
      { id: uid('hist'), year: '2021', title: 'Digital Rounds Introduced', description: 'In response to global circumstances, Hugo Moot introduced fully virtual preliminary rounds, broadening access worldwide. Placeholder description.', image: img.wide },
      { id: uid('hist'), year: '2024', title: 'Fifteenth Anniversary', description: 'Hugo Moot celebrated fifteen years of academic excellence with its largest cohort of participating universities to date. Placeholder description.', image: img.wide }
    ];

    var newsSeed = [
      {
        title: 'Registration Opens for the 2027 Hugo Moot Season',
        date: '2026-07-28',
        summary: 'Teams from around the world may now register for the upcoming competition season, with early registration incentives available through September.',
        content: 'Registration for the 2027 Hugo Moot season is now open to eligible universities worldwide. This year\'s hypothetical case concerns a dispute over maritime boundaries and environmental obligations between two fictional states.\n\nTeams that register before the early deadline will receive priority access to the research library and complimentary review of their preliminary memorials.\n\nThis is placeholder content describing the registration process, eligibility requirements, and important deadlines for the upcoming season.',
        category: 'Announcements'
      },
      {
        title: 'Case Compromis for 2027 Released to Registered Teams',
        date: '2026-07-10',
        summary: 'The official problem for the upcoming season has been distributed to all registered teams, outlining the dispute both sides will argue.',
        content: 'The Hugo Moot Case Committee has released this year\'s case compromis to all registered institutions. The hypothetical dispute raises questions of state responsibility, treaty interpretation, and the law of the sea.\n\nTeams are encouraged to review the accompanying clarifications document, which will be updated periodically throughout the research period.\n\nThis is placeholder content and will be replaced with official case details.',
        category: 'Competition'
      },
      {
        title: 'Hugo Moot 2026 Grand Final Recap',
        date: '2026-04-18',
        summary: 'A summary of this year\'s grand final round, held before a distinguished panel of judges, including the announcement of the winning team.',
        content: 'The 2026 grand final brought together two outstanding teams for a closely contested final round. Both teams demonstrated exceptional command of the written and oral record.\n\nThe panel of judges commended the overall standard of advocacy across the competition and congratulated all participating institutions on a successful season.\n\nThis is placeholder content summarizing the final round and outcome.',
        category: 'Results'
      },
      {
        title: 'Call for Judges: Volunteer for the 2027 Oral Rounds',
        date: '2026-06-02',
        summary: 'Practicing lawyers, academics, and alumni are invited to apply as judges for the preliminary and elimination oral rounds.',
        content: 'Hugo Moot relies on the generosity of the international legal community to judge its oral rounds each year. We are now accepting applications from qualified practitioners and academics.\n\nJudging commitments range from a single preliminary round to a full weekend of elimination rounds, and training materials are provided to all volunteers.\n\nThis is placeholder content describing the judge application process.',
        category: 'Community'
      },
      {
        title: 'New Research Library Partnership Announced',
        date: '2026-05-14',
        summary: 'Hugo Moot has partnered with a leading academic institution to provide participating teams with expanded access to research materials.',
        content: 'We are pleased to announce a new partnership that will give all registered teams complimentary access to an extensive digital library of international law resources throughout the competition season.\n\nThis partnership reflects our continued commitment to lowering barriers to participation for institutions of all sizes.\n\nThis is placeholder content describing the partnership in further detail.',
        category: 'Announcements'
      },
      {
        title: 'Alumni Spotlight: From Hugo Moot to the International Bench',
        date: '2026-03-02',
        summary: 'We speak with a former competitor about how their experience at Hugo Moot shaped a career in international dispute resolution.',
        content: 'In this recurring feature, we highlight the career of a Hugo Moot alumnus who has gone on to a distinguished career in international law.\n\nThe interview covers their memories of competing, lessons learned from the experience, and advice for current participants.\n\nThis is placeholder content for the alumni interview feature.',
        category: 'Community'
      }
    ];

    var news = newsSeed.map(function (n) {
      return Object.assign({
        id: uid('news'),
        image: img.card,
        gallery: [img.wide, img.card, img.square]
      }, n);
    });

    var eventsSeed = [
      { name: 'Hugo Moot 2026', year: '2026', date: '2026-04-15', description: 'The fifteenth edition of Hugo Moot, featuring over one hundred and twenty teams competing across five days of oral rounds. Placeholder description of the event.' },
      { name: 'Hugo Moot 2025', year: '2025', date: '2025-04-16', description: 'The 2025 competition welcomed teams from over fifty-five countries to argue a case concerning diplomatic immunity. Placeholder description of the event.' },
      { name: 'Hugo Moot 2024', year: '2024', date: '2024-04-18', description: 'A milestone fifteenth-anniversary celebration bringing together alumni, judges, and current competitors. Placeholder description of the event.' },
      { name: 'Hugo Moot 2023', year: '2023', date: '2023-04-20', description: 'Teams debated a hypothetical dispute concerning cross-border environmental harm before an international panel. Placeholder description of the event.' }
    ];

    var events = eventsSeed.map(function (e) {
      return Object.assign({
        id: uid('event'),
        coverImage: img.wide,
        gallery: [img.card, img.square, img.wide, img.card, img.square]
      }, e);
    });

    var galleryCategories = ['Oral Rounds', 'Opening Ceremony', 'Awards', 'Delegates'];
    var gallery = [];
    for (var i = 0; i < 12; i++) {
      gallery.push({
        id: uid('photo'),
        src: i % 3 === 0 ? img.wide : (i % 3 === 1 ? img.card : img.square),
        caption: 'Placeholder caption for gallery photo ' + (i + 1) + '.',
        category: galleryCategories[i % galleryCategories.length],
        eventId: events[i % events.length].id
      });
    }

    var activity = [
      { id: uid('act'), message: 'Website content initialized with placeholder data.', timestamp: new Date().toISOString() }
    ];

    return {
      settings: settings,
      about: about,
      history: history,
      news: news,
      events: events,
      gallery: gallery,
      activity: activity
    };
  }

  function seedIfNeeded() {
    if (window.localStorage.getItem(KEYS.SEEDED)) return;
    var seed = buildSeedData();
    writeJSON(KEYS.SETTINGS, seed.settings);
    writeJSON(KEYS.ABOUT, seed.about);
    writeJSON(KEYS.HISTORY, seed.history);
    writeJSON(KEYS.NEWS, seed.news);
    writeJSON(KEYS.EVENTS, seed.events);
    writeJSON(KEYS.GALLERY, seed.gallery);
    writeJSON(KEYS.ACTIVITY, seed.activity);
    window.localStorage.setItem(KEYS.SEEDED, '1');
  }

  /* ---- Activity log -------------------------------------------------------*/

  function logActivity(message) {
    var list = readJSON(KEYS.ACTIVITY, []);
    list.unshift({ id: uid('act'), message: message, timestamp: new Date().toISOString() });
    list = list.slice(0, 20);
    writeJSON(KEYS.ACTIVITY, list);
  }

  function timeAgo(iso) {
    var diff = Date.now() - new Date(iso).getTime();
    var mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return mins + (mins === 1 ? ' minute ago' : ' minutes ago');
    var hrs = Math.floor(mins / 60);
    if (hrs < 24) return hrs + (hrs === 1 ? ' hour ago' : ' hours ago');
    var days = Math.floor(hrs / 24);
    if (days < 30) return days + (days === 1 ? ' day ago' : ' days ago');
    return formatDate(iso.slice(0, 10), 'short');
  }

  /* ---- Collections API ---------------------------------------------------*/

  function makeCollection(key) {
    return {
      getAll: function () { return readJSON(key, []); },
      getById: function (id) {
        return readJSON(key, []).find(function (item) { return item.id === id; }) || null;
      },
      add: function (item) {
        var list = readJSON(key, []);
        item.id = item.id || uid();
        list.unshift(item);
        writeJSON(key, list);
        return item;
      },
      update: function (id, patch) {
        var list = readJSON(key, []);
        var idx = list.findIndex(function (item) { return item.id === id; });
        if (idx === -1) return null;
        list[idx] = Object.assign({}, list[idx], patch, { id: id });
        writeJSON(key, list);
        return list[idx];
      },
      delete: function (id) {
        var list = readJSON(key, []);
        var next = list.filter(function (item) { return item.id !== id; });
        writeJSON(key, next);
        return next.length !== list.length;
      },
      replaceAll: function (list) { writeJSON(key, list); }
    };
  }

  var newsCollection = makeCollection(KEYS.NEWS);
  var eventsCollection = makeCollection(KEYS.EVENTS);
  var galleryCollection = makeCollection(KEYS.GALLERY);
  var historyCollection = makeCollection(KEYS.HISTORY);

  newsCollection.getLatest = function (n) {
    var list = this.getAll().slice();
    list.sort(function (a, b) { return new Date(b.date) - new Date(a.date); });
    return list.slice(0, n || 6);
  };

  newsCollection.getRelated = function (id, n) {
    var current = this.getById(id);
    var list = this.getAll().filter(function (item) { return item.id !== id; });
    if (current) {
      list.sort(function (a, b) {
        var aMatch = a.category === current.category ? 1 : 0;
        var bMatch = b.category === current.category ? 1 : 0;
        if (aMatch !== bMatch) return bMatch - aMatch;
        return new Date(b.date) - new Date(a.date);
      });
    }
    return list.slice(0, n || 3);
  };

  eventsCollection.getSorted = function () {
    return this.getAll().slice().sort(function (a, b) { return (b.year || '').localeCompare(a.year || ''); });
  };

  historyCollection.getSorted = function () {
    return this.getAll().slice().sort(function (a, b) { return (a.year || '').localeCompare(b.year || ''); });
  };

  galleryCollection.getCategories = function () {
    var cats = this.getAll().map(function (p) { return p.category; }).filter(Boolean);
    return cats.filter(function (c, i) { return cats.indexOf(c) === i; });
  };

  /* ---- Settings & About (singletons) --------------------------------------*/

  var settingsApi = {
    get: function () { return readJSON(KEYS.SETTINGS, {}); },
    save: function (patch) {
      var current = readJSON(KEYS.SETTINGS, {});
      var next = Object.assign({}, current, patch);
      if (patch.social) next.social = Object.assign({}, current.social, patch.social);
      writeJSON(KEYS.SETTINGS, next);
      return next;
    }
  };

  var aboutApi = {
    get: function () { return readJSON(KEYS.ABOUT, {}); },
    save: function (patch) {
      var current = readJSON(KEYS.ABOUT, {});
      var next = Object.assign({}, current, patch);
      writeJSON(KEYS.ABOUT, next);
      return next;
    }
  };

  /* ---- Auth (UI-only, no real security) -----------------------------------*/

  var authApi = {
    isLoggedIn: function () { return window.localStorage.getItem(KEYS.AUTH) === '1'; },
    login: function () { window.localStorage.setItem(KEYS.AUTH, '1'); },
    logout: function () { window.localStorage.removeItem(KEYS.AUTH); }
  };

  /* ---- File to Data URL helper (image uploads) ----------------------------*/

  function fileToDataUrl(file, callback) {
    if (!file) { callback(null); return; }
    var reader = new FileReader();
    reader.onload = function (e) { callback(e.target.result); };
    reader.onerror = function () { callback(null); };
    reader.readAsDataURL(file);
  }

  /* ---- Public API ----------------------------------------------------------*/

  window.HM = {
    KEYS: KEYS,
    ASSET_PREFIX: ASSET_PREFIX,
    init: seedIfNeeded,
    util: {
      uid: uid,
      escapeHtml: escapeHtml,
      nl2br: nl2br,
      paragraphs: paragraphs,
      formatDate: formatDate,
      timeAgo: timeAgo,
      resolveImage: resolveImage,
      fileToDataUrl: fileToDataUrl
    },
    settings: settingsApi,
    about: aboutApi,
    history: historyCollection,
    news: newsCollection,
    events: eventsCollection,
    gallery: galleryCollection,
    activity: {
      log: logActivity,
      getRecent: function (n) { return readJSON(KEYS.ACTIVITY, []).slice(0, n || 8); }
    },
    auth: authApi
  };

  seedIfNeeded();
})(window);
