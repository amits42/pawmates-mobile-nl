-- Create WhatsApp chat system tables
CREATE TABLE IF NOT EXISTS whatsapp_chat_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id TEXT NOT NULL,
    twilio_number VARCHAR(20) NOT NULL,
    user_phone VARCHAR(20) NOT NULL,
    sitter_phone VARCHAR(20),
    user_alias VARCHAR(100),
    sitter_alias VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS whatsapp_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_room_id UUID REFERENCES whatsapp_chat_rooms(id),
    sender_phone VARCHAR(20) NOT NULL,
    recipient_phones TEXT[], -- Array of phones message was forwarded to
    message_body TEXT,
    message_type VARCHAR(20) DEFAULT 'text', -- text, image, location, etc.
    media_url TEXT,
    twilio_message_sid VARCHAR(100),
    timestamp TIMESTAMP DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'sent'
);

CREATE TABLE IF NOT EXISTS admin_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(50) DEFAULT 'admin',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Insert default admin
INSERT INTO admin_contacts (phone, name, role) 
VALUES ('+917003493718', 'Default Admin', 'super_admin')
ON CONFLICT (phone) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_chat_rooms_booking_id ON whatsapp_chat_rooms(booking_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_chat_room_id ON whatsapp_messages(chat_room_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_sender_phone ON whatsapp_messages(sender_phone);
