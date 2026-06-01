-- Announcements table migration
-- Run in: Supabase Dashboard → SQL Editor → New query
-- Project: https://ntplehmhhruzflvitool.supabase.co

-- ============================================================
-- TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS announcements (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title         text NOT NULL,
  body          text NOT NULL,
  status        text NOT NULL DEFAULT 'draft'
                  CHECK (status IN ('draft', 'published', 'scheduled')),
  published_at  timestamptz,
  scheduled_for timestamptz,
  created_by    uuid REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

-- ============================================================
-- AUTO-UPDATE updated_at
-- ============================================================

DROP TRIGGER IF EXISTS announcements_updated_at ON announcements;
CREATE TRIGGER announcements_updated_at
  BEFORE UPDATE ON announcements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- ROW-LEVEL SECURITY
-- ============================================================

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "member_read_announcements" ON announcements;
DROP POLICY IF EXISTS "admin_full_announcements"  ON announcements;

-- Authenticated users see published announcements and scheduled ones whose time has passed
CREATE POLICY "member_read_announcements" ON announcements
  FOR SELECT USING (
    auth.uid() IS NOT NULL
    AND (
      status = 'published'
      OR (status = 'scheduled' AND scheduled_for <= now())
    )
  );

-- Admins have full access (select, insert, update, delete)
CREATE POLICY "admin_full_announcements" ON announcements
  FOR ALL USING (is_admin());
