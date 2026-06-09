-- Lock down tables flagged by Supabase Advisor. Nest API uses the service role /
-- direct Postgres connection (bypasses RLS); anon/authenticated PostgREST clients
-- must not read these rows directly.

ALTER TABLE geo_places ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE featured_grants ENABLE ROW LEVEL SECURITY;

-- PostGIS system catalog — do NOT enable RLS here (extension-owned; can fail or
-- break PostGIS). Revoke PostgREST access instead.
REVOKE ALL ON TABLE spatial_ref_sys FROM anon, authenticated;
