-- Drop legacy per-country fee columns from `countries`.
--
-- These were defined in 001_initial_schema.sql (tenant_unlock_fee / landlord_listing_fee)
-- but the app never reads them: all pricing flows through the PRICING.*Ugx constants
-- and the `pricing_rules` table, canonically in UGX. They were only ever written by
-- the catalog seeds (and held a misleading flat 20000/30000 for every country).
--
-- Safe drop — no views, types, or app code reference these columns.

ALTER TABLE countries DROP COLUMN IF EXISTS tenant_unlock_fee;
ALTER TABLE countries DROP COLUMN IF EXISTS landlord_listing_fee;
