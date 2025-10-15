-- Check the actual structure of service_otps table
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'service_otps' 
ORDER BY ordinal_position;

-- Check if there are any existing rows
SELECT COUNT(*) as total_rows FROM service_otps;

-- Check recent bookings to see if they should have OTPs
SELECT id, created_at, service_otp FROM bookings 
ORDER BY created_at DESC 
LIMIT 5;
