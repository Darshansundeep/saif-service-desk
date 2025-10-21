-- Create settings table to store system configuration
CREATE TABLE IF NOT EXISTS system_settings (
  id SERIAL PRIMARY KEY,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT,
  setting_type VARCHAR(50) DEFAULT 'string',
  description TEXT,
  updated_at TIMESTAMP DEFAULT NOW(),
  updated_by UUID REFERENCES users(id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_settings_key ON system_settings(setting_key);

-- Insert default SMTP settings
INSERT INTO system_settings (setting_key, setting_value, setting_type, description) VALUES
  ('smtp_enabled', 'false', 'boolean', 'Enable/disable email notifications'),
  ('smtp_host', '', 'string', 'SMTP server hostname'),
  ('smtp_port', '587', 'number', 'SMTP server port'),
  ('smtp_user', '', 'string', 'SMTP username/email'),
  ('smtp_password', '', 'password', 'SMTP password'),
  ('smtp_from_email', '', 'string', 'From email address'),
  ('smtp_from_name', 'Service Desk', 'string', 'From name'),
  ('notify_new_ticket', 'true', 'boolean', 'Send notification on new ticket'),
  ('notify_status_change', 'true', 'boolean', 'Send notification on status change'),
  ('notify_assignment', 'true', 'boolean', 'Send notification on ticket assignment'),
  ('notification_retention_days', '30', 'number', 'Days to retain notifications'),
  ('max_file_size_mb', '10', 'number', 'Maximum file upload size in MB'),
  ('allowed_extensions', '.pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.zip', 'string', 'Allowed file extensions')
ON CONFLICT (setting_key) DO NOTHING;

COMMENT ON TABLE system_settings IS 'System-wide configuration settings';
