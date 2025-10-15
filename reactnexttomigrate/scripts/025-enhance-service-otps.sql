-- Enhance service_otps table for booking start/end OTPs
-- Add type field to distinguish between START and END OTPs
-- Remove expiration requirement

-- Add type column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'service_otps' AND column_name = 'type') THEN
        ALTER TABLE service_otps ADD COLUMN type VARCHAR(10) NOT NULL DEFAULT 'START';
    END IF;
END $$;

-- Make expires_at nullable since we don't want OTPs to expire
ALTER TABLE service_otps ALTER COLUMN expires_at DROP NOT NULL;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_service_otps_booking_type ON service_otps(booking_id, type);
CREATE INDEX IF NOT EXISTS idx_service_otps_otp ON service_otps(otp);

-- Update existing records to have START type
UPDATE service_otps SET type = 'START' WHERE type IS NULL OR type = '';

-- Add constraint to ensure type is either START or END
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'service_otps_type_check') THEN
        ALTER TABLE service_otps ADD CONSTRAINT service_otps_type_check 
        CHECK (type IN ('START', 'END'));
    END IF;
END $$;

-- Show current structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'service_otps' 
ORDER BY ordinal_position;
