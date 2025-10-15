CREATE TABLE admin_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(50) DEFAULT 'admin',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT now(),
    
    CONSTRAINT admin_contacts_phone_key UNIQUE (phone),
    CONSTRAINT admin_contacts_pkey PRIMARY KEY (id)
);

-- Indexes (though UNIQUE constraints already create them automatically)
CREATE UNIQUE INDEX admin_contacts_phone_key_idx 
    ON admin_contacts USING BTREE (phone);

CREATE UNIQUE INDEX admin_contacts_pkey_idx 
    ON admin_contacts USING BTREE (id);



CREATE TABLE whatsapp_menu_state (
    phone_number VARCHAR(20) PRIMARY KEY,
    chat_room_options JSONB NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT now(),
    
    CONSTRAINT whatsapp_menu_state_pkey PRIMARY KEY (phone_number)
);

-- Indexes
CREATE INDEX idx_whatsapp_menu_state_expires 
    ON whatsapp_menu_state USING BTREE (expires_at);

-- (Optional) This UNIQUE index is redundant because PRIMARY KEY already creates one,
-- but adding it explicitly if you want to match your description:
CREATE UNIQUE INDEX whatsapp_menu_state_pkey_idx 
    ON whatsapp_menu_state USING BTREE (phone_number);


CREATE EXTENSION IF NOT EXISTS pgcrypto; -- needed for gen_random_uuid()

CREATE TABLE whatsapp_chat_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id TEXT NOT NULL,
    twilio_number VARCHAR(20) NOT NULL,
    user_phone VARCHAR(20) NOT NULL,
    sitter_phone VARCHAR(20),
    user_alias VARCHAR(100),
    sitter_alias VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    
    CONSTRAINT whatsapp_chat_rooms_pkey PRIMARY KEY (id)
);

-- Index on booking_id for faster lookups
CREATE INDEX idx_whatsapp_chat_rooms_booking_id 
    ON whatsapp_chat_rooms USING BTREE (booking_id);

-- (Optional) This UNIQUE index is redundant because PRIMARY KEY already creates one,
-- but adding it explicitly if you want to mirror your description:
CREATE UNIQUE INDEX whatsapp_chat_rooms_pkey_idx 
    ON whatsapp_chat_rooms USING BTREE (id);
