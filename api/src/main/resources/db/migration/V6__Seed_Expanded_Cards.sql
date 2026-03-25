-- V6: Expand card catalog from 11 to 25 cards.
--
-- Changes:
--   1. Add is_points_based (BOOLEAN) to credit_cards.
--   2. Backfill the 5 V4 spend categories for the original 11 seeded cards.
--   3. Insert 14 new cards covering all major Canadian issuers.
--   4. Seed all 13 earn-rate categories for every new card.
--   5. Set benefit flags and bonus multipliers for applicable new cards.
--
-- After this migration the catalog contains 25 cards across:
--   Big Five (RBC, TD, BMO, Scotiabank, CIBC) · Amex Canada · Rogers · PC Financial
--   Wealthsimple · National Bank · Desjardins · Canadian Tire · MBNA · Neo · Brim · Tangerine · Simplii

-- ── 1. Add is_points_based column ───────────────────────────────────────────

ALTER TABLE credit_cards
    ADD COLUMN is_points_based BOOLEAN NOT NULL DEFAULT TRUE;

COMMENT ON COLUMN credit_cards.is_points_based IS 'TRUE = traditional points currency; FALSE = cash-back / CT Money / store-credit equivalent.';

-- Cash-back cards already seeded in V2
UPDATE credit_cards
SET is_points_based = FALSE
WHERE points_currency IN ('Cash Back');

-- ── 2. Backfill V4 categories for original 11 cards ─────────────────────────
-- V2 only seeded earn rates for the original 8 categories.
-- V4 widened the schema; these rows make every card scoreable across all 13.

INSERT INTO card_earn_rates (card_id, category, earn_rate) VALUES
    -- ── Amex Cobalt (id=1) — 1× base on all new categories ─────────────────
    (1, 'pharmacy',               1.00),
    (1, 'online_shopping',        1.00),
    (1, 'home_improvement',       1.00),
    (1, 'canadian_tire_partners', 1.00),
    (1, 'foreign_purchases',      1.00),

    -- ── Scotiabank Gold Amex (id=2) — 1× base; no FX surcharge ─────────────
    (2, 'pharmacy',               1.00),
    (2, 'online_shopping',        1.00),
    (2, 'home_improvement',       1.00),
    (2, 'canadian_tire_partners', 1.00),
    (2, 'foreign_purchases',      1.00),

    -- ── TD First Class Travel Visa Infinite (id=3) — 2× matches 'other' ────
    (3, 'pharmacy',               2.00),
    (3, 'online_shopping',        2.00),
    (3, 'home_improvement',       2.00),
    (3, 'canadian_tire_partners', 2.00),
    (3, 'foreign_purchases',      2.00),

    -- ── TD Aeroplan Visa Infinite (id=4) — 1× base ──────────────────────────
    (4, 'pharmacy',               1.00),
    (4, 'online_shopping',        1.00),
    (4, 'home_improvement',       1.00),
    (4, 'canadian_tire_partners', 1.00),
    (4, 'foreign_purchases',      1.00),

    -- ── RBC Avion Visa Infinite (id=5) — 1× base ────────────────────────────
    (5, 'pharmacy',               1.00),
    (5, 'online_shopping',        1.00),
    (5, 'home_improvement',       1.00),
    (5, 'canadian_tire_partners', 1.00),
    (5, 'foreign_purchases',      1.00),

    -- ── RBC ION+ Visa (id=6) — 1.5× matches 'other' ────────────────────────
    (6, 'pharmacy',               1.50),
    (6, 'online_shopping',        1.50),
    (6, 'home_improvement',       1.50),
    (6, 'canadian_tire_partners', 1.50),
    (6, 'foreign_purchases',      1.50),

    -- ── BMO World Elite Mastercard (id=7) — 2× matches 'other' ─────────────
    (7, 'pharmacy',               2.00),
    (7, 'online_shopping',        2.00),
    (7, 'home_improvement',       2.00),
    (7, 'canadian_tire_partners', 2.00),
    (7, 'foreign_purchases',      2.00),

    -- ── CIBC Aventura Visa Infinite (id=8) — 1× base ────────────────────────
    (8, 'pharmacy',               1.00),
    (8, 'online_shopping',        1.00),
    (8, 'home_improvement',       1.00),
    (8, 'canadian_tire_partners', 1.00),
    (8, 'foreign_purchases',      1.00),

    -- ── Rogers Red World Elite (id=9) — 1.5× flat; no FX ───────────────────
    (9, 'pharmacy',               1.50),
    (9, 'online_shopping',        1.50),
    (9, 'home_improvement',       1.50),
    (9, 'canadian_tire_partners', 1.50),
    (9, 'foreign_purchases',      1.50),

    -- ── PC Financial World Elite (id=10) ────────────────────────────────────
    -- pharmacy=45: Shoppers Drug Mart is a Loblaws/PC Optimum banner (45 pts/$1)
    -- all others fall into the 10 pts/$1 base
    (10, 'pharmacy',               45.00),
    (10, 'online_shopping',        10.00),
    (10, 'home_improvement',       10.00),
    (10, 'canadian_tire_partners', 10.00),
    (10, 'foreign_purchases',      10.00),

    -- ── Wealthsimple Cash Visa (id=11) — 1× flat ────────────────────────────
    (11, 'pharmacy',               1.00),
    (11, 'online_shopping',        1.00),
    (11, 'home_improvement',       1.00),
    (11, 'canadian_tire_partners', 1.00),
    (11, 'foreign_purchases',      1.00);

-- ── 3. Insert 14 new cards ──────────────────────────────────────────────────

INSERT INTO credit_cards
    (name, issuer, annual_fee_cad, points_currency, cpp, card_type, is_points_based)
VALUES
    -- Big Five additions
    ('Scotiabank Passport Visa Infinite',             'Scotiabank',    150.00, 'Scene+',          1.00, 'visa',       TRUE ),
    ('CIBC Dividend Visa Infinite',                   'CIBC',          120.00, 'Cash Back',        1.00, 'visa',       FALSE),
    ('BMO eclipse Visa Infinite',                     'BMO',           120.00, 'BMO Rewards',      0.67, 'visa',       TRUE ),
    ('RBC WestJet World Elite Mastercard',            'RBC',           119.00, 'WestJet Dollars',  1.00, 'mastercard', TRUE ),

    -- Amex Canada
    ('Amex SimplyCash Preferred',                     'American Express', 99.00,  'Cash Back',     1.00, 'amex',       FALSE),
    ('Amex Platinum Card',                            'American Express', 799.00, 'Amex MR',       2.00, 'amex',       TRUE ),

    -- Fintechs / digital banks
    ('Tangerine World Mastercard',                    'Tangerine',       0.00, 'Cash Back',        1.00, 'mastercard', FALSE),
    ('Simplii Financial Cash Back Visa',              'Simplii',         0.00, 'Cash Back',        1.00, 'visa',       FALSE),
    ('Neo Financial Mastercard',                      'Neo Financial',   0.00, 'Cash Back',        1.00, 'mastercard', FALSE),
    ('Brim World Elite Mastercard',                   'Brim Financial',  0.00, 'Brim Rewards',     1.00, 'mastercard', TRUE ),

    -- Retailers / co-brands
    ('Canadian Tire Triangle World Elite Mastercard', 'Canadian Tire',   0.00, 'CT Money',         1.00, 'mastercard', FALSE),
    ('MBNA Amazon.ca Rewards Mastercard',             'MBNA',            0.00, 'Amazon Rewards',   1.00, 'mastercard', FALSE),

    -- Other major banks
    ('National Bank World Elite Mastercard',          'National Bank', 150.00, 'À la carte',       0.67, 'mastercard', TRUE ),
    ('Desjardins Odyssey World Elite Visa Infinite',  'Desjardins',    130.00, 'Odyssey',          0.67, 'visa',       TRUE );

-- ── 4. Earn rates for new cards (all 13 categories each) ────────────────────
-- Pattern: CROSS JOIN (VALUES ...) lets us insert all 13 rows with one query per card.

-- ── Scotiabank Passport Visa Infinite ───────────────────────────────────────
-- 3× grocery (Sobeys/Safeway/FreshCo); 2× dining/entertainment/transit/gas/travel; 1× other
INSERT INTO card_earn_rates (card_id, category, earn_rate)
SELECT c.id, r.category, r.earn_rate
FROM   credit_cards c
CROSS JOIN (VALUES
    ('groceries',              3.00),
    ('dining',                 2.00),
    ('gas',                    2.00),
    ('travel',                 2.00),
    ('entertainment',          2.00),
    ('subscriptions',          1.00),
    ('transit',                2.00),
    ('other',                  1.00),
    ('pharmacy',               1.00),
    ('online_shopping',        1.00),
    ('home_improvement',       1.00),
    ('canadian_tire_partners', 1.00),
    ('foreign_purchases',      1.00)   -- no FX surcharge
) AS r(category, earn_rate)
WHERE  c.name = 'Scotiabank Passport Visa Infinite';

-- ── CIBC Dividend Visa Infinite ─────────────────────────────────────────────
-- 4× grocery + gas; 2× dining/transit/subscriptions; 1× other
INSERT INTO card_earn_rates (card_id, category, earn_rate)
SELECT c.id, r.category, r.earn_rate
FROM   credit_cards c
CROSS JOIN (VALUES
    ('groceries',              4.00),
    ('dining',                 2.00),
    ('gas',                    4.00),
    ('travel',                 1.00),
    ('entertainment',          1.00),
    ('subscriptions',          2.00),
    ('transit',                2.00),
    ('other',                  1.00),
    ('pharmacy',               1.00),
    ('online_shopping',        1.00),
    ('home_improvement',       1.00),
    ('canadian_tire_partners', 1.00),
    ('foreign_purchases',      1.00)
) AS r(category, earn_rate)
WHERE  c.name = 'CIBC Dividend Visa Infinite';

-- ── BMO eclipse Visa Infinite ───────────────────────────────────────────────
-- 5× grocery/dining/gas/transit/pharmacy; 1× other
-- cpp=0.67 → 5×0.67/100 = 3.35% effective on those categories
INSERT INTO card_earn_rates (card_id, category, earn_rate)
SELECT c.id, r.category, r.earn_rate
FROM   credit_cards c
CROSS JOIN (VALUES
    ('groceries',              5.00),
    ('dining',                 5.00),
    ('gas',                    5.00),
    ('travel',                 1.00),
    ('entertainment',          1.00),
    ('subscriptions',          1.00),
    ('transit',                5.00),
    ('other',                  1.00),
    ('pharmacy',               5.00),
    ('online_shopping',        1.00),
    ('home_improvement',       1.00),
    ('canadian_tire_partners', 1.00),
    ('foreign_purchases',      1.00)
) AS r(category, earn_rate)
WHERE  c.name = 'BMO eclipse Visa Infinite';

-- ── RBC WestJet World Elite Mastercard ──────────────────────────────────────
-- 2% WestJet flights (travel); 1.5% everywhere else
INSERT INTO card_earn_rates (card_id, category, earn_rate)
SELECT c.id, r.category, r.earn_rate
FROM   credit_cards c
CROSS JOIN (VALUES
    ('groceries',              1.50),
    ('dining',                 1.50),
    ('gas',                    1.50),
    ('travel',                 2.00),
    ('entertainment',          1.50),
    ('subscriptions',          1.50),
    ('transit',                1.50),
    ('other',                  1.50),
    ('pharmacy',               1.50),
    ('online_shopping',        1.50),
    ('home_improvement',       1.50),
    ('canadian_tire_partners', 1.50),
    ('foreign_purchases',      1.50)
) AS r(category, earn_rate)
WHERE  c.name = 'RBC WestJet World Elite Mastercard';

-- ── Amex SimplyCash Preferred ───────────────────────────────────────────────
-- Flat 2% on all purchases; no FX surcharge (Amex Canada)
INSERT INTO card_earn_rates (card_id, category, earn_rate)
SELECT c.id, r.category, r.earn_rate
FROM   credit_cards c
CROSS JOIN (VALUES
    ('groceries',              2.00),
    ('dining',                 2.00),
    ('gas',                    2.00),
    ('travel',                 2.00),
    ('entertainment',          2.00),
    ('subscriptions',          2.00),
    ('transit',                2.00),
    ('other',                  2.00),
    ('pharmacy',               2.00),
    ('online_shopping',        2.00),
    ('home_improvement',       2.00),
    ('canadian_tire_partners', 2.00),
    ('foreign_purchases',      2.00)
) AS r(category, earn_rate)
WHERE  c.name = 'Amex SimplyCash Preferred';

-- ── Amex Platinum Card ──────────────────────────────────────────────────────
-- 3× dining; 2× travel; 1× other — cpp=2.00¢/pt (premium redemptions)
-- → dining: 3×2.00/100 = 6%  travel: 2×2.00/100 = 4%  other: 2%
INSERT INTO card_earn_rates (card_id, category, earn_rate)
SELECT c.id, r.category, r.earn_rate
FROM   credit_cards c
CROSS JOIN (VALUES
    ('groceries',              1.00),
    ('dining',                 3.00),
    ('gas',                    1.00),
    ('travel',                 2.00),
    ('entertainment',          1.00),
    ('subscriptions',          1.00),
    ('transit',                1.00),
    ('other',                  1.00),
    ('pharmacy',               1.00),
    ('online_shopping',        1.00),
    ('home_improvement',       1.00),
    ('canadian_tire_partners', 1.00),
    ('foreign_purchases',      1.00)
) AS r(category, earn_rate)
WHERE  c.name = 'Amex Platinum Card';

-- ── Tangerine World Mastercard ──────────────────────────────────────────────
-- 2% in 3 chosen categories (modelled as grocery/dining/gas — most common picks)
-- 0.5% everywhere else
INSERT INTO card_earn_rates (card_id, category, earn_rate)
SELECT c.id, r.category, r.earn_rate
FROM   credit_cards c
CROSS JOIN (VALUES
    ('groceries',              2.00),
    ('dining',                 2.00),
    ('gas',                    2.00),
    ('travel',                 0.50),
    ('entertainment',          0.50),
    ('subscriptions',          0.50),
    ('transit',                0.50),
    ('other',                  0.50),
    ('pharmacy',               0.50),
    ('online_shopping',        0.50),
    ('home_improvement',       0.50),
    ('canadian_tire_partners', 0.50),
    ('foreign_purchases',      0.50)
) AS r(category, earn_rate)
WHERE  c.name = 'Tangerine World Mastercard';

-- ── Simplii Financial Cash Back Visa ────────────────────────────────────────
-- 4% dining (restaurants/bars); 1.5% grocery/gas/pharmacy; 0.5% other
INSERT INTO card_earn_rates (card_id, category, earn_rate)
SELECT c.id, r.category, r.earn_rate
FROM   credit_cards c
CROSS JOIN (VALUES
    ('groceries',              1.50),
    ('dining',                 4.00),
    ('gas',                    1.50),
    ('travel',                 0.50),
    ('entertainment',          0.50),
    ('subscriptions',          0.50),
    ('transit',                0.50),
    ('other',                  0.50),
    ('pharmacy',               1.50),
    ('online_shopping',        0.50),
    ('home_improvement',       0.50),
    ('canadian_tire_partners', 0.50),
    ('foreign_purchases',      0.50)
) AS r(category, earn_rate)
WHERE  c.name = 'Simplii Financial Cash Back Visa';

-- ── Neo Financial Mastercard ────────────────────────────────────────────────
-- Variable partner rates; modelled conservatively:
-- 2% dining/online at Neo partners; 1.5% grocery; 0.5% base
INSERT INTO card_earn_rates (card_id, category, earn_rate)
SELECT c.id, r.category, r.earn_rate
FROM   credit_cards c
CROSS JOIN (VALUES
    ('groceries',              1.50),
    ('dining',                 2.00),
    ('gas',                    1.00),
    ('travel',                 1.00),
    ('entertainment',          1.00),
    ('subscriptions',          0.50),
    ('transit',                0.50),
    ('other',                  0.50),
    ('pharmacy',               1.00),
    ('online_shopping',        2.00),
    ('home_improvement',       0.50),
    ('canadian_tire_partners', 0.50),
    ('foreign_purchases',      0.50)
) AS r(category, earn_rate)
WHERE  c.name = 'Neo Financial Mastercard';

-- ── Brim World Elite Mastercard ─────────────────────────────────────────────
-- Flat 1% on all purchases; no FX surcharge; additional points at Brim partners
INSERT INTO card_earn_rates (card_id, category, earn_rate)
SELECT c.id, r.category, r.earn_rate
FROM   credit_cards c
CROSS JOIN (VALUES
    ('groceries',              1.00),
    ('dining',                 1.00),
    ('gas',                    1.00),
    ('travel',                 1.00),
    ('entertainment',          1.00),
    ('subscriptions',          1.00),
    ('transit',                1.00),
    ('other',                  1.00),
    ('pharmacy',               1.00),
    ('online_shopping',        1.00),
    ('home_improvement',       1.00),
    ('canadian_tire_partners', 1.00),
    ('foreign_purchases',      1.00)
) AS r(category, earn_rate)
WHERE  c.name = 'Brim World Elite Mastercard';

-- ── Canadian Tire Triangle World Elite Mastercard ───────────────────────────
-- 4% CT Money at CT/Sport Chek/Mark's/Gas+ partners (canadian_tire_partners)
-- 3% at Gas+/Husky fuel stations (gas)
-- 1.5% grocery at Loblaw/Metro/etc (not CT stores, so conservative)
-- 0.5% everywhere else
-- cpp=1.00 (1 CT Dollar = $0.01 at Canadian Tire registers)
INSERT INTO card_earn_rates (card_id, category, earn_rate)
SELECT c.id, r.category, r.earn_rate
FROM   credit_cards c
CROSS JOIN (VALUES
    ('groceries',              1.50),
    ('dining',                 0.50),
    ('gas',                    3.00),
    ('travel',                 0.50),
    ('entertainment',          0.50),
    ('subscriptions',          0.50),
    ('transit',                0.50),
    ('other',                  0.50),
    ('pharmacy',               0.50),
    ('online_shopping',        0.50),
    ('home_improvement',       1.00),  -- CT sells hardware; partial benefit
    ('canadian_tire_partners', 4.00),
    ('foreign_purchases',      0.50)
) AS r(category, earn_rate)
WHERE  c.name = 'Canadian Tire Triangle World Elite Mastercard';

-- ── MBNA Amazon.ca Rewards Mastercard ───────────────────────────────────────
-- Base (non-Prime): 1.67% at Amazon.ca and Whole Foods; 1% elsewhere
-- Amazon Prime multiplier = 1.50× (bumps Amazon rate to ~2.5%)
INSERT INTO card_earn_rates (card_id, category, earn_rate)
SELECT c.id, r.category, r.earn_rate
FROM   credit_cards c
CROSS JOIN (VALUES
    ('groceries',              1.00),
    ('dining',                 1.67),  -- Whole Foods
    ('gas',                    1.00),
    ('travel',                 1.00),
    ('entertainment',          1.00),
    ('subscriptions',          1.00),
    ('transit',                1.00),
    ('other',                  1.00),
    ('pharmacy',               1.00),
    ('online_shopping',        1.67),  -- Amazon.ca
    ('home_improvement',       1.00),
    ('canadian_tire_partners', 1.00),
    ('foreign_purchases',      1.00)
) AS r(category, earn_rate)
WHERE  c.name = 'MBNA Amazon.ca Rewards Mastercard';

-- ── National Bank World Elite Mastercard ────────────────────────────────────
-- 5× dining + grocery + online; 2× gas/travel/transit; 1× other
-- cpp=0.67 → 5×0.67/100 = 3.35% effective on bonus categories
-- No foreign transaction fee
INSERT INTO card_earn_rates (card_id, category, earn_rate)
SELECT c.id, r.category, r.earn_rate
FROM   credit_cards c
CROSS JOIN (VALUES
    ('groceries',              5.00),
    ('dining',                 5.00),
    ('gas',                    2.00),
    ('travel',                 2.00),
    ('entertainment',          1.00),
    ('subscriptions',          1.00),
    ('transit',                2.00),
    ('other',                  1.00),
    ('pharmacy',               1.00),
    ('online_shopping',        5.00),
    ('home_improvement',       1.00),
    ('canadian_tire_partners', 1.00),
    ('foreign_purchases',      1.00)
) AS r(category, earn_rate)
WHERE  c.name = 'National Bank World Elite Mastercard';

-- ── Desjardins Odyssey World Elite Visa Infinite ────────────────────────────
-- 3× dining + grocery + entertainment; 2× gas/travel/transit/pharmacy; 1.5× other
-- No foreign transaction fee
INSERT INTO card_earn_rates (card_id, category, earn_rate)
SELECT c.id, r.category, r.earn_rate
FROM   credit_cards c
CROSS JOIN (VALUES
    ('groceries',              3.00),
    ('dining',                 3.00),
    ('gas',                    2.00),
    ('travel',                 2.00),
    ('entertainment',          3.00),
    ('subscriptions',          1.50),
    ('transit',                2.00),
    ('other',                  1.50),
    ('pharmacy',               2.00),
    ('online_shopping',        1.50),
    ('home_improvement',       1.50),
    ('canadian_tire_partners', 1.50),
    ('foreign_purchases',      1.50)
) AS r(category, earn_rate)
WHERE  c.name = 'Desjardins Odyssey World Elite Visa Infinite';

-- ── 5. Benefit flags for new cards ──────────────────────────────────────────

-- Scotiabank Passport Visa Infinite: no FX, Visa Airport Companion (6 free visits)
UPDATE credit_cards
SET no_foreign_fee  = TRUE,
    airport_lounge  = TRUE
WHERE name = 'Scotiabank Passport Visa Infinite';

-- Amex SimplyCash Preferred: Amex Canada charges no FX surcharge
UPDATE credit_cards
SET no_foreign_fee = TRUE
WHERE name = 'Amex SimplyCash Preferred';

-- Amex Platinum Card: no FX, unlimited Centurion + Priority Pass lounge, full travel perks
UPDATE credit_cards
SET no_foreign_fee  = TRUE,
    airport_lounge  = TRUE,
    priority_travel = TRUE
WHERE name = 'Amex Platinum Card';

-- RBC WestJet World Elite: free first checked bag on WestJet; companion voucher = priority travel
UPDATE credit_cards
SET free_checked_bag = TRUE,
    priority_travel  = TRUE
WHERE name = 'RBC WestJet World Elite Mastercard';

-- National Bank World Elite: no FX, Priority Pass lounge, travel credits = priority travel
UPDATE credit_cards
SET no_foreign_fee  = TRUE,
    airport_lounge  = TRUE,
    priority_travel = TRUE
WHERE name = 'National Bank World Elite Mastercard';

-- Desjardins Odyssey World Elite: no FX, Priority Pass lounge, travel benefits
UPDATE credit_cards
SET no_foreign_fee  = TRUE,
    airport_lounge  = TRUE,
    priority_travel = TRUE
WHERE name = 'Desjardins Odyssey World Elite Visa Infinite';

-- Neo Financial: no foreign transaction fee
UPDATE credit_cards
SET no_foreign_fee = TRUE
WHERE name = 'Neo Financial Mastercard';

-- Brim World Elite: no foreign transaction fee
UPDATE credit_cards
SET no_foreign_fee = TRUE
WHERE name = 'Brim World Elite Mastercard';

-- ── 6. Bonus multipliers ────────────────────────────────────────────────────

-- MBNA Amazon.ca: Amazon Prime members earn ~2.5% on Amazon.ca vs 1.67% base
-- amazon_prime_multiplier = 1.50 (1.67 × 1.50 ≈ 2.50)
UPDATE credit_cards
SET amazon_prime_multiplier = 1.50
WHERE name = 'MBNA Amazon.ca Rewards Mastercard';
