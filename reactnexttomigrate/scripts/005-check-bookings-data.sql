-- Check if there are any bookings in the database
SELECT COUNT(*) as total_bookings FROM bookings;

-- Check bookings for the current user
SELECT * FROM bookings WHERE user_id = 'user_1749099951828' ORDER BY created_at DESC;

-- Check all bookings to see what user_ids exist
SELECT user_id, COUNT(*) as booking_count FROM bookings GROUP BY user_id;

-- Check the structure and sample data
SELECT 
  id, user_id, pet_id, service_id, date, time, status, total_price, created_at
FROM bookings 
ORDER BY created_at DESC 
LIMIT 5;
