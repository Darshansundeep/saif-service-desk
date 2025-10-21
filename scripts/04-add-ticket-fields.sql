-- Add new fields to tickets table
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS requestor_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS issue_type VARCHAR(100),
ADD COLUMN IF NOT EXISTS users_affected INTEGER DEFAULT 1;

-- Create index for requestor_email for faster lookups
CREATE INDEX IF NOT EXISTS idx_tickets_requestor_email ON tickets(requestor_email);

-- Add comment to document the new fields
COMMENT ON COLUMN tickets.requestor_email IS 'Email of the person requesting the ticket';
COMMENT ON COLUMN tickets.issue_type IS 'Type of issue (e.g., Bug, Feature Request, Support)';
COMMENT ON COLUMN tickets.users_affected IS 'Number of users affected by this issue';
