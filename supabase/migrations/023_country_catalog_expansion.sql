-- Expand country catalog for diaspora / high card+internet-adoption markets.
-- These are viewer/payment markets (Lemon Squeezy cards; GH via Flutterwave MoMo),
-- so map_center / map_bounds stay NULL — only supply markets need a default map view.
-- Canonical pricing remains UGX; fx_rates drive presentment + Flutterwave charge currency.

INSERT INTO countries (
  code, name, currency, tenant_unlock_fee, landlord_listing_fee,
  display_locale, is_active
) VALUES
  ('IE', 'Ireland',        'EUR', 20000, 30000, 'en-IE', TRUE),
  ('NL', 'Netherlands',    'EUR', 20000, 30000, 'nl-NL', TRUE),
  ('FR', 'France',         'EUR', 20000, 30000, 'fr-FR', TRUE),
  ('IT', 'Italy',          'EUR', 20000, 30000, 'it-IT', TRUE),
  ('ES', 'Spain',          'EUR', 20000, 30000, 'es-ES', TRUE),
  ('BE', 'Belgium',        'EUR', 20000, 30000, 'nl-BE', TRUE),
  ('SE', 'Sweden',         'SEK', 20000, 30000, 'sv-SE', TRUE),
  ('NO', 'Norway',         'NOK', 20000, 30000, 'nb-NO', TRUE),
  ('DK', 'Denmark',        'DKK', 20000, 30000, 'da-DK', TRUE),
  ('CH', 'Switzerland',    'CHF', 20000, 30000, 'de-CH', TRUE),
  ('SA', 'Saudi Arabia',   'SAR', 20000, 30000, 'en-SA', TRUE),
  ('QA', 'Qatar',          'QAR', 20000, 30000, 'en-QA', TRUE),
  ('AU', 'Australia',      'AUD', 20000, 30000, 'en-AU', TRUE),
  ('NZ', 'New Zealand',    'NZD', 20000, 30000, 'en-NZ', TRUE),
  ('IN', 'India',          'INR', 20000, 30000, 'en-IN', TRUE),
  ('SG', 'Singapore',      'SGD', 20000, 30000, 'en-SG', TRUE),
  ('GH', 'Ghana',          'GHS', 20000, 30000, 'en-GH', TRUE)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  currency = EXCLUDED.currency,
  display_locale = EXCLUDED.display_locale,
  is_active = EXCLUDED.is_active;

-- Approximate seed rates; the daily refresh job (scripts/refresh-fx-rates.mjs)
-- replaces these with live values. amount_in_quote = amount_in_base * rate.
INSERT INTO fx_rates (base_currency, quote_currency, rate) VALUES
  ('UGX', 'SEK', 0.0024700000),
  ('UGX', 'NOK', 0.0027300000),
  ('UGX', 'DKK', 0.0017940000),
  ('UGX', 'CHF', 0.0002290000),
  ('UGX', 'SAR', 0.0009750000),
  ('UGX', 'QAR', 0.0009460000),
  ('UGX', 'AUD', 0.0003950000),
  ('UGX', 'NZD', 0.0004320000),
  ('UGX', 'INR', 0.0223600000),
  ('UGX', 'SGD', 0.0003480000),
  ('UGX', 'GHS', 0.0033800000),
  ('SEK', 'UGX', 404.8600000000),
  ('NOK', 'UGX', 366.3000000000),
  ('DKK', 'UGX', 557.4100000000),
  ('CHF', 'UGX', 4370.6300000000),
  ('SAR', 'UGX', 1025.6400000000),
  ('QAR', 'UGX', 1056.6300000000),
  ('AUD', 'UGX', 2530.3600000000),
  ('NZD', 'UGX', 2316.9600000000),
  ('INR', 'UGX', 44.7200000000),
  ('SGD', 'UGX', 2870.2600000000),
  ('GHS', 'UGX', 295.8600000000)
ON CONFLICT (base_currency, quote_currency) DO UPDATE SET
  rate = EXCLUDED.rate,
  updated_at = NOW();
