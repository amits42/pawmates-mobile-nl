-- Create chat rooms table without foreign key constraints first
CREATE TABLE IF NOT EXISTS chat_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL,
    firebase_room_id VARCHAR(255) NOT NULL UNIQUE,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create chat participants table
CREATE TABLE IF NOT EXISTS chat_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_room_id UUID NOT NULL,
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

-- Add foreign key constraint for chat_participants -> chat_rooms
ALTER TABLE chat_participants 
ADD CONSTRAINT fk_chat_participants_room 
FOREIGN KEY (chat_room_id) REFERENCES chat_rooms(id) ON DELETE CASCADE;

-- Insert some test chat rooms with sample booking IDs
INSERT INTO chat_rooms (booking_id, firebase_room_id) VALUES
    (gen_random_uuid(), 'booking_test_1'),
    (gen_random_uuid(), 'booking_test_2'),
    (gen_random_uuid(), 'booking_test_3')
ON CONFLICT (firebase_room_id) DO NOTHING;

-- Add test participants for the chat rooms
WITH sample_rooms AS (
    SELECT id, firebase_room_id FROM chat_rooms LIMIT 3
)
INSERT INTO chat_participants (chat_room_id, user_id, user_type, display_name)
SELECT 
    sr.id,
    gen_random_uuid(),
    'pet_owner',
    'John Doe (Owner)'
FROM sample_rooms sr
UNION ALL
SELECT 
    sr.id,
    gen_random_uuid(),
    'sitter',
    'Sarah Smith (Sitter)'
FROM sample_rooms sr
UNION ALL
SELECT 
    sr.id,
    NULL,
    'admin',
    'Support Team'
FROM sample_rooms sr
ON CONFLICT DO NOTHING;

-- Show created tables
SELECT 'Chat rooms created:' as message, count(*) as count FROM chat_rooms
UNION ALL
SELECT 'Chat participants created:', count(*) FROM chat_participants;
