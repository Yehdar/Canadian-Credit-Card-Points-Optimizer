-- V10: Persist Gemini-recommended card arsenals per spending profile.
-- Stored as a JSON text blob; no schema enforcement needed at the DB level.
ALTER TABLE spending_profiles
    ADD COLUMN saved_cards_json TEXT NULL;
