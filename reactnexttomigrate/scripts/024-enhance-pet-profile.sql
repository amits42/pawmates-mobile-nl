-- Add new fields to pets table for enhanced pet profile
ALTER TABLE pets 
ADD COLUMN IF NOT EXISTS adoption_or_birthday DATE,
ADD COLUMN IF NOT EXISTS microchipped VARCHAR(20) DEFAULT 'not_sure',
ADD COLUMN IF NOT EXISTS spayed_neutered VARCHAR(20) DEFAULT 'not_sure',
ADD COLUMN IF NOT EXISTS potty_trained VARCHAR(20) DEFAULT 'not_sure',
ADD COLUMN IF NOT EXISTS friendly_with_children VARCHAR(20) DEFAULT 'not_sure',
ADD COLUMN IF NOT EXISTS friendly_with_dogs VARCHAR(20) DEFAULT 'not_sure',
ADD COLUMN IF NOT EXISTS friendly_with_animals VARCHAR(20) DEFAULT 'not_sure',
ADD COLUMN IF NOT EXISTS vet_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS vet_address TEXT,
ADD COLUMN IF NOT EXISTS vet_phone VARCHAR(50),
ADD COLUMN IF NOT EXISTS current_medications TEXT,
ADD COLUMN IF NOT EXISTS other_medical_info TEXT;

-- Update existing pets to have default values
UPDATE pets 
SET 
  microchipped = COALESCE(microchipped, 'not_sure'),
  spayed_neutered = COALESCE(spayed_neutered, 'not_sure'),
  potty_trained = COALESCE(potty_trained, 'not_sure'),
  friendly_with_children = COALESCE(friendly_with_children, 'not_sure'),
  friendly_with_dogs = COALESCE(friendly_with_dogs, 'not_sure'),
  friendly_with_animals = COALESCE(friendly_with_animals, 'not_sure')
WHERE 
  microchipped IS NULL OR
  spayed_neutered IS NULL OR
  potty_trained IS NULL OR
  friendly_with_children IS NULL OR
  friendly_with_dogs IS NULL OR
  friendly_with_animals IS NULL;

-- Migrate existing medical_info and allergies to other_medical_info
UPDATE pets 
SET other_medical_info = CASE 
  WHEN medical_info IS NOT NULL AND allergies IS NOT NULL THEN 
    CONCAT('Medical Info: ', medical_info, E'\n\nAllergies: ', allergies)
  WHEN medical_info IS NOT NULL THEN 
    CONCAT('Medical Info: ', medical_info)
  WHEN allergies IS NOT NULL THEN 
    CONCAT('Allergies: ', allergies)
  ELSE NULL
END
WHERE (medical_info IS NOT NULL OR allergies IS NOT NULL) AND other_medical_info IS NULL;

SELECT 'Enhanced pet profile schema updated successfully' as status;
