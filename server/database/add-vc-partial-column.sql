-- Add is_partial column to vcs table if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'vcs' AND column_name = 'is_partial') THEN
        ALTER TABLE vcs ADD COLUMN is_partial BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Update existing VCs to have is_partial = false if it's null
UPDATE vcs SET is_partial = false WHERE is_partial IS NULL;
