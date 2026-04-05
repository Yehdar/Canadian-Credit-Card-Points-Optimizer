ALTER TABLE spending_profiles
    ADD COLUMN user_id VARCHAR(100);

CREATE INDEX idx_spending_profiles_user_id ON spending_profiles(user_id);
