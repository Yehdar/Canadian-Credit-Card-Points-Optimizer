-- Stores the full extracted context (spending, income, credit score, filters)
-- captured when the user saves their card arsenal.
-- Used by Re-sync to replay the same profile without re-chatting.
ALTER TABLE spending_profiles
    ADD COLUMN extracted_snapshot_json TEXT;
