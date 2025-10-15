-- Ensure service_otps table has the correct structure
-- Based on your schema: id, booking_id, type, otp, expires_at, is_used, used_at, created_at

-- Add missing columns if they don't exist
ALTER TABLE service_otps 
ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'START' CHECK (type IN ('START', 'END'));

-- Make expires_at optional (nullable) as requested
ALTER TABLE service_otps 
ALTER COLUMN expires_at DROP NOT NULL;

-- Add used_at column if missing
ALTER TABLE service_otps 
ADD COLUMN IF NOT EXISTS used_at TIMESTAMP;

-- Ensure proper indexes exist
CREATE INDEX IF NOT EXISTS idx_service_otps_booking_id ON service_otps(booking_id);
CREATE INDEX IF NOT EXISTS idx_service_otps_type ON service_otps(type);
CREATE INDEX IF NOT EXISTS idx_service_otps_is_used ON service_otps(is_used);
