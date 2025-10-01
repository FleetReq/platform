-- Check the actual column structure of the cars table
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'cars'
ORDER BY ordinal_position;
