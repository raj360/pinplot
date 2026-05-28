-- RLS policies + auth profile trigger

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_buildings ENABLE ROW LEVEL SECURITY;

-- Profiles: users read/update own row
CREATE POLICY profiles_select_own ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY profiles_update_own ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Public read for verified buildings (browse without auth)
CREATE POLICY buildings_public_read ON buildings
  FOR SELECT USING (is_verified = TRUE);

CREATE POLICY units_public_read ON units
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM buildings b
      WHERE b.id = units.building_id AND b.is_verified = TRUE
    )
  );

-- Landlords manage own buildings
CREATE POLICY buildings_landlord_insert ON buildings
  FOR INSERT WITH CHECK (auth.uid() = landlord_id);

CREATE POLICY buildings_landlord_update ON buildings
  FOR UPDATE USING (auth.uid() = landlord_id);

-- Saved buildings for authenticated tenants
CREATE POLICY saved_buildings_own ON saved_buildings
  FOR ALL USING (auth.uid() = tenant_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role, first_name, last_name, phone)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'TENANT'),
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.phone
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Storage bucket for building images (public read)
INSERT INTO storage.buckets (id, name, public)
VALUES ('building-images', 'building-images', TRUE)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY building_images_public_read ON storage.objects
  FOR SELECT USING (bucket_id = 'building-images');

CREATE POLICY building_images_auth_upload ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'building-images' AND auth.role() = 'authenticated'
  );
