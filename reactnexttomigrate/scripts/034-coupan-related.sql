CREATE TABLE coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,                -- quick lookup by code
    description TEXT,
    discount_type TEXT NOT NULL
        CHECK (discount_type IN ('percentage','fixed')),
    discount_value NUMERIC(10,2) NOT NULL,
    max_uses INT,
    per_user_limit INT,
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    status TEXT NOT NULL
        CHECK (status IN ('active','inactive')),
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);
-- Index for queries like “find active coupons expiring soon”
CREATE INDEX idx_coupons_status_end ON coupons(status, end_date);


CREATE TABLE coupon_targets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coupon_id UUID NOT NULL
        REFERENCES coupons(id) ON DELETE CASCADE,
    target_type TEXT NOT NULL
        CHECK (target_type IN ('ALL','USER','GROUP')),
    target_id UUID,             -- NULL when target_type='ALL'
    -- A given user/group should not be listed twice for same coupon
    UNIQUE (coupon_id, target_type, target_id)
);
CREATE INDEX idx_coupon_targets_coupon_id ON coupon_targets(coupon_id);
CREATE INDEX idx_coupon_targets_target
    ON coupon_targets(target_type, target_id);


CREATE TABLE coupon_redemptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coupon_id UUID NOT NULL
        REFERENCES coupons(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL                  -- matches users.id
        REFERENCES users(id) ON DELETE CASCADE,
    booking_id TEXT                        -- matches bookings.id
        REFERENCES bookings(id) ON DELETE CASCADE,
    recurring_booking_id UUID              -- matches recurring_booking.id
        REFERENCES recurring_booking(id) ON DELETE CASCADE,
    discount_amount NUMERIC(10,2) NOT NULL,
    redeemed_at TIMESTAMP DEFAULT now(),
    -- Exactly one of booking_id or recurring_booking_id must be set
    CHECK (
      (booking_id IS NOT NULL AND recurring_booking_id IS NULL) OR
      (booking_id IS NULL AND recurring_booking_id IS NOT NULL)
    ),
    -- Prevent duplicate redemptions on the same entity
    UNIQUE (coupon_id, booking_id, recurring_booking_id)
);

-- Indexes for performance
CREATE INDEX idx_redemptions_coupon_id ON coupon_redemptions(coupon_id);
CREATE INDEX idx_redemptions_user_id   ON coupon_redemptions(user_id);
CREATE INDEX idx_redemptions_user_coupon
    ON coupon_redemptions(user_id, coupon_id);
CREATE INDEX idx_redemptions_booking
    ON coupon_redemptions(booking_id);
CREATE INDEX idx_redemptions_recurring
    ON coupon_redemptions(recurring_booking_id);
