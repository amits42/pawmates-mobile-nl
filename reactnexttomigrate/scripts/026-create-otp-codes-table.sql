-- Create the otp_codes table for login OTPs
CREATE TABLE IF NOT EXISTS otp_codes (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    phone TEXT NOT NULL,
    code TEXT NOT NULL,
    user_type TEXT NOT NULL DEFAULT 'PET_OWNER' CHECK (user_type IN ('PET_OWNER', 'SITTER')),
    expires_at TIMESTAMP NOT NULL,
    is_used BOOLEAN DEFAULT false,
    attempts INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_otp_codes_phone ON otp_codes(phone);
CREATE INDEX IF NOT EXISTS idx_otp_codes_phone_unused ON otp_codes(phone, is_used);
CREATE INDEX IF NOT EXISTS idx_otp_codes_expires_at ON otp_codes(expires_at);

-- Clean up old/expired OTPs (optional maintenance)
-- DELETE FROM otp_codes WHERE expires_at < NOW() - INTERVAL '1 day';
