-- V1: Initial schema.
-- credit_cards and card_earn_rates were used historically but dropped when
-- recommendations moved entirely to Gemini. Only spending_profiles remains.

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE spending_profiles (
    id                      SERIAL PRIMARY KEY,
    name                    VARCHAR(100)  NOT NULL,
    profile_type            VARCHAR(20)   NOT NULL DEFAULT 'personal'
                              CHECK (profile_type IN ('personal', 'business', 'partner')),
    groceries               NUMERIC(10,2) NOT NULL DEFAULT 0,
    dining                  NUMERIC(10,2) NOT NULL DEFAULT 0,
    gas                     NUMERIC(10,2) NOT NULL DEFAULT 0,
    travel                  NUMERIC(10,2) NOT NULL DEFAULT 0,
    entertainment           NUMERIC(10,2) NOT NULL DEFAULT 0,
    subscriptions           NUMERIC(10,2) NOT NULL DEFAULT 0,
    transit                 NUMERIC(10,2) NOT NULL DEFAULT 0,
    other                   NUMERIC(10,2) NOT NULL DEFAULT 0,
    pharmacy                NUMERIC(10,2) NOT NULL DEFAULT 0,
    online_shopping         NUMERIC(10,2) NOT NULL DEFAULT 0,
    home_improvement        NUMERIC(10,2) NOT NULL DEFAULT 0,
    canadian_tire_partners  NUMERIC(10,2) NOT NULL DEFAULT 0,
    foreign_purchases       NUMERIC(10,2) NOT NULL DEFAULT 0,
    annual_income           INTEGER       NULL,
    household_income        INTEGER       NULL,
    estimated_credit_score  INTEGER       NULL,
    saved_cards_json        TEXT          NULL,
    extracted_snapshot_json TEXT          NULL,
    user_id                 VARCHAR(100)  NULL,
    created_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_spending_profiles_user_id ON spending_profiles(user_id);

CREATE TRIGGER trg_spending_profiles_updated_at
BEFORE UPDATE ON spending_profiles
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
