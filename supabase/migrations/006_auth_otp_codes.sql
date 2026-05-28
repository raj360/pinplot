-- PlotPin-owned email OTP codes (bondex-services pattern; Postmark later)

CREATE TABLE auth_otp_codes (
  email           TEXT PRIMARY KEY,
  code            TEXT NOT NULL,
  expires_at      TIMESTAMPTZ NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX auth_otp_codes_expires_at_idx ON auth_otp_codes (expires_at);

ALTER TABLE auth_otp_codes ENABLE ROW LEVEL SECURITY;
