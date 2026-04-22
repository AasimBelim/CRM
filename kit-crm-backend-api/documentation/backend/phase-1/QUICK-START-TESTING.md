# Quick Start - Phase 1 Testing

## Prerequisites
- PostgreSQL running locally
- Node.js installed
- Backend dependencies installed (`npm install`)

## 5-Minute Setup Guide

### 1. Create Test Database
```bash
createdb crm_test
```

### 2. Create Test Environment File
Create `.env.test` in backend-api root:
```bash
NODE_ENV=test
DATABASE_URL=postgresql://your_username:your_password@localhost:5432/crm_test
JWT_SECRET=your_test_jwt_secret
PORT=8000
```

### 3. Run Database Migrations
```bash
# Set environment to test
export NODE_ENV=test

# Run migrations
npx drizzle-kit migrate --config=./db/drizzle/drizzle.config.ts
```

### 4. Create Test User

**Option A: Quick SQL Command**
```bash
psql crm_test
```

```sql
-- Insert test role
INSERT INTO roles (name, created_at, updated_at) 
VALUES ('Admin', NOW(), NOW());

-- Insert test user (you need to generate bcrypt hash for password 'test123')
-- Using bcrypt online tool or: node -e "console.log(require('bcryptjs').hashSync('test123', 10))"
INSERT INTO users (email, password_hash, role_id, is_active, created_at, updated_at)
VALUES (
  'test@example.com',
  -- Replace with actual bcrypt hash of 'test123'
  '$2a$10$N9qo8uLOickgx2ZMRZoMye5IxVPhFhqy1/wbL5Q5xNKLYqCNqrKim',  
  1,
  true,
  NOW(),
  NOW()
);
```

**Option B: Use Node.js to Generate Hash**
```javascript
// create-test-user.js
import bcrypt from 'bcryptjs';
const hash = bcrypt.hashSync('test123', 10);
console.log(hash);
```

### 5. Run Tests
```bash
npm test
```

### Expected Output
```
PASS  __tests__/api/companies.test.ts
PASS  __tests__/api/contacts.test.ts
PASS  __tests__/api/dataSources.test.ts
PASS  __tests__/api/leadConfig.test.ts
PASS  __tests__/api/leads.test.ts

Test Suites: 5 passed, 5 total
Tests:       100+ passed, 100+ total
Snapshots:   0 total
Time:        10-15 s
```

## Common Issues

### "Test user not found"
**Solution**: Ensure test user exists in database with email `test@example.com` and password `test123`

### "Cannot connect to database"
**Solution**: Check `.env.test` DATABASE_URL is correct and PostgreSQL is running

### "Port 8000 already in use"
**Solution**: Stop the development server before running tests

## Test Commands

```bash
# Run all tests
npm test

# Watch mode (auto-rerun on changes)
npm run test:watch

# Generate coverage report
npm run test:coverage

# Run specific test file
npm test -- __tests__/api/companies.test.ts
```

## Verify Setup

After running tests, you should see:
- ✅ All test suites pass
- ✅ 100+ individual tests pass
- ✅ No authentication errors
- ✅ Execution time ~10-15 seconds

## Next Steps

1. ✅ All tests passing → Ready for Phase 2
2. ❌ Tests failing → Check troubleshooting section in [test-setup-guide.md](./test-setup-guide.md)

## Documentation

For detailed information, see:
- [Complete Test Setup Guide](./test-setup-guide.md)
- [Test Results](./test-results.md)
- [Phase 1 Complete Summary](./PHASE-1-COMPLETE.md)
