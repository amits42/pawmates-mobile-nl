-- Master table: only ONE row can be active at any time
CREATE TABLE cancellation_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Internal name for easy reference
    name TEXT NOT NULL,

    -- When the policy becomes effective.  Allows future scheduling.
    effective_from TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- When the policy stops applying.  NULL means “still active”.
    effective_to TIMESTAMPTZ,

    -- Whether this policy is currently active.
    -- A partial unique index (below) ensures only one active row exists.
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    -- Free-form description shown on the website/app
    description TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Rules within a policy (e.g., full refund >24h, 75% refund 6–24h, etc.)
CREATE TABLE cancellation_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_id UUID NOT NULL REFERENCES cancellation_policies(id) ON DELETE CASCADE,

    -- Minimum hours before service that this rule applies (inclusive).
    -- NULL can represent “less than the smallest min_hours”.
    min_hours_before_service INTEGER,

    -- Maximum hours before service that this rule applies (exclusive).
    -- NULL can represent “greater than the largest max_hours”.
    max_hours_before_service INTEGER,

    -- Refund percentage for cancellations matching this window (0–100).
    refund_percent NUMERIC(5,2) NOT NULL,

    -- Optional extra notes (e.g., “requires manager approval”).
    notes TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enforce only ONE active policy
CREATE UNIQUE INDEX only_one_active_policy
ON cancellation_policies (is_active)
WHERE is_active = TRUE;





-- Records every cancellation event for auditing and refund tracking
CREATE TABLE booking_cancellations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- The cancelled item can be EITHER a single booking OR a recurring booking.
    booking_id TEXT REFERENCES bookings(id) ON DELETE SET NULL,
    recurring_booking_id UUID REFERENCES recurring_booking(id) ON DELETE SET NULL,

    -- Who performed the cancellation: 'user', 'admin', 'sitter', etc.
    cancelled_by TEXT NOT NULL,

    -- Refund details at the time of cancellation
    refund_percent NUMERIC(5,2) NOT NULL,   -- e.g., 75.00 means 75%
    refund_amount NUMERIC(10,2) NOT NULL,   -- actual currency amount refunded

    -- Snapshot of the policy and rule used for this calculation
    policy_id UUID NOT NULL REFERENCES cancellation_policies(id),
    rule_id   UUID REFERENCES cancellation_rules(id),

    reason TEXT,                            -- Optional free-text reason from user/admin
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure we don’t accidentally insert without linking to either a booking or a recurring booking
ALTER TABLE booking_cancellations
ADD CONSTRAINT chk_booking_or_recurring
CHECK (
    (booking_id IS NOT NULL AND recurring_booking_id IS NULL)
    OR
    (booking_id IS NULL AND recurring_booking_id IS NOT NULL)
);


-- Insert the rules for the policy
-- Rule 1: Full refund for >24 hours
INSERT INTO cancellation_rules (id, policy_id, description, min_hours_before_service, max_hours_before_service, refund_percent)
VALUES (
    gen_random_uuid(),
    '55b0bdb2-1fe4-45fe-a21c-fc942a3bcfc4',
    'Full refund if cancellation is more than 24 hours before service',
    24,
    NULL,          -- NULL indicates no upper bound
    100
);

-- Rule 2: 75% refund for 6-24 hours
INSERT INTO cancellation_rules (id, policy_id, description, min_hours_before_service, max_hours_before_service, refund_percent)
VALUES (
    gen_random_uuid(),
    '55b0bdb2-1fe4-45fe-a21c-fc942a3bcfc4',
    '75% refund if cancellation is between 6 and 24 hours before service',
    6,
    24,
    75
);

-- Rule 3: No refund for <6 hours
INSERT INTO cancellation_rules (id, policy_id, description, min_hours_before_service, max_hours_before_service, refund_percent)
VALUES (
    gen_random_uuid(),
    '55b0bdb2-1fe4-45fe-a21c-fc942a3bcfc4',
    'No refund if cancellation is less than 6 hours before service',
    0,
    6,
    0
);
