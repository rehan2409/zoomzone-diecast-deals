-- Add stock column to products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock integer DEFAULT 1;