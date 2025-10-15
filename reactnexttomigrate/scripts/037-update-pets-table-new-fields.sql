-- Add new fields to pets table for enhanced pet profile
ALTER TABLE pets
ADD COLUMN IF NOT EXISTS rabies_vaccination TEXT,
ADD COLUMN IF NOT EXISTS flea_tick_prevention VARCHAR(20) DEFAULT 'not_sure',
ADD COLUMN IF NOT EXISTS walking_behavior VARCHAR(50),
ADD COLUMN IF NOT EXISTS chip_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS chip_brand VARCHAR(100);

-- Add check constraint for flea_tick_prevention
ALTER TABLE pets
DROP CONSTRAINT IF EXISTS pets_flea_tick_prevention_check;

ALTER TABLE pets
ADD CONSTRAINT pets_flea_tick_prevention_check
CHECK (flea_tick_prevention IN ('yes', 'no', 'not_sure'));

-- Add check constraint for walking_behavior
ALTER TABLE pets
DROP CONSTRAINT IF EXISTS pets_walking_behavior_check;

ALTER TABLE pets
ADD CONSTRAINT pets_walking_behavior_check
CHECK (walking_behavior IN ('pulls_hard', 'moderate', 'loose_leash', NULL));
