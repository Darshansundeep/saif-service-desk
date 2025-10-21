-- Add agent tier/level to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS agent_tier VARCHAR(10);

-- Add comment to document the field
COMMENT ON COLUMN users.agent_tier IS 'Agent support tier: L1 (Level 1), L2 (Level 2), or NULL for non-agents';

-- Update existing agents to L1 by default
UPDATE users 
SET agent_tier = 'L1' 
WHERE role = 'agent' AND agent_tier IS NULL;

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_users_agent_tier ON users(agent_tier) WHERE agent_tier IS NOT NULL;
