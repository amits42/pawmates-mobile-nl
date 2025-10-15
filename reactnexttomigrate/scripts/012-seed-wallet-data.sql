-- Create test wallet data for sitters

-- First, let's create some completed bookings for our test sitters
INSERT INTO bookings (
    id, user_id, pet_id, service_id, sitter_id, address_id, 
    date, time, duration, status, total_price, sitter_earnings, platform_fee,
    payment_status, completed_at, earnings_processed
) VALUES 
-- Bookings for Priya Sharma (sitter_id from previous script)
(
    gen_random_uuid()::text,
    (SELECT id FROM users WHERE phone = '+919999999999' LIMIT 1), -- Test user
    (SELECT id FROM pets LIMIT 1), -- Any pet
    (SELECT id FROM services LIMIT 1), -- Any service
    (SELECT id FROM sitters WHERE user_id = (SELECT id FROM users WHERE phone = '+918892743780')),
    (SELECT id FROM addresses LIMIT 1), -- Any address
    CURRENT_DATE - INTERVAL '5 days',
    '10:00',
    60,
    'COMPLETED',
    500.00,
    375.00, -- 75% commission
    125.00, -- 25% platform fee
    'PAID',
    NOW() - INTERVAL '5 days',
    true
),
(
    gen_random_uuid()::text,
    (SELECT id FROM users WHERE phone = '+919999999999' LIMIT 1),
    (SELECT id FROM pets LIMIT 1),
    (SELECT id FROM services LIMIT 1),
    (SELECT id FROM sitters WHERE user_id = (SELECT id FROM users WHERE phone = '+918892743780')),
    (SELECT id FROM addresses LIMIT 1),
    CURRENT_DATE - INTERVAL '3 days',
    '14:00',
    90,
    'COMPLETED',
    750.00,
    562.50,
    187.50,
    'PAID',
    NOW() - INTERVAL '3 days',
    true
),
-- Bookings for John Smith
(
    gen_random_uuid()::text,
    (SELECT id FROM users WHERE phone = '+919999999999' LIMIT 1),
    (SELECT id FROM pets LIMIT 1),
    (SELECT id FROM services LIMIT 1),
    (SELECT id FROM sitters WHERE user_id = (SELECT id FROM users WHERE phone = '+1234567891')),
    (SELECT id FROM addresses LIMIT 1),
    CURRENT_DATE - INTERVAL '7 days',
    '09:00',
    120,
    'COMPLETED',
    1000.00,
    750.00,
    250.00,
    'PAID',
    NOW() - INTERVAL '7 days',
    true
);

-- Create wallets for test sitters
INSERT INTO sitter_wallets (
    sitter_id, balance, pending_amount, total_earnings, total_withdrawn,
    bank_account_number, bank_ifsc_code, bank_account_name, preferred_payment_method
) VALUES 
-- Priya Sharma's wallet
(
    (SELECT id FROM sitters WHERE user_id = (SELECT id FROM users WHERE phone = '+918892743780')),
    937.50, -- Available balance (375 + 562.50)
    0.00, -- No pending amount
    937.50, -- Total earnings
    0.00, -- No withdrawals yet
    '1234567890',
    'HDFC0001234',
    'Priya Sharma',
    'bank_transfer'
),
-- John Smith's wallet
(
    (SELECT id FROM sitters WHERE user_id = (SELECT id FROM users WHERE phone = '+1234567891')),
    750.00,
    0.00,
    750.00,
    0.00,
    '9876543210',
    'ICICI0005678',
    'John Smith',
    'bank_transfer'
),
-- Rahul Patel's wallet (empty for testing)
(
    (SELECT id FROM sitters WHERE user_id = (SELECT id FROM users WHERE phone = '+919876543210')),
    0.00,
    0.00,
    0.00,
    0.00,
    NULL,
    NULL,
    NULL,
    'bank_transfer'
);

-- Create wallet transactions for completed earnings
INSERT INTO wallet_transactions (
    wallet_id, booking_id, amount, type, status, description, 
    available_at, processed_at, metadata
) VALUES 
-- Priya's transactions
(
    (SELECT id FROM sitter_wallets WHERE sitter_id = (SELECT id FROM sitters WHERE user_id = (SELECT id FROM users WHERE phone = '+918892743780'))),
    (SELECT id FROM bookings WHERE sitter_earnings = 375.00 LIMIT 1),
    375.00,
    'earning',
    'completed',
    'Service completion earnings',
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '2 days',
    '{"service_type": "Dog Walking", "commission_rate": 0.75}'
),
(
    (SELECT id FROM sitter_wallets WHERE sitter_id = (SELECT id FROM sitters WHERE user_id = (SELECT id FROM users WHERE phone = '+918892743780'))),
    (SELECT id FROM bookings WHERE sitter_earnings = 562.50 LIMIT 1),
    562.50,
    'earning',
    'completed',
    'Service completion earnings',
    NOW(),
    NOW(),
    '{"service_type": "Pet Sitting", "commission_rate": 0.75}'
),
-- John's transaction
(
    (SELECT id FROM sitter_wallets WHERE sitter_id = (SELECT id FROM sitters WHERE user_id = (SELECT id FROM users WHERE phone = '+1234567891'))),
    (SELECT id FROM bookings WHERE sitter_earnings = 750.00 LIMIT 1),
    750.00,
    'earning',
    'completed',
    'Service completion earnings',
    NOW() - INTERVAL '4 days',
    NOW() - INTERVAL '4 days',
    '{"service_type": "Pet Grooming", "commission_rate": 0.75}'
);

-- Verify the data
SELECT 
    u.name as sitter_name,
    u.phone,
    sw.balance,
    sw.pending_amount,
    sw.total_earnings,
    COUNT(wt.id) as transaction_count
FROM users u
JOIN sitters s ON u.id = s.user_id
JOIN sitter_wallets sw ON s.id = sw.sitter_id
LEFT JOIN wallet_transactions wt ON sw.id = wt.wallet_id
WHERE u.user_type = 'SITTER'
GROUP BY u.name, u.phone, sw.balance, sw.pending_amount, sw.total_earnings
ORDER BY u.name;
