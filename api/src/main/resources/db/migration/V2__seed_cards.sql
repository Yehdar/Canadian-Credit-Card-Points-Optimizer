INSERT INTO credit_cards (name, issuer, annual_fee_cad, points_currency, cpp, card_type) VALUES
    ('Amex Cobalt',                         'American Express', 155.88, 'Amex MR',      1.50, 'amex'),
    ('Scotiabank Gold American Express',    'Scotiabank',       120.00, 'Scene+',        1.00, 'amex'),
    ('TD First Class Travel Visa Infinite', 'TD',               139.00, 'TD Rewards',    0.50, 'visa'),
    ('TD Aeroplan Visa Infinite',           'TD',               139.00, 'Aeroplan',      1.70, 'visa'),
    ('RBC Avion Visa Infinite',             'RBC',              120.00, 'Avion',         1.00, 'visa'),
    ('RBC ION+ Visa',                       'RBC',               48.00, 'Avion',         1.00, 'visa'),
    ('BMO World Elite Mastercard',          'BMO',              150.00, 'BMO Rewards',   0.67, 'mastercard'),
    ('CIBC Aventura Visa Infinite',         'CIBC',             139.00, 'Aventura',      1.00, 'visa'),
    ('Rogers Red World Elite Mastercard',   'Rogers',             0.00, 'Cash Back',     1.00, 'mastercard'),
    ('PC Financial World Elite Mastercard', 'PC Financial',       0.00, 'PC Optimum',    0.10, 'mastercard'),
    ('Wealthsimple Cash Visa',              'Wealthsimple',       0.00, 'Cash Back',     1.00, 'visa');

-- Amex Cobalt (id=1): 5x dining, 3x subscriptions, 2x travel+gas, 1x everything else
INSERT INTO card_earn_rates (card_id, category, earn_rate) VALUES
    (1, 'dining',        5.00),
    (1, 'subscriptions', 3.00),
    (1, 'travel',        2.00),
    (1, 'gas',           2.00),
    (1, 'groceries',     1.00),
    (1, 'entertainment', 1.00),
    (1, 'transit',       1.00),
    (1, 'other',         1.00);

-- Scotiabank Gold Amex (id=2): 6x groceries+dining+entertainment, 5x transit, 3x gas+subscriptions, 1x other
INSERT INTO card_earn_rates (card_id, category, earn_rate) VALUES
    (2, 'groceries',     6.00),
    (2, 'dining',        6.00),
    (2, 'entertainment', 6.00),
    (2, 'transit',       5.00),
    (2, 'gas',           3.00),
    (2, 'subscriptions', 3.00),
    (2, 'travel',        1.00),
    (2, 'other',         1.00);

-- TD First Class Travel Visa Infinite (id=3): 6x travel, 4x groceries+dining+gas+subscriptions, 2x other
INSERT INTO card_earn_rates (card_id, category, earn_rate) VALUES
    (3, 'travel',        6.00),
    (3, 'groceries',     4.00),
    (3, 'dining',        4.00),
    (3, 'gas',           4.00),
    (3, 'subscriptions', 4.00),
    (3, 'entertainment', 2.00),
    (3, 'transit',       2.00),
    (3, 'other',         2.00);

-- TD Aeroplan Visa Infinite (id=4): 1.5x groceries+gas+transit, 1x other
INSERT INTO card_earn_rates (card_id, category, earn_rate) VALUES
    (4, 'groceries',     1.50),
    (4, 'gas',           1.50),
    (4, 'transit',       1.50),
    (4, 'dining',        1.00),
    (4, 'travel',        1.00),
    (4, 'entertainment', 1.00),
    (4, 'subscriptions', 1.00),
    (4, 'other',         1.00);

-- RBC Avion Visa Infinite (id=5): 1.25x travel, 1x other
INSERT INTO card_earn_rates (card_id, category, earn_rate) VALUES
    (5, 'travel',        1.25),
    (5, 'groceries',     1.00),
    (5, 'dining',        1.00),
    (5, 'gas',           1.00),
    (5, 'entertainment', 1.00),
    (5, 'subscriptions', 1.00),
    (5, 'transit',       1.00),
    (5, 'other',         1.00);

-- RBC ION+ Visa (id=6): 3x groceries+dining+subscriptions+transit, 1.5x other
INSERT INTO card_earn_rates (card_id, category, earn_rate) VALUES
    (6, 'groceries',     3.00),
    (6, 'dining',        3.00),
    (6, 'subscriptions', 3.00),
    (6, 'transit',       3.00),
    (6, 'gas',           1.50),
    (6, 'travel',        1.50),
    (6, 'entertainment', 1.50),
    (6, 'other',         1.50);

-- BMO World Elite Mastercard (id=7): 3x travel+dining+entertainment, 2x other
INSERT INTO card_earn_rates (card_id, category, earn_rate) VALUES
    (7, 'travel',        3.00),
    (7, 'dining',        3.00),
    (7, 'entertainment', 3.00),
    (7, 'groceries',     2.00),
    (7, 'gas',           2.00),
    (7, 'subscriptions', 2.00),
    (7, 'transit',       2.00),
    (7, 'other',         2.00);

-- CIBC Aventura Visa Infinite (id=8): 2x travel, 1.5x groceries+gas+transit, 1x other
INSERT INTO card_earn_rates (card_id, category, earn_rate) VALUES
    (8, 'travel',        2.00),
    (8, 'groceries',     1.50),
    (8, 'gas',           1.50),
    (8, 'transit',       1.50),
    (8, 'dining',        1.00),
    (8, 'entertainment', 1.00),
    (8, 'subscriptions', 1.00),
    (8, 'other',         1.00);

-- Rogers Red World Elite (id=9): 1.5% cashback everywhere (cpp=1.0 → treat earn_rate as %)
INSERT INTO card_earn_rates (card_id, category, earn_rate) VALUES
    (9, 'groceries',     1.50),
    (9, 'dining',        1.50),
    (9, 'gas',           1.50),
    (9, 'travel',        1.50),
    (9, 'entertainment', 1.50),
    (9, 'subscriptions', 1.50),
    (9, 'transit',       1.50),
    (9, 'other',         1.50);

-- PC Financial World Elite (id=10): 45x groceries (Loblaw), 30x gas, 10x other
-- cpp=0.10 cents/pt → 45pts = 4.5%, 30pts = 3%, 10pts = 1% effective
INSERT INTO card_earn_rates (card_id, category, earn_rate) VALUES
    (10, 'groceries',     45.00),
    (10, 'gas',           30.00),
    (10, 'dining',        10.00),
    (10, 'travel',        10.00),
    (10, 'entertainment', 10.00),
    (10, 'subscriptions', 10.00),
    (10, 'transit',       10.00),
    (10, 'other',         10.00);

-- Wealthsimple Cash Visa (id=11): 1% cashback everywhere
INSERT INTO card_earn_rates (card_id, category, earn_rate) VALUES
    (11, 'groceries',     1.00),
    (11, 'dining',        1.00),
    (11, 'gas',           1.00),
    (11, 'travel',        1.00),
    (11, 'entertainment', 1.00),
    (11, 'subscriptions', 1.00),
    (11, 'transit',       1.00),
    (11, 'other',         1.00);
