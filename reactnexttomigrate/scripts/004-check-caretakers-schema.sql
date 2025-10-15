-- Check the caretakers table schema
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'caretakers' 
ORDER BY ordinal_position;
