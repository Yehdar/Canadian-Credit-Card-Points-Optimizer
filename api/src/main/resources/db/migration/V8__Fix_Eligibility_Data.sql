-- V8: Replace broad ILIKE-pattern eligibility thresholds with precise per-card values.
--
-- V7 used ILIKE '%Visa Infinite%' and '%World Elite%' patterns which incorrectly
-- assigned income minimums to cards that have none (PC Financial WE, Canadian Tire WE)
-- and set credit-score floors too high (725 instead of 680 for standard Visa Infinite),
-- causing most premium cards to vanish for users in the 600-699 credit-score bucket.
--
-- This migration:
--   1. Resets all eligibility columns to NULL.
--   2. Sets precise income and credit-score requirements per card using exact name matches.

-- ── 1. Reset ──────────────────────────────────────────────────────────────────

UPDATE credit_cards
SET min_income_personal  = NULL,
    min_income_household = NULL,
    min_credit_score     = NULL;

-- ── 2. No-income cards with a credit-score floor ──────────────────────────────
-- These cards are open to most applicants but still expect a minimum credit health.

-- Amex Cobalt — no income minimum, 660+ score
UPDATE credit_cards SET min_credit_score = 660
WHERE name = 'Amex Cobalt';

-- Scotiabank Gold American Express — no income minimum, 700+ score
UPDATE credit_cards SET min_credit_score = 700
WHERE name = 'Scotiabank Gold American Express';

-- RBC ION+ Visa — no income minimum, 660+ score
UPDATE credit_cards SET min_credit_score = 660
WHERE name = 'RBC ION+ Visa';

-- Amex SimplyCash Preferred — no income minimum, 660+ score
UPDATE credit_cards SET min_credit_score = 660
WHERE name = 'Amex SimplyCash Preferred';

-- Amex Platinum Card — no income minimum, 700+ score
UPDATE credit_cards SET min_credit_score = 700
WHERE name = 'Amex Platinum Card';

-- Tangerine World Mastercard — no income minimum, 660+ score
UPDATE credit_cards SET min_credit_score = 660
WHERE name = 'Tangerine World Mastercard';

-- Simplii Financial Cash Back Visa — no income minimum, 660+ score
UPDATE credit_cards SET min_credit_score = 660
WHERE name = 'Simplii Financial Cash Back Visa';

-- Neo Financial Mastercard — accessible card, 600+ score
UPDATE credit_cards SET min_credit_score = 600
WHERE name = 'Neo Financial Mastercard';

-- PC Financial World Elite Mastercard — no official income minimum (accessible WE), 660+ score
UPDATE credit_cards SET min_credit_score = 660
WHERE name = 'PC Financial World Elite Mastercard';

-- Canadian Tire Triangle World Elite Mastercard — no income minimum, 660+ score
UPDATE credit_cards SET min_credit_score = 660
WHERE name = 'Canadian Tire Triangle World Elite Mastercard';

-- MBNA Amazon.ca Rewards Mastercard — no income minimum, 660+ score
UPDATE credit_cards SET min_credit_score = 660
WHERE name = 'MBNA Amazon.ca Rewards Mastercard';

-- Wealthsimple Cash Visa — no requirements (prepaid-style card)
-- (remains NULL / no minimum)

-- ── 3. Visa Infinite tier ─────────────────────────────────────────────────────
-- Standard Canadian Visa Infinite: $60 k personal or $100 k household.
-- Credit-score floor varies slightly by issuer; most are 680, Scotia-branded are 700.

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

-- Scotia / BMO Visa Infinite — same income floor, 700 score
UPDATE credit_cards
SET min_income_personal  = 60000,
    min_income_household = 100000,
    min_credit_score     = 700
WHERE name IN (
    'Scotiabank Passport Visa Infinite',
    'BMO eclipse Visa Infinite'
);

-- ── 4. World Elite Mastercard tier ───────────────────────────────────────────
-- Standard: $80 k personal or $150 k household.
-- Score requirement varies: flagship bank WE cards require 760; Rogers/Brim are ~700.

-- BMO / National Bank flagship WE — 760 score
UPDATE credit_cards
SET min_income_personal  = 80000,
    min_income_household = 150000,
    min_credit_score     = 760
WHERE name IN (
    'BMO World Elite Mastercard',
    'National Bank World Elite Mastercard'
);

-- Rogers / Brim WE — 700 score (more accessible WE cards)
UPDATE credit_cards
SET min_income_personal  = 80000,
    min_income_household = 150000,
    min_credit_score     = 700
WHERE name IN (
    'Rogers Red World Elite Mastercard',
    'Brim World Elite Mastercard'
);

-- RBC WestJet WE — 720 score
UPDATE credit_cards
SET min_income_personal  = 80000,
    min_income_household = 150000,
    min_credit_score     = 720
WHERE name = 'RBC WestJet World Elite Mastercard';

-- ── 5. Desjardins Odyssey World Elite Visa Infinite ───────────────────────────
-- This card carries both a Visa Infinite and a World Elite designation.
-- Official requirement: $80 k personal or $150 k household, 750+ score.

UPDATE credit_cards
SET min_income_personal  = 80000,
    min_income_household = 150000,
    min_credit_score     = 750
WHERE name = 'Desjardins Odyssey World Elite Visa Infinite';
