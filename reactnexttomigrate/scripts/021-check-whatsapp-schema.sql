-- Check the actual schema of whatsapp_chat_rooms table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'whatsapp_chat_rooms'
ORDER BY ordinal_position;
