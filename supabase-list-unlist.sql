-- Migration: add listed column to events and deals
-- Run this once in the Supabase SQL editor.
-- All existing rows default to listed = true (visible to members).

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS listed boolean NOT NULL DEFAULT true;

ALTER TABLE deals
  ADD COLUMN IF NOT EXISTS listed boolean NOT NULL DEFAULT true;
