CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    phone TEXT UNIQUE NOT NULL,
    name TEXT,
    email TEXT,
    user_type TEXT NOT NULL DEFAULT 'PET_OWNER' CHECK (user_type IN ('PET_OWNER', 'SITTER', 'ADMIN')),
    profile_picture TEXT,
    stripe_customer_id TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS addresses (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    line1 TEXT NOT NULL,
    line2 TEXT,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    postal_code TEXT NOT NULL,
    country TEXT NOT NULL DEFAULT 'India',
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    landmark TEXT,
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS services (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    description TEXT,
    short_description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    duration INTEGER NOT NULL DEFAULT 60,
    image TEXT,
    category TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pets (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('dog', 'cat', 'bird', 'rabbit', 'other')),
    breed TEXT,
    age INTEGER,
    weight DECIMAL(5, 2),
    gender TEXT CHECK (gender IN ('male', 'female', 'unknown')),
    description TEXT,
    medical_info TEXT,
    allergies TEXT,
    behavioral_notes TEXT,
    image TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sitters (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    bio TEXT,
    experience TEXT,
    rating DECIMAL(3, 2) DEFAULT 0.0,
    total_bookings INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT false,
    services JSONB,
    hourly_rate DECIMAL(10, 2),
    years_of_experience INTEGER,
    specialties JSONB,
    profile_picture TEXT,
    availability JSONB,
    location JSONB,
    commission_rate DECIMAL(5, 4) DEFAULT 0.75, -- 75% to sitter, 25% to platform
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);



CREATE TABLE IF NOT EXISTS bookings (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    pet_id TEXT REFERENCES pets(id),
    service_id TEXT REFERENCES services(id),
    sitter_id TEXT REFERENCES sitters(id),
    address_id TEXT REFERENCES addresses(id),
    date DATE NOT NULL,
    time TEXT NOT NULL,
    duration INTEGER NOT NULL DEFAULT 60,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'ASSIGNED', 'UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED')),
    total_price DECIMAL(10, 2) NOT NULL,
    sitter_earnings DECIMAL(10, 2), -- Calculated earnings for sitter
    platform_fee DECIMAL(10, 2), -- Platform commission
    payment_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'PAID', 'FAILED', 'REFUNDED')),
    payment_id TEXT,
    notes TEXT,
    is_recurring BOOLEAN DEFAULT false,
    recurring_pattern TEXT,
    recurring_end_date DATE,
    service_otp TEXT,
    otp_expiry TIMESTAMP,
    otp_verified BOOLEAN DEFAULT false,
    actual_start_time TIMESTAMP,
    actual_end_time TIMESTAMP,
    actual_duration INTEGER,
    completed_at TIMESTAMP, -- When service was marked complete
    earnings_processed BOOLEAN DEFAULT false, -- Whether earnings have been credited
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sitter_wallets (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    sitter_id TEXT UNIQUE REFERENCES sitters(id) ON DELETE CASCADE,
    balance DECIMAL(12, 2) DEFAULT 0.00, -- Available for withdrawal
    pending_amount DECIMAL(12, 2) DEFAULT 0.00, -- In holding period
    total_earnings DECIMAL(12, 2) DEFAULT 0.00, -- Lifetime earnings
    total_withdrawn DECIMAL(12, 2) DEFAULT 0.00, -- Total withdrawn amount
    last_withdrawal_at TIMESTAMP,
    bank_account_number TEXT,
    bank_ifsc_code TEXT,
    bank_account_name TEXT,
    upi_id TEXT,
    preferred_payment_method TEXT DEFAULT 'bank_transfer' CHECK (preferred_payment_method IN ('bank_transfer', 'upi')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wallet_transactions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    wallet_id TEXT REFERENCES sitter_wallets(id) ON DELETE CASCADE,
    booking_id TEXT REFERENCES bookings(id) ON DELETE SET NULL,
    amount DECIMAL(12, 2) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('earning', 'withdrawal', 'bonus', 'refund', 'adjustment')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    description TEXT NOT NULL,
    reference_id TEXT, -- External payment reference
    metadata JSONB, -- Additional transaction data
    processed_at TIMESTAMP,
    available_at TIMESTAMP, -- When funds become available for withdrawal
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wallet_withdrawals (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    wallet_id TEXT REFERENCES sitter_wallets(id) ON DELETE CASCADE,
    amount DECIMAL(12, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    payment_method TEXT NOT NULL CHECK (payment_method IN ('bank_transfer', 'upi')),
    payment_details JSONB NOT NULL, -- Bank/UPI details
    reference_id TEXT, -- External payment reference
    admin_notes TEXT,
    requested_at TIMESTAMP DEFAULT NOW(),
    processed_at TIMESTAMP,
    completed_at TIMESTAMP,
    failed_reason TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    booking_id TEXT REFERENCES bookings(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'INR',
    payment_method_type TEXT,
    status TEXT NOT NULL CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED')),
    external_id TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS service_otps (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    booking_id TEXT REFERENCES bookings(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('START', 'END')),
    otp TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    is_used BOOLEAN DEFAULT false,
    used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS otps (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    phone TEXT NOT NULL,
    otp TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    is_used BOOLEAN DEFAULT false,
    attempts INTEGER DEFAULT 0,
    type TEXT NOT NULL DEFAULT 'LOGIN',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    channel TEXT DEFAULT 'APP',
    recipient TEXT,
    external_id TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS company_details (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    description TEXT,
    logo TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    address TEXT,
    founded TEXT,
    number_of_employees INTEGER,
    social_media JSONB,
    business_hours JSONB,
    ratings JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_user_type ON users(user_type);
CREATE INDEX IF NOT EXISTS idx_pets_user_id ON pets(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_sitter_id ON bookings(sitter_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(date);
CREATE INDEX IF NOT EXISTS idx_bookings_earnings_processed ON bookings(earnings_processed);
CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_service_otps_booking_id ON service_otps(booking_id);
CREATE INDEX IF NOT EXISTS idx_otps_phone ON otps(phone);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_sitter_wallets_sitter_id ON sitter_wallets(sitter_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_wallet_id ON wallet_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_booking_id ON wallet_transactions(booking_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_status ON wallet_transactions(status);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_available_at ON wallet_transactions(available_at);
CREATE INDEX IF NOT EXISTS idx_wallet_withdrawals_wallet_id ON wallet_withdrawals(wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallet_withdrawals_status ON wallet_withdrawals(status);
