-- Create service_reviews table
CREATE TABLE IF NOT EXISTS service_reviews (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    booking_id TEXT NOT NULL REFERENCES bookings(id),
    user_id TEXT NOT NULL REFERENCES users(id),
    service_id TEXT NOT NULL REFERENCES services(id),
    sitter_id TEXT REFERENCES sitters(id),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    UNIQUE(booking_id) -- Ensures one review per booking
);

-- Create service_tips table
CREATE TABLE IF NOT EXISTS service_tips (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    booking_id TEXT NOT NULL REFERENCES bookings(id),
    user_id TEXT NOT NULL REFERENCES users(id),
    service_id TEXT NOT NULL REFERENCES services(id),
    sitter_id TEXT REFERENCES sitters(id),
    tip_amount NUMERIC(10,2) NOT NULL CHECK (tip_amount > 0),
    payment_id TEXT REFERENCES payments(id),
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed')),
    razorpay_order_id TEXT,
    razorpay_payment_id TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    UNIQUE(booking_id) -- Ensures one tip per booking
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_service_reviews_user_id ON service_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_service_reviews_service_id ON service_reviews(service_id);
CREATE INDEX IF NOT EXISTS idx_service_reviews_sitter_id ON service_reviews(sitter_id);
CREATE INDEX IF NOT EXISTS idx_service_reviews_booking_id ON service_reviews(booking_id);

CREATE INDEX IF NOT EXISTS idx_service_tips_user_id ON service_tips(user_id);
CREATE INDEX IF NOT EXISTS idx_service_tips_service_id ON service_tips(service_id);
CREATE INDEX IF NOT EXISTS idx_service_tips_sitter_id ON service_tips(sitter_id);
CREATE INDEX IF NOT EXISTS idx_service_tips_booking_id ON service_tips(booking_id);
CREATE INDEX IF NOT EXISTS idx_service_tips_payment_status ON service_tips(payment_status);
