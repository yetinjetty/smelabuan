-- Announcements table migration
-- Run in: Supabase Dashboard → SQL Editor → New query

CREATE TABLE IF NOT EXISTS announcements (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title         text NOT NULL,
  body          text NOT NULL,
  status        text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'scheduled')),
  published_at  timestamptz,
  scheduled_for timestamptz,
  created_by    uuid REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

-- Auto-update updated_at
DROP TRIGGER IF EXISTS announcements_updated_at ON announcements;
CREATE TRIGGER announcements_updated_at
  BEFORE UPDATE ON announcements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Row-level security
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "member_read_announcements" ON announcements;
DROP POLICY IF EXISTS "admin_full_announcements"  ON announcements;

-- Members see published + live scheduled announcements
CREATE POLICY "member_read_announcements" ON announcements
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      status = 'published' OR
      (status = 'scheduled' AND scheduled_for <= now())
    )
  );

-- Admins have full access
CREATE POLICY "admin_full_announcements" ON announcements
  FOR ALL USING (is_admin());
