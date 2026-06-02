-- Thumb variants for explore cards; full URLs stay gated until unlock.

ALTER TABLE unit_images
  ADD COLUMN IF NOT EXISTS thumb_storage_path TEXT;

ALTER TABLE buildings
  ADD COLUMN IF NOT EXISTS cover_image_thumb_path TEXT;

-- Existing listings: reuse full URL until re-uploaded with compression.
UPDATE unit_images
SET thumb_storage_path = storage_path
WHERE thumb_storage_path IS NULL;

UPDATE buildings
SET cover_image_thumb_path = cover_image_path
WHERE cover_image_path IS NOT NULL
  AND cover_image_thumb_path IS NULL;
