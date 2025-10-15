-- Remove caretakers table and update all references to use sitters
-- This script standardizes on the sitters table which connects to users

-- First, let's check if there are any bookings referencing caretakers
-- (This should not be the case since bookings use sitter_id)

-- Drop the caretakers table since we're standardizing on sitters
DROP TABLE IF EXISTS caretakers CASCADE;

-- Verify that bookings table correctly references sitters
-- The bookings table should have sitter_id referencing sitters(id)
-- and sitters should have user_id referencing users(id)

-- Add any missing indexes for performance
CREATE INDEX IF NOT EXISTS idx_sitters_user_id ON sitters(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_sitter_id ON bookings(sitter_id);

-- Verify the correct relationships
SELECT 
  'Checking sitters -> users relationship' as check_type,
  COUNT(*) as count
FROM sitters s
LEFT JOIN users u ON s.user_id = u.id
WHERE u.user_type = 'SITTER';

SELECT 
  'Checking bookings -> sitters relationship' as check_type,
  COUNT(*) as count  
FROM bookings b
LEFT JOIN sitters s ON b.sitter_id = s.id;

-- Show the correct join pattern for getting sitter names
SELECT 
  'Sample booking with sitter name' as example,
  b.id as booking_id,
  COALESCE(u.name, 'Sitter not assigned') as sitter_name,
  s.rating as sitter_rating
FROM bookings b
LEFT JOIN sitters s ON b.sitter_id = s.id
LEFT JOIN users u ON s.user_id = u.id AND u.user_type = 'SITTER'
LIMIT 5;
