-- Insert sample users (password is 'password123' hashed with bcrypt)
INSERT INTO users (email, password_hash, full_name, role) VALUES
  ('admin@example.com', '$2a$10$rKvVLZ8L8Z8L8Z8L8Z8L8eK8L8Z8L8Z8L8Z8L8Z8L8Z8L8Z8L8Z8L', 'Admin User', 'admin'),
  ('agent1@example.com', '$2a$10$rKvVLZ8L8Z8L8Z8L8Z8L8eK8L8Z8L8Z8L8Z8L8Z8L8Z8L8Z8L8Z8L', 'Agent One', 'agent'),
  ('agent2@example.com', '$2a$10$rKvVLZ8L8Z8L8Z8L8Z8L8eK8L8Z8L8Z8L8Z8L8Z8L8Z8L8Z8L8Z8L', 'Agent Two', 'agent'),
  ('customer@example.com', '$2a$10$rKvVLZ8L8Z8L8Z8L8Z8L8eK8L8Z8L8Z8L8Z8L8Z8L8Z8L8Z8L8Z8L', 'Customer User', 'customer');

-- Note: In production, you should hash passwords properly using bcrypt
-- The above hash is just a placeholder for demonstration
