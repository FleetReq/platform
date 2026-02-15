-- Add receipt_urls column to maintenance_records
ALTER TABLE public.maintenance_records
ADD COLUMN receipt_urls text[] NOT NULL DEFAULT '{}';

-- Add receipt_urls column to fill_ups
ALTER TABLE public.fill_ups
ADD COLUMN receipt_urls text[] NOT NULL DEFAULT '{}';

-- Add CHECK constraint to limit max 5 receipts per record
ALTER TABLE public.maintenance_records
ADD CONSTRAINT maintenance_records_receipt_urls_max_5
CHECK (array_length(receipt_urls, 1) IS NULL OR array_length(receipt_urls, 1) <= 5);

ALTER TABLE public.fill_ups
ADD CONSTRAINT fill_ups_receipt_urls_max_5
CHECK (array_length(receipt_urls, 1) IS NULL OR array_length(receipt_urls, 1) <= 5);
