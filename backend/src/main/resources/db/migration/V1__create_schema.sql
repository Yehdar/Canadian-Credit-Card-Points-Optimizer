CREATE TABLE credit_cards (
    id               SERIAL PRIMARY KEY,
    name             VARCHAR(100) NOT NULL,
    issuer           VARCHAR(100) NOT NULL,
    annual_fee_cad   NUMERIC(8, 2) NOT NULL DEFAULT 0.00,
    points_currency  VARCHAR(50)  NOT NULL,
    cpp              NUMERIC(6, 4) NOT NULL DEFAULT 1.0,
    card_type        VARCHAR(20)  NOT NULL CHECK (card_type IN ('visa', 'mastercard', 'amex'))
);

CREATE TABLE card_earn_rates (
    id          SERIAL PRIMARY KEY,
    card_id     INTEGER NOT NULL REFERENCES credit_cards(id) ON DELETE CASCADE,
    category    VARCHAR(30) NOT NULL CHECK (
        category IN ('groceries', 'dining', 'gas', 'travel',
                     'entertainment', 'subscriptions', 'transit', 'other')
    ),
    earn_rate   NUMERIC(6, 2) NOT NULL,
    UNIQUE (card_id, category)
);

CREATE INDEX idx_earn_rates_card_id ON card_earn_rates(card_id);
