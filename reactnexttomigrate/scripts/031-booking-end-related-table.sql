CREATE TABLE recurring_booking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    pet_id TEXT NOT NULL,
    service_id TEXT NOT NULL,
    sitter_id TEXT,
    sequence_number INTEGER NOT NULL,
    session_date DATE NOT NULL,
    session_time TIME NOT NULL,
    duration INTEGER DEFAULT 60,
    session_price NUMERIC(10, 2) NOT NULL,
    status TEXT DEFAULT 'PENDING',
    payment_status TEXT DEFAULT 'PENDING',
    service_started_at TIMESTAMP,
    service_ended_at TIMESTAMP,
    actual_duration INTEGER,
    notes TEXT,
    cancellation_reason TEXT,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    booking_id UUID,
    CONSTRAINT recurring_booking_payment_status_check CHECK (
        payment_status IN ('PENDING', 'PAID', 'FAILED', 'REFUNDED')
    ),
    CONSTRAINT recurring_booking_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users (id),
    CONSTRAINT recurring_booking_pet_id_fkey FOREIGN KEY (pet_id) REFERENCES public.pets (id),
    CONSTRAINT recurring_booking_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services (id),
    CONSTRAINT recurring_booking_sitter_id_fkey FOREIGN KEY (sitter_id) REFERENCES public.sitters (id),
    CONSTRAINT recurring_booking_status_check CHECK (
        status IN ('PENDING', 'CONFIRMED', 'ASSIGNED', 'UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED')
    ),
    INDEX idx_recurring_booking_booking_id (booking_id),
    INDEX idx_recurring_booking_session_date (session_date),
    UNIQUE INDEX recurring_booking_pkey (id),
    INDEX idx_recurring_booking_user_id (user_id),
    INDEX idx_recurring_booking_date (session_date)
);


CREATE TABLE bookings (
    id TEXT PRIMARY KEY DEFAULT (gen_random_uuid())::text,
    user_id TEXT,
    pet_id TEXT,
    service_id TEXT,
    sitter_id TEXT,
    address_id TEXT,
    date DATE NOT NULL,
    time TEXT NOT NULL,
    duration INTEGER NOT NULL DEFAULT 60,
    status TEXT NOT NULL DEFAULT 'PENDING',
    total_price NUMERIC(10, 2) NOT NULL,
    payment_status TEXT NOT NULL DEFAULT 'PENDING',
    payment_id TEXT,
    notes TEXT,
    is_recurring BOOLEAN DEFAULT false,
    recurring_pattern TEXT,
    recurring_end_date DATE,
    service_otp TEXT,
    otp_expiry TIMESTAMP,
    otp_verified BOOLEAN DEFAULT false,
    actual_start_time TIMESTAMP WITH TIME ZONE,
    actual_end_time TIMESTAMP WITH TIME ZONE,
    actual_duration INTEGER,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    sitter_earnings NUMERIC(10, 2),
    platform_fee NUMERIC(10, 2),
    completed_at TIMESTAMP,
    earnings_processed BOOLEAN DEFAULT false,
    recurring_booking_id UUID,
    sequence_number INTEGER DEFAULT 1,
    is_recurring_parent BOOLEAN DEFAULT false,
    cancellation_reason VARCHAR(500),
    CONSTRAINT bookings_status_check CHECK (
        status IN ('PENDING', 'CONFIRMED', 'ASSIGNED', 'UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED')
    ),
    CONSTRAINT bookings_payment_status_check CHECK (
        payment_status IN ('PENDING', 'PAID', 'FAILED', 'REFUNDED')
    ),
    CONSTRAINT bookings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users (id) ON DELETE CASCADE,
    CONSTRAINT bookings_pet_id_fkey FOREIGN KEY (pet_id) REFERENCES public.pets (id),
    CONSTRAINT bookings_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services (id),
    CONSTRAINT bookings_sitter_id_fkey FOREIGN KEY (sitter_id) REFERENCES public.sitters (id),
    CONSTRAINT bookings_address_id_fkey FOREIGN KEY (address_id) REFERENCES public.addresses (id)
);

-- Add indexes
CREATE UNIQUE INDEX bookings_pkey ON bookings (id);
CREATE INDEX idx_bookings_earnings_processed ON bookings (earnings_processed);
CREATE INDEX idx_bookings_user_id ON bookings (user_id);
CREATE INDEX idx_bookings_status ON bookings (status);
CREATE INDEX idx_bookings_date ON bookings (date);
CREATE INDEX idx_bookings_recurring_booking_id ON bookings (recurring_booking_id);
CREATE INDEX idx_bookings_sitter_id ON bookings (sitter_id);
CREATE INDEX idx_bookings_recurring_id ON bookings (recurring_booking_id);


CREATE TABLE payment_disputes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id TEXT NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    dispute_id TEXT UNIQUE NOT NULL, -- Razorpay dispute ID
    amount NUMERIC(12, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'CREATED', -- CREATED, WON, LOST
    reason TEXT,
    razorpay_response JSONB NOT NULL, -- Full webhook payload for audit
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- Index for faster lookups by payment_id
CREATE INDEX idx_payment_disputes_payment_id ON payment_disputes(payment_id);



CREATE TABLE payment_refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id TEXT NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    refund_id TEXT UNIQUE NOT NULL, 
    amount NUMERIC(12, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'INITIATED',
    failure_reason TEXT,
    initiated_at TIMESTAMP DEFAULT now(),
    processed_at TIMESTAMP,
    failed_at TIMESTAMP,
    razorpay_response JSONB NOT NULL, 
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_payment_refunds_payment_id ON payment_refunds(payment_id);

CREATE TABLE config_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP DEFAULT now()
);


INSERT INTO config_settings (
    key, value, description
) VALUES (
    'percentageDeductionOnSelfCancellation', '10',
    'Percentage to deduct from user on self-cancellation of a booking'
);


CREATE TABLE payments (
    id TEXT PRIMARY KEY DEFAULT (gen_random_uuid())::text,
    booking_id TEXT,
    user_id TEXT,
    amount NUMERIC(12, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'INR',
    razorpay_order_id TEXT UNIQUE,
    razorpay_payment_id TEXT UNIQUE,
    razorpay_signature TEXT,
    status TEXT NOT NULL DEFAULT 'CREATED',
    payment_method TEXT,
    payment_method_details JSONB,
    service_id TEXT,
    expected_amount NUMERIC(12, 2) NOT NULL,
    amount_validated BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT now(),
    authorized_at TIMESTAMP,
    captured_at TIMESTAMP,
    failed_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT now(),
    razorpay_response JSONB,
    failure_reason TEXT,
    notes JSONB,
    recurring_booking_id UUID,
    payment_type TEXT DEFAULT 'single',
    covers_booking_ids TEXT,
    recurring_series_id TEXT,
    session_sequence_number INTEGER,

    -- Constraints
    CONSTRAINT payments_status_check CHECK (
        status = ANY (ARRAY[
            'CREATED'::text, 
            'PENDING'::text, 
            'AUTHORIZED'::text, 
            'CAPTURED'::text, 
            'FAILED'::text, 
            'CANCELLED'::text, 
            'REFUNDED'::text
        ])
    ),
    CONSTRAINT payments_payment_type_check CHECK (
        payment_type = ANY (ARRAY['single'::text, 'bulk'::text, 'session'::text])
    ),
    CONSTRAINT payments_booking_id_fkey FOREIGN KEY (booking_id)
        REFERENCES public.bookings (id) ON DELETE CASCADE,
    CONSTRAINT payments_user_id_fkey FOREIGN KEY (user_id)
        REFERENCES public.users (id) ON DELETE CASCADE,
    CONSTRAINT payments_service_id_fkey FOREIGN KEY (service_id)
        REFERENCES public.services (id)
);

-- Indexes
CREATE UNIQUE INDEX payments_pkey ON payments(id);
CREATE INDEX idx_payments_booking_id ON payments(booking_id);
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_razorpay_order_id ON payments(razorpay_order_id);
CREATE INDEX idx_payments_razorpay_payment_id ON payments(razorpay_payment_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_created_at ON payments(created_at);
CREATE INDEX idx_payments_recurring_booking ON payments(recurring_booking_id);
CREATE INDEX idx_payments_recurring_booking_id ON payments(recurring_booking_id);
CREATE INDEX idx_payments_recurring_series ON payments(recurring_series_id);



CREATE TABLE public.sitter_wallets (
  id TEXT PRIMARY KEY DEFAULT (gen_random_uuid()::text),
  sitter_id TEXT UNIQUE,
  balance NUMERIC(12, 2) DEFAULT 0.00,
  pending_amount NUMERIC(12, 2) DEFAULT 0.00,
  total_earnings NUMERIC(12, 2) DEFAULT 0.00,
  total_withdrawn NUMERIC(12, 2) DEFAULT 0.00,
  last_withdrawal_at TIMESTAMP,
  bank_account_number TEXT,
  bank_ifsc_code TEXT,
  bank_account_name TEXT,
  upi_id TEXT,
  preferred_payment_method TEXT DEFAULT 'bank_transfer'::text,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  
  CONSTRAINT sitter_wallets_preferred_payment_method_check 
    CHECK (preferred_payment_method = ANY (ARRAY['bank_transfer'::text, 'upi'::text])),
    
  CONSTRAINT sitter_wallets_sitter_id_fkey 
    FOREIGN KEY (sitter_id) REFERENCES public.sitters(id) ON DELETE CASCADE
);

-- Indexes
CREATE UNIQUE INDEX sitter_wallets_sitter_id_key 
  ON public.sitter_wallets USING BTREE (sitter_id);

CREATE INDEX idx_sitter_wallets_sitter_id 
  ON public.sitter_wallets USING BTREE (sitter_id);



CREATE TABLE public.sitters (
  id TEXT PRIMARY KEY DEFAULT (gen_random_uuid()::text),
  user_id TEXT,
  bio TEXT,
  experience TEXT,
  rating NUMERIC(3, 2) DEFAULT 0.0,
  total_bookings INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  services JSONB,
  hourly_rate NUMERIC(10, 2),
  years_of_experience INTEGER,
  specialties JSONB,
  profile_picture TEXT,
  availability JSONB,
  location JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  commission_rate NUMERIC(5, 4) DEFAULT 0.75,
  photo_url TEXT,
  bank_details JSONB DEFAULT '{}'::jsonb,

  CONSTRAINT sitters_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_sitters_user_id 
  ON public.sitters USING BTREE (user_id);

-- Primary key index is automatically created with the table:
-- CREATE UNIQUE INDEX sitters_pkey ON public.sitters USING BTREE (id);
