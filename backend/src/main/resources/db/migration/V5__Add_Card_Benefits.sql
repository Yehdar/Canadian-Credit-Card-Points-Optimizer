-- V5: Add benefit flags and bonus-multiplier columns to credit_cards.
--
-- Benefit flags drive the BenefitsModule filter: if a user requires a perk,
-- only cards with the matching flag=TRUE are returned.
--
-- Bonus multipliers are applied on top of a card's base earn rates when the
-- corresponding user flag (rogersOwner / amazonPrime) is set:
--   effective_earn_rate = base_earn_rate × multiplier
-- Cards with no bonus keep the default multiplier of 1.00 (no change).

ALTER TABLE credit_cards
    ADD COLUMN no_foreign_fee          BOOLEAN       NOT NULL DEFAULT FALSE,
    ADD COLUMN airport_lounge          BOOLEAN       NOT NULL DEFAULT FALSE,
    ADD COLUMN priority_travel         BOOLEAN       NOT NULL DEFAULT FALSE,
    ADD COLUMN free_checked_bag        BOOLEAN       NOT NULL DEFAULT FALSE,
    ADD COLUMN rogers_bonus_multiplier NUMERIC(4, 2) NOT NULL DEFAULT 1.00,
    ADD COLUMN amazon_prime_multiplier NUMERIC(4, 2) NOT NULL DEFAULT 1.00;

-- ── Amex Cobalt (id=1) ───────────────────────────────────────────────────────
-- Amex Canada cards carry no foreign-transaction surcharge.
UPDATE credit_cards SET no_foreign_fee = TRUE WHERE id = 1;

-- ── Scotiabank Gold American Express (id=2) ──────────────────────────────────
-- Explicitly marketed as a no-FX card.
UPDATE credit_cards SET no_foreign_fee = TRUE WHERE id = 2;

-- ── TD First Class Travel Visa Infinite (id=3) ───────────────────────────────
-- Comes with a DragonPass membership (6 complimentary lounge visits/yr),
-- travel insurance & credits (priority travel perk), and a free first checked
-- bag on Air Canada flights.
UPDATE credit_cards
SET airport_lounge   = TRUE,
    priority_travel  = TRUE,
    free_checked_bag = TRUE
WHERE id = 3;

-- ── TD Aeroplan Visa Infinite (id=4) ─────────────────────────────────────────
-- NEXUS application fee rebate + travel credits = priority travel.
-- Free first checked bag on Air Canada for primary cardholder.
UPDATE credit_cards
SET priority_travel  = TRUE,
    free_checked_bag = TRUE
WHERE id = 4;

-- ── RBC Avion Visa Infinite (id=5) ───────────────────────────────────────────
-- $100 annual travel credit + concierge service = priority travel perk.
UPDATE credit_cards SET priority_travel = TRUE WHERE id = 5;

-- ── BMO World Elite Mastercard (id=7) ────────────────────────────────────────
-- DragonPass membership with 4 complimentary lounge passes per year.
UPDATE credit_cards SET airport_lounge = TRUE WHERE id = 7;

-- ── CIBC Aventura Visa Infinite (id=8) ───────────────────────────────────────
-- Priority Pass membership (4 free visits/yr) + NEXUS rebate.
UPDATE credit_cards
SET airport_lounge  = TRUE,
    priority_travel = TRUE
WHERE id = 8;

-- ── Rogers Red World Elite Mastercard (id=9) ─────────────────────────────────
-- No FX surcharge on foreign purchases.
-- rogers_bonus_multiplier = 2.00: Rogers/Fido/Shaw/Comwave customers earn
-- 3% cashback on all purchases instead of the base 1.5%.
UPDATE credit_cards
SET no_foreign_fee          = TRUE,
    rogers_bonus_multiplier = 2.00
WHERE id = 9;
