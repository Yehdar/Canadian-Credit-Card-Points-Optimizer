-- V7: Add income and credit-score eligibility columns.
--
-- Changes:
--   1. Add min_income_personal, min_income_household, min_credit_score to credit_cards.
--      NULL means no minimum is enforced for that dimension.
--   2. Add annual_income, household_income, estimated_credit_score to spending_profiles
--      so eligibility inputs can be persisted with a saved profile.
--   3. Seed precise per-card eligibility thresholds using exact name matches.
--
-- NOTE: Broad ILIKE patterns are intentionally avoided here. Cards like
-- "PC Financial World Elite Mastercard" and "Canadian Tire Triangle World Elite
-- Mastercard" carry the "World Elite" name but have no income minimum (they are
-- co-brand/retail cards). Similarly, Visa Infinite cards generally require a 680
-- credit score, not 725. Exact name matches prevent these false positives.

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

-- ── 3. No-income cards with a credit-score floor ──────────────────────────────
-- These cards are open to most applicants but still expect a minimum credit health.

UPDATE credit_cards SET min_credit_score = 660 WHERE name = 'Amex Cobalt';
UPDATE credit_cards SET min_credit_score = 700 WHERE name = 'Scotiabank Gold American Express';
UPDATE credit_cards SET min_credit_score = 660 WHERE name = 'RBC ION+ Visa';
UPDATE credit_cards SET min_credit_score = 660 WHERE name = 'Amex SimplyCash Preferred';
UPDATE credit_cards SET min_credit_score = 700 WHERE name = 'Amex Platinum Card';
UPDATE credit_cards SET min_credit_score = 660 WHERE name = 'Tangerine World Mastercard';
UPDATE credit_cards SET min_credit_score = 660 WHERE name = 'Simplii Financial Cash Back Visa';
UPDATE credit_cards SET min_credit_score = 600 WHERE name = 'Neo Financial Mastercard';

-- Co-brand/retail World Elite cards: no income minimum, accessible credit floor
UPDATE credit_cards SET min_credit_score = 660 WHERE name = 'PC Financial World Elite Mastercard';
UPDATE credit_cards SET min_credit_score = 660 WHERE name = 'Canadian Tire Triangle World Elite Mastercard';
UPDATE credit_cards SET min_credit_score = 660 WHERE name = 'MBNA Amazon.ca Rewards Mastercard';

-- Wealthsimple Cash Visa: no requirements (prepaid-style; NULL = no minimum)

-- ── 4. Visa Infinite tier ─────────────────────────────────────────────────────
-- Standard Canadian Visa Infinite requirement: $60 k personal or $100 k household.
-- Most issuers set a 680 credit-score floor; Scotia/BMO-branded cards use 700.

UPDATE credit_cards
SET min_income_personal  = 60000,
    min_income_household = 100000,
    min_credit_score     = 680
WHERE name IN (
    'TD First Class Travel Visa Infinite',
    'TD Aeroplan Visa Infinite',
    'RBC Avion Visa Infinite',
    'CIBC Aventura Visa Infinite',
    'CIBC Dividend Visa Infinite'
);

UPDATE credit_cards
SET min_income_personal  = 60000,
    min_income_household = 100000,
    min_credit_score     = 700
WHERE name IN (
    'Scotiabank Passport Visa Infinite',
    'BMO eclipse Visa Infinite'
);

-- ── 5. World Elite Mastercard tier ───────────────────────────────────────────
-- Standard Canadian World Elite requirement: $80 k personal or $150 k household.
-- Score requirement varies: flagship bank WE cards require 760; Rogers/Brim are ~700.

UPDATE credit_cards
SET min_income_personal  = 80000,
    min_income_household = 150000,
    min_credit_score     = 760
WHERE name IN (
    'BMO World Elite Mastercard',
    'National Bank World Elite Mastercard'
);

UPDATE credit_cards
SET min_income_personal  = 80000,
    min_income_household = 150000,
    min_credit_score     = 700
WHERE name IN (
    'Rogers Red World Elite Mastercard',
    'Brim World Elite Mastercard'
);

UPDATE credit_cards
SET min_income_personal  = 80000,
    min_income_household = 150000,
    min_credit_score     = 720
WHERE name = 'RBC WestJet World Elite Mastercard';

-- ── 6. Desjardins Odyssey World Elite Visa Infinite ───────────────────────────
-- Carries both Visa Infinite and World Elite designations.
-- Official requirement: $80 k personal or $150 k household, 750+ score.

UPDATE credit_cards
SET min_income_personal  = 80000,
    min_income_household = 150000,
    min_credit_score     = 750
WHERE name = 'Desjardins Odyssey World Elite Visa Infinite';
