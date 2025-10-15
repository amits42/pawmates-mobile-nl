-- Drop existing payments table if it exists and recreate with Razorpay fields
DROP TABLE IF EXISTS payments CASCADE;

-- Enhanced payments table for Razorpay integration
CREATE TABLE payments (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    booking_id TEXT REFERENCES bookings(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    
    -- Amount and currency
    amount DECIMAL(12, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'INR',
    
    -- Razorpay specific fields
    razorpay_order_id TEXT UNIQUE,
    razorpay_payment_id TEXT UNIQUE,
    razorpay_signature TEXT,
    
    -- Payment status and details
    status TEXT NOT NULL DEFAULT 'CREATED' CHECK (status IN ('CREATED', 'PENDING', 'AUTHORIZED', 'CAPTURED', 'FAILED', 'CANCELLED', 'REFUNDED')),
    payment_method TEXT, -- card, netbanking, wallet, upi, etc.
    payment_method_details JSONB, -- Card last 4 digits, bank name, etc.
    
    -- Business validation
    service_id TEXT REFERENCES services(id),
    expected_amount DECIMAL(12, 2) NOT NULL, -- Server-calculated amount for validation
    amount_validated BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    authorized_at TIMESTAMP,
    captured_at TIMESTAMP,
    failed_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Additional metadata
    razorpay_response JSONB, -- Full Razorpay response for debugging
    failure_reason TEXT,
    notes JSONB -- Any additional notes
);

-- Payment logs table for detailed tracking
CREATE TABLE payment_logs (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    payment_id TEXT REFERENCES payments(id) ON DELETE CASCADE,
    
    -- Log details
    event_type TEXT NOT NULL, -- 'created', 'authorized', 'captured', 'failed', 'webhook_received', etc.
    status_from TEXT,
    status_to TEXT,
    
    -- Event data
    event_data JSONB,
    razorpay_event_id TEXT, -- For webhook events
    
    -- Metadata
    ip_address TEXT,
    user_agent TEXT,
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_razorpay_order_id ON payments(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_payments_razorpay_payment_id ON payments(razorpay_payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);

CREATE INDEX IF NOT EXISTS idx_payment_logs_payment_id ON payment_logs(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_logs_event_type ON payment_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_payment_logs_created_at ON payment_logs(created_at);

-- Function to log payment events
CREATE OR REPLACE FUNCTION log_payment_event(
    p_payment_id TEXT,
    p_event_type TEXT,
    p_status_from TEXT DEFAULT NULL,
    p_status_to TEXT DEFAULT NULL,
    p_event_data JSONB DEFAULT NULL,
    p_razorpay_event_id TEXT DEFAULT NULL,
    p_ip_address TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
) RETURNS TEXT AS $$
DECLARE
    log_id TEXT;
BEGIN
    INSERT INTO payment_logs (
        payment_id, event_type, status_from, status_to, 
        event_data, razorpay_event_id, ip_address, user_agent
    ) VALUES (
        p_payment_id, p_event_type, p_status_from, p_status_to,
        p_event_data, p_razorpay_event_id, p_ip_address, p_user_agent
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql;
