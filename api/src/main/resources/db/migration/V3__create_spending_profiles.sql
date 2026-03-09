-- Spending profiles allow a user session to maintain multiple named spending
-- snapshots (e.g. Personal, Business, Partner) for side-by-side comparison.
-- All monetary amounts are monthly CAD figures; the backend annualises on read.

CREATE TABLE spending_profiles (
    id            SERIAL PRIMARY KEY,
    name          VARCHAR(100) NOT NULL,
    profile_type  VARCHAR(20)  NOT NULL
                      CHECK (profile_type IN ('personal', 'business', 'partner')),

    -- Monthly CAD spend per category (mirrors card_earn_rates categories)
    groceries     NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    dining        NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    gas           NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    travel        NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    entertainment NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    subscriptions NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    transit       NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    other         NUMERIC(10, 2) NOT NULL DEFAULT 0.00,

    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_spending_profiles_type ON spending_profiles(profile_type);

-- Trigger: keep updated_at current on every UPDATE
CREATE OR REPLACE FUNCTION set_updated_at()
    RETURNS TRIGGER LANGUAGE plpgsql AS
$$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_spending_profiles_updated_at
    BEFORE UPDATE ON spending_profiles
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
