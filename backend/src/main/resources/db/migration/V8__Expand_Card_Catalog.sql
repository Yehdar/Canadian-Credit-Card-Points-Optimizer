-- V9: Expand card catalog from 25 to 52 cards.
--
-- Adds 27 new cards covering:
--   · TD, RBC, BMO, CIBC, Scotiabank, National Bank, Desjardins (additional products)
--   · American Express (Gold Rewards, Aeroplan)
--   · MBNA, Fido, Canadian Tire (base tier)
--   · Alternative banks: Home Trust, Manulife Bank, Meridian Credit Union,
--                        ATB Financial, EQ Bank
--
-- Each card is seeded with all 13 earn-rate categories.
-- Benefit flags and eligibility thresholds follow the INSERTs.

-- ── INSERT: 27 new credit cards ───────────────────────────────────────────────

INSERT INTO credit_cards
    (name, issuer, annual_fee_cad, points_currency, cpp, card_type, is_points_based)
VALUES
    -- TD
    ('TD Cash Back Visa Infinite',              'TD',                   139.00, 'Cash Back',        1.0000, 'visa',       FALSE),
    ('TD Platinum Travel Visa',                 'TD',                    89.00, 'TD Points',         0.5000, 'visa',       TRUE),
    ('TD Aeroplan Visa Infinite Privilege',     'TD',                   599.00, 'Aeroplan',          1.5000, 'visa',       TRUE),
    -- RBC
    ('RBC WestJet Mastercard',                  'RBC',                   39.00, 'WestJet Dollars',   1.0000, 'mastercard', FALSE),
    ('RBC Avion Visa Infinite Privilege',       'RBC',                  399.00, 'Avion Points',      1.2500, 'visa',       TRUE),
    -- BMO
    ('BMO CashBack World Mastercard',           'BMO',                    0.00, 'Cash Back',         1.0000, 'mastercard', FALSE),
    ('BMO CashBack World Elite Mastercard',     'BMO',                  120.00, 'Cash Back',         1.0000, 'mastercard', FALSE),
    ('BMO Air Miles World Elite Mastercard',    'BMO',                  120.00, 'Air Miles',         1.1500, 'mastercard', TRUE),
    ('BMO eclipse Rise Visa',                   'BMO',                    0.00, 'BMO Rewards',       0.5000, 'visa',       TRUE),
    -- CIBC
    ('CIBC Aerogold Visa Infinite',             'CIBC',                 139.00, 'Aeroplan',          1.5000, 'visa',       TRUE),
    ('CIBC Aerogold Visa Infinite Privilege',   'CIBC',                 599.00, 'Aeroplan',          1.5000, 'visa',       TRUE),
    -- Scotiabank
    ('Scotiabank Scene+ Visa',                  'Scotiabank',             0.00, 'Scene+',            1.0000, 'visa',       TRUE),
    ('Scotiabank Momentum Visa Infinite',       'Scotiabank',           120.00, 'Cash Back',         1.0000, 'visa',       FALSE),
    -- National Bank
    ('National Bank Platinum Mastercard',       'National Bank',         70.00, 'À la carte',        0.6700, 'mastercard', TRUE),
    -- Desjardins
    ('Desjardins Odyssey Visa Infinite',        'Desjardins',           130.00, 'Desjardins Bonus',  1.0000, 'visa',       TRUE),
    ('Desjardins Cash Back Visa',               'Desjardins',             0.00, 'Cash Back',         1.0000, 'visa',       FALSE),
    -- American Express
    ('Amex Gold Rewards Card',                  'American Express',     250.00, 'Amex MR',           1.5000, 'amex',       TRUE),
    ('American Express Aeroplan Card',          'American Express',     120.00, 'Aeroplan',          1.5000, 'amex',       TRUE),
    -- MBNA
    ('MBNA Rewards World Elite Mastercard',     'MBNA',                 120.00, 'MBNA Rewards',      1.0000, 'mastercard', FALSE),
    -- Rogers Bank
    ('Fido Mastercard',                         'Rogers Bank',            0.00, 'Cash Back',         1.0000, 'mastercard', FALSE),
    -- Canadian Tire
    ('Canadian Tire Triangle Mastercard',       'Canadian Tire',          0.00, 'CT Money',          1.0000, 'mastercard', FALSE),
    -- PC Financial
    ('PC Financial Mastercard',                 'PC Financial',           0.00, 'PC Optimum',        0.1000, 'mastercard', TRUE),
    -- ── Alternative banks ──────────────────────────────────────────────────────
    ('Home Trust Preferred Visa',               'Home Trust',             0.00, 'Cash Back',         1.0000, 'visa',       FALSE),
    ('Manulife CashBack Visa Infinite',         'Manulife Bank',        120.00, 'Cash Back',         1.0000, 'visa',       FALSE),
    ('Meridian Visa Infinite Cash Back',        'Meridian Credit Union',  99.00, 'Cash Back',        1.0000, 'visa',       FALSE),
    ('ATB Platinum Mastercard',                 'ATB Financial',          0.00, 'Cash Back',         1.0000, 'mastercard', FALSE),
    ('EQ Bank Card',                            'EQ Bank',                0.00, 'Cash Back',         1.0000, 'visa',       FALSE);

-- ── INSERT: earn rates (all 13 categories per card) ───────────────────────────

-- TD Cash Back Visa Infinite: 3% groceries/gas/recurring bills, 1% elsewhere
INSERT INTO card_earn_rates (card_id, category, earn_rate)
SELECT c.id, r.category, r.earn_rate FROM credit_cards c
CROSS JOIN (VALUES
    ('groceries',              3.00),
    ('dining',                 1.00),
    ('gas',                    3.00),
    ('travel',                 1.00),
    ('entertainment',          1.00),
    ('subscriptions',          3.00),
    ('transit',                1.00),
    ('other',                  1.00),
    ('pharmacy',               1.00),
    ('online_shopping',        1.00),
    ('home_improvement',       1.00),
    ('canadian_tire_partners', 1.00),
    ('foreign_purchases',      1.00)
) AS r(category, earn_rate)
WHERE c.name = 'TD Cash Back Visa Infinite';

-- TD Platinum Travel Visa: 3x groceries/gas, 2x dining/travel, 1x elsewhere (cpp 0.5)
INSERT INTO card_earn_rates (card_id, category, earn_rate)
SELECT c.id, r.category, r.earn_rate FROM credit_cards c
CROSS JOIN (VALUES
    ('groceries',              3.00),
    ('dining',                 2.00),
    ('gas',                    3.00),
    ('travel',                 2.00),
    ('entertainment',          1.50),
    ('subscriptions',          1.50),
    ('transit',                1.50),
    ('other',                  1.00),
    ('pharmacy',               1.50),
    ('online_shopping',        1.50),
    ('home_improvement',       1.00),
    ('canadian_tire_partners', 1.00),
    ('foreign_purchases',      1.00)
) AS r(category, earn_rate)
WHERE c.name = 'TD Platinum Travel Visa';

-- TD Aeroplan Visa Infinite Privilege: 3x travel, 2x grocery/gas/dining, 1.5x elsewhere
INSERT INTO card_earn_rates (card_id, category, earn_rate)
SELECT c.id, r.category, r.earn_rate FROM credit_cards c
CROSS JOIN (VALUES
    ('groceries',              2.00),
    ('dining',                 2.00),
    ('gas',                    2.00),
    ('travel',                 3.00),
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
WHERE c.name = 'TD Aeroplan Visa Infinite Privilege';

-- RBC WestJet Mastercard: 2% WestJet (travel), 1% everywhere else
INSERT INTO card_earn_rates (card_id, category, earn_rate)
SELECT c.id, r.category, r.earn_rate FROM credit_cards c
CROSS JOIN (VALUES
    ('groceries',              1.00),
    ('dining',                 1.00),
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
WHERE c.name = 'RBC WestJet Mastercard';

-- RBC Avion Visa Infinite Privilege: flat 1.25x everywhere (premium travel card)
INSERT INTO card_earn_rates (card_id, category, earn_rate)
SELECT c.id, r.category, r.earn_rate FROM credit_cards c
CROSS JOIN (VALUES
    ('groceries',              1.25),
    ('dining',                 1.25),
    ('gas',                    1.25),
    ('travel',                 1.25),
    ('entertainment',          1.25),
    ('subscriptions',          1.25),
    ('transit',                1.25),
    ('other',                  1.25),
    ('pharmacy',               1.25),
    ('online_shopping',        1.25),
    ('home_improvement',       1.25),
    ('canadian_tire_partners', 1.25),
    ('foreign_purchases',      1.25)
) AS r(category, earn_rate)
WHERE c.name = 'RBC Avion Visa Infinite Privilege';

-- BMO CashBack World Mastercard: 3% grocery, 1% recurring, 0.5% elsewhere
INSERT INTO card_earn_rates (card_id, category, earn_rate)
SELECT c.id, r.category, r.earn_rate FROM credit_cards c
CROSS JOIN (VALUES
    ('groceries',              3.00),
    ('dining',                 0.50),
    ('gas',                    0.50),
    ('travel',                 0.50),
    ('entertainment',          0.50),
    ('subscriptions',          1.00),
    ('transit',                0.50),
    ('other',                  0.50),
    ('pharmacy',               0.50),
    ('online_shopping',        0.50),
    ('home_improvement',       0.50),
    ('canadian_tire_partners', 0.50),
    ('foreign_purchases',      0.50)
) AS r(category, earn_rate)
WHERE c.name = 'BMO CashBack World Mastercard';

-- BMO CashBack World Elite Mastercard: 5% grocery, 4% transit, 3% gas, 2% dining/recurring, 1% other
INSERT INTO card_earn_rates (card_id, category, earn_rate)
SELECT c.id, r.category, r.earn_rate FROM credit_cards c
CROSS JOIN (VALUES
    ('groceries',              5.00),
    ('dining',                 2.00),
    ('gas',                    3.00),
    ('travel',                 1.00),
    ('entertainment',          1.00),
    ('subscriptions',          2.00),
    ('transit',                4.00),
    ('other',                  1.00),
    ('pharmacy',               1.00),
    ('online_shopping',        1.00),
    ('home_improvement',       1.00),
    ('canadian_tire_partners', 1.00),
    ('foreign_purchases',      1.00)
) AS r(category, earn_rate)
WHERE c.name = 'BMO CashBack World Elite Mastercard';

-- BMO Air Miles World Elite Mastercard: 3x grocery/pharmacy, 2x dining/gas/transit/travel, 1x other
INSERT INTO card_earn_rates (card_id, category, earn_rate)
SELECT c.id, r.category, r.earn_rate FROM credit_cards c
CROSS JOIN (VALUES
    ('groceries',              3.00),
    ('dining',                 2.00),
    ('gas',                    2.00),
    ('travel',                 2.00),
    ('entertainment',          2.00),
    ('subscriptions',          2.00),
    ('transit',                2.00),
    ('other',                  1.00),
    ('pharmacy',               3.00),
    ('online_shopping',        2.00),
    ('home_improvement',       1.00),
    ('canadian_tire_partners', 1.00),
    ('foreign_purchases',      1.00)
) AS r(category, earn_rate)
WHERE c.name = 'BMO Air Miles World Elite Mastercard';

-- BMO eclipse Rise Visa: 5x grocery/dining/pharmacy, 3x entertainment/streaming, 1x other
INSERT INTO card_earn_rates (card_id, category, earn_rate)
SELECT c.id, r.category, r.earn_rate FROM credit_cards c
CROSS JOIN (VALUES
    ('groceries',              5.00),
    ('dining',                 5.00),
    ('gas',                    1.00),
    ('travel',                 1.00),
    ('entertainment',          3.00),
    ('subscriptions',          3.00),
    ('transit',                1.00),
    ('other',                  1.00),
    ('pharmacy',               5.00),
    ('online_shopping',        3.00),
    ('home_improvement',       1.00),
    ('canadian_tire_partners', 1.00),
    ('foreign_purchases',      1.00)
) AS r(category, earn_rate)
WHERE c.name = 'BMO eclipse Rise Visa';

-- CIBC Aerogold Visa Infinite: 1.5x grocery/gas/pharmacy/travel, 1x elsewhere
INSERT INTO card_earn_rates (card_id, category, earn_rate)
SELECT c.id, r.category, r.earn_rate FROM credit_cards c
CROSS JOIN (VALUES
    ('groceries',              1.50),
    ('dining',                 1.00),
    ('gas',                    1.50),
    ('travel',                 1.50),
    ('entertainment',          1.00),
    ('subscriptions',          1.00),
    ('transit',                1.00),
    ('other',                  1.00),
    ('pharmacy',               1.50),
    ('online_shopping',        1.00),
    ('home_improvement',       1.00),
    ('canadian_tire_partners', 1.00),
    ('foreign_purchases',      1.00)
) AS r(category, earn_rate)
WHERE c.name = 'CIBC Aerogold Visa Infinite';

-- CIBC Aerogold Visa Infinite Privilege: 2x grocery/gas/travel, 1.5x elsewhere
INSERT INTO card_earn_rates (card_id, category, earn_rate)
SELECT c.id, r.category, r.earn_rate FROM credit_cards c
CROSS JOIN (VALUES
    ('groceries',              2.00),
    ('dining',                 1.50),
    ('gas',                    2.00),
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
WHERE c.name = 'CIBC Aerogold Visa Infinite Privilege';

-- Scotiabank Scene+ Visa: 2x grocery/dining/entertainment (Scene+ partners), 1x elsewhere
INSERT INTO card_earn_rates (card_id, category, earn_rate)
SELECT c.id, r.category, r.earn_rate FROM credit_cards c
CROSS JOIN (VALUES
    ('groceries',              2.00),
    ('dining',                 2.00),
    ('gas',                    1.00),
    ('travel',                 1.00),
    ('entertainment',          2.00),
    ('subscriptions',          1.00),
    ('transit',                1.00),
    ('other',                  1.00),
    ('pharmacy',               1.00),
    ('online_shopping',        1.00),
    ('home_improvement',       1.00),
    ('canadian_tire_partners', 1.00),
    ('foreign_purchases',      1.00)
) AS r(category, earn_rate)
WHERE c.name = 'Scotiabank Scene+ Visa';

-- Scotiabank Momentum Visa Infinite: 4% grocery/recurring, 2% gas/transit, 1% elsewhere
INSERT INTO card_earn_rates (card_id, category, earn_rate)
SELECT c.id, r.category, r.earn_rate FROM credit_cards c
CROSS JOIN (VALUES
    ('groceries',              4.00),
    ('dining',                 1.00),
    ('gas',                    2.00),
    ('travel',                 1.00),
    ('entertainment',          1.00),
    ('subscriptions',          4.00),
    ('transit',                2.00),
    ('other',                  1.00),
    ('pharmacy',               1.00),
    ('online_shopping',        1.00),
    ('home_improvement',       1.00),
    ('canadian_tire_partners', 1.00),
    ('foreign_purchases',      1.00)
) AS r(category, earn_rate)
WHERE c.name = 'Scotiabank Momentum Visa Infinite';

-- National Bank Platinum Mastercard: 2x grocery/dining/gas/online, 1x elsewhere
INSERT INTO card_earn_rates (card_id, category, earn_rate)
SELECT c.id, r.category, r.earn_rate FROM credit_cards c
CROSS JOIN (VALUES
    ('groceries',              2.00),
    ('dining',                 2.00),
    ('gas',                    2.00),
    ('travel',                 1.00),
    ('entertainment',          1.00),
    ('subscriptions',          1.00),
    ('transit',                1.00),
    ('other',                  1.00),
    ('pharmacy',               1.00),
    ('online_shopping',        2.00),
    ('home_improvement',       1.00),
    ('canadian_tire_partners', 1.00),
    ('foreign_purchases',      1.00)
) AS r(category, earn_rate)
WHERE c.name = 'National Bank Platinum Mastercard';

-- Desjardins Odyssey Visa Infinite: 3x grocery/dining/gas, 2x pharmacy/transit/travel/online, 1x other
INSERT INTO card_earn_rates (card_id, category, earn_rate)
SELECT c.id, r.category, r.earn_rate FROM credit_cards c
CROSS JOIN (VALUES
    ('groceries',              3.00),
    ('dining',                 3.00),
    ('gas',                    3.00),
    ('travel',                 2.00),
    ('entertainment',          1.00),
    ('subscriptions',          1.00),
    ('transit',                2.00),
    ('other',                  1.00),
    ('pharmacy',               2.00),
    ('online_shopping',        2.00),
    ('home_improvement',       1.00),
    ('canadian_tire_partners', 1.00),
    ('foreign_purchases',      1.00)
) AS r(category, earn_rate)
WHERE c.name = 'Desjardins Odyssey Visa Infinite';

-- Desjardins Cash Back Visa: 2% grocery/pharmacy, 1% gas/dining/transit, 0.5% elsewhere
INSERT INTO card_earn_rates (card_id, category, earn_rate)
SELECT c.id, r.category, r.earn_rate FROM credit_cards c
CROSS JOIN (VALUES
    ('groceries',              2.00),
    ('dining',                 1.00),
    ('gas',                    1.00),
    ('travel',                 0.50),
    ('entertainment',          0.50),
    ('subscriptions',          0.50),
    ('transit',                1.00),
    ('other',                  0.50),
    ('pharmacy',               2.00),
    ('online_shopping',        0.50),
    ('home_improvement',       0.50),
    ('canadian_tire_partners', 0.50),
    ('foreign_purchases',      0.50)
) AS r(category, earn_rate)
WHERE c.name = 'Desjardins Cash Back Visa';

-- Amex Gold Rewards Card: 2x grocery/gas/pharmacy/travel, 1x elsewhere
INSERT INTO card_earn_rates (card_id, category, earn_rate)
SELECT c.id, r.category, r.earn_rate FROM credit_cards c
CROSS JOIN (VALUES
    ('groceries',              2.00),
    ('dining',                 1.00),
    ('gas',                    2.00),
    ('travel',                 2.00),
    ('entertainment',          1.00),
    ('subscriptions',          1.00),
    ('transit',                1.00),
    ('other',                  1.00),
    ('pharmacy',               2.00),
    ('online_shopping',        1.00),
    ('home_improvement',       1.00),
    ('canadian_tire_partners', 1.00),
    ('foreign_purchases',      1.00)
) AS r(category, earn_rate)
WHERE c.name = 'Amex Gold Rewards Card';

-- American Express Aeroplan Card: 2x grocery/dining/pharmacy/travel, 1.5x gas/transit/subscriptions, 1x other
INSERT INTO card_earn_rates (card_id, category, earn_rate)
SELECT c.id, r.category, r.earn_rate FROM credit_cards c
CROSS JOIN (VALUES
    ('groceries',              2.00),
    ('dining',                 2.00),
    ('gas',                    1.50),
    ('travel',                 2.00),
    ('entertainment',          1.00),
    ('subscriptions',          1.50),
    ('transit',                1.50),
    ('other',                  1.00),
    ('pharmacy',               2.00),
    ('online_shopping',        1.00),
    ('home_improvement',       1.00),
    ('canadian_tire_partners', 1.00),
    ('foreign_purchases',      1.00)
) AS r(category, earn_rate)
WHERE c.name = 'American Express Aeroplan Card';

-- MBNA Rewards World Elite Mastercard: 5x grocery/dining/streaming/home/entertainment/online, 1x other
INSERT INTO card_earn_rates (card_id, category, earn_rate)
SELECT c.id, r.category, r.earn_rate FROM credit_cards c
CROSS JOIN (VALUES
    ('groceries',              5.00),
    ('dining',                 5.00),
    ('gas',                    1.00),
    ('travel',                 1.00),
    ('entertainment',          5.00),
    ('subscriptions',          5.00),
    ('transit',                1.00),
    ('other',                  1.00),
    ('pharmacy',               1.00),
    ('online_shopping',        5.00),
    ('home_improvement',       5.00),
    ('canadian_tire_partners', 1.00),
    ('foreign_purchases',      1.00)
) AS r(category, earn_rate)
WHERE c.name = 'MBNA Rewards World Elite Mastercard';

-- Fido Mastercard: 1.5% flat (Rogers Bank, no FX fee); subscriptions boosted for Rogers/Fido services
INSERT INTO card_earn_rates (card_id, category, earn_rate)
SELECT c.id, r.category, r.earn_rate FROM credit_cards c
CROSS JOIN (VALUES
    ('groceries',              1.50),
    ('dining',                 1.50),
    ('gas',                    1.50),
    ('travel',                 1.50),
    ('entertainment',          1.50),
    ('subscriptions',          3.00),
    ('transit',                1.50),
    ('other',                  1.50),
    ('pharmacy',               1.50),
    ('online_shopping',        1.50),
    ('home_improvement',       1.50),
    ('canadian_tire_partners', 1.50),
    ('foreign_purchases',      1.50)
) AS r(category, earn_rate)
WHERE c.name = 'Fido Mastercard';

-- Canadian Tire Triangle Mastercard: 1.5% CT Partners/stores, 1% gas, 0.5% elsewhere
INSERT INTO card_earn_rates (card_id, category, earn_rate)
SELECT c.id, r.category, r.earn_rate FROM credit_cards c
CROSS JOIN (VALUES
    ('groceries',              0.50),
    ('dining',                 0.50),
    ('gas',                    1.00),
    ('travel',                 0.50),
    ('entertainment',          0.50),
    ('subscriptions',          0.50),
    ('transit',                0.50),
    ('other',                  0.50),
    ('pharmacy',               0.50),
    ('online_shopping',        0.50),
    ('home_improvement',       0.50),
    ('canadian_tire_partners', 1.50),
    ('foreign_purchases',      0.50)
) AS r(category, earn_rate)
WHERE c.name = 'Canadian Tire Triangle Mastercard';

-- PC Financial Mastercard: 10x at Loblaw/SDM, 5x elsewhere (cpp 0.1 → 1%/0.5%)
INSERT INTO card_earn_rates (card_id, category, earn_rate)
SELECT c.id, r.category, r.earn_rate FROM credit_cards c
CROSS JOIN (VALUES
    ('groceries',              10.00),
    ('dining',                  5.00),
    ('gas',                     5.00),
    ('travel',                  5.00),
    ('entertainment',           5.00),
    ('subscriptions',           5.00),
    ('transit',                 5.00),
    ('other',                   5.00),
    ('pharmacy',               10.00),
    ('online_shopping',         5.00),
    ('home_improvement',        5.00),
    ('canadian_tire_partners',  5.00),
    ('foreign_purchases',       5.00)
) AS r(category, earn_rate)
WHERE c.name = 'PC Financial Mastercard';

-- Home Trust Preferred Visa: flat 1% everywhere, no FX fee
INSERT INTO card_earn_rates (card_id, category, earn_rate)
SELECT c.id, r.category, r.earn_rate FROM credit_cards c
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
WHERE c.name = 'Home Trust Preferred Visa';

-- Manulife CashBack Visa Infinite: 3% grocery/pharmacy, 2% gas/dining/transit/recurring, 1% elsewhere
INSERT INTO card_earn_rates (card_id, category, earn_rate)
SELECT c.id, r.category, r.earn_rate FROM credit_cards c
CROSS JOIN (VALUES
    ('groceries',              3.00),
    ('dining',                 2.00),
    ('gas',                    2.00),
    ('travel',                 1.00),
    ('entertainment',          1.00),
    ('subscriptions',          2.00),
    ('transit',                2.00),
    ('other',                  1.00),
    ('pharmacy',               3.00),
    ('online_shopping',        1.00),
    ('home_improvement',       1.00),
    ('canadian_tire_partners', 1.00),
    ('foreign_purchases',      1.00)
) AS r(category, earn_rate)
WHERE c.name = 'Manulife CashBack Visa Infinite';

-- Meridian Visa Infinite Cash Back: 4% grocery, 2% pharmacy/gas/recurring, 1% elsewhere
INSERT INTO card_earn_rates (card_id, category, earn_rate)
SELECT c.id, r.category, r.earn_rate FROM credit_cards c
CROSS JOIN (VALUES
    ('groceries',              4.00),
    ('dining',                 1.00),
    ('gas',                    2.00),
    ('travel',                 1.00),
    ('entertainment',          1.00),
    ('subscriptions',          2.00),
    ('transit',                1.00),
    ('other',                  1.00),
    ('pharmacy',               2.00),
    ('online_shopping',        1.00),
    ('home_improvement',       1.00),
    ('canadian_tire_partners', 1.00),
    ('foreign_purchases',      1.00)
) AS r(category, earn_rate)
WHERE c.name = 'Meridian Visa Infinite Cash Back';

-- ATB Platinum Mastercard: 2% grocery/gas, 1% everywhere else
INSERT INTO card_earn_rates (card_id, category, earn_rate)
SELECT c.id, r.category, r.earn_rate FROM credit_cards c
CROSS JOIN (VALUES
    ('groceries',              2.00),
    ('dining',                 1.00),
    ('gas',                    2.00),
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
WHERE c.name = 'ATB Platinum Mastercard';

-- EQ Bank Card: flat 0.5% everywhere, no FX fee
INSERT INTO card_earn_rates (card_id, category, earn_rate)
SELECT c.id, r.category, r.earn_rate FROM credit_cards c
CROSS JOIN (VALUES
    ('groceries',              0.50),
    ('dining',                 0.50),
    ('gas',                    0.50),
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
WHERE c.name = 'EQ Bank Card';

-- ── Benefit flags ─────────────────────────────────────────────────────────────

-- No foreign transaction fee
UPDATE credit_cards SET no_foreign_fee = TRUE
WHERE name IN (
    'Home Trust Preferred Visa',
    'Fido Mastercard',
    'EQ Bank Card'
);

-- Airport lounge access (Visa Infinite Privilege / ultra-premium tier)
UPDATE credit_cards SET airport_lounge = TRUE
WHERE name IN (
    'TD Aeroplan Visa Infinite Privilege',
    'RBC Avion Visa Infinite Privilege',
    'CIBC Aerogold Visa Infinite Privilege'
);

-- Priority travel perks (top-tier Aeroplan cards)
UPDATE credit_cards SET priority_travel = TRUE
WHERE name IN (
    'TD Aeroplan Visa Infinite Privilege',
    'CIBC Aerogold Visa Infinite Privilege'
);

-- Free checked bag (TD Aeroplan Privilege includes Air Canada first checked bag)
UPDATE credit_cards SET free_checked_bag = TRUE
WHERE name = 'TD Aeroplan Visa Infinite Privilege';

-- Rogers bonus multiplier for Fido Mastercard (Rogers Bank subsidiary — same program)
UPDATE credit_cards SET rogers_bonus_multiplier = 1.50
WHERE name = 'Fido Mastercard';

-- is_points_based corrections (cash-back cards already inserted with FALSE;
-- ensure Air Miles is treated as points-based)
UPDATE credit_cards SET is_points_based = TRUE
WHERE name = 'BMO Air Miles World Elite Mastercard';

-- ── Eligibility thresholds ────────────────────────────────────────────────────

-- No income minimum, entry-level credit requirement (≈600)
UPDATE credit_cards SET min_credit_score = 600
WHERE name IN (
    'BMO eclipse Rise Visa',
    'PC Financial Mastercard',
    'Canadian Tire Triangle Mastercard'
);

-- No income minimum, standard credit requirement (≈620–660)
UPDATE credit_cards SET min_credit_score = 660
WHERE name IN (
    'RBC WestJet Mastercard',
    'BMO CashBack World Mastercard',
    'Scotiabank Scene+ Visa',
    'Desjardins Cash Back Visa',
    'Fido Mastercard',
    'Home Trust Preferred Visa',
    'ATB Platinum Mastercard',
    'EQ Bank Card'
);

-- No income minimum, good credit requirement (≈680–700)
UPDATE credit_cards SET min_credit_score = 680
WHERE name IN (
    'TD Platinum Travel Visa',
    'National Bank Platinum Mastercard',
    'American Express Aeroplan Card',
    'Amex Gold Rewards Card'
);

-- Visa Infinite tier: $60k personal / $100k household, 680 credit score
UPDATE credit_cards
SET min_income_personal  = 60000,
    min_income_household = 100000,
    min_credit_score     = 680
WHERE name IN (
    'TD Cash Back Visa Infinite',
    'CIBC Aerogold Visa Infinite',
    'Manulife CashBack Visa Infinite'
);

-- Visa Infinite tier — Scotia / BMO / Desjardins flavour: 700 credit score
UPDATE credit_cards
SET min_income_personal  = 60000,
    min_income_household = 100000,
    min_credit_score     = 700
WHERE name IN (
    'Scotiabank Momentum Visa Infinite',
    'Desjardins Odyssey Visa Infinite',
    'Meridian Visa Infinite Cash Back'
);

-- World Elite Mastercard tier: $80k personal / $150k household
-- Flagship bank WE cards — 760 score
UPDATE credit_cards
SET min_income_personal  = 80000,
    min_income_household = 150000,
    min_credit_score     = 760
WHERE name IN (
    'BMO CashBack World Elite Mastercard',
    'BMO Air Miles World Elite Mastercard',
    'MBNA Rewards World Elite Mastercard'
);

-- Ultra-premium Visa Infinite Privilege: $150k personal / $200k household, 780 credit score
UPDATE credit_cards
SET min_income_personal  = 150000,
    min_income_household = 200000,
    min_credit_score     = 780
WHERE name IN (
    'TD Aeroplan Visa Infinite Privilege',
    'RBC Avion Visa Infinite Privilege',
    'CIBC Aerogold Visa Infinite Privilege'
);
