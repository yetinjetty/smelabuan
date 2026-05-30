-- SME Association Labuan — Supabase Setup
-- Run in: Supabase Dashboard → SQL Editor → New query
-- Project: https://ntplehmhhruzflvitool.supabase.co

-- ============================================================
-- TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS members (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id       text UNIQUE,
  auth_user_id    uuid REFERENCES auth.users ON DELETE SET NULL,
  full_name       text NOT NULL,
  email           text UNIQUE NOT NULL,
  phone           text,
  business_name   text,
  business_sector text,
  business_size   text CHECK (business_size IN ('Micro', 'Small', 'Medium')),
  membership_type text CHECK (membership_type IN ('Life', 'Ordinary')),
  status          text DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'expired', 'inactive')),
  member_since    date,
  expiry_date     date,
  payment_ref     text,
  updated_at      timestamptz DEFAULT now(),
  created_at      timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS admin_users (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id    uuid REFERENCES auth.users ON DELETE SET NULL,
  full_name       text NOT NULL,
  email           text UNIQUE NOT NULL,
  role            text NOT NULL CHECK (role IN ('president', 'editor')),
  created_at      timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS events (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title             text NOT NULL,
  venue             text,
  event_date        date NOT NULL,
  access_type       text DEFAULT 'open' CHECK (access_type IN ('open', 'members_only')),
  registered_count  int DEFAULT 0,
  description       text,
  created_at        timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS event_registrations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        uuid REFERENCES events(id) ON DELETE CASCADE,
  member_id       uuid REFERENCES members(id) ON DELETE CASCADE,
  registered_at   timestamptz DEFAULT now(),
  UNIQUE(event_id, member_id)
);

CREATE TABLE IF NOT EXISTS deals (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_name       text NOT NULL,
  offer_description   text,
  category            text,
  discount_value      text,
  valid_until         date,
  status              text DEFAULT 'active' CHECK (status IN ('active', 'expired', 'expiring')),
  created_at          timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS advertisements (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  advertiser_name   text NOT NULL,
  headline          text NOT NULL,
  image_url         text,
  period_start      date,
  period_end        date,
  click_count       int DEFAULT 0,
  status            text DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at        timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS activity_log (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id       uuid REFERENCES members(id) ON DELETE SET NULL,
  admin_id        uuid REFERENCES admin_users(id) ON DELETE SET NULL,
  action          text NOT NULL CHECK (action IN ('approved', 'rejected', 'renewed', 'upgraded', 'edited', 'synced')),
  details         text,
  payment_ref     text,
  created_at      timestamptz DEFAULT now()
);

-- ============================================================
-- AUTO-UPDATE updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS members_updated_at ON members;
CREATE TRIGGER members_updated_at
  BEFORE UPDATE ON members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- ROW-LEVEL SECURITY
-- ============================================================

ALTER TABLE members           ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users       ENABLE ROW LEVEL SECURITY;
ALTER TABLE events            ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals             ENABLE ROW LEVEL SECURITY;
ALTER TABLE advertisements    ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log      ENABLE ROW LEVEL SECURITY;

-- Helper: is the caller an admin?
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (SELECT 1 FROM admin_users WHERE auth_user_id = auth.uid());
$$ LANGUAGE sql SECURITY DEFINER;

-- members: member reads own row; admins full access; public can apply
DROP POLICY IF EXISTS "member_read_own"         ON members;
DROP POLICY IF EXISTS "admin_full_access_members" ON members;
DROP POLICY IF EXISTS "public_apply"            ON members;

CREATE POLICY "member_read_own"          ON members FOR SELECT USING (auth.uid() = auth_user_id);
CREATE POLICY "admin_full_access_members" ON members FOR ALL    USING (is_admin());
CREATE POLICY "public_apply"             ON members FOR INSERT  WITH CHECK (status = 'pending');

-- admin_users: admins only
DROP POLICY IF EXISTS "admin_read_admins"  ON admin_users;
DROP POLICY IF EXISTS "admin_write_admins" ON admin_users;

CREATE POLICY "admin_read_admins"  ON admin_users FOR SELECT USING (is_admin());
CREATE POLICY "admin_write_admins" ON admin_users FOR ALL    USING (is_admin());

-- events: authenticated users read; admins full access
DROP POLICY IF EXISTS "member_read_events"      ON events;
DROP POLICY IF EXISTS "admin_full_access_events" ON events;

CREATE POLICY "member_read_events"       ON events FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "admin_full_access_events" ON events FOR ALL    USING (is_admin());

-- event_registrations: members manage own; admins all
DROP POLICY IF EXISTS "member_own_registrations" ON event_registrations;
DROP POLICY IF EXISTS "admin_full_registrations" ON event_registrations;

CREATE POLICY "member_own_registrations" ON event_registrations
  FOR ALL USING (member_id IN (SELECT id FROM members WHERE auth_user_id = auth.uid()));
CREATE POLICY "admin_full_registrations" ON event_registrations FOR ALL USING (is_admin());

-- deals: authenticated users read; admins full access
DROP POLICY IF EXISTS "member_read_deals" ON deals;
DROP POLICY IF EXISTS "admin_full_deals"  ON deals;

CREATE POLICY "member_read_deals" ON deals FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "admin_full_deals"  ON deals FOR ALL    USING (is_admin());

-- advertisements: authenticated users read; admins full access
DROP POLICY IF EXISTS "member_read_ads" ON advertisements;
DROP POLICY IF EXISTS "admin_full_ads"  ON advertisements;

CREATE POLICY "member_read_ads" ON advertisements FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "admin_full_ads"  ON advertisements FOR ALL    USING (is_admin());

-- activity_log: admins read/write; API routes (service role) can always insert
DROP POLICY IF EXISTS "admin_full_log"    ON activity_log;
DROP POLICY IF EXISTS "service_write_log" ON activity_log;

CREATE POLICY "admin_full_log"    ON activity_log FOR ALL    USING (is_admin());
CREATE POLICY "service_write_log" ON activity_log FOR INSERT WITH CHECK (true);

-- ============================================================
-- DONE — add your first admin:
-- INSERT INTO admin_users (full_name, email, role)
-- VALUES ('Your Name', 'you@example.com', 'president');
-- ============================================================
