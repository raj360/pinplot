-- Optional YouTube / video tour link on building listings
ALTER TABLE buildings
  ADD COLUMN IF NOT EXISTS video_url TEXT;
