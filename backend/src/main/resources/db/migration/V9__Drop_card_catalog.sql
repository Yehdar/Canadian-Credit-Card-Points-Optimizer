-- Phase 2: Remove static card catalog — recommendations are now fully handled by Gemini.
-- spending_profiles is kept intact.

DROP TABLE IF EXISTS card_earn_rates;
DROP TABLE IF EXISTS credit_cards;
