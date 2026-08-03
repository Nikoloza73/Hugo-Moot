/* ==========================================================================
   Supabase project connection. The publishable/anon key is safe to expose
   in frontend code — it is protected by the Row Level Security policies
   defined in supabase/schema.sql (public read, staff-only write).
   ========================================================================== */

(function (window) {
  'use strict';

  var SUPABASE_URL = 'https://dwilpztzmdyblmlzmzec.supabase.co';
  var SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_pSs6rYI-6tvQMcAaLQILhw_LSRk06G-';

  window.HM_SUPABASE_CLIENT = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
})(window);
