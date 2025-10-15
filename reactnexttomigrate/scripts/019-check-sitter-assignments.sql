-- Check current bookings and their sitter assignments
SELECT 
  b.id as booking_id,
  b.status,
  b.sitter_id,
  b.date,
  b.time,
  u.name as sitter_name,
  u.phone as sitter_phone,
  p.name as pet_name,
  s.name as service_name
FROM bookings b
LEFT JOIN pets p ON b.pet_id = p.id
LEFT JOIN services s ON b.service_id = s.id
LEFT JOIN sitters sit ON b.sitter_id = sit.id
LEFT JOIN users u ON sit.user_id = u.id
ORDER BY b.created_at DESC
LIMIT 10;
