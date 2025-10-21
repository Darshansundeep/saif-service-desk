-- SLA Management Schema
-- This adds SLA tracking without modifying existing tables

-- SLA Policies Table
CREATE TABLE IF NOT EXISTS sla_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  priority VARCHAR(50) NOT NULL, -- 'low', 'medium', 'high', 'critical'
  response_time_minutes INTEGER NOT NULL, -- Time to first response
  resolution_time_minutes INTEGER NOT NULL, -- Time to resolve
  escalation_time_minutes INTEGER, -- Time before auto-escalate (optional)
  business_hours_only BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- SLA Tracking Table (one per ticket)
CREATE TABLE IF NOT EXISTS ticket_sla_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  sla_policy_id UUID REFERENCES sla_policies(id),
  
  -- Response SLA
  response_due_at TIMESTAMP,
  first_response_at TIMESTAMP,
  response_sla_met BOOLEAN,
  response_time_minutes INTEGER,
  
  -- Resolution SLA
  resolution_due_at TIMESTAMP,
  resolved_at TIMESTAMP,
  resolution_sla_met BOOLEAN,
  resolution_time_minutes INTEGER,
  
  -- Escalation
  escalation_due_at TIMESTAMP,
  escalated_at TIMESTAMP,
  
  -- Pause/Resume tracking (for business hours)
  paused_at TIMESTAMP,
  total_paused_minutes INTEGER DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(ticket_id)
);

-- SLA Breach History (for audit trail)
CREATE TABLE IF NOT EXISTS sla_breach_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  breach_type VARCHAR(50) NOT NULL, -- 'response', 'resolution', 'escalation'
  breached_at TIMESTAMP NOT NULL,
  due_at TIMESTAMP NOT NULL,
  breach_minutes INTEGER NOT NULL,
  notified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Business Hours Configuration
CREATE TABLE IF NOT EXISTS business_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday, 6=Saturday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_working_day BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(day_of_week)
);

-- Holidays Table
CREATE TABLE IF NOT EXISTS holidays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  date DATE NOT NULL UNIQUE,
  is_recurring BOOLEAN DEFAULT FALSE, -- Recurring annually
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sla_policies_priority ON sla_policies(priority);
CREATE INDEX IF NOT EXISTS idx_sla_policies_active ON sla_policies(is_active);
CREATE INDEX IF NOT EXISTS idx_ticket_sla_tracking_ticket_id ON ticket_sla_tracking(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_sla_tracking_response_due ON ticket_sla_tracking(response_due_at);
CREATE INDEX IF NOT EXISTS idx_ticket_sla_tracking_resolution_due ON ticket_sla_tracking(resolution_due_at);
CREATE INDEX IF NOT EXISTS idx_sla_breach_history_ticket_id ON sla_breach_history(ticket_id);
CREATE INDEX IF NOT EXISTS idx_sla_breach_history_breach_type ON sla_breach_history(breach_type);
CREATE INDEX IF NOT EXISTS idx_business_hours_day ON business_hours(day_of_week);
CREATE INDEX IF NOT EXISTS idx_holidays_date ON holidays(date);

-- Add trigger for updated_at
CREATE TRIGGER update_sla_policies_updated_at
  BEFORE UPDATE ON sla_policies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ticket_sla_tracking_updated_at
  BEFORE UPDATE ON ticket_sla_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default SLA policies
INSERT INTO sla_policies (name, description, priority, response_time_minutes, resolution_time_minutes, escalation_time_minutes, business_hours_only)
VALUES 
  ('Critical Priority SLA', 'For critical priority tickets', 'critical', 15, 240, 120, TRUE),
  ('High Priority SLA', 'For high priority tickets', 'high', 60, 480, 240, TRUE),
  ('Medium Priority SLA', 'For medium priority tickets', 'medium', 240, 1440, 720, TRUE),
  ('Low Priority SLA', 'For low priority tickets', 'low', 480, 2880, NULL, TRUE);

-- Insert default business hours (Monday-Friday, 9 AM - 5 PM)
INSERT INTO business_hours (day_of_week, start_time, end_time, is_working_day)
VALUES 
  (0, '00:00:00', '00:00:00', FALSE), -- Sunday
  (1, '09:00:00', '17:00:00', TRUE),  -- Monday
  (2, '09:00:00', '17:00:00', TRUE),  -- Tuesday
  (3, '09:00:00', '17:00:00', TRUE),  -- Wednesday
  (4, '09:00:00', '17:00:00', TRUE),  -- Thursday
  (5, '09:00:00', '17:00:00', TRUE),  -- Friday
  (6, '00:00:00', '00:00:00', FALSE); -- Saturday

-- Function to calculate SLA due time considering business hours
CREATE OR REPLACE FUNCTION calculate_sla_due_time(
  start_time TIMESTAMP,
  minutes_to_add INTEGER,
  use_business_hours BOOLEAN
) RETURNS TIMESTAMP AS $$
DECLARE
  due_time TIMESTAMP;
BEGIN
  IF NOT use_business_hours THEN
    -- Simple calculation: just add minutes
    due_time := start_time + (minutes_to_add || ' minutes')::INTERVAL;
  ELSE
    -- Complex calculation considering business hours
    -- For now, simplified version (can be enhanced later)
    due_time := start_time + (minutes_to_add || ' minutes')::INTERVAL;
  END IF;
  
  RETURN due_time;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically create SLA tracking when ticket is created
CREATE OR REPLACE FUNCTION create_sla_tracking_for_ticket()
RETURNS TRIGGER AS $$
DECLARE
  policy_record RECORD;
  response_due TIMESTAMP;
  resolution_due TIMESTAMP;
  escalation_due TIMESTAMP;
BEGIN
  -- Find matching SLA policy based on ticket priority
  SELECT * INTO policy_record
  FROM sla_policies
  WHERE priority = NEW.priority::TEXT
    AND is_active = TRUE
  LIMIT 1;
  
  IF FOUND THEN
    -- Calculate due times
    response_due := calculate_sla_due_time(
      NEW.created_at,
      policy_record.response_time_minutes,
      policy_record.business_hours_only
    );
    
    resolution_due := calculate_sla_due_time(
      NEW.created_at,
      policy_record.resolution_time_minutes,
      policy_record.business_hours_only
    );
    
    IF policy_record.escalation_time_minutes IS NOT NULL THEN
      escalation_due := calculate_sla_due_time(
        NEW.created_at,
        policy_record.escalation_time_minutes,
        policy_record.business_hours_only
      );
    END IF;
    
    -- Create SLA tracking record
    INSERT INTO ticket_sla_tracking (
      ticket_id,
      sla_policy_id,
      response_due_at,
      resolution_due_at,
      escalation_due_at
    ) VALUES (
      NEW.id,
      policy_record.id,
      response_due,
      resolution_due,
      escalation_due
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-create SLA tracking for new tickets
CREATE TRIGGER trigger_create_sla_tracking
  AFTER INSERT ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION create_sla_tracking_for_ticket();

-- Function to update SLA tracking when ticket is updated
CREATE OR REPLACE FUNCTION update_sla_tracking_on_ticket_change()
RETURNS TRIGGER AS $$
DECLARE
  tracking_record RECORD;
  current_time TIMESTAMP := NOW();
BEGIN
  -- Get SLA tracking record
  SELECT * INTO tracking_record
  FROM ticket_sla_tracking
  WHERE ticket_id = NEW.id;
  
  IF FOUND THEN
    -- Check if first response happened (first comment by agent)
    IF tracking_record.first_response_at IS NULL THEN
      -- This will be updated by comment trigger
      NULL;
    END IF;
    
    -- Check if ticket is resolved
    IF NEW.status IN ('resolved', 'closed') AND tracking_record.resolved_at IS NULL THEN
      UPDATE ticket_sla_tracking
      SET 
        resolved_at = current_time,
        resolution_time_minutes = EXTRACT(EPOCH FROM (current_time - NEW.created_at)) / 60,
        resolution_sla_met = (current_time <= resolution_due_at)
      WHERE ticket_id = NEW.id;
      
      -- Log breach if SLA not met
      IF current_time > tracking_record.resolution_due_at THEN
        INSERT INTO sla_breach_history (ticket_id, breach_type, breached_at, due_at, breach_minutes)
        VALUES (
          NEW.id,
          'resolution',
          current_time,
          tracking_record.resolution_due_at,
          EXTRACT(EPOCH FROM (current_time - tracking_record.resolution_due_at)) / 60
        );
      END IF;
    END IF;
    
    -- Check if ticket is escalated
    IF NEW.status = 'escalated' AND tracking_record.escalated_at IS NULL THEN
      UPDATE ticket_sla_tracking
      SET escalated_at = current_time
      WHERE ticket_id = NEW.id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update SLA tracking on ticket changes
CREATE TRIGGER trigger_update_sla_tracking
  AFTER UPDATE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_sla_tracking_on_ticket_change();

-- Function to track first response time
CREATE OR REPLACE FUNCTION track_first_response()
RETURNS TRIGGER AS $$
DECLARE
  tracking_record RECORD;
  ticket_record RECORD;
  commenter_role TEXT;
  current_time TIMESTAMP := NOW();
BEGIN
  -- Get commenter's role
  SELECT role INTO commenter_role
  FROM users
  WHERE id = NEW.user_id;
  
  -- Only count if commenter is agent or admin
  IF commenter_role IN ('agent', 'admin') THEN
    -- Get ticket info
    SELECT * INTO ticket_record
    FROM tickets
    WHERE id = NEW.ticket_id;
    
    -- Get SLA tracking
    SELECT * INTO tracking_record
    FROM ticket_sla_tracking
    WHERE ticket_id = NEW.ticket_id;
    
    -- Update if this is the first response
    IF FOUND AND tracking_record.first_response_at IS NULL THEN
      UPDATE ticket_sla_tracking
      SET 
        first_response_at = current_time,
        response_time_minutes = EXTRACT(EPOCH FROM (current_time - ticket_record.created_at)) / 60,
        response_sla_met = (current_time <= response_due_at)
      WHERE ticket_id = NEW.ticket_id;
      
      -- Log breach if SLA not met
      IF current_time > tracking_record.response_due_at THEN
        INSERT INTO sla_breach_history (ticket_id, breach_type, breached_at, due_at, breach_minutes)
        VALUES (
          NEW.ticket_id,
          'response',
          current_time,
          tracking_record.response_due_at,
          EXTRACT(EPOCH FROM (current_time - tracking_record.response_due_at)) / 60
        );
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to track first response on comments
CREATE TRIGGER trigger_track_first_response
  AFTER INSERT ON comments
  FOR EACH ROW
  EXECUTE FUNCTION track_first_response();

-- Add comments
COMMENT ON TABLE sla_policies IS 'SLA policy definitions based on ticket priority';
COMMENT ON TABLE ticket_sla_tracking IS 'Tracks SLA compliance for each ticket';
COMMENT ON TABLE sla_breach_history IS 'Audit trail of SLA breaches';
COMMENT ON TABLE business_hours IS 'Business hours configuration for SLA calculations';
COMMENT ON TABLE holidays IS 'Holiday calendar for SLA calculations';
