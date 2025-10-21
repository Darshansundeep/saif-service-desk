-- Add phone number field to tickets table
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS requestor_phone VARCHAR(20);

-- Add comment to document the new field
COMMENT ON COLUMN tickets.requestor_phone IS 'Phone number of the person requesting the ticket';
