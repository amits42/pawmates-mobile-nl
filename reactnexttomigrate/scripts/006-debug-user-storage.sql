-- Check what users exist in the database
SELECT id, phone, name, email, created_at 
FROM users 
ORDER BY created_at DESC 
LIMIT 10;
