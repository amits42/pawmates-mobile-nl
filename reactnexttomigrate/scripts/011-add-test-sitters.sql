-- Add test sitters to the database for testing
-- Note: Remove existing records first to avoid duplicates

-- Clean up existing test data (optional)
DELETE FROM sitters WHERE user_id IN ('sitter_user_1', 'sitter_user_2', 'sitter_user_3');
DELETE FROM addresses WHERE user_id IN ('sitter_user_1', 'sitter_user_2', 'sitter_user_3');
DELETE FROM users WHERE id IN ('sitter_user_1', 'sitter_user_2', 'sitter_user_3');

-- Add sitter users
INSERT INTO users (id, phone, name, email, user_type, is_active) VALUES
('sitter_user_1', '+918892743781', 'Priya Sharma', 'priya.sharma@example.com', 'SITTER', true),
('sitter_user_2', '+1234567891', 'John Smith', 'john.smith@example.com', 'SITTER', true),
('sitter_user_3', '+919876543210', 'Rahul Patel', 'rahul.patel@example.com', 'SITTER', true);

-- Add corresponding sitter profiles
INSERT INTO sitters (id, user_id, bio, experience, rating, total_bookings, is_verified, services, hourly_rate, years_of_experience, specialties, is_active) VALUES
('sitter_1', 'sitter_user_1', 'Experienced pet sitter with love for all animals. Specialized in dog walking and pet sitting.', '3+ years', 4.8, 45, true, 
 '["Dog Walking", "Pet Sitting", "Pet Feeding"]'::jsonb, 
 300.00, 3, 
 '["Dogs", "Cats", "Small Animals"]'::jsonb, 
 true),
('sitter_2', 'sitter_user_2', 'Professional pet caretaker with veterinary background. Available for overnight stays.', '5+ years', 4.9, 78, true,
 '["Pet Sitting", "Overnight Care", "Pet Grooming", "Vet Visits"]'::jsonb,
 450.00, 5,
 '["Dogs", "Cats", "Birds", "Medical Care"]'::jsonb,
 true),
('sitter_3', 'sitter_user_3', 'Young and energetic pet lover. Great with puppies and active dogs.', '2+ years', 4.6, 23, true,
 '["Dog Walking", "Pet Playing", "Pet Sitting"]'::jsonb,
 250.00, 2,
 '["Dogs", "Puppies", "Active Pets"]'::jsonb,
 true);

-- Add addresses for sitters
INSERT INTO addresses (id, user_id, line1, line2, city, state, postal_code, country, is_default, is_active) VALUES
('addr_sitter_1', 'sitter_user_1', '123 Pet Street', 'Apartment 4B', 'Mumbai', 'Maharashtra', '400001', 'India', true, true),
('addr_sitter_2', 'sitter_user_2', '456 Animal Avenue', 'Suite 12', 'Bangalore', 'Karnataka', '560001', 'India', true, true),
('addr_sitter_3', 'sitter_user_3', '789 Care Lane', '', 'Delhi', 'Delhi', '110001', 'India', true, true);

-- Verify the data was inserted correctly
SELECT 
  u.phone,
  u.name,
  u.user_type,
  s.bio,
  s.experience,
  s.rating,
  s.is_verified,
  a.city,
  a.state
FROM users u
INNER JOIN sitters s ON u.id = s.user_id
LEFT JOIN addresses a ON u.id = a.user_id AND a.is_default = true
WHERE u.user_type = 'SITTER'
ORDER BY u.name;
