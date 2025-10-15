-- Create chat rooms table in Neon (metadata only)
CREATE TABLE IF NOT EXISTS chat_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    firebase_room_id VARCHAR(255) NOT NULL UNIQUE,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create chat participants table
CREATE TABLE IF NOT EXISTS chat_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
    user_id UUID,
    user_type VARCHAR(50) NOT NULL CHECK (user_type IN ('pet_owner', 'sitter', 'admin')),
    display_name VARCHAR(255),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_rooms_booking_id ON chat_rooms(booking_id);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_firebase_id ON chat_rooms(firebase_room_id);
CREATE INDEX IF NOT EXISTS idx_chat_participants_room_id ON chat_participants(chat_room_id);
CREATE INDEX IF NOT EXISTS idx_chat_participants_user ON chat_participants(user_id, user_type);

-- Insert some test data
INSERT INTO chat_rooms (booking_id, firebase_room_id) 
SELECT 
    b.id,
    'booking_' || b.id::text
FROM bookings b 
WHERE NOT EXISTS (
    SELECT 1 FROM chat_rooms cr WHERE cr.booking_id = b.id
)
LIMIT 5;

-- Add participants for test chat rooms
INSERT INTO chat_participants (chat_room_id, user_id, user_type, display_name)
SELECT 
    cr.id,
    b.user_id,
    'pet_owner',
    u.name || ' (Owner)'
FROM chat_rooms cr
JOIN bookings b ON cr.booking_id = b.id
JOIN users u ON b.user_id = u.id
WHERE NOT EXISTS (
    SELECT 1 FROM chat_participants cp 
    WHERE cp.chat_room_id = cr.id AND cp.user_id = b.user_id AND cp.user_type = 'pet_owner'
);

-- Add sitters to chat rooms
INSERT INTO chat_participants (chat_room_id, user_id, user_type, display_name)
SELECT 
    cr.id,
    b.sitter_id,
    'sitter',
    s.first_name || ' ' || s.last_name || ' (Sitter)'
FROM chat_rooms cr
JOIN bookings b ON cr.booking_id = b.id
JOIN sitters s ON b.sitter_id = s.id
WHERE NOT EXISTS (
    SELECT 1 FROM chat_participants cp 
    WHERE cp.chat_room_id = cr.id AND cp.user_id = b.sitter_id AND cp.user_type = 'sitter'
);

-- Add admin to all chat rooms
INSERT INTO chat_participants (chat_room_id, user_type, display_name)
SELECT 
    cr.id,
    'admin',
    'Support Team'
FROM chat_rooms cr
WHERE NOT EXISTS (
    SELECT 1 FROM chat_participants cp 
    WHERE cp.chat_room_id = cr.id AND cp.user_type = 'admin'
);
