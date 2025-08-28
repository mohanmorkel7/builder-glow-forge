-- Migration to add new investor category 'individual' and round stage 'pre_series_a'

-- Update investor_category constraint to include 'individual'
ALTER TABLE vcs DROP CONSTRAINT IF EXISTS vcs_investor_category_check;
ALTER TABLE vcs ADD CONSTRAINT vcs_investor_category_check 
    CHECK (investor_category IN ('angel', 'vc', 'private_equity', 'family_office', 'merchant_banker', 'individual'));

-- Update round_stage constraint to include 'pre_series_a'
ALTER TABLE vcs DROP CONSTRAINT IF EXISTS vcs_round_stage_check;
ALTER TABLE vcs ADD CONSTRAINT vcs_round_stage_check 
    CHECK (round_stage IN ('pre_seed', 'pre_series_a', 'seed', 'series_a', 'series_b', 'series_c', 'bridge', 'growth', 'ipo'));
