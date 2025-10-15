-- Check the actual structure of bookings data
SELECT 
    id,
    status,
    caretaker_id,
    sitter_id,
    created_at
FROM bookings 
LIMIT 5;

-- Check sitters table structure
SELECT 
    id,
    name,
    phone,
    email
FROM sitters 
LIMIT 3;

-- Check if we have any bookings with assigned sitters
SELECT 
    b.id as booking_id,
    b.status,
    b.caretaker_id,
    b.sitter_id,
    s.name as sitter_name,
    s.phone as sitter_phone
FROM bookings b
LEFT JOIN sitters s ON (b.sitter_id = s.id OR b.caretaker_id = s.id)
WHERE b.status IN ('confirmed', 'upcoming', 'pending')
LIMIT 10;
