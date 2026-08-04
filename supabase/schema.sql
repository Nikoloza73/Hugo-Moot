-- ============================================================================
-- Hugo Moot — Supabase schema, security policies, and starter content.
-- Run this once in Supabase: Dashboard → SQL Editor → New Query → paste → Run.
-- Safe to re-run (uses IF NOT EXISTS / ON CONFLICT DO NOTHING throughout).
-- ============================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists news (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  date date not null,
  summary text not null,
  content text not null,
  image text,
  gallery jsonb not null default '[]'::jsonb,
  category text not null default 'News',
  created_at timestamptz not null default now()
);

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  year text not null,
  date date not null,
  description text not null,
  cover_image text,
  created_at timestamptz not null default now()
);

create table if not exists gallery_photos (
  id uuid primary key default gen_random_uuid(),
  src text not null,
  caption text not null default '',
  category text not null default 'Uncategorized',
  event_id uuid references events(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists history_milestones (
  id uuid primary key default gen_random_uuid(),
  year text not null,
  title text not null,
  description text not null,
  image text,
  created_at timestamptz not null default now()
);

-- Singleton row (id is always 1) — one editable "document" per table.
create table if not exists about_content (
  id int primary key default 1 check (id = 1),
  intro text not null default '',
  mission text not null default '',
  vision text not null default '',
  values jsonb not null default '[]'::jsonb,
  team jsonb not null default '[]'::jsonb,
  partners jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists site_settings (
  id int primary key default 1 check (id = 1),
  org_name text not null default 'Hugo Moot',
  tagline text not null default '',
  logo text not null default '',
  hero_image text not null default '',
  email text not null default '',
  phone text not null default '',
  address text not null default '',
  social jsonb not null default '{}'::jsonb,
  footer_text text not null default '',
  updated_at timestamptz not null default now()
);

-- Migration for projects created before hero_image existed (safe to re-run).
alter table site_settings add column if not exists hero_image text not null default '';

create table if not exists activity_log (
  id uuid primary key default gen_random_uuid(),
  message text not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- Public visitors (anon key) may only READ content tables.
-- Only signed-in staff (any authenticated Supabase Auth user) may write.
-- activity_log is staff-only end to end (it's an internal dashboard feed).
-- ---------------------------------------------------------------------------

alter table news enable row level security;
alter table events enable row level security;
alter table gallery_photos enable row level security;
alter table history_milestones enable row level security;
alter table about_content enable row level security;
alter table site_settings enable row level security;
alter table activity_log enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array['news', 'events', 'gallery_photos', 'history_milestones', 'about_content', 'site_settings'] loop
    execute format('drop policy if exists "public_read" on %I', t);
    execute format('create policy "public_read" on %I for select using (true)', t);

    execute format('drop policy if exists "staff_insert" on %I', t);
    execute format('create policy "staff_insert" on %I for insert to authenticated with check (true)', t);

    execute format('drop policy if exists "staff_update" on %I', t);
    execute format('create policy "staff_update" on %I for update to authenticated using (true) with check (true)', t);

    execute format('drop policy if exists "staff_delete" on %I', t);
    execute format('create policy "staff_delete" on %I for delete to authenticated using (true)', t);
  end loop;
end $$;

drop policy if exists "staff_read" on activity_log;
create policy "staff_read" on activity_log for select to authenticated using (true);

drop policy if exists "staff_insert" on activity_log;
create policy "staff_insert" on activity_log for insert to authenticated with check (true);

-- ---------------------------------------------------------------------------
-- Storage bucket for uploaded images (logo, news/event/gallery photos, etc.)
-- Public read (so visitors can see images), staff-only write.
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

drop policy if exists "media_public_read" on storage.objects;
create policy "media_public_read" on storage.objects for select using (bucket_id = 'media');

drop policy if exists "media_staff_insert" on storage.objects;
create policy "media_staff_insert" on storage.objects for insert to authenticated with check (bucket_id = 'media');

drop policy if exists "media_staff_update" on storage.objects;
create policy "media_staff_update" on storage.objects for update to authenticated using (bucket_id = 'media');

drop policy if exists "media_staff_delete" on storage.objects;
create policy "media_staff_delete" on storage.objects for delete to authenticated using (bucket_id = 'media');

-- ---------------------------------------------------------------------------
-- Starter placeholder content (same as the original localStorage demo data)
-- Replace or delete any of this later from the admin panel.
-- ---------------------------------------------------------------------------

insert into about_content (id, intro, mission, vision, values, team, partners)
values (
  1,
  E'Hugo Moot is an international moot court competition dedicated to the study and practice of public international law. The competition brings together law students, distinguished academics, and practicing jurists from around the world for a rigorous exchange of ideas.\n\nEach year, participating teams research a hypothetical dispute between states, prepare written memorials, and argue their positions before panels of experienced judges. This is placeholder content and will be replaced with the organization''s official description.',
  'To cultivate excellence in the study and application of international law by providing students with a rigorous, realistic, and rewarding platform to develop advocacy, research, and analytical skills. This is placeholder text.',
  'To be recognized as one of the world''s foremost academic moot court competitions, fostering a global community of jurists committed to the peaceful resolution of disputes between nations. This is placeholder text.',
  '[
    {"title":"Integrity","description":"We hold ourselves and our participants to the highest standards of academic and professional honesty."},
    {"title":"Excellence","description":"We pursue rigorous, high-quality legal scholarship and advocacy in every aspect of the competition."},
    {"title":"Inclusion","description":"We welcome participants from every nation, background, and legal tradition."},
    {"title":"Collegiality","description":"We believe robust legal debate is strengthened, not weakened, by mutual respect."}
  ]'::jsonb,
  '[
    {"name":"Dr. Elena Marchetti","role":"Executive Director","photo":"images/placeholder-portrait.svg","bio":"Placeholder biography for the Executive Director of Hugo Moot."},
    {"name":"Prof. Samuel Okafor","role":"Academic Chair","photo":"images/placeholder-portrait.svg","bio":"Placeholder biography for the Academic Chair overseeing case development."},
    {"name":"Dr. Amara Lindqvist","role":"Director of Competitions","photo":"images/placeholder-portrait.svg","bio":"Placeholder biography for the Director of Competitions."},
    {"name":"Julian Vos","role":"Head of Partnerships","photo":"images/placeholder-portrait.svg","bio":"Placeholder biography for the Head of Partnerships."}
  ]'::jsonb,
  '[
    {"name":"International Law Institute","logo":"images/placeholder-square.svg"},
    {"name":"Global Justice Foundation","logo":"images/placeholder-square.svg"},
    {"name":"Peace Palace Association","logo":"images/placeholder-square.svg"},
    {"name":"World Legal Forum","logo":"images/placeholder-square.svg"}
  ]'::jsonb
)
on conflict (id) do nothing;

insert into site_settings (id, org_name, tagline, logo, email, phone, address, social, footer_text)
values (
  1,
  'Hugo Moot',
  'International Moot Court Competition',
  '',
  'info@hugomoot.org',
  '+31 (0)70 123 4567',
  'Peace Palace Avenue 1, 2517 The Hague, The Netherlands',
  '{"facebook":"","twitter":"","instagram":"","linkedin":"","youtube":""}'::jsonb,
  'Hugo Moot brings together students of international law from across the globe to argue, debate, and refine the next generation of legal thought.'
)
on conflict (id) do nothing;

insert into history_milestones (year, title, description, image) values
  ('2010', 'Founding of Hugo Moot', 'A small group of academics and students convened the first Hugo Moot competition with just eight participating universities. Placeholder description.', 'images/placeholder-wide.svg'),
  ('2013', 'International Expansion', 'The competition welcomed its first teams from outside the founding region, growing to over thirty participating institutions. Placeholder description.', 'images/placeholder-wide.svg'),
  ('2016', 'New Permanent Venue', 'Hugo Moot established a permanent home for its final oral rounds, hosted annually at a dedicated venue. Placeholder description.', 'images/placeholder-wide.svg'),
  ('2019', 'Milestone: 100 Teams', 'For the first time, more than one hundred teams from over fifty countries competed in a single season. Placeholder description.', 'images/placeholder-wide.svg'),
  ('2021', 'Digital Rounds Introduced', 'In response to global circumstances, Hugo Moot introduced fully virtual preliminary rounds, broadening access worldwide. Placeholder description.', 'images/placeholder-wide.svg'),
  ('2024', 'Fifteenth Anniversary', 'Hugo Moot celebrated fifteen years of academic excellence with its largest cohort of participating universities to date. Placeholder description.', 'images/placeholder-wide.svg')
on conflict do nothing;

insert into news (title, date, summary, content, image, gallery, category) values
  ('Registration Opens for the 2027 Hugo Moot Season', '2026-07-28', 'Teams from around the world may now register for the upcoming competition season, with early registration incentives available through September.', E'Registration for the 2027 Hugo Moot season is now open to eligible universities worldwide. This year''s hypothetical case concerns a dispute over maritime boundaries and environmental obligations between two fictional states.\n\nTeams that register before the early deadline will receive priority access to the research library and complimentary review of their preliminary memorials.\n\nThis is placeholder content describing the registration process, eligibility requirements, and important deadlines for the upcoming season.', 'images/placeholder-card.svg', '["images/placeholder-wide.svg","images/placeholder-card.svg","images/placeholder-square.svg"]'::jsonb, 'Announcements'),
  ('Case Compromis for 2027 Released to Registered Teams', '2026-07-10', 'The official problem for the upcoming season has been distributed to all registered teams, outlining the dispute both sides will argue.', E'The Hugo Moot Case Committee has released this year''s case compromis to all registered institutions. The hypothetical dispute raises questions of state responsibility, treaty interpretation, and the law of the sea.\n\nTeams are encouraged to review the accompanying clarifications document, which will be updated periodically throughout the research period.\n\nThis is placeholder content and will be replaced with official case details.', 'images/placeholder-card.svg', '["images/placeholder-wide.svg","images/placeholder-card.svg","images/placeholder-square.svg"]'::jsonb, 'Competition'),
  ('Hugo Moot 2026 Grand Final Recap', '2026-04-18', 'A summary of this year''s grand final round, held before a distinguished panel of judges, including the announcement of the winning team.', E'The 2026 grand final brought together two outstanding teams for a closely contested final round. Both teams demonstrated exceptional command of the written and oral record.\n\nThe panel of judges commended the overall standard of advocacy across the competition and congratulated all participating institutions on a successful season.\n\nThis is placeholder content summarizing the final round and outcome.', 'images/placeholder-card.svg', '["images/placeholder-wide.svg","images/placeholder-card.svg","images/placeholder-square.svg"]'::jsonb, 'Results'),
  ('Call for Judges: Volunteer for the 2027 Oral Rounds', '2026-06-02', 'Practicing lawyers, academics, and alumni are invited to apply as judges for the preliminary and elimination oral rounds.', E'Hugo Moot relies on the generosity of the international legal community to judge its oral rounds each year. We are now accepting applications from qualified practitioners and academics.\n\nJudging commitments range from a single preliminary round to a full weekend of elimination rounds, and training materials are provided to all volunteers.\n\nThis is placeholder content describing the judge application process.', 'images/placeholder-card.svg', '["images/placeholder-wide.svg","images/placeholder-card.svg","images/placeholder-square.svg"]'::jsonb, 'Community'),
  ('New Research Library Partnership Announced', '2026-05-14', 'Hugo Moot has partnered with a leading academic institution to provide participating teams with expanded access to research materials.', E'We are pleased to announce a new partnership that will give all registered teams complimentary access to an extensive digital library of international law resources throughout the competition season.\n\nThis partnership reflects our continued commitment to lowering barriers to participation for institutions of all sizes.\n\nThis is placeholder content describing the partnership in further detail.', 'images/placeholder-card.svg', '["images/placeholder-wide.svg","images/placeholder-card.svg","images/placeholder-square.svg"]'::jsonb, 'Announcements'),
  ('Alumni Spotlight: From Hugo Moot to the International Bench', '2026-03-02', 'We speak with a former competitor about how their experience at Hugo Moot shaped a career in international dispute resolution.', E'In this recurring feature, we highlight the career of a Hugo Moot alumnus who has gone on to a distinguished career in international law.\n\nThe interview covers their memories of competing, lessons learned from the experience, and advice for current participants.\n\nThis is placeholder content for the alumni interview feature.', 'images/placeholder-card.svg', '["images/placeholder-wide.svg","images/placeholder-card.svg","images/placeholder-square.svg"]'::jsonb, 'Community')
on conflict do nothing;

-- Events use fixed ids so gallery photos below can reference them.
insert into events (id, name, year, date, description, cover_image) values
  ('11111111-1111-1111-1111-111111111111', 'Hugo Moot 2026', '2026', '2026-04-15', 'The fifteenth edition of Hugo Moot, featuring over one hundred and twenty teams competing across five days of oral rounds. Placeholder description of the event.', 'images/placeholder-wide.svg'),
  ('22222222-2222-2222-2222-222222222222', 'Hugo Moot 2025', '2025', '2025-04-16', 'The 2025 competition welcomed teams from over fifty-five countries to argue a case concerning diplomatic immunity. Placeholder description of the event.', 'images/placeholder-wide.svg'),
  ('33333333-3333-3333-3333-333333333333', 'Hugo Moot 2024', '2024', '2024-04-18', 'A milestone fifteenth-anniversary celebration bringing together alumni, judges, and current competitors. Placeholder description of the event.', 'images/placeholder-wide.svg'),
  ('44444444-4444-4444-4444-444444444444', 'Hugo Moot 2023', '2023', '2023-04-20', 'Teams debated a hypothetical dispute concerning cross-border environmental harm before an international panel. Placeholder description of the event.', 'images/placeholder-wide.svg')
on conflict (id) do nothing;

insert into gallery_photos (src, caption, category, event_id) values
  ('images/placeholder-wide.svg', 'Placeholder caption for gallery photo 1.', 'Oral Rounds', '11111111-1111-1111-1111-111111111111'),
  ('images/placeholder-card.svg', 'Placeholder caption for gallery photo 2.', 'Opening Ceremony', '22222222-2222-2222-2222-222222222222'),
  ('images/placeholder-square.svg', 'Placeholder caption for gallery photo 3.', 'Awards', '33333333-3333-3333-3333-333333333333'),
  ('images/placeholder-wide.svg', 'Placeholder caption for gallery photo 4.', 'Delegates', '44444444-4444-4444-4444-444444444444'),
  ('images/placeholder-card.svg', 'Placeholder caption for gallery photo 5.', 'Oral Rounds', '11111111-1111-1111-1111-111111111111'),
  ('images/placeholder-square.svg', 'Placeholder caption for gallery photo 6.', 'Opening Ceremony', '22222222-2222-2222-2222-222222222222'),
  ('images/placeholder-wide.svg', 'Placeholder caption for gallery photo 7.', 'Awards', '33333333-3333-3333-3333-333333333333'),
  ('images/placeholder-card.svg', 'Placeholder caption for gallery photo 8.', 'Delegates', '44444444-4444-4444-4444-444444444444'),
  ('images/placeholder-square.svg', 'Placeholder caption for gallery photo 9.', 'Oral Rounds', '11111111-1111-1111-1111-111111111111'),
  ('images/placeholder-wide.svg', 'Placeholder caption for gallery photo 10.', 'Opening Ceremony', '22222222-2222-2222-2222-222222222222'),
  ('images/placeholder-card.svg', 'Placeholder caption for gallery photo 11.', 'Awards', '33333333-3333-3333-3333-333333333333'),
  ('images/placeholder-square.svg', 'Placeholder caption for gallery photo 12.', 'Delegates', '44444444-4444-4444-4444-444444444444')
on conflict do nothing;

insert into activity_log (message) values ('Website content initialized with placeholder data.');
