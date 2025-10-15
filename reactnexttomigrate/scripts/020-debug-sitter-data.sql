-- Check actual booking data with sitter info
SELECT 
  b.id,
  b.status,
  b.sitter_id,
  b.date,
  b.time,
  sit.id as sitter_table_id,
  u.name as sitter_name,
  u.phone as sitter_phone,
  u.user_type
FROM bookings b
LEFT JOIN sitters sit ON b.sitter_id = sit.id
LEFT JOIN users u ON sit.user_id = u.id
ORDER BY b.created_at DESC
LIMIT 5;
