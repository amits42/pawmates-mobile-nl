-- Create table for menu state management
CREATE TABLE IF NOT EXISTS whatsapp_menu_state (
  phone_number VARCHAR(20) PRIMARY KEY,
  chat_room_options JSONB NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create table for temporarily selected rooms
CREATE TABLE IF NOT EXISTS whatsapp_selected_room (
  phone_number VARCHAR(20) PRIMARY KEY,
  chat_room_id INTEGER REFERENCES whatsapp_chat_rooms(id),
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_menu_state_expires ON whatsapp_menu_state(expires_at);
CREATE INDEX IF NOT EXISTS idx_whatsapp_selected_room_expires ON whatsapp_selected_room(expires_at);

-- Clean up expired entries (optional cleanup job)
CREATE OR REPLACE FUNCTION cleanup_expired_whatsapp_state() 
RETURNS void AS $$
BEGIN
  DELETE FROM whatsapp_menu_state WHERE expires_at < NOW();
  DELETE FROM whatsapp_selected_room WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

SELECT 'WhatsApp menu tables created successfully' as result;
