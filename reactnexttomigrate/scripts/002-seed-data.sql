INSERT INTO services (id, name, description, short_description, price, duration, image, category) VALUES
('service_001', 'Dog Walking', 'Professional dog walking service for your furry friend. Our experienced walkers ensure your dog gets the exercise and attention they need in Bengaluru''s pet-friendly parks.', 'Professional dog walking service', 300, 60, '/placeholder.svg?height=200&width=300', 'walking'),
('service_002', 'Pet Sitting', 'In-home pet sitting service in Bengaluru. Your pet stays comfortable in their familiar environment while receiving personalized care from trained professionals.', 'In-home pet sitting service', 500, 120, '/placeholder.svg?height=200&width=300', 'sitting'),
('service_003', 'Pet Grooming', 'Complete grooming service including bath, nail trimming, and styling. Professional pet grooming services available across Bengaluru.', 'Complete grooming service', 800, 90, '/placeholder.svg?height=200&width=300', 'grooming'),
('service_004', 'Pet Training', 'Basic obedience training and behavioral correction for dogs. Experienced trainers help your pet learn essential commands and good behavior.', 'Pet training and obedience', 1200, 60, '/placeholder.svg?height=200&width=300', 'training'),
('service_005', 'Pet Taxi', 'Safe and comfortable transportation for your pets to vet appointments, grooming sessions, or anywhere in Bengaluru.', 'Pet transportation service', 250, 30, '/placeholder.svg?height=200&width=300', 'transport');

INSERT INTO users (id, phone, name, email, user_type, profile_picture) VALUES
('user_1749099951828', '+919876543210', 'Rajesh Kumar', 'rajesh.kumar@gmail.com', 'PET_OWNER', '/placeholder.svg?height=100&width=100');

INSERT INTO addresses (id, user_id, line1, line2, city, state, postal_code, country, latitude, longitude, landmark, is_default) VALUES
('address_001', 'user_1749099951828', '123 Indiranagar Main Road', 'Near Metro Station', 'Bengaluru', 'Karnataka', '560038', 'India', 12.9784, 77.6408, 'Near 100ft Road', true);

INSERT INTO pets (id, user_id, name, type, breed, age, weight, gender, description, medical_info, allergies, behavioral_notes, image) VALUES
('pet_001', 'user_1749099951828', 'Bruno', 'dog', 'Labrador Retriever', 3, 28.0, 'male', 'Friendly and energetic, loves playing in Cubbon Park', 'Vaccinated, regular vet checkups', 'None known', 'Very social, loves meeting other dogs', '/placeholder.svg?height=200&width=200'),
('pet_002', 'user_1749099951828', 'Simba', 'cat', 'Indian Shorthair', 2, 4.0, 'male', 'Independent but affectionate', 'Neutered, up to date on vaccinations', 'Sensitive to certain fish', 'Prefers quiet environments, indoor cat', '/placeholder.svg?height=200&width=200');

INSERT INTO caretakers (id, first_name, last_name, email, phone, bio, rating, review_count, specialties, years_of_experience, hourly_rate, location, profile_picture) VALUES
('caretaker1', 'Priya', 'Sharma', 'priya.sharma@gmail.com', '+918892743780', 'Professional pet caretaker with 5 years of experience. Certified in pet first aid.', 4.8, 124, '["Dog Walking", "Pet Sitting"]', 5, 300, '{"lat": 12.9352, "lng": 77.6245, "address": "Koramangala, Bengaluru"}', '/placeholder.svg?height=100&width=100'),
('caretaker2', 'Arjun', 'Patel', 'arjun.patel@gmail.com', '+919988776655', 'Former veterinary assistant with a passion for animal care. Specialized in dog training.', 4.9, 89, '["Grooming", "Training"]', 3, 350, '{"lat": 13.0358, "lng": 77.597, "address": "Hebbal, Bengaluru"}', '/placeholder.svg?height=100&width=100'),
('caretaker3', 'Meera', 'Reddy', 'meera.reddy@gmail.com', '+919876512345', 'Cat specialist with experience in caring for all breeds. Calm and patient approach.', 4.7, 56, '["Cat Care", "Pet Sitting"]', 4, 280, '{"lat": 12.9698, "lng": 77.75, "address": "Whitefield, Bengaluru"}', '/placeholder.svg?height=100&width=100');

INSERT INTO company_details (id, name, description, logo, contact_email, contact_phone, address, founded, number_of_employees, social_media, business_hours, ratings) VALUES
('company_001', 'PawMates', 'India''s trusted pet care service provider. Connecting pet owners with verified and experienced pet sitters across Bengaluru.', '/logo.png', 'support@pawmates.in', '+91-80-4567-8900', '123, Brigade Road, Bengaluru, Karnataka 560001', '2020', 25, 
'{"facebook": "https://facebook.com/pawmatesindia", "instagram": "https://instagram.com/pawmatesindia", "twitter": "https://twitter.com/pawmatesindia", "linkedin": "https://linkedin.com/company/pawmatesindia"}',
'{"monday": {"open": "09:00", "close": "18:00"}, "tuesday": {"open": "09:00", "close": "18:00"}, "wednesday": {"open": "09:00", "close": "18:00"}, "thursday": {"open": "09:00", "close": "18:00"}, "friday": {"open": "09:00", "close": "18:00"}, "saturday": {"open": "10:00", "close": "17:00"}, "sunday": {"open": "10:00", "close": "17:00"}}',
'{"average": 4.8, "count": 1250}');
