/* ==========================================================================
   Hugo Moot — Data Layer
   Talks to the real Supabase backend (database, auth, storage). Public pages
   read without logging in (RLS allows anonymous SELECT); admin pages need an
   authenticated session to write (RLS blocks anonymous INSERT/UPDATE/DELETE).
   Loaded on every page (public + admin) before any page-specific script.
   Requires js/supabase-config.js (window.HM_SUPABASE_CLIENT) to load first.
   ========================================================================== */

(function (window) {
  'use strict';

  var client = window.HM_SUPABASE_CLIENT;

  /* ---- Path resolution for the handful of relative placeholder images ---
     (real uploads go to Supabase Storage and come back as full https URLs,
     which pass through resolveImage() unchanged)
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

  function escapeHtml(str) {
    if (str === undefined || str === null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
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

  /* ---- Image upload → Supabase Storage ------------------------------------
     Replaces the old base64-data-URL approach with a real upload to the
     public "media" bucket. Returns the public URL to store on the record.
  --------------------------------------------------------------------- */

  function uploadImage(file, folder) {
    if (!file) return Promise.resolve('');
    var ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
    var path = (folder || 'uploads') + '/' + Date.now() + '-' + Math.random().toString(36).slice(2, 8) + '.' + ext;

    return client.storage.from('media').upload(path, file, { cacheControl: '3600', upsert: false })
      .then(function (res) {
        if (res.error) throw res.error;
        var pub = client.storage.from('media').getPublicUrl(path);
        return pub.data.publicUrl;
      });
  }

  /* ---- Remove an uploaded file from Storage when its record is deleted or
     its image is replaced. Silently no-ops for placeholder/external URLs
     (anything that isn't actually in our "media" bucket).
  --------------------------------------------------------------------- */

  function deleteImage(url) {
    var marker = '/storage/v1/object/public/media/';
    var idx = url ? url.indexOf(marker) : -1;
    if (idx === -1) return Promise.resolve();
    var path = url.slice(idx + marker.length);
    return client.storage.from('media').remove([path]).then(function (res) {
      if (res.error) console.error('HM: deleteImage', res.error);
    });
  }

  /* ---- snake_case (DB) <-> camelCase (app) field mapping ------------------ */

  function mapToRow(obj, keyMap) {
    var row = {};
    Object.keys(obj).forEach(function (key) {
      row[keyMap[key] || key] = obj[key];
    });
    return row;
  }

  function mapFromRow(row, keyMap) {
    var reverse = {};
    Object.keys(keyMap).forEach(function (k) { reverse[keyMap[k]] = k; });
    var obj = {};
    Object.keys(row).forEach(function (key) {
      obj[reverse[key] || key] = row[key];
    });
    return obj;
  }

  /* ---- Generic Supabase-backed collection --------------------------------- */

  function makeCollection(table, keyMap) {
    keyMap = keyMap || {};
    var toRow = function (obj) { return mapToRow(obj, keyMap); };
    var fromRow = function (row) { return mapFromRow(row, keyMap); };

    return {
      getAll: async function (orderBy, ascending) {
        var query = client.from(table).select('*');
        if (orderBy) query = query.order(orderBy, { ascending: !!ascending });
        var res = await query;
        if (res.error) { console.error('HM:', table, 'getAll', res.error); throw res.error; }
        return (res.data || []).map(fromRow);
      },
      getById: async function (id) {
        var res = await client.from(table).select('*').eq('id', id).maybeSingle();
        if (res.error) { console.error('HM:', table, 'getById', res.error); throw res.error; }
        return res.data ? fromRow(res.data) : null;
      },
      add: async function (obj) {
        var row = toRow(obj);
        delete row.id;
        var res = await client.from(table).insert(row).select().single();
        if (res.error) { console.error('HM:', table, 'add', res.error); throw res.error; }
        return fromRow(res.data);
      },
      update: async function (id, patch) {
        var row = toRow(patch);
        delete row.id;
        var res = await client.from(table).update(row).eq('id', id).select().single();
        if (res.error) { console.error('HM:', table, 'update', res.error); throw res.error; }
        return fromRow(res.data);
      },
      delete: async function (id) {
        var res = await client.from(table).delete().eq('id', id);
        if (res.error) { console.error('HM:', table, 'delete', res.error); throw res.error; }
        return true;
      }
    };
  }

  var newsCollection = makeCollection('news');
  var eventsCollection = makeCollection('events', { coverImage: 'cover_image' });
  var galleryCollection = makeCollection('gallery_photos', { eventId: 'event_id' });
  var historyCollection = makeCollection('history_milestones');

  newsCollection.getLatest = async function (n) {
    var res = await client.from('news').select('*').order('date', { ascending: false }).limit(n || 6);
    if (res.error) { console.error('HM: news getLatest', res.error); throw res.error; }
    return res.data || [];
  };

  newsCollection.getRelated = async function (id, n) {
    var current = await this.getById(id);
    var res = await client.from('news').select('*').neq('id', id);
    if (res.error) { console.error('HM: news getRelated', res.error); throw res.error; }
    var list = res.data || [];
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

  eventsCollection.getSorted = async function () {
    return this.getAll('year', false);
  };

  historyCollection.getSorted = async function () {
    return this.getAll('year', true);
  };

  galleryCollection.getCategories = async function () {
    var res = await client.from('gallery_photos').select('category');
    if (res.error) { console.error('HM: gallery getCategories', res.error); throw res.error; }
    var cats = (res.data || []).map(function (r) { return r.category; }).filter(Boolean);
    return cats.filter(function (c, i) { return cats.indexOf(c) === i; });
  };

  /* ---- Settings & About (singleton rows, id = 1) --------------------------*/

  var settingsKeyMap = { orgName: 'org_name', footerText: 'footer_text', heroImage: 'hero_image' };

  var settingsApi = {
    get: async function () {
      var res = await client.from('site_settings').select('*').eq('id', 1).maybeSingle();
      if (res.error) { console.error('HM: settings get', res.error); throw res.error; }
      return res.data ? mapFromRow(res.data, settingsKeyMap) : {};
    },
    save: async function (patch) {
      var merged = Object.assign({}, patch);
      if (patch.social) {
        var current = await this.get();
        merged.social = Object.assign({}, current.social, patch.social);
      }
      var row = mapToRow(merged, settingsKeyMap);
      delete row.id;
      var res = await client.from('site_settings').update(row).eq('id', 1).select().single();
      if (res.error) { console.error('HM: settings save', res.error); throw res.error; }
      return mapFromRow(res.data, settingsKeyMap);
    }
  };

  var aboutApi = {
    get: async function () {
      var res = await client.from('about_content').select('*').eq('id', 1).maybeSingle();
      if (res.error) { console.error('HM: about get', res.error); throw res.error; }
      return res.data || {};
    },
    save: async function (patch) {
      var row = Object.assign({}, patch);
      delete row.id;
      var res = await client.from('about_content').update(row).eq('id', 1).select().single();
      if (res.error) { console.error('HM: about save', res.error); throw res.error; }
      return res.data;
    }
  };

  /* ---- Activity log (staff-only, per RLS) ---------------------------------*/

  var activityApi = {
    log: async function (message) {
      var res = await client.from('activity_log').insert({ message: message });
      if (res.error) { console.error('HM: activity log', res.error); }
    },
    getRecent: async function (n) {
      var res = await client.from('activity_log').select('*').order('created_at', { ascending: false }).limit(n || 8);
      if (res.error) { console.error('HM: activity getRecent', res.error); throw res.error; }
      return (res.data || []).map(function (row) { return { message: row.message, timestamp: row.created_at }; });
    }
  };

  /* ---- Auth (real Supabase Auth — email + password) ------------------------*/

  var authApi = {
    isLoggedIn: async function () {
      var res = await client.auth.getSession();
      return !!(res.data && res.data.session);
    },
    getUser: async function () {
      var res = await client.auth.getUser();
      return (res.data && res.data.user) || null;
    },
    login: async function (email, password) {
      var res = await client.auth.signInWithPassword({ email: email, password: password });
      if (res.error) throw res.error;
      return res.data;
    },
    logout: async function () {
      await client.auth.signOut();
    },
    onChange: function (callback) {
      client.auth.onAuthStateChange(function (event, session) { callback(event, session); });
    }
  };

  /* ---- Public API ----------------------------------------------------------*/

  window.HM = {
    client: client,
    ASSET_PREFIX: ASSET_PREFIX,
    util: {
      escapeHtml: escapeHtml,
      paragraphs: paragraphs,
      formatDate: formatDate,
      timeAgo: timeAgo,
      resolveImage: resolveImage,
      uploadImage: uploadImage,
      deleteImage: deleteImage
    },
    settings: settingsApi,
    about: aboutApi,
    history: historyCollection,
    news: newsCollection,
    events: eventsCollection,
    gallery: galleryCollection,
    activity: activityApi,
    auth: authApi
  };
})(window);
