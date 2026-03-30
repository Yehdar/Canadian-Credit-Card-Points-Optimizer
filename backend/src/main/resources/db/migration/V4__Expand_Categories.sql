-- V4: Expand spend categories
-- 1. Drop the narrow CHECK on card_earn_rates.category and replace it with one
--    that includes the 5 new profile categories (allows future earn-rate rows).
-- 2. Add the 5 new monthly-spend columns to spending_profiles.

-- ── card_earn_rates: widen the category allowlist ───────────────────────────

ALTER TABLE card_earn_rates
    DROP CONSTRAINT IF EXISTS card_earn_rates_category_check;

ALTER TABLE card_earn_rates
    ADD CONSTRAINT card_earn_rates_category_check
    CHECK (category IN (
        'groceries', 'dining', 'gas', 'travel', 'entertainment',
        'subscriptions', 'transit', 'other',
        'pharmacy', 'online_shopping', 'home_improvement',
        'canadian_tire_partners', 'foreign_purchases'
    ));

-- ── spending_profiles: add 5 new category columns ───────────────────────────

ALTER TABLE spending_profiles
    ADD COLUMN pharmacy               NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    ADD COLUMN online_shopping        NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    ADD COLUMN home_improvement       NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    ADD COLUMN canadian_tire_partners NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    ADD COLUMN foreign_purchases      NUMERIC(10, 2) NOT NULL DEFAULT 0.00;
