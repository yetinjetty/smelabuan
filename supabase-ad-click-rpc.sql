-- Run once in Supabase Dashboard → SQL Editor
-- Creates an atomic increment function for ad click tracking

CREATE OR REPLACE FUNCTION increment_ad_click(ad_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE advertisements
  SET click_count = click_count + 1
  WHERE id = ad_id;
$$;
