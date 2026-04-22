-- Test Data Seed Script for Phase 1 Tests
-- Run this script against your test database to create necessary test data

-- Ensure test database is selected
\c crm_test

-- Clean up existing test data (optional, use with caution)
-- DELETE FROM users WHERE email = 'test@example.com';
-- DELETE FROM roles WHERE name = 'Test Admin';

-- Insert test role
INSERT INTO roles (name, created_at, updated_at) 
VALUES ('Test Admin', NOW(), NOW()) 
ON CONFLICT (name) DO NOTHING
RETURNING id;

-- Note: You'll need to get the role_id from the above query
-- For this example, we'll assume role_id = 1

-- Insert test user
-- Password hash is for 'test123' using bcrypt (you may need to generate a proper hash)
-- You can generate the hash using: bcrypt.hashSync('test123', 10)
INSERT INTO users (email, password_hash, role_id, is_active, created_at, updated_at) 
VALUES (
  'test@example.com',
  '$2a$10$YourHashedPasswordHere',  -- REPLACE with actual bcrypt hash for 'test123'
  1,  -- Use the role_id from the roles table
  true,
  NOW(),
  NOW()
) 
ON CONFLICT (email) DO UPDATE SET 
  password_hash = EXCLUDED.password_hash,
  updated_at = NOW();

-- Verify the test user was created
SELECT id, email, role_id, is_active FROM users WHERE email = 'test@example.com';

-- IMPORTANT NOTES:
-- 1. Replace '$2a$10$YourHashedPasswordHere' with an actual bcrypt hash
-- 2. Adjust role_id if your roles table has a different structure
-- 3. Make sure your schema matches these field names

-- To generate a proper password hash, you can use this Node.js script:
-- const bcrypt = require('bcryptjs');
-- console.log(bcrypt.hashSync('test123', 10));
