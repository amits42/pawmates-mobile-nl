-- Test if we can manually insert OTPs to verify the table works
-- First, let's see the current structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'service_otps' 
ORDER BY ordinal_position;

-- Check if there are any existing rows
SELECT COUNT(*) as total_rows FROM service_otps;

-- Get a recent booking ID to test with
SELECT id, created_at FROM bookings ORDER BY created_at DESC LIMIT 1;

-- Test manual OTP insertion (replace 'BOOKING_ID_HERE' with actual booking ID)
-- INSERT INTO service_otps (booking_id, type, otp, is_used, created_at)
-- VALUES ('BOOKING_ID_HERE', 'START', '123456', false, NOW());

-- Check recent bookings and their potential OTPs
SELECT 
  b.id as booking_id,
  b.created_at as booking_created,
  b.service_otp as legacy_otp,
  COUNT(so.id) as otp_count,
  STRING_AGG(so.type || ':' || so.otp, ', ') as otps
FROM bookings b
LEFT JOIN service_otps so ON b.id = so.booking_id
WHERE b.created_at > NOW() - INTERVAL '1 day'
GROUP BY b.id, b.created_at, b.service_otp
ORDER BY b.created_at DESC
LIMIT 5;
