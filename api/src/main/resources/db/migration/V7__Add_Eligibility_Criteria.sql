-- V7: Add income and credit-score eligibility columns.
--
-- Changes:
--   1. Add min_income_personal, min_income_household, min_credit_score to credit_cards.
--      NULL means no minimum is enforced for that dimension.
--   2. Add annual_income, household_income, estimated_credit_score to spending_profiles
--      so eligibility inputs can be persisted with a saved profile.
--   3. Seed income/credit-score thresholds for the existing 25 cards:
--        - Visa Infinite tier  : $60 k personal / $100 k household / 725 credit score
--        - World Elite tier    : $80 k personal / $150 k household / 760 credit score
--        - Amex Platinum       : 750 credit score (no official income floor)
--        - Scotiabank Gold Amex: 700 credit score (no official income floor)
--        - All other cards     : no minimums (columns remain NULL)

-- ── 1. Credit-card eligibility thresholds ────────────────────────────────────

ALTER TABLE credit_cards
    ADD COLUMN min_income_personal  INTEGER,   -- personal annual income in CAD; NULL = no minimum
    ADD COLUMN min_income_household INTEGER,   -- household annual income in CAD; NULL = no minimum
    ADD COLUMN min_credit_score     INTEGER;   -- minimum Equifax/TransUnion score; NULL = no minimum

COMMENT ON COLUMN credit_cards.min_income_personal  IS 'Minimum personal annual income (CAD) required for card approval; NULL = no minimum.';
COMMENT ON COLUMN credit_cards.min_income_household IS 'Minimum household annual income (CAD) required for card approval; NULL = no minimum.';
COMMENT ON COLUMN credit_cards.min_credit_score     IS 'Minimum credit score required for card approval; NULL = no minimum.';

-- ── 2. Profile eligibility inputs ────────────────────────────────────────────

ALTER TABLE spending_profiles
    ADD COLUMN annual_income          INTEGER,   -- user's personal annual income in CAD
    ADD COLUMN household_income       INTEGER,   -- user's household annual income in CAD
    ADD COLUMN estimated_credit_score INTEGER;   -- user's self-reported credit score

COMMENT ON COLUMN spending_profiles.annual_income          IS 'User''s personal annual income in CAD.';
COMMENT ON COLUMN spending_profiles.household_income       IS 'User''s household annual income in CAD.';
COMMENT ON COLUMN spending_profiles.estimated_credit_score IS 'User''s self-reported estimated credit score.';

-- ── 3. Seed Visa Infinite tier thresholds ────────────────────────────────────
-- Standard Canadian Visa Infinite requirement: $60 k personal or $100 k household, 725 score.

UPDATE credit_cards
SET min_income_personal  = 60000,
    min_income_household = 100000,
    min_credit_score     = 725
WHERE name ILIKE '%Visa Infinite%';

-- ── 4. Seed World Elite Mastercard tier thresholds ───────────────────────────
-- Standard Canadian World Elite requirement: $80 k personal or $150 k household, 760 score.

UPDATE credit_cards
SET min_income_personal  = 80000,
    min_income_household = 150000,
    min_credit_score     = 760
WHERE name ILIKE '%World Elite%';

-- ── 5. Seed premium Amex thresholds ──────────────────────────────────────────
-- Amex Platinum has no published income floor but a high credit requirement.

UPDATE credit_cards
SET min_credit_score = 750
WHERE name ILIKE '%Platinum%'
  AND issuer ILIKE '%American Express%';

-- ── 6. Seed Scotiabank Gold Amex threshold ───────────────────────────────────
-- Good-credit card; no official income minimum.

UPDATE credit_cards
SET min_credit_score = 700
WHERE name ILIKE '%Scotiabank Gold%';

-- ── 7. Seed Desjardins Odyssey Gold Visa threshold ───────────────────────────
-- Sits between standard and Visa Infinite; 680 score is a reasonable floor.

UPDATE credit_cards
SET min_credit_score = 680
WHERE name ILIKE '%Odyssey%'
  AND name NOT ILIKE '%World Elite%';
