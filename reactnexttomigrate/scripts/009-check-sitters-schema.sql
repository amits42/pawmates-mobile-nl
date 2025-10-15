-- Check the actual sitters table schema
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'sitters' 
ORDER BY ordinal_position;
