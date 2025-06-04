-- Migration: Add description column to Rooms table
-- Date: $(date)

ALTER TABLE "Rooms" 
ADD COLUMN description TEXT; 