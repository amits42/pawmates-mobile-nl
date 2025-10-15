-- Check services table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'services' 
ORDER BY ordinal_position;

-- Check pets table structure  
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'pets' 
ORDER BY ordinal_position;

-- Check caretakers table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'caretakers' 
ORDER BY ordinal_position;

-- Check bookings table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'bookings' 
ORDER BY ordinal_position;
